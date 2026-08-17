// =================================================================
// INÍCIO: components/SkillsPanel.tsx
// =================================================================
import { Play, Clock, Settings2 } from 'lucide-react';

interface Props {
  skills: any[];
  onToggle: (skillId: string, enabled: boolean) => void;
  onRunNow: (skillKey: string) => void;
}

export function SkillsPanel({ skills, onToggle, onRunNow }: Props) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
        <Settings2 className="w-5 h-5 text-indigo-600" />
        <h2 className="font-semibold text-gray-900">Habilidades da Aurora</h2>
      </div>

      <div className="divide-y divide-gray-100">
        {skills.map((skill) => (
          <div key={skill.id} className="px-5 py-4 flex items-center justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="font-medium text-gray-900">{formatSkillName(skill.skillKey)}</p>
                <span className="text-xs text-gray-400">
                  <Clock className="w-3 h-3 inline mr-0.5" />
                  {skill.cronExpr}
                </span>
              </div>
              {skill.lastRunAt && (
                <p className="text-xs text-gray-500 mt-0.5">
                  Última execução: {new Date(skill.lastRunAt).toLocaleString('pt-BR')}
                </p>
              )}
            </div>

            <div className="flex items-center gap-3 flex-shrink-0">
              <button
                onClick={() => onRunNow(skill.skillKey)}
                className="p-2 rounded-lg hover:bg-indigo-50 text-indigo-600"
                title="Rodar agora"
              >
                <Play className="w-4 h-4" />
              </button>

              {/* Toggle on/off */}
              <button
                onClick={() => onToggle(skill.id, !skill.enabled)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
                  skill.enabled ? 'bg-indigo-600' : 'bg-gray-300'
                }`}
                title={skill.enabled ? 'Desligar' : 'Ligar'}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                    skill.enabled ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>
        ))}
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
// FIM: SkillsPanel.tsx
// =================================================================