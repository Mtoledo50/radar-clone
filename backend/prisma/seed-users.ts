/**
 * ============================================================================
 * 🆕 US-1 — SEED DOS 9 USUÁRIOS REAIS (extraído fielmente do CSV e-Contínuo)
 * ============================================================================
 * FONTE DOS DADOS: S3D_usuários_excel_20261007104718_142620.csv
 * RODAGEM: npm run seed:users
 * IDEMPOTÊNCIA: upsert por email @unique — pode rerodar sem medo.
 * SEGURANÇA: senha temporária fixa + mustChangePassword=true força troca
 *            no primeiro login real. Hash bcrypt custo 10 (padrão NestJS).
 * PRESERVAÇÃO: não toca no admin existente (admin@contacerta.com.br).
 *              Apenas adiciona os 9 do CSV ao lado dele.
 * ============================================================================
 */
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { P, grant } from '../src/users/permissions.constants';

const prisma = new PrismaClient();

// ---------------------------------------------------------------------------
// CONFIGURAÇÃO AMBIENTAL
// ---------------------------------------------------------------------------
// COMPANY_ID deve existir ANTES deste seed rodar (registro Company "Conta Certa").
// Confirmado via get-admin.js: companyId = 04706bb4-0b42-4e4c-ab94-c3b8a463d8ff
//const COMPANY_ID = process.env.SEED_COMPANY_ID;
//if (!COMPANY_ID) {
 // throw new Error('❌ Defina SEED_COMPANY_ID no .env antes de rodar este seed.');
//}

// Senha temporária única para TODOS os 9. Cada um troca no 1º login.
// Nunca commitar hash real de produção aqui — é só bootstrap de desenvolvimento.
const TEMP_PASSWORD_PLAIN = process.env.SEED_TEMP_PASSWORD || 'Trocar@2026';
// ⚠️ O HASH SERÁ CALCULADO DENTRO DE main() PORQUE bcrypt.hash É ASSÍNCRONO
let TEMP_PASSWORD_HASH: string; // declarado aqui, atribuído dentro de main()

// ---------------------------------------------------------------------------
// BASE COMUM A QUASE TODOS (features onde o CSV diz "Sim = Acesso permitido"
// para os 9 usuários uniformemente — regras 1,3,6 do constants.ts)
// ---------------------------------------------------------------------------
const BASE_COMMON =
  P.CONFIG_SISTEMA |
  P.CADASTRO_OBRIGACOES |
  P.REGIMES_GRUPOS_OBRIG |
  P.CADASTRO_EMPRESAS |
  P.COMENTARIOS_NOTAS |
  P.GESTAO_CONTATOS |
  P.GESTAO_TAREFAS |
  P.ADICIONAR_ALTERAR |
  P.EXCLUSAO_REGISTRO |
  P.APAGAR_ANEXOS |
  P.DISPENSAR_DEMANDAS |
  P.DEMANDAS_LISTA_SOLICITACOES |
  P.ALTERAR_PRAZOS_TECH_LEGAIS |
  P.PERMISSOES_APLA |
  P.TEMPO_PREVISTO |
  P.SALARIOS_HONORARIOS |
  P.CONFIG_AREA_VIP_APP |
  P.COMUNICADOS |
  P.SOLICITACOES |
  P.FILTROS_FORCADOS |
  // Ordinais: todos os 9 têm nível máximo [4] nas duas escalas do CSV
  P.CONTROLE_USUARIOS_L4 |
  P.CADASTRO_DEPTOS_L4;

// Camadas de Gestão de Processos (regra 4 do constants.ts)
const PROC_STD = P.PROC_VISUALIZAR | P.PROC_MOVIMENTAR | P.PROC_MAPEAR_MATRIZES | P.PROC_EXCLUIR;
const PROC_PLUS_AUTH = PROC_STD | P.PROC_AUTORIZA_INICIO;
const PROC_MARCOS_FULL = PROC_PLUS_AUTH | P.PROC_ACESO_MASSA;

// ---------------------------------------------------------------------------
// LINHAS DO CSV TRADUZIDAS PARA OBJETO JS
// Cada objeto = uma linha exata do arquivo, com nome/email/id/tipo/admin/login
// e a MÁSCARA FINAL calculada combinando BASE_COMMON + exceções individuais.
// ---------------------------------------------------------------------------
interface SeedRow {
  name: string;
  email: string;
  legacyId: number;
  tipo: string;
  adminArea: boolean;
  lastLogin: string;   // formato dd/MM/yyyy HH:mm do CSV
  role: 'ADMIN' | 'MANAGER' | 'USER' | 'SUPER_ADMIN';
  perms: bigint;
}

