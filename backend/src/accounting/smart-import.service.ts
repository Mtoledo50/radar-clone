// =================================================================
// INÍCIO: backend/src/accounting/smart-import.service.ts
// =================================================================
/**
 * 🧠 SmartImportService — ETAPA 2 (ADR-066/068/069)
 * Fluxo "extrato bruto → rascunhos com contas sugeridas":
 *   1. parseStatement()  → linhas + conta bancária por seção (multi-conta)
 *   2. bankBySection     → "07417-6" → 01.1.1.02.026 • "82048-5" → 01.1.1.02.027
 *   3. counterpartyMap   → memória do razão (contraparte→conta de resultado)
 *   4. buildDrafts()     → rascunhos 🟢🟡🟠 p/ revisão humana obrigatória
 */
import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { parseStatement } from './domain/parse-statement';
import { buildDrafts, SuggestContext, AccountRef } from './domain/suggest-accounts';
import { LedgerService } from './ledger.service';

@Injectable()
export class SmartImportService {
  constructor(
    private prisma: PrismaService,
    private ledgerService: LedgerService, // memória contraparte→conta (ETAPA 1)
  ) {}

  // =================================================================
  // 1) ANALISAR: extrato → rascunhos com sugestões
  // =================================================================
  async parseSmart(companyId: string, clientId: string, content: string, bankCode?: string) {
    // ── Parser de domínio: extrato real do banco (multi-conta) ──
    const { rows, linhasIgnoradas } = parseStatement(content);
    if (rows.length === 0) {
      throw new BadRequestException('Nenhuma linha válida no extrato.');
    }

    // ── Plano de contas (globais + do tenant) → mapa código→conta ──
    const accounts = await this.prisma.accountingAccount.findMany({
      where: { OR: [{ companyId: null }, { companyId }], isActive: true },
      select: { id: true, code: true, name: true },
    });
    const accountsByCode = new Map<string, AccountRef>(
      accounts.map((a) => [a.code, { id: a.id, code: a.code, name: a.name }]),
    );

    // ── 🆕 MULTI-CONTA (ADR-069): seção "Conta: XXXX-X" → conta contábil ──
    // Pool = contas de caixa/bancos/aplicações; casa pelo NÚMERO da seção
    // aparecer no NOME da conta ("Sicredi 07417-6" contém "074176")
    const digits = (s: string) => s.replace(/\D/g, '');
    const bankPool = accounts.filter(
      (a) =>
        a.code.startsWith('01.1.1.01') ||
        a.code.startsWith('01.1.1.02') ||
        a.code.startsWith('01.1.1.03'),
    );
    const bankBySection = new Map<string, AccountRef>();
    for (const row of rows) {
      if (!row.bankAccount || bankBySection.has(row.bankAccount)) continue;
      const sec = digits(row.bankAccount);
      if (sec.length < 4) continue;
      const match = bankPool.find((a) => digits(a.name).includes(sec));
      if (match) bankBySection.set(row.bankAccount, match);
    }

    // ── Fallback: banco selecionado na UI (ou 1ª conta 01.1.1.02.*) ──
    const defaultBank =
      (bankCode && accountsByCode.get(bankCode)) ||
      bankPool.find((a) => a.code.startsWith('01.1.1.02')) ||
      null;

    // ── Memória do razão: contraparte → conta de resultado ──
    const counterpartyMap = await this.ledgerService.getCounterpartyMap(companyId, clientId);

    // ── Motor de sugestão (domínio puro, testável) ──
    const ctx: SuggestContext = { accountsByCode, counterpartyMap, bankBySection, defaultBank };
    const drafts = buildDrafts(rows, ctx);

    // ── Estatísticas p/ os cards do preview ──
    const stats = {
      total: drafts.length,
      alta: drafts.filter((d) => d.confidence === 'ALTA').length,
      media: drafts.filter((d) => d.confidence === 'MEDIA').length,
      revisar: drafts.filter((d) => d.confidence === 'REVISAR').length,
      totalEntradas: rows.filter((r) => r.side === 'ENTRADA').reduce((s, r) => s + r.amount, 0),
      totalSaidas: rows.filter((r) => r.side === 'SAIDA').reduce((s, r) => s + r.amount, 0),
    };

    return {
      drafts,
      stats,
      linhasIgnoradas,
      contasDetectadas: [...bankBySection.values()].map((a) => `${a.code} ${a.name}`),
    };
  }

  // =================================================================
  // 2) SALVAR: rascunhos revisados → partidas dobradas (idempotente)
  // =================================================================
  async saveSmart(companyId: string, clientId: string, drafts: any[]) {
    let created = 0;
    let skipped = 0;

    for (const d of drafts) {
      // Segurança: nunca grava partida incompleta
      if (!d.debit?.id || !d.credit?.id) { skipped++; continue; }

      // Idempotência por fingerprint (cliente+data+descrição+valor)
      const exists = await this.prisma.accountingEntry.findFirst({
        where: {
          companyId,
          clientId,
          entryDate: new Date(d.date),
          description: d.description,
          debitValue: d.amount,
        },
      });
      if (exists) { skipped++; continue; }

      await this.prisma.accountingEntry.create({
        data: {
          companyId,
          clientId,
          entryDate: new Date(d.date),
          description: d.description,
          counterpartyName: d.counterparty || '',
          debitAccountId: d.debit.id,
          creditAccountId: d.credit.id,
          debitValue: d.amount,   // partida dobrada: mesmo valor dos 2 lados
          creditValue: d.amount,
          source: 'IMPORTACAO_EXTRATO',
          // 🛡️ Compliance: REVISAR fica PENDENTE p/ dupla checagem
          status: d.confidence === 'REVISAR' ? 'PENDENTE' : 'CONCILIADO',
        },
      });
      created++;
    }

    return { created, skipped };
  }
}
// =================================================================
// FIM: backend/src/accounting/smart-import.service.ts
// =================================================================