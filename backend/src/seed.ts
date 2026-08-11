/**
 * =================================================================
 * 🌱 RADAR CONTA CERTA - SEED ENTERPRISE (CATÁLOGO DE SERVIÇOS)
 * =================================================================
 * Descrição: Popula o banco com categorias, itens detalhados e planos.
 * Foco: SaaS Contábil (MEI, IRPF, B2B, Avulsos).
 * Execução: npx prisma db seed
 * =================================================================
 */
import { PrismaClient, Recurrence } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 [SEED] Iniciando população do Catálogo de Serviços Enterprise...\n');

  // =================================================================
  // 1. RESOLUÇÃO DO TENANT (EMPRESA)
  // =================================================================
  // Busca a primeira empresa ativa. Se não existir, cria uma Demo.
  let company = await prisma.company.findFirst({
    where: { deletedAt: null },
    orderBy: { createdAt: 'asc' }
  });

  if (!company) {
    console.log('⚠️ Nenhuma empresa encontrada. Criando Empresa Demo...');
    company = await prisma.company.create({
      data: {
        name: 'Conta Certa Contabilidade Demo',
        cnpj: '00.000.000/0001-00',
        email: 'contato@contacerta.com.br',
        state: 'SP',
        plan: 'BASIC',
      }
    });
  }
  console.log(`🏢 Tenant vinculado: ${company.name} (${company.id})\n`);

  // =================================================================
  // 2. LIMPEZA IDEMPOTENTE (Evita duplicatas em re-execuções)
  // =================================================================
  console.log('🧹 Limpando catálogo anterior da empresa para evitar duplicatas...');
  
  await prisma.planServiceItem.deleteMany({
    where: { plan: { companyId: company.id } }
  });
  await prisma.serviceItem.deleteMany({ where: { companyId: company.id } });
  await prisma.serviceCategory.deleteMany({ where: { companyId: company.id } });
  await prisma.commercialPlan.deleteMany({ where: { companyId: company.id } });
  
  console.log('✅ Limpeza concluída.\n');

  // =================================================================
  // 3. CRIAÇÃO DE CATEGORIAS (Portfólio Completo)
  // =================================================================
  console.log('📂 Criando categorias de serviços...');
  
  const categories = await Promise.all([
    prisma.serviceCategory.create({
      data: { companyId: company.id, name: 'MEI', icon: 'User', order: 1, description: 'Serviços para Microempreendedor Individual' }
    }),
    prisma.serviceCategory.create({
      data: { companyId: company.id, name: 'IRPF', icon: 'FileText', order: 2, description: 'Imposto de Renda Pessoa Física' }
    }),
    prisma.serviceCategory.create({
      data: { companyId: company.id, name: 'Societário e Legalização', icon: 'Building', order: 3, description: 'Abertura, alteração e baixa de empresas' }
    }),
    prisma.serviceCategory.create({
      data: { companyId: company.id, name: 'Fiscal e Tributário', icon: 'Calculator', order: 4, description: 'Apuração de impostos e obrigações acessórias' }
    }),
    prisma.serviceCategory.create({
      data: { companyId: company.id, name: 'Departamento Pessoal', icon: 'Users', order: 5, description: 'Folha de pagamento e eSocial' }
    }),
    prisma.serviceCategory.create({
      data: { companyId: company.id, name: 'Contábil', icon: 'BookOpen', order: 6, description: 'Escrituração e demonstrações financeiras' }
    }),
  ]);

  console.log(`✅ ${categories.length} categorias criadas.\n`);

  // Helper para facilitar a criação de itens
  const createItem = (categoryId: string, data: any) => 
    prisma.serviceItem.create({ data: { companyId: company.id, categoryId, ...data } });

  // =================================================================
  // 4. CRIAÇÃO DE ITENS DE SERVIÇO (COM ESCOPO DETALHADO)
  // =================================================================
  console.log('📦 Criando itens de serviço com escopo detalhado...');

  const items = await Promise.all([
    // --- MEI ---
    createItem(categories[0].id, {
      name: 'Abertura de MEI',
      description: 'Formalização completa do Microempreendedor Individual.',
      scope: 'Consulta de viabilidade, registro no Portal do Empreendedor, emissão de CCMEI e orientação inicial.',
      outOfScope: 'Emissão de alvarás sanitários, ambientais ou licenças especiais da prefeitura.',
      requiredDocs: 'RG, CPF, Comprovante de Residência, IPTU do endereço comercial (se houver).',
      basePrice: 150.00, estimatedHours: 1.5, slaDays: 2, recurrence: Recurrence.AVULSO, order: 1
    }),
    createItem(categories[0].id, {
      name: 'DASN-SIMEI (Declaração Anual)',
      description: 'Entrega da declaração anual de faturamento do MEI.',
      scope: 'Levantamento de receitas do ano-calendário, transmissão da DASN-SIMEI e geração do recibo.',
      outOfScope: 'Retificação por omissão de documentos ou erro imputável ao cliente.',
      requiredDocs: 'Extratos bancários, notas fiscais emitidas, relatório de receitas mensais.',
      basePrice: 80.00, estimatedHours: 1.0, slaDays: 3, recurrence: Recurrence.ANUAL, order: 2
    }),
    createItem(categories[0].id, {
      name: 'Apuração Mensal e Emissão de DAS',
      description: 'Geração mensal da guia de impostos do MEI.',
      scope: 'Emissão da guia DAS até o dia 20 de cada mês e envio via WhatsApp/Email.',
      outOfScope: 'Pagamento da guia (responsabilidade do cliente).',
      requiredDocs: 'Confirmação de faturamento mensal (ou ausência de movimento).',
      basePrice: 30.00, estimatedHours: 0.2, slaDays: 1, recurrence: Recurrence.MENSAL, order: 3
    }),

    // --- IRPF ---
    createItem(categories[1].id, {
      name: 'IRPF - Declaração Simples',
      description: 'Declaração para contribuintes com rendimentos apenas de salários e poucos bens.',
      scope: 'Importação de informes de rendimentos, cadastro de dependentes, transmissão.',
      outOfScope: 'Análise de ganho de capital, rendimentos variáveis ou exterior.',
      requiredDocs: 'Informe de rendimentos, CPF de dependentes, dados bancários para restituição.',
      basePrice: 150.00, estimatedHours: 1.5, slaDays: 3, recurrence: Recurrence.AVULSO, order: 1
    }),
    createItem(categories[1].id, {
      name: 'IRPF - Declaração Completa',
      description: 'Declaração com análise de deduções legais, bens e direitos.',
      scope: 'Análise de recibos médicos, escolares, previdência privada, bens e dívidas.',
      outOfScope: 'Defesa contra malha fina por documentos inidôneos, retificações posteriores.',
      requiredDocs: 'Todos os informes, recibos médicos/educacionais, extratos bancários, IPTU/IPVA.',
      basePrice: 350.00, estimatedHours: 3.0, slaDays: 5, recurrence: Recurrence.AVULSO, order: 2
    }),

    // --- SOCIETÁRIO ---
    createItem(categories[2].id, {
      name: 'Abertura de Empresa (LTDA/ME/EPP)',
      description: 'Processo completo de constituição societária.',
      scope: 'Elaboração de contrato social, registro na Junta Comercial, CNPJ, Inscrição Estadual/Municipal.',
      outOfScope: 'Taxas da Junta Comercial, cartórios, alvarás de bombeiros e sanitários.',
      requiredDocs: 'Documentos pessoais dos sócios, IPTU, consulta prévia de viabilidade aprovada.',
      basePrice: 800.00, estimatedHours: 10.0, slaDays: 15, recurrence: Recurrence.AVULSO, order: 1
    }),

    // --- FISCAL ---
    createItem(categories[3].id, {
      name: 'Apuração Fiscal Mensal (Simples/LP)',
      description: 'Cálculo dos impostos federais, estaduais e municipais.',
      scope: 'Apuração de PIS, COFINS, IRPJ, CSLL, ICMS, ISS. Geração das guias de recolhimento.',
      outOfScope: 'Pagamento das guias, defesa em autuações fiscais.',
      requiredDocs: 'Notas fiscais, extratos bancários, relatórios de faturamento.',
      basePrice: 300.00, estimatedHours: 4.0, slaDays: 5, recurrence: Recurrence.MENSAL, order: 1
    }),

    // --- DP ---
    createItem(categories[4].id, {
      name: 'Folha de Pagamento (Até 5 funcionários)',
      description: 'Processamento mensal da folha e eventos de eSocial.',
      scope: 'Cálculo de salários, pró-labore, férias, 13º, rescisões e envio do eSocial.',
      outOfScope: 'Afastamentos pelo INSS superiores a 15 dias (cobrado à parte).',
      requiredDocs: 'Relatório de ponto, atestados, recibos de benefícios.',
      basePrice: 250.00, estimatedHours: 3.0, slaDays: 3, recurrence: Recurrence.MENSAL, order: 1
    }),

    // --- CONTÁBIL ---
    createItem(categories[5].id, {
      name: 'Escrituração Contábil Mensal',
      description: 'Lançamentos contábeis e conciliação.',
      scope: 'Classificação de documentos, conciliação bancária, balancete mensal.',
      outOfScope: 'Auditoria independente, relatórios gerenciais complexos fora do padrão.',
      requiredDocs: 'Extratos bancários, comprovantes de despesas e receitas.',
      basePrice: 400.00, estimatedHours: 5.0, slaDays: 10, recurrence: Recurrence.MENSAL, order: 1
    }),
  ]);

  console.log(`✅ ${items.length} itens de serviço criados com riqueza de detalhes.\n`);

  // =================================================================
  // 5. CRIAÇÃO DE PLANOS COMERCIAIS (PACOTES B2B)
  // =================================================================
  console.log('💼 Criando planos comerciais (Pacotes Recorrentes)...');

  const plans = await Promise.all([
    prisma.commercialPlan.create({
      data: {
        companyId: company.id, name: 'START', multiplier: 0.8, order: 1,
        badge: 'ESSENCIAL', color: '#64748b',
        description: 'Para empresas em início de operação. Foco em compliance básico.',
      },
    }),
    prisma.commercialPlan.create({
      data: {
        companyId: company.id, name: 'PRIME', multiplier: 1.0, order: 2,
        badge: 'MAIS POPULAR', color: '#14b8a6',
        description: 'Para empresas em crescimento. Inclui relatórios gerenciais.',
      },
    }),
    prisma.commercialPlan.create({
      data: {
        companyId: company.id, name: 'BLACK', multiplier: 1.4, order: 3,
        badge: 'PREMIUM', color: '#8b5cf6',
        description: 'Atendimento VIP com consultoria tributária estratégica mensal.',
      },
    }),
  ]);

  console.log(`✅ ${plans.length} planos criados.\n`);

  // =================================================================
  // 6. ASSOCIAÇÃO DE ITENS AOS PLANOS (Matriz de Oferta)
  // =================================================================
  console.log('🔗 Montando matriz de escopo dos planos...');

  // Itens recorrentes elegíveis para planos B2B
  const fiscalItem = items.find(i => i.name.includes('Apuração Fiscal'));
  const dpItem = items.find(i => i.name.includes('Folha de Pagamento'));
  const contabilItem = items.find(i => i.name.includes('Escrituração Contábil'));

  // START: Fiscal Básico + DP Básico
  if (fiscalItem && dpItem) {
    await prisma.planServiceItem.createMany({
      data: [
        { planId: plans[0].id, serviceItemId: fiscalItem.id },
        { planId: plans[0].id, serviceItemId: dpItem.id },
      ],
      skipDuplicates: true
    });
  }

  // PRIME: START + Contábil
  if (fiscalItem && dpItem && contabilItem) {
    await prisma.planServiceItem.createMany({
      data: [
        { planId: plans[1].id, serviceItemId: fiscalItem.id },
        { planId: plans[1].id, serviceItemId: dpItem.id },
        { planId: plans[1].id, serviceItemId: contabilItem.id },
      ],
      skipDuplicates: true
    });
  }

  // BLACK: Todos os itens recorrentes
  for (const item of items.filter(i => i.recurrence === Recurrence.MENSAL)) {
    await prisma.planServiceItem.create({
      data: { planId: plans[2].id, serviceItemId: item.id }
    });
  }

  console.log('✅ Matriz de escopo montada.\n');
  console.log('🎉 Seed Enterprise concluído com sucesso!');
  console.log('💡 Dica: Itens como MEI e IRPF ficaram disponíveis como "Serviços Avulsos" para venda rápida.');
}

main()
  .catch((e) => {
    console.error('❌ Erro fatal no seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });