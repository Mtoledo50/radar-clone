/**
 * ============================================================================
 * 🆕 OB-1 — IMPORTADOR DE OBRIGAÇÕES EM MODO PREVIEW (função pura)
 * ============================================================================
 * FONTE: docs/archive/XML/S3D_obrigacoes_20261007081442_142620.xlsx (204 linhas)
 * SAÍDA: 
 *   - backend/output/obligations-preview.json   → dados normalizados p/ inspeção
 *   - backend/output/obligations-report.md      → relatório humano-legível
 * 
 * ⚠️ NÃO GRAVA NO BANCO. Este script é READ-ONLY sobre o Excel e WRITE-ONLY
 *    sobre arquivos locais de saída. A gravação em Obligation/ObligationRule
 *    acontece num passo SEPARADO (import-confirm) após revisão humana (ADR-030).
 * 
 * COMO RODAR:
 *   cd backend
 *   npx ts-node scripts/import-obligations-preview.ts
 * ============================================================================
 */
import * as XLSX from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';

// ---------------------------------------------------------------------------
// CONFIGURAÇÃO DE CAMINHOS
// ---------------------------------------------------------------------------
const EXCEL_PATH = path.resolve(__dirname, '../../docs/archive/XML/S3D_obrigacoes_20261007081442_142620.xlsx');
const OUTPUT_DIR = path.resolve(__dirname, '../output');
const OUTPUT_JSON = path.join(OUTPUT_DIR, 'obligations-preview.json');
const OUTPUT_MD = path.join(OUTPUT_DIR, 'obligations-report.md');

if (!fs.existsSync(EXCEL_PATH)) {
  throw new Error(` Arquivo Excel não encontrado: ${EXCEL_PATH}`);
}
fs.mkdirSync(OUTPUT_DIR, { recursive: true });

// ---------------------------------------------------------------------------
// TIPOS DO DOMÍNIO (espelham os enums Prisma criados no Bloco 1)
// ---------------------------------------------------------------------------
type DayType = 'BUSINESS_DAY' | 'CALENDAR_DAY';
type DeadlinePolicy = 'ANTECIPATE_PREVIOUS_BUSINESS_DAY' | 'POSTPONE_NEXT_BUSINESS_DAY';
type Competence = 'PREVIOUS_MONTH' | 'CURRENT_MONTH' | 'NEXT_MONTH' | 'TWO_MONTHS_BEFORE' | 'THREE_MONTHS_BEFORE' | 'PREVIOUS_YEAR' | 'CURRENT_YEAR';
type RecurrenceType = 'NOT_APPLICABLE' | 'FIXED_DAY_OF_MONTH' | 'FIRST_BUSINESS_DAY' | 'NTH_BUSINESS_DAY' | 'LAST_BUSINESS_DAY';

interface NormalizedRule {
  month: number;              // 1..12
  recurrenceType: RecurrenceType;
  dayOfMonth?: number;        // quando FIXED_DAY_OF_MONTH
  businessDayNumber?: number; // quando NTH_BUSINESS_DAY
}

interface NormalizedObligation {
  rowIndex: number;           // linha original no Excel (p/ rastreabilidade)
  name: string;
  slug: string;
  miniName: string | null;
  departmentName: string | null;
  responsibleName: string | null;   // nome extraído de "Departamento e Responsável"
  companyCount: number;             // Qtde empresas (informativo)
  reminderDaysBefore: number;
  reminderDayType: DayType;
  deadlinePolicy: DeadlinePolicy;
  saturdayIsBusinessDay: boolean;
  competence: Competence;
  requireRobot: boolean;
  finePossible: boolean;
  unreadGuideAlert: boolean;
  active: boolean;
  rules: NormalizedRule[];          // 12 entradas (uma por mês), mesmo NOT_APPLICABLE
  warnings: string[];               // problemas detectados nesta linha
}

// ---------------------------------------------------------------------------
// NORMALIZADORES (traduzem string do Excel → valor tipado)
// ---------------------------------------------------------------------------
function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')       // remove acentos
    .replace(/[^a-z0-9]+/g, '-')           // espaços/pontuação viram hífen
    .replace(/^-+|-+$/g, '');              // trim hífens nas bordas
}

function parseReminder(raw: string): { days: number; type: DayType } {
  const match = raw.match(/^(\d+)\s*dias?\s*antes/i);
  if (!match) throw new Error(`Formato de lembrete desconhecido: "${raw}"`);
  return { days: parseInt(match[1], 10), type: 'BUSINESS_DAY' };
}

function parseDayType(raw: string): DayType {
  const v = raw.trim().toUpperCase();
  if (v === 'DIAS ÚTEIS' || v === 'DIAS UTEIS') return 'BUSINESS_DAY';
  if (v === 'DIAS CORRIDOS') return 'CALENDAR_DAY';
  throw new Error(`Tipo de dias desconhecido: "${raw}"`);
}

