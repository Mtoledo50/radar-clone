// =================================================================
// INÍCIO: backend/src/digital-employee/skills/base.skill.ts
// =================================================================
// BaseSkill — Classe abstrata que define o "esqueleto" do pipeline
// universal (Pilar B). Toda skill concreta herda daqui.
//
// Pipeline (Template Method):
//   COLETAR → INTERPRETAR → CRUZAR → APONTAR DIVERGÊNCIAS
//     → 🟡 FILA DE REVISÃO (se score < 80% ou LEGAL)
//     → EXECUTAR → REGISTRAR (auditoria) → REPORTAR
//
// Benefício: júnior nunca esquece um passo; cada skill implementa
// só os verbos específicos dela.
// =================================================================
import { PrismaService } from '../../prisma/prisma.service';
import { AutomationAuditService } from '../audit/automation-audit.service';
import { SkillKey } from '@prisma/client';

/**
 * Resultado padronizado que toda skill deve retornar.
 * O job-runner usa isso para popular AutomationRun.
 */
export interface SkillResult {
  itemsProcessed: number;
  itemsAutoApproved: number;   // score ≥ 80%
  itemsPendingHuman: number;   // 50-79% ou LEGAL → fila
  itemsFailed: number;
  secondsSaved: number;        // métrica de marketing
  detail?: Record<string, any>;
}

/**
 * Contexto passado para cada skill.
 * Contém tudo que a skill precisa saber sobre quem e o quê executar.
 */
export interface SkillContext {
  companyId: string;
  skillKey: SkillKey;
  runId: string;
  triggeredBy: string;         // 'SYSTEM' ou userId
  params: Record<string, any>; // parâmetros específicos da skill
}

/**
 * Classe abstrata — todas as skills herdam dela.
 * Garante que toda skill tenha o mesmo "contrato" de execução.
 */
export abstract class BaseSkill {
  constructor(
    protected readonly prisma: PrismaService,
    protected readonly audit: AutomationAuditService,
  ) {}

  /**
   * Retorna a chave única desta skill (usada para registro no orquestrador).
   */
  abstract readonly key: SkillKey;

  /**
   * Tempo estimado (em segundos) que UM item desta skill economiza.
   * Usado para calcular secondsSaved (métrica de marketing).
   */
  abstract readonly secondsPerItem: number;

  /**
   * Método principal — cada skill implementa sua lógica aqui.
   * O job-runner chama isso dentro de um try/catch.
   */
  abstract execute(context: SkillContext): Promise<SkillResult>;

  /**
   * Helper: registra auditoria com a identificação da skill.
   */
  protected async logAudit(
    companyId: string,
    action: string,
    entity: string,
    entityId: string,
    detail?: Record<string, any>,
  ): Promise<void> {
    await this.audit.log({
      companyId,
      actor: 'AURORA',
      action: `${this.key}:${action}`,
      entity,
      entityId,
      detail,
      robotVersion: '1.0.0',
    });
  }
}
// =================================================================
// FIM: base.skill.ts
// =================================================================