// =================================================================
// INÍCIO: backend/src/accounting/domain/pdf/extractor-proxy.service.ts
// =================================================================
/**
 * 🆕 Sprint F11-a (ADR-048) — Proxy do Extrator Bancário Python
 * -----------------------------------------------------------------
 * O Radar NÃO duplica a inteligência de parsing: ele CONSULTA o
 * extrator FastAPI (porta 8000) via fetch nativo do Node (zero
 * dependências novas — undici já vem no Node 18+).
 *
 * Responsabilidades:
 *   1. health()  → badge de status na UI
 *   2. parse()   → envia o PDF (FormData/Blob nativos) e NORMALIZA
 *                  a resposta Python para o formato que a página
 *                  "Extratos PDF → CSV" já consome:
 *                  { bankLabel, totalRows, totalDebit, totalCredit,
 *                    rows[{date, description, debit, credit}] }
 *
 * 🛡️ Regras:
 *   - Nunca lança exceção "crua" para o controller: o controller
 *     decide o fallback nativo.
 *   - Composição de data: dia (Python) + competência (Python) →
 *     dd/mm/aaaa. Meses por extenso (FEV/2026) viram número.
 *   - Se EXTRATOR_URL não estiver no .env, usa localhost:8000.
 */
import { Injectable, Logger } from '@nestjs/common';

/** Linha no formato que a página do Radar já usa */
export interface UnifiedRow {
  date: string;
  description: string;
  debit: number;
  credit: number;
}

/** Payload normalizado (Python ou nativo) */
export interface UnifiedExtractData {
  bankLabel: string;
  totalRows: number;
  totalDebit: number;
  totalCredit: number;
  rows: UnifiedRow[];
  // Extras vindos do Python (cabeçalho do extrato) — UI exibe se houver
  agencia?: string;
  conta?: string;
  competencia?: string;
  nomeCliente?: string;
}

/** Meses por extenso (padrão Banrisul: MOVIMENTOS FEV/2026) */
const MESES_PT: Record<string, string> = {
  JAN: '01', FEV: '02', MAR: '03', ABR: '04', MAI: '05', JUN: '06',
  JUL: '07', AGO: '08', SET: '09', OUT: '10', NOV: '11', DEZ: '12',
};

@Injectable()
export class ExtractorProxyService {
  private readonly logger = new Logger(ExtractorProxyService.name);
  private readonly baseUrl =
    process.env.EXTRATOR_URL || 'http://localhost:8000';

  /** O extrator Python está no ar? (badge da UI + decisão de rota) */
  async health(): Promise<boolean> {
    try {
      const r = await fetch(`${this.baseUrl}/docs`, { method: 'GET' });
      return r.ok;
    } catch {
      return false;
    }
  }

  /**
   * Envia o PDF ao Python e normaliza a resposta.
   * @throws Error se o Python estiver fora ou retornar HTTP != 2xx
   *         (o controller usa isso para acionar o fallback nativo)
   */
  async parse(
    buffer: Buffer,
    filename: string,
    forcarBanco?: string,
  ): Promise<UnifiedExtractData> {
    // FormData + Blob NATIVOS do Node 18+ (undici) — multipart sem libs
    const fd = new FormData();
    fd.append(
      'file',
      new Blob([new Uint8Array(buffer)], { type: 'application/pdf' }),
      filename,
    );
    if (forcarBanco && forcarBanco !== 'auto') {
      fd.append('forcar_banco', forcarBanco);
    }

    const res = await fetch(`${this.baseUrl}/api/parse-extrato`, {
      method: 'POST',
      body: fd,
    });

    if (!res.ok) {
      const detail = await res.text().catch(() => '');
      throw new Error(`Extrator Python HTTP ${res.status} ${detail}`.trim());
    }

    const py = await res.json();
    return this.normalizePython(py);
  }

  // ---------------------------------------------------------------
  // Normalização Python → formato da página do Radar
  // ---------------------------------------------------------------
  private normalizePython(py: any): UnifiedExtractData {
    const rows: UnifiedRow[] = (py.lancamentos || []).map((l: any) => {
      const valor = Number(l.valor || 0);
      const isSaida = String(l.sinal) === '-'; // '-' = débito (sai dinheiro)
      return {
        date: this.composeDate(l.dia, py.competencia),
        description: l.descricao_completa || l.descricao || l.tipo || '',
        debit: isSaida ? this.round2(valor) : 0,
        credit: isSaida ? 0 : this.round2(valor),
      };
    });

    return {
      bankLabel: py.banco || 'DESCONHECIDO',
      totalRows: rows.length,
      totalDebit: this.round2(rows.reduce((s, r) => s + r.debit, 0)),
      totalCredit: this.round2(rows.reduce((s, r) => s + r.credit, 0)),
      rows,
      agencia: py.agencia,
      conta: py.conta,
      competencia: py.competencia,
      nomeCliente: py.nome_cliente,
    };
  }

  /** dia (int) + competência ("01/2026" | "FEV/2026") → dd/mm/aaaa */
  private composeDate(dia: number, competencia?: string): string {
    const dd = String(dia || 1).padStart(2, '0');
    const comp = (competencia || '').trim().toUpperCase();

    const num = comp.match(/^(\d{2})[\/\-](\d{4})$/);
    if (num) return `${dd}/${num[1]}/${num[2]}`;

    const txt = comp.match(/^([A-Z]{3})[\/\-](\d{4})$/);
    if (txt && MESES_PT[txt[1]]) return `${dd}/${MESES_PT[txt[1]]}/${txt[2]}`;

    return ''; // sem competência → célula de data vazia (honesto)
  }

  private round2(v: number): number {
    return Math.round(v * 100) / 100;
  }
}
// =================================================================
// FIM: backend/src/accounting/domain/pdf/extractor-proxy.service.ts
// =================================================================