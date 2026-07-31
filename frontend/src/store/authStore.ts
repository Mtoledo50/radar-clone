import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface User { id: string; name: string; email: string; role: string; }

interface AuthState {
  user: User | null;
  token: string | null;
  isHydrated: boolean;
  setUser: (user: User, token: string) => void;
  logout: () => void;
  setHydrated: (state: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null, token: null, isHydrated: false,
      setUser: (user, token) => set({ user, token }),
      logout: () => set({ user: null, token: null }),
      setHydrated: (state) => set({ isHydrated: state }),
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true);
      },
    }
  )
);