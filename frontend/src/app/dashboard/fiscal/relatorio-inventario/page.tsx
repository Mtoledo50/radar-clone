'use client';

// =================================================================
// 📑 Página: Relatório de Inventário Fiscal (Sprint 13/20)
// =================================================================
// Layout H010 estendido (17 colunas) para SPED Fiscal e IR.
// Regra de negócio: apenas produtos com saldo ≠ 0 E movimentações.
// =================================================================

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import {
  ClipboardList,
  FileDown,
  Loader2,
  PackageSearch,
  DollarSign,
  Percent,
} from 'lucide-react';
import api from '@/lib/axios';
import FiscalClientSelector from '@/components/fiscal/FiscalClientSelector';
import { useFiscalClientStore } from '@/store/fiscalClientStore';
import FiscalInfoPanel from '@/components/fiscal/FiscalInfoPanel';
import { buildCsv, downloadCsv } from '@/lib/columnExport';

// =================================================================
// 📦 Tipos
// =================================================================
interface TaxReportRow {
  code: string;
  reference: string;
  quantity: number;
  unit: string;
  unitValue: number;
  totalValue: number;
  ownershipIndicator: string;
  ownerCnpjCpf: string;
  spedAccount: string;
  observations: string;
  icmsBase: number;
  cst: string;
  icmsSt: number;
  ipi: number;
  pis: number;
  cofins: number;
  irValue: number;
}

// =================================================================
// 🎨 Helpers
// =================================================================
const formatBRL = (v: number) =>
  Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const formatQty = (v: number) => Number(v || 0).toLocaleString('pt-BR');

// =================================================================
// 📑 17 colunas do relatório (layout H010 estendido)
// =================================================================
const REPORT_COLUMNS = [
  { key: 'code', label: 'Código do Produto' },
  { key: 'reference', label: 'Referência (Nome)' },
  { key: 'quantity', label: 'Quantidade' },
  { key: 'unit', label: 'Unidade' },
  { key: 'unitValue', label: 'Valor Unitário', type: 'currency' as const },
  { key: 'totalValue', label: 'Valor Total', type: 'currency' as const },
  { key: 'ownershipIndicator', label: 'Indicador de Posse' },
  { key: 'ownerCnpjCpf', label: 'CNPJ/CPF Proprietário' },
  { key: 'spedAccount', label: 'Conta SPED' },
  { key: 'observations', label: 'Observações' },
  { key: 'icmsBase', label: 'Base ICMS', type: 'currency' as const },
  { key: 'cst', label: 'CST' },
  { key: 'icmsSt', label: 'ICMS-ST', type: 'currency' as const },
  { key: 'ipi', label: 'IPI', type: 'currency' as const },
  { key: 'pis', label: 'PIS', type: 'currency' as const },
  { key: 'cofins', label: 'COFINS', type: 'currency' as const },
  { key: 'irValue', label: 'Valor p/ IR', type: 'currency' as const },
];

