'use client';

import { useState } from 'react';
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
  X
} from 'lucide-react';

// 🎨 Definição centralizada dos itens do menu (fácil de adicionar novos módulos no futuro)
const menuItems = [
  { title: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { title: 'Minha Empresa', href: '/dashboard/minha-empresa', icon: Building2 },
  { title: 'Gestão de Pessoas', href: '/dashboard/pessoas', icon: Users },
  { title: 'Clientes', href: '/dashboard/clientes', icon: UsersRound },
  { title: 'Precificação', href: '/dashboard/precificacao', icon: Calculator },
  { title: 'Planejamento', href: '/dashboard/planejamento', icon: CalendarDays },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();

  // 🔍 Função para verificar se o item do menu está ativo (destaque visual)
  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === '/dashboard';
    return pathname.startsWith(href);
  };

  // 🚪 Função de logout com limpeza do store e redirecionamento seguro
  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* 📱 Botão Menu Mobile (visível apenas em telas pequenas, z-index alto para ficar sobre tudo) */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-teal-700 text-white shadow-lg transition-colors hover:bg-teal-600"
        aria-label="Abrir menu"
      >
        {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* 🎨 Sidebar (Menu Lateral) */}
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
            {/* Círculo decorativo simulando o logo da marca com gradiente Teal -> Laranja */}
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

        {/* Itens de Navegação */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);

            return (
              <a
                key={item.href}
                href={item.href}
                className={`
                  flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 font-medium
                  ${
                    active
                      ? 'bg-teal-700 text-white shadow-md border-l-4 border-orange-400' // Estado Ativo
                      : 'text-teal-100 hover:bg-teal-800 hover:text-white'             // Estado Normal/Hover
                  }
                `}
              >
                {/* Ícone muda de cor sutilmente quando ativo */}
                <Icon size={20} className={active ? 'text-orange-400' : 'text-teal-300'} />
                <span>{item.title}</span>
              </a>
            );
          })}
        </nav>

        {/* Rodapé da Sidebar (Informações do Usuário e Logout) */}
        <div className="p-4 border-t border-teal-800 bg-teal-950">
          <div className="mb-4 px-2">
            <p className="text-sm font-semibold text-white truncate">
              {user?.name || 'Usuário'}
            </p>
            <p className="text-xs text-teal-300 truncate">
              {user?.email || 'email@exemplo.com'}
            </p>
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

      {/* Overlay escuro para Mobile (fecha o menu ao clicar fora dele) */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-30 lg:hidden backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Área Principal de Conteúdo */}
      <main className="flex-1 p-4 lg:p-8 overflow-x-hidden transition-all duration-300">
        {/* Espaçamento invisível para o botão mobile não cobrir o conteúdo no topo */}
        <div className="lg:hidden h-12" />
        {children}
      </main>
    </div>
  );
}