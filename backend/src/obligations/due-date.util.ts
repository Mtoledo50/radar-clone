/**
 * ============================================================================
 * 📅 MOTOR DE VENCIMENTO DE OBRIGAÇÕES — Sprint OB-7 (domínio puro)
 * ============================================================================
 * Calcula a data de vencimento de uma obrigação em um mês/ano, respeitando:
 *  - deliveryDays        → '0' NA | '1'..'31' fixo | 'ultimo' | '1u'..'5u' | 'ultimou'
 *  - deliveryDayType     → fixed | business (informativo; o valor já diz o tipo)
 *  - nonBusinessDayAction→ antecipar | postergar | manter (p/ dia fixo cair em não-útil)
 *  - saturdayIsBusinessDay
 * Futuro: tabela de feriados por tenant (hoje: só fins de semana).
 * ============================================================================
 */

export interface DueDateConfig {
  deliveryDays?: Record<string, string>;
  deliveryDayType?: 'fixed' | 'business';
  nonBusinessDayAction?: 'antecipar' | 'postergar' | 'manter';
  saturdayIsBusinessDay?: boolean;
  competenceRef?: 'mes-atual' | 'mes-anterior' | 'mes-seguinte';
}

export const MONTH_KEYS = ['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez'];

const addDays = (d: Date, n: number): Date => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };

/** Dia útil = seg-sex (ou seg-sáb se saturdayIsBusinessDay). Feriados: fase 2. */
export function isBusinessDay(d: Date, saturdayIsBusinessDay = false): boolean {
  const dow = d.getDay();
  if (dow === 0) return false;
  if (dow === 6) return !!saturdayIsBusinessDay;
  return true;
}

/** Desloca p/ dia útil conforme ação (antecipar/postergar/manter). */
function shiftToBusiness(d: Date, action: string, saturday: boolean): Date {
  if (action === 'manter' || isBusinessDay(d, saturday)) return d;
  const step = action === 'antecipar' ? -1 : 1;
  let x = addDays(d, step);
  while (!isBusinessDay(x, saturday)) x = addDays(x, step);
  return x;
}

/** N-ésimo dia útil do mês (1u..5u). */
function nthBusinessDay(year: number, monthIdx: number, n: number, saturday: boolean): Date {
  const last = new Date(year, monthIdx + 1, 0);
  let count = 0;
  let d = new Date(year, monthIdx, 1);
  while (d <= last) {
    if (isBusinessDay(d, saturday) && ++count === n) return d;
    d = addDays(d, 1);
  }
  return last; // fallback defensivo
}

/** Último dia útil do mês (ultimou). */
function lastBusinessDay(year: number, monthIdx: number, saturday: boolean): Date {
  let d = new Date(year, monthIdx + 1, 0);
  while (!isBusinessDay(d, saturday)) d = addDays(d, -1);
  return d;
}

/**
 * 🎯 Vencimento da entrega do mês/ano informados (monthIdx 0-11).
 * Retorna null quando o mês está "Não se aplica" ('0').
 */
export function getDueDate(cfg: DueDateConfig, year: number, monthIdx: number): Date | null {
  const raw = cfg.deliveryDays?.[MONTH_KEYS[monthIdx]];
  if (!raw || raw === '0') return null;

  const saturday = !!cfg.saturdayIsBusinessDay;

  // Dias úteis ordinais: 1u..5u / ultimou
  if (/^\d+u$/i.test(raw)) return nthBusinessDay(year, monthIdx, parseInt(raw, 10), saturday);
  if (raw.toLowerCase() === 'ultimou') return lastBusinessDay(year, monthIdx, saturday);

  // Dia fixo: 1..31 ou 'ultimo' (com clamp p/ meses curtos, ex: 31 → 28/fev)
  const lastDay = new Date(year, monthIdx + 1, 0).getDate();
  const day = raw.toLowerCase() === 'ultimo'
    ? lastDay
    : Math.min(lastDay, Math.max(1, parseInt(raw, 10) || 1));

  return shiftToBusiness(new Date(year, monthIdx, day), cfg.nonBusinessDayAction || 'antecipar', saturday);
}

/** Competência a que a entrega do mês se refere (ex: entrega out/26 → comp 09/26). */
export function competenceLabel(cfg: DueDateConfig, year: number, monthIdx: number): string {
  const d = new Date(year, monthIdx, 1);
  const ref = cfg.competenceRef || 'mes-anterior';
  if (ref === 'mes-anterior') d.setMonth(d.getMonth() - 1);
  if (ref === 'mes-seguinte') d.setMonth(d.getMonth() + 1);
  return `${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
}

export type DueStatus = 'NA' | 'CUMPRIDA' | 'CANCELADA' | 'ATRASADA' | 'VENCE_HOJE' | 'FUTURA';

/** Situação visual da linha: cruza vencimento × status × hoje. */
export function dueStatus(due: Date | null, status: string, now = new Date()): DueStatus {
  if (!due) return 'NA';
  if (status === 'ENVIADO') return 'CUMPRIDA';
  if (status === 'CANCELADO') return 'CANCELADA';
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const d = new Date(due.getFullYear(), due.getMonth(), due.getDate());
  if (d.getTime() === today.getTime()) return 'VENCE_HOJE';
  return d < today ? 'ATRASADA' : 'FUTURA';
}

export const fmtDate = (d: Date | null): string =>
  d ? d.toLocaleDateString('pt-BR') : '—';