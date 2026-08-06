import { ProjectStatus } from '@/types/projects';

const STATUS_CONFIG: Record<ProjectStatus, { label: string; className: string }> = {
  PLANNING: { label: 'Planejamento', className: 'bg-blue-50 text-blue-700' },
  ACTIVE: { label: 'Ativo', className: 'bg-teal-50 text-teal-700' },
  ON_HOLD: { label: 'Pausado', className: 'bg-amber-50 text-amber-700' },
  COMPLETED: { label: 'Concluído', className: 'bg-emerald-50 text-emerald-700' },
  CANCELLED: { label: 'Cancelado', className: 'bg-slate-100 text-slate-500' },
};

export default function ProjectStatusBadge({ status }: { status: ProjectStatus }) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.PLANNING;
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${config.className}`}>
      {config.label}
    </span>
  );
}