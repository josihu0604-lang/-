const jwt = require('jsonwebtoken'); const { prisma } = require('./prisma'); const { jwtSecret } = require('./config');
function sign(id){ return jwt.sign({ sub:id }, jwtSecret, { expiresIn:'7d' }); }
function verifyJwt(t){ return jwt.verify(t, jwtSecret); }
async function userFromApiKey(token){ const t=await prisma.apiToken.findUnique({ where:{ token } }); return t? t.userId : null; }
function normalize(r){ if(!r||typeof r!=='object')return{severity_counts:{INFO:0,WARN:0,CRIT:0},issues:[],metrics:{}}; const s=r.severity_counts||r.severityCounts||{INFO:0,WARN:0,CRIT:0}; return { severity_counts:s, issues:Array.isArray(r.issues)?r.issues:[], metrics:r.metrics||{} }; }
module.exports={sign,verifyJwt,userFromApiKey,normalize};
