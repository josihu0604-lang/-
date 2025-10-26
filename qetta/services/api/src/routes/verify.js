const { z } = require('zod'); const { prisma } = require('../prisma'); const { normalize } = require('../util'); const { VerificationEngine } = require('../../../packages/verifier/src/engine');
module.exports = async function(app){
  app.post('/verify', async (req, reply)=>{
    if(!req.userId) return reply.code(401).send({ error:'UNAUTHORIZED' });
    const S=z.object({ document:z.object({ amount:z.number().positive(), date:z.string().regex(/^\d{4}-\d{2}-\d{2}$/), subjectMatched:z.boolean(), memos:z.array(z.string()).max(20).optional() }), account:z.object({ balance:z.number().positive(), date:z.string().regex(/^\d{4}-\d{2}-\d{2}$/), memos:z.array(z.string()).max(20).optional() }) });
    const p=S.safeParse(req.body||{}); if(!p.success) return reply.code(400).send({ error:'BAD_REQUEST', details:p.error.flatten() });
    const raw=new VerificationEngine().verify(p.data.document, p.data.account); const res=normalize(raw);
    await prisma.verification.create({ data:{ userId:req.userId, issues:res.issues, metrics:res.metrics, severityCounts:res.severity_counts } });
    const month=new Date().toISOString().slice(0,7);
    await prisma.usageRecord.upsert({ where:{ userId_resourceType_billingMonth:{ userId:req.userId, resourceType:'verification', billingMonth:month } }, create:{ userId:req.userId, resourceType:'verification', billingMonth:month, count:1 }, update:{ count:{ increment:1 } } });
    return res;
  });
};
