import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// =================================================================
//  DADOS REALISTAS BRASILEIROS
// =================================================================

const NOMES_FEMININOS = [
  'Ana Silva', 'Beatriz Santos', 'Carla Oliveira', 'Daniela Souza', 'Elena Costa',
  'Fernanda Lima', 'Gabriela Pereira', 'Helena Rodrigues', 'Isabela Almeida', 'Juliana Ferreira',
  'Karina Barbosa', 'Larissa Cardoso', 'Mariana Ribeiro', 'Natália Gomes', 'Patrícia Martins',
  'Rafaela Araújo', 'Sabrina Correia', 'Tatiana Dias', 'Vanessa Monteiro', 'Camila Nascimento'
];

const NOMES_MASCULINOS = [
  'João Silva', 'Pedro Santos', 'Lucas Oliveira', 'Gabriel Souza', 'Matheus Costa',
  'Rafael Lima', 'Felipe Pereira', 'Gustavo Rodrigues', 'Bruno Almeida', 'Rodrigo Ferreira',
  'Thiago Barbosa', 'Diego Cardoso', 'Leonardo Ribeiro', 'Marcos Gomes', 'Paulo Martins',
  'André Araújo', 'Ricardo Correia', 'Eduardo Dias', 'Fernando Monteiro', 'Carlos Nascimento'
];

const CARGOS = [
  'Analista Contábil Júnior', 'Analista Contábil Pleno', 'Analista Contábil Sênior',
  'Analista Fiscal', 'Analista de DP', 'Assistente Contábil', 'Assistente Administrativo',
  'Estagiário de Contabilidade', 'Estagiário de Direito', 'Coordenador Contábil',
  'Gerente de Contabilidade', 'Diretor Financeiro', 'Recepcionista', 'Auxiliar de Escritório'
];

const DEPARTAMENTOS = ['Contábil', 'Fiscal', 'DP', 'Societário', 'Administrativo', 'Financeiro'];

const EMPRESAS_CLIENTES = [
  { name: 'Tech Solutions Ltda', cnpj: '12.345.678/0001-90', serviceType: 'CONTABIL', monthlyFee: 2500 },
  { name: 'Comércio Rápido ME', cnpj: '23.456.789/0001-01', serviceType: 'CONTABIL', monthlyFee: 1800 },
  { name: 'Indústria Forte S.A.', cnpj: '34.567.890/0001-12', serviceType: 'CONTABIL', monthlyFee: 4500 },
  { name: 'Consultoria Alpha', cnpj: '45.678.901/0001-23', serviceType: 'CONSULTORIA', monthlyFee: 3200 },
  { name: 'Restaurante Sabor & Cia', cnpj: '56.789.012/0001-34', serviceType: 'CONTABIL', monthlyFee: 1500 },
  { name: 'Clínica Saúde Total', cnpj: '67.890.123/0001-45', serviceType: 'CONTABIL', monthlyFee: 2800 },
  { name: 'Advocacia Moderna', cnpj: '78.901.234/0001-56', serviceType: 'CONTABIL', monthlyFee: 2200 },
  { name: 'Escola Futuro Brilhante', cnpj: '89.012.345/0001-67', serviceType: 'CONTABIL', monthlyFee: 3500 },
  { name: 'Transportadora Veloz', cnpj: '90.123.456/0001-78', serviceType: 'CONTABIL', monthlyFee: 3800 },
  { name: 'Imobiliária Casa Nova', cnpj: '01.234.567/0001-89', serviceType: 'CONTABIL', monthlyFee: 2900 }
];

const SERVICOS_PRESTADOS = [
  'Contabilidade Mensal', 'Folha de Pagamento', 'Declaração de Imposto de Renda',
  'Planejamento Tributário', 'Abertura de Empresa', 'Alteração Contratual',
  'Consultoria Fiscal', 'BPO Financeiro', 'Gestão de RH', 'Auditoria Contábil'
];

