import { TaskPriority } from '@/types/projects';

const PRIORITY_CONFIG: Record<TaskPriority, { label: string; className: string }> = {
  LOW: { label: 'Baixa', className: 'bg-slate-50 text-slate-600' },
  MEDIUM: { label: 'Média', className: 'bg-blue-50 text-blue-600' },
  HIGH: { label: 'Alta', className: 'bg-orange-50 text-orange-600' },
  URGENT: { label: 'Urgente', className: 'bg-red-50 text-red-600' },
};

export default function ProjectPriorityBadge({ priority }: { priority: TaskPriority }) {
  const config = PRIORITY_CONFIG[priority] || PRIORITY_CONFIG.MEDIUM;
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${config.className}`}>
      {config.label}
    </span>
  );
}