// backend/prisma/import-s3d.ts
// Rodar: npx ts-node prisma/import-s3d.ts
import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

// Caminho dos CSVs (ajuste se necessário)
const CSV_EMPRESAS = path.join(__dirname, '../../docs/csv/S3D_empresas_20260910124244_142620.csv');
const CSV_CONTATOS = path.join(__dirname, '../../docs/csv/S3D_empresas_contatos_20260910124602_142620.csv');

interface EmpresaS3D {
  'Razão social'?: string;
  ID?: string;
  CNPJ?: string;
  Fone?: string;
  Regime?: string;
  'Nome fantasia'?: string;
  'Cli. desde'?: string;
  'Data de abertura'?: string;
  Honorários?: string;
  UF?: string;
  [key: string]: string | undefined;
}

interface ContatoS3D {
  ID?: string;
  'Nome do Contato'?: string;
  'Cargo do Contato'?: string;
  'Telefone do Contato'?: string;
  'Email do Contato'?: string;
  [key: string]: string | undefined;
}

function parseCSV<T = Record<string, string>>(filePath: string): T[] {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length === 0) return [];

  const header = lines[0].split(';').map((h) => h.trim().replace(/^"|"$/g, ''));
  const rows: T[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(';').map((v) => v.trim().replace(/^"|"$/g, ''));
    const row: Record<string, string> = {};
    header.forEach((h, idx) => {
      row[h] = values[idx] ?? '';
    });
    rows.push(row as T);
  }

  return rows;
}

function limparCNPJ(cnpj: string): string {
  return (cnpj ?? '').replace(/\D/g, '').padStart(14, '0');
}

function parseData(dataStr: string): Date | null {
  if (!dataStr) return null;
  // Formato: DD/MM/YYYY
  const match = dataStr.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!match) return null;
  const [, dd, mm, yyyy] = match;
  return new Date(`${yyyy}-${mm}-${dd}`);
}

function mapearRegime(regime: string): string {
  const r = (regime ?? '').toLowerCase();
  if (r.includes('simples')) return 'SIMPLES_NACIONAL';
  if (r.includes('presumido')) return 'LUCRO_PRESUMIDO';
  if (r.includes('real')) return 'LUCRO_REAL';
  if (r.includes('mei')) return 'MEI';
  if (r.includes('doméstica') || r.includes('cei')) return 'DOMESTICA';
  return 'OUTRO';
}

async function main() {
  // 1. Pega a company (única no seed)
  const company = await prisma.company.findFirst();
  if (!company) {
    console.error('❌ Nenhuma company encontrada. Rode o seed geral primeiro.');
    return;
  }
  console.log(`\n🏢 Company: ${company.name} (${company.id})`);

  // 2. Pega o primeiro user admin para vincular aos clientes
  const adminUser = await prisma.user.findFirst({
    where: { companyId: company.id, role: 'ADMIN' },
  });
  if (!adminUser) {
    console.error('❌ Nenhum usuário admin encontrado.');
    return;
  }
  console.log(`👤 Admin User: ${adminUser.email} (${adminUser.id})`);

  // 3. Lê CSVs
  if (!fs.existsSync(CSV_EMPRESAS)) {
    console.error(`❌ Arquivo não encontrado: ${CSV_EMPRESAS}`);
    return;
  }

  const empresas = parseCSV<EmpresaS3D>(CSV_EMPRESAS);
  console.log(`📄 Empresas no CSV: ${empresas.length}`);

  const contatos = fs.existsSync(CSV_CONTATOS)
    ? parseCSV<ContatoS3D>(CSV_CONTATOS)
    : [];
  console.log(`📄 Contatos no CSV: ${contatos.length}`);

  // 4. Agrupa contatos por ID da empresa
  const contatosPorEmpresa = new Map<string, ContatoS3D[]>();
  for (const c of contatos) {
    const id = c.ID ?? '';
    if (!contatosPorEmpresa.has(id)) contatosPorEmpresa.set(id, []);
    contatosPorEmpresa.get(id)!.push(c);
  }

  // 5. Insere empresas
  let criadas = 0;
  let atualizadas = 0;
  const clientIdsPorIdS3D = new Map<string, string>(); // S3D.ID → Client.id

  for (const emp of empresas) {
    const cnpj = limparCNPJ(emp.CNPJ ?? '');
    if (!cnpj || cnpj.length !== 14) {
      console.warn(`⚠️  CNPJ inválido, pulando: ${emp['Razão social']}`);
      continue;
    }

    const nome = emp['Nome fantasia'] || emp['Razão social'] || `Empresa ${cnpj}`;
    const startDate = parseData(emp['Cli. desde'] ?? '') 
                   ?? parseData(emp['Data de abertura'] ?? '')
                   ?? new Date(); // fallback: hoje

    const honorarios = parseFloat((emp.Honorários ?? '0').replace(',', '.')) || 0;
    const regime = mapearRegime(emp.Regime ?? '');

    try {
      // Tenta achar cliente existente pelo CNPJ na mesma company
      const existente = await prisma.client.findFirst({
        where: { companyId: company.id, cnpj },
      });

      const client = existente
        ? await prisma.client.update({
            where: { id: existente.id },
            data: {
              companyName: nome,
              cnpj,
              monthlyFee: honorarios,
              serviceType: regime as any,
            },
          })
        : await prisma.client.create({
            data: {
              companyId: company.id,
              companyName: nome,
              cnpj,
              startDate,
              monthlyFee: honorarios,
              serviceType: regime as any,
              accountingPlan: 'PADRAO',
              status: 'ACTIVE' as any,
              user: { connect: { id: adminUser.id } },
            },
          });

      if (emp.ID) {
        clientIdsPorIdS3D.set(emp.ID, client.id);
      }

      if (existente) {
        atualizadas++;
      } else {
        criadas++;
      }
    } catch (err: any) {
      console.error(`❌ Erro ao processar ${emp['Razão social']}: ${err.message}`);
    }
  }

  console.log(`\n✅ Empresas: ${criadas} criadas, ${atualizadas} atualizadas`);

  // 6. Insere contatos (ClientContact)
  let contatosCriados = 0;
  for (const [idS3D, lista] of contatosPorEmpresa) {
    const clientId = clientIdsPorIdS3D.get(idS3D);
    if (!clientId) {
      console.warn(`⚠️  Contatos da empresa ID ${idS3D} sem cliente correspondente`);
      continue;
    }

    for (let i = 0; i < lista.length; i++) {
      const c = lista[i];
      if (!c['Nome do Contato']) continue;

      try {
        await prisma.clientContact.create({
          data: {
            companyId: company.id,
            clientId,
            name: c['Nome do Contato'],
            role: c['Cargo do Contato'] || null,
            phone: c['Telefone do Contato'] || null,
            email: c['Email do Contato'] || null,
            isPrimary: i === 0, // primeiro contato é primário
          },
        });
        contatosCriados++;
      } catch (err: any) {
        console.error(`❌ Erro ao criar contato ${c['Nome do Contato']}: ${err.message}`);
      }
    }
  }

  console.log(`✅ Contatos: ${contatosCriados} criados`);

  // 7. Resumo
  const totalClients = await prisma.client.count({ where: { companyId: company.id } });
  const totalContacts = await prisma.clientContact.count({ where: { companyId: company.id } });
  console.log(`\n🎉 Total no banco: ${totalClients} clientes, ${totalContacts} contatos`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());