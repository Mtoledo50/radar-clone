import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🧹 Iniciando limpeza segura dos clientes...');

  // 1. Limpar vínculos de obrigações (para evitar órfãos ou duplicatas na reimportação)
  await prisma.obligationDelivery.deleteMany({});
  console.log('  ✅ Entregas de obrigações limpas.');

  // 2. Limpar contratos e serviços avulsos dos clientes
  await prisma.clientContract.deleteMany({});
  await prisma.clientService.deleteMany({});
  console.log('  ✅ Contratos e serviços limpos.');

  // 3. Limpar contatos
  await prisma.clientContact.deleteMany({});
  console.log('  ✅ Contatos limpos.');

  // 4. Por fim, deletar todos os clientes
  // (O Prisma cuidará de deletar em cascata projetos, tarefas, financeiro, etc., 
  // desde que onDelete: Cascade esteja configurado no schema)
  const result = await prisma.client.deleteMany({});
  console.log(`  ✅ ${result.count} clientes removidos com sucesso.`);

  console.log('🎉 Limpeza concluída! O sistema está pronto para uma nova importação.');
}

main()
  .catch((e) => {
    console.error('❌ Erro durante a limpeza:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });