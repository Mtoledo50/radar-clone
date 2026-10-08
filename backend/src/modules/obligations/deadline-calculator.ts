import { ObligationRecurrenceType, ObligationDeadlinePolicy, ObligationDayType } from '@prisma/client';

interface RuleInput {
  month: number;              // 1-12
  year: number;               // ex.: 2026
  recurrenceType: ObligationRecurrenceType;
  dayOfMonth?: number | null;
  businessDayNumber?: number | null;
  saturdayIsBusinessDay: boolean;
  deadlinePolicy: ObligationDeadlinePolicy;
}

interface DeadlineResult {
  dueDate: Date;              // Data exata de vencimento
  reminderDate: Date;         // Data do lembrete (calculada separadamente)
  competenceMonth: number;    // Mês de competência (pode ser anterior/seguinte)
  competenceYear: number;
}

/**
 * Calcula o próximo dia útil após uma data base.
 * Considera sábados/domigos e, opcionalmente, sábados como úteis.
 * ⚠️ Feriados nacionais/municipais devem ser injetados via serviço externo (futuro FD-8).
 */
function getNextBusinessDay(date: Date, saturdayIsBusinessDay: boolean): Date {
  const d = new Date(date);
  while (true) {
    const dayOfWeek = d.getDay(); // 0=Dom, 6=Sáb
    const isWeekend = dayOfWeek === 0 || (!saturdayIsBusinessDay && dayOfWeek === 6);
    
    // TODO: Injetar lista de feriados aqui (ex.: via API do BrasilAPI ou tabela local)
    // const isHoliday = holidays.includes(d.toISOString().split('T')[0]);
    const isHoliday = false; // Placeholder

    if (!isWeekend && !isHoliday) return d;
    d.setDate(d.getDate() + 1);
  }
}

/**
 * Calcula o dia útil anterior a uma data base.
 */
function getPreviousBusinessDay(date: Date, saturdayIsBusinessDay: boolean): Date {
  const d = new Date(date);
  while (true) {
    d.setDate(d.getDate() - 1);
    const dayOfWeek = d.getDay();
    const isWeekend = dayOfWeek === 0 || (!saturdayIsBusinessDay && dayOfWeek === 6);
    const isHoliday = false; // Placeholder

    if (!isWeekend && !isHoliday) return d;
  }
}

/**
 * Conta quantos dias úteis existem até uma data alvo em um mês.
 */
function countBusinessDaysInMonth(year: number, month: number, saturdayIsBusinessDay: boolean): number {
  let count = 0;
  const daysInMonth = new Date(year, month, 0).getDate();
  
  for (let day = 1; day <= daysInMonth; day++) {
    const d = new Date(year, month - 1, day);
    const dayOfWeek = d.getDay();
    const isWeekend = dayOfWeek === 0 || (!saturdayIsBusinessDay && dayOfWeek === 6);
    if (!isWeekend) count++; // Ignora feriados por enquanto
  }
  return count;
}

/**
 * Encontra o N-ésimo dia útil de um mês.
 */
function getNthBusinessDay(year: number, month: number, n: number, saturdayIsBusinessDay: boolean): Date {
  let count = 0;
  const daysInMonth = new Date(year, month, 0).getDate();
  
  for (let day = 1; day <= daysInMonth; day++) {
    const d = new Date(year, month - 1, day);
    const dayOfWeek = d.getDay();
    const isWeekend = dayOfWeek === 0 || (!saturdayIsBusinessDay && dayOfWeek === 6);
    
    if (!isWeekend) {
      count++;
      if (count === n) return d;
    }
  }
  throw new Error(`Não foi possível encontrar o ${n}º dia útil no mês ${month}/${year}`);
}

/**
 * Calcula a data de vencimento e lembrete para uma regra mensal específica.
 */
export function calculateDeadline(rule: RuleInput, reminderDaysBefore: number, reminderDayType: ObligationDayType): DeadlineResult {
  const { month, year, recurrenceType, dayOfMonth, businessDayNumber, saturdayIsBusinessDay, deadlinePolicy } = rule;
  
  let rawDueDate: Date;

  switch (recurrenceType) {
    case 'FIXED_DAY_OF_MONTH':
      if (!dayOfMonth) throw new Error('dayOfMonth é obrigatório para FIXED_DAY_OF_MONTH');
      rawDueDate = new Date(year, month - 1, dayOfMonth);
      break;
      
    case 'FIRST_BUSINESS_DAY':
      rawDueDate = getNthBusinessDay(year, month, 1, saturdayIsBusinessDay);
      break;
      
    case 'NTH_BUSINESS_DAY':
      if (!businessDayNumber) throw new Error('businessDayNumber é obrigatório para NTH_BUSINESS_DAY');
      rawDueDate = getNthBusinessDay(year, month, businessDayNumber, saturdayIsBusinessDay);
      break;
      
    case 'LAST_BUSINESS_DAY':
      const totalBizDays = countBusinessDaysInMonth(year, month, saturdayIsBusinessDay);
      rawDueDate = getNthBusinessDay(year, month, totalBizDays, saturdayIsBusinessDay);
      break;
      
    case 'NOT_APPLICABLE':
      // Obrigações eventuais não têm recorrência mensal fixa. 
      // Retornamos null ou lançamos erro dependendo da estratégia.
      // Por enquanto, retornamos uma data inválida para sinalizar que não deve gerar tarefa automática.
      return {
        dueDate: new Date(0),
        reminderDate: new Date(0),
        competenceMonth: month,
        competenceYear: year,
      };
      
    default:
      throw new Error(`Tipo de recorrência não suportado: ${recurrenceType}`);
  }

  // Aplica política de ajuste se cair em fim-de-semana/feriado
  let adjustedDueDate = new Date(rawDueDate);
  const dayOfWeek = adjustedDueDate.getDay();
  const isWeekend = dayOfWeek === 0 || (!saturdayIsBusinessDay && dayOfWeek === 6);
  const isHoliday = false; // Placeholder

  if (isWeekend || isHoliday) {
    if (deadlinePolicy === 'ANTECIPATE_PREVIOUS_BUSINESS_DAY') {
      adjustedDueDate = getPreviousBusinessDay(rawDueDate, saturdayIsBusinessDay);
    } else if (deadlinePolicy === 'POSTPONE_NEXT_BUSINESS_DAY') {
      adjustedDueDate = getNextBusinessDay(rawDueDate, saturdayIsBusinessDay);
    }
  }

  // Calcula data do lembrete
  let reminderDate = new Date(adjustedDueDate);
  if (reminderDayType === 'BUSINESS_DAY') {
    for (let i = 0; i < reminderDaysBefore; i++) {
      reminderDate = getPreviousBusinessDay(reminderDate, saturdayIsBusinessDay);
    }
  } else {
    reminderDate.setDate(reminderDate.getDate() - reminderDaysBefore);
  }

  // Determina competência (mês de referência)
  let competenceMonth = month;
  let competenceYear = year;
  
  // A lógica de competência depende do tipo definido na obrigação (PREVIOUS_MONTH, etc.)
  // Isso será passado como parâmetro separado no service.
  
  return {
    dueDate: adjustedDueDate,
    reminderDate,
    competenceMonth,
    competenceYear,
  };
}