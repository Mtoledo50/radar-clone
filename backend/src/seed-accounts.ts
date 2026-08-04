/**
 * Script para importar Plano de Contas Contábeis
 * Lê o CSV e popula o banco de dados via Prisma
 */
import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

// Função para determinar o tipo da conta baseado no código
function getAccountType(code: string): string {
  const firstDigit = code.split('.')[0];
  
  if (firstDigit === '01') return 'ATIVO';
  if (firstDigit === '02') {
    // Verificar se é Patrimônio Líquido (02.3.x.x)
    if (code.startsWith('02.3')) return 'PATRIMONIO_LIQUIDO';
    return 'PASSIVO';
  }
  if (firstDigit === '03') return 'RECEITA';
  if (firstDigit === '04') return 'DESPESA';
  if (firstDigit === '05') return 'RECEITA'; // Resultado do exercício
  
  return 'ATIVO'; // Default
}

// Função para determinar a natureza da conta
function getAccountNature(type: string): string {
  switch (type) {
    case 'ATIVO':
    case 'DESPESA':
      return 'DEBITORA';
    case 'PASSIVO':
    case 'PATRIMONIO_LIQUIDO':
    case 'RECEITA':
      return 'CREDORA';
    default:
      return 'DEBITORA';
  }
}

// Função para calcular o nível hierárquico
function getAccountLevel(code: string): number {
  return code.split('.').length;
}

async function importAccounts() {
  console.log('🚀 Iniciando importação de contas contábeis...\n');

  // Ler o arquivo CSV
  const csvPath = path.join(__dirname, '../Impressão de campos da consulta2.csv');
  const csvContent = fs.readFileSync(csvPath, 'utf-8');
  const lines = csvContent.split('\n');

  // Pular o cabeçalho (primeira linha)
  const dataLines = lines.slice(1);
  
  console.log(`📊 Total de linhas no CSV: ${dataLines.length}\n`);

  let importedCount = 0;
  let skippedCount = 0;

  // Processar cada linha
  for (const line of dataLines) {
    if (!line.trim()) continue;

    // Separar por ponto e vírgula
    const [codigo, classificacao, nome] = line.split(';');
    
    if (!codigo || !nome) {
      skippedCount++;
      continue;
    }

    // Limpar o nome (remover espaços extras)
    const cleanName = nome.trim();
    const cleanCode = codigo.trim();

    try {
      // Determinar tipo e natureza
      const type = getAccountType(cleanCode);
      const nature = getAccountNature(type);
      const level = getAccountLevel(cleanCode);

      // Verificar se a conta já existe
      const existingAccount = await prisma.accountingAccount.findFirst({
        where: { code: cleanCode }
      });

      if (existingAccount) {
        console.log(`⏭️  Conta já existe: ${cleanCode} - ${cleanName}`);
        skippedCount++;
        continue;
      }

      // Criar a conta
      await prisma.accountingAccount.create({
        data: {
          companyId: 'COMPANY_ID_AQUI', // ⚠️ SUBSTITUA PELO ID DA EMPRESA
          code: cleanCode,
          name: cleanName,
          type: type,
          nature: nature,
          level: level,
          isActive: true,
        }
      });

      importedCount++;
      console.log(`✅ Importada: ${cleanCode} - ${cleanName} (${type})`);

    } catch (error) {
      console.error(` Erro ao importar ${cleanCode}:`, error.message);
      skippedCount++;
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('📈 RESUMO DA IMPORTAÇÃO:');
  console.log('='.repeat(60));
  console.log(`✅ Contas importadas: ${importedCount}`);
  console.log(`⏭️  Contas ignoradas: ${skippedCount}`);
  console.log('='.repeat(60));
}

// Executar
importAccounts()
  .catch((e) => {
    console.error('❌ Erro fatal:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });