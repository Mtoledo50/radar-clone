// =================================================================
// ARQUIVO: backend/prisma/seed.ts
// =================================================================
// 🌱 SEED ENTERPRISE — Radar Conta Certa
// =================================================================
// Popula o banco com dados realistas para testes de:
// - DRE PDF (contas RECEITA/DESPESA + lançamentos)
// - Balancete PDF (contas ATIVO/PASSIVO/PL + saldos)
// - Portal do Cliente (clientes + tarefas + propostas)
// - Gestão de Tarefas (Kanban)
// - Gestão de Projetos
//
// Como executar:
//   cd backend
//   npx prisma migrate reset --skip-seed  (limpa o banco)
//   npx prisma db seed                     (popula)
// =================================================================

import { PrismaClient, UserRole, ClientStatus, ServiceType, TaskStatus, TaskPriority, TaskCategory, ProjectStatus, AccountType, AccountNature } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

// =================================================================
// HELPERS
// =================================================================
const hashPassword = async (password: string) => bcrypt.hash(password, 10);
const randomId = () => Math.random().toString(36).substring(2, 10);

// =================================================================
// 1. EMPRESA (TENANT)
// =================================================================
async function seedCompany() {
  console.log('🏢 Criando empresa (tenant)...');
  
  const company = await prisma.company.upsert({
    where: { cnpj: '12.345.678/0001-99' },
    update: {},
    create: {
      name: 'Conta Certa Soluções Empresariais',
      cnpj: '12.345.678/0001-99',
      email: 'contato@contacerta.com.br',
      phone: '(51) 3000-0000',
      address: 'Av. Ipiranga, 1000 - Porto Alegre/RS',
      logoUrl: '/logo-conta-certa.png',
      primaryColor: '#0d9488',
      secondaryColor: '#f97316',
      plan: 'PROFESSIONAL',
      allowedModules: ['dashboard', 'pessoas', 'clientes', 'fiscal', 'bi', 'tasks', 'projects', 'portal'],
      softwareStack: ['Domínio', 'Sage'],
      businessGoals: 'Ser referência em contabilidade digital no RS até 2027.',
    },
  });
  
  console.log(`   ✅ Empresa: ${company.name}`);
  return company;
}

// =================================================================
// 2. USUÁRIOS
// =================================================================
async function seedUsers(companyId: string) {
  console.log('👤 Criando usuários...');
  
  const users = await Promise.all([
    prisma.user.upsert({
      where: { email: 'admin@contacerta.com.br' },
      update: {},
      create: {
        name: 'Marcos Admin',
        email: 'admin@contacerta.com.br',
        password: await hashPassword('admin123'),
        role: UserRole.ADMIN,
        companyId,
      },
    }),
    prisma.user.upsert({
      where: { email: 'contador@contacerta.com.br' },
      update: {},
      create: {
        name: 'Ana Contadora',
        email: 'contador@contacerta.com.br',
        password: await hashPassword('contador123'),
        role: UserRole.MANAGER,
        companyId,
      },
    }),
    prisma.user.upsert({
      where: { email: 'auxiliar@contacerta.com.br' },
      update: {},
      create: {
        name: 'João Auxiliar',
        email: 'auxiliar@contacerta.com.br',
        password: await hashPassword('auxiliar123'),
        role: UserRole.USER,
        companyId,
      },
    }),
  ]);
  
  console.log(`   ✅ ${users.length} usuários criados`);
  return users;
}

