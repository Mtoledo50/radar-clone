'use client';

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
import FiscalInfoPanel from '@/components/fiscal/FiscalInfoPanel'; // 🆕 Sprint 20
import { ColumnDef, buildCsv, downloadCsv } from '@/lib/columnExport';

// =================================================================
// 📦 Tipos (espelham o backend — Sprint 13)
// =================================================================
interface TaxReportRow {
  code: string;
  reference: string;
  quantity: number;
  unitValue: number;
  icmsValue: number;
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
// 📑 Colunas do relatório (layout H010 estendido — FIXAS, modelo legal)
// =================================================================
const REPORT_COLUMNS: ColumnDef[] = [
  { key: 'code', label: 'Código do Produto' },
  { key: 'reference', label: 'Referência' },
  { key: 'quantity', label: 'Quantidade' },
  { key: 'unitValue', label: 'Valor Unitário' },
  { key: 'icmsValue', label: 'Valor do ICMS' },
  { key: 'totalValue', label: 'Valor Total' },
  { key: 'ownershipIndicator', label: 'Indicador de propriedade/posse do item' },
  { key: 'ownerCnpjCpf', label: 'CNPJ/CPF do proprietário/possuidor que não seja a empresa' },
  { key: 'spedAccount', label: 'Conta Sped do Inventário' },
  { key: 'observations', label: 'Observações do lançamento do inventário' },
  { key: 'icmsBase', label: 'Base de ICMS' },
  { key: 'cst', label: 'CST do ICMS' },
  { key: 'icmsSt', label: 'Valor de ICMS ST' },
  { key: 'ipi', label: 'Valor de IPI' },
  { key: 'pis', label: 'Valor de PIS' },
  { key: 'cofins', label: 'Valor de COFINS' },
  { key: 'irValue', label: 'Valor total para fins de Imposto de Renda' },
];

// =================================================================
// 📄 Página: Relatório de Inventário Fiscal com Tributos
// =================================================================
export default function FiscalRelatorioInventarioPage() {
  const { selected } = useFiscalClientStore();

  const [rows, setRows] = useState<TaxReportRow[]>([]);
  const [loading, setLoading] = useState(true);

  // ---------------------------------------------------------------
  // 📥 Carrega o relatório (reage ao cliente selecionado)
  // ---------------------------------------------------------------
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/fiscal/inventory/report/tax', {
        params: { clientId: selected.id || undefined },
      });
      setRows(data.rows || []);
    } catch {
      toast.error('Erro ao carregar o relatório.');
    } finally {
      setLoading(false);
    }
  }, [selected.id]);

  useEffect(() => {
    load();
  }, [load]);

  // Totais para os cards de resumo
  const totalValue = rows.reduce((s, r) => s + r.totalValue, 0);
  const totalIcms = rows.reduce((s, r) => s + r.icmsValue, 0);

  // ---------------------------------------------------------------
  // 📤 Exporta CSV no formato EXATO do modelo (17 colunas, ;, BOM)
  // ---------------------------------------------------------------
  const exportCsv = () => {
    if (rows.length === 0) {
      toast.error('Nada para exportar.');
      return;
    }
    const allKeys = REPORT_COLUMNS.map((c) => c.key);
    const csv = buildCsv(rows, REPORT_COLUMNS, allKeys);
    downloadCsv(
      `relatorio-inventario-${new Date().toISOString().slice(0, 10)}.csv`,
      csv,
    );
    toast.success(`${rows.length} linha(s) exportada(s).`);
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
            <div className="p-2 bg-green-50 rounded-lg">
              <Percent className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{formatBRL(totalIcms)}</p>
              <p className="text-xs text-slate-500">ICMS das Aquisições</p>
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
            title="Exporta as 17 colunas no formato do modelo"
          >
            <FileDown className="h-4 w-4" />
            Exportar CSV
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="h-6 w-6 text-teal-600 animate-spin" />
          </div>
        ) : rows.length === 0 ? (
          <div className="text-center py-10 text-slate-400">
            <PackageSearch className="h-10 w-10 mx-auto mb-2" />
            <p className="text-sm">
              Nenhum produto com NF-e e saldo ≠ 0 para este escopo.
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
                  <th className="py-2 pr-3 font-medium text-right">Vl. Unit.</th>
                  <th className="py-2 pr-3 font-medium text-right">Vl. ICMS</th>
                  <th className="py-2 pr-3 font-medium text-right">Vl. Total</th>
                  <th className="py-2 pr-3 font-medium text-center">Ind.</th>
                  <th className="py-2 pr-3 font-medium">CNPJ Prop.</th>
                  <th className="py-2 pr-3 font-medium">Conta SPED</th>
                  <th className="py-2 pr-3 font-medium">Obs.</th>
                  <th className="py-2 pr-3 font-medium text-right">Base ICMS</th>
                  <th className="py-2 pr-3 font-medium text-center">CST</th>
                  <th className="py-2 pr-3 font-medium text-right">Vl. ST</th>
                  <th className="py-2 pr-3 font-medium text-right">Vl. IPI</th>
                  <th className="py-2 pr-3 font-medium text-right">Vl. PIS</th>
                  <th className="py-2 pr-3 font-medium text-right">Vl. COFINS</th>
                  <th className="py-2 font-medium text-right">Vl. p/ IR</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.code} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="py-3 pr-3 font-medium text-slate-800">{r.code}</td>
                    <td className="py-3 pr-3 text-slate-600 max-w-[240px] truncate">
                      {r.reference}
                    </td>
                    <td className="py-3 pr-3 text-right font-semibold text-slate-800">
                      {formatQty(r.quantity)}
                    </td>
                    <td className="py-3 pr-3 text-right text-slate-600">
                      {formatBRL(r.unitValue)}
                    </td>
                    <td className="py-3 pr-3 text-right text-green-700">
                      {formatBRL(r.icmsValue)}
                    </td>
                    <td className="py-3 pr-3 text-right font-semibold text-slate-800">
                      {formatBRL(r.totalValue)}
                    </td>
                    <td className="py-3 pr-3 text-center text-slate-600">
                      {r.ownershipIndicator}
                    </td>
                    <td className="py-3 pr-3 text-slate-400">{r.ownerCnpjCpf || '—'}</td>
                    <td className="py-3 pr-3 text-slate-400">{r.spedAccount || '—'}</td>
                    <td className="py-3 pr-3 text-slate-400">{r.observations || '—'}</td>
                    <td className="py-3 pr-3 text-right text-slate-600">
                      {formatBRL(r.icmsBase)}
                    </td>
                    <td className="py-3 pr-3 text-center text-slate-600">{r.cst || '—'}</td>
                    <td className="py-3 pr-3 text-right text-slate-600">
                      {formatBRL(r.icmsSt)}
                    </td>
                    <td className="py-3 pr-3 text-right text-slate-600">
                      {formatBRL(r.ipi)}
                    </td>
                    <td className="py-3 pr-3 text-right text-slate-600">
                      {formatBRL(r.pis)}
                    </td>
                    <td className="py-3 pr-3 text-right text-slate-600">
                      {formatBRL(r.cofins)}
                    </td>
                    <td className="py-3 text-right font-semibold text-slate-800">
                      {formatBRL(r.irValue)}
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
        <p className="font-semibold text-slate-700 mb-1">📐 Critérios do relatório</p>
        <p>
          Lista apenas produtos presentes nas NF-e importadas com saldo atual ≠ 0.
          Quantidade/valores de estoque usam custo médio ponderado; tributos
          (ICMS, base, ST, IPI, PIS, COFINS) são a soma das aquisições.
          Indicador de posse = 0 (mercadoria própria); CNPJ/Conta SPED/Obs. ficam
          vazios por padrão legal.
        </p>
      </div>
    </div>
  );
}