const { prisma } = require('../prisma'); const { z } = require('zod'); const bcrypt=require('bcryptjs'); const { sign } = require('../util');
module.exports = async function(app){
  app.post('/auth/register', async (req, reply)=>{
    const S=z.object({ email:z.string().email(), password:z.string().min(8) }); const p=S.safeParse(req.body||{});
    if(!p.success) return reply.code(400).send({ error:'BAD_REQUEST', details:p.error.flatten() });
    const { email, password }=p.data; const exists=await prisma.user.findUnique({ where:{ email } }); if(exists) return reply.code(409).send({ error:'ALREADY_EXISTS' });
    const hash=await bcrypt.hash(password,12); const u=await prisma.user.create({ data:{ email, password: hash } });
    return { accessToken: sign(u.id), user:{ id:u.id, email:u.email } };
  });
  app.post('/auth/login', async (req, reply)=>{
    const S=z.object({ email:z.string().email(), password:z.string().min(8) }); const p=S.safeParse(req.body||{});
    if(!p.success) return reply.code(400).send({ error:'BAD_REQUEST', details:p.error.flatten() });
    const { email, password }=p.data; const u=await prisma.user.findUnique({ where:{ email } }); if(!u) return reply.code(401).send({ error:'INVALID_CREDENTIALS' });
    const ok=await bcrypt.compare(password, u.password); if(!ok) return reply.code(401).send({ error:'INVALID_CREDENTIALS' });
    return { accessToken: sign(u.id), user:{ id:u.id, email:u.email } };
  });
};
