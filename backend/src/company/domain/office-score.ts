// =================================================================
// INICIO: backend/src/company/domain/office-score.ts
// =================================================================
/**
 * OfficeScore - Sprint C4 (dominio puro, ADR-055)
 * Consolida as 5 dimensoes do escritorio em UMA nota 0-100.
 * Deterministico, explicavel, zero IA/HTTP/Prisma.
 */

export interface ScoreInputs {
  softwareCoverage: number;
  servicesCoverage: number;
  newbieTurnoverRate: number;
  sectorOkPct: number;
  positionCoverage: number;
  conversionRate: number | null;
  avgDiscount: number | null;
  clientsGoalPct: number;
  teamGoalPct: number;
  customProgressAvg: number | null;
}

export interface DimensionScore {
  key: string;
  label: string;
  weight: number;
  score: number;
  detail: string;
}

export interface OfficeScoreResult {
  total: number;
  level: 'CRITICO' | 'ATENCAO' | 'SAUDAVEL' | 'EXCELENTE';
  dimensions: DimensionScore[];
  insights: string[];
}

const clamp = (v: number, min = 0, max = 100) => Math.min(max, Math.max(min, v));
const round = (v: number) => Math.round(v);

export function computeOfficeScore(i: ScoreInputs): OfficeScoreResult {
  // 1) MERCADO (25): media das duas coberturas
  const market = round((clamp(i.softwareCoverage) + clamp(i.servicesCoverage)) / 2);

  // 2) PESSOAS (20): novatos (50% de turnover novato -> 0) + setores OK
  const newbieScore = clamp(100 - i.newbieTurnoverRate * 2);
  const people = round((newbieScore + clamp(i.sectorOkPct)) / 2);

  // 3) COMERCIAL (20): conversao (40% = 100) + desconto (<=5% = 100; 30% = 0)
  const convScore = i.conversionRate === null ? 50 : clamp(i.conversionRate * 2.5);
  const discScore = i.avgDiscount === null ? 50 : clamp(100 - Math.max(0, i.avgDiscount - 5) * 4);
  const commercial = round((convScore + discScore) / 2);

  // 4) CRESCIMENTO (15): progresso das metas do CompanyProfile
  const growth = round((clamp(i.clientsGoalPct) + clamp(i.teamGoalPct)) / 2);

  // 5) GESTAO (20): cargos benchmark + progresso medio C3 (sem dados = 50 neutro)
  const customScore = i.customProgressAvg === null ? 50 : clamp(i.customProgressAvg);
  const management = round((clamp(i.positionCoverage) + customScore) / 2);

  const dimensions: DimensionScore[] = [
    {
      key: 'market',
      label: 'Mercado',
      weight: 25,
      score: market,
      detail: `Softwares ${round(i.softwareCoverage)}% - Servicos ${round(i.servicesCoverage)}%`,
    },
    {
      key: 'people',
      label: 'Pessoas',
      weight: 20,
      score: people,
      detail: `Turnover novatos ${round(i.newbieTurnoverRate)}% - Setores OK ${round(i.sectorOkPct)}%`,
    },
    {
      key: 'commercial',
      label: 'Comercial',
      weight: 20,
      score: commercial,
      detail:
        i.conversionRate === null
          ? 'Sem propostas fechadas ainda (neutro 50)'
          : `Conversao ${round(i.conversionRate)}% - Desconto medio ${i.avgDiscount === null ? '---' : round(i.avgDiscount) + '%'}`,
    },
    {
      key: 'growth',
      label: 'Crescimento',
      weight: 15,
      score: growth,
      detail: `Meta clientes ${round(i.clientsGoalPct)}% - Meta equipe ${round(i.teamGoalPct)}%`,
    },
    {
      key: 'management',
      label: 'Gestao',
      weight: 20,
      score: management,
      detail: `Cargos benchmark ${round(i.positionCoverage)}% - Indicadores C3 ${i.customProgressAvg === null ? '---' : round(i.customProgressAvg) + '%'}`,
    },
  ];

  const total = round(
    dimensions.reduce((sum, d) => sum + (d.score * d.weight) / 100, 0),
  );

  const level: OfficeScoreResult['level'] =
    total >= 80 ? 'EXCELENTE' : total >= 60 ? 'SAUDAVEL' : total >= 40 ? 'ATENCAO' : 'CRITICO';

  // Insights: 2 pontos fracos + 1 forte
  const sorted = [...dimensions].sort((a, b) => a.score - b.score);
  const insights: string[] = [];
  if (sorted[0].score < 60) {
    insights.push(`Prioridade: ${sorted[0].label} (${sorted[0].score}/100) - ${sorted[0].detail}.`);
  }
  if (sorted[1].score < 60) {
    insights.push(`Atencao: ${sorted[1].label} (${sorted[1].score}/100) - ${sorted[1].detail}.`);
  }
  insights.push(`Ponto forte: ${sorted[4].label} (${sorted[4].score}/100).`);

  return { total, level, dimensions, insights };
}
// =================================================================
// FIM: backend/src/company/domain/office-score.ts
// =================================================================