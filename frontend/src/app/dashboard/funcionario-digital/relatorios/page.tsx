// =================================================================
// INÍCIO: frontend/src/app/dashboard/funcionario-digital/relatorios/page.tsx
// =================================================================
// 📊 Relatórios Mensais — Histórico e gestão dos PDFs gerados pela
//    Aurora (MonthlyReportSkill — FD-2 final).
//
// Usa `api` do axios (mesma instância do resto do projeto) que já
// injeta o token JWT via interceptor — não precisa gerenciar token.
//
// ADRs aplicadas: ADR-001 (Tailwind), ADR-021 (Lucide), ADR-030 (Regra de Ouro)
// =================================================================
'use client';

import { useEffect, useState, useMemo } from 'react';
import {
  FileText,
  Download,
  Play,
  RefreshCw,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  ArrowLeft,
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
// ✅ Usa a mesma instância do axios que o resto do projeto (com interceptor JWT)
import api from '@/lib/axios';

// -----------------------------------------------------------------
// Tipos
// -----------------------------------------------------------------
interface ReportSummary {
  receitas?: number;
  despesas?: number;
  saldo?: number;
  txCount?: number;
}

interface Report {
  id: string;
  clientId: string;
  period: string;
  status: 'GENERATING' | 'READY' | 'FAILED';
  pdfPath?: string;
  summary?: ReportSummary;
  errorMessage?: string;
  createdAt: string;
  client: {
    id: string;
    companyName: string;
    cnpj?: string;
    serviceType: string;
    monthlyFee: number;
  };
}

// -----------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------
const formatBRL = (v: number | undefined) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0);

const statusConfig = {
  READY: { label: 'Pronto', bg: 'bg-green-100', text: 'text-green-800', icon: CheckCircle2 },
  GENERATING: { label: 'Gerando...', bg: 'bg-yellow-100', text: 'text-yellow-800', icon: Clock },
  FAILED: { label: 'Falhou', bg: 'bg-red-100', text: 'text-red-800', icon: XCircle },
};