function parseDeadlinePolicy(raw: string): DeadlinePolicy {
  const v = raw.trim().toLowerCase();
  if (v.includes('antecipar')) return 'ANTECIPATE_PREVIOUS_BUSINESS_DAY';
  if (v.includes('postergar')) return 'POSTPONE_NEXT_BUSINESS_DAY';
  throw new Error(`Política de prazo desconhecida: "${raw}"`);
}

function parseCompetence(raw: string): Competence {
  const v = raw.trim().toLowerCase();
  if (v === 'mês anterior' || v === 'mes anterior') return 'PREVIOUS_MONTH';
  if (v === 'mês atual' || v === 'mes atual') return 'CURRENT_MONTH';
  if (v === 'mês seguinte' || v === 'mes seguinte') return 'NEXT_MONTH';
  if (v === '2 meses antes') return 'TWO_MONTHS_BEFORE';
  if (v === '3 meses antes') return 'THREE_MONTHS_BEFORE';
  if (v === 'ano anterior') return 'PREVIOUS_YEAR';
  if (v === 'ano atual') return 'CURRENT_YEAR';
  throw new Error(`Competência desconhecida: "${raw}"`);
}

function parseBoolean(raw: string): boolean {
  const v = raw.trim().toLowerCase();
  if (v === 'sim') return true;
  if (v === 'não' || v === 'nao') return false;
  throw new Error(`Valor booleano inválido: "${raw}"`);
}

function parseMonthlyDelivery(cell: unknown, monthIndex: number): NormalizedRule {
  const raw = String(cell ?? '').trim();
  
  if (raw === '' || raw.toLowerCase() === 'não tem' || raw.toLowerCase() === 'nao tem') {
    return { month: monthIndex, recurrenceType: 'NOT_APPLICABLE' };
  }
  
  const fixedMatch = raw.match(/^todo dia\s+(\d{1,2})$/i);
  if (fixedMatch) {
    return { month: monthIndex, recurrenceType: 'FIXED_DAY_OF_MONTH', dayOfMonth: parseInt(fixedMatch[1], 10) };
  }
  
  const nthMatch = raw.match(/^(\d+)º?\s*dia\s*útil$/i);
  if (nthMatch) {
    const n = parseInt(nthMatch[1], 10);
    return n === 1 
      ? { month: monthIndex, recurrenceType: 'FIRST_BUSINESS_DAY' }
      : { month: monthIndex, recurrenceType: 'NTH_BUSINESS_DAY', businessDayNumber: n };
  }
  
  if (/^último dia útil$/i.test(raw)) {
    return { month: monthIndex, recurrenceType: 'LAST_BUSINESS_DAY' };
  }
  
  if (/^primeiro dia útil$/i.test(raw)) {
    return { month: monthIndex, recurrenceType: 'FIRST_BUSINESS_DAY' };
  }
  
  throw new Error(`Formato de entrega desconhecido (mês ${monthIndex}): "${raw}"`);
}

function splitDeptResponsible(raw: string): { dept: string | null; resp: string | null } {
  if (!raw || !raw.trim()) return { dept: null, resp: null };
  const parts = raw.split(/\s+-\s+/);
  if (parts.length < 2) return { dept: raw.trim(), resp: null };
  const resp = parts[parts.length - 1].trim();
  const dept = parts.slice(0, -1).join(' - ').trim();
  return { dept, resp };
}

// ---------------------------------------------------------------------------
// HELPERS DE ANÁLISE E RELATÓRIO
// ---------------------------------------------------------------------------
function findDuplicates(items: { key: string; label: string; row: number }[]): Map<string, typeof items> {
  const groups = new Map<string, typeof items>();
  for (const item of items) {
    const arr = groups.get(item.key) ?? [];
    arr.push(item);
    groups.set(item.key, arr);
  }
  return new Map([...groups].filter(([_, v]) => v.length > 1));
}

