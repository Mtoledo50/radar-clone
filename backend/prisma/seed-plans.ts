// =================================================================
// SEED: PLANOS COMERCIAIS RADAR (Essencial, Profissional, Premium)
// =================================================================
// Executar: npx ts-node --transpile-only prisma/seed-plans.ts
// =================================================================

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// =================================================================
//  CATEGORIAS DE SERVIÇOS
// =================================================================
const categories = [
  { name: 'Fiscal e Tributário', icon: '', order: 1, description: 'Serviços de apuração fiscal e planejamento tributário' },
  { name: 'Notas Fiscais', icon: '🧾', order: 2, description: 'Emissão e gestão de notas fiscais' },
  { name: 'Departamento Pessoal', icon: '👥', order: 3, description: 'Folha de pagamento e obrigações trabalhistas' },
  { name: 'Relatórios e Análises', icon: '📊', order: 4, description: 'Relatórios financeiros e análises gerenciais' },
  { name: 'Atendimento e Suporte', icon: '📞', order: 5, description: 'Canais de atendimento e suporte ao cliente' },
  { name: 'Reuniões e Consultoria', icon: '🤝', order: 6, description: 'Reuniões periódicas e consultoria especializada' },
  { name: 'Tecnologia e Integrações', icon: '🔗', order: 7, description: 'Ferramentas tecnológicas e integrações' },
  { name: 'Benefícios e Extras', icon: '⭐', order: 8, description: 'Benefícios adicionais e diferenciais' },
];

