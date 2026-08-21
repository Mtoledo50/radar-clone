// =================================================================
// INÍCIO: frontend/src/lib/page-help-catalog.ts
// =================================================================
export interface PageHelpInfo {
  title: string;
  description: string;
  audience: 'Empresa' | 'Cliente' | 'Geral';
  controlType: 'Interno' | 'Estratégico' | 'Operacional' | 'Fiscal' | 'Financeiro';
  steps: string[];
  relatedPages?: string[];
}

export const PAGE_HELP_CATALOG: Record<string, PageHelpInfo> = {
  dashboard: {
    title: 'Dashboard Executivo',
    description: 'Visão geral do escritório com KPIs em tempo real: clientes ativos, faturamento, equipe e metas.',
    audience: 'Empresa',
    controlType: 'Estratégico',
    steps: ['Visualize KPIs principais no topo', 'Clique em qualquer card para ir à página detalhada', 'Use os filtros de período para comparar meses'],
    relatedPages: ['minha-empresa', 'clientes'],
  },
  'minha-empresa': {
    title: 'Minha Empresa',
    description: 'Cadastro do escritório: dados básicos, stack de softwares, metas e visão de futuro. Também controla o branding das propostas.',
    audience: 'Empresa',
    controlType: 'Interno',
    steps: ['Preencha razão social, CNPJ e estado', 'Cadastre os softwares que você usa', 'Defina metas de clientes e equipe', 'Escreva sua visão de futuro', 'Personalize cores da proposta'],
    relatedPages: ['score', 'mentoria'],
  },
  score: {
    title: 'Score do Escritório',
    description: 'Nota única 0-100 consolidando 5 dimensões: Mercado, Pessoas, Comercial, Crescimento e Gestão.',
    audience: 'Empresa',
    controlType: 'Estratégico',
    steps: ['Veja nota total e nível (Bronze→Diamante)', 'Analise cada dimensão (peso + barra)', 'Leia insights da diretoria', 'Aja nos pontos fracos'],
    relatedPages: ['mentoria', 'ranking'],
  },
  mentoria: {
    title: 'Visão de Futuro',
    description: 'Norte estratégico + plano de mentoria derivado do Score (focos + ações + checklist executável).',
    audience: 'Empresa',
    controlType: 'Estratégico',
    steps: ['Escreva sua visão (norte da empresa)', 'Defina metas de clientes e equipe', 'Veja focos da mentoria', 'Importe ações dos focos para o checklist', 'Marque itens como feitos'],
    relatedPages: ['score', 'minha-empresa'],
  },
  // Adicione outras páginas conforme necessário...
};

export function getPageHelp(pathname: string): PageHelpInfo | null {
  const parts = pathname.split('/').filter(Boolean);
  const key = parts[parts.length - 1] || 'dashboard';
  if (PAGE_HELP_CATALOG[key]) return PAGE_HELP_CATALOG[key];
  for (const k of Object.keys(PAGE_HELP_CATALOG)) {
    if (pathname.includes(k)) return PAGE_HELP_CATALOG[k];
  }
  return null;
}
// =================================================================
// FIM: frontend/src/lib/page-help-catalog.ts
// =================================================================