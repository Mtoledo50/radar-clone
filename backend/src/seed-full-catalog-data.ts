/**
 * =================================================================
 * 📦 DADOS DO CATÁLOGO COMPLETO DE SERVIÇOS CONTÁBEIS
 * =================================================================
 * 17 departamentos e ~200 serviços pré-configurados para escritórios
 * contábeis modernos. Reutilizado pelo seed e pelo endpoint de
 * importação via API.
 * 
 * 💡 TIPAGEM: A interface CatalogItem garante segurança de tipos
 * e evita erros no Prisma (campo recurrence tipado como union).
 * =================================================================
 */

// =================================================================
// 📋 TIPOS E INTERFACES
// =================================================================

export type RecurrenceType = 'MENSAL' | 'TRIMESTRAL' | 'ANUAL' | 'AVULSO';

export interface CatalogItem {
  name: string;
  basePrice: number;
  recurrence: RecurrenceType;
  slaDays: number;
  scope: string;
  outOfScope: string;
  requiredDocs: string;
}

export interface CatalogCategory {
  name: string;
  icon: string;
  order: number;
  description: string;
  items: CatalogItem[];
}

// =================================================================
// 📦 CATÁLOGO COMPLETO (17 DEPARTAMENTOS)
// =================================================================

export const catalogData: CatalogCategory[] = [
  // =============================================================
  // 1️⃣ DEPARTAMENTO CONTÁBIL
  // =============================================================
  {
    name: 'Departamento Contábil',
    icon: '📊',
    order: 1,
    description: 'Escrituração, demonstrações e análises contábeis',
    items: [
      { name: 'Escrituração Contábil', basePrice: 800, recurrence: 'MENSAL', slaDays: 30, scope: 'Lançamentos contábeis, classificação, conciliação bancária e patrimonial', outOfScope: 'Reclassificações por erro do cliente', requiredDocs: 'Extratos bancários, notas fiscais, contratos' },
      { name: 'Conciliação Bancária', basePrice: 150, recurrence: 'MENSAL', slaDays: 5, scope: 'Conferência de extratos com lançamentos contábeis', outOfScope: 'Ajustes de períodos anteriores', requiredDocs: 'Extratos bancários do mês' },
      { name: 'Conciliação de Fornecedores', basePrice: 150, recurrence: 'MENSAL', slaDays: 5, scope: 'Conferência de saldos de fornecedores com notas fiscais', outOfScope: 'Negociação de dívidas', requiredDocs: 'Extratos de fornecedores, notas fiscais' },
      { name: 'Conciliação de Clientes', basePrice: 150, recurrence: 'MENSAL', slaDays: 5, scope: 'Conferência de contas a receber com faturamento', outOfScope: 'Cobrança de inadimplentes', requiredDocs: 'Extratos de clientes, notas fiscais' },
      { name: 'Controle de Ativo Imobilizado', basePrice: 200, recurrence: 'MENSAL', slaDays: 10, scope: 'Depreciação, amortização, exaustão e controle patrimonial', outOfScope: 'Inventário físico', requiredDocs: 'Notas fiscais de aquisição' },
      { name: 'Controle de Estoques', basePrice: 250, recurrence: 'MENSAL', slaDays: 10, scope: 'Avaliação de estoques (PEPS, UEPS, custo médio)', outOfScope: 'Inventário físico', requiredDocs: 'Notas fiscais, inventário' },
      { name: 'Fechamento Contábil Mensal', basePrice: 500, recurrence: 'MENSAL', slaDays: 15, scope: 'Balancete mensal, DRE gerencial e indicadores', outOfScope: 'Retrabalho por documentos atrasados', requiredDocs: 'Documentação completa do mês' },
      { name: 'Balanço Patrimonial', basePrice: 1500, recurrence: 'ANUAL', slaDays: 60, scope: 'Demonstrações contábeis anuais completas', outOfScope: 'Auditoria externa', requiredDocs: 'Balancete acumulado, conciliações' },
      { name: 'DRE - Demonstração do Resultado', basePrice: 800, recurrence: 'ANUAL', slaDays: 30, scope: 'Análise de receitas, custos e resultado do exercício', outOfScope: 'Projeções futuras', requiredDocs: 'Razão contábil do período' },
      { name: 'DFC - Fluxo de Caixa', basePrice: 600, recurrence: 'ANUAL', slaDays: 30, scope: 'Demonstração de fluxos de caixa (método direto/indireto)', outOfScope: 'Projeções financeiras', requiredDocs: 'Extratos bancários, DRE' },
      { name: 'DMPL e DLPA', basePrice: 500, recurrence: 'ANUAL', slaDays: 30, scope: 'Demonstração de mutações do patrimônio e lucros acumulados', outOfScope: 'Distribuição de dividendos', requiredDocs: 'Balanço patrimonial' },
      { name: 'Notas Explicativas', basePrice: 600, recurrence: 'ANUAL', slaDays: 45, scope: 'Elaboração de notas explicativas para demonstrações', outOfScope: 'Tradução para outros idiomas', requiredDocs: 'Demonstrações contábeis finalizadas' },
      { name: 'Relatórios Gerenciais', basePrice: 400, recurrence: 'MENSAL', slaDays: 10, scope: 'Indicadores financeiros, análise de liquidez, rentabilidade e endividamento', outOfScope: 'Consultoria estratégica', requiredDocs: 'Demonstrações contábeis' },
    ],
  },
  // =============================================================
  // 2️⃣ DEPARTAMENTO FISCAL
  // =============================================================
  {
    name: 'Departamento Fiscal',
    icon: '📋',
    order: 2,
    description: 'Apuração de impostos e obrigações acessórias',
    items: [
      { name: 'Apuração Simples Nacional', basePrice: 400, recurrence: 'MENSAL', slaDays: 15, scope: 'Cálculo do DAS, conferência de anexos e planejamento de enquadramento', outOfScope: 'Retificações por erro do cliente', requiredDocs: 'Notas fiscais, folha de pagamento' },
      { name: 'Exclusão/Inclusão no Simples', basePrice: 800, recurrence: 'AVULSO', slaDays: 20, scope: 'Análise de viabilidade, pedido de opção/exclusão', outOfScope: 'Regularização de débitos', requiredDocs: 'Declarações anteriores, faturamento' },
      { name: 'Apuração Lucro Presumido', basePrice: 800, recurrence: 'TRIMESTRAL', slaDays: 20, scope: 'IRPJ, CSLL, PIS, COFINS, ISS, ICMS', outOfScope: 'Planejamento tributário avançado', requiredDocs: 'Receita bruta, despesas dedutíveis' },
      { name: 'Apuração Lucro Real', basePrice: 1500, recurrence: 'TRIMESTRAL', slaDays: 30, scope: 'LALUR, LACS, IRPJ, CSLL, PIS, COFINS', outOfScope: 'Auditoria fiscal', requiredDocs: 'Contabilidade completa, ajustes' },
      { name: 'DCTF e DCTFWeb', basePrice: 200, recurrence: 'MENSAL', slaDays: 10, scope: 'Declaração de débitos e créditos tributários federais', outOfScope: 'Retificações', requiredDocs: 'Apuração de impostos' },
      { name: 'EFD Contribuições', basePrice: 350, recurrence: 'MENSAL', slaDays: 15, scope: 'Escrituração fiscal digital de PIS/COFINS', outOfScope: 'Revisão de períodos anteriores', requiredDocs: 'Notas fiscais, apuração' },
      { name: 'EFD-Reinf', basePrice: 250, recurrence: 'MENSAL', slaDays: 10, scope: 'Retenções e informações fiscais', outOfScope: 'Retificações complexas', requiredDocs: 'Notas de serviços, retenções' },
      { name: 'SPED Fiscal (ICMS/IPI)', basePrice: 400, recurrence: 'MENSAL', slaDays: 15, scope: 'Escrituração fiscal digital de ICMS/IPI', outOfScope: 'Retificações', requiredDocs: 'Notas fiscais, inventário' },
      { name: 'GIA e Sintegra', basePrice: 300, recurrence: 'MENSAL', slaDays: 10, scope: 'Declarações estaduais de ICMS', outOfScope: 'Regularização de pendências', requiredDocs: 'Apuração de ICMS' },
      { name: 'ECF e ECD', basePrice: 1000, recurrence: 'ANUAL', slaDays: 60, scope: 'Escrituração contábil fiscal e digital', outOfScope: 'Auditoria', requiredDocs: 'Contabilidade completa' },
      { name: 'DEFIS', basePrice: 400, recurrence: 'ANUAL', slaDays: 30, scope: 'Declaração do Simples Nacional', outOfScope: 'Retificações', requiredDocs: 'Faturamento, despesas' },
      { name: 'DIRF', basePrice: 300, recurrence: 'ANUAL', slaDays: 30, scope: 'Declaração de imposto de renda retido na fonte', outOfScope: 'Correções após prazo', requiredDocs: 'Folha de pagamento, retenções' },
      { name: 'PER/DCOMP', basePrice: 600, recurrence: 'AVULSO', slaDays: 30, scope: 'Pedido de restituição e compensação tributária', outOfScope: 'Acompanhamento junto à Receita', requiredDocs: 'Comprovantes de recolhimento' },
      { name: 'Declaração ISS Municipal', basePrice: 200, recurrence: 'MENSAL', slaDays: 10, scope: 'Declarações municipais de ISS', outOfScope: 'Regularização de débitos', requiredDocs: 'Notas fiscais de serviço' },
    ],
  },
  // =============================================================
  // 3️⃣ DEPARTAMENTO PESSOAL
  // =============================================================
  {
    name: 'Departamento Pessoal',
    icon: '👥',
    order: 3,
    description: 'Folha de pagamento e obrigações trabalhistas',
    items: [
      { name: 'Admissão de Funcionário', basePrice: 150, recurrence: 'AVULSO', slaDays: 3, scope: 'Registro, contrato, eSocial, ficha de registro', outOfScope: 'Exames médicos', requiredDocs: 'Documentos pessoais, CTPS' },
      { name: 'Folha de Pagamento (até 5 funcionários)', basePrice: 300, recurrence: 'MENSAL', slaDays: 5, scope: 'Salários, horas extras, adicionais, comissões, vales', outOfScope: 'Rescisões complexas', requiredDocs: 'Cartões de ponto, atestados' },
      { name: 'Folha de Pagamento (6-15 funcionários)', basePrice: 600, recurrence: 'MENSAL', slaDays: 7, scope: 'Folha completa com encargos e benefícios', outOfScope: 'Consultoria trabalhista', requiredDocs: 'Documentação mensal' },
      { name: 'Folha de Pagamento (16-30 funcionários)', basePrice: 1000, recurrence: 'MENSAL', slaDays: 10, scope: 'Folha completa com convênios e terceiros', outOfScope: 'Consultoria trabalhista', requiredDocs: 'Documentação mensal' },
      { name: 'Encargos Sociais (FGTS, INSS, IRRF)', basePrice: 250, recurrence: 'MENSAL', slaDays: 5, scope: 'Cálculo e geração de guias de encargos', outOfScope: 'Parcelamentos', requiredDocs: 'Folha de pagamento' },
      { name: 'Rescisão de Contrato', basePrice: 250, recurrence: 'AVULSO', slaDays: 5, scope: 'Cálculo rescisório, homologação, GRRF, seguro-desemprego', outOfScope: 'Ações trabalhistas', requiredDocs: 'Aviso prévio, documentos' },
      { name: 'Férias', basePrice: 100, recurrence: 'AVULSO', slaDays: 5, scope: 'Programação, cálculo, avisos e recibos', outOfScope: 'Férias coletivas', requiredDocs: 'Período aquisitivo completo' },
      { name: '13º Salário', basePrice: 200, recurrence: 'ANUAL', slaDays: 10, scope: 'Primeira e segunda parcela com encargos', outOfScope: 'Adiantamentos especiais', requiredDocs: 'Folha de pagamento' },
      { name: 'eSocial (Completo)', basePrice: 350, recurrence: 'MENSAL', slaDays: 10, scope: 'Eventos mensais, admissões, afastamentos, desligamentos', outOfScope: 'Retificações complexas', requiredDocs: 'Folha, admissões, rescisões' },
      { name: 'FGTS Digital', basePrice: 150, recurrence: 'MENSAL', slaDays: 5, scope: 'Envio de eventos ao FGTS Digital', outOfScope: 'Regularização de débitos', requiredDocs: 'Folha de pagamento' },
      { name: 'PPP, LTCAT e CAT', basePrice: 500, recurrence: 'AVULSO', slaDays: 15, scope: 'Perfil profissiográfico, laudos técnicos e comunicação de acidentes', outOfScope: 'Elaboração de laudos (requer engenheiro)', requiredDocs: 'Documentação de segurança do trabalho' },
    ],
  },
  // =============================================================
  // 4️⃣ LEGALIZAÇÃO DE EMPRESAS
  // =============================================================
  {
    name: 'Legalização de Empresas',
    icon: '🏢',
    order: 4,
    description: 'Abertura, alterações e encerramento de empresas',
    items: [
      { name: 'Abertura de Empresa (MEI)', basePrice: 300, recurrence: 'AVULSO', slaDays: 7, scope: 'Portal do Empreendedor, alvará, inscrições', outOfScope: 'Licenças especiais', requiredDocs: 'Documentos pessoais, endereço' },
      { name: 'Abertura de Empresa (LTDA)', basePrice: 1200, recurrence: 'AVULSO', slaDays: 30, scope: 'Contrato social, Junta Comercial, CNPJ, IE, IM', outOfScope: 'Alvarás de funcionamento', requiredDocs: 'Documentos dos sócios, endereço' },
      { name: 'Constituição de Estatuto Social', basePrice: 1500, recurrence: 'AVULSO', slaDays: 30, scope: 'Elaboração de estatuto para S.A. ou cooperativas', outOfScope: 'Registro em comissão de valores', requiredDocs: 'Documentos dos fundadores' },
      { name: 'Alteração Contratual', basePrice: 800, recurrence: 'AVULSO', slaDays: 20, scope: 'Entrada/saída de sócios, capital, endereço, atividade', outOfScope: 'Transformações societárias', requiredDocs: 'Contrato atual, documentos' },
      { name: 'Transformação Societária', basePrice: 2000, recurrence: 'AVULSO', slaDays: 45, scope: 'Conversão de tipo jurídico (LTDA → S.A., etc.)', outOfScope: 'Due diligence', requiredDocs: 'Documentação completa da empresa' },
      { name: 'Encerramento de Empresa', basePrice: 1000, recurrence: 'AVULSO', slaDays: 45, scope: 'Distrato, baixa CNPJ, IE, IM', outOfScope: 'Dívidas pendentes', requiredDocs: 'Últimas declarações, certidões' },
      { name: 'Obtenção de Alvará', basePrice: 400, recurrence: 'AVULSO', slaDays: 30, scope: 'Alvará de funcionamento e licenças', outOfScope: 'Taxas municipais', requiredDocs: 'Projeto aprovado, Habite-se' },
      { name: 'Certidões Negativas', basePrice: 150, recurrence: 'AVULSO', slaDays: 5, scope: 'Emissão de certidões federais, estaduais e municipais', outOfScope: 'Regularização de pendências', requiredDocs: 'CNPJ, documentos da empresa' },
    ],
  },
  // =============================================================
  // 5️⃣ CONSULTORIA TRIBUTÁRIA
  // =============================================================
  {
    name: 'Consultoria Tributária',
    icon: '💡',
    order: 5,
    description: 'Planejamento e inteligência tributária',
    items: [
      { name: 'Planejamento Tributário', basePrice: 3000, recurrence: 'AVULSO', slaDays: 30, scope: 'Estudo de enquadramento, simulações, redução legal de impostos', outOfScope: 'Implementação', requiredDocs: 'Demonstrações contábeis, faturamento' },
      { name: 'Diagnóstico Tributário', basePrice: 2000, recurrence: 'AVULSO', slaDays: 20, scope: 'Análise completa da situação fiscal da empresa', outOfScope: 'Regularização', requiredDocs: 'Declarações dos últimos 5 anos' },
      { name: 'Revisão Fiscal', basePrice: 2500, recurrence: 'AVULSO', slaDays: 20, scope: 'Auditoria de obrigações acessórias e pagamentos', outOfScope: 'Retificações', requiredDocs: 'Declarações dos últimos 5 anos' },
      { name: 'Simulações Tributárias', basePrice: 1500, recurrence: 'AVULSO', slaDays: 15, scope: 'Comparativo entre regimes tributários', outOfScope: 'Implementação de mudanças', requiredDocs: 'Faturamento, despesas' },
      { name: 'Compliance Tributário', basePrice: 2000, recurrence: 'TRIMESTRAL', slaDays: 15, scope: 'Monitoramento de mudanças legislativas', outOfScope: 'Implementação de mudanças', requiredDocs: 'Atividades da empresa' },
      { name: 'Auditoria Tributária', basePrice: 4000, recurrence: 'AVULSO', slaDays: 30, scope: 'Revisão completa de tributos pagos e obrigações', outOfScope: 'Defesa em autuações', requiredDocs: 'Documentação fiscal completa' },
    ],
  },
  // =============================================================
  // 6️⃣ CONSULTORIA EMPRESARIAL
  // =============================================================
  {
    name: 'Consultoria Empresarial',
    icon: '📈',
    order: 6,
    description: 'Diagnóstico, planejamento e indicadores',
    items: [
      { name: 'Diagnóstico Financeiro', basePrice: 2500, recurrence: 'AVULSO', slaDays: 15, scope: 'Análise de saúde financeira, indicadores, recomendações', outOfScope: 'Implementação', requiredDocs: 'Demonstrações contábeis' },
      { name: 'Planejamento Estratégico', basePrice: 4000, recurrence: 'AVULSO', slaDays: 30, scope: 'Definição de metas, KPIs, roadmap', outOfScope: 'Acompanhamento mensal', requiredDocs: 'Dados históricos da empresa' },
      { name: 'Orçamento Empresarial', basePrice: 2000, recurrence: 'ANUAL', slaDays: 20, scope: 'Elaboração de orçamento anual completo', outOfScope: 'Acompanhamento mensal', requiredDocs: 'Histórico de 3 anos' },
      { name: 'Fluxo de Caixa Projetado', basePrice: 1500, recurrence: 'AVULSO', slaDays: 10, scope: 'Projeções de caixa para 12 meses', outOfScope: 'Implementação de controles', requiredDocs: 'Extratos, contas a pagar/receber' },
      { name: 'Precificação de Produtos', basePrice: 1500, recurrence: 'AVULSO', slaDays: 10, scope: 'Formação de preço, margens, análise de custos', outOfScope: 'Implementação de ERP', requiredDocs: 'Custos, despesas, concorrentes' },
      { name: 'Dashboard Gerencial e KPIs', basePrice: 2500, recurrence: 'AVULSO', slaDays: 20, scope: 'Indicadores de desempenho personalizados', outOfScope: 'Licenças de software', requiredDocs: 'Dados operacionais' },
      { name: 'Valuation', basePrice: 8000, recurrence: 'AVULSO', slaDays: 45, scope: 'Avaliação de empresa por múltiplos métodos', outOfScope: 'Due diligence completa', requiredDocs: 'Demonstrações de 5 anos' },
      { name: 'Due Diligence', basePrice: 12000, recurrence: 'AVULSO', slaDays: 45, scope: 'Análise completa para fusões/aquisições', outOfScope: 'Negociação', requiredDocs: 'Acesso completo aos dados' },
    ],
  },
  // =============================================================
  // 7️⃣ BPO FINANCEIRO
  // =============================================================
  {
    name: 'BPO Financeiro',
    icon: '💰',
    order: 7,
    description: 'Terceirização de contas a pagar e receber',
    items: [
      { name: 'Contas a Pagar', basePrice: 500, recurrence: 'MENSAL', slaDays: 3, scope: 'Lançamentos, programação, pagamentos, conciliação', outOfScope: 'Negociação com fornecedores', requiredDocs: 'Boletos, contratos' },
      { name: 'Contas a Receber', basePrice: 600, recurrence: 'MENSAL', slaDays: 3, scope: 'Emissão de boletos, cobranças, controle de inadimplência', outOfScope: 'Ações judiciais', requiredDocs: 'Notas fiscais, contratos' },
      { name: 'Tesouraria e Fluxo de Caixa', basePrice: 400, recurrence: 'MENSAL', slaDays: 5, scope: 'Controle diário, projeções, relatórios', outOfScope: 'Consultoria financeira', requiredDocs: 'Extratos bancários' },
      { name: 'Conciliação Bancária', basePrice: 300, recurrence: 'MENSAL', slaDays: 5, scope: 'Conferência de movimentações', outOfScope: 'Ajustes contábeis', requiredDocs: 'Extratos bancários' },
      { name: 'Relatórios Financeiros (DRE, Fluxo)', basePrice: 500, recurrence: 'MENSAL', slaDays: 7, scope: 'DRE gerencial, fluxo de caixa, indicadores', outOfScope: 'Consultoria estratégica', requiredDocs: 'Dados financeiros do mês' },
    ],
  },
  // =============================================================
  // 8️⃣ RECUPERAÇÃO DE CRÉDITOS
  // =============================================================
  {
    name: 'Recuperação de Créditos',
    icon: '💎',
    order: 8,
    description: 'Revisão e recuperação de tributos pagos a maior',
    items: [
      { name: 'Revisão Tributária Completa', basePrice: 5000, recurrence: 'AVULSO', slaDays: 60, scope: 'Análise de 5 anos de tributos pagos', outOfScope: 'Ações judiciais', requiredDocs: 'Documentação fiscal completa' },
      { name: 'Créditos de PIS/COFINS', basePrice: 3000, recurrence: 'AVULSO', slaDays: 45, scope: 'Identificação e recuperação de créditos', outOfScope: 'Defesa em autuações', requiredDocs: 'Notas fiscais de entrada' },
      { name: 'Créditos de ICMS', basePrice: 3500, recurrence: 'AVULSO', slaDays: 45, scope: 'Revisão de créditos de ICMS', outOfScope: 'Regularização de pendências', requiredDocs: 'Notas fiscais, GIA' },
      { name: 'Créditos de INSS/FGTS', basePrice: 2500, recurrence: 'AVULSO', slaDays: 30, scope: 'Revisão de contribuições previdenciárias', outOfScope: 'Ações trabalhistas', requiredDocs: 'Folha de pagamento' },
      { name: 'PER/DCOMP (Compensações)', basePrice: 600, recurrence: 'AVULSO', slaDays: 30, scope: 'Pedido de restituição e compensação', outOfScope: 'Acompanhamento junto à Receita', requiredDocs: 'Comprovantes de recolhimento' },
    ],
  },
  // =============================================================
  // 9️⃣ CONTROLADORIA
  // =============================================================
  {
    name: 'Controladoria',
    icon: '🎯',
    order: 9,
    description: 'Centros de custos, budget e forecast',
    items: [
      { name: 'Implantação de Centros de Custos', basePrice: 3000, recurrence: 'AVULSO', slaDays: 30, scope: 'Estruturação, plano de contas gerencial, treinamento', outOfScope: 'Implementação em ERP', requiredDocs: 'Organograma, atividades' },
      { name: 'Plano de Contas Gerencial', basePrice: 2000, recurrence: 'AVULSO', slaDays: 20, scope: 'Estruturação de plano de contas para gestão', outOfScope: 'Implementação em sistemas', requiredDocs: 'Demonstrações contábeis' },
      { name: 'Budget e Forecast', basePrice: 2000, recurrence: 'ANUAL', slaDays: 20, scope: 'Orçamento anual e projeções trimestrais', outOfScope: 'Acompanhamento mensal', requiredDocs: 'Histórico de 3 anos' },
      { name: 'Planejamento Financeiro', basePrice: 2500, recurrence: 'AVULSO', slaDays: 25, scope: 'Planejamento financeiro completo', outOfScope: 'Implementação', requiredDocs: 'Demonstrações, fluxo de caixa' },
      { name: 'Indicadores de Desempenho', basePrice: 1500, recurrence: 'TRIMESTRAL', slaDays: 10, scope: 'Definição e acompanhamento de KPIs', outOfScope: 'Dashboard em BI', requiredDocs: 'Dados operacionais' },
    ],
  },
  // =============================================================
  // 🔟 AUDITORIA
  // =============================================================
  {
    name: 'Auditoria',
    icon: '🔍',
    order: 10,
    description: 'Auditoria interna e externa',
    items: [
      { name: 'Auditoria Interna', basePrice: 5000, recurrence: 'AVULSO', slaDays: 30, scope: 'Revisão de processos, controles e conformidade', outOfScope: 'Implementação de melhorias', requiredDocs: 'Documentação de processos' },
      { name: 'Auditoria de Demonstrações', basePrice: 8000, recurrence: 'ANUAL', slaDays: 45, scope: 'Parecer sobre demonstrações contábeis', outOfScope: 'Consultoria', requiredDocs: 'Demonstrações completas' },
      { name: 'Revisão Documental', basePrice: 2000, recurrence: 'AVULSO', slaDays: 15, scope: 'Verificação de documentação contábil e fiscal', outOfScope: 'Regularização', requiredDocs: 'Documentos do período' },
      { name: 'Compliance Contábil', basePrice: 3000, recurrence: 'AVULSO', slaDays: 20, scope: 'Verificação de procedimentos contábeis', outOfScope: 'Implementação de mudanças', requiredDocs: 'Processos contábeis' },
    ],
  },
  // =============================================================
  // 1️⃣1️⃣ LGPD E COMPLIANCE
  // =============================================================
  {
    name: 'LGPD e Compliance',
    icon: '🛡️',
    order: 11,
    description: 'Adequação à LGPD e compliance',
    items: [
      { name: 'Adequação LGPD', basePrice: 6000, recurrence: 'AVULSO', slaDays: 60, scope: 'Mapeamento, políticas, treinamento, DPO', outOfScope: 'Implementação técnica', requiredDocs: 'Processos da empresa' },
      { name: 'Mapeamento de Processos (LGPD)', basePrice: 3000, recurrence: 'AVULSO', slaDays: 30, scope: 'Identificação de dados pessoais e fluxos', outOfScope: 'Implementação de controles', requiredDocs: 'Processos da empresa' },
      { name: 'Gestão Documental', basePrice: 2000, recurrence: 'AVULSO', slaDays: 20, scope: 'Organização e política de retenção de documentos', outOfScope: 'Digitalização', requiredDocs: 'Documentos existentes' },
      { name: 'Compliance Fiscal', basePrice: 2500, recurrence: 'AVULSO', slaDays: 20, scope: 'Verificação de conformidade fiscal', outOfScope: 'Regularização', requiredDocs: 'Declarações fiscais' },
      { name: 'Compliance Trabalhista', basePrice: 2500, recurrence: 'AVULSO', slaDays: 20, scope: 'Revisão de contratos, políticas, riscos', outOfScope: 'Ações judiciais', requiredDocs: 'Contratos de trabalho' },
      { name: 'Compliance Contábil', basePrice: 2500, recurrence: 'AVULSO', slaDays: 20, scope: 'Verificação de conformidade contábil', outOfScope: 'Regularização', requiredDocs: 'Demonstrações contábeis' },
    ],
  },
  // =============================================================
  // 1️⃣2️⃣ ÁREA RURAL
  // =============================================================
  {
    name: 'Área Rural',
    icon: '🌾',
    order: 12,
    description: 'Serviços para produtores rurais',
    items: [
      { name: 'Livro Caixa Digital do Produtor Rural', basePrice: 800, recurrence: 'ANUAL', slaDays: 30, scope: 'Escrituração e entrega do LCDPR', outOfScope: 'Regularização de débitos', requiredDocs: 'Notas fiscais, extratos bancários' },
      { name: 'ITR - Imposto Territorial Rural', basePrice: 400, recurrence: 'ANUAL', slaDays: 20, scope: 'Declaração anual do ITR', outOfScope: 'Regularização de pendências', requiredDocs: 'Documentação do imóvel rural' },
      { name: 'CCIR - Certificado de Cadastro', basePrice: 300, recurrence: 'ANUAL', slaDays: 15, scope: 'Atualização cadastral do imóvel rural', outOfScope: 'Regularização fundiária', requiredDocs: 'Documentação do imóvel' },
      { name: 'CAR - Cadastro Ambiental Rural', basePrice: 500, recurrence: 'AVULSO', slaDays: 30, scope: 'Inscrição e atualização no CAR', outOfScope: 'Regularização ambiental', requiredDocs: 'Documentação do imóvel, georreferenciamento' },
      { name: 'Folha de Pagamento Rural', basePrice: 500, recurrence: 'MENSAL', slaDays: 7, scope: 'Folha para trabalhadores rurais (safra, permanente)', outOfScope: 'Consultoria trabalhista', requiredDocs: 'Cartões de ponto, contratos' },
      { name: 'Apuração Rural (Funrural)', basePrice: 600, recurrence: 'MENSAL', slaDays: 15, scope: 'Cálculo de contribuições rurais', outOfScope: 'Regularização de débitos', requiredDocs: 'Notas fiscais de produção' },
      { name: 'Planejamento Tributário Rural', basePrice: 2500, recurrence: 'AVULSO', slaDays: 25, scope: 'Otimização fiscal para produtores rurais', outOfScope: 'Implementação', requiredDocs: 'Demonstrações, faturamento' },
    ],
  },
  // =============================================================
  // 1️⃣3️⃣ TERCEIRO SETOR
  // =============================================================
  {
    name: 'Terceiro Setor',
    icon: '🤝',
    order: 13,
    description: 'OSCs, associações e fundações',
    items: [
      { name: 'Prestação de Contas', basePrice: 1500, recurrence: 'AVULSO', slaDays: 30, scope: 'Prestação de contas para órgãos públicos', outOfScope: 'Regularização de pendências', requiredDocs: 'Demonstrações, relatórios de atividades' },
      { name: 'Gestão de Convênios', basePrice: 1000, recurrence: 'MENSAL', slaDays: 10, scope: 'Controle e prestação de contas de convênios', outOfScope: 'Captação de recursos', requiredDocs: 'Termos de convênio' },
      { name: 'Contabilidade para OSC/OSCIP', basePrice: 800, recurrence: 'MENSAL', slaDays: 20, scope: 'Escrituração contábil específica do terceiro setor', outOfScope: 'Consultoria jurídica', requiredDocs: 'Documentação completa do mês' },
      { name: 'Contabilidade para Associações', basePrice: 700, recurrence: 'MENSAL', slaDays: 20, scope: 'Escrituração para associações civis', outOfScope: 'Regularização de pendências', requiredDocs: 'Documentação mensal' },
      { name: 'Contabilidade para Fundações', basePrice: 900, recurrence: 'MENSAL', slaDays: 20, scope: 'Escrituração específica para fundações', outOfScope: 'Consultoria jurídica', requiredDocs: 'Documentação mensal' },
      { name: 'Certificações (CEBAS, Utilidade Pública)', basePrice: 2000, recurrence: 'AVULSO', slaDays: 45, scope: 'Obtenção e renovação de certificações', outOfScope: 'Regularização de pendências', requiredDocs: 'Documentação institucional' },
    ],
  },
  // =============================================================
  // 1️⃣4️⃣ CONDOMÍNIOS
  // =============================================================
  {
    name: 'Condomínios',
    icon: '🏘️',
    order: 14,
    description: 'Gestão contábil para condomínios',
    items: [
      { name: 'Prestação de Contas Mensal', basePrice: 600, recurrence: 'MENSAL', slaDays: 10, scope: 'Relatório mensal de receitas e despesas', outOfScope: 'Assembleias', requiredDocs: 'Extratos, notas fiscais' },
      { name: 'Balancetes de Condomínio', basePrice: 400, recurrence: 'MENSAL', slaDays: 7, scope: 'Balancete mensal para síndicos e conselho', outOfScope: 'Auditoria', requiredDocs: 'Extratos bancários' },
      { name: 'Folha de Pagamento (Condomínio)', basePrice: 400, recurrence: 'MENSAL', slaDays: 5, scope: 'Folha para funcionários do condomínio', outOfScope: 'Consultoria trabalhista', requiredDocs: 'Cartões de ponto' },
      { name: 'Obrigações Fiscais (Condomínio)', basePrice: 300, recurrence: 'MENSAL', slaDays: 10, scope: 'Declarações fiscais específicas de condomínios', outOfScope: 'Regularização de pendências', requiredDocs: 'Documentação fiscal' },
      { name: 'Gestão Financeira Completa', basePrice: 800, recurrence: 'MENSAL', slaDays: 7, scope: 'Contas a pagar/receber, inadimplência, fluxo de caixa', outOfScope: 'Cobrança judicial', requiredDocs: 'Boletos, contratos' },
    ],
  },
  // =============================================================
  // 1️⃣5️⃣ SERVIÇOS TECNOLÓGICOS (Escritório 4.0)
  // =============================================================
  {
    name: 'Serviços Tecnológicos',
    icon: '💻',
    order: 15,
    description: 'Implantação de sistemas, integrações e automações',
    items: [
      { name: 'Implantação de ERP', basePrice: 5000, recurrence: 'AVULSO', slaDays: 45, scope: 'Configuração, migração de dados, treinamento', outOfScope: 'Licenças de software', requiredDocs: 'Processos atuais, dados históricos' },
      { name: 'Integração SCI', basePrice: 2000, recurrence: 'AVULSO', slaDays: 20, scope: 'Integração com sistema SCI', outOfScope: 'Licenças', requiredDocs: 'Acesso ao sistema' },
      { name: 'Integração Conta Azul', basePrice: 1500, recurrence: 'AVULSO', slaDays: 15, scope: 'Integração com Conta Azul', outOfScope: 'Assinaturas', requiredDocs: 'Acesso à plataforma' },
      { name: 'Integração Omie', basePrice: 1500, recurrence: 'AVULSO', slaDays: 15, scope: 'Integração com Omie', outOfScope: 'Assinaturas', requiredDocs: 'Acesso à plataforma' },
      { name: 'Integração Nibo', basePrice: 1500, recurrence: 'AVULSO', slaDays: 15, scope: 'Integração com Nibo', outOfScope: 'Assinaturas', requiredDocs: 'Acesso à plataforma' },
      { name: 'Integração Komunic', basePrice: 1200, recurrence: 'AVULSO', slaDays: 15, scope: 'Integração com Komunic', outOfScope: 'Assinaturas', requiredDocs: 'Acesso à plataforma' },
      { name: 'Integração WhatsApp', basePrice: 1500, recurrence: 'AVULSO', slaDays: 15, scope: 'Automação de atendimento via WhatsApp', outOfScope: 'Custos de API', requiredDocs: 'Fluxos de atendimento' },
      { name: 'Automação N8N', basePrice: 2000, recurrence: 'AVULSO', slaDays: 20, scope: 'Fluxos de automação com N8N', outOfScope: 'Manutenção contínua', requiredDocs: 'Fluxos atuais' },
      { name: 'Automação Make', basePrice: 2000, recurrence: 'AVULSO', slaDays: 20, scope: 'Fluxos de automação com Make', outOfScope: 'Manutenção contínua', requiredDocs: 'Fluxos atuais' },
      { name: 'Dashboards Power BI', basePrice: 3000, recurrence: 'AVULSO', slaDays: 20, scope: 'Desenvolvimento de dashboards personalizados', outOfScope: 'Licenças Power BI', requiredDocs: 'Indicadores desejados, fontes de dados' },
      { name: 'BI Financeiro', basePrice: 2500, recurrence: 'AVULSO', slaDays: 20, scope: 'Business intelligence para finanças', outOfScope: 'Licenças de software', requiredDocs: 'Dados financeiros' },
      { name: 'Portal do Cliente', basePrice: 3500, recurrence: 'AVULSO', slaDays: 30, scope: 'Implantação de portal para clientes', outOfScope: 'Licenças', requiredDocs: 'Requisitos do portal' },
      { name: 'Assinatura Eletrônica', basePrice: 1500, recurrence: 'AVULSO', slaDays: 10, scope: 'Implementação de assinatura digital', outOfScope: 'Licenças', requiredDocs: 'Documentos a assinar' },
      { name: 'Workflow de Processos', basePrice: 2500, recurrence: 'AVULSO', slaDays: 25, scope: 'Mapeamento e automação de workflows', outOfScope: 'Manutenção contínua', requiredDocs: 'Processos atuais' },
      { name: 'CRM Contábil', basePrice: 2000, recurrence: 'AVULSO', slaDays: 20, scope: 'Implantação de CRM para escritórios', outOfScope: 'Licenças', requiredDocs: 'Processo comercial' },
      { name: 'Atendimento Omnichannel', basePrice: 2500, recurrence: 'AVULSO', slaDays: 25, scope: 'Integração de canais de atendimento', outOfScope: 'Licenças', requiredDocs: 'Canais atuais' },
    ],
  },
  // =============================================================
  // 1️⃣6️⃣ CERTIFICAÇÃO DIGITAL
  // =============================================================
  {
    name: 'Certificação Digital',
    icon: '🔐',
    order: 16,
    description: 'Emissão e gestão de certificados digitais',
    items: [
      { name: 'Certificado A1 (e-CPF)', basePrice: 180, recurrence: 'ANUAL', slaDays: 1, scope: 'Emissão e instalação', outOfScope: 'Suporte técnico avançado', requiredDocs: 'Documentos pessoais, videoconferência' },
      { name: 'Certificado A1 (e-CNPJ)', basePrice: 200, recurrence: 'ANUAL', slaDays: 1, scope: 'Emissão e instalação', outOfScope: 'Configuração de sistemas', requiredDocs: 'Contrato social, documentos do representante' },
      { name: 'Certificado A3 (token)', basePrice: 250, recurrence: 'ANUAL', slaDays: 3, scope: 'Emissão com token físico', outOfScope: 'Token (custo separado)', requiredDocs: 'Documentos pessoais' },
      { name: 'Renovação de Certificado', basePrice: 150, recurrence: 'ANUAL', slaDays: 1, scope: 'Renovação antes do vencimento', outOfScope: 'Emissão de novo certificado', requiredDocs: 'Certificado atual' },
      { name: 'Instalação e Suporte', basePrice: 100, recurrence: 'AVULSO', slaDays: 1, scope: 'Instalação em sistemas e navegadores', outOfScope: 'Configuração de software específico', requiredDocs: 'Acesso ao computador' },
      { name: 'Revogação de Certificado', basePrice: 80, recurrence: 'AVULSO', slaDays: 1, scope: 'Revogação por perda ou roubo', outOfScope: 'Emissão de novo certificado', requiredDocs: 'Documentos pessoais' },
    ],
  },
  // =============================================================
  // 1️⃣7️⃣ SERVIÇOS PREMIUM DE ALTO VALOR
  // =============================================================
  {
    name: 'Serviços Premium',
    icon: '👑',
    order: 17,
    description: 'CFO terceirizado, holdings e M&A',
    items: [
      { name: 'CFO as a Service', basePrice: 8000, recurrence: 'MENSAL', slaDays: 30, scope: 'Diretoria financeira terceirizada, reuniões mensais', outOfScope: 'Operação diária', requiredDocs: 'Demonstrações, planejamento' },
      { name: 'Controladoria Terceirizada', basePrice: 5000, recurrence: 'MENSAL', slaDays: 15, scope: 'Controladoria completa terceirizada', outOfScope: 'Implementação de sistemas', requiredDocs: 'Demonstrações contábeis' },
      { name: 'Planejamento Sucessório', basePrice: 10000, recurrence: 'AVULSO', slaDays: 60, scope: 'Estruturação de sucessão empresarial e familiar', outOfScope: 'Custos cartorários', requiredDocs: 'Documentos da família e empresas' },
      { name: 'Holding Patrimonial', basePrice: 15000, recurrence: 'AVULSO', slaDays: 90, scope: 'Estruturação, constituição, transferência de bens', outOfScope: 'Custos cartorários', requiredDocs: 'Documentos dos bens, família' },
      { name: 'Holding Familiar', basePrice: 12000, recurrence: 'AVULSO', slaDays: 75, scope: 'Estruturação de holding para proteção familiar', outOfScope: 'Custos cartorários', requiredDocs: 'Documentos da família' },
      { name: 'Proteção Patrimonial', basePrice: 10000, recurrence: 'AVULSO', slaDays: 60, scope: 'Análise e estruturação de proteção de ativos', outOfScope: 'Implementação completa', requiredDocs: 'Documentação patrimonial' },
      { name: 'Reorganização Societária', basePrice: 8000, recurrence: 'AVULSO', slaDays: 60, scope: 'Reestruturação de grupos empresariais', outOfScope: 'Due diligence completa', requiredDocs: 'Documentação das empresas' },
      { name: 'Fusões e Aquisições (M&A)', basePrice: 20000, recurrence: 'AVULSO', slaDays: 90, scope: 'Assessoria completa em M&A', outOfScope: 'Negociação direta', requiredDocs: 'Acesso completo aos dados' },
      { name: 'Due Diligence Completa', basePrice: 12000, recurrence: 'AVULSO', slaDays: 45, scope: 'Análise completa para fusões/aquisições', outOfScope: 'Negociação', requiredDocs: 'Acesso completo aos dados' },
      { name: 'Governança Corporativa', basePrice: 5000, recurrence: 'TRIMESTRAL', slaDays: 20, scope: 'Estruturação de conselhos, políticas, sucessão', outOfScope: 'Implementação', requiredDocs: 'Estatuto, acordos de sócios' },
      { name: 'Conselhos Consultivos', basePrice: 4000, recurrence: 'MENSAL', slaDays: 15, scope: 'Participação em conselhos consultivos', outOfScope: 'Decisões executivas', requiredDocs: 'Estatuto, relatórios' },
    ],
  },
];