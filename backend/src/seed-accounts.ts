/**
 * =================================================================
 * 📊 SEED: IMPORTAÇÃO DE PLANO DE CONTAS CONTÁBEIS (Enterprise)
 * =================================================================
 * 
 * 📌 DESCRIÇÃO:
 * Script profissional para importar um Plano de Contas a partir de um
 * arquivo CSV e populá-lo no banco de dados respeitando:
 * - Multi-tenancy (companyId)
 * - Hierarquia (parentId)
 * - Idempotência (pode ser rodado várias vezes sem duplicar)
 * - Enums tipados (AccountType, AccountNature)
 * 
 * 📁 ARQUIVO CSV ESPERADO:
 * - Localização: backend/Impressão de campos da consulta2.csv
 * - Separador: ponto e vírgula (;)
 * - Colunas: codigo;classificacao;nome
 * - Exemplo: "01.1.1;1.1.1;CAIXA GERAL"
 * 
 * 🚀 EXECUÇÃO:
 * npx ts-node src/seed-accounts.ts
 * 
 * =================================================================
 */

import { PrismaClient, AccountType, AccountNature } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

// =================================================================
// 🎯 INSTÂNCIA DO PRISMA
// =================================================================
const prisma = new PrismaClient();

// =================================================================
// 📋 TIPOS E INTERFACES
// =================================================================
interface CsvAccount {
  code: string;
  classification: string;
  name: string;
}

interface ImportResult {
  imported: number;
  updated: number;
  skipped: number;
  errors: number;
}

// =================================================================
// 🔧 HELPERS: TIPO E NATUREZA (Retornam Enums do Prisma)
// =================================================================

/**
 * Determina o TIPO da conta baseado no primeiro dígito do código.
 * Segue a estrutura padrão do Plano de Contas brasileiro.
 * 
 * @param code - Código da conta (ex: "01.1.1")
 * @returns AccountType (Enum do Prisma)
 */
function getAccountType(code: string): AccountType {
  const firstDigit = code.split('.')[0];

  switch (firstDigit) {
    case '01':
      return AccountType.ATIVO;
    case '02':
      // Patrimônio Líquido é um subgrupo do Passivo (02.3.x.x)
      if (code.startsWith('02.3')) return AccountType.PATRIMONIO_LIQUIDO;
      return AccountType.PASSIVO;
    case '03':
      return AccountType.RECEITA;
    case '04':
      return AccountType.DESPESA;
    case '05':
      // Resultado do exercício é tratado como Receita
      return AccountType.RECEITA;
    default:
      // Fallback seguro
      return AccountType.ATIVO;
  }
}

/**
 * Determina a NATUREZA da conta baseado no seu tipo.
 * Regra contábil universal:
 * - ATIVO e DESPESA → Natureza DEVEDORA (aumentam com débito)
 * - PASSIVO, PL e RECEITA → Natureza CREDORA (aumentam com crédito)
 * 
 * @param type - AccountType da conta
 * @returns AccountNature (Enum do Prisma)
 */
function getAccountNature(type: AccountType): AccountNature {
  switch (type) {
    case AccountType.ATIVO:
    case AccountType.DESPESA:
      return AccountNature.DEVEDORA;
    case AccountType.PASSIVO:
    case AccountType.PATRIMONIO_LIQUIDO:
    case AccountType.RECEITA:
      return AccountNature.CREDORA;
    default:
      return AccountNature.DEVEDORA;
  }
}

/**
 * Calcula o nível hierárquico da conta baseado nos pontos do código.
 * Ex: "01" = nível 1, "01.1" = nível 2, "01.1.1" = nível 3
 * 
 * @param code - Código da conta
 * @returns Nível hierárquico (Int)
 */
function getAccountLevel(code: string): number {
  return code.split('.').length;
}

/**
 * Extrai o código da conta PAI.
 * Ex: "01.1.1" → retorna "01.1"
 * Ex: "01" → retorna null (não tem pai, é sintética raiz)
 * 
 * @param code - Código da conta
 * @returns Código do pai ou null
 */
