/**
 * =================================================================
 *  SEED ESPECÍFICO: Dados para Fev/26 a Jul/26 (6 meses)
 * =================================================================
 * 
 * Garante dados robustos e visíveis no gráfico de Evolução Mensal (DRE)
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// 🔥 Substitua pelo ID do seu usuário real
const USER_ID = 'd90a56bb-f1ea-41b6-80a5-70a5d477d69a';

async function main() {
  console.log(' Iniciando seed específico para Fev-Jul/26...\n');

  // Limpar transações existentes
  console.log('🗑️  Limpando transações existentes...');
  await prisma.financialTransaction.deleteMany({
    where: { userId: USER_ID },
  });

  const transacoes = [];

  // =================================================================
  //  GERAR DADOS PARA FEVEREIRO A JULHO DE 2026
  // =================================================================
  const meses = [
    { mes: 1, nome: 'Fevereiro' },  // Fev/26
    { mes: 2, nome: 'Março' },       // Mar/26
    { mes: 3, nome: 'Abril' },       // Abr/26
    { mes: 4, nome: 'Maio' },        // Mai/26
    { mes: 5, nome: 'Junho' },       // Jun/26
    { mes: 6, nome: 'Julho' },       // Jul/26
  ];

  for (const { mes, nome } of meses) {
    console.log(`📅 Gerando dados para ${nome}/26...`);

    // --- RECEITAS (Honorários de clientes) ---
    const numClientes = 8 + Math.floor(Math.random() * 4); // 8-11 clientes
    for (let i = 0; i < numClientes; i++) {
      const valor = 3000 + Math.floor(Math.random() * 7000); // R$ 3k-10k por cliente
      
      transacoes.push({
        userId: USER_ID,
        type: 'RECEITA',
        category: 'HONORARIOS',
        description: `Honorários Mensais - Cliente ${i + 1}`,
        amount: valor,
        date: new Date(2026, mes, 5 + i), // Dia 5-15 do mês
      });
    }

    // --- RECEITAS (Consultoria extra) ---
    if (Math.random() > 0.3) {
      transacoes.push({
        userId: USER_ID,
        type: 'RECEITA',
        category: 'CONSULTORIA',
        description: 'Consultoria Tributária Especial',
        amount: 5000 + Math.floor(Math.random() * 10000),
        date: new Date(2026, mes, 20),
      });
    }

    // --- DESPESAS FIXAS ---
    
    // Folha de Pagamento
    transacoes.push({
      userId: USER_ID,
      type: 'DESPESA',
      category: 'FOLHA',
      description: 'Folha de Pagamento Mensal',
      amount: 18000 + Math.floor(Math.random() * 4000),
      date: new Date(2026, mes, 5),
    });

    // Aluguel
    transacoes.push({
      userId: USER_ID,
      type: 'DESPESA',
      category: 'ALUGUEL',
      description: 'Aluguel do Escritório',
      amount: 4500,
      date: new Date(2026, mes, 10),
    });

    // Software
    transacoes.push({
      userId: USER_ID,
      type: 'DESPESA',
      category: 'SOFTWARE',
      description: 'Licenças de Software Contábil',
      amount: 1500 + Math.floor(Math.random() * 1000),
      date: new Date(2026, mes, 15),
    });

    // Impostos
    transacoes.push({
      userId: USER_ID,
      type: 'DESPESA',
      category: 'IMPOSTOS',
      description: 'DAS / Impostos sobre Receita',
      amount: 3000 + Math.floor(Math.random() * 2000),
      date: new Date(2026, mes, 20),
    });

    // --- DESPESAS VARIÁVEIS ---
    
    // Marketing
    if (Math.random() > 0.4) {
      transacoes.push({
        userId: USER_ID,
        type: 'DESPESA',
        category: 'MARKETING',
        description: 'Campanha de Marketing Digital',
        amount: 2000 + Math.floor(Math.random() * 3000),
        date: new Date(2026, mes, 12),
      });
    }

    // Materiais
    transacoes.push({
      userId: USER_ID,
      type: 'DESPESA',
      category: 'MATERIAIS',
      description: 'Material de Escritório',
      amount: 500 + Math.floor(Math.random() * 1000),
      date: new Date(2026, mes, 18),
    });
  }

  // =================================================================
  // 💾 SALVAR NO BANCO
  // =================================================================
  console.log(`\n💾 Salvando ${transacoes.length} transações...`);
  await prisma.financialTransaction.createMany({
    data: transacoes,
  });

  // Resumo
  const totalReceitas = transacoes
    .filter(t => t.type === 'RECEITA')
    .reduce((acc, t) => acc + Number(t.amount), 0);
  const totalDespesas = transacoes
    .filter(t => t.type === 'DESPESA')
    .reduce((acc, t) => acc + Number(t.amount), 0);

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