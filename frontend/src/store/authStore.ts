import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

// =================================================================
// 🍪 HELPERS DE COOKIES (para o middleware Next.js)
// =================================================================
const COOKIE_MAX_AGE = 7 * 24 * 60 * 60; // 7 dias em segundos

function setAuthCookies(token: string, role: string) {
  if (typeof document === 'undefined') return;
  document.cookie = `radar_auth_token=${token}; path=/; max-age=${COOKIE_MAX_AGE}; SameSite=Lax`;
  document.cookie = `radar_auth_role=${role}; path=/; max-age=${COOKIE_MAX_AGE}; SameSite=Lax`;
}

function clearAuthCookies() {
  if (typeof document === 'undefined') return;
  document.cookie = 'radar_auth_token=; path=/; max-age=0';
  document.cookie = 'radar_auth_role=; path=/; max-age=0';
}

// =================================================================
// 📋 TIPOS
// =================================================================
interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  companyId: string;
  allowedModules?: string[];
}

interface AuthState {
  user: User | null;
  token: string | null;
  login: (data: { user: User; token: string }) => void;
  logout: () => void;
}

// =================================================================
// 🏪 STORE DE AUTENTICAÇÃO (Zustand + Persist + Cookies)
// =================================================================
export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,

      login: (data) => {
        // 🍪 Sincroniza cookies para o middleware
        setAuthCookies(data.token, data.user.role);
        set({ user: data.user, token: data.token });
      },

      logout: () => {
        clearAuthCookies();
        set({ user: null, token: null });
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);