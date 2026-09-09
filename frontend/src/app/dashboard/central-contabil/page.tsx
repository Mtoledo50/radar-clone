'use client';
// =================================================================
// 🏢 CENTRAL CONTÁBIL DO CLIENTE (ADR-106)
// Seleção ÚNICA de cliente + alternância Bancário ↔ Contábil.
// As páginas originais viram modos embutidos (sem cabeçalho duplicado).
// =================================================================
import { useState } from 'react';
import { Wallet, BookOpen } from 'lucide-react';
import FiscalClientSelector from '@/components/fiscal/FiscalClientSelector';
import { useFiscalClientStore } from '@/store/fiscalClientStore';
import FechamentoMensalPage from '../fechamento/page';
import LancamentosPage from '../lancamentos/page';

type Mode = 'bancario' | 'contabil';

export default function CentralContabilPage() {
  const { selected } = useFiscalClientStore();
  const [mode, setMode] = useState<Mode>('bancario');

  return (
    <div className="space-y-6">
      {/* Cabeçalho único com seleção única de cliente */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">🏢 Central Contábil do Cliente</h1>
          <p className="text-slate-600 mt-1">
            Selecione o cliente uma vez e alterne entre Bancário e Contábil sem perder o contexto.
          </p>
        </div>
        <FiscalClientSelector />
      </div>

      {/* Alternador de modo (fluxo do mês) */}
      <div className="flex gap-2 bg-slate-100 p-1 rounded-lg w-fit">
        <button
          onClick={() => setMode('bancario')}
          className={`flex items-center gap-2 px-4 py-2 rounded-md font-medium transition-colors ${
            mode === 'bancario' ? 'bg-white text-teal-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Wallet className="h-4 w-4" /> 1–4 • Extrato, Naturezas, DRE e Fechamento
        </button>
        <button
          onClick={() => setMode('contabil')}
          className={`flex items-center gap-2 px-4 py-2 rounded-md font-medium transition-colors ${
            mode === 'contabil' ? 'bg-white text-teal-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <BookOpen className="h-4 w-4" /> 5–8 • Lançamentos, Conciliação, Plano e Exportação
        </button>
      </div>

      {!selected.id ? (
        <div className="bg-white rounded-xl border border-slate-200 p-10 text-center text-slate-500">
          Selecione um cliente acima para abrir a central.
        </div>
      ) : mode === 'bancario' ? (
        <FechamentoMensalPage embedded />
      ) : (
        <LancamentosPage embedded lockedClientId={selected.id} />
      )}
    </div>
  );
}