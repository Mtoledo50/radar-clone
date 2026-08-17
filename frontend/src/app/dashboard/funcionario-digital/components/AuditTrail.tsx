// =================================================================
// INÍCIO: components/AuditTrail.tsx
// =================================================================
import { ScrollText, Bot, User } from 'lucide-react';

interface Props {
  audits: any[];
}

export function AuditTrail({ audits }: Props) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ScrollText className="w-5 h-5 text-gray-600" />
          <h2 className="font-semibold text-gray-900">Trilha de auditoria</h2>
        </div>
        <span className="text-xs text-gray-500">Compliance contábil</span>
      </div>

      <div className="divide-y divide-gray-100 max-h-80 overflow-y-auto">
        {audits.length === 0 ? (
          <div className="p-8 text-center text-gray-400 text-sm">
            Nenhum registro de auditoria ainda.
          </div>
        ) : (
          audits.map((a) => (
            <div key={a.id} className="px-5 py-3 text-sm">
              <div className="flex items-start gap-3">
                <div className="p-1.5 rounded bg-gray-100 flex-shrink-0">
                  {a.actor === 'AURORA' ? (
                    <Bot className="w-3.5 h-3.5 text-indigo-600" />
                  ) : (
                    <User className="w-3.5 h-3.5 text-gray-600" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-gray-900">
                    <span className="font-medium">{a.action}</span>{' '}
                    <span className="text-gray-500">em</span>{' '}
                    <span className="font-mono text-xs">{a.entity}</span>
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {new Date(a.createdAt).toLocaleString('pt-BR')} • {a.actor}
                  </p>
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
// FIM: AuditTrail.tsx
// =================================================================