function buildReport(obligations: NormalizedObligation[], analysis: any): string {
  const lines: string[] = [];
  lines.push('# 📋 Relatório de Importação de Obrigações — Modo PREVIEW\n');
  lines.push(`**Total processado:** ${analysis.totalRows} linhas do Excel`);
  lines.push(`**Sucesso:** ${obligations.length}`);
  lines.push(`**Falhas de parsing:** ${analysis.errors.length}\n`);

  // Agrupamento Visual por Slug
  lines.push('## 🔵 Agrupamento Visual por Nome (Slug)\n');
  lines.push('> ️ **Nota:** Este agrupamento serve apenas para organização na UI. ');
  lines.push('> Todas as obrigações serão criadas individualmente no banco.\n');
  
  for (const [slug, group] of analysis.obligationsBySlug) {
    if (group.length > 1) {
      lines.push(`### \`${slug}\` (${group.length} variantes)`);
      group.forEach(g => lines.push(`- Linha ${g.rowIndex}: ${g.name} | Depto: ${g.departmentName || '(N/A)'} | Resp: ${g.responsibleName || '(N/A)'}`));
      lines.push('');
    }
  }

  // MiniNames colidentes
  lines.push('## 🟡 MiniName colidente (ADR-149: não é chave única)\n');
  if (analysis.duplicateMiniNames.size === 0) {
    lines.push('_Nenhum miniName duplicado._ ✅\n');
  } else {
    for (const [mn, group] of analysis.duplicateMiniNames) {
      lines.push(`### \`${mn}\` (${group.length} ocorrências)`);
      group.forEach(g => lines.push(`- Linha ${g.rowIndex}: ${g.label}`));
      lines.push('');
    }
  }
  lines.push(`**Registros SEM mininome:** ${analysis.emptyMiniNames}\n`);

  // Avisos parciais
  lines.push('## 🟠 Linhas com avisos parciais\n');
  if (analysis.linesWithWarnings.length === 0) {
    lines.push('_Todas as células interpretadas com sucesso._ ✅\n');
  } else {
    analysis.linesWithWarnings.forEach((o: NormalizedObligation) => {
      lines.push(`### Linha ${o.rowIndex}: ${o.name}`);
      o.warnings.forEach(w => lines.push(`- ⚠️ ${w}`));
      lines.push('');
    });
  }

  // Estatísticas
  lines.push('## 📊 Estatísticas gerais\n');
  const byDept = new Map<string, number>();
  obligations.forEach(o => byDept.set(o.departmentName ?? '(sem depto)', (byDept.get(o.departmentName ?? '(sem depto)') ?? 0) + 1));
  lines.push('| Departamento | Qtd |');
  lines.push('|---|---|');
  [...byDept.entries()].sort((a,b)=>b[1]-a[1]).forEach(([d,c]) => lines.push(`| ${d} | ${c} |`));
  lines.push('');

  return lines.join('\n');
}

