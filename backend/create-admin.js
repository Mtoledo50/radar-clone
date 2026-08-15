const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();

async function main() {
  const companyId = '00000000-0000-0000-0000-000000000001';
  const email = 'admin@aurora.com';
  const password = '123456';

  // Verifica se o usuario ja existe
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log('Usuario ja existe:', email);
    await prisma.$disconnect();
    return;
  }

  // Gera hash bcrypt da senha
  const hashedPassword = await bcrypt.hash(password, 10);
  console.log('Hash gerado:', hashedPassword.substring(0, 30) + '...');

  // Cria o usuario admin
  const user = await prisma.user.create({
    data: {
      id: 'test-admin-fd1',
      name: 'Admin Aurora',
      email: email,
      password: hashedPassword,
      role: 'ADMIN',
      companyId: companyId,
    },
  });

  console.log('Usuario criado com sucesso!');
  console.log('ID:', user.id);
  console.log('Email:', user.email);
  console.log('Role:', user.role);
  console.log('CompanyId:', user.companyId);

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error('Erro:', e.message);
  process.exit(1);
});
