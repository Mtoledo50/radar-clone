// =================================================================
// INÍCIO: backend/src/digital-employee/skills/nfse-email-collect.skill.ts
// =================================================================
// NfseEmailCollectSkill — FD-3b: coleta NFS-e da caixa de e-mail
//
// Fluxo (ADR-037 — origem é atributo, não arquitetura):
//   1) Lê config IMAP do .env (ADR-032: nunca hardcoded)
//   2) Se não configurada → SKIP gracioso (não quebra o cron)
//   3) COLETAR: anexos .xml UNSEEN → uploads/nfse-inbox/ + marca SEEN
//   4) Se coletou ≥1 → dispara NfseImportSkill inline (mesmo canal)
//
// Cron sugerido: */30 * * * * (a cada 30 min)
// =================================================================
import { PrismaService } from '../../prisma/prisma.service';
import { AutomationAuditService } from '../audit/automation-audit.service';
import { BaseSkill, SkillContext, SkillResult } from './base.skill';
import { SkillKey } from '@prisma/client';
import { EmailCollectorService } from '../../fiscal/nfse/email-collector.service';
import { NfseImportSkill } from './nfse-import.skill';

/** ~2 min de triagem manual de e-mail economizada por XML */
const SECONDS_PER_ITEM = 120;

export class NfseEmailCollectSkill extends BaseSkill {
  readonly key: SkillKey = 'NFSE_EMAIL_COLLECT';
  readonly secondsPerItem = SECONDS_PER_ITEM;

  /** Collector puro (sem DI — instância direta) */
  private readonly collector = new EmailCollectorService();

  constructor(
    prisma: PrismaService,
    audit: AutomationAuditService,
    private readonly importSkill: NfseImportSkill,
  ) {
    super(prisma, audit);
  }

  // -----------------------------------------------------------------
  // ▶️ EXECUÇÃO PRINCIPAL
  // -----------------------------------------------------------------
  async execute(context: SkillContext): Promise<SkillResult> {
    const { companyId, runId } = context;

    // 1) Config IMAP via env (ADR-032)
    const config = {
      host: process.env.NFSE_IMAP_HOST || '',
      port: Number(process.env.NFSE_IMAP_PORT || 993),
      secure: (process.env.NFSE_IMAP_SECURE || 'true') === 'true',
      user: process.env.NFSE_IMAP_USER || '',
      pass: process.env.NFSE_IMAP_PASS || '',
      mailbox: process.env.NFSE_IMAP_MAILBOX || 'INBOX',
    };

    // 2) Sem credenciais → SKIP gracioso (cron não vira spam de erro)
    if (!config.host || !config.user || !config.pass) {
      await this.logAudit(companyId, 'NFSE_EMAIL_COLLECT:SKIP', 'EmailCollector', runId, {
        reason: 'IMAP não configurado (preencha NFSE_IMAP_* no .env)',
      });
      return {
        itemsProcessed: 0,
        itemsAutoApproved: 0,
        itemsPendingHuman: 0,
        itemsFailed: 0,
        secondsSaved: 0,
        detail: { configured: false },
      };
    }

    // 3) COLETAR: anexos .xml da caixa → inbox local
    const collected = await this.collector.collect(config, companyId, null);

    await this.logAudit(companyId, 'NFSE_EMAIL_COLLECT:BATCH', 'EmailCollector', runId, {
      scanned: collected.messagesScanned,
      xmls: collected.xmlsCollected,
      saved: collected.savedFiles,
      errors: collected.errors,
    });

    // 4) Nada novo → termina aqui (não dispara import à toa)
    if (collected.xmlsCollected === 0) {
      return {
        itemsProcessed: collected.messagesScanned,
        itemsAutoApproved: 0,
        itemsPendingHuman: 0,
        itemsFailed: collected.errors.length,
        secondsSaved: 0,
        detail: {
          configured: true,
          scanned: collected.messagesScanned,
          xmls: 0,
        },
      };
    }

    // 5) PROCESSAR: reusa a NfseImportSkill no mesmo run (ADR-037)
    const imported = await this.importSkill.execute(context);

    return {
      itemsProcessed: collected.xmlsCollected + imported.itemsProcessed,
      itemsAutoApproved: imported.itemsAutoApproved,
      itemsPendingHuman: imported.itemsPendingHuman,
      itemsFailed: imported.itemsFailed + collected.errors.length,
      secondsSaved:
        collected.xmlsCollected * SECONDS_PER_ITEM + imported.secondsSaved,
      detail: {
        configured: true,
        scanned: collected.messagesScanned,
        xmls: collected.xmlsCollected,
        imported: imported.itemsProcessed,
      },
    };
  }
}
// =================================================================
// FIM: nfse-email-collect.skill.ts
// =================================================================