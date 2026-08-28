/**
 * =================================================================
 * COMPONENTE: CloseProposalModal (Sprint A4 — Fechamento com Ganho)
 * =================================================================
 * Responsabilidade: Modal que permite ao contador fechar uma proposta
 * informando o desconto praticado e visualizando em tempo real:
 * - Ganho mensal/anual
 * - Concessão (desconto em R$)
 * - Balanço líquido
 * 
 * ADR-029: Fechamento com memória de cálculo (closingDetails JSON).
 * ADR-020: Cálculos determinísticos com round2 (domínio puro).
 * =================================================================
 */
'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/axios';
import { toast } from 'sonner';
import {
  X,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Percent,
  CheckCircle2,
  Loader2,
  AlertTriangle,
} from 'lucide-react';

interface CloseProposalModalProps {
  proposalId: string;
  basePrice: number; // Preço ideal da proposta
  clientName: string;
  proposalNumber: string;
  onClose: () => void;
  onClosed: () => void; // Callback para recarregar a proposta após fechamento
}

interface GainCalculation {
  finalPrice: number;
  concessionMonthly: number;
  concessionYearly: number;
  gainMonthly: number;
  gainYearly: number;
  belowCurrent: boolean;
  steps: string[];
}

export default function CloseProposalModal({
  proposalId,
  basePrice,
  clientName,
  proposalNumber,
  onClose,
  onClosed,
}: CloseProposalModalProps) {
  const [discountPercent, setDiscountPercent] = useState(0);
  const [currentMonthly, setCurrentMonthly] = useState<number | ''>('');
  const [notes, setNotes] = useState('');
  const [closedPlanId, setClosedPlanId] = useState('');
  const [calculating, setCalculating] = useState(false);
  const [closing, setClosing] = useState(false);
  const [gain, setGain] = useState<GainCalculation | null>(null);

  // Calcula o ganho em tempo real sempre que o desconto muda
  useEffect(() => {
    if (discountPercent < 0 || discountPercent > 100) return;

    // Simulação local (mesma lógica do backend)
    const finalPrice = basePrice * (1 - discountPercent / 100);
    const concessionMonthly = basePrice - finalPrice;
    const concessionYearly = concessionMonthly * 12;
    const gainMonthly = finalPrice;
    const gainYearly = gainMonthly * 12;
    const belowCurrent =
      currentMonthly !== '' && finalPrice < Number(currentMonthly);

    setGain({
      finalPrice,
      concessionMonthly,
      concessionYearly,
      gainMonthly,
      gainYearly,
      belowCurrent,
      steps: [
        `Preço ideal: R$ ${basePrice.toFixed(2)}`,
        `Desconto: ${discountPercent}%`,
        `Preço final: R$ ${finalPrice.toFixed(2)}`,
      ],
    });
  }, [discountPercent, basePrice, currentMonthly]);

  async function handleClose() {
    if (!gain) return;

    if (
      !confirm(
        `Confirmar fechamento da proposta ${proposalNumber}?\n\n` +
        `Preço final: R$ ${gain.finalPrice.toFixed(2)}\n` +
        `Ganho mensal: R$ ${gain.gainMonthly.toFixed(2)}\n` +
        `Concessão: R$ ${gain.concessionMonthly.toFixed(2)}/mês`,
      )
    ) {
      return;
    }

    try {
      setClosing(true);
      await api.post(`/proposals/${proposalId}/close`, {
        discountPercent,
        currentMonthly: currentMonthly !== '' ? Number(currentMonthly) : undefined,
        closedPlanId: closedPlanId || undefined,
        notes: notes || undefined,
      });
      toast.success('Proposta fechada com sucesso!');
      onClosed();
      onClose();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Erro ao fechar proposta');
    } finally {
      setClosing(false);
    }
  }

  const formatCurrency = (value: number) =>
    value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Cabeçalho */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200 bg-gradient-to-r from-teal-50 to-orange-50">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <TrendingUp className="h-6 w-6 text-teal-600" />
              Fechar Proposta com Ganho
            </h2>
            <p className="text-sm text-slate-600 mt-1">
              {proposalNumber} • {clientName}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Conteúdo */}
        <div className="p-6 space-y-6">
          {/* Preço Ideal */}
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Preço Ideal (sem desconto)</p>
                <p className="text-3xl font-bold text-teal-700">
                  R$ {formatCurrency(basePrice)}
                </p>
              </div>
              <DollarSign className="h-12 w-12 text-teal-200" />
            </div>
          </div>

          {/* Desconto */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              <Percent className="h-4 w-4 inline mr-1" />
              Desconto Praticado (%)
            </label>
            <div className="flex items-center gap-4">
              <input
                type="range"
                min="0"
                max="30"
                step="1"
                value={discountPercent}
                onChange={(e) => setDiscountPercent(Number(e.target.value))}
                className="flex-1 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-teal-600"
              />
              <input
                type="number"
                min="0"
                max="100"
                value={discountPercent}
                onChange={(e) => setDiscountPercent(Number(e.target.value))}
                className="w-20 px-3 py-2 border border-slate-300 rounded-lg text-center font-bold text-teal-700"
              />
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Arraste ou digite o desconto (0-100%)
            </p>
          </div>

          {/* Valor Atual do Cliente (opcional) */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              <DollarSign className="h-4 w-4 inline mr-1" />
              Valor que o cliente paga hoje (R$) — opcional
            </label>
            <input
              type="number"
              value={currentMonthly}
              onChange={(e) =>
                setCurrentMonthly(e.target.value === '' ? '' : Number(e.target.value))
              }
              placeholder="Ex: 1500.00"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
            />
            <p className="text-xs text-slate-500 mt-1">
              Usado para calcular se o novo preço está abaixo do atual
            </p>
          </div>

          {/* Observações */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Observações do fechamento (opcional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ex: Cliente pediu desconto por fidelidade de 3 anos..."
              rows={3}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none resize-none"
            />
          </div>

          {/* Resultado do Cálculo */}
          {gain && (
            <div className="bg-gradient-to-br from-teal-50 to-orange-50 rounded-xl p-5 border-2 border-teal-200">
              <h3 className="text-sm font-bold text-teal-900 uppercase mb-4 flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Resultado do Fechamento
              </h3>

              <div className="grid grid-cols-2 gap-4">
                {/* Preço Final */}
                <div className="bg-white rounded-lg p-3 border border-teal-100">
                  <p className="text-xs text-slate-600 mb-1">Preço Final</p>
                  <p className="text-2xl font-bold text-teal-700">
                    R$ {formatCurrency(gain.finalPrice)}
                  </p>
                </div>

                {/* Ganho Mensal */}
                <div className="bg-white rounded-lg p-3 border border-green-100">
                  <p className="text-xs text-slate-600 mb-1">Ganho Mensal</p>
                  <p className="text-2xl font-bold text-green-700">
                    R$ {formatCurrency(gain.gainMonthly)}
                  </p>
                </div>

                {/* Ganho Anual */}
                <div className="bg-white rounded-lg p-3 border border-green-100">
                  <p className="text-xs text-slate-600 mb-1">Ganho Anual</p>
                  <p className="text-2xl font-bold text-green-700">
                    R$ {formatCurrency(gain.gainYearly)}
                  </p>
                </div>

                {/* Concessão Mensal */}
                <div className="bg-white rounded-lg p-3 border border-red-100">
                  <p className="text-xs text-slate-600 mb-1">Concessão (Desconto)</p>
                  <p className="text-2xl font-bold text-red-700">
                    -R$ {formatCurrency(gain.concessionMonthly)}
                  </p>
                  <p className="text-xs text-red-500">
                    = R$ {formatCurrency(gain.concessionYearly)}/ano
                  </p>
                </div>
              </div>

              {/* Alerta se abaixo do valor atual */}
              {gain.belowCurrent && (
                <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-3 flex items-start gap-2">
                  <AlertTriangle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-yellow-900">
                      Atenção: Preço final abaixo do valor atual
                    </p>
                    <p className="text-xs text-yellow-700 mt-1">
                      O novo preço (R$ {formatCurrency(gain.finalPrice)}) é menor que o valor
                      atual do cliente (R$ {formatCurrency(Number(currentMonthly))}).
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Rodapé com Ações */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-slate-200 bg-slate-50">
          <button
            onClick={onClose}
            disabled={closing}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-medium rounded-lg transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleClose}
            disabled={closing || discountPercent < 0 || discountPercent > 100}
            className="flex items-center gap-2 px-6 py-2 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50"
          >
            {closing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <CheckCircle2 className="h-4 w-4" />
            )}
            {closing ? 'Fechando...' : 'Confirmar Fechamento'}
          </button>
        </div>
      </div>
    </div>
  );
}