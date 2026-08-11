import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

/**
 * =================================================================
 * 🏦 BankingService — Fechamento Mensal (Sprint 21 → 24)
 * =================================================================
 * 🆕 Sprint 24:
 *   - Naturezas dinâmicas por cliente (BankCategory)
 *   - Grupos fixos p/ DRE: RECEITA | FINANCEIRA | DESPESA | IMPOSTO | SOCIO | PENDENTE
 *   - Fechar/Reabrir mês (trava de compliance)
 *   - DRE por categorias personalizadas (linhas)
 * =================================================================
 */
const normalize = (s: string) =>
  (s || '')
    .toUpperCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^A-Z0-9]+/g, ' ')
    .trim();

/** Grupos que alimentam o DRE (ordem de apresentação) */
export const DRE_GROUPS = [
  'RECEITA',
  'FINANCEIRA',
  'DESPESA',
  'IMPOSTO',
  'SOCIO',
  'PENDENTE',
] as const;

/** Compatibilidade com valores antigos (enum da Sprint 21) */
const LEGACY_GROUP: Record<string, string> = {
  RECEITA_OPERACIONAL: 'RECEITA',
  RECEITA_FINANCEIRA: 'FINANCEIRA',
  DESPESA_OPERACIONAL: 'DESPESA',
  IMPOSTO: 'IMPOSTO',
  SOCIO: 'SOCIO',
  NAO_CLASSIFICADO: 'PENDENTE',
};

/** Categorias padrão criadas automaticamente por cliente */
const SYSTEM_CATEGORIES = [
  { label: 'Receita Operacional', group: 'RECEITA', order: 1 },
  { label: 'Receita Financeira', group: 'FINANCEIRA', order: 2 },
  { label: 'Despesa Operacional', group: 'DESPESA', order: 3 },
  { label: 'Imposto', group: 'IMPOSTO', order: 4 },
  { label: 'Sócio', group: 'SOCIO', order: 5 },
  { label: 'Não Classificado', group: 'PENDENTE', order: 6 },
];

/** Regras built-in calibradas com extratos reais (Renan 06-07/2026) */
const BUILTIN_RULES: { match: string[]; label: string }[] = [
  { match: ['RENAN LINS CARDOSO', 'PAULO RENATO ROSA CARDOSO'], label: 'Sócio' },
  { match: ['SIMPLES NACIONAL', 'RECEITA FEDERAL'], label: 'Imposto' },
  { match: ['RENDIMENTO'], label: 'Receita Financeira' },
  { match: ['VENDAS DISPONIVEL'], label: 'Receita Operacional' },
  {
    match: [
      'CEEE', 'CORSAN', 'CLARO', 'PROSISTEMAS', 'CONTA CERTA',
      'CONTABILIDADE', 'PERSONAL TRAINER', 'GOULARTE',
    ],
    label: 'Despesa Operacional',
  },
];

const COUNTERPARTY_PREFIXES = [
  'PIX RECEBIDO', 'PIX ENVIADO', 'QR CODE PIX ENVIADO', 'QR CODE PIX RECEBIDO',
  'PAGAMENTO DE CONTA', 'TRANSFERENCIA RECEBIDA', 'TRANSFERENCIA ENVIADA',
  'VENDAS DISPONIVEL',
];

@Injectable()
export class BankingService {
  constructor(private readonly prisma: PrismaService) {}

  private round2(v: number): number {
    return Math.round((v + Number.EPSILON) * 100) / 100;
  }

  private extractCounterparty(description: string): string {
    const norm = normalize(description);
    for (const prefix of COUNTERPARTY_PREFIXES) {
      const p = normalize(prefix);
      if (norm.startsWith(p)) return norm.slice(p.length).trim() || norm;
    }
    return norm;
  }

  // =================================================================
  // 🏷️ CATEGORIAS POR CLIENTE (Sprint 24)
  // =================================================================
  /** Cria as categorias padrão na primeira uso (lazy seed) */
  private async ensureCategories(
    tx: any,
    companyId: string,
    clientId: string | null,
  ) {
    const count = await tx.bankCategory.count({ where: { companyId, clientId } });
    if (count > 0) return;
    for (const c of SYSTEM_CATEGORIES) {
      await tx.bankCategory.create({
        data: {
          companyId,
          clientId,
          label: c.label,
          group: c.group,
          order: c.order,
          isSystem: true,
        },
      });
    }
  }

  async listCategories(companyId: string, clientId: string | null) {
    await this.prisma.$transaction(async (tx) => {
      await this.ensureCategories(tx, companyId, clientId);
    });
    return this.prisma.bankCategory.findMany({
      where: { companyId, clientId },
      orderBy: [{ order: 'asc' }, { label: 'asc' }],
    });
  }

  async createCategory(
    companyId: string,
    clientId: string | null,
    label: string,
    group: string,
  ) {
    const name = (label || '').trim();
    if (!name) throw new BadRequestException('Informe o nome da categoria.');
    if (!DRE_GROUPS.includes(group as any)) {
      throw new BadRequestException('Grupo inválido.');
    }
    return this.prisma.bankCategory.upsert({
      where: { companyId_clientId_label: { companyId, clientId, label: name } },
      update: { group },
      create: { companyId, clientId, label: name, group, order: 50 },
    });
  }

  // =================================================================
  // 🧠 MOTOR DE CLASSIFICAÇÃO
  // =================================================================
  async classify(companyId: string, description: string) {
    const norm = normalize(description);

    const learned = await this.prisma.bankClassificationRule.findMany({
      where: { companyId },
      orderBy: { hits: 'desc' },
    });
    for (const r of learned) {
      if (norm.includes(normalize(r.pattern))) {
        return { nature: r.nature, classifiedBy: 'AUTO' };
      }
    }
    for (const rule of BUILTIN_RULES) {
      for (const m of rule.match) {
        if (norm.includes(normalize(m))) {
          return { nature: rule.label, classifiedBy: 'AUTO' };
        }
      }
    }
    return { nature: 'Não Classificado', classifiedBy: 'AUTO' };
  }

  // =================================================================
  // 📥 IMPORTAÇÃO DO EXTRATO
  // =================================================================
  async importStatement(
    companyId: string,
    clientId: string | null,
    payload: {
      year: number;
      month: number;
      fileName?: string;
      rows: { date: string; description: string; amount: number }[];
    },
  ) {
    if (!payload.rows || payload.rows.length === 0) {
      throw new BadRequestException('Nenhuma linha válida para importar.');
    }

    return this.prisma.$transaction(async (tx) => {
      await this.ensureCategories(tx, companyId, clientId);

      let statement = await tx.bankStatement.findFirst({
        where: { companyId, clientId, year: payload.year, month: payload.month },
      });
      if (statement && statement.status === 'FECHADO') {
        throw new BadRequestException('Mês FECHADO. Reabra para reimportar.');
      }
      if (statement) {
        await tx.bankTransaction.deleteMany({ where: { statementId: statement.id } });
      } else {
        statement = await tx.bankStatement.create({
          data: { companyId, clientId, year: payload.year, month: payload.month, fileName: payload.fileName },
        });
      }

      let autoClassified = 0;
      for (const row of payload.rows) {
        const { nature, classifiedBy } = await this.classify(companyId, row.description);
        if (nature !== 'Não Classificado') autoClassified++;
        await tx.bankTransaction.create({
          data: {
            statementId: statement.id,
            companyId,
            date: new Date(row.date + 'T12:00:00'),
            description: row.description,
            counterparty: this.extractCounterparty(row.description),
            amount: row.amount,
            nature,
            classifiedBy,
          },
        });
      }

      return {
        statementId: statement.id,
        imported: payload.rows.length,
        autoClassified,
        pendingReview: payload.rows.length - autoClassified,
      };
    });
  }

  // =================================================================
  // 📊 CONSULTA + DRE POR CATEGORIAS
  // =================================================================
  private resolveGroup(nature: string, categories: { label: string; group: string }[]) {
    const cat = categories.find((c) => c.label === nature);
    if (cat) return cat.group;
    return LEGACY_GROUP[nature] || 'PENDENTE';
  }

  async getStatement(
    companyId: string,
    clientId: string | null,
    year: number,
    month: number,
  ) {
    const categories = await this.listCategories(companyId, clientId);

    const statement = await this.prisma.bankStatement.findFirst({
      where: { companyId, clientId, year, month },
      include: { transactions: { orderBy: { date: 'asc' } } },
    });

    if (!statement) {
      return { statement: null, transactions: [], categories, summary: this.emptySummary() };
    }

    const txs = statement.transactions.map((t) => ({
      id: t.id,
      date: t.date,
      description: t.description,
      counterparty: t.counterparty,
      amount: Number(t.amount),
      nature: t.nature,
      classifiedBy: t.classifiedBy,
    }));

    return {
      statement: {
        id: statement.id,
        year: statement.year,
        month: statement.month,
        fileName: statement.fileName,
        status: statement.status,
      },
      transactions: txs,
      categories,
      summary: this.buildSummary(txs, categories),
    };
  }

  private buildSummary(
    txs: { amount: number; nature: string }[],
    categories: { label: string; group: string }[],
  ) {
    // Linhas do DRE por categoria personalizada
    const map = new Map<string, { label: string; group: string; total: number; count: number }>();
    for (const t of txs) {
      const group = this.resolveGroup(t.nature, categories);
      const line = map.get(t.nature) || { label: t.nature, group, total: 0, count: 0 };
      line.total = this.round2(line.total + t.amount);
      line.count++;
      map.set(t.nature, line);
    }
    const linhas = [...map.values()].sort((a, b) => {
      const ga = DRE_GROUPS.indexOf(a.group as any);
      const gb = DRE_GROUPS.indexOf(b.group as any);
      return ga !== gb ? ga - gb : b.total - a.total;
    });

    const sumGroup = (g: string) =>
      this.round2(
        txs
          .filter((t) => this.resolveGroup(t.nature, categories) === g)
          .reduce((s, t) => s + t.amount, 0),
      );

    const receita = sumGroup('RECEITA');
    const financeira = sumGroup('FINANCEIRA');
    const despesa = sumGroup('DESPESA');
    const imposto = sumGroup('IMPOSTO');
    const socioEnv = this.round2(
      txs
        .filter((t) => this.resolveGroup(t.nature, categories) === 'SOCIO' && t.amount < 0)
        .reduce((s, t) => s + t.amount, 0),
    );
    const socioRec = this.round2(
      txs
        .filter((t) => this.resolveGroup(t.nature, categories) === 'SOCIO' && t.amount > 0)
        .reduce((s, t) => s + t.amount, 0),
    );

    return {
      linhas,
      receita,
      financeira,
      despesa,
      imposto,
      socioEnv,
      socioRec,
      saldoSocio: this.round2(socioRec + socioEnv),
      resultado: this.round2(receita + financeira + despesa + imposto),
      pendentes: txs.filter((t) => this.resolveGroup(t.nature, categories) === 'PENDENTE').length,
      totalCreditos: this.round2(txs.filter((t) => t.amount > 0).reduce((s, t) => s + t.amount, 0)),
      totalDebitos: this.round2(txs.filter((t) => t.amount < 0).reduce((s, t) => s + t.amount, 0)),
    };
  }

  private emptySummary() {
    return {
      linhas: [],
      receita: 0, financeira: 0, despesa: 0, imposto: 0,
      socioEnv: 0, socioRec: 0, saldoSocio: 0,
      resultado: 0, pendentes: 0, totalCreditos: 0, totalDebitos: 0,
    };
  }

  // =================================================================
  // 🔒 FECHAR / REABRIR MÊS (Sprint 24)
  // =================================================================
  async closeStatement(companyId: string, statementId: string) {
    const s = await this.prisma.bankStatement.findFirst({ where: { id: statementId, companyId } });
    if (!s) throw new NotFoundException('Fechamento não encontrado.');
    return this.prisma.bankStatement.update({
      where: { id: statementId },
      data: { status: 'FECHADO' },
    });
  }

  async reopenStatement(companyId: string, statementId: string) {
    const s = await this.prisma.bankStatement.findFirst({ where: { id: statementId, companyId } });
    if (!s) throw new NotFoundException('Fechamento não encontrado.');
    return this.prisma.bankStatement.update({
      where: { id: statementId },
      data: { status: 'ABERTO' },
    });
  }

  // =================================================================
  // ✏️ EDIÇÃO / MANUAL / EXCLUSÕES (Sprint 22)
  // =================================================================
  async updateTransaction(
    companyId: string,
    id: string,
    data: { description?: string; date?: string; amount?: number; nature?: string; learn?: boolean },
  ) {
    const t = await this.prisma.bankTransaction.findFirst({ where: { id, companyId } });
    if (!t) throw new NotFoundException('Transação não encontrada.');

    return this.prisma.$transaction(async (prisma) => {
      const rec = await prisma.bankTransaction.update({
        where: { id },
        data: {
          ...(data.description !== undefined
            ? { description: data.description, counterparty: this.extractCounterparty(data.description) }
            : {}),
          ...(data.date !== undefined ? { date: new Date(data.date + 'T12:00:00') } : {}),
          ...(data.amount !== undefined ? { amount: data.amount } : {}),
          ...(data.nature !== undefined ? { nature: data.nature, classifiedBy: 'MANUAL' } : {}),
        },
      });

      if (data.learn && data.nature && rec.counterparty) {
        await prisma.bankClassificationRule.upsert({
          where: { companyId_pattern: { companyId, pattern: rec.counterparty } },
          update: { nature: data.nature, hits: { increment: 1 } },
          create: { companyId, pattern: rec.counterparty, nature: data.nature },
        });
      }
      return rec;
    });
  }