// =================================================================
// 📦 ITENS DE SERVIÇO (52 itens totais)
// =================================================================
const serviceItems = [
  // FISCAL E TRIBUTÁRIO (11 itens)
  ['Fiscal e Tributário', 'Apuração mensal de impostos', 'Apuração e cálculo de impostos mensais', 150.00, 4.0, 'MENSAL'],
  ['Fiscal e Tributário', 'Emissão de guias DAS / DASN', 'Emissão de guias de recolhimento', 50.00, 1.0, 'MENSAL'],
  ['Fiscal e Tributário', 'Escrituração fiscal completa', 'Registro de todas as operações fiscais', 300.00, 8.0, 'MENSAL'],
  ['Fiscal e Tributário', 'Declarações obrigatórias (DEFIS, PGDAS-D)', 'Entrega de declarações anuais', 200.00, 3.0, 'ANUAL'],
  ['Fiscal e Tributário', 'Pró-labore dos sócios', 'Cálculo e emissão de pró-labore', 100.00, 2.0, 'MENSAL'],
  ['Fiscal e Tributário', 'Planejamento tributário básico', 'Análise básica de enquadramento tributário', 250.00, 5.0, 'MENSAL'],
  ['Fiscal e Tributário', 'Apuração mensal impostos IBS e CBS', 'Apuração de impostos da reforma tributária', 180.00, 4.0, 'MENSAL'],
  ['Fiscal e Tributário', 'Planejamento tributário estratégico', 'Planejamento avançado com simulações', 500.00, 10.0, 'MENSAL'],
  ['Fiscal e Tributário', 'Análise de enquadramento tributário', 'Análise detalhada do melhor regime', 400.00, 8.0, 'TRIMESTRAL'],
  ['Fiscal e Tributário', 'Revisão de regime tributário anual', 'Revisão anual completa do regime', 600.00, 12.0, 'ANUAL'],
  ['Fiscal e Tributário', 'Gestão de parcelamentos e débitos fiscais', 'Negociação e acompanhamento de débitos', 350.00, 6.0, 'MENSAL'],

  // NOTAS FISCAIS (6 itens)
  ['Notas Fiscais', 'Plataforma para emissão própria de NF-e', 'Acesso à plataforma de emissão', 80.00, 2.0, 'MENSAL'],
  ['Notas Fiscais', 'Emissão de NF pela equipe (até 10/mês)', 'Emissão de até 10 notas fiscais por mês', 120.00, 3.0, 'MENSAL'],
  ['Notas Fiscais', 'Emissão de NF pela equipe (até 30/mês)', 'Emissão de até 30 notas fiscais por mês', 200.00, 5.0, 'MENSAL'],
  ['Notas Fiscais', 'Emissão de NF pela equipe (ilimitada)', 'Emissão ilimitada de notas fiscais', 350.00, 8.0, 'MENSAL'],
  ['Notas Fiscais', 'Importação de NF de fornecedores', 'Importação automática de NF-e de entrada', 150.00, 4.0, 'MENSAL'],
  ['Notas Fiscais', 'Análise de NCM', 'Classificação fiscal de produtos', 180.00, 5.0, 'MENSAL'],

  // DEPARTAMENTO PESSOAL (10 itens)
  ['Departamento Pessoal', 'Folha cobrada à parte (sem inclusão)', 'Folha de pagamento avulsa', 80.00, 2.0, 'AVULSO'],
  ['Departamento Pessoal', 'Folha de pagamento (até 3 funcionários)', 'Processamento de folha para até 3 funcionários', 200.00, 5.0, 'MENSAL'],
  ['Departamento Pessoal', 'Geração de holerites e recibos', 'Emissão de documentos de pagamento', 100.00, 2.0, 'MENSAL'],
  ['Departamento Pessoal', 'E-Social completo', 'Envio de eventos ao e-Social', 150.00, 4.0, 'MENSAL'],
  ['Departamento Pessoal', 'GFIP / CAGED / RAIS / DIRF', 'Entrega de obrigações acessórias', 250.00, 6.0, 'MENSAL'],
  ['Departamento Pessoal', 'Até 2 recálculos de guias por mês', 'Recálculo de guias de FGTS/INSS', 80.00, 2.0, 'MENSAL'],
  ['Departamento Pessoal', 'Folha de pagamento ilimitada', 'Processamento de folha sem limite de funcionários', 400.00, 10.0, 'MENSAL'],
  ['Departamento Pessoal', 'Gestão de férias', 'Controle e processamento de férias', 120.00, 3.0, 'MENSAL'],
  ['Departamento Pessoal', 'Cálculo de rescisões', 'Cálculo de verbas rescisórias', 150.00, 4.0, 'AVULSO'],
  ['Departamento Pessoal', 'B.I. Folha de Pagamento', 'Relatórios analíticos de folha', 200.00, 5.0, 'MENSAL'],

  // RELATÓRIOS E ANÁLISES (10 itens)
  ['Relatórios e Análises', 'Balancete mensal', 'Balancete de verificação mensal', 150.00, 3.0, 'MENSAL'],
  ['Relatórios e Análises', 'Balanço patrimonial anual', 'Balanço patrimonial completo', 400.00, 8.0, 'ANUAL'],
  ['Relatórios e Análises', 'Acesso a painel web com documentos', 'Portal do cliente com documentos', 100.00, 2.0, 'MENSAL'],
  ['Relatórios e Análises', 'DRE simplificado', 'Demonstrativo de resultado básico', 200.00, 4.0, 'MENSAL'],
  ['Relatórios e Análises', 'Análise de fluxo de caixa básica', 'Controle de entradas e saídas', 180.00, 4.0, 'MENSAL'],
  ['Relatórios e Análises', 'DRE detalhado com análise', 'DRE completo com análise gerencial', 350.00, 7.0, 'MENSAL'],
  ['Relatórios e Análises', 'Fluxo de caixa projetado', 'Projeção de fluxo de caixa futuro', 300.00, 6.0, 'MENSAL'],
  ['Relatórios e Análises', 'Análise de índices financeiros', 'Cálculo e análise de indicadores', 250.00, 5.0, 'MENSAL'],
  ['Relatórios e Análises', 'Relatório de gestão patrimonial', 'Análise da evolução patrimonial', 280.00, 6.0, 'MENSAL'],
  ['Relatórios e Análises', 'Análise de viabilidade de investimentos', 'Estudo de viabilidade econômica', 400.00, 8.0, 'AVULSO'],

  // ATENDIMENTO E SUPORTE (7 itens)
  ['Atendimento e Suporte', 'Atendimento via WhatsApp (8h-18h)', 'Suporte via WhatsApp em horário comercial', 100.00, 2.0, 'MENSAL'],
  ['Atendimento e Suporte', 'Atendimento via e-mail (8h-18h)', 'Suporte por e-mail em horário comercial', 80.00, 2.0, 'MENSAL'],
  ['Atendimento e Suporte', 'Atendimento via telefone (8h-18h)', 'Suporte telefônico em horário comercial', 120.00, 3.0, 'MENSAL'],
  ['Atendimento e Suporte', 'Horário estendido (até 21h)', 'Atendimento em horário estendido', 150.00, 4.0, 'MENSAL'],
  ['Atendimento e Suporte', 'Tempo de resposta garantido (até 4h)', 'SLA de resposta em até 4 horas', 200.00, 5.0, 'MENSAL'],
  ['Atendimento e Suporte', 'Gestor / Assessor de conta dedicado', 'Profissional dedicado à conta', 300.00, 8.0, 'MENSAL'],
  ['Atendimento e Suporte', 'Atendimento emergências 24h', 'Suporte 24 horas para emergências', 400.00, 10.0, 'MENSAL'],
  

  // REUNIÕES E CONSULTORIA (6 itens)
  ['Reuniões e Consultoria', 'Reunião semestral de resultados', 'Reunião a cada 6 meses para análise', 250.00, 4.0, 'ANUAL'],
  ['Reuniões e Consultoria', 'Reunião trimestral de resultados', 'Reunião trimestral de acompanhamento', 200.00, 3.0, 'TRIMESTRAL'],
  ['Reuniões e Consultoria', 'Reunião mensal com especialista', 'Reunião mensal com especialista da área', 350.00, 5.0, 'MENSAL'],
  ['Reuniões e Consultoria', 'Reunião mensal consultoria financeira', 'Consultoria financeira mensal', 400.00, 6.0, 'MENSAL'],
  ['Reuniões e Consultoria', 'Suporte em decisões de investimento', 'Consultoria para decisões de investimento', 300.00, 5.0, 'MENSAL'],
  ['Reuniões e Consultoria', 'Consultoria jurídica básica', 'Orientação jurídica contábil', 250.00, 4.0, 'MENSAL'],

  // TECNOLOGIA E INTEGRAÇÕES (5 itens)
  ['Tecnologia e Integrações', 'Certificado Digital (e-CPF/e-CNPJ A1) incluso', 'Certificado digital A1 incluso', 150.00, 1.0, 'ANUAL'],
  ['Tecnologia e Integrações', 'Abertura de CNPJ (grátis ou com desconto)', 'Serviço de abertura de empresa', 300.00, 4.0, 'AVULSO'],
  ['Tecnologia e Integrações', 'Integração com bancos / Open Finance', 'Conexão com bancos via Open Finance', 200.00, 5.0, 'MENSAL'],
  ['Tecnologia e Integrações', 'Acesso a app mobile', 'Aplicativo mobile para gestão', 100.00, 2.0, 'MENSAL'],
  ['Tecnologia e Integrações', 'Integração com ERPs (Omie, Conta Azul...)', 'Integração com sistemas de gestão', 250.00, 6.0, 'MENSAL'],

  // BENEFÍCIOS E EXTRAS (7 itens)
  ['Benefícios e Extras', 'Acesso a conteúdo educativo contábil', 'Materiais educativos e treinamentos', 80.00, 2.0, 'MENSAL'],
  ['Benefícios e Extras', 'Acesso a eventos e webinars exclusivos', 'Participação em eventos exclusivos', 120.00, 3.0, 'MENSAL'],
  ['Benefícios e Extras', 'Network empresarial', 'Conexão com outros empresários', 150.00, 4.0, 'MENSAL'],
  ['Benefícios e Extras', 'Benefícios corporativos (academias, psicólogos)', 'Convênios com academias e psicólogos', 200.00, 5.0, 'MENSAL'],
  ['Benefícios e Extras', 'Planejamento patrimonial', 'Estratégia de proteção patrimonial', 500.00, 10.0, 'ANUAL'],
  ['Benefícios e Extras', 'Planejamento sucessório', 'Planejamento de sucessão empresarial', 600.00, 12.0, 'ANUAL'],
  ['Benefícios e Extras', 'Regularização fiscal retroativa', 'Regularização de débitos anteriores', 800.00, 15.0, 'AVULSO'],
];

