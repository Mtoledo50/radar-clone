/**
 * =================================================================
 * SEED: Catálogo de Serviços + Planos Comerciais
 * =================================================================
 * 
 * 🎯 PROPÓSITO:
 * Popular o sistema com o catálogo completo de serviços contábeis
 * e os planos comerciais (START, PRIME, BLACK, ENTERPRISE).
 * 
 * 📦 O QUE ESTE SEED CRIA:
 * 1. 17 Categorias/Departamentos contábeis
 * 2. ~60 Serviços distribuídos entre as categorias
 * 3. 4 Planos comerciais com multiplicadores
 * 4. Associações entre planos e serviços (herança automática)
 * 
 * 🔄 IDEMPOTÊNCIA:
 * Este seed pode ser executado múltiplas vezes sem duplicar dados.
 * Usa upsert (create + update) para garantir unicidade.
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
  sla: string;
  documents: string;
  basePrice: number;
}>> = {
  'Contábil': [
    {
      name: 'Escrituração Contábil Mensal',
      description: 'Registro de todas as operações contábeis do mês',
      scope: 'Lançamentos contábeis, balancete, razão',
      outOfScope: 'Conciliação bancária, DRE gerencial',
      sla: '5 dias úteis após recebimento dos documentos',
      documents: 'Extratos bancários, notas fiscais, comprovantes',
      basePrice: 800,
    },
    {
      name: 'Fechamento Contábil Anual',
      description: 'Encerramento do exercício contábil',
      scope: 'Balanço patrimonial, DRE, DMPL, DFCA',
      outOfScope: 'Auditoria independente',
      sla: '30 dias após encerramento do exercício',
      documents: 'Todos os documentos do exercício',
      basePrice: 2500,
    },
    {
      name: 'Conciliação Bancária',
      description: 'Conferência entre extrato bancário e contabilidade',
      scope: 'Conciliação de todas as contas bancárias',
      outOfScope: 'Investigação de divergências complexas',
      sla: '3 dias úteis',
      documents: 'Extratos bancários completos',
      basePrice: 300,
    },
    {
      name: 'Análise de Balanço',
      description: 'Análise detalhada das demonstrações contábeis',
      scope: 'Relatório de análise com índices e recomendações',
      outOfScope: 'Consultoria estratégica',
      sla: '7 dias úteis',
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
      sla: 'Até 20º dia do mês seguinte',
      documents: 'Notas fiscais de entrada e saída',
      basePrice: 500,
    },
    {
      name: 'Apuração de ISS',
      description: 'Cálculo mensal do ISS para prestadores de serviço',
      scope: 'Apuração, guia, declaração',
      outOfScope: 'Acompanhamento de fiscalizações',
      sla: 'Até 15º dia do mês seguinte',
      documents: 'Notas fiscais de serviço emitidas',
      basePrice: 400,
    },
    {
      name: 'Declaração de Imposto de Renda PJ (Lucro Presumido)',
      description: 'Apuração trimestral do IRPJ e CSLL',
      scope: 'Cálculo, guia, declaração',
      outOfScope: 'Planejamento tributário',
      sla: 'Até último dia do mês seguinte ao trimestre',
      documents: 'DRE trimestral, notas fiscais',
      basePrice: 700,
    },
    {
      name: 'SPED Fiscal',
      description: 'Escrituração fiscal digital',
      scope: 'Geração e transmissão do arquivo SPED',
      outOfScope: 'Correção de erros após transmissão',
      sla: 'Até 25º dia do mês seguinte',
      documents: 'Todas as notas fiscais do período',
      basePrice: 600,
    },
    {
      name: 'SPED Contábil',
      description: 'Escrituração contábil digital',
      scope: 'Geração e transmissão do arquivo SPED',
      outOfScope: 'Auditoria do arquivo',
      sla: 'Até 30 de junho do ano seguinte',
      documents: 'Livros contábeis do exercício',
      basePrice: 800,
    },
    {
      name: 'DCTF Mensal',
      description: 'Declaração de Débitos e Créditos Tributários Federais',
      scope: 'Preenchimento e transmissão',
      outOfScope: 'Regularização de débitos',
      sla: 'Até 15º dia do 2º mês seguinte',
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
      sla: 'Até 5 dias antes do pagamento',
      documents: 'Ponto, atestados, avisos',
      basePrice: 400,
    },
    {
      name: 'Folha de Pagamento (6-15 funcionários)',
      description: 'Processamento completo da folha',
      scope: 'Cálculo, holerites, GPS, FGTS',
      outOfScope: 'Gestão de benefícios',
      sla: 'Até 5 dias antes do pagamento',
      documents: 'Ponto, atestados, avisos',
      basePrice: 700,
    },
    {
      name: 'Admissão de Funcionário',
      description: 'Processo completo de admissão',
      scope: 'Exame admissional, registro, documentos',
      outOfScope: 'Recrutamento e seleção',
      sla: '3 dias úteis',
      documents: 'Documentos pessoais do funcionário',
      basePrice: 150,
    },
    {
      name: 'Rescisão de Contrato',
      description: 'Cálculo e processamento de rescisão',
      scope: 'Cálculo, guia, homologação',
      outOfScope: 'Negociação com funcionário',
      sla: '5 dias úteis',
      documents: 'Aviso prévio, documentos pessoais',
      basePrice: 250,
    },
    {
      name: 'Férias',
      description: 'Cálculo e processamento de férias',
      scope: 'Cálculo, aviso, pagamento',
      outOfScope: 'Gestão de calendário de férias',
      sla: '2 dias úteis',
      documents: 'Solicitação de férias',
      basePrice: 100,
    },
  ],

  'Societário': [
    {
      name: 'Contrato Social (Constituição)',
      description: 'Elaboração e registro de contrato social',
      scope: 'Elaboração, registro na Junta, CNPJ',
      outOfScope: 'Licenças municipais',
      sla: '15 dias úteis',
      documents: 'Documentos dos sócios',
      basePrice: 1200,
    },
    {
      name: 'Alteração Contratual',
      description: 'Alterações no contrato social',
      scope: 'Elaboração, registro, atualização',
      outOfScope: 'Mudança de endereço (requer alvará)',
      sla: '10 dias úteis',
      documents: 'Documentação da alteração',
      basePrice: 800,
    },
    {
      name: 'Dissolução de Empresa',
      description: 'Encerramento de atividades',
      scope: 'Baixa CNPJ, certidões negativas',
      outOfScope: 'Pagamento de débitos pendentes',
      sla: '60 dias úteis',
      documents: 'Documentação completa da empresa',
      basePrice: 2000,
    },
  ],

  'MEI': [
    {
      name: 'Abertura de MEI',
      description: 'Registro completo de Microempreendedor Individual',
      scope: 'Cadastro, CNPJ, alvará',
      outOfScope: 'Licenças específicas',
      sla: '5 dias úteis',
      documents: 'Documentos pessoais',
      basePrice: 200,
    },
    {
      name: 'DASN-SIMEI (Declaração Anual)',
      description: 'Declaração anual do MEI',
      scope: 'Preenchimento e transmissão',
      outOfScope: 'Regularização de débitos',
      sla: 'Até 31 de maio',
      documents: 'Faturamento do ano',
      basePrice: 150,
    },
    {
      name: 'Emissão de DAS Mensal',
      description: 'Geração mensal da guia do MEI',
      scope: 'Emissão e envio da guia',
      outOfScope: 'Acompanhamento de pagamento',
      sla: 'Até dia 20 de cada mês',
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
      sla: 'Até 30 de abril',
      documents: 'Informes de rendimentos',
      basePrice: 250,
    },
    {
      name: 'Declaração de Imposto de Renda PF (Completa)',
      description: 'IRPF com múltiplas fontes de renda',
      scope: 'Preenchimento, transmissão, recibo',
      outOfScope: 'Defesa em malha fina',
      sla: 'Até 30 de abril',
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
      sla: 'Conforme demanda',
      documents: 'Documentação da empresa',
      basePrice: 300,
    },
    {
      name: 'Planejamento Tributário Anual',
      description: 'Análise do melhor regime tributário',
      scope: 'Relatório comparativo, recomendação',
      outOfScope: 'Implementação',
      sla: '30 dias úteis',
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
      sla: 'Conforme calendário de pagamentos',
      documents: 'Boletos, notas fiscais',
      basePrice: 600,
    },
    {
      name: 'Contas a Receber (até 50 lançamentos/mês)',
      description: 'Gestão completa de contas a receber',
      scope: 'Emissão, cobrança, conciliação',
      outOfScope: 'Cobrança judicial',
      sla: 'Conforme vencimentos',
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
      sla: '45 dias úteis',
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
      sla: '20 dias úteis',
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
      sla: '30 dias úteis',
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
      sla: 'Conforme prazo da Receita',
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
      sla: 'Até 30 de abril',
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
      sla: '20 dias úteis',
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
      sla: 'Conforme demanda',
      documents: 'Acesso aos sistemas',
      basePrice: 5000,
    },
    {
      name: 'Consultoria Estratégica Mensal',
      description: 'Reunião mensal de estratégia',
      scope: 'Análise de KPIs, recomendações',
      outOfScope: 'Implementação',
      sla: '1 reunião de 2h/mês',
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
  // 📦 PASSO 1: Criar Categorias
  // =================================================================
  console.log('📦 Criando categorias...');
  const categoriasCriadas = [];

  for (const categoria of categorias) {
    const created = await prisma.serviceCategory.upsert({
      where: {
        // Usa um ID único baseado no nome (normalizado)
        id: `cat-${categoria.name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '')}`,
      },
      update: {
        name: categoria.name,
        order: categoria.order,
        description: categoria.description,
      },
      create: {
        id: `cat-${categoria.name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '')}`,
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
  // 📦 PASSO 2: Criar Serviços
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
          // ID único baseado no nome (normalizado)
          id: `srv-${servico.name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '')}`,
        },
        update: {
          name: servico.name,
          description: servico.description,
          scope: servico.scope,
          outOfScope: servico.outOfScope,
          sla: servico.sla,
          documents: servico.documents,
          basePrice: servico.basePrice,
          categoryId: categoria.id,
          order: servicos.indexOf(servico) + 1,
        },
        create: {
          id: `srv-${servico.name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '')}`,
          name: servico.name,
          description: servico.description,
          scope: servico.scope,
          outOfScope: servico.outOfScope,
          sla: servico.sla,
          documents: servico.documents,
          basePrice: servico.basePrice,
          categoryId: categoria.id,
          order: servicos.indexOf(servico) + 1,
        },
      });

      servicosCriados.push(created);
    }

    console.log(`  ✅ ${categoriaNome}: ${servicos.length} serviços`);
  }

  console.log(`\n✅ ${servicosCriados.length} serviços criados/atualizados\n`);

  // =================================================================
  // 📦 PASSO 3: Criar Planos Comerciais
  // =================================================================
  console.log(' Criando planos comerciais...');
  const planosCriados = [];

  // Primeiro, precisamos de uma empresa para associar os planos
  // Vamos usar a primeira empresa do banco ou criar uma demo
  let companyId = '';

  const primeiraEmpresa = await prisma.company.findFirst();
  if (primeiraEmpresa) {
    companyId = primeiraEmpresa.id;
    console.log(`   Usando empresa existente: ${primeiraEmpresa.name}`);
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

  for (const plano of planos) {
    const created = await prisma.commercialPlan.upsert({
      where: {
        // ID único baseado no nome
        id: `plan-${plano.name.toLowerCase()}`,
      },
      update: {
        name: plano.name,
        multiplier: plano.multiplier,
        order: plano.order,
        isIndependent: plano.isIndependent,
        description: plano.description,
        badge: plano.badge,
        companyId: companyId,
      },
      create: {
        id: `plan-${plano.name.toLowerCase()}`,
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
  // 📦 PASSO 4: Associar Serviços aos Planos (Herança)
  // =================================================================
  console.log('📦 Associando serviços aos planos...');

  // Estratégia de associação:
  // START: MEI + IRPF Simples + 3 serviços básicos de Contábil
  // PRIME: START + Fiscal básico + DP até 5 + Consultoria
  // BLACK: PRIME + Auditoria + BPO + LGPD
  // ENTERPRISE: Todos os serviços (plano independente)

  const associacoes = {
    'START': [
      'MEI',
      'IRPF',
      'Contábil',
    ],
    'PRIME': [
      'START', // Herda todos do START
      'Fiscal',
      'Pessoal (DP)',
      'Consultoria',
    ],
    'BLACK': [
      'PRIME', // Herda todos do PRIME (e indiretamente do START)
      'Auditoria',
      'BPO Financeiro',
      'LGPD',
    ],
    'ENTERPRISE': [
      // Independente: inclui todos os serviços
    ],
  };

  for (const plano of planosCriados) {
    const categoriasParaAssociar = associacoes[plano.name as keyof typeof associacoes] || [];

    // Se o plano é independente (ENTERPRISE), associa todos os serviços
    if (plano.isIndependent) {
      for (const servico of servicosCriados) {
        await prisma.planServiceItem.upsert({
          where: {
            planId_serviceItemId: {
              planId: plano.id,
              serviceItemId: servico.id,
            },
          },
          update: {},
          create: {
            planId: plano.id,
            serviceItemId: servico.id,
          },
        });
      }
      console.log(`  ✅ ${plano.name}: Todos os ${servicosCriados.length} serviços (independente)`);
    } else {
      // Para planos não independentes, associa serviços das categorias especificadas
      let totalAssociados = 0;

      for (const categoriaNome of categoriasParaAssociar) {
        // Se é um plano base (START, PRIME, BLACK), pega os serviços desse plano
        if (['START', 'PRIME', 'BLACK'].includes(categoriaNome)) {
          const planoBase = planosCriados.find(p => p.name === categoriaNome);
          if (planoBase) {
            const itensDoPlanoBase = await prisma.planServiceItem.findMany({
              where: { planId: planoBase.id },
            });

            for (const item of itensDoPlanoBase) {
              await prisma.planServiceItem.upsert({
                where: {
                  planId_serviceItemId: {
                    planId: plano.id,
                    serviceItemId: item.serviceItemId,
                  },
                },
                update: {},
                create: {
                  planId: plano.id,
                  serviceItemId: item.serviceItemId,
                },
              });
              totalAssociados++;
            }
          }
        } else {
          // Associa serviços da categoria
          const servicosDaCategoria = servicosCriados.filter(s => {
            const categoria = categoriasCriadas.find(c => c.id === s.categoryId);
            return categoria?.name === categoriaNome;
          });

          for (const servico of servicosDaCategoria) {
            await prisma.planServiceItem.upsert({
              where: {
                planId_serviceItemId: {
                  planId: plano.id,
                  serviceItemId: servico.id,
                },
              },
              update: {},
              create: {
                planId: plano.id,
                serviceItemId: servico.id,
              },
            });
            totalAssociados++;
          }
        }
      }

      console.log(`  ✅ ${plano.name}: ${totalAssociados} serviços associados`);
    }
  }

  console.log('\n✅ Associações concluídas\n');

  // =================================================================
  //  RESUMO FINAL
  // =================================================================
  console.log('═══════════════════════════════════════════════════════');
  console.log(' RESUMO DO SEED');
  console.log('═══════════════════════════════════════════════════════');
  console.log(`✅ Categorias: ${categoriasCriadas.length}`);
  console.log(`✅ Serviços: ${servicosCriados.length}`);
  console.log(`✅ Planos: ${planosCriados.length}`);
  console.log('═══════════════════════════════════════════════════════\n');

  console.log('🎉 Seed do catálogo concluído com sucesso!');
  console.log('\n Próximos passos:');
  console.log('   1. Execute: npx ts-node prisma/seed-demo-escritorio.ts');
  console.log('   2. Execute: npx ts-node prisma/seed-clientes-propostas.ts');
  console.log('   3. Acesse: http://localhost:3005/dashboard/admin/catalogo\n');
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