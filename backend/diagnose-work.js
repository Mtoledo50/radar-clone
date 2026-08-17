const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function main() {
  const c = await p.company.findFirst();
  if (!c) { console.log('❌ Nenhuma company no banco'); return; }

  const [clients, tx, nclass, inv] = await Promise.all([
    p.client.count({ where: { companyId: c.id } }),
    p.bankTransaction.count({ where: { companyId: c.id } }),
    p.bankTransaction.count({ where: { companyId: c.id, nature: 'NAO_CLASSIFICADO' } }),
    p.fiscalInvoice.count({ where: { companyId: c.id } }),
  ]);

  console.log('=== VOLUME DE TRABALHO REAL ===');
  console.log('Tenant:', c.name);
  console.log('Clientes importados:', clients);
  console.log('Transações bancárias totais:', tx);
  console.log('Transações NAO_CLASSIFICADO:', nclass);
  console.log('NF-e de entrada:', inv);
}

main().finally(() => p.$disconnect());
