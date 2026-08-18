const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
async function main() {
  const w = await p.robotWorker.findFirst();
  if (!w) { console.log('❌ Nenhum robotWorker encontrado'); return; }
  const ex = await p.robotWorkerSkill.findFirst({ where: { workerId: w.id, skillKey: 'NFSE_IMPORT' } });
  if (!ex) {
    await p.robotWorkerSkill.create({
      data: {
        workerId: w.id,
        companyId: w.companyId,   // 🆕 obrigatório (multi-tenant)
        skillKey: 'NFSE_IMPORT',
        enabled: true,
        cronExpr: '0 9 * * *',
        autonomy: 'REVIEW',
      },
    });
    console.log('✅ Skill NFSE_IMPORT registrada (cron 09:00, autonomia REVIEW)');
  } else {
    console.log('ℹ️ Skill já existia:', ex.id);
  }
}
main().finally(() => p.$disconnect());
