/**
 * OAuth routes for external authentication providers
 * Supports: Toss Certification, KFTC OpenBanking
 */

const { prisma } = require('../prisma');
const { z } = require('zod');
const toss = require('../lib/toss');
const kftc = require('../lib/kftc');
const crypto = require('crypto');

module.exports = async function(app) {
  
  // ============ TOSS CERTIFICATION OAUTH ============
  
  /**
   * GET /oauth/toss/token
   * Get or refresh Toss access token for authenticated user
   */
  app.get('/oauth/toss/token', {
    preHandler: app.authenticate
  }, async (req, reply) => {
    try {
      const userId = req.user.id;
      
      // Check if we have a valid token in DB
      const existingAuth = await prisma.externalAuth.findUnique({
        where: {
          userId_provider: {
            userId: userId,
            provider: 'TOSS_CERT'
          }
        }
      });

      // If token exists and not expired, return it
      if (existingAuth && existingAuth.tokenExpiresAt && existingAuth.tokenExpiresAt > new Date()) {
        return {
          provider: 'TOSS_CERT',
          accessToken: existingAuth.accessToken,
          expiresAt: existingAuth.tokenExpiresAt
        };
      }

      // Otherwise, refresh the token
      const tokenData = await toss.refreshTossToken(userId, prisma);
      
      return {
        provider: 'TOSS_CERT',
        accessToken: tokenData.accessToken,
        expiresAt: tokenData.expiresAt
      };
    } catch (error) {
      req.log.error(error);
      return reply.code(500).send({ error: 'TOSS_TOKEN_ERROR', message: error.message });
    }
  });

  /**
   * POST /oauth/toss/test
   * Test Toss OAuth connection (get token and verify)
   */
  app.post('/oauth/toss/test', {
    preHandler: app.authenticate
  }, async (req, reply) => {
    try {
      const tokenData = await toss.getTossAccessToken();
      
      return {
        success: true,
        provider: 'TOSS_CERT',
        tokenType: tokenData.token_type,
        expiresIn: tokenData.expires_in,
        hasAccessToken: !!tokenData.access_token
      };
    } catch (error) {
      req.log.error(error);
      return reply.code(500).send({ 
        success: false,
        error: 'TOSS_TEST_FAILED', 
        message: error.message 
      });
    }
  });

  // ============ KFTC OPENBANKING OAUTH ============

  /**
   * GET /oauth/kftc/authorize
   * Initiate KFTC OpenBanking OAuth flow
   */
  app.get('/oauth/kftc/authorize', {
    preHandler: app.authenticate
  }, async (req, reply) => {
    try {
      // Generate state for CSRF protection
      const state = crypto.randomBytes(16).toString('hex');
      
      // Store state in Redis with user ID (expires in 10 minutes)
      const redis = app.redis;
      await redis.setex(`oauth:kftc:state:${state}`, 600, req.user.id);
      
      const authUrl = kftc.getAuthorizationUrl(state);
      
      return {
        authorizationUrl: authUrl,
        state: state
      };
    } catch (error) {
      req.log.error(error);
      return reply.code(500).send({ error: 'KFTC_AUTH_ERROR', message: error.message });
    }
  });

  /**
   * GET /oauth/kftc/callback
   * Handle KFTC OpenBanking OAuth callback
   * Query params: code, state, scope
   */
  app.get('/oauth/kftc/callback', async (req, reply) => {
    try {
      const schema = z.object({
        code: z.string(),
        state: z.string(),
        scope: z.string().optional()
      });

      const parsed = schema.safeParse(req.query);
      if (!parsed.success) {
        return reply.code(400).send({ 
          error: 'BAD_REQUEST', 
          details: parsed.error.flatten() 
        });
      }

      const { code, state, scope } = parsed.data;

      // Verify state and get user ID from Redis
      const redis = app.redis;
      const userId = await redis.get(`oauth:kftc:state:${state}`);
      
      if (!userId) {
        return reply.code(400).send({ 
          error: 'INVALID_STATE', 
          message: 'State verification failed or expired' 
        });
      }

      // Delete used state
      await redis.del(`oauth:kftc:state:${state}`);

      // Exchange code for tokens
      const tokenData = await kftc.exchangeCodeForToken(code);

      // Store tokens in database
      await kftc.storeKftcTokens(userId, tokenData, prisma);

      // Return success page or redirect
      return reply.type('text/html').send(`
        <!DOCTYPE html>
        <html lang="ko">
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <title>OpenBanking 연동 완료</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Noto Sans KR', sans-serif;
              display: flex;
              align-items: center;
              justify-content: center;
              min-height: 100vh;
              margin: 0;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            }
            .card {
              background: white;
              padding: 40px;
              border-radius: 16px;
              box-shadow: 0 10px 40px rgba(0,0,0,0.2);
              text-align: center;
              max-width: 400px;
            }
            h1 { color: #667eea; margin: 0 0 10px; }
            p { color: #666; line-height: 1.6; }
            .success { color: #10b981; font-size: 48px; margin-bottom: 20px; }
            .btn {
              display: inline-block;
              margin-top: 20px;
              padding: 12px 24px;
              background: #667eea;
              color: white;
              text-decoration: none;
              border-radius: 8px;
              font-weight: 600;
            }
            .btn:hover { background: #5568d3; }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="success">✅</div>
            <h1>OpenBanking 연동 완료</h1>
            <p>금융결제원 오픈뱅킹 계정이 성공적으로 연동되었습니다.</p>
            <p><small>User Seq: ${tokenData.user_seq_no}</small></p>
            <a href="${app.config.webUrl}" class="btn">대시보드로 이동</a>
          </div>
          <script>
            // Auto-close window if opened as popup
            if (window.opener) {
              window.opener.postMessage({ type: 'KFTC_AUTH_SUCCESS', provider: 'KFTC_OPENBANKING' }, '*');
              setTimeout(() => window.close(), 3000);
            }
          </script>
        </body>
        </html>
      `);
    } catch (error) {
      req.log.error(error);
      return reply.type('text/html').send(`
        <!DOCTYPE html>
        <html lang="ko">
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <title>연동 실패</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Noto Sans KR', sans-serif;
              display: flex;
              align-items: center;
              justify-content: center;
              min-height: 100vh;
              margin: 0;
              background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
            }
            .card {
              background: white;
              padding: 40px;
              border-radius: 16px;
              box-shadow: 0 10px 40px rgba(0,0,0,0.2);
              text-align: center;
              max-width: 400px;
            }
            h1 { color: #ef4444; margin: 0 0 10px; }
            p { color: #666; line-height: 1.6; }
            .error { color: #ef4444; font-size: 48px; margin-bottom: 20px; }
            .details { 
              background: #fef2f2; 
              padding: 12px; 
              border-radius: 8px; 
              font-size: 12px;
              color: #991b1b;
              margin-top: 16px;
              word-break: break-word;
            }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="error">❌</div>
            <h1>연동 실패</h1>
            <p>OpenBanking 연동 중 오류가 발생했습니다.</p>
            <div class="details">${error.message}</div>
          </div>
        </body>
        </html>
      `);
    }
  });

  /**
   * GET /oauth/kftc/token
   * Get current KFTC token for authenticated user
   */
  app.get('/oauth/kftc/token', {
    preHandler: app.authenticate
  }, async (req, reply) => {
    try {
      const userId = req.user.id;
      
      const auth = await prisma.externalAuth.findUnique({
        where: {
          userId_provider: {
            userId: userId,
            provider: 'KFTC_OPENBANKING'
          }
        }
      });

      if (!auth) {
        return reply.code(404).send({ 
          error: 'NOT_CONNECTED', 
          message: 'KFTC OpenBanking not connected for this user' 
        });
      }

      // Check if token is expired
      if (auth.tokenExpiresAt && auth.tokenExpiresAt < new Date()) {
        // Try to refresh
        try {
          const newTokenData = await kftc.refreshAccessToken(auth.refreshToken);
          await kftc.storeKftcTokens(userId, newTokenData, prisma);
          
          return {
            provider: 'KFTC_OPENBANKING',
            accessToken: newTokenData.access_token,
            expiresAt: new Date(Date.now() + newTokenData.expires_in * 1000),
            userSeqNo: auth.metadata?.user_seq_no
          };
        } catch (refreshError) {
          req.log.error(refreshError);
          return reply.code(401).send({ 
            error: 'TOKEN_REFRESH_FAILED', 
            message: 'Token expired and refresh failed. Please reconnect.' 
          });
        }
      }

      return {
        provider: 'KFTC_OPENBANKING',
        accessToken: auth.accessToken,
        expiresAt: auth.tokenExpiresAt,
        userSeqNo: auth.metadata?.user_seq_no
      };
    } catch (error) {
      req.log.error(error);
      return reply.code(500).send({ error: 'KFTC_TOKEN_ERROR', message: error.message });
    }
  });

  /**
   * GET /oauth/kftc/balance/:fintechUseNum
   * Get account balance using OpenBanking API
   */
  app.get('/oauth/kftc/balance/:fintechUseNum', {
    preHandler: app.authenticate
  }, async (req, reply) => {
    try {
      const { fintechUseNum } = req.params;
      const userId = req.user.id;

      // Get access token
      const auth = await prisma.externalAuth.findUnique({
        where: {
          userId_provider: {
            userId: userId,
            provider: 'KFTC_OPENBANKING'
          }
        }
      });

      if (!auth || !auth.accessToken) {
        return reply.code(404).send({ 
          error: 'NOT_CONNECTED', 
          message: 'KFTC OpenBanking not connected' 
        });
      }

      // Generate unique transaction ID
      const bankTranId = `QETTA${Date.now().toString().slice(-14)}`;

      const balanceData = await kftc.getAccountBalance(
        auth.accessToken,
        fintechUseNum,
        bankTranId
      );

      return balanceData;
    } catch (error) {
      req.log.error(error);
      return reply.code(500).send({ error: 'BALANCE_API_ERROR', message: error.message });
    }
  });

  /**
   * POST /oauth/kftc/transactions
   * Get transaction list using OpenBanking API
   */
  app.post('/oauth/kftc/transactions', {
    preHandler: app.authenticate
  }, async (req, reply) => {
    try {
      const schema = z.object({
        fintechUseNum: z.string().length(24),
        fromDate: z.string().regex(/^\d{8}$/),
        toDate: z.string().regex(/^\d{8}$/)
      });

      const parsed = schema.safeParse(req.body);
      if (!parsed.success) {
        return reply.code(400).send({ 
          error: 'BAD_REQUEST', 
          details: parsed.error.flatten() 
        });
      }

      const { fintechUseNum, fromDate, toDate } = parsed.data;
      const userId = req.user.id;

      // Get access token
      const auth = await prisma.externalAuth.findUnique({
        where: {
          userId_provider: {
            userId: userId,
            provider: 'KFTC_OPENBANKING'
          }
        }
      });

      if (!auth || !auth.accessToken) {
        return reply.code(404).send({ 
          error: 'NOT_CONNECTED', 
          message: 'KFTC OpenBanking not connected' 
        });
      }

      // Generate unique transaction ID
      const bankTranId = `QETTA${Date.now().toString().slice(-14)}`;

      const transactionData = await kftc.getTransactionList(
        auth.accessToken,
        fintechUseNum,
        bankTranId,
        fromDate,
        toDate
      );

      return transactionData;
    } catch (error) {
      req.log.error(error);
      return reply.code(500).send({ error: 'TRANSACTION_API_ERROR', message: error.message });
    }
  });

  /**
   * DELETE /oauth/:provider/disconnect
   * Disconnect an external auth provider
   */
  app.delete('/oauth/:provider/disconnect', {
    preHandler: app.authenticate
  }, async (req, reply) => {
    try {
      const { provider } = req.params;
      const userId = req.user.id;

      const providerMap = {
        'toss': 'TOSS_CERT',
        'kftc': 'KFTC_OPENBANKING'
      };

      const enumProvider = providerMap[provider];
      if (!enumProvider) {
        return reply.code(400).send({ 
          error: 'INVALID_PROVIDER', 
          message: 'Provider must be one of: toss, kftc' 
        });
      }

      await prisma.externalAuth.deleteMany({
        where: {
          userId: userId,
          provider: enumProvider
        }
      });

      return { success: true, provider: enumProvider };
    } catch (error) {
      req.log.error(error);
      return reply.code(500).send({ error: 'DISCONNECT_ERROR', message: error.message });
    }
  });

  /**
   * GET /oauth/status
   * Get all connected external auth providers for authenticated user
   */
  app.get('/oauth/status', {
    preHandler: app.authenticate
  }, async (req, reply) => {
    try {
      const userId = req.user.id;

      const auths = await prisma.externalAuth.findMany({
        where: { userId: userId },
        select: {
          provider: true,
          providerUserId: true,
          tokenExpiresAt: true,
          scope: true,
          createdAt: true,
          updatedAt: true
        }
      });

      return {
        connected: auths.map(auth => ({
          provider: auth.provider,
          providerUserId: auth.providerUserId,
          tokenExpiresAt: auth.tokenExpiresAt,
          scope: auth.scope,
          connectedAt: auth.createdAt,
          lastUpdated: auth.updatedAt
        }))
      };
    } catch (error) {
      req.log.error(error);
      return reply.code(500).send({ error: 'STATUS_ERROR', message: error.message });
    }
  });
};
