'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import api from '@/lib/axios';
import { toast } from 'sonner';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  TrendingUp, TrendingDown, DollarSign, Target, Calendar,
  Building2, Loader2, AlertCircle, Download, Filter,
  ArrowUpRight, ArrowDownRight, BarChart3, Activity,
  Scale, Landmark, AlertTriangle, CheckCircle,
  BookOpen, Wallet, Building,
} from 'lucide-react';

type TabType = 'dre' | 'outliers' | 'indicators' | 'tax' | 'reform';

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

const PALETA = {
  teal: '#0d9488',
  laranja: '#f97316',
  verde: '#10b981',
  vermelho: '#ef4444',
  slate: '#64748b',
};

function KpiCard({ icon: Icon, label, value, trend, trendType, color }: { icon: any; label: string; value: string; trend?: string; trendType?: 'positive' | 'negative' | 'neutral'; color: 'teal' | 'orange' | 'green' | 'red' }) {
  const colorMap = { teal: 'bg-teal-50 text-teal-600', orange: 'bg-orange-50 text-orange-600', green: 'bg-green-50 text-green-600', red: 'bg-red-50 text-red-600' };
  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className={`p-3 rounded-lg ${colorMap[color]}`}><Icon className="h-6 w-6" /></div>
        {trend && (
          <div className={`flex items-center gap-1 text-xs font-medium ${trendType === 'positive' ? 'text-green-600' : trendType === 'negative' ? 'text-red-600' : 'text-slate-500'}`}>
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

function BarChartCSS({ data }: { data: MonthlyData[] }) {
  if (data.length === 0) return <div className="h-[300px] flex items-center justify-center text-slate-400">Sem dados para o período selecionado</div>;
  const maxValue = Math.max(...data.flatMap((d) => [d.receitas, d.despesas]), 1);
  const formatMonth = (month: string) => {
    const [year, m] = month.split('-');
    const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    return `${months[parseInt(m) - 1]}/${year.slice(2)}`;
  };
  const formatCurrency = (value: number) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  const CHART_HEIGHT = 250;

  return (
    <div className="space-y-4">
      <div className="flex items-end justify-around gap-2 border-b border-slate-200 pb-2" style={{ height: `${CHART_HEIGHT}px` }}>
        {data.map((item, idx) => {
          const receitaHeight = (item.receitas / maxValue) * CHART_HEIGHT;
          const despesaHeight = (item.despesas / maxValue) * CHART_HEIGHT;
          return (
            <div key={idx} className="flex flex-col items-center gap-1 flex-1">
              <div className="flex items-end gap-1 w-full justify-center" style={{ height: `${CHART_HEIGHT}px` }}>
                <div className="w-5 sm:w-6 rounded-t transition-all hover:opacity-80 cursor-pointer" style={{ height: `${Math.max(receitaHeight, 4)}px`, backgroundColor: PALETA.teal }} />
                <div className="w-5 sm:w-6 rounded-t transition-all hover:opacity-80 cursor-pointer" style={{ height: `${Math.max(despesaHeight, 4)}px`, backgroundColor: PALETA.laranja }} />
              </div>
              <span className="text-xs font-medium text-slate-600 mt-2">{formatMonth(item.month)}</span>
            </div>
          );
        })}
      </div>
      <div className="flex justify-center gap-6 pt-2">
        <div className="flex items-center gap-2 text-sm"><div className="w-3 h-3 rounded-sm" style={{ backgroundColor: PALETA.teal }} /><span className="text-slate-600">Receitas</span></div>
        <div className="flex items-center gap-2 text-sm"><div className="w-3 h-3 rounded-sm" style={{ backgroundColor: PALETA.laranja }} /><span className="text-slate-600">Despesas</span></div>
      </div>
    </div>
  );
}

function DonutChartCSS({ data }: { data: CategoryTotal[] }) {
  if (data.length === 0) return <div className="h-[300px] flex items-center justify-center text-slate-400">Nenhuma despesa registrada</div>;
  const total = data.reduce((acc, item) => acc + item.value, 0);
  const colors = [PALETA.teal, PALETA.laranja, PALETA.vermelho, PALETA.verde, PALETA.slate, '#8b5cf6'];
  let currentAngle = 0;
  const gradientParts: string[] = [];

  data.forEach((item, index) => {
    const percentage = (item.value / total) * 100;
    gradientParts.push(`${colors[index % colors.length]} ${currentAngle}% ${currentAngle + percentage}%`);
    currentAngle += percentage;
  });

  const formatCurrency = (value: number) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  const translateCategory = (cat: string) => {
    const map: Record<string, string> = { FOLHA: 'Folha de Pagamento', IMPOSTOS: 'Impostos', ALUGUEL: 'Aluguel', SOFTWARE: 'Software', HONORARIOS: 'Honorários', OUTROS: 'Outros' };
    return map[cat] || cat;
  };

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-48 h-48 rounded-full shadow-sm" style={{ background: `conic-gradient(${gradientParts.join(', ')})` }}>
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
          return (
            <div key={item.category} className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: colors[index % colors.length] }} />
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

export default function BIPage() {
  const [activeTab, setActiveTab] = useState<TabType>('dre');
  const tabs = [
    { key: 'dre' as TabType, label: 'DRE do Escritório', icon: Building },
    { key: 'outliers' as TabType, label: 'Ponto Fora da Curva', icon: AlertTriangle },
    { key: 'indicators' as TabType, label: 'Indicadores', icon: Activity },
    { key: 'tax' as TabType, label: 'Simulador Tributário', icon: Scale },
    { key: 'reform' as TabType, label: 'Reforma Tributária', icon: Landmark },
  ];

  return (
    <div className="space-y-6">
      {/* 🆕 Sprint 28: Cabeçalho renomeado */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
            <Building className="h-8 w-8 text-teal-600" />
            DRE do Escritório
          </h1>
          <p className="text-slate-600 mt-1">
            Visão consolidada das receitas, despesas e resultado da <strong>Conta Certa</strong>
            (não dos clientes). Fonte: transações financeiras do escritório.
          </p>
        </div>
      </div>

      {/* 🆕 Sprint 28: Cards de navegação entre os 3 DREs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="bg-white rounded-xl border-2 border-teal-300 p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <Building className="h-4 w-4 text-purple-600" />
            <span className="text-xs font-bold text-purple-700 uppercase tracking-wide">Escritório (atual)</span>
          </div>
          <p className="text-sm font-semibold text-slate-900">DRE do Escritório</p>
          <p className="text-xs text-slate-500 mt-0.5">Fonte: Transações Financeiras</p>
        </div>
        <Link href="/dashboard/bi/dre-cliente" className="bg-white rounded-xl border border-slate-200 p-4 hover:border-teal-400 hover:shadow-sm transition-all">
          <div className="flex items-center gap-2 mb-1">
            <BookOpen className="h-4 w-4 text-teal-600" />
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">Oficial</span>
          </div>
          <p className="text-sm font-semibold text-slate-900">DRE do Cliente</p>
          <p className="text-xs text-slate-500 mt-0.5">Fonte: Lançamentos Contábeis</p>
        </Link>
        <Link href="/dashboard/fechamento" className="bg-white rounded-xl border border-slate-200 p-4 hover:border-teal-400 hover:shadow-sm transition-all">
          <div className="flex items-center gap-2 mb-1">
            <Wallet className="h-4 w-4 text-orange-600" />
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">Bancário</span>
          </div>
          <p className="text-sm font-semibold text-slate-900">DRE do Cliente (Bancário)</p>
          <p className="text-xs text-slate-500 mt-0.5">Fonte: Extrato + Classificação</p>
        </Link>
      </div>

      <div className="flex gap-2 bg-slate-100 p-1 rounded-lg w-fit overflow-x-auto">
        {tabs.map((tab) => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)} className={`flex items-center gap-2 px-4 py-2 rounded-md font-medium transition-colors whitespace-nowrap ${activeTab === tab.key ? 'bg-white text-teal-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}>
            <tab.icon className="h-4 w-4" />{tab.label}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 min-h-[500px]">
        {activeTab === 'dre' && <DreTab />}
        {activeTab === 'outliers' && <OutliersTab />}
        {activeTab === 'indicators' && <IndicatorsTab />}
        {activeTab === 'tax' && <TaxSimulatorTab />}
        {activeTab === 'reform' && <ReformTab />}
      </div>
    </div>
  );
}

// =================================================================
// 📊 ABA 1: DRE DO ESCRITÓRIO
// =================================================================
function DreTab() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [kpis, setKpis] = useState<KPIs | null>(null);
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [categoryTotals, setCategoryTotals] = useState<CategoryTotal[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [filters, setFilters] = useState({ months: 6, clientId: 'all' });
  const inputClass = 'px-3 py-2.5 border border-slate-300 rounded-lg text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all bg-white';

  useEffect(() => { loadClients(); }, []);
  useEffect(() => { loadDRE(); }, [filters]);

  async function loadClients() {
    try {
      const res = await api.get('/bi/clients');
      setClients(res.data.data || []);
    } catch (err) { console.error('Erro ao carregar clientes:', err); }
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

  const formatCurrency = (value: number) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  function exportToPDF() {
    if (!kpis) return;
    const doc = new jsPDF();
    const periodLabels: any = { 3: '3 Meses', 6: '6 Meses', 12: '1 Ano' };
    const currentPeriod = periodLabels[filters.months] || 'Período Personalizado';
    const clientName = filters.clientId === 'all' ? 'Visão Geral (Todos os Clientes)' : clients.find(c => c.id === filters.clientId)?.companyName || 'Cliente Específico';
    const formatMonth = (month: string) => {
      const [year, m] = month.split('-');
      const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
      return `${months[parseInt(m) - 1]}/${year.slice(2)}`;
    };

    doc.setFontSize(18);
    doc.setTextColor(13, 148, 136);
    doc.text('DRE do Escritório - Conta Certa Soluções Empresariais', 14, 20);
    doc.setFontSize(11);
    doc.setTextColor(100, 116, 139);
    doc.text(`Período: ${currentPeriod}`, 14, 28);
    doc.text(`Filtro: ${clientName}`, 14, 34);
    doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}`, 14, 40);

    doc.setFontSize(14);
    doc.setTextColor(15, 23, 42);
    doc.text('Resumo Executivo (KPIs)', 14, 55);

    autoTable(doc, {
      startY: 60,
      head: [['Métrica', 'Valor']],
      body: [
        ['Receita Total', formatCurrency(kpis.totalReceitas)],
        ['Despesas Totais', formatCurrency(kpis.totalDespesas)],
        ['Lucro Líquido', formatCurrency(kpis.lucroLiquido)],
        ['Margem de Lucro', `${kpis.margemLucro}%`],
      ],
      theme: 'striped',
      headStyles: { fillColor: [13, 148, 136] },
      styles: { fontSize: 11, cellPadding: 4 },
    });

    const finalY = (doc as any).lastAutoTable?.finalY || 100;
    doc.setFontSize(14);
    doc.text('Evolução Mensal do Escritório', 14, finalY + 15);

    autoTable(doc, {
      startY: finalY + 20,
      head: [['Mês', 'Receitas', 'Despesas', 'Lucro']],
      body: monthlyData.map(m => ({
        mes: formatMonth(m.month),
        receitas: formatCurrency(m.receitas),
        despesas: formatCurrency(m.despesas),
        lucro: formatCurrency(m.lucro),
      })),
      theme: 'grid',
      headStyles: { fillColor: [13, 148, 136] },
      styles: { fontSize: 10, cellPadding: 3 },
      columnStyles: { 1: { halign: 'right' }, 2: { halign: 'right' }, 3: { halign: 'right', fontStyle: 'bold' } },
    });

    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150);
      doc.text(`Página ${i} de ${pageCount} • Conta Certa Soluções Empresariais`, 14, 285);
    }

    doc.save(`relatorio-dre-escritorio-${new Date().toISOString().split('T')[0]}.pdf`);
    toast.success('Relatório DRE do Escritório exportado em PDF com sucesso!');
  }

  if (loading && !kpis) return <div className="flex flex-col items-center justify-center min-h-[400px]"><Loader2 className="h-12 w-12 text-teal-600 animate-spin mb-4" /><p className="text-slate-600 font-medium">Carregando DRE...</p></div>;
  if (error) return <div className="flex flex-col items-center justify-center min-h-[400px]"><AlertCircle className="h-12 w-12 text-red-500 mb-4" /><p className="text-slate-700 mb-4">{error}</p><button onClick={loadDRE} className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors">Tentar novamente</button></div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Período</label>
            <select value={filters.months} onChange={(e) => setFilters({ ...filters, months: parseInt(e.target.value) })} className={`${inputClass} w-full`}>
              <option value={3}>Últimos 3 meses</option>
              <option value={6}>Últimos 6 meses</option>
              <option value={12}>Último ano</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Cliente</label>
            <select value={filters.clientId} onChange={(e) => setFilters({ ...filters, clientId: e.target.value })} className={`${inputClass} w-full`}>
              <option value="all">Todos os clientes (visão do escritório)</option>
              {clients.map((c) => <option key={c.id} value={c.id}>{c.companyName}</option>)}
            </select>
          </div>
        </div>
        <button onClick={exportToPDF} className="flex items-center gap-2 px-4 py-2.5 bg-slate-700 hover:bg-slate-800 text-white font-semibold rounded-lg transition-colors shadow-sm whitespace-nowrap self-end">
          <Download className="h-5 w-5" /> Exportar PDF
        </button>
      </div>

      {kpis && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard icon={TrendingUp} label="Receita Total" value={formatCurrency(kpis.totalReceitas)} trend={`${filters.months} meses`} trendType="neutral" color="teal" />
          <KpiCard icon={TrendingDown} label="Despesas Totais" value={formatCurrency(kpis.totalDespesas)} trend={`${((kpis.totalDespesas / (kpis.totalReceitas || 1)) * 100).toFixed(1)}% da receita`} trendType="negative" color="orange" />
          <KpiCard icon={DollarSign} label="Lucro Líquido" value={formatCurrency(kpis.lucroLiquido)} trend={kpis.lucroLiquido >= 0 ? 'Positivo' : 'Negativo'} trendType={kpis.lucroLiquido >= 0 ? 'positive' : 'negative'} color={kpis.lucroLiquido >= 0 ? 'green' : 'red'} />
          <KpiCard icon={Target} label="Margem de Lucro" value={`${kpis.margemLucro}%`} trend={kpis.margemLucro >= 20 ? 'Saudável' : 'Atenção'} trendType={kpis.margemLucro >= 20 ? 'positive' : 'negative'} color={kpis.margemLucro >= 20 ? 'green' : 'orange'} />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl border border-slate-200">
          <div className="flex items-center justify-between mb-4"><h3 className="text-lg font-bold text-slate-900">Evolução Mensal do Escritório</h3><Calendar className="h-5 w-5 text-slate-400" /></div>
          <BarChartCSS data={monthlyData} />
        </div>
        <div className="bg-white p-6 rounded-xl border border-slate-200">
          <div className="flex items-center justify-between mb-4"><h3 className="text-lg font-bold text-slate-900">Composição de Despesas</h3><Building2 className="h-5 w-5 text-slate-400" /></div>
          <DonutChartCSS data={categoryTotals} />
        </div>
      </div>

      <div className="bg-gradient-to-br from-teal-600 to-teal-800 p-6 rounded-xl shadow-md text-white">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-white/20 rounded-lg"><AlertCircle className="h-5 w-5" /></div>
          <div>
            <h3 className="text-lg font-bold mb-2">Insight do Contador</h3>
            <p className="text-teal-50 text-sm leading-relaxed">
              {kpis && kpis.margemLucro < 20 ? `Atenção: Sua margem de lucro está em ${kpis.margemLucro}%, abaixo do ideal de 20%. Considere revisar sua precificação.` : kpis && kpis.margemLucro >= 30 ? `Excelente! Sua margem de ${kpis.margemLucro}% está acima da média do mercado.` : `Sua margem de ${kpis?.margemLucro}% está saudável. Continue monitorando as despesas.`}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// =================================================================
// 🚨 ABA 2: PONTO FORA DA CURVA
// =================================================================
function OutliersTab() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);

  useEffect(() => { loadOutliers(); }, []);

  async function loadOutliers() {
    try {
      setLoading(true);
      const res = await api.get('/bi/outliers');
      setData(res.data.data);
    } catch (err) { toast.error('Erro ao carregar outliers'); } finally { setLoading(false); }
  }

  const formatCurrency = (value: number) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  function exportToPDF() {
    if (!data) return;
    const doc = new jsPDF();
    
    doc.setFontSize(18);
    doc.setTextColor(13, 148, 136);
    doc.text('Conta Certa Insights - Ponto Fora da Curva', 14, 20);
    doc.setFontSize(11);
    doc.setTextColor(100, 116, 139);
    doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}`, 14, 30);

    doc.setFontSize(14);
    doc.setTextColor(15, 23, 42);
    doc.text('Resumo Executivo', 14, 45);

    autoTable(doc, {
      startY: 50,
      head: [['Métrica', 'Valor']],
      body: [
        ['Transações Anômalas Detectadas', data.totalOutliers.toString()],
        ['Impacto Financeiro Total', formatCurrency(data.totalImpact)],
        ['Período Analisado', 'Últimos 6 meses'],
      ],
      theme: 'striped',
      headStyles: { fillColor: [239, 68, 68] },
      styles: { fontSize: 11, cellPadding: 4 },
    });

    const finalY = (doc as any).lastAutoTable?.finalY || 80;
    doc.setFontSize(14);
    doc.text('Detalhamento das Anomalias', 14, finalY + 15);

    autoTable(doc, {
      startY: finalY + 20,
      head: [['Descrição', 'Categoria', 'Valor', 'Média', 'Desvio', 'Data']],
      body: data.outliers.map((o: any) => [
        o.description,
        o.category,
        formatCurrency(o.amount),
        formatCurrency(o.average),
        `+${o.deviation}%`,
        new Date(o.date).toLocaleDateString('pt-BR'),
      ]),
      theme: 'grid',
      headStyles: { fillColor: [239, 68, 68] },
      styles: { fontSize: 9, cellPadding: 3 },
      columnStyles: { 2: { halign: 'right' }, 3: { halign: 'right' }, 4: { halign: 'center' } },
    });

    doc.save(`relatorio-bi-outliers-${new Date().toISOString().split('T')[0]}.pdf`);
    toast.success('Relatório de Outliers exportado em PDF!');
  }

  if (loading) return <div className="flex flex-col items-center justify-center min-h-[400px]"><Loader2 className="h-12 w-12 text-teal-600 animate-spin mb-4" /><p className="text-slate-600 font-medium">Analisando despesas...</p></div>;
  if (!data) return null;

  return (
    <div className="space-y-6">
      <div className="flex justify-end mb-4">
        <button onClick={exportToPDF} className="flex items-center gap-2 px-4 py-2.5 bg-slate-700 hover:bg-slate-800 text-white font-semibold rounded-lg transition-colors shadow-sm">
          <Download className="h-5 w-5" /> Exportar PDF
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-red-50 p-6 rounded-xl border-2 border-red-200">
          <AlertTriangle className="h-8 w-8 text-red-600 mb-2" />
          <p className="text-sm font-medium text-red-700 mb-1">Transações Anômalas</p>
          <p className="text-3xl font-bold text-red-900">{data.totalOutliers}</p>
        </div>
        <div className="bg-orange-50 p-6 rounded-xl border-2 border-orange-200">
          <DollarSign className="h-8 w-8 text-orange-600 mb-2" />
          <p className="text-sm font-medium text-orange-700 mb-1">Impacto Financeiro</p>
          <p className="text-3xl font-bold text-orange-900">{formatCurrency(data.totalImpact)}</p>
        </div>
        <div className="bg-teal-50 p-6 rounded-xl border-2 border-teal-200">
          <Target className="h-8 w-8 text-teal-600 mb-2" />
          <p className="text-sm font-medium text-teal-700 mb-1">Período Analisado</p>
          <p className="text-3xl font-bold text-teal-900">6 meses</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50">
          <h3 className="text-lg font-bold text-slate-900">Despesas Acima da Média</h3>
          <p className="text-sm text-slate-600 mt-1">Transações identificadas como anômalas (&gt; 150% da média da categoria)</p>
        </div>
        {data.outliers.length === 0 ? (
          <div className="p-12 text-center">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <p className="text-lg font-medium text-slate-900">Nenhuma anomalia detectada!</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 uppercase">Descrição</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 uppercase">Categoria</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-slate-600 uppercase">Valor</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-slate-600 uppercase">Média</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-slate-600 uppercase">Desvio</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 uppercase">Data</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {data.outliers.map((outlier: any) => (
                  <tr key={outlier.id} className="hover:bg-red-50 transition-colors">
                    <td className="px-4 py-3 text-sm font-medium text-slate-900">{outlier.description}</td>
                    <td className="px-4 py-3 text-sm text-slate-600">{outlier.category}</td>
                    <td className="px-4 py-3 text-sm text-right font-bold text-red-600">{formatCurrency(outlier.amount)}</td>
                    <td className="px-4 py-3 text-sm text-right text-slate-600">{formatCurrency(outlier.average)}</td>
                    <td className="px-4 py-3 text-sm text-right"><span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-bold rounded">+{outlier.deviation}%</span></td>
                    <td className="px-4 py-3 text-sm text-slate-600">{new Date(outlier.date).toLocaleDateString('pt-BR')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// =================================================================
// 📈 ABA 3: INDICADORES DE EFICIÊNCIA
// =================================================================
function IndicatorsTab() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);

  useEffect(() => { loadIndicators(); }, []);

  async function loadIndicators() {
    try {
      setLoading(true);
      const res = await api.get('/bi/indicators');
      setData(res.data.data);
    } catch (err) { toast.error('Erro ao carregar indicadores'); } finally { setLoading(false); }
  }

  const formatCurrency = (value: number) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  function exportToPDF() {
    if (!data) return;
    const doc = new jsPDF();
    
    doc.setFontSize(18);
    doc.setTextColor(13, 148, 136);
    doc.text('Conta Certa Insights - Indicadores de Eficiência', 14, 20);
    doc.setFontSize(11);
    doc.setTextColor(100, 116, 139);
    doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}`, 14, 30);

    doc.setFontSize(14);
    doc.setTextColor(15, 23, 42);
    doc.text('KPIs Operacionais', 14, 45);

    autoTable(doc, {
      startY: 50,
      head: [['Indicador', 'Valor']],
      body: [
        ['MRR (Receita Recorrente)', formatCurrency(data.mrr)],
        ['Ticket Médio', formatCurrency(data.ticketMedio)],
        ['Clientes Ativos', data.activeClientsCount.toString()],
        ['Colaboradores', data.activeEmployeesCount.toString()],
        ['Receita por Colaborador', formatCurrency(data.receitaPorColaborador)],
        ['Margem do Mês', `${data.margemMes.toFixed(1)}%`],
      ],
      theme: 'striped',
      headStyles: { fillColor: [16, 185, 129] },
      styles: { fontSize: 11, cellPadding: 4 },
    });

    const finalY = (doc as any).lastAutoTable?.finalY || 120;
    doc.setFontSize(14);
    doc.text('Resumo do Mês Atual', 14, finalY + 15);

    autoTable(doc, {
      startY: finalY + 20,
      head: [['Métrica', 'Valor']],
      body: [
        ['Receita do Mês', formatCurrency(data.receitaMes)],
        ['Despesa do Mês', formatCurrency(data.despesaMes)],
        ['Folha de Pagamento Total', formatCurrency(data.folhaTotal)],
      ],
      theme: 'grid',
      headStyles: { fillColor: [16, 185, 129] },
      styles: { fontSize: 11, cellPadding: 4, halign: 'right' },
      columnStyles: { 0: { halign: 'left', fontStyle: 'bold' } },
    });

    doc.save(`relatorio-bi-indicadores-${new Date().toISOString().split('T')[0]}.pdf`);
    toast.success('Relatório de Indicadores exportado em PDF!');
  }

  if (loading) return <div className="flex flex-col items-center justify-center min-h-[400px]"><Loader2 className="h-12 w-12 text-teal-600 animate-spin mb-4" /><p className="text-slate-600 font-medium">Calculando indicadores...</p></div>;
  if (!data) return null;

  return (
    <div className="space-y-6">
      <div className="flex justify-end mb-4">
        <button onClick={exportToPDF} className="flex items-center gap-2 px-4 py-2.5 bg-slate-700 hover:bg-slate-800 text-white font-semibold rounded-lg transition-colors shadow-sm">
          <Download className="h-5 w-5" /> Exportar PDF
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <KpiCard icon={DollarSign} label="MRR (Receita Recorrente)" value={formatCurrency(data.mrr)} trend="Mensal" trendType="neutral" color="teal" />
        <KpiCard icon={Target} label="Ticket Médio" value={formatCurrency(data.ticketMedio)} trend="Por cliente" trendType="neutral" color="orange" />
        <KpiCard icon={Building2} label="Clientes Ativos" value={data.activeClientsCount.toString()} color="green" />
        <KpiCard icon={Activity} label="Colaboradores" value={data.activeEmployeesCount.toString()} color="teal" />
        <KpiCard icon={TrendingUp} label="Receita por Colaborador" value={formatCurrency(data.receitaPorColaborador)} trend="Eficiência" trendType="positive" color="green" />
        <KpiCard icon={Target} label="Margem do Mês" value={`${data.margemMes.toFixed(1)}%`} trend={data.margemMes >= 20 ? 'Saudável' : 'Atenção'} trendType={data.margemMes >= 20 ? 'positive' : 'negative'} color={data.margemMes >= 20 ? 'green' : 'orange'} />
      </div>
      <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
        <h3 className="text-lg font-bold text-slate-900 mb-4">Resumo do Mês Atual</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div><p className="text-sm text-slate-600 mb-1">Receita do Mês</p><p className="text-2xl font-bold text-teal-600">{formatCurrency(data.receitaMes)}</p></div>
          <div><p className="text-sm text-slate-600 mb-1">Despesa do Mês</p><p className="text-2xl font-bold text-orange-600">{formatCurrency(data.despesaMes)}</p></div>
          <div><p className="text-sm text-slate-600 mb-1">Folha de Pagamento</p><p className="text-2xl font-bold text-slate-900">{formatCurrency(data.folhaTotal)}</p></div>
        </div>
      </div>
    </div>
  );
}

// =================================================================
// ⚖️ ABA 4: SIMULADOR TRIBUTÁRIO
// =================================================================
function TaxSimulatorTab() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [form, setForm] = useState({ faturamentoAnual: 0, despesasAnual: 0, folhaAnual: 0, atividade: 'SERVICOS' as 'COMERCIO' | 'SERVICOS' | 'INDUSTRIA' });
  const inputClass = 'px-3 py-2.5 border border-slate-300 rounded-lg text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all bg-white w-full';

  async function handleSimulate() {
    if (form.faturamentoAnual <= 0) { toast.error('Informe o faturamento anual'); return; }
    setLoading(true);
    try {
      const res = await api.post('/bi/simulate-tax', form);
      setResult(res.data.data);
    } catch (err) { toast.error('Erro ao simular'); } finally { setLoading(false); }
  }

  const formatCurrency = (value: number) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  function exportToPDF() {
    if (!result) return;
    const doc = new jsPDF();
    
    doc.setFontSize(18);
    doc.setTextColor(13, 148, 136);
    doc.text('Conta Certa Insights - Simulador Tributário', 14, 20);
    doc.setFontSize(11);
    doc.setTextColor(100, 116, 139);
    doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}`, 14, 30);

    doc.setFontSize(14);
    doc.setTextColor(15, 23, 42);
    doc.text('Dados da Simulação', 14, 45);

    autoTable(doc, {
      startY: 50,
      head: [['Parâmetro', 'Valor']],
      body: [
        ['Faturamento Anual', formatCurrency(result.resumo.faturamentoAnual)],
        ['Despesas Anuais', formatCurrency(result.resumo.despesasAnual)],
        ['Lucro Real Estimado', formatCurrency(result.resumo.lucroReal)],
        ['Margem de Lucro', `${result.resumo.margemLucro.toFixed(1)}%`],
      ],
      theme: 'striped',
      headStyles: { fillColor: [13, 148, 136] },
      styles: { fontSize: 11, cellPadding: 4 },
    });

    const finalY = (doc as any).lastAutoTable?.finalY || 90;
    doc.setFontSize(14);
    doc.text('Comparativo de Regimes', 14, finalY + 15);

    autoTable(doc, {
      startY: finalY + 20,
      head: [['Regime', 'Imposto Anual', 'Alíquota Efetiva', 'Descrição']],
      body: result.regimes.map((r: any) => [
        r.nome,
        formatCurrency(r.imposto),
        `${r.aliquotaEfetiva.toFixed(2)}%`,
        r.descricao,
      ]),
      theme: 'grid',
      headStyles: { fillColor: [13, 148, 136] },
      styles: { fontSize: 10, cellPadding: 3 },
      columnStyles: { 1: { halign: 'right' }, 2: { halign: 'center' } },
    });

    const finalY2 = (doc as any).lastAutoTable?.finalY || 150;
    doc.setFontSize(12);
    doc.setTextColor(16, 185, 129);
    doc.text(`✅ Melhor Regime: ${result.melhorRegime}`, 14, finalY2 + 15);
    doc.setFontSize(11);
    doc.setTextColor(100, 116, 139);
    doc.text(`Economia estimada: ${formatCurrency(result.economiaAnual)}/ano (${formatCurrency(result.economiaMensal)}/mês)`, 14, finalY2 + 25);

    doc.save(`relatorio-bi-simulador-tributario-${new Date().toISOString().split('T')[0]}.pdf`);
    toast.success('Simulação Tributária exportada em PDF!');
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-end mb-4">
        <button onClick={exportToPDF} disabled={!result} className="flex items-center gap-2 px-4 py-2.5 bg-slate-700 hover:bg-slate-800 text-white font-semibold rounded-lg transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed">
          <Download className="h-5 w-5" /> Exportar PDF
        </button>
      </div>

      <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
        <h3 className="text-lg font-bold text-slate-900 mb-4">Dados da Simulação</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div><label className="block text-sm font-medium text-slate-700 mb-1">Faturamento Anual (R$)</label><input type="number" value={form.faturamentoAnual || ''} onChange={(e) => setForm({ ...form, faturamentoAnual: parseFloat(e.target.value) || 0 })} className={inputClass} placeholder="Ex: 500000" /></div>
          <div><label className="block text-sm font-medium text-slate-700 mb-1">Despesas Anuais (R$)</label><input type="number" value={form.despesasAnual || ''} onChange={(e) => setForm({ ...form, despesasAnual: parseFloat(e.target.value) || 0 })} className={inputClass} placeholder="Ex: 300000" /></div>
          <div><label className="block text-sm font-medium text-slate-700 mb-1">Folha de Pagamento Anual (R$)</label><input type="number" value={form.folhaAnual || ''} onChange={(e) => setForm({ ...form, folhaAnual: parseFloat(e.target.value) || 0 })} className={inputClass} placeholder="Ex: 120000" /></div>
          <div><label className="block text-sm font-medium text-slate-700 mb-1">Atividade</label><select value={form.atividade} onChange={(e) => setForm({ ...form, atividade: e.target.value as any })} className={inputClass}><option value="SERVICOS">Serviços</option><option value="COMERCIO">Comércio</option><option value="INDUSTRIA">Indústria</option></select></div>
        </div>
        <div className="mt-6 flex justify-end">
          <button onClick={handleSimulate} disabled={loading} className="flex items-center gap-2 px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50">
            {loading && <Loader2 className="h-4 w-4 animate-spin" />} Simular Regimes
          </button>
        </div>
      </div>

      {result && (
        <div className="space-y-6">
          <div className="bg-gradient-to-br from-teal-600 to-teal-800 p-6 rounded-xl shadow-md text-white">
            <h3 className="text-xl font-bold mb-2 flex items-center gap-2"><CheckCircle className="h-6 w-6" /> Melhor Regime: {result.melhorRegime}</h3>
            <p className="text-teal-50">Economia estimada de <span className="font-bold text-white">{formatCurrency(result.economiaAnual)}/ano</span> ({formatCurrency(result.economiaMensal)}/mês) em comparação ao pior cenário.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {result.regimes.map((regime: any) => (
              <div key={regime.nome} className={`p-6 rounded-xl border-2 ${regime.nome === result.melhorRegime ? 'border-teal-500 bg-teal-50' : 'border-slate-200 bg-white'}`}>
                <h4 className="font-bold text-slate-900 text-lg mb-2">{regime.nome}</h4>
                <p className="text-3xl font-bold text-teal-600 mb-2">{formatCurrency(regime.imposto)}</p>
                <p className="text-sm text-slate-600 mb-4">Alíquota efetiva: {regime.aliquotaEfetiva.toFixed(2)}%</p>
                <p className="text-xs text-slate-500 italic">{regime.descricao}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// =================================================================
// 🏛️ ABA 5: REFORMA TRIBUTÁRIA
// =================================================================
function ReformTab() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [form, setForm] = useState({ faturamentoAnual: 0, despesasComInsumos: 0, folhaAnual: 0, setor: 'SERVICOS' as 'COMERCIO' | 'SERVICOS' | 'INDUSTRIA', estado: 'SP' });
  const inputClass = 'px-3 py-2.5 border border-slate-300 rounded-lg text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all bg-white w-full';

  async function handleSimulate() {
    if (form.faturamentoAnual <= 0) { toast.error('Informe o faturamento anual'); return; }
    setLoading(true);
    try {
      const res = await api.post('/bi/simulate-reform', form);
      setResult(res.data.data);
    } catch (err) { toast.error('Erro ao simular reforma'); } finally { setLoading(false); }
  }

  const formatCurrency = (value: number) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  function exportToPDF() {
    if (!result) return;
    const doc = new jsPDF();
    
    doc.setFontSize(18);
    doc.setTextColor(13, 148, 136);
    doc.text('Conta Certa Insights - Reforma Tributária (EC 132/2023)', 14, 20);
    doc.setFontSize(11);
    doc.setTextColor(100, 116, 139);
    doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}`, 14, 30);

    doc.setFontSize(14);
    doc.setTextColor(15, 23, 42);
    doc.text('Impacto da Reforma', 14, 45);

    const impactColor = result.impacto.color === 'verde' ? [16, 185, 129] : result.impacto.color === 'vermelho' ? [239, 68, 68] : [100, 116, 139];
    
    autoTable(doc, {
      startY: 50,
      head: [['Métrica', 'Valor']],
      body: [
        ['Cenário', result.impacto.label],
        ['Diferença Anual', formatCurrency(result.impacto.diferencaAnual)],
        ['Diferença Mensal', formatCurrency(result.impacto.diferencaMensal)],
        ['Impacto Percentual', `${result.impacto.impactoPercentual.toFixed(1)}%`],
      ],
      theme: 'striped',
      headStyles: { fillColor: impactColor },
      styles: { fontSize: 11, cellPadding: 4 },
    });

    const finalY = (doc as any).lastAutoTable?.finalY || 90;
    doc.setFontSize(14);
    doc.text('Comparativo de Cenários', 14, finalY + 15);

    autoTable(doc, {
      startY: finalY + 20,
      head: [['Cenário', 'PIS/COFINS/CBS', 'ICMS/ISS/IBS', 'IPI', 'Total', 'Alíq. Efetiva']],
      body: [
        ['Atual', formatCurrency(result.cenarioAtual.pisCofins), formatCurrency(result.cenarioAtual.icmsIss), formatCurrency(result.cenarioAtual.ipi), formatCurrency(result.cenarioAtual.total), `${result.cenarioAtual.aliquotaEfetiva}%`],
        ['Pós-Reforma', formatCurrency(result.cenarioReforma.cbs), formatCurrency(result.cenarioReforma.ibs), '-', formatCurrency(result.cenarioReforma.total), `${result.cenarioReforma.aliquotaEfetiva}%`],
      ],
      theme: 'grid',
      headStyles: { fillColor: [13, 148, 136] },
      styles: { fontSize: 10, cellPadding: 3, halign: 'right' },
      columnStyles: { 0: { halign: 'left', fontStyle: 'bold' } },
    });

    doc.save(`relatorio-bi-reforma-tributaria-${new Date().toISOString().split('T')[0]}.pdf`);
    toast.success('Simulação da Reforma exportada em PDF!');
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-end mb-4">
        <button onClick={exportToPDF} disabled={!result} className="flex items-center gap-2 px-4 py-2.5 bg-slate-700 hover:bg-slate-800 text-white font-semibold rounded-lg transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed">
          <Download className="h-5 w-5" /> Exportar PDF
        </button>
      </div>

      <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
        <h3 className="text-lg font-bold text-slate-900 mb-4">Dados para Simulação da Reforma (EC 132/2023)</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div><label className="block text-sm font-medium text-slate-700 mb-1">Faturamento Anual (R$)</label><input type="number" value={form.faturamentoAnual || ''} onChange={(e) => setForm({ ...form, faturamentoAnual: parseFloat(e.target.value) || 0 })} className={inputClass} /></div>
          <div><label className="block text-sm font-medium text-slate-700 mb-1">Despesas com Insumos (R$)</label><input type="number" value={form.despesasComInsumos || ''} onChange={(e) => setForm({ ...form, despesasComInsumos: parseFloat(e.target.value) || 0 })} className={inputClass} /></div>
          <div><label className="block text-sm font-medium text-slate-700 mb-1">Setor</label><select value={form.setor} onChange={(e) => setForm({ ...form, setor: e.target.value as any })} className={inputClass}><option value="SERVICOS">Serviços</option><option value="COMERCIO">Comércio</option><option value="INDUSTRIA">Indústria</option></select></div>
          <div><label className="block text-sm font-medium text-slate-700 mb-1">Estado (UF)</label><select value={form.estado} onChange={(e) => setForm({ ...form, estado: e.target.value })} className={inputClass}><option value="SP">São Paulo</option><option value="RJ">Rio de Janeiro</option><option value="MG">Minas Gerais</option><option value="RS">Rio Grande do Sul</option><option value="PR">Paraná</option><option value="SC">Santa Catarina</option><option value="OUTROS">Outros</option></select></div>
        </div>
        <div className="mt-6 flex justify-end">
          <button onClick={handleSimulate} disabled={loading} className="flex items-center gap-2 px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50">
            {loading && <Loader2 className="h-4 w-4 animate-spin" />} Simular Reforma
          </button>
        </div>
      </div>

      {result && (
        <div className="space-y-6">
          <div className={`p-6 rounded-xl shadow-md text-white ${result.impacto.color === 'verde' ? 'bg-gradient-to-br from-green-600 to-green-800' : result.impacto.color === 'vermelho' ? 'bg-gradient-to-br from-red-600 to-red-800' : 'bg-gradient-to-br from-slate-600 to-slate-800'}`}>
            <h3 className="text-xl font-bold mb-2 flex items-center gap-2">{result.impacto.color === 'verde' ? <CheckCircle className="h-6 w-6" /> : <AlertTriangle className="h-6 w-6" />} Impacto: {result.impacto.label}</h3>
            <p className="text-white/90">Diferença anual de <span className="font-bold text-white">{formatCurrency(result.impacto.diferencaAnual)}</span> ({result.impacto.impactoPercentual.toFixed(1)}%)</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-xl border border-slate-200">
              <h4 className="font-bold text-slate-900 mb-4">Cenário Atual</h4>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between"><span className="text-slate-600">PIS/COFINS Líquido</span><span className="font-semibold">{formatCurrency(result.cenarioAtual.pisCofins)}</span></div>
                <div className="flex justify-between"><span className="text-slate-600">ICMS/ISS</span><span className="font-semibold">{formatCurrency(result.cenarioAtual.icmsIss)}</span></div>
                <div className="flex justify-between"><span className="text-slate-600">IPI</span><span className="font-semibold">{formatCurrency(result.cenarioAtual.ipi)}</span></div>
                <div className="border-t border-slate-200 pt-3 flex justify-between font-bold text-slate-900"><span>Total</span><span>{formatCurrency(result.cenarioAtual.total)}</span></div>
                <div className="text-xs text-slate-500 text-right">Alíquota efetiva: {result.cenarioAtual.aliquotaEfetiva}%</div>
              </div>
            </div>
            <div className="bg-white p-6 rounded-xl border border-slate-200">
              <h4 className="font-bold text-slate-900 mb-4">Cenário Pós-Reforma (CBS + IBS)</h4>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between"><span className="text-slate-600">CBS ({result.cenarioReforma.aliquotaCBS}%)</span><span className="font-semibold">{formatCurrency(result.cenarioReforma.cbs)}</span></div>
                <div className="flex justify-between"><span className="text-slate-600">IBS ({result.cenarioReforma.aliquotaIBS}%)</span><span className="font-semibold">{formatCurrency(result.cenarioReforma.ibs)}</span></div>
                <div className="border-t border-slate-200 pt-3 flex justify-between font-bold text-slate-900"><span>Total</span><span>{formatCurrency(result.cenarioReforma.total)}</span></div>
                <div className="text-xs text-slate-500 text-right">Alíquota efetiva: {result.cenarioReforma.aliquotaEfetiva}%</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}