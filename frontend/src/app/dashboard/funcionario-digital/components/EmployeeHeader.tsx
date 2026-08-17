// =================================================================
// INÍCIO: components/EmployeeHeader.tsx
// =================================================================
// Cabeçalho da Aurora: avatar, nome, status e botão de pausa/retoma.
// =================================================================
import { PlayCircle, PauseCircle, Sparkles } from 'lucide-react';

interface Props {
  worker: any;
  onToggle: () => void;
}

export function EmployeeHeader({ worker, onToggle }: Props) {
  if (!worker) return null;

  const isActive = worker.status === 'ACTIVE';

  return (
    <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl p-6 shadow-sm border border-indigo-100">
      <div className="flex items-center justify-between flex-wrap gap-4">
        {/* Lado esquerdo: avatar + nome + status */}
        <div className="flex items-center gap-4">
          <div className="text-5xl">{worker.avatar || '🌅'}</div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-gray-900">{worker.name}</h1>
              <Sparkles className="w-5 h-5 text-indigo-500" />
            </div>
            <p className="text-sm text-gray-600">
              Funcionária Digital Radar • {worker.skills?.length || 0} habilidades
            </p>
            <div className="flex items-center gap-2 mt-1">
              <span
                className={`inline-block w-2 h-2 rounded-full ${
                  isActive ? 'bg-green-500 animate-pulse' : 'bg-gray-400'
                }`}
              />
              <span className="text-xs font-medium text-gray-700">
                {isActive ? 'Trabalhando' : 'Em pausa'}
              </span>
            </div>
          </div>
        </div>

        {/* Lado direito: botão de ação */}
        <button
          onClick={onToggle}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium transition ${
            isActive
              ? 'bg-orange-500 hover:bg-orange-600 text-white'
              : 'bg-green-500 hover:bg-green-600 text-white'
          }`}
        >
          {isActive ? (
            <>
              <PauseCircle className="w-5 h-5" /> Pausar Aurora
            </>
          ) : (
            <>
              <PlayCircle className="w-5 h-5" /> Retomar Aurora
            </>
          )}
        </button>
      </div>
    </div>
  );
}
// =================================================================
// FIM: components/EmployeeHeader.tsx
// =================================================================