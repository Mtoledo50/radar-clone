'use client';

/**
 * =================================================================
 * 📄 Página: Notas Fiscais (NF-e de Entrada)
 * =================================================================
 * Sprint 8: seletor de cliente fiscal (segregação de notas)
 * Sprint 9: seleção múltipla + atribuir cliente + excluir c/ estorno
 * Sprint F4: Base ICMS total e por item no modal de detalhe
 * Sprint F5: coluna "Produtos" na listagem + ordenação A–Z
 * Sprint F6 (auditoria tributária): tabela Base × Alíquota = Valor
 *   para ICMS, IPI, PIS e COFINS, com selo de conferência (✓ OK / ⚠ diverge)
 *   e explicação automática do erro + resultado esperado
 *
 * 🛡️ Regras de negócio (mantidas):
 *   - Seleção múltipla é apenas "da página atual" (não cross-page)
 *   - Exclusão é SEQUENCIAL (cada DELETE recalcula Kardex + custo médio)
 *   - Atribuir cliente em lote também atualiza movimentações + produtos
 * =================================================================
 */

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
  Trash2,
  UserPlus,
  AlertTriangle,
  ArrowUpDown,
} from 'lucide-react';
import api from '@/lib/axios';
import FiscalInfoPanel from '@/components/fiscal/FiscalInfoPanel';
import FiscalClientSelector from '@/components/fiscal/FiscalClientSelector';
import TaxAuditTable from '@/components/fiscal/TaxAuditTable'; // 🆕 Sprint F6
import { useFiscalClientStore } from '@/store/fiscalClientStore';

// =================================================================
// 📦 Tipos do frontend (espelham o backend)
// 🆕 Sprint F6: alíquotas REAIS no InvoiceItem para auditoria
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
  clientId: string | null;
  supplier: { id: string; name: string; cnpj: string };
  _count: { items: number };
  items: { description: string }[];
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

  // ICMS
  icmsBase: number;
  icmsRate: number;
  icmsValue: number;
  icmsStBase: number;
  icmsStValue: number;

  // 🆕 Sprint F6: IPI/PIS/COFINS com base + alíquota
  ipiBase: number;
  ipiRate: number;
  ipiValue: number;

  pisBase: number;
  pisRate: number;
  pisValue: number;

  cofinsBase: number;
  cofinsRate: number;
  cofinsValue: number;

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
  icmsBase: number;
  items: InvoiceItem[];
}

