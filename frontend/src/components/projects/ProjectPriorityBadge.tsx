/**
 * =====================================================================
 * RADAR CONTA CERTA — FRONTEND — Badge de Prioridade do Projeto
 * ---------------------------------------------------------------------
 * Arquivo..: frontend/src/components/projects/ProjectPriorityBadge.tsx
 * Sprint...: 31 (Homologação Docker Compose)
 *
 * PRIORIDADES SUPORTADAS (conforme opções do filtro na página):
 *   LOW  | MEDIUM  | HIGH  | URGENT
 * =====================================================================
 */

const PRIORITY_CONFIG: Record<string, { label: string; className: string }> = {
  LOW: {
    label: 'Baixa',
    className: 'bg-slate-100 text-slate-700 border border-slate-200',
  },
  MEDIUM: {
    label: 'Média',
    className: 'bg-blue-100 text-blue-700 border border-blue-200',
  },
  HIGH: {
    label: 'Alta',
    className: 'bg-orange-100 text-orange-700 border border-orange-200',
  },
  URGENT: {
    label: 'Urgente',
    className: 'bg-red-100 text-red-700 border border-red-200',
  },
};

interface ProjectPriorityBadgeProps {
  priority: string;
}

export default function ProjectPriorityBadge({ priority }: ProjectPriorityBadgeProps) {
  const config = PRIORITY_CONFIG[priority] ?? {
    label: priority,
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