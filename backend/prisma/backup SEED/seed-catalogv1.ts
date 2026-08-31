/**
 * ============================================================================
 * RADAR CONTA CERTA — SEED DO CATÁLOGO DE SERVIÇOS (Sprint A2)
 * ============================================================================
 * Abordagem robusta: findFirst + create/update (não depende de unique composto).
 * Idempotente: pode rodar N vezes sem duplicar.
 * ============================================================================
 */

import { PrismaClient, Recurrence } from '@prisma/client';

const prisma = new PrismaClient();

const CATALOG = [
  {
    name: 'Fiscal e Tributário',
    icon: 'receipt',
    order: 1,
    items: [
      { name: 'Apuração de ICMS', basePrice: 450, estimatedHours: 6, recurrence: 'MENSAL' as Recurrence },
      { name: 'Apuração de IPI', basePrice: 380, estimatedHours: 5, recurrence: 'MENSAL' as Recurrence },
      { name: 'Apuração de PIS/COFINS', basePrice: 420, estimatedHours: 5, recurrence: 'MENSAL' as Recurrence },
      { name: 'Apuração de ISS', basePrice: 280, estimatedHours: 3, recurrence: 'MENSAL' as Recurrence },
      { name: 'SPED Fiscal (EFD)', basePrice: 520, estimatedHours: 7, recurrence: 'MENSAL' as Recurrence },
      { name: 'SPED Contribuições', basePrice: 480, estimatedHours: 6, recurrence: 'MENSAL' as Recurrence },
      { name: 'DCTF', basePrice: 320, estimatedHours: 4, recurrence: 'MENSAL' as Recurrence },
      { name: 'EFD-Reinf', basePrice: 390, estimatedHours: 5, recurrence: 'MENSAL' as Recurrence },
      { name: 'Declaração Anual (DIPJ/ECF)', basePrice: 1200, estimatedHours: 16, recurrence: 'ANUAL' as Recurrence },
    ],
  },
  {
    name: 'Notas Fiscais',
    icon: 'file-text',
    order: 2,
    items: [
      { name: 'Emissão de NF-e (produtos)', basePrice: 180, estimatedHours: 2, recurrence: 'MENSAL' as Recurrence },
      { name: 'Emissão de NFS-e (serviços)', basePrice: 150, estimatedHours: 2, recurrence: 'MENSAL' as Recurrence },
      { name: 'Emissão de NFC-e', basePrice: 120, estimatedHours: 1, recurrence: 'MENSAL' as Recurrence },
      { name: 'Cancelamento de NF-e', basePrice: 80, estimatedHours: 1, recurrence: 'AVULSO' as Recurrence },
      { name: 'Carta de Correção Eletrônica', basePrice: 60, estimatedHours: 1, recurrence: 'AVULSO' as Recurrence },
      { name: 'Inutilização de numeração', basePrice: 70, estimatedHours: 1, recurrence: 'AVULSO' as Recurrence },
      { name: 'Manifesto do Destinatário (MD-e)', basePrice: 200, estimatedHours: 3, recurrence: 'MENSAL' as Recurrence },
      { name: 'Importação de NF-e de entrada', basePrice: 250, estimatedHours: 3, recurrence: 'MENSAL' as Recurrence },
    ],
  },
  {
    name: 'Departamento Pessoal',
    icon: 'users',
    order: 3,
    items: [
      { name: 'Folha de Pagamento (até 10 func.)', basePrice: 380, estimatedHours: 5, recurrence: 'MENSAL' as Recurrence },
      { name: 'Folha de Pagamento (11–30 func.)', basePrice: 680, estimatedHours: 9, recurrence: 'MENSAL' as Recurrence },
      { name: 'Folha de Pagamento (31–60 func.)', basePrice: 1100, estimatedHours: 14, recurrence: 'MENSAL' as Recurrence },
      { name: 'Folha de Pagamento (61+ func.)', basePrice: 1600, estimatedHours: 20, recurrence: 'MENSAL' as Recurrence },
      { name: 'Férias', basePrice: 90, estimatedHours: 1, recurrence: 'AVULSO' as Recurrence },
      { name: '13º Salário', basePrice: 120, estimatedHours: 2, recurrence: 'ANUAL' as Recurrence },
      { name: 'Rescisão', basePrice: 180, estimatedHours: 2, recurrence: 'AVULSO' as Recurrence },
      { name: 'Admissão', basePrice: 150, estimatedHours: 2, recurrence: 'AVULSO' as Recurrence },
      { name: 'eSocial (eventos periódicos)', basePrice: 220, estimatedHours: 3, recurrence: 'MENSAL' as Recurrence },
      { name: 'eSocial (admissão/afastamento)', basePrice: 80, estimatedHours: 1, recurrence: 'AVULSO' as Recurrence },
      { name: 'RAIS / DCTFWeb', basePrice: 350, estimatedHours: 4, recurrence: 'ANUAL' as Recurrence },
      { name: 'Dirf', basePrice: 280, estimatedHours: 3, recurrence: 'ANUAL' as Recurrence },
    ],
  },
  {
    name: 'Relatórios e Análises',
    icon: 'bar-chart-3',
    order: 4,
    items: [
      { name: 'DRE Gerencial Mensal', basePrice: 320, estimatedHours: 4, recurrence: 'MENSAL' as Recurrence },
      { name: 'Balanço Patrimonial', basePrice: 480, estimatedHours: 6, recurrence: 'MENSAL' as Recurrence },
      { name: 'Fluxo de Caixa Projetado', basePrice: 280, estimatedHours: 3, recurrence: 'MENSAL' as Recurrence },
      { name: 'Relatório de Inadimplência', basePrice: 180, estimatedHours: 2, recurrence: 'MENSAL' as Recurrence },
      { name: 'Análise de Custos', basePrice: 420, estimatedHours: 5, recurrence: 'MENSAL' as Recurrence },
      { name: 'Indicadores Financeiros (KPIs)', basePrice: 350, estimatedHours: 4, recurrence: 'MENSAL' as Recurrence },
      { name: 'Relatório Anual Consolidado', basePrice: 900, estimatedHours: 12, recurrence: 'ANUAL' as Recurrence },
    ],
  },
  {
    name: 'Atendimento e Suporte',
    icon: 'headphones',
    order: 5,
    items: [
      { name: 'Suporte por e-mail (ilimitado)', basePrice: 200, estimatedHours: 3, recurrence: 'MENSAL' as Recurrence },
      { name: 'Suporte prioritário (WhatsApp)', basePrice: 350, estimatedHours: 5, recurrence: 'MENSAL' as Recurrence },
      { name: 'Atendimento telefônico', basePrice: 280, estimatedHours: 4, recurrence: 'MENSAL' as Recurrence },
      { name: 'Suporte emergencial (fora horário)', basePrice: 450, estimatedHours: 6, recurrence: 'MENSAL' as Recurrence },
      { name: 'Portal do cliente (self-service)', basePrice: 150, estimatedHours: 2, recurrence: 'MENSAL' as Recurrence },
    ],
  },
  {
    name: 'Reuniões e Consultoria',
    icon: 'calendar',
    order: 6,
    items: [
      { name: 'Reunião mensal de acompanhamento', basePrice: 320, estimatedHours: 2, recurrence: 'MENSAL' as Recurrence },
      { name: 'Reunião trimestral estratégica', basePrice: 480, estimatedHours: 3, recurrence: 'TRIMESTRAL' as Recurrence },
      { name: 'Consultoria tributária pontual', basePrice: 600, estimatedHours: 4, recurrence: 'AVULSO' as Recurrence },
      { name: 'Planejamento tributário anual', basePrice: 1800, estimatedHours: 12, recurrence: 'ANUAL' as Recurrence },
      { name: 'Due diligence contábil', basePrice: 2500, estimatedHours: 20, recurrence: 'AVULSO' as Recurrence },
      { name: 'Diagnóstico fiscal', basePrice: 1200, estimatedHours: 10, recurrence: 'AVULSO' as Recurrence },
    ],
  },
  {
    name: 'Tecnologia e Integrações',
    icon: 'cpu',
    order: 7,
    items: [
      { name: 'Integração com ERP do cliente', basePrice: 800, estimatedHours: 10, recurrence: 'AVULSO' as Recurrence },
      { name: 'Integração bancária (API/Open Finance)', basePrice: 600, estimatedHours: 8, recurrence: 'AVULSO' as Recurrence },
      { name: 'Configuração de software contábil', basePrice: 450, estimatedHours: 6, recurrence: 'AVULSO' as Recurrence },
      { name: 'Backup mensal de dados', basePrice: 120, estimatedHours: 1, recurrence: 'MENSAL' as Recurrence },
      { name: 'Migração de dados (onboarding)', basePrice: 900, estimatedHours: 12, recurrence: 'AVULSO' as Recurrence },
      { name: 'Treinamento da equipe do cliente', basePrice: 700, estimatedHours: 4, recurrence: 'AVULSO' as Recurrence },
    ],
  },
  {
    name: 'Benefícios e Extras',
    icon: 'gift',
    order: 8,
    items: [
      { name: 'Abertura de empresa (MEI)', basePrice: 350, estimatedHours: 3, recurrence: 'AVULSO' as Recurrence },
      { name: 'Abertura de empresa (ME/EPP)', basePrice: 800, estimatedHours: 8, recurrence: 'AVULSO' as Recurrence },
      { name: 'Alteração contratual', basePrice: 450, estimatedHours: 4, recurrence: 'AVULSO' as Recurrence },
      { name: 'Encerramento de empresa', basePrice: 1200, estimatedHours: 12, recurrence: 'AVULSO' as Recurrence },
      { name: 'Declaração de IRPF', basePrice: 280, estimatedHours: 3, recurrence: 'ANUAL' as Recurrence },
      { name: 'Certificado digital (A1/A3)', basePrice: 180, estimatedHours: 1, recurrence: 'ANUAL' as Recurrence },
      { name: 'Regularização de débitos fiscais', basePrice: 900, estimatedHours: 10, recurrence: 'AVULSO' as Recurrence },
      { name: 'Recuperação de créditos tributários', basePrice: 1500, estimatedHours: 15, recurrence: 'AVULSO' as Recurrence },
    ],
  },
];

async function main() {
  console.log('📦 Iniciando seed do Catálogo de Serviços...\n');

  // Buscar empresa demo
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
    console.log(`✅ Empresa criada: ${company.name}\n`);
  } else {
    console.log(`✅ Empresa encontrada: ${company.name}\n`);
  }

  let totalCategories = 0;
  let totalItems = 0;

  for (const category of CATALOG) {
    // Busca categoria por (companyId + name) - abordagem robusta sem unique composto
    let cat = await prisma.serviceCategory.findFirst({
      where: { companyId: company.id, name: category.name },
    });

    if (cat) {
      // Atualiza se já existe
      cat = await prisma.serviceCategory.update({
        where: { id: cat.id },
        data: {
          icon: category.icon,
          order: category.order,
        },
      });
    } else {
      // Cria nova
      cat = await prisma.serviceCategory.create({
        data: {
          companyId: company.id,
          name: category.name,
          icon: category.icon,
          order: category.order,
        },
      });
    }

    totalCategories++;
    console.log(`✅ Categoria: ${category.name}`);

    // Cria/atualiza itens da categoria
    for (const item of category.items) {
      const existing = await prisma.serviceItem.findFirst({
        where: { companyId: company.id, categoryId: cat.id, name: item.name },
      });

      if (existing) {
        await prisma.serviceItem.update({
          where: { id: existing.id },
          data: {
            basePrice: item.basePrice,
            estimatedHours: item.estimatedHours,
            recurrence: item.recurrence,
          },
        });
      } else {
        await prisma.serviceItem.create({
          data: {
            companyId: company.id,
            categoryId: cat.id,
            name: item.name,
            basePrice: item.basePrice,
            estimatedHours: item.estimatedHours,
            recurrence: item.recurrence,
            order: totalItems,
            isActive: true,
          },
        });
      }
      totalItems++;
    }
  }

  console.log(`\n🎉 Seed do catálogo concluído!`);
  console.log(`📊 Total: ${totalCategories} categorias, ${totalItems} itens`);
}

main()
  .catch((e) => {
    console.error('❌ Erro no seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });