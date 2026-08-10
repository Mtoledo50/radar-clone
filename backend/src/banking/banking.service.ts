import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

/**
 * =================================================================
 * 🏦 BankingService — Fechamento Mensal (Sprint 21)
 * =================================================================
 * Importa extratos (CSV parseado no frontend), classifica cada
 * transação por natureza (motor de regras + memória de aprendizado)
 * e consolida o resumo no formato do DRE do escritório.
 *
 * 🧠 Motor de classificação (ordem de prioridade):
 *   1. Regras aprendidas (BankClassificationRule — revisões manuais)
 *   2. Regras built-in (palavras-chave: sócios, impostos, cartões...)
 *   3. Default pelo sinal (+ receita operacional / − despesa)
 *
 * 🛡️ Multi-tenant (companyId) + multi-cliente (clientId).
 * =================================================================
 */
type Nature =
  | 'RECEITA_OPERACIONAL'
  | 'RECEITA_FINANCEIRA'
  | 'DESPESA_OPERACIONAL'
  | 'IMPOSTO'
  | 'SOCIO'
  | 'NAO_CLASSIFICADO';

/** Normaliza: maiúsculas, sem acentos, pontuação → espaço */
const normalize = (s: string) =>
  (s || '')
    .toUpperCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^A-Z0-9]+/g, ' ')
    .trim();

/**
 * Regras built-in calibradas com os extratos reais do cliente Renan
 * (junho/julho 2026). Ordem importa: sócios e impostos primeiro.
 */
const BUILTIN_RULES: { match: string[]; nature: Nature }[] = [
  { match: ['RENAN LINS CARDOSO', 'PAULO RENATO ROSA CARDOSO'], nature: 'SOCIO' },
  { match: ['SIMPLES NACIONAL', 'RECEITA FEDERAL'], nature: 'IMPOSTO' },
  { match: ['RENDIMENTO'], nature: 'RECEITA_FINANCEIRA' },
  { match: ['VENDAS DISPONIVEL'], nature: 'RECEITA_OPERACIONAL' },
  {
    match: [
      'CEEE', 'CORSAN', 'CLARO', 'PROSISTEMAS', 'CONTA CERTA',
      'CONTABILIDADE', 'PERSONAL TRAINER', 'GOULARTE',
    ],
    nature: 'DESPESA_OPERACIONAL',
  },
];

/** Prefixos que o banco usa antes do nome da contraparte */
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

  /** Extrai a contraparte: "Pix enviado - CEEE" → "CEEE" */
  private extractCounterparty(description: string): string {
    const norm = normalize(description);
    for (const prefix of COUNTERPARTY_PREFIXES) {
      const p = normalize(prefix);
      if (norm.startsWith(p)) {
        return norm.slice(p.length).trim() || norm;
      }
    }
    return norm;
  }

  // =================================================================
  // 🧠 MOTOR DE CLASSIFICAÇÃO
  // =================================================================
  async classify(
    companyId: string,
    description: string,
  ): Promise<{ nature: Nature; classifiedBy: string }> {
    const norm = normalize(description);

    // 1) Regras aprendidas (memória das revisões)
    const learned = await this.prisma.bankClassificationRule.findMany({
      where: { companyId },
      orderBy: { hits: 'desc' },
    });
    for (const r of learned) {
      if (norm.includes(normalize(r.pattern))) {
        return { nature: r.nature as Nature, classifiedBy: 'AUTO' };
      }
    }

    // 2) Regras built-in
    for (const rule of BUILTIN_RULES) {
      for (const m of rule.match) {
        if (norm.includes(normalize(m))) {
          return { nature: rule.nature, classifiedBy: 'AUTO' };
        }
      }
    }

    // 3) Default pelo sinal (revisão humana ajusta depois)
    return { nature: 'NAO_CLASSIFICADO', classifiedBy: 'AUTO' };
  }

  // =================================================================
  // 📥 IMPORTAÇÃO DO EXTRATO (CSV parseado no frontend)
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
      // Upsert do statement (reimportação substitui mês ABERTO)
      let statement = await tx.bankStatement.findFirst({
        where: { companyId, clientId, year: payload.year, month: payload.month },
      });

      if (statement && statement.status === 'FECHADO') {
        throw new BadRequestException(
          'Este mês está FECHADO. Reabra o fechamento para reimportar.',
        );
      }

      if (statement) {
        await tx.bankTransaction.deleteMany({ where: { statementId: statement.id } });
      } else {
        statement = await tx.bankStatement.create({
          data: {
            companyId,
            clientId,
            year: payload.year,
            month: payload.month,
            fileName: payload.fileName,
          },
        });
      }

      // Classifica e grava cada transação
      let autoClassified = 0;
      for (const row of payload.rows) {
        const { nature, classifiedBy } = await this.classify(
          companyId,
          row.description,
        );
        if (nature !== 'NAO_CLASSIFICADO') autoClassified++;

        await tx.bankTransaction.create({
          data: {
            statementId: statement.id,
            companyId,
            date: new Date(row.date),
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
  // 📊 CONSULTA DO FECHAMENTO (transações + resumo tipo DRE)
  // =================================================================
  async getStatement(
    companyId: string,
    clientId: string | null,
    year: number,
    month: number,
  ) {
    const statement = await this.prisma.bankStatement.findFirst({
      where: { companyId, clientId, year, month },
      include: {
        transactions: { orderBy: { date: 'asc' } },
      },
    });

    if (!statement) {
      return { statement: null, transactions: [], summary: this.emptySummary() };
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
      summary: this.buildSummary(txs),
    };
  }

  /** Resumo no formato do DRE do escritório (espelha a planilha atual) */
  private buildSummary(txs: { amount: number; nature: string }[]) {
    const sum = (nature: string) =>
      this.round2(
        txs.filter((t) => t.nature === nature).reduce((s, t) => s + t.amount, 0),
      );

    const receitaOperacional = sum('RECEITA_OPERACIONAL');
    const receitaFinanceira = sum('RECEITA_FINANCEIRA');
    const despesaOperacional = sum('DESPESA_OPERACIONAL'); // valor negativo
    const impostos = sum('IMPOSTO'); // valor negativo
    const socioEnviado = this.round2(
      txs
        .filter((t) => t.nature === 'SOCIO' && t.amount < 0)
        .reduce((s, t) => s + t.amount, 0),
    );
    const socioRecebido = this.round2(
      txs
        .filter((t) => t.nature === 'SOCIO' && t.amount > 0)
        .reduce((s, t) => s + t.amount, 0),
    );

    return {
      receitaOperacional,
      receitaFinanceira,
      despesaOperacional,
      impostos,
      socioEnviado,
      socioRecebido,
      saldoSocio: this.round2(socioRecebido + socioEnviado),
      // Resultado do DRE (sócio NÃO entra)
      resultadoLiquido: this.round2(
        receitaOperacional + receitaFinanceira + despesaOperacional + impostos,
      ),
      pendentes: txs.filter((t) => t.nature === 'NAO_CLASSIFICADO').length,
    };
  }

  private emptySummary() {
    return {
      receitaOperacional: 0,
      receitaFinanceira: 0,
      despesaOperacional: 0,
      impostos: 0,
      socioEnviado: 0,
      socioRecebido: 0,
      saldoSocio: 0,
      resultadoLiquido: 0,
      pendentes: 0,
    };
  }

  // =================================================================
  // ✏️ REVISÃO MANUAL + APRENDIZADO (Sprint 22/23)
  // =================================================================
  /**
   * Reclassifica uma transação. Se learn=true, grava a contraparte
   * como regra aprendida (memória) para classificar sozinha no futuro.
   */
  async reclassify(
    companyId: string,
    transactionId: string,
    nature: Nature,
    learn: boolean,
  ) {
    const tx = await this.prisma.bankTransaction.findFirst({
      where: { id: transactionId, companyId },
    });
    if (!tx) throw new NotFoundException('Transação não encontrada.');

    await this.prisma.$transaction(async (prisma) => {
      await prisma.bankTransaction.update({
        where: { id: transactionId },
        data: { nature, classifiedBy: 'MANUAL' },
      });

      if (learn && tx.counterparty) {
        await prisma.bankClassificationRule.upsert({
          where: {
            companyId_pattern: { companyId, pattern: tx.counterparty },
          },
          update: { nature, hits: { increment: 1 } },
          create: { companyId, pattern: tx.counterparty, nature },
        });
      }
    });

    return { ok: true };
  }
}