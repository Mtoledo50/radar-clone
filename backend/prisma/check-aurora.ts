/**
 * Script de diagnóstico e correção do Funcionário Digital (Aurora)
 * Executar: npx ts-node prisma/check-aurora.ts
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔍 Diagnóstico do Funcionário Digital...\n');

  // 1. Verificar empresa
  const company = await prisma.company.findFirst({
    where: { name: 'Conta Certa Demo' },
  });

  if (!company) {
    console.log(' Empresa "Conta Certa Demo" NÃO encontrada!');
    console.log('   Execute: npx ts-node prisma/seed-users.ts');
    return;
  }

  console.log(`✅ Empresa encontrada:`);
  console.log(`   ID: ${company.id}`);
  console.log(`   Nome: ${company.name}\n`);

  // 2. Verificar usuário admin
  const admin = await prisma.user.findFirst({
    where: { email: 'admin@demo.com' },
  });

  if (!admin) {
    console.log('❌ Usuário admin@demo.com NÃO encontrado!');
    console.log('   Execute: npx ts-node prisma/seed-users.ts');
    return;
  }

  console.log(`✅ Usuário admin encontrado:`);
  console.log(`   ID: ${admin.id}`);
  console.log(`   Email: ${admin.email}`);
  console.log(`   CompanyId: ${admin.companyId || '⚠️  VAZIO (NULL)'}`);

  // 3. Corrigir companyId se estiver vazio
  if (!admin.companyId) {
    console.log(`\n🔧 Corrigindo companyId do usuário admin...`);
    await prisma.user.update({
      where: { id: admin.id },
      data: { companyId: company.id },
    });
    console.log(`✅ companyId atualizado para: ${company.id}`);
    console.log(`\n⚠️  IMPORTANTE: Faça LOGOUT e LOGIN novamente no sistema!`);
  }

  // 4. Verificar RobotWorker (Aurora)
  const aurora = await (prisma as any).robotWorker?.findFirst({
    where: { companyId: company.id },
  });

  if (aurora) {
    console.log(`\n✅ Aurora (RobotWorker) encontrada:`);
    console.log(`   ID: ${aurora.id}`);
    console.log(`   Name: ${aurora.name}`);
    console.log(`   CompanyId: ${aurora.companyId}`);
  } else {
    console.log(`\n⚠️  Aurora (RobotWorker) NÃO encontrada.`);
    console.log(`   O módulo Funcionário Digital pode não estar totalmente implementado.`);
  }

  console.log('\n🎉 Diagnóstico concluído!');
}

main()
  .catch((e) => {
    console.error('❌ Erro:', e.message);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });