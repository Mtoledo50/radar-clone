/**
 * SEED DE OBRIGAÇÕES FISCAIS - VERSÃO INTELIGENTE
 * Busca o companyId dinamicamente do primeiro usuário encontrado.
 */
import { PrismaClient, ObligationType, ObligationStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed de obrigações fiscais...\n');

  // 1) Busca QUALQUER usuário no banco (independe de companyId fixo)
  const user = await prisma.user.findFirst({
    orderBy: { createdAt: 'asc' },
  });

  if (!user) {
    throw new Error('❌ Nenhum usuário encontrado no banco. Rode npm run seed:users primeiro.');
  }
  
  const COMPANY_ID = user.companyId;
  console.log(`✅ Usuário encontrado: ${user.email} (companyId: ${COMPANY_ID})`);

  // 2) Busca ou cria cliente
  let client = await prisma.client.findFirst({
    where: { companyId: COMPANY_ID },
    orderBy: { createdAt: 'asc' },
  });

  if (!client) {
    console.log('⚠️  Nenhum cliente encontrado. Criando cliente demo...');
    client = await prisma.client.create({
      data: {
        companyId: COMPANY_ID,
        companyName: 'Cliente Demo LTDA',
        cnpj: '12.345.678/0001-99',
        taxRegime: 'SIMPLES_NACIONAL',
        monthlyFee: 500.00,
        startDate: new Date('2026-01-01'),
        userId: user.id,
      },
    });
    console.log(`✅ Cliente demo criado: ${client.companyName}`);
  } else {
    console.log(`✅ Cliente encontrado: ${client.companyName}`);
  }

  // 3) Define competências
  const months = [
    { competence: '08/2026', dueBase: '2026-09-20' },
    { competence: '09/2026', dueBase: '2026-10-20' },
    { competence: '10/2026', dueBase: '2026-11-20' },
  ];

  // 4) Templates de obrigações
  const obligationTemplates: Array<{
    type: ObligationType;
    baseAmount: number;
    status: ObligationStatus;
  }> = [
    { type: 'DAS', baseAmount: 850.00, status: 'PAGO' },
    { type: 'DARF_IRRF', baseAmount: 320.50, status: 'PAGO' },
    { type: 'GPS', baseAmount: 1250.00, status: 'PAGO' },
    { type: 'DAS', baseAmount: 890.00, status: 'PAGO' },
    { type: 'DARF_CSLL', baseAmount: 450.00, status: 'PAGO' },
    { type: 'GPS', baseAmount: 1280.00, status: 'PAGO' },
    { type: 'DAS', baseAmount: 920.00, status: 'PENDENTE' },
    { type: 'DARF_IRRF', baseAmount: 340.00, status: 'PENDENTE' },
    { type: 'GPS', baseAmount: 1300.00, status: 'PENDENTE' },
    { type: 'ISS', baseAmount: 180.00, status: 'PENDENTE' },
    { type: 'DAS', baseAmount: 810.00, status: 'ATRASADO' },
    { type: 'GPS', baseAmount: 1200.00, status: 'ATRASADO' },
    { type: 'DARF_PIS_COFINS', baseAmount: 290.00, status: 'ATRASADO' },
    { type: 'FGTS', baseAmount: 450.00, status: 'CANCELADO' },
    { type: 'OUTROS', baseAmount: 150.00, status: 'DISPENSADO' },
  ];

  // 5) Limpa obrigações antigas (idempotência)
  await prisma.taxObligation.deleteMany({
    where: { clientId: client.id },
  });
  console.log(`🧹 Obrigações antigas removidas.`);

  // 6) Cria as obrigações
  let createdCount = 0;
  for (let i = 0; i < obligationTemplates.length; i++) {
    const template = obligationTemplates[i];
    const month = months[i % months.length];
    
    const dueDate = new Date(month.dueBase);
    dueDate.setDate(dueDate.getDate() + (i % 5));

    await prisma.taxObligation.create({
      data: {
        companyId: COMPANY_ID,
        clientId: client.id,
        type: template.type,
        competence: month.competence,
        dueDate: dueDate,
        amount: template.baseAmount,
        status: template.status,
        obs: template.status === 'ATRASADO' ? 'Aguardando regularização' : undefined,
      },
    });
    createdCount++;
  }

  console.log(`\n🎉 Seed concluído. Total: ${createdCount} obrigações criadas.`);
  console.log(`   Cliente: ${client.companyName}`);
}

main()
  .catch((e) => {
    console.error('💥 Erro no seed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());