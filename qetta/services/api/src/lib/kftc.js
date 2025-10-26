/**
 * KFTC OpenBanking OAuth & API utilities
 * Based on: https://testapi.openbanking.or.kr
 */

const config = require('../config');

/**
 * Generate OpenBanking OAuth authorization URL
 * @param {string} state - Random state for CSRF protection
 * @returns {string} Authorization URL
 */
function getAuthorizationUrl(state) {
  const { apiBase, clientId, redirectUri, scope } = config.kftc;
  
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: scope,
    state: state,
    auth_type: '0' // 0: consent, 1: account registration
  });

  return `${apiBase}/oauth/2.0/authorize?${params.toString()}`;
}

/**
 * Exchange authorization code for access token
 * @param {string} code - Authorization code from callback
 * @returns {Promise<{access_token: string, token_type: string, refresh_token: string, expires_in: number, scope: string, user_seq_no: string}>}
 */
async function exchangeCodeForToken(code) {
  const { apiBase, clientId, clientSecret, redirectUri } = config.kftc;
  
  const params = new URLSearchParams({
    grant_type: 'authorization_code',
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: redirectUri,
    code: code
  });

  const response = await fetch(`${apiBase}/oauth/2.0/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: params.toString()
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`KFTC OAuth token exchange failed: ${response.status} ${error}`);
  }

  return await response.json();
}

/**
 * Refresh access token using refresh token
 * @param {string} refreshToken - Refresh token
 * @returns {Promise<{access_token: string, token_type: string, expires_in: number, refresh_token: string, scope: string}>}
 */
async function refreshAccessToken(refreshToken) {
  const { apiBase, clientId, clientSecret } = config.kftc;
  
  const params = new URLSearchParams({
    grant_type: 'refresh_token',
    client_id: clientId,
    client_secret: clientSecret,
    refresh_token: refreshToken
  });

  const response = await fetch(`${apiBase}/oauth/2.0/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: params.toString()
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`KFTC token refresh failed: ${response.status} ${error}`);
  }

  return await response.json();
}

/**
 * Get account balance
 * @param {string} accessToken - OAuth access token
 * @param {string} fintechUseNum - 24-digit fintech use number
 * @param {string} bankTranId - Transaction identifier (max 20 chars, alphanumeric)
 * @returns {Promise<any>}
 */
async function getAccountBalance(accessToken, fintechUseNum, bankTranId) {
  const { apiBase } = config.kftc;
  
  const tranDtime = new Date().toISOString().replace(/[-:TZ.]/g, '').slice(0, 14);
  
  const params = new URLSearchParams({
    fintech_use_num: fintechUseNum,
    bank_tran_id: bankTranId,
    tran_dtime: tranDtime
  });

  // Note: Use openapi.openbanking.or.kr for production
  const apiHost = apiBase.replace('testapi', 'openapi');
  const response = await fetch(`${apiHost}/v2.0/account/balance/fin_num?${params.toString()}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${accessToken}`
    }
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`KFTC balance API failed: ${response.status} ${error}`);
  }

  return await response.json();
}

/**
 * Get transaction list
 * @param {string} accessToken - OAuth access token
 * @param {string} fintechUseNum - 24-digit fintech use number
 * @param {string} bankTranId - Transaction identifier
 * @param {string} fromDate - Start date (YYYYMMDD)
 * @param {string} toDate - End date (YYYYMMDD)
 * @returns {Promise<any>}
 */
async function getTransactionList(accessToken, fintechUseNum, bankTranId, fromDate, toDate) {
  const { apiBase } = config.kftc;
  
  const tranDtime = new Date().toISOString().replace(/[-:TZ.]/g, '').slice(0, 14);
  
  const params = new URLSearchParams({
    fintech_use_num: fintechUseNum,
    bank_tran_id: bankTranId,
    tran_dtime: tranDtime,
    from_date: fromDate,
    to_date: toDate,
    sort_order: 'D' // D: descending, A: ascending
  });

  const apiHost = apiBase.replace('testapi', 'openapi');
  const response = await fetch(`${apiHost}/v2.0/account/transaction_list/fin_num?${params.toString()}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${accessToken}`
    }
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`KFTC transaction list API failed: ${response.status} ${error}`);
  }

  return await response.json();
}

/**
 * Store or update KFTC OAuth tokens in database
 * @param {string} userId - User ID
 * @param {object} tokenData - Token data from OAuth response
 * @param {object} prisma - Prisma client instance
 * @returns {Promise<void>}
 */
async function storeKftcTokens(userId, tokenData, prisma) {
  const expiresAt = new Date(Date.now() + tokenData.expires_in * 1000);

  await prisma.externalAuth.upsert({
    where: {
      userId_provider: {
        userId: userId,
        provider: 'KFTC_OPENBANKING'
      }
    },
    create: {
      userId: userId,
      provider: 'KFTC_OPENBANKING',
      providerUserId: tokenData.user_seq_no,
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token,
      tokenExpiresAt: expiresAt,
      scope: tokenData.scope,
      metadata: {
        user_seq_no: tokenData.user_seq_no
      }
    },
    update: {
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token,
      tokenExpiresAt: expiresAt,
      scope: tokenData.scope,
      updatedAt: new Date(),
      metadata: {
        user_seq_no: tokenData.user_seq_no
      }
    }
  });
}

module.exports = {
  getAuthorizationUrl,
  exchangeCodeForToken,
  refreshAccessToken,
  getAccountBalance,
  getTransactionList,
  storeKftcTokens
};
