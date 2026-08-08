'use client';

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import {
  Package,
  Search,
  ChevronLeft,
  ChevronRight,
  X,
  DollarSign,
  Boxes,
  Barcode,
  History,
  SlidersHorizontal,
  Loader2,
  ArrowDownCircle,
  ArrowUpCircle,
} from 'lucide-react';
import api from '@/lib/axios';
import FiscalClientSelector from '@/components/fiscal/FiscalClientSelector'; // 🆕 Sprint 8
import { useFiscalClientStore } from '@/store/fiscalClientStore'; // 🆕 Sprint 8

// =================================================================
// 📦 Tipos do frontend (espelham o backend)
// =================================================================
interface InventoryMetrics {
  totalProducts: number;
  productsWithStock: number;
  totalQuantity: number;
  totalValue: number;
  distinctNcms: number;
  distinctSuppliers: number;
  topProducts: {
    id: string;
    code: string;
    description: string;
    quantity: number;
    unitCost: number;
    totalValue: number;
  }[];
}

interface ProductBalance {
  id: string;
  code: string;
  description: string;
  ncm: string;
  unit: string;
  currentStock: number;
  averageCost: number;
  totalValue: number;
  movementsCount: number;
}

interface Movement {
  id: string;
  date: string;
  type: string;
  quantity: number;
  unitCost: number;
  totalCost: number;
  averageCostAfter: number;
  reason: string | null;
  invoice: {
    id: string;
    number: string;
    series: string;
    supplier: { name: string; cnpj: string };
  } | null;
}

interface KardexData {
  product: {
    id: string;
    code: string;
    description: string;
    ncm: string;
    unit: string;
    currentStock: number;
    averageCost: number;
  };
  movements: Movement[];
}

// =================================================================
// 🎨 Helpers
// =================================================================
const formatBRL = (v: number) =>
  Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const formatQty = (v: number) => Number(v || 0).toLocaleString('pt-BR');

const formatDate = (d: string) =>
  new Date(d).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

const MOVEMENT_CONFIG: Record<string, { label: string; className: string }> = {
  ENTRADA: { label: 'Entrada', className: 'bg-green-50 text-green-700' },
  DEVOLUCAO: { label: 'Devolução', className: 'bg-red-50 text-red-700' },
  AJUSTE_POSITIVO: { label: 'Ajuste +', className: 'bg-teal-50 text-teal-700' },
  AJUSTE_NEGATIVO: { label: 'Ajuste −', className: 'bg-orange-50 text-orange-700' },
};

function MovementBadge({ type }: { type: string }) {
  const cfg = MOVEMENT_CONFIG[type] || MOVEMENT_CONFIG.ENTRADA;
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${cfg.className}`}>
      {cfg.label}
    </span>
  );
}

// =================================================================
// 📄 Página: Estoque Fiscal (saldo + kardex + ajustes)
// =================================================================
// Sprint 8: Integrado com seletor de cliente fiscal.
// Quando um cliente está selecionado:
//   - KPIs calculados apenas para o estoque do cliente
//   - Grid de produtos filtrado pelo clientId
//   - Ajustes vinculados aos produtos do cliente
// Quando "Todos os clientes" (clientId = null):
//   - Mostra todos os produtos do escritório (dados legados inclusos)
// =================================================================
export default function FiscalEstoquePage() {
  // =================================================================
  // 🆕 Sprint 8: Estado global do cliente selecionado (Zustand)
  // OBRIGATÓRIO estar DENTRO do componente (Rules of Hooks do React)
  // =================================================================
  const { selected } = useFiscalClientStore();

  const [metrics, setMetrics] = useState<InventoryMetrics | null>(null);

  const [products, setProducts] = useState<ProductBalance[]>([]);
  const [meta, setMeta] = useState({ total: 0, page: 1, totalPages: 0 });
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [ncm, setNcm] = useState('');
  const [onlyPositive, setOnlyPositive] = useState(false);
  const [loading, setLoading] = useState(true);

  // Modal Kardex
  const [kardex, setKardex] = useState<KardexData | null>(null);
  const [loadingKardex, setLoadingKardex] = useState(false);

  // Modal Ajuste
  const [adjustTarget, setAdjustTarget] = useState<ProductBalance | null>(null);
  const [adjustType, setAdjustType] = useState<'AJUSTE_POSITIVO' | 'AJUSTE_NEGATIVO'>(
    'AJUSTE_POSITIVO',
  );
  const [adjustQty, setAdjustQty] = useState('');
  const [adjustReason, setAdjustReason] = useState('');
  const [savingAdjust, setSavingAdjust] = useState(false);

  // ---------------------------------------------------------------
  // 📊 KPIs (filtrados pelo cliente selecionado)
  // ---------------------------------------------------------------
  // 🆕 Sprint 8:
  // - clientId enviado para o backend
  // - selected.id como dependência → recarrega ao trocar de cliente
  // ---------------------------------------------------------------
  const loadMetrics = useCallback(async () => {
    try {
      const { data } = await api.get('/fiscal/inventory/metrics', {
        params: { clientId: selected.id || undefined }, // 🆕 Sprint 8
      });
      setMetrics(data);
    } catch {
      // silencioso — cards ficam zerados
    }
  }, [selected.id]); // 🆕 Sprint 8

  // ---------------------------------------------------------------
  // 📋 Saldo por produto (filtrado pelo cliente selecionado)
  // ---------------------------------------------------------------
  const loadBalance = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/fiscal/inventory/balance', {
        params: {
          page,
          limit: 15,
          search: search || undefined,
          ncm: ncm || undefined,
          onlyPositive: onlyPositive ? 'true' : undefined,
          clientId: selected.id || undefined, // 🆕 Sprint 8
        },
      });
      setProducts(data.data || []);
      setMeta(data.meta || { total: 0, page: 1, totalPages: 0 });
    } catch {
      toast.error('Erro ao carregar o estoque.');
    } finally {
      setLoading(false);
    }
  }, [page, search, ncm, onlyPositive, selected.id]); // 🆕 Sprint 8

  // Reset da paginação ao trocar de cliente (UX previsível)
  useEffect(() => {
    setPage(1);
  }, [selected.id]);

  useEffect(() => {
    loadMetrics();
  }, [loadMetrics]);

  useEffect(() => {
    loadBalance();
  }, [loadBalance]);

  // ---------------------------------------------------------------
  // 📜 Abrir Kardex (histórico de movimentações do produto)
  // ---------------------------------------------------------------
  const openKardex = async (product: ProductBalance) => {
    setLoadingKardex(true);
    setKardex(null);
    try {
      const { data } = await api.get(
        `/fiscal/inventory/movements/${product.id}`,
      );
      setKardex(data);
    } catch {
      toast.error('Erro ao carregar o kardex.');
    } finally {
      setLoadingKardex(false);
    }
  };

  // ---------------------------------------------------------------
  // ✏️ Registrar ajuste de inventário (sobra/quebra)
  // ---------------------------------------------------------------
  const submitAdjust = async () => {
    if (!adjustTarget) return;

    setSavingAdjust(true);
    try {
      await api.post('/fiscal/inventory/adjust', {
        productId: adjustTarget.id,
        type: adjustType,
        quantity: Number(adjustQty),
        reason: adjustReason,
      });
      toast.success('Ajuste de inventário registrado!');
      setAdjustTarget(null);
      setAdjustQty('');
      setAdjustReason('');
      loadBalance();
      loadMetrics();
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Erro ao registrar ajuste.');
    } finally {
      setSavingAdjust(false);
    }
  };

  // ---------------------------------------------------------------
  // 🎨 Renderização
  // ---------------------------------------------------------------
  return (
    <div className="space-y-6">
      {/* ================================================================
          Cabeçalho com título + seletor de cliente
          ================================================================ */}
      <div className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Package className="h-7 w-7 text-teal-600" />
            Estoque Fiscal
          </h1>
          <p className="text-slate-600 mt-1">
            Saldo por produto, custo médio ponderado e kardex completo para apuração de ICMS.
          </p>
        </div>

        {/* 🆕 Sprint 8: Seletor de cliente (estado global persistido) */}
        <FiscalClientSelector />
      </div>

      {/* ================================================================
          Aviso contextual: cliente selecionado
          ================================================================ */}
      {selected.id && (
        <div className="bg-teal-50 border border-teal-200 rounded-xl p-4 flex items-center gap-3">
          <div className="p-1.5 bg-teal-100 rounded-lg">
            <Package className="h-4 w-4 text-teal-700" />
          </div>
          <div>
            <p className="text-sm font-medium text-teal-900">
              Visualizando estoque de: <span className="font-bold">{selected.name}</span>
            </p>
            <p className="text-xs text-teal-700 mt-0.5">
              KPIs, produtos e kardex estão filtrados exclusivamente por este cliente.
            </p>
          </div>
        </div>
      )}

      {/* ================================================================
          Cards de KPI (filtrados pelo cliente selecionado)
          ================================================================ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-teal-50 rounded-lg">
              <Boxes className="h-5 w-5 text-teal-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">
                {metrics?.totalProducts ?? 0}
              </p>
              <p className="text-xs text-slate-500">Produtos no Catálogo</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 rounded-lg">
              <DollarSign className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">
                {formatBRL(metrics?.totalValue)}
              </p>
              <p className="text-xs text-slate-500">Valor em Estoque</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-50 rounded-lg">
              <Package className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">
                {metrics?.productsWithStock ?? 0}
              </p>
              <p className="text-xs text-slate-500">Produtos com Saldo</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-50 rounded-lg">
              <Barcode className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">
                {metrics?.distinctNcms ?? 0}
              </p>
              <p className="text-xs text-slate-500">NCMs Distintos</p>
            </div>
          </div>
        </div>
      </div>

      {/* ================================================================
          Filtros + Tabela de produtos
          ================================================================ */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por descrição ou código..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
          <input
            type="text"
            placeholder="Filtrar por NCM"
            value={ncm}
            onChange={(e) => {
              setNcm(e.target.value);
              setPage(1);
            }}
            className="w-40 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
          <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
            <input
              type="checkbox"
              checked={onlyPositive}
              onChange={(e) => {
                setOnlyPositive(e.target.checked);
                setPage(1);
              }}
              className="rounded border-slate-300 text-teal-600 focus:ring-teal-500"
            />
            Apenas com saldo
          </label>
        </div>

        {loading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="h-6 w-6 text-teal-600 animate-spin" />
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-10 text-slate-400">
            <Package className="h-10 w-10 mx-auto mb-2" />
            <p className="text-sm">
              {selected.id
                ? 'Nenhum produto encontrado para este cliente.'
                : 'Nenhum produto encontrado.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-slate-500">
                  <th className="py-2 pr-4 font-medium">Código</th>
                  <th className="py-2 pr-4 font-medium">Descrição</th>
                  <th className="py-2 pr-4 font-medium">NCM</th>
                  <th className="py-2 pr-4 font-medium text-center">Saldo</th>
                  <th className="py-2 pr-4 font-medium text-right">Custo Médio</th>
                  <th className="py-2 pr-4 font-medium text-right">Valor Total</th>
                  <th className="py-2 font-medium text-center">Ações</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => (
                  <tr key={p.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="py-3 pr-4 font-medium text-slate-800">{p.code}</td>
                    <td className="py-3 pr-4 text-slate-600 max-w-[280px] truncate">
                      {p.description}
                    </td>
                    <td className="py-3 pr-4 text-slate-600">{p.ncm}</td>
                    <td className="py-3 pr-4 text-center font-semibold text-slate-800">
                      {formatQty(p.currentStock)} {p.unit}
                    </td>
                    <td className="py-3 pr-4 text-right text-slate-600">
                      {formatBRL(p.averageCost)}
                    </td>
                    <td className="py-3 pr-4 text-right font-semibold text-slate-800">
                      {formatBRL(p.totalValue)}
                    </td>
                    <td className="py-3">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => openKardex(p)}
                          className="p-1.5 text-slate-400 hover:text-teal-600 hover:bg-teal-50 rounded-lg"
                          title="Ver Kardex"
                        >
                          <History className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setAdjustTarget(p)}
                          className="p-1.5 text-slate-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg"
                          title="Ajuste de inventário"
                        >
                          <SlidersHorizontal className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ================================================================
            Paginação
            ================================================================ */}
        {meta.totalPages > 1 && (
          <div className="flex items-center justify-between mt-4">
            <p className="text-xs text-slate-500">
              {meta.total} produto(s) — página {meta.page} de {meta.totalPages}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="p-2 border border-slate-300 rounded-lg disabled:opacity-40 hover:bg-slate-50"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={() => setPage((p) => Math.min(meta.totalPages, p + 1))}
                disabled={page >= meta.totalPages}
                className="p-2 border border-slate-300 rounded-lg disabled:opacity-40 hover:bg-slate-50"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ================================================================
          MODAL KARDEX (histórico de movimentações do produto)
          ================================================================ */}
      {(kardex || loadingKardex) && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-3xl max-h-[85vh] overflow-y-auto">
            {loadingKardex ? (
              <div className="flex justify-center py-16">
                <Loader2 className="h-6 w-6 text-teal-600 animate-spin" />
              </div>
            ) : (
              kardex && (
                <>
                  <div className="flex items-center justify-between p-5 border-b border-slate-200 sticky top-0 bg-white">
                    <div>
                      <h3 className="font-bold text-slate-900">
                        Kardex — {kardex.product.code}
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {kardex.product.description} • NCM {kardex.product.ncm}
                      </p>
                    </div>
                    <button
                      onClick={() => setKardex(null)}
                      className="text-slate-400 hover:text-slate-600"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>

                  <div className="grid grid-cols-3 gap-3 p-5 border-b border-slate-100">
                    <div>
                      <p className="text-xs text-slate-500">Saldo Atual</p>
                      <p className="font-semibold text-slate-800">
                        {formatQty(kardex.product.currentStock)} {kardex.product.unit}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Custo Médio</p>
                      <p className="font-semibold text-slate-800">
                        {formatBRL(kardex.product.averageCost)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Movimentações</p>
                      <p className="font-semibold text-slate-800">
                        {kardex.movements.length}
                      </p>
                    </div>
                  </div>

                  <div className="p-5">
                    <h4 className="text-sm font-bold text-slate-700 mb-3">
                      Histórico de Movimentações
                    </h4>
                    <div className="space-y-2">
                      {kardex.movements.map((m) => (
                        <div key={m.id} className="border border-slate-200 rounded-lg p-3">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="flex items-center gap-2">
                                <MovementBadge type={m.type} />
                                <p className="text-xs text-slate-500">
                                  {formatDate(m.date)}
                                </p>
                              </div>
                              {m.invoice && (
                                <p className="text-xs text-slate-600 mt-1">
                                  NF-e #{m.invoice.number} — {m.invoice.supplier?.name}
                                </p>
                              )}
                              {m.reason && (
                                <p className="text-xs text-slate-500 mt-0.5">{m.reason}</p>
                              )}
                            </div>
                            <div className="text-right text-sm">
                              <p
                                className={`font-semibold ${
                                  m.quantity >= 0 ? 'text-green-700' : 'text-red-700'
                                }`}
                              >
                                {m.quantity >= 0 ? '+' : ''}
                                {formatQty(m.quantity)}
                              </p>
                              <p className="text-xs text-slate-500">
                                {formatBRL(m.unitCost)} / un
                              </p>
                              <p className="text-xs text-slate-500">
                                média após: {formatBRL(m.averageCostAfter)}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )
            )}
          </div>
        </div>
      )}

      {/* ================================================================
          MODAL AJUSTE DE INVENTÁRIO (sobra/quebra)
          ================================================================ */}
      {adjustTarget && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md">
            <div className="flex items-center justify-between p-5 border-b border-slate-200">
              <div>
                <h3 className="font-bold text-slate-900">Ajuste de Inventário</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {adjustTarget.code} — saldo atual:{' '}
                  {formatQty(adjustTarget.currentStock)} {adjustTarget.unit}
                </p>
              </div>
              <button
                onClick={() => setAdjustTarget(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">
                  Tipo de ajuste
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setAdjustType('AJUSTE_POSITIVO')}
                    className={`flex items-center justify-center gap-2 rounded-lg py-2 text-sm font-medium border ${
                      adjustType === 'AJUSTE_POSITIVO'
                        ? 'border-teal-500 bg-teal-50 text-teal-700'
                        : 'border-slate-300 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <ArrowUpCircle className="h-4 w-4" />
                    Sobra (+)
                  </button>
                  <button
                    onClick={() => setAdjustType('AJUSTE_NEGATIVO')}
                    className={`flex items-center justify-center gap-2 rounded-lg py-2 text-sm font-medium border ${
                      adjustType === 'AJUSTE_NEGATIVO'
                        ? 'border-orange-500 bg-orange-50 text-orange-700'
                        : 'border-slate-300 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <ArrowDownCircle className="h-4 w-4" />
                    Quebra (−)
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">
                  Quantidade
                </label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={adjustQty}
                  onChange={(e) => setAdjustQty(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                  placeholder="0"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">
                  Justificativa (obrigatória)
                </label>
                <textarea
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                  placeholder="Ex: sobra apurada em inventário físico de agosto/2026"
                />
              </div>

              <button
                onClick={submitAdjust}
                disabled={savingAdjust || !adjustQty || adjustReason.trim().length < 5}
                className="w-full bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-lg py-2.5 transition-colors disabled:opacity-50"
              >
                {savingAdjust ? 'Registrando...' : 'Registrar Ajuste'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}