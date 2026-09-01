// =================================================================
// ARQUIVO: backend/src/client-portal/client-portal.service.ts
// =================================================================
// 🆕 Serviço do Portal do Cliente (ADR-096)
// =================================================================
// Responsável por fornecer dados isolados e seguros para o portal
// público do cliente final (sem autenticação de admin).
//
// Fluxo de segurança:
// 1. Admin gera token único vinculado ao clientId (expira em 90 dias)
// 2. Cliente acessa /portal/[token] sem login
// 3. Cada requisição valida o token antes de retornar dados
// 4. Admin pode revogar o token a qualquer momento
//
// Expandido na Fase 4.1:
// - Visão Geral (tarefas em andamento)
// - DRE Real do Cliente (agregado de AccountingEntry)
// - Propostas Comerciais (histórico)
// - Documentos (relatórios mensais PDF)
// =================================================================
import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TaskStatus, AccountType } from '@prisma/client';

@Injectable()
export class ClientPortalService {
  constructor(private readonly prisma: PrismaService) {}

  // =================================================================
  // 🔑 GERAÇÃO DE TOKEN (Admin → Cliente)
  // =================================================================
  /**
   * Gera um novo token de acesso para o cliente (válido por 90 dias).
   * Revoga automaticamente tokens ativos anteriores para garantir
   * que apenas o link mais recente funcione (segurança por invalidação).
   */
  async generateToken(companyId: string, clientId: string) {
    const client = await this.prisma.client.findFirst({
      where: { id: clientId, companyId, deletedAt: null },
    });
    if (!client) throw new NotFoundException('Cliente não encontrado');

    // Revoga tokens ativos anteriores (invalidação em cascata)
    await this.prisma.clientPortalToken.updateMany({
      where: {
        clientId,
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
      data: { revokedAt: new Date() },
    });

    // Gera token único no formato: client_xxx_timestamp36
    const token = `client_${clientId.slice(0, 8)}_${Date.now().toString(36)}`;
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 90);

    const portalToken = await this.prisma.clientPortalToken.create({
      data: { clientId, token, expiresAt },
    });

    return {
      token: portalToken.token,
      url: `/portal/${portalToken.token}`,
      expiresAt: portalToken.expiresAt,
    };
  }

  // =================================================================
  // 🔒 VALIDAÇÃO DE TOKEN (Público → Dados)
  // =================================================================
  /**
   * Valida o token e retorna os dados básicos do cliente vinculado.
   * Atualiza `lastUsedAt` para auditoria de acesso.
   */
  async validateToken(token: string) {
    const portalToken = await this.prisma.clientPortalToken.findUnique({
      where: { token },
      include: {
        client: {
          select: {
            id: true,
            companyName: true,
            cnpj: true,
            contactName: true,
            contactEmail: true,
            monthlyFee: true,
            status: true,
          },
        },
      },
    });

    if (!portalToken) throw new UnauthorizedException('Token inválido');
    if (portalToken.revokedAt) throw new UnauthorizedException('Token revogado pelo administrador');
    if (portalToken.expiresAt < new Date()) throw new UnauthorizedException('Token expirado');

    // Atualiza lastUsedAt (auditoria de acesso)
    await this.prisma.clientPortalToken.update({
      where: { id: portalToken.id },
      data: { lastUsedAt: new Date() },
    });

    return portalToken;
  }

  // =================================================================
  // 📊 DRE REAL DO CLIENTE (Fase 4.2)
  // =================================================================
  /**
   * Agrega os lançamentos contábeis (AccountingEntry) do cliente
   * para gerar um DRE simplificado do último mês com dados.
   *
   * Lógica contábil brasileira (convenção SCI):
   * - RECEITA aumenta com CRÉDITO → soma creditValue das contas RECEITA
   * - DESPESA aumenta com DÉBITO → soma debitValue das contas DESPESA
   * - Resultado = Receitas − Despesas
   *
   * @param clientId - ID do cliente
   * @returns DRE simplificado com período, receitas, despesas e resultado
   */
  async getDreSummary(clientId: string) {
    // 1. Descobre o último mês com lançamentos do cliente
const lastEntry = await this.prisma.accountingEntry.findFirst({
  where: { clientId }, // ✅ removido 'deletedAt: null'
  orderBy: { entryDate: 'desc' },
  select: { entryDate: true },
});

    if (!lastEntry) {
      return null; // Sem dados contábeis
    }

    // Define o período do último mês (1º ao último dia do mês)
    const lastDate = new Date(lastEntry.entryDate);
    const year = lastDate.getFullYear();
    const month = lastDate.getMonth(); // 0-11
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0, 23, 59, 59, 999);

    // 2. Busca todas as contas do tipo RECEITA e DESPESA do tenant
    const [receitaAccounts, despesaAccounts] = await Promise.all([
      this.prisma.accountingAccount.findMany({
        where: { companyId: (await this.prisma.client.findUnique({ where: { id: clientId }, select: { companyId: true } })).companyId, type: AccountType.RECEITA },
        select: { id: true },
      }),
      this.prisma.accountingAccount.findMany({
        where: { companyId: (await this.prisma.client.findUnique({ where: { id: clientId }, select: { companyId: true } })).companyId, type: AccountType.DESPESA },
        select: { id: true },
      }),
    ]);

