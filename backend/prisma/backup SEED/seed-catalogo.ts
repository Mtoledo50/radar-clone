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
// 📦 DADOS: Serviços distribuídos por categoria
// (Campos alinhados ao schema: requiredDocs, estimatedHours, slaDays)
// =================================================================
const servicosPorCategoria: Record<string, Array<{
  name: string;
  description: string;
  scope: string;
  outOfScope: string;
  requiredDocs: string;
  basePrice: number;
  estimatedHours: number;
  slaDays: number;
}>> = {
  'Contábil': [
    {
      name: 'Escrituração Contábil Mensal',
      description: 'Registro de todas as operações contábeis do mês',
      scope: 'Lançamentos contábeis, balancete, razão',
      outOfScope: 'Conciliação bancária, DRE gerencial',
      requiredDocs: 'Extratos bancários, notas fiscais, comprovantes',
      basePrice: 800,
      estimatedHours: 10,
      slaDays: 5,
    },
    {
      name: 'Fechamento Contábil Anual',
      description: 'Encerramento do exercício contábil',
      scope: 'Balanço patrimonial, DRE, DMPL, DFCA',
      outOfScope: 'Auditoria independente',
      requiredDocs: 'Todos os documentos do exercício',
      basePrice: 2500,
      estimatedHours: 40,
      slaDays: 30,
    },
    {
      name: 'Conciliação Bancária',
      description: 'Conferência entre extrato bancário e contabilidade',
      scope: 'Conciliação de todas as contas bancárias',
      outOfScope: 'Investigação de divergências complexas',
      requiredDocs: 'Extratos bancários completos',
      basePrice: 300,
      estimatedHours: 4,
      slaDays: 3,
    },
  ],

  'Fiscal': [
    {
      name: 'Apuração de ICMS',
      description: 'Cálculo mensal do ICMS a pagar',
      scope: 'Apuração, guia, declaração',
      outOfScope: 'Defesa fiscal em caso de autuação',
      requiredDocs: 'Notas fiscais de entrada e saída',
      basePrice: 500,
      estimatedHours: 6,
      slaDays: 20,
    },
    {
      name: 'Apuração de ISS',
      description: 'Cálculo mensal do ISS para prestadores de serviço',
      scope: 'Apuração, guia, declaração',
      outOfScope: 'Acompanhamento de fiscalizações',
      requiredDocs: 'Notas fiscais de serviço emitidas',
      basePrice: 400,
      estimatedHours: 4,
      slaDays: 15,
    },
    {
      name: 'SPED Fiscal',
      description: 'Escrituração fiscal digital',
      scope: 'Geração e transmissão do arquivo SPED',
      outOfScope: 'Correção de erros após transmissão',
      requiredDocs: 'Todas as notas fiscais do período',
      basePrice: 600,
      estimatedHours: 8,
      slaDays: 25,
    },
  ],

  'Pessoal (DP)': [
    {
      name: 'Folha de Pagamento (até 5 funcionários)',
      description: 'Processamento completo da folha',
      scope: 'Cálculo, holerites, GPS, FGTS',
      outOfScope: 'Gestão de benefícios',
      requiredDocs: 'Ponto, atestados, avisos',
      basePrice: 400,
      estimatedHours: 5,
      slaDays: 5,
    },
    {
      name: 'Admissão de Funcionário',
      description: 'Processo completo de admissão',
      scope: 'Exame admissional, registro, documentos',
      outOfScope: 'Recrutamento e seleção',
      requiredDocs: 'Documentos pessoais do funcionário',
      basePrice: 150,
      estimatedHours: 2,
      slaDays: 3,
    },
  ],

  'MEI': [
    {
      name: 'Abertura de MEI',
      description: 'Registro completo de Microempreendedor Individual',
      scope: 'Cadastro, CNPJ, alvará',
      outOfScope: 'Licenças específicas',
      requiredDocs: 'Documentos pessoais',
      basePrice: 200,
      estimatedHours: 2,
      slaDays: 5,
    },
    {
      name: 'DASN-SIMEI (Declaração Anual)',
      description: 'Declaração anual do MEI',
      scope: 'Preenchimento e transmissão',
      outOfScope: 'Regularização de débitos',
      requiredDocs: 'Faturamento do ano',
      basePrice: 150,
      estimatedHours: 1,
      slaDays: 30,
    },
  ],

  'Consultoria': [
    {
      name: 'Planejamento Tributário Anual',
      description: 'Análise do melhor regime tributário',
      scope: 'Relatório comparativo, recomendação',
      outOfScope: 'Implementação',
      requiredDocs: 'DRE, balanço, projeções',
      basePrice: 2500,
      estimatedHours: 15,
      slaDays: 30,
    },
  ],

  'Premium': [
    {
      name: 'CFO Part-Time (20h/mês)',
      description: 'Diretor financeiro compartilhado',
      scope: 'Gestão financeira estratégica',
      outOfScope: 'Operacional contábil',
      requiredDocs: 'Acesso aos sistemas',
      basePrice: 5000,
      estimatedHours: 20,
      slaDays: 1,
    },
  ],
};

