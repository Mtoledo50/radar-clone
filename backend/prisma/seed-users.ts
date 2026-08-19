/**
 * ============================================================================
 * RADAR CONTA CERTA — SEED DE USUÁRIOS
 * ----------------------------------------------------------------------------
 * Cria usuários de teste para login no sistema
 * ============================================================================
 */

import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🔐 Iniciando seed de usuários...');

  // Buscar ou criar empresa demo
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
    console.log(`✅ Empresa criada: ${company.name}`);
  } else {
    console.log(`✅ Empresa encontrada: ${company.name}`);
  }

  // Criar usuário ADMIN
  const adminEmail = 'admin@demo.com';
  const adminPassword = await bcrypt.hash('123456', 10);

  let admin = await prisma.user.findFirst({
    where: { email: adminEmail, companyId: company.id },
  });

  if (admin) {
    console.log(`✅ Admin já existe: ${admin.email}`);
  } else {
    admin = await prisma.user.create({
      data: {
        name: 'Administrador Demo',
        email: adminEmail,
        password: adminPassword,
        role: 'ADMIN',
        companyId: company.id,
      },
    });
    console.log(`✅ Admin criado: ${admin.email}`);
  }

  // Criar usuário USER (colaborador)
  const userEmail = 'user@demo.com';
  const userPassword = await bcrypt.hash('123456', 10);

  let user = await prisma.user.findFirst({
    where: { email: userEmail, companyId: company.id },
  });

  if (user) {
    console.log(`✅ Usuário já existe: ${user.email}`);
  } else {
    user = await prisma.user.create({
      data: {
        name: 'Colaborador Demo',
        email: userEmail,
        password: userPassword,
        role: 'USER',
        companyId: company.id,
      },
    });
    console.log(`✅ Usuário criado: ${user.email}`);
  }

  console.log('\n✅ Seed de usuários concluído!');
  console.log('\n📧 Credenciais de acesso:');
  console.log('   Admin: admin@demo.com / 123456');
  console.log('   User:  user@demo.com / 123456');
}

main()
  .catch((e) => {
    console.error('❌ Erro no seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });