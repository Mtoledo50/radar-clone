import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ImportService } from './import.service';

/**
 * =================================================================
 * 🧠 HistoryService — Base Histórica + Conciliação + Exportação SCI
 * =================================================================
 * Responsável por:
 *  1) Clonar o plano de contas padrão p/ o tenant;
 *  2) Importar a BASE HISTÓRICA (3 layouts de lançamentos + razão 4 colunas);
 *  3) Importar o EXTRATO DO MÊS (gera lançamentos PENDENTES);
 *  4) Conciliar PENDENTES contra a base histórica (motor de similaridade);
 *  5) Exportar lançamentos conciliados p/ SCI-Único (TXT TAB).
 *
 * ADRs vigentes:
 *  - ADR-073: razão/lançamentos c/ nº unificado; extrato c/ colunas "Valor" duplicadas.
 *  - ADR-075: layout oficial de exportação SCI-Único v3 (TAB, UTF-8).
 *  - ADR-101: base histórica aceita cabeçalho colado e blocos repetidos (dedupe).
 *  - ADR-102: import de EXTRATO NÃO exclui/bloqueia duplicados do mesmo mês
 *    (limpeza passa a ser manual — ver método deprecated abaixo).
 *  - ADR-103: suporte ao Razão/Livro Caixa de 4 colunas (blocos c/ cabeçalho).
 *
 * ⚠️ SERVICE: NÃO usa decorators HTTP (@CurrentUser, @Body, @Query).
 * Esses ficam no history.controller.ts.
 * =================================================================
 */
