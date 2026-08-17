// =================================================================
// INÍCIO: components/RunsTimeline.tsx
// =================================================================
// Timeline das últimas execuções da Aurora (histórico visual).
// Status colorido: SUCCESS verde, PARTIAL amarelo, FAILED vermelho.
// =================================================================
import { Play, Clock, CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';

interface Props {
  runs: any[];
  onRunNow: (skillKey: string) => void;
}

const STATUS_STYLES: Record<string, { icon: any; color: string; bg: string }> = {
  SUCCESS: { icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-50' },
  PARTIAL: { icon: AlertTriangle, color: 'text-orange-600', bg: 'bg-orange-50' },
  FAILED: { icon: XCircle, color: 'text-red-600', bg: 'bg-red-50' },
  RUNNING: { icon: Clock, color: 'text-blue-600', bg: 'bg-blue-50' },
};

export function RunsTimeline({ runs, onRunNow }: Props) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
        <h2 className="font-semibold text-gray-900">Histórico de execuções</h2>
        <span className="text-xs text-gray-500">{runs.length} runs</span>
      </div>

      <div className="divide-y divide-gray-100 max-h-96 overflow-y-auto">
        {runs.length === 0 ? (
          <div className="p-8 text-center text-gray-400 text-sm">
            Nenhuma execução ainda. Clique em "Rodar agora" em uma skill.
          </div>
        ) : (
          runs.map((run) => {
            const style = STATUS_STYLES[run.status] || STATUS_STYLES.RUNNING;
            const Icon = style.icon;
            return (
              <div key={run.id} className="px-5 py-3 hover:bg-gray-50">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className={`p-1.5 rounded-lg ${style.bg} flex-shrink-0`}>
                      <Icon className={`w-4 h-4 ${style.color}`} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-sm text-gray-900 truncate">
                        {formatSkillName(run.skillKey)}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {new Date(run.startedAt).toLocaleString('pt-BR')} •{' '}
                        {run.triggerType === 'MANUAL' ? 'Manual' : 'Cron'}
                      </p>
                      {run.itemsProcessed > 0 && (
                        <p className="text-xs text-gray-600 mt-1">
                          <span className="font-medium">{run.itemsProcessed}</span> processados •{' '}
                          <span className="text-green-600">{run.itemsAutoApproved}</span> auto •{' '}
                          <span className="text-orange-600">{run.itemsPendingHuman}</span> pend.
                        </p>
                      )}
                      {run.errorMessage && (
                        <p className="text-xs text-red-600 mt-1 truncate" title={run.errorMessage}>
                          ⚠ {run.errorMessage}
                        </p>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => onRunNow(run.skillKey)}
                    className="text-gray-400 hover:text-indigo-600 flex-shrink-0"
                    title="Rodar novamente"
                  >
                    <Play className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

function formatSkillName(key: string): string {
  const map: Record<string, string> = {
    RECONCILIATION: 'Conciliação Banco × NF-e',
    CLASSIFICATION: 'Classificação c/ Memória',
    ACCOUNTING_BRIDGE: 'Ponte Bancário → Contábil',
    MONTHLY_REPORT: 'Relatório Mensal PDF',
  };
  return map[key] || key;
}
// =================================================================
// FIM: components/RunsTimeline.tsx
// =================================================================