'use client';

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import {
  Calculator,
  Calendar,
  ChevronLeft,
  ChevronRight,
  X,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Lock,
  Unlock,
  Loader2,
  Save,
  AlertCircle,
  Receipt,
} from 'lucide-react';
import api from '@/lib/axios';

// =================================================================
// 📦 Tipos
// =================================================================
interface MonthSummary {
  month: number;
  invoicesCount: number;
  purchasesValue: number;
  creditsIcms: number;
  creditsIcmsSt: number;
  salesValue: number;
  debitRate: number;
  debitsIcms: number;
  balance: number;
  status: string; // ABERTA | FECHADA
}

interface YearSummary {
  year: number;
  totalCredits: number;
  totalDebits: number;
  totalBalance: number;
  months: MonthSummary[];
}

interface InvoiceCredit {
  id: string;
  number: string;
  series: string;
  emissionDate: string;
  totalValue: number;
  icmsValue: number;
  icmsStValue: number;
  supplier: { name: string; cnpj: string };
}

interface MonthDetail {
  year: number;
  month: number;
  invoicesCount: number;
  purchasesValue: number;
  creditsIcms: number;
  creditsIcmsSt: number;
  invoices: InvoiceCredit[];
  salesValue: number;
  debitRate: number;
  debitsIcms: number;
  balance: number;
  status: string;
  closedAt: string | null;
  observations: string | null;
}

// =================================================================
// 🎨 Helpers
// =================================================================
const formatBRL = (v: number) =>
  Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const formatDate = (d: string) => new Date(d).toLocaleDateString('pt-BR');

const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

const MONTH_SHORT = [
  'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
  'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez',
];