// =================================================================
// 3. CLIENTES
// =================================================================
async function seedClients(companyId: string, userId: string) {
  console.log('🏢 Criando clientes...');
  
  const clientsData = [
    {
      companyName: 'ACGS CORRETORA DE SEGUROS',
      cnpj: '01.234.567/0001-88',
      monthlyFee: 304.00,
      status: ClientStatus.ATIVO,
      serviceType: ServiceType.CONTABIL,
      contactName: 'Carlos Silva',
      contactEmail: 'carlos@acgs.com.br',
      contactPhone: '(51) 99999-1111',
    },
    {
      companyName: 'ACOLHER CLINICA DE SAUDE',
      cnpj: '02.345.678/0001-77',
      monthlyFee: 794.00,
      status: ClientStatus.ATIVO,
      serviceType: ServiceType.CONTABIL,
      contactName: 'Dra. Maria Santos',
      contactEmail: 'maria@acolher.com.br',
      contactPhone: '(51) 99999-2222',
    },
    {
      companyName: 'ADRIELGARCIA SOFTWARE DEVELOPMENT',
      cnpj: '03.456.789/0001-66',
      monthlyFee: 475.21,
      status: ClientStatus.ATIVO,
      serviceType: ServiceType.CONTABIL,
      contactName: 'Adriel Garcia',
      contactEmail: 'adriel@agdev.com.br',
      contactPhone: '(51) 99999-3333',
    },
    {
      companyName: 'AE ANALISES ELETRICAS INSTALACAO E MANUTENCAO LTDA',
      cnpj: '04.567.890/0001-55',
      monthlyFee: 210.00,
      status: ClientStatus.ATIVO,
      serviceType: ServiceType.CONTABIL,
      contactName: 'Antonio Eletricista',
      contactEmail: 'antonio@ae.com.br',
      contactPhone: '(51) 99999-4444',
    },
    {
      companyName: 'TECH SOLUTIONS LTDA',
      cnpj: '05.678.901/0001-44',
      monthlyFee: 1250.00,
      status: ClientStatus.ATIVO,
      serviceType: ServiceType.CONTABIL,
      contactName: 'Pedro Tech',
      contactEmail: 'pedro@techsolutions.com.br',
      contactPhone: '(51) 99999-5555',
    },
  ];
  
  const clients = [];
  for (const data of clientsData) {
    const client = await prisma.client.upsert({
      where: { companyId_companyName: { companyId, companyName: data.companyName } },
      update: {},
      create: {
        ...data,
        userId,
        companyId,
        startDate: new Date('2024-01-15'),
      },
    });
    clients.push(client);
  }
  
  console.log(`   ✅ ${clients.length} clientes criados`);
  return clients;
}