// =================================================================
//  PLANOS COMERCIAIS
// =================================================================
const commercialPlans = [
  { name: 'Essencial', multiplier: 0.75, order: 1, color: '#94a3b8', badge: 'Básico', description: 'Plano essencial para pequenas empresas e MEI' },
  { name: 'Profissional', multiplier: 1.0, order: 2, color: '#3b82f6', badge: 'Mais Popular', description: 'Plano profissional para empresas em crescimento' },
  { name: 'Premium', multiplier: 1.2, order: 3, color: '#f59e0b', badge: 'Completo', description: 'Plano premium com todos os serviços inclusos' },
];

// =================================================================
// 🔗 MAPEAMENTO: PLANOS × ITENS
// =================================================================
const planItemsMapping = [
  // ESSENCIAL
  ['Essencial', 'Fiscal e Tributário', [
    'Apuração mensal de impostos',
    'Emissão de guias DAS / DASN',
    'Escrituração fiscal completa',
    'Declarações obrigatórias (DEFIS, PGDAS-D)',
    'Pró-labore dos sócios',
  ]],
  ['Essencial', 'Notas Fiscais', [
    'Plataforma para emissão própria de NF-e',
    'Emissão de NF pela equipe (até 10/mês)',
  ]],
  ['Essencial', 'Departamento Pessoal', [
    'Folha cobrada à parte (sem inclusão)',
  ]],
  ['Essencial', 'Relatórios e Análises', [
    'Balancete mensal',
    'Balanço patrimonial anual',
    'Acesso a painel web com documentos',
  ]],
  ['Essencial', 'Atendimento e Suporte', [
    'Atendimento via WhatsApp (8h-18h)',
    'Atendimento via e-mail (8h-18h)',
  ]],
  ['Essencial', 'Tecnologia e Integrações', [
    'Certificado Digital (e-CPF/e-CNPJ A1) incluso',
    'Abertura de CNPJ (grátis ou com desconto)',
    'Integração com bancos / Open Finance',
  ]],

  // PROFISSIONAL
  ['Profissional', 'Fiscal e Tributário', [
    'Planejamento tributário básico',
    'Apuração mensal impostos IBS e CBS',
  ]],
  ['Profissional', 'Notas Fiscais', [
    'Emissão de NF pela equipe (até 30/mês)',
  ]],
  ['Profissional', 'Departamento Pessoal', [
    'Folha de pagamento (até 3 funcionários)',
    'Geração de holerites e recibos',
    'E-Social completo',
    'GFIP / CAGED / RAIS / DIRF',
    'Até 2 recálculos de guias por mês',
  ]],
  ['Profissional', 'Relatórios e Análises', [
    'DRE simplificado',
    'Análise de fluxo de caixa básica',
  ]],
  ['Profissional', 'Atendimento e Suporte', [
    'Atendimento via telefone (8h-18h)',
    'Horário estendido (até 21h)',
  ]],
  ['Profissional', 'Reuniões e Consultoria', [
    'Reunião semestral de resultados',
    'Reunião trimestral de resultados',
  ]],
  ['Profissional', 'Tecnologia e Integrações', [
    'Acesso a app mobile',
    'Integração com ERPs (Omie, Conta Azul...)',
  ]],
  ['Profissional', 'Benefícios e Extras', [
    'Acesso a conteúdo educativo contábil',
  ]],

  // PREMIUM
  ['Premium', 'Fiscal e Tributário', [
    'Planejamento tributário estratégico',
    'Análise de enquadramento tributário',
    'Revisão de regime tributário anual',
    'Gestão de parcelamentos e débitos fiscais',
  ]],
  ['Premium', 'Notas Fiscais', [
    'Emissão de NF pela equipe (ilimitada)',
    'Importação de NF de fornecedores',
    'Análise de NCM',
  ]],
  ['Premium', 'Departamento Pessoal', [
    'Folha de pagamento ilimitada',
    'Gestão de férias',
    'Cálculo de rescisões',
    'B.I. Folha de Pagamento',
  ]],
  ['Premium', 'Relatórios e Análises', [
    'DRE detalhado com análise',
    'Fluxo de caixa projetado',
    'Análise de índices financeiros',
    'Relatório de gestão patrimonial',
    'Análise de viabilidade de investimentos',
  ]],
  ['Premium', 'Atendimento e Suporte', [
    'Tempo de resposta garantido (até 4h)',
    'Gestor / Assessor de conta dedicado',
    'Atendimento emergências 24h',
  ]],
  ['Premium', 'Reuniões e Consultoria', [
    'Reunião mensal com especialista',
    'Reunião mensal consultoria financeira',
    'Suporte em decisões de investimento',
    'Consultoria jurídica básica',
  ]],
  ['Premium', 'Benefícios e Extras', [
    'Acesso a eventos e webinars exclusivos',
    'Network empresarial',
    'Benefícios corporativos (academias, psicólogos)',
    'Planejamento patrimonial',
    'Planejamento sucessório',
    'Regularização fiscal retroativa',
  ]],
];

