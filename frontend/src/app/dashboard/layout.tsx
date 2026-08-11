'use client';

// =================================================================
// INÍCIO: IMPORTS E DIRETIVAS
// =================================================================
// 'use client' = Diretiva do Next.js App Router que marca este componente
// como Client Component (executado no navegador, não no servidor).
// Obrigatório quando usamos useState, useEffect, hooks do React, etc.

// React hooks
import { useState, useMemo } from 'react';
// Hooks de navegação do Next.js
import { useRouter, usePathname } from 'next/navigation';
// Store global Zustand para autenticação
import { useAuthStore } from '@/store/authStore';
// Biblioteca de ícones Lucide React (padrão Conta Certa)
import {
  LayoutDashboard,  // Dashboard principal
  Building2,        // Empresa
  Users,            // Pessoas/Colaboradores
  UsersRound,       // Clientes
  Calculator,       // Precificação/Contábil
  CalendarDays,     // Planejamento
  LogOut,           // Sair
  Menu,             // Menu hamburguer (mobile)
  X,                // Fechar (mobile)
  AlertTriangle,    // Ponto Fora da Curva
  BarChart3,        // B.I.
  Activity,         // Indicadores
  Scale,            // Tributário
  ChevronDown,      // Seta para baixo (submenu expandido)
  ChevronRight,     // Seta para direita (submenu colapsado)
  Shield,           // Administração
  FileText,         // Lançamentos Contábeis
  FolderKanban,     // Projetos (módulo novo)
  CheckSquare,      // Tarefas (módulo novo - reservado)
  Receipt,          // Fiscal
} from 'lucide-react';
// =================================================================
// FIM: IMPORTS E DIRETIVAS
// =================================================================


// =================================================================
// INÍCIO: DEFINIÇÃO DE TIPOS (INTERFACES)
// =================================================================
/**
 * Interface que define a estrutura de cada item do menu.
 * - `id`: identificador único usado para allowedModules (filho) e key React
 * - `children`: submenu aninhado (se houver)
 * - `adminOnly`: se true, só ADMIN vê (ignora allowedModules)
 */
interface MenuItem {
  id: string;
  title: string;
  href: string;
  icon?: any;
  adminOnly?: boolean;
  children?: {
    id: string;
    title: string;
    href: string;
  }[];
}
// =================================================================
// FIM: DEFINIÇÃO DE TIPOS (INTERFACES)
// =================================================================


// =================================================================
// INÍCIO: CONFIGURAÇÃO DOS ITENS DO MENU (allMenuItems)
// =================================================================
// Array estático com TODOS os itens possíveis do menu.
// O filtro dinâmico por allowedModules acontece no useMemo abaixo.
//
// REGRA IMPORTANTE:
// - O 'id' do pai (ex: 'operacional') NÃO é filtrado diretamente
// - O que é filtrado são os 'id' dos CHILDREN (ex: 'projetos', 'tarefas')
// - Se pelo menos 1 child passar no filtro, o pai aparece
// - Se 0 children passarem, o pai é ocultado completamente
const allMenuItems: MenuItem[] = [

  // --- MÓDULOS PRINCIPAIS (sem submenu) ---
  {
    id: 'dashboard',
    title: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    id: 'minha-empresa',
    title: 'Minha Empresa',
    href: '/dashboard/minha-empresa',
    icon: Building2,
  },

  // --- GESTÃO DE PESSOAS (com submenu) ---
  {
    id: 'pessoas',
    title: 'Gestão de Pessoas',
    href: '/dashboard/pessoas',
    icon: Users,
    children: [
      { id: 'pessoas', title: 'Colaboradores', href: '/dashboard/pessoas' },
      { id: 'turnover', title: 'Turnover', href: '/dashboard/turnover' },
    ],
  },

  // --- CLIENTES ---
  {
    id: 'clientes',
    title: 'Clientes',
    href: '/dashboard/clientes',
    icon: UsersRound,
  },

  // --- LANÇAMENTOS CONTÁBEIS ---
  {
    id: 'lancamentos',
    title: 'Lançamentos Contábeis',
    href: '/dashboard/lancamentos',
    icon: FileText,
    children: [
      { id: 'lancamentos', title: 'Todos os Lançamentos', href: '/dashboard/lancamentos' },
      { id: 'revisao-manual', title: 'Revisão Manual', href: '/dashboard/lancamentos/revisao' },
    ],
  },

  // --- PRECIFICAÇÃO E PLANEJAMENTO ---
  {
    id: 'precificacao',
    title: 'Precificação',
    href: '/dashboard/precificacao',
    icon: Calculator,
  },
  {
    id: 'planejamento',
    title: 'Planejamento',
    href: '/dashboard/planejamento',
    icon: CalendarDays,
  },

  // --- MÓDULO OPERACIONAL (Projetos + Tarefas) ---
  {
    id: 'operacional',
    title: 'Operacional',
    href: '/dashboard/projetos',
    icon: FolderKanban,
    children: [
      { id: 'projetos', title: 'Projetos', href: '/dashboard/projetos' },
      { id: 'tarefas', title: 'Tarefas', href: '/dashboard/tarefas' },
    ],
  },

  // 🧾 MÓDULO FISCAL — Sprint 8 a 14
  {
    id: 'fiscal',
    title: 'Fiscal',
    href: '/dashboard/fiscal',
    icon: Receipt,
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

  // --- B.I. E INDICADORES ---
  { id: 'bi', title: 'B.I. Contábil', href: '/dashboard/bi', icon: BarChart3 },
  {
    id: 'ponto-fora-da-curva',
    title: 'Ponto Fora da Curva',
    href: '/dashboard/ponto-fora-da-curva',
    icon: AlertTriangle,
  },
  {
    id: 'indicadores',
    title: 'Indicadores',
    href: '/dashboard/indicadores',
    icon: Activity,
  },
  {
    id: 'planejamento-tributario',
    title: 'Planejamento Tributário',
    href: '/dashboard/planejamento-tributario',
    icon: Scale,
  },
  {
    id: 'reforma-tributaria',
    title: 'Reforma Tributária',
    href: '/dashboard/reforma-tributaria',
    icon: Scale,
  },

    // --- FECHAMENTO MENSAL ---
  {
    id: 'fechamento',
    title: 'Fechamento Mensal',
    href: '/dashboard/fechamento',
    icon: CalendarDays,
  },

  // --- CONTÁBIL ---
  {
    id: 'contabil',
    title: 'Contábil',
    href: '/dashboard/contabil',
    icon: Calculator,
    children: [
      { id: 'contabil-sci', title: 'Importar / Exportar SCI', href: '/dashboard/contabil' },
      { id: 'contabil-revisao', title: 'Revisão de Lançamentos', href: '/dashboard/contabil/revisao' },
      { id: 'contabil-plano', title: 'Plano de Contas', href: '/dashboard/contabil/plano-contas' },
    ],
  },

  // --- ADMINISTRAÇÃO (exclusivo para ADMIN) ---
  {
    id: 'admin',
    title: 'Administração',
    href: '/dashboard/admin',
    icon: Shield,
    adminOnly: true,
    children: [
      { id: 'admin-overview', title: 'Visão Geral', href: '/dashboard/admin' },
      { id: 'admin-catalogo', title: 'Catálogo de Serviços', href: '/dashboard/admin/catalogo' },
    ],
  },
];
// =================================================================
// FIM: CONFIGURAÇÃO DOS ITENS DO MENU (allMenuItems)
// =================================================================


// =================================================================
// INÍCIO: COMPONENTE PRINCIPAL (DashboardLayout)
// =================================================================
// Este é o layout que envolve TODAS as páginas dentro de /dashboard/*
// Recebe 'children' = o conteúdo da página atual (via Next.js)
export default function DashboardLayout({ children }: { children: React.ReactNode }) {

  // -----------------------------------------------------------------
  // ESTADOS LOCAIS DO COMPONENTE
  // -----------------------------------------------------------------
  // Controla se a sidebar está aberta (mobile)
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Controla quais submenus estão expandidos (pelo TITLE, não ID)
  // Inicializa com módulos estratégicos já expandidos para melhor UX
  const [expandedMenus, setExpandedMenus] = useState<string[]>([
    'Gestão de Pessoas',
    'Lançamentos Contábeis',
    'Operacional',
    'Fiscal', // 🆕 Sprint 8-14: módulo fiscal começa expandido
  ]);

  // -----------------------------------------------------------------
  // HOOKS DO ZUSTAND E NEXT.JS
  // -----------------------------------------------------------------
  const { user, logout } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();

  // =================================================================
  // INÍCIO: LÓGICA DO MENU DINÂMICO (useMemo)
  // =================================================================
  // useMemo = Hook do React que memoiza o resultado.
  // Só recalcula quando 'user?.role' ou 'user?.allowedModules' mudam.
  //
  // FLUXO DE DECISÃO PARA CADA ITEM:
  // 1. Se é adminOnly E usuário NÃO é ADMIN → retorna null (oculta)
  // 2. Se usuário É ADMIN → retorna o item completo (sem filtro)
  // 3. Se tem children → filtra children por allowedModules
  //    - Se sobrar pelo menos 1 child → retorna pai com children filtrados
  //    - Se não sobrar nenhum → retorna null (oculta o pai também)
  // 4. Se NÃO tem children → verifica se item.id está em allowedModules
  const menuItems = useMemo(() => {
    return allMenuItems
      .map((item) => {
        // 🛡️ REGRA 1: Bloqueia itens exclusivos de admin para não-admins
        if (item.adminOnly && user?.role !== 'ADMIN') return null;

        // 👑 REGRA 2: ADMIN vê TUDO (ignora allowedModules)
        if (user?.role === 'ADMIN') return item;

        // 📂 REGRA 3: Itens COM submenu (children)
        if (item.children) {
          const visibleChildren = item.children.filter((child) =>
            user?.allowedModules?.includes(child.id),
          );
          return visibleChildren.length > 0
            ? { ...item, children: visibleChildren }
            : null;
        }

        // 📄 REGRA 4: Itens SEM submenu
        return user?.allowedModules?.includes(item.id) ? item : null;
      })
      .filter(Boolean) as MenuItem[];
  }, [user?.role, user?.allowedModules]);
  // =================================================================
  // FIM: LÓGICA DO MENU DINÂMICO (useMemo)
  // =================================================================

  // =================================================================
  // INÍCIO: FUNÇÕES AUXILIARES
  // =================================================================

  /**
   * Verifica se uma rota está "ativa" (página atual).
   * Caso especial: '/dashboard' só é ativo se pathname for exatamente '/dashboard'.
   * Outros casos: usa startsWith (ex: '/dashboard/clientes' ativa '/dashboard/clientes/123').
   */
  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === '/dashboard';
    return pathname.startsWith(href);
  };

  /** Alterna a expansão de um submenu pelo TITLE. */
  const toggleMenu = (title: string) => {
    setExpandedMenus((prev) =>
      prev.includes(title)
        ? prev.filter((item) => item !== title)
        : [...prev, title],
    );
  };

  /** Faz logout: limpa o store Zustand e redireciona para /login. */
  const handleLogout = () => {
    logout();
    router.push('/login');
  };
  // =================================================================
  // FIM: FUNÇÕES AUXILIARES
  // =================================================================

  // =================================================================
  // INÍCIO: RENDERIZAÇÃO DO LAYOUT (JSX)
  // =================================================================
  return (
    <div className="min-h-screen bg-slate-50 flex">

      {/* ================================================================= */}
      {/* BOTÃO MENU MOBILE (hamburguer)                                      */}
      {/* Aparece apenas em telas pequenas (lg:hidden)                        */}
      {/* ================================================================= */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-teal-700 text-white shadow-lg transition-colors hover:bg-teal-600"
        aria-label="Abrir menu"
      >
        {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* ================================================================= */}
      {/* SIDEBAR (Menu Lateral)                                              */}
      {/* ================================================================= */}
      <aside
        className={`
          fixed lg:static inset-y-0 left-0 z-40 w-64
          bg-teal-900 text-white
          transform transition-transform duration-300 ease-in-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          flex flex-col shadow-xl
        `}
      >
        {/* --- LOGO E IDENTIDADE VISUAL --- */}
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

        {/* --- NAVEGAÇÃO PRINCIPAL (itens dinâmicos filtrados) --- */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            const hasChildren = item.children && item.children.length > 0;
            const isExpanded = expandedMenus.includes(item.title);

            return (
              <div key={item.id}>
                {/* BOTÃO DO ITEM PRINCIPAL */}
                <button
                  onClick={() =>
                    hasChildren ? toggleMenu(item.title) : router.push(item.href)
                  }
                  className={`
                    w-full flex items-center justify-between gap-3 px-4 py-3 rounded-lg
                    transition-all duration-200 font-medium
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
                        size={20}
                        className={active && !hasChildren ? 'text-orange-400' : 'text-teal-300'}
                      />
                    )}
                    <span>{item.title}</span>
                  </div>
                  {hasChildren && (
                    isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />
                  )}
                </button>

                {/* SUBMENU (CHILDREN) — aparece apenas quando expandido */}
                {hasChildren && isExpanded && (
                  <div className="ml-6 mt-1 space-y-1 border-l-2 border-teal-700 pl-2">
                    {item.children.map((child) => {
                      const childActive = isActive(child.href);
                      return (
                        <button
                          key={child.href}
                          onClick={() => router.push(child.href)}
                          className={`
                            w-full text-left px-4 py-2 rounded-lg text-sm transition-colors
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
        </nav>

        {/* --- RODAPÉ DA SIDEBAR (info do usuário + logout) --- */}
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

      {/* ================================================================= */}
      {/* OVERLAY MOBILE (fundo escuro ao abrir menu)                         */}
      {/* ================================================================= */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-30 lg:hidden backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* ================================================================= */}
      {/* ÁREA PRINCIPAL DE CONTEÚDO                                          */}
      {/* ================================================================= */}
      <main className="flex-1 p-4 lg:p-8 overflow-x-hidden transition-all duration-300">
        <div className="lg:hidden h-12" />
        {children}
      </main>

    </div>
  );
  // =================================================================
  // FIM: RENDERIZAÇÃO DO LAYOUT (JSX)
  // =================================================================
}
// =================================================================
// FIM: COMPONENTE PRINCIPAL (DashboardLayout)
// =================================================================