// =================================================================
// 4. PLANO DE CONTAS (Essencial para DRE e Balancete)
// =================================================================
async function seedAccountingAccounts(companyId: string) {
  console.log('📒 Criando plano de contas contábeis...');
  
  const accounts = [
    // ATIVO
    { code: '1.1.1.01', name: 'Caixa', type: AccountType.ATIVO, nature: AccountNature.DEVEDORA, level: 3 },
    { code: '1.1.1.02', name: 'Bancos Conta Movimento', type: AccountType.ATIVO, nature: AccountNature.DEVEDORA, level: 3 },
    { code: '1.1.2.01', name: 'Clientes (Duplicatas a Receber)', type: AccountType.ATIVO, nature: AccountNature.DEVEDORA, level: 3 },
    { code: '1.2.1.01', name: 'Móveis e Utensílios', type: AccountType.ATIVO, nature: AccountNature.DEVEDORA, level: 3 },
    { code: '1.2.1.02', name: 'Equipamentos de Informática', type: AccountType.ATIVO, nature: AccountNature.DEVEDORA, level: 3 },
    
    // PASSIVO
    { code: '2.1.1.01', name: 'Fornecedores', type: AccountType.PASSIVO, nature: AccountNature.CREDORA, level: 3 },
    { code: '2.1.1.02', name: 'Salários a Pagar', type: AccountType.PASSIVO, nature: AccountNature.CREDORA, level: 3 },
    { code: '2.1.1.03', name: 'Impostos a Recolher', type: AccountType.PASSIVO, nature: AccountNature.CREDORA, level: 3 },
    { code: '2.1.2.01', name: 'Empréstimos Bancários', type: AccountType.PASSIVO, nature: AccountNature.CREDORA, level: 3 },
    
    // PATRIMÔNIO LÍQUIDO
    { code: '2.2.1.01', name: 'Capital Social', type: AccountType.PATRIMONIO_LIQUIDO, nature: AccountNature.CREDORA, level: 3 },
    { code: '2.2.1.02', name: 'Lucros Acumulados', type: AccountType.PATRIMONIO_LIQUIDO, nature: AccountNature.CREDORA, level: 3 },
    { code: '2.2.1.03', name: 'Resultado do Exercício', type: AccountType.PATRIMONIO_LIQUIDO, nature: AccountNature.CREDORA, level: 3 },
    
    // RECEITAS
    { code: '3.1.1.01', name: 'Receita de Honorários Contábeis', type: AccountType.RECEITA, nature: AccountNature.CREDORA, level: 3 },
    { code: '3.1.1.02', name: 'Receita de Consultoria Fiscal', type: AccountType.RECEITA, nature: AccountNature.CREDORA, level: 3 },
    { code: '3.1.1.03', name: 'Receita de Departamento Pessoal', type: AccountType.RECEITA, nature: AccountNature.CREDORA, level: 3 },
    { code: '3.1.2.01', name: 'Receitas Financeiras (Juros)', type: AccountType.RECEITA, nature: AccountNature.CREDORA, level: 3 },
    
    // DESPESAS
    { code: '4.1.1.01', name: 'Salários e Encargos', type: AccountType.DESPESA, nature: AccountNature.DEVEDORA, level: 3 },
    { code: '4.1.1.02', name: 'Aluguel e Condomínio', type: AccountType.DESPESA, nature: AccountNature.DEVEDORA, level: 3 },
    { code: '4.1.1.03', name: 'Energia Elétrica', type: AccountType.DESPESA, nature: AccountNature.DEVEDORA, level: 3 },
    { code: '4.1.1.04', name: 'Internet e Telefonia', type: AccountType.DESPESA, nature: AccountNature.DEVEDORA, level: 3 },
    { code: '4.1.1.05', name: 'Software e Licenças', type: AccountType.DESPESA, nature: AccountNature.DEVEDORA, level: 3 },
    { code: '4.1.2.01', name: 'Despesas Financeiras (Juros)', type: AccountType.DESPESA, nature: AccountNature.DEVEDORA, level: 3 },
    { code: '4.1.2.02', name: 'Tarifas Bancárias', type: AccountType.DESPESA, nature: AccountNature.DEVEDORA, level: 3 },
  ];
  
  const created = [];
  for (const acc of accounts) {
    const account = await prisma.accountingAccount.upsert({
      where: {
        companyId_planName_code: {
          companyId,
          planName: 'Padrão',
          code: acc.code,
        },
      },
      update: {},
      create: {
        ...acc,
        companyId,
        planName: 'Padrão',
        isActive: true,
      },
    });
    created.push(account);
  }
  
  console.log(`   ✅ ${created.length} contas contábeis criadas`);
  return created;
}

// =================================================================
// 5. LANÇAMENTOS CONTÁBEIS (Essencial para DRE e Balancete)
// =================================================================
async function seedAccountingEntries(companyId: string, clients: any[], accounts: any[]) {
  console.log('📝 Criando lançamentos contábeis...');
  
  // Busca contas por tipo
  const receitaHonorarios = accounts.find(a => a.code === '3.1.1.01');
  const receitaConsultoria = accounts.find(a => a.code === '3.1.1.02');
  const receitaDP = accounts.find(a => a.code === '3.1.1.03');
  const receitaFinanceira = accounts.find(a => a.code === '3.1.2.01');
  
  const despesaSalarios = accounts.find(a => a.code === '4.1.1.01');
  const despesaAluguel = accounts.find(a => a.code === '4.1.1.02');
  const despesaEnergia = accounts.find(a => a.code === '4.1.1.03');
  const despesaInternet = accounts.find(a => a.code === '4.1.1.04');
  const despesaSoftware = accounts.find(a => a.code === '4.1.1.05');
  const despesaFinanceira = accounts.find(a => a.code === '4.1.2.01');
  const despesaTarifas = accounts.find(a => a.code === '4.1.2.02');
  
  const ativoBancos = accounts.find(a => a.code === '1.1.1.02');
  const ativoClientes = accounts.find(a => a.code === '1.1.2.01');
  const passivoFornecedores = accounts.find(a => a.code === '2.1.1.01');
  const passivoImpostos = accounts.find(a => a.code === '2.1.1.03');
  const plResultado = accounts.find(a => a.code === '2.2.1.03');
  
  if (!receitaHonorarios || !despesaSalarios) {
    throw new Error('Contas essenciais não encontradas');
  }
  
  // Data de referência: Agosto/2026
  const baseDate = new Date('2026-08-15');
  
  const entries = [
    // === RECEITAS (CRÉDITO em conta de RECEITA, DÉBITO em ATIVO) ===
    {
      description: 'Honorários Contábeis - ACGS Corretora',
      debitAccountId: ativoBancos!.id,
      creditAccountId: receitaHonorarios.id,
      debitValue: 0,
      creditValue: 304.00,
      clientId: clients[0].id,
      entryDate: new Date('2026-08-05'),
    },
    {
      description: 'Honorários Contábeis - Acolher Clínica',
      debitAccountId: ativoBancos!.id,
      creditAccountId: receitaHonorarios.id,
      debitValue: 0,
      creditValue: 794.00,
      clientId: clients[1].id,
      entryDate: new Date('2026-08-05'),
    },
    {
      description: 'Honorários Contábeis - Adriel Garcia Software',
      debitAccountId: ativoClientes!.id,
      creditAccountId: receitaHonorarios.id,
      debitValue: 0,
      creditValue: 475.21,
      clientId: clients[2].id,
      entryDate: new Date('2026-08-10'),
    },
    {
      description: 'Honorários Contábeis - AE Análises Elétricas',
      debitAccountId: ativoBancos!.id,
      creditAccountId: receitaHonorarios.id,
      debitValue: 0,
      creditValue: 210.00,
      clientId: clients[3].id,
      entryDate: new Date('2026-08-05'),
    },
    {
      description: 'Honorários Contábeis - Tech Solutions',
      debitAccountId: ativoBancos!.id,
      creditAccountId: receitaHonorarios.id,
      debitValue: 0,
      creditValue: 1250.00,
      clientId: clients[4].id,
      entryDate: new Date('2026-08-05'),
    },
    {
      description: 'Consultoria Fiscal - Tech Solutions',
      debitAccountId: ativoBancos!.id,
      creditAccountId: receitaConsultoria!.id,
      debitValue: 0,
      creditValue: 850.00,
      clientId: clients[4].id,
      entryDate: new Date('2026-08-12'),
    },
    {
      description: 'Departamento Pessoal - Acolher Clínica',
      debitAccountId: ativoBancos!.id,
      creditAccountId: receitaDP!.id,
      debitValue: 0,
      creditValue: 420.00,
      clientId: clients[1].id,
      entryDate: new Date('2026-08-15'),
    },
    {
      description: 'Receita Financeira - Juros Aplicação',
      debitAccountId: ativoBancos!.id,
      creditAccountId: receitaFinanceira!.id,
      debitValue: 0,
      creditValue: 125.50,
      clientId: null,
      entryDate: new Date('2026-08-20'),
    },
    
    // === DESPESAS (DÉBITO em conta de DESPESA, CRÉDITO em PASSIVO/ATIVO) ===
    {
      description: 'Salários e Encargos - Agosto/2026',
      debitAccountId: despesaSalarios.id,
      creditAccountId: passivoImpostos!.id,
      debitValue: 8500.00,
      creditValue: 0,
      clientId: null,
      entryDate: new Date('2026-08-05'),
    },
    {
      description: 'Aluguel e Condomínio - Agosto/2026',
      debitAccountId: despesaAluguel!.id,
      creditAccountId: passivoFornecedores!.id,
      debitValue: 2800.00,
      creditValue: 0,
      clientId: null,
      entryDate: new Date('2026-08-10'),
    },
    {
      description: 'Energia Elétrica - Agosto/2026',
      debitAccountId: despesaEnergia!.id,
      creditAccountId: passivoFornecedores!.id,
      debitValue: 485.30,
      creditValue: 0,
      clientId: null,
      entryDate: new Date('2026-08-15'),
    },
    {
      description: 'Internet e Telefonia - Agosto/2026',
      debitAccountId: despesaInternet!.id,
      creditAccountId: passivoFornecedores!.id,
      debitValue: 320.00,
      creditValue: 0,
      clientId: null,
      entryDate: new Date('2026-08-15'),
    },
    {
      description: 'Software e Licenças - Agosto/2026',
      debitAccountId: despesaSoftware!.id,
      creditAccountId: passivoFornecedores!.id,
      debitValue: 1250.00,
      creditValue: 0,
      clientId: null,
      entryDate: new Date('2026-08-20'),
    },
    {
      description: 'Tarifas Bancárias - Agosto/2026',
      debitAccountId: despesaTarifas!.id,
      creditAccountId: ativoBancos!.id,
      debitValue: 89.50,
      creditValue: 0,
      clientId: null,
      entryDate: new Date('2026-08-25'),
    },
    {
      description: 'Despesas Financeiras - Juros Empréstimo',
      debitAccountId: despesaFinanceira!.id,
      creditAccountId: passivoFornecedores!.id,
      debitValue: 450.00,
      creditValue: 0,
      clientId: null,
      entryDate: new Date('2026-08-28'),
    },
  ];
  
  const created = [];
  for (const entry of entries) {
    const e = await prisma.accountingEntry.create({
      data: {
        ...entry,
        companyId,
        source: 'SEED',
        status: 'LANCADO',
        documentNumber: `LANC-${randomId().toUpperCase()}`,
      },
    });
    created.push(e);
  }
  
  console.log(`   ✅ ${created.length} lançamentos contábeis criados`);
  console.log(`    Total Receitas: R$ ${entries.filter(e => e.creditAccountId === receitaHonorarios.id || e.creditAccountId === receitaConsultoria?.id || e.creditAccountId === receitaDP?.id || e.creditAccountId === receitaFinanceira?.id).reduce((sum, e) => sum + Number(e.creditValue), 0).toFixed(2)}`);
  console.log(`   📊 Total Despesas: R$ ${entries.filter(e => e.debitAccountId === despesaSalarios.id || e.debitAccountId === despesaAluguel?.id || e.debitAccountId === despesaEnergia?.id || e.debitAccountId === despesaInternet?.id || e.debitAccountId === despesaSoftware?.id || e.debitAccountId === despesaTarifas?.id || e.debitAccountId === despesaFinanceira?.id).reduce((sum, e) => sum + Number(e.debitValue), 0).toFixed(2)}`);
  
  return created;
}

