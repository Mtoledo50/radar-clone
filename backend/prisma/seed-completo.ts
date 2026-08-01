import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// =================================================================
//  EMPRESAS (CLIENTES DO ESCRITÓRIO)
// =================================================================
const empresas = [
  {
    companyName: 'Tech Solutions Ltda',
    cnpj: '12.345.678/0001-90',
    serviceType: 'CONTABIL',
    monthlyFee: 2500,
    contactName: 'João Silva',
    contactEmail: 'joao@techsolutions.com',
    contactPhone: '(11) 98765-4321',
    observations: 'Empresa de tecnologia, faturamento médio R$ 150k/mês',
  },
  {
    companyName: 'Comércio Popular ME',
    cnpj: '23.456.789/0001-01',
    serviceType: 'CONTABIL',
    monthlyFee: 1200,
    contactName: 'Maria Santos',
    contactEmail: 'maria@comerciopopular.com',
    contactPhone: '(21) 97654-3210',
    observations: 'Varejo de roupas, 3 lojas físicas',
  },
  {
    companyName: 'Consultoria Estratégica S/S',
    cnpj: '34.567.890/0001-12',
    serviceType: 'CONTABIL',
    monthlyFee: 3500,
    contactName: 'Carlos Oliveira',
    contactEmail: 'carlos@estrategica.com',
    contactPhone: '(31) 96543-2109',
    observations: 'Consultoria empresarial, 15 funcionários',
  },
  {
    companyName: 'Restaurante Sabor & Cia',
    cnpj: '45.678.901/0001-23',
    serviceType: 'CONTABIL',
    monthlyFee: 1800,
    contactName: 'Ana Costa',
    contactEmail: 'ana@saborecia.com',
    contactPhone: '(41) 95432-1098',
    observations: 'Restaurante self-service, alto volume de transações',
  },
  {
    companyName: 'Clínica Médica Vida Plena',
    cnpj: '56.789.012/0001-34',
    serviceType: 'CONTABIL',
    monthlyFee: 4200,
    contactName: 'Dr. Roberto Lima',
    contactEmail: 'roberto@vidaplena.com',
    contactPhone: '(51) 94321-0987',
    observations: 'Clínica com 8 médicos e 12 funcionários administrativos',
  },
  {
    companyName: 'Transportadora Rápido Express',
    cnpj: '67.890.123/0001-45',
    serviceType: 'CONTABIL',
    monthlyFee: 2800,
    contactName: 'Fernando Souza',
    contactEmail: 'fernando@rapidoexpress.com',
    contactPhone: '(61) 93210-9876',
    observations: 'Frota de 12 veículos, logística regional',
  },
  {
    companyName: 'Escola Futuro Brilhante',
    cnpj: '78.901.234/0001-56',
    serviceType: 'CONTABIL',
    monthlyFee: 3200,
    contactName: 'Patrícia Mendes',
    contactEmail: 'patricia@futurobrilhante.com',
    contactPhone: '(71) 92109-8765',
    observations: 'Escola particular, 450 alunos, 35 funcionários',
  },
  {
    companyName: 'Imobiliária Casa Nova',
    cnpj: '89.012.345/0001-67',
    serviceType: 'CONTABIL',
    monthlyFee: 2200,
    contactName: 'Ricardo Alves',
    contactEmail: 'ricardo@casanova.com',
    contactPhone: '(81) 91098-7654',
    observations: 'Imobiliária com 8 corretores',
  },
];

