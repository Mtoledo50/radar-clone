'use client';

/**
 * =================================================================
 * 📊 CONTA CERTA INSIGHTS - BI Contábil (DRE Gerencial)
 * =================================================================
 * 
 * CARACTERÍSTICAS:
 * - DRE Gerencial Visual (Receitas vs Despesas vs Lucro)
 * - Gráficos 100% CSS/Tailwind (zero dependências problemáticas)
 * - Filtros por período e cliente
 * - Identidade visual Conta Certa (Teal/Laranja)
 * - Inputs com texto 100% visível
 */

import { useState, useEffect } from 'react';
import api from '@/lib/axios';
import { toast } from 'sonner';
import {
  TrendingUp, TrendingDown, DollarSign, Target, Calendar,
  Building2, Loader2, AlertCircle, Download, Filter,
  ArrowUpRight, ArrowDownRight
} from 'lucide-react';

// =================================================================
// 🎨 PALETA CONTA CERTA
// =================================================================
const PALETA = {
  teal: '#0d9488',
  tealClaro: '#14b8a6',
  laranja: '#f97316',
  laranjaClaro: '#fb923c',
  vermelho: '#ef4444',
  verde: '#10b981',
  slate: '#64748b',
};

// =================================================================
// 🧩 TIPOS
// =================================================================
interface KPIs {
  totalReceitas: number;
  totalDespesas: number;
  lucroLiquido: number;
  margemLucro: number;
}

interface MonthlyData {
  month: string;
  receitas: number;
  despesas: number;
  lucro: number;
}

interface CategoryTotal {
  category: string;
  value: number;
}

