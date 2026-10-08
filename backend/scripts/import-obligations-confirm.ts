/**
 * ============================================================================
 * 🆕 OB-1 — IMPORTADOR DE OBRIGAÇÕES EM MODO CONFIRM (gravação no banco)
 * ============================================================================
 * FONTE: backend/output/obligations-preview.json
 * AÇÃO: Upsert idempotente via @@unique([companyId, slug, departmentName, fingerprint])
 * ⚠️ PRESERVA TODAS AS 204 LINHAS. Sem deduplicação automática.
 * ============================================================================
 */
import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

const PREVIEW_JSON = path.resolve(__dirname, '../output/obligations-preview.json');
const COMPANY_ID = process.env.SEED_COMPANY_ID;

if (!COMPANY_ID) throw new Error('❌ Defina SEED_COMPANY_ID no .env');
if (!fs.existsSync(PREVIEW_JSON)) throw new Error(`Preview não encontrado: ${PREVIEW_JSON}`);

const prisma = new PrismaClient();

function computeFingerprint(o: any): string {
  const payload = [o.competence, o.reminderDaysBefore.toString(), o.deadlinePolicy,
    o.saturdayIsBusinessDay ? '1' : '0', o.requireRobot ? '1' : '0',
    o.finePossible ? '1' : '0', o.unreadGuideAlert ? '1' : '0'].join('|');
  return crypto.createHash('sha256').update(payload).digest('hex').slice(0, 16);
}

const DAY_MAP: Record<string, any> = { BUSINESS_DAY: 'BUSINESS_DAY', CALENDAR_DAY: 'CALENDAR_DAY' };
const POLICY_MAP: Record<string, any> = { ANTECIPATE_PREVIOUS_BUSINESS_DAY: 'ANTECIPATE_PREVIOUS_BUSINESS_DAY', POSTPONE_NEXT_BUSINESS_DAY: 'POSTPONE_NEXT_BUSINESS_DAY' };
const COMP_MAP: Record<string, any> = { PREVIOUS_MONTH: 'PREVIOUS_MONTH', CURRENT_MONTH: 'CURRENT_MONTH', NEXT_MONTH: 'NEXT_MONTH', TWO_MONTHS_BEFORE: 'TWO_MONTHS_BEFORE', THREE_MONTHS_BEFORE: 'THREE_MONTHS_BEFORE', PREVIOUS_YEAR: 'PREVIOUS_YEAR', CURRENT_YEAR: 'CURRENT_YEAR' };
const REC_MAP: Record<string, any> = { NOT_APPLICABLE: 'NOT_APPLICABLE', FIXED_DAY_OF_MONTH: 'FIXED_DAY_OF_MONTH', FIRST_BUSINESS_DAY: 'FIRST_BUSINESS_DAY', NTH_BUSINESS_DAY: 'NTH_BUSINESS_DAY', LAST_BUSINESS_DAY: 'LAST_BUSINESS_DAY' };

async function resolveResponsibleId(name: string | null): Promise<string | null> {
  if (!name) return null;
  const user = await prisma.user.findFirst({ where: { name: { equals: name, mode: 'insensitive' }, companyId: COMPANY_ID }, select: { id: true } });
  return user?.id ?? null;
}

async function main() {
  console.log(` Lendo preview JSON...`);
  const obligations = JSON.parse(fs.readFileSync(PREVIEW_JSON, 'utf8'));
  console.log(`🔍 ${obligations.length} obrigações encontradas.\n`);

  let created = 0, updated = 0, skipped = 0;
  const errors: { row: number; name: string; message: string }[] = [];

  for (let i = 0; i < obligations.length; i++) {
    const o = obligations[i];
    try {
      const fingerprint = computeFingerprint(o);
      const responsibleId = await resolveResponsibleId(o.responsibleName);
      const rulesData = o.rules.map((r: any) => ({ month: r.month, recurrenceType: REC_MAP[r.recurrenceType], dayOfMonth: r.dayOfMonth, businessDayNumber: r.businessDayNumber }));

      const result = await prisma.obligation.upsert({
 // Exemplo se o nome retornado for obligations_companyId_slug_departmentName_fingerprint_key
where: { 
  ObligationUniqueKey: { 
    companyId: COMPANY_ID!, 
    slug: o.slug, 
    departmentName: o.departmentName ?? '', 
    fingerprint 
  } 
},
        update: { 
          name: o.name, miniName: o.miniName, responsibleId, companyCount: o.companyCount, 
          reminderDaysBefore: o.reminderDaysBefore, reminderDayType: DAY_MAP[o.reminderDayType], 
          deadlinePolicy: POLICY_MAP[o.deadlinePolicy], saturdayIsBusinessDay: o.saturdayIsBusinessDay, 
          competence: COMP_MAP[o.competence], requireRobot: o.requireRobot, finePossible: o.finePossible, 
          unreadGuideAlert: o.unreadGuideAlert, active: o.active, 
          notes: o.warnings?.length ? `⚠️ Avisos: ${o.warnings.join('; ')}` : null, 
          rules: { deleteMany: {}, createMany: { data: rulesData } } 
        },
        create: { 
          companyId: COMPANY_ID!, name: o.name, slug: o.slug, miniName: o.miniName, 
          departmentName: o.departmentName, fingerprint, responsibleId, companyCount: o.companyCount, 
          reminderDaysBefore: o.reminderDaysBefore, reminderDayType: DAY_MAP[o.reminderDayType], 
          deadlinePolicy: POLICY_MAP[o.deadlinePolicy], saturdayIsBusinessDay: o.saturdayIsBusinessDay, 
          competence: COMP_MAP[o.competence], requireRobot: o.requireRobot, finePossible: o.finePossible, 
          unreadGuideAlert: o.unreadGuideAlert, active: o.active, 
          notes: o.warnings?.length ? `️ Avisos: ${o.warnings.join('; ')}` : null, 
          rules: { createMany: { data: rulesData } } 
        },
      });

      if (result.createdAt.getTime() === result.updatedAt.getTime()) created++; else updated++;
      console.log(`✅ [${String(i + 1).padStart(3)}] ${o.name.padEnd(50)} | Depto: ${(o.departmentName || '(N/A)').padEnd(25)} | FP: ${fingerprint}`);
    } catch (e: any) {
      skipped++; errors.push({ row: i + 1, name: o.name, message: e.message });
      console.error(`❌ [${String(i + 1).padStart(3)}] ${o.name}: ${e.message}`);
    }
  }

  console.log(`\n🎉 Importação concluída. Criadas: ${created} | Atualizadas: ${updated} | Erros: ${skipped}`);
  if (errors.length) errors.forEach(e => console.log(`   Linha ${e.row} (${e.name}): ${e.message}`));

  const totalObs = await prisma.obligation.count({ where: { companyId: COMPANY_ID } });
  const totalRules = await prisma.obligationRule.count({ where: { obligation: { companyId: COMPANY_ID } } });
  console.log(`📊 Banco: ${totalObs} obrigações | ${totalRules} regras mensais`);
}

main().catch(e => { console.error('💥 Erro fatal:', e); process.exit(1); }).finally(() => prisma.$disconnect());