import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

/**
 * =================================================================
 * 📤 SpedService — Exportação de Inventário (Bloco H do SPED)
 * =================================================================
 * Reconstrói o saldo de estoque em uma data-base (fim do mês)
 * replayando as movimentações do Kardex até a data.
 *
 * 📐 Formatos:
 * - SPED: pipe-delimited (|H001|, |H005|, |H010|, |H990|)
 * - CSV: ponto e vírgula + BOM UTF-8 (Excel BR)
 *
 * ⚠️ Layout mínimo H001/H005/H010 — validar no PVA antes de transmitir
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

  /** Último dia do mês (data-base do inventário) */
  private lastDay(year: number, month: number): Date {
    return new Date(year, month, 0, 23, 59, 59);
  }

  // ---------------------------------------------------------------
  // 📦 INVENTÁRIO NA DATA-BASE (replay do Kardex)
  // ---------------------------------------------------------------
  async getBlocoH(companyId: string, year: number, month: number) {
    if (!month || month < 1 || month > 12) {
      throw new BadRequestException('Mês inválido. Use 1 a 12.');
    }

    const refDate = this.lastDay(year, month);

    // Todas as movimentações até a data-base (ordem cronológica)
    const movements = await this.prisma.fiscalInventoryMovement.findMany({
      where: { companyId, date: { lte: refDate } },
      orderBy: [{ date: 'asc' }, { createdAt: 'asc' }],
      include: {
        product: {
          select: { id: true, code: true, description: true, ncm: true, unit: true },
        },
      },
    });

    // Agrupa por produto: soma quantidades e guarda último custo médio
    const map = new Map<string, any>();
    for (const m of movements) {
      const cur = map.get(m.productId) || { qty: 0, avg: 0, product: m.product };
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

    const totalValue = this.round2(items.reduce((s, i) => s + i.totalValue, 0));

    return {
      year,
      month,
      refDate: refDate.toISOString(),
      itemsCount: items.length,
      totalValue,
      items,
    };
  }

  // ---------------------------------------------------------------
  // 📄 TEXTO SPED (pipe-delimited)
  // ---------------------------------------------------------------
  buildSpedText(data: any): string {
    const d = new Date(data.refDate);
    const dtInv =
      String(d.getDate()).padStart(2, '0') +
      String(d.getMonth() + 1).padStart(2, '0') +
      d.getFullYear();

    const fmt = (v: number) => v.toFixed(2).replace('.', ',');
    const fmtQty = (v: number) => String(v).replace('.', ',');

    const lines: string[] = [];
    lines.push('|H001||0|'); // Abertura do Bloco H (com dados)
    lines.push(`|H005|${dtInv}|${fmt(data.totalValue)}|01|`); // Total do inventário

    for (const i of data.items) {
      // H010: item do inventário (campos obrigatórios)
      lines.push(
        `|H010|${i.code}|${i.description}|${fmtQty(i.quantity)}|${i.unit}|${fmt(i.totalValue)}|`,
      );
    }

    lines.push(`|H990|${lines.length + 1}|`); // Encerramento do bloco
    return lines.join('\r\n');
  }

  // ---------------------------------------------------------------
  // 📊 CSV PARA EXCEL (separador ;)
  // ---------------------------------------------------------------
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

    // BOM UTF-8 para acentos corretos no Excel
    return '\uFEFF' + [header, ...rows].join('\r\n');
  }
}