// =================================================================
// 👷 COLABORADORES POR EMPRESA
// =================================================================
const colaboradoresPorEmpresa: Record<string, Array<{
  name: string;
  email: string;
  phone: string;
  position: string;
  department: string;
  salary: number;
  admissionDate: string;
}>> = {
  'Tech Solutions Ltda': [
    { name: 'Lucas Pereira', email: 'lucas@techsolutions.com', phone: '(11) 99999-1111', position: 'Desenvolvedor Senior', department: 'TI', salary: 8500, admissionDate: '2023-03-15' },
    { name: 'Camila Rodrigues', email: 'camila@techsolutions.com', phone: '(11) 99999-1112', position: 'Product Manager', department: 'Produto', salary: 9200, admissionDate: '2022-08-20' },
    { name: 'Rafael Costa', email: 'rafael@techsolutions.com', phone: '(11) 99999-1113', position: 'Designer UX', department: 'Design', salary: 6800, admissionDate: '2024-01-10' },
    { name: 'Juliana Martins', email: 'juliana@techsolutions.com', phone: '(11) 99999-1114', position: 'Analista de Marketing', department: 'Marketing', salary: 5500, admissionDate: '2023-11-05' },
    { name: 'Bruno Silva', email: 'bruno@techsolutions.com', phone: '(11) 99999-1115', position: 'DevOps Engineer', department: 'TI', salary: 9800, admissionDate: '2022-05-18' },
    { name: 'Amanda Oliveira', email: 'amanda@techsolutions.com', phone: '(11) 99999-1116', position: 'Scrum Master', department: 'Produto', salary: 7200, admissionDate: '2023-07-22' },
    { name: 'Thiago Santos', email: 'thiago@techsolutions.com', phone: '(11) 99999-1117', position: 'QA Engineer', department: 'TI', salary: 6200, admissionDate: '2024-02-14' },
  ],
  'Comércio Popular ME': [
    { name: 'Fernanda Lima', email: 'fernanda@comerciopopular.com', phone: '(21) 98888-2222', position: 'Gerente de Loja', department: 'Operações', salary: 4500, admissionDate: '2022-01-15' },
    { name: 'Marcos Paulo', email: 'marcos@comerciopopular.com', phone: '(21) 98888-2223', position: 'Vendedor', department: 'Vendas', salary: 2800, admissionDate: '2023-04-10' },
    { name: 'Carla Souza', email: 'carla@comerciopopular.com', phone: '(21) 98888-2224', position: 'Caixa', department: 'Operações', salary: 2400, admissionDate: '2023-09-20' },
    { name: 'Roberto Dias', email: 'roberto@comerciopopular.com', phone: '(21) 98888-2225', position: 'Estoquista', department: 'Logística', salary: 2600, admissionDate: '2022-11-08' },
    { name: 'Patricia Gomes', email: 'patricia@comerciopopular.com', phone: '(21) 98888-2226', position: 'Vendedora', department: 'Vendas', salary: 2800, admissionDate: '2024-03-01' },
  ],
  'Consultoria Estratégica S/S': [
    { name: 'Eduardo Mendes', email: 'eduardo@estrategica.com', phone: '(31) 97777-3333', position: 'Consultor Senior', department: 'Consultoria', salary: 12000, admissionDate: '2021-06-15' },
    { name: 'Isabela Ferreira', email: 'isabela@estrategica.com', phone: '(31) 97777-3334', position: 'Consultora Plena', department: 'Consultoria', salary: 8500, admissionDate: '2022-09-20' },
    { name: 'Gustavo Rocha', email: 'gustavo@estrategica.com', phone: '(31) 97777-3335', position: 'Analista de Dados', department: 'BI', salary: 7200, admissionDate: '2023-02-10' },
    { name: 'Larissa Cardoso', email: 'larissa@estrategica.com', phone: '(31) 97777-3336', position: 'Consultora Junior', department: 'Consultoria', salary: 5500, admissionDate: '2024-01-15' },
    { name: 'Felipe Araújo', email: 'felipe@estrategica.com', phone: '(31) 97777-3337', position: 'Gerente de Projetos', department: 'Gestão', salary: 10500, admissionDate: '2022-03-25' },
    { name: 'Mariana Barbosa', email: 'mariana@estrategica.com', phone: '(31) 97777-3338', position: 'Assistente Administrativo', department: 'Admin', salary: 3800, admissionDate: '2023-08-12' },
  ],
  'Restaurante Sabor & Cia': [
    { name: 'Antônio Ribeiro', email: 'antonio@saborecia.com', phone: '(41) 96666-4444', position: 'Chef de Cozinha', department: 'Cozinha', salary: 6500, admissionDate: '2021-03-10' },
    { name: 'Beatriz Nunes', email: 'beatriz@saborecia.com', phone: '(41) 96666-4445', position: 'Gerente', department: 'Gestão', salary: 5800, admissionDate: '2022-07-15' },
    { name: 'Carlos Eduardo', email: 'carlos.e@saborecia.com', phone: '(41) 96666-4446', position: 'Cozinheiro', department: 'Cozinha', salary: 3200, admissionDate: '2023-01-20' },
    { name: 'Daniela Freitas', email: 'daniela@saborecia.com', phone: '(41) 96666-4447', position: 'Atendente', department: 'Salão', salary: 2400, admissionDate: '2023-11-05' },
    { name: 'Eduardo Lima', email: 'eduardo.l@saborecia.com', phone: '(41) 96666-4448', position: 'Caixa', department: 'Financeiro', salary: 2600, admissionDate: '2024-02-01' },
    { name: 'Fabiana Costa', email: 'fabiana@saborecia.com', phone: '(41) 96666-4449', position: 'Auxiliar de Cozinha', department: 'Cozinha', salary: 2200, admissionDate: '2023-06-18' },
  ],
  'Clínica Médica Vida Plena': [
    { name: 'Dr. Paulo Henrique', email: 'paulo@vidaplena.com', phone: '(51) 95555-5555', position: 'Médico Cardiologista', department: 'Médico', salary: 18000, admissionDate: '2020-01-15' },
    { name: 'Dra. Renata Souza', email: 'renata@vidaplena.com', phone: '(51) 95555-5556', position: 'Médica Dermatologista', department: 'Médico', salary: 16500, admissionDate: '2021-04-20' },
    { name: 'Luciana Martins', email: 'luciana@vidaplena.com', phone: '(51) 95555-5557', position: 'Recepcionista', department: 'Atendimento', salary: 3200, admissionDate: '2022-08-10' },
    { name: 'Marcos Vinícius', email: 'marcos.v@vidaplena.com', phone: '(51) 95555-5558', position: 'Enfermeiro', department: 'Saúde', salary: 5800, admissionDate: '2021-11-25' },
    { name: 'Tatiane Oliveira', email: 'tatiane@vidaplena.com', phone: '(51) 95555-5559', position: 'Auxiliar Administrativo', department: 'Admin', salary: 3500, admissionDate: '2023-03-15' },
    { name: 'Rodrigo Alves', email: 'rodrigo@vidaplena.com', phone: '(51) 95555-5560', position: 'Técnico de Enfermagem', department: 'Saúde', salary: 4200, admissionDate: '2022-06-08' },
    { name: 'Juliana Pereira', email: 'juliana.p@vidaplena.com', phone: '(51) 95555-5561', position: 'Gerente Administrativa', department: 'Gestão', salary: 7500, admissionDate: '2020-09-12' },
    { name: 'Fernando Costa', email: 'fernando.c@vidaplena.com', phone: '(51) 95555-5562', position: 'Médico Ortopedista', department: 'Médico', salary: 17000, admissionDate: '2021-02-28' },
  ],
  'Transportadora Rápido Express': [
    { name: 'José Carlos', email: 'jose@rapidoexpress.com', phone: '(61) 94444-6666', position: 'Motorista', department: 'Operações', salary: 4500, admissionDate: '2022-01-10' },
    { name: 'Maria Helena', email: 'maria.h@rapidoexpress.com', phone: '(61) 94444-6667', position: 'Gerente Logística', department: 'Gestão', salary: 8200, admissionDate: '2021-05-15' },
    { name: 'Pedro Santos', email: 'pedro@rapidoexpress.com', phone: '(61) 94444-6668', position: 'Motorista', department: 'Operações', salary: 4500, admissionDate: '2023-02-20' },
    { name: 'Ana Paula', email: 'ana.p@rapidoexpress.com', phone: '(61) 94444-6669', position: 'Auxiliar Administrativo', department: 'Admin', salary: 3200, admissionDate: '2023-07-12' },
    { name: 'Ricardo Mendes', email: 'ricardo.m@rapidoexpress.com', phone: '(61) 94444-6670', position: 'Motorista', department: 'Operações', salary: 4800, admissionDate: '2022-09-05' },
    { name: 'Cristina Lima', email: 'cristina@rapidoexpress.com', phone: '(61) 94444-6671', position: 'Tesoureira', department: 'Financeiro', salary: 3800, admissionDate: '2022-11-18' },
  ],
  'Escola Futuro Brilhante': [
    { name: 'Prof. Alexandre', email: 'alexandre@futurobrilhante.com', phone: '(71) 93333-7777', position: 'Professor Matemática', department: 'Pedagógico', salary: 5500, admissionDate: '2020-02-15' },
    { name: 'Prof. Sandra', email: 'sandra@futurobrilhante.com', phone: '(71) 93333-7778', position: 'Professora Português', department: 'Pedagógico', salary: 5200, admissionDate: '2021-02-10' },
    { name: 'Marta Silva', email: 'marta@futurobrilhante.com', phone: '(71) 93333-7779', position: 'Coordenadora Pedagógica', department: 'Gestão', salary: 7800, admissionDate: '2019-08-20' },
    { name: 'João Pedro', email: 'joao.p@futurobrilhante.com', phone: '(71) 93333-7780', position: 'Professor Educação Física', department: 'Pedagógico', salary: 4800, admissionDate: '2022-02-15' },
    { name: 'Luciana Rocha', email: 'luciana.r@futurobrilhante.com', phone: '(71) 93333-7781', position: 'Secretária', department: 'Admin', salary: 3500, admissionDate: '2021-07-10' },
    { name: 'Carlos Alberto', email: 'carlos.a@futurobrilhante.com', phone: '(71) 93333-7782', position: 'Professor Ciências', department: 'Pedagógico', salary: 5100, admissionDate: '2023-02-01' },
    { name: 'Patricia Souza', email: 'patricia.s@futurobrilhante.com', phone: '(71) 93333-7783', position: 'Auxiliar de Biblioteca', department: 'Pedagógico', salary: 2800, admissionDate: '2022-08-15' },
    { name: 'Roberto Dias', email: 'roberto.d@futurobrilhante.com', phone: '(71) 93333-7784', position: 'Diretor', department: 'Gestão', salary: 12000, admissionDate: '2018-01-10' },
  ],
  'Imobiliária Casa Nova': [
    { name: 'Paulo Ricardo', email: 'paulo.r@casanova.com', phone: '(81) 92222-8888', position: 'Corretor Senior', department: 'Vendas', salary: 6500, admissionDate: '2021-03-15' },
    { name: 'Mariana Costa', email: 'mariana.c@casanova.com', phone: '(81) 92222-8889', position: 'Corretora', department: 'Vendas', salary: 4200, admissionDate: '2022-06-20' },
    { name: 'Felipe Oliveira', email: 'felipe.o@casanova.com', phone: '(81) 92222-8890', position: 'Corretor', department: 'Vendas', salary: 4000, admissionDate: '2023-01-10' },
    { name: 'Amanda Santos', email: 'amanda.s@casanova.com', phone: '(81) 92222-8891', position: 'Assistente Administrativo', department: 'Admin', salary: 3200, admissionDate: '2022-09-15' },
    { name: 'Gustavo Pereira', email: 'gustavo.p@casanova.com', phone: '(81) 92222-8892', position: 'Gerente de Vendas', department: 'Gestão', salary: 8500, admissionDate: '2020-11-20' },
  ],
};