// =================================================================
// 6. TAREFAS (Para testar Portal do Cliente)
// =================================================================
async function seedTasks(companyId: string, clients: any[], userId: string) {
  console.log(' Criando tarefas...');
  
  const tasksData = [
    { title: 'Revisar apuração ICMS - ACGS', status: TaskStatus.IN_PROGRESS, priority: TaskPriority.HIGH, category: TaskCategory.FISCAL, clientId: clients[0].id, dueDate: new Date('2026-09-05') },
    { title: 'Conciliação bancária - Acolher', status: TaskStatus.TODO, priority: TaskPriority.MEDIUM, category: TaskCategory.CONTABIL, clientId: clients[1].id, dueDate: new Date('2026-09-10') },
    { title: 'Fechamento mensal - Tech Solutions', status: TaskStatus.IN_PROGRESS, priority: TaskPriority.HIGH, category: TaskCategory.CONTABIL, clientId: clients[4].id, dueDate: new Date('2026-09-08') },
    { title: 'Enviar DRE - Adriel Garcia', status: TaskStatus.REVIEW, priority: TaskPriority.MEDIUM, category: TaskCategory.CONTABIL, clientId: clients[2].id, dueDate: new Date('2026-09-15') },
    { title: 'Preparar guia DAS - AE Análises', status: TaskStatus.BACKLOG, priority: TaskPriority.LOW, category: TaskCategory.FISCAL, clientId: clients[3].id, dueDate: new Date('2026-09-20') },
    { title: 'Reunião de planejamento interno', status: TaskStatus.TODO, priority: TaskPriority.MEDIUM, category: TaskCategory.INTERNO, clientId: null, dueDate: new Date('2026-09-12') },
  ];
  
  const created = [];
  for (const data of tasksData) {
    const task = await prisma.task.create({
      data: {
        ...data,
        companyId,
        assigneeId: userId,
      },
    });
    created.push(task);
  }
  
  console.log(`   ✅ ${created.length} tarefas criadas`);
  return created;
}