  async createManual(
    companyId: string,
    clientId: string | null,
    payload: { year: number; month: number; date: string; description: string; amount: number; nature?: string },
  ) {
    return this.prisma.$transaction(async (tx) => {
      await this.ensureCategories(tx, companyId, clientId);
      let statement = await tx.bankStatement.findFirst({
        where: { companyId, clientId, year: payload.year, month: payload.month },
      });
      if (!statement) {
        statement = await tx.bankStatement.create({
          data: { companyId, clientId, year: payload.year, month: payload.month, fileName: 'lançamentos manuais' },
        });
      }
      if (statement.status === 'FECHADO') throw new BadRequestException('Mês FECHADO. Reabra para lançar.');

      const rec = await tx.bankTransaction.create({
        data: {
          statementId: statement.id,
          companyId,
          date: new Date(payload.date + 'T12:00:00'),
          description: payload.description,
          counterparty: this.extractCounterparty(payload.description),
          amount: payload.amount,
          nature: payload.nature || 'Não Classificado',
          classifiedBy: 'MANUAL',
        },
      });

      // 🆕 Sprint 22.3: lançamento manual com natureza também vira regra
      if (payload.nature && payload.nature !== 'Não Classificado' && rec.counterparty) {
        await tx.bankClassificationRule.upsert({
          where: { companyId_pattern: { companyId, pattern: rec.counterparty } },
          update: { nature: payload.nature, hits: { increment: 1 } },
          create: { companyId, pattern: rec.counterparty, nature: payload.nature },
        });
      }
      return rec;
    });
  }

  async deleteTransaction(companyId: string, id: string) {
    const t = await this.prisma.bankTransaction.findFirst({ where: { id, companyId } });
    if (!t) throw new NotFoundException('Transação não encontrada.');
    await this.prisma.bankTransaction.delete({ where: { id } });
    return { ok: true };
  }

  async deleteStatement(companyId: string, statementId: string) {
    const s = await this.prisma.bankStatement.findFirst({ where: { id: statementId, companyId } });
    if (!s) throw new NotFoundException('Fechamento não encontrado.');
    if (s.status === 'FECHADO') throw new BadRequestException('Mês FECHADO não pode ser excluído.');
    await this.prisma.bankTransaction.deleteMany({ where: { statementId } });
    await this.prisma.bankStatement.delete({ where: { id: statementId } });
    return { ok: true };
  }
    // =================================================================
  // ✏️ EDITAR CATEGORIA (Sprint 24.1)
  // =================================================================
  async updateCategory(
    companyId: string,
    categoryId: string,
    data: { label?: string; group?: string },
  ) {
    const cat = await this.prisma.bankCategory.findFirst({
      where: { id: categoryId, companyId },
    });
    if (!cat) throw new NotFoundException('Categoria não encontrada.');
    if (data.group && !DRE_GROUPS.includes(data.group as any)) {
      throw new BadRequestException('Grupo inválido.');
    }
    const newLabel = (data.label || '').trim();
    if (newLabel === '') {
      throw new BadRequestException('Informe o nome da categoria.');
    }

    // Proteção: se for renomear, não pode colidir com outra existente
    if (newLabel && newLabel !== cat.label) {
      const dup = await this.prisma.bankCategory.findFirst({
        where: { companyId, clientId: cat.clientId, label: newLabel, id: { not: categoryId } },
      });
      if (dup) throw new BadRequestException(`Já existe a categoria "${newLabel}".`);
    }

    return this.prisma.bankCategory.update({
      where: { id: categoryId },
      data: {
        ...(newLabel && newLabel !== cat.label ? { label: newLabel } : {}),
        ...(data.group ? { group: data.group } : {}),
      },
    });
  }

  // =================================================================
  // 🗑️ EXCLUIR CATEGORIA (Sprint 24.1)
  // =================================================================
  async deleteCategory(companyId: string, categoryId: string) {
    const cat = await this.prisma.bankCategory.findFirst({
      where: { id: categoryId, companyId },
    });
    if (!cat) throw new NotFoundException('Categoria não encontrada.');
    if (cat.isSystem) {
      throw new BadRequestException(
        'Categorias padrão (sistema) não podem ser excluídas. Use "Editar" para renomear.',
      );
    }

    // Verifica se há transações usando esta categoria
    const inUse = await this.prisma.bankTransaction.count({
      where: { companyId, nature: cat.label },
    });
    if (inUse > 0) {
      throw new BadRequestException(
        `A categoria "${cat.label}" está em uso em ${inUse} transação(ões). Reclassifique-as antes de excluir.`,
      );
    }

    await this.prisma.bankCategory.delete({ where: { id: categoryId } });
    return { ok: true };
  }
}