@Injectable()
export class HistoryService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly importService: ImportService,
  ) {}

  // 🎛️ LAYOUT DE EXPORTAÇÃO SCI-Único (v3 — ADR-075)
  // Linha oficial (TAB): 000001  20250103  00001125  00000007  928.99    <histórico>
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
  /**
   * Copia o template de plano de contas p/ o tenant.
   * 🛡️ Roda em transação: se falhar no meio, o tenant não fica sem plano.
   */
  async cloneTemplateToTenant(companyId: string) {
    const templates = await this.prisma.accountTemplate.findMany({
      orderBy: { code: 'asc' },
    });
    if (templates.length === 0) {
      throw new BadRequestException(
        'Template não importado. Rode: npx ts-node src/seed-account-template.ts',
      );
    }

    // Transação: delete + create atômicos (evita estado órfão em falha)
    return this.prisma.$transaction(async (tx) => {
      await tx.accountingAccount.deleteMany({ where: { companyId } });

      let cloned = 0;
      for (const t of templates) {
        await tx.accountingAccount.create({
          data: {
            companyId,
            code: String(t.reducedCode),
            name: t.name,
            type: t.accountType,
            // Natureza contábil derivada do tipo da conta
            nature:
              t.accountType === 'ATIVO' || t.accountType === 'DESPESA'
                ? 'DEVEDORA'
                : 'CREDORA',
            reducedCode: t.reducedCode,
            isActive: !t.isSynthetic, // sintéticas não recebem lançamentos
          } as any,
        });
        cloned++;
      }
      return { cloned };
    });
  }

  // =================================================================
  // 📥 IMPORTAR BASE HISTÓRICA (ADR-101 + ADR-103 — 4 layouts)
  //   A) SCI lançamentos c/ cabeçalho: Data;Débito;Crédito;Valor;Histórico;Complemento
  //   B) TXT SCI sem cabeçalho:        data;contaDebito;contaCredito;valor;historico
  //   C) Razão 7 colunas:              Conta;Data;Histórico;;Débito;Crédito;Saldo
  //   D) Razão 4 colunas (ADR-103):    Histórico;Débito;Crédito;Saldo (blocos c/ cabeçalho)
  // =================================================================
  async importHistoryBase(
    companyId: string,
    clientId: string | null,
    year: number,
    content: string,
  ) {
    const lines = content.split(/\r?\n/).filter((l) => l.trim().length > 0);
    if (lines.length === 0) throw new BadRequestException('Arquivo sem linhas.');

    // 🛡️ ADR-101: o export pode colar o cabeçalho na 1ª linha de dados
    // (sem quebra após "Complemento") → separa em duas linhas.
    const glued = lines[0].match(/^(.*Complemento)\s*(\d{2}\/\d{2}\/\d{4}.*)$/i);
    if (glued) {
      lines[0] = glued[1];
      lines.splice(1, 0, glued[2]);
    }

    const first = lines[0].split(';').map((s) => (s || '').trim());
    const looksLikeData = /^\d{2}\/\d{2}\/\d{4}$/.test(first[0] || '');
    const headerNorm = first.map((h) => this.normalize(h));

    // Detecção de layout de razão:
    const isRazao7 =
      !looksLikeData &&
      headerNorm.some((h) => h.startsWith('CONTA')) &&
      headerNorm.some((h) => h.includes('SALDO'));
    const isRazao4 =
      !looksLikeData &&
      !isRazao7 &&
      (headerNorm[0] || '').startsWith('HISTORICO') &&
      headerNorm.some((h) => h.includes('SALDO'));

    let rows: any[];

    if (isRazao7) {
      rows = this.parseRazaoLayout(lines, companyId, clientId, year);
    } else if (isRazao4) {
      rows = this.parseRazao4ColLayout(lines, companyId, clientId, year);
    } else {
      // ── Layouts A/B: lançamentos SCI (com ou sem cabeçalho) ──
      let iDate = 0, iDeb = 1, iCred = 2, iVal = 3, iHist = 4;
      let iComp = -1, iDoc = -1;
      let start = 0;

      if (!looksLikeData) {
        // 🛡️ ADR-101: headerNorm vem UPPERCASE → busca case-insensitive
        const idx = (k: string) =>
          headerNorm.findIndex((h) => h.toLowerCase().includes(k.toLowerCase()));
        iDate = idx('data'); iDeb = idx('debito'); iCred = idx('credito');
        iVal = idx('valor'); iHist = idx('historico');
        iComp = idx('complemento'); iDoc = idx('doc');
        if (iDate < 0 || iVal < 0) {
          throw new BadRequestException(
            'Formato não reconhecido. Aceitos: SCI lançamentos (Data;Débito;Crédito;Valor;Histórico;Complemento), ' +
            'TXT SCI sem cabeçalho, Razão 7 colunas ou Razão 4 colunas (Histórico;Débito;Crédito;Saldo).',
          );
        }
        start = 1;
      }

      rows = [];
      const seen = new Set<string>(); // 🛡️ ADR-101: arquivo pode repetir blocos

      for (let i = start; i < lines.length; i++) {
        const c = lines[i].split(';').map((s) => (s || '').trim());
        const date = this.parseDate(c[iDate] || '');
        const amount = this.parseAmount(c[iVal] || '');
        if (!date || amount === null || amount === 0) continue;

        const debitCode = (c[iDeb] || '').trim() || null;   // pode vir vazio
        const creditCode = (c[iCred] || '').trim() || null; // pode vir vazio
        const hist = iHist >= 0 ? (c[iHist] || '').trim() : '';
        const comp = iComp >= 0 ? (c[iComp] || '').trim() : '';

        // Prioridade de descrição: texto legível primeiro (ADR-101)
        let description = '';
        if (comp && !this.isNumeric(comp)) description = comp;
        else if (hist && !this.isNumeric(hist)) description = hist;
        else
          description =
            `Lanç. ${debitCode ?? '–'} → ${creditCode ?? '–'}` +
            ([hist, comp].filter(Boolean).length
              ? ` (${[hist, comp].filter(Boolean).join(' ')})`
              : '');

        // 🛡️ Dedupe de blocos repetidos no arquivo
        const key = `${date.toISOString().slice(0, 10)}|${debitCode ?? ''}|${creditCode ?? ''}|${amount}|${hist}|${comp}`;
        if (seen.has(key)) continue;
        seen.add(key);

        rows.push({
          companyId, clientId, year, date,
          debitCode, creditCode, amount,
          historyCode: hist || null,
          description,
          docNumber: iDoc >= 0 ? (c[iDoc] || '').trim() || null : null,
          entryType: null,
        });
      }
    }

    // 🛡️ Dedupe final (razão 7/4 colunas também podem repetir blocos)
    rows = this.dedupeRows(rows);

    if (rows.length === 0) {
      throw new BadRequestException('Nenhuma linha válida encontrada no arquivo.');
    }

    // Reimportação substitui a base do ano (idempotente por tenant+cliente+ano)
    await this.prisma.historicalEntry.deleteMany({ where: { companyId, clientId, year } });
    await this.prisma.historicalEntry.createMany({ data: rows });

    return { imported: rows.length, year };
  }

  /** 🛡️ Remove linhas 100% repetidas (mesma data+contas+valor+descrição). */
  private dedupeRows(rows: any[]): any[] {
    const seen = new Set<string>();
    return rows.filter((r) => {
      const k = `${new Date(r.date).toISOString().slice(0, 10)}|${r.debitCode ?? ''}|${r.creditCode ?? ''}|${r.amount}|${this.normalize(r.description)}`;
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });
  }

  /** 🆕 ADR-101 — detecta complemento/histórico puramente numérico (ex.: "2025", "264") */
  private isNumeric(s: string): boolean {
    return /^[\d.,()-]+$/.test((s || '').trim());
  }

  // =================================================================
  // 📒 PARSER RAZÃO 7 COLUNAS → PARTIDAS DOBRADAS (ADR-073)
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
  // 📒 PARSER RAZÃO 4 COLUNAS (ADR-103) → PARTIDAS DOBRADAS
  // Formato real dos arquivos SCI: blocos iniciam com "NNN - CÓDIGO - Nome"
  // + "Saldo anterior:", datas vêm em linhas soltas e transações em seguida:
  //   Histórico;Débito;Crédito;Saldo
  // Mesma lógica de memória contraparte do parser de 7 colunas.
  // =================================================================
  private parseRazao4ColLayout(
    lines: string[],
    companyId: string,
    clientId: string | null,
    year: number,
  ) {
    const isBank = (code: string) => code.startsWith('01.1.1.');
    const blockRe = /^\s*(\d+)\s*-\s*([\d.]+)/;

    let curBlock: string | null = null; // código da conta do bloco ativo
    let curDate: Date | null = null;    // data ativa (linhas soltas dd/mm/aaaa)
    const memo = new Map<string, string>();
    const txs: { block: string; date: Date; who: string; deb: number; cred: number }[] = [];

    for (let i = 1; i < lines.length; i++) {
      const c = lines[i].split(';').map((s) => (s || '').trim());

      // Cabeçalho de bloco: "33 - 01.1.2.08.001 - Adiantamentos...;Saldo anterior:;;0,00"
      const block = blockRe.exec(c[0] || '');
      if (block && (c[1] || '').toLowerCase().includes('saldo anterior')) {
        curBlock = block[2];
        curDate = null;
        continue;
      }
      // Linha de data solta: "15/01/2026;;;"
      if (/^\d{2}\/\d{2}\/\d{4}$/.test(c[0] || '')) {
        curDate = this.parseDate(c[0]);
        continue;
      }
      if (!curBlock || !curDate || !c[0]) continue;

      const deb = this.parseAmount(c[1] || '') || 0;
      const cred = this.parseAmount(c[2] || '') || 0;
      if (deb <= 0 && cred <= 0) continue; // ignora "Total mês..." e vazias

      txs.push({ block: curBlock, date: curDate, who: c[0], deb, cred });

      // Memória: contraparte → conta (apenas blocos NÃO bancários)
      if (!isBank(curBlock)) {
        const who = this.normalize(c[0]);
        if (who && !memo.has(who)) memo.set(who, curBlock);
      }
    }

    // Partidas dobradas a partir dos blocos bancários
    return txs
      .filter((t) => isBank(t.block))
      .map((t) => {
        const other = memo.get(this.normalize(t.who)) || null;
        const amount = t.deb > 0 ? t.deb : t.cred;
        return {
          companyId, clientId, year, date: t.date,
          debitCode: t.deb > 0 ? t.block : other,
          creditCode: t.deb > 0 ? other : t.block,
          amount,
          historyCode: t.block,
          description: t.who,
          docNumber: null,
          entryType: null,
        };
      });
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
  // 🏦 IMPORTAR EXTRATO DO MÊS — ADR-102 (sem exclusão de duplicados)
  // =================================================================
  /**
   * Importa o extrato gerando lançamentos PENDENTES.
   *
   * 🛡️ ADR-102 (revoga parte do ADR-076): NÃO exclui lançamentos existentes
   * e NÃO bloqueia linhas "duplicadas" — taxas/PIX idênticos no mesmo mês são
   * legítimos. A limpeza de duplicados reais passa a ser MANUAL
   * (ver removeDuplicatePendentes, @deprecated p/ uso automático).
   * O contador controla reimportações pela tela (limpar/excluir importação).
   */
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

    // Salva TUDO que o parser reconheceu (sem bloqueio de duplicados)
    const saved = await this.importService.saveImportedEntries(
      entries, companyId, userId, clientId,
    );

    return {
      imported: saved.length,
      duplicadosIgnorados: 0, // mantido p/ compatibilidade c/ toasts do frontend
      duplicadosRemovidos: 0,
    };
  }

  // =================================================================
  // 🧹 LIMPEZA DE DUPLICADOS (só PENDENTES)
  // =================================================================
  /**
   * @deprecated NÃO chamar automaticamente no import (ADR-102).
   * Uso apenas MANUAL (botão de limpeza da tela), pois remove lançamentos
   * legítimos idênticos (ex.: 5 taxas de R$ 9,00 no mesmo dia).
   * Remove duplicados exatos (data + valor + descrição) entre PENDENTES,
   * mantendo o mais antigo. Nunca toca CONCILIADO/APROVADO/REVISADO.
   */
  async removeDuplicatePendentes(companyId: string, clientId: string) {
    const entries = await this.prisma.accountingEntry.findMany({
      where: { companyId, clientId, status: 'PENDENTE' },
      orderBy: { createdAt: 'asc' },
      select: {
        id: true, entryDate: true,
        debitValue: true, creditValue: true, description: true,
      },
    });

    const seen = new Set<string>();
    const toDelete: string[] = [];
    for (const e of entries) {
      const k =
        `${new Date(e.entryDate).toISOString().slice(0, 10)}|` +
        `${Math.max(Number(e.debitValue), Number(e.creditValue)).toFixed(2)}|` +
        `${this.normalize(e.description)}`;
      if (seen.has(k)) toDelete.push(e.id);
      else seen.add(k);
    }

    if (toDelete.length > 0) {
      await this.prisma.accountingEntry.deleteMany({ where: { id: { in: toDelete } } });
    }
    return { removed: toDelete.length };
  }

  // =================================================================
  // 🤖 CONCILIAR PENDENTES USANDO A BASE SALVA
  // =================================================================
  /**
   * Casa cada lançamento PENDENTE c/ a base histórica por similaridade
   * (Jaccard 70% + valor 20% + recorrência 10%) e aplica as contas.
   * ⚠️ N+1 de queries por match (2 findFirst) — aceitável p/ volumes
   * atuais (~centenas); otimizar c/ cache de contas se virar gargalo.
   */
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

    // Frequência de descrições → bônus de recorrência no score
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
      if (!best || best.score < 0.5) continue; // corte de confiança

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
        e.description.replace(/\t/g, ' ').substring(0, 100),     // histórico (máx. 100)
      ].join(L.delimiter);
    });

    return {
      fileName: `sci-lancamentos-${new Date().toISOString().split('T')[0]}.txt`,
      content: lines.join(L.lineEnding) + L.lineEnding,
      totalLines: valid.length,
    };
  }

  // =================================================================
  // 🏦 PARSER DE EXTRATO VIA TEXTO — ADR-073 (colunas "Valor" duplicadas)
  // =================================================================
  /**
   * Trata 3 formatos reais de extrato bancário:
   *  A) Padrão Radar:  Data;Débito;Crédito;Complemento;CNPJ
   *  B) Banco (CSV real): Descrição;Categoria;Data;Valor(crédito);Valor(débito negativo)
   *  C) Coluna única:   sinal negativo = débito, positivo = crédito
   * A linha de totais do banco é ignorada automaticamente (não tem data).
   */
  private parseBankStatementText(content: string) {
    const lines = content.split(/\r?\n/).filter((l) => l.trim().length > 0);
    if (lines.length < 2) return [];

    const delim = this.detectDelimiter(lines[0]);
    const header = lines[0]
      .split(delim)
      .map((h) =>
        h.toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim(),
      );

    const idx = (keys: string[]) =>
      header.findIndex((h) => keys.some((k) => h.includes(k)));

    const iDate = idx(['DATA']);
    if (iDate === -1) return []; // formato não reconhecido

    const iDesc = idx(['DESCRICAO', 'HISTORICO', 'COMPLEMENTO']);
    const iCnpj = idx(['CNPJ', 'CPF']);
    const iDeb = idx(['DEBITO']);
    const iCred = idx(['CREDITO']);

    // 🛡️ Captura TODAS as colunas chamadas "VALOR" (bancos duplicam o nome)
    const iValues = header
      .map((h, i) => (h.includes('VALOR') ? i : -1))
      .filter((i) => i !== -1);

    const results: any[] = [];
    for (let i = 1; i < lines.length; i++) {
      const c = lines[i].split(delim).map((s) => (s || '').trim());
      const date = this.parseDate(c[iDate] || '');
      if (!date) continue; // ignora rodapé/totais do banco

      let valDebito = 0;
      let valCredito = 0;

      if (iDeb !== -1 || iCred !== -1) {
        // Formato A: colunas explícitas Débito/Crédito
        valDebito = Math.abs(this.parseAmount(c[iDeb] || '') || 0);
        valCredito = Math.abs(this.parseAmount(c[iCred] || '') || 0);
      } else if (iValues.length >= 2) {
        // Formato B: duas colunas "Valor" → o SINAL decide
        for (const vi of iValues) {
          const v = this.parseAmount(c[vi] || '') || 0;
          if (v < 0) valDebito += Math.abs(v);
          else if (v > 0) valCredito += v;
        }
      } else if (iValues.length === 1) {
        // Formato C: coluna única → o SINAL decide
        const v = this.parseAmount(c[iValues[0]] || '') || 0;
        if (v < 0) valDebito = Math.abs(v);
        else valCredito = v;
      }

      if (valDebito <= 0 && valCredito <= 0) continue;

      // 🐛 FIX (revisão): sem coluna de descrição, NÃO cair na coluna 0 (data)
      const description =
        iDesc !== -1 ? (c[iDesc] || '').trim() || 'Sem descrição' : 'Sem descrição';

      results.push({
        date: date.toISOString(),
        description,
        counterpartyCpfCnpj:
          iCnpj !== -1 ? (c[iCnpj] || '').replace(/\D/g, '') || null : null,
        amount: valDebito > 0 ? valDebito : valCredito,
        type: valDebito > 0 ? 'SAIDA' : 'ENTRADA',
        status: 'PENDENTE',
      });
    }
    return results;
  }

  // =================================================================
  // 🧮 MOTOR DE SEMELHANÇA (nome + valor + recorrência)
  // =================================================================
  /** Score = 0.7·Jaccard(texto) + 0.2·valor + 0.1·recorrência (corte 0.5). */
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
      if (diff < 0.005) amt = 1;                                  // valor idêntico
      else if (diff / Math.max(Number(h.amount), amount) < 0.05) amt = 0.6; // ±5%
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

  /** Casa código do arquivo c/ a conta (classificação OU nº unificado). */
  private async resolveAccount(companyId: string, code: string | null) {
    if (!code) return null;
    const c = String(code).trim();
    const isInt = /^\d+$/.test(c);
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

  /** Similaridade de Jaccard sobre tokens normalizados. */
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

  /** Tokeniza: minúsculas normalizadas, >2 chars, descarta numerais puros. */
  private tokens(s: string): Set<string> {
    return new Set(
      this.normalize(s)
        .split(' ')
        .filter((t) => t.length > 2 && !/^\d+$/.test(t)),
    );
  }

  /** Normaliza p/ comparação: sem acentos, upper, só A-Z0-9/espaços. */
  private normalize(s: string): string {
    return (s || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toUpperCase()
      .replace(/[^A-Z0-9\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /** Detecta delimitador (; | tab | | | ,) pelo maior nº de colunas. */
  private detectDelimiter(line: string): string {
    return [';', '\t', '|', ','].reduce(
      (best, d) => (line.split(d).length > line.split(best).length ? d : best),
      ',',
    );
  }

  /** Parse de data dd/mm/aaaa → Date local (evita off-by-one de fuso). */
  private parseDate(raw: string): Date | null {
    const m = (raw || '').match(/(\d{2})\/(\d{2})\/(\d{4})/);
    return m ? new Date(+m[3], +m[2] - 1, +m[1]) : null;
  }

  /**
   * Parse de valor BR: aceita "R$ 1.000,00", "-1.383,52", "928.99".
   * Remove moeda/letras; milhar c/ ponto + decimal c/ vírgula → float.
   */
  private parseAmount(raw: string): number | null {
    let s = (raw || '').trim();
    if (!s) return null;

    // 🛡️ Remove prefixo de moeda e espaços (R$, US$, etc.)
    s = s.replace(/[A-Za-z$]/g, '').trim();
    if (!s) return null;

    // Formato brasileiro: 1.000,00 → 1000.00
    if (s.includes(',')) {
      s = s.replace(/\./g, '').replace(',', '.');
    }

    const v = parseFloat(s);
    return isNaN(v) ? null : v;
  }
}