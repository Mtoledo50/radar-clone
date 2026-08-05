/**
 * =================================================================
 * 🌍 SEED: CONTAS CONTÁBEIS GLOBAIS (Enterprise)
 * =================================================================
 * Cria contas contábeis padrão do sistema (companyId: null)
 * que servem como template para novos escritórios.
 * =================================================================
 */

import { PrismaClient, AccountType, AccountNature } from '@prisma/client';

const prisma = new PrismaClient();

// =================================================================
// 📋 DEFINIÇÃO DAS CONTAS GLOBAIS
// =================================================================
const globalAccounts = [
  // ATIVO
  { code: '1', name: 'ATIVO', type: AccountType.ATIVO, nature: AccountNature.DEVEDORA, level: 1 },
  { code: '1.1', name: 'ATIVO CIRCULANTE', type: AccountType.ATIVO, nature: AccountNature.DEVEDORA, level: 2, parentCode: '1' },
  { code: '1.1.01', name: 'CAIXA GERAL', type: AccountType.ATIVO, nature: AccountNature.DEVEDORA, level: 3, parentCode: '1.1' },
  { code: '1.1.02', name: 'BANCOS CONTA MOVIMENTO', type: AccountType.ATIVO, nature: AccountNature.DEVEDORA, level: 3, parentCode: '1.1' },
  { code: '1.1.03', name: 'APLICAÇÕES FINANCEIRAS', type: AccountType.ATIVO, nature: AccountNature.DEVEDORA, level: 3, parentCode: '1.1' },
  { code: '1.1.04', name: 'CLIENTES (CONTAS A RECEBER)', type: AccountType.ATIVO, nature: AccountNature.DEVEDORA, level: 3, parentCode: '1.1' },
  { code: '1.2', name: 'ATIVO NÃO CIRCULANTE', type: AccountType.ATIVO, nature: AccountNature.DEVEDORA, level: 2, parentCode: '1' },
  { code: '1.2.01', name: 'IMOBILIZADO', type: AccountType.ATIVO, nature: AccountNature.DEVEDORA, level: 3, parentCode: '1.2' },
  
  // PASSIVO
  { code: '2', name: 'PASSIVO', type: AccountType.PASSIVO, nature: AccountNature.CREDORA, level: 1 },
  { code: '2.1', name: 'PASSIVO CIRCULANTE', type: AccountType.PASSIVO, nature: AccountNature.CREDORA, level: 2, parentCode: '2' },
  { code: '2.1.01', name: 'FORNECEDORES', type: AccountType.PASSIVO, nature: AccountNature.CREDORA, level: 3, parentCode: '2.1' },
  { code: '2.1.02', name: 'IMPOSTOS A RECOLHER', type: AccountType.PASSIVO, nature: AccountNature.CREDORA, level: 3, parentCode: '2.1' },
  { code: '2.1.03', name: 'SALÁRIOS A PAGAR', type: AccountType.PASSIVO, nature: AccountNature.CREDORA, level: 3, parentCode: '2.1' },
  { code: '2.2', name: 'PASSIVO NÃO CIRCULANTE', type: AccountType.PASSIVO, nature: AccountNature.CREDORA, level: 2, parentCode: '2' },
  
  // PATRIMÔNIO LÍQUIDO
  { code: '3', name: 'PATRIMÔNIO LÍQUIDO', type: AccountType.PATRIMONIO_LIQUIDO, nature: AccountNature.CREDORA, level: 1 },
  { code: '3.1', name: 'CAPITAL SOCIAL', type: AccountType.PATRIMONIO_LIQUIDO, nature: AccountNature.CREDORA, level: 2, parentCode: '3' },
  { code: '3.2', name: 'LUCROS ACUMULADOS', type: AccountType.PATRIMONIO_LIQUIDO, nature: AccountNature.CREDORA, level: 2, parentCode: '3' },
  
  // RECEITAS
  { code: '4', name: 'RECEITAS', type: AccountType.RECEITA, nature: AccountNature.CREDORA, level: 1 },
  { code: '4.1', name: 'RECEITA DE SERVIÇOS', type: AccountType.RECEITA, nature: AccountNature.CREDORA, level: 2, parentCode: '4' },
  { code: '4.1.01', name: 'HONORÁRIOS CONTÁBEIS', type: AccountType.RECEITA, nature: AccountNature.CREDORA, level: 3, parentCode: '4.1' },
  { code: '4.1.02', name: 'RECEITA DE CONSULTORIA', type: AccountType.RECEITA, nature: AccountNature.CREDORA, level: 3, parentCode: '4.1' },
  { code: '4.2', name: 'OUTRAS RECEITAS', type: AccountType.RECEITA, nature: AccountNature.CREDORA, level: 2, parentCode: '4' },
  
  // DESPESAS
  { code: '5', name: 'DESPESAS', type: AccountType.DESPESA, nature: AccountNature.DEVEDORA, level: 1 },
  { code: '5.1', name: 'DESPESAS OPERACIONAIS', type: AccountType.DESPESA, nature: AccountNature.DEVEDORA, level: 2, parentCode: '5' },
  { code: '5.1.01', name: 'SALÁRIOS E ORDENADOS', type: AccountType.DESPESA, nature: AccountNature.DEVEDORA, level: 3, parentCode: '5.1' },
  { code: '5.1.02', name: 'ALUGUEL', type: AccountType.DESPESA, nature: AccountNature.DEVEDORA, level: 3, parentCode: '5.1' },
  { code: '5.1.03', name: 'ENERGIA E ÁGUA', type: AccountType.DESPESA, nature: AccountNature.DEVEDORA, level: 3, parentCode: '5.1' },
  { code: '5.1.04', name: 'INTERNET E TELEFONIA', type: AccountType.DESPESA, nature: AccountNature.DEVEDORA, level: 3, parentCode: '5.1' },
  { code: '5.1.05', name: 'MATERIAL DE ESCRITÓRIO', type: AccountType.DESPESA, nature: AccountNature.DEVEDORA, level: 3, parentCode: '5.1' },
  { code: '5.2', name: 'DESPESAS TRIBUTÁRIAS', type: AccountType.DESPESA, nature: AccountNature.DEVEDORA, level: 2, parentCode: '5' },
  { code: '5.2.01', name: 'IMPOSTOS SOBRE SERVIÇOS', type: AccountType.DESPESA, nature: AccountNature.DEVEDORA, level: 3, parentCode: '5.2' },
];

