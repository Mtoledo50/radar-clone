// =================================================================
// INÍCIO: backend/prisma/seed-proposals.ts
// =================================================================
/**
 * =================================================================
 * SEED DE PROPOSTAS — base de teste p/ Sprints A4/A5/A6
 * =================================================================
 * Cria (idempotente — não duplica ao rodar 2x):
 *  - 3 planos comerciais (START 1.0x / PRIME 1.2x / BLACK 1.4x)
 *  - 3 itens de serviço (caso o catálogo ainda não exista)
 *  - 5 propostas em status diferentes:
 *      1. Academia do Renan   → SENT        (testa fechamento A4 + PDF)
 *      2. Mercado Bom Preço   → VIEWED      (testa PDF/PNG público)
 *      3. Tech Solutions      → DRAFT       (rascunho p/ wizard)
 *      4. Padaria Pão Quente  → CLOSED_WON  (com memória de ganho A4)
 *      5. Oficina Turbo       → CLOSED_LOST (motivo de perda p/ BI)
 *
 * Pré-requisitos: rodar seed-users.ts (empresa + admin) antes.
 * Uso: npx ts-node prisma/seed-proposals.ts
 * =================================================================
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/** ADR-020: round2 em todos os valores monetários. */
const round2 = (v: number) => Math.round(v * 100) / 100;

/** Slug não-sequencial (segurança — não expõe ID interno). */
function slugify(s: string, suffix: number): string {
  const clean = s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  return `${clean}-${Date.now() + suffix}`;
}

