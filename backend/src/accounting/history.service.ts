import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ImportService } from './import.service';

/**
 * =================================================================
 * 🧠 HistoryService — Base Histórica + Sugestão + Exportação SCI
 * =================================================================
 * ⚠️ SERVICE: NÃO usa decorators HTTP (@CurrentUser, @Body, @Query).
 * Esses ficam no history.controller.ts
 * =================================================================
 */
@Injectable()
export class HistoryService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly importService: ImportService,
  ) {}

  // 🎛️ LAYOUT DE EXPORTAÇÃO SCI-Único (v3 — ADR-075)
  // Linha oficial (TAB): 000001	20250103	00001125	00000007	928.99		<histórico>
  // controle fixo | data AAAAMMDD | conta D 8 díg. | conta C 8 díg. |
  // valor c/ ponto | campo vazio | histórico
  private readonly SCI_LAYOUT = {
    delimiter: '\t',
    lineEnding: '\r\n',
    control: '000001',
    formatDate: (d: Date) =>
      `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`,
    formatAccount: (n: string) => ((n || '0').replace(/\D/g, '') || '0').padStart(8, '0'),
    formatValue: (v: number) => v.toFixed(2),
  };

  // =================================================================
  // 🌐 CLONAR PLANO PADRÃO → CONTAS DO TENANT
  // =================================================================
  async cloneTemplateToTenant(companyId: string) {
    const templates = await this.prisma.accountTemplate.findMany({
      orderBy: { code: 'asc' },
    });
    if (templates.length === 0) {
      throw new BadRequestException(
        'Template não importado. Rode: npx ts-node src/seed-account-template.ts',
      );
    }

    await this.prisma.accountingAccount.deleteMany({ where: { companyId } });

    let cloned = 0;
    for (const t of templates) {
      await this.prisma.accountingAccount.create({
        data: {
          companyId,
          code: String(t.reducedCode),
          name: t.name,
          type: t.accountType,
          nature:
            t.accountType === 'ATIVO' || t.accountType === 'DESPESA'
              ? 'DEVEDORA'
              : 'CREDORA',
          reducedCode: t.reducedCode,
          isActive: !t.isSynthetic,
        } as any,
      });
      cloned++;
    }
    return { cloned };
  }
  // =================================================================
  // 📥 IMPORTAR BASE HISTÓRICA (v3 — ADR-073)
  // Aceita 3 layouts:
  //  1) TXT SCI sem cabeçalho (data;debito;credito;valor;historico)
  //  2) CSV com cabeçalho nomeado (data;...;valor;...)
  //  3) Razão/Livro Caixa por conta (Conta;Data;Histórico;;Débito;Crédito;Saldo)
  //     → vira partida dobrada: banco = bloco; contraparte = memória interna.
  // =================================================================
  async importHistoryBase(
    companyId: string,
    clientId: string | null,
    year: number,
    content: string,
  ) {
    const lines = content.split(/\r?\n/).filter((l) => l.trim().length > 0);
    if (lines.length === 0) throw new BadRequestException('Arquivo sem linhas.');

    const first = lines[0].split(';').map((s) => (s || '').trim());
    const looksLikeData = /^\d{2}\/\d{2}\/\d{4}$/.test(first[0] || '');
    const headerNorm = first.map((h) => this.normalize(h));
    const isRazao =
      !looksLikeData &&
      headerNorm.some((h) => h.startsWith('CONTA')) &&
      headerNorm.some((h) => h.includes('SALDO'));

    let rows: any[];

    if (isRazao) {
      rows = this.parseRazaoLayout(lines, companyId, clientId, year);
    } else {
      let iDate = 0, iDeb = 1, iCred = 2, iVal = 3, iHist = 4;
      let iComp = -1, iDoc = -1, iType = -1;
      let start = 0;

      if (!looksLikeData) {
        const idx = (k: string) => headerNorm.findIndex((h) => h.includes(k));
        iDate = idx('data'); iDeb = idx('debito'); iCred = idx('credito');
        iVal = idx('valor'); iHist = idx('historico');
        iComp = idx('complemento'); iDoc = idx('doc'); iType = idx('tipo');
        if (iDate < 0 || iVal < 0) {
          throw new BadRequestException(
            'Formato não reconhecido. Aceitos: TXT SCI (data;debito;credito;valor;historico) ' +
            'ou Razão/Livro Caixa (Conta;Data;Histórico;;Débito;Crédito;Saldo).',
          );
        }
        start = 1;
      }

      rows = [];
      for (let i = start; i < lines.length; i++) {
        const c = lines[i].split(';').map((s) => (s || '').trim());
        const date = this.parseDate(c[iDate] || '');
        const amount = this.parseAmount(c[iVal] || '');
        const description = ((iComp >= 0 ? c[iComp] : '') || c[iHist] || '').trim();
        if (!date || amount === null || !description) continue;
        rows.push({
          companyId, clientId, year, date,
          debitCode: c[iDeb] || null,
          creditCode: c[iCred] || null,
          amount,
          historyCode: (iHist >= 0 ? c[iHist] : null) || null,
          description,
          docNumber: (iDoc >= 0 ? c[iDoc] : null) || null,
          entryType: (iType >= 0 ? c[iType] : null) || null,
        });
      }
    }

    if (rows.length === 0) {
      throw new BadRequestException('Nenhuma linha válida encontrada no arquivo.');
    }

    await this.prisma.historicalEntry.deleteMany({ where: { companyId, clientId, year } });
    await this.prisma.historicalEntry.createMany({ data: rows });

    return { imported: rows.length, year };
  }

  // =================================================================
  // 📒 PARSER DO RAZÃO/LIVRO CAIXA → PARTIDAS DOBRADAS (ADR-073)
  // Passagem 1: memória contraparte→conta pelos blocos NÃO bancários.
  // Passagem 2: linhas dos blocos bancários (01.1.1.x) viram lançamentos:
  //   entrada (Débito no banco) → D banco / C contraparte
  //   saída   (Crédito no banco) → D contraparte / C banco
  // Linhas "Saldo anterior" e "Total mês" são ignoradas.
  // =================================================================
  private parseRazaoLayout(
    lines: string[],
    companyId: string,
    clientId: string | null,
    year: number,
  ) {
    const isBank = (code: string) => code.startsWith('01.1.1.');
    const blockOf = (cell: string) => {
      const m = (cell || '').match(/^\s*(\d+)\s*-\s*([\d.]+)/);
      return m ? { code: m[2] } : null;
    };

    // ── Passagem 1: memória contraparte → conta (blocos não bancários) ──
    const memo = new Map<string, string>();
    for (let i = 1; i < lines.length; i++) {
      const c = lines[i].split(';').map((s) => (s || '').trim());
      const block = blockOf(c[0]);
      if (!block || isBank(block.code)) continue;
      if (!this.parseDate(c[1] || '')) continue;
      const who = this.normalize(c[2] || '');
      if (!who) continue;
      if (!memo.has(who)) memo.set(who, block.code);
    }

    // ── Passagem 2: blocos bancários → partidas dobradas ──
    const rows: any[] = [];
    for (let i = 1; i < lines.length; i++) {
      const c = lines[i].split(';').map((s) => (s || '').trim());
      const block = blockOf(c[0]);
      if (!block || !isBank(block.code)) continue; // pula totais e blocos não-banco
      const date = this.parseDate(c[1] || '');
      if (!date) continue; // pula "Saldo anterior"
      const who = (c[2] || '').trim();
      if (!who) continue;
      const deb = this.parseAmount(c[4] || '') || 0;
      const cred = this.parseAmount(c[5] || '') || 0;
      const amount = deb > 0 ? deb : cred;
      if (amount <= 0) continue;

      const other = memo.get(this.normalize(who)) || null;
      rows.push({
        companyId, clientId, year, date,
        debitCode: deb > 0 ? block.code : other,   // entrada: D banco
        creditCode: deb > 0 ? other : block.code,  // saída: C banco
        amount,
        historyCode: block.code,
        description: who,
        docNumber: null,
        entryType: null,
      });
    }
    return rows;
  }
  // =================================================================
  // 📊 RESUMO DO PIPELINE (alimenta a Tela 1)
  // =================================================================
  async getSummary(companyId: string, clientId: string) {
    const [baseCount, pendingCount, reconciledCount] = await Promise.all([
      this.prisma.historicalEntry.count({ where: { companyId, clientId } }),
      this.prisma.accountingEntry.count({
        where: { companyId, clientId, status: 'PENDENTE' },
      }),
      this.prisma.accountingEntry.count({
        where: {
          companyId,
          clientId,
          status: { in: ['CONCILIADO', 'APROVADO', 'REVISADO'] },
        },
      }),
    ]);
    return { baseCount, pendingCount, reconciledCount };
  }

  // =================================================================
  // 🏦 IMPORTAR EXTRATO DO MÊS (via texto, gera PENDENTES)
  // =================================================================
  async importBankStatement(
    companyId: string,
    userId: string,
    clientId: string,
    content: string,
  ) {
    const entries = this.parseBankStatementText(content);
    if (entries.length === 0) {
      throw new BadRequestException('Nenhuma linha válida encontrada no extrato.');
    }
    const saved = await this.importService.saveImportedEntries(
      entries,
      companyId,
      userId,
      clientId,
    );
    return { imported: saved.length };
  }

  // =================================================================
  // 🤖 CONCILIAR PENDENTES USANDO A BASE SALVA
  // =================================================================
  async reconcilePendingFromHistory(companyId: string, clientId: string) {
    const pending = await this.prisma.accountingEntry.findMany({
      where: { companyId, clientId, status: 'PENDENTE' },
    });
    if (pending.length === 0) return { total: 0, matched: 0, notMatched: 0 };

    const history = await this.prisma.historicalEntry.findMany({
      where: { companyId, clientId },
    });
    if (history.length === 0) {
      throw new BadRequestException('Base histórica não importada para este cliente.');
    }

    const freq = new Map<string, number>();
    history.forEach((h) => {
      const k = this.normalize(h.description);
      freq.set(k, (freq.get(k) || 0) + 1);
    });

    let matched = 0;
    for (const entry of pending) {
      const amount =
        Number(entry.debitValue) > 0
          ? Number(entry.debitValue)
          : Number(entry.creditValue);
      const best = this.bestMatch(entry.description, amount, history, freq);
      if (!best || best.score < 0.5) continue;

      const [debitAccount, creditAccount] = await Promise.all([
        this.resolveAccount(companyId, best.h.debitCode),
        this.resolveAccount(companyId, best.h.creditCode),
      ]);
      if (!debitAccount || !creditAccount) continue;

      await this.prisma.accountingEntry.update({
        where: { id: entry.id },
        data: {
          debitAccountId: debitAccount.id,
          creditAccountId: creditAccount.id,
          status: 'CONCILIADO',
        },
      });
      matched++;
    }

    return { total: pending.length, matched, notMatched: pending.length - matched };
  }

  // =================================================================
  // 📤 EXPORTAR TXT P/ SCI-Único (lançamentos CONCILIADOS)
  // =================================================================
  async exportSciUnico(companyId: string, clientId: string) {
    const entries = await this.prisma.accountingEntry.findMany({
      where: {
        companyId,
        clientId,
        status: { in: ['CONCILIADO', 'APROVADO', 'REVISADO'] },
      },
      include: { debitAccount: true, creditAccount: true },
      orderBy: { entryDate: 'asc' },
    });

    const valid = entries.filter((e) => e.debitAccount && e.creditAccount);
    if (valid.length === 0) {
      throw new BadRequestException('Nenhum lançamento conciliado para exportar.');
    }

    const L = this.SCI_LAYOUT;
    const lines = valid.map((e) => {
      const amount =
        Number(e.debitValue) > 0 ? Number(e.debitValue) : Number(e.creditValue);
      return [
        L.control,                                               // 000001
        L.formatDate(new Date(e.entryDate)),                     // 20260720
        L.formatAccount(this.sciAccountNumber(e.debitAccount)),  // 00000503
        L.formatAccount(this.sciAccountNumber(e.creditAccount)), // 00000819
        L.formatValue(amount),                                   // 1500.00
        '',                                                      // campo vazio
        e.description.replace(/\t/g, ' ').substring(0, 100),     // histórico
      ].join(L.delimiter);
    });

    return {
      fileName: `sci-lancamentos-${new Date().toISOString().split('T')[0]}.txt`,
      content: lines.join(L.lineEnding) + L.lineEnding,
      totalLines: valid.length,
    };
  }

  // =================================================================
  // 🏦 PARSER DE EXTRATO VIA TEXTO (auto-contido)
  // =================================================================
  private parseBankStatementText(content: string) {
    const lines = content.split(/\r?\n/).filter((l) => l.trim().length > 0);
    if (lines.length < 2) return [];

    const delim = this.detectDelimiter(lines[0]);
    const header = lines[0]
      .split(delim)
      .map((h) =>
        h
          .toUpperCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .trim(),
      );
    const idx = (keys: string[]) =>
      header.findIndex((h) => keys.some((k) => h.includes(k)));
    const iDate = idx(['DATA']);
    const iDeb = idx(['DEBITO']);
    const iCred = idx(['CREDITO']);
    const iComp = idx(['COMPLEMENTO', 'HISTORICO', 'DESCRICAO']);
    const iCnpj = idx(['CNPJ', 'CPF']);

    const results: any[] = [];
    for (let i = 1; i < lines.length; i++) {
      const c = lines[i].split(delim).map((s) => (s || '').trim());
      const date = this.parseDate(c[iDate] || '');
      if (!date) continue;

      const valDebito = this.parseAmount(c[iDeb] || '') || 0;
      const valCredito = this.parseAmount(c[iCred] || '') || 0;
      if (valDebito <= 0 && valCredito <= 0) continue;

      results.push({
        date: date.toISOString(),
        description: (c[iComp] || '').trim(),
        counterpartyCpfCnpj: (c[iCnpj] || '').trim() || null,
        amount: valDebito > 0 ? valDebito : valCredito,
        type: valDebito > 0 ? 'SAIDA' : 'ENTRADA',
        status: 'PENDENTE',
      });
    }
    return results;
  }

  private detectDelimiter(line: string): string {
    return [';', '\t', '|', ','].reduce(
      (best, d) => (line.split(d).length > line.split(best).length ? d : best),
      ',',
    );
  }

  // =================================================================
  // 🧮 MOTOR DE SEMELHANÇA (nome + valor + recorrência)
  // =================================================================
  private bestMatch(
    description: string,
    amount: number,
    history: any[],
    freq: Map<string, number>,
  ) {
    let best: { h: any; score: number } | null = null;
    for (const h of history) {
      const text = this.jaccard(description, h.description);
      let amt = 0;
      const diff = Math.abs(Number(h.amount) - amount);
      if (diff < 0.005) amt = 1;
      else if (diff / Math.max(Number(h.amount), amount) < 0.05) amt = 0.6;
      const rec = (freq.get(this.normalize(h.description)) || 0) >= 3 ? 1 : 0;
      const score = Math.min(1, 0.7 * text + 0.2 * amt + 0.1 * rec);
      if (!best || score > best.score) best = { h, score };
    }
    return best;
  }
  /**
   * 🆕 ADR-073: número unificado da conta p/ o arquivo SCI.
   * Prioridade: seq (90132) → accountNumber → reducedCode (legado) → code.
   */
  private sciAccountNumber(acc: any): string {
    return (
      acc?.seq ||
      acc?.accountNumber ||
      (acc?.reducedCode != null ? String(acc.reducedCode) : '') ||
      acc?.code ||
      ''
    );
  }
  private async resolveAccount(companyId: string, code: string | null) {
    if (!code) return null;
    const c = String(code).trim();
    const isInt = /^\d+$/.test(c);
    // 🆕 ADR-073: casa por classificação OU nº unificado (arquivos novos saem reduzidos)
    return this.prisma.accountingAccount.findFirst({
      where: {
        companyId,
        OR: [
          { code: c },
          { seq: c },
          { accountNumber: c },
          ...(isInt ? [{ reducedCode: Number(c) }] : []),
        ],
      },
    });
  }

  private jaccard(a: string, b: string): number {
    const ta = this.tokens(a);
    const tb = this.tokens(b);
    if (ta.size === 0 || tb.size === 0) return 0;
    let inter = 0;
    ta.forEach((t) => {
      if (tb.has(t)) inter++;
    });
    return inter / (ta.size + tb.size - inter);
  }

  private tokens(s: string): Set<string> {
    return new Set(
      this.normalize(s)
        .split(' ')
        .filter((t) => t.length > 2 && !/^\d+$/.test(t)),
    );
  }

  private normalize(s: string): string {
    return (s || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toUpperCase()
      .replace(/[^A-Z0-9\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private parseDate(raw: string): Date | null {
    const m = (raw || '').match(/(\d{2})\/(\d{2})\/(\d{4})/);
    return m ? new Date(+m[3], +m[2] - 1, +m[1]) : null;
  }

  private parseAmount(raw: string): number | null {
    let s = (raw || '').trim();
    if (!s || !/^[\d.,]+$/.test(s)) return null;
    if (s.includes(',')) s = s.replace(/\./g, '').replace(',', '.');
    const v = parseFloat(s);
    return isNaN(v) ? null : v;
  }
}