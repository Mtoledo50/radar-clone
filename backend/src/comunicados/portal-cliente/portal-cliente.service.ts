// ============================================================================
// SPRINT F18-B — PortalClienteService (ADR-121)
// ----------------------------------------------------------------------------
// Lógica do Portal do Cliente (acesso público tokenizado).
//
// 🆕 ADAPTADO AO SCHEMA REAL:
//    - ClientPortalToken (1-N) em vez de campo único
//    - AccountingEntry: debitValue/creditValue, entryDate, debitAccount/creditAccount
//    - Task: enum sem CANCELLED
//    - Proposal: busca por clientCnpj (não clientId)
//
// Fluxo:
//   1. Cliente recebe link: /portal/<token>
//   2. Service valida token + busca Client (via relação ClientPortalToken)
//   3. Carrega dashboard completo (KPIs, DRE, Propostas, Documentos)
//   4. Download: valida token + expiração + grava evento BAIXADO
// ============================================================================
import { Injectable, Logger, NotFoundException, GoneException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class PortalClienteService {
  private readonly logger = new Logger(PortalClienteService.name);
  private readonly tokenTtlDays: number;

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {
    this.tokenTtlDays = parseInt(
      this.config.get<string>('PORTAL_TOKEN_TTL_DAYS', '90'),
      10,
    );
  }

  /**
   * Valida token e retorna dados básicos do cliente + data de expiração.
   */
  async validarToken(token: string) {
    const portalToken = await this.prisma.clientPortalToken.findFirst({
      where: {
        token,
        revokedAt: null,
        expiresAt: { gte: new Date() },
        client: { deletedAt: null },
      },
      include: {
        client: {
          select: {
            id: true,
            companyName: true,
            cnpj: true,
            monthlyFee: true,
            status: true,
            startDate: true,
          },
        },
      },
    });

    if (!portalToken) {
      throw new NotFoundException('Token inválido ou expirado.');
    }

    return {
      client: portalToken.client,
      expiresAt: portalToken.expiresAt,
    };
  }

  /**
   * Carrega dashboard completo do portal (KPIs, DRE, Propostas, Documentos).
   */
  async carregarDashboard(token: string) {
    // 1. Valida token e busca cliente
    const portalToken = await this.prisma.clientPortalToken.findFirst({
      where: {
        token,
        revokedAt: null,
        expiresAt: { gte: new Date() },
        client: { deletedAt: null },
      },
      include: { client: true },
    });

    if (!portalToken) {
      throw new NotFoundException('Token inválido ou expirado.');
    }

    const client = portalToken.client;

    // 2. Busca tarefas do cliente (sem CANCELLED — enum não tem esse valor)
    const tasks = await this.prisma.task.findMany({
      where: {
        clientId: client.id,
        companyId: client.companyId,
        status: { notIn: ['DONE', 'BLOCKED'] },
        deletedAt: null,
      },
      orderBy: [{ priority: 'desc' }, { dueDate: 'asc' }],
      take: 10,
    });

    // 3. Busca relatórios mensais (PDFs gerados pela Aurora FD-2)
    const monthlyReports = await this.prisma.monthlyReport.findMany({
      where: {
        clientId: client.id,
        companyId: client.companyId,
        status: 'READY',
      },
      orderBy: { createdAt: 'desc' },
      take: 12,
    });

    // 4. Busca propostas comerciais enviadas (por CNPJ, não clientId)
    const proposals = client.cnpj
      ? await this.prisma.proposal.findMany({
          where: {
            clientCnpj: client.cnpj,
            companyId: client.companyId,
            status: { in: ['SENT', 'VIEWED', 'CLOSED_WON', 'CLOSED_LOST'] },
          },
          orderBy: { sentAt: 'desc' },
          take: 10,
        })
      : [];

    // 5. Calcula DRE do mês (Receitas - Despesas = Resultado)
    const dreSummary = await this.calcularDRE(client.id, client.companyId);

    return {
      client: {
        id: client.id,
        companyName: client.companyName,
        cnpj: client.cnpj,
        monthlyFee: client.monthlyFee,
        status: client.status,
        startDate: client.startDate,
      },
      tasks,
      monthlyReports,
      proposals,
      dreSummary,
    };
  }

  /**
   * Calcula DRE resumido do mês corrente (Receitas - Despesas).
   * Usa lançamentos contábeis classificados por tipo de conta (RECEITA/DESPESA).
   */
  private async calcularDRE(clientId: string, companyId: string) {
    const agora = new Date();
    const inicioMes = new Date(agora.getFullYear(), agora.getMonth(), 1);
    const fimMes = new Date(agora.getFullYear(), agora.getMonth() + 1, 0, 23, 59, 59);

    const periodLabel = agora.toLocaleDateString('pt-BR', {
      month: 'long',
      year: 'numeric',
    });

    // Busca lançamentos do mês (entrada = débito, saída = crédito)
    // Para DRE: RECEITA = crédito em conta de receita, DESPESA = débito em conta de despesa
    const lancamentos = await this.prisma.accountingEntry.findMany({
      where: {
        clientId,
        companyId,
        entryDate: { gte: inicioMes, lte: fimMes },
        status: 'CONCILIATED', // apenas conciliados (reais)
      },
      select: {
        debitValue: true,
        creditValue: true,
        debitAccount: {
          select: {
            type: true, // RECEITA, DESPESA, ATIVO, PASSIVO, etc.
          },
        },
        creditAccount: {
          select: {
            type: true,
          },
        },
      },
    });

    // Soma receitas (creditos em contas de receita)
    // FIX F18-B-TS: Prisma retorna Decimal (decimal.js) — converter p/ number
    const receitas = lancamentos
      .filter((l) => l.creditAccount?.type === 'RECEITA')
      .reduce((sum, l) => sum + Number(l.creditValue ?? 0), 0);

    // Soma despesas (debitos em contas de despesa)
    const despesas = lancamentos
      .filter((l) => l.debitAccount?.type === 'DESPESA')
      .reduce((sum, l) => sum + Number(l.debitValue ?? 0), 0);

    const resultado = receitas - despesas;
    const margem = receitas > 0 ? (resultado / receitas) * 100 : 0;

    return {
      period: `${agora.getFullYear()}-${String(agora.getMonth() + 1).padStart(2, '0')}`,
      periodLabel,
      receitas,
      despesas,
      resultado,
      margem,
    };
  }

  /**
   * Regenera token do portal (revoga todos os anteriores).
   * Endpoint ADMIN — útil em caso de vazamento.
   */
  async regenerarToken(clienteId: string, usuarioId: string) {
    // Revoga todos os tokens ativos do cliente
    await this.prisma.clientPortalToken.updateMany({
      where: { clientId: clienteId, revokedAt: null },
      data: { revokedAt: new Date() },
    });

    // Cria novo token com expiração
    const novoToken = crypto.randomUUID();
    const expiraEm = new Date();
    expiraEm.setDate(expiraEm.getDate() + this.tokenTtlDays);

    const portalToken = await this.prisma.clientPortalToken.create({
      data: {
        token: novoToken,
        clientId: clienteId,
        expiresAt: expiraEm,
      },
    });

    return {
      token: portalToken.token,
      expiresAt: portalToken.expiresAt,
      url: `/portal/${portalToken.token}`,
    };
  }
}