async function main() {
  console.log('🌱 Seed de Propostas (base de teste A4/A5/A6)...\n');

  // ------------------------------------------------------------------
  // 1) Empresa + usuário admin (pré-requisito do seed-users.ts)
  // ------------------------------------------------------------------
  const company = await prisma.company.findFirst({
    where: { name: 'Conta Certa Demo' },
  });
  if (!company) {
    throw new Error('❌ Empresa "Conta Certa Demo" não encontrada. Rode: npx ts-node prisma/seed-users.ts');
  }

  const admin = await prisma.user.findFirst({
    where: { email: 'admin@demo.com' },
  });
  if (!admin) {
    throw new Error('❌ Usuário admin@demo.com não encontrado. Rode: npx ts-node prisma/seed-users.ts');
  }

  // ------------------------------------------------------------------
  // 2) Itens de serviço (idempotente — reaproveita o catálogo se existir)
  // ------------------------------------------------------------------
  let category = await prisma.serviceCategory.findFirst({
    where: { companyId: company.id, name: 'Contábil' },
  });
  if (!category) {
    category = await prisma.serviceCategory.create({
      data: { companyId: company.id, name: 'Contábil', order: 1 },
    });
  }

  const itemSpecs = [
    { name: 'Escrituração Contábil Mensal', basePrice: 890 },
    { name: 'Consultoria Tributária', basePrice: 600 },
    { name: 'Declaração Anual IRPF', basePrice: 320 },
  ];
  const itemIds: string[] = [];
  for (const spec of itemSpecs) {
    let item = await prisma.serviceItem.findFirst({
      where: { companyId: company.id, name: spec.name },
    });
    if (!item) {
      item = await prisma.serviceItem.create({
        data: {
          companyId: company.id,
          categoryId: category.id,
          name: spec.name,
          basePrice: spec.basePrice,
          estimatedHours: 4,
          recurrence: 'MENSAL',
          isActive: true,
        },
      });
    }
    itemIds.push(item.id);
  }
  console.log(`✅ Itens de serviço prontos (${itemIds.length})`);

  // ------------------------------------------------------------------
  // 3) Planos comerciais START / PRIME / BLACK + vínculo de itens
  // ------------------------------------------------------------------
  const BASE = 2000; // valor de referência (A2)
  const planSpecs = [
    { name: 'START', multiplier: 1.0, badge: 'ESSENCIAL', color: '#64748b', items: [itemIds[0]] },
    { name: 'PRIME', multiplier: 1.2, badge: 'MAIS VENDIDO', color: '#0d9488', items: [itemIds[0], itemIds[1]] },
    { name: 'BLACK', multiplier: 1.4, badge: 'PREMIUM', color: '#1e293b', items: itemIds },
  ];

  const plans: Record<string, { id: string; multiplier: number }> = {};
  for (const spec of planSpecs) {
    let plan = await prisma.commercialPlan.findFirst({
      where: { companyId: company.id, name: spec.name },
    });
    if (!plan) {
      plan = await prisma.commercialPlan.create({
        data: {
          companyId: company.id,
          name: spec.name,
          multiplier: spec.multiplier,
          badge: spec.badge,
          color: spec.color,
          description: `Plano ${spec.name} da base de teste`,
          order: spec.multiplier * 10,
        },
      });
    }
    // Vínculo idempotente: limpa e recria os itens do plano
    await prisma.planServiceItem.deleteMany({ where: { planId: plan.id } });
    await prisma.planServiceItem.createMany({
      data: spec.items.map((serviceItemId) => ({ planId: plan.id, serviceItemId })),
    });
    plans[spec.name] = { id: plan.id, multiplier: plan.multiplier };
  }
  console.log('✅ Planos START/PRIME/BLACK prontos');

  // ------------------------------------------------------------------
  // 4) Propostas em 5 status diferentes (pula se já existir)
  // ------------------------------------------------------------------
  const now = new Date();
  const ym = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;
  const prefix = `PROP-${ym}-`;
  let seq = await prisma.proposal.count({
    where: { companyId: company.id, proposalNumber: { startsWith: prefix } },
  });

  interface Spec {
    clientName: string;
    cnpj?: string;
    status: 'DRAFT' | 'SENT' | 'VIEWED' | 'CLOSED_WON' | 'CLOSED_LOST';
    plan: 'START' | 'PRIME' | 'BLACK';
    avulsos?: number[]; // índices em itemSpecs
    views?: number;
    lossReason?: string;
    aboutOffice?: string;
    differentials?: string;
    specificNote?: string;
  }

  const specs: Spec[] = [
    {
      clientName: 'Academia do Renan LTDA',
      cnpj: '12.345.678/0001-90',
      status: 'SENT',
      plan: 'PRIME',
      avulsos: [2],
      aboutOffice:
        'A Conta Certa é especialista em academias e negócios de saúde, com automação contábil de ponta a ponta.',
      differentials: 'Aurora (funcionária digital) • DRE em tempo real • Conciliação automática.',
    },
    {
      clientName: 'Mercado Bom Preço LTDA',
      cnpj: '23.456.789/0001-01',
      status: 'VIEWED',
      plan: 'BLACK',
      avulsos: [1, 2],
      views: 3,
      specificNote: 'Proposta inclui migração completa do sistema anterior sem custo adicional.',
    },
    { clientName: 'Tech Solutions LTDA', cnpj: '34.567.890/0001-12', status: 'DRAFT', plan: 'START' },
    {
      clientName: 'Padaria Pão Quente LTDA',
      cnpj: '45.678.901/0001-23',
      status: 'CLOSED_WON',
      plan: 'PRIME',
    },
    {
      clientName: 'Oficina Turbo Mecânica',
      cnpj: '56.789.012/0001-34',
      status: 'CLOSED_LOST',
      plan: 'START',
      lossReason: 'Fechou com concorrente mais barato',
    },
  ];

  for (let i = 0; i < specs.length; i++) {
    const s = specs[i];

    // Idempotência: não duplica proposta do mesmo cliente
    const existing = await prisma.proposal.findFirst({
      where: { companyId: company.id, clientName: s.clientName },
    });
    if (existing) {
      console.log(`⏭️  ${s.clientName} já existe (${existing.proposalNumber}) — pulando`);
      continue;
    }

    seq += 1;
    const proposalNumber = `${prefix}${String(seq).padStart(4, '0')}`;
    const plan = plans[s.plan];
    const planPrice = round2(BASE * plan.multiplier);

    // Memória de fechamento p/ CLOSED_WON (espelho da A4: 10% desc., pagava 1800)
    const ideal = planPrice;
    const final = round2(ideal * 0.9);
    const current = 1800;

    const proposal = await prisma.proposal.create({
      data: {
        companyId: company.id,
        userId: admin.id,
        proposalNumber,
        slug: slugify(s.clientName, i),
        clientName: s.clientName,
        clientCnpj: s.cnpj ?? null,
        taxRegime: 'SIMPLES_NACIONAL',
        activity: 'Serviços',
        monthlyRevenue: 45000,
        employeeCount: 8,
        basePrice: BASE,
        aboutOffice: s.aboutOffice ?? null,
        differentials: s.differentials ?? null,
        specificNote: s.specificNote ?? null,
        commercialTerms: 'Pagamento mensal via boleto • Reajuste anual pelo IPCA.',
        status: s.status,
        views: s.views ?? 0,
        sentAt: s.status !== 'DRAFT' ? new Date() : null,
        closedAt: s.status.startsWith('CLOSED') ? new Date() : null,
        closedPlanId: s.status === 'CLOSED_WON' ? plan.id : null,
        closedPrice: s.status === 'CLOSED_WON' ? final : null,
        lossReason: s.lossReason ?? null,
        closingDetails:
          s.status === 'CLOSED_WON'
            ? {
                discountPercent: 10,
                currentMonthly: current,
                idealPrice: ideal,
                finalPrice: final,
                concessionMonthly: round2(ideal - final),
                concessionYearly: round2((ideal - final) * 12),
                gainMonthly: round2(final - current),
                gainYearly: round2((final - current) * 12),
                belowCurrent: final < current,
                steps: [
                  `Preço cheio de referência: R$ ${ideal.toFixed(2)}/mês`,
                  'Desconto aplicado: 10.0%',
                  `Preço fechado: R$ ${final.toFixed(2)}/mês`,
                ],
                notes: 'Fechado em reunião presencial',
              }
            : null,
      },
    });

    // Itens da proposta: 1 plano + avulsos
    await prisma.proposalItem.createMany({
      data: [
        {
          proposalId: proposal.id,
          commercialPlanId: plan.id,
          quantity: 1,
          unitPrice: planPrice,
          totalPrice: planPrice,
        },
        ...(s.avulsos ?? []).map((idx) => ({
          proposalId: proposal.id,
          serviceItemId: itemIds[idx],
          quantity: 1,
          unitPrice: itemSpecs[idx].basePrice,
          totalPrice: itemSpecs[idx].basePrice,
        })),
      ],
    });

    console.log(`✅ ${s.clientName} [${s.status}] → ${proposalNumber} • slug: ${proposal.slug}`);
  }

  // ------------------------------------------------------------------
  // 5) Resumo + links p/ teste
  // ------------------------------------------------------------------
  const all = await prisma.proposal.findMany({
    where: { companyId: company.id },
    orderBy: { createdAt: 'desc' },
    select: { slug: true, clientName: true, status: true, proposalNumber: true },
  });

  console.log('\n🎉 Seed concluído! Propostas disponíveis:\n');
  for (const p of all) {
    console.log(`  [${p.status.padEnd(11)}] ${p.clientName}`);
    console.log(`     🔗 http://localhost:3000/proposta/${p.slug}\n`);
  }
  console.log('👉 Testes A6:');
  console.log('   1. /dashboard/precificacao → ícone 📄 (FileDown) em qualquer linha');
  console.log('   2. Abra um link público acima → barra flutuante "Baixar PDF" / "PNG p/ WhatsApp"');
}

main()
  .catch((e) => {
    console.error('❌ Erro no seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
// =================================================================
// FIM: backend/prisma/seed-proposals.ts
// =================================================================