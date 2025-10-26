const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();
async function main(){
  const email='admin@qetta.local';
  const pass=await bcrypt.hash('Admin!234', 10);
  await prisma.user.upsert({ where: { email }, update: {}, create: { email, password: pass } });
  console.log('[seed] admin:', email);
}
main().catch(e=>{ console.error(e); process.exit(1); }).finally(()=> prisma.$disconnect());