// =================================================================
// 💸 TRANSAÇÕES FINANCEIRAS (Receitas e Despesas)
// =================================================================
const transacoesPorEmpresa: Record<string, Array<{
  type: 'RECEITA' | 'DESPESA';
  category: string;
  description: string;
  amount: number;
  date: string;
}>> = {
  'Tech Solutions Ltda': [
    { type: 'RECEITA', category: 'HONORÁRIOS', description: 'Mensalidade Contábil - Janeiro', amount: 2500, date: '2026-01-05' },
    { type: 'RECEITA', category: 'HONORÁRIOS', description: 'Mensalidade Contábil - Fevereiro', amount: 2500, date: '2026-02-05' },
    { type: 'RECEITA', category: 'HONORÁRIOS', description: 'Mensalidade Contábil - Março', amount: 2500, date: '2026-03-05' },
    { type: 'DESPESA', category: 'SOFTWARE', description: 'Licença Software Contábil', amount: 450, date: '2026-01-10' },
    { type: 'DESPESA', category: 'FOLHA', description: 'Salário Analista Contábil', amount: 4200, date: '2026-01-05' },
  ],
  'Comércio Popular ME': [
    { type: 'RECEITA', category: 'HONORÁRIOS', description: 'Mensalidade Contábil - Janeiro', amount: 1200, date: '2026-01-05' },
    { type: 'RECEITA', category: 'HONORÁRIOS', description: 'Mensalidade Contábil - Fevereiro', amount: 1200, date: '2026-02-05' },
    { type: 'DESPESA', category: 'FOLHA', description: 'Salário Auxiliar Contábil', amount: 2800, date: '2026-01-05' },
  ],
  'Consultoria Estratégica S/S': [
    { type: 'RECEITA', category: 'HONORÁRIOS', description: 'Mensalidade Contábil - Janeiro', amount: 3500, date: '2026-01-05' },
    { type: 'RECEITA', category: 'HONORÁRIOS', description: 'Mensalidade Contábil - Fevereiro', amount: 3500, date: '2026-02-05' },
    { type: 'RECEITA', category: 'HONORÁRIOS', description: 'Mensalidade Contábil - Março', amount: 3500, date: '2026-03-05' },
    { type: 'DESPESA', category: 'FOLHA', description: 'Salário Contador Senior', amount: 6500, date: '2026-01-05' },
    { type: 'DESPESA', category: 'ALUGUEL', description: 'Aluguel Sala Comercial', amount: 2200, date: '2026-01-10' },
  ],
  'Restaurante Sabor & Cia': [
    { type: 'RECEITA', category: 'HONORÁRIOS', description: 'Mensalidade Contábil - Janeiro', amount: 1800, date: '2026-01-05' },
    { type: 'RECEITA', category: 'HONORÁRIOS', description: 'Mensalidade Contábil - Fevereiro', amount: 1800, date: '2026-02-05' },
    { type: 'DESPESA', category: 'FOLHA', description: 'Salário Contador', amount: 4200, date: '2026-01-05' },
  ],
  'Clínica Médica Vida Plena': [
    { type: 'RECEITA', category: 'HONORÁRIOS', description: 'Mensalidade Contábil - Janeiro', amount: 4200, date: '2026-01-05' },
    { type: 'RECEITA', category: 'HONORÁRIOS', description: 'Mensalidade Contábil - Fevereiro', amount: 4200, date: '2026-02-05' },
    { type: 'RECEITA', category: 'HONORÁRIOS', description: 'Mensalidade Contábil - Março', amount: 4200, date: '2026-03-05' },
    { type: 'DESPESA', category: 'FOLHA', description: 'Salário Contador Senior', amount: 6500, date: '2026-01-05' },
    { type: 'DESPESA', category: 'SOFTWARE', description: 'Sistema de Gestão Clínica', amount: 890, date: '2026-01-15' },
  ],
  'Transportadora Rápido Express': [
    { type: 'RECEITA', category: 'HONORÁRIOS', description: 'Mensalidade Contábil - Janeiro', amount: 2800, date: '2026-01-05' },
    { type: 'RECEITA', category: 'HONORÁRIOS', description: 'Mensalidade Contábil - Fevereiro', amount: 2800, date: '2026-02-05' },
    { type: 'DESPESA', category: 'FOLHA', description: 'Salário Contador', amount: 4500, date: '2026-01-05' },
    { type: 'DESPESA', category: 'IMPOSTOS', description: 'DARF Mensal', amount: 1200, date: '2026-01-20' },
  ],
  'Escola Futuro Brilhante': [
    { type: 'RECEITA', category: 'HONORÁRIOS', description: 'Mensalidade Contábil - Janeiro', amount: 3200, date: '2026-01-05' },
    { type: 'RECEITA', category: 'HONORÁRIOS', description: 'Mensalidade Contábil - Fevereiro', amount: 3200, date: '2026-02-05' },
    { type: 'RECEITA', category: 'HONORÁRIOS', description: 'Mensalidade Contábil - Março', amount: 3200, date: '2026-03-05' },
    { type: 'DESPESA', category: 'FOLHA', description: 'Salário Contador Senior', amount: 6500, date: '2026-01-05' },
    { type: 'DESPESA', category: 'ALUGUEL', description: 'Aluguel Escritório', amount: 1800, date: '2026-01-10' },
  ],
  'Imobiliária Casa Nova': [
    { type: 'RECEITA', category: 'HONORÁRIOS', description: 'Mensalidade Contábil - Janeiro', amount: 2200, date: '2026-01-05' },
    { type: 'RECEITA', category: 'HONORÁRIOS', description: 'Mensalidade Contábil - Fevereiro', amount: 2200, date: '2026-02-05' },
    { type: 'DESPESA', category: 'FOLHA', description: 'Salário Contador', amount: 4200, date: '2026-01-05' },
  ],
};

