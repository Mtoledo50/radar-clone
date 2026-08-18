const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
async function main() {
  const w = await p.robotWorker.findFirst();
  if (!w) { console.log('❌ Nenhum robotWorker encontrado'); return; }
  const ex = await p.robotWorkerSkill.findFirst({ where: { workerId: w.id, skillKey: 'NFSE_EMAIL_COLLECT' } });
  if (!ex) {
    await p.robotWorkerSkill.create({
      data: {
        workerId: w.id,
        companyId: w.companyId,   // 🆕 obrigatório (multi-tenant)
        skillKey: 'NFSE_EMAIL_COLLECT',
        enabled: true,
        cronExpr: '*/30 * * * *',  // a cada 30 min
        autonomy: 'AUTO',
      },
    });
    console.log('✅ Skill NFSE_EMAIL_COLLECT registrada (cron */30 * * * *)');
  } else {
    console.log('ℹ️ Skill já existia:', ex.id);
  }
}
main().finally(() => p.$disconnect());
