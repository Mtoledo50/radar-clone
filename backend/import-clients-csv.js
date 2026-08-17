// =================================================================
// import-clients-csv.js v2 — Importação SEM depender de constraint
// =================================================================
// Estratégia: findFirst + create/update manual.
// Vantagem: não precisa de @@unique nem de prisma generate novo.
// =================================================================
const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

const CSV_PATH = path.join(__dirname, '..', 'Contratos - Hon. mensais.csv');
const DRY_RUN = process.argv.includes('--dry-run');

function stripBOM(s) { return s.charCodeAt(0) === 0xFEFF ? s.slice(1) : s; }

function parseCsvLine(line) {
  const out = []; let cur = ''; let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i+1] === '"') { cur += '"'; i++; }
      else inQuotes = !inQuotes;
    } else if (ch === ';' && !inQuotes) {
      out.push(cur); cur = '';
    } else cur += ch;
  }
  out.push(cur);
  return out.map((s) => s.trim());
}

function parseDateBR(s) {
  if (!s) return null;
  const m = s.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!m) return null;
  const [, d, mo, y] = m;
  const dt = new Date(Date.UTC(+y, +mo - 1, +d));
  return isNaN(dt.getTime()) ? null : dt;
}

function parseBRL(s) {
  if (!s) return null;
  const clean = s.replace(/\./g, '').replace(',', '.').trim();
  const n = parseFloat(clean);
  return isNaN(n) ? null : n;
}

function parseIntOrNull(s) {
  if (!s) return null;
  const n = parseInt(s, 10);
  return isNaN(n) ? null : n;
}

async function main() {
  console.log('=== IMPORTAÇÃO DE CLIENTES v2 (findFirst + create/update) ===\n');
  if (DRY_RUN) console.log('⚠️  MODO DRY-RUN: NADA será gravado no banco.\n');

  if (!fs.existsSync(CSV_PATH)) {
    console.error(`❌ Arquivo não encontrado: ${CSV_PATH}`);
    process.exit(1);
  }
  const raw = stripBOM(fs.readFileSync(CSV_PATH, 'utf-8'));
  const lines = raw.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length < 2) { console.error('❌ CSV vazio.'); process.exit(1); }

  console.log(`📄 Cabeçalho: ${parseCsvLine(lines[0]).join(' | ')}`);
  console.log(`📊 Linhas de dados: ${lines.length - 1}\n`);

  const company = await p.company.findFirst();
  if (!company) { console.error('❌ Nenhuma company.'); process.exit(1); }
  const admin = await p.user.findFirst({ where: { companyId: company.id } });
  if (!admin) { console.error('❌ Nenhum usuário no tenant.'); process.exit(1); }

  console.log(`🏢 Tenant: ${company.name} (${company.id})`);
  console.log(`👤 Admin : ${admin.email} (${admin.id})\n`);

  console.log('=== PREVIEW (3 primeiras linhas) ===');
  for (let i = 1; i <= Math.min(3, lines.length - 1); i++) {
    const cols = parseCsvLine(lines[i]);
    console.log(`\n  [${i}] ${cols[0]}`);
    console.log(`      início: ${cols[1]}   término: ${cols[2] || '—'}   últ.pgto: ${cols[3] || '—'}`);
    console.log(`      parcelas: ${cols[4] || '—'}   mensal: ${cols[5]}`);
    console.log(`      aberto: ${cols[6]}   pago: ${cols[7]}   vencido: ${cols[8]}`);
  }
  console.log();

  if (!DRY_RUN) {
    const readline = require('readline');
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    const answer = await new Promise((res) =>
      rl.question('❓ Confirmar importação? (s/N) ', (a) => { rl.close(); res(a.trim().toLowerCase()); })
    );
    if (answer !== 's' && answer !== 'y') {
      console.log('\n❌ Cancelado.');
      process.exit(0);
    }
    console.log();
  }

  // ===============================================================
  // 🎯 ESTRATÉGIA MANUAL: findFirst + create/update (sem upsert)
  // ===============================================================
  let created = 0, updated = 0, skipped = 0;
  const errors = [];

  for (let i = 1; i < lines.length; i++) {
    const cols = parseCsvLine(lines[i]);
    const companyName = cols[0];
    if (!companyName) { skipped++; continue; }

    const startDate = parseDateBR(cols[1]);
    const monthlyFee = parseBRL(cols[5]);

    if (!startDate || monthlyFee === null) {
      errors.push({ line: i + 1, name: companyName, reason: `startDate ou monthlyFee inválidos` });
      continue;
    }

    const baseData = {
      startDate,
      monthlyFee,
      endDate: parseDateBR(cols[2]),
      lastPaymentDate: parseDateBR(cols[3]),
      installments: parseIntOrNull(cols[4]),
      openAmount: parseBRL(cols[6]),
      paidAmount: parseBRL(cols[7]),
      overdueAmount: parseBRL(cols[8]),
      serviceType: 'CONTABIL',
      status: 'ATIVO',
    };

    try {
      // Busca cliente existente por (companyId + companyName)
      const existing = await p.client.findFirst({
        where: { companyId: company.id, companyName },
      });

      if (existing) {
        // UPDATE
        if (!DRY_RUN) {
          await p.client.update({
            where: { id: existing.id },
            data: baseData,
          });
        }
        updated++;
      } else {
        // CREATE
        if (!DRY_RUN) {
          await p.client.create({
            data: {
              userId: admin.id,
              companyId: company.id,
              companyName,
              ...baseData,
            },
          });
        }
        created++;
      }
    } catch (e) {
      errors.push({ line: i + 1, name: companyName, reason: e.message.slice(0, 150) });
    }
  }

  console.log('\n=== RELATÓRIO FINAL ===');
  console.log(`✅ Criados   : ${created}${DRY_RUN ? ' (preview)' : ''}`);
  console.log(`🔄 Atualizados: ${updated}${DRY_RUN ? ' (preview)' : ''}`);
  console.log(`⏭️  Ignorados : ${skipped}`);
  console.log(`❌ Erros     : ${errors.length}`);
  if (errors.length > 0) {
    console.log('\nDetalhes dos erros:');
    errors.slice(0, 10).forEach((e) => console.log(`  linha ${e.line} "${e.name}": ${e.reason}`));
    if (errors.length > 10) console.log(`  ... e mais ${errors.length - 10}`);
  }
  console.log(`\n🎯 Total no tenant após import: ${await p.client.count({ where: { companyId: company.id } })}`);
}

main()
  .catch((e) => { console.error('💥 Erro fatal:', e); process.exit(1); })
  .finally(() => p.$disconnect());
