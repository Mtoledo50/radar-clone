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
} from 'lucide-react';
import api from '@/lib/axios';

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
// 📄 Página: SPED Fiscal — Bloco H (Inventário)
// =================================================================
export default function FiscalSpedPage() {
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;

  const [year, setYear] = useState(currentYear);
  const [month, setMonth] = useState(currentMonth);
  const [data, setData] = useState<BlocoHData | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState<'sped' | 'csv' | null>(null);

  // ---------------------------------------------------------------
  // 📦 Carrega inventário da data-base
  // ---------------------------------------------------------------
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/fiscal/sped/bloco-h', {
        params: { year, month },
      });
      setData(data);
    } catch {
      toast.error('Erro ao carregar o inventário.');
    } finally {
      setLoading(false);
    }
  }, [year, month]);

  useEffect(() => {
    load();
  }, [load]);

  // ---------------------------------------------------------------
  // 📥 Download do arquivo (blob com token JWT)
  // ---------------------------------------------------------------
  const download = async (format: 'sped' | 'csv') => {
    setExporting(format);
    try {
      const response = await api.get('/fiscal/sped/bloco-h/export', {
        params: { year, month, format },
        responseType: 'blob',
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute(
        'download',
        format === 'csv'
          ? `inventario_${year}_${String(month).padStart(2, '0')}.csv`
          : `bloco_h_${year}_${String(month).padStart(2, '0')}.txt`,
      );
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast.success('Arquivo exportado com sucesso!');
    } catch {
      toast.error('Erro ao exportar o arquivo.');
    } finally {
      setExporting(null);
    }
  };

  // ---------------------------------------------------------------
  // 🎨 Renderização
  // ---------------------------------------------------------------
  return (
    <div className="space-y-6">
      {/* Cabeçalho + seletores */}
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

        <div className="flex items-center gap-3">
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

      {/* Cards de resumo */}
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

      {/* Tabela + exportação */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
          <h3 className="font-bold text-slate-900">
            Itens do Inventário — {MONTH_NAMES[month - 1]}/{year}
          </h3>

          <div className="flex gap-2">
            <button
              onClick={() => download('sped')}
              disabled={exporting !== null || loading}
              className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white font-semibold rounded-lg text-sm transition-colors disabled:opacity-50"
            >
              {exporting === 'sped' ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <FileDown className="h-4 w-4" />
              )}
              Exportar SPED (.txt)
            </button>
            <button
              onClick={() => download('csv')}
              disabled={exporting !== null || loading}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg text-sm transition-colors disabled:opacity-50"
            >
              {exporting === 'csv' ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <FileSpreadsheet className="h-4 w-4" />
              )}
              Exportar CSV (Excel)
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
            <p className="text-sm">Nenhum item em estoque nesta data-base.</p>
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

      {/* Nota de compliance */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
        <p className="font-semibold mb-1">⚠️ Nota de Compliance</p>
        <p>
          O arquivo .txt segue o layout mínimo do Bloco H (H001/H005/H010/H990).
          Valide no PVA da Receita Federal antes de transmitir. O CSV serve para
          conferência interna em Excel.
        </p>
      </div>
    </div>
  );
}