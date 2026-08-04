import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

/**
 * =================================================================
 * 📊 BI SERVICE - Business Intelligence Conta Certa
 * =================================================================
 * 
 * RESPONSABILIDADES:
 * 1. DRE Gerencial (Receitas vs Despesas vs Lucro por mês)
 * 2. Ponto Fora da Curva (Detecção de despesas anômalas)
 * 3. Indicadores de Eficiência (MRR, Ticket Médio, Margem)
 * 4. Simulador de Regimes Tributários (Simples vs Presumido vs Real)
 * 5. Simulador de Reforma Tributária (CBS + IBS - EC 132/2023)
 * 
 * OBSERVAÇÃO IMPORTANTE:
 * Todos os métodos recebem `companyId` (não userId) para garantir
 * que os dados sejam filtrados corretamente por empresa (tenant).
 */
@Injectable()
export class BiService {
  constructor(private prisma: PrismaService) {}

  // =================================================================
  // 1️⃣ DRE GERENCIAL (Agrupado por Mês)
  // =================================================================
  /**
   * Retorna a Demonstração do Resultado do Exercício (DRE)
   * agrupada por mês, com receitas, despesas e lucro.
   * 
   * @param companyId - ID da empresa (tenant)
   * @param months - Quantidade de meses para trás (padrão: 6)
   * @param clientId - Filtro opcional por cliente específico
   */
  async getDre(companyId: string, months: number = 6, clientId?: string) {
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);

    const whereClause: any = {
      companyId, // 🔥 CORRIGIDO: era userId
      date: { gte: startDate },
    };

    if (clientId && clientId !== 'all') {
      whereClause.clientId = clientId;
    }

    const transactions = await this.prisma.financialTransaction.findMany({
      where: whereClause,
      select: {
        type: true,
        category: true,
        amount: true,
        date: true,
      },
      orderBy: { date: 'asc' },
    });

    // Agrupar por mês (formato: "YYYY-MM")
    const monthlyData: Record<string, { receitas: number; despesas: number; lucro: number }> = {};
    const categoryTotals: Record<string, number> = {};