const ROWS: SeedRow[] = [
  {
    name: 'Fernanda Lopes',
    email: 'fernanda@contacerta.com.br',
    legacyId: 142620,
    tipo: 'Contador sócio',
    adminArea: true,
    lastLogin: '07/10/2026 07:11',
    role: 'ADMIN',
    // Fernanda: base + EXPORTA_EMAILS=NÃO (já fora do BASE), + DISPENSAR_MASSA,
    // + PROC_PLUS_AUTH (tem autorização de início)
    perms: BASE_COMMON | P.DISPENSAR_DEMANDAS_MASSA | PROC_PLUS_AUTH,
  },
  {
    name: 'Juliane',
    email: 'juliane@contacerta.com.br',
    legacyId: 144642,
    tipo: 'Analista',
    adminArea: true,
    lastLogin: '06/10/2026 11:48',
    role: 'USER',
    // Juliane: base + PROC_STD (sem autorização de início)
    perms: BASE_COMMON | PROC_STD,
  },
  {
    name: 'Graziela',
    email: 'fiscal@contacerta.com.br',
    legacyId: 229047,
    tipo: 'Analista',
    adminArea: true,
    lastLogin: '06/10/2026 09:28',
    role: 'USER',
    perms: BASE_COMMON | PROC_STD,
  },
  {
    name: 'Neila',
    email: 'rh@contacerta.com.br',
    legacyId: 144643,
    tipo: 'Analista',
    adminArea: true,
    lastLogin: '05/10/2026 18:19',
    role: 'USER',
    perms: BASE_COMMON | PROC_STD,
  },
  {
    name: 'Ediane',
    email: 'ediane@contacerta.com.br',
    legacyId: 144640,
    tipo: 'Encarregado/Gerente',
    adminArea: true,
    lastLogin: '30/09/2026 10:09',
    role: 'MANAGER',
    // Ediane: ÚNICA com RELATORIOS_EXPORTAR_EMAILS (regra 1) + PROC_STD
    perms: BASE_COMMON | P.RELATORIOS_EXPORTAR_EMAILS | PROC_STD,
  },
  {
    name: 'Emilia',
    email: 'rh.contacerta@contacerta.com.br',
    legacyId: 178010,
    tipo: 'Assistente',
    adminArea: false,   // ← diferente dos demais (CSV: Administrativo=Não)
    lastLogin: '25/09/2026 09:48',
    role: 'USER',
    // Emilia: base + EXPORTA_EMAILS=Sim (diferente dos analistas comuns!)
    //         + PROC_PLUS_AUTH
    perms: BASE_COMMON | P.RELATORIOS_EXPORTAR_EMAILS | PROC_PLUS_AUTH,
  },
  {
    name: 'Geral',
    email: 'atendimento@contacerta.com.br',
    legacyId: 144644,
    tipo: 'Analista',
    adminArea: true,
    lastLogin: '11/09/2026 08:52',
    role: 'USER',
    // Geral: base (EXPORTA_EMAILS=NÃO) + PROC_PLUS_AUTH
    perms: BASE_COMMON | PROC_PLUS_AUTH,
  },
  {
    name: 'Marcos',
    email: 'marcostoledo@soluti.net.br',
    legacyId: 229049,
    tipo: 'Contador sócio',
    adminArea: true,
    lastLogin: '17/07/2026 09:45',
    role: 'SUPER_ADMIN',
    // Marcos: base (EXPORTA_EMAILS=NÃO) + PROC_MARCOS_FULL (único com AÇÕES_MASSA)
    perms: BASE_COMMON | PROC_MARCOS_FULL,
  },
  {
    name: 'Lauren',
    email: 'financeiro@contacerta.com.br',
    legacyId: 144647,
    tipo: 'Auxiliar',
    adminArea: true,
    lastLogin: '29/01/2026 11:41',
    role: 'USER',
    // Lauren: base (EXPORTA_EMAILS=NÃO) + PROC_PLUS_AUTH
    perms: BASE_COMMON | PROC_PLUS_AUTH,
  },
];

// ---------------------------------------------------------------------------
// UTILITÁRIOS
// ---------------------------------------------------------------------------
function parsePtDate(s: string): Date {
  // CSV usa dd/MM/yyyy HH:mm — JavaScript Date.parse nativo não confia nisso
  // em todos os ambientes. Fazemos split manual para garantir consistência.
  const [datePart, timePart] = s.split(' ');
  const [d, m, y] = datePart.split('/').map(Number);
  const [hh, mm] = timePart.split(':').map(Number);
  return new Date(y, m - 1, d, hh, mm, 0, 0); // mês é 0-indexed no JS
}

/** Inferência de departamento primário pelo nome/cargo (para Employee.position). */
function inferDepartment(name: string, tipo: string): string {
  const map: Record<string, string> = {
    'Fernanda Lopes': 'IRPF / MEI / Pessoa Física',
    'Juliane':        'Contábil',
    'Graziela':       'Fiscal',
    'Neila':          'Pessoal',
    'Ediane':         'Fiscal / Legalização',
    'Emilia':         'Pessoal',
    'Geral':          'Financeiro / Relacionamento',
    'Marcos':         'Diretoria',
    'Lauren':         'Financeiro',
  };
  return map[name] ?? tipo;
}

