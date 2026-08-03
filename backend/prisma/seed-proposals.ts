import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const clientes = [
  { nome: 'Restaurante Sabor & Arte', cnpj: '12.345.678/0001-01' },
  { nome: 'Tech Solutions Ltda', cnpj: '23.456.789/0001-02' },
  { nome: 'Clínica Saúde Total', cnpj: '34.567.890/0001-03' },
  { nome: 'Auto Peças Veloz', cnpj: '45.678.901/0001-04' },
  { nome: 'Padaria Pão Quente', cnpj: '56.789.012/0001-05' },
  { nome: 'Escritório Advocacia Silva', cnpj: '67.890.123/0001-06' },
  { nome: 'Academia Fit Life', cnpj: '78.901.234/0001-07' },
  { nome: 'Loja Fashion Store', cnpj: '89.012.345/0001-08' },
  { nome: 'Consultoria ABC', cnpj: '90.123.456/0001-09' },
  { nome: 'Imobiliária Casa Nova', cnpj: '01.234.567/0001-10' },
];

async function main() {
  console.log('🌱 Gerando propostas fictícias...');
  const company = await prisma.company.findFirst();
  const user = await prisma.user.findFirst({ where: { companyId: company?.id } });
  const planos = await prisma.commercialPlan.findMany({ where: { companyId: company?.id }, orderBy: { multiplier: 'asc' } });

  if (!company || !user || planos.length === 0) {
    console.error('❌ Falta empresa, usuário ou planos no banco. Rode o seed principal primeiro.');
    return;
  }

  await prisma.proposal.deleteMany({ where: { companyId: company.id } });
  const anoAtual = new Date().getFullYear();

  for (let i = 0; i < 30; i++) {
    const cliente = clientes[i % clientes.length];
    const dataCriacao = new Date(anoAtual, new Date().getMonth() - Math.floor(Math.random() * 6), Math.floor(Math.random() * 28) + 1);
    const rand = Math.random();
    const status = rand > 0.65 ? 'CLOSED' : rand > 0.40 ? 'LOST' : 'SENT';
    const plano = planos[Math.floor(Math.random() * planos.length)];
    const basePrice = Math.round((800 + Math.random() * 4200) * 100) / 100;
    const finalPrice = Math.round(basePrice * plano.multiplier * 100) / 100;
    const closedPrice = status === 'CLOSED' ? Math.round((finalPrice - Math.random() * 200) * 100) / 100 : null;

    await prisma.proposal.create({
      data: {
        companyId: company.id,
        userId: user.id,
        proposalNumber: `${String(i + 1).padStart(4, '0')}/${anoAtual}`,
        slug: `${cliente.nome.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${i + 1}`,
        clientName: cliente.nome,
        clientCnpj: cliente.cnpj,
        taxRegime: 'Simples Nacional',
        activity: 'Serviço',
        monthlyRevenue: 15000,
        employeeCount: 5,
        basePrice,
        includedPlans: JSON.stringify([{ planId: plano.id, planName: plano.name, multiplier: plano.multiplier, finalPrice, badge: plano.badge }]),
        status,
        closedAt: status === 'CLOSED' ? dataCriacao : null,
        closedPlanId: status === 'CLOSED' ? plano.id : null,
        closedPrice,
        lossReason: status === 'LOST' ? 'Preço alto' : null,
        createdAt: dataCriacao,
        updatedAt: dataCriacao,
      },
    });
  }
  console.log('✅ 30 propostas criadas com sucesso! Atualize o navegador.');
}

main().catch(console.error).finally(() => prisma.$disconnect());