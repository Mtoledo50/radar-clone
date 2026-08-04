import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

function getAccountType(code: string): string {
  const firstDigit = code.split('.')[0];
  if (firstDigit === '01') return 'ATIVO';
  if (firstDigit === '02') return code.startsWith('02.3') ? 'PATRIMONIO_LIQUIDO' : 'PASSIVO';
  if (firstDigit === '03') return 'RECEITA';
  if (firstDigit === '04') return 'DESPESA';
  if (firstDigit === '05') return 'RECEITA';
  return 'ATIVO';
}

function getAccountNature(type: string): string {
  if (type === 'ATIVO' || type === 'DESPESA') return 'DEBITORA';
  return 'CREDORA';
}

function getAccountLevel(code: string): number {
  return code.split('.').length;
}

async function importGlobalAccounts() {
  console.log('🚀 Iniciando importação do Plano de Contas PADRÃO...\n');

  const csvPath = path.join(__dirname, '../Impressão de campos da consulta2.csv');
  const csvContent = fs.readFileSync(csvPath, 'utf-8');
  const lines = csvContent.split('\n');
  const dataLines = lines.slice(1);
  
  console.log(`📊 Total de linhas no CSV: ${dataLines.length}\n`);

  let importedCount = 0;
  let skippedCount = 0;

  for (const line of dataLines) {
    if (!line.trim()) continue;

    const [codigo, classificacao, nome] = line.split(';');
    if (!codigo || !nome) {
      skippedCount++;
      continue;
    }

    const cleanName = nome.trim();
    const cleanCode = codigo.trim();
    const type = getAccountType(cleanCode);
    const nature = getAccountNature(type);
    const level = getAccountLevel(cleanCode);

    try {
      // Verifica se JÁ EXISTE alguma conta com este código (ignora companyId para evitar o bug)
      const existing = await prisma.accountingAccount.findFirst({
        where: { code: cleanCode }
      });

      if (existing) {
        skippedCount++;
        continue;
      }

      // Cria a conta global
      await prisma.accountingAccount.create({
        data: {
          companyId: null, // Global
          code: cleanCode,
          name: cleanName,
          type: type,
          nature: nature,
          level: level,
          isActive: true,
        }
      });

      importedCount++;
      // Mostra progresso a cada 100 contas para não poluir o terminal
      if (importedCount % 100 === 0) {
        console.log(`⏳ Importadas: ${importedCount}...`);
      }

    } catch (error: any) {
      console.error(`❌ Erro ao importar ${cleanCode}:`, error.message);
      skippedCount++;
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('✅ SUCESSO NA IMPORTAÇÃO!');
  console.log('='.repeat(60));
  console.log(`Contas importadas: ${importedCount}`);
  console.log(`Contas ignoradas (já existentes): ${skippedCount}`);
  console.log('='.repeat(60));
}

importGlobalAccounts()
  .catch((e) => {
    console.error('❌ Erro fatal:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });