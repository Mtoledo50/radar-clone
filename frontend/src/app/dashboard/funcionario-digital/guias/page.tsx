// =================================================================
// INÍCIO: frontend/src/app/dashboard/funcionario-digital/guias/page.tsx
// =================================================================
// 🧾 Guias de Imposto — DAS e ISS calculados pela Aurora (FD-4)
//
// Filosofia (ADR-038): memória de cálculo auditável (steps, sources, lawRef)
// Regra de Ouro: Aurora calcula, humano confere e transmite no portal oficial
//
// Funcionalidades:
//   - KPIs: total de guias, ISS próprio, DAS, valor total
//   - Filtros: período, tipo (DAS/ISS), status
//   - Tabela com todas as guias do tenant
//   - Modal "Ver memória de cálculo" com cada passo da conta
//   - Botão "Aprovar" (muda status DRAFT → APPROVED)
//   - Botão "Calcular mês anterior" (dispara TAX_GUIDES em lote)
// =================================================================
'use client';

import { useEffect, useState, useMemo } from 'react';
import {
  Scale,
  Calculator,
  RefreshCw,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  Eye,
  X,
  ArrowLeft,
  FileText,
  Calendar,
  Printer, // 🆕 imprimir guia

} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import api from '@/lib/axios';

// -----------------------------------------------------------------
// Tipos
// -----------------------------------------------------------------
interface TaxGuide {
  id: string;
  period: string;
  type: 'DAS' | 'ISS' | 'DARF';
  value: string;
  dueDate?: string;
  status: 'DRAFT' | 'APPROVED' | 'TRANSMITTED' | 'REJECTED';
  memory: any;
  client?: { id: string; companyName: string; cnpj?: string } | null;
  createdAt: string;
}

const formatBRL = (v: string | number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
    Number(v) || 0,
  );

const statusConfig = {
  DRAFT: { label: 'Rascunho', bg: 'bg-yellow-100', text: 'text-yellow-800', icon: Clock },
  APPROVED: { label: 'Aprovada', bg: 'bg-green-100', text: 'text-green-800', icon: CheckCircle2 },
  TRANSMITTED: { label: 'Transmitida', bg: 'bg-blue-100', text: 'text-blue-800', icon: CheckCircle2 },
  REJECTED: { label: 'Rejeitada', bg: 'bg-red-100', text: 'text-red-800', icon: X },
};

const typeConfig = {
  DAS: { label: 'DAS (Simples)', bg: 'bg-purple-100', text: 'text-purple-800' },
  ISS: { label: 'ISS', bg: 'bg-teal-100', text: 'text-teal-800' },
  DARF: { label: 'DARF', bg: 'bg-orange-100', text: 'text-orange-800' },
};