    transactions.forEach((t) => {
      const monthKey = `${t.date.getFullYear()}-${String(t.date.getMonth() + 1).padStart(2, '0')}`;
      const amount = Number(t.amount);

      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { receitas: 0, despesas: 0, lucro: 0 };
      }

      if (t.type === 'RECEITA') {
        monthlyData[monthKey].receitas += amount;
      } else {
        monthlyData[monthKey].despesas += amount;
        categoryTotals[t.category] = (categoryTotals[t.category] || 0) + amount;
      }
    });

    // Calcular lucro de cada mês
    Object.values(monthlyData).forEach((m) => {
      m.lucro = m.receitas - m.despesas;
    });

    // Totais gerais
    const totalReceitas = transactions
      .filter((t) => t.type === 'RECEITA')
      .reduce((acc, t) => acc + Number(t.amount), 0);
      
    const totalDespesas = transactions
      .filter((t) => t.type === 'DESPESA')
      .reduce((acc, t) => acc + Number(t.amount), 0);
      
    const lucroLiquido = totalReceitas - totalDespesas;
    const margemLucro = totalReceitas > 0 ? (lucroLiquido / totalReceitas) * 100 : 0;

    return {
      kpis: {
        totalReceitas,
        totalDespesas,
        lucroLiquido,
        margemLucro: Number(margemLucro.toFixed(2)),
      },
      monthlyData: Object.entries(monthlyData).map(([month, values]) => ({
        month,
        ...values,
      })),
      categoryTotals: Object.entries(categoryTotals).map(([category, value]) => ({
        category,
        value,
      })),
    };
  }

  // =================================================================
  // 2️⃣ LISTA DE CLIENTES (Para filtro do DRE)
  // =================================================================
  async getClients(companyId: string) {
    return this.prisma.client.findMany({
      where: { companyId }, // 🔥 CORRIGIDO: era userId
      select: { id: true, companyName: true },
      orderBy: { companyName: 'asc' },
    });
  }

  // =================================================================
  // 3️⃣ PONTO FORA DA CURVA (Detecção de Outliers)
  // =================================================================
  /**
   * Analisa as despesas dos últimos 6 meses e identifica transações
   * que estão MUITO acima da média da sua categoria.
   * 
   * ALGORITMO:
   * 1. Calcula a média de cada categoria de despesa
   * 2. Marca como "outlier" qualquer transação > 150% da média
   * 3. Retorna o impacto financeiro total das anomalias
   */
  async getOutliers(companyId: string) {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const transactions = await this.prisma.financialTransaction.findMany({
      where: {
        companyId, // 🔥 CORRIGIDO: era userId
        type: 'DESPESA',
        date: { gte: sixMonthsAgo },
      },
      orderBy: { date: 'desc' },
    });

    // Calcular média por categoria
    const categoryStats: Record<string, { total: number; count: number; avg: number }> = {};
    
    transactions.forEach((t) => {
      if (!categoryStats[t.category]) {
        categoryStats[t.category] = { total: 0, count: 0, avg: 0 };
      }
      categoryStats[t.category].total += Number(t.amount);
      categoryStats[t.category].count += 1;
    });

    Object.keys(categoryStats).forEach((cat) => {
      categoryStats[cat].avg = categoryStats[cat].total / categoryStats[cat].count;
    });

    // Identificar outliers (> 150% da média)
    const outliers = transactions
      .filter((t) => {
        const avg = categoryStats[t.category].avg;
        return Number(t.amount) > avg * 1.5; 
      })
      .map((t) => {
        const avg = categoryStats[t.category].avg;
        const deviation = ((Number(t.amount) - avg) / avg) * 100;
        
        return {
          id: t.id,
          description: t.description,
          category: t.category,
          amount: Number(t.amount),
          date: t.date,
          average: Number(avg.toFixed(2)),
          deviation: Number(deviation.toFixed(1)),
        };
      });

    const totalOutliers = outliers.length;
    const totalImpact = outliers.reduce((acc, curr) => acc + curr.amount, 0);

    return {
      totalOutliers,
      totalImpact,
      outliers,
    };
  }

  // =================================================================
  // 4️⃣ INDICADORES DE EFICIÊNCIA (KPIs do Escritório)
  // =================================================================
  /**
   * Calcula os principais KPIs de performance do escritório:
   * - MRR (Monthly Recurring Revenue)
   * - Ticket Médio por cliente
   * - Receita por colaborador
   * - Margem líquida do mês atual
   */
  async getIndicators(companyId: string) {
    // 1. Clientes Ativos e MRR
    const activeClientsCount = await this.prisma.client.count({ 
      where: { companyId, status: 'ATIVO' } // 🔥 CORRIGIDO: era userId
    });
    
    const activeClients = await this.prisma.client.findMany({
      where: { companyId, status: 'ATIVO' }, // 🔥 CORRIGIDO: era userId
      select: { monthlyFee: true }
    });
    
    const mrr = activeClients.reduce((acc, curr) => acc + curr.monthlyFee, 0);
    const ticketMedio = activeClientsCount > 0 ? mrr / activeClientsCount : 0;

    // 2. Colaboradores e Folha
    const activeEmployeesCount = await this.prisma.employee.count({ 
      where: { companyId, status: 'ACTIVE' } // 🔥 CORRIGIDO: era userId
    });

    const activeEmployees = await this.prisma.employee.findMany({
      where: { companyId, status: 'ACTIVE' }, // 🔥 CORRIGIDO: era userId
      select: { salary: true }
    });

    const folhaTotal = activeEmployees.reduce((acc, curr) => acc + (curr.salary || 0), 0);
    const receitaPorColaborador = activeEmployeesCount > 0 ? mrr / activeEmployeesCount : 0;

    // 3. Margem Líquida do Mês Atual
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    const transactionsThisMonth = await this.prisma.financialTransaction.findMany({
      where: { companyId, date: { gte: startOfMonth } } // 🔥 CORRIGIDO: era userId
    });
    
    let receitaMes = 0;
    let despesaMes = 0;
    
    transactionsThisMonth.forEach(t => {
      if (t.type === 'RECEITA') receitaMes += Number(t.amount);
      else despesaMes += Number(t.amount);
    });
    
    const margemMes = receitaMes > 0 ? ((receitaMes - despesaMes) / receitaMes) * 100 : 0;

    return {
      mrr,
      ticketMedio,
      activeClientsCount,
      activeEmployeesCount,
      folhaTotal,
      receitaPorColaborador,
      margemMes,
      receitaMes,
      despesaMes
    };
  }

  // =================================================================
  // 5️⃣ SIMULADOR DE REGIMES TRIBUTÁRIOS
  // =================================================================
  /**
   * Compara Simples Nacional vs Lucro Presumido vs Lucro Real
   * e recomenda o regime mais vantajoso com base no faturamento.
   * 
   * BASE LEGAL:
   * - Simples: Tabelas oficiais 2026 (Anexo I e III)
   * - Presumido: Presunção de 8% (comércio) ou 32% (serviços)
   * - Real: Sobre o lucro contábil efetivo
   */
  async simulateTaxRegimes(companyId: string, data: {
    faturamentoAnual: number;
    despesasAnual: number;
    folhaAnual: number;
    atividade: 'COMERCIO' | 'SERVICOS' | 'INDUSTRIA';
  }) {
    const { faturamentoAnual, despesasAnual, folhaAnual, atividade } = data;
    const lucroReal = faturamentoAnual - despesasAnual;

    // --- SIMPLES NACIONAL ---
    const anexoI = [
      { limite: 180000, aliquota: 4.00, deducao: 0 },
      { limite: 360000, aliquota: 7.30, deducao: 5940 },
      { limite: 720000, aliquota: 9.50, deducao: 13860 },
      { limite: 1800000, aliquota: 10.70, deducao: 22500 },
      { limite: 3600000, aliquota: 14.30, deducao: 87300 },
      { limite: 4800000, aliquota: 19.00, deducao: 378000 },
    ];

    const anexoIII = [
      { limite: 180000, aliquota: 6.00, deducao: 0 },
      { limite: 360000, aliquota: 11.20, deducao: 9360 },
      { limite: 720000, aliquota: 13.50, deducao: 17640 },
      { limite: 1800000, aliquota: 16.00, deducao: 35640 },
      { limite: 3600000, aliquota: 21.00, deducao: 125640 },
      { limite: 4800000, aliquota: 33.00, deducao: 900000 },
    ];

    const tabela = atividade === 'COMERCIO' || atividade === 'INDUSTRIA' ? anexoI : anexoIII;
    
    let aliquotaSimples = 0;
    let deducaoSimples = 0;
    
    for (const faixa of tabela) {
      if (faturamentoAnual <= faixa.limite) {
        aliquotaSimples = faixa.aliquota;
        deducaoSimples = faixa.deducao;
        break;
      }
    }
    
    if (faturamentoAnual > tabela[tabela.length - 1].limite) {
      aliquotaSimples = tabela[tabela.length - 1].aliquota;
      deducaoSimples = tabela[tabela.length - 1].deducao;
    }

    const impostoSimples = (faturamentoAnual * (aliquotaSimples / 100)) - deducaoSimples;

    // --- LUCRO PRESUMIDO ---
    const percentualPresuncao = atividade === 'SERVICOS' ? 0.32 : 0.08;
    const basePresumida = faturamentoAnual * percentualPresuncao;

    const irpjBase = basePresumida * 0.15;
    const irpjAdicional = basePresumida > 240000 ? (basePresumida - 240000) * 0.10 : 0;
    const irpjTotal = irpjBase + irpjAdicional;

    const csll = basePresumida * 0.09;
    const pis = faturamentoAnual * 0.0065;
    const cofins = faturamentoAnual * 0.03;
    const iss = atividade === 'SERVICOS' ? faturamentoAnual * 0.05 : 0;

    const impostoPresumido = irpjTotal + csll + pis + cofins + iss;

    // --- LUCRO REAL ---
    const irpjRealBase = Math.max(0, lucroReal) * 0.15;
    const irpjRealAdicional = lucroReal > 240000 ? (lucroReal - 240000) * 0.10 : 0;
    const irpjReal = irpjRealBase + irpjRealAdicional;

    const csllReal = Math.max(0, lucroReal) * 0.09;
    const pisReal = faturamentoAnual * 0.0165;
    const cofinsReal = faturamentoAnual * 0.076;
    const issReal = atividade === 'SERVICOS' ? faturamentoAnual * 0.05 : 0;

    const impostoReal = irpjReal + csllReal + pisReal + cofinsReal + issReal;

    // --- COMPARAÇÃO ---
    const regimes = [
      {
        nome: 'Simples Nacional',
        imposto: Math.max(0, impostoSimples),
        aliquotaEfetiva: faturamentoAnual > 0 ? (Math.max(0, impostoSimples) / faturamentoAnual) * 100 : 0,
        descricao: `Alíquota de ${aliquotaSimples}% com dedução de R$ ${deducaoSimples.toFixed(2)}`,
      },
      {
        nome: 'Lucro Presumido',
        imposto: Math.max(0, impostoPresumido),
        aliquotaEfetiva: faturamentoAnual > 0 ? (Math.max(0, impostoPresumido) / faturamentoAnual) * 100 : 0,
        descricao: `Base presumida de ${(percentualPresuncao * 100)}%`,
      },
      {
        nome: 'Lucro Real',
        imposto: Math.max(0, impostoReal),
        aliquotaEfetiva: faturamentoAnual > 0 ? (Math.max(0, impostoReal) / faturamentoAnual) * 100 : 0,
        descricao: `Sobre lucro real de R$ ${lucroReal.toFixed(2)}`,
      },
    ];

    regimes.sort((a, b) => a.imposto - b.imposto);

    const melhorRegime = regimes[0];
    const piorRegime = regimes[regimes.length - 1];
    const economiaAnual = piorRegime.imposto - melhorRegime.imposto;
    const economiaMensal = economiaAnual / 12;

    return {
      regimes,
      melhorRegime: melhorRegime.nome,
      economiaAnual,
      economiaMensal,
      resumo: {
        faturamentoAnual,
        despesasAnual,
        lucroReal,
        margemLucro: faturamentoAnual > 0 ? (lucroReal / faturamentoAnual) * 100 : 0,
      },
    };
  }

  // =================================================================
  // 6️⃣ SIMULADOR DE REFORMA TRIBUTÁRIA (EC 132/2023)
  // =================================================================
  /**
   * Compara o sistema tributário atual (PIS/COFINS/ICMS/ISS)
   * com o novo sistema da Reforma (CBS + IBS - IVA Dual).
   * 
   * BASE LEGAL:
   * - CBS: 26,5% (federal)
   * - IBS: varia por UF (média 19%)
   * - Transição gradual: 2026-2033
   */
  async simulateTaxReform(companyId: string, data: {
    faturamentoAnual: number;
    despesasComInsumos: number;
    folhaAnual: number;
    setor: 'COMERCIO' | 'SERVICOS' | 'INDUSTRIA';
    estado: string;
  }) {
    const { faturamentoAnual, despesasComInsumos, folhaAnual, setor, estado } = data;

    // --- CENÁRIO ATUAL ---
    const pisCofinsAtual = faturamentoAnual * 0.0925;
    const creditoPisCofins = despesasComInsumos * 0.0925;
    const pisCofinsLiquido = pisCofinsAtual - creditoPisCofins;

    let icmsIssAtual = 0;
    if (setor === 'COMERCIO' || setor === 'INDUSTRIA') {
      icmsIssAtual = faturamentoAnual * 0.18;
    } else {
      icmsIssAtual = faturamentoAnual * 0.05;
    }

    const ipiAtual = setor === 'INDUSTRIA' ? faturamentoAnual * 0.15 : 0;

    const impostoAtualTotal = pisCofinsLiquido + icmsIssAtual + ipiAtual;
    const aliquotaEfetivaAtual = faturamentoAnual > 0 ? (impostoAtualTotal / faturamentoAnual) * 100 : 0;

    // --- CENÁRIO PÓS-REFORMA ---
    const aliquotaCBS = 0.265;
    const cbsBruto = faturamentoAnual * aliquotaCBS;
    const creditoCBS = despesasComInsumos * aliquotaCBS;
    const cbsLiquido = cbsBruto - creditoCBS;

    const aliquotasIBS: Record<string, number> = {
      'SP': 0.195, 'RJ': 0.200, 'MG': 0.190, 'RS': 0.185, 'PR': 0.190,
      'SC': 0.185, 'BA': 0.195, 'PE': 0.190, 'CE': 0.185, 'GO': 0.190,
      'DF': 0.195, 'ES': 0.190, 'MT': 0.185, 'MS': 0.185, 'AM': 0.190,
      'PA': 0.195, 'MA': 0.195, 'PI': 0.195, 'RN': 0.190, 'PB': 0.190,
      'AL': 0.195, 'SE': 0.190, 'RO': 0.190, 'AC': 0.195, 'AP': 0.195,
      'RR': 0.195, 'TO': 0.190,
    };
    const aliquotaIBS = aliquotasIBS[estado] || 0.190;
    
    const ibsBruto = faturamentoAnual * aliquotaIBS;
    const creditoIBS = despesasComInsumos * aliquotaIBS;
    const ibsLiquido = ibsBruto - creditoIBS;

    const impostoReformaTotal = cbsLiquido + ibsLiquido;
    const aliquotaEfetivaReforma = faturamentoAnual > 0 ? (impostoReformaTotal / faturamentoAnual) * 100 : 0;

    // --- COMPARAÇÃO ---
    const diferencaAnual = impostoReformaTotal - impostoAtualTotal;
    const diferencaMensal = diferencaAnual / 12;
    const impactoPercentual = impostoAtualTotal > 0 ? ((diferencaAnual / impostoAtualTotal) * 100) : 0;

    const impactoLabel = diferencaAnual > 0 
      ? 'Aumento de carga tributária' 
      : diferencaAnual < 0 
      ? 'Redução de carga tributária' 
      : 'Neutralidade tributária';

    const impactoColor = diferencaAnual > 0 ? 'vermelho' : diferencaAnual < 0 ? 'verde' : 'neutro';

    // --- CRONOGRAMA DE TRANSIÇÃO (2026-2033) ---
    const anoInicioTransicao = 2026;
    const anoFimTransicao = 2033;
    
    const cronograma = [];
    for (let ano = anoInicioTransicao; ano <= anoFimTransicao; ano++) {
      const progresso = (ano - anoInicioTransicao + 1) / (anoFimTransicao - anoInicioTransicao + 1);
      const aliquotaAno = aliquotaEfetivaAtual + (aliquotaEfetivaReforma - aliquotaEfetivaAtual) * progresso;
      const impostoAno = faturamentoAnual * (aliquotaAno / 100);
      
      cronograma.push({
        ano,
        aliquotaEfetiva: Number(aliquotaAno.toFixed(2)),
        impostoEstimado: Number(impostoAno.toFixed(2)),
        fase: ano === anoInicioTransicao ? 'Início' : ano === anoFimTransicao ? 'Plena vigência' : 'Transição',
      });
    }

    return {
      cenarioAtual: {
        pisCofins: Number(pisCofinsLiquido.toFixed(2)),
        icmsIss: Number(icmsIssAtual.toFixed(2)),
        ipi: Number(ipiAtual.toFixed(2)),
        total: Number(impostoAtualTotal.toFixed(2)),
        aliquotaEfetiva: Number(aliquotaEfetivaAtual.toFixed(2)),
      },
      cenarioReforma: {
        cbs: Number(cbsLiquido.toFixed(2)),
        ibs: Number(ibsLiquido.toFixed(2)),
        aliquotaCBS: aliquotaCBS * 100,
        aliquotaIBS: aliquotaIBS * 100,
        total: Number(impostoReformaTotal.toFixed(2)),
        aliquotaEfetiva: Number(aliquotaEfetivaReforma.toFixed(2)),
      },
      impacto: {
        diferencaAnual: Number(diferencaAnual.toFixed(2)),
        diferencaMensal: Number(diferencaMensal.toFixed(2)),
        impactoPercentual: Number(impactoPercentual.toFixed(2)),
        label: impactoLabel,
        color: impactoColor,
      },
      cronogramaTransicao: cronograma,
      resumo: {
        faturamentoAnual,
        despesasComInsumos,
        setor,
        estado,
      },
    };
  }
}