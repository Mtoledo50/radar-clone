// =================================================================
// create-admin-renan.js — FASE 2 da Entrega C
// Cria um admin LIGADO À EMPRESA DO RENAN clonando o formato do
// admin@aurora.com (mesmo role/campos). Senha: 123456
// Uso: node create-admin-renan.js <companyId>
// =================================================================
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const p = new PrismaClient();

const COMPANY_ID = process.argv[2];
if (!COMPANY_ID) {
  console.error('Uso: node create-admin-renan.js <companyId>');
  process.exit(1);
}

async function main() {
  // Clona o "formato" do admin existente (role, etc.)
  const base = await p.user.findUnique({ where: { email: 'admin@aurora.com' } });
  if (!base) throw new Error('admin@aurora.com nao encontrado');

  const hash = await bcrypt.hash('123456', 10);

  const user = await p.user.upsert({
    where: { email: 'admin@renan.com' },
    update: { companyId: COMPANY_ID }, // garante que aponta p/ a empresa certa
    create: {
      email: 'admin@renan.com',
      name: 'Admin Piloto (Academia do Renan)',
      password: hash,
      role: base.role,
      companyId: COMPANY_ID,
    },
  });

  console.log('✅ Usuario pronto:', user.email, '-> companyId:', user.companyId);
}

main().finally(() => p.$disconnect());