// -----------------------------------------------------------------
// Componente
// -----------------------------------------------------------------
export default function GuiasImpostoPage() {
  const [items, setItems] = useState<TaxGuide[]>([]);
  const [loading, setLoading] = useState(true);
  const [calculating, setCalculating] = useState(false);
  const [approving, setApproving] = useState<string | null>(null);

  // Filtros
  const [periodFilter, setPeriodFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Modal
  const [memoryModal, setMemoryModal] = useState<TaxGuide | null>(null);

  // -----------------------------------------------------------------
  // Fetch
  // -----------------------------------------------------------------
  const fetchAll = async () => {
    try {
      setLoading(true);
      const params: Record<string, string> = {};
      if (periodFilter) params.period = periodFilter;
      if (typeFilter) params.type = typeFilter;
      if (statusFilter) params.status = statusFilter;
      const res = await api.get('/digital-employee/tax-guides', { params });
      setItems(res.data.value || []);
    } catch (e: any) {
      toast.error('Erro ao carregar guias');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, [periodFilter, typeFilter, statusFilter]);

  // -----------------------------------------------------------------
  // Ações
  // -----------------------------------------------------------------
  const handleCalculate = async () => {
    // Default: mês anterior
    const d = new Date();
    d.setUTCMonth(d.getUTCMonth() - 1);
    const period = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
    if (!confirm(`Calcular guias para ${period}?\n(Aurora vai ler NFS-e do período e gerar DAS + ISS)`)) return;

    try {
      setCalculating(true);
      toast.loading('Calculando guias...');
      const res = await api.post('/digital-employee/tax-guides/calculate', { period });
      const data = res.data;
      toast.dismiss();
      if (data.status === 'SUCCESS') {
        toast.success(
          `✅ ${data.result.created + data.result.updated} guias geradas para ${period}`,
        );
      } else if (data.status === 'PARTIAL') {
        toast.warning(`⚠️ Parcial: ${data.result.warnings} guias com alertas`);
      } else {
        toast.error('Erro no cálculo');
      }
      fetchAll();
    } catch (e: any) {
      toast.dismiss();
      toast.error(e?.response?.data?.message || 'Erro');
    } finally {
      setCalculating(false);
    }
  };

  const handleApprove = async (id: string) => {
    try {
      setApproving(id);
      toast.loading('Aprovando guia...');
      // Endpoint simples: PATCH /digital-employee/tax-guides/:id (apenas status)
      await api.patch(`/digital-employee/tax-guides/${id}`, { status: 'APPROVED' });
      toast.dismiss();
      toast.success('✅ Guia aprovada — pronta para transmissão manual');
      fetchAll();
    } catch (e: any) {
      toast.dismiss();
      toast.error(e?.response?.data?.message || 'Erro');
    } finally {
      setApproving(null);
    }
  };
  const handlePrint = async (id: string) => {
    try {
      toast.loading('Gerando PDF da guia...');
      const res = await api.get(`/digital-employee/tax-guides/${id}/pdf`, {
        responseType: 'blob',
      });
      toast.dismiss();
      const blob = new Blob([res.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      // Abre em nova aba → usuário imprime com Ctrl+P
      window.open(url, '_blank');
    } catch (e: any) {
      toast.dismiss();
      toast.error(e?.response?.data?.message || 'Erro ao gerar PDF');
    }
  };
  // -----------------------------------------------------------------
  // Stats
  // -----------------------------------------------------------------
  const stats = useMemo(() => {
    const iss = items.filter((i) => i.type === 'ISS');
    const das = items.filter((i) => i.type === 'DAS');
    return {
      total: items.length,
      issTotal: iss.reduce((a, i) => a + Number(i.value), 0),
      dasTotal: das.reduce((a, i) => a + Number(i.value), 0),
      totalToPay: items.reduce((a, i) => a + Number(i.value), 0),
      draft: items.filter((i) => i.status === 'DRAFT').length,
      approved: items.filter((i) => i.status === 'APPROVED').length,
    };
  }, [items]);

  // Períodos únicos
  const uniquePeriods = useMemo(() => {
    const set = new Set(items.map((i) => i.period));
    return Array.from(set).sort((a, b) => b.localeCompare(a));
  }, [items]);

  // -----------------------------------------------------------------
  // Render
  // -----------------------------------------------------------------
  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/funcionario-digital"
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <span title="Voltar para a Aurora">
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </span>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Scale className="w-7 h-7 text-teal-600" />
              Guias de Imposto
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              DAS (Simples) e ISS calculados pela Aurora — memória de cálculo auditável (ADR-038)
            </p>
          </div>
        </div>
        <button
          onClick={handleCalculate}
          disabled={calculating}
          className="flex items-center gap-2 px-4 py-2.5 bg-teal-600 hover:bg-teal-700
                     disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg
                     font-medium text-sm transition-colors shadow-sm"
        >
          <Calculator className={`w-4 h-4 ${calculating ? 'animate-spin' : ''}`} />
          {calculating ? 'Calculando...' : 'Calcular mês anterior'}
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
          <p className="text-xs text-gray-500 font-medium">Total de guias</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{stats.total}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
          <p className="text-xs text-teal-600 font-medium">ISS do período</p>
          <p className="text-2xl font-bold text-teal-700 mt-1">
            {formatBRL(stats.issTotal)}
          </p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
          <p className="text-xs text-purple-600 font-medium">DAS do período</p>
          <p className="text-2xl font-bold text-purple-700 mt-1">
            {formatBRL(stats.dasTotal)}
          </p>
        </div>
        <div className="bg-gradient-to-br from-teal-50 to-purple-50 rounded-xl p-4 border border-teal-200 shadow-sm">
          <p className="text-xs text-gray-700 font-medium">Total a recolher</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">
            {formatBRL(stats.totalToPay)}
          </p>
        </div>
      </div>

      {/* Status badges */}
      <div className="flex gap-2 flex-wrap">
        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
          <Clock className="w-3 h-3" /> {stats.draft} em rascunho
        </span>
        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
          <CheckCircle2 className="w-3 h-3" /> {stats.approved} aprovadas
        </span>
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
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
            <option value="">Todos os tipos</option>
            <option value="DAS">DAS (Simples)</option>
            <option value="ISS">ISS</option>
            <option value="DARF">DARF</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
            <option value="">Todos os status</option>
            <option value="DRAFT">Rascunho</option>
            <option value="APPROVED">Aprovada</option>
            <option value="TRANSMITTED">Transmitida</option>
            <option value="REJECTED">Rejeitada</option>
          </select>
        </div>
      </div>

      {/* Tabela */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">{items.length} guias</h2>
          <button
            onClick={fetchAll}
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
        ) : items.length === 0 ? (
          <div className="p-12 text-center">
            <Scale className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p className="text-gray-500 font-medium">Nenhuma guia calculada</p>
            <p className="text-xs text-gray-400 mt-1">
              Clique em "Calcular mês anterior" para gerar guias para todos os clientes com NFS-e.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold text-gray-700">Cliente</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-700">Período</th>
                  <th className="text-center px-4 py-3 font-semibold text-gray-700">Tipo</th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-700">Valor</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-700">Vencimento</th>
                  <th className="text-center px-4 py-3 font-semibold text-gray-700">Status</th>
                  <th className="text-center px-4 py-3 font-semibold text-gray-700">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {items.map((g) => {
                  const StatusIcon = statusConfig[g.status].icon;
                  return (
                    <tr key={g.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900">
                          {g.client?.companyName || '—'}
                        </div>
                        <div className="text-xs text-gray-500">{g.client?.cnpj || ''}</div>
                      </td>
                      <td className="px-4 py-3 text-gray-700">{g.period}</td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`inline-block px-2 py-1 rounded text-xs font-medium ${typeConfig[g.type].bg} ${typeConfig[g.type].text}`}
                        >
                          {typeConfig[g.type].label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-gray-900">
                        {formatBRL(g.value)}
                      </td>
                      <td className="px-4 py-3 text-gray-700">
                        {g.dueDate ? (
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-gray-400" />
                            {new Date(g.dueDate).toLocaleDateString('pt-BR')}
                          </div>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${statusConfig[g.status].bg} ${statusConfig[g.status].text}`}
                        >
                          <StatusIcon className="w-3 h-3" />
                          {statusConfig[g.status].label}
                        </span>
                      </td>
                                            <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => handlePrint(g.id)}
                            className="p-1.5 rounded hover:bg-gray-100 text-gray-600"
                          >
                            <span title="Imprimir / salvar PDF">
                              <Printer className="w-4 h-4" />
                            </span>
                          </button>
                          <button
                            onClick={() => setMemoryModal(g)}
                            className="p-1.5 rounded hover:bg-gray-100 text-gray-600"
                          >
                            <span title="Ver memória de cálculo">
                              <Eye className="w-4 h-4" />
                            </span>
                          </button>
                          {g.status === 'DRAFT' && (
                            <button
                              onClick={() => handleApprove(g.id)}
                              disabled={approving === g.id}
                              className="px-2.5 py-1 rounded bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white text-xs font-medium"
                            >
                              {approving === g.id ? '...' : 'Aprovar'}
                            </button>
                          )}
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

      {/* Modal de memória de cálculo (ADR-038 — a conta auditável) */}
      {memoryModal && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => setMemoryModal(null)}
        >
          <div
            className="bg-white rounded-xl shadow-xl max-w-3xl w-full max-h-[85vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-teal-50 to-purple-50">
              <div>
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-teal-600" />
                  Memória de cálculo — {memoryModal.type} {memoryModal.period}
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  {memoryModal.client?.companyName} • Valor: {formatBRL(memoryModal.value)}
                </p>
              </div>
              <button
                onClick={() => setMemoryModal(null)}
                className="p-1.5 rounded hover:bg-gray-100"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="flex-1 overflow-auto p-6 space-y-4">
              {/* Passos da conta */}
              <div>
                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                  Passo a passo
                </h4>
                <ol className="space-y-1.5">
                  {memoryModal.memory.steps?.map((step: string, i: number) => (
                    <li
                      key={i}
                      className="flex gap-2 text-sm text-gray-800 font-mono bg-gray-50 rounded px-3 py-2"
                    >
                      <span className="text-teal-600 font-bold">{i + 1}.</span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ol>
              </div>

              {/* Referência legal */}
              {memoryModal.memory.lawRef && (
                <div>
                  <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                    Referência legal
                  </h4>
                  <div className="text-sm text-gray-700 bg-blue-50 rounded px-3 py-2 border-l-4 border-blue-400">
                    📚 {memoryModal.memory.lawRef}
                  </div>
                </div>
              )}

              {/* Warnings (ISS) */}
              {memoryModal.memory.warnings?.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold text-yellow-700 uppercase tracking-wider mb-2">
                    ⚠️ Alertas
                  </h4>
                  <ul className="space-y-1">
                    {memoryModal.memory.warnings.map((w: string, i: number) => (
                      <li key={i} className="text-sm text-yellow-800 bg-yellow-50 rounded px-3 py-2">
                        {w}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Fontes (NFS-e IDs usados no cálculo ISS) */}
              {memoryModal.memory.sources?.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                    Fontes ({memoryModal.memory.sources.length} NFS-e)
                  </h4>
                  <div className="text-xs text-gray-600 font-mono bg-gray-50 rounded p-3 space-y-0.5">
                    {memoryModal.memory.sources.map((s: string) => (
                      <div key={s}>• {s}</div>
                    ))}
                  </div>
                </div>
              )}

              {/* Metadados */}
              <div className="text-xs text-gray-400 pt-2 border-t border-gray-100">
                Calculado em {new Date(memoryModal.memory.generatedAt).toLocaleString('pt-BR')}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
// =================================================================
// FIM: guias/page.tsx
// =================================================================