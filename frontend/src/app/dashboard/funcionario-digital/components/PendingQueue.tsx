// =================================================================
// INÍCIO: components/PendingQueue.tsx
// =================================================================
import { AlertCircle, Check, X } from 'lucide-react';
import { useState } from 'react';
import Link from 'next/link';
interface Props {
  pendings: any[];
  onResolve: (id: string, decision: 'APPROVED' | 'REJECTED', notes?: string) => void;
}

export function PendingQueue({ pendings, onResolve }: Props) {
  const [notes, setNotes] = useState<Record<string, string>>({});

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between bg-orange-50">
        <div className="flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-orange-600" />
          <h2 className="font-semibold text-gray-900">Fila de revisão 🟡</h2>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs bg-orange-200 text-orange-800 px-2 py-0.5 rounded-full font-medium">
            {pendings.length} pendências
          </span>
          <Link
            href="/dashboard/funcionario-digital/aprovacoes"
            className="text-xs font-medium text-teal-700 hover:text-teal-900 underline"
          >
            Abrir central →
          </Link>
        </div>
      </div>

      <div className="divide-y divide-gray-100 max-h-96 overflow-y-auto">
        {pendings.length === 0 ? (
          <div className="p-8 text-center text-gray-400 text-sm">
            <Check className="w-8 h-8 mx-auto mb-2 text-green-400" />
            Tudo em dia! Sem pendências aguardando revisão.
          </div>
        ) : (
          pendings.map((p) => (
            <div key={p.id} className="px-5 py-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">{p.type}</p>
                  {p.confidence !== null && (
                    <p className="text-xs text-gray-500 mt-0.5">
                      Confiança: <span className="font-medium">{p.confidence.toFixed(0)}%</span>
                    </p>
                  )}
                  <p className="text-xs text-gray-400 mt-0.5">
                    {new Date(p.createdAt).toLocaleString('pt-BR')}
                  </p>
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  <button
                    onClick={() => onResolve(p.id, 'REJECTED')}
                    className="p-1.5 rounded hover:bg-red-50 text-red-600"
                    title="Rejeitar"
                  >
                    <X className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onResolve(p.id, 'APPROVED', notes[p.id])}
                    className="p-1.5 rounded hover:bg-green-50 text-green-600"
                    title="Aprovar"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
// =================================================================
// FIM: PendingQueue.tsx
// =================================================================