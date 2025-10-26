const { redis } = require('../redis');
const LIMIT=100;
module.exports = async function rateLimit(req, reply){
  const key = `${(req.headers['x-api-key']||req.ip)}:${Math.floor(Date.now()/60000)}`;
  if (redis){
    const v = await redis.incr(key); if (v===1) await redis.expire(key, 60);
    if (v>LIMIT) return reply.code(429).send({ error:'Too Many Requests' });
  } else {
    req.server._rl=req.server._rl||new Map(); const m=req.server._rl;
    const e=m.get(key)||{c:0,t:Date.now()+60000}; e.c++; m.set(key,e);
    if (e.c>LIMIT) return reply.code(429).send({ error:'Too Many Requests', resetAt:new Date(e.t).toISOString() });
  }
};
