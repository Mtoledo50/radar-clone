'use client';

/**
 * Layout do Dashboard - Protege todas as rotas /dashboard/*
 * 
 * COMO FUNCIONA A PROTEÇÃO:
 * 1. Aguarda o Zustand terminar de ler o localStorage (isHydrated)
 * 2. Se NÃO está logado (user === null) → redireciona para /login
 * 3. Se está logado → renderiza o dashboard normalmente
 * 
 * POR QUE ESPERAR A HIDRATAÇÃO?
 * - Sem isso, o user seria null por alguns milissegundos
 * - O layout pensaria que não está logado e redirecionaria erroneamente
 * - Isso causava o bug de "pedir login ao navegar entre páginas"
 */

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import {
  LayoutDashboard,
  Users,
  Building2,
  Briefcase,
  Calculator,
  Target,
  LogOut,
} from 'lucide-react';

/**
 * Menu de navegação do dashboard
 * 
 * ATENÇÃO: O item "Clientes" está aqui com href='/dashboard/clientes'
 * Se não aparece na tela, é cache do navegador (Ctrl+Shift+R resolve)
 */
const menuItems = [
  { label: 'Visão Geral', icon: LayoutDashboard, href: '/dashboard' },
  { label: 'Minha Empresa', icon: Building2, href: '/dashboard/minha-empresa' },
  { label: 'Gestão de Pessoas', icon: Users, href: '/dashboard/pessoas' },
  { label: 'Clientes', icon: Briefcase, href: '/dashboard/clientes' },
  { label: 'Precificação', icon: Calculator, href: '/dashboard/precificacao' },
  { label: 'Planejamento', icon: Target, href: '/dashboard/planejamento' },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { user, token, isHydrated, logout } = useAuthStore();

  /**
   * EFEITO 1: Proteção de rota
   * 
   * DEPENDÊNCIAS: [isHydrated, user, token, router]
   * - Só executa DEPOIS que isHydrated === true
   * - Se user for null (e já hidratou) → não está logado → vai para /login
   */
  useEffect(() => {
    // NÃO FAÇA NADA até a hidratação terminar
    if (!isHydrated) return;

    // Se hidratou e NÃO tem user → redireciona para login
    if (!user || !token) {
      router.push('/login');
    }
  }, [isHydrated, user, token, router]);

  /**
   * Função de logout
   * Limpa o store e redireciona para /login
   */
  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  /**
   * SE AINDA NÃO HIDRATOU: mostra tela de loading
   * Isso evita o "flash" de redirecionamento falso
   */
  if (!isHydrated) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Carregando...</p>
        </div>
      </div>
    );
  }

  /**
   * SE NÃO ESTÁ LOGADO: não renderiza nada (o useEffect já vai redirecionar)
   */
  if (!user || !token) {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-100 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-white flex flex-col">
        <div className="p-6 border-b border-slate-800">
          <h1 className="text-xl font-bold">Radar Clone</h1>
          <p className="text-sm text-slate-400 mt-1">Gestão Empresarial</p>
        </div>
        
        <nav className="flex-1 p-4 space-y-1">
          {menuItems.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-800 transition-colors text-slate-300 hover:text-white"
            >
              <item.icon className="h-5 w-5" />
              <span className="text-sm font-medium">{item.label}</span>
            </a>
          ))}
        </nav>
        
        <div className="p-4 border-t border-slate-800">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center font-bold">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user.name}</p>
              <p className="text-xs text-slate-400 truncate">{user.email}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-4 py-2 text-sm text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Sair
          </button>
        </div>
      </aside>
      
      {/* Conteúdo principal */}
      <main className="flex-1 overflow-auto">
        <div className="p-8">{children}</div>
      </main>
    </div>
  );
}