// =================================================================
// 🚀 FUNÇÃO PRINCIPAL
// =================================================================
async function main() {
  console.log('═'.repeat(70));
  console.log('🌍 SEED: CONTAS CONTÁBEIS GLOBAIS');
  console.log('═'.repeat(70));
  console.log();
  console.log(`📊 Total de contas a criar: ${globalAccounts.length}\n`);

  let created = 0;
  let skipped = 0;

  // PASSO 1: Criar todas as contas (sem parentId)
  console.log('🔄 [PASSO 1/2] Criando contas globais...\n');
  
  for (const account of globalAccounts) {
    // Usa findFirst para verificar existência (companyId: null = global)
    const existing = await prisma.accountingAccount.findFirst({
      where: { 
        companyId: null,
        code: account.code 
      },
    });

    if (existing) {
      skipped++;
      continue;
    }

    await prisma.accountingAccount.create({
      data: {
        companyId: null, // Conta global
        code: account.code,
        name: account.name,
        type: account.type,        // ✅ Enum
        nature: account.nature,    // ✅ Enum
        level: account.level,
        isActive: true,
      },
    });
    
    created++;
    console.log(`✅ [NOVA] ${account.code} - ${account.name}`);
  }

  // PASSO 2: Vincular hierarquia
  console.log(`\n🔄 [PASSO 2/2] Vinculando hierarquia...\n`);
  
  for (const account of globalAccounts) {
    if (!account.parentCode) continue;

    const parent = await prisma.accountingAccount.findFirst({
      where: { companyId: null, code: account.parentCode },
    });

    if (!parent) {
      console.warn(`⚠️  Pai não encontrado: ${account.parentCode} para ${account.code}`);
      continue;
    }

    const current = await prisma.accountingAccount.findFirst({
      where: { companyId: null, code: account.code },
    });

    if (current && !current.parentId) {
      await prisma.accountingAccount.update({
        where: { id: current.id },
        data: { parentId: parent.id },
      });
    }
  }

  console.log('\n' + '═'.repeat(70));
  console.log('📈 RESUMO FINAL');
  console.log('═'.repeat(70));
  console.log(`✅ Contas criadas: ${created}`);
  console.log(`⏭️  Contas ignoradas (já existiam): ${skipped}`);
  console.log('═'.repeat(70));
}

main()
  .catch((e) => {
    console.error('❌ Erro fatal:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });