'use client';
// =================================================================
// INÍCIO: IMPORTS E DIRETIVAS
// =================================================================
import CommandPalette from '@/components/CommandPalette';
import NotificationCenter from '@/components/NotificationCenter';
import ForcePasswordChange from '@/components/ForcePasswordChange';
import { useState, useMemo, useEffect } from 'react'; // 🆕 F15: useEffect p/ badge
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { useTrackNavigation } from '@/store/uiStore';
import PageHelp from '@/components/common/PageHelp';
import {
  LayoutDashboard,
  Building2,
  Users,
  UsersRound,
  Calculator,
  CalendarDays,
  LogOut,
  Menu,
  X,
  AlertTriangle,
  BarChart3,
  Activity,
  Scale,
  ChevronDown,
  ChevronRight,
  Shield,
  FileText,
  FolderKanban,
  Receipt,
  Landmark,
  Briefcase,
  BookOpen,
  Building,
  Wallet,
  Brain,
  Bot,
  Gauge,
  Telescope,
  Trophy,
  ShieldCheck,
  FolderOpen,
  ScanLine,      // 🆕 Sprint F10: Extrator Bancário
  Globe,         // 🆕 Sprint F10: Site Conta Certa
  ExternalLink,  // 🆕 Sprint F10: badge "abre em nova aba"
  Mail,          // 🆕 F15: ícone da seção Comunicados
} from 'lucide-react';
// =================================================================
// FIM: IMPORTS E DIRETIVAS
// =================================================================

// =================================================================
// 🆕 Sprint F10: URLs DAS APPS EXTERNAS (Ecossistema)
// =================================================================
const EXTRATOR_URL =
  process.env.NEXT_PUBLIC_EXTRATOR_URL || 'http://localhost:5174';
const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:5173';

// 🆕 F15: URL base do backend NestJS (usada pelo badge de pendentes)
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
// =================================================================
// FIM: URLs DAS APPS EXTERNAS
// =================================================================

// =================================================================
// INÍCIO: DEFINIÇÃO DE TIPOS
// =================================================================
interface MenuItem {
  id: string;
  title: string;
  href: string;
  icon?: any;
  adminOnly?: boolean;
  section?: string;
  external?: boolean;
  children?: {
    id: string;
    title: string;
    href: string;
  }[];
}

// Configuração das seções visuais (ordem de renderização)
// 🆕 F15: seção 'comunicados' inserida após 'operacional'
const SECTIONS = [
  { id: 'operacional', label: 'Operacional' },
  { id: 'comunicados', label: 'Comunicações' }, // 🆕 F15
  { id: 'comercial', label: 'Comercial' },
  { id: 'fiscal', label: 'Fiscal' },
  { id: 'bancario', label: 'Bancário' },
  { id: 'contabil', label: 'Contábil' },
  { id: 'inteligencia', label: 'Inteligência' },
  { id: 'ecossistema', label: 'Ecossistema' },
  { id: 'sistema', label: 'Sistema' },
] as const;
// =================================================================
// FIM: DEFINIÇÃO DE TIPOS
// =================================================================