function getParentCode(code: string): string | null {
  const parts = code.split('.');
  if (parts.length <= 1) return null;
  return parts.slice(0, -1).join('.');
}

// =================================================================
// 📂 PARSER DE CSV ROBUSTO
// =================================================================

/**
 * Lê e faz parse do arquivo CSV de forma segura.
 * - Trata encoding UTF-8 com BOM
 * - Normaliza quebras de linha (Windows \r\n vs Unix \n)
 * - Ignora linhas vazias e malformadas
 * 
 * @param filePath - Caminho absoluto do CSV
 * @returns Array de CsvAccount
 */
function parseCsvFile(filePath: string): CsvAccount[] {
  if (!fs.existsSync(filePath)) {
    throw new Error(`❌ Arquivo CSV não encontrado: ${filePath}`);
  }

  // Lê o arquivo e remove BOM (Byte Order Mark) se presente
  let content = fs.readFileSync(filePath, 'utf-8');
  if (content.charCodeAt(0) === 0xFEFF) {
    content = content.substring(1);
  }

  // Normaliza quebras de linha (Windows → Unix)
  content = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  const lines = content.split('\n');
  const accounts: CsvAccount[] = [];

  // Pula o cabeçalho (primeira linha) e processa o resto
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const parts = line.split(';');
    if (parts.length < 3) {
      console.warn(`⚠️  Linha ${i + 1} malformada, ignorando: "${line}"`);
      continue;
    }

    const [codigo, classificacao, nome] = parts;

    if (!codigo?.trim() || !nome?.trim()) {
      console.warn(`⚠️  Linha ${i + 1} com dados incompletos, ignorando`);
      continue;
    }

    accounts.push({
      code: codigo.trim(),
      classification: classificacao?.trim() || '',
      name: nome.trim(),
    });
  }

  return accounts;
}

// =================================================================
// 🏢 RESOLUÇÃO DE TENANT (EMPRESA)
// =================================================================

/**
 * Resolve o Tenant (Company) que receberá as contas.
 * Estratégia:
 * 1. Busca a primeira empresa ativa (não deletada)
 * 2. Se não existir, cria uma empresa "Demo" automaticamente
 * 
 * @returns ID da empresa resolvida
 */
async function resolveCompanyId(): Promise<string> {
  let company = await prisma.company.findFirst({
    where: { deletedAt: null },
    orderBy: { createdAt: 'asc' },
  });

  if (!company) {
    console.log('⚠️  Nenhuma empresa encontrada. Criando empresa Demo...');
    company = await prisma.company.create({
      data: {
        name: 'Conta Certa Contabilidade Demo',
        cnpj: '00.000.000/0001-00',
        email: 'contato@contacerta.com.br',
        state: 'SP',
        plan: 'BASIC',
      },
    });
    console.log(`✅ Empresa Demo criada: ${company.id}\n`);
  }

  return company.id;
}

// =================================================================
// 🚀 FUNÇÃO PRINCIPAL DE IMPORTAÇÃO
// =================================================================