// -----------------------------------------------------------------
// Componente
// -----------------------------------------------------------------
export default function RelatoriosMensaisPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  // Filtros
  const [periodFilter, setPeriodFilter] = useState('');
  const [searchFilter, setSearchFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // -----------------------------------------------------------------
  // Fetch reports (via api do axios — token injetado automaticamente)
  // -----------------------------------------------------------------
  const fetchReports = async () => {
    try {
      setLoading(true);
      const params: Record<string, string> = {};
      if (periodFilter) params.period = periodFilter;
      if (statusFilter) params.status = statusFilter;

      const res = await api.get('/digital-employee/reports', { params });
      setReports(res.data.value || []);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Erro ao carregar relatórios');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [periodFilter, statusFilter]);

  // -----------------------------------------------------------------
  // Ações
  // -----------------------------------------------------------------
  const handleGenerateBatch = async () => {
    if (!confirm('Gerar relatórios do mês anterior para todos os clientes ATIVOS? Isso pode levar alguns minutos.')) return;
    try {
      setGenerating(true);
      toast.loading('Gerando relatórios em lote...');

      const res = await api.post('/digital-employee/skills/MONTHLY_REPORT/run');
      const data = res.data;

      toast.dismiss();
      if (data.status === 'SUCCESS') {
        toast.success(`✅ ${data.result.itemsProcessed} relatórios gerados!`);
      } else {
        toast.warning(`⚠️ Parcial: ${data.result.itemsProcessed} OK, ${data.result.itemsFailed} falharam`);
      }
      fetchReports();
    } catch (err: any) {
      toast.dismiss();
      toast.error(err?.response?.data?.message || 'Erro ao gerar');
    } finally {
      setGenerating(false);
    }
  };

  const handleGenerateOne = async (clientId: string) => {
    try {
      toast.loading('Gerando relatório...');
      const res = await api.post('/digital-employee/reports/generate', { clientId });
      const data = res.data;
      toast.dismiss();
      if (data.status === 'SUCCESS') {
        toast.success('✅ Relatório gerado com sucesso!');
      } else {
        toast.error('❌ Falha ao gerar');
      }
      fetchReports();
    } catch (err: any) {
      toast.dismiss();
      toast.error(err?.response?.data?.message || 'Erro');
    }
  };

  const handleDownload = async (reportId: string) => {
    try {
      // responseType: 'blob' é essencial para receber o PDF binário
      const res = await api.get(`/digital-employee/reports/${reportId}/download`, {
        responseType: 'blob',
      });
      const blob = new Blob([res.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `relatorio-${reportId.slice(0, 8)}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      toast.success('📥 Download iniciado');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Erro no download');
    }
  };

  // -----------------------------------------------------------------
  // Filtros em memória (busca por nome — backend só filtra period/status)
  // -----------------------------------------------------------------
  const filteredReports = useMemo(() => {
    if (!searchFilter.trim()) return reports;
    const q = searchFilter.toLowerCase();
    return reports.filter((r) =>
      r.client.companyName.toLowerCase().includes(q) ||
      (r.client.cnpj || '').toLowerCase().includes(q)
    );
  }, [reports, searchFilter]);

  const uniquePeriods = useMemo(() => {
    const set = new Set(reports.map((r) => r.period));
    return Array.from(set).sort((a, b) => b.localeCompare(a));
  }, [reports]);

  // -----------------------------------------------------------------
  // Render
  // -----------------------------------------------------------------
  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/funcionario-digital"
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            title="Voltar"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <FileText className="w-7 h-7 text-teal-600" />
              Relatórios Mensais
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              PDFs gerados automaticamente pela Aurora todo dia 5 às 08:00
            </p>
          </div>
        </div>
        <button
          onClick={handleGenerateBatch}
          disabled={generating}
          className="flex items-center gap-2 px-4 py-2.5 bg-teal-600 hover:bg-teal-700
                     disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg
                     font-medium text-sm transition-colors shadow-sm"
        >
          <RefreshCw className={`w-4 h-4 ${generating ? 'animate-spin' : ''}`} />
          {generating ? 'Gerando...' : 'Gerar mês anterior'}
        </button>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="flex items-center gap-2 mb-3">
          <Filter className="w-4 h-4 text-gray-500" />
          <span className="text-sm font-medium text-gray-700">Filtros</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <select
            value={periodFilter}
            onChange={(e) => setPeriodFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
            <option value="">Todos os períodos</option>
            {uniquePeriods.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
            <option value="">Todos os status</option>
            <option value="READY">Pronto</option>
            <option value="GENERATING">Gerando</option>
            <option value="FAILED">Falhou</option>
          </select>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              placeholder="Buscar por cliente ou CNPJ..."
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
        </div>
      </div>

      {/* Tabela */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">
            {filteredReports.length} relatório{filteredReports.length !== 1 ? 's' : ''}
          </h2>
          <button
            onClick={fetchReports}
            className="text-xs font-medium text-teal-700 hover:text-teal-900 flex items-center gap-1"
          >
            <RefreshCw className="w-3 h-3" />
            Atualizar
          </button>
        </div>

        {loading ? (
          <div className="p-12 text-center text-gray-400">
            <RefreshCw className="w-8 h-8 mx-auto mb-2 animate-spin" />
            Carregando...
          </div>
        ) : filteredReports.length === 0 ? (
          <div className="p-12 text-center">
            <AlertCircle className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p className="text-gray-500 font-medium">Nenhum relatório encontrado</p>
            <p className="text-xs text-gray-400 mt-1">
              Clique em "Gerar mês anterior" para criar relatórios para todos os clientes ativos.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold text-gray-700">Cliente</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-700">Período</th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-700">Honorário</th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-700">Receitas</th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-700">Despesas</th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-700">Saldo</th>
                  <th className="text-center px-4 py-3 font-semibold text-gray-700">Status</th>
                  <th className="text-center px-4 py-3 font-semibold text-gray-700">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredReports.map((r) => {
                  const StatusIcon = statusConfig[r.status].icon;
                  return (
                    <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900">{r.client.companyName}</div>
                        <div className="text-xs text-gray-500">{r.client.cnpj || '—'}</div>
                      </td>
                      <td className="px-4 py-3 text-gray-700">{r.period}</td>
                      <td className="px-4 py-3 text-right text-gray-700">
                        {formatBRL(r.client.monthlyFee)}
                      </td>
                      <td className="px-4 py-3 text-right text-green-700">
                        {formatBRL(r.summary?.receitas)}
                      </td>
                      <td className="px-4 py-3 text-right text-red-700">
                        {formatBRL(r.summary?.despesas)}
                      </td>
                      <td
                        className={`px-4 py-3 text-right font-medium ${
                          (r.summary?.saldo || 0) >= 0 ? 'text-green-700' : 'text-red-700'
                        }`}
                      >
                        {formatBRL(r.summary?.saldo)}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${statusConfig[r.status].bg} ${statusConfig[r.status].text}`}
                        >
                          <StatusIcon className="w-3 h-3" />
                          {statusConfig[r.status].label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-1">
                          {r.status === 'READY' && (
                            <button
                              onClick={() => handleDownload(r.id)}
                              className="p-1.5 rounded hover:bg-teal-50 text-teal-700"
                              title="Baixar PDF"
                            >
                              <Download className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={() => handleGenerateOne(r.clientId)}
                            className="p-1.5 rounded hover:bg-orange-50 text-orange-700"
                            title="Gerar agora (força atualização)"
                          >
                            <Play className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
// =================================================================
// FIM: frontend/src/app/dashboard/funcionario-digital/relatorios/page.tsx
// =================================================================