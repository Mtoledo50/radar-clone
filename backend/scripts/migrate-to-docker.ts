/**
 * Script para migrar dados do banco LOCAL (5432) para o DOCKER (5433)
 * Unifica todos os dados em um único banco
 */
import { PrismaClient } from '@prisma/client';

const prismaLocal = new PrismaClient({
  datasourceUrl: 'postgresql://radar_user:radar_password@localhost:5432/radar_conta_certa',
});

const prismaDocker = new PrismaClient({
  datasourceUrl: 'postgresql://radar_user:radar_password@localhost:5433/radar_conta_certa',
});

async function main() {
  console.log('🔄 Iniciando migração de dados para Docker...\n');

  // 1. Migrar Clientes
  const clientes = await prismaLocal.client.findMany();
  console.log(`📦 Migrando ${clientes.length} clientes...`);
  
  for (const cliente of clientes) {
    await prismaDocker.client.upsert({
      where: { id: cliente.id },
      update: cliente,
      create: cliente,
    });
  }
  console.log(`✅ ${clientes.length} clientes migrados\n`);

  // 2. Migrar Usuários (sem duplicar)
  const usuarios = await prismaLocal.user.findMany();
  console.log(`👥 Migrando ${usuarios.length} usuários...`);
  
  for (const usuario of usuarios) {
    const exists = await prismaDocker.user.findUnique({
      where: { email: usuario.email },
    });
    
    if (!exists) {
      await prismaDocker.user.create({
        data: usuario,
      });
      console.log(`   ➕ ${usuario.email}`);
    } else {
      console.log(`   ⏭️  ${usuario.email} (já existe)`);
    }
  }
  console.log(`✅ Usuários migrados\n`);

  // 3. Migrar Propostas
  const propostas = await prismaLocal.proposal.findMany();
  console.log(`📄 Migrando ${propostas.length} propostas...`);
  
  for (const proposta of propostas) {
    await prismaDocker.proposal.upsert({
      where: { id: proposta.id },
      update: proposta,
      create: proposta,
    });
  }
  console.log(`✅ ${propostas.length} propostas migradas\n`);

  // 4. Migrar Transações Financeiras
  const transacoes = await prismaLocal.financialTransaction.findMany();
  console.log(`💰 Migrando ${transacoes.length} transações...`);
  
  for (const transacao of transacoes) {
    await prismaDocker.financialTransaction.upsert({
      where: { id: transacao.id },
      update: transacao,
      create: transacao,
    });
  }
  console.log(`✅ ${transacoes.length} transações migradas\n`);

  console.log('🎉 Migração concluída com sucesso!');
  console.log('\n📊 Resumo:');
  console.log(`   - Clientes: ${clientes.length}`);
  console.log(`   - Usuários: ${usuarios.length}`);
  console.log(`   - Propostas: ${propostas.length}`);
  console.log(`   - Transações: ${transacoes.length}`);
}

main()
  .catch((e) => {
    console.error('❌ Erro na migração:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prismaLocal.$disconnect();
    await prismaDocker.$disconnect();
  });