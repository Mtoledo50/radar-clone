/**
 * ============================================================================
 * RADAR CONTA CERTA — SEED DO FUNCIONÁRIO DIGITAL (AURORA)
 * ============================================================================
 */
import { PrismaClient, SkillKey, AutonomyLevel } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🤖 Iniciando seed do Funcionário Digital (Aurora)...');

  // 1. Buscar ou criar empresa demo
  let company = await prisma.company.findFirst({
    where: { name: 'Conta Certa Demo' },
  });

  if (!company) {
    console.log('📝 Criando empresa demo...');
    company = await prisma.company.create({
      data: {
        name: 'Conta Certa Demo',
        cnpj: '00000000000000',
        plan: 'PREMIUM',
      },
    });
  }

  // 2. Criar ou atualizar a Aurora (companyId é @unique no schema)
  console.log('\n🤖 Configurando RobotWorker (Aurora)...');
  const aurora = await prisma.robotWorker.upsert({
    where: { companyId: company.id },
    update: {
      name: 'Aurora',
      status: 'ACTIVE',
    },
    create: {
      companyId: company.id,
      name: 'Aurora',
      status: 'ACTIVE',
    },
  });
  console.log(`✅ Aurora pronta (ID: ${aurora.id})`);

  // 3. Configurar as habilidades (Skills)
  // O schema REAL de RobotWorkerSkill tem: skillKey, enabled, cronExpr, autonomy, params
  console.log('\n⚡ Configurando habilidades da Aurora...');
  
  const skills = [
    { skillKey: 'RECONCILIATION' as SkillKey, enabled: true, cronExpr: '0 2 * * *', autonomy: 'AUTO' as AutonomyLevel },
    { skillKey: 'CLASSIFICATION' as SkillKey, enabled: true, cronExpr: '30 2 * * *', autonomy: 'REVIEW' as AutonomyLevel },
    { skillKey: 'MONTHLY_REPORT' as SkillKey, enabled: true, cronExpr: '0 8 5 * *', autonomy: 'AUTO' as AutonomyLevel },
    { skillKey: 'TAX_GUIDES' as SkillKey, enabled: true, cronExpr: '0 9 20 * *', autonomy: 'REVIEW' as AutonomyLevel },
  ];

  for (const s of skills) {
    await prisma.robotWorkerSkill.upsert({
      where: {
        companyId_skillKey: {
          companyId: company.id,
          skillKey: s.skillKey,
        },
      },
      update: {
        enabled: s.enabled,
        cronExpr: s.cronExpr,
        autonomy: s.autonomy,
      },
      create: {
        companyId: company.id,
        workerId: aurora.id,
        skillKey: s.skillKey,
        enabled: s.enabled,
        cronExpr: s.cronExpr,
        autonomy: s.autonomy,
        params: {},
      },
    });
    console.log(`   ✅ Skill ${s.skillKey} configurada`);
  }

  console.log('\n🎉 Seed do Funcionário Digital concluído com sucesso!');
}

main()
  .catch((e) => {
    console.error('❌ Erro no seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });