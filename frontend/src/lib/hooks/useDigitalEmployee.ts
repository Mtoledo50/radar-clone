// =================================================================
// INÍCIO: frontend/src/lib/hooks/useDigitalEmployee.ts
// =================================================================
// Hook Zustand para o dashboard da Aurora.
// Gerencia estado + chamadas à API + optimistic updates.
// Token JWT é injetado via interceptor do axios (já existe no projeto).
// =================================================================
import { create } from 'zustand';
// ✅ CORRETO (caminho que já existe no projeto)
import api from '@/lib/axios';
// ----- Tipos (espelham o backend) -----
interface RobotWorkerSkill {
  id: string;
  skillKey: string;
  enabled: boolean;
  cronExpr: string;
  autonomy: string;
  lastRunAt: string | null;
}

interface RobotWorker {
  id: string;
  companyId: string;
  name: string;
  avatar: string;
  status: 'ACTIVE' | 'PAUSED';
  skills: RobotWorkerSkill[];
}

interface DashboardData {
  today: {
    runs: number;
    autoApproved: number;
    secondsSaved: number;
    runsList: any[];
  };
  pendingReview: number;
  lifetime: {
    itemsProcessed: number;
    itemsAutoApproved: number;
    secondsSaved: number;
  };
  lastRun: any | null;
}

interface AutomationRun {
  id: string;
  skillKey: string;
  triggerType: string;
  triggeredBy: string | null;
  status: string;
  startedAt: string;
  finishedAt: string | null;
  itemsProcessed: number;
  itemsAutoApproved: number;
  itemsPendingHuman: number;
  itemsFailed: number;
  secondsSaved: number;
  errorMessage: string | null;
}

interface AutomationPending {
  id: string;
  type: string;
  confidence: number | null;
  payload: any;
  status: string;
  createdAt: string;
}

interface AutomationAudit {
  id: string;
  actor: string;
  action: string;
  entity: string;
  entityId: string;
  detail: any;
  createdAt: string;
}

interface DigitalEmployeeState {
  worker: RobotWorker | null;
  dashboard: DashboardData | null;
  runs: AutomationRun[];
  pendings: AutomationPending[];
  audits: AutomationAudit[];
  loading: boolean;
  error: string | null;

  fetchAll: () => Promise<void>;
  toggleWorker: (status: 'ACTIVE' | 'PAUSED') => Promise<void>;
  toggleSkill: (skillId: string, enabled: boolean) => Promise<void>;
  runSkillNow: (skillKey: string) => Promise<void>;
  resolvePending: (id: string, decision: 'APPROVED' | 'REJECTED', notes?: string) => Promise<void>;
}

export const useDigitalEmployee = create<DigitalEmployeeState>((set, get) => ({
  worker: null,
  dashboard: null,
  runs: [],
  pendings: [],
  audits: [],
  loading: false,
  error: null,

  // Carrega tudo em paralelo (Promise.all)
  fetchAll: async () => {
    set({ loading: true, error: null });
    try {
      const [workerRes, dashboardRes, runsRes, pendingsRes, auditsRes] = await Promise.all([
        api.get('/digital-employee'),
        api.get('/digital-employee/dashboard'),
        api.get('/digital-employee/runs?limit=20'),
        api.get('/digital-employee/pending'),
        api.get('/digital-employee/audit?limit=50'),
      ]);
      set({
        worker: workerRes.data,
        dashboard: dashboardRes.data,
        runs: runsRes.data.value || runsRes.data,
        pendings: pendingsRes.data.value || pendingsRes.data,
        audits: auditsRes.data.value || auditsRes.data,
        loading: false,
      });
    } catch (e: any) {
      set({ error: e?.response?.data?.message || e?.message || 'Falha', loading: false });
    }
  },

  // Pausa/retoma a Aurora
  toggleWorker: async (status) => {
    try {
      const res = await api.patch('/digital-employee', { status });
      set({ worker: res.data });
    } catch (e: any) {
      set({ error: e?.response?.data?.message || 'Falha ao pausar' });
    }
  },

  // Liga/desliga uma skill
  toggleSkill: async (skillId, enabled) => {
    try {
      const res = await api.patch(`/digital-employee/skills/${skillId}`, { enabled });
      // Atualiza localmente (optimistic)
      const worker = get().worker;
      if (worker) {
        set({
          worker: {
            ...worker,
            skills: worker.skills.map((s) => (s.id === skillId ? { ...s, enabled } : s)),
          },
        });
      }
    } catch (e: any) {
      set({ error: e?.response?.data?.message || 'Falha ao atualizar skill' });
    }
  },

  // Botão "Rodar agora" (disparo manual)
  runSkillNow: async (skillKey) => {
    try {
      await api.post(`/digital-employee/skills/${skillKey}/run`);
      // Recarrega tudo após 1s (tempo do job terminar)
      setTimeout(() => get().fetchAll(), 1000);
    } catch (e: any) {
      set({ error: e?.response?.data?.message || 'Falha ao executar skill' });
    }
  },

  // Aprova/rejeita uma pendência
  resolvePending: async (id, decision, notes) => {
    try {
      await api.post(`/digital-employee/pending/${id}/resolve`, { decision, notes });
      // Remove da fila localmente
      set({ pendings: get().pendings.filter((p) => p.id !== id) });
      // Recarrega dashboard (pendências diminuiu)
      setTimeout(() => get().fetchAll(), 500);
    } catch (e: any) {
      set({ error: e?.response?.data?.message || 'Falha ao resolver pendência' });
    }
  },
}));
// =================================================================
// FIM: frontend/src/lib/hooks/useDigitalEmployee.ts
// =================================================================