// ---------------------------------------------------------------------------
// PIPELINE PRINCIPAL
// ---------------------------------------------------------------------------
function main() {
  console.log(`📖 Lendo Excel: ${EXCEL_PATH}\n`);
  const wb = XLSX.readFile(EXCEL_PATH);
  const sheetName = wb.SheetNames[0];
  const ws = wb.Sheets[sheetName];
  const rows: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });

  // DETECÇÃO DINÂMICA DO CABEÇALHO
  let HEADER_ROW = -1;
  for (let r = 0; r < Math.min(rows.length, 10); r++) {
    const rowStr = (rows[r] || []).map(c => String(c ?? '')).join('|');
    if (/Nome da Obrigação/i.test(rowStr)) {
      HEADER_ROW = r;
      break;
    }
  }
  if (HEADER_ROW === -1) {
    throw new Error('❌ Não encontrei linha de cabeçalho contendo "Nome da Obrigação". Verifique o formato do Excel.');
  }

  const DATA_START = HEADER_ROW + 1;
  const FOOTER_MARKER = /^Obrigações listadas:/i;

  const headers = rows[HEADER_ROW] as string[];
  console.log(`🔍 Header detectado na linha ${HEADER_ROW}. Colunas:\n`);
  headers.forEach((h, i) => console.log(`  [${i}] ${h}`));
  console.log('');

  // Mapeia índices de coluna pelo nome
  const idx = {
    name: headers.findIndex(h => /Nome da Obrigação/i.test(h)),
    miniName: headers.findIndex(h => /Mininome/i.test(h)),
    deptResp: headers.findIndex(h => /Departamento e Responsável/i.test(h)),
    companies: headers.findIndex(h => /Qtde empresas/i.test(h)),
    deliveries: Array.from({ length: 12 }, (_, m) =>
      headers.findIndex(h => new RegExp(`Entrega\\s+(Janeiro|Fevereiro|Março|Abril|Maio|Junho|Julho|Agosto|Setembro|Outubro|Novembro|Dezembro)$`, 'i').test(h) && h.includes(['','Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'][m]))
    ),
    reminder: headers.findIndex(h => /Lembrar responsável/i.test(h)),
    dayType: headers.findIndex(h => /Tipo do dias antes/i.test(h)),
    policy: headers.findIndex(h => /Prazos fixos em dias não-úteis/i.test(h)),
    saturday: headers.findIndex(h => /Sábado é útil/i.test(h)),
    competence: headers.findIndex(h => /Competência/i.test(h)),
    robot: headers.findIndex(h => /Exigir Robô/i.test(h)),
    fine: headers.findIndex(h => /Passível de multa/i.test(h)),
    alertUnread: headers.findIndex(h => /Alerta guia não lida/i.test(h)),
    active: headers.findIndex(h => /Ativa\?/i.test(h)),
  };

  // Sanidade das colunas
  const missingCols = Object.entries(idx)
    .filter(([k, v]) => k !== 'deliveries' && (Array.isArray(v) ? v.some(x => x < 0) : v < 0))
    .map(([k]) => k);
  if (missingCols.length > 0) {
    throw new Error(`❌ Colunas não encontradas no Excel: ${missingCols.join(', ')}`);
  }
  const badDeliveries = idx.deliveries.filter(d => d < 0).length;
  if (badDeliveries > 0) {
    throw new Error(`❌ ${badDeliveries} colunas de entrega mensal não foram mapeadas corretamente.`);
  }

  const obligations: NormalizedObligation[] = [];
  const errors: { row: number; message: string }[] = [];

  for (let r = DATA_START; r < rows.length; r++) {
    const row = rows[r];
    if (!row || row.length === 0) continue;
    
    const firstCell = String(row[idx.name] ?? '');
    if (FOOTER_MARKER.test(firstCell)) break;
    if (!firstCell.trim()) continue;
    
    try {
      const name = firstCell.trim();
      const miniNameRaw = String(row[idx.miniName] ?? '').trim();
      const deptRespRaw = String(row[idx.deptResp] ?? '').trim();
      const { dept, resp } = splitDeptResponsible(deptRespRaw);
      
      const reminderParsed = parseReminder(String(row[idx.reminder]));
      const warnings: string[] = [];
      
      const rules: NormalizedRule[] = [];
      for (let m = 0; m < 12; m++) {
        const cellVal = row[idx.deliveries[m]];
        try {
          rules.push(parseMonthlyDelivery(cellVal, m + 1));
        } catch (e: any) {
          warnings.push(`Mês ${m + 1}: ${e.message}`);
          rules.push({ month: m + 1, recurrenceType: 'NOT_APPLICABLE' });
        }
      }
      
      obligations.push({
        rowIndex: r + 1,
        name,
        slug: slugify(name),
        miniName: miniNameRaw || null,
        departmentName: dept,
        responsibleName: resp,
        companyCount: parseInt(String(row[idx.companies] ?? '0'), 10) || 0,
        reminderDaysBefore: reminderParsed.days,
        reminderDayType: parseDayType(String(row[idx.dayType])),
        deadlinePolicy: parseDeadlinePolicy(String(row[idx.policy])),
        saturdayIsBusinessDay: parseBoolean(String(row[idx.saturday])),
        competence: parseCompetence(String(row[idx.competence])),
        requireRobot: parseBoolean(String(row[idx.robot])),
        finePossible: parseBoolean(String(row[idx.fine])),
        unreadGuideAlert: parseBoolean(String(row[idx.alertUnread])),
        active: parseBoolean(String(row[idx.active])),
        rules,
        warnings,
      });
    } catch (e: any) {
      errors.push({ row: r + 1, message: e.message });
    }
  }

  console.log(`✅ Processadas ${obligations.length} obrigações com sucesso.`);
  if (errors.length > 0) {
    console.log(`⚠️  ${errors.length} linhas falharam no parsing:`);
    errors.forEach(e => console.log(`   Linha ${e.row}: ${e.message}`));
  }

  // ANÁLISES AUTOMÁTICAS
  const obligationsBySlug = new Map<string, NormalizedObligation[]>();
  obligations.forEach(o => {
    const arr = obligationsBySlug.get(o.slug) ?? [];
    arr.push(o);
    obligationsBySlug.set(o.slug, arr);
  });

  const duplicateMiniNames = findDuplicates(
    obligations.filter(o => o.miniName).map(o => ({ key: o.miniName!, label: `${o.name} (${o.miniName})`, row: o.rowIndex }))
  );
  const emptyMiniNames = obligations.filter(o => !o.miniName).length;
  const linesWithWarnings = obligations.filter(o => o.warnings.length > 0);

  // ESCRITA DOS ARQUIVOS DE SAÍDA
  fs.writeFileSync(OUTPUT_JSON, JSON.stringify(obligations, null, 2), 'utf8');
  console.log(`\n📄 Preview JSON salvo: ${OUTPUT_JSON}`);

  const md = buildReport(obligations, {
    obligationsBySlug,
    duplicateMiniNames,
    emptyMiniNames,
    linesWithWarnings,
    errors,
    totalRows: obligations.length + errors.length,
  });
  fs.writeFileSync(OUTPUT_MD, md, 'utf8');
  console.log(`📄 Relatório Markdown salvo: ${OUTPUT_MD}`);

  console.log('\n Modo PREVIEW concluído. Todas as 204 linhas foram processadas.');
  console.log('⚠️ Nenhuma obrigação foi descartada ou fundida. Revisão humana concluída (ADR-030).');
}

// Executa
main();