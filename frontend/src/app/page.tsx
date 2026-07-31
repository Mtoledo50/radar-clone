'use client';

/**
 * =================================================================
 * DASHBOARD EXECUTIVO - Visão Geral do Escritório
 * =================================================================
 * 
 * Este é o "cérebro" visual do sistema. Ele consolida as métricas
 * de TODOS os módulos (Pessoas, Clientes, Precificação, Planejamento)
 * em um único painel executivo com gráficos interativos.
 * 
 * TECNOLOGIAS UTILIZADAS:
 * - Recharts: Biblioteca padrão-ouro para gráficos em React
 * - Promise.all: Busca dados de todos os módulos em paralelo (performance)
 * - Tailwind CSS: Design system responsivo e profissional
 */

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import api from '@/lib/axios';
import {
  Users,
  Briefcase,
  DollarSign,
  Target,
  TrendingUp,
  TrendingDown,
  UserPlus,
  UserMinus,
  Loader2,
  AlertCircle,
  CheckCircle,
  Clock,
  Calendar,
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

// =================================================================
// TIPOS (TypeScript)
// =================================================================
interface EmployeeMetrics {
  totalActive: number;
  totalEmployees: number;
  admissionsThisMonth: number;
  dismissalsThisMonth: number;
  turnoverRate: number;
}

interface ClientMetrics {
  totalActive: number;
  totalClients: number;
  monthlyRevenue: number;
  newClientsThisMonth: number;
  averageTicket: number;
}

interface PricingMetrics {
  totalPricings: number;
  averageFinalValue: number;
}

interface PlanningMetrics {
  totalPlans: number;
  completedPlans: number;
  averageProgress: number;
}

interface Client {
  id: string;
  companyName: string;
  serviceType: string;
  status: string;
}

// =================================================================
// COMPONENTE PRINCIPAL
// =================================================================
export default function DashboardPage() {
  const { user } = useAuthStore();

  // Estados de dados de cada módulo
  const [employeeMetrics, setEmployeeMetrics] = useState<EmployeeMetrics | null>(null);
  const [clientMetrics, setClientMetrics] = useState<ClientMetrics | null>(null);
  const [pricingMetrics, setPricingMetrics] = useState<PricingMetrics | null>(null);
  const [planningMetrics, setPlanningMetrics] = useState<PlanningMetrics | null>(null);
  const [clients, setClients] = useState<Client[]>([]);

  // Estados de UI
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // =================================================================
  // CARREGA TODOS OS DADOS EM PARALELO (Performance máxima)
  // =================================================================
  useEffect(() => {
    loadAllData();
  }, []);

  async function loadAllData() {
    try {
      setLoading(true);
      setError(null);

      // Faz 5 requisições ao mesmo tempo (paralelo)
      const [empRes, cliRes, priRes, plaRes, clientsRes] = await Promise.all([
        api.get('/employees/metrics'),
        api.get('/clients/metrics'),
        api.get('/pricings/metrics'),
        api.get('/plannings/metrics'),
        api.get('/clients'), // Lista completa para o gráfico de pizza
      ]);

      setEmployeeMetrics(empRes.data.data || null);
      setClientMetrics(cliRes.data.data || null);
      setPricingMetrics(priRes.data.data || null);
      setPlanningMetrics(plaRes.data.data || null);
      setClients(clientsRes.data.data || []);
    } catch (err: any) {
      console.error('Erro ao carregar dashboard:', err);
      if (err.response?.status !== 401) {
        setError('Erro ao carregar dados do dashboard. Tente recarregar a página.');
      }
    } finally {
      setLoading(false);
    }
  }

  // =================================================================
  // PROCESSA DADOS PARA O GRÁFICO DE PIZZA (Clientes por Tipo)
  // =================================================================
  const clientServiceData = (() => {
    const count: Record<string, number> = {};
    clients.forEach((c) => {
      if (c.status === 'ATIVO') {
        count[c.serviceType] = (count[c.serviceType] || 0) + 1;
      }
    });
    return Object.entries(count).map(([name, value]) => ({ name, value }));
  })();

  // Cores profissionais para o gráfico
  const CHART_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444'];

  // =================================================================
  // PROCESSA DADOS PARA O GRÁFICO DE BARRAS (Admissões vs Demissões)
  // =================================================================
  const workforceData = [
    {
      name: 'Este Mês',
      Admissões: employeeMetrics?.admissionsThisMonth || 0,
      Demissões: employeeMetrics?.dismissalsThisMonth || 0,
    },
  ];

  // =================================================================
  // SAUDAÇÃO PERSONALIZADA (baseada na hora do dia)
  // =================================================================
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Bom dia';
    if (hour < 18) return 'Boa tarde';
    return 'Boa noite';
  };

  // =================================================================
  // TELA DE CARREGAMENTO
  // =================================================================
  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Loader2 className="h-12 w-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-slate-600 font-medium">Carregando painel executivo...</p>
        </div>
      </div>
    );
  }

  // =================================================================
  // TELA DE ERRO
  // =================================================================
  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center max-w-md">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-slate-900 mb-2">Ops! Algo deu errado</h2>
          <p className="text-slate-600 mb-4">{error}</p>
          <button
            onClick={loadAllData}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  // =================================================================
  // TELA PRINCIPAL DO DASHBOARD
  // =================================================================
  return (
    <div className="max-w-7xl mx-auto">
      {/* CABEÇALHO COM SAUDAÇÃO */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-slate-900 mb-2">
          {getGreeting()}, {user?.name?.split(' ')[0]}! 👋
        </h1>
        <p className="text-slate-600 text-lg">
          Aqui está um resumo do seu escritório hoje,{' '}
          {new Date().toLocaleDateString('pt-BR', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
          })}
          .
        </p>
      </div>

      {/* ============================================================ */}
      {/* SEÇÃO 1: KPIs PRINCIPAIS (4 Cards de Alto Nível) */}
      {/* ============================================================ */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <KpiCard
          icon={Briefcase}
          label="Clientes Ativos"
          value={clientMetrics?.totalActive || 0}
          trend={`${clientMetrics?.newClientsThisMonth || 0} novos este mês`}
          trendType="positive"
          color="blue"
        />
        <KpiCard
          icon={DollarSign}
          label="Faturamento Mensal"
          value={`R$ ${(clientMetrics?.monthlyRevenue || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
          trend={`Ticket médio: R$ ${(clientMetrics?.averageTicket || 0).toFixed(2)}`}
          trendType="neutral"
          color="green"
        />
        <KpiCard
          icon={Users}
          label="Colaboradores"
          value={employeeMetrics?.totalActive || 0}
          trend={`Turnover: ${employeeMetrics?.turnoverRate || 0}%`}
          trendType={(employeeMetrics?.turnoverRate || 0) > 10 ? 'negative' : 'positive'}
          color="purple"
        />
        <KpiCard
          icon={Target}
          label="Metas em Andamento"
          value={planningMetrics?.totalPlans || 0}
          trend={`${planningMetrics?.completedPlans || 0} concluídas`}
          trendType="positive"
          color="orange"
        />
      </div>

      {/* ============================================================ */}
      {/* SEÇÃO 2: GRÁFICOS PRINCIPAIS */}
      {/* ============================================================ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* GRÁFICO DE PIZZA: Clientes por Tipo de Serviço */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="mb-4">
            <h3 className="text-lg font-bold text-slate-900">Carteira por Tipo de Serviço</h3>
            <p className="text-sm text-slate-500">Distribuição dos clientes ativos</p>
          </div>
          {clientServiceData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={clientServiceData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={3}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {clientServiceData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-slate-400">
              <div className="text-center">
                <Briefcase className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>Nenhum cliente ativo cadastrado</p>
              </div>
            </div>
          )}
        </div>

        {/* GRÁFICO DE BARRAS: Admissões vs Demissões */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="mb-4">
            <h3 className="text-lg font-bold text-slate-900">Movimentação de Pessoal</h3>
            <p className="text-sm text-slate-500">Admissões e demissões do mês</p>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={workforceData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="name" stroke="#64748b" />
              <YAxis stroke="#64748b" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                }}
              />
              <Legend />
              <Bar dataKey="Admissões" fill="#10b981" radius={[8, 8, 0, 0]} />
              <Bar dataKey="Demissões" fill="#ef4444" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ============================================================ */}
      {/* SEÇÃO 3: DETALHES OPERACIONAIS */}
      {/* ============================================================ */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {/* Pessoas */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Users className="h-5 w-5 text-purple-600" />
            </div>
            <h3 className="font-bold text-slate-900">Gestão de Pessoas</h3>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-600 flex items-center gap-2">
                <UserPlus className="h-4 w-4 text-green-500" />
                Admissões no mês
              </span>
              <span className="font-bold text-slate-900">{employeeMetrics?.admissionsThisMonth || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-600 flex items-center gap-2">
                <UserMinus className="h-4 w-4 text-red-500" />
                Demissões no mês
              </span>
              <span className="font-bold text-slate-900">{employeeMetrics?.dismissalsThisMonth || 0}</span>
            </div>
            <div className="flex justify-between items-center pt-2 border-t border-slate-100">
              <span className="text-sm text-slate-600">Índice de Turnover</span>
              <span className={`font-bold ${(employeeMetrics?.turnoverRate || 0) > 10 ? 'text-red-600' : 'text-green-600'}`}>
                {employeeMetrics?.turnoverRate || 0}%
              </span>
            </div>
          </div>
        </div>

        {/* Precificação */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-blue-100 rounded-lg">
              <DollarSign className="h-5 w-5 text-blue-600" />
            </div>
            <h3 className="font-bold text-slate-900">Precificação</h3>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-600">Modelos criados</span>
              <span className="font-bold text-slate-900">{pricingMetrics?.totalPricings || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-600">Valor médio</span>
              <span className="font-bold text-slate-900">
                R$ {(pricingMetrics?.averageFinalValue || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex justify-between items-center pt-2 border-t border-slate-100">
              <span className="text-sm text-slate-600">Faturamento recorrente</span>
              <span className="font-bold text-green-600">
                R$ {(clientMetrics?.monthlyRevenue || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>

        {/* Planejamento */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Target className="h-5 w-5 text-orange-600" />
            </div>
            <h3 className="font-bold text-slate-900">Planejamento</h3>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-600 flex items-center gap-2">
                <Clock className="h-4 w-4 text-blue-500" />
                Total de metas
              </span>
              <span className="font-bold text-slate-900">{planningMetrics?.totalPlans || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-600 flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                Metas concluídas
              </span>
              <span className="font-bold text-slate-900">{planningMetrics?.completedPlans || 0}</span>
            </div>
            <div className="pt-2 border-t border-slate-100">
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm text-slate-600">Progresso médio</span>
                <span className="text-sm font-bold text-slate-900">{planningMetrics?.averageProgress || 0}%</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2">
                <div
                  className="bg-orange-500 h-2 rounded-full transition-all"
                  style={{ width: `${Math.min(planningMetrics?.averageProgress || 0, 100)}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* SEÇÃO 4: AÇÕES RÁPIDAS */}
      {/* ============================================================ */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 rounded-xl shadow-sm text-white">
        <h3 className="text-xl font-bold mb-2">Pronto para dar o próximo passo?</h3>
        <p className="text-blue-100 mb-4">
          Acesse os módulos para gerenciar seu escritório com eficiência.
        </p>
        <div className="flex flex-wrap gap-3">
          <a href="/dashboard/clientes" className="px-4 py-2 bg-white text-blue-600 rounded-lg font-semibold hover:bg-blue-50 transition-colors">
            Ver Clientes
          </a>
          <a href="/dashboard/pessoas" className="px-4 py-2 bg-white/10 text-white border border-white/30 rounded-lg font-semibold hover:bg-white/20 transition-colors">
            Gestão de Pessoas
          </a>
          <a href="/dashboard/planejamento" className="px-4 py-2 bg-white/10 text-white border border-white/30 rounded-lg font-semibold hover:bg-white/20 transition-colors">
            Metas e Planejamento
          </a>
        </div>
      </div>
    </div>
  );
}

// =================================================================
// COMPONENTE AUXILIAR: Card de KPI Principal
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
  value: string | number;
  trend: string;
  trendType: 'positive' | 'negative' | 'neutral';
  color: string;
}) {
  const colorClasses: Record<string, string> = {
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    purple: 'bg-purple-100 text-purple-600',
    orange: 'bg-orange-100 text-orange-600',
  };

  const trendColor = {
    positive: 'text-green-600',
    negative: 'text-red-600',
    neutral: 'text-slate-500',
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
          <Icon className="h-6 w-6" />
        </div>
        {trendType === 'positive' && <TrendingUp className="h-5 w-5 text-green-500" />}
        {trendType === 'negative' && <TrendingDown className="h-5 w-5 text-red-500" />}
      </div>
      <div className="text-3xl font-bold text-slate-900 mb-1">{value}</div>
      <div className="text-sm font-medium text-slate-600 mb-1">{label}</div>
      <div className={`text-xs ${trendColor[trendType]}`}>{trend}</div>
    </div>
  );
}