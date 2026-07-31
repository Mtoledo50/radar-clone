'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import api from '@/lib/axios';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import {
  Building2, Users, UserPlus, TrendingUp, TrendingDown,
  Briefcase, Calculator, Target, Loader2, AlertCircle, ArrowRight,
  CheckCircle2 // 🔥 Adicionado para o ícone de status
} from 'lucide-react';

// =================================================================
// 📊 IMPORTAÇÃO DINÂMICA DOS GRÁFICOS (Mantendo o que já funciona!)
// =================================================================
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
// 🚀 PÁGINA: Dashboard Executivo (Versão Integrada e Completa)
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

        const [companyRes, employeesRes] = await Promise.all([
          api.get('/company').catch(() => null),
          api.get('/employees/metrics').catch(() => null),
        ]);

        setCompanyData(companyRes?.data?.data || null);
        setEmployeeMetrics(employeesRes?.data?.data || null);
      } catch (err) {
        console.error('Erro ao carregar dashboard:', err);
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
      {/* 1. CABEÇALHO */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">{getGreeting()}, {user?.name || 'Usuário'}! 👋</h1>
          <p className="text-slate-600 mt-1 capitalize">{currentDate}</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-teal-50 border border-teal-100 rounded-lg">
          <div className="w-2 h-2 bg-teal-500 rounded-full animate-pulse" />
          <span className="text-sm font-medium text-teal-700">Sistema ativo e sincronizado</span>
        </div>
      </div>

      {/* 2. CARDS DE KPI */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <KpiCard icon={Briefcase} label="Clientes Ativos" value={companyData?.clientesHoje || 0} trend={`${companyData?.clientesAno || 0} meta anual`} trendType="neutral" color="teal" />
        <KpiCard icon={Users} label="Colaboradores" value={employeeMetrics?.totalActive || 0} trend={`${employeeMetrics?.totalEmployees || 0} no total`} trendType="neutral" color="orange" />
        <KpiCard icon={UserPlus} label="Admissões (mês)" value={employeeMetrics?.admissionsThisMonth || 0} trend="Novas contratações" trendType="positive" color="green" />
        <KpiCard icon={TrendingDown} label="Taxa de Turnover" value={`${(employeeMetrics?.turnoverRate || 0).toFixed(1)}%`} trend="Índice de rotatividade" trendType={(employeeMetrics?.turnoverRate || 0) > 5 ? 'negative' : 'positive'} color="red" />
      </div>

      {/* 3. NOVA SEÇÃO: STATUS DOS MÓDULOS E PRÓXIMOS PASSOS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Card de Status dos Módulos */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-teal-600" />
            Status dos Módulos
          </h3>
          <div className="space-y-4">
            {[
              { name: 'Autenticação e Segurança', status: 'Operacional', color: 'bg-green-500' },
              { name: 'Banco de Dados', status: 'Operacional', color: 'bg-green-500' },
              { name: 'Gestão de Pessoas', status: 'Configurado', color: 'bg-teal-500' },
              { name: 'Módulo de Precificação', status: 'Pendente', color: 'bg-slate-300' },
            ].map((item, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <span className="text-sm font-medium text-slate-700">{item.name}</span>
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${item.color}`} />
                  <span className="text-xs font-semibold text-slate-600">{item.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Card de Próximos Passos */}
        <div className="bg-gradient-to-br from-teal-600 to-teal-800 p-6 rounded-xl shadow-md text-white flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-bold mb-2">Próximos Passos Recomendados</h3>
            <p className="text-teal-100 text-sm mb-6">Complete o cadastro da sua empresa para desbloquear relatórios avançados.</p>
            
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-xs font-bold">1</div>
                <span className="text-sm">Preencher dados da "Minha Empresa"</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-xs font-bold">2</div>
                <span className="text-sm">Cadastrar primeiros colaboradores</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-xs font-bold">3</div>
                <span className="text-sm">Configurar modelos de precificação</span>
              </div>
            </div>
          </div>

          <Link 
            href="/dashboard/minha-empresa"
            className="mt-6 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-white text-teal-700 font-semibold rounded-lg hover:bg-teal-50 transition-colors text-sm w-full sm:w-auto"
          >
            Começar agora <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>

      {/* 4. GRÁFICOS (Seu código funcional mantido intacto) */}
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

      {/* 5. AÇÕES RÁPIDAS */}
      <div>
        <h2 className="text-xl font-bold text-slate-900 mb-4">Acesso Rápido</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Link
                key={action.href}
                href={action.href}
                className={`p-4 rounded-xl border border-slate-200 transition-all hover:shadow-md hover:-translate-y-1 ${action.color}`}
              >
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