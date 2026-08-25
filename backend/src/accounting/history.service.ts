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

  // 🎛️ LAYOUT DE EXPORTAÇÃO SCI-Único
  private readonly SCI_LAYOUT = {
    delimiter: ';',
    lineEnding: '\r\n',
    formatDate: (d: Date) =>
      `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`,
    // 🆕 ADR-073: decimal com PONTO (1500.00) — vírgula viraria coluna no re-import
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
  // 📥 IMPORTAR BASE HISTÓRICA (Lançamentos SCI, separador ';')
  // =================================================================
  async importHistoryBase(
    companyId: string,
    clientId: string | null,
    year: number,
    content: string,
  ) {
    const lines = content.split(/\r?\n/).filter((l) => l.trim().length > 0);
    if (lines.length < 2) throw new BadRequestException('Arquivo sem linhas.');

    const header = lines[0].split(';').map((h) => this.normalize(h));
    const idx = (k: string) => header.findIndex((h) => h.includes(k));
    const iDate = idx('data');
    const iDeb = idx('debito');
    const iCred = idx('credito');
    const iVal = idx('valor');
    const iHist = idx('historico');
    const iComp = idx('complemento');
    const iDoc = idx('doc');
    const iType = idx('tipo');

    const rows = [];
    for (let i = 1; i < lines.length; i++) {
      const c = lines[i].split(';').map((s) => (s || '').trim());
      const date = this.parseDate(c[iDate] || '');
      const amount = this.parseAmount(c[iVal] || '');
      const description = (c[iComp] || c[iHist] || '').trim();
      if (!date || amount === null || !description) continue;

      rows.push({
        companyId,
        clientId,
        year,
        date,
        debitCode: c[iDeb] || null,
        creditCode: c[iCred] || null,
        amount,
        historyCode: c[iHist] || null,
        description,
        docNumber: c[iDoc] || null,
        entryType: c[iType] || null,
      });
    }

    await this.prisma.historicalEntry.deleteMany({
      where: { companyId, clientId, year },
    });
    await this.prisma.historicalEntry.createMany({ data: rows });

    return { imported: rows.length, year };
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
        L.formatDate(new Date(e.entryDate)),
        this.sciAccountNumber(e.debitAccount),   // 🆕 ADR-073: nº unificado (489/819)
        this.sciAccountNumber(e.creditAccount),
        L.formatValue(amount),                   // 🆕 1500.00 (ponto)
        e.description.replace(/;/g, '/'),
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