// =================================================================
// 📦 DADOS: 4 Planos Comerciais
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
  console.log('📦 Buscando empresa...');
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
    // ID determinístico para permitir upsert
    const id = `cat-${companyId}-${categoria.name.toLowerCase().replace(/\s+/g, '-')}`;
    
    const created = await prisma.serviceCategory.upsert({
      where: { id },
      update: {
        name: categoria.name,
        order: categoria.order,
        description: categoria.description,
      },
      create: {
        id,
        companyId,
        name: categoria.name,
        order: categoria.order,
        description: categoria.description,
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
      // ID determinístico para permitir upsert
      const id = `srv-${companyId}-${servico.name.toLowerCase().replace(/\s+/g, '-')}`;
      
      const created = await prisma.serviceItem.upsert({
        where: { id },
        update: {
          name: servico.name,
          description: servico.description,
          scope: servico.scope,
          outOfScope: servico.outOfScope,
          requiredDocs: servico.requiredDocs,
          basePrice: servico.basePrice,
          estimatedHours: servico.estimatedHours,
          slaDays: servico.slaDays,
        },
        create: {
          id,
          companyId,
          categoryId: categoria.id,
          name: servico.name,
          description: servico.description,
          scope: servico.scope,
          outOfScope: servico.outOfScope,
          requiredDocs: servico.requiredDocs,
          basePrice: servico.basePrice,
          estimatedHours: servico.estimatedHours,
          slaDays: servico.slaDays,
          recurrence: 'MENSAL', // Enum do schema
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
  console.log('📦 Criando planos comerciais...');
  const planosCriados = [];

  for (const plano of planos) {
    // ID determinístico para permitir upsert
    const id = `plan-${companyId}-${plano.name.toLowerCase()}`;
    
    const created = await prisma.commercialPlan.upsert({
      where: { id },
      update: {
        name: plano.name,
        multiplier: plano.multiplier,
        order: plano.order,
        isIndependent: plano.isIndependent,
        description: plano.description,
        badge: plano.badge,
      },
      create: {
        id,
        companyId,
        name: plano.name,
        multiplier: plano.multiplier,
        order: plano.order,
        isIndependent: plano.isIndependent,
        description: plano.description,
        badge: plano.badge,
      },
    });

    planosCriados.push(created);
    console.log(`  ✅ ${plano.name} (multiplicador: ${plano.multiplier}x)`);
  }

  console.log(`\n✅ ${planosCriados.length} planos criados/atualizados\n`);

  // =================================================================
  // 📊 RESUMO FINAL
  // =================================================================
  console.log('═══════════════════════════════════════════════════════');
  console.log('📊 RESUMO DO SEED');
  console.log('═══════════════════════════════════════════════════════');
  console.log(`✅ Empresa: ${companyId}`);
  console.log(`✅ Categorias: ${categoriasCriadas.length}`);
  console.log(`✅ Serviços: ${servicosCriados.length}`);
  console.log(`✅ Planos: ${planosCriados.length}`);
  console.log('═══════════════════════════════════════════════════════\n');

  console.log('🎉 Seed do catálogo concluído com sucesso!');
  console.log('\n👉 Próximos passos:');
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