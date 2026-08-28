/**
 * =================================================================
 * SEED: Catálogo de Serviços + Planos Comerciais
 * =================================================================
 * 
 * 🎯 PROPÓSITO:
 * Popular o sistema com o catálogo completo de serviços contábeis
 * e os planos comerciais (START, PRIME, BLACK, ENTERPRISE).
 * 
 * 🚀 COMO EXECUTAR:
 * cd backend
 * npx ts-node prisma/seed-catalogo.ts
 * 
 * =================================================================
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// =================================================================
// 📦 DADOS: 17 Categorias/Departamentos Contábeis
// =================================================================
const categorias = [
  { name: 'Contábil', order: 1, description: 'Serviços de contabilidade geral e escrituração' },
  { name: 'Fiscal', order: 2, description: 'Apuração de impostos e obrigações fiscais' },
  { name: 'Pessoal (DP)', order: 3, description: 'Departamento Pessoal, folha e encargos' },
  { name: 'Societário', order: 4, description: 'Contratos sociais, alterações e dissoluções' },
  { name: 'Legalização', order: 5, description: 'Registro e manutenção de empresas' },
  { name: 'BPO Financeiro', order: 6, description: 'Terceirização de contas a pagar/receber' },
  { name: 'Consultoria', order: 7, description: 'Consultoria contábil e tributária' },
  { name: 'Auditoria', order: 8, description: 'Auditoria contábil e revisão de procedimentos' },
  { name: 'Controladoria', order: 9, description: 'Controladoria e gestão financeira' },
  { name: 'LGPD', order: 10, description: 'Adequação à Lei Geral de Proteção de Dados' },
  { name: 'Tecnologia', order: 11, description: 'Sistemas e automação contábil' },
  { name: 'MEI', order: 12, description: 'Serviços específicos para Microempreendedores' },
  { name: 'IRPF', order: 13, description: 'Imposto de Renda Pessoa Física' },
  { name: 'Importação/Exportação', order: 14, description: 'Comércio exterior e aduana' },
  { name: 'Agronegócio', order: 15, description: 'Contabilidade rural e agropecuária' },
  { name: 'Startup', order: 16, description: 'Serviços para startups e empresas de tecnologia' },
  { name: 'Premium', order: 17, description: 'Serviços exclusivos e personalizados' },
];

// =================================================================
// 📦 DADOS: ~60 Serviços distribuídos por categoria
// =================================================================
const servicosPorCategoria: Record<string, Array<{
  name: string;
  description: string;
  scope: string;
  outOfScope: string;
  documents: string;
  basePrice: number;
}>> = {
  'Contábil': [
    {
      name: 'Escrituração Contábil Mensal',
      description: 'Registro de todas as operações contábeis do mês',
      scope: 'Lançamentos contábeis, balancete, razão',
      outOfScope: 'Conciliação bancária, DRE gerencial',
      documents: 'Extratos bancários, notas fiscais, comprovantes',
      basePrice: 800,
    },
    {
      name: 'Fechamento Contábil Anual',
      description: 'Encerramento do exercício contábil',
      scope: 'Balanço patrimonial, DRE, DMPL, DFCA',
      outOfScope: 'Auditoria independente',
      documents: 'Todos os documentos do exercício',
      basePrice: 2500,
    },
    {
      name: 'Conciliação Bancária',
      description: 'Conferência entre extrato bancário e contabilidade',
      scope: 'Conciliação de todas as contas bancárias',
      outOfScope: 'Investigação de divergências complexas',
      documents: 'Extratos bancários completos',
      basePrice: 300,
    },
    {
      name: 'Análise de Balanço',
      description: 'Análise detalhada das demonstrações contábeis',
      scope: 'Relatório de análise com índices e recomendações',
      outOfScope: 'Consultoria estratégica',
      documents: 'Balanço patrimonial e DRE',
      basePrice: 600,
    },
  ],

  'Fiscal': [
    {
      name: 'Apuração de ICMS',
      description: 'Cálculo mensal do ICMS a pagar',
      scope: 'Apuração, guia, declaração',
      outOfScope: 'Defesa fiscal em caso de autuação',
      documents: 'Notas fiscais de entrada e saída',
      basePrice: 500,
    },
    {
      name: 'Apuração de ISS',
      description: 'Cálculo mensal do ISS para prestadores de serviço',
      scope: 'Apuração, guia, declaração',
      outOfScope: 'Acompanhamento de fiscalizações',
      documents: 'Notas fiscais de serviço emitidas',
      basePrice: 400,
    },
    {
      name: 'Declaração de Imposto de Renda PJ (Lucro Presumido)',
      description: 'Apuração trimestral do IRPJ e CSLL',
      scope: 'Cálculo, guia, declaração',
      outOfScope: 'Planejamento tributário',
      documents: 'DRE trimestral, notas fiscais',
      basePrice: 700,
    },
    {
      name: 'SPED Fiscal',
      description: 'Escrituração fiscal digital',
      scope: 'Geração e transmissão do arquivo SPED',
      outOfScope: 'Correção de erros após transmissão',
      documents: 'Todas as notas fiscais do período',
      basePrice: 600,
    },
    {
      name: 'SPED Contábil',
      description: 'Escrituração contábil digital',
      scope: 'Geração e transmissão do arquivo SPED',
      outOfScope: 'Auditoria do arquivo',
      documents: 'Livros contábeis do exercício',
      basePrice: 800,
    },
    {
      name: 'DCTF Mensal',
      description: 'Declaração de Débitos e Créditos Tributários Federais',
      scope: 'Preenchimento e transmissão',
      outOfScope: 'Regularização de débitos',
      documents: 'Apurações de impostos federais',
      basePrice: 350,
    },
  ],

  'Pessoal (DP)': [
    {
      name: 'Folha de Pagamento (até 5 funcionários)',
      description: 'Processamento completo da folha',
      scope: 'Cálculo, holerites, GPS, FGTS',
      outOfScope: 'Gestão de benefícios',
      documents: 'Ponto, atestados, avisos',
      basePrice: 400,
    },
    {
      name: 'Folha de Pagamento (6-15 funcionários)',
      description: 'Processamento completo da folha',
      scope: 'Cálculo, holerites, GPS, FGTS',
      outOfScope: 'Gestão de benefícios',
      documents: 'Ponto, atestados, avisos',
      basePrice: 700,
    },
    {
      name: 'Admissão de Funcionário',
      description: 'Processo completo de admissão',
      scope: 'Exame admissional, registro, documentos',
      outOfScope: 'Recrutamento e seleção',
      documents: 'Documentos pessoais do funcionário',
      basePrice: 150,
    },
    {
      name: 'Rescisão de Contrato',
      description: 'Cálculo e processamento de rescisão',
      scope: 'Cálculo, guia, homologação',
      outOfScope: 'Negociação com funcionário',
      documents: 'Aviso prévio, documentos pessoais',
      basePrice: 250,
    },
    {
      name: 'Férias',
      description: 'Cálculo e processamento de férias',
      scope: 'Cálculo, aviso, pagamento',
      outOfScope: 'Gestão de calendário de férias',
      documents: 'Solicitação de férias',
      basePrice: 100,
    },
  ],

  'MEI': [
    {
      name: 'Abertura de MEI',
      description: 'Registro completo de Microempreendedor Individual',
      scope: 'Cadastro, CNPJ, alvará',
      outOfScope: 'Licenças específicas',
      documents: 'Documentos pessoais',
      basePrice: 200,
    },
    {
      name: 'DASN-SIMEI (Declaração Anual)',
      description: 'Declaração anual do MEI',
      scope: 'Preenchimento e transmissão',
      outOfScope: 'Regularização de débitos',
      documents: 'Faturamento do ano',
      basePrice: 150,
    },
    {
      name: 'Emissão de DAS Mensal',
      description: 'Geração mensal da guia do MEI',
      scope: 'Emissão e envio da guia',
      outOfScope: 'Acompanhamento de pagamento',
      documents: 'Nenhum',
      basePrice: 50,
    },
  ],

  'IRPF': [
    {
      name: 'Declaração de Imposto de Renda PF (Simples)',
      description: 'IRPF para rendimentos simples',
      scope: 'Preenchimento, transmissão, recibo',
      outOfScope: 'Regularização de débitos',
      documents: 'Informes de rendimentos',
      basePrice: 250,
    },
    {
      name: 'Declaração de Imposto de Renda PF (Completa)',
      description: 'IRPF com múltiplas fontes de renda',
      scope: 'Preenchimento, transmissão, recibo',
      outOfScope: 'Defesa em malha fina',
      documents: 'Todos os informes de rendimentos',
      basePrice: 500,
    },
  ],

  'Consultoria': [
    {
      name: 'Consultoria Tributária (hora técnica)',
      description: 'Orientação sobre questões tributárias',
      scope: 'Análise e recomendação por escrito',
      outOfScope: 'Implementação de mudanças',
      documents: 'Documentação da empresa',
      basePrice: 300,
    },
    {
      name: 'Planejamento Tributário Anual',
      description: 'Análise do melhor regime tributário',
      scope: 'Relatório comparativo, recomendação',
      outOfScope: 'Implementação',
      documents: 'DRE, balanço, projeções',
      basePrice: 2500,
    },
  ],

  'BPO Financeiro': [
    {
      name: 'Contas a Pagar (até 50 lançamentos/mês)',
      description: 'Gestão completa de contas a pagar',
      scope: 'Agendamento, pagamento, conciliação',
      outOfScope: 'Negociação com fornecedores',
      documents: 'Boletos, notas fiscais',
      basePrice: 600,
    },
    {
      name: 'Contas a Receber (até 50 lançamentos/mês)',
      description: 'Gestão completa de contas a receber',
      scope: 'Emissão, cobrança, conciliação',
      outOfScope: 'Cobrança judicial',
      documents: 'Contratos, notas fiscais',
      basePrice: 600,
    },
  ],

  'Auditoria': [
    {
      name: 'Auditoria Contábil Básica',
      description: 'Revisão de procedimentos contábeis',
      scope: 'Relatório de achados e recomendações',
      outOfScope: 'Auditoria independente (CVM)',
      documents: 'Livros contábeis, documentos fiscais',
      basePrice: 3500,
    },
  ],

  'LGPD': [
    {
      name: 'Adequação à LGPD (Diagnóstico)',
      description: 'Avaliação inicial de conformidade',
      scope: 'Relatório de gaps, plano de ação',
      outOfScope: 'Implementação de medidas',
      documents: 'Processos de tratamento de dados',
      basePrice: 2000,
    },
  ],

  'Tecnologia': [
    {
      name: 'Implantação de Sistema Contábil',
      description: 'Configuração e migração de dados',
      scope: 'Setup, migração, treinamento',
      outOfScope: 'Customizações',
      documents: 'Dados da empresa',
      basePrice: 1500,
    },
  ],

  'Importação/Exportação': [
    {
      name: 'Registro de Importação (DI)',
      description: 'Processamento de Declaração de Importação',
      scope: 'Registro, acompanhamento',
      outOfScope: 'Desembaraço aduaneiro',
      documents: 'Invoice, packing list, BL',
      basePrice: 800,
    },
  ],

  'Agronegócio': [
    {
      name: 'Contabilidade Rural (Livro Caixa)',
      description: 'Escrituração do livro caixa rural',
      scope: 'Registro de receitas e despesas',
      outOfScope: 'Análise de viabilidade',
      documents: 'Notas fiscais, recibos',
      basePrice: 1200,
    },
  ],

  'Startup': [
    {
      name: 'Estruturação Societária para Startup',
      description: 'Modelagem societária para captação',
      scope: 'Contrato social, acordo de sócios',
      outOfScope: 'Negociação com investidores',
      documents: 'Term sheet, valuation',
      basePrice: 3000,
    },
  ],

  'Premium': [
    {
      name: 'CFO Part-Time (20h/mês)',
      description: 'Diretor financeiro compartilhado',
      scope: 'Gestão financeira estratégica',
      outOfScope: 'Operacional contábil',
      documents: 'Acesso aos sistemas',
      basePrice: 5000,
    },
    {
      name: 'Consultoria Estratégica Mensal',
      description: 'Reunião mensal de estratégia',
      scope: 'Análise de KPIs, recomendações',
      outOfScope: 'Implementação',
      documents: 'Relatórios gerenciais',
      basePrice: 1500,
    },
  ],
};

// =================================================================
//  DADOS: 4 Planos Comerciais
// =================================================================
const planos = [
  {
    name: 'START',
    multiplier: 1.0,
    order: 1,
    isIndependent: false,
    description: 'Plano básico para MEI e pequenas empresas',
    badge: 'INICIANTE',
  },
  {
    name: 'PRIME',
    multiplier: 1.5,
    order: 2,
    isIndependent: false,
    description: 'Plano intermediário para pequenas e médias empresas',
    badge: 'MAIS POPULAR',
  },
  {
    name: 'BLACK',
    multiplier: 2.0,
    order: 3,
    isIndependent: false,
    description: 'Plano avançado para médias e grandes empresas',
    badge: 'PREMIUM',
  },
  {
    name: 'ENTERPRISE',
    multiplier: 3.0,
    order: 4,
    isIndependent: true, // Não herda de outros planos
    description: 'Plano corporativo personalizado',
    badge: 'CORPORATIVO',
  },
];

// =================================================================
// 🎯 FUNÇÃO PRINCIPAL DO SEED
// =================================================================
async function main() {
  console.log('🚀 Iniciando seed do catálogo de serviços...\n');

  // =================================================================
  // 📦 PASSO 1: Obter ou criar uma empresa demo
  // =================================================================
  console.log(' Buscando empresa...');
  let companyId = '';

  const primeiraEmpresa = await prisma.company.findFirst();
  if (primeiraEmpresa) {
    companyId = primeiraEmpresa.id;
    console.log(`   ✅ Usando empresa existente: ${primeiraEmpresa.name || primeiraEmpresa.id}`);
  } else {
    console.log('  ⚠️  Nenhuma empresa encontrada. Criando empresa demo...');
    const empresaDemo = await prisma.company.create({
      data: {
        name: 'Escritório Demo',
        cnpj: '12.345.678/0001-90',
        email: 'demo@contacerta.com.br',
      },
    });
    companyId = empresaDemo.id;
    console.log(`  ✅ Empresa demo criada: ${empresaDemo.name}`);
  }

  // =================================================================
  // 📦 PASSO 2: Criar Categorias
  // =================================================================
  console.log('\n📦 Criando categorias...');
  const categoriasCriadas = [];

  for (const categoria of categorias) {
    const created = await prisma.serviceCategory.upsert({
      where: {
        // Tenta encontrar por nome (se existir unique)
        name_companyId: {
          name: categoria.name,
          companyId: companyId,
        },
      },
      update: {
        order: categoria.order,
        description: categoria.description,
      },
      create: {
        name: categoria.name,
        order: categoria.order,
        description: categoria.description,
        companyId: companyId,
      },
    });

    categoriasCriadas.push(created);
    console.log(`  ✅ ${categoria.name}`);
  }

  console.log(`\n✅ ${categoriasCriadas.length} categorias criadas/atualizadas\n`);

  // =================================================================
  // 📦 PASSO 3: Criar Serviços
  // =================================================================
  console.log('📦 Criando serviços...');
  const servicosCriados = [];

  for (const [categoriaNome, servicos] of Object.entries(servicosPorCategoria)) {
    const categoria = categoriasCriadas.find(c => c.name === categoriaNome);
    if (!categoria) {
      console.warn(`⚠️  Categoria "${categoriaNome}" não encontrada, pulando...`);
      continue;
    }

    for (const servico of servicos) {
      const created = await prisma.serviceItem.upsert({
        where: {
          // Tenta encontrar por nome + categoria
          name_categoryId: {
            name: servico.name,
            categoryId: categoria.id,
          },
        },
        update: {
          description: servico.description,
          scope: servico.scope,
          outOfScope: servico.outOfScope,
          documents: servico.documents,
          basePrice: servico.basePrice,
        },
        create: {
          name: servico.name,
          description: servico.description,
          scope: servico.scope,
          outOfScope: servico.outOfScope,
          documents: servico.documents,
          basePrice: servico.basePrice,
          categoryId: categoria.id,
        },
      });

      servicosCriados.push(created);
    }

    console.log(`  ✅ ${categoriaNome}: ${servicos.length} serviços`);
  }

  console.log(`\n✅ ${servicosCriados.length} serviços criados/atualizados\n`);

  // =================================================================
  // 📦 PASSO 4: Criar Planos Comerciais
  // =================================================================
  console.log(' Criando planos comerciais...');
  const planosCriados = [];

  for (const plano of planos) {
    const created = await prisma.commercialPlan.upsert({
      where: {
        // Tenta encontrar por nome
        name_companyId: {
          name: plano.name,
          companyId: companyId,
        },
      },
      update: {
        multiplier: plano.multiplier,
        order: plano.order,
        isIndependent: plano.isIndependent,
        description: plano.description,
        badge: plano.badge,
      },
      create: {
        name: plano.name,
        multiplier: plano.multiplier,
        order: plano.order,
        isIndependent: plano.isIndependent,
        description: plano.description,
        badge: plano.badge,
        companyId: companyId,
      },
    });

    planosCriados.push(created);
    console.log(`  ✅ ${plano.name} (multiplicador: ${plano.multiplier}x)`);
  }

  console.log(`\n✅ ${planosCriados.length} planos criados/atualizados\n`);

  // =================================================================
  //  RESUMO FINAL
  // =================================================================
  console.log('═══════════════════════════════════════════════════════');
  console.log(' RESUMO DO SEED');
  console.log('═══════════════════════════════════════════════════════');
  console.log(`✅ Empresa: ${companyId}`);
  console.log(`✅ Categorias: ${categoriasCriadas.length}`);
  console.log(`✅ Serviços: ${servicosCriados.length}`);
  console.log(`✅ Planos: ${planosCriados.length}`);
  console.log('═══════════════════════════════════════════════════════\n');

  console.log('🎉 Seed do catálogo concluído com sucesso!');
  console.log('\n Próximos passos:');
  console.log('   1. Acesse: http://localhost:3005/dashboard/admin/catalogo');
  console.log('   2. Acesse: http://localhost:3005/dashboard/precificacao/meus-planos\n');
}

// =================================================================
// 🚀 EXECUÇÃO
// =================================================================
main()
  .catch((e) => {
    console.error('❌ Erro durante o seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });