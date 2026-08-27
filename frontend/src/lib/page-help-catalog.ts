/**
 * =================================================================
 * Catálogo de Ajuda Contextual — Completo (Opção C)
 * =================================================================
 * Camada 1 (modal rápido): description + steps curtos
 * Camada 2 (página /ajuda/[slug]): conteúdo rico completo
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
  // ─────────────────────────────────────────────────────────
  // 📊 OPERACIONAL
  // ─────────────────────────────────────────────────────────
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

  '/dashboard/pessoas': {
    title: 'Colaboradores',
    description: 'Gestão completa da sua equipe: cadastro, tipos contratuais, tempo de casa e identificação de talentos críticos.',
    audience: 'Empresa',
    controlType: 'Operacional',
    steps: [
      'Cadastre novos colaboradores com dados pessoais e contratuais.',
      'Marque colaboradores essenciais com o selo "Crítico" (🔑).',
      'Use os filtros para visualizar a equipe por departamento ou tipo de contrato.'
    ],
    relatedPages: ['Turnover', 'Benchmark de Cargos'],
    richContent: {
      intro: 'Aqui você gerencia o ativo mais valioso do escritório: as pessoas. O sistema calcula automaticamente tempo de casa, turnover e identifica talentos críticos.',
      kpis: [
        { name: 'Total de Colaboradores', meaning: 'Número de pessoas ativas no escritório', location: 'Card superior' },
        { name: 'Tenure Médio', meaning: 'Tempo médio de casa em meses', location: 'Card superior' },
        { name: 'Críticos Ativos', meaning: 'Colaboradores essenciais marcados com 🔑', location: 'Card superior' }
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
        { name: 'Críticos Perdidos', meaning: 'Colaboradores 🔑 que saíram', location: 'Card superior' },
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
          description: '5 perguntas sobre: salário, gestão, crescimento, ambiente e motivo principal. O sistema classifica em 7 causas-raiz (salário, gestão, crescimento, ambiente, carga, reconhecimento, outros).'
        },
        {
          title: 'Analisar causas-raiz',
          description: 'A aba "Análises IA" mostra top causas e planos de ação sugeridos. Use para melhorar retenção.'
        }
      ]
    }
  },

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
        'Progresso = tarefas concluídas ÷ total de tarefas',
        'Vínculo com cliente é opcional mas recomendado',
        'Cor de identificação ajuda na visualização'
      ]
    }
  },

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

  // ─────────────────────────────────────────────────────────
  //  COMERCIAL
  // ─────────────────────────────────────────────────────────
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

  '/dashboard/precificacao/meus-planos': {
    title: 'Meus Planos',
    description: 'Gerencie os pacotes de serviços que seu escritório oferece (START, PRIME, BLACK, etc.) e seus multiplicadores.',
    audience: 'Empresa',
    controlType: 'Estratégico',
    steps: [
      'Visualize todos os planos ativos e seus respectivos multiplicadores de preço.',
      'Edite os serviços inclusos em cada plano.',
      'Marque um plano como "Independente" se ele não deve herdar itens de outros.'
    ],
    relatedPages: ['Precificação', 'Administração (Catálogo)'],
    richContent: {
      intro: 'Planos comerciais são a base da sua oferta. Cada plano tem um multiplicador que define o preço relativo ao valor de referência.',
      workflow: [
        'Defina o valor de referência (ex: R$ 1.000)',
        'Crie planos com multiplicadores (START 1.0, PRIME 1.5, BLACK 2.0)',
        'Associe serviços a cada plano',
        'Marque planos independentes se não devem herdar itens',
        'Revise multiplicadores trimestralmente'
      ],
      rules: [
        'Plano independente não herda e não doa itens',
        'Multiplicador mínimo: 1.0',
        'Serviços podem estar em múltiplos planos',
        'Alterações em planos afetam propostas futuras, não as existentes'
      ]
    }
  },

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
        { name: 'Conversão', meaning: '% de propostas que viraram clientes', location: 'Card superior esquerdo' },
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
          description: 'Mostra Ganho real × Concessão (desconto dado). Balanço líquido = Ganho − Concessão. Exemplo: Ganho R$ 360/mês + Concessão R$ 240/mês = você deixou R$ 2.880/ano na mesa.'
        },
        {
          title: 'Funil de conversão',
          description: 'DRAFT → SENT → VIEWED → WON/LOST. Identifique em qual etapa as propostas estão travando.'
        },
        {
          title: 'Motivos de perda',
          description: '"Fechou com concorrente mais barato" = problema de preço. "Não teve retorno" = problema de follow-up. "Adiou decisão" = problema de urgência.'
        }
      ],
      examples: [
        {
          title: 'Cálculo manual do Dinheiro em Jogo',
          content: 'Ganho = (preço final − preço atual) × 12 meses\nConcessão = desconto dado × 12 meses\nBalanço = Ganho − Concessão'
        }
      ]
    }
  },

  // ─────────────────────────────────────────────────────────
  // 🧾 FISCAL
  // ─────────────────────────────────────────────────────────
  '/dashboard/fiscal': {
    title: 'Importar NF-e',
    description: 'Entrada de notas fiscais de compra dos seus clientes via upload de arquivos XML em lote.',
    audience: 'Cliente',
    controlType: 'Fiscal',
    steps: [
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
        'Aguarde o parsing automático',
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

  // ─────────────────────────────────────────────────────────
  // 🏦 BANCÁRIO & CONTÁBIL
  // ─────────────────────────────────────────────────────────
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
          description: 'O sistema usa memória de aprendizado (contraparte normalizada) para classificar transações. 🟢 Auto (≥80%), 🟡 Regra (50-79%), 🟠 Revisar (<50%).'
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

  // ─────────────────────────────────────────────────────────
  // 📈 INTELIGÊNCIA & AURORA
  // ─────────────────────────────────────────────────────────
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
    relatedPages: ['Aprovações', 'Relatórios Mensais'],
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
        'Ações LEGAL nunca são auto-aprovadas (Regra de Ouro)',
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

  '/dashboard/funcionario-digital/aprovacoes': {
    title: 'Central de Aprovações',
    description: 'Fila de tarefas que a Aurora preparou, mas que exigem sua validação final (Regra de Ouro).',
    audience: 'Empresa',
    controlType: 'Operacional',
    steps: [
      'Revise cada pendência (ex: classificação de transação, conciliação).',
      'Aprove, rejeite ou aprove com uma nota explicativa.',
      'A Aurora aprende com suas decisões para melhorar sugestões futuras.'
    ],
    relatedPages: ['Dashboard da Aurora', 'Tarefas'],
    richContent: {
      intro: 'A Central de Aprovações é onde a supervisão humana acontece. A Aurora prepara, você valida. Suas decisões alimentam o aprendizado do sistema.',
      workflow: [
        'Abra a Central diariamente',
        'Revise cada pendência 🟡',
        'Aprove se estiver correta',
        'Rejeite com nota explicativa se estiver errada',
        'O sistema aprende com suas decisões'
      ],
      rules: [
        'Toda ação LEGAL exige aprovação humana',
        'Aprovações registram auditoria (quem, quando, nota)',
        'Rejeições com nota ajudam o sistema a aprender',
        'Fila zerada = tudo processado'
      ],
      detailedSteps: [
        {
          title: 'Revisar pendência',
          description: 'Clique na pendência para ver detalhes: o que a Aurora sugere, score de confiança, evidências.'
        },
        {
          title: 'Aprovar',
          description: 'Clique em "Aprovar" se a sugestão estiver correta. Opcionalmente adicione uma nota.'
        },
        {
          title: 'Rejeitar',
          description: 'Clique em "Rejeitar" e informe o motivo. O sistema registra e usa para melhorar futuras sugestões.'
        }
      ]
    }
  },

  '/dashboard/funcionario-digital/legalizacao': {
    title: 'Legalização & Cofre',
    description: 'Gestão segura de obrigações legais, senhas, procurações e certificados digitais (A1) com criptografia.',
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
        { name: 'Ticket Médio', meaning: 'MRR ÷ clientes ativos', location: 'Card superior' },
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
        'Score 60-79 = Ouro ',
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

  // ─────────────────────────────────────────────────────────
  // ⚙️ SISTEMA (Admin)
  // ─────────────────────────────────────────────────────────
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
  },

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
  }
};

/**
 * Retorna o conteúdo de ajuda para a rota atual.
 * Se a rota não estiver mapeada, retorna um fallback amigável.
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
 */
export function getRichHelpContent(pathname: string): PageHelpInfo | null {
  const info = helpCatalog[pathname];
  if (info?.richContent) {
    return info;
  }
  return null;
}