const CATEGORIAS_RECEITA = ['HONORÁRIOS', 'CONSULTORIA', 'SERVIÇOS_EXTRA'];
const CATEGORIAS_DESPESA = ['FOLHA', 'ALUGUEL', 'SOFTWARE', 'IMPOSTOS', 'MATERIAIS', 'MARKETING', 'UTILIDADES'];

// =================================================================
// 🚀 SCRIPT PRINCIPAL
// =================================================================

async function main() {
  console.log('🌱 Iniciando seed massivo...\n');

  const companyId = '00000000-0000-0000-0000-000000000001';
  const adminUserId = '45d188bb-023f-4aa0-8407-4f0e1f83f8f4'; // Seu ID de admin

  // 1. Criar 10 empresas clientes
  console.log('🏢 Criando empresas clientes...');
  const clientes = [];
  for (const emp of EMPRESAS_CLIENTES) {
    const cliente = await prisma.client.create({
      data: {
        companyId,
        userId: adminUserId,
        companyName: emp.name,
        cnpj: emp.cnpj,
        serviceType: emp.serviceType,
        monthlyFee: emp.monthlyFee,
        status: 'ATIVO',
        startDate: new Date('2025-01-15'),
        contactName: 'Contato ' + emp.name.split(' ')[0],
        contactEmail: 'contato@' + emp.name.toLowerCase().replace(/\s+/g, '').replace(/[&.]/g, '') + '.com.br',
        contactPhone: '(11) 9' + Math.floor(10000000 + Math.random() * 90000000),
      },
    });
    clientes.push(cliente);
  }
  console.log(`✅ ${clientes.length} empresas criadas\n`);

  // 2. Criar 5-10 colaboradores para cada empresa (total ~80)
  console.log('👥 Criando colaboradores...');
  let totalEmployees = 0;
  for (const cliente of clientes) {
    const numEmployees = 5 + Math.floor(Math.random() * 6); // 5 a 10
    for (let i = 0; i < numEmployees; i++) {
      const isFemale = Math.random() > 0.5;
      const nome = isFemale 
        ? NOMES_FEMININOS[Math.floor(Math.random() * NOMES_FEMININOS.length)]
        : NOMES_MASCULINOS[Math.floor(Math.random() * NOMES_MASCULINOS.length)];
      
      const cargo = CARGOS[Math.floor(Math.random() * CARGOS.length)];
      const depto = DEPARTAMENTOS[Math.floor(Math.random() * DEPARTAMENTOS.length)];
      const salario = 1500 + Math.random() * 8000;
      const anoAdmissao = 2020 + Math.floor(Math.random() * 6);
      const mesAdmissao = 1 + Math.floor(Math.random() * 12);
      
      await prisma.employee.create({
        data: {
          companyId,
          userId: adminUserId,
          name: nome,
          email: nome.toLowerCase().replace(/\s+/g, '.') + '@' + cliente.companyName.toLowerCase().replace(/\s+/g, '').replace(/[&.]/g, '') + '.com.br',
          phone: '(11) 9' + Math.floor(10000000 + Math.random() * 90000000),
          position: cargo,
          department: depto,
          salary: Math.round(salario * 100) / 100,
          status: Math.random() > 0.1 ? 'ACTIVE' : 'INACTIVE', // 90% ativos
          admissionDate: new Date(`${anoAdmissao}-${String(mesAdmissao).padStart(2, '0')}-15`),
        },
      });
      totalEmployees++;
    }
  }
  console.log(`✅ ${totalEmployees} colaboradores criados\n`);

  // 3. Criar transações financeiras (6 meses de histórico)
  console.log('💰 Criando transações financeiras...');
  let totalTransactions = 0;
  const meses = 6;
  const hoje = new Date();
  
  for (let m = 0; m < meses; m++) {
    const dataMes = new Date(hoje.getFullYear(), hoje.getMonth() - m, 1);
    
    // Receitas (honorários dos clientes)
    for (const cliente of clientes) {
      await prisma.financialTransaction.create({
        data: {
          companyId,
          userId: adminUserId,
          clientId: cliente.id,
          type: 'RECEITA',
          category: 'HONORÁRIOS',
          description: `Honorários ${cliente.companyName} - ${dataMes.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}`,
          amount: cliente.monthlyFee,
          date: dataMes,
        },
      });
      totalTransactions++;
    }

    // Despesas variadas
    const numDespesas = 8 + Math.floor(Math.random() * 5);
    for (let d = 0; d < numDespesas; d++) {
      const categoria = CATEGORIAS_DESPESA[Math.floor(Math.random() * CATEGORIAS_DESPESA.length)];
      const valor = categoria === 'FOLHA' ? 15000 + Math.random() * 20000 :
                    categoria === 'ALUGUEL' ? 3000 + Math.random() * 2000 :
                    categoria === 'SOFTWARE' ? 500 + Math.random() * 1500 :
                    categoria === 'IMPOSTOS' ? 2000 + Math.random() * 5000 :
                    200 + Math.random() * 1000;
      
      await prisma.financialTransaction.create({
        data: {
          companyId,
          userId: adminUserId,
          type: 'DESPESA',
          category: categoria,
          description: `${categoria} - ${dataMes.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}`,
          amount: Math.round(valor * 100) / 100,
          date: dataMes,
        },
      });
      totalTransactions++;
    }
  }
  console.log(`✅ ${totalTransactions} transações financeiras criadas\n`);

  // 4. Criar dados de Turnover (3 meses)
  console.log('📊 Criando dados de Turnover...');
  for (let m = 0; m < 3; m++) {
    const mes = hoje.getMonth() - m + 1;
    const ano = hoje.getFullYear() + (mes <= 0 ? -1 : 0);
    const mesAjustado = mes <= 0 ? mes + 12 : mes;
    
    await prisma.turnoverMonthly.create({
      data: {
        companyId,
        userId: adminUserId,
        year: ano,
        month: mesAjustado,
        cltInitial: 60 + Math.floor(Math.random() * 20),
        cltAdmissions: Math.floor(Math.random() * 5),
        cltDismissals: Math.floor(Math.random() * 3),
        internInitial: Math.floor(Math.random() * 5),
        internAdmissions: Math.floor(Math.random() * 2),
        internDismissals: Math.floor(Math.random() * 2),
      },
    });
  }
  console.log(`✅ Dados de Turnover criados\n`);

  // 5. Criar setores padrão
  console.log('🏢 Criando setores...');
  const setores = ['DP', 'Fiscal', 'Contábil', 'Societário', 'Administrativo'];
  for (let i = 0; i < setores.length; i++) {
    await prisma.sector.create({
      data: {
        companyId,
        userId: adminUserId,
        name: setores[i],
        mandatory: i < 4, // Primeiros 4 são obrigatórios
        order: i,
      },
    });
  }
  console.log(`✅ ${setores.length} setores criados\n`);

  // 6. Criar motivos de desligamento
  console.log(' Criando motivos de desligamento...');
  const motivos = [
    'Melhor Oportunidade', 'Motivos Pessoais', 'Salário Não Competitivo',
    'Problemas com Gestor', 'Mudança de Cidade/País', 'Falta de Desenvolvimento',
    'Ambiente de Trabalho', 'Desligamento por Justa Causa'
  ];
  for (const motivo of motivos) {
    await prisma.dismissalReason.create({
      data: {
        companyId,
        userId: adminUserId,
        name: motivo,
      },
    });
  }
  console.log(`✅ ${motivos.length} motivos criados\n`);

  console.log('🎉 SEED MASSIVO CONCLUÍDO!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`📊 Resumo:`);
  console.log(`   • 10 empresas clientes`);
  console.log(`   • ${totalEmployees} colaboradores`);
  console.log(`   • ${totalTransactions} transações financeiras`);
  console.log(`   • 3 meses de dados de Turnover`);
  console.log(`   • 5 setores e 8 motivos de desligamento`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

main()
  .catch((e) => {
    console.error('❌ Erro no seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });