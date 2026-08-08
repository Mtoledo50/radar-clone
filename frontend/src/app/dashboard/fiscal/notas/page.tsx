'use client';

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import {
  Receipt,
  FileText,
  Search,
  ChevronLeft,
  ChevronRight,
  X,
  DollarSign,
  Percent,
  Building2,
  Loader2,
  Eye,
} from 'lucide-react';
import api from '@/lib/axios';
import FiscalClientSelector from '@/components/fiscal/FiscalClientSelector'; // 🆕 Sprint 8
import { useFiscalClientStore } from '@/store/fiscalClientStore'; // 🆕 Sprint 8

// =================================================================
// 📦 Tipos do frontend (espelham o backend)
// =================================================================
interface InvoiceMetrics {
  totalInvoices: number;
  totalValue: number;
  totalIcms: number;
  totalIcmsSt: number;
  totalIpi: number;
  totalPis: number;
  totalCofins: number;
  distinctSuppliers: number;
  totalItemsQuantity: number;
  totalItemsCost: number;
}

interface InvoiceRow {
  id: string;
  number: string;
  series: string;
  accessKey: string;
  emissionDate: string;
  status: string;
  totalValue: number;
  icmsValue: number;
  supplier: { id: string; name: string; cnpj: string };
  _count: { items: number };
}

interface InvoiceItem {
  id: string;
  itemNumber: number;
  description: string;
  ncm: string;
  cfop: string;
  cst?: string;
  csosn?: string;
  quantity: number;
  unitValue: number;
  totalValue: number;
  icmsValue: number;
  productMatchStatus: string;
  product?: { id: string; code: string; description: string } | null;
}

interface InvoiceDetail extends InvoiceRow {
  natOp?: string;
  discountValue: number;
  freightValue: number;
  ipiValue: number;
  pisValue: number;
  cofinsValue: number;
  items: InvoiceItem[];
}

// =================================================================
// 🎨 Helpers de formatação e status
// =================================================================
const formatBRL = (v: number) =>
  Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const formatDate = (d: string) => new Date(d).toLocaleDateString('pt-BR');

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  UPLOADED: { label: 'Recebida', className: 'bg-slate-100 text-slate-600' },
  PARSING: { label: 'Processando', className: 'bg-blue-50 text-blue-600' },
  PARSED: { label: 'Processada', className: 'bg-green-50 text-green-700' },
  PARSE_ERROR: { label: 'Erro', className: 'bg-red-50 text-red-700' },
  AWAITING_REVIEW: { label: 'Em Revisão', className: 'bg-amber-50 text-amber-700' },
  CONFIRMED: { label: 'Confirmada', className: 'bg-teal-50 text-teal-700' },
  CANCELLED: { label: 'Cancelada', className: 'bg-slate-100 text-slate-500' },
};

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.UPLOADED;
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${cfg.className}`}>
      {cfg.label}
    </span>
  );
}

// =================================================================
// 📄 Página: Notas Fiscais (consulta + detalhe)
// =================================================================
// Sprint 8: Integrado com seletor de cliente fiscal.
// Quando um cliente está selecionado:
//   - KPIs calculados apenas com notas do cliente
//   - Tabela filtrada pelo clientId
// Quando "Todos os clientes" (clientId = null):
//   - Mostra todas as notas do escritório (dados legados inclusos)
// =================================================================
export default function FiscalNotasPage() {
  // =================================================================
  // 🆕 Sprint 8: Estado global do cliente selecionado
  // OBRIGATÓRIO estar DENTRO do componente (Rules of Hooks do React)
  // =================================================================
  const { selected } = useFiscalClientStore();

  // KPIs e filtro de período
  const [metrics, setMetrics] = useState<InvoiceMetrics | null>(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Listagem
  const [invoices, setInvoices] = useState<InvoiceRow[]>([]);
  const [meta, setMeta] = useState({ total: 0, page: 1, totalPages: 0 });
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // Detalhe (modal)
  const [detail, setDetail] = useState<InvoiceDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // ---------------------------------------------------------------
  // 📊 Carrega KPIs (reage ao filtro de período + cliente selecionado)
  // ---------------------------------------------------------------
  // 🆕 Sprint 8:
  // - O parâmetro clientId é enviado para o backend
  // - selected.id entra como dependência do useCallback para recarregar
  //   automaticamente quando o usuário troca de cliente no seletor
  // ---------------------------------------------------------------
  const loadMetrics = useCallback(async () => {
    try {
      const params: any = {};
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      if (selected.id) params.clientId = selected.id; // 🆕 Sprint 8

      const { data } = await api.get('/fiscal/invoices/metrics', { params });
      setMetrics(data);
    } catch {
      // silencioso — cards ficam zerados
    }
  }, [startDate, endDate, selected.id]); // 🆕 Sprint 8: selected.id como dependência

  // ---------------------------------------------------------------
  // 📋 Carrega listagem paginada (reage a página, busca e cliente)
  // ---------------------------------------------------------------
  // 🆕 Sprint 8:
  // - clientId filtra notas apenas do cliente selecionado
  // - Ao trocar cliente, a paginação volta para 1 automaticamente
  // ---------------------------------------------------------------
  const loadInvoices = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/fiscal/invoices', {
        params: {
          page,
          limit: 10,
          search: search || undefined,
          clientId: selected.id || undefined, // 🆕 Sprint 8
        },
      });
      setInvoices(data.data || []);
      setMeta(data.meta || { total: 0, page: 1, totalPages: 0 });
    } catch {
      toast.error('Erro ao carregar notas fiscais.');
    } finally {
      setLoading(false);
    }
  }, [page, search, selected.id]); // 🆕 Sprint 8: selected.id como dependência

  // ---------------------------------------------------------------
  // Reset da paginação ao trocar de cliente (UX previsível)
  // ---------------------------------------------------------------
  useEffect(() => {
    setPage(1);
  }, [selected.id]);

  useEffect(() => {
    loadMetrics();
  }, [loadMetrics]);

  useEffect(() => {
    loadInvoices();
  }, [loadInvoices]);

  // ---------------------------------------------------------------
  // 🔍 Abre o detalhe da nota
  // ---------------------------------------------------------------
  const openDetail = async (id: string) => {
    setLoadingDetail(true);
    try {
      const { data } = await api.get(`/fiscal/invoices/${id}`);
      setDetail(data);
    } catch {
      toast.error('Erro ao carregar o detalhe da nota.');
    } finally {
      setLoadingDetail(false);
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
            <Receipt className="h-7 w-7 text-teal-600" />
            Notas Fiscais
          </h1>
          <p className="text-slate-600 mt-1">
            Consulte as NF-e importadas, impostos apurados e itens vinculados ao estoque.
          </p>
        </div>

        {/* 🆕 Sprint 8: Seletor de cliente (estado global persistido) */}
        <FiscalClientSelector />
      </div>

      {/* ================================================================
          Aviso contextual: cliente selecionado
          Mostra ao usuário qual cliente está ativo no filtro
          ================================================================ */}
      {selected.id && (
        <div className="bg-teal-50 border border-teal-200 rounded-xl p-4 flex items-center gap-3">
          <div className="p-1.5 bg-teal-100 rounded-lg">
            <Receipt className="h-4 w-4 text-teal-700" />
          </div>
          <div>
            <p className="text-sm font-medium text-teal-900">
              Visualizando notas de: <span className="font-bold">{selected.name}</span>
            </p>
            <p className="text-xs text-teal-700 mt-0.5">
              KPIs e listagem estão filtrados exclusivamente por este cliente.
            </p>
          </div>
        </div>
      )}

      {/* ================================================================
          Filtro de período (data inicial e final)
          ================================================================ */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 flex flex-wrap items-end gap-4">
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">De</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="border border-slate-300 rounded-lg px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">Até</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="border border-slate-300 rounded-lg px-3 py-2 text-sm"
          />
        </div>
        {(startDate || endDate) && (
          <button
            onClick={() => {
              setStartDate('');
              setEndDate('');
            }}
            className="text-sm text-teal-600 hover:underline"
          >
            Limpar período
          </button>
        )}
      </div>

      {/* ================================================================
          Cards de KPI (filtrados pelo cliente + período)
          ================================================================ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-teal-50 rounded-lg">
              <Receipt className="h-5 w-5 text-teal-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">
                {metrics?.totalInvoices ?? 0}
              </p>
              <p className="text-xs text-slate-500">Notas no Período</p>
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
              <p className="text-xs text-slate-500">Valor Total</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-50 rounded-lg">
              <Percent className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">
                {formatBRL(metrics?.totalIcms)}
              </p>
              <p className="text-xs text-slate-500">
                Crédito ICMS {metrics && metrics.totalIcmsSt > 0 && `(+ST ${formatBRL(metrics.totalIcmsSt)})`}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-50 rounded-lg">
              <Building2 className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">
                {metrics?.distinctSuppliers ?? 0}
              </p>
              <p className="text-xs text-slate-500">Fornecedores</p>
            </div>
          </div>
        </div>
      </div>

      {/* ================================================================
          Busca + Tabela de notas
          ================================================================ */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="relative mb-4">
          <Search className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por número, chave de acesso ou fornecedor..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>

        {loading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="h-6 w-6 text-teal-600 animate-spin" />
          </div>
        ) : invoices.length === 0 ? (
          <div className="text-center py-10 text-slate-400">
            <FileText className="h-10 w-10 mx-auto mb-2" />
            <p className="text-sm">
              {selected.id
                ? 'Nenhuma nota encontrada para este cliente.'
                : 'Nenhuma nota encontrada.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-slate-500">
                  <th className="py-2 pr-4 font-medium">NF-e</th>
                  <th className="py-2 pr-4 font-medium">Fornecedor</th>
                  <th className="py-2 pr-4 font-medium">Emissão</th>
                  <th className="py-2 pr-4 font-medium text-center">Itens</th>
                  <th className="py-2 pr-4 font-medium text-right">Total</th>
                  <th className="py-2 pr-4 font-medium text-right">ICMS</th>
                  <th className="py-2 pr-4 font-medium">Status</th>
                  <th className="py-2 font-medium text-center">Ações</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv) => (
                  <tr key={inv.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="py-3 pr-4 font-medium text-slate-800">
                      #{inv.number} / s{inv.series}
                    </td>
                    <td className="py-3 pr-4 text-slate-600">{inv.supplier?.name}</td>
                    <td className="py-3 pr-4 text-slate-600">{formatDate(inv.emissionDate)}</td>
                    <td className="py-3 pr-4 text-center text-slate-600">{inv._count?.items}</td>
                    <td className="py-3 pr-4 text-right font-semibold text-slate-800">
                      {formatBRL(inv.totalValue)}
                    </td>
                    <td className="py-3 pr-4 text-right text-slate-600">
                      {formatBRL(inv.icmsValue)}
                    </td>
                    <td className="py-3 pr-4">
                      <StatusBadge status={inv.status} />
                    </td>
                    <td className="py-3 text-center">
                      <button
                        onClick={() => openDetail(inv.id)}
                        className="p-1.5 text-slate-400 hover:text-teal-600 hover:bg-teal-50 rounded-lg"
                        title="Ver detalhe"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
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
              {meta.total} nota(s) — página {meta.page} de {meta.totalPages}
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
          MODAL DE DETALHE DA NOTA
          ================================================================ */}
      {(detail || loadingDetail) && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-3xl max-h-[85vh] overflow-y-auto">
            {loadingDetail ? (
              <div className="flex justify-center py-16">
                <Loader2 className="h-6 w-6 text-teal-600 animate-spin" />
              </div>
            ) : (
              detail && (
                <>
                  {/* Cabeçalho do modal */}
                  <div className="flex items-center justify-between p-5 border-b border-slate-200 sticky top-0 bg-white">
                    <div>
                      <h3 className="font-bold text-slate-900">
                        NF-e #{detail.number} / série {detail.series}
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {detail.supplier?.name} • {formatDate(detail.emissionDate)}
                      </p>
                    </div>
                    <button
                      onClick={() => setDetail(null)}
                      className="text-slate-400 hover:text-slate-600"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>

                  {/* Totais da nota */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-5 border-b border-slate-100">
                    <div>
                      <p className="text-xs text-slate-500">Total da Nota</p>
                      <p className="font-semibold text-slate-800">{formatBRL(detail.totalValue)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">ICMS</p>
                      <p className="font-semibold text-green-700">{formatBRL(detail.icmsValue)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">IPI</p>
                      <p className="font-semibold text-slate-800">{formatBRL(detail.ipiValue)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">PIS + COFINS</p>
                      <p className="font-semibold text-slate-800">
                        {formatBRL((detail.pisValue || 0) + (detail.cofinsValue || 0))}
                      </p>
                    </div>
                  </div>

                  {/* Itens */}
                  <div className="p-5">
                    <h4 className="text-sm font-bold text-slate-700 mb-3">
                      Itens da Nota ({detail.items.length})
                    </h4>
                    <div className="space-y-2">
                      {detail.items.map((item) => (
                        <div
                          key={item.id}
                          className="border border-slate-200 rounded-lg p-3"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="text-sm font-medium text-slate-800">
                                {item.itemNumber}. {item.description}
                              </p>
                              <p className="text-xs text-slate-500 mt-1">
                                NCM {item.ncm} • CFOP {item.cfop} •{' '}
                                {item.csosn ? `CSOSN ${item.csosn}` : `CST ${item.cst || '-'}`}
                              </p>
                              {item.product && (
                                <p className="text-xs text-teal-600 mt-0.5">
                                  → {item.product.code}: {item.product.description}
                                </p>
                              )}
                            </div>
                            <div className="text-right text-sm">
                              <p className="font-semibold text-slate-800">
                                {formatBRL(item.totalValue)}
                              </p>
                              <p className="text-xs text-slate-500">
                                {Number(item.quantity).toLocaleString('pt-BR')} ×{' '}
                                {formatBRL(item.unitValue)}
                              </p>
                              <p className="text-xs text-green-700">
                                ICMS {formatBRL(item.icmsValue)}
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
    </div>
  );
}
