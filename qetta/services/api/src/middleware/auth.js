const fp=require('fastify-plugin'); const { verifyJwt, userFromApiKey } = require('../util'); const { redis } = require('../redis'); const { prisma } = require('../prisma');
module.exports = fp(async function(app){
  // Decorate app with redis and config
  app.decorate('redis', redis);
  app.decorate('config', require('../config'));
  
  app.decorateRequest('userId', null);
  app.decorateRequest('user', null);
  
  app.addHook('preHandler', async (req)=> {
    const apiKey=req.headers['x-api-key']; if(apiKey){ const id=await userFromApiKey(apiKey); if(id){ req.userId=id; return; } }
    const auth=req.headers.authorization; if(auth&&auth.startsWith('Bearer ')){ try{ const d=verifyJwt(auth.slice(7)); req.userId=d.sub; }catch{} }
  });
  
  // Decorator for routes that require authentication
  app.decorate('authenticate', async function(req, reply) {
    if (!req.userId) {
      return reply.code(401).send({ error: 'UNAUTHORIZED', message: 'Authentication required' });
    }
    // Load user object for convenience
    const user = await prisma.user.findUnique({ 
      where: { id: req.userId },
      select: { id: true, email: true, createdAt: true }
    });
    if (!user) {
      return reply.code(401).send({ error: 'USER_NOT_FOUND' });
    }
    req.user = user;
  });
});
