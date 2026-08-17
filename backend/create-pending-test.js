const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
p.automationPending.create({
  data: {
    companyId: '00000000-0000-0000-0000-000000000001',
    type: 'CLASSIFICATION',
    confidence: 72,
    payload: {
      transactionId: 'teste-sem-transacao',
      description: 'PIX RECEBIDO ACADEMIA TESTE',
      amount: 350.0,
      suggestedNature: 'Vendas PIX',
    },
  },
}).then((r) => { console.log('Pendencia criada:', r.id); p.$disconnect(); });
