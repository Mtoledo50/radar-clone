// =================================================================
// INÍCIO: backend/src/accounting/domain/suggest-accounts.ts
// =================================================================
// 🧠 Motor de sugestão de contas p/ lançamentos do extrato (ETAPA 2)
//
// CLASSIFICAÇÃO DA CONTA DE RESULTADO em 3 camadas (ADR-068):
//   1️⃣ MEMÓRIA DO RAZÃO (contraparte→conta)          → 🟢 ALTA
//   2️⃣ REGRAS POR PALAVRA-CHAVE                       → 🟡 MEDIA
//   3️⃣ Sem match                                      → 🟠 REVISAR
//
// 🆕 CONTA BANCÁRIA DA PARTIDA DOBRADA por seção (ADR-069):
//   • bankBySection: "07417-6" → 01.1.1.02.026 Sicredi 07417-6
//   • fallback: defaultBank (seletor da UI)
//   • sem banco → 🟠 REVISAR (partida incompleta não salva)
// =================================================================
import { StatementRow, normalizeForMatch } from './parse-statement';

/** Referência mínima de conta contábil. */
export interface AccountRef { id: string; code: string; name: string }

/** Contexto montado pelo service (banco + memórias + contas). */
export interface SuggestContext {
  accountsByCode: Map<string, AccountRef>;
  counterpartyMap: Record<string, { code: string; name: string; hits: number }>;
  bankBySection: Map<string, AccountRef>; // 🆕 seção → conta bancária
  defaultBank: AccountRef | null;         // 🆕 fallback da UI
}

/** Rascunho de lançamento p/ revisão no frontend. */
export interface EntryDraft {
  key: string;
  date: string;
  description: string;
  counterparty: string;
  amount: number;
  side: 'ENTRADA' | 'SAIDA';
  confidence: 'ALTA' | 'MEDIA' | 'REVISAR';
  reason: string;        // auditoria: por que ALTA/MEDIA/REVISAR
  bankAccount: string;   // 🆕 seção de origem ("07417-6")
  debit: AccountRef | null;
  credit: AccountRef | null;
}

// ─────────────────────────────────────────────────────────────────
// REGRAS POR PALAVRA-CHAVE (códigos do plano SCI 90113 do cliente)
// ─────────────────────────────────────────────────────────────────
export const KEYWORD_RULES: { pattern: RegExp; code: string; label: string }[] = [
  { pattern: /PLANO INT CAPITAL|INTEGR\.? ?CAPITAL/i, code: '01.2.2.02.002', label: 'Integralização de capital' },
  { pattern: /MUNICIPIO|PREFEIT|SECRETARIA|FAZENDA/i, code: '04.2.4.01.012', label: 'Impostos/taxas (ente público)' },
  { pattern: /SUPERMERCADO|MERCADO|ATACAD/i,         code: '04.2.1.03.040', label: 'Material de consumo' },
  { pattern: /GRAFICA|IMPRENSA|COPIAS/i,             code: '04.2.1.03.057', label: 'Cópias/gráfica' },
];

// ─────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────

/**
 * 🔎 Casa a contraparte do extrato com a memória do razão:
 * exato → prefixo bidirecional (mín. 10 chars p/ evitar falsos positivos).
 * (o razão trunca nomes: "GRUPO DE ESCOTEIR" casa com "GRUPO DE ESCOTEIROS")
 */
function findCounterpartyHit(
  map: SuggestContext['counterpartyMap'],
  cpNorm: string,
): { code: string; name: string; hits: number } | null {
  if (!cpNorm) return null;
  if (map[cpNorm]) return map[cpNorm];
  for (const [key, val] of Object.entries(map)) {
    if (key.length < 10 || cpNorm.length < 10) continue;
    if (cpNorm.startsWith(key) || key.startsWith(cpNorm)) return val;
  }
  return null;
}

/** Resolve código → conta (exato; senão 1ª conta analítica sob o código). */
function resolveAccount(ctx: SuggestContext, code: string): AccountRef | null {
  const exact = ctx.accountsByCode.get(code);
  if (exact) return exact;
  for (const [c, acc] of ctx.accountsByCode) {
    if (c.startsWith(code + '.')) return acc;
  }
  return null;
}

// ─────────────────────────────────────────────────────────────────
// NÚCLEO: gera os rascunhos com partida dobrada
// ─────────────────────────────────────────────────────────────────

/**
 * 🧠 Converte linhas do extrato em rascunhos de lançamento.
 * ENTRADA → D banco / C conta de resultado • SAIDA → D resultado / C banco.
 */
export function buildDrafts(rows: StatementRow[], ctx: SuggestContext): EntryDraft[] {
  const drafts: EntryDraft[] = [];

  for (const row of rows) {
    const cpNorm = normalizeForMatch(row.counterparty);

    // Camada 1: memória do razão • Camada 2: regras por palavra-chave
    const hit = findCounterpartyHit(ctx.counterpartyMap, cpNorm);
    const rule = !hit ? KEYWORD_RULES.find((r) => r.pattern.test(row.description)) : null;
    const classCode = hit?.code ?? rule?.code ?? null;
    const classAcc = classCode ? resolveAccount(ctx, classCode) : null;

    // 🆕 MULTI-CONTA: banco da seção primeiro, fallback da UI depois (ADR-069)
    const bank = (row.bankAccount && ctx.bankBySection.get(row.bankAccount)) || ctx.defaultBank;

    // Confiança + auditoria
    let confidence: EntryDraft['confidence'] = hit ? 'ALTA' : rule ? 'MEDIA' : 'REVISAR';
    let reason = hit
      ? `memória do razão (${hit.hits}×)`
      : rule
        ? `regra: ${rule.label}`
        : 'sem match — revisão manual';
    if ((hit || rule) && !classAcc) {
      confidence = 'REVISAR';
      reason += ' / código não encontrado no plano';
    }
    if (!bank) {
      confidence = 'REVISAR';
      reason += ' / sem conta bancária p/ contrapartida';
    }

    // Monta D×C pela regra contábil
    let debit: AccountRef | null = null;
    let credit: AccountRef | null = null;
    if (row.side === 'ENTRADA') { debit = bank; credit = classAcc; }
    else { debit = classAcc; credit = bank; }

    drafts.push({
      key: row.key,
      date: row.date,
      description: row.description,
      counterparty: row.counterparty,
      amount: row.amount,
      side: row.side,
      confidence,
      reason,
      bankAccount: row.bankAccount,
      debit,
      credit,
    });
  }

  return drafts;
}
// =================================================================
// FIM: backend/src/accounting/domain/suggest-accounts.ts
// =================================================================