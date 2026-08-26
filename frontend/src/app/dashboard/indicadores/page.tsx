'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/axios';
import { toast } from 'sonner';
import {
  DollarSign, Users, TrendingUp, TrendingDown, Briefcase,
  Loader2, AlertCircle, CheckCircle, Target, Activity
} from 'lucide-react';

// =================================================================
//  PALETA CONTA CERTA
// =================================================================
const PALETA = {
  teal: '#0d9488',
  laranja: '#f97316',
  verde: '#10b981',
  vermelho: '#ef4444',
  slate: '#64748b',
};

// =================================================================
// 🧩 COMPONENTE: Card de KPI
// =================================================================
function KpiCard({
  icon: Icon,
  label,
  value,
  trend,
  trendType,
  color,
}: {
  icon: any;
  label: string;
  value: string;
  trend?: string;
  trendType?: 'positive' | 'negative' | 'neutral';
  color: 'teal' | 'orange' | 'green' | 'red' | 'slate';
}) {
  const colorMap = {
    teal: 'bg-teal-50 text-teal-600',
    orange: 'bg-orange-50 text-orange-600',
    green: 'bg-green-50 text-green-600',
    red: 'bg-red-50 text-red-600',
    slate: 'bg-slate-50 text-slate-600',
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className={`p-3 rounded-lg ${colorMap[color]}`}>
          <Icon className="h-6 w-6" />
        </div>
        {trend && (
          <div
            className={`flex items-center gap-1 text-xs font-medium ${
              trendType === 'positive'
                ? 'text-green-600'
                : trendType === 'negative'
                ? 'text-red-600'
                : 'text-slate-500'
            }`}
          >
            {trendType === 'positive' && <TrendingUp className="h-4 w-4" />}
            {trendType === 'negative' && <TrendingDown className="h-4 w-4" />}
            <span>{trend}</span>
          </div>
        )}
      </div>
      <div className="text-3xl font-bold text-slate-900 mb-1">{value}</div>
      <div className="text-sm font-medium text-slate-600">{label}</div>
    </div>
  );
}

// =================================================================
//  COMPONENTE: Barra de Progresso
// =================================================================
function ProgressBar({ value, max, label, color }: { value: number; max: number; label: string; color: string }) {
  const percentage = Math.min((value / max) * 100, 100);
  
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span className="font-medium text-slate-700">{label}</span>
        <span className="text-slate-600">{percentage.toFixed(0)}%</span>
      </div>
      <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
        <div
          className="h-3 rounded-full transition-all duration-500"
          style={{ width: `${percentage}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}

// =================================================================
// 🚀 PÁGINA PRINCIPAL: Indicadores de Eficiência
// =================================================================
export default function IndicadoresPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        setError(null);
        const res = await api.get('/bi/indicators');
        setData(res.data.data);
      } catch (err) {
        setError('Erro ao carregar indicadores.');
        toast.error('Falha ao carregar dados');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const formatCurrency = (value: number) =>
    value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  //  CLASSE MÁGICA PARA INPUTS (Texto sempre visível)
  const inputClass =
    'w-full px-3 py-2.5 border border-slate-300 rounded-lg text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all bg-white';

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="h-12 w-12 text-teal-600 animate-spin mb-4" />
        <p className="text-slate-600 font-medium">Calculando indicadores...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
        <p className="text-slate-700 mb-4">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
        >
          Tentar novamente
        </button>
      </div>
    );
  }

  // Calcular Health Score (0-100) baseado nos indicadores
  const calculateHealthScore = () => {
    let score = 0;
    
    // Margem de lucro (30 pontos)
    if (data.margemMes >= 30) score += 30;
    else if (data.margemMes >= 20) score += 20;
    else if (data.margemMes >= 10) score += 10;
    
    // Receita por colaborador (30 pontos) - benchmark: R$ 15k+
    if (data.receitaPorColaborador >= 15000) score += 30;
    else if (data.receitaPorColaborador >= 10000) score += 20;
    else if (data.receitaPorColaborador >= 5000) score += 10;
    
    // Clientes ativos (20 pontos) - benchmark: 10+
    if (data.activeClientsCount >= 15) score += 20;
    else if (data.activeClientsCount >= 10) score += 15;
    else if (data.activeClientsCount >= 5) score += 10;
    
    // Folha vs Receita (20 pontos) - ideal: folha < 40% da receita
    const folhaPercent = data.mrr > 0 ? (data.folhaTotal / data.mrr) * 100 : 100;
    if (folhaPercent <= 40) score += 20;
    else if (folhaPercent <= 50) score += 15;
    else if (folhaPercent <= 60) score += 10;
    
    return score;
  };

  const healthScore = calculateHealthScore();
  const getHealthColor = (score: number) => {
    if (score >= 70) return PALETA.verde;
    if (score >= 50) return PALETA.laranja;
    return PALETA.vermelho;
  };

  const getHealthLabel = (score: number) => {
    if (score >= 70) return 'Saudável';
    if (score >= 50) return 'Atenção';
    return 'Crítico';
  };

  const getInsights = () => {
    type Insight = { type: 'success' | 'warning' | 'info'; message: string };
    const insights: Insight[] = [];
    
    if (data.margemMes < 20) {
      insights.push({
        type: 'warning',
        message: `Sua margem de lucro está em ${data.margemMes.toFixed(1)}%. Considere revisar a precificação ou reduzir despesas.`,
      });
    } else if (data.margemMes >= 30) {
      insights.push({
        type: 'success',
        message: `Excelente! Margem de ${data.margemMes.toFixed(1)}% está acima da média do mercado.`,
      });
    }

    const folhaPercent = data.mrr > 0 ? (data.folhaTotal / data.mrr) * 100 : 0;
    if (folhaPercent > 50) {
      insights.push({
        type: 'warning',
        message: `A folha representa ${folhaPercent.toFixed(0)}% da receita. O ideal é manter abaixo de 40%.`,
      });
    }

    if (data.receitaPorColaborador < 10000) {
      insights.push({
        type: 'warning',
        message: `Receita por colaborador está em ${formatCurrency(data.receitaPorColaborador)}. Busque aumentar a eficiência da equipe.`,
      });
    }

    if (data.activeClientsCount < 5) {
      insights.push({
        type: 'info',
        message: 'Você tem poucos clientes ativos. Foque em aquisição para diversificar a receita.',
      });
    }

    return insights;
  };

  const insights = getInsights();

  return (
    <div className="space-y-8">
      {/* CABEÇALHO */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
          <Activity className="h-8 w-8 text-teal-600" />
          Indicadores de Eficiência
        </h1>
        <p className="text-slate-600 mt-2 max-w-3xl">
          Métricas vitais para avaliar a saúde e performance do seu escritório contábil.
        </p>
      </div>

      {/* HEALTH SCORE */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Target className="h-5 w-5 text-teal-600" />
            Health Score do Escritório
          </h2>
          <div className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: getHealthColor(healthScore) }}
            />
            <span className="text-sm font-semibold text-slate-700">
              {getHealthLabel(healthScore)}
            </span>
          </div>
        </div>
        
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="text-5xl font-bold" style={{ color: getHealthColor(healthScore) }}>
              {healthScore}
            </div>
            <div className="text-sm text-slate-600">
              <p>de 100 pontos</p>
              <p className="mt-1">Baseado em margem, eficiência e diversificação</p>
            </div>
          </div>
          
          <div className="w-full bg-slate-200 rounded-full h-4 overflow-hidden">
            <div
              className="h-4 rounded-full transition-all duration-1000"
              style={{ width: `${healthScore}%`, backgroundColor: getHealthColor(healthScore) }}
            />
          </div>
        </div>
      </div>

      {/* KPIs PRINCIPAIS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        <KpiCard
          icon={DollarSign}
          label="MRR (Receita Recorrente)"
          value={formatCurrency(data.mrr)}
          trend={`${data.activeClientsCount} clientes ativos`}
          trendType="neutral"
          color="teal"
        />
        <KpiCard
          icon={Briefcase}
          label="Ticket Médio"
          value={formatCurrency(data.ticketMedio)}
          trend="Por cliente/mês"
          trendType="neutral"
          color="orange"
        />
        <KpiCard
          icon={Users}
          label="Receita por Colaborador"
          value={formatCurrency(data.receitaPorColaborador)}
          trend={`${data.activeEmployeesCount} colaboradores`}
          trendType={data.receitaPorColaborador >= 15000 ? 'positive' : 'negative'}
          color={data.receitaPorColaborador >= 15000 ? 'green' : 'red'}
        />
        <KpiCard
          icon={TrendingDown}
          label="Custo da Folha Total"
          value={formatCurrency(data.folhaTotal)}
          trend={`${data.mrr > 0 ? ((data.folhaTotal / data.mrr) * 100).toFixed(0) : 0}% da receita`}
          trendType={data.folhaTotal / data.mrr <= 0.4 ? 'positive' : 'negative'}
          color={data.folhaTotal / data.mrr <= 0.4 ? 'green' : 'orange'}
        />
        <KpiCard
          icon={TrendingUp}
          label="Margem Líquida do Mês"
          value={`${data.margemMes.toFixed(1)}%`}
          trend={`${formatCurrency(data.receitaMes)} receita`}
          trendType={data.margemMes >= 20 ? 'positive' : 'negative'}
          color={data.margemMes >= 20 ? 'green' : 'red'}
        />
      </div>

      {/* ANÁLISE DETALHADA */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Comparativo Receita vs Despesa */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-teal-600" />
            Receita vs Despesa (Mês Atual)
          </h3>
          
          <div className="space-y-6">
            <ProgressBar
              value={data.receitaMes}
              max={Math.max(data.receitaMes, data.despesaMes)}
              label={`Receita: ${formatCurrency(data.receitaMes)}`}
              color={PALETA.teal}
            />
            <ProgressBar
              value={data.despesaMes}
              max={Math.max(data.receitaMes, data.despesaMes)}
              label={`Despesa: ${formatCurrency(data.despesaMes)}`}
              color={PALETA.laranja}
            />
            
            <div className="pt-4 border-t border-slate-200">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-slate-700">Lucro do Mês:</span>
                <span
                  className="text-xl font-bold"
                  style={{ color: data.receitaMes - data.despesaMes >= 0 ? PALETA.verde : PALETA.vermelho }}
                >
                  {formatCurrency(data.receitaMes - data.despesaMes)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Insights Automáticos */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-teal-600" />
            Insights Automáticos
          </h3>
          
          {insights.length === 0 ? (
            <div className="flex items-center gap-3 p-4 bg-green-50 rounded-lg">
              <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
              <p className="text-sm text-green-800">
                Todos os indicadores estão saudáveis. Continue mantendo a eficiência!
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {insights.map((insight, idx) => (
                <div
                  key={idx}
                  className={`p-4 rounded-lg border ${
                    insight.type === 'success'
                      ? 'bg-green-50 border-green-200'
                      : insight.type === 'warning'
                      ? 'bg-orange-50 border-orange-200'
                      : 'bg-blue-50 border-blue-200'
                  }`}
                >
                  <p
                    className={`text-sm ${
                      insight.type === 'success'
                        ? 'text-green-800'
                        : insight.type === 'warning'
                        ? 'text-orange-800'
                        : 'text-blue-800'
                    }`}
                  >
                    {insight.message}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* DICA DO CONTADOR */}
      <div className="bg-gradient-to-br from-teal-600 to-teal-800 p-6 rounded-xl shadow-md text-white">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-white/20 rounded-lg">
            <Target className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold mb-2">Meta Recomendada</h3>
            <p className="text-teal-50 text-sm leading-relaxed">
              Para escritórios contábeis de alto desempenho, busque manter:
              <br />
              • Margem líquida acima de 30%
              <br />
              • Receita por colaborador acima de R$ 15.000/mês
              <br />
              • Custo de folha abaixo de 40% da receita
              <br />
              • Ticket médio crescente a cada trimestre
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}