    const receitaIds = receitaAccounts.map((a) => a.id);
    const despesaIds = despesaAccounts.map((a) => a.id);

    // 3. Agrega valores do período
    const [receitas, despesas] = await Promise.all([
      // Receitas = soma de creditValue em contas RECEITA
      this.prisma.accountingEntry.aggregate({
        where: {
          clientId,
          entryDate: { gte: firstDay, lte: lastDay },
          creditAccountId: { in: receitaIds },
        },
        _sum: { creditValue: true },
      }),
      // Despesas = soma de debitValue em contas DESPESA
      this.prisma.accountingEntry.aggregate({
        where: {
          clientId,
          entryDate: { gte: firstDay, lte: lastDay },
          debitAccountId: { in: despesaIds },
        },
        _sum: { debitValue: true },
      }),
    ]);

    const totalReceitas = Number(receitas._sum.creditValue || 0);
    const totalDespesas = Number(despesas._sum.debitValue || 0);
    const resultado = totalReceitas - totalDespesas;

    return {
      period: `${year}-${String(month + 1).padStart(2, '0')}`,
      periodLabel: lastDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }),
      receitas: totalReceitas,
      despesas: totalDespesas,
      resultado,
      margem: totalReceitas > 0 ? (resultado / totalReceitas) * 100 : 0,
    };
  }

  // =================================================================
  // 📊 DASHBOARD EXPANDIDO (Fase 4.1 + 4.2)
  // =================================================================
  /**
   * Retorna todos os dados do portal do cliente em uma única chamada.
   * Usa Promise.all para paralelismo e performance.
   *
   * Dados retornados:
   * - client: dados cadastrais básicos
   * - tasks: tarefas em andamento (não concluídas), ordenadas por prazo
   * - monthlyReports: relatórios mensais prontos (status READY)
   * - proposals: propostas comerciais vinculadas ao cliente
   * - dreSummary: DRE real do último mês (agregado de AccountingEntry)
   */
  async getDashboard(clientId: string) {
    // Carrega dados do cliente primeiro (necessário para buscar propostas)
    const client = await this.prisma.client.findUnique({
      where: { id: clientId },
      select: {
        id: true,
        companyName: true,
        cnpj: true,
        monthlyFee: true,
        status: true,
        startDate: true,
      },
    });

    if (!client) {
      throw new NotFoundException('Cliente não encontrado');
    }

    // Carrega os demais dados em paralelo
    const [tasks, monthlyReports, proposalsByName, dreSummary] = await Promise.all([
      // ── Tarefas em andamento (não concluídas) ──
      this.prisma.task.findMany({
        where: {
          clientId,
          deletedAt: null,
          status: { notIn: [TaskStatus.DONE] },
        },
        select: {
          id: true,
          title: true,
          status: true,
          priority: true,
          dueDate: true,
          category: true,
        },
        orderBy: { dueDate: 'asc' },
        take: 10,
      }),

      // ── Relatórios mensais (documentos PDF prontos) ──
      this.prisma.monthlyReport.findMany({
        where: {
          clientId,
          status: 'READY',
        },
        select: {
          id: true,
          period: true,
          status: true,
          pdfPath: true,
          summary: true,
          createdAt: true,
        },
        orderBy: { period: 'desc' },
        take: 12,
      }),

      // ── Propostas comerciais (busca por nome do cliente) ──
      this.prisma.proposal.findMany({
        where: {
          clientName: { contains: client.companyName, mode: 'insensitive' },
        },
        select: {
          id: true,
          proposalNumber: true,
          slug: true,
          clientName: true,
          basePrice: true,
          status: true,
          sentAt: true,
          closedAt: true,
          version: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),

      // ──  DRE Real do Cliente (Fase 4.2) ──
      this.getDreSummary(clientId),
    ]);

    return {
      client,
      tasks,
      monthlyReports,
      proposals: proposalsByName,
      dreSummary,
    };
  }

  // =================================================================
  // 📋 LISTAGEM DE TOKENS (Admin)
  // =================================================================
  /**
   * Lista todos os tokens (ativos e revogados) de um cliente.
   * Usado pelo admin para auditar acessos concedidos.
   */
  async listTokens(companyId: string, clientId: string) {
    return this.prisma.clientPortalToken.findMany({
      where: {
        clientId,
        client: { companyId, deletedAt: null },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // =================================================================
  // 🚫 REVOGAÇÃO DE TOKEN (Admin)
  // =================================================================
  /**
   * Revoga um token específico, invalidando o acesso do cliente
   * imediatamente. Usado quando o link foi compartilhado indevidamente
   * ou quando o contrato com o cliente é encerrado.
   */
  async revokeToken(companyId: string, tokenId: string) {
    const token = await this.prisma.clientPortalToken.findFirst({
      where: { id: tokenId, client: { companyId } },
    });
    if (!token) throw new NotFoundException('Token não encontrado');

    await this.prisma.clientPortalToken.update({
      where: { id: tokenId },
      data: { revokedAt: new Date() },
    });

    return { message: 'Token revogado com sucesso' };
  }
}