interface ClientOption {
  id: string;
  companyName: string;
  cnpj: string | null;
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
// 📄 Componente principal
// =================================================================
export default function FiscalNotasPage() {
  // 🆕 Sprint 8: cliente selecionado (persistido via Zustand + localStorage)
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

  // Sprint F5: ordenação ('emission' padrão | 'product' A–Z)
  const [sortBy, setSortBy] = useState<'emission' | 'product'>('emission');

  // Sprint 9: seleção múltipla
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [assignOpen, setAssignOpen] = useState(false);
  const [clients, setClients] = useState<ClientOption[]>([]);
  const [assignClientId, setAssignClientId] = useState('');
  const [assigning, setAssigning] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Detalhe (modal)
  const [detail, setDetail] = useState<InvoiceDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // ---------------------------------------------------------------
  // 📊 Carrega KPIs (reage a período + cliente selecionado)
  // ---------------------------------------------------------------
  const loadMetrics = useCallback(async () => {
    try {
      const params: any = {};
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      if (selected.id) params.clientId = selected.id;
      const { data } = await api.get('/fiscal/invoices/metrics', { params });
      setMetrics(data);
    } catch {
      // silencioso — cards ficam zerados
    }
  }, [startDate, endDate, selected.id]);

  // ---------------------------------------------------------------
  // 📋 Carrega listagem paginada
  // ---------------------------------------------------------------
  const loadInvoices = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/fiscal/invoices', {
        params: {
          page,
          limit: 10,
          search: search || undefined,
          clientId: selected.id || undefined,
          sortBy,
        },
      });
      setInvoices(data.data || []);
      setMeta(data.meta || { total: 0, page: 1, totalPages: 0 });
    } catch {
      toast.error('Erro ao carregar notas fiscais.');
    } finally {
      setLoading(false);
    }
  }, [page, search, selected.id, sortBy]);

  useEffect(() => {
    setSelectedIds([]);
  }, [page, selected.id, search]);

  useEffect(() => {
    loadMetrics();
  }, [loadMetrics]);

  useEffect(() => {
    loadInvoices();
  }, [loadInvoices]);

  // ---------------------------------------------------------------
  // ☑️ Seleção múltipla
  // ---------------------------------------------------------------
  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const allPageSelected =
    invoices.length > 0 && invoices.every((i) => selectedIds.includes(i.id));

  const toggleSelectAll = () => {
    setSelectedIds(allPageSelected ? [] : invoices.map((i) => i.id));
  };

  // ---------------------------------------------------------------
  // 🔗 Atribuir cliente em lote
  // ---------------------------------------------------------------
  const openAssignModal = async () => {
    setAssignClientId('');
    setAssignOpen(true);
    try {
      const { data } = await api.get('/clients', { params: { limit: 500 } });
      const list: ClientOption[] = Array.isArray(data)
        ? data
        : data?.data || data?.clients || [];
      setClients(list);
    } catch {
      toast.error('Erro ao carregar clientes.');
    }
  };

  const confirmAssign = async () => {
    if (!assignClientId) {
      toast.error('Selecione um cliente para vincular.');
      return;
    }
    setAssigning(true);
    try {
      await api.patch('/fiscal/invoices/assign-client', {
        invoiceIds: selectedIds,
        clientId: assignClientId,
      });
      toast.success(`${selectedIds.length} nota(s) vinculada(s) ao cliente!`);
      setAssignOpen(false);
      setSelectedIds([]);
      loadInvoices();
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Erro ao vincular notas.');
    } finally {
      setAssigning(false);
    }
  };

  // ---------------------------------------------------------------
  // 🗑️ Excluir com estorno (individual ou em lote)
  // ---------------------------------------------------------------
  const askDelete = (id?: string) => {
    setDeleteTargetId(id || null);
    setDeleteOpen(true);
  };

  const confirmDelete = async () => {
    const ids = deleteTargetId ? [deleteTargetId] : selectedIds;
    if (ids.length === 0) return;

    setDeleting(true);
    let ok = 0;
    let fail = 0;

    // SEQUENCIAL — mantém integridade do Kardex
    for (const id of ids) {
      try {
        await api.delete(`/fiscal/invoices/${id}`);
        ok++;
      } catch {
        fail++;
      }
    }

    if (ok > 0) toast.success(`${ok} nota(s) excluída(s) com estorno de estoque.`);
    if (fail > 0) toast.error(`${fail} nota(s) não puderam ser excluídas.`);

    setDeleteOpen(false);
    setDeleteTargetId(null);
    setSelectedIds([]);
    setDeleting(false);
    loadInvoices();
    loadMetrics();
  };

  // ---------------------------------------------------------------
  // 🔍 Abre o detalhe da nota (modal)
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

  const deleteCount = deleteTargetId ? 1 : selectedIds.length;

  // ---------------------------------------------------------------
  // 🎨 Renderização
  // ---------------------------------------------------------------
  return (
    <div className="space-y-6">
      {/* Cabeçalho + seletor de cliente */}
      <div className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Receipt className="h-7 w-7 text-teal-600" />
            Notas Fiscais
          </h1>
          <p className="text-slate-600 mt-1">
            Consulte, vincule a clientes e exclua NF-e importadas.
          </p>
        </div>
        <FiscalClientSelector />
      </div>

      <FiscalInfoPanel page="notas" />

      {/* Aviso contextual: cliente selecionado */}
      {selected.id && (
        <div className="bg-teal-50 border border-teal-200 rounded-xl p-4 flex items-center gap-3">
          <div className="p-1.5 bg-teal-100 rounded-lg">
            <Receipt className="h-4 w-4 text-teal-700" />
          </div>
          <div>
            <p className="text-sm font-medium text-teal-900">
              Visualizando notas de: <span className="font-bold">{selected.name}</span>
            </p>
          </div>
        </div>
      )}

      {/* Filtro de período */}
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

      {/* Cards de KPI */}
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
                {formatBRL(metrics?.totalValue ?? 0)}
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
                {formatBRL(metrics?.totalIcms ?? 0)}
              </p>
              <p className="text-xs text-slate-500">
                Crédito ICMS{' '}
                {metrics && metrics.totalIcmsSt > 0 && `(+ST ${formatBRL(metrics.totalIcmsSt)})`}
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

      {/* Busca + ordenação + ações em lote + tabela */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="relative flex-1">
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
          <div className="relative">
            <ArrowUpDown className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <select
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value as 'emission' | 'product');
                setPage(1);
              }}
              className="pl-9 pr-8 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
              title="Ordenação da lista de notas"
            >
              <option value="emission">Mais recentes</option>
              <option value="product">Produto (A–Z)</option>
            </select>
          </div>
        </div>

        {/* Barra de ações em lote */}
        {selectedIds.length > 0 && (
          <div className="mb-4 bg-teal-50 border border-teal-200 rounded-lg px-4 py-3 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm font-medium text-teal-900">
              {selectedIds.length} nota(s) selecionada(s)
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={openAssignModal}
                className="flex items-center gap-2 px-3 py-2 bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold rounded-lg transition-colors"
                title="Vincular notas selecionadas a um cliente"
              >
                <UserPlus className="h-4 w-4" />
                Atribuir Cliente
              </button>
              <button
                onClick={() => askDelete()}
                className="flex items-center gap-2 px-3 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-lg transition-colors"
                title="Excluir com estorno de estoque"
              >
                <Trash2 className="h-4 w-4" />
                Excluir
              </button>
              <button
                onClick={() => setSelectedIds([])}
                className="text-sm text-slate-500 hover:text-slate-700 px-2"
              >
                Limpar
              </button>
            </div>
          </div>
        )}

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
                  <th className="py-2 pr-2 w-8">
                    <input
                      type="checkbox"
                      checked={allPageSelected}
                      onChange={toggleSelectAll}
                      className="rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                      title="Selecionar todas da página atual"
                    />
                  </th>
                  <th className="py-2 pr-4 font-medium">NF-e</th>
                  <th className="py-2 pr-4 font-medium">Fornecedor</th>
                  <th className="py-2 pr-4 font-medium">Produtos</th>
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
                  <tr
                    key={inv.id}
                    className={`border-b border-slate-100 hover:bg-slate-50 ${
                      selectedIds.includes(inv.id) ? 'bg-teal-50/50' : ''
                    }`}
                  >
                    <td className="py-3 pr-2">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(inv.id)}
                        onChange={() => toggleSelect(inv.id)}
                        className="rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                      />
                    </td>
                    <td className="py-3 pr-4 font-medium text-slate-800">
                      #{inv.number} / s{inv.series}
                      {inv.clientId && (
                        <span
                          className="ml-2 inline-block w-2 h-2 rounded-full bg-teal-500"
                          title="Vinculada a um cliente"
                        />
                      )}
                    </td>
                    <td className="py-3 pr-4 text-slate-600">{inv.supplier?.name}</td>
                    <td className="py-3 pr-4 text-slate-600 max-w-[240px]">
                      {inv.items && inv.items.length > 0 ? (
                        <>
                          <p
                            className="truncate"
                            title={inv.items.map((it) => it.description).join('\n')}
                          >
                            {inv.items[0]?.description}
                          </p>
                          {inv.items.length > 1 && (
                            <span className="text-xs text-teal-600 font-medium">
                              +{inv.items.length - 1} produto(s)
                            </span>
                          )}
                        </>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
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
                    <td className="py-3">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => openDetail(inv.id)}
                          className="p-1.5 text-slate-400 hover:text-teal-600 hover:bg-teal-50 rounded-lg"
                          title="Ver detalhe"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => askDelete(inv.id)}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                          title="Excluir nota (com estorno de estoque)"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Paginação */}
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
          MODAL DE DETALHE DA NOTA — 🆕 Sprint F6: auditoria tributária
          ================================================================ */}
      {(detail || loadingDetail) && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
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
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 p-5 border-b border-slate-100">
                    <div>
                      <p className="text-xs text-slate-500">Total da Nota</p>
                      <p className="font-semibold text-slate-800">
                        {formatBRL(Number(detail.totalValue ?? 0))}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Base ICMS</p>
                      <p className="font-semibold text-blue-700">
                        {formatBRL(Number(detail.icmsBase ?? 0))}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">ICMS</p>
                      <p className="font-semibold text-green-700">
                        {formatBRL(Number(detail.icmsValue ?? 0))}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">IPI</p>
                      <p className="font-semibold text-slate-800">
                        {formatBRL(Number(detail.ipiValue ?? 0))}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">PIS + COFINS</p>
                      <p className="font-semibold text-slate-800">
                        {formatBRL(
                          Number(detail.pisValue ?? 0) + Number(detail.cofinsValue ?? 0),
                        )}
                      </p>
                    </div>
                  </div>

                  {/* ================================================================
                      🆕 Sprint F6: Itens com AUDITORIA TRIBUTÁRIA
                      Cada item renderiza o componente TaxAuditTable que faz:
                      - Tabela Base × Alíquota = Valor por ICMS/IPI/PIS/COFINS
                      - Selo ✓ OK (bate) / ⚠ diverge
                      - Linha explicativa com erro + resultado esperado
                      ================================================================ */}
                                   <div className="p-5">
                    {/* 🆕 Sprint F6.1: resumo de itens + unidades totais */}
                    <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                      <h4 className="text-sm font-bold text-slate-700 flex items-center gap-2">
                        Itens da Nota ({detail.items.length})
                        <span className="text-xs font-normal text-slate-500">
                          (com auditoria tributária base × alíquota)
                        </span>
                      </h4>
                      {/* Badge com total de unidades da nota */}
                      <div className="flex items-center gap-2 px-3 py-1.5 bg-teal-50 border border-teal-200 rounded-lg">
                        <Receipt className="h-3.5 w-3.5 text-teal-700" />
                        <span className="text-xs font-semibold text-teal-900">
                          {detail.items.length} {detail.items.length === 1 ? 'item' : 'itens'} •{' '}
                          {Number(
                            detail.items.reduce(
                              (acc, it) => acc + Number(it.quantity ?? 0),
                              0,
                            ),
                          ).toLocaleString('pt-BR')}{' '}
                          unidades
                        </span>
                      </div>
                    </div>
                    <div className="space-y-3">
                      {detail.items.map((item) => (
                        <div
                          key={item.id}
                          className="border border-slate-200 rounded-lg p-3 bg-slate-50/50"
                        >
                          {/* Cabeçalho do item */}
                          <div className="flex items-start justify-between gap-3 mb-2">
                            <div className="flex-1 min-w-0">
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
                                                       <div className="text-right text-sm space-y-1">
                              {/* 🆕 Sprint F6.1: selo de quantidade destacado */}
                              <span className="inline-block px-2 py-0.5 bg-blue-50 border border-blue-200 rounded text-xs font-semibold text-blue-800">
                                Qtd: {Number(item.quantity ?? 0).toLocaleString('pt-BR')}{' '}
                                {item.product?.unit ?? 'UN'}
                              </span>
                              <p className="font-semibold text-slate-800">
                                {formatBRL(Number(item.totalValue ?? 0))}
                              </p>
                              <p className="text-xs text-slate-500">
                                {Number(item.quantity).toLocaleString('pt-BR')} ×{' '}
                                {formatBRL(Number(item.unitValue ?? 0))}
                              </p>
                            </div>
                          </div>

                          {/* 🆕 Sprint F6: auditoria tributária isolada em componente */}
                          <TaxAuditTable item={item} />
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
          MODAL: ATRIBUIR CLIENTE (Sprint 9)
          ================================================================ */}
      {assignOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md">
            <div className="flex items-center justify-between p-5 border-b border-slate-200">
              <div>
                <h3 className="font-bold text-slate-900 flex items-center gap-2">
                  <UserPlus className="h-5 w-5 text-teal-600" />
                  Atribuir Cliente
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Vincula {selectedIds.length} nota(s) + estoque ao cliente escolhido.
                </p>
              </div>
              <button
                onClick={() => setAssignOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">
                  Cliente de destino
                </label>
                <select
                  value={assignClientId}
                  onChange={(e) => setAssignClientId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  <option value="">Selecione um cliente...</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.companyName}
                      {c.cnpj ? ` — ${c.cnpj}` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="bg-slate-50 rounded-lg p-3 text-xs text-slate-600">
                <p className="font-medium text-slate-700 mb-1">O que será vinculado:</p>
                <ul className="list-disc list-inside space-y-0.5">
                  <li>As notas selecionadas</li>
                  <li>As movimentações de estoque dessas notas</li>
                  <li>Os produtos ainda sem cliente</li>
                </ul>
              </div>

              <button
                onClick={confirmAssign}
                disabled={assigning || !assignClientId}
                className="w-full flex items-center justify-center gap-2 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-lg py-2.5 transition-colors disabled:opacity-50"
              >
                {assigning && <Loader2 className="h-4 w-4 animate-spin" />}
                {assigning ? 'Vinculando...' : 'Vincular ao Cliente'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================================================================
          MODAL: CONFIRMAÇÃO DE EXCLUSÃO (Sprint 9)
          ================================================================ */}
      {deleteOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md">
            <div className="p-6">
              <div className="flex items-start gap-4">
                <div className="p-2.5 bg-red-50 rounded-full flex-shrink-0">
                  <AlertTriangle className="h-6 w-6 text-red-600" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900">
                    Excluir {deleteCount} nota(s)?
                  </h3>
                  <p className="text-sm text-slate-600 mt-2">
                    Esta ação remove a(s) nota(s) e <strong>reverte o estoque</strong>{' '}
                    (saldo e custo médio recalculados). Não pode ser desfeita.
                  </p>
                </div>
              </div>

              <div className="flex gap-2 mt-6">
                <button
                  onClick={() => {
                    setDeleteOpen(false);
                    setDeleteTargetId(null);
                  }}
                  className="flex-1 px-4 py-2.5 border border-slate-300 text-slate-700 font-semibold rounded-lg hover:bg-slate-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmDelete}
                  disabled={deleting}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50"
                >
                  {deleting && <Loader2 className="h-4 w-4 animate-spin" />}
                  {deleting ? 'Excluindo...' : 'Excluir com Estorno'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}