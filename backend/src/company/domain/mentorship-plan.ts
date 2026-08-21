// =================================================================
// INÍCIO: backend/src/company/domain/mentorship-plan.ts
// =================================================================
/**
 * 🧭 MentorshipPlan — Sprint D1 (domínio puro, ADR-056)
 * Deriva o "plano de mentoria" da Visão de Futuro + Score (C4):
 * progresso das metas + 2 focos (dimensões mais fracas) com ações.
 * Determinístico: catálogo de ações por dimensão, zero IA generativa.
 */

export interface MentorshipInput {
  visaoEmpresa: string | null;
  maiorDesafio: string | null;
  compromisso: string | null;
  clientesHoje: number;
  clientesAno: number;
  funcionariosHoje: number;
  funcionariosAno: number;
  dimensions: Array<{ key: string; label: string; score: number }>;
}

export interface GoalProgress {
  key: 'clientes' | 'equipe';
  label: string;
  current: number;
  target: number;
  pct: number;      // 0–100 (capado)
  remaining: number; // quanto falta
}

export interface FocusArea {
  dimensionKey: string;
  label: string;
  score: number;
  actions: string[];
}

export interface MentorshipPlanResult {
  hasVision: boolean;
  vision: { visaoEmpresa: string | null; maiorDesafio: string | null; compromisso: string | null };
  goals: GoalProgress[];
  focusAreas: FocusArea[];
  nextMilestone: string;
}

// Catálogo determinístico de ações por dimensão do Score (ADR-056)
const ACTION_CATALOG: Record<string, string[]> = {
  market: [
    'Completar o Stack de Softwares em Minha Empresa (Sprint C1)',
    'Revisar serviços extras não oferecidos no benchmark (Sprint C2)',
    'Criar 1 serviço novo do catálogo ainda este mês',
  ],
  people: [
    'Rodar entrevistas de desligamento e tratar causas-raiz (Sprint B4)',
    'Rever distribuição por setor vs. benchmark (Sprint B2)',
    'Marcar colaboradores críticos 🔑 e protegê-los (Sprint B3)',
  ],
  commercial: [
    'Rever desconto médio usando o Fechamento com Ganho (Sprint A4)',
    'Usar o "Dinheiro na Mesa" antes de dar desconto (Sprint A2)',
    'Analisar motivos de perda no Dashboard de Desempenho (Sprint A7)',
  ],
  growth: [
    'Preencher metas de clientes e equipe em Minha Empresa',
    'Definir meta de +1 cliente/mês e acompanhar no Score',
    'Rever capacidade da equipe antes de vender mais (Sprint B5)',
  ],
  management: [
    'Criar indicadores com meta no módulo Indicadores (Sprint C3)',
    'Preencher cargos reais p/ subir o benchmark de cargos (Sprint B5)',
    'Revisar os indicadores todo início de mês (ritual de gestão)',
  ],
};

const clamp = (v: number) => Math.min(100, Math.max(0, v));

export function computeMentorshipPlan(i: MentorshipInput): MentorshipPlanResult {
  // 1) Progresso das metas (0 se meta = 0)
  const goals: GoalProgress[] = [
    {
      key: 'clientes', label: 'Carteira de Clientes',
      current: i.clientesHoje, target: i.clientesAno,
      pct: i.clientesAno > 0 ? clamp(Math.round((i.clientesHoje / i.clientesAno) * 100)) : 0,
      remaining: Math.max(0, i.clientesAno - i.clientesHoje),
    },
    {
      key: 'equipe', label: 'Equipe',
      current: i.funcionariosHoje, target: i.funcionariosAno,
      pct: i.funcionariosAno > 0 ? clamp(Math.round((i.funcionariosHoje / i.funcionariosAno) * 100)) : 0,
      remaining: Math.max(0, i.funcionariosAno - i.funcionariosHoje),
    },
  ];

  // 2) Focos: 2 dimensões mais fracas com score < 70
  const weak = [...i.dimensions].sort((a, b) => a.score - b.score).filter((d) => d.score < 70);
  const focusAreas: FocusArea[] = weak.slice(0, 2).map((d) => ({
    dimensionKey: d.key,
    label: d.label,
    score: d.score,
    actions: ACTION_CATALOG[d.key] || [],
  }));

  // 3) Próximo marco (frase determinística)
  const goalOpen = goals.find((g) => g.target > 0 && g.remaining > 0);
  const nextMilestone = goalOpen
    ? `Próximo marco: ${goalOpen.label === 'Carteira de Clientes' ? 'chegar a' : 'montar equipe de'} ${goalOpen.target} (${goalOpen.remaining} a mais que hoje).`
    : focusAreas.length > 0
      ? `Próximo marco: tirar ${focusAreas[0].label} da zona de atenção (${focusAreas[0].score}/100).`
      : 'Próximo marco: manter todas as dimensões acima de 70 e subir o score total.';

  return {
    hasVision: Boolean(i.visaoEmpresa || i.maiorDesafio || i.compromisso),
    vision: {
      visaoEmpresa: i.visaoEmpresa, maiorDesafio: i.maiorDesafio, compromisso: i.compromisso,
    },
    goals,
    focusAreas,
    nextMilestone,
  };
}
// =================================================================
// FIM: backend/src/company/domain/mentorship-plan.ts
// =================================================================