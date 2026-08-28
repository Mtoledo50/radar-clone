/**
 * =================================================================
 * CATÁLOGO DE AJUDA CONTEXTUAL — RADAR CONTA CERTA
 * =================================================================
 * 
 * 📌 REGRA DE OURO DE MANUTENÇÃO (LER ANTES DE EDITAR):
 * Este arquivo DEVE ser atualizado SEMPRE que:
 *   1. Uma nova página (rota) for criada no sistema.
 *   2. Uma funcionalidade existente em uma página for alterada ou expandida.
 *   3. O CHANGELOG.md, CONTEXTO_PROJETO.md ou README.md forem atualizados.
 * 
 * 🏗️ ESTRUTURA DO ARQUIVO:
 *   - Camada 1 (Modal Rápido): `description` + `steps` curtos e diretos.
 *   - Camada 2 (Página /ajuda/[slug]): `richContent` com intro, workflow,
 *     regras, KPIs, exemplos e passos detalhados.
 * 
 * 🗺️ COMO LOCALIZAR UMA PÁGINA:
 *   Use Ctrl+F pelo caminho da rota (ex: "/dashboard/fechamento")
 *   ou pelo nome da página (ex: "Fechamento + DRE Bancário").
 * 
 * 🎨 SEÇÕES DO CATÁLOGO (ordem de renderização):
 *   1. 📊 OPERACIONAL   (Dashboard, Empresa, Pessoas, Clientes, Projetos, Tarefas, Planejamento)
 *   2. 💼 COMERCIAL     (Precificação, Planos, Desempenho, Propostas, Versões)
 *   3. 🧾 FISCAL        (NF-e, Notas, Estoque, Apuração, SPED, Comparativo, Relatório)
 *   4.  BANCÁRIO      (Fechamento + DRE Bancário)
 *   5. 📒 CONTÁBIL      (Lançamentos, Revisão, Ciclo Contábil, Plano de Contas)
 *   6.  INTELIGÊNCIA  (Aurora, Relatórios, NFS-e, Guias, Cofre, Cobrança, BI, Score, Mentoria, Ranking, Tributário)
 *   7. ⚙️ SISTEMA       (Admin: Visão Geral, Catálogo)
 * 
 * =================================================================
 */

export interface PageHelpInfo {
  title: string;
  description: string;
  audience: 'Empresa' | 'Cliente' | 'Geral';
  controlType: 'Interno' | 'Estratégico' | 'Operacional' | 'Fiscal' | 'Financeiro';
  steps: string[];
  relatedPages?: string[];
  richContent?: {
    intro?: string;
    kpis?: { name: string; meaning: string; location: string }[];
    workflow?: string[];
    rules?: string[];
    examples?: { title: string; content: string }[];
    detailedSteps?: { title: string; description: string }[];
  };
}

const helpCatalog: Record<string, PageHelpInfo> = {

  // =================================================================
  // 📊 SEÇÃO 1: OPERACIONAL
  // =================================================================
  // Páginas de uso diário do escritório: visão geral, cadastro, gestão
  // de pessoas, clientes, projetos, tarefas e planejamento estratégico.
  // =================================================================

  // -----------------------------------------------------------------
  // 📄 PÁGINA: Dashboard Executivo
  // 📍 ROTA: /dashboard
  // 🎯 PROPÓSITO: Painel principal com KPIs em tempo real. Responde
  //    em 5 segundos: "Como está meu escritório hoje?"
  // 👤 USUÁRIO: Todos os perfis (ADMIN, MANAGER, USER)
  // 🔄 ATUALIZAR QUANDO: Adicionar novos cards de KPI, mudar filtros
  //    de período ou alterar a lógica de cálculo dos indicadores.
  // -----------------------------------------------------------------
  '/dashboard': {
    title: 'Dashboard Executivo',
    description: 'Visão geral do escritório com KPIs em tempo real: clientes ativos, faturamento, equipe e progresso das metas.',
    audience: 'Empresa',
    controlType: 'Estratégico',
    steps: [
      'Visualize os KPIs principais no topo da tela.',
      'Clique em qualquer card para navegar direto para a página detalhada.',
      'Use os filtros de período para comparar meses e ver tendências de crescimento.'
    ],
    relatedPages: ['Minha Empresa', 'Score do Escritório'],
    richContent: {
      intro: 'O Dashboard é seu painel de controle diário. Ele responde em 5 segundos: "Como está meu escritório hoje?"',
      kpis: [
        { name: 'Clientes Ativos', meaning: 'Quantos clientes pagam honorários no mês', location: 'Card superior esquerdo' },
        { name: 'Faturamento do Mês', meaning: 'Soma dos honorários recebidos + a receber', location: 'Card superior central' },
        { name: 'Equipe', meaning: 'Total de colaboradores ativos', location: 'Card superior direito' },
        { name: 'Progresso das Metas', meaning: '% de execução das metas do Planejamento', location: 'Card inferior' }
      ],
      workflow: [
        'Abra o Dashboard ao iniciar o dia',
        'Identifique KPIs em vermelho/âmbar (atenção)',
        'Clique no card problemático para investigar',
        'Anote 1 ação de melhoria no Planejamento'
      ],
      rules: [
        'Dados em tempo real: sem necessidade de atualizar a página',
        'Filtros de período comparam automaticamente com o período anterior',
        'KPIs refletem apenas dados do seu tenant (companyId)'
      ]
    }
  },

  // -----------------------------------------------------------------
  // 📄 PÁGINA: Minha Empresa
  // 📍 ROTA: /dashboard/minha-empresa
  // 🎯 PROPÓSITO: "Cartão de visitas" do escritório no sistema.
  //    Os dados aqui alimentam o Score, a Mentoria e o Benchmark.
  // 👤 USUÁRIO: ADMIN (somente ele pode editar dados cadastrais)
  // 🔄 ATUALIZAR QUANDO: Novos campos forem adicionados ao formulário
  //    ou se a integração com o Score/Benchmark mudar.
  // -----------------------------------------------------------------
  '/dashboard/minha-empresa': {
    title: 'Minha Empresa',
    description: 'O "cartão de visitas" do seu escritório dentro do sistema. Configure dados básicos, visão de futuro e softwares utilizados.',
    audience: 'Empresa',
    controlType: 'Estratégico',
    steps: [
      'Preencha os dados cadastrais (Razão Social, CNPJ, Endereço).',
      'Defina sua visão de futuro e metas de crescimento (clientes e equipe).',
      'Selecione os softwares que seu escritório utiliza (alimenta o Benchmark).'
    ],
    relatedPages: ['Score do Escritório', 'Planejamento'],
    richContent: {
      intro: 'Esta página é a identidade do seu escritório no sistema. Os dados aqui alimentam o Score, a Mentoria e o Benchmark de Softwares.',
      workflow: [
        'Complete todos os campos cadastrais',
        'Defina sua visão de futuro (1, 3 e 5 anos)',
        'Estabeleça metas mensuráveis (clientes, equipe, faturamento)',
        'Selecione os softwares que você usa',
        'Salve e veja o impacto no Score'
      ],
      rules: [
        'CNPJ é obrigatório e único por tenant',
        'Visão de futuro é texto livre (máximo 500 caracteres)',
        'Metas são numéricas e comparáveis mês a mês',
        'Softwares selecionados alimentam o Benchmark de Mercado'
      ]
    }
  },

  // -----------------------------------------------------------------
  // 📄 PÁGINA: Colaboradores (Gestão de Pessoas)
  //  ROTA: /dashboard/pessoas
  // 🎯 PROPÓSITO: CRUD de funcionários, tipos contratuais e marcação
  //    de talentos críticos. Calcula tempo de casa e turnover.
  // 👤 USUÁRIO: ADMIN, MANAGER
  // 🔄 ATUALIZAR QUANDO: Novos tipos contratuais forem adicionados
  //    ou a lógica de "colaborador crítico" mudar.
  // -----------------------------------------------------------------
  '/dashboard/pessoas': {
    title: 'Colaboradores',
    description: 'Gestão completa da sua equipe: cadastro, tipos contratuais, tempo de casa e identificação de talentos críticos.',
    audience: 'Empresa',
    controlType: 'Operacional',
    steps: [
      'Cadastre novos colaboradores com dados pessoais e contratuais.',
      'Marque colaboradores essenciais com o selo "Crítico" ().',
      'Use os filtros para visualizar a equipe por departamento ou tipo de contrato.'
    ],
    relatedPages: ['Turnover', 'Benchmark de Cargos'],
    richContent: {
      intro: 'Aqui você gerencia o ativo mais valioso do escritório: as pessoas. O sistema calcula automaticamente tempo de casa, turnover e identifica talentos críticos.',
      kpis: [
        { name: 'Total de Colaboradores', meaning: 'Número de pessoas ativas no escritório', location: 'Card superior' },
        { name: 'Tenure Médio', meaning: 'Tempo médio de casa em meses', location: 'Card superior' },
        { name: 'Críticos Ativos', meaning: 'Colaboradores essenciais marcados com ', location: 'Card superior' }
      ],
      workflow: [
        'Cadastre cada colaborador com dados completos',
        'Defina o tipo contratual (CLT, Estágio, Terceirizado, Sócio)',
        'Marque como "Crítico" se for indispensável',
        'Revise mensalmente a distribuição por departamento'
      ],
      rules: [
        'Colaborador crítico = pessoa cuja saída impacta operações',
        'Tipo contratual afeta cálculos de encargos e benefícios',
        'Soft delete preserva histórico contábil',
        'Departamento deve seguir nomenclatura padrão (Fiscal, Contábil, DP, etc)'
      ]
    }
  },

  // -----------------------------------------------------------------
  // 📄 PÁGINA: Turnover e Desligamentos
  // 📍 ROTA: /dashboard/turnover
  //  PROPÓSITO: Registro de rescisões, entrevista de desligamento
  //    e análise de causas-raiz para reter talentos.
  // 👤 USUÁRIO: ADMIN, MANAGER
  // 🔄 ATUALIZAR QUANDO: O questionário da entrevista mudar ou novas
  //    causas-raiz forem adicionadas à análise.
  // -----------------------------------------------------------------
  '/dashboard/turnover': {
    title: 'Turnover e Desligamentos',
    description: 'Análise de rotatividade de pessoas. Registre rescisões, identifique causas-raiz e acompanhe o impacto no escritório.',
    audience: 'Empresa',
    controlType: 'Estratégico',
    steps: [
      'Registre um desligamento informando data, motivo e se era colaborador crítico.',
      'Preencha a Entrevista de Desligamento para que o sistema identifique causas-raiz.',
      'Acompanhe os KPIs de turnover de novatos (< 12 meses) e críticos perdidos.'
    ],
    relatedPages: ['Colaboradores', 'Benchmark de Cargos'],
    richContent: {
      intro: 'Turnover não é apenas um número — é um sinal de saúde organizacional. Esta página ajuda você a entender por que as pessoas saem e como reter talentos.',
      kpis: [
        { name: 'Turnover Geral', meaning: '% de desligamentos no período', location: 'Card superior' },
        { name: 'Turnover de Novatos', meaning: 'Desligados com < 12 meses de casa', location: 'Card superior' },
        { name: 'Críticos Perdidos', meaning: 'Colaboradores  que saíram', location: 'Card superior' },
        { name: 'Motivo Mais Frequente', meaning: 'Causa-raiz mais comum', location: 'Card inferior' }
      ],
      workflow: [
        'Quando alguém sair, registre a rescisão imediatamente',
        'Marque se era colaborador crítico',
        'Conduza a entrevista de desligamento (5 perguntas)',
        'O sistema identifica causas-raiz automaticamente',
        'Revise as análises mensalmente para identificar padrões'
      ],
      rules: [
        'Entrevista de desligamento é opcional mas recomendada',
        'Causas-raiz são identificadas por keywords (IA determinística)',
        'Novato = tenure < 12 meses',
        'Crítico perdido = impacto alto na operação'
      ],
      detailedSteps: [
        {
          title: 'Registrar desligamento',
          description: 'Clique em "Novo Desligamento", selecione o colaborador, informe data, motivo e se era crítico. O sistema copia os dados para histórico.'
        },
        {
          title: 'Entrevista de desligamento',
          description: '5 perguntas sobre: salário, gestão, crescimento, ambiente e motivo principal. O sistema classifica em 7 causas-raiz.'
        },
        {
          title: 'Analisar causas-raiz',
          description: 'A aba "Análises IA" mostra top causas e planos de ação sugeridos. Use para melhorar retenção.'
        }
      ]
    }
  },

  // -----------------------------------------------------------------
  // 📄 PÁGINA: Benchmark de Cargos
  // 📍 ROTA: /dashboard/pessoas/benchmark
  // 🎯 PROPÓSITO: Comparar a distribuição da equipe com o padrão
  //    de mercado contábil (Fiscal 30%, Contábil 25%, DP 20%, etc).
  // 👤 USUÁRIO: ADMIN, MANAGER
  // 🔄 ATUALIZAR QUANDO: As porcentagens de referência do mercado
  //    forem recalibradas.
  // -----------------------------------------------------------------
  '/dashboard/pessoas/benchmark': {
    title: 'Benchmark de Cargos',
    description: 'Compare a distribuição da sua equipe (Fiscal, Contábil, DP, etc.) com o padrão recomendado para escritórios do seu porte.',
    audience: 'Empresa',
    controlType: 'Estratégico',
    steps: [
      'Verifique as barras comparativas: sua equipe atual vs. linha de meta do mercado.',
      'Observe os selos de status: ✓ OK, ⚠ OVER (excesso) ou ⚠ UNDER (falta).',
      'Revise a lista de "departamentos não reconhecidos" para padronizar nomes.'
    ],
    relatedPages: ['Colaboradores', 'Minha Empresa'],
    richContent: {
      intro: 'Este benchmark responde: "Minha equipe está balanceada?" Comparando sua distribuição com o padrão do mercado contábil, você identifica gargalos e excessos.',
      kpis: [
        { name: 'Fiscal', meaning: 'Recomendado: 30% da equipe', location: 'Card de setor' },
        { name: 'Contábil', meaning: 'Recomendado: 25% da equipe', location: 'Card de setor' },
        { name: 'DP (Departamento Pessoal)', meaning: 'Recomendado: 20% da equipe', location: 'Card de setor' },
        { name: 'Admin', meaning: 'Recomendado: 15% da equipe', location: 'Card de setor' },
        { name: 'Outros', meaning: 'Recomendado: 10% da equipe', location: 'Card de setor' }
      ],
      workflow: [
        'Verifique cada setor: está OK, OVER ou UNDER?',
        'Se UNDER: considere contratar ou redistribuir',
        'Se OVER: avalie se há excesso ou se o padrão não se aplica',
        'Padronize nomes de departamentos não reconhecidos'
      ],
      rules: [
        'Tolerância de ±5 pontos percentuais',
        'Departamentos não reconhecidos vão para "Outros"',
        'Benchmark é referência, não regra absoluta',
        'Escritórios especializados podem ter distribuição diferente'
      ]
    }
  },

  // -----------------------------------------------------------------
  // 📄 PÁGINA: Carteira de Clientes
  // 📍 ROTA: /dashboard/clientes
  // 🎯 PROPÓSITO: Gestão de contratos, honorários, MRR, Churn e
  //    importação em massa da planilha de honorários.
  // 👤 USUÁRIO: ADMIN, MANAGER, USER
  // 🔄 ATUALIZAR QUANDO: O formato da importação CSV mudar ou novos
  //    campos contratuais forem adicionados.
  // -----------------------------------------------------------------
  '/dashboard/clientes': {
    title: 'Carteira de Clientes',
    description: 'Gerencie sua carteira de clientes: contratos, planos, honorários, add-ons e status (ativo, inativo ou prospect).',
    audience: 'Empresa',
    controlType: 'Operacional',
    steps: [
      'Busque por empresa, CNPJ ou contato usando a barra de busca.',
      'Importe em massa via CSV para subir sua planilha de honorários rapidamente.',
      'Cadastre manualmente com plano, honorário e serviços avulsos.',
      'Exporte para Excel para análise externa ou backup.'
    ],
    relatedPages: ['Precificação', 'Fechamento + DRE Bancário'],
    richContent: {
      intro: 'A Carteira é o coração comercial do escritório. Aqui você vê quem paga, quem deve e quem pode cancelar.',
      kpis: [
        { name: 'MRR (Receita Recorrente Mensal)', meaning: 'Soma dos honorários de todos os clientes ativos', location: 'Card superior' },
        { name: 'Churn Rate', meaning: '% de clientes que cancelaram no período', location: 'Card superior' },
        { name: 'Ticket Médio', meaning: 'MRR ÷ clientes ativos', location: 'Card superior' }
      ],
      workflow: [
        '1ª semana do mês: importe novos clientes via CSV',
        'Diariamente: atualize status de clientes que cancelaram',
        'Mensalmente: revise honorários vs. plano contratado',
        'Trimestralmente: exporte para análise de churn'
      ],
      rules: [
        'Cliente ativo = contrato vigente + honorário > 0',
        'Upsert por razão social: reimportar não duplica',
        'Soft delete preserva histórico contábil',
        'CNPJ é único por tenant'
      ],
      examples: [
        {
          title: 'Importação em massa',
          content: 'Planilha CSV com colunas: Razão Social, CNPJ, Honorário, Plano, Data Início. O sistema detecta automaticamente e mostra preview antes de confirmar.'
        }
      ]
    }
  },

  // -----------------------------------------------------------------
  // 📄 PÁGINA: Projetos
  // 📍 ROTA: /dashboard/projetos
  // 🎯 PROPÓSITO: Gestão de entregas com prazo, responsáveis e
  //    progresso automático calculado pelas tarefas concluídas.
  // 👤 USUÁRIO: ADMIN, MANAGER, USER
  // 🔄 ATUALIZAR QUANDO: Novos status de projeto forem criados ou
  //    a lógica de cálculo de progresso mudar.
  // -----------------------------------------------------------------
  '/dashboard/projetos': {
    title: 'Projetos',
    description: 'Organize entregas e demandas do escritório como projetos com prazo, responsáveis e progresso automático.',
    audience: 'Empresa',
    controlType: 'Operacional',
    steps: [
      'Crie um projeto definindo nome, status, prioridade e cor de identificação.',
      'Vincule a um cliente (opcional) para rastrear no histórico dele.',
      'Adicione tarefas: o progresso do projeto é calculado automaticamente.'
    ],
    relatedPages: ['Tarefas', 'Planejamento'],
    richContent: {
      intro: 'Projetos transformam demandas caóticas em entregas organizadas. Cada projeto tem prazo, responsáveis e progresso calculado automaticamente pelas tarefas concluídas.',
      kpis: [
        { name: 'Projetos Ativos', meaning: 'Projetos em andamento', location: 'Card superior' },
        { name: 'Atrasados', meaning: 'Projetos com prazo vencido', location: 'Card superior' },
        { name: 'Progresso Geral', meaning: 'Média de conclusão de todos os projetos', location: 'Card superior' }
      ],
      workflow: [
        'Crie um projeto para cada entrega importante',
        'Defina status (Planejamento, Ativo, Pausado, Concluído)',
        'Adicione tarefas com responsáveis e prazos',
        'Acompanhe o progresso automaticamente',
        'Marque como Concluído quando finalizar'
      ],
      rules: [
        'Projeto com tarefas pendentes não pode ser excluído',
        'Progresso = tarefas concluídas  total de tarefas',
        'Vínculo com cliente é opcional mas recomendado',
        'Cor de identificação ajuda na visualização'
      ]
    }
  },

  // -----------------------------------------------------------------
  //  PÁGINA: Tarefas (Kanban)
  // 📍 ROTA: /dashboard/tarefas
  // 🎯 PROPÓSITO: Fluxo operacional diário com categorias, prioridades
  //    e controle de horas estimadas vs. realizadas.
  // 👤 USUÁRIO: ADMIN, MANAGER, USER
  //  ATUALIZAR QUANDO: Novas colunas do Kanban forem adicionadas
  //    ou a lógica de horas estimadas vs. reais mudar.
  // -----------------------------------------------------------------
  '/dashboard/tarefas': {
    title: 'Tarefas',
    description: 'O dia a dia operacional. Quem faz o quê, até quando e com que prioridade, em formato Kanban.',
    audience: 'Empresa',
    controlType: 'Operacional',
    steps: [
      'Crie uma tarefa definindo responsável, prazo, categoria e status inicial.',
      'Use os filtros para ver apenas as suas tarefas, as atrasadas ou por categoria.',
      'Mova a tarefa pelo fluxo: A Fazer → Em Andamento → Revisão → Concluída.'
    ],
    relatedPages: ['Projetos', 'Planejamento'],
    richContent: {
      intro: 'Tarefas são o motor operacional do escritório. Cada demanda vira uma tarefa com responsável, prazo e categoria. O formato Kanban visualiza o fluxo de trabalho.',
      kpis: [
        { name: 'Atrasadas', meaning: 'Tarefas com prazo vencido', location: 'Card superior' },
        { name: 'Para Hoje', meaning: 'Tarefas com prazo hoje', location: 'Card superior' },
        { name: 'Em Andamento', meaning: 'Tarefas sendo executadas', location: 'Card superior' },
        { name: 'Bloqueadas', meaning: 'Tarefas impedidas de prosseguir', location: 'Card superior' }
      ],
      workflow: [
        'Crie tarefas para cada demanda operacional',
        'Defina responsável e prazo realista',
        'Categorize (Fiscal, Contábil, DP, etc)',
        'Mova pelo fluxo: Backlog → A Fazer → Em Andamento → Revisão → Concluída',
        'Marque como Bloqueada se houver impedimento'
      ],
      rules: [
        'Tarefa concluída registra completedAt automaticamente',
        'Categoria afeta relatórios e filtros',
        'Prioridade: Baixa, Média, Alta, Urgente',
        'Horas estimadas vs. realizadas ajudam no planejamento'
      ],
      detailedSteps: [
        {
          title: 'Criar tarefa',
          description: 'Clique em "Nova Tarefa", preencha título, responsável, prazo, categoria, prioridade e horas estimadas. Vincule a um projeto se aplicável.'
        },
        {
          title: 'Mover no Kanban',
          description: 'Arraste a tarefa entre as colunas ou use o menu de status. Cada movimento registra histórico.'
        },
        {
          title: 'Concluir tarefa',
          description: 'Marque como Concluída e informe horas realizadas. O sistema calcula desvio (estimado vs. real).'
        }
      ]
    }
  },

  // -----------------------------------------------------------------
  // 📄 PÁGINA: Planejamento Estratégico
  // 📍 ROTA: /dashboard/planejamento
  //  PROPÓSITO: Definição de metas de longo prazo, KPIs e planos
  //    de ação com barra de progresso automática.
  // 👤 USUÁRIO: ADMIN, MANAGER
  // 🔄 ATUALIZAR QUANDO: A estrutura de Metas -> KPIs -> Ações for
  //    alterada ou novos ciclos de planejamento forem adicionados.
  // -----------------------------------------------------------------
  '/dashboard/planejamento': {
    title: 'Planejamento Estratégico',
    description: 'Defina metas de longo prazo para o escritório e acompanhe a execução através de KPIs e planos de ação.',
    audience: 'Empresa',
    controlType: 'Estratégico',
    steps: [
      'Crie metas claras (ex: "100 clientes ativos até dezembro").',
      'Defina KPIs mensuráveis para cada meta.',
      'Cadastre ações concretas e marque-as como concluídas para ver a barra de progresso subir.'
    ],
    relatedPages: ['Score do Escritório', 'Visão de Futuro'],
    richContent: {
      intro: 'Planejamento transforma visão em execução. Aqui você define metas, KPIs e ações concretas para chegar onde quer.',
      workflow: [
        'Defina metas SMART (Específicas, Mensuráveis, Atingíveis, Relevantes, Temporais)',
        'Estabeleça KPIs para cada meta',
        'Cadastre ações concretas com responsáveis e prazos',
        'Revise mensalmente o progresso',
        'Ajuste metas conforme necessário'
      ],
      rules: [
        'Metas devem ter prazo definido',
        'KPIs devem ser numéricos e mensuráveis',
        'Ações concluídas alimentam a barra de progresso',
        'Metas podem ser reabertas se não atingidas no prazo'
      ]
    }
  },


  // =================================================================
  // 💼 SEÇÃO 2: COMERCIAL
  // =================================================================
  // Páginas do ciclo comercial: precificação, planos, propostas,
  // versões e análise de desempenho (funil + dinheiro na mesa).
  // =================================================================

  // -----------------------------------------------------------------
  // 📄 PÁGINA: Precificação (Calculadora)
  // 📍 ROTA: /dashboard/precificacao
  // 🎯 PROPÓSITO: Calculadora de honorários baseada em horas, custo
  //    hora e margem de lucro desejada.
  // 👤 USUÁRIO: ADMIN, MANAGER
  // 🔄 ATUALIZAR QUANDO: A fórmula de cálculo de horas ou margem
  //    for alterada.
  // -----------------------------------------------------------------
  '/dashboard/precificacao': {
    title: 'Precificação',
    description: 'Calcule quanto cobrar de cada cliente baseado em horas demandadas, custo hora e margem de lucro desejada.',
    audience: 'Empresa',
    controlType: 'Estratégico',
    steps: [
      'Informe as horas mensais que o cliente demanda por serviço.',
      'Defina seu custo hora e a margem de lucro desejada (%).',
      'O sistema calcula o valor ideal. Clique em "Criar Proposta" para enviar ao cliente.'
    ],
    relatedPages: ['Propostas Comerciais', 'Meus Planos'],
    richContent: {
      intro: 'Precificação correta é a base da rentabilidade. Esta calculadora usa suas horas, custo e margem para sugerir o valor ideal.',
      workflow: [
        'Liste os serviços que o cliente demanda',
        'Estime horas mensais para cada serviço',
        'Defina seu custo hora (salários + encargos + overhead ÷ horas produtivas)',
        'Escolha a margem de lucro desejada (ex: 30%)',
        'O sistema calcula o valor ideal',
        'Compare com o honorário atual e ajuste se necessário'
      ],
      rules: [
        'Custo hora deve incluir todos os encargos',
        'Margem mínima recomendada: 20%',
        'Horas estimadas devem ser realistas (não otimismo)',
        'Revise precificação a cada 6 meses'
      ],
      examples: [
        {
          title: 'Cálculo de exemplo',
          content: '20h/mês × R$ 50/h (custo) = R$ 1.000\nMargem 30% = R$ 1.000 ÷ 0.7 = R$ 1.428,57\nValor ideal: R$ 1.430/mês'
        }
      ]
    }
  },

  // -----------------------------------------------------------------
  // 📄 PÁGINA: Meus Planos (Sprints A1, A2, A4)
  // 📍 ROTA: /dashboard/precificacao/meus-planos
  // 🎯 PROPÓSITO: Gestão de pacotes de serviços, multiplicadores,
  //    herança de itens e simulador "Dinheiro na Mesa".
  // 👤 USUÁRIO: ADMIN, MANAGER
  // 🔄 ATUALIZAR QUANDO: Novas regras de herança (ADR-020) forem
  //    adicionadas ou o simulador de ganho/concessão mudar.
  // -----------------------------------------------------------------
  '/dashboard/precificacao/meus-planos': {
    title: 'Meus Planos',
    description: 'Gerencie os pacotes de serviços que seu escritório oferece (START, PRIME, BLACK, etc.), seus multiplicadores e simule o impacto financeiro.',
    audience: 'Empresa',
    controlType: 'Estratégico',
    steps: [
      'Visualize todos os planos ativos e seus respectivos multiplicadores de preço.',
      'Edite os serviços inclusos em cada plano e marque planos como "Independente" se necessário.',
      'Use o "Simulador: Dinheiro na Mesa" para ver o impacto de descontos no lucro anual.'
    ],
    relatedPages: ['Precificação', 'Desempenho Comercial'],
    richContent: {
      intro: 'Planos comerciais são a base da sua oferta. Cada plano tem um multiplicador que define o preço relativo ao valor de referência, com herança automática de itens.',
      workflow: [
        'Defina o valor de referência (ex: R$ 1.000)',
        'Crie planos com multiplicadores (START 1.0, PRIME 1.5, BLACK 2.0)',
        'Associe serviços a cada plano (o sistema calcula a herança)',
        'Use o simulador para ver ganho vs. concessão em tempo real',
        'Revise multiplicadores trimestralmente'
      ],
      rules: [
        'Plano independente não herda e não doa itens (ADR-020)',
        'Multiplicador mínimo: 1.0',
        'Serviços podem estar em múltiplos planos',
        'Alterações em planos afetam propostas futuras, não as existentes'
      ]
    }
  },

  // -----------------------------------------------------------------
  // 📄 PÁGINA: Desempenho Comercial
  // 📍 ROTA: /dashboard/precificacao/desempenho
  // 🎯 PROPÓSITO: Funil de vendas, conversão, tempo de fechamento
  //    e análise de "dinheiro na mesa" (ganho vs. concessão).
  // 👤 USUÁRIO: ADMIN, MANAGER
  // 🔄 ATUALIZAR QUANDO: Novas métricas de funil forem adicionadas
  //    ou a fórmula de "dinheiro na mesa" mudar.
  // -----------------------------------------------------------------
  '/dashboard/precificacao/desempenho': {
    title: 'Desempenho Comercial',
    description: 'Funil de vendas do escritório: conversão, tempo médio de fechamento, descontos praticados e "dinheiro na mesa".',
    audience: 'Empresa',
    controlType: 'Estratégico',
    steps: [
      'Analise a taxa de conversão e o tempo médio para fechar propostas.',
      'Verifique o card "Dinheiro em Jogo" para ver o impacto dos descontos no lucro anual.',
      'Use os filtros de período (7d, 30d, 12m) para identificar tendências.'
    ],
    relatedPages: ['Propostas Comerciais', 'Score do Escritório'],
    richContent: {
      intro: 'Esta página responde 3 perguntas essenciais: Quantas propostas viram clientes? Quanto tempo leva para fechar? Quanto dinheiro você está deixando na mesa?',
      kpis: [
        { name: 'Conversão', meaning: '% de propostas que viram clientes', location: 'Card superior esquerdo' },
        { name: 'Tempo médio', meaning: 'Dias entre "enviada" e "fechada"', location: 'Card superior direito' },
        { name: 'Desconto médio', meaning: '% médio de desconto praticado', location: 'Card central' },
        { name: 'Ganho acumulado', meaning: 'Receita real mensal/anual', location: 'Card "Dinheiro em Jogo"' },
        { name: 'Concessão', meaning: 'Quanto você "deixou de ganhar" com desconto', location: 'Card "Dinheiro em Jogo"' }
      ],
      workflow: [
        '1ª segunda do mês: abra Desempenho Comercial',
        'Filtre "Mês anterior"',
        'Analise conversão + tempo médio',
        'Se conversão < 20% → revise propostas perdidas',
        'Se tempo > 30 dias → acelere follow-up',
        'Se desconto > 20% → revise tabela de preços',
        'Anote 1 ação de melhoria no Planejamento'
      ],
      rules: [
        'Não olhe apenas a conversão: taxa alta com ticket baixo pode ser pior que taxa média com ticket alto',
        'Desconto não é vilão: às vezes 10% fecha um cliente de 3 anos = lucro garantido',
        'Compare períodos iguais: não compare dezembro (alto) com janeiro (baixo)',
        'Motivos de perda são ouro: use-os para ajustar proposta e argumentação'
      ],
      detailedSteps: [
        {
          title: 'Interpretar taxa de conversão',
          description: 'Acima de 30% = funil saudável. Entre 15-30% = precisa melhorar follow-up. Abaixo de 15% = problema na qualificação ou proposta.'
        },
        {
          title: 'Analisar tempo médio',
          description: 'Propostas BLACK levam mais tempo que START. Se o tempo está subindo, revise seu processo de follow-up.'
        },
        {
          title: 'Card "Dinheiro em Jogo"',
          description: 'Mostra Ganho real × Concessão (desconto dado). Balanço líquido = Ganho − Concessão.'
        },
        {
          title: 'Funil de conversão',
          description: 'DRAFT → SENT → VIEWED → WON/LOST. Identifique em qual etapa as propostas estão travando.'
        },
        {
          title: 'Motivos de perda',
          description: '"Fechou com concorrente mais barato" = problema de preço. "Não teve retorno" = problema de follow-up. "Adiou decisão" = problema de urgência.'
        }
      ]
    }
  },

  // -----------------------------------------------------------------
  // 📄 PÁGINA: Listagem de Propostas Comerciais
  // 📍 ROTA: /dashboard/precificacao/propostas
  // 🎯 PROPÓSITO: Tabela centralizada de todas as propostas, com
  //    busca e acesso rápido às versões (Sprint A3).
  // 👤 USUÁRIO: ADMIN, MANAGER, USER
  // 🔄 ATUALIZAR QUANDO: Novas colunas forem adicionadas à tabela
  //    ou filtros de busca mudarem.
  // -----------------------------------------------------------------
  '/dashboard/precificacao/propostas': {
    title: 'Propostas Comerciais',
    description: 'Listagem centralizada de todas as propostas do escritório, com busca, filtros e acesso rápido ao gerenciamento de versões.',
    audience: 'Empresa',
    controlType: 'Operacional',
    steps: [
      'Use a barra de busca para encontrar propostas por nome do cliente ou número.',
      'Clique no ícone de Olho (👁️) para visualizar ou editar os detalhes da proposta.',
      'Clique no ícone de Ramificação (🌿) para gerenciar as versões desta proposta.'
    ],
    relatedPages: ['Precificação', 'Meus Planos'],
    richContent: {
      intro: 'Esta é a central de comando das suas vendas. Aqui você tem visão macro de todas as propostas, seus status e pode navegar rapidamente para ações específicas.',
      workflow: [
        'Acesse diariamente para verificar propostas novas ou pendentes',
        'Use a busca para localizar clientes específicos',
        'Acesse a visualização detalhada para editar textos e valores',
        'Use o gerenciamento de versões para histórico de negociações'
      ],
      rules: [
        'A lista mostra apenas propostas do seu tenant (companyId)',
        'Propostas excluídas usam soft delete e não aparecem aqui',
        'O status muda automaticamente ao usar as ações (ex: Enviar, Fechar)'
      ]
    }
  },

  // -----------------------------------------------------------------
  // 📄 PÁGINA: Detalhes da Proposta
  //  ROTA: /dashboard/precificacao/propostas/[id]
  // 🎯 PROPÓSITO: Edição completa da proposta, textos, itens e
  //    botão de fechamento com ganho (Sprint A4).
  // 👤 USUÁRIO: ADMIN, MANAGER
  // 🔄 ATUALIZAR QUANDO: Novos campos de texto forem adicionados
  //    ou o modal de fechamento (Sprint A4) mudar.
  // -----------------------------------------------------------------
  '/dashboard/precificacao/propostas/[id]': {
    title: 'Detalhes da Proposta',
    description: 'Edição completa dos dados do cliente, textos da proposta, itens e ação de fechamento com cálculo de ganho.',
    audience: 'Empresa',
    controlType: 'Operacional',
    steps: [
      'Preencha os dados do cliente, regime tributário e faturamento estimado.',
      'Edite os textos de "Sobre o Escritório", "Diferenciais" e "Termos Comerciais".',
      'Clique em "Fechar Proposta" para abrir o modal de cálculo de ganho e concessão.'
    ],
    relatedPages: ['Propostas Comerciais', 'Versões da Proposta'],
    richContent: {
      intro: 'Aqui você monta a proposta final. Todos os textos editáveis aqui serão refletidos no link público enviado ao cliente.',
      workflow: [
        'Preencha os dados financeiros do cliente',
        'Personalize os textos para dar um toque profissional',
        'Revise os itens incluídos no plano',
        'Ao fechar, use o modal para registrar o desconto e o ganho real'
      ],
      rules: [
        'Propostas fechadas (CLOSED_WON/LOST) não podem ter seus valores alterados',
        'O botão "Fechar Proposta" só aparece para propostas em DRAFT ou SENT',
        'O link público é gerado com base no "slug" único da proposta'
      ]
    }
  },

  // -----------------------------------------------------------------
  //  PÁGINA: Versões da Proposta (Sprint A3)
  // 📍 ROTA: /dashboard/precificacao/propostas/[id]/versoes
  // 🎯 PROPÓSITO: Histórico imutável de versões, comparador lado a
  //    lado e ativação de versões antigas.
  // 👤 USUÁRIO: ADMIN, MANAGER
  // 🔄 ATUALIZAR QUANDO: A lógica de comparação (diff) ou o fluxo
  //    de ativação de versões for alterado.
  // -----------------------------------------------------------------
  '/dashboard/precificacao/propostas/[id]/versoes': {
    title: 'Versões da Proposta',
    description: 'Gerencie o histórico imutável de versões da proposta, compare alterações lado a lado e reative versões antigas se necessário.',
    audience: 'Empresa',
    controlType: 'Estratégico',
    steps: [
      'Clique em "Nova Versão" para clonar a proposta atual e iniciar uma nova negociação.',
      'Use a aba "Comparar" para ver diferenças de valores e itens entre duas versões.',
      'Clique em "Ativar esta" para tornar uma versão antiga a versão principal novamente.'
    ],
    relatedPages: ['Detalhes da Proposta', 'Propostas Comerciais'],
    richContent: {
      intro: 'O versionamento garante que você nunca perca o histórico de uma negociação. Versões antigas são imutáveis, servindo como auditoria.',
      workflow: [
        'O cliente pediu mudanças? Clique em "Nova Versão" e informe o motivo.',
        'Edite a nova versão (v2) à vontade. A v1 permanece intacta.',
        'Use o comparador para mostrar ao cliente o que mudou.',
        'Se o cliente voltar atrás, use "Ativar esta" na v1.'
      ],
      rules: [
        'Criar nova versão marca a anterior como isCurrent = false',
        'A nova versão nasce com status DRAFT, mesmo que a anterior estivesse enviada',
        'O comparador destaca em vermelho o que foi removido e em verde o que foi adicionado',
        'A ativação de versão é uma transação atômica no banco'
      ],
      detailedSteps: [
        {
          title: 'Criar nova versão',
          description: 'O sistema clona todos os dados e itens, incrementa o número da versão e limpa as datas de envio/fechamento.'
        },
        {
          title: 'Comparar versões',
          description: 'Selecione a Versão A e a Versão B. O sistema mostra diferenças em campos de texto, valores e lista de itens (adicionados/removidos/alterados).'
        },
        {
          title: 'Ativar versão',
          description: 'Ao ativar, o sistema define isCurrent = true nesta versão e false em todas as outras da mesma cadeia. A proposta principal aponta para esta.'
        }
      ]
    }
  },


  // =================================================================
  // 🧾 SEÇÃO 3: FISCAL
  // =================================================================
  // Páginas do módulo fiscal: importação de NF-e, estoque, apuração
  // de ICMS, SPED e relatórios. Todas multi-cliente (seletor global).
  // =================================================================

  // -----------------------------------------------------------------
  // 📄 PÁGINA: Importar NF-e
  //  ROTA: /dashboard/fiscal
  //  PROPÓSITO: Upload em lote de XMLs de NF-e de entrada com
  //    parser automático e revisão prévia.
  //  USUÁRIO: ADMIN, MANAGER, USER (com acesso fiscal)
  // 🔄 ATUALIZAR QUANDO: O parser de XML mudar de versão (ex: 4.0
  //    → 5.0), o limite de upload (50) for alterado, ou o fluxo de
  //    revisão prévia for redesenhado.
  // -----------------------------------------------------------------
  '/dashboard/fiscal': {
    title: 'Importar NF-e',
    description: 'Entrada de notas fiscais de compra dos seus clientes via upload de arquivos XML em lote.',
    audience: 'Cliente',
    controlType: 'Fiscal',
    steps: [
      'Selecione o cliente fiscal no seletor global (canto superior).',
      'Arraste os arquivos XML das NF-e para a área de upload (até 50 por vez).',
      'O sistema extrai fornecedor, produtos, valores e impostos automaticamente.',
      'Revise a tela de pré-visualização antes de confirmar. Nada é gravado sem sua aprovação.'
    ],
    relatedPages: ['Notas Fiscais', 'Estoque'],
    richContent: {
      intro: 'A importação de NF-e é o ponto de entrada do módulo fiscal. XMLs são parseados automaticamente, fornecedores criados e produtos casados com o catálogo.',
      workflow: [
        'Selecione o cliente fiscal no seletor global',
        'Arraste XMLs para a área de upload (até 50)',
        'Aguarde o parsing automático (layout 4.0)',
        'Revise o preview (fornecedores, produtos, valores)',
        'Confirme para gravar no banco',
        'NF-e aprovadas vão para "Notas Fiscais" e alimentam Estoque e Apuração ICMS'
      ],
      rules: [
        'Layout NF-e 4.0 (ABRASF)',
        'Chave de acesso única por empresa (anti-duplicidade)',
        'Fornecedores criados automaticamente por CNPJ',
        'Produtos não cadastrados vão para revisão',
        'XMLs rejeitados vão para pasta nfse-failed'
      ],
      detailedSteps: [
        {
          title: 'Upload em lote',
          description: 'Arraste múltiplos XMLs de uma vez. O sistema processa sequencialmente e mostra progresso.'
        },
        {
          title: 'Revisão prévia',
          description: 'Antes de confirmar, revise fornecedores criados, produtos casados e valores totais. Clique em "Rejeitar" para NF-e com problemas.'
        },
        {
          title: 'Confirmação',
          description: 'Ao confirmar, o sistema grava NF-e, itens, impostos e atualiza estoque (kardex). Operação atômica: tudo ou nada.'
        }
      ]
    }
  },

  // -----------------------------------------------------------------
  //  PÁGINA: Notas Fiscais
  // 📍 ROTA: /dashboard/fiscal/notas
  // 🎯 PROPÓSITO: Lista completa de NF-e importadas com busca,
  //    filtros e auditoria tributária por item.
  // 👤 USUÁRIO: ADMIN, MANAGER, USER (com acesso fiscal)
  // 🔄 ATUALIZAR QUANDO: Novos filtros forem adicionados, a auditoria
  //    Base × Alíquota mudar ou o layout do PDF de impressão for
  //    alterado.
  // -----------------------------------------------------------------
  '/dashboard/fiscal/notas': {
    title: 'Notas Fiscais',
    description: 'Lista completa de todas as NF-e importadas, com busca avançada, filtros e auditoria tributária por item.',
    audience: 'Cliente',
    controlType: 'Fiscal',
    steps: [
      'Use a busca para encontrar notas por número, chave de acesso ou nome do produto.',
      'Clique no ícone de olho para ver o detalhe completo, incluindo a auditoria Base × Alíquota.',
      'Use o botão 🖨️ Imprimir para gerar um PDF fiscal otimizado da nota.'
    ],
    relatedPages: ['Importar NF-e', 'Apuração ICMS'],
    richContent: {
      intro: 'Aqui você consulta todas as NF-e importadas, com filtros avançados e auditoria tributária completa por item.',
      kpis: [
        { name: 'Total de NF-e', meaning: 'Número de notas no período', location: 'Card superior' },
        { name: 'Valor Total', meaning: 'Soma dos valores das notas', location: 'Card superior' },
        { name: 'ICMS Total', meaning: 'Soma do ICMS destacado', location: 'Card superior' }
      ],
      workflow: [
        'Filtre por período, fornecedor ou produto',
        'Use a busca para encontrar notas específicas',
        'Clique no detalhe para ver itens e auditoria',
        'Imprima ou exporte conforme necessário'
      ],
      rules: [
        'NF-e importadas não podem ser editadas (apenas excluídas com estorno)',
        'Auditoria Base × Alíquota detecta divergências de cálculo',
        'Tolerância de R$ 0,02 para arredondamentos',
        'CSOSN 102/103 (Simples) não têm base ICMS por item'
      ]
    }
  },

  // -----------------------------------------------------------------
  // 📄 PÁGINA: Estoque (Kardex)
  //  ROTA: /dashboard/fiscal/estoque
  // 🎯 PROPÓSITO: Controle de inventário com custo médio ponderado
  //    móvel e histórico de movimentações.
  // 👤 USUÁRIO: ADMIN, MANAGER, USER (com acesso fiscal)
  // 🔄 ATUALIZAR QUANDO: A fórmula de custo médio mudar, novos tipos
  //    de movimentação forem adicionados ou a lógica de ajuste manual
  //    for alterada.
  // -----------------------------------------------------------------
  '/dashboard/fiscal/estoque': {
    title: 'Estoque (Kardex)',
    description: 'Controle de inventário dos produtos dos clientes com custo médio ponderado móvel e histórico de movimentações.',
    audience: 'Cliente',
    controlType: 'Fiscal',
    steps: [
      'Visualize o saldo atual e o custo médio de cada produto.',
      'Clique no Kardex de um produto para ver todo o histórico de entradas e saídas.',
      'Faça ajustes manuais de inventário quando necessário (exige justificativa obrigatória).'
    ],
    relatedPages: ['Importar NF-e', 'Comparativo'],
    richContent: {
      intro: 'O Estoque usa custo médio ponderado móvel (exigência fiscal). Cada entrada recalcula o custo médio automaticamente.',
      kpis: [
        { name: 'Total de Produtos', meaning: 'Número de produtos no catálogo', location: 'Card superior' },
        { name: 'Valor do Estoque', meaning: 'Saldo × custo médio de todos os produtos', location: 'Card superior' },
        { name: 'Movimentações no Mês', meaning: 'Entradas + saídas no período', location: 'Card superior' }
      ],
      workflow: [
        'Consulte saldo e custo médio de cada produto',
        'Veja o Kardex (histórico completo de movimentações)',
        'Faça ajustes manuais quando necessário (com justificativa)',
        'Exporte relatórios para conferência'
      ],
      rules: [
        'Custo médio recalculado a cada entrada',
        'Ajustes manuais exigem justificativa obrigatória',
        'Estorno de NF-e recalcula custo médio (replay)',
        'Precisão: Decimal(12,4) para quantidades, Decimal(12,2) para valores'
      ],
      detailedSteps: [
        {
          title: 'Consultar saldo',
          description: 'A tabela mostra produto, saldo atual, custo médio e valor total. Filtre por NCM, descrição ou código.'
        },
        {
          title: 'Ver Kardex',
          description: 'Clique no ícone de histórico para ver todas as movimentações do produto (entradas, saídas, ajustes) com datas e valores.'
        },
        {
          title: 'Ajuste manual',
          description: 'Clique em "Ajustar", informe quantidade e valor, justifique o motivo. O sistema recalcula custo médio.'
        }
      ]
    }
  },

  // -----------------------------------------------------------------
  // 📄 PÁGINA: Apuração ICMS
  //  ROTA: /dashboard/fiscal/apuracao
  // 🎯 PROPÓSITO: Cálculo mensal do ICMS a pagar/creditar com
  //    créditos automáticos das NF-e.
  // 👤 USUÁRIO: ADMIN, MANAGER (com acesso fiscal)
  // 🔄 ATUALIZAR QUANDO: A alíquota padrão mudar, novas regras de
  //    crédito forem adicionadas ou o fluxo de fechamento/reabertura
  //    for alterado.
  // -----------------------------------------------------------------
  '/dashboard/fiscal/apuracao': {
    title: 'Apuração ICMS',
    description: 'Cálculo mensal do ICMS a pagar ou a creditar, com créditos puxados automaticamente das NF-e de entrada.',
    audience: 'Cliente',
    controlType: 'Fiscal',
    steps: [
      'Confira os créditos de ICMS já preenchidos pelo sistema.',
      'Lance os débitos (vendas × alíquota) manualmente.',
      'Quando o saldo estiver correto, clique em "Fechar mês" (trava de compliance).'
    ],
    relatedPages: ['Notas Fiscais', 'SPED Fiscal'],
    richContent: {
      intro: 'A Apuração ICMS consolida créditos (compras) e débitos (vendas) para calcular o imposto a pagar ou creditar no mês.',
      kpis: [
        { name: 'Créditos do Mês', meaning: 'ICMS destacado nas NF-e de entrada', location: 'Card superior' },
        { name: 'Débitos do Mês', meaning: 'ICMS calculado sobre vendas', location: 'Card superior' },
        { name: 'Saldo a Pagar', meaning: 'Débitos − Créditos (se positivo)', location: 'Card central' },
        { name: 'Crédito Acumulado', meaning: 'Créditos não utilizados (se negativo)', location: 'Card central' }
      ],
      workflow: [
        '1ª semana do mês: confira créditos automáticos das NF-e',
        'Lance débitos manualmente (vendas × alíquota)',
        'Confronte saldo com a escrituração contábil',
        'Feche o mês quando tudo estiver correto',
        'Exporte para SPED ou relatório gerencial'
      ],
      rules: [
        'Créditos são puxados automaticamente das NF-e de entrada',
        'Débitos devem ser lançados manualmente',
        'Mês fechado é imutável (trava de compliance)',
        'Reabertura exige justificativa e auditoria',
        'Alíquota padrão: 18% (ajuste conforme UF)'
      ],
      detailedSteps: [
        {
          title: 'Conferir créditos',
          description: 'A grade mostra os 12 meses. Créditos do mês atual já estão preenchidos pelas NF-e importadas. Revise valores.'
        },
        {
          title: 'Lançar débitos',
          description: 'Clique no mês, informe vendas totais e alíquota. O sistema calcula ICMS devido.'
        },
        {
          title: 'Fechar mês',
          description: 'Quando créditos e débitos estiverem corretos, clique em "Fechar". O mês fica bloqueado para edições.'
        }
      ]
    }
  },

  // -----------------------------------------------------------------
  //  PÁGINA: SPED Fiscal (Bloco H)
  // 📍 ROTA: /dashboard/fiscal/sped
  // 🎯 PROPÓSITO: Exportação do inventário físico para o SPED Fiscal,
  //    reconstruído historicamente a partir do Kardex.
  //  USUÁRIO: ADMIN, MANAGER (com acesso fiscal)
  // 🔄 ATUALIZAR QUANDO: O layout oficial do SPED mudar (ex: novas
  //    linhas H015) ou a lógica de reconstrução histórica for alterada.
  // -----------------------------------------------------------------
  '/dashboard/fiscal/sped': {
    title: 'SPED Fiscal (Bloco H)',
    description: 'Exportação do inventário físico para o SPED Fiscal, reconstruído historicamente a partir do Kardex.',
    audience: 'Cliente',
    controlType: 'Fiscal',
    steps: [
      'Selecione a data-base do inventário.',
      'O sistema reconstrói o saldo histórico exato naquela data.',
      'Exporte em .txt (layout oficial da Receita) ou .csv (para conferência no Excel).'
    ],
    relatedPages: ['Apuração ICMS', 'Relatório Inventário'],
    richContent: {
      intro: 'O SPED Fiscal Bloco H exige inventário físico na data-base. O sistema reconstrói o saldo histórico reprocessando o Kardex até aquela data.',
      workflow: [
        'Defina a data-base do inventário (ex: 31/12/2026)',
        'O sistema reprocessa o Kardex até a data-base',
        'Revise o saldo reconstruído',
        'Exporte em .txt (layout oficial) ou .csv (conferência)',
        'Envie o arquivo ao contador ou use para escrituração'
      ],
      rules: [
        'Layout oficial: H001, H005, H010, H990',
        'Separador pipe (|) no .txt',
        'Datas no formato ddmmaaaa',
        'Valores com 2 casas decimais',
        'Reconstrução histórica é determinística (mesmo resultado sempre)'
      ],
      examples: [
        {
          title: 'Exemplo de linha H010',
          content: '|H010|01012026|001|PRODUTO A|001|100,0000|10,50|1050,00|018|189,00|'
        }
      ]
    }
  },

  // -----------------------------------------------------------------
  // 📄 PÁGINA: Comparativo de Estoque
  //  ROTA: /dashboard/fiscal/comparativo
  // 🎯 PROPÓSITO: Conferência visual de divergências entre estoque
  //    inicial, entradas e saldo atual.
  // 👤 USUÁRIO: ADMIN, MANAGER (com acesso fiscal)
  // 🔄 ATUALIZAR QUANDO: Os thresholds de divergência (5% / 2-5%)
  //    forem recalibrados ou o drill-down de evidências for redesenhado.
  // -----------------------------------------------------------------
  '/dashboard/fiscal/comparativo': {
    title: 'Comparativo de Estoque',
    description: 'Conferência visual de divergências entre o estoque inicial, as entradas via NF-e e o saldo atual.',
    audience: 'Cliente',
    controlType: 'Fiscal',
    steps: [
      'Identifique produtos com divergências destacadas em vermelho/âmbar.',
      'Clique no ícone de lupa (👁) para ver o drill-down das evidências por origem.',
      'Use os dados para realizar ajustes manuais no Estoque, se necessário.'
    ],
    relatedPages: ['Estoque', 'Importar NF-e'],
    richContent: {
      intro: 'O Comparativo responde: "Por que o saldo atual não bate com o inicial + entradas?" Ele mostra divergências e suas origens.',
      workflow: [
        'Selecione o período de comparação',
        'Identifique produtos com divergências (vermelho/âmbar)',
        'Clique no drill-down para ver evidências',
        'Investigue a causa (erro de digitação, NF-e não importada, ajuste não registrado)',
        'Faça ajustes manuais se necessário'
      ],
      rules: [
        'Divergência > 5% = destaque vermelho',
        'Divergência 2-5% = destaque âmbar',
        'Drill-down mostra origem: inicial, NF-e, ajustes',
        'Ajustes manuais devem ser justificados'
      ]
    }
  },

  // -----------------------------------------------------------------
  // 📄 PÁGINA: Relatório de Inventário
  // 📍 ROTA: /dashboard/fiscal/relatorio-inventario
  //  PROPÓSITO: Relatório fiscal detalhado (modelo H010 estendido)
  //    com 17 colunas e tributos.
  // 👤 USUÁRIO: ADMIN, MANAGER (com acesso fiscal)
  // 🔄 ATUALIZAR QUANDO: Novas colunas forem adicionadas ao relatório
  //    ou o layout do PDF for alterado.
  // -----------------------------------------------------------------
  '/dashboard/fiscal/relatorio-inventario': {
    title: 'Relatório de Inventário',
    description: 'Relatório fiscal detalhado (modelo H010 estendido) com 17 colunas, incluindo tributos de cada produto.',
    audience: 'Cliente',
    controlType: 'Fiscal',
    steps: [
      'Selecione o cliente e o período de referência.',
      'O sistema compila quantidade, valor e tributos (ICMS, IPI, PIS, COFINS).',
      'Exporte em PDF para enviar ao cliente ou arquivar.'
    ],
    relatedPages: ['SPED Fiscal', 'Comparativo'],
    richContent: {
      intro: 'Este relatório estende o modelo H010 do SPED com 17 colunas, incluindo todos os tributos destacados nas aquisições.',
      workflow: [
        'Selecione o cliente fiscal',
        'Defina o período (data-base)',
        'O sistema compila dados do Kardex + NF-e',
        'Revise as 17 colunas (código, descrição, qty, valor, ICMS, IPI, PIS, COFINS, etc)',
        'Exporte em PDF ou CSV'
      ],
      rules: [
        '17 colunas: código, descrição, NCM, unidade, quantidade, valor unitário, valor total, ICMS, ICMS-ST, IPI, PIS, COFINS, origem, CST, CFOP, alíquota, valor tributo',
        'PDF otimizado para impressão A4',
        'CSV com BOM UTF-8 para Excel',
        'Dados são snapshot da data-base (não mudam com o tempo)'
      ]
    }
  },


  // =================================================================
  // 🏦 SEÇÃO 4: BANCÁRIO
  // =================================================================
  // Ciclo bancário: importação de extrato, classificação com memória,
  // DRE gerencial, fechamento com trava de compliance.
  // =================================================================

  // -----------------------------------------------------------------
  // 📄 PÁGINA: Fechamento + DRE Bancário
  // 📍 ROTA: /dashboard/fechamento
  // 🎯 PROPÓSITO: Ciclo completo: importação de extrato, classificação
  //    automática com memória, DRE gerencial e fechamento do mês.
  // 👤 USUÁRIO: ADMIN, MANAGER, USER (com acesso bancário)
  // 🔄 ATUALIZAR QUANDO: O parser CSV mudar, as camadas de classificação
  //    forem alteradas, ou a trava de compliance de fechamento for
  //    redesenhada.
  // -----------------------------------------------------------------
  '/dashboard/fechamento': {
    title: 'Fechamento + DRE Bancário',
    description: 'Ciclo completo: importação de extrato, classificação automática com memória, DRE gerencial e fechamento do mês.',
    audience: 'Cliente',
    controlType: 'Financeiro',
    steps: [
      'Aba Extrato: Importe o CSV do banco. O sistema classifica usando a memória de aprendizado.',
      'Aba DRE: Veja receitas e despesas por natureza. Exporte em PDF ou CSV.',
      'Aba Conciliação: Confira se débitos do banco batem com NF-e de entrada.',
      'Fechar mês: Bloqueia edições (trava de compliance). Use "Reabrir" com justificativa se precisar corrigir.'
    ],
    relatedPages: ['Lançamentos Contábeis', 'DRE do Cliente (Oficial)'],
    richContent: {
      intro: 'O Fechamento Mensal é o coração do ciclo bancário. Importe extratos, classifique automaticamente, gere DRE gerencial e feche o mês com trava de compliance.',
      kpis: [
        { name: 'Transações no Mês', meaning: 'Número de lançamentos no período', location: 'Card superior' },
        { name: 'Receitas', meaning: 'Soma de créditos classificados', location: 'Card superior' },
        { name: 'Despesas', meaning: 'Soma de débitos classificados', location: 'Card superior' },
        { name: 'Saldo', meaning: 'Receitas − Despesas', location: 'Card central' }
      ],
      workflow: [
        '1ª semana do mês: importe o CSV do banco',
        'O sistema classifica automaticamente (memória de aprendizado)',
        'Revise classificações pendentes (🟡)',
        'Reclassifique se necessário (sistema aprende)',
        'Gere o DRE gerencial por natureza',
        'Concilie débitos com NF-e de entrada',
        'Feche o mês quando tudo estiver correto'
      ],
      rules: [
        'Parser CSV aceita qualquer formato (separador, milhares, datas)',
        'Classificação em 3 camadas: memória → regras built-in → pendente',
        'Reclassificação em lote com "Aprender para próximo mês"',
        'Mês fechado é imutável (trava de compliance)',
        'Reabertura exige justificativa e auditoria'
      ],
      detailedSteps: [
        {
          title: 'Importar extrato',
          description: 'Arraste o CSV do banco. O sistema detecta automaticamente separador, formato de milhares e datas. Mostra preview antes de confirmar.'
        },
        {
          title: 'Classificação automática',
          description: 'O sistema usa memória de aprendizado (contraparte normalizada) para classificar transações.  Auto (≥80%), 🟡 Regra (50-79%), 🟠 Revisar (<50%).'
        },
        {
          title: 'DRE gerencial',
          description: 'Aba DRE mostra receitas e despesas por natureza (categoria). Exporte em PDF ou CSV. Subtotais por grupo DRE (Receita, Despesa, Imposto, etc).'
        },
        {
          title: 'Conciliação NF-e',
          description: 'Aba Conciliação cruza débitos bancários com NF-e de entrada. Motor de score (valor 60% + nome 30% + data 10%). Confirme ou descarte sugestões.'
        },
        {
          title: 'Fechar mês',
          description: 'Quando tudo estiver correto, clique em "Fechar Mês". O mês fica bloqueado para edições. Use "Reabrir" com justificativa se precisar corrigir.'
        }
      ]
    }
  },


  // =================================================================
  // 📒 SEÇÃO 5: CONTÁBIL
  // =================================================================
  // Plano de contas, lançamentos de partida dobrada, revisão e
  // promoção do bancário para o contábil.
  // =================================================================

  // -----------------------------------------------------------------
  // 📄 PÁGINA: Lançamentos Contábeis
  // 📍 ROTA: /dashboard/lancamentos
  // 🎯 PROPÓSITO: Registro de partidas dobradas (Débito e Crédito)
  //    para escrituração contábil oficial.
  // 👤 USUÁRIO: ADMIN, MANAGER (com acesso contábil)
  // 🔄 ATUALIZAR QUANDO: O autocomplete de contas mudar, novas regras
  //    de validação D=C forem adicionadas ou a promoção do bancário
  //    for alterada.
  // -----------------------------------------------------------------
  '/dashboard/lancamentos': {
    title: 'Lançamentos Contábeis',
    description: 'Registro de partidas dobradas (Débito e Crédito) para escrituração contábil oficial.',
    audience: 'Empresa',
    controlType: 'Fiscal',
    steps: [
      'Crie um lançamento definindo data, histórico e pelo menos 2 contas.',
      'Use o autocomplete para buscar contas por código ou nome.',
      'O sistema só permite salvar se o total de Débitos for igual ao de Créditos.'
    ],
    relatedPages: ['Plano de Contas', 'Revisão de Lançamentos'],
    richContent: {
      intro: 'Lançamentos contábeis seguem o princípio das partidas dobradas: todo débito tem um crédito correspondente. Aqui você registra a escrituração oficial.',
      workflow: [
        'Crie um lançamento com data e histórico',
        'Adicione pelo menos 2 contas (uma debitada, outra creditada)',
        'Use autocomplete para buscar contas',
        'O sistema valida D = C antes de salvar',
        'Promova meses fechados do bancário para contábil'
      ],
      rules: [
        'Partida dobrada: Débito = Crédito obrigatoriamente',
        'Autocomplete busca por código ou nome',
        'Contas podem ser criadas inline (upsert por companyId + code)',
        'Lançamentos promovidos do bancário são idempotentes',
        'Mês contábil fechado é imutável'
      ],
      detailedSteps: [
        {
          title: 'Criar lançamento',
          description: 'Clique em "Novo Lançamento", informe data e histórico. Adicione contas debitadas e creditadas com valores. O sistema valida D = C.'
        },
        {
          title: 'Autocomplete de contas',
          description: 'Digite código ou nome da conta. O sistema filtra e sugere. Navegue com ↑↓ e Enter. Crie conta nova se não existir.'
        },
        {
          title: 'Promover do bancário',
          description: 'Meses fechados no bancário podem ser promovidos para contábil com 1 clique. Crédito bancário → D Banco/C Receita. Débito bancário → D Despesa/C Banco.'
        }
      ]
    }
  },

  // -----------------------------------------------------------------
  // 📄 PÁGINA: Revisão de Lançamentos
  // 📍 ROTA: /dashboard/lancamentos/revisao
  // 🎯 PROPÓSITO: Conferência manual de lançamentos antes de promover
  //    o mês para a contabilidade oficial.
  // 👤 USUÁRIO: ADMIN, MANAGER (com acesso contábil)
  // 🔄 ATUALIZAR QUANDO: Novos filtros de revisão forem adicionados
  //    ou o fluxo de marcação em lote for alterado.
  // -----------------------------------------------------------------
  '/dashboard/lancamentos/revisao': {
    title: 'Revisão de Lançamentos',
    description: 'Conferência manual de lançamentos antes de promover o mês para a contabilidade oficial.',
    audience: 'Empresa',
    controlType: 'Fiscal',
    steps: [
      'Filtre os lançamentos do período que deseja revisar.',
      'Edite contas ou valores se identificar algum erro de classificação.',
      'Marque como "Revisado". Apenas lançamentos revisados podem ser promovidos.'
    ],
    relatedPages: ['Lançamentos Contábeis', 'Ciclo Contábil do Cliente'],
    richContent: {
      intro: 'A Revisão é a última etapa antes da escrituração oficial. Confira lançamentos, corrija erros e marque como revisado para permitir promoção.',
      workflow: [
        'Filtre lançamentos do período',
        'Revise cada lançamento (contas, valores, histórico)',
        'Edite se identificar erros',
        'Marque como "Revisado"',
        'Apenas revisados podem ser promovidos'
      ],
      rules: [
        'Lançamentos não revisados não podem ser promovidos',
        'Edições registram auditoria (quem, quando, o que mudou)',
        'Filtros: período, conta, valor, status de revisão',
        'Revisão em lote: marque múltiplos de uma vez'
      ]
    }
  },

  // -----------------------------------------------------------------
  // 📄 PÁGINA: Ciclo Contábil do Cliente
  // 📍 ROTA: /dashboard/contabil
  // 🎯 PROPÓSITO: Visão macro do fluxo contábil: balancete inicial,
  //    razão, sugestões de contraparte e promoção.
  //  USUÁRIO: ADMIN, MANAGER (com acesso contábil)
  // 🔄 ATUALIZAR QUANDO: Novas etapas do ciclo forem adicionadas ou
  //    o sugeridor de contraparte for redesenhado.
  // -----------------------------------------------------------------
  '/dashboard/contabil': {
    title: 'Ciclo Contábil do Cliente',
    description: 'Visão macro do fluxo: balancete inicial, razão, sugestões de contraparte e promoção para escrituração.',
    audience: 'Empresa',
    controlType: 'Fiscal',
    steps: [
      'Acompanhe em que etapa cada cliente está (Extrato → Classificado → Fechado → Promovido).',
      'Utilize o sugeridor de contraparte, que aprende com classificações passadas.',
      'Promova meses fechados do bancário para a contabilidade com 1 clique.'
    ],
    relatedPages: ['Fechamento + DRE Bancário', 'Plano de Contas'],
    richContent: {
      intro: 'O Ciclo Contábil mostra o fluxo completo: do extrato bancário à escrituração oficial. Cada cliente tem um status que indica em que etapa está.',
      workflow: [
        'Selecione o cliente',
        'Verifique o status atual (Extrato, Classificado, Fechado, Promovido)',
        'Use o sugeridor de contraparte para classificar transações',
        'Feche o mês no bancário',
        'Promova para contábil com 1 clique'
      ],
      rules: [
        'Status: Extrato → Classificado → Fechado → Promovido',
        'Sugeridor aprende com classificações passadas',
        'Promoção é idempotente (não duplica lançamentos)',
        'Mês deve estar FECHADO no bancário para promover'
      ]
    }
  },

  // -----------------------------------------------------------------
  // 📄 PÁGINA: Plano de Contas
  //  ROTA: /dashboard/contabil/plano-contas
  // 🎯 PROPÓSITO: Estrutura contábil do escritório (padrão SCI 90113)
  //    com mais de 1.200 contas organizadas por tipo.
  // 👤 USUÁRIO: ADMIN, MANAGER (com acesso contábil)
  // 🔄 ATUALIZAR QUANDO: Novos tipos/naturezas de conta forem
  //    adicionados ou a lógica de upsert por (companyId, code) for
  //    alterada.
  // -----------------------------------------------------------------
  '/dashboard/contabil/plano-contas': {
    title: 'Plano de Contas',
    description: 'Estrutura contábil do escritório (padrão SCI 90113) com mais de 1.200 contas organizadas por tipo.',
    audience: 'Empresa',
    controlType: 'Fiscal',
    steps: [
      'Navegue pela árvore hierárquica (Ativo, Passivo, Receita, Despesa).',
      'Crie contas novas definindo código, nome, tipo e natureza (devedora/credora).',
      'Contas em uso não podem ser excluídas (soft delete preserva o histórico).'
    ],
    relatedPages: ['Lançamentos Contábeis', 'Ciclo Contábil do Cliente'],
    richContent: {
      intro: 'O Plano de Contas segue o padrão SCI 90113 com mais de 1.200 contas. Cada cliente pode ter um plano ativo diferente.',
      workflow: [
        'Navegue pela árvore hierárquica',
        'Crie contas novas com código, nome, tipo e natureza',
        'Edite contas existentes (exceto as em uso)',
        'Desative contas obsoletas (soft delete)',
        'Atribua plano ativo a cada cliente'
      ],
      rules: [
        'Tipos: Ativo, Passivo, PL, Receita, Despesa',
        'Natureza: Devedora ou Credora',
        'Código único por companyId',
        'Contas em uso não podem ser excluídas',
        'Soft delete preserva histórico contábil'
      ],
      detailedSteps: [
        {
          title: 'Criar conta',
          description: 'Clique em "Nova Conta", informe código (ex: 1.1.01.001), nome, tipo e natureza. O sistema valida unicidade.'
        },
        {
          title: 'Editar conta',
          description: 'Clique no ícone de edição. Altere nome ou tipo. Código não pode ser alterado se a conta estiver em uso.'
        },
        {
          title: 'Desativar conta',
          description: 'Clique em "Desativar". A conta fica inativa mas preserva histórico. Contas em uso não podem ser desativadas.'
        }
      ]
    }
  },


  // =================================================================
  //  SEÇÃO 6: INTELIGÊNCIA & AURORA
  // =================================================================
  // Funcionário Digital (Aurora), relatórios, NFS-e, guias, cofre,
  // cobrança CNAB, BI, indicadores, score, mentoria, ranking e
  // planejamento tributário.
  // =================================================================

  // -----------------------------------------------------------------
  // 📄 PÁGINA: Dashboard da Aurora (Funcionário Digital)
  //  ROTA: /dashboard/funcionario-digital
  // 🎯 PROPÓSITO: Painel de controle da IA com KPIs de automação,
  //    gestão de skills e execução manual.
  // 👤 USUÁRIO: ADMIN, MANAGER
  // 🔄 ATUALIZAR QUANDO: Novas skills forem adicionadas ao catálogo,
  //    os thresholds de score (80/50) forem recalibrados ou a Regra
  //    de Ouro (ADR-030) for alterada.
  // -----------------------------------------------------------------
  '/dashboard/funcionario-digital': {
    title: 'Dashboard da Aurora',
    description: 'Painel de controle do seu "funcionário digital". Veja o que a IA processou, aprovou ou deixou para revisão humana.',
    audience: 'Empresa',
    controlType: 'Operacional',
    steps: [
      'Acompanhe os KPIs: runs hoje, auto-aprovados, pendências 🟡 e tempo economizado.',
      'Ligue ou desligue as skills (Classificação, Reconciliação, etc.) conforme a necessidade.',
      'Use o botão "Rodar agora" para executar uma skill manualmente fora do cronograma.'
    ],
    relatedPages: ['Central de Aprovações', 'Relatórios Mensais'],
    richContent: {
      intro: 'A Aurora é seu funcionário digital. Ela trabalha 24/7 processando tarefas, mas sempre com supervisão humana para ações críticas.',
      kpis: [
        { name: 'Runs Hoje', meaning: 'Número de execuções de skills hoje', location: 'Card superior' },
        { name: 'Auto-aprovados', meaning: 'Tarefas aprovadas automaticamente (score ≥80%)', location: 'Card superior' },
        { name: 'Pendências 🟡', meaning: 'Tarefas aguardando revisão humana', location: 'Card superior' },
        { name: 'Tempo Economizado', meaning: 'Horas poupadas pela automação', location: 'Card superior' }
      ],
      workflow: [
        'Diariamente: verifique pendências 🟡',
        'Revise e aprove/rejeite tarefas',
        'Ligue/desligue skills conforme necessidade',
        'Use "Rodar agora" para execução manual',
        'Acompanhe tempo economizado mensalmente'
      ],
      rules: [
        'Score ≥80% = auto-aprovação',
        'Score 50-79% = fila de revisão 🟡',
        'Score <50% = ignorado',
        'Ações LEGAL nunca são auto-aprovadas (Regra de Ouro — ADR-030)',
        'Skills podem ser ligadas/desligadas individualmente'
      ],
      detailedSteps: [
        {
          title: 'Revisar pendências',
          description: 'Clique em "Central de Aprovações" para ver tarefas 🟡. Revise cada uma, aprove ou rejeite com nota explicativa.'
        },
        {
          title: 'Ligar/desligar skills',
          description: 'No painel de skills, use o toggle para ligar/desligar. Skills desligadas não executam no cronograma.'
        },
        {
          title: 'Executar manualmente',
          description: 'Clique em "Rodar agora" para executar uma skill fora do cronograma. Útil para processamentos urgentes.'
        }
      ]
    }
  },

  // -----------------------------------------------------------------
  // 📄 PÁGINA: Relatórios Mensais (Aurora)
  // 📍 ROTA: /dashboard/funcionario-digital/relatorios
  // 🎯 PROPÓSITO: Relatórios PDF mensais gerados automaticamente pela
  //    Aurora para cada cliente.
  // 👤 USUÁRIO: ADMIN, MANAGER
  // 🔄 ATUALIZAR QUANDO: O template do PDF for alterado, novos KPIs
  //    forem incluídos no relatório ou o fluxo de geração manual for
  //    redesenhado.
  // -----------------------------------------------------------------
  '/dashboard/funcionario-digital/relatorios': {
    title: 'Relatórios Mensais',
    description: 'Relatórios PDF mensais gerados pela Aurora para cada cliente ativo, com resumo financeiro e atividades do mês.',
    audience: 'Empresa',
    controlType: 'Operacional',
    steps: [
      'Selecione o cliente e o mês de referência.',
      'Visualize o relatório gerado ou clique em "Gerar agora" para criar um novo.',
      'Baixe o PDF para enviar ao cliente ou arquivar.'
    ],
    relatedPages: ['Dashboard da Aurora', 'DRE do Cliente (Oficial)'],
    richContent: {
      intro: 'A Aurora gera relatórios profissionais para cada cliente, consolidando atividades, métricas e recomendações do mês.',
      workflow: [
        'Selecione o cliente no seletor',
        'Escolha o mês de referência',
        'Visualize o relatório gerado',
        'Baixe o PDF ou envie por email',
        'Use "Gerar agora" para relatórios sob demanda'
      ],
      rules: [
        '1 relatório por cliente/mês (idempotente)',
        'PDF gerado pela Aurora com template padrão',
        'Relatórios manuais não substituem os automáticos',
        'Histórico de relatórios persistido por tenant'
      ]
    }
  },

  // -----------------------------------------------------------------
  // 📄 PÁGINA: NFS-e (Notas Fiscais de Serviço)
  //  ROTA: /dashboard/funcionario-digital/nfse
  // 🎯 PROPÓSITO: Importação e gestão de NFS-e emitidas e recebidas,
  //    com suporte ABRASF 2.0.
  // 👤 USUÁRIO: ADMIN, MANAGER (com acesso fiscal)
  // 🔄 ATUALIZAR QUANDO: Novos adaptadores de município forem
  //    adicionados ou o fluxo de importação por email (IMAP) for
  //    implementado.
  // -----------------------------------------------------------------
  '/dashboard/funcionario-digital/nfse': {
    title: 'NFS-e',
    description: 'Importação e gestão de Notas Fiscais de Serviço eletrônicas, com suporte ao padrão ABRASF 2.0.',
    audience: 'Empresa',
    controlType: 'Fiscal',
    steps: [
      'Importe NFS-e manualmente ou configure a coleta automática por email (IMAP).',
      'Revise as notas na fila de revisão (divergências ou campos não reconhecidos).',
      'Promova as notas aprovadas para o contábil/financeiro.'
    ],
    relatedPages: ['Fechamento + DRE Bancário', 'Guias de Imposto'],
    richContent: {
      intro: 'NFS-e são notas de serviço (ISS), diferentes de NF-e de mercadoria (ICMS). O sistema suporta importação manual e coleta automática por email.',
      workflow: [
        'Importe NFS-e manualmente (XML ou PDF)',
        'Ou configure coleta IMAP para receber automaticamente',
        'Revise notas na fila de revisão',
        'Aprove e promova para contábil/financeiro',
        'Rejeite notas inválidas com motivo'
      ],
      rules: [
        'Padrão ABRASF 2.0 com adaptadores por município',
        'Origem (source): MANUAL, EMAIL, PORTAL, OCR',
        'Status: IMPORTED → REVIEW → ACCOUNTED ou REJECTED',
        'Idempotência por emissor + número + série',
        'XML original preservado para auditoria/reparse'
      ]
    }
  },

  // -----------------------------------------------------------------
  // 📄 PÁGINA: Guias de Imposto (DAS, ISS, DARF)
  // 📍 ROTA: /dashboard/funcionario-digital/guias
  //  PROPÓSITO: Emissão e gestão de guias de imposto calculadas
  //    pela Aurora (Simples, ISS, DARF).
  // 👤 USUÁRIO: ADMIN, MANAGER (com acesso fiscal)
  // 🔄 ATUALIZAR QUANDO: Novos tipos de guia forem adicionados (ex:
  //    IRRF, CSLL) ou o cálculo do Simples Nacional (RBT12) for
  //    atualizado.
  // -----------------------------------------------------------------
  '/dashboard/funcionario-digital/guias': {
    title: 'Guias de Imposto',
    description: 'Emissão e gestão de guias de imposto calculadas pela Aurora (DAS Simples, ISS municipal, DARF federal).',
    audience: 'Empresa',
    controlType: 'Fiscal',
    steps: [
      'Visualize as guias calculadas para o período (DAS, ISS, DARF).',
      'Confera o cálculo e a memória de cálculo (steps) antes de aprovar.',
      'Marque como transmitida após o pagamento no portal oficial.'
    ],
    relatedPages: ['NFS-e', 'Planejamento Tributário'],
    richContent: {
      intro: 'A Aurora calcula automaticamente as guias de imposto com base no faturamento e regime tributário de cada cliente.',
      workflow: [
        'Aurora calcula guias no início do mês',
        'Revise o cálculo e a memória (steps)',
        'Aprove a guia para emissão',
        'Pague no portal oficial',
        'Marque como TRANSMITIDA no sistema'
      ],
      rules: [
        'Tipos: DAS (Simples), ISS (municipal), DARF (federal)',
        'Cálculo determinístico com round2 (ADR-020)',
        'Memória de cálculo preservada em JSON (ADR-038)',
        'Status: DRAFT → APPROVED → TRANSMITTED ou REJECTED',
        'Idempotência por companyId + clientId + period + type'
      ]
    }
  },

  // -----------------------------------------------------------------
  // 📄 PÁGINA: Legalização & Cofre
  // 📍 ROTA: /dashboard/funcionario-digital/legalizacao
  // 🎯 PROPÓSITO: Gestão de obrigações legais, senhas, procurações
  //    e certificados digitais (A1) com criptografia AES-256-GCM.
  // 👤 USUÁRIO: ADMIN (somente ADMIN pode revelar segredos)
  //  ATUALIZAR QUANDO: Novos tipos de item do cofre forem
  //    adicionados, a criptografia for alterada ou os alertas de
  //    vencimento forem recalibrados.
  // -----------------------------------------------------------------
  '/dashboard/funcionario-digital/legalizacao': {
    title: 'Legalização & Cofre',
    description: 'Gestão segura de obrigações legais, senhas, procurações e certificados digitais (A1) com criptografia AES-256-GCM.',
    audience: 'Empresa',
    controlType: 'Interno',
    steps: [
      'Cadastre obrigações com alertas de prazo (vencido, ≤30 dias, OK).',
      'Armazene senhas e procurações no Cofre (criptografado, visível apenas para ADMIN).',
      'Faça upload do Certificado A1 (.pfx) com a senha protegida.'
    ],
    relatedPages: ['Guias de Imposto', 'Administração'],
    richContent: {
      intro: 'O Cofre Legal armazena credenciais sensíveis com criptografia AES-256-GCM. Apenas ADMIN pode revelar segredos.',
      workflow: [
        'Cadastre obrigações legais com prazos',
        'Armazene senhas no Cofre (criptografado)',
        'Faça upload de certificados A1 (.pfx)',
        'Monitore alertas de prazo (vencido, ≤30 dias, OK)',
        'Renove certificados antes do vencimento'
      ],
      rules: [
        'Cofre usa criptografia AES-256-GCM',
        'Apenas ADMIN pode revelar segredos',
        'Revelações registram auditoria (quem, quando)',
        'Certificados A1 armazenados com senha cifrada',
        'Alertas: vencido (vermelho), ≤30 dias (âmbar), OK (verde)'
      ]
    }
  },

  // -----------------------------------------------------------------
  //  PÁGINA: Cobrança & CNAB
  // 📍 ROTA: /dashboard/funcionario-digital/cobranca
  //  PROPÓSITO: Automação de cobrança com arquivos CNAB 240/400,
  //    régua de cobrança e aprovação humana em cada etapa.
  // 👤 USUÁRIO: ADMIN, MANAGER (com acesso financeiro)
  // 🔄 ATUALIZAR QUANDO: Novos bancos forem adicionados ao adaptador
  //    CNAB, a régua de cobrança for redesenhada ou o fluxo de
  //    aprovação (ADR-084) for alterado.
  // -----------------------------------------------------------------
  '/dashboard/funcionario-digital/cobranca': {
    title: 'Cobrança & CNAB',
    description: 'Automatize a cobrança de clientes e a comunicação com o banco via arquivos CNAB 240/400, com aprovação humana em cada etapa.',
    audience: 'Empresa',
    controlType: 'Financeiro',
    steps: [
      'Aba Cobranças: Crie cobranças manualmente ou selecione um cliente da casa (autopreenche nome, CNPJ e honorário).',
      'Aba Remessas: Gere o arquivo .rem com as cobranças pendentes e envie ao banco.',
      'Aba Retornos: Upload do arquivo de retorno do banco para baixa automática.',
      'Aba Régua: Configure regras de cobrança automática. A Aurora prepara, você aprova.'
    ],
    relatedPages: ['Clientes', 'Fechamento + DRE Bancário'],
    richContent: {
      intro: 'Este módulo automatiza o ciclo completo de cobrança: da criação do boleto até a confirmação do pagamento, passando por comunicação automática com clientes inadimplentes.',
      kpis: [
        { name: 'A Vencer / Vencidas', meaning: 'Cobranças em aberto com valor total', location: 'Card superior esquerdo' },
        { name: 'Em Trânsito', meaning: 'Cobranças enviadas ao banco aguardando retorno', location: 'Card superior central' },
        { name: 'Recebidas', meaning: 'Cobranças pagas confirmadas pelo banco', location: 'Card superior direito' }
      ],
      workflow: [
        'Dia 25: gere remessa CNAB das cobranças do mês seguinte',
        'Dia 1-5: envie arquivo .rem ao banco via internet banking',
        'Diariamente: faça upload dos retornos do banco',
        'Após vencimento: execute a régua de cobrança automática',
        'Revise eventos pendentes de aprovação e envie comunicações'
      ],
      rules: [
        'Nunca dispare sem aprovação humana (ADR-084)',
        'Destinatário = contactEmail/contactPhone do client vinculado (ADR-087)',
        'Falha real = FALHOU (sem fallback silencioso — ADR-086)',
        'Mês fechado é imutável (trava de compliance)'
      ],
      detailedSteps: [
        {
          title: 'Criar cobrança manual',
          description: 'Preencha cliente, CNPJ, valor e vencimento. Ao selecionar "Cliente da casa", o sistema autopreenche nome, CNPJ e honorário mensal.'
        },
        {
          title: 'Gerar remessa CNAB',
          description: 'Clique em "Gerar e baixar remessa". O sistema cria arquivo .rem com todas as cobranças PENDENTES e marca como GERADA.'
        },
        {
          title: 'Processar retorno',
          description: 'Faça upload do arquivo .ret do banco. O sistema identifica pagamentos (código 06/09) e aplica baixa automática nas cobranças correspondentes.'
        },
        {
          title: 'Executar régua',
          description: 'Clique em "Executar régua agora". O sistema cria eventos para cobranças vencidas conforme as regras configuradas. Revise e aprove antes de enviar.'
        }
      ],
      examples: [
        {
          title: 'Fluxo de vida da cobrança',
          content: 'PENDENTE → GERADA (remessa) → ENVIADA → PAGA (retorno)\n                    ↓\n              VENCIDA (derivada)\n                    ↓\n              Evento Régua → AGUARDANDO_APROVAÇÃO → APROVADO → ENVIADO'
        }
      ]
    }
  },

  // -----------------------------------------------------------------
  // 📄 PÁGINA: DRE do Escritório
  // 📍 ROTA: /dashboard/bi
  // 🎯 PROPÓSITO: Resultado financeiro do próprio escritório (receitas
  //    vs. despesas operacionais).
  // 👤 USUÁRIO: ADMIN, MANAGER
  // 🔄 ATUALIZAR QUANDO: Novas categorias de receita/despesa forem
  //    adicionadas ou os filtros de período forem redesenhados.
  // -----------------------------------------------------------------
  '/dashboard/bi': {
    title: 'DRE do Escritório',
    description: 'O resultado financeiro do SEU escritório (não dos clientes). Receitas vs. Despesas operacionais.',
    audience: 'Empresa',
    controlType: 'Financeiro',
    steps: [
      'Analise receitas (honorários, serviços avulsos) e despesas (salários, aluguel, software).',
      'Use os filtros de período para comparar meses e ver a evolução do lucro.',
      'Exporte o relatório em PDF ou CSV para reuniões de diretoria.'
    ],
    relatedPages: ['Score do Escritório', 'Indicadores'],
    richContent: {
      intro: 'O DRE do Escritório mostra se seu negócio é rentável. Receitas (honorários) vs. Despesas (salários, aluguel, software) = Lucro ou Prejuízo.',
      kpis: [
        { name: 'Receita Total', meaning: 'Soma de honorários + serviços avulsos', location: 'Card superior' },
        { name: 'Despesa Total', meaning: 'Soma de todas as despesas operacionais', location: 'Card superior' },
        { name: 'Lucro Líquido', meaning: 'Receita − Despesa', location: 'Card central' },
        { name: 'Margem Líquida', meaning: 'Lucro ÷ Receita × 100', location: 'Card central' }
      ],
      workflow: [
        'Mensalmente: analise o DRE do mês anterior',
        'Compare com meses anteriores (filtros de período)',
        'Identifique despesas crescentes',
        'Exporte PDF para reuniões de diretoria',
        'Use dados para alimentar o Score'
      ],
      rules: [
        'Dados vêm de transações financeiras internas',
        'Filtros de período comparam automaticamente',
        'Exportação PDF/CSV com formatação profissional',
        'DRE do Escritório ≠ DRE do Cliente (fontes diferentes)'
      ]
    }
  },

  // -----------------------------------------------------------------
  // 📄 PÁGINA: DRE do Cliente (Oficial)
  // 📍 ROTA: /dashboard/bi/dre-cliente
  // 🎯 PROPÓSITO: Resultado financeiro formal do cliente, com
  //    confronto automático vs. DRE Bancário.
  //  USUÁRIO: ADMIN, MANAGER (com acesso BI)
  // 🔄 ATUALIZAR QUANDO: A lógica de confronto Contábil × Bancário
  //    for alterada ou novos grupos DRE forem adicionados.
  // -----------------------------------------------------------------
  '/dashboard/bi/dre-cliente': {
    title: 'DRE do Cliente (Oficial)',
    description: 'O resultado financeiro formal de cada cliente, pronto para entrega, com confronto automático vs. DRE Bancário.',
    audience: 'Cliente',
    controlType: 'Financeiro',
    steps: [
      'Selecione o cliente e o período desejado.',
      'Analise as receitas e despesas classificadas contabilmente.',
      'Observe a tabela de confronto no rodapé, que destaca a diferença em R$ entre o Contábil e o Bancário.'
    ],
    relatedPages: ['Fechamento + DRE Bancário', 'Lançamentos Contábeis'],
    richContent: {
      intro: 'O DRE Oficial é a versão contábil formal do resultado do cliente, com confronto automático contra o DRE Bancário (gerencial).',
      kpis: [
        { name: 'Receita Contábil', meaning: 'Receitas classificadas contabilmente', location: 'Card superior' },
        { name: 'Despesa Contábil', meaning: 'Despesas classificadas contabilmente', location: 'Card superior' },
        { name: 'Lucro Contábil', meaning: 'Receita − Despesa (contábil)', location: 'Card central' },
        { name: 'Diferença vs. Bancário', meaning: 'Contábil − Bancário (destacada)', location: 'Card inferior' }
      ],
      workflow: [
        'Selecione o cliente',
        'Defina o período (mês/trimestre/ano)',
        'Analise receitas e despesas por conta contábil',
        'Revise o confronto Contábil × Bancário',
        'Exporte PDF para entregar ao cliente'
      ],
      rules: [
        'DRE Oficial vem de lançamentos contábeis (AccountingEntry)',
        'DRE Bancário vem de transações bancárias (BankTransaction)',
        'Diferença destacada em vermelho se > R$ 100',
        'Confronto automático por natureza/category',
        'PDF profissional pronto para entrega ao cliente'
      ],
      detailedSteps: [
        {
          title: 'Selecionar cliente',
          description: 'Use o seletor no topo para escolher o cliente. O sistema carrega dados contábeis e bancários.'
        },
        {
          title: 'Analisar DRE',
          description: 'Receitas e despesas agrupadas por conta contábil. Subtotais por grupo (Receita, Despesa Operacional, etc).'
        },
        {
          title: 'Confronto Contábil × Bancário',
          description: 'Tabela no rodapé mostra diferença em R$ entre DRE Contábil e DRE Bancário. Diferenças > R$ 100 destacadas em vermelho.'
        }
      ]
    }
  },

  // -----------------------------------------------------------------
  // 📄 PÁGINA: Ponto Fora da Curva
  // 📍 ROTA: /dashboard/ponto-fora-da-curva
  // 🎯 PROPÓSITO: Detecção de anomalias estatísticas em transações
  //    (valores que fogem do padrão histórico).
  // 👤 USUÁRIO: ADMIN, MANAGER
  // 🔄 ATUALIZAR QUANDO: O algoritmo de detecção (desvios padrão)
  //    for recalibrado ou novos tipos de anomalia forem adicionados.
  // -----------------------------------------------------------------
  '/dashboard/ponto-fora-da-curva': {
    title: 'Ponto Fora da Curva',
    description: 'Detecção de anomalias estatísticas. O sistema sinaliza valores que fogem drasticamente do padrão histórico.',
    audience: 'Empresa',
    controlType: 'Estratégico',
    steps: [
      'Revise as transações sinalizadas em vermelho ou âmbar.',
      'Investigue se a anomalia é um erro de digitação, classificação ou uma fraude potencial.',
      'Confirme ou descarte a anomalia para refinar o algoritmo.'
    ],
    relatedPages: ['DRE do Escritório', 'Indicadores'],
    richContent: {
      intro: 'O Ponto Fora da Curva usa estatística para detectar anomalias. Transações que fogem do padrão histórico são sinalizadas para investigação.',
      workflow: [
        'Diariamente: revise anomalias sinalizadas',
        'Investigue cada uma (erro, fraude, atípico legítimo)',
        'Confirme ou descarte a anomalia',
        'O sistema aprende com suas decisões',
        'Exporte relatório de auditoria se necessário'
      ],
      rules: [
        'Anomalia = valor > 2 desvios padrão da média histórica',
        'Vermelho = anomalia forte (>3 desvios)',
        'Âmbar = anomalia moderada (2-3 desvios)',
        'Confirmações/descartes alimentam o algoritmo',
        'Período de análise: últimos 12 meses'
      ]
    }
  },

  // -----------------------------------------------------------------
  //  PÁGINA: Indicadores (KPIs Prontos)
  // 📍 ROTA: /dashboard/indicadores
  // 🎯 PROPÓSITO: Painel com indicadores prontos do sistema (margem,
  //    ticket médio, churn, tempo de resposta).
  // 👤 USUÁRIO: ADMIN, MANAGER
  // 🔄 ATUALIZAR QUANDO: Novos KPIs prontos forem adicionados ou as
  //    fórmulas existentes forem recalculadas.
  // -----------------------------------------------------------------
  '/dashboard/indicadores': {
    title: 'Indicadores (KPIs)',
    description: 'Painel com indicadores prontos do sistema, como margem de lucro, ticket médio, churn e tempo de resposta.',
    audience: 'Empresa',
    controlType: 'Estratégico',
    steps: [
      'Visualize os KPIs calculados automaticamente com base nos seus dados.',
      'Clique em qualquer indicador para ver o histórico, a fórmula e a tendência.',
      'Compare o valor atual com a meta sugerida pelo sistema.'
    ],
    relatedPages: ['Indicadores Customizados', 'Score do Escritório'],
    richContent: {
      intro: 'Indicadores prontos calculados automaticamente pelo sistema. Cada KPI tem fórmula documentada, histórico e meta sugerida.',
      kpis: [
        { name: 'Margem Líquida', meaning: 'Lucro ÷ Receita × 100', location: 'Card superior' },
        { name: 'Ticket Médio', meaning: 'MRR  clientes ativos', location: 'Card superior' },
        { name: 'Churn Rate', meaning: 'Clientes cancelados ÷ total × 100', location: 'Card superior' },
        { name: 'Tempo de Resposta', meaning: 'Dias médios para responder propostas', location: 'Card superior' }
      ],
      workflow: [
        'Diariamente: verifique KPIs principais',
        'Clique em qualquer indicador para ver detalhes',
        'Compare com meta sugerida',
        'Analise histórico e tendência',
        'Use dados para alimentar o Score'
      ],
      rules: [
        'KPIs calculados em tempo real',
        'Fórmulas documentadas e auditáveis',
        'Metas sugeridas baseadas em benchmarks',
        'Histórico de 12 meses para cada KPI',
        'Tendência: subindo (verde), estável (âmbar), caindo (vermelho)'
      ]
    }
  },

  // -----------------------------------------------------------------
  // 📄 PÁGINA: Indicadores Customizados
  // 📍 ROTA: /dashboard/indicadores-custom
  // 🎯 PROPÓSITO: Criação de KPIs personalizados com motor de fórmulas
  //    seguro (parser AST, zero eval).
  // 👤 USUÁRIO: ADMIN, MANAGER
  // 🔄 ATUALIZAR QUANDO: Novas variáveis forem adicionadas ao motor
  //    de fórmulas ou o parser AST for alterado.
  // -----------------------------------------------------------------
  '/dashboard/indicadores-custom': {
    title: 'Indicadores Customizados',
    description: 'Crie seus próprios KPIs usando o motor de fórmulas seguro, combinando variáveis do seu negócio.',
    audience: 'Empresa',
    controlType: 'Estratégico',
    steps: [
      'Clique em "Novo Indicador" e defina nome, categoria e unidade de medida.',
      'Monte a fórmula usando variáveis permitidas (ex: `faturamento / clientesAtivos`).',
      'Defina uma meta e acompanhe a barra de progresso em tempo real.'
    ],
    relatedPages: ['Indicadores', 'Planejamento'],
    richContent: {
      intro: 'Indicadores Customizados permitem criar KPIs específicos do seu negócio com fórmulas seguras (zero eval/Function).',
      workflow: [
        'Clique em "Novo Indicador"',
        'Defina nome, categoria e unidade',
        'Monte a fórmula com variáveis permitidas',
        'Defina meta e cor de identificação',
        'Acompanhe em tempo real no dashboard'
      ],
      rules: [
        'Fórmulas usam parser AST (seguro, zero eval)',
        'Variáveis permitidas: clientesAtivos, faturamento, equipe, etc',
        'Operadores: +, −, ×, , parênteses',
        'Meta numérica obrigatória',
        'Indicadores favoritos aparecem no topo'
      ],
      examples: [
        {
          title: 'Fórmula de exemplo',
          content: 'faturamento / clientesAtivos = Ticket Médio\n(despesas + impostos) / faturamento × 100 = % de Despesas'
        }
      ]
    }
  },

  // -----------------------------------------------------------------
  //  PÁGINA: Score do Escritório
  // 📍 ROTA: /dashboard/score
  // 🎯 PROPÓSITO: Nota 0-100 da saúde do escritório, baseada em 5
  //    dimensões ponderadas (Mercado, Pessoas, Comercial, Crescimento,
  //    Gestão).
  // 👤 USUÁRIO: ADMIN, MANAGER
  // 🔄 ATUALIZAR QUANDO: Os pesos das dimensões forem recalibrados,
  //    novos níveis (Bronze/Prata/Ouro/Diamante) forem adicionados
  //    ou a fórmula de cálculo for alterada.
  // -----------------------------------------------------------------
  '/dashboard/score': {
    title: 'Score do Escritório',
    description: 'Nota de 0 a 100 da saúde do seu escritório, baseada em 5 dimensões ponderadas.',
    audience: 'Empresa',
    controlType: 'Estratégico',
    steps: [
      'Veja sua nota total: 0–100 com barra colorida (vermelho → amarelo → verde).',
      'Analise por dimensão: Mercado (25%), Pessoas (20%), Comercial (20%), Crescimento (15%), Gestão (20%).',
      'Leia os insights automáticos que apontam seus 2 pontos fracos e 1 forte.'
    ],
    relatedPages: ['Visão de Futuro', 'Ranking de Níveis'],
    richContent: {
      intro: 'O Score é o "check-up" do seu escritório. Ele diz exatamente onde você está forte e onde precisa melhorar.',
      kpis: [
        { name: 'Score Total', meaning: 'Nota 0-100 consolidada', location: 'Card central grande' },
        { name: 'Mercado (25%)', meaning: 'Benchmark de softwares e serviços', location: 'Card de dimensão' },
        { name: 'Pessoas (20%)', meaning: 'Distribuição de equipe e turnover', location: 'Card de dimensão' },
        { name: 'Comercial (20%)', meaning: 'Conversão e ticket médio', location: 'Card de dimensão' },
        { name: 'Crescimento (15%)', meaning: 'Metas de clientes e equipe', location: 'Card de dimensão' },
        { name: 'Gestão (20%)', meaning: 'Planejamento e execução', location: 'Card de dimensão' }
      ],
      workflow: [
        'Mensalmente: verifique seu Score',
        'Identifique a dimensão com menor nota',
        'Leia os insights automáticos',
        'Vá para Visão de Futuro e execute as ações sugeridas',
        'Reavalie no mês seguinte'
      ],
      rules: [
        'Score ≥ 80 = Diamante 💎',
        'Score 60-79 = Ouro 🥇',
        'Score 40-59 = Prata 🥈',
        'Score < 40 = Bronze 🥉',
        'Neutro 50 quando não há dados'
      ],
      detailedSteps: [
        {
          title: 'Interpretar a nota total',
          description: 'Vermelho (<40) = crítico. Amarelo (40-59) = atenção. Verde (60+) = saudável. Azul (80+) = excelente.'
        },
        {
          title: 'Analisar dimensões',
          description: 'Clique em cada card de dimensão para ver o detalhamento e as métricas que compõem aquela nota.'
        },
        {
          title: 'Ler insights',
          description: 'O sistema aponta automaticamente seus 2 pontos fracos e 1 forte. Foque primeiro nos fracos.'
        }
      ]
    }
  },

  // -----------------------------------------------------------------
  // 📄 PÁGINA: Visão de Futuro (Mentoria)
  // 📍 ROTA: /dashboard/mentoria
  //  PROPÓSITO: Plano de ação personalizado baseado no Score, com
  //    checklist executável e focos derivados das dimensões mais
  //    fracas.
  // 👤 USUÁRIO: ADMIN, MANAGER
  // 🔄 ATUALIZAR QUANDO: O catálogo de ações sugeridas for expandido,
  //    a derivação de focos for alterada ou o checklist "Meu Plano"
  //    for redesenhado.
  // -----------------------------------------------------------------
  '/dashboard/mentoria': {
    title: 'Visão de Futuro (Mentoria)',
    description: 'Plano de ação personalizado baseado no seu Score. O sistema identifica onde você precisa melhorar e sugere ações concretas.',
    audience: 'Empresa',
    controlType: 'Estratégico',
    steps: [
      'Defina sua visão de longo prazo (clientes, equipe, faturamento).',
      'Revise os "Focos" sugeridos pelo sistema (2 dimensões mais fracas).',
      'Marque as ações do checklist como concluídas e veja a barra de execução subir.'
    ],
    relatedPages: ['Score do Escritório', 'Planejamento'],
    richContent: {
      intro: 'A Mentoria transforma seu Score em um plano de ação executável. Ela diz não apenas "onde você está", mas "como chegar lá".',
      workflow: [
        'Defina sua visão (1, 3 e 5 anos)',
        'Estabeleça metas mensuráveis (clientes, equipe, faturamento)',
        'Revise os focos sugeridos (2 dimensões mais fracas)',
        'Execute as ações do checklist',
        'Marque como concluída e veja o progresso'
      ],
      rules: [
        'Focos são derivados automaticamente do Score',
        'Catálogo de ações é fixo (zero IA generativa)',
        'Checklist persistido por tenant (companyId + title + source)',
        'Generate nunca duplica (unique composto)'
      ],
      detailedSteps: [
        {
          title: 'Definir visão',
          description: 'Onde você quer chegar em 1, 3 e 5 anos? Seja específico: "100 clientes ativos", "equipe de 15 pessoas", "faturamento R$ 50k/mês".'
        },
        {
          title: 'Revisar focos',
          description: 'O sistema identifica suas 2 dimensões mais fracas e sugere 3 ações concretas para cada. Ex: se Comercial está baixo, sugere "Aumentar taxa de conversão em 10%".'
        },
        {
          title: 'Executar ações',
          description: 'Marque cada ação como concluída conforme for executando. A barra de progresso sobe automaticamente.'
        },
        {
          title: 'Checklist "Meu Plano"',
          description: 'Use a sub-aba "Meu Plano" para adicionar ações customizadas além das sugeridas pelo sistema. Tudo persiste e é auditável.'
        }
      ]
    }
  },

  // -----------------------------------------------------------------
  // 📄 PÁGINA: Ranking de Níveis
  // 📍 ROTA: /dashboard/ranking
  // 🎯 PROPÓSITO: Gamificação do crescimento com comparação entre
  //    escritórios da rede e pódio.
  // 👤 USUÁRIO: ADMIN, MANAGER
  // 🔄 ATUALIZAR QUANDO: Os thresholds de níveis (Bronze/Prata/Ouro/
  //    Diamante) forem recalibrados ou o cálculo do ranking for
  //    alterado.
  // -----------------------------------------------------------------
  '/dashboard/ranking': {
    title: 'Ranking de Níveis',
    description: 'Gamificação do seu crescimento. Compare seu Score com a média da rede e veja quanto falta para o próximo nível.',
    audience: 'Empresa',
    controlType: 'Estratégico',
    steps: [
      'Veja seu nível atual (Bronze, Prata, Ouro ou Diamante) e a barra de progresso.',
      'Confira o pódio da rede para se inspirar nos escritórios melhor posicionados.',
      'Clique no seu nome destacado no ranking para ver seus detalhes.'
    ],
    relatedPages: ['Score do Escritório', 'Visão de Futuro'],
    richContent: {
      intro: 'O Ranking gamifica seu crescimento. Compare-se com outros escritórios da rede e veja quanto falta para o próximo nível.',
      kpis: [
        { name: 'Seu Nível', meaning: 'Bronze, Prata, Ouro ou Diamante', location: 'Card superior' },
        { name: 'Pontos para Próximo', meaning: 'Quanto falta para subir de nível', location: 'Card superior' },
        { name: 'Sua Posição', meaning: 'Ranking na rede', location: 'Card superior' }
      ],
      workflow: [
        'Verifique seu nível atual',
        'Veja quantos pontos faltam para o próximo nível',
        'Confira o pódio (top 3 da rede)',
        'Analise o ranking completo',
        'Execute ações da Mentoria para subir'
      ],
      rules: [
        'Bronze: 0-39 pontos',
        'Prata: 40-59 pontos',
        'Ouro: 60-79 pontos',
        'Diamante: 80-100 pontos',
        'Ranking atualizado diariamente'
      ]
    }
  },

  // -----------------------------------------------------------------
  // 📄 PÁGINA: Planejamento Tributário
  // 📍 ROTA: /dashboard/planejamento-tributario
  // 🎯 PROPÓSITO: Simulador de regimes tributários (Simples,
  //    Presumido, Real) para identificar o mais vantajoso por cliente.
  // 👤 USUÁRIO: ADMIN, MANAGER (com acesso tributário)
  // 🔄 ATUALIZAR QUANDO: As faixas do Simples Nacional (RBT12) forem
  //    atualizadas, as alíquotas de presunção mudarem ou novos
  //    regimes forem adicionados.
  // -----------------------------------------------------------------
  '/dashboard/planejamento-tributario': {
    title: 'Planejamento Tributário',
    description: 'Simule qual regime tributário (Simples Nacional, Lucro Presumido ou Lucro Real) é mais vantajoso para cada cliente.',
    audience: 'Cliente',
    controlType: 'Estratégico',
    steps: [
      'Informe o faturamento estimado e as despesas dedutíveis do cliente.',
      'O sistema calcula a carga tributária nos três regimes simultaneamente.',
      'Gere um relatório comparativo para apresentar ao cliente e embasar a decisão.'
    ],
    relatedPages: ['Reforma Tributária', 'DRE do Cliente (Oficial)'],
    richContent: {
      intro: 'O Planejamento Tributário simula os três regimes (Simples, Presumido, Real) e mostra qual paga menos imposto para cada cliente.',
      workflow: [
        'Selecione o cliente',
        'Informe faturamento anual estimado',
        'Informe despesas dedutíveis',
        'O sistema calcula os três regimes',
        'Compare carga tributária e lucro líquido',
        'Gere relatório comparativo para o cliente'
      ],
      rules: [
        'Simples Nacional: faixas de RBT12',
        'Lucro Presumido: presunção de 8% (serviços) ou 32% (comércio)',
        'Lucro Real: lucro contábil ajustado',
        'Cálculos determinísticos (zero IA)',
        'Relatório PDF pronto para apresentação'
      ]
    }
  },

  // -----------------------------------------------------------------
  // 📄 PÁGINA: Reforma Tributária
  // 📍 ROTA: /dashboard/reforma-tributaria
  // 🎯 PROPÓSITO: Simulador de impacto da EC 132/2023 (CBS + IBS)
  //    durante a transição 2026-2033.
  // 👤 USUÁRIO: ADMIN, MANAGER (com acesso tributário)
  // 🔄 ATUALIZAR QUANDO: A alíquota de referência (26,5%) for
  //    alterada por legislação, novos setores com alíquotas reduzidas
  //    forem adicionados ou o período de transição mudar.
  // -----------------------------------------------------------------
  '/dashboard/reforma-tributaria': {
    title: 'Reforma Tributária',
    description: 'Simulador de impacto da EC 132/2023. Projete como a mudança de alíquotas afetará seus clientes nos próximos anos.',
    audience: 'Cliente',
    controlType: 'Estratégico',
    steps: [
      'Selecione o cliente e o cenário de transição desejado.',
      'Visualize a projeção de aumento ou redução da carga tributária.',
      'Use os dados para orientar o cliente em mudanças de estrutura ou preços.'
    ],
    relatedPages: ['Planejamento Tributário', 'DRE do Cliente (Oficial)'],
    richContent: {
      intro: 'A Reforma Tributária (EC 132/2023) muda as regras do jogo. Este simulador projeta o impacto nos seus clientes durante a transição (2026-2033).',
      workflow: [
        'Selecione o cliente',
        'Escolha o cenário de transição',
        'Visualize projeção de carga tributária',
        'Compare antes/depois da reforma',
        'Oriente o cliente em mudanças estratégicas'
      ],
      rules: [
        'Transição: 2026-2033 (7 anos)',
        'CBS (federal) + IBS (estadual/municipal) substituem PIS/COFINS/ICMS/ISS',
        'Alíquota de referência: 26,5% (CBS 12,5% + IBS 14%)',
        'Setores específicos têm alíquotas reduzidas',
        'Projeções são estimativas (legislação pode mudar)'
      ]
    }
  },


  // =================================================================
  // ⚙️ SEÇÃO 7: SISTEMA (Admin)
  // =================================================================
  // Painel super admin com métricas globais do SaaS e gestão do
  // catálogo de serviços oferecidos a todos os escritórios.
  // =================================================================

  // -----------------------------------------------------------------
  // 📄 PÁGINA: Administração — Visão Geral
  // 📍 ROTA: /dashboard/admin
  // 🎯 PROPÓSITO: Painel super admin com métricas globais do SaaS
  //    (empresas, usuários, faturamento da plataforma).
  // 👤 USUÁRIO: SUPER_ADMIN apenas
  // 🔄 ATUALIZAR QUANDO: Novos KPIs de plataforma forem adicionados
  //    ou as permissões de acesso (role ADMIN) forem alteradas.
  // -----------------------------------------------------------------
  '/dashboard/admin': {
    title: 'Administração: Visão Geral',
    description: 'Painel super admin com métricas globais do sistema SaaS (total de empresas, usuários ativos, faturamento da plataforma).',
    audience: 'Geral',
    controlType: 'Interno',
    steps: [
      'Monitore o crescimento da base de clientes do SaaS.',
      'Verifique a saúde técnica e a utilização dos módulos por plano.',
      'Acesse configurações globais do sistema.'
    ],
    relatedPages: ['Administração: Catálogo'],
    richContent: {
      intro: 'O painel de Administração é para super admins. Mostra métricas globais do SaaS e permite configurações de plataforma.',
      kpis: [
        { name: 'Total de Empresas', meaning: 'Número de tenants ativos', location: 'Card superior' },
        { name: 'Usuários Ativos', meaning: 'Número de usuários logados no período', location: 'Card superior' },
        { name: 'Faturamento da Plataforma', meaning: 'MRR total do SaaS', location: 'Card superior' },
        { name: 'Módulos Utilizados', meaning: 'Features mais usadas por plano', location: 'Card inferior' }
      ],
      workflow: [
        'Diariamente: verifique métricas de crescimento',
        'Semanalmente: analise utilização de módulos',
        'Mensalmente: revise faturamento e churn',
        'Trimestralmente: ajuste planos e preços'
      ],
      rules: [
        'Acesso restrito a role ADMIN',
        'Dados agregados de todos os tenants',
        'Configurações globais afetam toda a plataforma',
        'Logs de auditoria de ações admin'
      ]
    }
  },

  // -----------------------------------------------------------------
  // 📄 PÁGINA: Administração — Catálogo de Serviços
  // 📍 ROTA: /dashboard/admin/catalogo
  // 🎯 PROPÓSITO: Gestão centralizada dos serviços e planos oferecidos
  //    a todos os escritórios (17 departamentos, ~200 serviços).
  // 👤 USUÁRIO: SUPER_ADMIN apenas
  // 🔄 ATUALIZAR QUANDO: Novos departamentos forem adicionados, o
  //    seed do catálogo padrão for expandido ou as regras de
  //    escopo/SLA forem alteradas.
  // -----------------------------------------------------------------
  '/dashboard/admin/catalogo': {
    title: 'Administração: Catálogo de Serviços',
    description: 'Gestão centralizada dos serviços e planos que o sistema oferece a todos os escritórios.',
    audience: 'Geral',
    controlType: 'Interno',
    steps: [
      'Cadastre novos serviços definindo escopo, SLA, documentos necessários e preço base.',
      'Organize os serviços por departamentos (Contábil, Fiscal, DP, etc.).',
      'Use o botão "Importar Catálogo Padrão" para popular o sistema com as melhores práticas do mercado.'
    ],
    relatedPages: ['Administração: Visão Geral', 'Meus Planos'],
    richContent: {
      intro: 'O Catálogo centraliza todos os serviços que o sistema oferece. Cada serviço tem escopo, SLA, documentos e preço base.',
      workflow: [
        'Cadastre novos serviços com dados completos',
        'Organize por departamentos (17 departamentos pré-configurados)',
        'Defina escopo e fora-do-escopo',
        'Estabeleça SLA e documentos necessários',
        'Importe catálogo padrão para popular rapidamente'
      ],
      rules: [
        '17 departamentos: Contábil, Fiscal, Pessoal, Legalização, etc',
        'Cada serviço tem escopo detalhado (o que está incluso)',
        'Fora-do-escopo define o que é cobrado à parte',
        'SLA em dias úteis para entrega',
        'Preço base é referência (escritórios podem ajustar)'
      ],
      detailedSteps: [
        {
          title: 'Cadastrar serviço',
          description: 'Clique em "Novo Serviço", preencha nome, departamento, escopo, fora-do-escopo, SLA, documentos e preço base.'
        },
        {
          title: 'Importar catálogo padrão',
          description: 'Clique em "Importar Catálogo Padrão". O sistema popula ~200 serviços pré-configurados com melhores práticas do mercado.'
        },
        {
          title: 'Editar serviço',
          description: 'Clique no ícone de edição. Altere escopo, SLA ou preço. Serviços em uso por planos não podem ser excluídos.'
        }
      ]
    }
  }
}; // <--- FECHAMENTO ÚNICO E CORRETO DO OBJETO helpCatalog


