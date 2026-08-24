// =================================================================
// INÍCIO: backend/src/accounting/domain/parse-statement.ts
// =================================================================
// 🏦 Parser do EXTRATO BANCÁRIO REAL (ETAPA 2 — ADR-066/068/069)
//
// ✅ VALIDADO contra o CSV modificado (24/08/2026):
//   Sicredi;Cooperativa: 2606;Conta: 07417-6;;;;
//   Data;Descrição;Documento;Entrada;Saída;Saldo (R$);
//   ;SALDO ANTERIOR;;;;0;
//   15/05/2026;RECEBIMENTO PIX 01890710954 Solange Bennert;PIX_CRED;200;;200;
//   ...
//   ;Cooperativa: 2606;Conta: 07417-6;;;;          ← seções seguintes
//   Data;Descrição;Documento;;Valor (R$);Saldo (R$);  ← header c/ Entrada vazia
//   ;Cooperativa: 2606;Conta: 82048-5;;;;          ← segunda conta
//
// 🛡️ REGRAS À PROVA DE ERRO (lições aprendidas):
//   • "Conta: XXXX-X" aparece EM QUALQUER POSIÇÃO da linha (pode começar c/ ';')
//   • Colunas de valor POR POSIÇÃO: col 3 = Entrada, col 4 = Saída/Valor
//     (o Sicredi deixa o header "Entrada" vazio em algumas seções)
//   • Saídas POSITIVAS no CSV modificado → lado decidido pela DESCRIÇÃO
//     (RECEBIMENTO/PAGAMENTO/LIQUIDACAO) + coluna preenchida, NUNCA pelo sinal
//   • Dedupe por (conta+data+desc+valor+doc) — mata blocos duplicados
// =================================================================

/** Uma linha útil do extrato, já normalizada. */
export interface StatementRow {
  key: string;            // chave p/ rastreio/idempotência
  date: string;           // 'YYYY-MM-DD'
  description: string;    // descrição original (histórico do banco)
  counterparty: string;   // contraparte extraída (ex.: "SOLANGE BENNERT")
  document: string;       // documento (PIX_CRED, CX431728...)
  amount: number;         // valor absoluto (> 0)
  side: 'ENTRADA' | 'SAIDA';
  bankAccount: string;    // conta da seção ("07417-6") ou '' se desconhecida
}

// ─────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────

/** Header normalizado: maiúsculas, sem acentos, sem símbolos. */
function normHeader(h: string): string {
  return h.toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
}

/** Detecção de separador (mesma técnica do bancário). */
function detectDelimiter(line: string): string {
  return [';', '\t', '|', ','].reduce(
    (best, d) => (line.split(d).length > line.split(best).length ? d : best),
    ';',
  );
}

/**
 * 🔢 Parser de valor BR: '1.650,00' | '-20' | '20' | '1.350,00' -> number.
 * (aceita negativos por segurança, mas o CSV modificado usa positivos)
 */
export function parseMoney(raw: string | null | undefined): number {
  if (!raw) return 0;
  let s = raw.toString().replace('R$', '').trim();
  if (!s) return 0;
  let negative = false;
  if (s.startsWith('-')) { negative = true; s = s.slice(1); }
  if (s.includes(',')) s = s.replace(/\./g, '').replace(',', '.');
  const v = parseFloat(s);
  if (Number.isNaN(v)) return 0;
  return negative ? -v : v;
}

/**
 * 👤 Extrai a CONTRAPARTE da descrição do banco:
 *   "RECEBIMENTO PIX 01890710954 Solange Bennert" -> "Solange Bennert"
 *   "LIQUIDACAO BOLETO 82577636000165 MUNICIPIO DE TI" -> "MUNICIPIO DE TI"
 *   "PLANO INT CAPITAL" -> "PLANO INT CAPITAL"
 */
export function extractCounterparty(description: string): string {
  let s = (description || '').trim();
  s = s.replace(/^(RECEBIMENTO|PAGAMENTO|LIQUIDACAO|ESTORNO|TRANSFERENCIA)\s+/i, '');
  s = s.replace(/^(PIX|BOLETO|TED|DOC)\s+/i, '');
  s = s.replace(/\b\d{6,}\b/g, ''); // CPF/CNPJ/chave PIX
  return s.replace(/\s+/g, ' ').trim();
}

/** Normaliza p/ casamento (memória do razão / regras). */
export function normalizeForMatch(s: string): string {
  return (s || '')
    .toUpperCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^A-Z0-9 ]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// ─────────────────────────────────────────────────────────────────
// PARSER PRINCIPAL (multi-seção, multi-conta, cabeçalho dinâmico)
// ─────────────────────────────────────────────────────────────────

