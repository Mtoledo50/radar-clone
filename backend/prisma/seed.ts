/**
 * Script de Seed para popular o banco com planos comerciais e itens de serviço
 * Execute com: npx prisma db seed
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log(' Iniciando seed de planos comerciais...\n');

  // Usar o companyId do usuário de teste (ajuste se necessário)
  const companyId = '00000000-0000-0000-0000-000000000001';

  // =================================================================
  // 1. CRIAR CATEGORIAS DE SERVIÇOS
  // =================================================================
  console.log(' Criando categorias de serviços...');
  
  const categories = await Promise.all([
    prisma.serviceCategory.create({
      data: {
        companyId,
        name: 'Fiscal e Tributário',
        icon: 'FileText',
        order: 1,
        description: 'Obrigações fiscais e apuração de impostos',
      },
    }),
    prisma.serviceCategory.create({
      data: {
        companyId,
        name: 'Departamento Pessoal',
        icon: 'Users',
        order: 2,
        description: 'Gestão de funcionários e folha de pagamento',
      },
    }),
    prisma.serviceCategory.create({
      data: {
        companyId,
        name: 'Contábil',
        icon: 'Calculator',
        order: 3,
        description: 'Escrituração contábil e demonstrações financeiras',
      },
    }),
    prisma.serviceCategory.create({
      data: {
        companyId,
        name: 'Societário',
        icon: 'Building',
        order: 4,
        description: 'Contratos sociais, alterações e dissoluções',
      },
    }),
    prisma.serviceCategory.create({
      data: {
        companyId,
        name: 'Consultoria e Suporte',
        icon: 'MessageCircle',
        order: 5,
        description: 'Atendimento e orientações contábeis',
      },
    }),
  ]);

  console.log(`✅ ${categories.length} categorias criadas\n`);

  // =================================================================
  // 2. CRIAR ITENS DE SERVIÇO
  // =================================================================
  console.log('📦 Criando itens de serviço...');

  const items = await Promise.all([
    // Fiscal e Tributário
    prisma.serviceItem.create({ data: { companyId, categoryId: categories[0].id, name: 'Apuração mensal de impostos federais (DCTF, EFD-Contribuições)', order: 1 } }),
    prisma.serviceItem.create({ data: { companyId, categoryId: categories[0].id, name: 'Apuração de ICMS e ISS', order: 2 } }),
    prisma.serviceItem.create({ data: { companyId, categoryId: categories[0].id, name: 'Entrega da EFD-Reinf', order: 3 } }),
    prisma.serviceItem.create({ data: { companyId, categoryId: categories[0].id, name: 'Entrega da EFD-ICMS/IPI', order: 4 } }),
    prisma.serviceItem.create({ data: { companyId, categoryId: categories[0].id, name: 'Controle de obrigações acessórias', order: 5 } }),
    prisma.serviceItem.create({ data: { companyId, categoryId: categories[0].id, name: 'Planejamento tributário básico', order: 6 } }),
    prisma.serviceItem.create({ data: { companyId, categoryId: categories[0].id, name: 'Planejamento tributário avançado', order: 7 } }),
    prisma.serviceItem.create({ data: { companyId, categoryId: categories[0].id, name: 'Recuperação de créditos tributários', order: 8 } }),

    // Departamento Pessoal
    prisma.serviceItem.create({ data: { companyId, categoryId: categories[1].id, name: 'Processamento da folha de pagamento', order: 1 } }),
    prisma.serviceItem.create({ data: { companyId, categoryId: categories[1].id, name: 'Cálculo de férias e 13º salário', order: 2 } }),
    prisma.serviceItem.create({ data: { companyId, categoryId: categories[1].id, name: 'Rescisões trabalhistas', order: 3 } }),
    prisma.serviceItem.create({ data: { companyId, categoryId: categories[1].id, name: 'Envio do eSocial', order: 4 } }),
    prisma.serviceItem.create({ data: { companyId, categoryId: categories[1].id, name: 'Gestão de benefícios (VR, VA, VT)', order: 5 } }),
    prisma.serviceItem.create({ data: { companyId, categoryId: categories[1].id, name: 'Controle de ponto eletrônico', order: 6 } }),
    prisma.serviceItem.create({ data: { companyId, categoryId: categories[1].id, name: 'Admissão e demissão de funcionários', order: 7 } }),
    prisma.serviceItem.create({ data: { companyId, categoryId: categories[1].id, name: 'Exames médicos ocupacionais (ASO)', order: 8 } }),

    // Contábil
    prisma.serviceItem.create({ data: { companyId, categoryId: categories[2].id, name: 'Escrituração contábil mensal', order: 1 } }),
    prisma.serviceItem.create({ data: { companyId, categoryId: categories[2].id, name: 'Conciliação bancária', order: 2 } }),
    prisma.serviceItem.create({ data: { companyId, categoryId: categories[2].id, name: 'Balanço Patrimonial e DRE', order: 3 } }),
    prisma.serviceItem.create({ data: { companyId, categoryId: categories[2].id, name: 'Livro Diário e Razão', order: 4 } }),
    prisma.serviceItem.create({ data: { companyId, categoryId: categories[2].id, name: 'Demonstração do Lucro Real/Presumido', order: 5 } }),
    prisma.serviceItem.create({ data: { companyId, categoryId: categories[2].id, name: 'Relatórios gerenciais personalizados', order: 6 } }),
    prisma.serviceItem.create({ data: { companyId, categoryId: categories[2].id, name: 'Análise de indicadores financeiros', order: 7 } }),

    // Societário
    prisma.serviceItem.create({ data: { companyId, categoryId: categories[3].id, name: 'Contrato social e alterações', order: 1 } }),
    prisma.serviceItem.create({ data: { companyId, categoryId: categories[3].id, name: 'Registro na Junta Comercial', order: 2 } }),
    prisma.serviceItem.create({ data: { companyId, categoryId: categories[3].id, name: 'Alvarás e licenças', order: 3 } }),
    prisma.serviceItem.create({ data: { companyId, categoryId: categories[3].id, name: 'Dissolução e baixa de empresa', order: 4 } }),
    prisma.serviceItem.create({ data: { companyId, categoryId: categories[3].id, name: 'Ata de reunião e assembleias', order: 5 } }),

    // Consultoria e Suporte
    prisma.serviceItem.create({ data: { companyId, categoryId: categories[4].id, name: 'Atendimento via WhatsApp/Email', order: 1 } }),
    prisma.serviceItem.create({ data: { companyId, categoryId: categories[4].id, name: 'Reuniões mensais de acompanhamento', order: 2 } }),
    prisma.serviceItem.create({ data: { companyId, categoryId: categories[4].id, name: 'Consultoria contábil estratégica', order: 3 } }),
    prisma.serviceItem.create({ data: { companyId, categoryId: categories[4].id, name: 'Suporte em fiscalizações', order: 4 } }),
    prisma.serviceItem.create({ data: { companyId, categoryId: categories[4].id, name: 'Treinamento para equipe do cliente', order: 5 } }),
  ]);

  console.log(`✅ ${items.length} itens de serviço criados\n`);

  // =================================================================
  // 3. CRIAR PLANOS COMERCIAIS
  // =================================================================
  console.log(' Criando planos comerciais...');

  const plans = await Promise.all([
    prisma.commercialPlan.create({
      data: {
        companyId,
        name: 'START',
        multiplier: 0.65,
        order: 1,
        badge: 'ESSENCIAL',
        color: '#64748b',
        description: 'Plano ideal para MEI e microempresas que estão começando',
      },
    }),
    prisma.commercialPlan.create({
      data: {
        companyId,
        name: 'PRIME',
        multiplier: 1.00,
        order: 2,
        badge: 'MAIS POPULAR',
        color: '#14b8a6',
        description: 'Plano completo para pequenas e médias empresas em crescimento',
      },
    }),
    prisma.commercialPlan.create({
      data: {
        companyId,
        name: 'BLACK',
        multiplier: 1.45,
        order: 3,
        badge: 'PREMIUM',
        color: '#8b5cf6',
        description: 'Plano premium com consultoria estratégica e suporte prioritário',
      },
    }),
  ]);

  console.log(`✅ ${plans.length} planos criados\n`);

  // =================================================================
  // 4. ASSOCIAR ITENS AOS PLANOS
  // =================================================================
  console.log('🔗 Associando itens aos planos...');

  // START: Itens básicos (essenciais)
  const startItems = items.filter(item => 
    item.name.includes('Apuração mensal de impostos federais') ||
    item.name.includes('Apuração de ICMS e ISS') ||
    item.name.includes('Entrega da EFD-Reinf') ||
    item.name.includes('Processamento da folha de pagamento') ||
    item.name.includes('Cálculo de férias e 13º salário') ||
    item.name.includes('Envio do eSocial') ||
    item.name.includes('Escrituração contábil mensal') ||
    item.name.includes('Conciliação bancária') ||
    item.name.includes('Atendimento via WhatsApp/Email')
  );

  // PRIME: START + itens intermediários
  const primeItems = [
    ...startItems,
    ...items.filter(item => 
      item.name.includes('Controle de obrigações acessórias') ||
      item.name.includes('Planejamento tributário básico') ||
      item.name.includes('Rescisões trabalhistas') ||
      item.name.includes('Gestão de benefícios') ||
      item.name.includes('Balanço Patrimonial e DRE') ||
      item.name.includes('Livro Diário e Razão') ||
      item.name.includes('Contrato social e alterações') ||
      item.name.includes('Reuniões mensais de acompanhamento')
    )
  ];

  // BLACK: Todos os itens
  const blackItems = items;

  // Criar associações START
  for (const item of startItems) {
    await prisma.planServiceItem.create({
      data: { planId: plans[0].id, serviceItemId: item.id },
    });
  }

  // Criar associações PRIME
  for (const item of primeItems) {
    await prisma.planServiceItem.create({
      data: { planId: plans[1].id, serviceItemId: item.id },
    });
  }

  // Criar associações BLACK
  for (const item of blackItems) {
    await prisma.planServiceItem.create({
      data: { planId: plans[2].id, serviceItemId: item.id },
    });
  }

  console.log(`✅ Itens associados: START (${startItems.length}), PRIME (${primeItems.length}), BLACK (${blackItems.length})\n`);

  console.log('🎉 Seed concluído com sucesso!');
  console.log('\n📊 Resumo:');
  console.log(`   - 5 categorias de serviços`);
  console.log(`   - 35 itens de serviço`);
  console.log(`   - 3 planos comerciais (START, PRIME, BLACK)`);
  console.log(`   - START: ${startItems.length} itens`);
  console.log(`   - PRIME: ${primeItems.length} itens`);
  console.log(`   - BLACK: ${blackItems.length} itens`);
}

main()
  .catch((e) => {
    console.error('❌ Erro no seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });