// =================================================================
// DIAGNÓSTICO: Verificar o que já existe no banco
// =================================================================
// Executar: npx ts-node prisma/diagnose-plans.ts
// =================================================================

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log(' DIAGNÓSTICO DO BANCO DE DADOS\n');

  const company = await prisma.company.findFirst();
  if (!company) {
    console.log('❌ Nenhuma empresa encontrada no banco.');
    return;
  }

  console.log(`📋 Empresa: ${company.name} (${company.id})\n`);

  // 1️⃣ Categorias
  const categories = await prisma.serviceCategory.findMany({
    where: { companyId: company.id },
    include: { _count: { select: { items: true } } },
    orderBy: { order: 'asc' },
  });

  console.log(`📂 CATEGORIAS (${categories.length}):`);
  categories.forEach((cat) => {
    console.log(`  ${cat.icon || '📁'} ${cat.name} - ${cat._count.items} itens`);
  });
  console.log('');

  // 2️⃣ Itens de Serviço
  const items = await prisma.serviceItem.findMany({
    where: { companyId: company.id },
    include: { category: true },
    orderBy: [{ category: { order: 'asc' } }, { order: 'asc' }],
  });

  console.log(`📦 ITENS DE SERVIÇO (${items.length}):`);
  items.forEach((item) => {
    console.log(`  • ${item.name} - R$ ${item.basePrice} - ${item.estimatedHours}h`);
  });
  console.log('');

  // 3️⃣ Planos Comerciais
  const plans = await prisma.commercialPlan.findMany({
    where: { companyId: company.id },
    include: { 
      _count: { select: { planItems: true } },
      planItems: {
        include: { serviceItem: true },
      },
    },
    orderBy: { order: 'asc' },
  });

  console.log(`💼 PLANOS COMERCIAIS (${plans.length}):`);
  plans.forEach((plan) => {
    console.log(`\n   ${plan.name} (multiplicador: ${plan.multiplier})`);
    console.log(`     ${plan.description}`);
    console.log(`     ${plan._count.planItems} itens vinculados:`);
    
    // Agrupar por categoria
    const itemsByCategory = plan.planItems.reduce((acc: any, pi: any) => {
      const catName = pi.serviceItem.category.name;
      if (!acc[catName]) acc[catName] = [];
      acc[catName].push(pi.serviceItem.name);
      return acc;
    }, {});

    Object.entries(itemsByCategory).forEach(([cat, items]: [string, any]) => {
      console.log(`     📁 ${cat}:`);
      items.forEach((item: string) => console.log(`        ✓ ${item}`));
    });
  });

  console.log('\n✅ Diagnóstico concluído!');
}

main()
  .catch((e) => {
    console.error('❌ Erro:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });