/**
 * =====================================================================
 * RADAR CONTA CERTA — FRONTEND — Badge de Status do Projeto
 * ---------------------------------------------------------------------
 * Arquivo..: frontend/src/components/projects/ProjectStatusBadge.tsx
 * Sprint...: 31 (Homologação Docker Compose)
 *
 * STATUS SUPORTADOS (conforme opções do filtro na página):
 *   PLANNING  | ACTIVE  | ON_HOLD  | COMPLETED  | CANCELLED
 * =====================================================================
 */

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  PLANNING: {
    label: 'Planejamento',
    className: 'bg-blue-100 text-blue-700 border border-blue-200',
  },
  ACTIVE: {
    label: 'Ativo',
    className: 'bg-teal-100 text-teal-700 border border-teal-200',
  },
  ON_HOLD: {
    label: 'Pausado',
    className: 'bg-slate-100 text-slate-700 border border-slate-200',
  },
  COMPLETED: {
    label: 'Concluído',
    className: 'bg-emerald-100 text-emerald-700 border border-emerald-200',
  },
  CANCELLED: {
    label: 'Cancelado',
    className: 'bg-red-100 text-red-700 border border-red-200',
  },
};

interface ProjectStatusBadgeProps {
  status: string;
}

export default function ProjectStatusBadge({ status }: ProjectStatusBadgeProps) {
  const config = STATUS_CONFIG[status] ?? {
    label: status,
    className: 'bg-slate-100 text-slate-700 border border-slate-200',
  };

  return (
    <span
      className={`inline-flex px-2.5 py-1 text-xs font-semibold rounded-full ${config.className}`}
    >
      {config.label}
    </span>
  );
}