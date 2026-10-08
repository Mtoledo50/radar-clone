import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { calculateDeadline } from './deadline-calculator';
import { ObligationCompetence, TaskCategory, TaskStatus, TaskPriority } from '@prisma/client';

@Injectable()
export class ObligationSchedulerService {
  private readonly logger = new Logger(ObligationSchedulerService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Gera tarefas para todas as obrigações ativas do tenant para um mês/ano específico.
   */
  async generateTasksForMonth(companyId: string, targetYear: number, targetMonth: number): Promise<void> {
    this.logger.log(`Gerando tarefas para ${companyId} em ${targetMonth}/${targetYear}...`);

    const obligations = await this.prisma.obligation.findMany({
      where: {
        companyId,
        active: true,
        responsibleId: { not: null },
      },
      include: {
        rules: { where: { month: targetMonth, active: true } },
        responsible: true,
      },
    });

    let created = 0;
    let updated = 0;

    for (const obligation of obligations) {
      if (obligation.rules.length === 0) continue;

      const rule = obligation.rules[0];
      
      // Calcula competência real
      let compMonth = targetMonth;
      let compYear = targetYear;
      
      if (obligation.competence === ObligationCompetence.PREVIOUS_MONTH) {
        compMonth = targetMonth === 1 ? 12 : targetMonth - 1;
        compYear = targetMonth === 1 ? targetYear - 1 : targetYear;
      } else if (obligation.competence === ObligationCompetence.NEXT_MONTH) {
        compMonth = targetMonth === 12 ? 1 : targetMonth + 1;
        compYear = targetMonth === 12 ? targetYear + 1 : targetYear;
      } else if (obligation.competence === ObligationCompetence.PREVIOUS_YEAR) {
        compYear = targetYear - 1;
      }

      // Usa a função pura do deadline-calculator
      const { dueDate, reminderDate } = calculateDeadline(
        {
          month: targetMonth,
          year: targetYear,
          recurrenceType: rule.recurrenceType,
          dayOfMonth: rule.dayOfMonth,
          businessDayNumber: rule.businessDayNumber,
          saturdayIsBusinessDay: obligation.saturdayIsBusinessDay,
          deadlinePolicy: obligation.deadlinePolicy,
        },
        obligation.reminderDaysBefore,
        obligation.reminderDayType,
      );

      // Verifica existência para idempotência
      const existingTask = await this.prisma.task.findFirst({
        where: {
          companyId,
          title: { contains: obligation.name },
          dueDate: {
            gte: new Date(targetYear, targetMonth - 1, 1),
            lt: new Date(targetYear, targetMonth, 1),
          },
          assigneeId: obligation.responsibleId!,
        },
      });

      // Prepara os dados usando apenas IDs escalares para evitar conflitos de relação
      const taskData = {
        companyId, // ID direto da empresa
        title: `${obligation.name} - ${compMonth.toString().padStart(2, '0')}/${compYear}`,
        description: obligation.notes || undefined,
        status: TaskStatus.TODO, // Usa o Enum importado
        priority: TaskPriority.HIGH, // Usa o Enum importado
        category: this.mapDepartmentToCategory(obligation.departmentName),
        assigneeId: obligation.responsibleId!, // ID direto do usuário
        dueDate,
        startDate: reminderDate,
        estimatedHours: 1.0,
        // Se houver clientId na obrigação, adicione aqui: clientId: obligation.clientId
      };

      if (existingTask) {
        await this.prisma.task.update({
          where: { id: existingTask.id },
          data: { 
            dueDate, 
            startDate: reminderDate, 
            updatedAt: new Date() 
          },
        });
        updated++;
      } else {
        // Usa create sem incluir relações aninhadas para evitar o erro 'never'
        await this.prisma.task.create({ 
          data: taskData as any // Cast temporário se o erro persistir devido a complexidade do XOR do Prisma v5
        });
        created++;
      }
    }

    this.logger.log(`Concluído: ${created} criadas, ${updated} atualizadas.`);
  }

  private mapDepartmentToCategory(dept: string | null): TaskCategory {
    if (!dept) return 'OUTRO';
    const lower = dept.toLowerCase();
    if (lower.includes('fiscal')) return 'FISCAL';
    if (lower.includes('contábil') || lower.includes('contabil')) return 'CONTABIL';
    if (lower.includes('pessoal') || lower.includes('dp')) return 'DEPARTAMENTO_PESSOAL';
    if (lower.includes('financeiro')) return 'FINANCEIRO';
    return 'OUTRO';
  }

  /**
   * Trigger manual para testes ou reprocessamento.
   */
  async runManualTrigger(companyId: string) {
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();
    
    await this.generateTasksForMonth(companyId, currentYear, currentMonth);
    
    // Agenda também o próximo mês se estivermos no final do atual
    if (currentMonth === 12) {
      await this.generateTasksForMonth(companyId, currentYear + 1, 1);
    } else {
      await this.generateTasksForMonth(companyId, currentYear, currentMonth + 1);
    }
  }
}