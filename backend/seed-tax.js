const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
async function main() {
  const company = await p.company.findFirst();
  const client = await p.client.findFirst({ where: { companyId: company.id, companyName: { contains: 'ACGS' } } });
  if (!client) { console.log('❌ Cliente ACGS não encontrado'); return; }

  // 3 NFS-e EMITIDAs em 2026-07 (2 próprias + 1 retida)
  const seed = [
    { number: 'NF001', issuerCnpj: '11222333000144', serviceValue: 3000, issRate: 5, issRetained: false },
    { number: 'NF002', issuerCnpj: '11222333000144', serviceValue: 4500, issRate: 5, issRetained: false },
    { number: 'NF003', issuerCnpj: '11222333000144', serviceValue: 2000, issRate: 5, issRetained: true },
  ];

  for (const s of seed) {
    await p.fiscalServiceInvoice.upsert({
      where: { companyId_issuerCnpj_number_series: { companyId: company.id, issuerCnpj: s.issuerCnpj, number: s.number, series: '' } },
      update: {},
      create: {
        companyId: company.id,
        clientId: client.id,
        number: s.number,
        series: '',
        emissionDate: new Date('2026-07-15T10:00:00Z'),
        competenceDate: new Date('2026-07-01T00:00:00Z'),
        issuerCnpj: s.issuerCnpj,
        issuerName: 'ACGS CORRETORA DE SEGUROS LTDA',
        serviceValue: s.serviceValue,
        issBase: s.serviceValue,
        issRate: s.issRate,
        issValue: s.serviceValue * s.issRate / 100,
        issRetained: s.issRetained,
        direction: 'EMITIDA',
        source: 'MANUAL',
        status: 'IMPORTED',
        serviceCode: '10.01',
        serviceDescription: 'Corretagem de seguros - jul/2026',
        municipalityCode: '4314902',
      },
    });
  }

  console.log('✅ 3 NFS-e seed para ACGS em 2026-07:');
  console.log('   NF001 R$ 3.000 ISS próprio 5%  → R$ 150');
  console.log('   NF002 R$ 4.500 ISS próprio 5%  → R$ 225');
  console.log('   NF003 R$ 2.000 ISS RETIDO 5%   → R$ 100 (não gera guia)');
  console.log('   Total ISS próprio esperado: R$ 375,00');
  console.log('   Receita do mês: R$ 9.500 (RBT12 parcial: R$ 9.500 — empresa nova)');
}
main().finally(() => p.$disconnect());
