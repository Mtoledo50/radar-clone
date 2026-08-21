// =================================================================
// INICIO: backend/prisma/seed-custom-indicators.ts
// =================================================================
/**
 * Seed Sprint C3 - Indicadores customizados de exemplo.
 *
 * Seguro e idempotente:
 * - busca admin@demo.com
 * - apaga apenas os indicadores com os nomes abaixo
 * - recria exemplos limpos
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const EXAMPLES = [
  {
    name: '% da Meta de Clientes',
    description: 'Progresso em relacao a meta anual de clientes.',
    formula: '(clientesHoje / clientesAno) * 100',
    target: 100,
    unit: '%',
    category: 'COMERCIAL',
    color: '#0d9488',
    isFavorite: true,
  },
  {
    name: 'Clientes por Funcionario',
    description: 'Produtividade media da equipe.',
    formula: 'clientesHoje / funcionariosHoje',
    target: 20,
    unit: 'clientes/func',
    category: 'OPERACIONAL',
    color: '#f97316',
    isFavorite: true,
  },
  {
    name: 'Cobertura de Softwares',
    description: 'Percentual de cobertura das categorias essenciais de software.',
    formula: 'softwareCoverage',
    target: 80,
    unit: '%',
    category: 'OPERACIONAL',
    color: '#2563eb',
    isFavorite: false,
  },
  {
    name: 'Cobertura de Servicos Extras',
    description: 'Percentual de servicos extras que o escritorio oferece.',
    formula: 'servicesCoverage',
    target: 90,
    unit: '%',
    category: 'COMERCIAL',
    color: '#16a34a',
    isFavorite: false,
  },
];

async function main() {
  console.log('Seed C3 - criando indicadores customizados...');

  const user = await prisma.user.findUnique({
    where: { email: 'admin@demo.com' },
    select: { id: true, companyId: true },
  });

  if (!user?.companyId) {
    throw new Error('Usuario admin@demo.com nao encontrado ou sem companyId.');
  }

  const names = EXAMPLES.map((e) => e.name);

  await prisma.customIndicator.deleteMany({
    where: {
      companyId: user.companyId,
      name: { in: names },
    },
  });

  for (const item of EXAMPLES) {
    await prisma.customIndicator.create({
      data: {
        companyId: user.companyId,
        userId: user.id,
        name: item.name,
        description: item.description,
        formula: item.formula,
        target: item.target,
        unit: item.unit,
        category: item.category as any,
        color: item.color,
        isFavorite: item.isFavorite,
      },
    });

    console.log(`OK - ${item.name}`);
  }

  console.log('Seed C3 concluido.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
// =================================================================
// FIM: backend/prisma/seed-custom-indicators.ts
// =================================================================