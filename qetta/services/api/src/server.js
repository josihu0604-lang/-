const Fastify=require('fastify'); const cors=require('@fastify/cors'); const helmet=require('@fastify/helmet'); const multipart=require('@fastify/multipart'); const pino=require('pino');
const { port, corsOrigins } = require('./config'); const rateLimit=require('./middleware/rateLimit'); const auth=require('./middleware/auth');
const { prisma } = require('./prisma');
const { worker: accountSyncWorker } = require('./workers/sync-accounts');
const app=Fastify({ logger: pino({ level: process.env.LOG_LEVEL || 'info' }) });

// Add Prisma client to Fastify instance
app.decorate('prisma', prisma);

app.register(cors,{ origin:(origin,cb)=>{ if(!origin||corsOrigins.includes('*')||corsOrigins.includes(origin)) return cb(null,true); cb(new Error('Not allowed by CORS')); }, credentials:true });
app.register(helmet,{ contentSecurityPolicy:false });
app.register(multipart, { limits: { fileSize: 10 * 1024 * 1024 } });

app.addHook('preHandler', rateLimit);
app.register(auth);

app.get('/health', async()=>({status:'ok', ts:new Date().toISOString()}));
app.get('/api/v1/docs', async()=>({ info:'qetta API', ts:Date.now() }));

app.register(require('./routes/auth'), { prefix:'/api/v1' });
app.register(require('./routes/tokens'), { prefix:'/api/v1' });
app.register(require('./routes/users'), { prefix:'/api/v1' });
app.register(require('./routes/verify'), { prefix:'/api/v1' });
app.register(require('./routes/billing'), { prefix:'/api/v1' });
app.register(require('./routes/oauth'), { prefix:'/api/v1' });
app.register(require('./routes/accounts'), { prefix:'/api/v1' });
app.register(require('./routes/debt-analysis'), { prefix:'/api/v1' });
app.register(require('./routes/free-analysis'), { prefix:'/api/v1/free' });
app.register(require('./routes/premium-auth'), { prefix:'/api/v1/auth' });

app.listen({ port, host:'0.0.0.0' }).then(()=>{
  app.log.info(`API on :${port}`);
  app.log.info('BullMQ account sync worker started');
}).catch(e=>{app.log.error(e);process.exit(1)});

process.on('SIGTERM', async () => {
  app.log.info('SIGTERM received, shutting down gracefully');
  await accountSyncWorker.close();
  await app.close();
  process.exit(0);
});

module.exports=app;
