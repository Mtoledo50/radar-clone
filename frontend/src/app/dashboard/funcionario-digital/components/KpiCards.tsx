// =================================================================
// INÍCIO: components/KpiCards.tsx
// =================================================================
// 4 KPI cards do topo: runs hoje, auto-aprovados, pendências, tempo.
// Gráficos em CSS puro (ADR-001: Recharts incompatível).
// =================================================================
import { Zap, CheckCircle2, Clock, AlertCircle } from 'lucide-react';

interface Props {
  dashboard: any;
}

export function KpiCards({ dashboard }: Props) {
  if (!dashboard) return null;

  const cards = [
    {
      title: 'Runs hoje',
      value: dashboard.today.runs,
      icon: Zap,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
      subtitle: 'execuções',
    },
    {
      title: 'Auto-aprovados',
      value: dashboard.today.autoApproved,
      icon: CheckCircle2,
      color: 'text-green-600',
      bg: 'bg-green-50',
      subtitle: 'score ≥ 80%',
    },
    {
      title: 'Pendências 🟡',
      value: dashboard.pendingReview,
      icon: AlertCircle,
      color: 'text-orange-600',
      bg: 'bg-orange-50',
      subtitle: 'aguardando revisão',
    },
    {
      title: 'Tempo economizado',
      value: formatSeconds(dashboard.today.secondsSaved),
      icon: Clock,
      color: 'text-purple-600',
      bg: 'bg-purple-50',
      subtitle: 'hoje',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => (
        <div
          key={card.title}
          className={`${card.bg} rounded-xl p-5 shadow-sm border border-gray-100`}
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-gray-600 uppercase tracking-wide">
                {card.title}
              </p>
              <p className={`text-3xl font-bold ${card.color} mt-2`}>{card.value}</p>
              <p className="text-xs text-gray-500 mt-1">{card.subtitle}</p>
            </div>
            <card.icon className={`w-8 h-8 ${card.color} opacity-80`} />
          </div>
        </div>
      ))}
    </div>
  );
}

// Helper: converte segundos em "2h 15m" ou "45s"
function formatSeconds(seconds: number): string {
  if (!seconds) return '0s';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m`;
  return `${s}s`;
}
// =================================================================
// FIM: components/KpiCards.tsx
// =================================================================