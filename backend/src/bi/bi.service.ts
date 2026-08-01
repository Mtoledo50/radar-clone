import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class BiService {
  constructor(private prisma: PrismaService) {}

  async getDre(userId: string, months: number = 6, clientId?: string) {
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);

    const whereClause: any = {
      userId,
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

    Object.values(monthlyData).forEach((m) => {
      m.lucro = m.receitas - m.despesas;
    });

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

  async getClients(userId: string) {
    return this.prisma.client.findMany({
      where: { userId },
      select: { id: true, companyName: true },
      orderBy: { companyName: 'asc' },
    });
  }

  // =================================================================
  // 🔍 DETECÇÃO DE OUTLIERS (Ponto Fora da Curva)
  // =================================================================
  async getOutliers(userId: string) {
    // 1. Definir período de análise (últimos 6 meses)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    // 2. Buscar todas as despesas do período
    const transactions = await this.prisma.financialTransaction.findMany({
      where: {
        userId,
        type: 'DESPESA',
        date: { gte: sixMonthsAgo },
      },
      orderBy: { date: 'desc' },
    });

    // 3. Calcular a média por categoria
    const categoryStats: Record<string, { total: number; count: number; avg: number }> = {};
    
    transactions.forEach((t) => {
      if (!categoryStats[t.category]) {
        categoryStats[t.category] = { total: 0, count: 0, avg: 0 };
      }
      categoryStats[t.category].total += Number(t.amount);
      categoryStats[t.category].count += 1;
    });

    // Calcular a média final de cada categoria
    Object.keys(categoryStats).forEach((cat) => {
      categoryStats[cat].avg = categoryStats[cat].total / categoryStats[cat].count;
    });

    // 4. Identificar Outliers (Transações > 50% acima da média da categoria)
    // Usamos 1.5 como multiplicador. Se quiser mais rigoroso, use 2.0 (100% acima).
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
          deviation: Number(deviation.toFixed(1)), // Ex: +150.5%
        };
      });

    // 5. Resumo Executivo
    const totalOutliers = outliers.length;
    const totalImpact = outliers.reduce((acc, curr) => acc + curr.amount, 0);

    return {
      totalOutliers,
      totalImpact,
      outliers,
    };
  }
    // =================================================================
  // 📊 INDICADORES DE EFICIÊNCIA (KPIs do Escritório)
  // =================================================================
  async getIndicators(userId: string) {
    // 1. Clientes Ativos e MRR (Monthly Recurring Revenue)
    const activeClientsCount = await this.prisma.client.count({ 
      where: { userId, status: 'ATIVO' } 
    });
    
    const activeClients = await this.prisma.client.findMany({
      where: { userId, status: 'ATIVO' },
      select: { monthlyFee: true }
    });
    
    const mrr = activeClients.reduce((acc, curr) => acc + curr.monthlyFee, 0);
    const ticketMedio = activeClientsCount > 0 ? mrr / activeClientsCount : 0;

    // 2. Colaboradores e Folha
    const activeEmployeesCount = await this.prisma.employee.count({ 
      where: { userId, status: 'ACTIVE' } 
    });

    const activeEmployees = await this.prisma.employee.findMany({
      where: { userId, status: 'ACTIVE' },
      select: { salary: true }
    });

    // Soma os salários (tratando nulos como 0)
    const folhaTotal = activeEmployees.reduce((acc, curr) => acc + (curr.salary || 0), 0);
    const receitaPorColaborador = activeEmployeesCount > 0 ? mrr / activeEmployeesCount : 0;

    // 3. Margem Líquida do Mês Atual
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    const transactionsThisMonth = await this.prisma.financialTransaction.findMany({
      where: { userId, date: { gte: startOfMonth } }
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
  // 💰 SIMULADOR DE REGIMES TRIBUTÁRIOS (Planejamento Tributário)
  // =================================================================
  async simulateTaxRegimes(userId: string, data: {
    faturamentoAnual: number;
    despesasAnual: number;
    folhaAnual: number;
    atividade: 'COMERCIO' | 'SERVICOS' | 'INDUSTRIA';
  }) {
    const { faturamentoAnual, despesasAnual, folhaAnual, atividade } = data;
    const lucroReal = faturamentoAnual - despesasAnual;

    // =================================================================
    // 1. SIMPLES NACIONAL (Tabelas oficiais 2026 - Anexo I, II, III, IV, V)
    // =================================================================
    const faturamentoMensal = faturamentoAnual / 12;
    
    // Anexo I (Comércio) - Alíquotas progressivas
    const anexoI = [
      { limite: 180000, aliquota: 4.00, deducao: 0 },
      { limite: 360000, aliquota: 7.30, deducao: 5940 },
      { limite: 720000, aliquota: 9.50, deducao: 13860 },
      { limite: 1800000, aliquota: 10.70, deducao: 22500 },
      { limite: 3600000, aliquota: 14.30, deducao: 87300 },
      { limite: 4800000, aliquota: 19.00, deducao: 378000 },
    ];

    // Anexo III (Serviços) - Alíquotas progressivas
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
    
    // Última faixa
    if (faturamentoAnual > tabela[tabela.length - 1].limite) {
      aliquotaSimples = tabela[tabela.length - 1].aliquota;
      deducaoSimples = tabela[tabela.length - 1].deducao;
    }

    const impostoSimples = (faturamentoAnual * (aliquotaSimples / 100)) - deducaoSimples;

    // =================================================================
    // 2. LUCRO PRESUMIDO (Alíquotas fixas + adicionais)
    // =================================================================
    // Base de cálculo presumida: 8% para comércio/indústria, 32% para serviços
    const percentualPresuncao = atividade === 'SERVICOS' ? 0.32 : 0.08;
    const basePresumida = faturamentoAnual * percentualPresuncao;

    // IRPJ: 15% + 10% adicional sobre lucro que exceder R$ 240.000/ano (R$ 20.000/mês)
    const irpjBase = basePresumida * 0.15;
    const irpjAdicional = basePresumida > 240000 ? (basePresumida - 240000) * 0.10 : 0;
    const irpjTotal = irpjBase + irpjAdicional;

    // CSLL: 9%
    const csll = basePresumida * 0.09;

    // PIS: 0.65%
    const pis = faturamentoAnual * 0.0065;

    // COFINS: 3.00%
    const cofins = faturamentoAnual * 0.03;

    // ISS (apenas serviços): ~5% sobre faturamento (varia por município)
    const iss = atividade === 'SERVICOS' ? faturamentoAnual * 0.05 : 0;

    const impostoPresumido = irpjTotal + csll + pis + cofins + iss;

    // =================================================================
    // 3. LUCRO REAL (Sobre o lucro contábil efetivo)
    // =================================================================
    // IRPJ: 15% + 10% adicional sobre lucro > R$ 240.000
    const irpjRealBase = Math.max(0, lucroReal) * 0.15;
    const irpjRealAdicional = lucroReal > 240000 ? (lucroReal - 240000) * 0.10 : 0;
    const irpjReal = irpjRealBase + irpjRealAdicional;

    // CSLL: 9% sobre lucro
    const csllReal = Math.max(0, lucroReal) * 0.09;

    // PIS: 1.65% (não-cumulativo)
    const pisReal = faturamentoAnual * 0.0165;

    // COFINS: 7.60% (não-cumulativo)
    const cofinsReal = faturamentoAnual * 0.076;

    // ISS (apenas serviços)
    const issReal = atividade === 'SERVICOS' ? faturamentoAnual * 0.05 : 0;

    const impostoReal = irpjReal + csllReal + pisReal + cofinsReal + issReal;

    // =================================================================
    // 📊 COMPARAÇÃO E RECOMENDAÇÃO
    // =================================================================
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
        descricao: `Base presumida de ${(percentualPresuncao * 100)}% (${atividade === 'SERVICOS' ? 'serviços' : 'comércio/indústria'})`,
      },
      {
        nome: 'Lucro Real',
        imposto: Math.max(0, impostoReal),
        aliquotaEfetiva: faturamentoAnual > 0 ? (Math.max(0, impostoReal) / faturamentoAnual) * 100 : 0,
        descricao: `Sobre lucro real de R$ ${lucroReal.toFixed(2)} (margem: ${faturamentoAnual > 0 ? ((lucroReal / faturamentoAnual) * 100).toFixed(1) : 0}%)`,
      },
    ];

    // Ordenar pelo menor imposto
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
  // ️ SIMULADOR DE REFORMA TRIBUTÁRIA (EC 132/2023)
  // =================================================================
  async simulateTaxReform(userId: string, data: {
    faturamentoAnual: number;
    despesasComInsumos: number; // Compras de mercadorias/serviços com crédito
    folhaAnual: number;
    setor: 'COMERCIO' | 'SERVICOS' | 'INDUSTRIA';
    estado: string; // UF para estimar alíquota do IBS
  }) {
    const { faturamentoAnual, despesasComInsumos, folhaAnual, setor, estado } = data;

    // =================================================================
    // 1. CENÁRIO ATUAL (Sistema vigente em 2026 - transição)
    // =================================================================
    
    // PIS (1,65% não-cumulativo) + COFINS (7,6% não-cumulativo) = 9,25%
    const pisCofinsAtual = faturamentoAnual * 0.0925;
    const creditoPisCofins = despesasComInsumos * 0.0925;
    const pisCofinsLiquido = pisCofinsAtual - creditoPisCofins;

    // ICMS (média 18%) ou ISS (5%) dependendo do setor
    let icmsIssAtual = 0;
    if (setor === 'COMERCIO' || setor === 'INDUSTRIA') {
      icmsIssAtual = faturamentoAnual * 0.18;
    } else {
      icmsIssAtual = faturamentoAnual * 0.05;
    }

    // IPI (apenas indústria, média 15%)
    const ipiAtual = setor === 'INDUSTRIA' ? faturamentoAnual * 0.15 : 0;

    const impostoAtualTotal = pisCofinsLiquido + icmsIssAtual + ipiAtual;
    const aliquotaEfetivaAtual = faturamentoAnual > 0 ? (impostoAtualTotal / faturamentoAnual) * 100 : 0;

    // =================================================================
    // 2. CENÁRIO PÓS-REFORMA (CBS + IBS - IVA Dual)
    // =================================================================
    
    // CBS (Contribuição sobre Bens e Serviços) - Federal
    // Alíquota de referência aprovada: 26,5%
    const aliquotaCBS = 0.265;
    const cbsBruto = faturamentoAnual * aliquotaCBS;
    const creditoCBS = despesasComInsumos * aliquotaCBS;
    const cbsLiquido = cbsBruto - creditoCBS;

    // IBS (Imposto sobre Bens e Serviços) - Estadual/Municipal
    // Alíquota varia por UF. Usaremos uma média realista por região.
    const aliquotasIBS: Record<string, number> = {
      'SP': 0.195, 'RJ': 0.200, 'MG': 0.190, 'RS': 0.185, 'PR': 0.190,
      'SC': 0.185, 'BA': 0.195, 'PE': 0.190, 'CE': 0.185, 'GO': 0.190,
      'DF': 0.195, 'ES': 0.190, 'MT': 0.185, 'MS': 0.185, 'AM': 0.190,
      'PA': 0.195, 'MA': 0.195, 'PI': 0.195, 'RN': 0.190, 'PB': 0.190,
      'AL': 0.195, 'SE': 0.190, 'RO': 0.190, 'AC': 0.195, 'AP': 0.195,
      'RR': 0.195, 'TO': 0.190,
    };
    const aliquotaIBS = aliquotasIBS[estado] || 0.190; // Média nacional fallback
    
    const ibsBruto = faturamentoAnual * aliquotaIBS;
    const creditoIBS = despesasComInsumos * aliquotaIBS;
    const ibsLiquido = ibsBruto - creditoIBS;

    const impostoReformaTotal = cbsLiquido + ibsLiquido;
    const aliquotaEfetivaReforma = faturamentoAnual > 0 ? (impostoReformaTotal / faturamentoAnual) * 100 : 0;

    // =================================================================
    // 3. COMPARAÇÃO E IMPACTO
    // =================================================================
    const diferencaAnual = impostoReformaTotal - impostoAtualTotal;
    const diferencaMensal = diferencaAnual / 12;
    const impactoPercentual = impostoAtualTotal > 0 ? ((diferencaAnual / impostoAtualTotal) * 100) : 0;

    const impactoLabel = diferencaAnual > 0 
      ? 'Aumento de carga tributária' 
      : diferencaAnual < 0 
      ? 'Redução de carga tributária' 
      : 'Neutralidade tributária';

    const impactoColor = diferencaAnual > 0 ? 'vermelho' : diferencaAnual < 0 ? 'verde' : 'neutro';

    // =================================================================
    // 4. CRONOGRAMA DE TRANSIÇÃO (2026-2033)
    // =================================================================
    // A reforma tem transição gradual. Em 2026: 1/9 da alíquota total
    const anoAtual = new Date().getFullYear();
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