async function importAccounts(): Promise<void> {
  console.log('═'.repeat(70));
  console.log('📊 SEED: IMPORTAÇÃO DE PLANO DE CONTAS CONTÁBEIS');
  console.log('═'.repeat(70));
  console.log();

  // 1. Resolver Tenant
  const companyId = await resolveCompanyId();
  console.log(`🏢 Tenant: ${companyId}\n`);

  // 2. Localizar e parsear CSV
  const csvPath = path.join(__dirname, '../Impressão de campos da consulta2.csv');
  console.log(`📂 Lendo CSV: ${csvPath}`);

  let csvAccounts: CsvAccount[];
  try {
    csvAccounts = parseCsvFile(csvPath);
  } catch (error: any) {
    console.error(`❌ Falha ao ler CSV: ${error.message}`);
    process.exit(1);
  }

  console.log(`📊 Total de contas no CSV: ${csvAccounts.length}\n`);

  if (csvAccounts.length === 0) {
    console.log('⚠️  CSV vazio. Nada a importar.');
    return;
  }

  // 3. Preparar resultados
  const result: ImportResult = {
    imported: 0,
    updated: 0,
    skipped: 0,
    errors: 0,
  };

  // 4. PRIMEIRO PASSO: Criar/Atualizar todas as contas (sem parentId)
  console.log('🔄 [PASSO 1/2] Criando/Atualizando contas...\n');

  for (const account of csvAccounts) {
    try {
      const type = getAccountType(account.code);
      const nature = getAccountNature(type);
      const level = getAccountLevel(account.code);

      // UPSERT: Cria se não existe, atualiza se já existe
      const dbAccount = await prisma.accountingAccount.upsert({
        where: {
          // Chave composta única (companyId + code)
          companyId_code: {
            companyId: companyId,
            code: account.code,
          },
        },
        update: {
          // Atualiza apenas se algo mudou
          name: account.name,
          type: type,
          nature: nature,
          level: level,
          isActive: true,
        },
        create: {
          companyId: companyId,
          code: account.code,
          name: account.name,
          type: type,
          nature: nature,
          level: level,
          isActive: true,
          // parentId será preenchido no passo 2
        },
      });

      // Verifica se foi criado ou atualizado
      const existed = await prisma.accountingAccount.count({
        where: {
          id: dbAccount.id,
          createdAt: { lt: new Date(Date.now() - 1000) }, // Criado há mais de 1 segundo
        },
      });

      if (existed > 0) {
        result.updated++;
      } else {
        result.imported++;
        console.log(`✅ [NOVA] ${account.code} - ${account.name} (${type})`);
      }
    } catch (error: any) {
      result.errors++;
      console.error(`❌ Erro em ${account.code}: ${error.message}`);
    }
  }

  console.log(`\n🔄 [PASSO 2/2] Vinculando hierarquia (parent → child)...\n`);

  // 5. SEGUNDO PASSO: Vincular hierarquia (parentId)
  // Precisamos fazer isso em um loop separado porque os pais podem
  // estar depois dos filhos no CSV
  for (const account of csvAccounts) {
    const parentCode = getParentCode(account.code);

    if (!parentCode) {
      // Conta raiz (nível 1), não tem pai
      continue;
    }

    try {
      // Busca o pai no banco
      const parent = await prisma.accountingAccount.findFirst({
        where: {
          companyId: companyId,
          code: parentCode,
        },
      });

      if (!parent) {
        console.warn(`⚠️  Pai não encontrado para ${account.code} (esperado: ${parentCode})`);
        result.skipped++;
        continue;
      }

      // Atualiza a conta com o parentId
      await prisma.accountingAccount.update({
        where: {
          companyId_code: {
            companyId: companyId,
            code: account.code,
          },
        },
        data: {
          parentId: parent.id,
        },
      });
    } catch (error: any) {
      console.error(`❌ Erro ao vincular pai de ${account.code}: ${error.message}`);
      result.errors++;
    }
  }

  // 6. Relatório Final
  console.log('\n' + '═'.repeat(70));
  console.log('📈 RELATÓRIO FINAL DA IMPORTAÇÃO');
  console.log('═'.repeat(70));
  console.log(`✅ Contas NOVAS importadas:   ${result.imported}`);
  console.log(`🔄 Contas ATUALIZADAS:        ${result.updated}`);
  console.log(`⏭️  Contas IGNORADAS:          ${result.skipped}`);
  console.log(`❌ Erros:                     ${result.errors}`);
  console.log(`📊 Total processado:          ${csvAccounts.length}`);
  console.log('═'.repeat(70));

  if (result.errors > 0) {
    console.log('\n⚠️  Atenção: Houve erros. Revise os logs acima.');
  } else {
    console.log('\n🎉 Importação concluída com sucesso!');
  }
}

// =================================================================
// 🎬 EXECUÇÃO
// =================================================================
importAccounts()
  .catch((e) => {
    console.error('\n❌ Erro fatal durante a importação:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    console.log('\n🔌 Conexão com o banco encerrada.');
  });