// =================================================================
// 7. PROPOSTAS COMERCIAIS (Para testar Portal do Cliente)
// =================================================================
async function seedProposals(companyId: string, clients: any[], userId: string) {
  console.log('📝 Criando propostas comerciais...');
  
  const proposalsData = [
    {
      proposalNumber: 'PROP-2026-001',
      slug: 'prop-2026-001-acgs',
      clientName: clients[0].companyName,
      clientCnpj: clients[0].cnpj,
      basePrice: 350.00,
      status: 'CLOSED_WON' as any,
      taxRegime: 'SIMPLES',
      activity: 'Corretagem de Seguros',
      monthlyRevenue: 50000,
      employeeCount: 3,
      sentAt: new Date('2026-07-01'),
      closedAt: new Date('2026-07-15'),
      version: 1,
    },
    {
      proposalNumber: 'PROP-2026-002',
      slug: 'prop-2026-002-tech',
      clientName: clients[4].companyName,
      clientCnpj: clients[4].cnpj,
      basePrice: 1500.00,
      status: 'SENT' as any,
      taxRegime: 'LUCRO_PRESUMIDO',
      activity: 'Desenvolvimento de Software',
      monthlyRevenue: 200000,
      employeeCount: 12,
      sentAt: new Date('2026-08-20'),
      version: 1,
    },
  ];
  
  const created = [];
  for (const data of proposalsData) {
    const proposal = await prisma.proposal.create({
      data: {
        ...data,
        companyId,
        userId,
      },
    });
    created.push(proposal);
  }
  
  console.log(`   ✅ ${created.length} propostas criadas`);
  return created;
}

// =================================================================
// MAIN
// =================================================================
async function main() {
  console.log('\n🌱 ============================================');
  console.log('🌱 INICIANDO SEED — Radar Conta Certa');
  console.log('🌱 ============================================\n');
  
  // Limpa dados anteriores (opcional — comente se quiser acumular)
  console.log(' Limpando dados anteriores...');
  await prisma.$transaction([
    prisma.accountingEntry.deleteMany(),
    prisma.task.deleteMany(),
    prisma.proposal.deleteMany(),
    prisma.client.deleteMany(),
    prisma.accountingAccount.deleteMany(),
    prisma.user.deleteMany(),
    prisma.company.deleteMany(),
  ]);
  console.log('   ✅ Dados limpos\n');
  
  // Executa seed em ordem
  const company = await seedCompany();
  const users = await seedUsers(company.id);
  const clients = await seedClients(company.id, users[0].id);
  const accounts = await seedAccountingAccounts(company.id);
  await seedAccountingEntries(company.id, clients, accounts);
  await seedTasks(company.id, clients, users[0].id);
  await seedProposals(company.id, clients, users[0].id);
  
  console.log('\n🌱 ============================================');
  console.log('🌱 SEED CONCLUÍDO COM SUCESSO! ✅');
  console.log('🌱 ============================================\n');
  
  console.log(' Credenciais de acesso:');
  console.log('   Admin:     admin@contacerta.com.br / admin123');
  console.log('   Contador:  contador@contacerta.com.br / contador123');
  console.log('   Auxiliar:  auxiliar@contacerta.com.br / auxiliar123\n');
  
  console.log('📊 Dados para testes:');
  console.log(`   - ${clients.length} clientes`);
  console.log(`   - ${accounts.length} contas contábeis`);
  console.log(`   - Lançamentos de Agosto/2026`);
  console.log('   - Tarefas vinculadas a clientes');
  console.log('   - Propostas comerciais\n');
  
  console.log(' Testes recomendados:');
  console.log('   1. Acesse /dashboard/contabil → selecione cliente → Gerar DRE PDF');
  console.log('   2. Acesse /dashboard/contabil → selecione cliente → Gerar Balancete PDF');
  console.log('   3. Acesse /dashboard/clientes → gere link do portal');
  console.log('   4. Acesse o portal em aba anônima → veja DRE, tarefas e propostas\n');
}

main()
  .catch((e) => {
    console.error('❌ Erro no seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });