// =================================================================
// INÍCIO: backend/src/seed-chart-of-accounts.ts
// =================================================================
/**
 * 📚 Seed do Plano de Contas SCI 90113 — v2 (ADR-062)
 * Correções v2:
 *  • Encoding: detecta Windows-1252 (evita "Variaes")
 *  • Código correto: coluna 2 do CSV (a coluna 1 é o sequencial "+/-")
 *  • Reimportação limpa: desativa contas antigas do plano antes de importar
 * Uso: npx ts-node src/seed-chart-of-accounts.ts [caminho-csv] [email-admin]
 */
import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';

const prisma = new PrismaClient();
const PLAN = 'SCI 90113';

/** Inferência de tipo pelo código/grupo (mesma regra do service). */
function inferType(code: string, grupo: string): string {
  if (code.startsWith('02.3')) return 'PATRIMONIO_LIQUIDO';
  if (code.startsWith('05')) return 'RECEITA';
  const g = (grupo || '').toUpperCase();
  if (g.includes('PASSIVO')) return 'PASSIVO';
  if (g.includes('RECEITA') || g.includes('RESULTADO')) return 'RECEITA';
  if (g.includes('DESPESA') || g.includes('CUSTO')) return 'DESPESA';
  return 'ATIVO';
}

function inferNature(type: string): string {
  return type === 'ATIVO' || type === 'DESPESA' ? 'DEVEDORA' : 'CREDORA';
}

async function main() {
  const csvPath = process.argv[2] || 'plano-90113.csv';
  const adminEmail = process.argv[3] || 'admin@demo.com';

  if (!fs.existsSync(csvPath)) {
    console.error(`❌ CSV não encontrado em: ${csvPath}`);
    process.exit(1);
  }

  const admin = await prisma.user.findFirst({ where: { email: adminEmail } });
  if (!admin?.companyId) {
    console.error(`❌ Admin ${adminEmail} não encontrado ou sem companyId`);
    process.exit(1);
  }
  const companyId = admin.companyId;

  // 1) Leitura com detecção de encoding (SCI exporta em Windows-1252)
  const buf = fs.readFileSync(csvPath);
  let raw = buf.toString('utf8');
  if (raw.includes('\uFFFD')) raw = new TextDecoder('windows-1252').decode(buf);
  raw = raw.replace(/^\uFEFF/, '');

  const lines = raw.split(/\r?\n/).filter((l) => l.trim() !== '');
  const dataLines = lines.slice(1); // pula cabeçalho

  // 2) Ordena pelo CÓDIGO REAL (coluna 2) — garante pais antes dos filhos
  dataLines.sort((a, b) =>
    (a.split(';')[2] || '').trim().localeCompare((b.split(';')[2] || '').trim()),
  );

  // 3) Desativa contas antigas do plano (limpa a v1 com códigos errados)
  const deactivated = await prisma.accountingAccount.updateMany({
    where: { companyId, planName: PLAN },
    data: { isActive: false },
  });

  const codeToId = new Map<string, string>();
  let created = 0;
  let updated = 0;

  for (const line of dataLines) {
    const cols = line.split(';');
    if (cols.length < 8) continue;

    const code = (cols[2] || '').trim().replace(/\.+$/, ''); // código real, sem ponto solto no fim
    const tipo = (cols[3] || '').trim().toUpperCase();        // 'T' = sintética
    const name = (cols[4] || '').trim();
    const grupo = (cols[6] || '').trim();
    if (!code || !name) continue;

    const type = inferType(code, grupo);
    const nature = inferNature(type);
    const level = (code.match(/\./g) || []).length + 1;

    // Resolve o pai (tudo antes do último ponto)
    let parentId: string | null = null;
    const lastDot = code.lastIndexOf('.');
    if (lastDot > 0) parentId = codeToId.get(code.substring(0, lastDot)) || null;

    // Idempotente: atualiza se existe, cria se não
    const existing = await prisma.accountingAccount.findFirst({
      where: { companyId, planName: PLAN, code },
    });

    if (existing) {
      await prisma.accountingAccount.update({
        where: { id: existing.id },
        data: { name, type: type as any, nature: nature as any, level, parentId, isActive: true },
      });
      codeToId.set(code, existing.id);
      updated++;
    } else {
      const acc = await prisma.accountingAccount.create({
        data: {
          companyId, planName: PLAN, code, name,
          type: type as any, nature: nature as any,
          level, parentId, isActive: true,
        },
      });
      codeToId.set(code, acc.id);
      created++;
    }
  }

  console.log(
    `✅ Plano "${PLAN}": ${created} criadas, ${updated} atualizadas ` +
    `(${deactivated.count} antigas desativadas).`,
  );
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
// =================================================================
// FIM: backend/src/seed-chart-of-accounts.ts
// =================================================================