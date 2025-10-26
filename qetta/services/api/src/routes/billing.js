const { prisma } = require('../prisma'); const { z } = require('zod'); const Stripe=require('stripe'); const { stripeSecret, stripeWebhookSecret, prices, webUrl } = require('../config');
module.exports=async function(app){
  const stripe = stripeSecret ? new Stripe(stripeSecret, { apiVersion: '2024-11-20.acacia' }) : null;
  app.post('/billing/checkout', async (req, reply)=>{
    if(!req.userId) return reply.code(401).send({ error:'UNAUTHORIZED' });
    const p=z.object({ tier:z.enum(['STARTER','PRO','ENTERPRISE']) }).safeParse(req.body||{}); if(!p.success) return reply.code(400).send({ error:'BAD_REQUEST', details:p.error.flatten() });
    if(!stripe) return reply.code(501).send({ error:'STRIPE_NOT_CONFIGURED' });
    const user=await prisma.user.findUnique({ where:{ id:req.userId } }); const priceId=prices[p.data.tier]; if(!priceId) return reply.code(400).send({ error:'PRICE_NOT_SET' });
    const session=await stripe.checkout.sessions.create({ customer_email:user.email, line_items:[{ price:priceId, quantity:1 }], mode:'subscription', success_url:`${webUrl}/billing/success?session_id={CHECKOUT_SESSION_ID}`, cancel_url:`${webUrl}/billing/cancelled`, metadata:{ userId:req.userId, tier:p.data.tier } });
    return { url: session.url };
  });
  app.post('/webhooks/stripe', { config:{ rawBody:true } }, async (req, reply)=>{
    if(!stripe) return { received:true };
    let event=req.body; const sig=req.headers['stripe-signature'];
    if (stripeWebhookSecret){ try{ event=stripe.webhooks.constructEvent(req.rawBody, sig, stripeWebhookSecret); }catch(e){ return reply.code(400).send({ error:'BAD_SIGNATURE' }); } }
    if(event.type==='checkout.session.completed'){ const s=event.data.object; const userId=s.metadata?.userId; const tier=(s.metadata?.tier)||'STARTER'; if(userId){ const now=new Date(); const end=new Date(now); end.setMonth(end.getMonth()+1); await prisma.subscription.upsert({ where:{ userId }, create:{ userId, tier, status:'ACTIVE', currentPeriodStart:now, currentPeriodEnd:end, stripeCustomerId:s.customer, stripeSubscriptionId:s.subscription }, update:{ status:'ACTIVE', currentPeriodStart:now, currentPeriodEnd:end, stripeCustomerId:s.customer, stripeSubscriptionId:s.subscription } }); } }
    if(event.type==='invoice.payment_failed'){ const sub=event.data.object.subscription; await prisma.subscription.updateMany({ where:{ stripeSubscriptionId:sub }, data:{ status:'PAST_DUE' } }); }
    if(event.type==='customer.subscription.deleted'){ const sub=event.data.object.id; await prisma.subscription.updateMany({ where:{ stripeSubscriptionId:sub }, data:{ status:'CANCELLED' } }); }
    return { received:true };
  });
};
