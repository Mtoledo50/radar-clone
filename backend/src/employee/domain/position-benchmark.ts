// =================================================================
// INÍCIO: backend/src/employee/domain/position-benchmark.ts
// =================================================================
/**
 * =================================================================
 * 🎯 PositionBenchmark — Sprint B5 (domínio puro, ADR-051)
 * =================================================================
 * Benchmark contábil de cargos recomendados por setor. Compara os
 * cargos REAIS (Employee.position) com o catálogo e deriva gaps:
 * VACANCY (falta) / OK / OVER (sobra).
 *
 * 🧠 ADR-051: catálogo estático versionado, ZERO tabelas novas.
 *    Gaps derivados em memória dos Employees ativos (fonte da verdade),
 *    mesma filosofia do ADR-020 (herança) e ADR-048 (setores).
 *
 * 📐 Regra de cálculo (determinística):
 *    1. Recomendado por cargo = método dos maiores restos
 *       (ideal = headcount × peso; soma sempre = headcount do setor).
 *    2. Preenchido = cargos reais classificados por keywords (NFD sem acento).
 *    3. gap = recomendado − preenchido → VACANCY / OK / OVER.
 *    4. Cargos reais não reconhecidos → unmapped (como na B2).
 * =================================================================
 */

// =================================================================
// 📋 TIPOS (contrato estável)
// =================================================================

/** Definição de um cargo recomendado dentro de um setor. */
export interface RecommendedPositionDef {
  title: string;        // label humano (ex: "Analista Fiscal")
  keywords: string[];   // normalizadas p/ casar com Employee.position
  weight: number;       // fração do headcount do setor (soma 1 no setor)
  description: string;  // papel do cargo (exibido na UI)
}

/** Setor + seus cargos recomendados. */
export interface SectorPositionsDef {
  sector: string; // nome canônico ADR-048
  positions: RecommendedPositionDef[];
}

/** Resultado por cargo (gap). */
export interface PositionGap {
  title: string;
  description: string;
  recommended: number;
  filled: number;
  gap: number; // recomendado − preenchido
  status: 'OK' | 'VACANCY' | 'OVER';
}

/** Análise completa de um setor. */
export interface SectorPositionAnalysis {
  sector: string;
  headcount: number;
  positions: PositionGap[];
  unmappedPositions: Array<{ name: string; count: number }>;
}

// =================================================================
// 🗂️ CATÁLOGO DE BENCHMARK (versão v1)
// =================================================================

export const POSITION_BENCHMARKS: SectorPositionsDef[] = [
  {
    sector: 'Fiscal',
    positions: [
      {
        title: 'Assistente/Auxiliar Fiscal',
        keywords: ['assistente', 'auxiliar'],
        weight: 0.35,
        description: 'Rotina de entrada: lançamento de NF-e, organização de documentos.',
      },
      {
        title: 'Analista Fiscal',
        keywords: ['analista'],
        weight: 0.45,
        description: 'Apuração de impostos, obrigações acessórias, SPED.',
      },
      {
        title: 'Supervisor/Revisor Fiscal',
        keywords: ['supervisor', 'revisor', 'gerente', 'coordenador'],
        weight: 0.2,
        description: 'Revisão de apurações e qualidade das entregas.',
      },
    ],
  },
  {
    sector: 'Contábil',
    positions: [
      {
        title: 'Assistente/Auxiliar Contábil',
        keywords: ['assistente', 'auxiliar'],
        weight: 0.35,
        description: 'Classificação de lançamentos e conciliações básicas.',
      },
      {
        title: 'Analista Contábil',
        keywords: ['analista'],
        weight: 0.45,
        description: 'Escrituração, balancetes, demonstrativos.',
      },
      {
        title: 'Contador/Revisor',
        keywords: ['contador', 'revisor', 'gerente', 'supervisor', 'coordenador'],
        weight: 0.2,
        description: 'Responsabilidade técnica e revisão final.',
      },
    ],
  },
  {
    sector: 'Departamento Pessoal',
    positions: [
      {
        title: 'Assistente de DP',
        keywords: ['assistente', 'auxiliar'],
        weight: 0.4,
        description: 'Admissões, férias, documentação de colaboradores.',
      },
      {
        title: 'Analista de DP/Folha',
        keywords: ['analista'],
        weight: 0.4,
        description: 'Folha de pagamento, encargos, eSocial.',
      },
      {
        title: 'Especialista/Superior DP',
        keywords: ['especialista', 'gerente', 'supervisor', 'coordenador'],
        weight: 0.2,
        description: 'Casos complexos, legislação e auditoria de folha.',
      },
    ],
  },
  {
    sector: 'Administrativo/Comercial',
    positions: [
      {
        title: 'Financeiro',
        keywords: ['financeiro', 'faturamento', 'contas a pagar', 'tesouraria'],
        weight: 0.4,
        description: 'Fluxo de caixa, cobranças e pagamentos do escritório.',
      },
      {
        title: 'Comercial/Vendas',
        keywords: ['comercial', 'vendas', 'executivo', 'sdr', 'bdr'],
        weight: 0.3,
        description: 'Prospecção e propostas (motor comercial A1–A7).',
      },
      {
        title: 'RH/Administrativo',
        keywords: ['rh', 'administrativo', 'recepcao', 'office', 'secretari'],
        weight: 0.3,
        description: 'Apoio interno, recepção e rotinas administrativas.',
      },
    ],
  },
];

