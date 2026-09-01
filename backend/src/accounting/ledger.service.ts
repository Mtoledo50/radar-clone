// =================================================================
// INÍCIO: backend/src/accounting/ledger.service.ts
// =================================================================
/**
 * 📖 LedgerService — ETAPA 1 (ADR-066)
 * Gerencia a importação do Razão/Livro Caixa e o SUGERIDOR DE CONTA.
 * 
 * FLUXO:
 *   1. Frontend lê o CSV → envia como { content, clientId, periodLabel }
 *   2. Parser de domínio extrai lançamentos + par contraparte→conta
 *   3. Service grava no banco (idempotente: reimportar substitui)
 * 
 * 👑 SUGERIDOR DE CONTA (ouro do Razão):
 *   O Razão traz o par "contraparte → conta contábil" (ex.:
 *   "SOLANGE BENNERT" → "03.2.1.01.011 Mensalidades").
 *   Esse mapa vira a BASE de sugestão automática na hora do lançamento:
 *   ao digitar "SOLANGE", o sistema sugere a conta de Mensalidades.
 */
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { parseLedger } from './domain/parse-ledger';
import { BadRequestException, } from '@nestjs/common';

@Injectable()
export class LedgerService {
  constructor(private prisma: PrismaService) {}

  /**
   * Importa o Razão a partir do conteúdo CSV (texto).
   * Idempotente: reimportar substitui o anterior do mesmo período.
   */
  async importLedger(
    companyId: string,
    clientId: string,
    periodLabel: string, // '2026-05_a_2026-06'
    content: string,
    fileName?: string,
  ) {
    // 1. Parse do conteúdo (domínio puro)
    const parsed = parseLedger(content);
    if (parsed.entries.length === 0) {
      throw new NotFoundException('Razão vazio ou formato inválido.');
    }

    // 2. Idempotência: apaga importação anterior do mesmo período
    const existing = await this.prisma.ledgerImport.findFirst({
      where: { companyId, clientId, periodLabel },
    });
    if (existing) {
      await this.prisma.ledgerImport.delete({ where: { id: existing.id } });
    }

    // 3. Cria a importação + lançamentos em transação ACID
    const ledgerImport = await this.prisma.$transaction(async (tx) => {
      const li = await tx.ledgerImport.create({
        data: {
          companyId,
          clientId,
          periodLabel,
          fileName,
          months: parsed.months as any,
          accounts: parsed.accounts as any,
        },
      });

      // Insere os lançamentos do Razão
      await tx.clientLedgerEntry.createMany({
        data: parsed.entries.map((entry) => ({
          ledgerImportId: li.id,
          companyId,
          clientId,
          accountCode: entry.accountCode,
          accountName: entry.accountName,
          entryDate: new Date(entry.date),
          counterparty: entry.counterparty,
          debit: entry.debit,
          credit: entry.credit,
          balance: entry.balance,
        })),
      });

      return li;
    });

    return {
      id: ledgerImport.id,
      periodLabel: ledgerImport.periodLabel,
      months: ledgerImport.months,
      entryCount: parsed.entries.length,
      accountCount: parsed.accounts.length,
    };
  }
  /**
   * Lista todas as importações de Razão do cliente.
   */
  async listLedgerImports(companyId: string, clientId: string) {
    return this.prisma.ledgerImport.findMany({
      where: { companyId, clientId },
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { entries: true } } },
    });
  }

  /**
   * 👑 SUGERIDOR DE CONTA — retorna o mapa contraparte→conta.
   * Usa o Razão mais recente do cliente para construir o mapa.
   * 
   * RETORNO: { "SOLANGE BENNERT": { code: "03.2.1.01.011", name: "Mensalidades" } }
   * 
   * USO: ao digitar uma contraparte no lançamento, o frontend consulta
   * esse endpoint e sugere a conta contábil automaticamente.
   */
  async getCounterpartyMap(companyId: string, clientId: string) {
    // Busca o Razão mais recente do cliente
    const latest = await this.prisma.ledgerImport.findFirst({
      where: { companyId, clientId },
      orderBy: { createdAt: 'desc' },
      include: {
        entries: {
          select: {
            counterparty: true,
            accountCode: true,
            accountName: true,
          },
        },
      },
    });

    if (!latest) return {};

    // Constrói o mapa: contraparte → { code, name, hits }
    const map = new Map<string, { code: string; name: string; hits: number }>();
        for (const entry of latest.entries) {
      // 🛡️ ETAPA 2: o mapa deve apontar só p/ contas de CLASSIFICAÇÃO
      // (receita/despesa/ativo/PL) — nunca p/ o próprio banco/caixa
      if (/^01\.1\.1\.0[123]/.test(entry.accountCode)) continue;
      const cp = entry.counterparty.trim().toUpperCase();
      if (!cp) continue;

      const existing = map.get(cp);
      if (existing) {
        existing.hits++;
      } else {
        map.set(cp, {
          code: entry.accountCode,
          name: entry.accountName,
          hits: 1,
        });
      }
    }

    // Converte para objeto (mais fácil de serializar)
    const result: Record<string, { code: string; name: string; hits: number }> = {};
    for (const [cp, data] of map) {
      result[cp] = data;
    }
    return result;
  }

  /**
   * Retorna os lançamentos do Razão de um período específico.
   */
  async getLedgerEntries(
    companyId: string,
    clientId: string,
    periodLabel: string,
  ) {
    const li = await this.prisma.ledgerImport.findFirst({
      where: { companyId, clientId, periodLabel },
      include: {
        entries: {
          orderBy: [{ entryDate: 'asc' }, { accountCode: 'asc' }],
        },
      },
    });
    if (!li) throw new NotFoundException('Razão não encontrado.');
    return li;
  }
  // =================================================================
  // 🆕 BLOCO 7 — PROMOVER RAZÃO → LANÇAMENTOS (ADR-080, v2)
  // =================================================================
  /**
   * Converte o Razão/Livro Caixa em AccountingEntry (status CONCILIADO).
   * v2: usa os blocos NÃO bancários como origem (é onde o razão tem dados):
   *   débito no bloco  → D conta / C banco
   *   crédito no bloco → D banco / C conta
   * Idempotente (ADR-076): data + valor + descrição não duplicam.
   */
  async promoteLedgerToEntries(companyId: string, clientId: string) {
    const imports = await this.prisma.ledgerImport.findMany({
      where: { companyId, clientId },
      include: { entries: { orderBy: { entryDate: 'asc' } } },
    });
    if (imports.length === 0) {
      throw new BadRequestException('Nenhum razão importado para este cliente.');
    }

    const rows = imports.flatMap((i) => i.entries);
    const norm = (s: string) =>
      (s || '')
        .toUpperCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/\s+/g, ' ')
        .trim();
    const isBank = (code: string) => (code || '').replace(/^0+/, '').startsWith('1.1.1.');

    // Resolve conta por classificação OU seq (plano do cliente ou padrão)
    const resolve = (code: string) =>
      this.prisma.accountingAccount.findFirst({
        where: {
          isActive: true,
          OR: [
            { companyId, code },
            { companyId, seq: code },
            { companyId: null, code },
            { companyId: null, seq: code },
          ],
        },
      });

    // Conta bancária: primeiro bloco 01.1.1.x do razão, senão por nome "Banco"
    const bankCode = rows.find((r) => isBank(r.accountCode))?.accountCode || null;
    let bankAcc = bankCode ? await resolve(bankCode) : null;
    if (!bankAcc) {
      bankAcc = await this.prisma.accountingAccount.findFirst({
        where: {
          isActive: true,
          OR: [{ companyId }, { companyId: null }],
          name: { contains: 'BANCO', mode: 'insensitive' },
        },
      });
    }
    if (!bankAcc) {
      throw new BadRequestException(
        'Plano de contas sem conta bancária (01.1.1.x ou nome "Banco"). Cadastre uma para promover o razão.',
      );
    }

    // Idempotência (ADR-076)
    const existing = await this.prisma.accountingEntry.findMany({
      where: { companyId, clientId },
      select: { entryDate: true, debitValue: true, creditValue: true, description: true },
    });
    const keyOf = (d: Date, amt: number, desc: string) =>
      `${new Date(d).toISOString().slice(0, 10)}|${amt.toFixed(2)}|${norm(desc)}`;
    const keys = new Set(
      existing.map((e) =>
        keyOf(new Date(e.entryDate), Math.max(Number(e.debitValue), Number(e.creditValue)), e.description),
      ),
    );

    let created = 0, duplicados = 0, semConta = 0;

    for (const r of rows) {
      if (isBank(r.accountCode)) continue; // bloco bancário é a contraparte, não a origem
      const deb = Number(r.debit) || 0;
      const cred = Number(r.credit) || 0;
      const amount = deb > 0 ? deb : cred;
      if (amount <= 0) continue;

      const descKey = norm(r.counterparty) || norm(r.accountName) || 'LANCAMENTO DO RAZAO';
      const k = keyOf(new Date(r.entryDate), amount, descKey);
      if (keys.has(k)) { duplicados++; continue; }

      const acc = await resolve(r.accountCode);
      if (!acc) { semConta++; continue; }

      await this.prisma.accountingEntry.create({
        data: {
          companyId,
          clientId,
          entryDate: new Date(r.entryDate),
          description: r.counterparty || r.accountName || 'Lançamento do razão',
          debitValue: amount,
          creditValue: amount,
          debitAccountId: deb > 0 ? acc.id : bankAcc.id,
          creditAccountId: deb > 0 ? bankAcc.id : acc.id,
          source: 'PROMOCAO_RAZAO',
          status: 'CONCILIADO',
        },
      });
      keys.add(k);
      created++;
    }

    return { created, duplicados, semConta, semContraparte: 0 };
  }
  // =================================================================
  // 🗑️ EXCLUIR RAZÃO IMPORTADO (Bloco 8)
  // =================================================================
  /**
   * Remove a importação do razão e suas linhas (ClientLedgerEntry).
   * ADR-030: lançamentos já promovidos ao DRE NÃO são apagados —
   * eles são histórico contábil e se gerenciam em Revisão/Lançamentos.
   */
  async deleteLedgerImport(companyId: string, importId: string) {
    const imp = await this.prisma.ledgerImport.findFirst({
      where: { id: importId, companyId },
    });
    if (!imp) throw new BadRequestException('Importação de razão não encontrada.');

    await this.prisma.clientLedgerEntry.deleteMany({ where: { ledgerImportId: importId } });
    await this.prisma.ledgerImport.delete({ where: { id: importId } });
    return { deleted: true, periodLabel: imp.periodLabel };
  }
}
// =================================================================
// FIM: backend/src/accounting/ledger.service.ts
// =================================================================