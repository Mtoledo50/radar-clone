
---

### 📂 `docs/adrs/ADR-003-zustand-persist-ssr.md`

```markdown
# ADR-003: Zustand Persist com Segurança para SSR

**Data:** 2026-07  
**Status:** ✅ Aceita  
**Decisor:** Marcos Toledo  
**Reversível:** Sim

---

## 📋 Contexto

O frontend (Next.js 16 App Router) utiliza Zustand para gerenciamento de estado global (ex: usuário logado, tema, filtros de tabela). Precisamos persistir esse estado no `localStorage` para que o usuário não perca suas preferências ao recarregar a página.

**Problema:** O Next.js renderiza componentes no servidor (SSR). O objeto `window` e `localStorage` não existem no servidor. Tentar acessar `localStorage` diretamente durante a renderização inicial causa o erro: `ReferenceError: window is not defined` ou hidratação falha (Hydration Mismatch).

---

## 🎯 Decisão

Utilizar o middleware `persist` do Zustand, mas com configurações específicas para evitar acesso ao `window` durante o SSR. A persistência deve ser inicializada apenas no cliente, e o estado deve ser hidratado de forma segura.

---

## 💡 Implementação

```typescript
// frontend/src/store/useAuthStore.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface AuthState {
  user: { id: string; name: string; companyId: string } | null;
  token: string | null;
  setUser: (user: any) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      setUser: (user) => set({ user, token: user?.token || null }),
      logout: () => set({ user: null, token: null }),
    }),
    {
      name: 'radar-auth-storage', // nome da chave no localStorage
      storage: createJSONStorage(() => {
        // Garante que o storage só seja acessado no cliente
        if (typeof window !== 'undefined') {
          return window.localStorage;
        }
        return null; // Fallback seguro para SSR
      }),
      // Evita hidratação prematura que causa mismatch
      skipHydration: true, 
    }
  )
);

// Hook personalizado para usar o store com segurança de hidratação
import { useEffect, useState } from 'react';

export function useAuthStoreHydrated() {
  const [hydrated, setHydrated] = useState(false);
  const store = useAuthStore();

  useEffect(() => {
    setHydrated(true);
    useAuthStore.persist.rehydrate();
  }, []);

  if (!hydrated) {
    // Retorna estado inicial ou um skeleton enquanto hidrata
    return { user: null, token: null, isLoading: true };
  }

  return { ...store, isLoading: false };
}

✅ Consequências

Positivas

✅ Zero erros de SSR: Elimina window is not defined e Hydration Mismatches.
✅ Experiência do usuário: Preferências e sessão são mantidas ao recarregar.
✅ Segurança: Tokens sensíveis podem ser configurados para não persistir se necessário (apenas em memória).

Negativas

❌ Flash de conteúdo não autenticado: Pode haver um breve momento antes da hidratação onde o estado parece vazio (mitigado pelo isLoading no hook customizado).

📚 Referências

frontend/src/store/ (todos os stores que usam persist)
Documentação oficial do Zustand: https://docs.pmnd.rs/zustand/integrations/persisting-store-data

🔄 Histórico de Revisões

Data            Autor           Mudança
2026-07         Marcos Toledo   Criação inicial com skipHydration