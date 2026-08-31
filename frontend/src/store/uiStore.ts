// =================================================================
// ARQUIVO: frontend/src/store/uiStore.ts
// =================================================================
// Zustand store para preferências de UI e navegação (Fase E).
// Persiste no localStorage para sobreviver a refresh e relogin.
// =================================================================
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

interface UiState {
  lastVisitedPath: string | null;
  sidebarCollapsed: boolean;
  setLastVisitedPath: (path: string) => void;
  clearLastVisitedPath: () => void;
  toggleSidebar: () => void;
}

export const useUiStore = create<UiState>()(
  persist(
    (set) => ({
      lastVisitedPath: null,
      sidebarCollapsed: false,
      setLastVisitedPath: (path) => set({ lastVisitedPath: path }),
      clearLastVisitedPath: () => set({ lastVisitedPath: null }),
      toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
    }),
    {
      name: 'ui-storage', // chave no localStorage (diferente do auth-storage)
      partialize: (state) => ({
        // Persiste apenas o que importa, evitando poluir o storage com dados voláteis
        lastVisitedPath: state.lastVisitedPath,
        sidebarCollapsed: state.sidebarCollapsed,
      }),
    }
  )
);

// =================================================================
// Hook auxiliar: registra a rota atual sempre que o pathname muda
// =================================================================
export function useTrackNavigation() {
  const pathname = usePathname();
  const setLastVisitedPath = useUiStore((s) => s.setLastVisitedPath);

  useEffect(() => {
    // Ignora rotas públicas para não redirecionar o usuário de volta para o login
    if (!pathname || pathname === '/login' || pathname === '/cadastro') return;
    setLastVisitedPath(pathname);
  }, [pathname, setLastVisitedPath]);
}