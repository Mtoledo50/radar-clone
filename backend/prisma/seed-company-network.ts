// =================================================================
// backend/prisma/seed-company-network.ts — Seed Sprint C1
// Popula 8 escritórios fake com softwareStack variado p/ ativar
// o benchmark híbrido/rede (ADR-052).
// Uso: npx ts-node prisma/seed-company-network.ts
// =================================================================
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const FAKE_COMPANIES = [
  {
    name: 'Contábil Silva & Associados',
    state: 'SP',
    softwareStack: [
      'contabil:Domínio (Thomson Reuters)',
      'fiscal:Mastersiga Fiscal',
      'financeiro:Conta Azul',
      'assinatura:D4Sign',
    ],
  },
  {
    name: 'Escritório Almeida Contábil',
    state: 'RJ',
    softwareStack: [
      'contabil:Questor',
      'dp:Questor DP',
      'fiscal:Questor Fiscal',
      'assinatura:DocuSign',
    ],
  },
  {
    name: 'Conta Certa Consultoria',
    state: 'MG',
    softwareStack: [
      'contabil:Alter',
      'dp:Alter Folha',
      'financeiro:Omie',
      'assinatura:ClickSign',
    ],
  },
  {
    name: 'Escritório Ferreira Contábil',
    state: 'PR',
    softwareStack: [
      'contabil:Domínio (Thomson Reuters)',
      'dp:Domínio DP',
      'fiscal:TaxOne',
      'financeiro:Bling',
      'assinatura:D4Sign',
    ],
  },
  {
    name: 'Lima Assessoria Contábil',
    state: 'SC',
    softwareStack: [
      'contabil:Prosoft',
      'dp:Prosoft DP',
      'financeiro:Conta Azul',
      'assinatura:ZapSign',
    ],
  },
  {
    name: 'Costa Contabilidade',
    state: 'RS',
    softwareStack: [
      'contabil:SCI',
      'dp:Domínio DP',
      'fiscal:Mastersiga Fiscal',
      'financeiro:Omie',
      'assinatura:DocuSign',
    ],
  },
  {
    name: 'Oliveira & Souza Contábil',
    state: 'BA',
    softwareStack: [
      'contabil:Domínio (Thomson Reuters)',
      'dp:Domínio DP',
      'fiscal:Domínio Fiscal',
      'financeiro:QuickBooks',
      'assinatura:D4Sign',
    ],
  },
  {
    name: 'Rocha Contabilidade Empresarial',
    state: 'GO',
    softwareStack: [
      'contabil:Sage',
      'dp:TOTVS RM Folha',
      'financeiro:Conta Azul',
      'assinatura:ClickSign',
    ],
  },
];

async function main() {
  console.log('🌱 Seed Sprint C1: criando 8 escritórios fake...');

  for (const fake of FAKE_COMPANIES) {
    // Evita duplicar: busca por nome
    const exists = await prisma.company.findFirst({ where: { name: fake.name } });
    if (exists) {
      console.log(`  ⏭️  ${fake.name} (já existe — atualizando stack)`);
      await prisma.company.update({
        where: { id: exists.id },
        data: { softwareStack: fake.softwareStack },
      });
      continue;
    }

    // Cria um user admin fictício p/ a empresa
    const email = `admin.${fake.name.toLowerCase().replace(/\s+/g, '.').replace(/[^a-z0-9.]/g, '')}@fake.com`;
    const bcrypt = require('bcryptjs');
    const hash = await bcrypt.hash('123456', 10);

    await prisma.$transaction(async (tx) => {
      const company = await tx.company.create({
        data: {
          name: fake.name,
          state: fake.state,
          softwareStack: fake.softwareStack,
          plan: 'BLACK',
          allowedModules: ['dashboard', 'pessoas', 'clientes', 'precificacao'],
        },
      });
      await tx.user.create({
        data: {
          email,
          password: hash,
          name: `Admin ${fake.name}`,
          role: 'ADMIN',
          companyId: company.id,
        },
      });
    });
    console.log(`  ✅ ${fake.name} (${email})`);
  }

  console.log('🎉 Seed Sprint C1 concluído. Agora o benchmark opera em modo híbrido/rede.');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());