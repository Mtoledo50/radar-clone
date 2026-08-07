import { Injectable, BadRequestException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

/**
 * =================================================================
 * 📤 SpedService — Exportação de Inventário (Bloco H do SPED)
 * =================================================================
 * Gera o inventário físico de mercadorias na data-base (fim do mês)
 * por replay das movimentações do Kardex.
 *
 * 🆕 Sprint 8: Suporte a `clientId` para exportar inventário
 * segregado por cliente.
 *
 * 📐 Formatos suportados:
 * - SPED: pipe-delimited (H001|H005|H010|H990) — layout oficial
 * - CSV: separador ; com BOM UTF-8 (abre direto no Excel BR)
 *
 * ⚠️ O formato SPED tem layout fixo por lei — não é customizável.
 * =================================================================
 */
@Injectable()
export class SpedService {
  constructor(private readonly prisma: PrismaService) {}

  private round2(v: number): number {
    return Math.round((v + Number.EPSILON) * 100) / 100;
  }

  private num(v: any): number {
    const n = parseFloat(v);
    return isNaN(n) ? 0 : n;
  }

  private lastDay(year: number, month: number): Date {
    return new Date(year, month, 0, 23, 59, 59);
  }

  /**
   * Reconstrói o saldo de estoque na data-base (fim do mês)
   * replayando todas as movimentações do Kardex até a data.
   *
   * @param clientId - 🆕 Sprint 8: filtra movimentações por cliente
   *
   * 💡 Permite consultar inventários históricos (ex: dezembro/2022).
   */
  async getBlocoH(
    companyId: string,
    year: number,
    month: number,
    clientId?: string, // 🆕 Sprint 8
  ) {
    if (!month || month < 1 || month > 12) {
      throw new BadRequestException('Mês inválido. Use 1 a 12.');
    }

    const refDate = this.lastDay(year, month);

    const where: Prisma.FiscalInventoryMovementWhereInput = {
      companyId,
      date: { lte: refDate },
    };
    if (clientId) {
      where.clientId = clientId; // 🆕 Sprint 8
    }

    const movements = await this.prisma.fiscalInventoryMovement.findMany({
      where,
      orderBy: [{ date: 'asc' }, { createdAt: 'asc' }],
      include: {
        product: {
          select: {
            id: true,
            code: true,
            description: true,
            ncm: true,
            unit: true,
          },
        },
      },
    });

    const map = new Map<string, any>();
    for (const m of movements) {
      const cur = map.get(m.productId) || {
        qty: 0,
        avg: 0,
        product: m.product,
      };
      cur.qty += this.num(m.quantity);
      cur.avg = this.num(m.averageCostAfter);
      map.set(m.productId, cur);
    }

    const items = Array.from(map.values())
      .filter((e) => Math.abs(e.qty) > 0.000001)
      .map((e) => ({
        code: e.product.code,
        description: e.product.description,
        ncm: e.product.ncm,
        unit: e.product.unit,
        quantity: this.round2(e.qty),
        unitValue: e.avg,
        totalValue: this.round2(e.qty * e.avg),
      }))
      .sort((a, b) => a.code.localeCompare(b.code));

    const totalValue = this.round2(
      items.reduce((s, i) => s + i.totalValue, 0),
    );

    return {
      year,
      month,
      refDate: refDate.toISOString(),
      itemsCount: items.length,
      totalValue,
      items,
    };
  }

  /**
   * Gera o texto SPED pipe-delimited (layout oficial Receita Federal).
   * Registros: H001 (abertura), H005 (total), H010 (itens), H990 (fechamento).
   */
  buildSpedText(data: any): string {
    const d = new Date(data.refDate);
    const dtInv =
      String(d.getDate()).padStart(2, '0') +
      String(d.getMonth() + 1).padStart(2, '0') +
      d.getFullYear();

    const fmt = (v: number) => v.toFixed(2).replace('.', ',');
    const fmtQty = (v: number) => String(v).replace('.', ',');

    const lines: string[] = [];
    lines.push('|H001||0|');
    lines.push(`|H005|${dtInv}|${fmt(data.totalValue)}|01|`);

    for (const i of data.items) {
      lines.push(
        `|H010|${i.code}|${i.description}|${fmtQty(i.quantity)}|${i.unit}|${fmt(i.totalValue)}|`,
      );
    }

    lines.push(`|H990|${lines.length + 1}|`);
    return lines.join('\r\n');
  }

  /**
   * Gera CSV para Excel BR (separador ; e BOM UTF-8).
   * O BOM (\uFEFF) força o Excel a reconhecer UTF-8 ao abrir com duplo-clique.
   */
  buildCsv(data: any): string {
    const header =
      'Código;Descrição;NCM;Unidade;Quantidade;Valor Unitário;Valor Total';

    const rows = data.items.map((i: any) =>
      [
        i.code,
        i.description.replace(/;/g, ','),
        i.ncm,
        i.unit,
        String(i.quantity).replace('.', ','),
        String(i.unitValue).replace('.', ','),
        String(i.totalValue).replace('.', ','),
      ].join(';'),
    );

    return '\uFEFF' + [header, ...rows].join('\r\n');
  }
}