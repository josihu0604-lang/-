const required = (k, fb) => process.env[k] ?? fb;
module.exports = {
  port: Number(required('PORT', 8080)),
  jwtSecret: required('JWT_SECRET', 'dev_jwt_secret_change_me'),
  corsOrigins: (process.env.CORS_ORIGINS||'*').split(',').map(s=>s.trim()),
  databaseUrl: process.env.DATABASE_URL,
  redisUrl: process.env.REDIS_URL,
  stripeSecret: process.env.STRIPE_SECRET_KEY,
  stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
  prices: {
    STARTER: process.env.STRIPE_PRICE_STARTER,
    PRO: process.env.STRIPE_PRICE_PRO,
    ENTERPRISE: process.env.STRIPE_PRICE_ENTERPRISE
  },
  webUrl: process.env.WEB_URL || 'http://localhost:3000',
  apiUrl: process.env.API_URL || 'http://localhost:8080',
  // Toss Certification OAuth
  toss: {
    oauthBase: process.env.TOSS_OAUTH_BASE || 'https://oauth2.cert.toss.im',
    apiBase: process.env.TOSS_API_BASE || 'https://cert.toss.im',
    clientId: process.env.TOSS_CLIENT_ID || 'test_a8e23336d673ca70922b485fe806eb2d',
    clientSecret: process.env.TOSS_CLIENT_SECRET || 'test_418087247d66da09fda1964dc4734e453c7cf66a7a9e3',
    scope: process.env.TOSS_SCOPE || 'ca'
  },
  // KFTC OpenBanking OAuth
  kftc: {
    apiBase: process.env.KFTC_API_BASE || 'https://testapi.openbanking.or.kr',
    clientId: process.env.KFTC_CLIENT_ID || 'd45b5d59-e571-436a-9675-aa5048e09489',
    clientSecret: process.env.KFTC_CLIENT_SECRET || '8dc9537a-395b-46a5-90db-8d362a7fde6f',
    redirectUri: process.env.KFTC_REDIRECT_URI || 'http://localhost:3000/oauth/kftc/callback',
    scope: process.env.KFTC_SCOPE || 'login inquiry'
  }
};
