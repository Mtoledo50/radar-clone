'use client';

import { useEffect, useState } from 'react';
import { X, Settings2, Lock, RotateCcw } from 'lucide-react';
import {
  ColumnDef,
  saveSelectedKeys,
  loadSelectedKeys, // 🔄 ADICIONADO: A função correta que aceita (context, columns)
} from '@/lib/columnExport';

/**
 * =================================================================
 * ⚙️ ColumnPickerModal — Seletor de Campos da Exportação (Sprint 12)
 * =================================================================
 * Modal reutilizável que permite ao usuário escolher quais colunas
 * entram no CSV de uma determinada tela.
 * =================================================================
 */
interface Props {
  open: boolean;
  onClose: () => void;
  context: string;          // ex: "fiscal-estoque"
  columns: ColumnDef[];     // catálogo de colunas da tela
  onApply: (keys: string[]) => void;
}

export default function ColumnPickerModal({
  open,
  onClose,
  context,
  columns,
  onApply,
}: Props) {
  const [selected, setSelected] = useState<string[]>([]);

  // Carrega a seleção persistida sempre que o modal abre
  useEffect(() => {
    if (open) {
      // 🔄 CORREÇÃO: Usamos loadSelectedKeys. 
      // Ela busca no localStorage pelo 'context' e faz fallback para o padrão.
      setSelected(loadSelectedKeys(context, columns));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, context]);

  const toggle = (key: string, always?: boolean) => {
    if (always) return; // coluna obrigatória não pode ser removida
    setSelected((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key],
    );
  };

  const apply = () => {
    saveSelectedKeys(context, selected);
    onApply(selected);
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-md">
        {/* Cabeçalho */}
        <div className="flex items-center justify-between p-5 border-b border-slate-200">
          <div>
            <h3 className="font-bold text-slate-900 flex items-center gap-2">
              <Settings2 className="h-5 w-5 text-teal-600" />
              Campos da Exportação
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Escolha as colunas do CSV. A preferência fica salva.
            </p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Lista de colunas */}
        <div className="p-5 max-h-80 overflow-y-auto space-y-1">
          {columns.map((c) => {
            const checked = selected.includes(c.key);
            return (
              <button
                key={c.key}
                onClick={() => toggle(c.key, c.always)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${
                  checked ? 'bg-teal-50 text-teal-800' : 'text-slate-600 hover:bg-slate-50'
                } ${c.always ? 'cursor-not-allowed opacity-80' : ''}`}
              >
                <span className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={checked}
                    disabled={c.always}
                    onChange={() => toggle(c.key, c.always)}
                    className="rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                  />
                  {c.label}
                </span>
                {c.always && <Lock className="h-3.5 w-3.5 text-slate-400" />}
              </button>
            );
          })}
        </div>

        {/* Rodapé */}
        <div className="flex gap-2 p-5 border-t border-slate-200">
          <button
            onClick={() => setSelected(columns.map((c) => c.key))}
            className="flex items-center gap-1 px-3 py-2 text-sm text-slate-500 hover:text-slate-700"
          >
            <RotateCcw className="h-4 w-4" />
            Restaurar padrão
          </button>
          <button
            onClick={apply}
            disabled={selected.length === 0}
            className="flex-1 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-lg py-2.5 transition-colors disabled:opacity-50"
          >
            Aplicar e Salvar
          </button>
        </div>
      </div>
    </div>
  );
}