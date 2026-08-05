/**
 * =================================================================
 * 🎲 SEED DEMO: Dados Fictícios para Demonstração
 * =================================================================
 * Popula o sistema com 12 meses de dados realistas de um
 * escritório contábil fictício (Conta Certa Demo).
 * 
 * 🎯 PROPÓSITO: Demonstrações comerciais, testes e screenshots
 * 🔁 IDEMPOTENTE: Limpa e recria os dados demo a cada execução
 * 📅 PERÍODO: Agosto/2025 → Julho/2026 (12 meses)
 * 
 * EXECUÇÃO: npx ts-node src/seed-demo.ts
 * =================================================================
 */

import {
  PrismaClient,
  UserRole,
  EmployeeStatus,
  ClientStatus,
  ServiceType,
  TransactionType,
  ProposalStatus,
  Recurrence,
  AccountType,
  AccountNature,
  PlanningStatus,
} from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

// =================================================================
// 🎲 GERADOR DETERMINÍSTICO (dados sempre iguais = demo reproduzível)
// =================================================================
function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rand = mulberry32(20260805);
const randInt = (min: number, max: number) => Math.floor(rand() * (max - min + 1)) + min;
const pick = <T>(arr: T[]): T => arr[Math.floor(rand() * arr.length)];

// =================================================================
// 📅 HELPERS DE DATA
// =================================================================
const monthDate = (year: number, month: number, day = 15) => new Date(year, month - 1, day);

// =================================================================
// 📈 EVOLUÇÃO DA CARTEIRA (12 meses) — alimenta ClientMonthlyData
// =================================================================
const evolucaoCarteira = [
  { year: 2025, month: 8,  initial: 17, new: 1, churn: 0, revenue: 23800 },
  { year: 2025, month: 9,  initial: 18, new: 2, churn: 1, revenue: 25100 },
  { year: 2025, month: 10, initial: 19, new: 1, churn: 0, revenue: 26300 },
  { year: 2025, month: 11, initial: 20, new: 2, churn: 1, revenue: 27600 },
  { year: 2025, month: 12, initial: 21, new: 1, churn: 0, revenue: 28400 },
  { year: 2026, month: 1,  initial: 22, new: 2, churn: 1, revenue: 29800 },
  { year: 2026, month: 2,  initial: 23, new: 1, churn: 1, revenue: 30500 },
  { year: 2026, month: 3,  initial: 23, new: 2, churn: 0, revenue: 32100 },
  { year: 2026, month: 4,  initial: 25, new: 1, churn: 1, revenue: 33000 },
  { year: 2026, month: 5,  initial: 25, new: 2, churn: 0, revenue: 34600 },
  { year: 2026, month: 6,  initial: 27, new: 1, churn: 1, revenue: 35700 },
  { year: 2026, month: 7,  initial: 27, new: 1, churn: 0, revenue: 38200 },
];

// =================================================================
// 👥 MASSA DE DADOS: CLIENTES (28 empresas fictícias)
// =================================================================
const massaClientes: Array<{
  name: string; cnpj: string; type: ServiceType; regime: string; fee: number;
}> = [
  // --- MEI (8) ---
  { name: 'João Silva Fotografia MEI', cnpj: '12.345.678/0001-01', type: ServiceType.MEI, regime: 'MEI', fee: 180 },
  { name: 'Maria Santos Doces MEI', cnpj: '12.345.678/0001-02', type: ServiceType.MEI, regime: 'MEI', fee: 150 },
  { name: 'Carlos Mendes Elétrica MEI', cnpj: '12.345.678/0001-03', type: ServiceType.MEI, regime: 'MEI', fee: 160 },
  { name: 'Ana Paula Moda MEI', cnpj: '12.345.678/0001-04', type: ServiceType.MEI, regime: 'MEI', fee: 170 },
  { name: 'Pedro Costa Jardinagem MEI', cnpj: '12.345.678/0001-05', type: ServiceType.MEI, regime: 'MEI', fee: 150 },
  { name: 'Lucia Ferreira Estética MEI', cnpj: '12.345.678/0001-06', type: ServiceType.MEI, regime: 'MEI', fee: 200 },
  { name: 'Roberto Lima Transporte MEI', cnpj: '12.345.678/0001-07', type: ServiceType.MEI, regime: 'MEI', fee: 190 },
  { name: 'Fernanda Souza Marketing MEI', cnpj: '12.345.678/0001-08', type: ServiceType.MEI, regime: 'MEI', fee: 220 },
  // --- SIMPLES NACIONAL (12) ---
  { name: 'Tech Solutions LTDA', cnpj: '22.345.678/0001-11', type: ServiceType.CONTABIL, regime: 'Simples Nacional', fee: 850 },
  { name: 'Padaria Estrela do Sul', cnpj: '22.345.678/0001-12', type: ServiceType.CONTABIL, regime: 'Simples Nacional', fee: 620 },
  { name: 'Auto Peças Central LTDA', cnpj: '22.345.678/0001-13', type: ServiceType.FISCAL, regime: 'Simples Nacional', fee: 780 },
  { name: 'Clínica Vida Plena LTDA', cnpj: '22.345.678/0001-14', type: ServiceType.CONTABIL, regime: 'Simples Nacional', fee: 950 },
  { name: 'Construtora Horizonte LTDA', cnpj: '22.345.678/0001-15', type: ServiceType.CONTABIL, regime: 'Simples Nacional', fee: 1150 },
  { name: 'Restaurante Sabor Caseiro', cnpj: '22.345.678/0001-16', type: ServiceType.FISCAL, regime: 'Simples Nacional', fee: 580 },
  { name: 'Loja Bella Moda LTDA', cnpj: '22.345.678/0001-17', type: ServiceType.CONTABIL, regime: 'Simples Nacional', fee: 540 },
  { name: 'Transportadora Rota Sul', cnpj: '22.345.678/0001-18', type: ServiceType.FISCAL, regime: 'Simples Nacional', fee: 1050 },
  { name: 'Escola Infantil Crescer', cnpj: '22.345.678/0001-19', type: ServiceType.PESSOAL, regime: 'Simples Nacional', fee: 890 },
  { name: 'Farmácia Bem Estar LTDA', cnpj: '22.345.678/0001-20', type: ServiceType.CONTABIL, regime: 'Simples Nacional', fee: 720 },
  { name: 'Gráfica Impressão Rápida', cnpj: '22.345.678/0001-21', type: ServiceType.FISCAL, regime: 'Simples Nacional', fee: 680 },
  { name: 'Academia Corpo Ativo LTDA', cnpj: '22.345.678/0001-22', type: ServiceType.CONTABIL, regime: 'Simples Nacional', fee: 610 },
  // --- LUCRO PRESUMIDO (6) ---
  { name: 'Indústria Metalúrgica Aço Forte', cnpj: '32.345.678/0001-31', type: ServiceType.CONTABIL, regime: 'Lucro Presumido', fee: 2400 },
  { name: 'Distribuidora Alimentos Sul', cnpj: '32.345.678/0001-32', type: ServiceType.FISCAL, regime: 'Lucro Presumido', fee: 2100 },
  { name: 'Construtora Edifica Prime', cnpj: '32.345.678/0001-33', type: ServiceType.CONTABIL, regime: 'Lucro Presumido', fee: 2800 },
  { name: 'Importadora Global Trade', cnpj: '32.345.678/0001-34', type: ServiceType.FISCAL, regime: 'Lucro Presumido', fee: 3100 },
  { name: 'Hospital Saúde Total', cnpj: '32.345.678/0001-35', type: ServiceType.CONTABIL, regime: 'Lucro Presumido', fee: 3400 },
  { name: 'Rede Postos Estrela', cnpj: '32.345.678/0001-36', type: ServiceType.FISCAL, regime: 'Lucro Presumido', fee: 2650 },
  // --- LUCRO REAL (2) ---
  { name: 'Grupo Industrial Alfa S.A.', cnpj: '42.345.678/0001-41', type: ServiceType.CONTABIL, regime: 'Lucro Real', fee: 5800 },
  { name: 'Banco Regional Sul S.A.', cnpj: '42.345.678/0001-42', type: ServiceType.CONSULTORIA, regime: 'Lucro Real', fee: 7200 },
];

