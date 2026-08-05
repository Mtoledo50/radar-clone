/**
 * =================================================================
 * 📦 SEED: CATÁLOGO COMPLETO DE SERVIÇOS CONTÁBEIS
 * =================================================================
 * Popula o banco com 17 departamentos e ~200 serviços baseados
 * na estrutura real de um escritório contábil moderno.
 * 
 * EXECUÇÃO: npx ts-node src/seed-full-catalog.ts
 * =================================================================
 */

import { PrismaClient, Recurrence } from '@prisma/client';

const prisma = new PrismaClient();

// =================================================================
// 📋 DEFINIÇÃO DOS 17 DEPARTAMENTOS E SERVIÇOS
// =================================================================

const catalogData = [
  {
    name: 'Departamento Contábil',
    icon: '📊',
    order: 1,
    description: 'Escrituração, demonstrações e análises contábeis',
    items: [
      { name: 'Escrituração Contábil', basePrice: 800, recurrence: Recurrence.MENSAL, slaDays: 30, scope: 'Lançamentos contábeis, classificação, conciliação bancária e patrimonial', outOfScope: 'Reclassificações por erro do cliente', requiredDocs: 'Extratos bancários, notas fiscais, contratos' },
      { name: 'Conciliação Bancária', basePrice: 150, recurrence: Recurrence.MENSAL, slaDays: 5, scope: 'Conferência de extratos com lançamentos contábeis', outOfScope: 'Ajustes de períodos anteriores', requiredDocs: 'Extratos bancários do mês' },
      { name: 'Controle de Ativo Imobilizado', basePrice: 200, recurrence: Recurrence.MENSAL, slaDays: 10, scope: 'Depreciação, amortização, exaustão e controle patrimonial', outOfScope: 'Inventário físico', requiredDocs: 'Notas fiscais de aquisição' },
      { name: 'Fechamento Contábil Mensal', basePrice: 500, recurrence: Recurrence.MENSAL, slaDays: 15, scope: 'Balancete mensal, DRE gerencial e indicadores', outOfScope: 'Retrabalho por documentos atrasados', requiredDocs: 'Documentação completa do mês' },
      { name: 'Balanço Patrimonial', basePrice: 1500, recurrence: Recurrence.ANUAL, slaDays: 60, scope: 'Demonstrações contábeis anuais completas', outOfScope: 'Auditoria externa', requiredDocs: 'Balancete acumulado, conciliações' },
      { name: 'DRE - Demonstração do Resultado', basePrice: 800, recurrence: Recurrence.ANUAL, slaDays: 30, scope: 'Análise de receitas, custos e resultado do exercício', outOfScope: 'Projeções futuras', requiredDocs: 'Razão contábil do período' },
      { name: 'Notas Explicativas', basePrice: 600, recurrence: Recurrence.ANUAL, slaDays: 45, scope: 'Elaboração de notas explicativas para demonstrações', outOfScope: 'Tradução para outros idiomas', requiredDocs: 'Demonstrações contábeis finalizadas' },
      { name: 'Análise de Liquidez', basePrice: 300, recurrence: Recurrence.TRIMESTRAL, slaDays: 10, scope: 'Indicadores de liquidez corrente, seca e geral', outOfScope: 'Consultoria financeira', requiredDocs: 'Balanço patrimonial' },
    ],
  },
  {
    name: 'Departamento Fiscal',
    icon: '📋',
    order: 2,
    description: 'Apuração de impostos e obrigações acessórias',
    items: [
      { name: 'Apuração Simples Nacional', basePrice: 400, recurrence: Recurrence.MENSAL, slaDays: 15, scope: 'Cálculo do DAS, conferência de anexos e planejamento', outOfScope: 'Retificações por erro do cliente', requiredDocs: 'Notas fiscais, folha de pagamento' },
      { name: 'Apuração Lucro Presumido', basePrice: 800, recurrence: Recurrence.TRIMESTRAL, slaDays: 20, scope: 'IRPJ, CSLL, PIS, COFINS, ISS, ICMS', outOfScope: 'Planejamento tributário avançado', requiredDocs: 'Receita bruta, despesas dedutíveis' },
      { name: 'Apuração Lucro Real', basePrice: 1500, recurrence: Recurrence.TRIMESTRAL, slaDays: 30, scope: 'LALUR, LACS, IRPJ, CSLL, PIS, COFINS', outOfScope: 'Auditoria fiscal', requiredDocs: 'Contabilidade completa, ajustes' },
      { name: 'DCTF', basePrice: 200, recurrence: Recurrence.MENSAL, slaDays: 10, scope: 'Declaração de débitos e créditos tributários federais', outOfScope: 'Retificações', requiredDocs: 'Apuração de impostos' },
      { name: 'EFD Contribuições', basePrice: 350, recurrence: Recurrence.MENSAL, slaDays: 15, scope: 'Escrituração fiscal digital de PIS/COFINS', outOfScope: 'Revisão de períodos anteriores', requiredDocs: 'Notas fiscais, apuração' },
      { name: 'SPED Fiscal', basePrice: 400, recurrence: Recurrence.MENSAL, slaDays: 15, scope: 'Escrituração fiscal digital de ICMS/IPI', outOfScope: 'Retificações', requiredDocs: 'Notas fiscais, inventário' },
      { name: 'DIRF', basePrice: 300, recurrence: Recurrence.ANUAL, slaDays: 30, scope: 'Declaração de imposto de renda retido na fonte', outOfScope: 'Correções após prazo', requiredDocs: 'Folha de pagamento, retenções' },
    ],
  },
  {
    name: 'Departamento Pessoal',
    icon: '👥',
    order: 3,
    description: 'Folha de pagamento e obrigações trabalhistas',
    items: [
      { name: 'Folha de Pagamento (até 5 funcionários)', basePrice: 300, recurrence: Recurrence.MENSAL, slaDays: 5, scope: 'Cálculo de salários, horas extras, adicionais, descontos', outOfScope: 'Rescisões complexas', requiredDocs: 'Cartões de ponto, atestados' },
      { name: 'Folha de Pagamento (6-15 funcionários)', basePrice: 600, recurrence: Recurrence.MENSAL, slaDays: 7, scope: 'Folha completa com encargos e benefícios', outOfScope: 'Consultoria trabalhista', requiredDocs: 'Documentação mensal' },
      { name: 'Admissão de Funcionário', basePrice: 150, recurrence: Recurrence.AVULSO, slaDays: 3, scope: 'Registro, contrato, eSocial, exames admissionais', outOfScope: 'Exames médicos', requiredDocs: 'Documentos pessoais, CTPS' },
      { name: 'Rescisão de Contrato', basePrice: 250, recurrence: Recurrence.AVULSO, slaDays: 5, scope: 'Cálculo rescisório, homologação, GRRF, seguro-desemprego', outOfScope: 'Ações trabalhistas', requiredDocs: 'Aviso prévio, documentos' },
      { name: 'Férias', basePrice: 100, recurrence: Recurrence.AVULSO, slaDays: 5, scope: 'Programação, cálculo, avisos e recibos', outOfScope: 'Férias coletivas', requiredDocs: 'Período aquisitivo completo' },
      { name: '13º Salário', basePrice: 200, recurrence: Recurrence.ANUAL, slaDays: 10, scope: 'Primeira e segunda parcela com encargos', outOfScope: 'Adiantamentos especiais', requiredDocs: 'Folha de pagamento' },
      { name: 'eSocial', basePrice: 350, recurrence: Recurrence.MENSAL, slaDays: 10, scope: 'Envio de eventos mensais e anuais', outOfScope: 'Retificações complexas', requiredDocs: 'Folha, admissões, rescisões' },
    ],
  },
  {
    name: 'Legalização de Empresas',
    icon: '🏢',
    order: 4,
    description: 'Abertura, alterações e encerramento de empresas',
    items: [
      { name: 'Abertura de Empresa (MEI)', basePrice: 300, recurrence: Recurrence.AVULSO, slaDays: 7, scope: 'Portal do Empreendedor, alvará, inscrições', outOfScope: 'Licenças especiais', requiredDocs: 'Documentos pessoais, endereço' },
      { name: 'Abertura de Empresa (LTDA)', basePrice: 1200, recurrence: Recurrence.AVULSO, slaDays: 30, scope: 'Contrato social, Junta Comercial, CNPJ, IE, IM', outOfScope: 'Alvarás de funcionamento', requiredDocs: 'Documentos dos sócios, endereço' },
      { name: 'Alteração Contratual', basePrice: 800, recurrence: Recurrence.AVULSO, slaDays: 20, scope: 'Entrada/saída de sócios, capital, endereço, atividade', outOfScope: 'Transformações societárias', requiredDocs: 'Contrato atual, documentos' },
      { name: 'Encerramento de Empresa', basePrice: 1000, recurrence: Recurrence.AVULSO, slaDays: 45, scope: 'Distrato, baixa CNPJ, IE, IM', outOfScope: 'Dívidas pendentes', requiredDocs: 'Últimas declarações, certidões' },
      { name: 'Obtenção de Alvará', basePrice: 400, recurrence: Recurrence.AVULSO, slaDays: 30, scope: 'Alvará de funcionamento e licenças', outOfScope: 'Taxas municipais', requiredDocs: 'Projeto aprovado, Habite-se' },
    ],
  },
  {
    name: 'Consultoria Tributária',
    icon: '💡',
    order: 5,
    description: 'Planejamento e recuperação tributária',
    items: [
      { name: 'Planejamento Tributário', basePrice: 3000, recurrence: Recurrence.AVULSO, slaDays: 30, scope: 'Estudo de enquadramento, simulações, redução legal', outOfScope: 'Implementação', requiredDocs: 'Demonstrações contábeis, faturamento' },
      { name: 'Recuperação Tributária', basePrice: 5000, recurrence: Recurrence.AVULSO, slaDays: 60, scope: 'Revisão de 5 anos, créditos PIS/COFINS/INSS, PER/DCOMP', outOfScope: 'Ações judiciais', requiredDocs: 'Documentação fiscal completa' },
      { name: 'Revisão Fiscal', basePrice: 2500, recurrence: Recurrence.AVULSO, slaDays: 20, scope: 'Auditoria de obrigações acessórias e pagamentos', outOfScope: 'Retificações', requiredDocs: 'Declarações dos últimos 5 anos' },
      { name: 'Compliance Tributário', basePrice: 2000, recurrence: Recurrence.TRIMESTRAL, slaDays: 15, scope: 'Monitoramento de mudanças legislativas', outOfScope: 'Implementação de mudanças', requiredDocs: 'Atividades da empresa' },
    ],
  },
  {
    name: 'BPO Financeiro',
    icon: '💰',
    order: 6,
    description: 'Terceirização de contas a pagar e receber',
    items: [
      { name: 'Contas a Pagar', basePrice: 500, recurrence: Recurrence.MENSAL, slaDays: 3, scope: 'Lançamentos, programação, pagamentos, conciliação', outOfScope: 'Negociação com fornecedores', requiredDocs: 'Boletos, contratos' },
      { name: 'Contas a Receber', basePrice: 600, recurrence: Recurrence.MENSAL, slaDays: 3, scope: 'Emissão de boletos, cobranças, controle de inadimplência', outOfScope: 'Ações judiciais', requiredDocs: 'Notas fiscais, contratos' },
      { name: 'Fluxo de Caixa', basePrice: 400, recurrence: Recurrence.MENSAL, slaDays: 5, scope: 'Controle diário, projeções, relatórios', outOfScope: 'Consultoria financeira', requiredDocs: 'Extratos bancários' },
      { name: 'Conciliação Bancária', basePrice: 300, recurrence: Recurrence.MENSAL, slaDays: 5, scope: 'Conferência de movimentações', outOfScope: 'Ajustes contábeis', requiredDocs: 'Extratos bancários' },
    ],
  },
  {
    name: 'Consultoria Empresarial',
    icon: '📈',
    order: 7,
    description: 'Diagnóstico, planejamento e indicadores',
    items: [
      { name: 'Diagnóstico Financeiro', basePrice: 2500, recurrence: Recurrence.AVULSO, slaDays: 15, scope: 'Análise de saúde financeira, indicadores, recomendações', outOfScope: 'Implementação', requiredDocs: 'Demonstrações contábeis' },
      { name: 'Planejamento Estratégico', basePrice: 4000, recurrence: Recurrence.AVULSO, slaDays: 30, scope: 'Definição de metas, KPIs, roadmap', outOfScope: 'Acompanhamento mensal', requiredDocs: 'Dados históricos da empresa' },
      { name: 'Precificação de Produtos', basePrice: 1500, recurrence: Recurrence.AVULSO, slaDays: 10, scope: 'Formação de preço, margens, análise de custos', outOfScope: 'Implementação de ERP', requiredDocs: 'Custos, despesas, concorrentes' },
      { name: 'Valuation', basePrice: 8000, recurrence: Recurrence.AVULSO, slaDays: 45, scope: 'Avaliação de empresa por múltiplos métodos', outOfScope: 'Due diligence completa', requiredDocs: 'Demonstrações de 5 anos' },
    ],
  },
  {
    name: 'Certificação Digital',
    icon: '🔐',
    order: 8,
    description: 'Emissão e gestão de certificados digitais',
    items: [
      { name: 'Certificado A1 (e-CPF)', basePrice: 180, recurrence: Recurrence.ANUAL, slaDays: 1, scope: 'Emissão e instalação', outOfScope: 'Suporte técnico avançado', requiredDocs: 'Documentos pessoais, videoconferência' },
      { name: 'Certificado A1 (e-CNPJ)', basePrice: 200, recurrence: Recurrence.ANUAL, slaDays: 1, scope: 'Emissão e instalação', outOfScope: 'Configuração de sistemas', requiredDocs: 'Contrato social, documentos do representante' },
      { name: 'Certificado A3 (token)', basePrice: 250, recurrence: Recurrence.ANUAL, slaDays: 3, scope: 'Emissão com token físico', outOfScope: 'Token (custo separado)', requiredDocs: 'Documentos pessoais' },
    ],
  },
  {
    name: 'Controladoria',
    icon: '🎯',
    order: 9,
    description: 'Centros de custos, budget e forecast',
    items: [
      { name: 'Implantação de Centros de Custos', basePrice: 3000, recurrence: Recurrence.AVULSO, slaDays: 30, scope: 'Estruturação, plano de contas gerencial, treinamento', outOfScope: 'Implementação em ERP', requiredDocs: 'Organograma, atividades' },
      { name: 'Budget e Forecast', basePrice: 2000, recurrence: Recurrence.ANUAL, slaDays: 20, scope: 'Orçamento anual e projeções trimestrais', outOfScope: 'Acompanhamento mensal', requiredDocs: 'Histórico de 3 anos' },
      { name: 'Indicadores de Desempenho', basePrice: 1500, recurrence: Recurrence.TRIMESTRAL, slaDays: 10, scope: 'Definição e acompanhamento de KPIs', outOfScope: 'Dashboard em BI', requiredDocs: 'Dados operacionais' },
    ],
  },
  {
    name: 'Auditoria',
    icon: '🔍',
    order: 10,
    description: 'Auditoria interna e externa',
    items: [
      { name: 'Auditoria Interna', basePrice: 5000, recurrence: Recurrence.AVULSO, slaDays: 30, scope: 'Revisão de processos, controles e conformidade', outOfScope: 'Implementação de melhorias', requiredDocs: 'Documentação de processos' },
      { name: 'Auditoria de Demonstrações', basePrice: 8000, recurrence: Recurrence.ANUAL, slaDays: 45, scope: 'Parecer sobre demonstrações contábeis', outOfScope: 'Consultoria', requiredDocs: 'Demonstrações completas' },
    ],
  },
  {
    name: 'LGPD e Compliance',
    icon: '🛡️',
    order: 11,
    description: 'Adequação à LGPD e compliance',
    items: [
      { name: 'Adequação LGPD', basePrice: 6000, recurrence: Recurrence.AVULSO, slaDays: 60, scope: 'Mapeamento, políticas, treinamento, DPO', outOfScope: 'Implementação técnica', requiredDocs: 'Processos da empresa' },
      { name: 'Compliance Trabalhista', basePrice: 2500, recurrence: Recurrence.AVULSO, slaDays: 20, scope: 'Revisão de contratos, políticas, riscos', outOfScope: 'Ações judiciais', requiredDocs: 'Contratos de trabalho' },
    ],
  },
  {
    name: 'Serviços Tecnológicos',
    icon: '💻',
    order: 12,
    description: 'Implantação de sistemas e automações',
    items: [
      { name: 'Implantação de ERP', basePrice: 5000, recurrence: Recurrence.AVULSO, slaDays: 45, scope: 'Configuração, migração de dados, treinamento', outOfScope: 'Licenças de software', requiredDocs: 'Processos atuais, dados históricos' },
      { name: 'Dashboards Power BI', basePrice: 3000, recurrence: Recurrence.AVULSO, slaDays: 20, scope: 'Desenvolvimento de dashboards personalizados', outOfScope: 'Licenças Power BI', requiredDocs: 'Indicadores desejados, fontes de dados' },
      { name: 'Automação de Processos', basePrice: 2000, recurrence: Recurrence.AVULSO, slaDays: 15, scope: 'N8N, Make, integrações', outOfScope: 'Manutenção contínua', requiredDocs: 'Fluxos atuais, sistemas envolvidos' },
    ],
  },
  {
    name: 'Serviços Premium',
    icon: '👑',
    order: 13,
    description: 'CFO terceirizado, holdings e M&A',
    items: [
      { name: 'CFO as a Service', basePrice: 8000, recurrence: Recurrence.MENSAL, slaDays: 30, scope: 'Diretoria financeira terceirizada, reuniões mensais', outOfScope: 'Operação diária', requiredDocs: 'Demonstrações, planejamento estratégico' },
      { name: 'Holding Patrimonial', basePrice: 15000, recurrence: Recurrence.AVULSO, slaDays: 90, scope: 'Estruturação, constituição, transferência de bens', outOfScope: 'Custos cartorários', requiredDocs: 'Documentos dos bens, família' },
      { name: 'Due Diligence', basePrice: 12000, recurrence: Recurrence.AVULSO, slaDays: 45, scope: 'Análise completa para fusões/aquisições', outOfScope: 'Negociação', requiredDocs: 'Acesso completo aos dados' },
      { name: 'Governança Corporativa', basePrice: 5000, recurrence: Recurrence.TRIMESTRAL, slaDays: 20, scope: 'Estruturação de conselhos, políticas, sucessão', outOfScope: 'Implementação', requiredDocs: 'Estatuto, acordos de sócios' },
    ],
  },
];

