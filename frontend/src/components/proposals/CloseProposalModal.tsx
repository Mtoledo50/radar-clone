// =================================================================
// INÍCIO: frontend/src/components/proposals/CloseProposalModal.tsx
// =================================================================
// Sprint A4 — Modal "Fechar com Ganho" (Fechamento com Desconto)
//
// Filosofia: o vendedor arrasta o slider e vê AO VIVO:
//   - Preço final (com desconto)
//   - Concessão (quanto abriu mão vs preço cheio)
//   - Ganho mensal/anual vs o que o cliente paga hoje
//   - Alerta 🟡 se fechou abaixo do atual
//
// ADR-020: round2 em todos os cálculos (sem erro de ponto flutuante)
// ADR-023: optional chaining (?.) em .map de opcionais
// =================================================================
'use client';

import { useState, useMemo } from 'react';
import { X, TrendingUp, TrendingDown, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import api from '@/lib/axios';

interface CloseProposalModalProps {
  proposalId: string;
  proposalNumber: string;
  clientName: string;
  basePrice: number; // Preço cheio de referência (ideal)
  onClose: () => void;
  onClosed: () => void; // Callback após fechamento bem-sucedido
}

const round2 = (v: number) => Math.round(v * 100) / 100;

export default function CloseProposalModal({
  proposalId,
  proposalNumber,
  clientName,
  basePrice,
  onClose,
  onClosed,
}: CloseProposalModalProps) {
  const [discountPercent, setDiscountPercent] = useState(0);
  const [currentMonthly, setCurrentMonthly] = useState<number | ''>('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  // 🧮 Cálculos ao vivo (mesma fórmula do domínio puro backend)
  const calculations = useMemo(() => {
    const finalPrice = round2(basePrice * (1 - discountPercent / 100));
    const concessionMonthly = round2(basePrice - finalPrice);
    const concessionYearly = round2(concessionMonthly * 12);

    const current = currentMonthly === '' ? null : Number(currentMonthly);
    const gainMonthly = current !== null ? round2(finalPrice - current) : null;
    const gainYearly = gainMonthly !== null ? round2(gainMonthly * 12) : null;
    const belowCurrent = current !== null && finalPrice < current;

    return {
      finalPrice,
      concessionMonthly,
      concessionYearly,
      gainMonthly,
      gainYearly,
      belowCurrent,
    };
  }, [basePrice, discountPercent, currentMonthly]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const body = {
        discountPercent,
        currentMonthly: currentMonthly === '' ? undefined : Number(currentMonthly),
        notes: notes || undefined,
      };

      await api.post(`/proposals/${proposalId}/close`, body);

      toast.success(
        `✅ Proposta ${proposalNumber} fechada! Ganho: R$ ${calculations.gainMonthly?.toFixed(2) || '—'}/mês`,
      );
      onClosed();
    } catch (e: any) {
      toast.error(
        e?.response?.data?.message || 'Erro ao fechar proposta. Tente novamente.',
      );
    } finally {
      setSaving(false);
    }
  };

  const formatBRL = (v: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-teal-50 to-orange-50">
          <div>
            <h3 className="font-bold text-gray-900 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-teal-600" />
              Fechar com Ganho
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              {proposalNumber} — {clientName}
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded hover:bg-gray-100">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-auto p-6 space-y-6">
          {/* Preço cheio de referência */}
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-xs text-gray-500 font-medium mb-1">
              Preço cheio de referência (ideal)
            </p>
            <p className="text-2xl font-bold text-gray-900">
              {formatBRL(basePrice)}
              <span className="text-sm text-gray-500 font-normal ml-2">/mês</span>
            </p>
          </div>

          {/* Slider de desconto */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Desconto: <span className="font-bold text-orange-600">{discountPercent}%</span>
            </label>
            <input
              type="range"
              min="0"
              max="30"
              step="1"
              value={discountPercent}
              onChange={(e) => setDiscountPercent(Number(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-orange-500"
            />
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>0%</span>
              <span>10%</span>
              <span>20%</span>
              <span>30%</span>
            </div>
          </div>

          {/* Preço final */}
          <div className="bg-teal-50 border border-teal-200 rounded-lg p-4">
            <p className="text-xs text-teal-700 font-medium mb-1">Preço fechado</p>
            <p className="text-3xl font-bold text-teal-800">
              {formatBRL(calculations.finalPrice)}
              <span className="text-sm text-teal-600 font-normal ml-2">/mês</span>
            </p>
            <p className="text-xs text-teal-600 mt-1">
              Concessão: {formatBRL(calculations.concessionMonthly)}/mês ({formatBRL(calculations.concessionYearly)}/ano)
            </p>
          </div>

          {/* Input: cliente paga hoje (opcional) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              O que o cliente paga HOJE? <span className="text-gray-400">(opcional)</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                R$
              </span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={currentMonthly}
                onChange={(e) =>
                  setCurrentMonthly(e.target.value === '' ? '' : Number(e.target.value))
                }
                placeholder="Ex: 1200"
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Se preenchido, calculamos o ganho vs o que o cliente já paga.
            </p>
          </div>

          {/* Ganho vs hoje (se currentMonthly preenchido) */}
          {calculations.gainMonthly !== null && (
            <div
              className={`rounded-lg p-4 border ${
                calculations.belowCurrent
                  ? 'bg-red-50 border-red-200'
                  : 'bg-green-50 border-green-200'
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                {calculations.belowCurrent ? (
                  <>
                    <AlertTriangle className="w-5 h-5 text-red-600" />
                    <p className="text-sm font-bold text-red-800">
                      🟡 Fechou ABAIXO do atual!
                    </p>
                  </>
                ) : (
                  <>
                    <TrendingUp className="w-5 h-5 text-green-600" />
                    <p className="text-sm font-bold text-green-800">Ganho vs hoje</p>
                  </>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-600">Mensal</p>
                  <p
                    className={`text-xl font-bold ${
                      calculations.belowCurrent ? 'text-red-700' : 'text-green-700'
                    }`}
                  >
                    {calculations.gainMonthly >= 0 ? '+' : ''}
                    {formatBRL(calculations.gainMonthly)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">Anual</p>
                  <p
                    className={`text-xl font-bold ${
                      calculations.belowCurrent ? 'text-red-700' : 'text-green-700'
                    }`}
                  >
                    {calculations.gainYearly! >= 0 ? '+' : ''}
                    {formatBRL(calculations.gainYearly!)}
                  </p>
                </div>
              </div>
              {calculations.belowCurrent && (
                <p className="text-xs text-red-600 mt-2">
                  ⚠️ Você está cobrando menos do que o cliente já paga. Confirme se é intencional.
                </p>
              )}
            </div>
          )}

          {/* Notas (opcional) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Observações <span className="text-gray-400">(opcional)</span>
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Ex: Cliente pediu desconto de 10% para fechar hoje"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2.5 bg-teal-600 hover:bg-teal-700 disabled:bg-gray-300 text-white rounded-lg font-medium text-sm transition-colors shadow-sm"
          >
            {saving ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Fechando...
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                Fechar Proposta
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
// =================================================================
// FIM: CloseProposalModal.tsx
// =================================================================