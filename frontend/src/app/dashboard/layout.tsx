'use client';

// =================================================================
// 1. IMPORTS DE BIBLIOTECAS E COMPONENTES
// =================================================================

// React & Next.js
import { useState, useMemo, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';

// Stores (Gerenciamento de Estado)
import { useAuthStore } from '@/store/authStore';
import { useTrackNavigation } from '@/store/uiStore';

// Componentes Customizados do Projeto
import CommandPalette from '@/components/CommandPalette';
import NotificationCenter from '@/components/NotificationCenter';
import ForcePasswordChange from '@/components/ForcePasswordChange';
import PageHelp from '@/components/common/PageHelp';

// =================================================================
// 2. IMPORTS DE ÍCONES (LUCIDE-REACT)
// ⚠️ TODOS os itens abaixo são ÍCONES.
// ✅ Estão rigorosamente em ORDEM ALFABÉTICA para facilitar a manutenção.
// =================================================================
import {
  Activity,
  AlertTriangle,
  BarChart3,
  BookOpen,
  Bot,
  Brain,
  Briefcase,
  Building,
  Building2,
  Calculator,
  CalendarCheck, // ✅ Ícone principal para "Gestão de Obrigações"
  CalendarDays,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  FileText,
  FolderKanban,
  FolderOpen,
  Gauge,
  Globe,
  Headset,
  Landmark,
  Layers,
  LayoutDashboard,
  LogOut,
  Mail,
  Menu,
  Receipt,
  Scale,
  ScanLine,
  Shield,
  ShieldCheck,
  Tag,
  Telescope,
  Trophy,
  Upload,
  Users,
  UsersRound,
  Wallet,
  X, // ✅ Ícone de "Fechar" (X)
} from 'lucide-react';

// =================================================================
// 3. CONFIGURAÇÕES DE AMBIENTE (URLs Externas)
// =================================================================
const EXTRATOR_URL = process.env.NEXT_PUBLIC_EXTRATOR_URL || 'http://localhost:5174';
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:5173';
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// =================================================================
// 4. DEFINIÇÃO DE TIPOS (TypeScript)
// =================================================================
interface MenuItem {
  id: string;
  title: string;
  href: string;
  icon?: any; // Aceita qualquer componente de ícone do Lucide
  adminOnly?: boolean;
  section?: string;
  external?: boolean;
  children?: {
    id: string;
    title: string;
    href: string;
  }[];
}

// Ordem de exibição das seções no menu lateral
const SECTIONS = [
  { id: 'operacional', label: 'Operacional' },
  { id: 'comunicados', label: 'Comunicações' },
  { id: 'atendimento', label: 'Atendimento' },
  { id: 'comercial', label: 'Comercial' },
  { id: 'fiscal', label: 'Fiscal' },
  { id: 'bancario', label: 'Bancário' },
  { id: 'contabil', label: 'Contábil' },
  { id: 'inteligencia', label: 'Inteligência' },
  { id: 'ecossistema', label: 'Ecossistema' },
  { id: 'sistema', label: 'Sistema' },
] as const;

// =================================================================
// 5. CONFIGURAÇÃO DOS ITENS DO MENU
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
      { id: 'pessoas-colab', title: 'Colaboradores', href: '/dashboard/pessoas' },
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
    title: 'Ficha do Cliente',
    href: '/dashboard/clientes/workspace',
    icon: FolderOpen,
    section: 'operacional',
  },
  {
    id: 'projetos-tarefas',
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
  // 📬 COMUNICAÇÕES
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
  // 📞 ATENDIMENTO
  // ─────────────────────────────────────────────────────────
  {
    id: 'fila-atendimento',
    title: 'Fila de Atendimento',
    href: '/dashboard/fila',
    icon: Headset,
    section: 'atendimento',
  },
  {
    id: 'analise-conversas',
    title: 'Análise de Conversas',
    href: '/dashboard/analise',
    icon: BarChart3,
    section: 'atendimento',
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
      { id: 'precificacao-base', title: 'Calculadora', href: '/dashboard/precificacao' },
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
  // 🧾 FISCAL (COM SUBMENU DE OBRIGAÇÕES)
  // ─────────────────────────────────────────────────────────
  {
    id: 'fiscal',
    title: 'Fiscal',
    href: '/dashboard/fiscal',
    icon: FileText,
    section: 'fiscal',
    children: [
      { id: 'fiscal-import', title: 'Importar NF-e', href: '/dashboard/fiscal' },
      { id: 'fiscal-notas', title: 'Notas Fiscais', href: '/dashboard/fiscal/notas' },
      { id: 'fiscal-estoque', title: 'Estoque', href: '/dashboard/fiscal/estoque' },
      { id: 'fiscal-apuracao', title: 'Apuração ICMS', href: '/dashboard/fiscal/apuracao' },
      { id: 'fiscal-sped', title: 'SPED Fiscal', href: '/dashboard/fiscal/sped' },
      { id: 'fiscal-comparativo', title: 'Comparativo', href: '/dashboard/fiscal/comparativo' },
      { id: 'fiscal-relatorio', title: 'Relatório Inventário', href: '/dashboard/fiscal/relatorio-inventario' },
      
      // ✅ NOVO ITEM PAI: GESTÃO DE OBRIGAÇÕES (Com Submenu)
      {
        id: 'gestao-obrigacoes',
        title: 'Gestão de Obrigações',
        href: '/dashboard/admin/obrigacoes', // 👉 Link para a página principal unificada
        icon: CalendarCheck,
        children: [
          { id: 'obrigacoes-painel', title: 'Painel Unificado', href: '/dashboard/admin/obrigacoes' },
          { id: 'obrigacoes-importar', title: 'Importar em Lote (Excel)', href: '/dashboard/fiscal/obrigacoes/importar' },
          { id: 'obrigacoes-lotes', title: 'Obrigações em Lote', href: '/dashboard/fiscal/obrigacoes/lotes' },
          { id: 'obrigacoes-clientes', title: 'Por Cliente', href: '/dashboard/fiscal/obrigacoes/clientes' },
          { id: 'obrigacoes-tipo', title: 'Por Tipo de Obrigação', href: '/dashboard/fiscal/obrigacoes/tipo' },
        ],
      },
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
    title: 'Central Contábil do Cliente',
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
      { id: 'ciclo-contabil', title: 'Ciclo Contábil', href: '/dashboard/contabil/ciclo-contabil' },
      { id: 'contabil-plano', title: 'Plano de Contas', href: '/dashboard/contabil/plano-contas' },
      { id: 'contabil-extrato', title: 'Extrato / Razão', href: '/dashboard/contabil/extrato' },
      { id: 'contabil-revisao', title: 'Revisão de Lançamentos', href: '/dashboard/contabil/revisao' },
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
    id: 'bi',
    title: 'DRE do Escritório',
    href: '/dashboard/bi',
    icon: Building,
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
    id: 'score',
    title: 'Score do Escritório',
    href: '/dashboard/score',
    icon: Gauge,
    section: 'inteligencia',
  },

  // ─────────────────────────────────────────────────────────
  // 🔗 ECOSSISTEMA (Links Externos)
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
  // ⚙️ SISTEMA (Apenas Admin)
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
// 6. COMPONENTE PRINCIPAL DO LAYOUT
// =================================================================
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // Menus que começam abertos por padrão
  const [expandedMenus, setExpandedMenus] = useState<string[]>([
    'Gestão de Pessoas',
    'Projetos e Tarefas',
    'Precificação',
    'Comunicados',
    'Gestão de Obrigações', // ✅ Adicionado para já vir aberto
  ]);
  
  const [filaPendentes, setFilaPendentes] = useState(0);

  const { user, logout } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();
  useTrackNavigation();

  // Busca pendências na fila a cada 30 segundos (para o badge)
  useEffect(() => {
    const fetchPendentes = async () => {
      try {
        const res = await fetch(`${API_URL}/api/arquivos-fila?status=AGUARDANDO_APROVACAO&perPage=1`);
        if (res.ok) {
          const data = await res.json();
          setFilaPendentes(data.meta?.total ?? 0);
        }
      } catch {
        // Silencioso em caso de erro de rede
      }
    };
    fetchPendentes();
    const interval = setInterval(fetchPendentes, 30000);
    return () => clearInterval(interval);
  }, []);

  // Agrupa os itens do menu por seção, filtrando permissões
  const groupedMenuItems = useMemo(() => {
    const visibleItems = allMenuItems
      .map((item) => {
        if (item.adminOnly && user?.role !== 'ADMIN') return null;
        if (item.external) return item;
        if (user?.role === 'ADMIN') return item;
        
        if (item.children) {
          const visibleChildren = item.children.filter((child) =>
            user?.allowedModules?.includes(child.id)
          );
          return visibleChildren.length > 0 ? { ...item, children: visibleChildren } : null;
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

  // Verifica se a rota atual está ativa
  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === '/dashboard';
    return pathname.startsWith(href);
  };

  const isActiveChild = (href: string) =>
    href === '/dashboard/comunicados' ? pathname === href : isActive(href);

  const toggleMenu = (title: string) => {
    setExpandedMenus((prev) =>
      prev.includes(title) ? prev.filter((item) => item !== title) : [...prev, title]
    );
  };

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  // =================================================================
  // 7. RENDERIZAÇÃO (JSX)
  // =================================================================
  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Botão Mobile para abrir/fechar sidebar */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-teal-700 text-white shadow-lg transition-colors hover:bg-teal-600"
        aria-label="Abrir menu"
      >
        {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Sidebar Lateral */}
      <aside
        className={`
          fixed lg:static inset-y-0 left-0 z-40 w-64
          bg-teal-900 text-white
          transform transition-transform duration-300 ease-in-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          flex flex-col shadow-xl
        `}
      >
        {/* Logo e Nome da Empresa */}
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

        {/* Navegação do Menu */}
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

                  // Renderização de Link Externo (abre em nova aba)
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

                  // Renderização de Item de Menu (com ou sem submenu)
                  return (
                    <div key={item.id}>
                      <button
                        onClick={() => (hasChildren ? toggleMenu(item.title) : router.push(item.href))}
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
                        {hasChildren && (isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />)}
                      </button>

                      {/* Submenu (Children) */}
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
                                {/* Badge de notificação para a Fila de Aprovação */}
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

        {/* Rodapé da Sidebar (Perfil do Usuário e Logout) */}
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

      {/* Overlay para fechar menu no mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-30 lg:hidden backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Área Principal de Conteúdo */}
      <main className="flex-1 p-4 lg:p-8 overflow-x-hidden transition-all duration-300">
        <div className="lg:hidden h-12" />
        <div className="flex justify-end items-center gap-2 mb-4">
          <NotificationCenter />
          <PageHelp pathname={pathname} />
        </div>
        {children}
      </main>

      {/* Modais Globais */}
      <ForcePasswordChange />
      <CommandPalette />
    </div>
  );
}