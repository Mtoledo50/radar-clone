// =================================================================
// INÍCIO: frontend/src/app/dashboard/admin/page.tsx
// =================================================================
// 🛡️ ADMIN OVERVIEW — Dashboard Executivo
// Visão geral do sistema com KPIs do catálogo, clientes e propostas.
// =================================================================
'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/axios';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import {
  Shield, Users, Package, Crown, Folder, TrendingUp,
  DollarSign, FileText, ArrowRight, Loader2, Activity,
  BarChart3, Target, Sparkles
} from 'lucide-react';

// =================================================================
// 📋 TIPOS E INTERFACES
// =================================================================

interface DashboardData {
  totalClients: number;
  activeClients: number;
  churnClients: number;
  monthlyRevenue: number;
  totalCategories: number;
  totalServices: number;
  totalPlans: number;
  totalProposals: number;
  wonProposals: number;
  servicesByCategory: { categoryName: string; count: number }[];
  topServices: { name: string; usageCount: number }[];
}

// =================================================================
// 🎯 COMPONENTE PRINCIPAL
// =================================================================
export default function AdminOverviewPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<DashboardData>({
    totalClients: 0,
    activeClients: 0,
    churnClients: 0,
    monthlyRevenue: 0,
    totalCategories: 0,
    totalServices: 0,
    totalPlans: 0,
    totalProposals: 0,
    wonProposals: 0,
    servicesByCategory: [],
    topServices: [],
  });

  // =================================================================
  // CARREGAR DADOS
  // =================================================================
  useEffect(() => {
    loadDashboardData();
  }, []);

  async function loadDashboardData() {
    try {
      setLoading(true);
      
      // Busca paralela de todos os dados necessários
      const [clientsRes, catsRes, itemsRes, plansRes, propsRes] = await Promise.all([
        api.get('/clients/dashboard').catch(() => ({ data: { data: null } })),
        api.get('/commercial-plans/categories'),
        api.get('/commercial-plans/items'),
        api.get('/commercial-plans/plans'),
        api.get('/proposals/dashboard?period=30d').catch(() => ({ data: { data: null } })),
      ]);

      // Processa dados de clientes
      const clientsData = clientsRes.data.data || {};
      
      // Processa dados de catálogo
      const categories = catsRes.data.data || [];
      const services = itemsRes.data.data || [];
      const plans = plansRes.data.data || [];
      
      // Processa dados de propostas
      const propsData = propsRes.data.data || {};

      // Agrupa serviços por categoria
      const servicesByCategory = categories.map((cat: any) => ({
        categoryName: cat.name,
        count: services.filter((s: any) => s.categoryId === cat.id).length,
      }));

      // Top serviços (simulação - em produção viria de ClientService)
      const topServices = services
        .filter((s: any) => s.isActive)
        .slice(0, 5)
        .map((s: any, idx: number) => ({
          name: s.name,
          usageCount: Math.max(0, 10 - idx * 2), // Simulação
        }));

      setData({
        totalClients: clientsData.totalClients || 0,
        activeClients: clientsData.totalClients || 0,
        churnClients: clientsData.churnedThisYear || 0,
        monthlyRevenue: clientsData.monthlyRevenue || 0,
        totalCategories: categories.length,
        totalServices: services.length,
        totalPlans: plans.length,
        totalProposals: propsData.totalProposals || 0,
        wonProposals: propsData.wonProposals || 0,
        servicesByCategory,
        topServices,
      });
    } catch (err) {
      toast.error('Erro ao carregar dashboard');
    } finally {
      setLoading(false);
    }
  }

  // =================================================================
  // RENDERIZAÇÃO: LOADING
  // =================================================================
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-12 w-12 text-teal-600 animate-spin" />
      </div>
    );
  }

  // =================================================================
  // RENDERIZAÇÃO: PÁGINA PRINCIPAL
  // =================================================================
  return (
    <div className="space-y-6">
      {/* CABEÇALHO */}
      <div className="bg-gradient-to-r from-teal-600 to-teal-700 rounded-2xl p-8 text-white shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Shield className="h-8 w-8" />
              Painel Administrativo
            </h1>
            <p className="text-teal-100 mt-2">
              Visão geral do sistema e métricas estratégicas
            </p>
          </div>
          <div className="hidden md:block">
            <Sparkles className="h-16 w-16 text-teal-300 opacity-50" />
          </div>
        </div>
      </div>

      {/* KPIs PRINCIPAIS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPICard
          icon={Users}
          label="Clientes Ativos"
          value={data.activeClients}
          color="blue"
        />
        <KPICard
          icon={DollarSign}
          label="Receita Mensal"
          value={`R$ ${data.monthlyRevenue.toFixed(0)}`}
          color="green"
        />
        <KPICard
          icon={FileText}
          label="Propostas (30d)"
          value={data.totalProposals}
          color="purple"
        />
        <KPICard
          icon={Target}
          label="Taxa de Conversão"
          value={data.totalProposals > 0 
            ? `${((data.wonProposals / data.totalProposals) * 100).toFixed(1)}%`
            : '0%'
          }
          color="teal"
        />
      </div>

      {/* MÉTRICAS DO CATÁLOGO */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
          <Package className="h-5 w-5 text-teal-600" />
          Catálogo de Serviços
        </h2>
        
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-slate-50 rounded-lg p-4 text-center">
            <Folder className="h-8 w-8 text-teal-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-slate-900">{data.totalCategories}</p>
            <p className="text-sm text-slate-600">Categorias</p>
          </div>
          <div className="bg-slate-50 rounded-lg p-4 text-center">
            <Package className="h-8 w-8 text-purple-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-slate-900">{data.totalServices}</p>
            <p className="text-sm text-slate-600">Serviços</p>
          </div>
          <div className="bg-slate-50 rounded-lg p-4 text-center">
            <Crown className="h-8 w-8 text-orange-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-slate-900">{data.totalPlans}</p>
            <p className="text-sm text-slate-600">Planos</p>
          </div>
        </div>

        {/* GRÁFICO: Serviços por Categoria */}
        <div className="border-t pt-4">
          <h3 className="text-sm font-semibold text-slate-700 mb-3">
            Distribuição de Serviços por Categoria
          </h3>
          <div className="space-y-2">
            {data.servicesByCategory.map((item, idx) => {
              const maxCount = Math.max(...data.servicesByCategory.map(i => i.count), 1);
              const percentage = (item.count / maxCount) * 100;
              
              return (
                <div key={idx} className="flex items-center gap-3">
                  <span className="text-sm text-slate-600 w-32 truncate">{item.categoryName}</span>
                  <div className="flex-1 bg-slate-100 rounded-full h-6 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-teal-500 to-teal-600 h-full flex items-center justify-end px-2 transition-all duration-500"
                      style={{ width: `${percentage}%` }}
                    >
                      <span className="text-xs font-bold text-white">{item.count}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* LINK RÁPIDO */}
        <div className="mt-6 pt-4 border-t">
          <button
            onClick={() => router.push('/dashboard/admin/catalogo')}
            className="w-full flex items-center justify-between p-4 bg-teal-50 hover:bg-teal-100 rounded-lg transition-colors group"
          >
            <div className="flex items-center gap-3">
              <Package className="h-5 w-5 text-teal-600" />
              <div className="text-left">
                <p className="font-semibold text-slate-900">Gerenciar Catálogo Completo</p>
                <p className="text-sm text-slate-600">Criar, editar e organizar serviços</p>
              </div>
            </div>
            <ArrowRight className="h-5 w-5 text-teal-600 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>

      {/* TOP SERVIÇOS */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-teal-600" />
          Top 5 Serviços Mais Usados
        </h2>
        
        {data.topServices.length === 0 ? (
          <div className="text-center py-8 text-slate-500">
            <Activity className="h-12 w-12 mx-auto mb-2 text-slate-300" />
            <p>Nenhum serviço em uso ainda</p>
          </div>
        ) : (
          <div className="space-y-3">
            {data.topServices.map((service, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white ${
                    idx === 0 ? 'bg-yellow-500' :
                    idx === 1 ? 'bg-slate-400' :
                    idx === 2 ? 'bg-orange-600' :
                    'bg-slate-300'
                  }`}>
                    {idx + 1}
                  </div>
                  <span className="font-medium text-slate-900">{service.name}</span>
                </div>
                <span className="text-sm text-slate-600">
                  {service.usageCount} uso(s)
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* AÇÕES RÁPIDAS */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-teal-600" />
          Ações Rápidas
        </h2>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <QuickAction
            icon={Users}
            label="Ver Clientes"
            onClick={() => router.push('/dashboard/clientes')}
            color="blue"
          />
          <QuickAction
            icon={FileText}
            label="Propostas"
            onClick={() => router.push('/dashboard/precificacao')}
            color="purple"
          />
          <QuickAction
            icon={Package}
            label="Catálogo"
            onClick={() => router.push('/dashboard/admin/catalogo')}
            color="teal"
          />
          <QuickAction
            icon={Activity}
            label="BI Contábil"
            onClick={() => router.push('/dashboard/bi')}
            color="orange"
          />
        </div>
      </div>
    </div>
  );
}

// =================================================================
// 🎨 COMPONENTES AUXILIARES
// =================================================================

interface KPICardProps {
  icon: any;
  label: string;
  value: string | number;
  color: 'blue' | 'green' | 'purple' | 'teal';
}

function KPICard({ icon: Icon, label, value, color }: KPICardProps) {
  const colors = {
    blue: 'bg-blue-50 text-blue-600 border-blue-200',
    green: 'bg-green-50 text-green-600 border-green-200',
    purple: 'bg-purple-50 text-purple-600 border-purple-200',
    teal: 'bg-teal-50 text-teal-600 border-teal-200',
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${colors[color]}`}>
        <Icon className="h-5 w-5" />
      </div>
      <p className="text-2xl font-bold text-slate-900">{value}</p>
      <p className="text-sm text-slate-600 mt-1">{label}</p>
    </div>
  );
}

interface QuickActionProps {
  icon: any;
  label: string;
  onClick: () => void;
  color: 'blue' | 'purple' | 'teal' | 'orange';
}

function QuickAction({ icon: Icon, label, onClick, color }: QuickActionProps) {
  const colors = {
    blue: 'hover:bg-blue-50 hover:border-blue-300 text-blue-600',
    purple: 'hover:bg-purple-50 hover:border-purple-300 text-purple-600',
    teal: 'hover:bg-teal-50 hover:border-teal-300 text-teal-600',
    orange: 'hover:bg-orange-50 hover:border-orange-300 text-orange-600',
  };

  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center justify-center p-4 rounded-lg border-2 border-slate-200 transition-all ${colors[color]}`}
    >
      <Icon className="h-6 w-6 mb-2" />
      <span className="text-sm font-semibold">{label}</span>
    </button>
  );
}