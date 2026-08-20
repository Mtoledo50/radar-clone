'use client';

// =================================================================
// INÍCIO: IMPORTS E DIRETIVAS
// =================================================================
import { useState, useMemo } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
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
  BookOpen,          // 🆕 Sprint 28: DRE do Cliente (livro contábil)
  Building,          // 🆕 Sprint 28: DRE do Escritório
  Wallet,            // 🆕 Sprint 28: DRE do Cliente Bancário (extrato)
  Brain,
  Bot,               // 🆕 FD-1: Funcionário Digital (Aurora)
} from 'lucide-react';
// =================================================================
// FIM: IMPORTS E DIRETIVAS
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
  section?: string;  // 🆕 Sprint 25: seção visual (label em uppercase)
  children?: {
    id: string;
    title: string;
    href: string;
  }[];
}

// 🆕 Sprint 25: configuração das seções visuais (ordem de renderização)
const SECTIONS = [
  { id: 'operacional', label: 'Operacional' },
  { id: 'comercial', label: 'Comercial' },
  { id: 'fiscal', label: 'Fiscal' },
  { id: 'bancario', label: 'Bancário' },
  { id: 'contabil', label: 'Contábil' },
  { id: 'inteligencia', label: 'Inteligência' },
  { id: 'sistema', label: 'Sistema' },
] as const;
// =================================================================
// FIM: DEFINIÇÃO DE TIPOS
// =================================================================


// =================================================================
// INÍCIO: CONFIGURAÇÃO DOS ITENS DO MENU
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
    ],
  },
  {
    id: 'clientes',
    title: 'Clientes',
    href: '/dashboard/clientes',
    icon: UsersRound,
    section: 'operacional',
  },
  {
    id: 'operacional',
    title: 'Operacional',
    href: '/dashboard/projetos',
    icon: FolderKanban,
    section: 'operacional',
    children: [
      { id: 'projetos', title: 'Projetos', href: '/dashboard/projetos' },
      { id: 'tarefas', title: 'Tarefas', href: '/dashboard/tarefas' },
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
    // 🆕 SPRINT A2: Adicionado submenu para separar Propostas de Meus Planos
    children: [
      { id: 'propostas', title: 'Propostas Comerciais', href: '/dashboard/precificacao' },
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
  // 🧾 FISCAL (Sprints 8-20)
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
  // 🏦 BANCÁRIO (Sprint 21-24)
  // ─────────────────────────────────────────────────────────
  {
    id: 'fechamento',
    title: 'Fechamento + DRE Bancário',
    href: '/dashboard/fechamento',
    icon: Wallet,  // 🆕 Sprint 28: ícone Carteira (extrato)
    section: 'bancario',
  },

  // ─────────────────────────────────────────────────────────
  // 📒 CONTÁBIL
  // ─────────────────────────────────────────────────────────
  {
    id: 'lancamentos',
    title: 'Lançamentos Contábeis',
    href: '/dashboard/lancamentos',
    icon: FileText,
    section: 'contabil',
    children: [
      { id: 'lancamentos', title: 'Todos os Lançamentos', href: '/dashboard/lancamentos' },
      { id: 'revisao-manual', title: 'Revisão Manual', href: '/dashboard/lancamentos/revisao' },
    ],
  },
  {
    id: 'contabil',
    title: 'Plano de Contas',
    href: '/dashboard/contabil',
    icon: BookOpen,
    section: 'contabil',
    children: [
      { id: 'contabil-sci', title: 'Importar / Exportar SCI', href: '/dashboard/contabil' },
      { id: 'contabil-revisao', title: 'Revisão de Lançamentos', href: '/dashboard/contabil/revisao' },
      { id: 'contabil-plano', title: 'Plano de Contas', href: '/dashboard/contabil/plano-contas' },
    ],
  },
  {
    id: 'revisao-lancamentos',
    title: 'Revisão Inteligente',
    href: '/dashboard/lancamentos/revisao',
    icon: Brain,
    section: 'contabil',
  },

  // ─────────────────────────────────────────────────────────
  // 📈 INTELIGÊNCIA
  // ─────────────────────────────────────────────────────────
  {
    id: 'funcionario-digital',
    title: 'Funcionário Digital',
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
    id: 'bi',
    title: 'DRE do Escritório',
    href: '/dashboard/bi',
    icon: Building,  // 🆕 Sprint 28: ícone Empresa (visão consolidada)
    section: 'inteligencia',
  },
  {
    id: 'bi-dre-cliente',
    title: 'DRE do Cliente (Oficial)',
    href: '/dashboard/bi/dre-cliente',
    icon: BookOpen,  // 🆕 Sprint 28: livro contábil oficial
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
    ],
  },
];
// =================================================================
// FIM: CONFIGURAÇÃO DOS ITENS DO MENU
// =================================================================


// =================================================================
// INÍCIO: COMPONENTE PRINCIPAL (DashboardLayout)
// =================================================================
export default function DashboardLayout({ children }: { children: React.ReactNode }) {

  const [sidebarOpen, setSidebarOpen] = useState(false);

  // 🆕 Sprint 25 + A2: 'Precificação' adicionado para já aparecer aberto com o submenu
  const [expandedMenus, setExpandedMenus] = useState<string[]>([
    'Gestão de Pessoas',
    'Operacional',
    'Precificação', 
  ]);

  const { user, logout } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();

  // =================================================================
  // MENU DINÂMICO (useMemo) — agrupa por seção 🆕 Sprint 25
  // =================================================================
  const groupedMenuItems = useMemo(() => {
    const visibleItems = allMenuItems
      .map((item) => {
        if (item.adminOnly && user?.role !== 'ADMIN') return null;
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
        grouped.push({ sectionId: sec.id, sectionLabel: sec.label, items });
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
                  const active = isActive(item.href);
                  const hasChildren = item.children && item.children.length > 0;
                  const isExpanded = expandedMenus.includes(item.title);

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
                        {hasChildren && (
                          isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />
                        )}
                      </button>

                      {hasChildren && isExpanded && (
                        <div className="ml-6 mt-1 space-y-0.5 border-l-2 border-teal-700 pl-2">
                          {item.children?.map((child) => {
                            const childActive = isActive(child.href);
                            return (
                              <button
                                key={child.href}
                                onClick={() => router.push(child.href)}
                                className={`
                                  w-full text-left px-3 py-1.5 rounded-lg text-xs transition-colors
                                  ${
                                    childActive
                                      ? 'bg-teal-800 text-white font-medium'
                                      : 'text-teal-200 hover:bg-teal-800 hover:text-white'
                                  }
                                `}
                              >
                                {child.title}
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
        {children}
      </main>
    </div>
  );
}
// =================================================================
// FIM: COMPONENTE PRINCIPAL
// =================================================================