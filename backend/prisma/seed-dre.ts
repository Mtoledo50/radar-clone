import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// 🔥 Substitua pelo ID do seu usuário real (pegue no Prisma Studio ou banco)
const USER_ID = 'd90a56bb-f1ea-41b6-80a5-70a5d477d69a';

async function main() {
  console.log('🌱 Iniciando seed específico para Fev-Jul/26...\n');

  console.log('🗑️  Limpando transações existentes...');
  await prisma.financialTransaction.deleteMany({
    where: { userId: USER_ID },
  });

  const transacoes = [];
  const meses = [
    { mes: 1, nome: 'Fevereiro' },
    { mes: 2, nome: 'Março' },
    { mes: 3, nome: 'Abril' },
    { mes: 4, nome: 'Maio' },
    { mes: 5, nome: 'Junho' },
    { mes: 6, nome: 'Julho' },
  ];

  for (const { mes, nome } of meses) {
    console.log(`📅 Gerando dados para ${nome}/26...`);

    // RECEITAS
    const numClientes = 8 + Math.floor(Math.random() * 4);
    for (let i = 0; i < numClientes; i++) {
      const valor = 3000 + Math.floor(Math.random() * 7000);
      transacoes.push({
        userId: USER_ID,
        type: 'RECEITA',
        category: 'HONORARIOS',
        description: `Honorários Mensais - Cliente ${i + 1}`,
        amount: valor,
        date: new Date(2026, mes, 5 + i),
      });
    }

    // DESPESAS FIXAS
    transacoes.push({
      userId: USER_ID,
      type: 'DESPESA',
      category: 'FOLHA',
      description: 'Folha de Pagamento Mensal',
      amount: 18000 + Math.floor(Math.random() * 4000),
      date: new Date(2026, mes, 5),
    });

    transacoes.push({
      userId: USER_ID,
      type: 'DESPESA',
      category: 'ALUGUEL',
      description: 'Aluguel do Escritório',
      amount: 4500,
      date: new Date(2026, mes, 10),
    });

    transacoes.push({
      userId: USER_ID,
      type: 'DESPESA',
      category: 'SOFTWARE',
      description: 'Licenças de Software Contábil',
      amount: 1500 + Math.floor(Math.random() * 1000),
      date: new Date(2026, mes, 15),
    });

    transacoes.push({
      userId: USER_ID,
      type: 'DESPESA',
      category: 'IMPOSTOS',
      description: 'DAS / Impostos sobre Receita',
      amount: 3000 + Math.floor(Math.random() * 2000),
      date: new Date(2026, mes, 20),
    });
  }

  console.log(`\n💾 Salvando ${transacoes.length} transações...`);
  await prisma.financialTransaction.createMany({
    data: transacoes,
  });

  const totalReceitas = transacoes.filter(t => t.type === 'RECEITA').reduce((acc, t) => acc + Number(t.amount), 0);
  const totalDespesas = transacoes.filter(t => t.type === 'DESPESA').reduce((acc, t) => acc + Number(t.amount), 0);

  console.log('\n✅ SEED CONCLUÍDO!');
  console.log(`📊 Resumo (Fev-Jul/26):`);
  console.log(`   Receita Total: R$ ${totalReceitas.toLocaleString('pt-BR')}`);
  console.log(`   Despesa Total: R$ ${totalDespesas.toLocaleString('pt-BR')}`);
  console.log(`   Lucro Líquido: R$ ${(totalReceitas - totalDespesas).toLocaleString('pt-BR')}`);
  console.log(`   Margem: ${(((totalReceitas - totalDespesas) / totalReceitas) * 100).toFixed(1)}%\n`);
}

main()
  .catch((e) => {
    console.error('❌ Erro:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });