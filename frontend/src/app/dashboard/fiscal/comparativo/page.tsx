'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { toast } from 'sonner';
import {
  Scale,
  Search,
  FileDown,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  PackageX,
  Receipt,
  Settings2,
  Eye, // 🆕 Sprint 15: detalhe da conciliação
} from 'lucide-react';
import api from '@/lib/axios';
import FiscalClientSelector from '@/components/fiscal/FiscalClientSelector';
import { useFiscalClientStore } from '@/store/fiscalClientStore';
import ColumnPickerModal from '@/components/fiscal/ColumnPickerModal';
import ComparisonDetailModal from '@/components/fiscal/ComparisonDetailModal'; // 🆕 Sprint 15
import FiscalInfoPanel from '@/components/fiscal/FiscalInfoPanel'; // 🆕 Sprint 20
import {
  ColumnDef,
  buildCsv,
  downloadCsv,
  getSelectedKeys,
} from '@/lib/columnExport';

// =================================================================
// 📦 Tipos
// =================================================================
interface CompareRow {
  id: string;
  code: string;
  description: string;
  ncm: string;
  unit: string;
  initialQty: number;
  initialCost: number;
  initialTotal: number;
  entryQty: number;
  entryValue: number;
  adjustQty: number;
  currentStock: number;
  currentTotal: number;
  divergence: number;
  status: string;
}

interface CompareSummary {
  total: number;
  ok: number;
  movedByNfe: number;
  divergent: number;
  noBalance: number;
}

// =================================================================
// 🎨 Helpers
// =================================================================
const formatBRL = (v: number) =>
  Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const formatQty = (v: number) => Number(v || 0).toLocaleString('pt-BR');

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  OK: { label: 'Conferido', className: 'bg-green-50 text-green-700' },
  MOVIMENTADO_NFE: { label: 'Movimentado por NF-e', className: 'bg-blue-50 text-blue-700' },
  DIVERGENTE: { label: 'Divergente', className: 'bg-red-50 text-red-700' },
  SEM_SALDO: { label: 'Sem saldo', className: 'bg-slate-100 text-slate-500' },
};

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.SEM_SALDO;
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap ${cfg.className}`}>
      {cfg.label}
    </span>
  );
}

// =================================================================
// 📑 Colunas exportáveis do Comparativo
// 🆕 Sprint 20: Código e Descrição DESTRADOS (sem always:true)
// =================================================================
const EXPORT_COLUMNS: ColumnDef[] = [
  { key: 'code', label: 'Código' },
  { key: 'description', label: 'Descrição' },
  { key: 'ncm', label: 'NCM' },
  { key: 'unit', label: 'Un' },
  { key: 'initialQty', label: 'Qtd Inicial (PDF)' },
  { key: 'initialCost', label: 'Custo Inicial' },
  { key: 'initialTotal', label: 'Total Inicial' },
  { key: 'entryQty', label: 'Qtd NF-e' },
  { key: 'entryValue', label: 'Total NF-e' },
  { key: 'adjustQty', label: 'Ajustes' },
  { key: 'currentStock', label: 'Qtd Atual' },
  { key: 'currentTotal', label: 'Total Atual' },
  { key: 'divergence', label: 'Divergência' },
  {
    key: 'status',
    label: 'Status',
    format: (r) => STATUS_CONFIG[r.status]?.label || r.status,
  },
];

// =================================================================
// 📄 Página: Comparativo Estoque Inicial × NF-e (Sprints 11, 12, 15, 20)
// =================================================================
export default function FiscalComparativoPage() {
  const { selected } = useFiscalClientStore();

  const [summary, setSummary] = useState<CompareSummary | null>(null);
  const [rows, setRows] = useState<CompareRow[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // 🆕 Sprint 12: exportação com campos selecionáveis
  const [pickerOpen, setPickerOpen] = useState(false);
  const [exportCols, setExportCols] = useState<string[]>([]);

  // 🆕 Sprint 15: drill-down da conciliação
  const [detailTarget, setDetailTarget] = useState<CompareRow | null>(null);

  useEffect(() => {
    setExportCols(getSelectedKeys('fiscal-comparativo', EXPORT_COLUMNS));
  }, []);

  // ---------------------------------------------------------------
  // 📥 Carrega o comparativo (reage ao cliente selecionado)
  // ---------------------------------------------------------------
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/fiscal/inventory/compare', {
        params: { clientId: selected.id || undefined },
      });
      setSummary(data.summary);
      setRows(data.rows || []);
    } catch {
      toast.error('Erro ao carregar o comparativo.');
    } finally {
      setLoading(false);
    }
  }, [selected.id]);

  useEffect(() => {
    load();
  }, [load]);

  // ---------------------------------------------------------------
  // 🔍 Filtros locais (busca + status)
  // ---------------------------------------------------------------
  const filtered = useMemo(() => {
    let list = rows;
    if (statusFilter !== 'ALL') {
      list = list.filter((r) => r.status === statusFilter);
    }
    if (search.trim()) {
      const term = search.toLowerCase();
      list = list.filter(
        (r) =>
          r.description.toLowerCase().includes(term) ||
          (r.code || '').toLowerCase().includes(term),
      );
    }
    return list;
  }, [rows, search, statusFilter]);

  // ---------------------------------------------------------------
  // 📤 Exporta CSV apenas com as colunas selecionadas
  // ---------------------------------------------------------------
  const exportCsv = () => {
    if (filtered.length === 0) {
      toast.error('Nada para exportar.');
      return;
    }
    const csv = buildCsv(filtered, EXPORT_COLUMNS, exportCols);
    downloadCsv(
      `comparativo-estoque-${new Date().toISOString().slice(0, 10)}.csv`,
      csv,
    );
    toast.success(`${filtered.length} linha(s) exportada(s).`);
  };

  // ---------------------------------------------------------------
  // 🎨 Renderização
  // ---------------------------------------------------------------
  return (
    <div className="space-y-6">
      {/* Cabeçalho + seletor de cliente */}
      <div className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Scale className="h-7 w-7 text-teal-600" />
            Comparativo de Estoque
          </h1>
          <p className="text-slate-600 mt-1">
            Conciliação: saldo inicial (PDF) × entradas NF-e × saldo atual.
          </p>
        </div>
        <FiscalClientSelector />
      </div>

      {/* 🆕 Sprint 20: documentação viva da página */}
      <FiscalInfoPanel page="comparativo" />

      {/* Cards de resumo da conciliação */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
          <p className="text-2xl font-bold text-slate-900">{summary?.total ?? 0}</p>
          <p className="text-xs text-slate-500">Produtos Analisados</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
          <p className="text-2xl font-bold text-green-700 flex items-center gap-1">
            <CheckCircle2 className="h-5 w-5" />
            {summary?.ok ?? 0}
          </p>
          <p className="text-xs text-slate-500">Conferidos</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
          <p className="text-2xl font-bold text-blue-700 flex items-center gap-1">
            <Receipt className="h-5 w-5" />
            {summary?.movedByNfe ?? 0}
          </p>
          <p className="text-xs text-slate-500">Movimentados por NF-e</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
          <p className="text-2xl font-bold text-red-700 flex items-center gap-1">
            <AlertTriangle className="h-5 w-5" />
            {summary?.divergent ?? 0}
          </p>
          <p className="text-xs text-slate-500">Divergentes</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
          <p className="text-2xl font-bold text-slate-500 flex items-center gap-1">
            <PackageX className="h-5 w-5" />
            {summary?.noBalance ?? 0}
          </p>
          <p className="text-xs text-slate-500">Sem Saldo</p>
        </div>
      </div>

      {/* Filtros + exportação */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por descrição ou código..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white"
          >
            <option value="ALL">Todos os status</option>
            <option value="OK">Conferidos</option>
            <option value="MOVIMENTADO_NFE">Movimentados por NF-e</option>
            <option value="DIVERGENTE">Divergentes</option>
            <option value="SEM_SALDO">Sem saldo</option>
          </select>
          <button
            onClick={exportCsv}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded-lg transition-colors"
          >
            <FileDown className="h-4 w-4" />
            Exportar CSV
          </button>
          <button
            onClick={() => setPickerOpen(true)}
            className="flex items-center gap-2 px-3 py-2 text-sm text-slate-600 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
            title="Escolher campos da exportação"
          >
            <Settings2 className="h-4 w-4" />
            Campos
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="h-6 w-6 text-teal-600 animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-10 text-slate-400">
            <Scale className="h-10 w-10 mx-auto mb-2" />
            <p className="text-sm">Nenhum produto no comparativo.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-slate-500">
                  <th className="py-2 pr-3 font-medium">Código</th>
                  <th className="py-2 pr-3 font-medium">Descrição</th>
                  <th className="py-2 pr-3 font-medium text-right">Inicial (PDF)</th>
                  <th className="py-2 pr-3 font-medium text-right">Entradas NF-e</th>
                  <th className="py-2 pr-3 font-medium text-right">Ajustes</th>
                  <th className="py-2 pr-3 font-medium text-right">Atual</th>
                  <th className="py-2 pr-3 font-medium text-right">Divergência</th>
                  <th className="py-2 pr-3 font-medium">Status</th>
                  <th className="py-2 font-medium text-center">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => (
                  <tr
                    key={r.id}
                    className={`border-b border-slate-100 hover:bg-slate-50 ${
                      r.status === 'DIVERGENTE' ? 'bg-red-50/40' : ''
                    }`}
                  >
                    <td className="py-3 pr-3 font-medium text-slate-800">{r.code}</td>
                    <td className="py-3 pr-3 text-slate-600 max-w-[260px] truncate">
                      {r.description}
                    </td>
                    <td className="py-3 pr-3 text-right text-slate-700">
                      {formatQty(r.initialQty)} {r.unit}
                      <p className="text-xs text-slate-400">{formatBRL(r.initialTotal)}</p>
                    </td>
                    <td className="py-3 pr-3 text-right text-slate-700">
                      {formatQty(r.entryQty)} {r.unit}
                      <p className="text-xs text-slate-400">{formatBRL(r.entryValue)}</p>
                    </td>
                    <td className="py-3 pr-3 text-right text-slate-600">
                      {formatQty(r.adjustQty)}
                    </td>
                    <td className="py-3 pr-3 text-right font-semibold text-slate-800">
                      {formatQty(r.currentStock)} {r.unit}
                      <p className="text-xs text-slate-400">{formatBRL(r.currentTotal)}</p>
                    </td>
                    <td
                      className={`py-3 pr-3 text-right font-bold ${
                        Math.abs(r.divergence) > 0.000001
                          ? 'text-red-700'
                          : 'text-slate-400'
                      }`}
                    >
                      {formatQty(r.divergence)}
                    </td>
                    <td className="py-3 pr-3">
                      <StatusBadge status={r.status} />
                    </td>
                    {/* 🆕 Sprint 15: drill-down da conciliação */}
                    <td className="py-3">
                      <div className="flex justify-center">
                        <button
                          onClick={() => setDetailTarget(r)}
                          className="p-1.5 text-slate-400 hover:text-teal-600 hover:bg-teal-50 rounded-lg"
                          title="Ver detalhe da conciliação"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Nota metodológica */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs text-slate-600">
        <p className="font-semibold text-slate-700 mb-1 flex items-center gap-1">
          <RefreshCw className="h-3.5 w-3.5" />
          Metodologia da conciliação
        </p>
        <p>
          Teórico = Inicial (PDF) + Entradas NF-e + Ajustes manuais. A divergência é
          Atual − Teórico e deve ser zero. Valores ≠ 0 indicam ajustes manuais ou
          inconsistências de importação e devem ser auditados.
        </p>
      </div>

      {/* 🆕 Sprint 15: drill-down da conciliação */}
      {detailTarget && (
        <ComparisonDetailModal
          productId={detailTarget.id}
          onClose={() => setDetailTarget(null)}
        />
      )}

      {/* 🆕 Sprint 12: seletor de campos da exportação */}
      <ColumnPickerModal
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        context="fiscal-comparativo"
        columns={EXPORT_COLUMNS}
        onApply={setExportCols}
      />
    </div>
  );
}