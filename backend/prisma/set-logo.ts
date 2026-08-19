// =================================================================
// INÍCIO: backend/prisma/set-logo.ts
// =================================================================
/**
 * Sprint A6 (validação) — vincula o logotipo ao tenant demo.
 * O logo fica em frontend/public (mesma origem do browser), então
 * usamos caminho relativo: sem CORS, sem taint no canvas (ADR-045/046).
 * Uso: npx ts-node prisma/set-logo.ts
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const updated = await prisma.company.updateMany({
    where: { name: 'Conta Certa Demo' },
    data: { logoUrl: '/logo-conta-certa.png' },
  });
  console.log(`✅ logoUrl definido em ${updated.count} empresa(s)`);
}

main()
  .catch((e) => {
    console.error('❌ Erro:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
// =================================================================
// FIM: backend/prisma/set-logo.ts
// =================================================================