// =================================================================
// 🔧 HELPERS
// =================================================================

/** Normaliza texto: minúsculo + SEM acentos (NFD strip). */
export function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

/**
 * 📐 Método dos maiores restos (apportionment):
 * distribui `total` inteiro entre pesos fracionários, soma exata.
 * Determinístico — desempate por índice (ordem do catálogo).
 */
export function apportion(total: number, weights: number[]): number[] {
  const ideals = weights.map((w) => total * w);
  const floors = ideals.map((v) => Math.floor(v));
  let remaining = total - floors.reduce((a, b) => a + b, 0);

  // Índices ordenados pelo maior fracionário (estável: desempata por índice)
  const order = ideals
    .map((v, i) => ({ frac: v - Math.floor(v), i }))
    .sort((a, b) => b.frac - a.frac || a.i - b.i);

  const result = [...floors];
  for (const { i } of order) {
    if (remaining <= 0) break;
    result[i] += 1;
    remaining -= 1;
  }
  return result;
}

// =================================================================
// 🎯 MOTOR DE ANÁLISE
// =================================================================

/**
 * Analisa um setor: classifica os cargos reais no catálogo e deriva
 * gaps (VACANCY/OK/OVER) contra o headcount recomendado.
 *
 * @param sector      nome canônico (ADR-048)
 * @param headcount   colaboradores ativos no setor
 * @param actual      cargos reais agregados: [{ name, count }]
 */
export function analyzeSectorPositions(
  sector: string,
  headcount: number,
  actual: Array<{ name: string; count: number }>,
): SectorPositionAnalysis {
  const def = POSITION_BENCHMARKS.find((b) => b.sector === sector);

  // Setor sem benchmark (ex: "Outros") → só lista o que existe
  if (!def || headcount <= 0) {
    return { sector, headcount, positions: [], unmappedPositions: actual };
  }

  // 1) Classifica cada cargo real em UMA definição (1º match vence)
  const filledByDef = new Map<string, number>();
  def.positions.forEach((p) => filledByDef.set(p.title, 0));
  const unmapped: Array<{ name: string; count: number }> = [];

  for (const ap of actual) {
    const n = normalize(ap.name);
    const match = def.positions.find((rp) =>
      rp.keywords.some((kw) => n.includes(kw)),
    );
    if (match) {
      filledByDef.set(match.title, (filledByDef.get(match.title) || 0) + ap.count);
    } else {
      unmapped.push({ name: ap.name, count: ap.count });
    }
  }

  // 2) Headcount recomendado por cargo (maiores restos — soma exata)
  const recommended = apportion(
    headcount,
    def.positions.map((p) => p.weight),
  );

  // 3) Gaps + status
  const positions: PositionGap[] = def.positions.map((rp, i) => {
    const rec = recommended[i];
    const filled = filledByDef.get(rp.title) || 0;
    const gap = rec - filled;
    return {
      title: rp.title,
      description: rp.description,
      recommended: rec,
      filled,
      gap,
      status: gap > 0 ? 'VACANCY' : gap < 0 ? 'OVER' : 'OK',
    };
  });

  return { sector, headcount, positions, unmappedPositions: unmapped };
}
// =================================================================
// FIM: backend/src/employee/domain/position-benchmark.ts
// =================================================================