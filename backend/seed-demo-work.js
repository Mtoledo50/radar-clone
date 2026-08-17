const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

// Memória de aprendizado (regras que o "contador" já ensinou)
const RULES = [
  { pattern: 'CEEE', nature: 'Energia Elétrica' },
  { pattern: 'TARIFA', nature: 'Despesas Bancárias' },
  { pattern: 'PIX RECEBIDO', nature: 'Mensalidades' },
  { pattern: 'ALUGUEL', nature: 'Aluguéis' },
];

// Extrato de julho/2026 (6 linhas por cliente)
const TXS = [
  { description: 'PIX RECEBIDO MENSALIDADE JULHO', amount: 1500 },
  { description: 'CEEE ENERGIA ELETRICA FATURA 07', amount: -320.5 },
  { description: 'TARIFA PACOTE DE SERVICOS', amount: -45 },
  { description: 'PAGAMENTO FORNECEDOR MATERIAIS', amount: -780 },
  { description: 'TRANSFERENCIA RECEBIDA DE CLIENTE', amount: 2200 },
  { description: 'ALUGUEL DA SALA COMERCIAL', amount: -1200 },
];

async function main() {
  const company = await p.company.findFirst();
  const clients = await p.client.findMany({ where: { companyId: company.id }, take: 3 });
  console.log('Seed em:', clients.map(c => c.companyName).join(' | '));

  // 1) Memória de classificação (upsert — não duplica)
  for (const r of RULES) {
    await p.bankClassificationRule.upsert({
      where: { companyId_pattern: { companyId: company.id, pattern: r.pattern } },
      update: {},
      create: { companyId: company.id, pattern: r.pattern, nature: r.nature },
    });
  }
  console.log('Memória: 4 regras prontas');

  // 2) Extrato + transações (idempotente por cliente/mês)
  for (const c of clients) {
    const existing = await p.bankStatement.findUnique({
      where: { companyId_clientId_year_month: { companyId: company.id, clientId: c.id, year: 2026, month: 7 } },
      include: { transactions: true },
    });
    if (existing && existing.transactions.length > 0) {
      console.log(`- ${c.companyName}: já tem extrato, pulando`);
      continue;
    }
    const st = existing || await p.bankStatement.create({
      data: { companyId: company.id, clientId: c.id, year: 2026, month: 7, fileName: 'seed-julho-2026.csv', status: 'ABERTO' },
    });
    let day = 1;
    for (const t of TXS) {
      await p.bankTransaction.create({
        data: {
          statementId: st.id, companyId: company.id,
          date: new Date(Date.UTC(2026, 6, Math.min(day, 28))),
          description: t.description, amount: t.amount, nature: 'NAO_CLASSIFICADO',
        },
      });
      day += 4;
    }
    console.log(`+ ${c.companyName}: 6 transações NAO_CLASSIFICADO criadas`);
  }

  const total = await p.bankTransaction.count({ where: { companyId: company.id, nature: 'NAO_CLASSIFICADO' } });
  console.log('TOTAL NAO_CLASSIFICADO agora:', total);
}
main().finally(() => p.$disconnect());