// =================================================================
//  EXECUÇÃO DO SEED
// =================================================================
async function main() {
  console.log('🌱 Iniciando seed completo com dados realistas...\n');

  const companyId = '00000000-0000-0000-0000-000000000001';
  const userId = '45d188bb-023f-4aa0-8407-4f0e1f83f8f4'; // ID do usuário admin

  // 1. Criar Empresas (Clientes)
  console.log('📊 Criando empresas clientes...');
  const empresasCriadas: Record<string, string> = {};
  
  for (const empresa of empresas) {
    const created = await prisma.client.create({
      data: {
        ...empresa,
        companyId,
        userId,
        startDate: new Date('2023-01-01'),
      },
    });
    empresasCriadas[empresa.companyName] = created.id;
    console.log(`  ✅ ${empresa.companyName}`);
  }

  // 2. Criar Colaboradores para cada empresa
  console.log('\n Criando colaboradores...');
  let totalColaboradores = 0;
  
  for (const [empresaNome, colaboradores] of Object.entries(colaboradoresPorEmpresa)) {
    const clientId = empresasCriadas[empresaNome];
    
    for (const colab of colaboradores) {
      await prisma.employee.create({
        data: {
          ...colab,
          companyId,
          userId,
          admissionDate: new Date(colab.admissionDate),
          status: 'ACTIVE',
        },
      });
      totalColaboradores++;
    }
    console.log(`  ✅ ${empresaNome}: ${colaboradores.length} colaboradores`);
  }

  // 3. Criar Transações Financeiras
  console.log('\n💸 Criando transações financeiras...');
  let totalTransacoes = 0;
  
  for (const [empresaNome, transacoes] of Object.entries(transacoesPorEmpresa)) {
    const clientId = empresasCriadas[empresaNome];
    
    for (const trans of transacoes) {
      await prisma.financialTransaction.create({
        data: {
          ...trans,
          companyId,
          userId,
          clientId,
          amount: trans.amount,
          date: new Date(trans.date),
        },
      });
      totalTransacoes++;
    }
    console.log(`  ✅ ${empresaNome}: ${transacoes.length} transações`);
  }

  console.log('\n✅ SEED COMPLETO FINALIZADO!');
  console.log(`📊 Total de empresas criadas: ${empresas.length}`);
  console.log(`👷 Total de colaboradores criados: ${totalColaboradores}`);
  console.log(`💸 Total de transações criadas: ${totalTransacoes}`);
}

main()
  .catch((e) => {
    console.error('❌ Erro ao executar seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });