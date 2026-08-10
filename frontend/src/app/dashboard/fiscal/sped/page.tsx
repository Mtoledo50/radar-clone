'use client';

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import {
  FileDown,
  FileSpreadsheet,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Package,
  DollarSign,
  Barcode,
  Loader2,
  FileText,
  Settings2, // 🆕 Sprint 12: escolher campos da exportação
} from 'lucide-react';
import api from '@/lib/axios';
import FiscalClientSelector from '@/components/fiscal/FiscalClientSelector'; // 🆕 Sprint 8
import { useFiscalClientStore } from '@/store/fiscalClientStore'; // 🆕 Sprint 8
import ColumnPickerModal from '@/components/fiscal/ColumnPickerModal'; // 🆕 Sprint 12
import {
  ColumnDef,
  buildCsv,
  downloadCsv,
  getSelectedKeys,
} from '@/lib/columnExport'; // 🆕 Sprint 12
import FiscalInfoPanel from '@/components/fiscal/FiscalInfoPanel'; // 🆕 Sprint 20

// =================================================================
// 📦 Tipos
// =================================================================
interface InventoryItem {
  code: string;
  description: string;
  ncm: string;
  unit: string;
  quantity: number;
  unitValue: number;
  totalValue: number;
}

interface BlocoHData {
  year: number;
  month: number;
  refDate: string;
  itemsCount: number;
  totalValue: number;
  items: InventoryItem[];
}

// =================================================================
// 🎨 Helpers
// =================================================================
const formatBRL = (v: number) =>
  Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const formatQty = (v: number) => Number(v || 0).toLocaleString('pt-BR');

const formatDate = (d: string) => new Date(d).toLocaleDateString('pt-BR');

const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

// =================================================================
// 🆕 Sprint 12: colunas exportáveis do inventário (Bloco H)
// ⚠️ O .txt SPED permanece com layout legal FIXO (não customizável).
//    Apenas o CSV de conferência aceita campos selecionáveis.
// =================================================================
const EXPORT_COLUMNS: ColumnDef[] = [
  { key: 'code', label: 'Código', always: true },
  { key: 'description', label: 'Descrição', always: true },
  { key: 'ncm', label: 'NCM' },
  { key: 'unit', label: 'Unidade' },
  { key: 'quantity', label: 'Quantidade' },
  { key: 'unitValue', label: 'Valor Unitário' },
  { key: 'totalValue', label: 'Valor Total' },
];

// =================================================================
// 📄 Página: SPED Fiscal — Bloco H (Inventário)
// =================================================================
// Sprint 8:  integrado com seletor de cliente (filtros persistidos).
// Sprint 12: CSV com campos selecionáveis (gerado no client).
//
// 🛡️ Regra de compliance:
//   - .txt SPED → gerado no backend com layout oficial Receita Federal
//     (H001/H005/H010/H990) — NÃO customizável
//   - .csv Excel → gerado no client com as colunas escolhidas pelo
//     usuário (conferência interna)
// =================================================================
export default function FiscalSpedPage() {
  // =================================================================
  // 🆕 Sprint 8: cliente selecionado (estado global Zustand + localStorage)
  // =================================================================
  const { selected } = useFiscalClientStore();

  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;

  const [year, setYear] = useState(currentYear);
  const [month, setMonth] = useState(currentMonth);
  const [data, setData] = useState<BlocoHData | null>(null);
  const [loading, setLoading] = useState(true);
  const [exportingSped, setExportingSped] = useState(false);

  // 🆕 Sprint 12: exportação CSV com campos selecionáveis
  const [pickerOpen, setPickerOpen] = useState(false);
  const [exportCols, setExportCols] = useState<string[]>([]);

  // Carrega a seleção persistida do localStorage ao montar
  useEffect(() => {
    setExportCols(getSelectedKeys('fiscal-sped', EXPORT_COLUMNS));
  }, []);

  // ---------------------------------------------------------------
  // 📦 Carrega inventário da data-base (filtrado pelo cliente selecionado)
  // ---------------------------------------------------------------
  // 🆕 Sprint 8: clientId enviado ao backend para inventário segregado
  // ---------------------------------------------------------------
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/fiscal/sped/bloco-h', {
        params: {
          year,
          month,
          clientId: selected.id || undefined, // 🆕 Sprint 8
        },
      });
      setData(data);
    } catch {
      toast.error('Erro ao carregar o inventário.');
    } finally {
      setLoading(false);
    }
  }, [year, month, selected.id]); // 🆕 Sprint 8: selected.id como dependência

  useEffect(() => {
    load();
  }, [load]);

  // ---------------------------------------------------------------
  // 📥 Download do .txt SPED (layout legal — gerado no backend)
  // ---------------------------------------------------------------
  // ⚠️ Este arquivo NÃO é customizável: segue o layout mínimo do
  // Bloco H (H001/H005/H010/H990) exigido pelo PVA da Receita Federal.
  // ---------------------------------------------------------------
  const downloadSped = async () => {
    setExportingSped(true);
    try {
      const response = await api.get('/fiscal/sped/bloco-h/export', {
        params: {
          year,
          month,
          format: 'sped',
          clientId: selected.id || undefined, // 🆕 Sprint 8
        },
        responseType: 'blob',
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute(
        'download',
        `bloco_h_${year}_${String(month).padStart(2, '0')}.txt`,
      );
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast.success('Arquivo SPED (.txt) exportado com sucesso!');
    } catch {
      toast.error('Erro ao exportar o arquivo SPED.');
    } finally {
      setExportingSped(false);
    }
  };

  // ---------------------------------------------------------------
  // 🆕 Sprint 12: Exporta CSV no CLIENT com as colunas selecionadas
  // ---------------------------------------------------------------
  // Usa o JSON já carregado (data.items) e gera o CSV diretamente
  // no navegador, respeitando as colunas escolhidas pelo usuário.
  // Vantagens: resposta imediata, sem round-trip ao backend.
  // ---------------------------------------------------------------
  const exportCsvClient = () => {
    if (!data || data.items.length === 0) {
      toast.error('Nada para exportar.');
      return;
    }
    const csv = buildCsv(data.items, EXPORT_COLUMNS, exportCols);
    downloadCsv(`inventario_${year}_${String(month).padStart(2, '0')}.csv`, csv);
    toast.success(`${data.items.length} linha(s) exportada(s).`);
  };

  // ---------------------------------------------------------------
  // 🎨 Renderização
  // ---------------------------------------------------------------
  return (
    <div className="space-y-6">
      {/* ================================================================
          Cabeçalho + seletor de cliente + seletores de mês/ano
          ================================================================ */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <FileDown className="h-7 w-7 text-teal-600" />
            SPED Fiscal — Bloco H
          </h1>
          <p className="text-slate-600 mt-1">
            Inventário físico de mercadorias na data-base para transmissão ao PVA.
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* 🆕 Sprint 8: seletor de cliente */}
          <FiscalClientSelector />

          {/* Seletor de mês */}
          <select
            value={month}
            onChange={(e) => setMonth(Number(e.target.value))}
            className="border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
            {MONTH_NAMES.map((name, i) => (
              <option key={i} value={i + 1}>
                {name}
              </option>
            ))}
          </select>

          {/* Seletor de ano */}
          <div className="flex items-center gap-1 bg-white rounded-lg shadow-sm border border-slate-200 px-2 py-1.5">
            <button
              onClick={() => setYear((y) => y - 1)}
              className="p-1 hover:bg-slate-100 rounded"
              title="Ano anterior"
            >
              <ChevronLeft className="h-4 w-4 text-slate-600" />
            </button>
            <div className="flex items-center gap-1.5 px-3">
              <Calendar className="h-4 w-4 text-teal-600" />
              <span className="font-bold text-slate-900">{year}</span>
            </div>
            <button
              onClick={() => setYear((y) => y + 1)}
              className="p-1 hover:bg-slate-100 rounded"
              title="Próximo ano"
              disabled={year >= currentYear + 1}
            >
              <ChevronRight className="h-4 w-4 text-slate-600" />
            </button>
          </div>
        </div>
      </div>

      {/* ================================================================
          Aviso contextual: cliente selecionado
          ================================================================ */}
      {selected.id && (
        <div className="bg-teal-50 border border-teal-200 rounded-xl p-4 flex items-center gap-3">
          <div className="p-1.5 bg-teal-100 rounded-lg">
            <FileDown className="h-4 w-4 text-teal-700" />
          </div>
          <div>
            <p className="text-sm font-medium text-teal-900">
              Inventário de: <span className="font-bold">{selected.name}</span>
            </p>
            <p className="text-xs text-teal-700 mt-0.5">
              Itens e exportações estão segregados por este cliente.
            </p>
          </div>
        </div>
      )}

      {/* 🆕 Sprint 20: documentação viva da página */}
      <FiscalInfoPanel page="sped" />

      {/* ================================================================
          Cards de resumo
          ================================================================ */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-teal-50 rounded-lg">
              <Package className="h-5 w-5 text-teal-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">
                {data?.itemsCount ?? 0}
              </p>
              <p className="text-xs text-slate-500">Itens em Estoque</p>
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
                {formatBRL(data?.totalValue)}
              </p>
              <p className="text-xs text-slate-500">Valor Total do Inventário</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-50 rounded-lg">
              <Calendar className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">
                {data ? formatDate(data.refDate) : '—'}
              </p>
              <p className="text-xs text-slate-500">Data-Base do Inventário</p>
            </div>
          </div>
        </div>
      </div>

      {/* ================================================================
          Tabela + botões de exportação
          ================================================================ */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
          <h3 className="font-bold text-slate-900">
            Itens do Inventário — {MONTH_NAMES[month - 1]}/{year}
          </h3>

          <div className="flex gap-2 flex-wrap">
            {/* .txt SPED — layout legal fixo (gerado no backend) */}
            <button
              onClick={downloadSped}
              disabled={exportingSped || loading}
              className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white font-semibold rounded-lg text-sm transition-colors disabled:opacity-50"
              title="Layout oficial Receita Federal (H001/H005/H010/H990)"
            >
              {exportingSped ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <FileDown className="h-4 w-4" />
              )}
              Exportar SPED (.txt)
            </button>

            {/* 🆕 Sprint 12: CSV gerado no client com colunas selecionáveis */}
            <button
              onClick={exportCsvClient}
              disabled={loading || !data || data.items.length === 0}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg text-sm transition-colors disabled:opacity-50"
              title="Excel com colunas personalizadas"
            >
              <FileSpreadsheet className="h-4 w-4" />
              Exportar CSV (Excel)
            </button>

            {/* 🆕 Sprint 12: botão para escolher campos da exportação */}
            <button
              onClick={() => setPickerOpen(true)}
              className="flex items-center gap-2 px-3 py-2 text-sm text-slate-600 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
              title="Escolher campos da exportação (somente CSV)"
            >
              <Settings2 className="h-4 w-4" />
              Campos
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="h-6 w-6 text-teal-600 animate-spin" />
          </div>
        ) : !data || data.items.length === 0 ? (
          <div className="text-center py-10 text-slate-400">
            <FileText className="h-10 w-10 mx-auto mb-2" />
            <p className="text-sm">
              {selected.id
                ? 'Nenhum item em estoque nesta data-base para este cliente.'
                : 'Nenhum item em estoque nesta data-base.'}
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
                  <th className="py-2 pr-4 font-medium text-center">Qtd</th>
                  <th className="py-2 pr-4 font-medium text-center">Un</th>
                  <th className="py-2 pr-4 font-medium text-right">Valor Unit.</th>
                  <th className="py-2 font-medium text-right">Valor Total</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((item) => (
                  <tr key={item.code} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="py-3 pr-4 font-medium text-slate-800">{item.code}</td>
                    <td className="py-3 pr-4 text-slate-600 max-w-[300px] truncate">
                      {item.description}
                    </td>
                    <td className="py-3 pr-4 text-slate-600">
                      <span className="flex items-center gap-1">
                        <Barcode className="h-3.5 w-3.5 text-slate-400" />
                        {item.ncm}
                      </span>
                    </td>
                    <td className="py-3 pr-4 text-center font-semibold text-slate-800">
                      {formatQty(item.quantity)}
                    </td>
                    <td className="py-3 pr-4 text-center text-slate-600">{item.unit}</td>
                    <td className="py-3 pr-4 text-right text-slate-600">
                      {formatBRL(item.unitValue)}
                    </td>
                    <td className="py-3 text-right font-semibold text-slate-800">
                      {formatBRL(item.totalValue)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-slate-50">
                  <td colSpan={6} className="py-3 px-2 text-right font-bold text-slate-700">
                    TOTAL DO INVENTÁRIO:
                  </td>
                  <td className="py-3 px-2 text-right font-bold text-teal-700">
                    {formatBRL(data.totalValue)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>

      {/* ================================================================
          Nota de compliance
          ================================================================ */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
        <p className="font-semibold mb-1">⚠️ Nota de Compliance</p>
        <p>
          O arquivo <strong>.txt</strong> segue o layout mínimo do Bloco H
          (H001/H005/H010/H990) — <strong>não é customizável</strong> por
          exigência da Receita Federal. Valide no PVA antes de transmitir.
          O <strong>.csv</strong> serve para conferência interna em Excel e
          permite escolher as colunas via botão "Campos".
        </p>
      </div>

      {/* ================================================================
          🆕 Sprint 12: seletor de campos da exportação (somente CSV)
          ================================================================
          Colunas Código e Descrição são travadas (always: true).
          A seleção persiste em localStorage por contexto "fiscal-sped".
          ================================================================ */}
      <ColumnPickerModal
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        context="fiscal-sped"
        columns={EXPORT_COLUMNS}
        onApply={setExportCols}
      />
    </div>
  );
}