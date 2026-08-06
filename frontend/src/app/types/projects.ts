export type ProjectStatus = 'PLANNING' | 'ACTIVE' | 'ON_HOLD' | 'COMPLETED' | 'CANCELLED';
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export interface Project {
  id: string;
  name: string;
  description?: string;
  status: ProjectStatus;
  priority: TaskPriority;
  color?: string;
  startDate?: string;
  dueDate?: string;
  completedAt?: string;
  clientId?: string;
  client?: {
    id: string;
    companyName: string;
  };
  totalTasks: number;
  completedTasks: number;
  progress: number;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectMetrics {
  total: number;
  active: number;
  onHold: number;
  completed: number;
  overdue: number;
  totalTasks: number;
  completedTasks: number;
  overallProgress: number;
}

export interface ProjectFilters {
  search?: string;
  status?: ProjectStatus | '';
  priority?: TaskPriority | '';
  clientId?: string;
}

export interface CreateProjectDto {
  name: string;
  description?: string;
  status?: ProjectStatus;
  priority?: TaskPriority;
  clientId?: string;
  startDate?: string;
  dueDate?: string;
  color?: string;
}