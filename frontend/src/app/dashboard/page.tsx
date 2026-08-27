// =================================================================
// 🚦 DIRETIVA DO NEXT.JS — CLIENT COMPONENT
// =================================================================
// 'use client' é obrigatório quando o componente usa:
// - Hooks do React (useState, useEffect, useMemo, etc.)
// - Event handlers (onClick, onChange, etc.)
// - APIs do browser (window, localStorage, etc.)
//
// Este componente é um CLIENT COMPONENT porque:
// 1. Faz chamadas HTTP via Axios (browser-only)
// 2. Usa useState/useEffect (hooks)
// 3. Acessa useAuthStore (Zustand com localStorage)
//
// ARQUITETURA: Next.js App Router renderiza primeiro no servidor,
// mas este componente será hidratado no browser após o carregamento.
// =================================================================
'use client';
import LastVisitedCard from '@/components/LastVisitedCard';
// =================================================================
// 📦 IMPORTAÇÕES — ORGANIZADAS POR CATEGORIA
// =================================================================
// REACT HOOKS — Nativos do React 19
import { useState, useEffect } from 'react';

// STORE GLOBAL — Zustand (gerenciamento de estado)
// Centraliza autenticação do usuário em toda a aplicação
import { useAuthStore } from '@/store/authStore';

// CLIENTE HTTP — Axios configurado em @/lib/axios
// Já inclui interceptors para JWT, baseURL e tratamento de erros
import api from '@/lib/axios';

// NAVEGAÇÃO — Next.js Link (prefetch automático, client-side routing)
import Link from 'next/link';

// IMPORTAÇÃO DINÂMICA — Next.js dynamic (code splitting)
// Essencial para componentes que usam APIs do browser (como Canvas/SVG)
import dynamic from 'next/dynamic';

// ÍCONES — Lucide React (biblioteca leve, tree-shakeable)
// Cada ícone é importado individualmente para não aumentar o bundle
import {
  Building2,        // Empresa
  Users,            // Colaboradores
  UserPlus,         // Admissões
  TrendingUp,       // Tendência positiva
  TrendingDown,     // Tendência negativa / Turnover
  Briefcase,        // Clientes / Cases
  Calculator,       // Precificação
  Target,           // Planejamento / Metas
  Loader2,          // Loading spinner
  AlertCircle,      // Alerta de erro
  ArrowRight,       // Navegação (seta)
  CheckCircle2,     // Status operacional
  FolderKanban,     // 🆕 Projetos (reservado para próxima iteração)
  CheckSquare,      // 🆕 Tarefas (reservado para próxima iteração)
} from 'lucide-react';
// =================================================================
// FIM: IMPORTAÇÕES
// =================================================================


// =================================================================
// 🎨 IMPORTAÇÃO DINÂMICA DOS GRÁFICOS
// =================================================================
// DECISÃO ARQUITETURAL: Por que usar dynamic() com ssr: false?
//
// PROBLEMA: Gráficos usam SVG/Canvas que dependem do objeto `window`.
// No Server-Side Rendering (SSR) do Next.js, `window` não existe,
// causando erro "window is not defined" no build.
//
// SOLUÇÃO:
// 1. dynamic() → Carrega o componente apenas no browser (lazy loading)
// 2. ssr: false → Desabilita renderização no servidor
// 3. loading → UI de fallback enquanto o chunk é baixado
//
// BENEFÍCIOS:
// - Bundle menor (gráficos só carregam na página do dashboard)
// - Zero erros de SSR
// - UX fluida com loading state
//
// ALTERNATIVA REJEITADA: Recharts 2.x teve incompatibilidade com
// React 19 + Turbopack, por isso usamos gráficos CSS nativos
// (decisão documentada no README).
// =================================================================

const PieChartComponent = dynamic(
  // Promise que resolve para o componente exportado como named export
  () => import('@/components/DashboardCharts').then((mod) => mod.PieChartComponent),
  {
    ssr: false,
    loading: () => (
      <div className="h-[300px] flex items-center justify-center text-slate-400 text-sm">
        Carregando gráfico...
      </div>
    ),
  }
);

