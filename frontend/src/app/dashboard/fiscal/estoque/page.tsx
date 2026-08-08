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
  Eraser, // 🆕 Sprint 9: ícone da limpeza de catálogo
  Trash2, // 🆕 Sprint 9: excluir todo o estoque
  AlertTriangle, // 🆕 Sprint 9: aviso de operação destrutiva
  FileUp,
} from 'lucide-react';
import api from '@/lib/axios';
import FiscalClientSelector from '@/components/fiscal/FiscalClientSelector'; // 🆕 Sprint 8
import { useFiscalClientStore } from '@/store/fiscalClientStore'; // 🆕 Sprint 8
import InitialStockImportModal from '@/components/fiscal/InitialStockImportModal'; // 🆕 Sprint 10

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
  SALDO_INICIAL: { label: 'Saldo Inicial', className: 'bg-blue-50 text-blue-700' }, // 🆕 Sprint 10
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
// 📄 Página: Estoque Fiscal (saldo + kardex + ajustes + limpeza)
// =================================================================
// Sprint 8: Integrado com seletor de cliente fiscal.
// Quando um cliente está selecionado:
//   - KPIs calculados apenas para o estoque do cliente
//   - Grid de produtos filtrado pelo clientId
//   - Ajustes e limpeza vinculados aos produtos do cliente
// Quando "Todos os clientes" (clientId = null):
//   - Mostra/limpa apenas os produtos sem cliente (legados)
//
// Sprint 9: Botão "Limpar vazios" remove produtos órfãos
// (saldo 0 + sem kardex + sem notas) após estorno de NF-e.
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

  // =================================================================
  // 🆕 Sprint 9: Modal de limpeza de produtos vazios
  // =================================================================
    const [cleanupOpen, setCleanupOpen] = useState(false);
  const [cleaning, setCleaning] = useState(false);

  // 🆕 Sprint 9: exclusão total do estoque (operação destrutiva)
    const [wipeOpen, setWipeOpen] = useState(false);
  const [wipeText, setWipeText] = useState('');
  const [wiping, setWiping] = useState(false);

  // 🆕 Sprint 10: modal de importação de estoque inicial
  const [initialImportOpen, setInitialImportOpen] = useState(false);

  // ---------------------------------------------------------------
  // 📊 KPIs (filtrados pelo cliente selecionado)
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
  // 🆕 Sprint 9: Limpar produtos vazios (órfãos após estorno)
  // ---------------------------------------------------------------
  // Envia clientId para o backend:
  //   - Com cliente selecionado → limpa apenas produtos daquele cliente
  //   - Sem cliente (null)      → limpa apenas produtos legados (sem cliente)
  // O backend só remove produtos com saldo 0 + sem kardex + sem notas.
  // ---------------------------------------------------------------
  const confirmCleanup = async () => {
    setCleaning(true);
    try {
      const { data } = await api.post('/fiscal/products/cleanup-empty', {
        clientId: selected.id || null,
      });
      toast.success(data.message || 'Limpeza concluída.');
      setCleanupOpen(false);
      loadBalance();
      loadMetrics();
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Erro na limpeza do catálogo.');
        } finally {
      setCleaning(false);
    }
  };

  // ---------------------------------------------------------------
  // ☢️ Sprint 9: Excluir TODO o estoque do escopo selecionado
  // ---------------------------------------------------------------
  const confirmWipe = async () => {
    setWiping(true);
    try {
      const { data } = await api.post('/fiscal/inventory/wipe', {
        clientId: selected.id || null,
      });
      toast.success(
        `Estoque excluído: ${data.productsDeleted} produto(s) e ${data.movementsDeleted} movimentação(ões).`,
      );
      setWipeOpen(false);
      setWipeText('');
      loadBalance();
      loadMetrics();
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Erro ao excluir o estoque.');
    } finally {
      setWiping(false);
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

          {/* ============================================================
              🆕 Sprint 9: Botão de limpeza de produtos vazios
              Posicionado na linha de filtros, após o checkbox.
              ============================================================ */}
                    <button
            onClick={() => setCleanupOpen(true)}
            className="flex items-center gap-2 px-3 py-2 text-sm text-slate-600 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
            title="Remove produtos com saldo 0, sem kardex e sem notas vinculadas"
          >
            <Eraser className="h-4 w-4" />
            Limpar vazios
          </button>

          {/* 🆕 Sprint 9: exclusão total (vermelho = destrutivo) */}
          <button
            onClick={() => {
              setWipeText('');
              setWipeOpen(true);
            }}
            className="flex items-center gap-2 px-3 py-2 text-sm text-red-600 border border-red-300 rounded-lg hover:bg-red-50 transition-colors"
            title="Exclui TODOS os produtos e movimentações do escopo selecionado"
          >
                        <Trash2 className="h-4 w-4" />
            Excluir todo o estoque
          </button>

          {/* 🆕 Sprint 10: importação de estoque inicial */}
          <button
            onClick={() => setInitialImportOpen(true)}
            className="flex items-center gap-2 px-3 py-2 text-sm text-teal-700 border border-teal-300 rounded-lg hover:bg-teal-50 transition-colors"
            title="Importa o saldo inicial do sistema anterior (CSV ou texto do PDF)"
          >
            <FileUp className="h-4 w-4" />
            Importar estoque inicial
          </button>
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

      {/* ================================================================
          🆕 MODAL: LIMPEZA DE PRODUTOS VAZIOS (Sprint 9)
          ================================================================
          Confirmação interativa (padrão Conta Certa, sem confirm() nativo).
          Só remove produtos com saldo 0 + sem kardex + sem notas.
          ================================================================ */}
      {cleanupOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md">
            <div className="p-6">
              <div className="flex items-start gap-4">
                <div className="p-2.5 bg-orange-50 rounded-full flex-shrink-0">
                  <Eraser className="h-6 w-6 text-orange-600" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900">Limpar produtos vazios?</h3>
                  <p className="text-sm text-slate-600 mt-2">
                    Remove do catálogo os produtos com <strong>saldo zero</strong>,{' '}
                    <strong>sem movimentações</strong> e <strong>sem notas vinculadas</strong>.
                    Não apaga histórico de notas nem produtos com estoque.
                  </p>
                  {selected.id ? (
                    <p className="text-xs text-teal-700 mt-2">
                      Escopo: apenas produtos de <strong>{selected.name}</strong>.
                    </p>
                                   ) : (
                    <p className="text-xs text-slate-500 mt-2">
                      Escopo: todos os produtos vazios, de qualquer cliente.
                    </p>
                  )}
                </div>
              </div>
              <div className="flex gap-2 mt-6">
                <button
                  onClick={() => setCleanupOpen(false)}
                  className="flex-1 px-4 py-2.5 border border-slate-300 text-slate-700 font-semibold rounded-lg hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmCleanup}
                  disabled={cleaning}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-lg disabled:opacity-50"
                >
                  {cleaning && <Loader2 className="h-4 w-4 animate-spin" />}
                  {cleaning ? 'Limpando...' : 'Limpar Catálogo'}
                </button>
              </div>
            </div>
          </div>
        </div>
            )}

      {/* ================================================================
          ☢️ MODAL: EXCLUSÃO TOTAL DO ESTOQUE (Sprint 9)
          ================================================================
          Trava de segurança enterprise: o botão só habilita após
          digitar EXCLUIR. Escopo respeita o seletor de cliente.
          ================================================================ */}
      {wipeOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md">
            <div className="p-6">
              <div className="flex items-start gap-4">
                <div className="p-2.5 bg-red-50 rounded-full flex-shrink-0">
                  <AlertTriangle className="h-6 w-6 text-red-600" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900">Excluir TODO o estoque?</h3>
                  <p className="text-sm text-slate-600 mt-2">
                    Remove <strong>todos os produtos</strong> e{' '}
                    <strong>todas as movimentações</strong> do kardex{' '}
                    {selected.id ? (
                      <>
                        de <strong>{selected.name}</strong>
                      </>
                    ) : (
                      <strong>de todos os clientes</strong>
                    )}
                    . Esta ação <strong>não pode ser desfeita</strong>.
                  </p>
                  <p className="text-xs text-slate-500 mt-2">
                    As notas fiscais importadas serão mantidas, mas seus itens
                    ficarão desvinculados do catálogo.
                  </p>
                </div>
              </div>

              {/* Trava de confirmação por digitação */}
              <div className="mt-4">
                <label className="block text-xs font-medium text-slate-500 mb-1">
                  Digite <span className="font-bold text-red-600">EXCLUIR</span> para confirmar:
                </label>
                <input
                  type="text"
                  value={wipeText}
                  onChange={(e) => setWipeText(e.target.value)}
                  className="w-full px-3 py-2 border border-red-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                  placeholder="EXCLUIR"
                />
              </div>

              <div className="flex gap-2 mt-6">
                <button
                  onClick={() => setWipeOpen(false)}
                  className="flex-1 px-4 py-2.5 border border-slate-300 text-slate-700 font-semibold rounded-lg hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmWipe}
                  disabled={wiping || wipeText !== 'EXCLUIR'}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg disabled:opacity-50"
                >
                  {wiping && <Loader2 className="h-4 w-4 animate-spin" />}
                  {wiping ? 'Excluindo...' : 'Excluir Tudo'}
                </button>
              </div>
            </div>
          </div>
        </div>
           )}

      {/* 🆕 Sprint 10: modal de importação de estoque inicial */}
      {initialImportOpen && (
        <InitialStockImportModal
          onClose={() => setInitialImportOpen(false)}
          onImported={() => {
            loadBalance();
            loadMetrics();
          }}
        />
      )}
    </div>
  );
}