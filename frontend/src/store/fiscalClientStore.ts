import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

/**
 * =================================================================
 * 🎯 FiscalClientStore — Estado Global do Cliente Fiscal Selecionado
 * =================================================================
 * Responsável por armazenar qual cliente do escritório está ativo
 * no módulo fiscal. Este estado é compartilhado entre todas as 
 * páginas fiscais (importar NF-e, notas, estoque, apuração, SPED).
 * 
 * 🛡️ Persistência:
 *   - Salva em localStorage via Zustand persist middleware
 *   - Sobrevive a refresh da página (UX profissional)
 *   - Usa createJSONStorage para evitar erro SSR do Next.js
 * 
 * 🆕 Sprint 8:
 *   - clientId = null significa "Todos os clientes" (dados legados)
 *   - clientName é armazenado para exibição imediata sem nova API call
 * 
 * 🎨 Padrão Conta Certa:
 *   Segue o mesmo padrão do authStore.ts (Zustand + localStorage),
 *   garantindo consistência entre módulos do sistema.
 * =================================================================
 */

export interface FiscalClientSelection {
  id: string | null;      // null = "Todos os clientes"
  name: string | null;    // null quando "Todos os clientes"
}

interface FiscalClientState {
  /** Cliente atualmente selecionado (null = todos os clientes) */
  selected: FiscalClientSelection;
  
  /** 
   * Define o cliente selecionado.
   * @param client - { id, name } ou null para "Todos os clientes"
   */
  setSelected: (client: FiscalClientSelection | null) => void;
  
  /** 
   * Limpa a seleção (volta para "Todos os clientes")
   */
  clear: () => void;
}

const INITIAL_SELECTION: FiscalClientSelection = {
  id: null,
  name: null,
};

export const useFiscalClientStore = create<FiscalClientState>()(
  persist(
    (set) => ({
      selected: INITIAL_SELECTION,
      
      setSelected: (client) =>
        set({
          selected: client || INITIAL_SELECTION,
        }),
      
      clear: () => set({ selected: INITIAL_SELECTION }),
    }),
    {
      name: 'radar-fiscal-client-selection', // chave no localStorage
      storage: createJSONStorage(() => localStorage),
      // Versão para futuras migrações do estado (boa prática Zustand)
      version: 1,
    },
  ),
);