const BarChartComponent = dynamic(
  () => import('@/components/DashboardCharts').then((mod) => mod.BarChartComponent),
  {
    ssr: false,
    loading: () => (
      <div className="h-[300px] flex items-center justify-center text-slate-400 text-sm">
        Carregando gráfico...
      </div>
    ),
  }
);
// =================================================================
// FIM: GRÁFICOS DINÂMICOS
// =================================================================


// =================================================================
// 🧩 COMPONENTE REUTILIZÁVEL: KpiCard
// =================================================================
// COMPONENTE ATÔMICO — Segue princípios do Atomic Design
// Pode ser usado em qualquer dashboard do sistema.
//
// DESIGN SYSTEM:
// - Padding consistente (p-6)
// - Bordas arredondadas (rounded-xl)
// - Sombras sutis (shadow-sm)
// - Hover com elevação (hover:shadow-md)
// - Paleta Conta Certa (teal, orange, green, red)
//
// ACESSIBILIDADE:
// - Semântica clara (label + value separados)
// - Cores com contraste WCAG AA
// =================================================================

/**
 * Interface TypeScript para tipagem forte do componente KpiCard.
 * Previne erros em tempo de desenvolvimento e melhora DX (Developer Experience).
 */
interface KpiCardProps {
  icon: React.ElementType;       // Componente de ícone Lucide
  label: string;                  // Texto descritivo do KPI
  value: string | number;         // Valor numérico ou formatado (ex: "12.5%")
  trend?: string;                 // Texto de tendência (ex: "+15% vs mês anterior")
  trendType?: 'positive' | 'negative' | 'neutral';  // Direção da tendência
  color: 'teal' | 'orange' | 'green' | 'red';        // Cor temática
}

function KpiCard({
  icon: Icon,
  label,
  value,
  trend,
  trendType = 'neutral',
  color,
}: KpiCardProps) {
  // Mapeamento de cores — Design Token do Conta Certa
  // Centraliza as cores para fácil manutenção
  const colorMap = {
    teal: 'bg-teal-50 text-teal-600',
    orange: 'bg-orange-50 text-orange-600',
    green: 'bg-green-50 text-green-600',
    red: 'bg-red-50 text-red-600',
  };

  // Cores semânticas para tendências (padrão UX universal)
  // Verde = bom, Vermelho = ruim, Cinza = neutro
  const trendColor = {
    positive: 'text-green-600',
    negative: 'text-red-600',
    neutral: 'text-slate-500',
  };

  return (
    <article className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
      {/* Cabeçalho do card: ícone + indicador de tendência */}
      <div className="flex items-start justify-between mb-4">
        <div className={`p-3 rounded-lg ${colorMap[color]}`}>
          <Icon className="h-6 w-6" />
        </div>

        {/* Badge de tendência (renderizado apenas se 'trend' existir) */}
        {trend && (
          <div className={`flex items-center gap-1 text-xs font-medium ${trendColor[trendType]}`}>
            {trendType === 'positive' && <TrendingUp className="h-4 w-4" />}
            {trendType === 'negative' && <TrendingDown className="h-4 w-4" />}
            <span>{trend}</span>
          </div>
        )}
      </div>

      {/* Valor principal — destaque visual máximo */}
      <div className="text-3xl font-bold text-slate-900 mb-1">
        {value}
      </div>

      {/* Label descritivo */}
      <div className="text-sm font-medium text-slate-600">
        {label}
      </div>
    </article>
  );
}
// =================================================================
// FIM: KpiCard
// =================================================================