// =================================================================
// 👷 MASSA DE DADOS: COLABORADORES (para turnover)
// =================================================================
const massaColaboradores = [
  { name: 'Mariana Oliveira', role: 'Analista Contábil', dept: 'Contábil', admission: '2023-02-10', status: EmployeeStatus.ACTIVE },
  { name: 'Ricardo Santos', role: 'Analista Fiscal', dept: 'Fiscal', admission: '2023-05-15', status: EmployeeStatus.ACTIVE },
  { name: 'Juliana Costa', role: 'Analista de DP', dept: 'DP', admission: '2024-01-20', status: EmployeeStatus.ACTIVE },
  { name: 'Bruno Almeida', role: 'Assistente Contábil', dept: 'Contábil', admission: '2024-03-05', status: EmployeeStatus.ACTIVE },
  { name: 'Patrícia Rocha', role: 'Analista Fiscal Sênior', dept: 'Fiscal', admission: '2022-08-01', status: EmployeeStatus.ACTIVE },
  { name: 'Eduardo Lima', role: 'Analista Societário', dept: 'Societário', admission: '2023-11-12', status: EmployeeStatus.ACTIVE },
  { name: 'Camila Duarte', role: 'Atendimento', dept: 'Atendimento', admission: '2024-06-18', status: EmployeeStatus.ACTIVE },
  { name: 'Felipe Martins', role: 'Assistente Fiscal', dept: 'Fiscal', admission: '2025-02-03', status: EmployeeStatus.ACTIVE },
  { name: 'Larissa Pereira', role: 'Analista de DP', dept: 'DP', admission: '2025-04-14', status: EmployeeStatus.ACTIVE },
  { name: 'Gustavo Nunes', role: 'Estagiário Contábil', dept: 'Contábil', admission: '2025-07-01', status: EmployeeStatus.ACTIVE },
  { name: 'Beatriz Carvalho', role: 'Analista Contábil', dept: 'Contábil', admission: '2024-09-22', status: EmployeeStatus.ACTIVE },
  { name: 'Thiago Ribeiro', role: 'Analista de Sistemas', dept: 'TI', admission: '2023-07-30', status: EmployeeStatus.ACTIVE },
  // Demitidos no período (para calcular turnover)
  { name: 'Vanessa Moraes', role: 'Assistente Fiscal', dept: 'Fiscal', admission: '2024-02-01', status: EmployeeStatus.DISMISSED },
  { name: 'Diego Fonseca', role: 'Analista Contábil', dept: 'Contábil', admission: '2023-10-05', status: EmployeeStatus.DISMISSED },
  { name: 'Aline Teixeira', role: 'Atendimento', dept: 'Atendimento', admission: '2024-11-11', status: EmployeeStatus.DISMISSED },
];

// =================================================================
// 📋 MASSA DE DADOS: PROPOSTAS (funil de vendas)
// =================================================================
const massaPropostas = [
  { name: 'Supermercado Bom Preço', regime: 'Simples Nacional', value: 890, status: ProposalStatus.CLOSED_WON, daysAgo: 5 },
  { name: 'Clínica Odonto Sorriso', regime: 'Lucro Presumido', value: 2200, status: ProposalStatus.CLOSED_WON, daysAgo: 12 },
  { name: 'Loja Virtual TechShop', regime: 'Simples Nacional', value: 650, status: ProposalStatus.CLOSED_WON, daysAgo: 20 },
  { name: 'Escritório Advocacia Prime', regime: 'Lucro Presumido', value: 1900, status: ProposalStatus.CLOSED_WON, daysAgo: 35 },
  { name: 'Distribuidora Bebidas Sul', regime: 'Lucro Real', value: 4800, status: ProposalStatus.CLOSED_WON, daysAgo: 48 },
  { name: 'Papelaria Central', regime: 'Simples Nacional', value: 480, status: ProposalStatus.CLOSED_LOST, daysAgo: 8 },
  { name: 'Oficina Mecânica Turbo', regime: 'Simples Nacional', value: 560, status: ProposalStatus.CLOSED_LOST, daysAgo: 22 },
  { name: 'Agência Viajar Mais', regime: 'Lucro Presumido', value: 1700, status: ProposalStatus.CLOSED_LOST, daysAgo: 40 },
  { name: 'Restaurante Comida Mineira', regime: 'Simples Nacional', value: 620, status: ProposalStatus.CLOSED_LOST, daysAgo: 55 },
  { name: 'Transportadora Veloz', regime: 'Lucro Presumido', value: 2400, status: ProposalStatus.SENT, daysAgo: 3 },
  { name: 'Studio Arquitetura Moderna', regime: 'Lucro Presumido', value: 1850, status: ProposalStatus.SENT, daysAgo: 6 },
  { name: 'Pet Shop Amigo Fiel', regime: 'Simples Nacional', value: 540, status: ProposalStatus.VIEWED, daysAgo: 2 },
  { name: 'Consultoria RH Talentos', regime: 'Lucro Presumido', value: 1600, status: ProposalStatus.VIEWED, daysAgo: 4 },
  { name: 'Barbearia Estilo Black', regime: 'MEI', value: 220, status: ProposalStatus.DRAFT, daysAgo: 1 },
  { name: 'Doceria Sonho Doce', regime: 'Simples Nacional', value: 510, status: ProposalStatus.DRAFT, daysAgo: 1 },
];

