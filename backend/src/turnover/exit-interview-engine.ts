// =================================================================
// INÍCIO: backend/src/turnover/exit-interview-engine.ts
// =================================================================
/**
 * =================================================================
 * 🤖 ExitInterviewEngine — Sprint B4 (domínio puro, ADR-050)
 * =================================================================
 * Motor DETERMINÍSTICO de análise de entrevistas de desligamento.
 * Classifica as respostas em 7 causas-raiz por keywords normalizadas
 * (sem acento, minúsculas), pontua cada causa e devolve:
 * - causas ordenadas por score
 * - causa primária + confiança (%)
 * - plano de ação sugerido (templates por categoria)
 *
 * 🧠 ADR-050: a interface `ExitAnalysisResult` é o contrato estável.
 *    Hoje: regras de keyword. Amanhã: LLM real — sem tocar em
 *    service/controller/UI.
 * 🛡️ ADR-031: IA só sugere; o diretor decide.
 *
 * Zero dependências de banco/HTTP — 100% testável em memória.
 * =================================================================
 */

// =================================================================
// 📋 TIPOS (contrato estável — ADR-050)
// =================================================================

/** Uma causa-raiz pontuada. */
export interface CauseScore {
  category: string;      // id interno (ex: 'remuneracao')
  label: string;         // label humano (ex: '💰 Remuneração')
  score: number;         // nº de keywords casadas
  matched: string[];     // keywords encontradas (auditoria)
}

/** Resultado completo da análise. */
export interface ExitAnalysisResult {
  causes: CauseScore[];          // ordenadas desc, só score > 0
  primaryCause: string | null;   // id da causa primária
  primaryLabel: string | null;
  confidence: number;            // 0–100 (score primária ÷ total)
  actionPlan: string[];          // plano de ação sugerido
  engine: string;                // 'rules-v1' (ADR-050: p/ trocar depois)
  analyzedAt: string;            // ISO
}

// =================================================================
// 🗂️ CATÁLOGO DE CAUSAS-RAIZ (keywords + planos de ação)
// =================================================================

interface CauseDef {
  id: string;
  label: string;
  keywords: string[]; // SEM acento, minúsculas (o texto é normalizado antes)
  plan: string[];
}

const CAUSES: CauseDef[] = [
  {
    id: 'remuneracao',
    label: '💰 Remuneração e Benefícios',
    keywords: [
      'salario', 'remuneracao', 'beneficio', 'plano de saude', 'vale',
      'bonus', 'aumento', 'pagamento', 'financeiro', 'ganhar mais', 'pagava mais',
    ],
    plan: [
      'Rodar benchmark salarial de mercado (Sprint C2) para o cargo',
      'Revisar política de reajuste com ciclos claros de revisão',
      'Avaliar benefícios flexíveis (VA, saúde, auxílio educação)',
    ],
  },
  {
    id: 'lideranca',
    label: '🧭 Liderança e Gestão',
    keywords: [
      'chefe', 'gestor', 'lider', 'lideranca', 'feedback', 'reconhecimento',
      'apoio', 'comunicacao', 'autoritarismo', 'microgerenciamento', 'cobranca',
    ],
    plan: [
      'Treinar o líder do setor em feedback e gestão de pessoas',
      'Implantar rotina de 1:1s mensais com registros',
      'Rodar pesquisa de clima focada na relação líder-liderado',
    ],
  },
  {
    id: 'crescimento',
    label: '📈 Crescimento e Carreira',
    keywords: [
      'crescer', 'crescimento', 'plano de carreira', 'promocao', 'oportunidade',
      'estagnar', 'evolucao', 'aprender', 'desenvolvimento', 'curso', 'perspectiva',
    ],
    plan: [
      'Criar PDP (Plano de Desenvolvimento) com trilha de promoção',
      'Divulgar vagas internamente antes do mercado',
      'Reservar orçamento anual para cursos e certificações',
    ],
  },
  {
    id: 'clima',
    label: '🌡️ Clima e Cultura',
    keywords: [
      'clima', 'cultura', 'ambiente', 'equipe', 'colegas', 'respeito',
      'toxico', 'assedio', 'valores', 'pertencimento', 'panelinha',
    ],
    plan: [
      'Rodar pesquisa de clima pulso na equipe citada',
      'Reforçar valores e cultura em reuniões mensais',
      'Criar canal seguro de mediação de conflitos',
    ],
  },
  {
    id: 'sobrecarga',
    label: '️ Sobrecarga e Equilíbrio',
    keywords: [
      'horario', 'hora extra', 'sobrecarga', 'exausto', 'burnout', 'estresse',
      'equilibrio', 'descanso', 'ferias', 'volume', 'prazo', 'acumulado',
    ],
    plan: [
      'Revisar headcount × volume do setor (cruzar com Sprint B2)',
      'Redistribuir tarefas e renegociar prazos irreais',
      'Incentivar pausas e respeito ao horário de descanso',
    ],
  },
  {
    id: 'externo',
    label: '🚪 Proposta Externa',
    keywords: [
      'outra empresa', 'proposta', 'concorrente', 'convite', 'mudanca',
      'cidade', 'remoto', 'home office', 'carreira nova',
    ],
    plan: [
      'Criar programa boomerang (porta aberta para retorno)',
      'Checar se o motivo financeiro foi decisivo (ver Remuneração)',
      'Fortalecer a proposta de valor ao colaborador (EVP)',
    ],
  },
  {
    id: 'pessoal',
    label: '🏠 Motivos Pessoais',
    keywords: [
      'familia', 'saude', 'estudos', 'faculdade', 'pessoal', 'conjuge',
      'filho', 'gravidez', 'cuidar',
    ],
    plan: [
      'Oferecer flexibilidade (remoto/horário) quando possível',
      'Manter porta aberta para retorno futuro',
      'Sem ação corretiva — apenas acompanhar tendência no agregado',
    ],
  },
];

/** Plano genérico quando nenhuma causa domina. */
const GENERIC_PLAN = [
  'Nenhuma causa dominante — conduzir conversa de follow-up',
  'Revisar as perguntas da entrevista para o próximo ciclo',
  'Cruzar com clima e turnover do setor (Sprints B2/B3)',
];

// =================================================================
// 🔧 HELPERS
// =================================================================

/** Normaliza texto: minúsculo + SEM acentos (NFD strip). */
function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

// =================================================================
// 🎯 MOTOR DE ANÁLISE
// =================================================================

/**
 * Analisa as respostas da entrevista e devolve o resultado estruturado.
 * @param answers array com as 5 respostas livres do colaborador
 */
export function analyzeExitInterview(answers: string[]): ExitAnalysisResult {
  const text = normalize(answers.join(' \n '));

  // Pontua cada causa pelo nº de keywords casadas
  const scored: CauseScore[] = CAUSES.map((c) => {
    const matched = c.keywords.filter((kw) => text.includes(kw));
    return { category: c.id, label: c.label, score: matched.length, matched };
  })
    .filter((c) => c.score > 0)
    .sort((a, b) => b.score - a.score);

  const totalScore = scored.reduce((s, c) => s + c.score, 0);
  const primary = scored[0] ?? null;
  const primaryDef = CAUSES.find((c) => c.id === primary?.category) ?? null;

  const confidence =
    primary && totalScore > 0
      ? Math.round((primary.score / totalScore) * 100)
      : 0;

  return {
    causes: scored,
    primaryCause: primary?.category ?? null,
    primaryLabel: primary?.label ?? null,
    confidence,
    actionPlan: primaryDef ? primaryDef.plan : GENERIC_PLAN,
    engine: 'rules-v1', // ADR-050: trocar p/ 'llm-v1' no futuro
    analyzedAt: new Date().toISOString(),
  };
}
// =================================================================
// FIM: backend/src/turnover/exit-interview-engine.ts
// =================================================================