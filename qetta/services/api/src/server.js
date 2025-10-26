const Fastify=require('fastify'); const cors=require('@fastify/cors'); const helmet=require('@fastify/helmet'); const rawBody=require('@fastify/raw-body'); const pino=require('pino');
const { port, corsOrigins } = require('./config'); const rateLimit=require('./middleware/rateLimit'); const auth=require('./middleware/auth');
const app=Fastify({ logger: pino({ level: process.env.LOG_LEVEL || 'info' }) });

app.register(cors,{ origin:(origin,cb)=>{ if(!origin||corsOrigins.includes('*')||corsOrigins.includes(origin)) return cb(null,true); cb(new Error('Not allowed by CORS')); }, credentials:true });
app.register(helmet,{ contentSecurityPolicy:false });
app.register(rawBody,{ field:'rawBody', global:false, runFirst:true });

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

app.listen({ port, host:'0.0.0.0' }).then(()=>app.log.info(`API on :${port}`)).catch(e=>{app.log.error(e);process.exit(1)});
module.exports=app;
