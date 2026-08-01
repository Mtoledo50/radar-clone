import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const USER_ID = 'd90a56bb-f1ea-41b6-80a5-70a5d477d69a'; // Substitua pelo seu ID

async function main() {
  console.log('🌱 Seed de Turnover...');

  // Setores padrão
  const defaultSectors = ['DP', 'Fiscal', 'Contábil', 'Societário'];
  for (const name of defaultSectors) {
    await prisma.sector.create({
      data: { userId: USER_ID, name, mandatory: true, order: defaultSectors.indexOf(name) },
    });
  }

  // Motivos de desligamento
  const reasons = [
    'Ambiente de Trabalho',
    'Contrato Tempo Determinado',
    'Desligamento por Justa Causa',
    'Falha no Onboarding',
    'Falta de Desenvolvimento',
    'Melhor Oportunidade',
    'Motivos Pessoais',
    'Mudança de Cidade/País',
    'Problemas com Gestor',
    'Salário Não Competitivo',
  ];
  for (const name of reasons) {
    await prisma.dismissalReason.create({
      data: { userId: USER_ID, name },
    });
  }

  // Dados mensais de exemplo (Janeiro com turnover alto)
  await prisma.turnoverMonthly.create({
    data: {
      userId: USER_ID,
      year: 2026,
      month: 1,
      cltInitial: 20,
      cltAdmissions: 2,
      cltDismissals: 10,
    },
  });

  console.log('✅ Seed de Turnover concluído!');
}

main().catch(console.error).finally(() => prisma.$disconnect());