/**
 * 🏦 Converte o conteúdo do CSV do extrato em linhas estruturadas.
 * Nunca lança exceção p/ linha ruim — apenas ignora (linhasIgnoradas).
 */
export function parseStatement(content: string): {
  rows: StatementRow[];
  linhasIgnoradas: number;
} {
  const lines = content.split(/\r?\n/);
  const rows: StatementRow[] = [];
  const seen = new Set<string>(); // dedupe de artefatos de copy-paste
  let linhasIgnoradas = 0;

  // Estado da máquina: conta ativa + colunas da seção atual
  let currentBank = '';
  let delim = ';';
  let iDate = -1, iDesc = -1, iDoc = -1, iIn = -1, iOut = -1;

  for (const raw of lines) {
    const t = raw.trim();
    if (!t) continue; // linhas vazias / ";;;;;;"

    // 🏦 Cabeçalho de seção: "Conta: 07417-6" EM QUALQUER POSIÇÃO
    // (a linha pode começar com ';' → ";Cooperativa: 2606;Conta: 07417-6;;;;")
    const contaMatch = t.match(/Conta:\s*([0-9][0-9-]*)/i);
    if (contaMatch) {
      currentBank = contaMatch[1].trim();
      continue;
    }

    // 📋 Cabeçalho de colunas: linha com DATA + DESCRICAO/HISTORICO.
    // Pode aparecer VÁRIAS vezes (uma por seção) → relê colunas sempre.
    const upper = t.toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    if (upper.includes('DATA') && (upper.includes('DESCRICAO') || upper.includes('HISTORICO'))) {
      delim = detectDelimiter(t);
      const header = t.split(delim).map(normHeader);
      iDate = header.findIndex((h) => h.includes('DATA'));
      iDesc = header.findIndex((h) => h.includes('DESCRICAO') || h.includes('HISTORICO'));
      iDoc  = header.findIndex((h) => h.includes('DOCUMENTO'));

      // Colunas de valor: prefere nome no header; SENÃO posição fixa
      // (padrão Sicredi: col 3 = Entrada, col 4 = Saída/Valor —
      //  em algumas seções o header "Entrada" vem VAZIO)
      iIn = header.findIndex((h) => h.startsWith('ENT') || h.includes('CRED'));
      iOut = header.findIndex((h) => h.startsWith('SAID') || h.startsWith('DEB'));
      if (iIn === -1) iIn = 3;
      if (iOut === -1) iOut = 4;
      continue;
    }

    // Linhas de dados só valem após um cabeçalho ter sido lido
    if (iDate < 0) { linhasIgnoradas++; continue; }

    const c = t.split(delim).map((s) => (s || '').trim());
    const dateStr = c[iDate] || '';
    const m = dateStr.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (!m) { linhasIgnoradas++; continue; } // "SALDO ANTERIOR", "Sicredi", etc.
    const date = `${m[3]}-${m[2]}-${m[1]}`;

    const desc = iDesc >= 0 ? c[iDesc] : '';
    if (!desc) { linhasIgnoradas++; continue; }

    const inVal  = parseMoney(c[iIn]);
    const outVal = parseMoney(c[iOut]);
    if (inVal === 0 && outVal === 0) { linhasIgnoradas++; continue; }

    // ── Lado: 1º descrição (confiável) → 2º coluna preenchida → 3º sinal ──
    // (no CSV modificado as saídas são POSITIVAS → sinal não decide quase nada)
    let side: 'ENTRADA' | 'SAIDA';
    if (/RECEBIMENTO/.test(desc)) side = 'ENTRADA';
    else if (/PAGAMENTO|LIQUIDACAO/.test(desc)) side = 'SAIDA';
    else if (inVal > 0 && outVal === 0) side = 'ENTRADA';
    else if (outVal > 0 && inVal === 0) side = 'SAIDA';
    else side = inVal > 0 ? 'ENTRADA' : 'SAIDA';

    const amount = Math.abs(Math.max(inVal, outVal));
    const document = iDoc >= 0 ? c[iDoc] : '';

    // ── Dedupe: mesma conta+data+desc+valor+doc = artefato duplicado ──
    const dedupeKey = `${currentBank}|${date}|${normalizeForMatch(desc)}|${amount.toFixed(2)}|${document}`;
    if (seen.has(dedupeKey)) { linhasIgnoradas++; continue; }
    seen.add(dedupeKey);

    rows.push({
      key: dedupeKey,
      date,
      description: desc,
      counterparty: extractCounterparty(desc).toUpperCase(),
      document,
      amount,
      side,
      bankAccount: currentBank,
    });
  }

  return { rows, linhasIgnoradas };
}
// =================================================================
// FIM: backend/src/accounting/domain/parse-statement.ts
// =================================================================