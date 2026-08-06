import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

/**
 * =================================================================
 * 🌐 SEED: PLANO DE CONTAS PADRÃO (SCI 90113)
 * =================================================================
 * Importa o CSV do plano de contas para a tabela AccountTemplate.
 * EXECUÇÃO: npx ts-node src/seed-account-template.ts
 * =================================================================
 */
const prisma = new PrismaClient();

const CSV_PATH =
  process.argv[2] ||
  path.join(__dirname, '..', 'prisma', 'Plano_de_Contas_90113.csv');

function mapType(raw: string): string | null {
  const t = (raw || '').toLowerCase();
  if (t.includes('ativo')) return 'ATIVO';
  if (t.includes('passivo')) return 'PASSIVO';
  if (t.includes('receita')) return 'RECEITA';
  if (t.includes('despesa')) return 'DESPESA';
  return null;
}

async function main() {
  // Lê com fallback de encoding (UTF-8 → latin1)
  let content = fs.readFileSync(CSV_PATH, 'utf-8');
  if (content.includes('\ufffd')) content = fs.readFileSync(CSV_PATH, 'latin1');

  const lines = content.split(/\r?\n/).filter((l) => l.trim().length > 0);

  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const c = lines[i].split(';').map((s) => s.trim());

    const reducedCode = parseInt(c[1], 10);
    const code = c[2];
    const name = (c[4] || '').trim();
    const type = mapType(c[6]);

    if (!reducedCode || !code || !name || !type) continue;

    rows.push({
      reducedCode,
      code,
      parentCode: code.includes('.') ? code.slice(0, code.lastIndexOf('.')) : null,
      name,
      nickname: c[5] || null,
      accountType: type,
      report: (c[7] || '').includes('Balanço') ? 'BALANCO' : 'DRE',
      isSynthetic: c[3] === 'T',
      level: code.split('.').length,
    });
  }

  // Idempotente: substitui o template anterior
  await prisma.accountTemplate.deleteMany({});
  await prisma.accountTemplate.createMany({ data: rows, skipDuplicates: true });

  const analytical = rows.filter((r) => !r.isSynthetic).length;
  console.log('═'.repeat(70));
  console.log('🌐 PLANO DE CONTAS PADRÃO IMPORTADO');
  console.log('═'.repeat(70));
  console.log(`✅ Total de contas: ${rows.length}`);
  console.log(`✅ Analíticas (recebem lançamento): ${analytical}`);
  console.log(`✅ Sintéticas (totalizadoras "T"): ${rows.length - analytical}`);
  console.log('═'.repeat(70));
}

main()
  .catch((e) => { console.error('❌ Erro:', e); process.exit(1); })
  .finally(() => prisma.$disconnect());