interface Client {
  id: string;
  companyName: string;
}

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
  color: 'teal' | 'orange' | 'green' | 'red';
}) {
  const colorMap = {
    teal: 'bg-teal-50 text-teal-600',
    orange: 'bg-orange-50 text-orange-600',
    green: 'bg-green-50 text-green-600',
    red: 'bg-red-50 text-red-600',
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
            {trendType === 'positive' && <ArrowUpRight className="h-4 w-4" />}
            {trendType === 'negative' && <ArrowDownRight className="h-4 w-4" />}
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
// 🧩 COMPONENTE: Gráfico de Barras (CSS Puro - Versão Corrigida)
// =================================================================
function BarChartCSS({ data }: { data: MonthlyData[] }) {
  if (data.length === 0) {
    return (
      <div className="h-[300px] flex items-center justify-center text-slate-400">
        Sem dados para o período selecionado
      </div>
    );
  }

  const maxValue = Math.max(...data.flatMap((d) => [d.receitas, d.despesas]), 1);

  const formatMonth = (month: string) => {
    const [year, m] = month.split('-');
    const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    return `${months[parseInt(m) - 1]}/${year.slice(2)}`;
  };

  const formatCurrency = (value: number) =>
    value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  //  Altura fixa do gráfico em pixels
  const CHART_HEIGHT = 250;

  return (
    <div className="space-y-4">
      {/* Barras */}
      <div className="flex items-end justify-around gap-2 border-b border-slate-200 pb-2" style={{ height: `${CHART_HEIGHT}px` }}>
        {data.map((item, idx) => {
          const receitaHeight = (item.receitas / maxValue) * CHART_HEIGHT;
          const despesaHeight = (item.despesas / maxValue) * CHART_HEIGHT;

          return (
            <div key={idx} className="flex flex-col items-center gap-1 flex-1">
              <div className="flex items-end gap-1 w-full justify-center" style={{ height: `${CHART_HEIGHT}px` }}>
                {/* Barra Receitas */}
                <div
                  className="w-5 sm:w-6 rounded-t transition-all hover:opacity-80 cursor-pointer"
                  style={{
                    height: `${Math.max(receitaHeight, 4)}px`,
                    backgroundColor: PALETA.teal,
                  }}
                  title={`Receita: ${formatCurrency(item.receitas)}`}
                />
                {/* Barra Despesas */}
                <div
                  className="w-5 sm:w-6 rounded-t transition-all hover:opacity-80 cursor-pointer"
                  style={{
                    height: `${Math.max(despesaHeight, 4)}px`,
                    backgroundColor: PALETA.laranja,
                  }}
                  title={`Despesa: ${formatCurrency(item.despesas)}`}
                />
              </div>
              <span className="text-xs font-medium text-slate-600 mt-2">
                {formatMonth(item.month)}
              </span>
            </div>
          );
        })}
      </div>

      {/* Legenda */}
      <div className="flex justify-center gap-6 pt-2">
        <div className="flex items-center gap-2 text-sm">
          <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: PALETA.teal }} />
          <span className="text-slate-600">Receitas</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: PALETA.laranja }} />
          <span className="text-slate-600">Despesas</span>
        </div>
      </div>
    </div>
  );
}
// =================================================================
// 🧩 COMPONENTE: Gráfico de Rosca (CSS Puro - conic-gradient)
// =================================================================
function DonutChartCSS({ data }: { data: CategoryTotal[] }) {
  if (data.length === 0) {
    return (
      <div className="h-[300px] flex items-center justify-center text-slate-400">
        Nenhuma despesa registrada
      </div>
    );
  }

  const total = data.reduce((acc, item) => acc + item.value, 0);
  const colors = [PALETA.teal, PALETA.laranja, PALETA.vermelho, PALETA.verde, PALETA.slate, '#8b5cf6'];

  let currentAngle = 0;
  const gradientParts: string[] = [];

  data.forEach((item, index) => {
    const percentage = (item.value / total) * 100;
    const color = colors[index % colors.length];
    gradientParts.push(`${color} ${currentAngle}% ${currentAngle + percentage}%`);
    currentAngle += percentage;
  });

  const conicGradient = `conic-gradient(${gradientParts.join(', ')})`;
  const formatCurrency = (value: number) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const translateCategory = (cat: string) => {
    const map: Record<string, string> = {
      FOLHA: 'Folha de Pagamento',
      IMPOSTOS: 'Impostos',
      ALUGUEL: 'Aluguel',
      SOFTWARE: 'Software',
      HONORARIOS: 'Honorários',
      OUTROS: 'Outros',
    };
    return map[cat] || cat;
  };

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-48 h-48 rounded-full shadow-sm" style={{ background: conicGradient }}>
        <div className="absolute inset-4 bg-white rounded-full flex items-center justify-center shadow-inner">
          <div className="text-center">
            <span className="block text-2xl font-bold text-slate-900">{formatCurrency(total)}</span>
            <span className="text-xs text-slate-500 font-medium">Total</span>
          </div>
        </div>
      </div>

      <div className="mt-6 w-full space-y-2">
        {data.map((item, index) => {
          const percentage = ((item.value / total) * 100).toFixed(1);
          const color = colors[index % colors.length];
          return (
            <div key={item.category} className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
                <span className="text-slate-700 font-medium">{translateCategory(item.category)}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-slate-500 text-xs">{percentage}%</span>
                <span className="text-slate-900 font-semibold">{formatCurrency(item.value)}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// =================================================================
// 🚀 PÁGINA PRINCIPAL: Conta Certa Insights
// =================================================================
export default function BIPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [kpis, setKpis] = useState<KPIs | null>(null);
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [categoryTotals, setCategoryTotals] = useState<CategoryTotal[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [filters, setFilters] = useState({ months: 6, clientId: 'all' });

  // 🔥 CLASSE MÁGICA PARA INPUTS (Texto sempre visível)
  const inputClass =
    'px-3 py-2.5 border border-slate-300 rounded-lg text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all bg-white';

  useEffect(() => {
    loadClients();
  }, []);

  useEffect(() => {
    loadDRE();
  }, [filters]);

  async function loadClients() {
    try {
      const res = await api.get('/bi/clients');
      setClients(res.data.data || []);
    } catch (err) {
      console.error('Erro ao carregar clientes:', err);
    }
  }

  async function loadDRE() {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get(`/bi/dre?months=${filters.months}&clientId=${filters.clientId}`);
      const data = res.data.data;
      setKpis(data.kpis);
      setMonthlyData(data.monthlyData);
      setCategoryTotals(data.categoryTotals);
    } catch (err) {
      setError('Erro ao carregar dados do BI.');
      toast.error('Falha ao carregar dados');
    } finally {
      setLoading(false);
    }
  }

  const formatCurrency = (value: number) =>
    value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  if (loading && !kpis) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="h-12 w-12 text-teal-600 animate-spin mb-4" />
        <p className="text-slate-600 font-medium">Carregando insights...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
        <p className="text-slate-700 mb-4">{error}</p>
        <button onClick={loadDRE} className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors">
          Tentar novamente
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* CABEÇALHO */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Conta Certa Insights</h1>
          <p className="text-slate-600 mt-1">Business Intelligence para decisões estratégicas do seu escritório.</p>
        </div>
        <button
          onClick={() => toast.info('Exportação em PDF em desenvolvimento')}
          className="flex items-center gap-2 px-4 py-2.5 bg-slate-700 hover:bg-slate-800 text-white font-semibold rounded-lg transition-colors shadow-sm"
        >
          <Download className="h-5 w-5" />
          Exportar PDF
        </button>
      </div>

      {/* FILTROS */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
        <div className="flex items-center gap-2 mb-3">
          <Filter className="h-5 w-5 text-teal-600" />
          <span className="font-semibold text-slate-900">Filtros</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Período</label>
            <select
              value={filters.months}
              onChange={(e) => setFilters({ ...filters, months: parseInt(e.target.value) })}
              className={`${inputClass} w-full`}
            >
              <option value={3}>Últimos 3 meses</option>
              <option value={6}>Últimos 6 meses</option>
              <option value={12}>Último ano</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Cliente</label>
            <select
              value={filters.clientId}
              onChange={(e) => setFilters({ ...filters, clientId: e.target.value })}
              className={`${inputClass} w-full`}
            >
              <option value="all">Todos os clientes (visão do escritório)</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.companyName}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* KPIs */}
      {kpis && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard
            icon={TrendingUp}
            label="Receita Total"
            value={formatCurrency(kpis.totalReceitas)}
            trend={`${filters.months} meses`}
            trendType="neutral"
            color="teal"
          />
          <KpiCard
            icon={TrendingDown}
            label="Despesas Totais"
            value={formatCurrency(kpis.totalDespesas)}
            trend={`${((kpis.totalDespesas / (kpis.totalReceitas || 1)) * 100).toFixed(1)}% da receita`}
            trendType="negative"
            color="orange"
          />
          <KpiCard
            icon={DollarSign}
            label="Lucro Líquido"
            value={formatCurrency(kpis.lucroLiquido)}
            trend={kpis.lucroLiquido >= 0 ? 'Positivo' : 'Negativo'}
            trendType={kpis.lucroLiquido >= 0 ? 'positive' : 'negative'}
            color={kpis.lucroLiquido >= 0 ? 'green' : 'red'}
          />
          <KpiCard
            icon={Target}
            label="Margem de Lucro"
            value={`${kpis.margemLucro}%`}
            trend={kpis.margemLucro >= 20 ? 'Saudável' : 'Atenção'}
            trendType={kpis.margemLucro >= 20 ? 'positive' : 'negative'}
            color={kpis.margemLucro >= 20 ? 'green' : 'orange'}
          />
        </div>
      )}

      {/* GRÁFICOS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-slate-900">Evolução Mensal (DRE)</h3>
            <Calendar className="h-5 w-5 text-slate-400" />
          </div>
          <BarChartCSS data={monthlyData} />
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-slate-900">Composição de Despesas</h3>
            <Building2 className="h-5 w-5 text-slate-400" />
          </div>
          <DonutChartCSS data={categoryTotals} />
        </div>
      </div>

      {/* DICA DO CONTADOR */}
      <div className="bg-gradient-to-br from-teal-600 to-teal-800 p-6 rounded-xl shadow-md text-white">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-white/20 rounded-lg">
            <AlertCircle className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold mb-2">Insight do Contador</h3>
            <p className="text-teal-50 text-sm leading-relaxed">
              {kpis && kpis.margemLucro < 20
                ? `Atenção: Sua margem de lucro está em ${kpis.margemLucro}%, abaixo do ideal de 20% para escritórios contábeis. Considere revisar sua precificação ou reduzir despesas operacionais.`
                : kpis && kpis.margemLucro >= 30
                ? `Excelente! Sua margem de ${kpis.margemLucro}% está acima da média do mercado. Mantenha o foco na eficiência operacional para sustentar esse resultado.`
                : `Sua margem de ${kpis?.margemLucro}% está saudável. Continue monitorando as despesas e buscando oportunidades de otimização tributária para seus clientes.`}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}