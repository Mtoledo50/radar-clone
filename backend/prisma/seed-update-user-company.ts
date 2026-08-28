import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔄 Atualizando usuário admin@aurora.com para empresa demo...\n');

  // Encontrar a empresa demo
  const empresaDemo = await prisma.company.findFirst({
    where: { name: 'Conta Certa Demo' },
  });

  if (!empresaDemo) {
    console.error('❌ Empresa demo não encontrada!');
    return;
  }

  console.log(`✅ Empresa demo encontrada: ${empresaDemo.id}`);

  // Atualizar o usuário admin@aurora.com
  const updatedUser = await prisma.user.update({
    where: { email: 'admin@aurora.com' },
    data: { companyId: empresaDemo.id },
  });

  console.log(`✅ Usuário atualizado: ${updatedUser.email}`);
  console.log(`   Novo companyId: ${updatedUser.companyId}\n`);

  console.log(' Pronto! Agora faça logout e login novamente.');
  console.log('   Email: admin@aurora.com');
  console.log('   Senha: (sua senha atual)\n');
  console.log('   As categorias e planos devem aparecer! ');
}

main()
  .catch((e) => {
    console.error('❌ Erro:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });