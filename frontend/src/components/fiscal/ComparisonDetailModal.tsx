'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import {
  X,
  Loader2,
  Eye,
  Receipt,
  PackagePlus,
  SlidersHorizontal,
  BadgeCheck,
  FileSpreadsheet,
} from 'lucide-react';
import api from '@/lib/axios';

/**
 * =================================================================
 * 🔎 ComparisonDetailModal — Drill-Down da Conciliação (Sprint 15)
 * =================================================================
 * Mostra as EVIDÊNCIAS de cada origem de saldo do produto:
 *   1. 📥 Saldo Inicial (PDF/planilha — movimento SALDO_INICIAL)
 *   2. 🧾 Entradas via NF-e (nota, fornecedor, CNPJ, valores)
 *   3. ✏️ Ajustes / Devoluções
 * + Flags de procedência + fórmula auditável da conciliação.
 * =================================================================
 */
interface DetailData {
  product: {
    id: string;
    code: string;
    description: string;
    ncm: string;
    unit: string;
    currentStock: number;
    averageCost: number;
  };
  origin: { initialImport: boolean; nfe: boolean };
  initial: {
    date: string;
    quantity: number;
    unitCost: number;
    totalCost: number;
    reason: string | null;
  }[];
  entries: {
    invoiceNumber?: string;
    series?: string;
    accessKey?: string;
    emissionDate?: string;
    supplierName?: string;
    supplierCnpj?: string;
    quantity: number;
    unitCost: number;
    totalCost: number;
  }[];
  adjustments: {
    date: string;
    type: string;
    quantity: number;
    reason: string | null;
  }[];
  summary: {
    initialQty: number;
    entryQty: number;
    adjustQty: number;
    currentStock: number;
    divergence: number;
  };
}

interface Props {
  productId: string;
  onClose: () => void;
}

const formatBRL = (v: number) =>
  Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const formatQty = (v: number) => Number(v || 0).toLocaleString('pt-BR');

const formatDate = (d: string) =>
  new Date(d).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

const ADJ_LABEL: Record<string, string> = {
  AJUSTE_POSITIVO: 'Ajuste +',
  AJUSTE_NEGATIVO: 'Ajuste −',
  DEVOLUCAO: 'Devolução',
};

export default function ComparisonDetailModal({ productId, onClose }: Props) {
  const [data, setData] = useState<DetailData | null>(null);
  const [loading, setLoading] = useState(true);

  // Carrega o drill-down ao abrir
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const { data } = await api.get(
          `/fiscal/inventory/compare/${productId}/details`,
        );
        setData(data);
      } catch {
        toast.error('Erro ao carregar o detalhe da conciliação.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [productId]);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-3xl max-h-[88vh] flex flex-col">
        {/* ================= Cabeçalho ================= */}
        <div className="flex items-center justify-between p-5 border-b border-slate-200">
          <div>
            <h3 className="font-bold text-slate-900 flex items-center gap-2">
              <Eye className="h-5 w-5 text-teal-600" />
              Detalhe da Conciliação — {data?.product.code || '...'}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5 max-w-[480px] truncate">
              {data?.product.description}
            </p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* ================= Corpo ================= */}
        <div className="p-5 overflow-y-auto space-y-5">
          {loading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="h-6 w-6 text-teal-600 animate-spin" />
            </div>
          ) : (
            data && (
              <>
                {/* Flags de procedência + fórmula auditável */}
                <div className="flex flex-wrap items-center gap-2">
                  {data.origin.initialImport && (
                    <span className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                      <PackagePlus className="h-3.5 w-3.5" />
                      Veio do Estoque Inicial (PDF/planilha)
                    </span>
                  )}
                  {data.origin.nfe && (
                    <span className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700">
                      <Receipt className="h-3.5 w-3.5" />
                      Possui entradas via NF-e
                    </span>
                  )}
                  {!data.origin.initialImport && !data.origin.nfe && (
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-500">
                      Sem origem identificada
                    </span>
                  )}
                </div>

                {/* Resumo da fórmula: inicial + entradas + ajustes = atual */}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                  <div className="bg-blue-50 rounded-lg p-3 text-center">
                    <p className="text-lg font-bold text-blue-700">
                      {formatQty(data.summary.initialQty)}
                    </p>
                    <p className="text-[10px] text-blue-600">Inicial (PDF)</p>
                  </div>
                  <div className="bg-green-50 rounded-lg p-3 text-center">
                    <p className="text-lg font-bold text-green-700">
                      {formatQty(data.summary.entryQty)}
                    </p>
                    <p className="text-[10px] text-green-600">Entradas NF-e</p>
                  </div>
                  <div className="bg-orange-50 rounded-lg p-3 text-center">
                    <p className="text-lg font-bold text-orange-700">
                      {formatQty(data.summary.adjustQty)}
                    </p>
                    <p className="text-[10px] text-orange-600">Ajustes</p>
                  </div>
                  <div className="bg-teal-50 rounded-lg p-3 text-center">
                    <p className="text-lg font-bold text-teal-700">
                      {formatQty(data.summary.currentStock)}
                    </p>
                    <p className="text-[10px] text-teal-600">Saldo Atual</p>
                  </div>
                  <div
                    className={`rounded-lg p-3 text-center ${
                      Math.abs(data.summary.divergence) > 0.000001
                        ? 'bg-red-50'
                        : 'bg-slate-50'
                    }`}
                  >
                    <p
                      className={`text-lg font-bold ${
                        Math.abs(data.summary.divergence) > 0.000001
                          ? 'text-red-700'
                          : 'text-slate-500'
                      }`}
                    >
                      {formatQty(data.summary.divergence)}
                    </p>
                    <p className="text-[10px] text-slate-500">Divergência</p>
                  </div>
                </div>

                {/* ============ Seção 1: Saldo Inicial ============ */}
                <div>
                  <h4 className="text-sm font-bold text-slate-700 mb-2 flex items-center gap-1">
                    <PackagePlus className="h-4 w-4 text-blue-600" />
                    Saldo Inicial ({data.initial.length})
                  </h4>
                  {data.initial.length === 0 ? (
                    <p className="text-xs text-slate-400">
                      Este produto NÃO veio do estoque inicial.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {data.initial.map((i, idx) => (
                        <div
                          key={idx}
                          className="border border-blue-100 bg-blue-50/40 rounded-lg p-3 flex items-start justify-between gap-3"
                        >
                          <div>
                            <p className="text-xs text-slate-600">
                              Data-base: <strong>{formatDate(i.date)}</strong>
                            </p>
                            {i.reason && (
                              <p className="text-[10px] text-slate-500 mt-0.5">{i.reason}</p>
                            )}
                          </div>
                          <div className="text-right text-xs">
                            <p className="font-semibold text-slate-800">
                              {formatQty(i.quantity)} {data.product.unit}
                            </p>
                            <p className="text-slate-500">
                              {formatBRL(i.unitCost)} / un • {formatBRL(i.totalCost)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* ============ Seção 2: Entradas via NF-e ============ */}
                <div>
                  <h4 className="text-sm font-bold text-slate-700 mb-2 flex items-center gap-1">
                    <Receipt className="h-4 w-4 text-green-600" />
                    Entradas via NF-e ({data.entries.length})
                  </h4>
                  {data.entries.length === 0 ? (
                    <p className="text-xs text-slate-400">
                      Nenhuma entrada via nota fiscal.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {data.entries.map((e, idx) => (
                        <div
                          key={idx}
                          className="border border-green-100 bg-green-50/40 rounded-lg p-3 flex items-start justify-between gap-3"
                        >
                          <div className="min-w-0">
                            <p className="text-xs font-medium text-slate-800">
                              NF-e #{e.invoiceNumber} / série {e.series}
                              {e.emissionDate && ` — ${formatDate(e.emissionDate)}`}
                            </p>
                            <p className="text-[11px] text-slate-600 mt-0.5">
                              <strong>{e.supplierName}</strong>
                              {e.supplierCnpj && ` • ${e.supplierCnpj}`}
                            </p>
                            {e.accessKey && (
                              <p className="text-[9px] text-slate-400 mt-0.5 truncate">
                                {e.accessKey}
                              </p>
                            )}
                          </div>
                          <div className="text-right text-xs shrink-0">
                            <p className="font-semibold text-slate-800">
                              +{formatQty(e.quantity)} {data.product.unit}
                            </p>
                            <p className="text-slate-500">
                              {formatBRL(e.unitCost)} / un • {formatBRL(e.totalCost)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* ============ Seção 3: Ajustes / Devoluções ============ */}
                <div>
                  <h4 className="text-sm font-bold text-slate-700 mb-2 flex items-center gap-1">
                    <SlidersHorizontal className="h-4 w-4 text-orange-600" />
                    Ajustes e Devoluções ({data.adjustments.length})
                  </h4>
                  {data.adjustments.length === 0 ? (
                    <p className="text-xs text-slate-400">Nenhum ajuste registrado.</p>
                  ) : (
                    <div className="space-y-2">
                      {data.adjustments.map((a, idx) => (
                        <div
                          key={idx}
                          className="border border-orange-100 bg-orange-50/40 rounded-lg p-3 flex items-start justify-between gap-3"
                        >
                          <div>
                            <p className="text-xs font-medium text-slate-800">
                              {ADJ_LABEL[a.type] || a.type} — {formatDate(a.date)}
                            </p>
                            {a.reason && (
                              <p className="text-[10px] text-slate-500 mt-0.5">{a.reason}</p>
                            )}
                          </div>
                          <p
                            className={`text-xs font-semibold shrink-0 ${
                              a.quantity >= 0 ? 'text-green-700' : 'text-red-700'
                            }`}
                          >
                            {a.quantity >= 0 ? '+' : ''}
                            {formatQty(a.quantity)} {data.product.unit}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )
          )}
        </div>

        {/* ================= Rodapé ================= */}
        <div className="flex justify-end p-5 border-t border-slate-200">
          <button
            onClick={onClose}
            className="px-4 py-2.5 border border-slate-300 text-slate-700 font-semibold rounded-lg hover:bg-slate-50"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}