// =================================================================
// 🧩 Componente Principal
// =================================================================
export default function FiscalRelatorioInventarioPage() {
  const { selected } = useFiscalClientStore();
  const [rows, setRows] = useState<TaxReportRow[]>([]);
  const [loading, setLoading] = useState(true);

  // -----------------------------------------------------------------
  // 📥 Carrega o relatório (reage ao cliente selecionado)
  // -----------------------------------------------------------------
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/fiscal/inventory/report/tax', {
        params: { clientId: selected.id || undefined },
      });
      setRows(data.rows || []);
    } catch {
      toast.error('Erro ao carregar o relatório de inventário.');
    } finally {
      setLoading(false);
    }
  }, [selected.id]);

  useEffect(() => {
    load();
  }, [load]);

  // -----------------------------------------------------------------
  // 🧮 Totais para os cards de resumo
  // -----------------------------------------------------------------
  const totalValue = rows.reduce((s, r) => s + Number(r.totalValue || 0), 0);
  const totalIcms = rows.reduce((s, r) => s + Number(r.icmsBase || 0) * 0.18, 0);

  // -----------------------------------------------------------------
  // 📤 Exporta CSV no formato EXATO de 17 colunas (;, BOM UTF-8)
  // -----------------------------------------------------------------
  const exportCsv = () => {
    if (rows.length === 0) {
      toast.error('Nada para exportar.');
      return;
    }
    const csv = buildCsv(REPORT_COLUMNS, rows);
    downloadCsv(
      csv,
      `relatorio-inventario-${new Date().toISOString().slice(0, 10)}.csv`,
    );
    toast.success(`${rows.length} linha(s) exportada(s).`);
  };

  // -----------------------------------------------------------------
  // 🎨 Renderização
  // -----------------------------------------------------------------
  return (
    <div className="space-y-6">
      {/* Cabeçalho + seletor de cliente */}
      <div className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <ClipboardList className="h-7 w-7 text-teal-600" />
            Relatório de Inventário Fiscal
          </h1>
          <p className="text-slate-600 mt-1">
            Produtos presentes nas notas com saldo ≠ 0 — layout H010 estendido com tributos.
          </p>
        </div>
        <FiscalClientSelector />
      </div>

      {/* 🆕 Sprint 20: documentação viva da página */}
      <FiscalInfoPanel page="relatorio" />

      {/* Aviso contextual do cliente */}
      {selected.id && (
        <div className="bg-teal-50 border border-teal-200 rounded-xl p-4 flex items-center gap-3">
          <div className="p-1.5 bg-teal-100 rounded-lg">
            <ClipboardList className="h-4 w-4 text-teal-700" />
          </div>
          <div>
            <p className="text-sm font-medium text-teal-900">
              Relatório de: <span className="font-bold">{selected.name}</span>
            </p>
          </div>
        </div>
      )}

      {/* Cards de resumo */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-teal-50 rounded-lg">
              <PackageSearch className="h-5 w-5 text-teal-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{rows.length}</p>
              <p className="text-xs text-slate-500">Itens no Relatório</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 rounded-lg">
              <DollarSign className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{formatBRL(totalValue)}</p>
              <p className="text-xs text-slate-500">Valor Total do Inventário</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-50 rounded-lg">
              <Percent className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{formatBRL(totalIcms)}</p>
              <p className="text-xs text-slate-500">ICMS das Aquisições (estimado)</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabela + exportação */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
          <h3 className="font-bold text-slate-900">
            Itens com NF-e e saldo ≠ 0 ({rows.length})
          </h3>
          <button
            onClick={exportCsv}
            disabled={loading || rows.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-50"
          >
            <FileDown className="h-4 w-4" />
            Exportar CSV (17 colunas)
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="h-6 w-6 text-teal-600 animate-spin" />
          </div>
        ) : rows.length === 0 ? (
          <div className="text-center py-10 text-slate-400">
            <ClipboardList className="h-10 w-10 mx-auto mb-2" />
            <p className="text-sm">
              Nenhum item com NF-e importada e saldo ≠ 0 no escopo selecionado.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm whitespace-nowrap">
              <thead>
                <tr className="border-b border-slate-200 text-left text-slate-500">
                  <th className="py-2 pr-3 font-medium">Código</th>
                  <th className="py-2 pr-3 font-medium">Referência</th>
                  <th className="py-2 pr-3 font-medium text-right">Qtd</th>
                  <th className="py-2 pr-3 font-medium">Un</th>
                  <th className="py-2 pr-3 font-medium text-right">Valor Unit.</th>
                  <th className="py-2 pr-3 font-medium text-right">Valor Total</th>
                  <th className="py-2 pr-3 font-medium text-center">Posse</th>
                  <th className="py-2 pr-3 font-medium">CNPJ/CPF</th>
                  <th className="py-2 pr-3 font-medium">Conta SPED</th>
                  <th className="py-2 pr-3 font-medium">Observações</th>
                  <th className="py-2 pr-3 font-medium text-right">Base ICMS</th>
                  <th className="py-2 pr-3 font-medium text-center">CST</th>
                  <th className="py-2 pr-3 font-medium text-right">ICMS-ST</th>
                  <th className="py-2 pr-3 font-medium text-right">IPI</th>
                  <th className="py-2 pr-3 font-medium text-right">PIS</th>
                  <th className="py-2 pr-3 font-medium text-right">COFINS</th>
                  <th className="py-2 pr-3 font-medium text-right">Valor p/ IR</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((item, idx) => (
                  <tr
                    key={`${item.code}-${idx}`}
                    className="border-b border-slate-100 hover:bg-slate-50"
                  >
                    <td className="py-3 pr-3 font-medium text-slate-800">{item.code}</td>
                    <td className="py-3 pr-3 text-slate-600 max-w-[220px] truncate" title={item.reference}>
                      {item.reference}
                    </td>
                    <td className="py-3 pr-3 text-right text-slate-700">{formatQty(item.quantity)}</td>
                    <td className="py-3 pr-3 text-slate-600">{item.unit}</td>
                    <td className="py-3 pr-3 text-right text-slate-700">{formatBRL(item.unitValue)}</td>
                    <td className="py-3 pr-3 text-right font-semibold text-slate-800">
                      {formatBRL(item.totalValue)}
                    </td>
                    <td className="py-3 pr-3 text-center text-slate-600">{item.ownershipIndicator}</td>
                    <td className="py-3 pr-3 text-slate-600">{item.ownerCnpjCpf || '—'}</td>
                    <td className="py-3 pr-3 text-slate-600">{item.spedAccount || '—'}</td>
                    <td className="py-3 pr-3 text-slate-500 max-w-[180px] truncate" title={item.observations}>
                      {item.observations || '—'}
                    </td>
                    <td className="py-3 pr-3 text-right text-slate-700">{formatBRL(item.icmsBase)}</td>
                    <td className="py-3 pr-3 text-center text-slate-600">{item.cst || '—'}</td>
                    <td className="py-3 pr-3 text-right text-slate-700">{formatBRL(item.icmsSt)}</td>
                    <td className="py-3 pr-3 text-right text-slate-700">{formatBRL(item.ipi)}</td>
                    <td className="py-3 pr-3 text-right text-slate-700">{formatBRL(item.pis)}</td>
                    <td className="py-3 pr-3 text-right text-slate-700">{formatBRL(item.cofins)}</td>
                    <td className="py-3 pr-3 text-right font-semibold text-teal-700">
                      {formatBRL(item.irValue)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-slate-50">
                  <td colSpan={5} className="py-3 px-2 text-right font-bold text-slate-700">
                    TOTAL DO INVENTÁRIO:
                  </td>
                  <td className="py-3 px-2 text-right font-bold text-teal-700">
                    {formatBRL(totalValue)}
                  </td>
                  <td colSpan={11}></td>
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
          O CSV exportado segue o modelo de 17 colunas para conferência interna. Para gerar o
          Bloco H oficial do SPED Fiscal (.txt), use a página <strong>SPED Fiscal</strong>.
          Valide o arquivo no PVA da Receita Federal antes de transmitir.
        </p>
      </div>
    </div>
  );
}