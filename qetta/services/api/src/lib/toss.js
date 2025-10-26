/**
 * Toss Certification OAuth & API utilities
 * Based on: https://oauth2.cert.toss.im & https://cert.toss.im
 */

const config = require('../config');

/**
 * Get Toss OAuth Access Token using client_credentials flow
 * @returns {Promise<{access_token: string, token_type: string, expires_in: number}>}
 */
async function getTossAccessToken() {
  const { oauthBase, clientId, clientSecret, scope } = config.toss;
  
  const params = new URLSearchParams({
    grant_type: 'client_credentials',
    scope: scope,
    client_id: clientId,
    client_secret: clientSecret
  });

  const response = await fetch(`${oauthBase}/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: params.toString()
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Toss OAuth failed: ${response.status} ${error}`);
  }

  return await response.json();
}

/**
 * Make authenticated API call to Toss Certification API
 * @param {string} endpoint - API endpoint path (e.g., '/v1/identity/verify')
 * @param {object} options - Fetch options
 * @param {string} accessToken - OAuth access token (optional, will fetch if not provided)
 * @returns {Promise<any>}
 */
async function tossApiCall(endpoint, options = {}, accessToken = null) {
  const { apiBase } = config.toss;
  
  // Get access token if not provided
  if (!accessToken) {
    const tokenData = await getTossAccessToken();
    accessToken = tokenData.access_token;
  }

  const response = await fetch(`${apiBase}${endpoint}`, {
    ...options,
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      ...options.headers
    }
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Toss API call failed: ${response.status} ${error}`);
  }

  return await response.json();
}

/**
 * Refresh Toss access token (stored in database)
 * @param {string} userId - User ID
 * @param {object} prisma - Prisma client instance
 * @returns {Promise<{accessToken: string, expiresAt: Date}>}
 */
async function refreshTossToken(userId, prisma) {
  const tokenData = await getTossAccessToken();
  const expiresAt = new Date(Date.now() + tokenData.expires_in * 1000);

  await prisma.externalAuth.upsert({
    where: {
      userId_provider: {
        userId: userId,
        provider: 'TOSS_CERT'
      }
    },
    create: {
      userId: userId,
      provider: 'TOSS_CERT',
      accessToken: tokenData.access_token,
      tokenExpiresAt: expiresAt,
      scope: config.toss.scope
    },
    update: {
      accessToken: tokenData.access_token,
      tokenExpiresAt: expiresAt,
      updatedAt: new Date()
    }
  });

  return {
    accessToken: tokenData.access_token,
    expiresAt: expiresAt
  };
}

module.exports = {
  getTossAccessToken,
  tossApiCall,
  refreshTossToken
};