// =================================================================
// 📄 Página: Apuração de ICMS
// =================================================================
export default function FiscalApuracaoPage() {
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);
  const [summary, setSummary] = useState<YearSummary | null>(null);
  const [loading, setLoading] = useState(true);

  // Modal de detalhe/edit
  const [detail, setDetail] = useState<MonthDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [editSales, setEditSales] = useState('');
  const [editRate, setEditRate] = useState('');
  const [editObs, setEditObs] = useState('');
  const [saving, setSaving] = useState(false);

  // ---------------------------------------------------------------
  // 📊 Carrega resumo anual
  // ---------------------------------------------------------------
  const loadSummary = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/fiscal/icms', { params: { year } });
      setSummary(data);
    } catch {
      toast.error('Erro ao carregar apuração anual.');
    } finally {
      setLoading(false);
    }
  }, [year]);

  useEffect(() => {
    loadSummary();
  }, [loadSummary]);

  // ---------------------------------------------------------------
  // 🔍 Abre detalhe do mês
  // ---------------------------------------------------------------
  const openDetail = async (month: number) => {
    setLoadingDetail(true);
    setDetail(null);
    try {
      const { data } = await api.get('/fiscal/icms/detail', {
        params: { year, month },
      });
      setDetail(data);
      setEditSales(String(data.salesValue || ''));
      setEditRate(String(data.debitRate || ''));
      setEditObs(data.observations || '');
    } catch {
      toast.error('Erro ao carregar apuração do mês.');
    } finally {
      setLoadingDetail(false);
    }
  };

  // ---------------------------------------------------------------
  // 💾 Salvar débitos (edita apuração)
  // ---------------------------------------------------------------
  const saveDebits = async () => {
    if (!detail) return;
    setSaving(true);
    try {
      await api.put('/fiscal/icms', {
        year: detail.year,
        month: detail.month,
        salesValue: Number(editSales || 0),
        debitRate: Number(editRate || 0),
        observations: editObs,
      });
      toast.success('Apuração salva com sucesso!');
      setDetail(null);
      loadSummary();
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Erro ao salvar apuração.');
    } finally {
      setSaving(false);
    }
  };

  // ---------------------------------------------------------------
  // 🔒 Fechar mês
  // ---------------------------------------------------------------
  const closeMonth = async () => {
    if (!detail) return;
    setSaving(true);
    try {
      await api.post('/fiscal/icms/close', {
        year: detail.year,
        month: detail.month,
      });
      toast.success('Mês fechado! A apuração foi travada para compliance.');
      setDetail(null);
      loadSummary();
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Erro ao fechar o mês.');
    } finally {
      setSaving(false);
    }
  };

  // ---------------------------------------------------------------
  // 🔓 Reabrir mês
  // ---------------------------------------------------------------
  const reopenMonth = async () => {
    if (!detail) return;
    setSaving(true);
    try {
      await api.post('/fiscal/icms/reopen', {
        year: detail.year,
        month: detail.month,
      });
      toast.success('Mês reaberto para ajustes.');
      // Recarrega o detalhe atualizado
      const { data } = await api.get('/fiscal/icms/detail', {
        params: { year: detail.year, month: detail.month },
      });
      setDetail(data);
      loadSummary();
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Erro ao reabrir o mês.');
    } finally {
      setSaving(false);
    }
  };

  // Cálculo em tempo real (preview antes de salvar)
  const previewDebits = Number(editSales || 0) * (Number(editRate || 0) / 100);
  const previewBalance = previewDebits - (detail?.creditsIcms || 0);

  // ---------------------------------------------------------------
  // 🎨 Renderização
  // ---------------------------------------------------------------
  return (
    <div className="space-y-6">
      {/* Cabeçalho + seletor de ano */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Calculator className="h-7 w-7 text-teal-600" />
            Apuração de ICMS
          </h1>
          <p className="text-slate-600 mt-1">
            Fechamento mensal: créditos das NF-e de entrada × débitos das vendas.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-white rounded-lg shadow-sm border border-slate-200 px-3 py-2">
          <button
            onClick={() => setYear((y) => y - 1)}
            className="p-1 hover:bg-slate-100 rounded"
            title="Ano anterior"
          >
            <ChevronLeft className="h-5 w-5 text-slate-600" />
          </button>
          <div className="flex items-center gap-2 px-4 min-w-[80px] justify-center">
            <Calendar className="h-4 w-4 text-teal-600" />
            <span className="font-bold text-slate-900 text-lg">{year}</span>
          </div>
          <button
            onClick={() => setYear((y) => y + 1)}
            className="p-1 hover:bg-slate-100 rounded"
            title="Próximo ano"
            disabled={year >= currentYear + 1}
          >
            <ChevronRight className="h-5 w-5 text-slate-600" />
          </button>
        </div>
      </div>

      {/* Cards totais do ano */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-50 rounded-lg">
              <TrendingUp className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">
                {formatBRL(summary?.totalCredits ?? 0)}
              </p>
              <p className="text-xs text-slate-500">Total de Créditos</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-50 rounded-lg">
              <TrendingDown className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">
                {formatBRL(summary?.totalDebits ?? 0)}
              </p>
              <p className="text-xs text-slate-500">Total de Débitos</p>
            </div>
          </div>
        </div>

        <div
          className={`rounded-xl shadow-sm border p-5 ${
            (summary?.totalBalance ?? 0) >= 0
              ? 'bg-red-50 border-red-200'
              : 'bg-green-50 border-green-200'
          }`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`p-2 rounded-lg ${
                (summary?.totalBalance ?? 0) >= 0 ? 'bg-red-100' : 'bg-green-100'
              }`}
            >
              <DollarSign
                className={`h-5 w-5 ${
                  (summary?.totalBalance ?? 0) >= 0 ? 'text-red-600' : 'text-green-600'
                }`}
              />
            </div>
            <div>
              <p
                className={`text-2xl font-bold ${
                  (summary?.totalBalance ?? 0) >= 0 ? 'text-red-700' : 'text-green-700'
                }`}
              >
                {formatBRL(Math.abs(summary?.totalBalance ?? 0))}
              </p>
              <p className="text-xs text-slate-600">
                {(summary?.totalBalance ?? 0) >= 0 ? 'ICMS a Pagar' : 'Crédito Acumulado'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Grade dos 12 meses */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h3 className="font-bold text-slate-900 mb-4">Apurações Mensais</h3>

        {loading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="h-6 w-6 text-teal-600 animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
            {summary?.months.map((m) => (
              <button
                key={m.month}
                onClick={() => openDetail(m.month)}
                className={`text-left rounded-lg border p-3 transition-all hover:shadow-md ${
                  m.status === 'FECHADA'
                    ? 'border-teal-300 bg-teal-50/50'
                    : 'border-slate-200 bg-white hover:border-teal-300'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-slate-800">
                    {MONTH_SHORT[m.month - 1]}
                  </span>
                  {m.status === 'FECHADA' ? (
                    <Lock className="h-3.5 w-3.5 text-teal-600" />
                  ) : (
                    <Unlock className="h-3.5 w-3.5 text-slate-400" />
                  )}
                </div>
                <div className="text-xs space-y-1">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Créd:</span>
                    <span className="text-green-700 font-medium">
                      {formatBRL(m.creditsIcms)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Déb:</span>
                    <span className="text-red-700 font-medium">
                      {formatBRL(m.debitsIcms)}
                    </span>
                  </div>
                  <div className="flex justify-between pt-1 border-t border-slate-200">
                    <span className="text-slate-500">Saldo:</span>
                    <span
                      className={`font-bold ${
                        m.balance > 0 ? 'text-red-700' : m.balance < 0 ? 'text-green-700' : 'text-slate-500'
                      }`}
                    >
                      {m.balance > 0 ? '' : m.balance < 0 ? '−' : ''}
                      {formatBRL(Math.abs(m.balance))}
                    </span>
                  </div>
                </div>
                <div className="mt-2 text-[10px] text-slate-500">
                  {m.invoicesCount} nota(s)
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Legenda */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 flex flex-wrap items-center gap-4 text-xs text-slate-600">
        <div className="flex items-center gap-2">
          <Unlock className="h-3.5 w-3.5 text-slate-400" />
          <span>Mês em aberto — editável</span>
        </div>
        <div className="flex items-center gap-2">
          <Lock className="h-3.5 w-3.5 text-teal-600" />
          <span>Mês fechado — travado (compliance)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-red-100 border border-red-300" />
          <span>Saldo positivo = ICMS a pagar</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-green-100 border border-green-300" />
          <span>Saldo negativo = crédito acumulado</span>
        </div>
      </div>

      {/* ================= MODAL DETALHE MENSAL ================= */}
      {(detail || loadingDetail) && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            {loadingDetail ? (
              <div className="flex justify-center py-16">
                <Loader2 className="h-6 w-6 text-teal-600 animate-spin" />
              </div>
            ) : (
              detail && (
                <>
                  {/* Cabeçalho */}
                  <div className="flex items-center justify-between p-5 border-b border-slate-200 sticky top-0 bg-white z-10">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-slate-900 text-lg">
                          {MONTH_NAMES[detail.month - 1]} / {detail.year}
                        </h3>
                        {detail.status === 'FECHADA' ? (
                          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-teal-100 text-teal-700 flex items-center gap-1">
                            <Lock className="h-3 w-3" /> Fechado
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600 flex items-center gap-1">
                            <Unlock className="h-3 w-3" /> Aberto
                          </span>
                        )}
                      </div>
                      {detail.closedAt && (
                        <p className="text-xs text-slate-500 mt-0.5">
                          Fechado em {formatDate(detail.closedAt)}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => setDetail(null)}
                      className="text-slate-400 hover:text-slate-600"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>

                  <div className="p-5 space-y-6">
                    {/* Créditos (automáticos) */}
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-bold text-slate-800 flex items-center gap-2">
                          <TrendingUp className="h-4 w-4 text-green-600" />
                          Créditos (NF-e de Entrada)
                        </h4>
                        <span className="text-xs text-slate-500">
                          {detail.invoicesCount} nota(s)
                        </span>
                      </div>

                      <div className="grid grid-cols-3 gap-3 mb-3">
                        <div className="bg-green-50 rounded-lg p-3">
                          <p className="text-xs text-slate-600">Total Compras</p>
                          <p className="font-bold text-green-700">
                            {formatBRL(detail.purchasesValue)}
                          </p>
                        </div>
                        <div className="bg-green-50 rounded-lg p-3">
                          <p className="text-xs text-slate-600">Crédito ICMS</p>
                          <p className="font-bold text-green-700">
                            {formatBRL(detail.creditsIcms)}
                          </p>
                        </div>
                        <div className="bg-green-50 rounded-lg p-3">
                          <p className="text-xs text-slate-600">Crédito ICMS-ST</p>
                          <p className="font-bold text-green-700">
                            {formatBRL(detail.creditsIcmsSt)}
                          </p>
                        </div>
                      </div>

                      {detail.invoices.length > 0 ? (
                        <div className="max-h-40 overflow-y-auto border border-slate-200 rounded-lg">
                          <table className="w-full text-xs">
                            <thead className="bg-slate-50 sticky top-0">
                              <tr>
                                <th className="text-left py-2 px-3 font-medium text-slate-600">NF-e</th>
                                <th className="text-left py-2 px-3 font-medium text-slate-600">Fornecedor</th>
                                <th className="text-right py-2 px-3 font-medium text-slate-600">Total</th>
                                <th className="text-right py-2 px-3 font-medium text-slate-600">ICMS</th>
                              </tr>
                            </thead>
                            <tbody>
                              {detail.invoices.map((inv) => (
                                <tr key={inv.id} className="border-t border-slate-100">
                                  <td className="py-1.5 px-3 text-slate-800">
                                    #{inv.number}
                                  </td>
                                  <td className="py-1.5 px-3 text-slate-600 truncate max-w-[180px]">
                                    {inv.supplier?.name}
                                  </td>
                                  <td className="py-1.5 px-3 text-right text-slate-700">
                                    {formatBRL(inv.totalValue)}
                                  </td>
                                  <td className="py-1.5 px-3 text-right text-green-700 font-medium">
                                    {formatBRL(inv.icmsValue)}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <div className="text-center py-4 text-slate-400 text-xs bg-slate-50 rounded-lg">
                          <AlertCircle className="h-5 w-5 mx-auto mb-1" />
                          Nenhuma NF-e de entrada neste mês
                        </div>
                      )}
                    </div>

                    {/* Débitos (editáveis se mês aberto) */}
                    <div className="border-t border-slate-200 pt-5">
                      <h4 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
                        <TrendingDown className="h-4 w-4 text-red-600" />
                        Débitos (Vendas do Mês)
                      </h4>

                      <div className="grid grid-cols-2 gap-3 mb-3">
                        <div>
                          <label className="block text-xs font-medium text-slate-500 mb-1">
                            Valor total de vendas (R$)
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            value={editSales}
                            onChange={(e) => setEditSales(e.target.value)}
                            disabled={detail.status === 'FECHADA'}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:bg-slate-100 disabled:text-slate-500"
                            placeholder="0,00"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-500 mb-1">
                            Alíquota ICMS (%)
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            value={editRate}
                            onChange={(e) => setEditRate(e.target.value)}
                            disabled={detail.status === 'FECHADA'}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:bg-slate-100 disabled:text-slate-500"
                            placeholder="18"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-slate-500 mb-1">
                          Observações (opcional)
                        </label>
                        <textarea
                          value={editObs}
                          onChange={(e) => setEditObs(e.target.value)}
                          disabled={detail.status === 'FECHADA'}
                          rows={2}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:bg-slate-100"
                          placeholder="Ex: apuração simplificada, sem diferimentos..."
                        />
                      </div>
                    </div>

                    {/* Resultado (preview em tempo real) */}
                    <div
                      className={`rounded-lg p-4 border-2 ${
                        previewBalance > 0
                          ? 'bg-red-50 border-red-200'
                          : previewBalance < 0
                          ? 'bg-green-50 border-green-200'
                          : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      <div className="grid grid-cols-3 gap-3 text-sm">
                        <div>
                          <p className="text-xs text-slate-600">Débito</p>
                          <p className="font-bold text-red-700">{formatBRL(previewDebits)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-600">Crédito</p>
                          <p className="font-bold text-green-700">
                            {formatBRL(detail.creditsIcms)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-600">Saldo</p>
                          <p
                            className={`font-bold text-lg ${
                              previewBalance > 0
                                ? 'text-red-700'
                                : previewBalance < 0
                                ? 'text-green-700'
                                : 'text-slate-600'
                            }`}
                          >
                            {previewBalance > 0 ? '' : previewBalance < 0 ? '−' : ''}
                            {formatBRL(Math.abs(previewBalance))}
                          </p>
                          <p className="text-[10px] text-slate-500">
                            {previewBalance > 0
                              ? 'A PAGAR'
                              : previewBalance < 0
                              ? 'CRÉDITO ACUMULADO'
                              : 'QUITADO'}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Ações */}
                    <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-200">
                      {detail.status === 'ABERTA' ? (
                        <>
                          <button
                            onClick={saveDebits}
                            disabled={saving}
                            className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-lg text-sm transition-colors disabled:opacity-50"
                          >
                            {saving ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Save className="h-4 w-4" />
                            )}
                            Salvar Apuração
                          </button>
                          <button
                            onClick={closeMonth}
                            disabled={saving}
                            className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white font-semibold rounded-lg text-sm transition-colors disabled:opacity-50"
                          >
                            <Lock className="h-4 w-4" />
                            Fechar Mês
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={reopenMonth}
                          disabled={saving}
                          className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-lg text-sm transition-colors disabled:opacity-50"
                        >
                          {saving ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Unlock className="h-4 w-4" />
                          )}
                          Reabrir para Edição
                        </button>
                      )}
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