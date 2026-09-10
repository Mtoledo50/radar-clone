const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
(async () => {
  const r = await p.$queryRawUnsafe(
    "select count(*)::int as n from information_schema.columns " +
    "where table_name='clients' and column_name in ('tradeName','taxRegime','s3dId','addressCity')"
  );
  console.log('Colunas novas em clients:', r[0].n, '(esperado: 4)');
  const c = await p.clientContact.count();
  const o = await p.clientDepartmentOwner.count();
  console.log('client_contacts linhas:', c, '| client_department_owners linhas:', o);
  console.log('✅ MIGRAÇÃO F12 OK');
  await p.$disconnect();
  process.exit(0);
})().catch(async (e) => {
  console.error('❌ ERRO:', e.message.split('\n')[0]);
  await p.$disconnect();
  process.exit(1);
});
