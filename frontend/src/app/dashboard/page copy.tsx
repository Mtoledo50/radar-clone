'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import api from '@/lib/axios';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import {
  Building2, Users, UserPlus, TrendingUp, TrendingDown,
  Briefcase, Calculator, Target, Loader2, AlertCircle, ArrowRight
} from 'lucide-react';

//  IMPORTAÇÃO DINÂMICA (ssr: false é CRÍTICO para Recharts no Next.js)
const PieChartComponent = dynamic(
  () => import('@/components/DashboardCharts').then((mod) => mod.PieChartComponent),
  { ssr: false, loading: () => <div className="h-[300px] flex items-center justify-center text-slate-400">Carregando gráfico...</div> }
);

const BarChartComponent = dynamic(
  () => import('@/components/DashboardCharts').then((mod) => mod.BarChartComponent),
  { ssr: false, loading: () => <div className="h-[300px] flex items-center justify-center text-slate-400">Carregando gráfico...</div> }
);

// =================================================================
// 🧩 COMPONENTE: Card de KPI
// =================================================================
interface KpiCardProps {
  icon: React.ElementType;
  label: string;
  value: string | number;
  trend?: string;
  trendType?: 'positive' | 'negative' | 'neutral';
  color: 'teal' | 'orange' | 'green' | 'red';
}

function KpiCard({ icon: Icon, label, value, trend, trendType = 'neutral', color }: KpiCardProps) {
  const colorMap = {
    teal: 'bg-teal-50 text-teal-600',
    orange: 'bg-orange-50 text-orange-600',
    green: 'bg-green-50 text-green-600',
    red: 'bg-red-50 text-red-600',
  };

  const trendColor = {
    positive: 'text-green-600',
    negative: 'text-red-600',
    neutral: 'text-slate-500',
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className={`p-3 rounded-lg ${colorMap[color]}`}>
          <Icon className="h-6 w-6" />
        </div>
        {trend && (
          <div className={`flex items-center gap-1 text-xs font-medium ${trendColor[trendType]}`}>
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
// 🚀 PÁGINA: Dashboard Executivo
// =================================================================
export default function DashboardPage() {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [companyData, setCompanyData] = useState<any>(null);
  const [employeeMetrics, setEmployeeMetrics] = useState<any>(null);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        setError(null);
        console.log('📡 Iniciando carregamento do dashboard...');

        const [companyRes, employeesRes] = await Promise.all([
          api.get('/company').catch(() => null),
          api.get('/employees/metrics').catch(() => null),
        ]);

        console.log('📊 Dados da empresa:', companyRes?.data?.data);
        console.log('📊 Métricas de funcionários:', employeesRes?.data?.data);

        setCompanyData(companyRes?.data?.data || null);
        setEmployeeMetrics(employeesRes?.data?.data || null);
      } catch (err) {
        console.error(' Erro ao carregar dashboard:', err);
        setError('Não foi possível carregar os dados.');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Bom dia';
    if (hour < 18) return 'Boa tarde';
    return 'Boa noite';
  };

  const currentDate = new Date().toLocaleDateString('pt-BR', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });

  // 🔥 Preparação dos dados dos gráficos (com fallback seguro)
  const softwareData = companyData
    ? [
        { name: 'Consultoria', value: companyData.softwareConsultoria ? 1 : 0 },
        { name: 'Contábil', value: companyData.softwareContabil ? 1 : 0 },
        { name: 'Fiscal', value: companyData.softwareFiscal ? 1 : 0 },
      ].filter((item) => item.value > 0)
    : [];

  const workforceData = employeeMetrics
    ? [{
        name: 'Este Mês',
        Admissões: employeeMetrics.admissionsThisMonth || 0,
        Demissões: employeeMetrics.dismissalsThisMonth || 0,
      }]
    : [{ name: 'Este Mês', Admissões: 0, Demissões: 0 }];

  console.log('🥧 softwareData:', softwareData);
  console.log('📊 workforceData:', workforceData);

  const quickActions = [
    { title: 'Minha Empresa', description: 'Dados e configurações', icon: Building2, href: '/dashboard/minha-empresa', color: 'bg-teal-50 text-teal-600 hover:bg-teal-100' },
    { title: 'Gestão de Pessoas', description: 'Colaboradores e turnover', icon: Users, href: '/dashboard/pessoas', color: 'bg-orange-50 text-orange-600 hover:bg-orange-100' },
    { title: 'Clientes', description: 'Carteira de clientes', icon: Briefcase, href: '/dashboard/clientes', color: 'bg-teal-50 text-teal-600 hover:bg-teal-100' },
    { title: 'Precificação', description: 'Modelos e valores', icon: Calculator, href: '/dashboard/precificacao', color: 'bg-orange-50 text-orange-600 hover:bg-orange-100' },
    { title: 'Planejamento', description: 'Metas e estratégias', icon: Target, href: '/dashboard/planejamento', color: 'bg-teal-50 text-teal-600 hover:bg-teal-100' },
  ];

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="h-12 w-12 text-teal-600 animate-spin mb-4" />
        <p className="text-slate-600 font-medium">Carregando seu dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6 flex items-start gap-4">
        <AlertCircle className="h-6 w-6 text-red-600 flex-shrink-0 mt-1" />
        <div>
          <h3 className="font-semibold text-red-900 mb-1">Ops! Algo deu errado</h3>
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* CABEÇALHO */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">{getGreeting()}, {user?.name || 'Usuário'}! 👋</h1>
          <p className="text-slate-600 mt-1 capitalize">{currentDate}</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-teal-50 rounded-lg">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          <span className="text-sm font-medium text-teal-700">Sistema ativo</span>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <KpiCard icon={Briefcase} label="Clientes Ativos" value={companyData?.clientesHoje || 0} trend={`${companyData?.clientesAno || 0} meta anual`} trendType="neutral" color="teal" />
        <KpiCard icon={Users} label="Colaboradores" value={employeeMetrics?.totalActive || 0} trend={`${employeeMetrics?.totalEmployees || 0} no total`} trendType="neutral" color="orange" />
        <KpiCard icon={UserPlus} label="Admissões (mês)" value={employeeMetrics?.admissionsThisMonth || 0} trend="Novas contratações" trendType="positive" color="green" />
        <KpiCard icon={TrendingDown} label="Taxa de Turnover" value={`${(employeeMetrics?.turnoverRate || 0).toFixed(1)}%`} trend="Índice de rotatividade" trendType={(employeeMetrics?.turnoverRate || 0) > 5 ? 'negative' : 'positive'} color="red" />
      </div>

      {/* GRÁFICOS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h3 className="text-lg font-bold text-slate-900 mb-4">Softwares Utilizados</h3>
          <PieChartComponent data={softwareData} />
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h3 className="text-lg font-bold text-slate-900 mb-4">Movimentação de Pessoal</h3>
          <BarChartComponent data={workforceData} />
        </div>
      </div>

      {/* AÇÕES RÁPIDAS */}
      <div>
        <h2 className="text-xl font-bold text-slate-900 mb-4">Acesso Rápido</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Link key={action.href} href={action.href} className={`p-4 rounded-xl border border-slate-200 transition-all hover:shadow-md ${action.color}`}>
                <Icon className="h-6 w-6 mb-2" />
                <h4 className="font-semibold text-sm">{action.title}</h4>
                <p className="text-xs opacity-75 mt-1">{action.description}</p>
                <ArrowRight className="h-4 w-4 mt-3 opacity-50" />
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}