// =================================================================
// 🚀 PÁGINA PRINCIPAL: Dashboard Executivo
// =================================================================
// COMPONENTE DE PÁGINA — Rota: /dashboard (ou /)
//
// ARQUITETURA:
// ┌─────────────────────────────────────────┐
// │  DashboardPage (Client Component)       │
// │  └── useAuthStore (Zustand)             │
// │  └── api (Axios) → Backend NestJS       │
// │  └── Gráficos (Dynamic Import)          │
// │  └── KpiCard (Atomic Component)         │
// └─────────────────────────────────────────┘
//
// CICLO DE VIDA:
// 1. Componente monta → useEffect dispara
// 2. Busca dados em paralelo (Promise.all)
// 3. Loading state durante a busca
// 4. Renderização dos dados OU estado de erro
//
// RESILIÊNCIA:
// - Cada endpoint tem .catch(() => null) individual
// - Se /company falhar, /employees ainda funciona
// - Evita "cascata de falhas" (um endpoint derruba tudo)
// =================================================================

export default function DashboardPage() {
  // ---------------------------------------------------------------
  // ESTADOS LOCAIS DO COMPONENTE
  // ---------------------------------------------------------------
  // Hook do Zustand — pega o usuário logado do store global
  // Zustand persiste em localStorage, então sobrevive a refreshes
  const { user } = useAuthStore();

  // Estado de carregamento — controla o loading spinner
  const [loading, setLoading] = useState(true);

  // Estado de erro — armazena mensagem de erro para UI
  const [error, setError] = useState<string | null>(null);

  // Estado de dados — tipado como 'any' (melhorar com interface)
  // ⚠️ TODO: Criar interfaces CompanyData e EmployeeMetrics
  const [companyData, setCompanyData] = useState<any>(null);
  const [employeeMetrics, setEmployeeMetrics] = useState<any>(null);

  // ---------------------------------------------------------------
  // EFEITO COLATERAL: BUSCA DE DADOS
  // ---------------------------------------------------------------
  // useEffect com array vazio [] = executa apenas UMA vez ao montar
  // Equivalente ao componentDidMount do React Class Components
  //
  // PADRÃO UTILIZADO: Promise.all() com .catch() individual
  //
  // VANTAGENS:
  // 1. Paralelismo — requisições acontecem ao mesmo tempo (mais rápido)
  // 2. Resiliência — se uma falhar, outras continuam
  // 3. Performance — reduz tempo total de carregamento
  //
  // ANTES (versão com erro 404):
  // const [emp, cli, pri, pla, clients] = await Promise.all([...])
  // → Se QUALQUER endpoint falhasse, TODO o dashboard quebrava
  //
  // AGORA (versão resiliente):
  // api.get(...).catch(() => null) → retorna null se falhar
  // → UI se adapta graciosamente a dados ausentes
  // ---------------------------------------------------------------
  // ---------------------------------------------------------------
  // EFEITO COLATERAL: BUSCA DE DADOS
  // ---------------------------------------------------------------
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        setError(null);

        // Busca as métricas reais do banco de dados
        const metricsRes = await api.get('/dashboard/metrics').catch(() => null);
        const employeesRes = await api.get('/employees/metrics').catch(() => null);

        const metrics = metricsRes?.data?.data || {};
        const empMetrics = employeesRes?.data?.data || {};

        // Popula os dados com os valores REAIS do banco
        setCompanyData({
          clientesHoje: metrics.activeClients || 0,
          clientesAno: metrics.totalClients || 0,
        });
        
        setEmployeeMetrics({
          totalActive: metrics.totalEmployees || 0,
          totalEmployees: metrics.totalEmployees || 0,
          admissionsThisMonth: metrics.admissionsThisMonth || empMetrics.admissionsThisMonth || 0,
          dismissalsThisMonth: empMetrics.dismissalsThisMonth || 0,
          turnoverRate: empMetrics.turnoverRate || 0,
        });

      } catch (err) {
        console.error('Erro ao carregar dashboard:', err);
        setError('Não foi possível carregar os dados.');
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []); // Array vazio = executa apenas uma vez

  // ---------------------------------------------------------------
  // FUNÇÕES AUXILIARES (Helpers)
  // ---------------------------------------------------------------

  /**
   * Retorna saudação baseada na hora do dia
   * UX: Personalização aumenta engajamento do usuário
   */
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Bom dia';
    if (hour < 18) return 'Boa tarde';
    return 'Boa noite';
  };

  /**
   * Formata data atual em português brasileiro
   * Exemplo: "sexta-feira, 7 de agosto de 2026"
   * 'capitalize' do Tailwind coloca primeira letra maiúscula
   */
  const currentDate = new Date().toLocaleDateString('pt-BR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  // ---------------------------------------------------------------
  // PREPARAÇÃO DE DADOS PARA GRÁFICOS
  // ---------------------------------------------------------------
  // Princípio: Transformar dados da API no formato que o gráfico espera
  // Isso isola o componente de detalhes da API (separação de responsabilidades)

  /**
   * Dados do gráfico de pizza (softwares utilizados)
   * Filtra apenas os softwares ativos (value > 0)
   * Se companyData for null, retorna array vazio (gráfico não quebra)
   */
  const softwareData = companyData
    ? [
        { name: 'Consultoria', value: companyData.softwareConsultoria ? 1 : 0 },
        { name: 'Contábil', value: companyData.softwareContabil ? 1 : 0 },
        { name: 'Fiscal', value: companyData.softwareFiscal ? 1 : 0 },
      ].filter((item) => item.value > 0)
    : [];

  /**
   * Dados do gráfico de barras (movimentação de pessoal)
   * Fallback: se não houver métricas, mostra tudo zerado
   * Isso evita que o gráfico quebre ao renderizar
   */
  const workforceData = employeeMetrics
    ? [{
        name: 'Este Mês',
        Admissões: employeeMetrics.admissionsThisMonth || 0,
        Demissões: employeeMetrics.dismissalsThisMonth || 0,
      }]
    : [{ name: 'Este Mês', Admissões: 0, Demissões: 0 }];

  /**
   * Ações rápidas — Array de configuração (declarativo)
   * Facilita manutenção: adicionar/remover ações = editar array
   *
   * PADRÃO: Configuration-driven UI
   * A UI é renderizada baseada em dados, não em código hardcoded
   */
  const quickActions = [
    {
      title: 'Minha Empresa',
      description: 'Dados e configurações',
      icon: Building2,
      href: '/dashboard/minha-empresa',
      color: 'bg-teal-50 text-teal-600 hover:bg-teal-100',
    },
    {
      title: 'Gestão de Pessoas',
      description: 'Colaboradores e turnover',
      icon: Users,
      href: '/dashboard/pessoas',
      color: 'bg-orange-50 text-orange-600 hover:bg-orange-100',
    },
    {
      title: 'Clientes',
      description: 'Carteira de clientes',
      icon: Briefcase,
      href: '/dashboard/clientes',
      color: 'bg-teal-50 text-teal-600 hover:bg-teal-100',
    },
    {
      title: 'Precificação',
      description: 'Modelos e valores',
      icon: Calculator,
      href: '/dashboard/precificacao',
      color: 'bg-orange-50 text-orange-600 hover:bg-orange-100',
    },
    {
      title: 'Planejamento',
      description: 'Metas e estratégias',
      icon: Target,
      href: '/dashboard/planejamento',
      color: 'bg-teal-50 text-teal-600 hover:bg-teal-100',
    },
    // 🆕 PRÓXIMA ITERAÇÃO: Adicionar novos módulos
    // {
    //   title: 'Projetos',
    //   description: 'Gestão de projetos',
    //   icon: FolderKanban,
    //   href: '/dashboard/projetos',
    //   color: 'bg-teal-50 text-teal-600 hover:bg-teal-100',
    // },
    // {
    //   title: 'Tarefas',
    //   description: 'Kanban operacional',
    //   icon: CheckSquare,
    //   href: '/dashboard/tarefas',
    //   color: 'bg-orange-50 text-orange-600 hover:bg-orange-100',
    // },
  ];

  // ---------------------------------------------------------------
  // ESTADOS DE RENDERIZAÇÃO (Early Returns)
  // ---------------------------------------------------------------

  /**
   * ESTADO 1: LOADING
   */
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="h-12 w-12 text-teal-600 animate-spin mb-4" />
        <p className="text-slate-600 font-medium">Carregando seu dashboard...</p>
      </div>
    );
  }

  /**
   * ESTADO 2: ERRO
   */
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

  // ---------------------------------------------------------------
  // RENDERIZAÇÃO PRINCIPAL (UI Completa)
  // ---------------------------------------------------------------
  return (
    <div className="space-y-8">

      {/* 🆕 Card "Onde você parou" - MOVIDO PARA CÁ! */}
      {/* Ele só renderiza se houver histórico no localStorage */}
      <LastVisitedCard />

      {/* ======================================================== */}
      {/* SEÇÃO 1: CABEÇALHO (Header)                               */}
      {/* ======================================================== */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">
            {getGreeting()}, {user?.name || 'Usuário'}! 👋
          </h1>
          <p className="text-slate-600 mt-1 capitalize">
            {currentDate}
          </p>
        </div>

        <div className="flex items-center gap-2 px-4 py-2 bg-teal-50 border border-teal-100 rounded-lg">
          <div className="w-2 h-2 bg-teal-500 rounded-full animate-pulse" />
          <span className="text-sm font-medium text-teal-700">
            Sistema ativo e sincronizado
          </span>
        </div>
      </div>

      {/* ======================================================== */}
      {/* SEÇÃO 2: CARDS DE KPI (Key Performance Indicators)        */}
      {/* ======================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <KpiCard
          icon={Briefcase}
          label="Clientes Ativos"
          value={companyData?.clientesHoje || 0}
          trend={`${companyData?.clientesAno || 0} meta anual`}
          trendType="neutral"
          color="teal"
        />
        <KpiCard
          icon={Users}
          label="Colaboradores"
          value={employeeMetrics?.totalActive || 0}
          trend={`${employeeMetrics?.totalEmployees || 0} no total`}
          trendType="neutral"
          color="orange"
        />
        <KpiCard
          icon={UserPlus}
          label="Admissões (mês)"
          value={employeeMetrics?.admissionsThisMonth || 0}
          trend="Novas contratações"
          trendType="positive"
          color="green"
        />
        <KpiCard
          icon={TrendingDown}
          label="Taxa de Turnover"
          value={`${(employeeMetrics?.turnoverRate || 0).toFixed(1)}%`}
          trend="Índice de rotatividade"
          trendType={(employeeMetrics?.turnoverRate || 0) > 5 ? 'negative' : 'positive'}
          color="red"
        />
      </div>

      {/* ======================================================== */}
      {/* SEÇÃO 3: STATUS DOS MÓDULOS + PRÓXIMOS PASSOS             */}
      {/* ======================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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

        <div className="bg-gradient-to-br from-teal-600 to-teal-800 p-6 rounded-xl shadow-md text-white flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-bold mb-2">Próximos Passos Recomendados</h3>
            <p className="text-teal-100 text-sm mb-6">
              Complete o cadastro da sua empresa para desbloquear relatórios avançados.
            </p>
            <div className="space-y-3">
              {[
                'Preencher dados da "Minha Empresa"',
                'Cadastrar primeiros colaboradores',
                'Configurar modelos de precificação',
              ].map((step, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-xs font-bold">
                    {idx + 1}
                  </div>
                  <span className="text-sm">{step}</span>
                </div>
              ))}
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

      {/* ======================================================== */}
      {/* SEÇÃO 4: GRÁFICOS ANALÍTICOS                              */}
      {/* ======================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h3 className="text-lg font-bold text-slate-900 mb-4">Softwares Utilizados</h3>
          {softwareData.length > 0 ? (
            <PieChartComponent data={softwareData} />
          ) : (
            <div className="h-[300px] flex items-center justify-center text-slate-400 text-sm">
              Nenhum software cadastrado ainda
            </div>
          )}
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h3 className="text-lg font-bold text-slate-900 mb-4">Movimentação de Pessoal</h3>
          <BarChartComponent data={workforceData} />
        </div>
      </div>

      {/* ======================================================== */}
      {/* SEÇÃO 5: AÇÕES RÁPIDAS (Quick Access)                     */}
      {/* ======================================================== */}
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