// =================================================================
// CONFIGURAÇÃO DOS ITENS DO MENU
// =================================================================
const allMenuItems: MenuItem[] = [
  // ─────────────────────────────────────────────────────────
  // 📊 OPERACIONAL
  // ─────────────────────────────────────────────────────────
  {
    id: 'dashboard',
    title: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
    section: 'operacional',
  },
  {
    id: 'minha-empresa',
    title: 'Minha Empresa',
    href: '/dashboard/minha-empresa',
    icon: Building2,
    section: 'operacional',
  },
  {
    id: 'pessoas',
    title: 'Gestão de Pessoas',
    href: '/dashboard/pessoas',
    icon: Users,
    section: 'operacional',
    children: [
      { id: 'pessoas', title: 'Colaboradores', href: '/dashboard/pessoas' },
      { id: 'turnover', title: 'Turnover', href: '/dashboard/turnover' },
      { id: 'benchmark-cargos', title: 'Benchmark de Cargos', href: '/dashboard/pessoas/benchmark' },
    ],
  },
  {
    id: 'clientes',
    title: 'Carteira de Clientes',
    href: '/dashboard/clientes',
    icon: UsersRound,
    section: 'operacional',
  },
  {
    id: 'client-workspace',
    title: 'Ficha do Cliente (Setores)',
    href: '/dashboard/clientes/workspace',
    icon: FolderOpen,
    section: 'operacional',
  },
  {
    id: 'operacional',
    title: 'Projetos e Tarefas',
    href: '/dashboard/projetos',
    icon: FolderKanban,
    section: 'operacional',
    children: [
      { id: 'projetos', title: 'Projetos', href: '/dashboard/projetos' },
      { id: 'tarefas', title: 'Tarefas', href: '/dashboard/tarefas' },
    ],
  },

  // ─────────────────────────────────────────────────────────
  // 📬 COMUNICADOS (🆕 F15 — Sprint F13/F15: watch folder + emails)
  // ─────────────────────────────────────────────────────────
  {
    id: 'comunicados',
    title: 'Central de Envios',
    href: '/dashboard/comunicados',
    icon: Mail,
    section: 'comunicados',
    children: [
      { id: 'comunicados-hub', title: 'Central de Comunicados', href: '/dashboard/comunicados' },
      { id: 'comunicados-fila', title: 'Fila de Aprovação', href: '/dashboard/comunicados/fila' },
      { id: 'comunicados-envios', title: 'Histórico de Envios', href: '/dashboard/comunicados/envios' },
      { id: 'comunicados-templates', title: 'Templates de Email', href: '/dashboard/comunicados/templates' },
    ],
  },

  // ─────────────────────────────────────────────────────────
  // 💼 COMERCIAL
  // ─────────────────────────────────────────────────────────
  {
    id: 'precificacao',
    title: 'Precificação',
    href: '/dashboard/precificacao',
    icon: Calculator,
    section: 'comercial',
    children: [
      { id: 'precificacao-base', title: 'Calculadora de Precificação', href: '/dashboard/precificacao' },
      { id: 'propostas', title: 'Propostas Comerciais', href: '/dashboard/precificacao/propostas' },
      { id: 'meus-planos', title: 'Meus Planos', href: '/dashboard/precificacao/meus-planos' },
      { id: 'desempenho', title: 'Desempenho', href: '/dashboard/precificacao/desempenho' },
    ],
  },
  {
    id: 'planejamento',
    title: 'Planejamento',
    href: '/dashboard/planejamento',
    icon: CalendarDays,
    section: 'comercial',
  },

  // ─────────────────────────────────────────────────────────
  // 🧾 FISCAL
  // ─────────────────────────────────────────────────────────
  {
    id: 'fiscal',
    title: 'Fiscal',
    href: '/dashboard/fiscal',
    icon: Receipt,
    section: 'fiscal',
    children: [
      { id: 'fiscal-import', title: 'Importar NF-e', href: '/dashboard/fiscal' },
      { id: 'fiscal-notas', title: 'Notas Fiscais', href: '/dashboard/fiscal/notas' },
      { id: 'fiscal-estoque', title: 'Estoque', href: '/dashboard/fiscal/estoque' },
      { id: 'fiscal-apuracao', title: 'Apuração ICMS', href: '/dashboard/fiscal/apuracao' },
      { id: 'fiscal-sped', title: 'SPED Fiscal', href: '/dashboard/fiscal/sped' },
      { id: 'fiscal-comparativo', title: 'Comparativo', href: '/dashboard/fiscal/comparativo' },
      { id: 'fiscal-relatorio', title: 'Relatório Inventário', href: '/dashboard/fiscal/relatorio-inventario' },
    ],
  },

  // ─────────────────────────────────────────────────────────
  // 🏦 BANCÁRIO
  // ─────────────────────────────────────────────────────────
  {
    id: 'fechamento',
    title: 'Fechamento + DRE Bancário',
    href: '/dashboard/fechamento',
    icon: Wallet,
    section: 'bancario',
  },
  {
    id: 'extrato-pdf',
    title: 'Extratos PDF → CSV',
    href: '/dashboard/fechamento/extrato-pdf',
    icon: FileText,
    section: 'bancario',
  },
  {
    id: 'cobranca',
    title: 'Cobrança CNAB',
    href: '/dashboard/funcionario-digital/cobranca',
    icon: Landmark,
    section: 'bancario',
  },

  // ─────────────────────────────────────────────────────────
  // 📒 CONTÁBIL
  // ─────────────────────────────────────────────────────────
  {
    id: 'central-contabil',
    title: '🏢 Central Contábil do Cliente',
    href: '/dashboard/central-contabil',
    icon: BookOpen,
    section: 'contabil',
  },
  {
    id: 'contabil',
    title: 'Integração SCI',
    href: '/dashboard/contabil',
    icon: BookOpen,
    section: 'contabil',
    children: [
      { id: 'contabil-sci', title: 'Importar / Exportar SCI', href: '/dashboard/contabil' },
      { id: 'ciclo-contabil', title: 'Ciclo Contábil do Cliente', href: '/dashboard/contabil/ciclo-contabil' },
      { id: 'contabil-plano', title: 'Plano de Contas', href: '/dashboard/contabil/plano-contas' },
      { id: 'contabil-extrato', title: 'Extrato / Razão Analítico', href: '/dashboard/contabil/extrato' },
      { id: 'contabil-revisao', title: 'Revisão de Lançamentos', href: '/dashboard/contabil/revisao' },
    ],
  },
  {
    id: 'lancamentos',
    title: 'Lançamentos Contábeis',
    href: '/dashboard/lancamentos',
    icon: FileText,
    section: 'contabil',
    children: [
      { id: 'lancamentos', title: 'Todos os Lançamentos', href: '/dashboard/lancamentos' },
      { id: 'revisao-manual', title: 'Revisão Manual + Automática', href: '/dashboard/lancamentos/revisao' },
    ],
  },

  // ─────────────────────────────────────────────────────────
  // 📈 INTELIGÊNCIA
  // ─────────────────────────────────────────────────────────
  {
    id: 'funcionario-digital',
    title: 'Aurora (Funcionário Digital)',
    href: '/dashboard/funcionario-digital',
    icon: Bot,
    section: 'inteligencia',
  },
  {
    id: 'relatorios-mensais',
    title: 'Relatórios Mensais',
    href: '/dashboard/funcionario-digital/relatorios',
    icon: FileText,
    section: 'inteligencia',
  },
  {
    id: 'nfse',
    title: 'NFS-e',
    href: '/dashboard/funcionario-digital/nfse',
    icon: Receipt,
    section: 'inteligencia',
  },
  {
    id: 'guias-imposto',
    title: 'Guias de Imposto',
    href: '/dashboard/funcionario-digital/guias',
    icon: Scale,
    section: 'inteligencia',
  },
  {
    id: 'legalizacao',
    title: 'Legalização & Cofre',
    href: '/dashboard/funcionario-digital/legalizacao',
    icon: ShieldCheck,
    section: 'inteligencia',
  },
  {
    id: 'bi',
    title: 'DRE do Escritório',
    href: '/dashboard/bi',
    icon: Building,
    section: 'inteligencia',
  },
  {
    id: 'bi-dre-cliente',
    title: 'DRE do Cliente (Oficial)',
    href: '/dashboard/bi/dre-cliente',
    icon: BookOpen,
    section: 'inteligencia',
  },
  {
    id: 'ponto-fora-da-curva',
    title: 'Ponto Fora da Curva',
    href: '/dashboard/ponto-fora-da-curva',
    icon: AlertTriangle,
    section: 'inteligencia',
  },
  {
    id: 'indicadores',
    title: 'Indicadores',
    href: '/dashboard/indicadores',
    icon: Activity,
    section: 'inteligencia',
  },
  {
    id: 'indicadores-custom',
    title: 'Indicadores Customizados',
    href: '/dashboard/indicadores-custom',
    icon: Calculator,
    section: 'inteligencia',
  },
  {
    id: 'score',
    title: 'Score do Escritório',
    href: '/dashboard/score',
    icon: Gauge,
    section: 'inteligencia',
  },
  {
    id: 'mentoria',
    title: 'Visão de Futuro',
    href: '/dashboard/mentoria',
    icon: Telescope,
    section: 'inteligencia',
  },
  {
    id: 'ranking',
    title: 'Ranking de Níveis',
    href: '/dashboard/ranking',
    icon: Trophy,
    section: 'inteligencia',
  },
  {
    id: 'planejamento-tributario',
    title: 'Planejamento Tributário',
    href: '/dashboard/planejamento-tributario',
    icon: Scale,
    section: 'inteligencia',
  },
  {
    id: 'reforma-tributaria',
    title: 'Reforma Tributária',
    href: '/dashboard/reforma-tributaria',
    icon: Scale,
    section: 'inteligencia',
  },

  // ─────────────────────────────────────────────────────────
  // 🔗 ECOSSISTEMA (🆕 Sprint F10 — apps externas, nova aba)
  // ─────────────────────────────────────────────────────────
  {
    id: 'extrator-app',
    title: 'Extrator Bancário',
    href: EXTRATOR_URL,
    icon: ScanLine,
    section: 'ecossistema',
    external: true,
  },
  {
    id: 'site-conta-certa',
    title: 'Site Conta Certa',
    href: SITE_URL,
    icon: Globe,
    section: 'ecossistema',
    external: true,
  },

  // ─────────────────────────────────────────────────────────
  // ⚙️ SISTEMA (admin-only)
  // ─────────────────────────────────────────────────────────
  {
    id: 'admin',
    title: 'Administração',
    href: '/dashboard/admin',
    icon: Shield,
    adminOnly: true,
    section: 'sistema',
    children: [
      { id: 'admin-overview', title: 'Visão Geral', href: '/dashboard/admin' },
      { id: 'admin-catalogo', title: 'Catálogo de Serviços', href: '/dashboard/admin/catalogo' },
      { id: 'admin-usuarios', title: 'Gestão de Usuários', href: '/dashboard/admin/usuarios' },
    ],
  },
];
// =================================================================
// FIM: ITENS DO MENU
// =================================================================

// =================================================================
// INÍCIO: COMPONENTE PRINCIPAL (DashboardLayout)
// =================================================================
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  // 🆕 F15: 'Comunicados' entra aberto por padrão
  const [expandedMenus, setExpandedMenus] = useState<string[]>([
    'Gestão de Pessoas',
    'Operacional',
    'Precificação',
    'Comunicados',
  ]);
  // 🆕 F15: contador de arquivos aguardando aprovação (badge na Fila)
  const [filaPendentes, setFilaPendentes] = useState(0);

  const { user, logout } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();
  useTrackNavigation();

  // 🆕 F15: busca o total de AGUARDANDO_APROVACAO a cada 30s p/ o badge
  useEffect(() => {
    const fetchPendentes = async () => {
      try {
        const res = await fetch(
          `${API_URL}/api/arquivos-fila?status=AGUARDANDO_APROVACAO&perPage=1`,
        );
        if (res.ok) {
          const data = await res.json();
          setFilaPendentes(data.meta?.total ?? 0);
        }
      } catch {
        // backend fora do ar: badge some silenciosamente
      }
    };
    fetchPendentes();
    const interval = setInterval(fetchPendentes, 30000);
    return () => clearInterval(interval);
  }, []);

  // =================================================================
  // MENU DINÂMICO (useMemo) — agrupa por seção
  // =================================================================
  const groupedMenuItems = useMemo(() => {
    const visibleItems = allMenuItems
      .map((item) => {
        if (item.adminOnly && user?.role !== 'ADMIN') return null;
        if (item.external) return item;
        if (user?.role === 'ADMIN') return item;
        if (item.children) {
          const visibleChildren = item.children.filter((child) =>
            user?.allowedModules?.includes(child.id),
          );
          return visibleChildren.length > 0
            ? { ...item, children: visibleChildren }
            : null;
        }
        return user?.allowedModules?.includes(item.id) ? item : null;
      })
      .filter(Boolean) as MenuItem[];

    const grouped: { sectionId: string; sectionLabel: string; items: MenuItem[] }[] = [];
    for (const sec of SECTIONS) {
      const items = visibleItems.filter((it) => it.section === sec.id);
      if (items.length > 0) {
        grouped.push({ sectionId: sec.sectionId ?? sec.id, sectionLabel: sec.label, items });
      }
    }
    return grouped;
  }, [user?.role, user?.allowedModules]);

  // =================================================================
  // FUNÇÕES AUXILIARES
  // =================================================================
  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === '/dashboard';
    return pathname.startsWith(href);
  };

  // 🆕 F15: o hub (/dashboard/comunicados) só ativa com match exato,
  // senão ficaria "ativo" também dentro de /fila, /envios, etc.
  const isActiveChild = (href: string) =>
    href === '/dashboard/comunicados' ? pathname === href : isActive(href);

  const toggleMenu = (title: string) => {
    setExpandedMenus((prev) =>
      prev.includes(title)
        ? prev.filter((item) => item !== title)
        : [...prev, title],
    );
  };

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  // =================================================================
  // RENDERIZAÇÃO
  // =================================================================
  return (
    <div className="min-h-screen bg-slate-50 flex">
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-teal-700 text-white shadow-lg transition-colors hover:bg-teal-600"
        aria-label="Abrir menu"
      >
        {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      <aside
        className={`
          fixed lg:static inset-y-0 left-0 z-40 w-64
          bg-teal-900 text-white
          transform transition-transform duration-300 ease-in-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          flex flex-col shadow-xl
        `}
      >
        <div className="p-6 border-b border-teal-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-400 to-orange-500 flex items-center justify-center font-bold text-white text-lg shadow-md">
              C
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">
                Conta <span className="text-orange-400">Certa</span>
              </h1>
              <p className="text-xs text-teal-300 font-medium">Soluções Empresariais</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-4 overflow-y-auto">
          {groupedMenuItems.map((group) => (
            <div key={group.sectionId}>
              <div className="flex items-center gap-2 px-2 mb-1">
                <span className="text-[10px] font-bold uppercase tracking-widest text-orange-300/80">
                  {group.sectionLabel}
                </span>
                <div className="flex-1 h-px bg-teal-700/40" />
              </div>
              <div className="space-y-1">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const active = !item.external && isActive(item.href);
                  const hasChildren = item.children && item.children.length > 0;
                  const isExpanded = expandedMenus.includes(item.title);

                  // Link externo = <a> em nova aba (fora do router)
                  if (item.external) {
                    return (
                      <a
                        key={item.id}
                        href={item.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        title={`Abrir em nova aba: ${item.title}`}
                        className="w-full flex items-center justify-between gap-3 px-4 py-2.5 rounded-lg transition-all duration-200 font-medium text-sm text-teal-100 hover:bg-teal-800 hover:text-white"
                      >
                        <div className="flex items-center gap-3">
                          {Icon && <Icon size={18} className="text-teal-300" />}
                          <span>{item.title}</span>
                        </div>
                        <ExternalLink size={12} className="text-teal-400/70" />
                      </a>
                    );
                  }

                  return (
                    <div key={item.id}>
                      <button
                        onClick={() =>
                          hasChildren ? toggleMenu(item.title) : router.push(item.href)
                        }
                        className={`
                          w-full flex items-center justify-between gap-3 px-4 py-2.5 rounded-lg
                          transition-all duration-200 font-medium text-sm
                          ${
                            active && !hasChildren
                              ? 'bg-teal-700 text-white shadow-md border-l-4 border-orange-400'
                              : 'text-teal-100 hover:bg-teal-800 hover:text-white'
                          }
                        `}
                      >
                        <div className="flex items-center gap-3">
                          {Icon && (
                            <Icon
                              size={18}
                              className={active && !hasChildren ? 'text-orange-400' : 'text-teal-300'}
                            />
                          )}
                          <span>{item.title}</span>
                        </div>
                        {hasChildren &&
                          (isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />)}
                      </button>

                      {hasChildren && isExpanded && (
                        <div className="ml-6 mt-1 space-y-0.5 border-l-2 border-teal-700 pl-2">
                          {item.children?.map((child) => {
                            const childActive = isActiveChild(child.href);
                            return (
                              <button
                                key={child.href}
                                onClick={() => router.push(child.href)}
                                className={`
                                  w-full flex items-center justify-between gap-2 text-left px-3 py-1.5 rounded-lg text-xs transition-colors
                                  ${
                                    childActive
                                      ? 'bg-teal-800 text-white font-medium'
                                      : 'text-teal-200 hover:bg-teal-800 hover:text-white'
                                  }
                                `}
                              >
                                <span>{child.title}</span>
                                {/* 🆕 F15: badge com pendentes na Fila de Aprovação */}
                                {child.id === 'comunicados-fila' && filaPendentes > 0 && (
                                  <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-orange-500 text-white">
                                    {filaPendentes}
                                  </span>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="p-4 border-t border-teal-800 bg-teal-950">
          <div className="mb-4 px-2">
            <p className="text-sm font-semibold text-white truncate">
              {user?.name || 'Usuário'}
            </p>
            <p className="text-xs text-teal-300 truncate">
              {user?.email || 'email@exemplo.com'}
            </p>
            {user?.role !== 'ADMIN' && (
              <span className="inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-bold bg-orange-500 text-white">
                PLANO ATIVO
              </span>
            )}
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5
                       bg-red-600 hover:bg-red-700 text-white rounded-lg
                       transition-colors duration-200 font-medium text-sm shadow-sm"
          >
            <LogOut size={18} />
            Sair do Sistema
          </button>
        </div>
      </aside>

      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-30 lg:hidden backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      <main className="flex-1 p-4 lg:p-8 overflow-x-hidden transition-all duration-300">
        <div className="lg:hidden h-12" />
        <div className="flex justify-end items-center gap-2 mb-4">
          <NotificationCenter />
          <PageHelp pathname={pathname} />
        </div>
        {children}
      </main>

      <ForcePasswordChange />
      <CommandPalette />
    </div>
  );
}
// =================================================================
// FIM: COMPONENTE PRINCIPAL
// =================================================================