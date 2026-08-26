/**
 * =================================================================
 * ClosingModal.tsx — Modal de Fechamento com Ganho (Sprint A4)
 * =================================================================
 * Interface para o vendedor registrar o fechamento de uma proposta.
 *
 * 🎯 Funcionalidades:
 * - Toggle WON/LOST
 * - Slider de desconto (0–50%) + input manual de preço
 * - Preview em tempo real: preço final, ganho/concessão mensal/anual
 * - Se LOST: campo obrigatório de motivo da perda
 * - Se WON: campo opcional de passos da negociação (memória A4)
 * - Alerta visual quando estamos cobrando MENOS que o cliente paga hoje
 *
 * 🧠 Arquitetura:
 * - Matemática client-side via `calcClosingGain` (preview instantâneo)
 * - Fonte da verdade: backend POST /proposals/:id/close
 * - Toast Sonner no sucesso/erro
 *
 * ADRs respeitadas:
 * - ADR-021: Lucide icons com wrapper <span title>
 * - ADR-023: optional chaining em .map de opcionais
 * - ADR-024: Sonner action/cancel com onClick
 * =================================================================
 */

'use client';

import { useState, useEffect, useMemo } from 'react';
import { X, TrendingUp, TrendingDown, AlertTriangle, DollarSign, CheckCircle2, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import  api  from '@/lib/axios';
import { calcClosingGain, formatBRL } from '@/lib/closing-gain';

// ============================================================================
// TIPOS
// ============================================================================

interface Plan {
  id: string;
  name: string;
  multiplier: number;
  calculatedPrice?: number; // vem do getPlansWithInsights (A2)
}

export interface ProposalForClosing {
  id: string;
  clientName: string;
  /** Valor que o cliente paga hoje (vem do Client.monthlyFee ou da proposta) */
  currentPrice: number;
  /** Lista de planos disponíveis para escolher no fechamento */
  availablePlans: Plan[];
}

interface ClosingModalProps {
  proposal: ProposalForClosing | null;
  onClose: () => void;
  onSuccess: () => void; // callback para refresh da lista
}

// ============================================================================
// COMPONENTE
// ============================================================================

export function ClosingModal({ proposal, onClose, onSuccess }: ClosingModalProps) {
  // Estado do formulário
  const [outcome, setOutcome] = useState<'WON' | 'LOST'>('WON');
  const [planId, setPlanId] = useState<string>('');
  const [finalPrice, setFinalPrice] = useState<number>(0);
  const [discountPercent, setDiscountPercent] = useState<number>(0);
  const [steps, setSteps] = useState<string>('');
  const [lossReason, setLossReason] = useState<string>('');
  const [saving, setSaving] = useState(false);

  // Plano selecionado (derivado)
  const selectedPlan = useMemo(
    () => proposal?.availablePlans.find(p => p.id === planId),
    [planId, proposal?.availablePlans]
  );

  // Preço base do plano escolhido
  const basePrice = selectedPlan?.calculatedPrice ?? 0;

  // ========================================================================
  // EFEITOS: sincronização bidirecional slider ↔ input
  // ========================================================================
  useEffect(() => {
    // Quando muda o plano, reseta o preço pro valor cheio dele
    if (selectedPlan && selectedPlan.calculatedPrice) {
      setFinalPrice(selectedPlan.calculatedPrice);
      setDiscountPercent(0);
    }
  }, [selectedPlan]);

  // Quando slider muda → recalcula preço final
  const handleDiscountChange = (percent: number) => {
    setDiscountPercent(percent);
    const newPrice = basePrice * (1 - percent / 100);
    setFinalPrice(Math.round(newPrice * 100) / 100);
  };

  // Quando input de preço muda → recalcula desconto
  const handlePriceChange = (price: number) => {
    setFinalPrice(price);
    const pct = basePrice > 0 ? ((basePrice - price) / basePrice) * 100 : 0;
    setDiscountPercent(Math.round(pct * 10) / 10);
  };

  // ========================================================================
  // CÁLCULO EM TEMPO REAL (preview)
  // ========================================================================
  const gain = useMemo(
    () => calcClosingGain({
      basePrice,
      currentPrice: proposal?.currentPrice ?? 0,
      finalPrice,
    }),
    [basePrice, finalPrice, proposal?.currentPrice]
  );

  // ========================================================================
  // SUBMIT
  // ========================================================================
  const handleSubmit = async () => {
    if (!proposal) return;

    // Validações
    if (outcome === 'WON') {
      if (!planId) return toast.error('Escolha o plano fechado');
      if (finalPrice <= 0) return toast.error('Preço final deve ser maior que zero');
    } else {
      if (!lossReason.trim()) return toast.error('Informe o motivo da perda');
    }

    setSaving(true);
    try {
      await api.post(`/proposals/${proposal.id}/close`, {
        outcome,
        finalPrice: outcome === 'WON' ? finalPrice : null,
        closedPlanId: outcome === 'WON' ? planId : null,
        steps: outcome === 'WON' ? steps || undefined : undefined,
        lossReason: outcome === 'LOST' ? lossReason : undefined,
      });

      toast.success(
        outcome === 'WON'
          ? `Proposta fechada com ganho de ${formatBRL(gain.gainMonthly)}/mês! 🎉`
          : 'Proposta marcada como perdida. Memória registrada para aprendizado.',
        { duration: 4000 }
      );
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Erro ao fechar proposta:', err);
      toast.error(err?.response?.data?.message || 'Erro ao fechar proposta');
    } finally {
      setSaving(false);
    }
  };

  if (!proposal) return null;

  // ========================================================================
  // RENDER
  // ========================================================================
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <div>
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-teal-600" />
              Fechar Proposta
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              Cliente: <span className="font-semibold text-slate-700">{proposal.clientName}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            aria-label="Fechar"
          >
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          {/* Toggle WON/LOST */}
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setOutcome('WON')}
              className={`p-4 rounded-lg border-2 transition-all ${
                outcome === 'WON'
                  ? 'border-teal-600 bg-teal-50 text-teal-900'
                  : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
              }`}
            >
              <TrendingUp className="w-5 h-5 mx-auto mb-1" />
              <div className="font-semibold">Fechada (Ganha)</div>
              <div className="text-xs mt-1">Cliente aceitou a proposta</div>
            </button>

            <button
              type="button"
              onClick={() => setOutcome('LOST')}
              className={`p-4 rounded-lg border-2 transition-all ${
                outcome === 'LOST'
                  ? 'border-red-600 bg-red-50 text-red-900'
                  : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
              }`}
            >
              <XCircle className="w-5 h-5 mx-auto mb-1" />
              <div className="font-semibold">Perdida</div>
              <div className="text-xs mt-1">Cliente não fechou</div>
            </button>
          </div>

          {/* ================================================================= */}
          {/* RAMO WON: plano + desconto + métricas                              */}
          {/* ================================================================= */}
          {outcome === 'WON' && (
            <>
              {/* Escolha do plano */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Plano fechado
                </label>
                <select
                  value={planId}
                  onChange={(e) => setPlanId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                >
                  <option value="">Selecione...</option>
                  {proposal.availablePlans.map(plan => (
                    <option key={plan.id} value={plan.id}>
                      {plan.name} — {formatBRL(plan.calculatedPrice ?? 0)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Slider de desconto + input manual */}
              {selectedPlan && (
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm font-medium text-slate-700">
                        Desconto concedido
                      </label>
                      <span className="text-sm font-bold text-orange-600">
                        {discountPercent.toFixed(1)}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="50"
                      step="0.5"
                      value={discountPercent}
                      onChange={(e) => handleDiscountChange(parseFloat(e.target.value))}
                      className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-orange-500"
                    />
                    <div className="flex justify-between text-xs text-slate-500 mt-1">
                      <span>0% (preço cheio)</span>
                      <span>50%</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Preço final (R$/mês)
                    </label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="number"
                        step="0.01"
                        value={finalPrice}
                        onChange={(e) => handlePriceChange(parseFloat(e.target.value) || 0)}
                        className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                      />
                    </div>
                  </div>

                  {/* Cards de métricas (preview em tempo real) */}
                  <div className="grid grid-cols-2 gap-3">
                    <MetricCard
                      label="Concessão mensal"
                      value={formatBRL(gain.concessionMonthly)}
                      hint="Deixou na mesa"
                      tone="orange"
                      icon={<TrendingDown className="w-4 h-4" />}
                    />
                    <MetricCard
                      label="Concessão anual"
                      value={formatBRL(gain.concessionYearly)}
                      hint="×12 meses"
                      tone="orange"
                    />
                    <MetricCard
                      label="Ganho mensal"
                      value={formatBRL(gain.gainMonthly)}
                      hint="vs. cobrado hoje"
                      tone={gain.gainMonthly >= 0 ? 'teal' : 'red'}
                      icon={<TrendingUp className="w-4 h-4" />}
                    />
                    <MetricCard
                      label="Ganho anual"
                      value={formatBRL(gain.gainYearly)}
                      hint="×12 meses"
                      tone={gain.gainYearly >= 0 ? 'teal' : 'red'}
                    />
                  </div>

                  {/* Alerta: abaixo do preço atual */}
                  {gain.belowCurrent && (
                    <div className="flex items-start gap-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                      <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                      <div className="text-sm">
                        <p className="font-semibold text-amber-900">
                          Atenção: estamos cobrando MENOS que o cliente paga hoje
                        </p>
                        <p className="text-amber-700 mt-0.5">
                          Diferença de {formatBRL(Math.abs(gain.gainMonthly))}/mês.
                          Considere justificar nos passos da negociação.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Passos da negociação (memória A4) */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Passos da negociação <span className="text-slate-400">(opcional)</span>
                    </label>
                    <textarea
                      value={steps}
                      onChange={(e) => setSteps(e.target.value)}
                      placeholder="Ex: Cliente pediu 15% de desconto, fechei em 8% com pagamento anual..."
                      rows={3}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 resize-none"
                    />
                    <p className="text-xs text-slate-500 mt-1">
                      💡 Esta memória alimenta o dashboard de desempenho (Sprint A7).
                    </p>
                  </div>
                </div>
              )}
            </>
          )}

          {/* ================================================================= */}
          {/* RAMO LOST: motivo da perda                                         */}
          {/* ================================================================= */}
          {outcome === 'LOST' && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Motivo da perda <span className="text-red-500">*</span>
              </label>
              <textarea
                value={lossReason}
                onChange={(e) => setLossReason(e.target.value)}
                placeholder="Ex: Cliente optou por concorrente com preço 30% menor..."
                rows={4}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 resize-none"
                required
              />
              <p className="text-xs text-slate-500 mt-1">
                📊 O motivo será agregado no dashboard de desempenho (Sprint A7).
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-slate-200 bg-slate-50">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={saving}
            className={`px-5 py-2 text-sm font-medium text-white rounded-lg disabled:opacity-50 ${
              outcome === 'WON'
                ? 'bg-teal-600 hover:bg-teal-700'
                : 'bg-red-600 hover:bg-red-700'
            }`}
          >
            {saving ? 'Salvando...' : outcome === 'WON' ? 'Confirmar Fechamento' : 'Registrar Perda'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// SUBCOMPONENTE: Card de Métrica
// ============================================================================
interface MetricCardProps {
  label: string;
  value: string;
  hint?: string;
  tone: 'teal' | 'orange' | 'red';
  icon?: React.ReactNode;
}

function MetricCard({ label, value, hint, tone, icon }: MetricCardProps) {
  const toneClasses = {
    teal: 'bg-teal-50 border-teal-200 text-teal-900',
    orange: 'bg-orange-50 border-orange-200 text-orange-900',
    red: 'bg-red-50 border-red-200 text-red-900',
  };

  return (
    <div className={`p-3 border rounded-lg ${toneClasses[tone]}`}>
      <div className="flex items-center gap-1 text-xs font-medium opacity-80 mb-1">
        {icon}
        {label}
      </div>
      <div className="text-lg font-bold">{value}</div>
      {hint && <div className="text-xs opacity-70 mt-0.5">{hint}</div>}
    </div>
  );
}