// =================================================================
// INÍCIO: backend/src/company/domain/level-ranking.ts
// =================================================================
/**
 * 🏆 LevelRanking — Sprint D3 (domínio puro, ADR-058)
 * Gamificação determinística: níveis por faixa do Score (C4) +
 * ranking/pódio da rede de tenants. Zero IA, zero Prisma.
 */

export type LevelKey = 'BRONZE' | 'PRATA' | 'OURO' | 'DIAMANTE';

export interface LevelInfo {
  key: LevelKey;
  label: string;
  minScore: number;
  badge: string;  // emoji do nível
  color: string;  // hex p/ UI
  perk: string;   // "benefício" narrativo do nível
}

/** Faixas de nível (ordem crescente de minScore). */
export const LEVELS: LevelInfo[] = [
  { key: 'BRONZE',   label: 'Bronze',   minScore: 0,  badge: '🥉', color: '#b45309',
    perk: 'Escritório no início da jornada de gestão.' },
  { key: 'PRATA',    label: 'Prata',    minScore: 40, badge: '🥈', color: '#64748b',
    perk: 'Processos sob controle; próximo passo: mercado.' },
  { key: 'OURO',     label: 'Ouro',     minScore: 60, badge: '🥇', color: '#f59e0b',
    perk: 'Alta performance; referência regional em construção.' },
  { key: 'DIAMANTE', label: 'Diamante', minScore: 80, badge: '💎', color: '#0ea5e9',
    perk: 'Elite da gestão; seu escritório É o benchmark.' },
];

/** Nível atual pela nota (0–100). */
export function getLevel(score: number): LevelInfo {
  return [...LEVELS].reverse().find((l) => score >= l.minScore) || LEVELS[0];
}

/** Próximo nível (null se já é Diamante). */
export function getNextLevel(score: number): LevelInfo | null {
  return LEVELS.find((l) => l.minScore > score) || null;
}

export interface RankingEntryInput { companyId: string; name: string; score: number; }

export interface RankingEntry extends RankingEntryInput {
  level: LevelInfo;
  isYou: boolean;
  position: number;
}

/** Ordena por score desc (desempate por nome) e numera posições. */
export function buildRanking(entries: RankingEntryInput[], youId: string): RankingEntry[] {
  return entries
    .slice()
    .sort((a, b) => b.score - a.score || a.name.localeCompare(b.name, 'pt-BR'))
    .map((e, i) => ({
      ...e,
      level: getLevel(e.score),
      isYou: e.companyId === youId,
      position: i + 1,
    }));
}
// =================================================================
// FIM: backend/src/company/domain/level-ranking.ts
// =================================================================