// =================================================================
// INÍCIO: outlier.service.ts
// =================================================================
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class OutlierService {
  constructor(private prisma: PrismaService) {}

  // =================================================================
  // INÍCIO: Método detectOutliers
  // =================================================================
  async detectOutliers(clientId: string) {
    const entries = await this.prisma.accountingEntry.findMany({
      where: { clientId },
    });

    // ✅ CORREÇÃO: Converter Decimal para Number ANTES de comparar
    const values = entries.map(e => {
      const debitVal = Number(e.debitValue);
      const creditVal = Number(e.creditValue);
      return debitVal > 0 ? debitVal : creditVal;
    });

    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const stdDev = Math.sqrt(values.map(v => Math.pow(v - mean, 2)).reduce((a, b) => a + b, 0) / values.length);
    const threshold = mean + (2 * stdDev); // 2 desvios padrão

    const outliers = entries.filter(e => {
      // ✅ CORREÇÃO: Converter Decimal para Number ANTES de comparar
      const debitVal = Number(e.debitValue);
      const creditVal = Number(e.creditValue);
      const value = debitVal > 0 ? debitVal : creditVal;
      return value > threshold;
    }).map(e => {
      // ✅ CORREÇÃO: Converter Decimal para Number ANTES de usar
      const debitVal = Number(e.debitValue);
      const creditVal = Number(e.creditValue);
      const value = debitVal > 0 ? debitVal : creditVal;
      
      return {
        id: e.id,
        description: e.description,
        date: e.entryDate,
        value: value,
        deviation: ((value - mean) / mean * 100).toFixed(2),
      };
    });

    return outliers;
  }
  // =================================================================
  // FIM: Método detectOutliers
  // =================================================================
}
// =================================================================
// FIM: outlier.service.ts
// =================================================================