// ---------------------------------------------------------------------------
// LOOP PRINCIPAL DE UPSERT
// Ordem: User → Employee → UserPermission. Tudo transacional por usuário para
// evitar estado parcial se algo falhar no meio.
// ---------------------------------------------------------------------------
async function main() {
  console.log(`🌱 Iniciando seed de ${ROWS.length} usuários...\n`);

  // 🔍 BUSCA AUTOMÁTICA DA EMPRESA (elimina dependência do .env)
  const company = await prisma.company.findFirst({
    where: { name: 'Conta Certa Demo' } // Ou use o CNPJ se preferir
  });

  if (!company) {
    throw new Error('❌ Empresa "Conta Certa Demo" não encontrada no banco. Rode o seed principal primeiro!');
  }
  
  const COMPANY_ID = company.id;
  console.log(`✅ Empresa encontrada: ${company.name} (ID: ${COMPANY_ID})\n`);

  //  Calcula o hash UMA VEZ antes do loop
  TEMP_PASSWORD_HASH = await bcrypt.hash(TEMP_PASSWORD_PLAIN, 10);
  console.log(`✅ Hash bcrypt gerado (custo 10).\n`);

  // ... o resto do loop continua igual ...

  for (const row of ROWS) {
    await prisma.$transaction(async (tx) => {
      // 1) USER (login/auth/RBAC base)
      const user = await tx.user.upsert({
        where: { email: row.email },
        update: {
          // Atualiza metadados não-sensiveis em rerodagem
          name: row.name,
          role: row.role,
          isAdminArea: row.adminArea,
          lastLoginAt: parsePtDate(row.lastLogin),
          legacyId: row.legacyId,
        },
        create: {
          name: row.name,
          email: row.email,
          password: TEMP_PASSWORD_HASH,
          role: row.role,
          mustChangePassword: true,   // força troca no 1º login real
          companyId: COMPANY_ID!,
          isAdminArea: row.adminArea,
          lastLoginAt: parsePtDate(row.lastLogin),
          legacyId: row.legacyId,
        },
      });

      // 2) EMPLOYEE (perfil RH espelhado — vinculado ao User acima)
      // OPÇÃO A: findFirst + create/update manual porque Employee.userId NÃO é único.
      // Isso permite múltiplos registros históricos de colaborador por usuário
      // (ex.: demissão/recontratação futuras). Buscamos o ATIVO mais recente;
      // se existir, atualizamos; senão criamos novo.
      const existingEmp = await tx.employee.findFirst({
        where: { 
          userId: user.id, 
          companyId: COMPANY_ID!,
          status: 'ACTIVE'   // pega apenas o registro ativo corrente
        },
        orderBy: { createdAt: 'desc' }, // segurança extra caso haja mais de um ACTIVE
      });

      if (existingEmp) {
        // Já existe colaborador ativo → atualiza metadados não-sensiveis
        await tx.employee.update({
          where: { id: existingEmp.id },
          data: {
            name: row.name,
            position: row.tipo,
            department: inferDepartment(row.name, row.tipo),
            contractType: row.tipo.includes('sócio') ? 'SOCIO' : 'CLT',
            isCritical: row.tipo === 'Contador sócio',
            // ⚠️ NÃO mexemos em admissionDate/dismissalDate/salary/status
            //       para preservar histórico e evitar sobrescrita acidental
          },
        });
      } else {
        // Não há colaborador ativo → cria registro inicial
        await tx.employee.create({
          data: {
            userId: user.id,
            companyId: COMPANY_ID!,
            name: row.name,
            email: row.email,           // aproveita e-mail do User como contato RH
            position: row.tipo,
            department: inferDepartment(row.name, row.tipo),
            admissionDate: parsePtDate(row.lastLogin), // aproximação razoável p/ seed inicial
            status: 'ACTIVE',
            contractType: row.tipo.includes('sócio') ? 'SOCIO' : 'CLT',
            isCritical: row.tipo === 'Contador sócio',
          },
        });
      }

      // 3) USER_PERMISSION (máscara de bits do CSV)
      await tx.userPermission.upsert({
        where: { userId: user.id },
        update: { permissions: row.perms },
        create: {
          companyId: COMPANY_ID!,
          userId: user.id,
          permissions: row.perms,
        },
      });

      console.log(`✅ ${row.name.padEnd(16)} (${row.role}) — máscara 0x${row.perms.toString(16)}`);
    });
  }

  console.log('\n🎉 Seed concluído. Total:', ROWS.length, 'usuários.');
  console.log('⚠️  Todas as contas estão com senha temporária "' + TEMP_PASSWORD_PLAIN + '"');
  console.log('   e mustChangePassword=true. Troque em produção imediatamente.');
}

main()
  .catch((e) => { console.error('💥 Erro no seed:', e); process.exit(1); })
  .finally(() => prisma.$disconnect());