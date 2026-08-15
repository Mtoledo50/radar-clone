// =================================================================
// INÍCIO: backend/src/digital-employee/audit/automation-audit.service.ts
// =================================================================
// AutomationAuditService — Trilha de compliance da Aurora (Pilar D).
//
// 100% das ações da Aurora (e do humano revisando) são registradas aqui.
// É o "histórico de trabalho" auditável — exigência fiscal contábil.
//
// Regra: NENHUMA ação de side-effect da Aurora deve acontecer sem
// uma chamada correspondente a este serviço.
// =================================================================
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export interface AuditInput {
  companyId: string;
  actor?: string;              // 'AURORA' | 'USER_<id>'
  action: string;              // ex.: 'AUTO_RECONCILED', 'USER_APPROVED'
  entity: string;              // ex.: 'BankNfeMatch', 'AutomationPending'
  entityId: string;
  detail?: Record<string, any>;
  robotVersion?: string;
  ip?: string;
}

@Injectable()
export class AutomationAuditService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Registra uma ação na trilha de auditoria.
   * Fire-and-forget (não lança exceção se falhar — nunca deve
   * interromper o fluxo principal da skill).
   */
  async log(input: AuditInput): Promise<void> {
    try {
      await this.prisma.automationAudit.create({
        data: {
          companyId: input.companyId,
          actor: input.actor || 'AURORA',
          action: input.action,
          entity: input.entity,
          entityId: input.entityId,
          detail: input.detail || undefined,
          robotVersion: input.robotVersion || '1.0.0',
          ip: input.ip || undefined,
        },
      });
    } catch (error) {
      // Log de falha de auditoria nunca deve quebrar a skill
      console.error('[AutomationAudit] falha ao registrar:', error?.message);
    }
  }
}
// =================================================================
// FIM: automation-audit.service.ts
// =================================================================