// =================================================================
// 🚀 EXECUÇÃO DO SEED
// =================================================================
async function main() {
  console.log('🚀 Iniciando seed de planos comerciais...\n');

  // Usar a primeira empresa disponível
  let company = await prisma.company.findFirst();
  if (!company) {
    console.log('❌ Nenhuma empresa encontrada no banco.');
    console.log(' Crie uma empresa primeiro ou use o seed principal.');
    return;
  }
  console.log(`✅ Empresa: ${company.name} (${company.id})\n`);

  // 1️⃣ Criar categorias (findOrCreate)
  console.log(' Criando categorias...');
  const categoryMap = new Map<string, string>();
  
  for (const cat of categories) {
    let category = await prisma.serviceCategory.findFirst({
      where: {
        companyId: company.id,
        name: cat.name,
      },
    });

    if (!category) {
      category = await prisma.serviceCategory.create({
        data: {
          companyId: company.id,
          name: cat.name,
          icon: cat.icon,
          order: cat.order,
          description: cat.description,
        },
      });
      console.log(`  ✅ ${cat.icon || ''} ${cat.name}`);
    } else {
      console.log(`  ✓ ${cat.icon || '📁'} ${cat.name} (já existe)`);
    }
    categoryMap.set(cat.name, category.id);
  }
  console.log('');

  // 2️⃣ Criar itens de serviço (findOrCreate)
  console.log('📦 Criando itens de serviço...');
  const itemMap = new Map<string, string>();
  
  for (const [categoryName, itemName, description, basePrice, estimatedHours, recurrence] of serviceItems) {
    const categoryId = categoryMap.get(categoryName);
    if (!categoryId) {
      console.error(` Categoria não encontrada: ${categoryName}`);
      continue;
    }

    let item = await prisma.serviceItem.findFirst({
      where: {
        companyId: company.id,
        name: itemName,
      },
    });

    if (!item) {
      item = await prisma.serviceItem.create({
        data: {
          companyId: company.id,
          categoryId,
          name: itemName,
          description,
          basePrice,
          estimatedHours,
          recurrence: recurrence as any,
          isActive: true,
        },
      });
      console.log(`  ✅ ${itemName}`);
    } else {
      // Atualizar se necessário
      await prisma.serviceItem.update({
        where: { id: item.id },
        data: {
          categoryId,
          basePrice,
          estimatedHours,
          recurrence: recurrence as any,
        },
      });
    }
    itemMap.set(itemName, item.id);
  }
  console.log('');

  // 3️⃣ Criar planos comerciais (findOrCreate)
  console.log(' Criando planos comerciais...');
  const planMap = new Map<string, string>();
  
  for (const plan of commercialPlans) {
    let commercialPlan = await prisma.commercialPlan.findFirst({
      where: {
        companyId: company.id,
        name: plan.name,
      },
    });

    if (!commercialPlan) {
      commercialPlan = await prisma.commercialPlan.create({
        data: {
          companyId: company.id,
          name: plan.name,
          multiplier: plan.multiplier,
          order: plan.order,
          color: plan.color,
          badge: plan.badge,
          description: plan.description,
          isIndependent: false,
        },
      });
      console.log(`  ✅ ${plan.name} (multiplicador: ${plan.multiplier})`);
    } else {
      console.log(`  ✓ ${plan.name} (já existe)`);
      // Atualizar
      await prisma.commercialPlan.update({
        where: { id: commercialPlan.id },
        data: {
          multiplier: plan.multiplier,
          order: plan.order,
          color: plan.color,
          badge: plan.badge,
          description: plan.description,
        },
      });
    }
    planMap.set(plan.name, commercialPlan.id);
  }
  console.log('');

  // 4️ Vincular itens aos planos
  console.log('🔗 Vinculando itens aos planos...');
  let totalLinks = 0;
  
  for (const [planName, categoryName, itemNames] of planItemsMapping) {
    const planId = planMap.get(planName);
    if (!planId) {
      console.error(`❌ Plano não encontrado: ${planName}`);
      continue;
    }

    for (const itemName of itemNames) {
      const itemId = itemMap.get(itemName);
      if (!itemId) {
        console.error(`❌ Item não encontrado: ${itemName}`);
        continue;
      }

      // Verificar se já existe o vínculo
      const existingLink = await prisma.planServiceItem.findFirst({
        where: {
          planId,
          serviceItemId: itemId,
        },
      });

      if (!existingLink) {
        await prisma.planServiceItem.create({
          data: {
            planId,
            serviceItemId: itemId,
            quantity: 1,
            discount: 0,
          },
        });
        totalLinks++;
      }
    }
    console.log(`  ✅ ${planName}: ${itemNames.length} itens de ${categoryName}`);
  }
  console.log('');

  // 5️⃣ Resumo final
  console.log('📊 RESUMO FINAL:');
  console.log(`  ✅ ${categories.length} categorias configuradas`);
  console.log(`  ✅ ${serviceItems.length} itens de serviço configurados`);
  console.log(`  ✅ ${commercialPlans.length} planos comerciais configurados`);
  console.log(`  ✅ ${totalLinks} novos vínculos plano-item criados`);
  console.log('\n🎉 Seed concluído com sucesso!');
}

main()
  .catch((e) => {
    console.error(' Erro no seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });