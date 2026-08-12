'use client';

// =================================================================
// 🆕 SPRINT 29: ABA DE CONCILIAÇÃO BANCO × NF-e
// =================================================================
// Componente que exibe sugestões de matching entre débitos bancários
// e NF-e de entrada, com scores de confiança e ações em lote.
// =================================================================

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import {
  CheckCircle2, XCircle, Loader2, FileText, Wallet,
  TrendingDown, AlertCircle,
} from 'lucide-react';
import api from '@/lib/axios';

const formatBRL = (v: number) =>
  Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const formatDate = (d: string) => new Date(d).toLocaleDateString('pt-BR');

interface Props {
  clientId: string;
  year: number;
  month: number;
}

export default function ReconcileTab({ clientId, year, month }: Props) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [selectedMatches, setSelectedMatches] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadSuggestions();
  }, [clientId, year, month]);

  const loadSuggestions = async () => {
    if (!clientId) return;
    setLoading(true);
    try {
      const { data: res } = await api.post('/banking/reconcile/suggest', {
        clientId,
        year,
        month,
      });
      setData(res);
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Erro ao carregar sugestões.');
    } finally {
      setLoading(false);
    }
  };

  const toggleMatch = (key: string) => {
    setSelectedMatches((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  const confirmSelected = async (action: 'confirm' | 'discard') => {
    if (selectedMatches.size === 0) {
      toast.error('Selecione pelo menos uma sugestão.');
      return;
    }

    const matches = Array.from(selectedMatches).map((key) => {
      const [bankId, invoiceId] = key.split('|');
      const suggestion = data.suggestions.find(
        (s: any) => s.bankTransaction.id === bankId && s.fiscalInvoice.id === invoiceId,
      );
      return {
        bankTransactionId: bankId,
        fiscalInvoiceId: invoiceId,
        action,
        score: suggestion?.score,
        breakdown: suggestion?.breakdown,
      };
    });

    try {
      const { data: res } = await api.post('/banking/reconcile/confirm', { matches });
      toast.success(
        action === 'confirm'
          ? `${res.confirmed} conciliação(ões) confirmada(s)!`
          : `${res.discarded} sugestão(ões) descartada(s).`,
      );
      setSelectedMatches(new Set());
      await loadSuggestions();
    } catch {
      toast.error('Erro ao processar conciliações.');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-8 w-8 text-teal-600 animate-spin" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-16 text-slate-500">
        <AlertCircle className="h-12 w-12 mx-auto mb-4" />
        <p>Selecione um cliente para ver as sugestões de conciliação.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ---------- RESUMO ---------- */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-xs text-slate-500">Débitos no mês</p>
          <p className="text-lg font-bold text-slate-900">{data.stats.totalBanks}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-xs text-slate-500">NF-e disponíveis</p>
          <p className="text-lg font-bold text-slate-900">{data.stats.totalInvoices}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-xs text-slate-500">Já conciliados</p>
          <p className="text-lg font-bold text-green-700">{data.stats.conciliado}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-xs text-slate-500">Sugestões pendentes</p>
          <p className="text-lg font-bold text-orange-600">{data.suggestions.length}</p>
        </div>
      </div>

      {/* ---------- AÇÕES EM LOTE ---------- */}
      {selectedMatches.size > 0 && (
        <div className="bg-teal-50 border border-teal-300 rounded-xl p-4 flex flex-wrap items-center gap-3">
          <p className="text-sm font-semibold text-teal-900">
            {selectedMatches.size} sugestão(ões) selecionada(s)
          </p>
          <button
            onClick={() => confirmSelected('confirm')}
            className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold rounded-lg"
          >
            ✔ Confirmar selecionadas
          </button>
          <button
            onClick={() => confirmSelected('discard')}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-lg"
          >
            ✖ Descartar selecionadas
          </button>
          <button
            onClick={() => setSelectedMatches(new Set())}
            className="text-sm text-teal-700"
          >
            Limpar
          </button>
        </div>
      )}

      {/* ---------- TABELA DE SUGESTÕES ---------- */}
      {data.suggestions.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-10 text-center text-slate-500">
          <CheckCircle2 className="h-12 w-12 mx-auto mb-4 text-green-500" />
          <p className="text-lg font-medium">Nenhuma sugestão pendente!</p>
          <p className="text-sm mt-2">Todos os débitos já foram conciliados ou não há NF-e correspondentes.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr className="text-left text-xs font-semibold text-slate-600 uppercase">
                <th className="px-4 py-3 w-10"></th>
                <th className="px-4 py-3">Débito Bancário</th>
                <th className="px-4 py-3">NF-e de Entrada</th>
                <th className="px-4 py-3 text-center">Score</th>
                <th className="px-4 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.suggestions.map((s: any) => {
                const key = `${s.bankTransaction.id}|${s.fiscalInvoice.id}`;
                const isSelected = selectedMatches.has(key);
                const scoreColor =
                  s.score >= 80 ? 'text-green-700 bg-green-50' : s.score >= 50 ? 'text-orange-700 bg-orange-50' : 'text-red-700 bg-red-50';

                return (
                  <tr key={key} className={isSelected ? 'bg-teal-50' : 'hover:bg-slate-50'}>
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleMatch(key)}
                        className="rounded"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Wallet className="h-4 w-4 text-red-600" />
                        <div>
                          <p className="font-medium text-slate-900">{s.bankTransaction.description}</p>
                          <p className="text-xs text-slate-500">
                            {formatDate(s.bankTransaction.date)} • {formatBRL(s.bankTransaction.amount)}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-teal-600" />
                        <div>
                          <p className="font-medium text-slate-900">{s.fiscalInvoice.supplier.name}</p>
                          <p className="text-xs text-slate-500">
                            NF-e {s.fiscalInvoice.number} • {formatDate(s.fiscalInvoice.emissionDate)} • {formatBRL(s.fiscalInvoice.totalValue)}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-block px-2 py-1 rounded text-xs font-bold ${scoreColor}`}>
                        {s.score.toFixed(1)}%
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => toggleMatch(key)}
                          className="p-1.5 text-slate-400 hover:text-teal-600 rounded"
                          title="Selecionar"
                        >
                          <CheckCircle2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ---------- NÃO CONCILIADOS ---------- */}
      {(data.unmatched.banks.length > 0 || data.unmatched.invoices.length > 0) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h3 className="font-bold text-slate-900 mb-3 flex items-center gap-2">
              <TrendingDown className="h-4 w-4 text-red-600" /> Débitos sem NF-e ({data.unmatched.banks.length})
            </h3>
            {data.unmatched.banks.length === 0 ? (
              <p className="text-sm text-slate-400">Todos os débitos têm correspondência.</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {data.unmatched.banks.slice(0, 10).map((b: any) => (
                  <li key={b.id} className="flex justify-between text-slate-600">
                    <span className="truncate">{b.description}</span>
                    <span className="font-semibold text-red-700">{formatBRL(b.amount)}</span>
                  </li>
                ))}
                {data.unmatched.banks.length > 10 && (
                  <li className="text-xs text-slate-400 italic">...e mais {data.unmatched.banks.length - 10}</li>
                )}
              </ul>
            )}
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h3 className="font-bold text-slate-900 mb-3 flex items-center gap-2">
              <FileText className="h-4 w-4 text-teal-600" /> NF-e sem pagamento ({data.unmatched.invoices.length})
            </h3>
            {data.unmatched.invoices.length === 0 ? (
              <p className="text-sm text-slate-400">Todas as NF-e têm pagamento correspondente.</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {data.unmatched.invoices.slice(0, 10).map((i: any) => (
                  <li key={i.id} className="flex justify-between text-slate-600">
                    <span className="truncate">{i.supplier.name} (NF {i.number})</span>
                    <span className="font-semibold text-teal-700">{formatBRL(i.totalValue)}</span>
                  </li>
                ))}
                {data.unmatched.invoices.length > 10 && (
                  <li className="text-xs text-slate-400 italic">...e mais {data.unmatched.invoices.length - 10}</li>
                )}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}