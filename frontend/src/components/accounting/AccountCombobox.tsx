'use client';

/**
 * =================================================================
 * 🔍 AccountCombobox — Autocomplete de contas contábeis
 * =================================================================
 * Sprint 25.2.2: substitui <select> por busca digitável.
 *   • Filtra por CÓDIGO ou NOME (sem sensibilidade a acento/case)
 *   • Teclado: ↑ ↓ navega • Enter seleciona • Esc fecha
 *   • Botão ✕ limpa ("não mapear")
 *   • Lista inline (não corta dentro de modais com scroll)
 * =================================================================
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { Check, ChevronDown, Search, X } from 'lucide-react';

export interface AccountOption {
  id: string;
  code: string;
  name: string;
}

interface Props {
  accounts: AccountOption[];
  /** valor atual (código ou id, conforme valueKey) */
  value: string;
  valueKey?: 'code' | 'id';
  onSelect: (acc: AccountOption | null) => void;
  placeholder?: string;
  className?: string;
}

/** normaliza p/ busca sem acento/case */
const norm = (s: string) =>
  (s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

export default function AccountCombobox({
  accounts,
  value,
  valueKey = 'code',
  onSelect,
  placeholder = 'Digite código ou nome...',
  className = '',
}: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [highlight, setHighlight] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const selected = useMemo(
    () => accounts.find((a) => a[valueKey] === value) || null,
    [accounts, value, valueKey],
  );

  /** filtra por código OU nome; limita 50 p/ performance */
  const filtered = useMemo(() => {
    const q = norm(query.trim());
    if (!q) return accounts.slice(0, 50);
    return accounts
      .filter((a) => norm(a.code).includes(q) || norm(a.name).includes(q))
      .slice(0, 50);
  }, [accounts, query]);

  // reset do highlight quando a lista muda
  useEffect(() => {
    setHighlight(0);
  }, [query]);

  const pick = (acc: AccountOption) => {
    onSelect(acc);
    setOpen(false);
    setQuery('');
  };

  const clear = () => {
    onSelect(null);
    setOpen(false);
    setQuery('');
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setOpen(false);
      setQuery('');
      return;
    }
    if (!open && (e.key === 'ArrowDown' || e.key === 'Enter')) {
      setOpen(true);
      return;
    }
    if (!open) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlight((h) => Math.min(h + 1, Math.max(filtered.length - 1, 0)));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlight((h) => Math.max(h - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filtered[highlight]) pick(filtered[highlight]);
    }
  };

  return (
    <div className={className}>
      {/* Campo de busca */}
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
        <input
          ref={inputRef}
          value={open ? query : selected ? `${selected.code} — ${selected.name}` : ''}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder={placeholder}
          className="w-full pl-8 pr-12 py-1.5 border border-slate-300 rounded text-xs bg-white focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none"
        />
        <div className="absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center gap-0.5">
          {selected && !open && (
            <button type="button" onClick={clear} title="Limpar (não mapear)" className="p-0.5 text-slate-400 hover:text-red-600">
              <X className="h-3 w-3" />
            </button>
          )}
          <button
            type="button"
            onClick={() => {
              setOpen((v) => !v);
              setQuery('');
              inputRef.current?.focus();
            }}
            className="p-0.5 text-slate-400 hover:text-slate-600"
          >
            <ChevronDown className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Lista de resultados (inline p/ não cortar no scroll do modal) */}
      {open && (
        <div className="mt-1 border border-slate-200 rounded-lg shadow-lg bg-white max-h-48 overflow-y-auto">
          <button
            type="button"
            onClick={clear}
            className="w-full text-left px-3 py-1.5 text-xs text-slate-500 italic hover:bg-slate-50"
          >
            — não mapear —
          </button>
          {filtered.length === 0 && (
            <div className="px-3 py-2 text-xs text-slate-400">
              Nenhuma conta encontrada para "{query}".
            </div>
          )}
          {filtered.map((a, i) => (
            <button
              key={a.id}
              type="button"
              onClick={() => pick(a)}
              onMouseEnter={() => setHighlight(i)}
              className={`w-full text-left px-3 py-1.5 text-xs flex items-center gap-2 ${
                i === highlight ? 'bg-teal-50 text-teal-800' : 'text-slate-700'
              }`}
            >
              <span className="font-mono font-semibold shrink-0">{a.code}</span>
              <span className="truncate">{a.name}</span>
              {selected?.id === a.id && <Check className="h-3 w-3 ml-auto text-teal-600 shrink-0" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}