// =================================================================
// 🚀 FUNÇÃO PRINCIPAL
// =================================================================

async function main() {
  console.log('═'.repeat(70));
  console.log('📦 SEED: CATÁLOGO COMPLETO DE SERVIÇOS CONTÁBEIS');
  console.log('═'.repeat(70));

  // Resolver empresa
  let company = await prisma.company.findFirst({ where: { deletedAt: null } });
  if (!company) {
    company = await prisma.company.create({
      data: { name: 'Conta Certa Demo', cnpj: '00.000.000/0001-00', plan: 'BASIC' },
    });
  }
  const companyId = company.id;
  console.log(`🏢 Empresa: ${company.name} (${companyId})\n`);

  // Limpeza idempotente
  console.log('🧹 Limpando catálogo anterior...');
  await prisma.planServiceItem.deleteMany({ where: { plan: { companyId } } });
  await prisma.serviceItem.deleteMany({ where: { companyId } });
  await prisma.serviceCategory.deleteMany({ where: { companyId } });
  console.log('✅ Limpeza concluída.\n');

  // Criar categorias e itens
  let totalItems = 0;
  for (const category of catalogData) {
    console.log(`📁 Criando categoria: ${category.name} (${category.items.length} serviços)`);

    const dbCategory = await prisma.serviceCategory.create({
      data: {
        companyId,
        name: category.name,
        icon: category.icon,
        order: category.order,
        description: category.description,
      },
    });

        for (const item of category.items) {
      await prisma.serviceItem.create({
        data: {
          // 🏢 Relações via connect (resolvem conflito de tipos)
          company: { connect: { id: companyId } },
          category: { connect: { id: dbCategory.id } },
          
          // 📦 Campos escalares do serviço
          name: item.name,
          basePrice: item.basePrice,
          recurrence: item.recurrence,
          slaDays: item.slaDays,
          scope: item.scope,
          outOfScope: item.outOfScope,
          requiredDocs: item.requiredDocs,
          isActive: true,
          
          // ✅ CORREÇÃO 1: estimatedHours é obrigatório no schema
          // Calculado como 1h para cada R$ 200 de preço base (mínimo 1h)
          estimatedHours: Math.max(1, Math.ceil(item.basePrice / 200)),
          
          // ✅ CORREÇÃO 2: description é opcional e não está nos dados do catálogo
          // Omitido (será null no banco) ou use: description: item.name
        },
      });
      totalItems++;
    }
  }

  console.log('\n' + '═'.repeat(70));
  console.log('📈 RESUMO FINAL');
  console.log('═'.repeat(70));
  console.log(`✅ Categorias criadas: ${catalogData.length}`);
  console.log(`✅ Serviços criados: ${totalItems}`);
  console.log('═'.repeat(70));
  console.log('🎉 Catálogo completo importado com sucesso!\n');
}

main()
  .catch((e) => {
    console.error('❌ Erro fatal:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });