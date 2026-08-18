// =================================================================
// INÍCIO: backend/src/digital-employee/skills/nfse-import.skill.ts
// =================================================================
// NfseImportSkill — FD-3a: processa a caixa de entrada de NFS-e
//
// Fluxo (Pilar B):
//   COLETAR     → uploads/nfse-inbox/*.xml (upload manual hoje;
//                 e-mail/portal amanhã despejam aqui — ADR-037)
//   INTERPRETAR → parseNfse() (parser ABRASF puro, testado)
//   EXECUTAR    → upsert FiscalServiceInvoice (idempotente)
//   REGISTRAR   → move p/ nfse-processed/ ou nfse-failed/ + auditoria
//
// Vínculo com cliente (prioridade):
//   1) clientId explícito no nome do arquivo (upload com seleção)
//   2) CNPJ do emissor = cliente (EMITIDA) ou tomador (RECEBIDA)
//   3) nenhum → status REVIEW (fila 🟡 — nunca descarta, ADR-036)
// =================================================================
import * as fs from 'fs';
import * as path from 'path';
import { PrismaService } from '../../prisma/prisma.service';
import { AutomationAuditService } from '../audit/automation-audit.service';
import { BaseSkill, SkillContext, SkillResult } from './base.skill';
import { SkillKey } from '@prisma/client';
import { parseNfse } from '../../fiscal/nfse/nfse.parser';

/** Limite de segurança por execução */
const MAX_FILES_PER_RUN = 50;

/** ~5 min de digitação manual economizada por NFS-e */
const SECONDS_PER_ITEM = 300;

export class NfseImportSkill extends BaseSkill {
  readonly key: SkillKey = 'NFSE_IMPORT';
  readonly secondsPerItem = SECONDS_PER_ITEM;

  constructor(prisma: PrismaService, audit: AutomationAuditService) {
    super(prisma, audit);
  }

  private inboxDir() { return path.join(process.cwd(), 'uploads', 'nfse-inbox'); }
  private doneDir() { return path.join(process.cwd(), 'uploads', 'nfse-processed'); }
  private failDir() { return path.join(process.cwd(), 'uploads', 'nfse-failed'); }

  // -----------------------------------------------------------------
  // ▶️ EXECUÇÃO PRINCIPAL
  // -----------------------------------------------------------------
  async execute(context: SkillContext): Promise<SkillResult> {
    const { companyId, runId } = context;

    // Garante as 3 pastas (nunca falha por pasta ausente)
    fs.mkdirSync(this.inboxDir(), { recursive: true });
    fs.mkdirSync(this.doneDir(), { recursive: true });
    fs.mkdirSync(this.failDir(), { recursive: true });

    // COLETAR: só arquivos deste tenant (prefixo companyId_)
    const files = fs
      .readdirSync(this.inboxDir())
      .filter((f) => f.toLowerCase().endsWith('.xml') && f.startsWith(`${companyId}_`))
      .slice(0, MAX_FILES_PER_RUN);

    let processed = 0, auto = 0, pending = 0, failed = 0;

    for (const file of files) {
      const src = path.join(this.inboxDir(), file);
      const xml = fs.readFileSync(src, 'utf-8');

      try {
        // INTERPRETAR
        const parsed = parseNfse(xml);

        // Vínculo com cliente: 1) nome do arquivo 2) CNPJ emissor 3) CNPJ tomador
        const explicitClientId = this.clientIdFromFileName(file);
        let clientId: string | null = explicitClientId;
        let direction: 'EMITIDA' | 'RECEBIDA' = 'EMITIDA';

        if (!clientId) {
          const byIssuer = await this.prisma.client.findFirst({
            where: { companyId, cnpj: parsed.issuerCnpj },
          });
          if (byIssuer) {
            clientId = byIssuer.id;
            direction = 'EMITIDA';
          } else if (parsed.takerCnpj) {
            const byTaker = await this.prisma.client.findFirst({
              where: { companyId, cnpj: parsed.takerCnpj },
            });
            if (byTaker) {
              clientId = byTaker.id;
              direction = 'RECEBIDA';
            }
          }
        }

        // Sem vínculo → fila 🟡 (REVIEW), nunca descarta
        const status = clientId ? 'IMPORTED' : 'REVIEW';
        if (clientId) auto++; else pending++;

        // EXECUTAR: upsert idempotente (2× o mesmo XML não duplica)
        await this.prisma.fiscalServiceInvoice.upsert({
          where: {
            companyId_issuerCnpj_number_series: {
              companyId,
              issuerCnpj: parsed.issuerCnpj,
              number: parsed.number,
              series: parsed.series,
            },
          },
          update: {
            // Não sobrescreve status de quem já foi contabilizado
            serviceValue: parsed.serviceValue,
            deductions: parsed.deductions,
            issBase: parsed.issBase,
            issRate: parsed.issRate,
            issValue: parsed.issValue,
            issRetained: parsed.issRetained,
            rawXml: xml,
            clientId: clientId ?? undefined,
          },
          create: {
            companyId,
            clientId,
            number: parsed.number,
            series: parsed.series,
            verificationCode: parsed.verificationCode,
            emissionDate: parsed.emissionDate,
            competenceDate: parsed.competenceDate,
            issuerCnpj: parsed.issuerCnpj,
            issuerName: parsed.issuerName,
            takerCnpj: parsed.takerCnpj,
            takerName: parsed.takerName,
            serviceValue: parsed.serviceValue,
            deductions: parsed.deductions,
            issBase: parsed.issBase,
            issRate: parsed.issRate,
            issValue: parsed.issValue,
            issRetained: parsed.issRetained,
            serviceCode: parsed.serviceCode,
            serviceDescription: parsed.serviceDescription,
            municipalityCode: parsed.municipalityCode,
            direction,
            source: 'MANUAL',
            status,
            rawXml: xml,
          },
        });

        // REGISTRAR: move p/ processados + auditoria
        fs.renameSync(src, path.join(this.doneDir(), file));
        processed++;
        await this.logAudit(companyId, 'NFSE_IMPORTED', 'FiscalServiceInvoice', parsed.number, {
          file,
          status,
          direction,
          issuer: parsed.issuerName,
        });
      } catch (error: any) {
        // Parse falhou → nfse-failed/ (preserva p/ análise — ADR-036)
        failed++;
        try { fs.renameSync(src, path.join(this.failDir(), file)); } catch { /* segue */ }
        await this.logAudit(companyId, 'NFSE_IMPORT_FAILED', 'FiscalServiceInvoice', file, {
          error: error?.message,
        });
      }
    }

    // Auditoria do lote
    await this.logAudit(companyId, 'NFSE_IMPORT:BATCH', 'FiscalServiceInvoice', runId, {
      processed, auto, pending, failed,
    });

    return {
      itemsProcessed: processed,
      itemsAutoApproved: auto,
      itemsPendingHuman: pending,
      itemsFailed: failed,
      secondsSaved: processed * SECONDS_PER_ITEM,
      detail: { files: files.length },
    };
  }

  // -----------------------------------------------------------------
  // Extrai clientId do nome do arquivo: {companyId}_{clientId|auto}_{ts}.xml
  // -----------------------------------------------------------------
  private clientIdFromFileName(file: string): string | null {
    const parts = file.replace(/\.xml$/i, '').split('_');
    const candidate = parts[1];
    return candidate && candidate !== 'auto' ? candidate : null;
  }
}
// =================================================================
// FIM: nfse-import.skill.ts
// =================================================================