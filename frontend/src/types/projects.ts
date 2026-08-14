/**
 * =====================================================================
 * RADAR CONTA CERTA — FRONTEND — Tipos do Módulo de Projetos
 * ---------------------------------------------------------------------
 * VERSÃO FINAL BLINDADA (Sprint 31)
 *
 * COMPATIBILIDADE TOTAL:
 *   - Aceita `companyName` (padrão Conta Certa)
 *   - Aceita `name` (fallback para APIs legadas)
 *   - Aceita campos extras via [key: string]: any
 * =====================================================================
 */

/** Cliente vinculado ao projeto (populate do Prisma). */
export interface ProjectClient {
  id: string;
  companyName?: string;   // Padrão Conta Certa
  name?: string;          // Fallback para APIs legadas
  cnpj?: string;
  tradeName?: string;
  [key: string]: any;
}

/** Projeto — entidade principal. */
export interface Project {
  id: string;
  name: string;
  description?: string | null;
  color?: string;
  clientId?: string | null;
  client?: ProjectClient | null;
  status: string;
  priority: string;
  startDate?: string | null;
  endDate?: string | null;
  dueDate?: string | null;
  budget?: number | null;
  progress: number;
  totalTasks?: number;
  completedTasks?: number;
  createdAt: string;
  updatedAt: string;
  [key: string]: any;
}

/** Métricas dos KPIs + barra de progresso geral. */
export interface ProjectMetrics {
  total: number;
  active: number;
  completed: number;
  overdue: number;
  onHold?: number;
  totalTasks: number;
  completedTasks: number;
  overallProgress: number;
  [key: string]: any;
}

/** Filtros da listagem. */
export interface ProjectFilters {
  search?: string;
  status?: string;
  priority?: string;
  clientId?: string;
  [key: string]: any;
}

/** Payload de criação/edição. */
export interface CreateProjectDto {
  name: string;
  description?: string;
  color?: string;
  clientId?: string;
  status?: string;
  priority?: string;
  startDate?: string;
  endDate?: string;
  dueDate?: string;
  budget?: number;
  [key: string]: any;
}

/** Tarefa vinculada a projeto. */
export interface Task {
  id: string;
  title: string;
  description?: string | null;
  projectId?: string | null;
  status: string;
  priority: string;
  dueDate?: string | null;
  completedAt?: string | null;
  [key: string]: any;
}