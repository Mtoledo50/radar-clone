// =================================================================
// INÍCIO: frontend/src/store/clientContextStore.ts
// =================================================================
/**
 * 🎯 ADR-077 — Contexto de Cliente Ativo
 * Guarda o cliente "em trabalho" de forma global e persistida.
 * Todas as telas da rotina contábil abrem já com ele selecionado,
 * eliminando re-busca e perda de foco do contador.
 */
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

interface ClientContextState {
  activeClientId: string | null;
  activeClientName: string | null;
  setActiveClient: (id: string | null, name?: string | null) => void;
}

export const useClientContextStore = create<ClientContextState>()(
  persist(
    (set) => ({
      activeClientId: null,
      activeClientName: null,
      setActiveClient: (id, name = null) => set({ activeClientId: id, activeClientName: name }),
    }),
    { name: 'radar-client-context', storage: createJSONStorage(() => localStorage) },
  ),
);
// =================================================================
// FIM: frontend/src/store/clientContextStore.ts
// =================================================================