// =================================================================
// 🎯 FUNÇÃO PRINCIPAL
// =================================================================
async function main() {
  console.log('═'.repeat(70));
  console.log('🎲 SEED DEMO: Dados Fictícios para Demonstração');
  console.log('═'.repeat(70));

  // ---------------------------------------------------------------
  // 1️⃣ RESOLVER / CRIAR TENANT
  // ---------------------------------------------------------------
  let company = await prisma.company.findFirst({ where: { deletedAt: null } });
  if (!company) {
    company = await prisma.company.create({
      data: { name: 'Conta Certa Contabilidade Demo', cnpj: '00.000.000/0001-00', state: 'SP', plan: 'BASIC' },
    });
  }
  const companyId = company.id;
  console.log(`🏢 Tenant: ${company.name}`);

  // ---------------------------------------------------------------
  // 2️⃣ LIMPEZA IDEMPOTENTE (ordem correta: filhos antes dos pais)
  // ---------------------------------------------------------------
  console.log('🧹 Limpando dados demo anteriores...');
  await prisma.proposalItem.deleteMany({ where: { proposal: { companyId } } });
  await prisma.proposal.deleteMany({ where: { companyId } });
  await prisma.clientService.deleteMany({ where: { companyId } });
  await prisma.clientContract.deleteMany({ where: { companyId } });
  await prisma.accountingEntry.deleteMany({ where: { companyId } });
  await prisma.financialTransaction.deleteMany({ where: { companyId } });
  await prisma.clientMonthlyData.deleteMany({ where: { companyId } });
  await prisma.turnoverSectorDistribution.deleteMany({ where: { companyId } });
  await prisma.turnoverMonthly.deleteMany({ where: { companyId } });
  await prisma.resignation.deleteMany({ where: { companyId } });
  await prisma.actionPlan.deleteMany({ where: { companyId } });
  await prisma.planningGoal.deleteMany({ where: { companyId } });
  await prisma.planningObjective.deleteMany({ where: { companyId } });
  await prisma.planningCycle.deleteMany({ where: { companyId } });
  await prisma.client.deleteMany({ where: { companyId } });
  await prisma.employee.deleteMany({ where: { companyId } });
  console.log('✅ Limpeza concluída.\n');

  // ---------------------------------------------------------------
  // 3️⃣ USUÁRIO ADMIN (para login na demo)
  // ---------------------------------------------------------------
  console.log('👤 Criando usuário admin...');
  const hashedPassword = await bcrypt.hash('123456', 10);
  let adminUser = await prisma.user.findUnique({ where: { email: 'admin@demo.com' } });
  if (!adminUser) {
    adminUser = await prisma.user.create({
      data: { name: 'Marcos Admin', email: 'admin@demo.com', password: hashedPassword, role: UserRole.ADMIN, companyId },
    });
  }
  const userId = adminUser.id;
  console.log(`   📧 Email: admin@demo.com | 🔑 Senha: 123456\n`);

  // ---------------------------------------------------------------
  // 4️⃣ CATÁLOGO MÍNIMO (planos comerciais, se não existirem)
  // ---------------------------------------------------------------
  let plans = await prisma.commercialPlan.findMany({ where: { companyId, deletedAt: null } });
  if (plans.length === 0) {
    console.log('👑 Criando planos comerciais (START, PRIME, BLACK)...');
    await prisma.commercialPlan.createMany({
      data: [
        { companyId, name: 'START', multiplier: 0.8, order: 1, badge: 'ESSENCIAL', color: '#64748b' },
        { companyId, name: 'PRIME', multiplier: 1.0, order: 2, badge: 'MAIS POPULAR', color: '#14b8a6' },
        { companyId, name: 'BLACK', multiplier: 1.4, order: 3, badge: 'PREMIUM', color: '#8b5cf6' },
      ],
    });
    plans = await prisma.commercialPlan.findMany({ where: { companyId } });
  }
  console.log(`   ✅ ${plans.length} planos disponíveis.\n`);

  // ---------------------------------------------------------------
  // 5️⃣ COLABORADORES + TURNOVER
  // ---------------------------------------------------------------
  console.log('👷 Criando colaboradores e dados de turnover...');
  for (const col of massaColaboradores) {
    await prisma.employee.create({
      data: {
        userId, companyId,
        name: col.name, position: col.role, department: col.dept,
        admissionDate: new Date(col.admission),
        status: col.status,
        salary: randInt(3000, 7500),
        email: `${col.name.split(' ')[0].toLowerCase()}@contacerta.com.br`,
        ...(col.status === EmployeeStatus.DISMISSED ? { dismissalDate: monthDate(2026, randInt(1, 6)) } : {}),
      },
    });
  }

  // Turnover mensal (12 meses)
  for (const m of evolucaoCarteira) {
    const cltInitial = 13 + randInt(-1, 2);
    const dismissals = m.churn > 0 ? 1 : 0;
    await prisma.turnoverMonthly.create({
      data: {
        userId, companyId, year: m.year, month: m.month,
        cltInitial, cltAdmissions: m.new, cltDismissals: dismissals,
        internInitial: 1, internAdmissions: 0, internDismissals: 0,
        thirdInitial: 0, thirdAdmissions: 0, thirdDismissals: 0,
        partnerInitial: 2, partnerAdmissions: 0, partnerDismissals: 0,
      },
    });
  }
  console.log(`   ✅ ${massaColaboradores.length} colaboradores + 12 meses de turnover.\n`);

  // ---------------------------------------------------------------
  // 6️⃣ CLIENTES + CONTRATOS
  // ---------------------------------------------------------------
  console.log('🏢 Criando 28 clientes com contratos...');
  for (let i = 0; i < massaClientes.length; i++) {
    const c = massaClientes[i];
    const client = await prisma.client.create({
      data: {
        userId, companyId,
        companyName: c.name, cnpj: c.cnpj,
        serviceType: c.type, monthlyFee: c.fee,
        status: ClientStatus.ATIVO,
        startDate: monthDate(2025, randInt(8, 12)),
        contactName: pick(['Ana', 'Bruno', 'Carla', 'Diego', 'Elisa', 'Fábio']),
        contactEmail: `contato@${c.name.toLowerCase().replace(/\s+/g, '').substring(0, 12)}.com.br`,
        contactPhone: `(11) 9${randInt(7000, 9999)}-${randInt(1000, 9999)}`,
        observations: `Cliente do regime ${c.regime}.`,
      },
    });

    // Vincula a um plano comercial (contrato)
    const plan = plans[i % plans.length];
    await prisma.clientContract.create({
      data: {
        companyId, clientId: client.id, commercialPlanId: plan.id,
        startDate: client.startDate, monthlyFee: c.fee, status: 'ATIVO',
      },
    });
  }
  console.log(`   ✅ 28 clientes + contratos criados.\n`);

  // ---------------------------------------------------------------
  // 7️⃣ EVOLUÇÃO MENSAL DA CARTEIRA (ClientMonthlyData)
  // ---------------------------------------------------------------
  console.log('📈 Criando evolução mensal da carteira (12 meses)...');
  let accumulatedChurn = 0;
  for (const m of evolucaoCarteira) {
    const finalClients = m.initial + m.new - m.churn;
    const churnRate = m.initial > 0 ? (m.churn / m.initial) * 100 : 0;
    accumulatedChurn += churnRate;
    await prisma.clientMonthlyData.create({
      data: {
        companyId, userId, year: m.year, month: m.month,
        initialClients: m.initial, newClients: m.new, churnedClients: m.churn, finalClients,
        newRevenue: m.new * 650, lostRevenue: m.churn * 520, finalRevenue: m.revenue,
        churnRate: Number(churnRate.toFixed(2)),
        accumulatedChurn: Number(accumulatedChurn.toFixed(2)),
      },
    });
  }
  console.log(`   ✅ Evolução da carteira criada.\n`);

  // ---------------------------------------------------------------
  // 8️⃣ FINANCEIRO: RECEITAS + DESPESAS (alimenta DRE e BI)
  // ---------------------------------------------------------------
  console.log('💰 Criando lançamentos financeiros (12 meses)...');
  for (const m of evolucaoCarteira) {
    // Receita principal (honorários)
    await prisma.financialTransaction.create({
      data: {
        userId, companyId, type: TransactionType.RECEITA,
        category: 'Honorários Contábeis',
        description: `Honorários do mês ${m.month}/${m.year}`,
        amount: m.revenue, date: monthDate(m.year, m.month, 28),
      },
    });
    // Receita avulsa eventual
    if (rand() > 0.5) {
      await prisma.financialTransaction.create({
        data: {
          userId, companyId, type: TransactionType.RECEITA,
          category: 'Serviços Avulsos',
          description: pick(['Abertura de Empresa', 'Declaração IRPF', 'Consultoria Tributária']),
          amount: randInt(350, 900), date: monthDate(m.year, m.month, randInt(10, 25)),
        },
      });
    }
    // Despesas fixas mensais
    const despesas = [
      { cat: 'Salários e Encargos', desc: 'Folha de pagamento', val: randInt(11500, 12800) },
      { cat: 'Aluguel', desc: 'Aluguel do escritório', val: 2500 },
      { cat: 'Software', desc: 'Sistemas contábeis e ERP', val: 820 },
      { cat: 'Marketing', desc: 'Tráfego pago e redes sociais', val: randInt(500, 750) },
      { cat: 'Utilidades', desc: 'Energia, água e internet', val: 460 },
      { cat: 'Impostos', desc: 'ISS e impostos sobre serviço', val: randInt(2800, 3400) },
      { cat: 'Material de Escritório', desc: 'Insumos e suprimentos', val: 210 },
    ];
    for (const d of despesas) {
      await prisma.financialTransaction.create({
        data: {
          userId, companyId, type: TransactionType.DESPESA,
          category: d.cat, description: d.desc,
          amount: d.val, date: monthDate(m.year, m.month, randInt(5, 20)),
        },
      });
    }
  }

  // 🎯 OUTLIER: despesa atípica para o BI "Ponto Fora da Curva" detectar
  await prisma.financialTransaction.create({
    data: {
      userId, companyId, type: TransactionType.DESPESA,
      category: 'Investimentos',
      description: '⚠️ Aquisição de servidores e equipamentos de TI (atípico)',
      amount: 15800, date: monthDate(2026, 3, 15),
    },
  });
  console.log(`   ✅ Financeiro criado (incluindo 1 outlier para o BI detectar).\n`);

  // ---------------------------------------------------------------
  // 9️⃣ PROPOSTAS COMERCIAIS (funil de vendas)
  // ---------------------------------------------------------------
  console.log('📄 Criando propostas comerciais (funil)...');
  const now = new Date(2026, 7, 5);
  let proposalSeq = 1;
  for (const p of massaPropostas) {
    const createdAt = new Date(now.getTime() - p.daysAgo * 24 * 60 * 60 * 1000);
    const isWon = p.status === ProposalStatus.CLOSED_WON;
    const isLost = p.status === ProposalStatus.CLOSED_LOST;
    await prisma.proposal.create({
      data: {
        companyId, userId,
        proposalNumber: `PROP-2026-${String(proposalSeq++).padStart(3, '0')}`,
        slug: `prop-${p.name.toLowerCase().replace(/\s+/g, '-')}-${proposalSeq}`,
        clientName: p.name, taxRegime: p.regime,
        activity: 'Comércio e Serviços',
        monthlyRevenue: p.value * 8, employeeCount: randInt(2, 25),
        basePrice: p.value, status: p.status,
        createdAt, updatedAt: createdAt,
        ...(isWon ? { closedAt: createdAt, closedPrice: p.value } : {}),
        ...(isLost ? { lossReason: pick(['Preço acima do orçamento', 'Fechou com concorrente', 'Sem resposta']) } : {}),
        views: randInt(1, 8), whatsappClicks: randInt(0, 3),
      },
    });
  }
  console.log(`   ✅ ${massaPropostas.length} propostas criadas (5 ganhas, 4 perdidas, 6 em andamento).\n`);

  // ---------------------------------------------------------------
  // 🔟 PLANEJAMENTO ESTRATÉGICO
  // ---------------------------------------------------------------
  console.log('🎯 Criando planejamento estratégico...');
  const cycle = await prisma.planningCycle.create({
    data: {
      companyId, name: 'Planejamento Estratégico 2026',
      startDate: new Date('2026-01-01'), endDate: new Date('2026-12-31'),
      responsible: 'Marcos Admin',
    },
  });
  const objectives = [
    { code: 'OBJ-01', title: 'Expandir carteira de clientes', goal: 'Atingir 35 clientes ativos até dezembro', target: 35, unit: 'clientes' },
    { code: 'OBJ-02', title: 'Aumentar receita recorrente', goal: 'Alcançar R$ 45.000 de MRR', target: 45000, unit: 'R$/mês' },
    { code: 'OBJ-03', title: 'Reduzir churn', goal: 'Manter churn mensal abaixo de 2%', target: 2, unit: '%' },
  ];
  for (const obj of objectives) {
    const objective = await prisma.planningObjective.create({
      data: {
        companyId, cycleId: cycle.id, code: obj.code, title: obj.title,
        context: obj.goal, startDate: new Date('2026-01-01'), endDate: new Date('2026-12-31'),
      },
    });
    const goal = await prisma.planningGoal.create({
      data: { companyId, objectiveId: objective.id, title: obj.goal, targetValue: obj.target, unit: obj.unit },
    });
    await prisma.actionPlan.create({
      data: {
        companyId, goalId: goal.id,
        action: `Ação estratégica para: ${obj.title}`,
        responsible: 'Marcos Admin', dueDate: new Date('2026-09-30'),
        status: PlanningStatus.EM_ANDAMENTO,
      },
    });
  }
  console.log(`   ✅ Planejamento criado (3 objetivos + metas + ações).\n`);

  // ---------------------------------------------------------------
  // 1️⃣1️⃣ RELATÓRIO FINAL
  // ---------------------------------------------------------------
  console.log('═'.repeat(70));
  console.log('📈 RESUMO DA DEMONSTRAÇÃO');
  console.log('═'.repeat(70));
  console.log(`   👤 Usuário admin:    admin@demo.com / 123456`);
  console.log(`   🏢 Clientes ativos:  ${massaClientes.length}`);
  console.log(`   💰 MRR atual:        R$ 38.200,00`);
  console.log(`   👷 Colaboradores:    ${massaColaboradores.length} (3 demitidos no período)`);
  console.log(`   📄 Propostas:        ${massaPropostas.length} (33% de conversão)`);
  console.log(`   📅 Período:          Ago/2025 → Jul/2026`);
  console.log('═'.repeat(70));
  console.log('🎉 Seed demo concluído com sucesso!\n');
}

main()
  .catch((e) => {
    console.error('❌ Erro fatal:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });