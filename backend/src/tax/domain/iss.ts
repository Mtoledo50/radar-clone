// =================================================================
// INÍCIO: backend/src/tax/domain/iss.ts
// =================================================================
// Motor de cálculo de ISS a partir das NFS-e importadas (FD-3a).
//
// Regras:
//   - ISS PRÓPRIO: NFS-e sem retenção → escritório/cliente recolhe
//   - ISS RETIDO:  NFS-e com issRetened=true → tomador já recolheu
//     (não gera guia, mas entra na memória p/ conferência)
//   - NFS-e com alíquota 0 e sem retenção → warning 🟡 (revisar)
//
// Domínio PURO (padrão Sprint A1) + round2 (ADR-020).
// =================================================================
import { round2 } from './simples-nacional';

/** Entrada mínima vinda da NFS-e */
export interface NfseIssInput {
  id: string;
  number: string;
  issBase: number;      /// Base de cálculo (R$)
  issRate: number;      /// Alíquota (%)
  issRetained: boolean; /// ISS retido pelo tomador?
}

/** Resultado com memória auditável */
export interface IssCalcResult {
  baseTotal: number;      /// Soma das bases (R$)
  issPayable: number;     /// ISS próprio a recolher (R$)
  issRetainedTotal: number; /// ISS já retido pelo tomador (R$)
  count: number;          /// NFS-e consideradas
  warnings: string[];     /// Alertas 🟡 (ex.: alíquota 0 sem retenção)
  sources: string[];      /// ids das NFS-e usadas
  steps: string[];        /// Memória de cálculo
  lawRef: string;
}

/**
 * Calcula o ISS do período a partir das NFS-e emitidas.
 */
export function calcIss(nfses: NfseIssInput[]): IssCalcResult {
  let issPayable = 0;
  let issRetainedTotal = 0;
  let baseTotal = 0;
  const warnings: string[] = [];
  const sources: string[] = [];
  const details: string[] = [];

  for (const n of nfses) {
    const value = round2(n.issBase * (n.issRate / 100));
    baseTotal = round2(baseTotal + n.issBase);
    sources.push(n.id);

    if (n.issRetained) {
      // Tomador reteve: não gera guia, mas registra na memória
      issRetainedTotal = round2(issRetainedTotal + value);
      details.push(`NFS-e ${n.number}: R$ ${value.toFixed(2)} RETIDO pelo tomador`);
    } else {
      // ISS próprio a recolher
      issPayable = round2(issPayable + value);
      details.push(`NFS-e ${n.number}: R$ ${value.toFixed(2)} próprio (${n.issRate}%)`);
      if (n.issRate <= 0) {
        warnings.push(`NFS-e ${n.number} com alíquota 0 e sem retenção — revisar`);
      }
    }
  }

  const steps = [
    `NFS-e consideradas: ${nfses.length} | Base total: R$ ${baseTotal.toFixed(2)}`,
    ...details,
    `ISS próprio a recolher = R$ ${issPayable.toFixed(2)}`,
    `ISS retido por tomadores = R$ ${issRetainedTotal.toFixed(2)} (não gera guia)`,
  ];

  return {
    baseTotal,
    issPayable,
    issRetainedTotal,
    count: nfses.length,
    warnings,
    sources,
    steps,
    lawRef: 'ISS municipal (LC 116/2003)',
  };
}
// =================================================================
// FIM: iss.ts
// =================================================================