// =================================================================
// FUNÇÕES HELPER DE EXPORTAÇÃO
// =================================================================
// Estas funções são usadas pelo componente PageHelp e pela página
// /ajuda/[slug] para exibir o conteúdo de ajuda contextual.
// =================================================================

/**
 * Retorna o conteúdo de ajuda para a rota atual.
 * Se a rota não estiver mapeada, retorna um fallback amigável.
 * 
 * @param pathname - Caminho da rota atual (ex: "/dashboard/fechamento")
 * @returns Objeto PageHelpInfo ou fallback padrão
 */
export function getPageHelp(pathname: string): PageHelpInfo | null {
  if (helpCatalog[pathname]) {
    return helpCatalog[pathname];
  }
  return {
    title: 'Ajuda da Página',
    description: 'A documentação detalhada para esta página específica está sendo escrita.',
    audience: 'Geral',
    controlType: 'Operacional',
    steps: [
      'Navegue pelas abas, cards e botões da tela.',
      'A maioria das ações possui tooltips (dicas ao passar o mouse) explicando seu propósito.',
      'Em breve, adicionaremos o passo a passo completo de como utilizar todas as funcionalidades desta tela.'
    ]
  };
}

/**
 * Retorna o conteúdo rico (camada 2) para a página de ajuda detalhada.
 * Usado pela página /ajuda/[slug] para exibir KPIs, workflows, regras
 * e exemplos.
 * 
 * @param pathname - Caminho da rota atual
 * @returns Objeto PageHelpInfo com richContent ou null se não houver
 *          conteúdo rico
 */
export function getRichHelpContent(pathname: string): PageHelpInfo | null {
  const info = helpCatalog[pathname];
  if (info?.richContent) {
    return info;
  }
  return null;
}

/**
 * Retorna todas as rotas mapeadas no catálogo.
 * Útil para gerar lista de páginas disponíveis ou para validação.
 * 
 * @returns Array de strings com todas as rotas mapeadas
 */
export function getAllHelpRoutes(): string[] {
  return Object.keys(helpCatalog);
}

/**
 * Busca páginas por termo (título ou descrição).
 * Útil para implementar busca dentro da ajuda.
 * 
 * @param term - Termo de busca (case-insensitive)
 * @returns Array de PageHelpInfo que correspondem ao termo
 */
export function searchHelp(term: string): PageHelpInfo[] {
  const lowerTerm = term.toLowerCase();
  return Object.values(helpCatalog).filter(
    (info) =>
      info.title.toLowerCase().includes(lowerTerm) ||
      info.description.toLowerCase().includes(lowerTerm)
  );
}