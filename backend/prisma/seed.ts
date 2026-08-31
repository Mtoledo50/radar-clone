import { PrismaClient, UserRole, ContractType, Recurrence, SkillKey, AutonomyLevel, ProposalStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

// Helper para arredondamento monetário seguro (ADR-020)
const round2 = (v: number) => Math.round(v * 100) / 100;

async function main() {
  console.log('🚀 Iniciando Seed Enterprise Unificado do Radar Conta Certa...\n');

  // =========================================================================
  // FASE 1: FUNDAÇÃO (Tenant e Usuários)
  // =========================================================================
  console.log('[1/6] 🏢 Configurando Tenant e Usuários...');
  
  const companyName = 'Conta Certa Demo';
  const company = await prisma.company.upsert({
    where: { cnpj: '00.000.000/0001-00' },
    update: { name: companyName, plan: 'PREMIUM' },
    create: {
      name: companyName,
      cnpj: '00.000.000/0001-00',
      plan: 'PREMIUM',
      allowedModules: ['dashboard', 'pessoas', 'clientes', 'precificacao', 'planejamento', 'financeiro', 'bi', 'admin'],
    },
  });

  const adminEmail = 'admin@contacerta.com.br';
  const hashedPassword = await bcrypt.hash('Admin@123456', 10);

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: { name: 'Administrador do Sistema', companyId: company.id },
    create: {
      email: adminEmail,
      password: hashedPassword,
      name: 'Administrador do Sistema',
      role: UserRole.ADMIN,
      companyId: company.id,
    },
  });
  console.log(`   ✅ Tenant: ${company.name} | Admin: ${admin.email}`);

  // =========================================================================
  // FASE 2: CATÁLOGO DE SERVIÇOS E PLANOS (Consolidado)
  // =========================================================================
  console.log('[2/6] 📦 Populando Catálogo de Serviços e Planos...');
  
  const catalogData = [
    {
      name: 'Fiscal e Tributário',
      icon: 'receipt',
      order: 1,
      items: [
        { name: 'Apuração mensal de impostos', basePrice: 150, estimatedHours: 4, recurrence: 'MENSAL' as Recurrence },
        { name: 'Escrituração fiscal completa', basePrice: 300, estimatedHours: 8, recurrence: 'MENSAL' as Recurrence },
        { name: 'Planejamento tributário estratégico', basePrice: 500, estimatedHours: 10, recurrence: 'MENSAL' as Recurrence },
      ]
    },
    {
      name: 'Departamento Pessoal',
      icon: 'users',
      order: 2,
      items: [
        { name: 'Folha de pagamento (até 10 func.)', basePrice: 380, estimatedHours: 5, recurrence: 'MENSAL' as Recurrence },
        { name: 'Folha de pagamento (11–30 func.)', basePrice: 680, estimatedHours: 9, recurrence: 'MENSAL' as Recurrence },
        { name: 'E-Social completo', basePrice: 150, estimatedHours: 4, recurrence: 'MENSAL' as Recurrence },
      ]
    },
    {
      name: 'Contábil',
      icon: 'book-open',
      order: 3,
      items: [
        { name: 'Escrituração Contábil Mensal', basePrice: 800, estimatedHours: 10, recurrence: 'MENSAL' as Recurrence },
        { name: 'Fechamento Contábil Anual', basePrice: 2500, estimatedHours: 40, recurrence: 'ANUAL' as Recurrence },
      ]
    }
  ];

  for (const cat of catalogData) {
    // Idempotente: busca por companyId + nome
    let category = await prisma.serviceCategory.findFirst({
      where: { companyId: company.id, name: cat.name }
    });

    if (!category) {
      category = await prisma.serviceCategory.create({
        data: { companyId: company.id, name: cat.name, icon: cat.icon, order: cat.order }
      });
    } else {
      await prisma.serviceCategory.update({
        where: { id: category.id },
        data: { icon: cat.icon, order: cat.order }
      });
    }

    for (const item of cat.items) {
      const existingItem = await prisma.serviceItem.findFirst({
        where: { companyId: company.id, name: item.name }
      });

      if (!existingItem) {
        await prisma.serviceItem.create({
          data: {
            companyId: company.id,
            categoryId: category.id,
            name: item.name,
            basePrice: item.basePrice,
            estimatedHours: item.estimatedHours,
            recurrence: item.recurrence,
            isActive: true,
          }
        });
      }
    }
  }

  // Planos Comerciais
  const plansData = [
    { name: 'START', multiplier: 1.0, order: 1, badge: 'INICIANTE', color: '#94a3b8' },
    { name: 'PRIME', multiplier: 1.5, order: 2, badge: 'MAIS POPULAR', color: '#0d9488' },
    { name: 'BLACK', multiplier: 2.0, order: 3, badge: 'PREMIUM', color: '#1e293b' },
  ];

  for (const plan of plansData) {
    await prisma.commercialPlan.upsert({
      where: { id: `plan-${company.id}-${plan.name}` }, // ID determinístico seguro
      update: { multiplier: plan.multiplier, badge: plan.badge, color: plan.color },
      create: {
        id: `plan-${company.id}-${plan.name}`,
        companyId: company.id,
        name: plan.name,
        multiplier: plan.multiplier,
        order: plan.order,
        badge: plan.badge,
        color: plan.color,
        description: `Plano ${plan.name} para empresas em crescimento`,
        isIndependent: false,
      }
    });
  }
  console.log('   ✅ Catálogo e Planos sincronizados.');

  // =========================================================================
  // FASE 3: DADOS OPERACIONAIS (Colaboradores e Turnover)
  // =========================================================================
  console.log('[3/6] 👥 Populando Colaboradores e Métricas de Turnover...');
  
  const employeesData = [
    { name: 'Maria Silva', department: 'Fiscal', position: 'Analista Fiscal', contractType: 'CLT' as ContractType, salary: 4500 },
    { name: 'João Santos', department: 'Fiscal', position: 'Assistente Fiscal', contractType: 'CLT' as ContractType, salary: 2800 },
    { name: 'Ana Costa', department: 'Contábil', position: 'Contadora', contractType: 'CLT' as ContractType, salary: 5500 },
    { name: 'Pedro Alves', department: 'Departamento Pessoal', position: 'Analista de DP', contractType: 'CLT' as ContractType, salary: 3800 },
  ];

  for (const emp of employeesData) {
    const exists = await prisma.employee.findFirst({ where: { companyId: company.id, name: emp.name } });
    if (!exists) {
      await prisma.employee.create({
        data: {
          companyId: company.id,
          userId: admin.id,
          name: emp.name,
          email: emp.name.toLowerCase().replace(' ', '.') + '@demo.com',
          position: emp.position,
          department: emp.department,
          contractType: emp.contractType,
          salary: emp.salary,
          admissionDate: new Date(),
          status: 'ACTIVE',
        }
      });
    }
  }

  // Turnover Mock (Mês atual)
  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();
  await prisma.turnoverMonthly.upsert({
    where: { companyId_year_month: { companyId: company.id, year: currentYear, month: currentMonth } },
    update: {},
    create: {
      companyId: company.id,
      userId: admin.id,
      year: currentYear,
      month: currentMonth,
      cltInitial: 10, cltAdmissions: 1, cltDismissals: 0,
      internInitial: 2, internAdmissions: 0, internDismissals: 0,
      thirdInitial: 1, thirdAdmissions: 0, thirdDismissals: 0,
      partnerInitial: 1, partnerAdmissions: 0, partnerDismissals: 0,
    }
  });
  console.log('   ✅ Colaboradores e Turnover inseridos.');

  // =========================================================================
  // FASE 4: FUNCIONÁRIO DIGITAL (AURORA)
  // =========================================================================
  console.log('[4/6] 🤖 Configurando Funcionário Digital (Aurora)...');
  
  const aurora = await prisma.robotWorker.upsert({
    where: { companyId: company.id },
    update: { status: 'ACTIVE' },
    create: { companyId: company.id, name: 'Aurora', status: 'ACTIVE' }
  });

  const skillsToSeed = [
    { skillKey: 'RECONCILIATION' as SkillKey, cronExpr: '0 2 * * *', autonomy: 'AUTO' as AutonomyLevel },
    { skillKey: 'CLASSIFICATION' as SkillKey, cronExpr: '30 2 * * *', autonomy: 'REVIEW' as AutonomyLevel },
    { skillKey: 'MONTHLY_REPORT' as SkillKey, cronExpr: '0 8 5 * *', autonomy: 'AUTO' as AutonomyLevel },
  ];

  for (const skill of skillsToSeed) {
    await prisma.robotWorkerSkill.upsert({
      where: { companyId_skillKey: { companyId: company.id, skillKey: skill.skillKey } },
      update: { enabled: true, cronExpr: skill.cronExpr, autonomy: skill.autonomy },
      create: {
        companyId: company.id,
        workerId: aurora.id,
        skillKey: skill.skillKey,
        enabled: true,
        cronExpr: skill.cronExpr,
        autonomy: skill.autonomy,
        params: {},
      }
    });
  }
  console.log('   ✅ Aurora e habilidades configuradas.');

  // =========================================================================
  // FASE 5: PROPOSTAS COMERCIAIS (Mock para Dashboard)
  // =========================================================================
  console.log('[5/6] 📝 Gerando Propostas Comerciais de Exemplo...');
  
  const proposalMocks = [
    { clientName: 'Tech Solutions Ltda', status: 'SENT' as ProposalStatus, basePrice: 2000 },
    { clientName: 'Comércio Popular ME', status: 'VIEWED' as ProposalStatus, basePrice: 1200 },
    { clientName: 'Indústria Forte S.A.', status: 'CLOSED_WON' as ProposalStatus, basePrice: 6000 },
  ];

  for (const mock of proposalMocks) {
    const exists = await prisma.proposal.findFirst({ where: { companyId: company.id, clientName: mock.clientName } });
    if (!exists) {
      await prisma.proposal.create({
        data: {
          companyId: company.id,
          userId: admin.id,
          proposalNumber: `PROP-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          slug: `proposta-${mock.clientName.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`,
          clientName: mock.clientName,
          taxRegime: 'SIMPLES_NACIONAL',
          activity: 'Serviços',
          monthlyRevenue: 50000,
          employeeCount: 10,
          basePrice: mock.basePrice,
          status: mock.status,
          views: mock.status === 'VIEWED' ? 3 : 0,
          sentAt: new Date(),
          closedAt: mock.status === 'CLOSED_WON' ? new Date() : null,
        }
      });
    }
  }
  console.log('   ✅ Propostas de exemplo criadas.');
  // =========================================================================
  // FASE 6: PROJETOS E TAREFAS (Operacional)
  // =========================================================================
  console.log('[6/6] 📋 Populando Projetos e Tarefas...');
  
  const project = await prisma.project.upsert({
    where: { id: 'proj-demo-01' },
    update: {},
    create: {
      id: 'proj-demo-01',
      companyId: company.id,
      name: 'Implementação Cliente Tech Solutions',
      description: 'Migração de dados e setup inicial do plano BLACK.',
      status: 'ACTIVE',
      startDate: new Date(),
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
  });

  const taskSpecs = [
    { title: 'Levantamento de requisitos', status: 'DONE', priority: 'HIGH' },
    { title: 'Configurar plano de contas SCI', status: 'IN_PROGRESS', priority: 'HIGH' },
    { title: 'Importar base histórica 2025', status: 'TODO', priority: 'MEDIUM' },
    { title: 'Treinamento da equipe do cliente', status: 'BACKLOG', priority: 'LOW' },
  ];

  for (const t of taskSpecs) {
    await prisma.task.upsert({
      where: { id: `task-demo-${t.title.slice(0, 10)}` },
      update: {},
      create: {
        id: `task-demo-${t.title.slice(0, 10)}`,
        companyId: company.id,
        projectId: project.id,
        title: t.title,
        status: t.status as any,
        priority: t.priority as any,
        category: 'CONTABIL',
      },
    });
  }
  console.log('   ✅ Projetos e Kanban populados.');
  // =========================================================================
  // RESUMO FINAL
  // =========================================================================
  console.log('\n=======================================================');
  console.log('🎉 SEED ENTERPRISE CONCLUÍDO COM SUCESSO!');
  console.log('=======================================================');
  console.log(`🏢 Empresa: ${company.name}`);
  console.log(`👤 Admin: ${admin.email}`);
  console.log(`🔑 Senha: Admin@123456`);
  console.log('=======================================================\n');
}

main()
  .catch((e) => {
    console.error('❌ Erro fatal no seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });