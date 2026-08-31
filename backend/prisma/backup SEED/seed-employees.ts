// =================================================================
// backend/prisma/seed-employees.ts — Seed de colaboradores (Sprint B2)
// =================================================================
/**
 * Cria 8 colaboradores em departamentos variados p/ alimentar o
 * dashboard de distribuição validada por setor (Sprint B2).
 * Uso: npx ts-node prisma/seed-employees.ts
 */
import { PrismaClient, ContractType } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seed de Colaboradores (base de teste B1/B2)...');

  const company = await prisma.company.findFirst({ where: { name: 'Conta Certa Demo' } });
  if (!company) throw new Error('❌ Empresa "Conta Certa Demo" não encontrada.');

  const admin = await prisma.user.findFirst({ where: { email: 'admin@demo.com' } });
  if (!admin) throw new Error('❌ Usuário admin@demo.com não encontrado.');

  const specs = [
    { name: 'Maria Silva',    department: 'Fiscal',               position: 'Analista Fiscal',          contractType: 'CLT' as ContractType, monthsAgo: 18, salary: 4500 },
    { name: 'João Santos',    department: 'Fiscal',               position: 'Assistente Fiscal',        contractType: 'CLT' as ContractType, monthsAgo: 8, salary: 2800 },
    { name: 'Ana Costa',      department: 'Contábil',             position: 'Contadora',                contractType: 'CLT' as ContractType, monthsAgo: 24, salary: 5500 },
    { name: 'Pedro Alves',    department: 'Departamento Pessoal', position: 'Analista de DP',           contractType: 'CLT' as ContractType, monthsAgo: 12, salary: 3800 },
    { name: 'Carla Souza',    department: 'Comercial',            position: 'Executiva de Contas',      contractType: 'CLT' as ContractType, monthsAgo: 6, salary: 4200 },
    { name: 'Renan Estagiário', department: 'Fiscal',             position: 'Estagiário Fiscal',        contractType: 'ESTAGIARIO' as ContractType, monthsAgo: 3, salary: 1500 },
    { name: 'Luiz Parceiro',  department: 'TI',                   position: 'Dev Full-Stack',           contractType: 'TERCEIRIZADO' as ContractType, monthsAgo: 10, salary: 8000 },
    { name: 'Roberto Sócio',  department: 'Diretoria',            position: 'Sócio-Administrador',      contractType: 'SOCIO' as ContractType, monthsAgo: 60, salary: 15000 },
  ];

  for (const s of specs) {
    const existing = await prisma.employee.findFirst({
      where: { companyId: company.id, name: s.name },
    });
    if (existing) {
      console.log(`⏭️  ${s.name} já existe — pulando`);
      continue;
    }

    const admission = new Date();
    admission.setMonth(admission.getMonth() - s.monthsAgo);

    await prisma.employee.create({
      data: {
        companyId: company.id,
        userId: admin.id,
        name: s.name,
        email: s.name.toLowerCase().replace(' ', '.') + '@demo.com',
        position: s.position,
        department: s.department,
        contractType: s.contractType,
        salary: s.salary,
        admissionDate: admission,
        status: 'ACTIVE',
      },
    });
    console.log(`✅ ${s.name} (${s.department} • ${s.contractType})`);
  }

  // Confere distribuição
  const dist = await prisma.employee.findMany({
    where: { companyId: company.id, status: 'ACTIVE' },
    select: { department: true, contractType: true },
  });
  console.log(`\n📊 Total ativos: ${dist.length}`);
  const byDept: Record<string, number> = {};
  dist.forEach((e) => {
    const d = e.department || '(sem departamento)';
    byDept[d] = (byDept[d] || 0) + 1;
  });
  console.table(byDept);
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());