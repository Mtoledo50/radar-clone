import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Configurando Empresa e Usuário Admin Padrão...\n');

  const companyId = '00000000-0000-0000-0000-000000000001';
  const email = 'fernanda@teste.com';
  const password = '123456'; // 🔥 Defina a senha que você quer usar

  // 1. Garantir que a empresa existe
  await prisma.company.upsert({
    where: { id: companyId },
    update: {
      plan: 'ENTERPRISE',
      allowedModules: ['dashboard', 'pessoas', 'clientes', 'precificacao', 'planejamento', 'bi', 'ponto-fora-da-curva', 'indicadores', 'planejamento-tributario', 'reforma-tributaria', 'turnover'],
    },
    create: {
      id: companyId,
      name: 'Escritório Padrão (Admin)',
      plan: 'ENTERPRISE',
      allowedModules: ['dashboard', 'pessoas', 'clientes', 'precificacao', 'planejamento', 'bi', 'ponto-fora-da-curva', 'indicadores', 'planejamento-tributario', 'reforma-tributaria', 'turnover'],
    },
  });

  const hashedPassword = await bcrypt.hash(password, 10);

  // 2. Garantir que o usuário admin existe e está vinculado à empresa
  const user = await prisma.user.upsert({
    where: { email },
    update: {
      companyId,
      role: 'ADMIN',
      password: hashedPassword, // Atualiza a senha caso tenha mudado
    },
    create: {
      name: 'Fernanda Admin',
      email,
      password: hashedPassword,
      companyId,
      role: 'ADMIN',
    },
  });

  console.log('✅ CONFIGURAÇÃO CONCLUÍDA!');
  console.log(`👤 E-mail: ${user.email}`);
  console.log(`🔑 Senha: ${password}`);
  console.log(`🏢 Empresa ID: ${user.companyId}\n`);
}

main()
  .catch((e) => {
    console.error('❌ Erro ao configurar admin:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });