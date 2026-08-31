// =================================================================
// backend/prisma/seed-turnover.ts — Seed de dados mensais (B4)
// Preenche TurnoverMonthly 2026 (meses 1–8) p/ abas Empresa/Tipo
// Contratual mostrarem gráficos e tabelas populados.
// Uso: npx ts-node prisma/seed-turnover.ts
// =================================================================
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const company = await prisma.company.findFirst({ where: { name: 'Conta Certa Demo' } });
  const admin = await prisma.user.findFirst({ where: { email: 'admin@demo.com' } });
  if (!company || !admin) throw new Error('❌ Empresa/admin não encontrados.');

  // Estado inicial por tipo contratual
  let clt = 8, intern = 2, third = 1, partner = 1;

  // Eventos planejados p/ parecer real (admissões/demissões pontuais)
  const events: Record<number, { cltA?: number; cltD?: number; intA?: number; intD?: number }> = {
    2: { intA: 1 },          // estagiário entra em fev
    3: { cltA: 2 },          // 2 contratações CLT em mar
    5: { cltD: 1 },          // 1 desligamento CLT em mai
    7: { intD: 1 },          // estagiário sai em jul (novato <12m!)
  };

  for (let m = 1; m <= 8; m++) {
    const ev = events[m] || {};
    const cltA = ev.cltA || 0, cltD = ev.cltD || 0;
    const intA = ev.intA || 0, intD = ev.intD || 0;

    await prisma.turnoverMonthly.upsert({
      where: { companyId_year_month: { companyId: company.id, year: 2026, month: m } },
      update: {}, // não sobrescreve preenchimento manual existente
      create: {
        companyId: company.id, userId: admin.id, year: 2026, month: m,
        cltInitial: clt, cltAdmissions: cltA, cltDismissals: cltD,
        internInitial: intern, internAdmissions: intA, internDismissals: intD,
        thirdInitial: third, thirdAdmissions: 0, thirdDismissals: 0,
        partnerInitial: partner, partnerAdmissions: 0, partnerDismissals: 0,
      },
    });

    // Carry-over: próximo inicial = inicial + admissões − demissões
    clt = clt + cltA - cltD;
    intern = intern + intA - intD;
  }

  console.log('✅ Seed de TurnoverMonthly 2026 concluído (8 meses).');
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());