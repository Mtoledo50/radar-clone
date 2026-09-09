'use client';
// =================================================================
// AccountCombobox — busca por NOME + CÓDIGO UNIFICADO + CÓDIGO HIERÁRQUICO
// v2 (ADR-107): texto escuro legível + match por seq/accountNumber
// =================================================================
import { useEffect, useMemo, useRef, useState } from 'react';
import { Search, X } from 'lucide-react';

export interface ComboboxAccount {
  id: string;
  code: string;
  name: string;
  seq?: string | null;
  accountNumber?: string | null;
  type?: string;
  [key: string]: any;
}

interface Props {
  accounts: ComboboxAccount[];
  value: string; // valor atual (id ou code, conforme valueKey)
  valueKey?: 'id' | 'code';
  onSelect: (acc: ComboboxAccount | null) => void;
  placeholder?: string;
  className?: string;
}

/** Normaliza: minúsculas + sem acentos */
const norm = (s: string) =>
  (s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

/** Código unificado (Nº SCI / seq / accountNumber) */
const unified = (a: ComboboxAccount) => a.seq || a.accountNumber || '';

export default function AccountCombobox({
  accounts,
  value,
  valueKey = 'id',
  onSelect,
  placeholder = 'Buscar conta...',
  className = '',
}: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const wrapRef = useRef<HTMLDivElement>(null);

  const selected = useMemo(
    () => accounts.find((a) => (valueKey === 'id' ? a.id === value : a.code === value)) || null,
    [accounts, value, valueKey],
  );

  // Fecha ao clicar fora
  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  // 🔍 Busca: nome | código unificado | código hierárquico (com/sem pontos)
  const filtered = useMemo(() => {
    const q = norm(query.trim());
    const qDigits = q.replace(/\D/g, '');
    if (!q) return accounts.slice(0, 50);
    return accounts
      .filter((a) => {
        if (norm(a.name).includes(q)) return true;                       // nome
        if (norm(a.code).includes(q)) return true;                       // código c/ pontos
        if (qDigits && a.code.replace(/\D/g, '').includes(qDigits)) return true; // código só dígitos
        const u = unified(a);
        if (u && (norm(u).includes(q) || (qDigits && u.replace(/\D/g, '').includes(qDigits)))) return true; // Nº unificado
        return false;
      })
      .slice(0, 50);
  }, [accounts, query]);

  const label = (a: ComboboxAccount) => {
    const u = unified(a);
    return `${u ? `${u} • ` : ''}${a.code} • ${a.name}`;
  };

  return (
    <div ref={wrapRef} className={`relative ${className}`}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
        <input
          type="text"
          value={open ? query : selected ? label(selected) : ''}
          placeholder={placeholder}
          onFocus={() => { setOpen(true); setQuery(''); }}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
          className="w-full pl-9 pr-8 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 bg-white placeholder:text-slate-400 focus:ring-2 focus:ring-teal-500 focus:border-transparent"
        />
        {selected && !open && (
          <button
            type="button"
            title="Limpar"
            onClick={() => { onSelect(null); setQuery(''); }}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-red-600"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {open && (
        <div className="absolute z-50 mt-1 w-full max-h-56 overflow-y-auto bg-white border border-slate-200 rounded-lg shadow-lg">
          <button
            type="button"
            onClick={() => { onSelect(null); setOpen(false); setQuery(''); }}
            className="w-full text-left px-3 py-2 text-xs italic text-slate-500 hover:bg-slate-50"
          >
            — não mapear —
          </button>
          {filtered.length === 0 && (
            <div className="px-3 py-2 text-xs text-slate-400">Nenhuma conta encontrada.</div>
          )}
          {filtered.map((a) => {
            const u = unified(a);
            const isSel = selected?.id === a.id;
            return (
              <button
                key={a.id}
                type="button"
                onClick={() => { onSelect(a); setOpen(false); setQuery(''); }}
                className={`w-full text-left px-3 py-2 text-sm hover:bg-teal-50 flex items-center gap-2 ${
                  isSel ? 'bg-teal-50 text-teal-800' : 'text-slate-800'
                }`}
              >
                {u && (
                  <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 border border-blue-200 rounded px-1.5 py-0.5 shrink-0">
                    {u}
                  </span>
                )}
                <span className="font-mono text-xs text-slate-500 shrink-0">{a.code}</span>
                <span className="truncate">{a.name}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}