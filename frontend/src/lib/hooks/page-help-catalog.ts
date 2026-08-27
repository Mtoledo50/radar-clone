/**
 * =================================================================
 * Catálogo de Ajuda Contextual das Páginas (Expandido)
 * =================================================================
 * Este arquivo mapeia cada rota (pathname) para seu conteúdo de ajuda
 * humanizado, explicando o propósito, público-alvo, tipo de controle 
 * e o passo a passo de uso.
 * =================================================================
 */

export interface PageHelpInfo {
  title: string;
  description: string;
  audience: 'Empresa' | 'Cliente' | 'Geral';
  controlType: 'Interno' | 'Estratégico' | 'Operacional' | 'Fiscal' | 'Financeiro';
  steps: string[];
  relatedPages?: string[];
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
    relatedPages: ['Minha Empresa', 'Score do Escritório']
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
    relatedPages: ['Score do Escritório', 'Planejamento']
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
    relatedPages: ['Turnover', 'Benchmark de Cargos']
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
    relatedPages: ['Colaboradores', 'Benchmark de Cargos']
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
    relatedPages: ['Colaboradores', 'Minha Empresa']
  },
  '/dashboard/clientes': {
    title: 'Carteira de Clientes',
    description: 'Gerencie sua carteira: contratos, planos, honorários, add-ons e status (ativo, inativo ou prospect).',
    audience: 'Empresa',
    controlType: 'Operacional',
    steps: [
      'Busque por empresa, CNPJ ou contato usando a barra de busca.',
      'Importe em massa via CSV para subir sua planilha de honorários rapidamente.',
      'Cadastre manualmente com plano, honorário e serviços avulsos.',
      'Exporte para Excel para análise externa ou backup.'
    ],
    relatedPages: ['Precificação', 'Fechamento + DRE Bancário']
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
    relatedPages: ['Tarefas', 'Planejamento']
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
    relatedPages: ['Projetos', 'Planejamento']
  },

  // ─────────────────────────────────────────────────────────
  // 💼 COMERCIAL
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
    relatedPages: ['Propostas Comerciais', 'Meus Planos']
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
    relatedPages: ['Precificação', 'Administração (Catálogo)']
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
    relatedPages: ['Propostas Comerciais', 'Score do Escritório']
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
    relatedPages: ['Score do Escritório', 'Visão de Futuro']
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
    relatedPages: ['Notas Fiscais', 'Estoque']
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
    relatedPages: ['Importar NF-e', 'Apuração ICMS']
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
    relatedPages: ['Importar NF-e', 'Comparativo']
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
    relatedPages: ['Notas Fiscais', 'SPED Fiscal']
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
    relatedPages: ['Apuração ICMS', 'Relatório Inventário']
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
    relatedPages: ['Estoque', 'Importar NF-e']
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
    relatedPages: ['SPED Fiscal', 'Comparativo']
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
    relatedPages: ['Lançamentos Contábeis', 'DRE do Cliente (Oficial)']
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
    relatedPages: ['Plano de Contas', 'Revisão de Lançamentos']
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
    relatedPages: ['Lançamentos Contábeis', 'Ciclo Contábil do Cliente']
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
    relatedPages: ['Fechamento + DRE Bancário', 'Plano de Contas']
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
    relatedPages: ['Lançamentos Contábeis', 'Ciclo Contábil do Cliente']
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
    relatedPages: ['Aprovações', 'Relatórios Mensais']
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
    relatedPages: ['Dashboard da Aurora', 'Tarefas']
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
    relatedPages: ['Guias de Imposto', 'Administração']
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
    relatedPages: ['Score do Escritório', 'Indicadores']
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
    relatedPages: ['Fechamento + DRE Bancário', 'Lançamentos Contábeis']
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
    relatedPages: ['DRE do Escritório', 'Indicadores']
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
    relatedPages: ['Indicadores Customizados', 'Score do Escritório']

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
    relatedPages: ['Indicadores', 'Planejamento']
  },
  '/dashboard/score': {
    title: 'Score do Escritório',
    description: 'Nota de 0 a 100 da saúde do seu escritório, baseada em 5 dimensões ponderadas (Mercado, Pessoas, Comercial, Crescimento, Gestão).',
    audience: 'Empresa',
    controlType: 'Estratégico',
    steps: [
      'Veja sua nota total e a barra colorida (vermelho → amarelo → verde).',
      'Analise o detalhamento por dimensão para entender o peso de cada uma.',
      'Leia os insights automáticos que apontam seus 2 pontos fracos e 1 forte.'
    ],
    relatedPages: ['Visão de Futuro', 'Ranking de Níveis']
  },
  '/dashboard/mentoria': {
    title: 'Visão de Futuro (Mentoria)',
    description: 'Plano de ação personalizado baseado no seu Score. O sistema sugere ações concretas para melhorar suas dimensões mais fracas.',
    audience: 'Empresa',
    controlType: 'Estratégico',
    steps: [
      'Defina sua visão de longo prazo (clientes, equipe, faturamento).',
      'Revise os "Focos" sugeridos pelo sistema (2 dimensões mais fracas).',
      'Marque as ações do checklist como concluídas e veja a barra de execução subir.'
    ],
    relatedPages: ['Score do Escritório', 'Planejamento']
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
    relatedPages: ['Score do Escritório', 'Visão de Futuro']
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
    relatedPages: ['Reforma Tributária', 'DRE do Cliente (Oficial)']
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
    relatedPages: ['Planejamento Tributário', 'DRE do Cliente (Oficial)']
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
    relatedPages: ['Administração: Catálogo']
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
    relatedPages: ['Administração: Visão Geral', 'Meus Planos']
  }
};

/**
 * Retorna o conteúdo de ajuda para a rota atual.
 * Se a rota não estiver mapeada, retorna um fallback amigável.
 */
export function getPageHelp(pathname: string): PageHelpInfo | null {
  // 1. Tenta correspondência exata primeiro
  if (helpCatalog[pathname]) {
    return helpCatalog[pathname];
  }
  
  // 2. Fallback para rotas dinâmicas ou não mapeadas (ex: /dashboard/admin/...)
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