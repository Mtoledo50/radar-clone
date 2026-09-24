/**
 * ============================================================================
 *  SEED: PLANOS DE CONTAS SCI (MULTI-ARQUIVO)
 * ============================================================================
 * Objetivo: Popular tabelas `account_templates` e `accounting_accounts` 
 * a partir de TODOS os arquivos CSV encontrados em docs/csv/.
 * 
 * Detecta automaticamente: Plano_de_Contas_90113.csv, Plano_de_Contas_90132.csv, etc.
 * Idempotente (Upsert) - ADR-066
 * ============================================================================
 */

import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

// Mapeamento seguro de tipos
const TYPE_MAP: Record<string, string> = {
  'ATIVO': 'ATIVO',
  'PASSIVO': 'PASSIVO',
  'RECEITA': 'RECEITA',
  'DESPESA': 'DESPESA',
  'PATRIMONIO_LIQUIDO': 'PATRIMONIO_LIQUIDO'
};

async function parseAndImportCSV(filePath: string, planNameFromFilename: string) {
  console.log(`\n📂 Processando: ${path.basename(filePath)}...`);
  
  const rawContent = fs.readFileSync(filePath, 'utf-8');
  const tokens = rawContent.split(';').map(t => t.trim().replace(/^\ufeff/, ''));
  
  interface ParsedRow {
    seq: string;
    code: string;
    name: string;
    nickname: string;
    type: string;
    report: string;
    isSynthetic: boolean;
    level: number;
    parentCode?: string;
  }

  const isNum = (s: string) => /^\d{1,5}$/.test(s);
  const isCode = (s: string) => /^\d+(\.\d+)*$/.test(s);
  
  const rows: ParsedRow[] = [];
  let i = 0;
  
  while (i < tokens.length - 8) {
    if (isNum(tokens[i]) && isCode(tokens[i+1])) {
      const seq = tokens[i];
      const code = tokens[i+1];
      const tipoRaw = tokens[i+2];
      const name = tokens[i+3];
      const nickname = tokens[i+4];
      const grupo = tokens[i+5];
      const relatorio = tokens[i+6];
      
      if (name && grupo) {
        const isSynthetic = tipoRaw.toUpperCase() === 'T';
        const level = (code.match(/\./g) || []).length + 1;
        const parts = code.split('.');
        const parentCode = parts.length > 1 ? parts.slice(0, -1).join('.') : undefined;

        let prismaType = grupo.toUpperCase().replace(/\s+/g, '_');
        if (!TYPE_MAP[prismaType]) {
            if (grupo.toUpperCase().includes('ATIVO')) prismaType = 'ATIVO';
            else if (grupo.toUpperCase().includes('PASSIVO')) prismaType = 'PASSIVO';
            else if (grupo.toUpperCase().includes('RECEITA')) prismaType = 'RECEITA';
            else if (grupo.toUpperCase().includes('DESPESA')) prismaType = 'DESPESA';
            else prismaType = 'OUTROS';
        }

        rows.push({
          seq, code, name: name.replace(/^\s+|\s+$/g, ''),
          nickname: nickname || '', type: prismaType,
          report: relatorio.includes('Balanço') ? 'BALANCO' : 'DRE',
          isSynthetic, level, parentCode
        });
        
        i += 7; continue;
      }
    }
    i++;
  }

  console.log(`   ✅ Parseados ${rows.length} registros.`);

  // 1. Importar Templates Globais
  let tplCount = 0;
  for (const row of rows) {
    const reducedCode = parseInt(row.seq, 10);
    try {
      await prisma.accountTemplate.upsert({
        where: { reducedCode },
        update: { code: row.code, parentCode: row.parentCode, name: row.name, nickname: row.nickname, accountType: row.type, report: row.report, isSynthetic: row.isSynthetic, level: row.level },
        create: { reducedCode, code: row.code, parentCode: row.parentCode, name: row.name, nickname: row.nickname, accountType: row.type, report: row.report, isSynthetic: row.isSynthetic, level: row.level }
      });
      tplCount++;
    } catch (e: any) { /* ignora duplicatas de reducedCode entre planos se houver conflito */ }
  }
  console.log(`   🌍 Templates globais: ${tplCount}`);

  // 2. Importar Contas da Empresa Demo
  const demoCompany = await prisma.company.findFirst({ where: { name: { contains: 'Demo' } } });
  if (demoCompany) {
    const finalPlanName = `SCI ${planNameFromFilename}`;
    let accCount = 0;
    
    for (const row of rows) {
      const nature = (row.type === 'ATIVO' || row.type === 'DESPESA') ? 'DEVEDORA' : 'CREDORA';
      let parentId: string | null = null;
      if (row.parentCode) {
        const parentAcc = await prisma.accountingAccount.findFirst({
          where: { companyId: demoCompany.id, planName: finalPlanName, code: row.parentCode }
        });
        parentId = parentAcc?.id || null;
      }

      try {
        await prisma.accountingAccount.upsert({
          where: { companyId_planName_code: { companyId: demoCompany.id, planName: finalPlanName, code: row.code } },
          update: { name: row.name, seq: row.seq, accountNumber: row.seq, sciCode: row.nickname || null, type: row.type as any, nature: nature as any, level: row.level, isActive: true, parentId },
          create: { companyId: demoCompany.id, planName: finalPlanName, code: row.code, name: row.name, seq: row.seq, accountNumber: row.seq, sciCode: row.nickname || null, type: row.type as any, nature: nature as any, level: row.level, isActive: true, parentId }
        });
        accCount++;
      } catch (e: any) { console.warn(`⚠️ Conta ${row.code}: ${e.message}`); }
    }
    console.log(`   🏢 Contas empresa (${finalPlanName}): ${accCount}`);
  } else {
    console.warn('️ Empresa Demo não encontrada.');
  }
}

async function seedAllPlans() {
  console.log('\n🚀 [SEED] Iniciando importação MULTI-PLANO de Contas...');
  
  // Caminho relativo ao backend/prisma -> sobe dois níveis para radar-clone/docs/csv
  const csvDir = path.join(__dirname, '..', '..', 'docs', 'csv');
  
  if (!fs.existsSync(csvDir)) {
    console.error(`❌ Pasta não encontrada: ${csvDir}`);
    process.exit(1);
  }

  const files = fs.readdirSync(csvDir).filter(f => f.startsWith('Plano_de_Contas_') && f.endsWith('.csv'));
  
  if (files.length === 0) {
    console.warn('⚠️ Nenhum arquivo Plano_de_Contas_*.csv encontrado.');
    return;
  }

  console.log(`📁 Encontrados ${files.length} plano(s) de contas:\n   ${files.join('\n   ')}`);

  for (const file of files) {
    // Extrai o número do nome: Plano_de_Contas_90113.csv -> 90113
    const match = file.match(/Plano_de_Contas_(\d+)\.csv/);
    const planId = match ? match[1] : file.replace('.csv', '');
    
    await parseAndImportCSV(path.join(csvDir, file), planId);
  }

  console.log('\n [SEED] Todos os planos de contas importados com sucesso!');
}

seedAllPlans()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });