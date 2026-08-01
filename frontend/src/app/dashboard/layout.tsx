'use client';

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
  Shield, // 🔥 NOVO: Ícone do Painel Admin
} from 'lucide-react';

// 🎨 Definição centralizada dos itens do menu com IDs de módulos
interface MenuItem {
  id: string;
  title: string;
  href: string;
  icon?: any;
  adminOnly?: boolean; // 🔥 NOVO: Marca itens exclusivos de ADMIN
  children?: { id: string; title: string; href: string }[];
}

const allMenuItems: MenuItem[] = [
  { id: 'dashboard', title: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { id: 'minha-empresa', title: 'Minha Empresa', href: '/dashboard/minha-empresa', icon: Building2 },
  { 
    id: 'pessoas', 
    title: 'Gestão de Pessoas', 
    href: '/dashboard/pessoas', 
    icon: Users,
    children: [
      { id: 'pessoas', title: 'Colaboradores', href: '/dashboard/pessoas' },
      { id: 'turnover', title: 'Turnover', href: '/dashboard/turnover' },
    ]
  },
  { id: 'clientes', title: 'Clientes', href: '/dashboard/clientes', icon: UsersRound },
  { id: 'precificacao', title: 'Precificação', href: '/dashboard/precificacao', icon: Calculator },
  { id: 'planejamento', title: 'Planejamento', href: '/dashboard/planejamento', icon: CalendarDays },
  { id: 'bi', title: 'B.I. Contábil', href: '/dashboard/bi', icon: BarChart3 },
  { id: 'ponto-fora-da-curva', title: 'Ponto Fora da Curva', href: '/dashboard/ponto-fora-da-curva', icon: AlertTriangle },
  { id: 'indicadores', title: 'Indicadores', href: '/dashboard/indicadores', icon: Activity },
  { id: 'planejamento-tributario', title: 'Planejamento Tributário', href: '/dashboard/planejamento-tributario', icon: Scale },
  { id: 'reforma-tributaria', title: 'Reforma Tributária', href: '/dashboard/reforma-tributaria', icon: Scale },
  { id: 'admin', title: 'Administração', href: '/dashboard/admin', icon: Shield, adminOnly: true }, // 🔥 NOVO: Exclusivo ADMIN
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState<string[]>(['Gestão de Pessoas']);
  const { user, logout } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();

  // 🔥 LÓGICA DO MENU DINÂMICO
  const menuItems = useMemo(() => {
    // Se for ADMIN, libera tudo
    if (user?.role === 'ADMIN') {
      return allMenuItems;
    }

    // Se for CLIENTE, filtra baseado no allowedModules do token
    return allMenuItems
      .map((item) => {
        // 🔥 NOVO: Bloqueia itens exclusivos de admin
        if (item.adminOnly) return null;

        if (item.children) {
          // Filtra os filhos e mantém o pai apenas se houver pelo menos um filho visível
          const visibleChildren = item.children.filter((child) => 
            user?.allowedModules?.includes(child.id)
          );
          return visibleChildren.length > 0 ? { ...item, children: visibleChildren } : null;
        }
        // Retorna o item se o módulo estiver na lista permitida
        return user?.allowedModules?.includes(item.id) ? item : null;
      })
      .filter(Boolean) as MenuItem[]; // Remove os nulos
  }, [user?.role, user?.allowedModules]);

  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === '/dashboard';
    return pathname.startsWith(href);
  };

  const toggleMenu = (title: string) => {
    setExpandedMenus((prev) =>
      prev.includes(title)
        ? prev.filter((item) => item !== title)
        : [...prev, title]
    );
  };

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Botão Menu Mobile */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-teal-700 text-white shadow-lg transition-colors hover:bg-teal-600"
        aria-label="Abrir menu"
      >
        {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Sidebar (Menu Lateral) */}
      <aside
        className={`
          fixed lg:static inset-y-0 left-0 z-40 w-64 
          bg-teal-900 text-white 
          transform transition-transform duration-300 ease-in-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          flex flex-col shadow-xl
        `}
      >
        {/* Logo */}
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

        {/* Itens de Navegação Dinâmicos */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            const hasChildren = item.children && item.children.length > 0;
            const isExpanded = expandedMenus.includes(item.title);

            return (
              <div key={item.href}>
                <button
                  onClick={() => hasChildren ? toggleMenu(item.title) : router.push(item.href)}
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
                    {Icon && <Icon size={20} className={active && !hasChildren ? 'text-orange-400' : 'text-teal-300'} />}
                    <span>{item.title}</span>
                  </div>
                  {hasChildren && (
                    isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />
                  )}
                </button>
                
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

        {/* Rodapé da Sidebar */}
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

      {/* Overlay Mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-30 lg:hidden backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Área Principal */}
      <main className="flex-1 p-4 lg:p-8 overflow-x-hidden transition-all duration-300">
        <div className="lg:hidden h-12" />
        {children}
      </main>
    </div>
  );
}