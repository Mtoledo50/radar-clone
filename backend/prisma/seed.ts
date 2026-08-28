import { PrismaClient, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed do banco de dados...');

  // 1. Criar ou encontrar a Empresa (Tenant)
  // Usamos o CNPJ como identificador único conforme seu schema (cnpj String? @unique)
  const company = await prisma.company.upsert({
    where: { cnpj: '00.000.000/0001-00' },
    update: {},
    create: {
      name: 'Empresa Demo SaaS',
      cnpj: '00.000.000/0001-00',
      plan: 'PREMIUM',
      allowedModules: ['dashboard', 'pessoas', 'clientes', 'precificacao', 'planejamento', 'financeiro', 'bi', 'admin'],
    },
  });
  console.log(`✅ Empresa criada/encontrada: ${company.name}`);

  // 2. Criar ou encontrar o Usuário Admin com senha criptografada
  const plainPassword = 'Admin@123456';
  const hashedPassword = await bcrypt.hash(plainPassword, 10);
  
  const user = await prisma.user.upsert({
    where: { email: 'admin@contacerta.com.br' }, 
    update: {},
    create: {
      email: 'admin@contacerta.com.br',
      password: hashedPassword,
      name: 'Administrador do Sistema',
      role: UserRole.ADMIN, // Respeitando o Enum UserRole do seu schema
      companyId: company.id, // Vínculo obrigatório para Arquitetura Multi-Tenant
    },
  });
  console.log(`✅ Usuário Admin criado/encontrado: ${user.email}`);

  console.log('🎉 Seed concluído com sucesso!');
  console.log('🔑 Credenciais para login:');
  console.log('   Email: admin@contacerta.com.br');
  console.log('   Senha: Admin@123456');
}

main()
  .catch((e) => {
    console.error('❌ Erro ao executar o seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });