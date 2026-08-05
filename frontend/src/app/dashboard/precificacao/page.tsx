// =================================================================
// INÍCIO: frontend/src/app/dashboard/precificacao/page.tsx
// =================================================================
// 🚀 MOTOR DE PROPOSTAS COMERCIAIS (Enterprise Edition)
// Construtor de propostas relacionais integrado ao Catálogo de
// Serviços, Planos Comerciais e BI de Vendas.
// =================================================================
'use client';

import { useState, useEffect, useMemo } from 'react';
import api from '@/lib/axios';
import { toast } from 'sonner';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  FileText, Plus, Search, Eye, Loader2, X, Save, Send,
  Trophy, XCircle, Download, Link2, DollarSign, TrendingUp,
  Users, Building2, Package, ChevronRight, ChevronLeft,
  Crown, Sparkles, AlertTriangle, Copy, CheckCircle2, Target
} from 'lucide-react';

// =================================================================
// 📋 TIPOS E INTERFACES (Alinhados ao Backend)
// =================================================================

interface CommercialPlan {
  id: string;
  name: string;
  multiplier: number;
  badge?: string;
  color?: string;
  description?: string;
}

interface ServiceItem {
  id: string;
  name: string;
  description?: string;
  basePrice: number;
  recurrence: string;
  category?: { name: string };
}

interface ProposalItem {
  id: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  commercialPlan?: CommercialPlan | null;
  serviceItem?: ServiceItem | null;
}

interface Proposal {
  id: string;
  proposalNumber: string;
  slug: string;
  clientName: string;
  clientCnpj?: string;
  taxRegime: string;
  activity: string;
  monthlyRevenue: number;
  employeeCount: number;
  basePrice: number;
  status: string;
  aboutOffice?: string;
  differentials?: string;
  onboarding?: string;
  commercialTerms?: string;
  specificNote?: string;
  closedPrice?: number;
  lossReason?: string;
  createdAt: string;
  items?: ProposalItem[];
}

interface DashboardMetrics {
  totalProposals: number;
  wonProposals: number;
  lostProposals: number;
  sentProposals: number;
  conversionRate: number;
  wonRevenue: number;
}

// =================================================================
// 🎨 CONFIGURAÇÃO DE STATUS (Badges visuais)
// =================================================================
const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  DRAFT:       { label: 'Rascunho',   color: 'bg-slate-100 text-slate-700',   icon: FileText },
  SENT:        { label: 'Enviada',    color: 'bg-blue-100 text-blue-700',     icon: Send },
  VIEWED:      { label: 'Visualizada', color: 'bg-amber-100 text-amber-700', icon: Eye },
  CLOSED_WON:  { label: 'Ganha',      color: 'bg-green-100 text-green-700',   icon: Trophy },
  CLOSED_LOST: { label: 'Perdida',    color: 'bg-red-100 text-red-700',       icon: XCircle },
};

const REGIMES = [
  { value: 'MEI', label: 'MEI' },
  { value: 'SIMPLES_NACIONAL', label: 'Simples Nacional' },
  { value: 'LUCRO_PRESUMIDO', label: 'Lucro Presumido' },
  { value: 'LUCRO_REAL', label: 'Lucro Real' },
];

// =================================================================
// 🔧 HELPERS
// =================================================================

/** Formata valor monetário no padrão brasileiro */
function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })
    .format(value || 0);
}

/** Formata data ISO para pt-BR */
function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('pt-BR');
}

/** Gera slug único para link público da proposta */
function generateSlug(clientName: string): string {
  const clean = clientName
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove acentos
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return `${clean}-${Date.now().toString(36)}`;
}

/** Gera número sequencial legível da proposta */
function generateProposalNumber(): string {
  const year = new Date().getFullYear();
  const seq = Math.floor(Math.random() * 9000) + 1000;
  return `PROP-${year}-${seq}`;
}

// =================================================================
// 🎯 COMPONENTE PRINCIPAL
// =================================================================
export default function PrecificacaoPage() {
  // =================================================================
  // ESTADOS GLOBAIS
  // =================================================================
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [plans, setPlans] = useState<CommercialPlan[]>([]);
  const [serviceItems, setServiceItems] = useState<ServiceItem[]>([]);
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    totalProposals: 0, wonProposals: 0, lostProposals: 0,
    sentProposals: 0, conversionRate: 0, wonRevenue: 0,
  });

  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPeriod, setFilterPeriod] = useState('30d');

  // Modais
  const [showWizard, setShowWizard] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [showLoseModal, setShowLoseModal] = useState(false);
  const [selectedProposal, setSelectedProposal] = useState<Proposal | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Wizard
  const [wizardStep, setWizardStep] = useState(1);

  // Formulário da proposta (alinhado ao CreateProposal do backend)
  const [form, setForm] = useState({
    clientName: '',
    clientCnpj: '',
    taxRegime: 'SIMPLES_NACIONAL',
    activity: '',
    monthlyRevenue: 0,
    employeeCount: 0,
    basePrice: 0, // Valor base calculado (honorário)
    selectedPlanId: '',
    selectedAvulsoIds: [] as string[],
    aboutOffice: '',
    differentials: '',
    onboarding: '',
    commercialTerms: '',
    specificNote: '',
  });

  // Motivo de perda / valor de fechamento
  const [lossReason, setLossReason] = useState('');
  const [closedPrice, setClosedPrice] = useState(0);

  // =================================================================
  // ESTILOS (Design System Conta Certa)
  // =================================================================
  const inputClass = 'w-full px-3 py-2.5 border border-slate-300 rounded-lg text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all bg-white';
  const btnPrimary = 'flex items-center justify-center gap-2 px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-lg transition-colors shadow-sm disabled:opacity-50';
  const btnSecondary = 'flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold rounded-lg transition-colors';

  // =================================================================
  // CARREGAR DADOS (Paralelo para performance)
  // =================================================================
  useEffect(() => {
    loadInitialData();
  }, [filterPeriod]);

    async function loadInitialData() {
    try {
      setLoading(true);
      // ✅ Cada requisição com .catch próprio: uma falha não derruba as demais
      const [propRes, dashRes, plansRes, itemsRes] = await Promise.all([
        api.get('/proposals').catch(() => ({ data: { data: [] } })),
        api.get(`/proposals/dashboard?period=${filterPeriod}`).catch(() => ({ data: { data: null } })),
        api.get('/commercial-plans/plans').catch(() => ({ data: { data: [] } })),
        api.get('/commercial-plans/items').catch(() => ({ data: { data: [] } })),
      ]);

      setProposals(propRes.data.data || []);
      if (dashRes.data.data) setMetrics(dashRes.data.data);
      setPlans(plansRes.data.data || []);
      setServiceItems(itemsRes.data.data || []);
    } catch (err) {
      toast.error('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  }

  // =================================================================
  // 💰 CALCULADORA DE VALOR (Tempo real)
  // =================================================================
  const totalProposalValue = useMemo(() => {
    let total = 0;
    // Plano: basePrice × multiplicador
    if (form.selectedPlanId && form.basePrice > 0) {
      const plan = plans.find(p => p.id === form.selectedPlanId);
      if (plan) total += form.basePrice * plan.multiplier;
    }
    // Add-ons: soma dos preços dos serviços avulsos
    form.selectedAvulsoIds.forEach(id => {
      const item = serviceItems.find(s => s.id === id);
      if (item) total += Number(item.basePrice);
    });
    return total;
  }, [form.selectedPlanId, form.selectedAvulsoIds, form.basePrice, plans, serviceItems]);

  // =================================================================
  // 🔍 FILTRAGEM
  // =================================================================
  const filteredProposals = proposals.filter(p => {
    const matchesSearch =
      p.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.proposalNumber.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || p.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  // =================================================================
  // FUNÇÕES: ABRIR MODAIS
  // =================================================================
  function openWizard() {
    setForm({
      clientName: '', clientCnpj: '', taxRegime: 'SIMPLES_NACIONAL',
      activity: '', monthlyRevenue: 0, employeeCount: 0, basePrice: 0,
      selectedPlanId: plans[0]?.id || '', selectedAvulsoIds: [],
      aboutOffice: '', differentials: '', onboarding: '',
      commercialTerms: '', specificNote: '',
    });
    setWizardStep(1);
    setShowWizard(true);
  }

  function openViewModal(proposal: Proposal) {
    setSelectedProposal(proposal);
    setShowViewModal(true);
  }

  function openCloseModal(proposal: Proposal) {
    setSelectedProposal(proposal);
    setClosedPrice(proposal.basePrice);
    setShowCloseModal(true);
  }

  function openLoseModal(proposal: Proposal) {
    setSelectedProposal(proposal);
    setLossReason('');
    setShowLoseModal(true);
  }

  // =================================================================
  // 💾 SALVAR PROPOSTA (Transacional no backend)
  // =================================================================
  async function handleSubmitProposal() {
    if (!form.clientName.trim()) {
      toast.error('Preencha o nome do cliente no Passo 1');
      setWizardStep(1);
      return;
    }
    if (!form.selectedPlanId) {
      toast.error('Selecione um plano comercial no Passo 2');
      setWizardStep(2);
      return;
    }

    setSubmitting(true);
    try {
      // Monta itens relacionais (ProposalItem)
      const items: any[] = [];

      // Item do plano
      const plan = plans.find(p => p.id === form.selectedPlanId);
      if (plan) {
        const planPrice = form.basePrice * plan.multiplier;
        items.push({
          commercialPlanId: plan.id,
          quantity: 1,
          unitPrice: planPrice,
          totalPrice: planPrice,
        });
      }

      // Itens avulsos
      form.selectedAvulsoIds.forEach(id => {
        const svc = serviceItems.find(s => s.id === id);
        if (svc) {
          items.push({
            serviceItemId: svc.id,
            quantity: 1,
            unitPrice: Number(svc.basePrice),
            totalPrice: Number(svc.basePrice),
          });
        }
      });

      await api.post('/proposals', {
        proposalNumber: generateProposalNumber(),
        slug: generateSlug(form.clientName),
        clientName: form.clientName,
        clientCnpj: form.clientCnpj,
        taxRegime: form.taxRegime,
        activity: form.activity,
        monthlyRevenue: form.monthlyRevenue,
        employeeCount: form.employeeCount,
        basePrice: form.basePrice,
        aboutOffice: form.aboutOffice,
        differentials: form.differentials,
        onboarding: form.onboarding,
        commercialTerms: form.commercialTerms,
        specificNote: form.specificNote,
        items,
      });

      toast.success('Proposta criada com sucesso!');
      setShowWizard(false);
      loadInitialData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Erro ao criar proposta');
    } finally {
      setSubmitting(false);
    }
  }

  // =================================================================
  // 🔄 MUDANÇAS DE STATUS
  // =================================================================
  async function handleSend(proposal: Proposal) {
    try {
      await api.post(`/proposals/${proposal.id}/send`);
      toast.success('Proposta marcada como enviada!');
      loadInitialData();
    } catch {
      toast.error('Erro ao atualizar status');
    }
  }

  async function handleCloseProposal() {
    if (!selectedProposal) return;
    setSubmitting(true);
    try {
      await api.post(`/proposals/${selectedProposal.id}/close`, {
        planId: form.selectedPlanId || '',
        price: closedPrice,
      });
      toast.success('🎉 Negócio fechado com sucesso!');
      setShowCloseModal(false);
      loadInitialData();
    } catch {
      toast.error('Erro ao fechar proposta');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleLoseProposal() {
    if (!selectedProposal) return;
    if (!lossReason.trim()) {
      toast.error('Informe o motivo da perda');
      return;
    }
    setSubmitting(true);
    try {
      await api.post(`/proposals/${selectedProposal.id}/lose`, { reason: lossReason });
      toast.success('Proposta marcada como perdida');
      setShowLoseModal(false);
      loadInitialData();
    } catch {
      toast.error('Erro ao atualizar proposta');
    } finally {
      setSubmitting(false);
    }
  }

  // =================================================================
  // 🗑️ EXCLUIR PROPOSTA
  // =================================================================
  async function handleDelete(proposal: Proposal) {
    if (!window.confirm(`Excluir a proposta ${proposal.proposalNumber}?`)) return;
    try {
      await api.delete(`/proposals/${proposal.id}`);
      toast.success('Proposta removida');
      loadInitialData();
    } catch {
      toast.error('Erro ao excluir proposta');
    }
  }

  // =================================================================
  // 🔗 COPIAR LINK PÚBLICO
  // =================================================================
  function copyPublicLink(proposal: Proposal) {
    const url = `${window.location.origin}/proposta/${proposal.slug}`;
    navigator.clipboard.writeText(url);
    toast.success('Link público copiado!');
  }

  // =================================================================
  // 📄 EXPORTAR PDF (Padrão Conta Certa)
  // =================================================================
  function exportToPDF() {
    const doc = new jsPDF();

    // Cabeçalho
    doc.setFontSize(20);
    doc.setTextColor(13, 148, 136);
    doc.text('Conta Certa - Propostas Comerciais', 14, 20);
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Relatório gerado em: ${new Date().toLocaleDateString('pt-BR')}`, 14, 28);
    doc.text(`Período: ${filterPeriod} | Total: ${filteredProposals.length}`, 14, 34);

    // Tabela
    const tableData = filteredProposals.map(p => [
      p.proposalNumber,
      p.clientName,
      REGIMES.find(r => r.value === p.taxRegime)?.label || p.taxRegime,
      STATUS_CONFIG[p.status]?.label || p.status,
      formatCurrency(p.basePrice),
      formatDate(p.createdAt),
    ]);

    autoTable(doc, {
      startY: 40,
      head: [['Número', 'Cliente', 'Regime', 'Status', 'Valor', 'Data']],
      body: tableData,
      theme: 'striped',
      headStyles: { fillColor: [13, 148, 136] },
      styles: { fontSize: 9 },
    });

    doc.save(`propostas_${new Date().toISOString().split('T')[0]}.pdf`);
    toast.success('PDF exportado com sucesso!');
  }

  // =================================================================
  // 📊 EXPORTAR CSV (UTF-8 + BOM para Excel)
  // =================================================================
  function exportToCSV() {
    const BOM = '\uFEFF'; // Garante acentos no Excel
    const header = 'Numero;Cliente;CNPJ;Regime;Status;Valor;Data\n';
    const rows = filteredProposals.map(p =>
      `${p.proposalNumber};${p.clientName};${p.clientCnpj || '-'};${p.taxRegime};${STATUS_CONFIG[p.status]?.label};${p.basePrice.toFixed(2).replace('.', ',')};${formatDate(p.createdAt)}`
    ).join('\n');

    const blob = new Blob([BOM + header + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `propostas_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('CSV exportado com sucesso!');
  }

  // =================================================================
  // RENDERIZAÇÃO: LOADING
  // =================================================================
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-12 w-12 text-teal-600 animate-spin" />
      </div>
    );
  }

  // =================================================================
  // RENDERIZAÇÃO: PÁGINA PRINCIPAL
  // =================================================================
  return (
    <div className="space-y-6">
      {/* CABEÇALHO */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
            <FileText className="h-8 w-8 text-teal-600" />
            Propostas Comerciais
          </h1>
          <p className="text-slate-600 mt-1">Crie propostas profissionais e acompanhe sua taxa de conversão</p>
        </div>
        <div className="flex gap-3">
          <button onClick={exportToCSV} className={btnSecondary}>
            <Download className="h-5 w-5" /> CSV
          </button>
          <button onClick={exportToPDF} className={btnSecondary}>
            <FileText className="h-5 w-5" /> PDF
          </button>
          <button onClick={openWizard} className={btnPrimary}>
            <Plus className="h-5 w-5" /> Nova Proposta
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: 'Total', value: metrics.totalProposals, icon: FileText, color: 'text-slate-600' },
          { label: 'Ganhas', value: metrics.wonProposals, icon: Trophy, color: 'text-green-600' },
          { label: 'Perdidas', value: metrics.lostProposals, icon: XCircle, color: 'text-red-600' },
          { label: 'Conversão', value: `${metrics.conversionRate}%`, icon: Target, color: 'text-teal-600' },
          { label: 'Receita Ganha', value: formatCurrency(metrics.wonRevenue), icon: DollarSign, color: 'text-green-600' },
        ].map((kpi, i) => (
          <div key={i} className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase">{kpi.label}</span>
              <kpi.icon className={`h-4 w-4 ${kpi.color}`} />
            </div>
            <p className={`text-2xl font-bold mt-2 ${kpi.color}`}>{kpi.value}</p>
          </div>
        ))}
      </div>

      {/* FILTROS */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por cliente ou número..."
              className={`pl-10 ${inputClass}`}
            />
          </div>
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className={inputClass}>
            <option value="all">Todos os status</option>
            {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
              <option key={key} value={key}>{cfg.label}</option>
            ))}
          </select>
          <select value={filterPeriod} onChange={(e) => setFilterPeriod(e.target.value)} className={inputClass}>
            <option value="7d">Últimos 7 dias</option>
            <option value="30d">Últimos 30 dias</option>
            <option value="90d">Últimos 90 dias</option>
            <option value="12m">Últimos 12 meses</option>
            <option value="ytd">Este ano</option>
          </select>
        </div>
      </div>

      {/* TABELA */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-6 py-4 text-xs font-bold text-slate-600 uppercase">Número</th>
                <th className="text-left px-6 py-4 text-xs font-bold text-slate-600 uppercase">Cliente</th>
                <th className="text-left px-6 py-4 text-xs font-bold text-slate-600 uppercase">Regime</th>
                <th className="text-right px-6 py-4 text-xs font-bold text-slate-600 uppercase">Valor</th>
                <th className="text-center px-6 py-4 text-xs font-bold text-slate-600 uppercase">Status</th>
                <th className="text-right px-6 py-4 text-xs font-bold text-slate-600 uppercase">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredProposals.map((p) => {
                const statusCfg = STATUS_CONFIG[p.status] || STATUS_CONFIG.DRAFT;
                const StatusIcon = statusCfg.icon;
                return (
                  <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-mono text-sm font-semibold text-slate-900">{p.proposalNumber}</div>
                      <div className="text-xs text-slate-500">{formatDate(p.createdAt)}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-900">{p.clientName}</div>
                      <div className="text-xs text-slate-500">{p.clientCnpj || 'Sem CNPJ'}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-700">
                      {REGIMES.find(r => r.value === p.taxRegime)?.label || p.taxRegime}
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-slate-900 text-right">
                      {formatCurrency(p.closedPrice || p.basePrice)}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold ${statusCfg.color}`}>
                        <StatusIcon className="h-3 w-3" />
                        {statusCfg.label}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => openViewModal(p)} className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg" title="Visualizar">
                          <Eye className="h-4 w-4" />
                        </button>
                        <button onClick={() => copyPublicLink(p)} className="p-2 text-slate-500 hover:text-purple-600 hover:bg-purple-50 rounded-lg" title="Copiar link público">
                          <Link2 className="h-4 w-4" />
                        </button>
                        {p.status === 'DRAFT' && (
                          <button onClick={() => handleSend(p)} className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg" title="Marcar como enviada">
                            <Send className="h-4 w-4" />
                          </button>
                        )}
                        {(p.status === 'SENT' || p.status === 'VIEWED') && (
                          <>
                            <button onClick={() => openCloseModal(p)} className="p-2 text-slate-500 hover:text-green-600 hover:bg-green-50 rounded-lg" title="Fechar negócio">
                              <Trophy className="h-4 w-4" />
                            </button>
                            <button onClick={() => openLoseModal(p)} className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg" title="Marcar como perdida">
                              <XCircle className="h-4 w-4" />
                            </button>
                          </>
                        )}
                        <button onClick={() => handleDelete(p)} className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg" title="Excluir">
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filteredProposals.length === 0 && (
            <div className="text-center py-12 text-slate-500">
              <FileText className="h-12 w-12 mx-auto mb-3 text-slate-300" />
              <p className="text-lg font-medium">Nenhuma proposta encontrada</p>
              <p className="text-sm mt-1">Clique em "Nova Proposta" para começar</p>
            </div>
          )}
        </div>
      </div>

      {/* ============================================================= */}
      {/* 🧙 WIZARD DE NOVA PROPOSTA (5 PASSOS) */}
      {/* ============================================================= */}
      {showWizard && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-200 bg-slate-50 rounded-t-2xl">
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <Sparkles className="h-6 w-6 text-teal-600" />
                Nova Proposta Comercial
              </h2>
              <button onClick={() => setShowWizard(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Steps indicator */}
            <div className="flex border-b border-slate-200 px-6 bg-white overflow-x-auto">
              {[
                { n: 1, label: 'Prospect', icon: Building2 },
                { n: 2, label: 'Plano', icon: Crown },
                { n: 3, label: 'Add-ons', icon: Package },
                { n: 4, label: 'Textos', icon: FileText },
                { n: 5, label: 'Revisão', icon: CheckCircle2 },
              ].map(step => (
                <button
                  key={step.n}
                  onClick={() => setWizardStep(step.n)}
                  className={`px-4 py-3 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${
                    wizardStep === step.n ? 'border-teal-600 text-teal-600' : 'border-transparent text-slate-500 hover:text-slate-700'
                  }`}
                >
                  <step.icon className="h-4 w-4" /> {step.n}. {step.label}
                </button>
              ))}
            </div>

            {/* Conteúdo dos passos */}
            <div className="flex-1 overflow-y-auto p-6">

              {/* PASSO 1: PROSPECT */}
              {wizardStep === 1 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in duration-300">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Nome do Cliente *</label>
                    <input type="text" value={form.clientName} onChange={(e) => setForm({ ...form, clientName: e.target.value })} className={inputClass} placeholder="Ex: Tech Solutions LTDA" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">CNPJ</label>
                    <input type="text" value={form.clientCnpj} onChange={(e) => setForm({ ...form, clientCnpj: e.target.value })} className={inputClass} placeholder="00.000.000/0000-00" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Regime Tributário *</label>
                    <select value={form.taxRegime} onChange={(e) => setForm({ ...form, taxRegime: e.target.value })} className={inputClass}>
                      {REGIMES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Atividade (CNAE/Ramo)</label>
                    <input type="text" value={form.activity} onChange={(e) => setForm({ ...form, activity: e.target.value })} className={inputClass} placeholder="Ex: Comércio varejista" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Faturamento Mensal (R$)</label>
                    <input type="number" step="0.01" value={form.monthlyRevenue} onChange={(e) => setForm({ ...form, monthlyRevenue: parseFloat(e.target.value) || 0 })} className={inputClass} />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Nº de Funcionários</label>
                    <input type="number" value={form.employeeCount} onChange={(e) => setForm({ ...form, employeeCount: parseInt(e.target.value) || 0 })} className={inputClass} />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-slate-700 mb-1">
                      Valor Base Calculado (R$) *
                    </label>
                    <input type="number" step="0.01" value={form.basePrice} onChange={(e) => setForm({ ...form, basePrice: parseFloat(e.target.value) || 0 })} className={inputClass} placeholder="Ex: 450.00" />
                    <p className="text-xs text-slate-500 mt-1">
                      💡 Use a calculadora de precificação para obter este valor. Ele será multiplicado pelo fator do plano escolhido.
                    </p>
                  </div>
                </div>
              )}

              {/* PASSO 2: PLANO COMERCIAL */}
              {wizardStep === 2 && (
                <div className="animate-in fade-in duration-300">
                  <p className="text-sm text-slate-600 mb-4">
                    Selecione o plano comercial. O valor final = <strong>Valor Base × Multiplicador</strong>.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {plans.length === 0 && (
                      <div className="col-span-3 text-center py-8 bg-slate-50 rounded-lg border border-dashed border-slate-300">
                        <p className="text-slate-500">Nenhum plano cadastrado. Execute o seed de planos comerciais.</p>
                      </div>
                    )}
                    {plans.map(plan => {
                      const isSelected = form.selectedPlanId === plan.id;
                      const finalPrice = form.basePrice * plan.multiplier;
                      return (
                        <button
                          key={plan.id}
                          type="button"
                          onClick={() => setForm({ ...form, selectedPlanId: plan.id })}
                          className={`p-4 rounded-xl border-2 text-left transition-all relative ${
                            isSelected ? 'border-teal-600 bg-teal-50 shadow-md scale-[1.02]' : 'border-slate-200 hover:border-slate-300 bg-white'
                          }`}
                        >
                          {isSelected && (
                            <div className="absolute top-2 right-2 bg-teal-600 rounded-full p-1">
                              <CheckCircle2 className="h-4 w-4 text-white" />
                            </div>
                          )}
                          {plan.badge && (
                            <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase mb-2 text-white" style={{ backgroundColor: plan.color || '#64748b' }}>
                              {plan.badge}
                            </span>
                          )}
                          <h3 className="font-bold text-lg text-slate-900">{plan.name}</h3>
                          <p className="text-xs text-slate-500 mt-1 mb-3 min-h-[30px]">{plan.description}</p>
                          <div className="text-xs text-slate-500">Multiplicador: <strong>{plan.multiplier}x</strong></div>
                          {form.basePrice > 0 && (
                            <div className="text-lg font-bold text-teal-600 mt-1">{formatCurrency(finalPrice)}</div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* PASSO 3: ADD-ONS (SERVIÇOS AVULSOS) */}
              {wizardStep === 3 && (
                <div className="space-y-2 animate-in fade-in duration-300">
                  <p className="text-sm text-slate-600 mb-4">
                    Adicione serviços extras à proposta (ex: IRPF, Abertura de Empresa). Opcional.
                  </p>
                  {serviceItems.length === 0 && (
                    <div className="text-center py-8 bg-slate-50 rounded-lg border border-dashed border-slate-300">
                      <p className="text-slate-500">Nenhum serviço cadastrado no catálogo.</p>
                    </div>
                  )}
                  {serviceItems.map(item => {
                    const isSelected = form.selectedAvulsoIds.includes(item.id);
                    return (
                      <label
                        key={item.id}
                        className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                          isSelected ? 'border-purple-500 bg-purple-50' : 'border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setForm({ ...form, selectedAvulsoIds: [...form.selectedAvulsoIds, item.id] });
                            } else {
                              setForm({ ...form, selectedAvulsoIds: form.selectedAvulsoIds.filter(id => id !== item.id) });
                            }
                          }}
                          className="mt-1 h-4 w-4 text-purple-600 rounded focus:ring-purple-500"
                        />
                        <div className="flex-1">
                          <div className="font-semibold text-slate-900 text-sm">{item.name}</div>
                          {item.description && <p className="text-xs text-slate-500 mt-0.5">{item.description}</p>}
                          <p className="text-sm font-semibold text-teal-600 mt-1">{formatCurrency(Number(item.basePrice))}</p>
                        </div>
                      </label>
                    );
                  })}
                </div>
              )}

              {/* PASSO 4: TEXTOS DA PROPOSTA */}
              {wizardStep === 4 && (
                <div className="space-y-4 animate-in fade-in duration-300">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Sobre o Escritório</label>
                    <textarea value={form.aboutOffice} onChange={(e) => setForm({ ...form, aboutOffice: e.target.value })} rows={3} className={inputClass} placeholder="Apresentação profissional do escritório..." />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Diferenciais</label>
                    <textarea value={form.differentials} onChange={(e) => setForm({ ...form, differentials: e.target.value })} rows={3} className={inputClass} placeholder="Por que escolher a Conta Certa?" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Processo de Onboarding</label>
                    <textarea value={form.onboarding} onChange={(e) => setForm({ ...form, onboarding: e.target.value })} rows={3} className={inputClass} placeholder="Como funciona a migração e início dos trabalhos..." />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Condições Comerciais</label>
                    <textarea value={form.commercialTerms} onChange={(e) => setForm({ ...form, commercialTerms: e.target.value })} rows={3} className={inputClass} placeholder="Formas de pagamento, reajuste, vigência..." />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Observações Específicas</label>
                    <textarea value={form.specificNote} onChange={(e) => setForm({ ...form, specificNote: e.target.value })} rows={2} className={inputClass} placeholder="Notas específicas para este cliente..." />
                  </div>
                </div>
              )}

              {/* PASSO 5: REVISÃO */}
              {wizardStep === 5 && (
                <div className="space-y-4 animate-in fade-in duration-300">
                  <div className="bg-teal-50 border border-teal-200 rounded-xl p-4">
                    <h3 className="font-bold text-teal-900 mb-3">📋 Resumo da Proposta</h3>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div><span className="text-slate-500">Cliente:</span> <strong>{form.clientName || '-'}</strong></div>
                      <div><span className="text-slate-500">CNPJ:</span> <strong>{form.clientCnpj || '-'}</strong></div>
                      <div><span className="text-slate-500">Regime:</span> <strong>{REGIMES.find(r => r.value === form.taxRegime)?.label}</strong></div>
                      <div><span className="text-slate-500">Funcionários:</span> <strong>{form.employeeCount}</strong></div>
                      <div><span className="text-slate-500">Faturamento:</span> <strong>{formatCurrency(form.monthlyRevenue)}</strong></div>
                      <div><span className="text-slate-500">Plano:</span> <strong>{plans.find(p => p.id === form.selectedPlanId)?.name || '-'}</strong></div>
                      <div><span className="text-slate-500">Add-ons:</span> <strong>{form.selectedAvulsoIds.length} serviço(s)</strong></div>
                    </div>
                  </div>
                  <div className="bg-white border-2 border-teal-600 rounded-xl p-4 text-center">
                    <p className="text-sm text-slate-500 mb-1">Valor Total da Proposta</p>
                    <p className="text-3xl font-bold text-teal-600">{formatCurrency(totalProposalValue)}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Footer: navegação + total */}
            <div className="p-4 border-t border-slate-200 bg-slate-50 rounded-b-2xl">
              <div className="flex items-center justify-between mb-3 px-2">
                <span className="text-sm text-slate-600 flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-teal-600" /> Total atual:
                </span>
                <span className="text-xl font-bold text-teal-600">{formatCurrency(totalProposalValue)}</span>
              </div>
              <div className="flex justify-between">
                <button
                  type="button"
                  onClick={() => setWizardStep(Math.max(1, wizardStep - 1))}
                  disabled={wizardStep === 1}
                  className={btnSecondary + ' disabled:opacity-50'}
                >
                  <ChevronLeft className="h-4 w-4" /> Anterior
                </button>
                <div className="flex gap-3">
                  <button type="button" onClick={() => setShowWizard(false)} className={btnSecondary}>Cancelar</button>
                  {wizardStep < 5 ? (
                    <button type="button" onClick={() => setWizardStep(wizardStep + 1)} className={btnPrimary}>
                      Próximo <ChevronRight className="h-4 w-4" />
                    </button>
                  ) : (
                    <button type="button" onClick={handleSubmitProposal} disabled={submitting} className={btnPrimary}>
                      {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                      {submitting ? 'Salvando...' : 'Criar Proposta'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================= */}
      {/* 👁️ MODAL: VISUALIZAR PROPOSTA */}
      {/* ============================================================= */}
      {showViewModal && selectedProposal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-slate-200 sticky top-0 bg-white z-10">
              <div>
                <h2 className="text-xl font-bold text-slate-900">{selectedProposal.clientName}</h2>
                <p className="text-sm text-slate-500 font-mono">{selectedProposal.proposalNumber}</p>
              </div>
              <button onClick={() => setShowViewModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="p-6 space-y-6">
              {/* Dados do prospect */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase">Regime</label>
                  <p className="text-slate-900">{REGIMES.find(r => r.value === selectedProposal.taxRegime)?.label}</p>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase">Atividade</label>
                  <p className="text-slate-900">{selectedProposal.activity || '-'}</p>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase">Faturamento Mensal</label>
                  <p className="text-slate-900">{formatCurrency(selectedProposal.monthlyRevenue)}</p>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase">Funcionários</label>
                  <p className="text-slate-900">{selectedProposal.employeeCount}</p>
                </div>
              </div>

              {/* Itens da proposta */}
              <div className="border-t pt-4">
                <h3 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
                  <Package className="h-4 w-4 text-teal-600" /> Itens da Proposta
                </h3>
                {selectedProposal.items && selectedProposal.items.length > 0 ? (
                  <ul className="space-y-2">
                    {selectedProposal.items.map(item => (
                      <li key={item.id} className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                        <div>
                          <p className="font-medium text-slate-900 text-sm">
                            {item.commercialPlan?.name || item.serviceItem?.name || 'Item'}
                          </p>
                          <p className="text-xs text-slate-500">
                            {item.commercialPlan ? 'Plano Comercial' : 'Serviço Avulso'}
                          </p>
                        </div>
                        <span className="font-semibold text-teal-600">{formatCurrency(item.totalPrice)}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-slate-500 italic">Nenhum item registrado.</p>
                )}
              </div>

              {/* Textos */}
              {selectedProposal.aboutOffice && (
                <div className="border-t pt-4">
                  <h3 className="text-sm font-bold text-slate-700 mb-2">Sobre o Escritório</h3>
                  <p className="text-sm text-slate-600 whitespace-pre-wrap">{selectedProposal.aboutOffice}</p>
                </div>
              )}
              {selectedProposal.commercialTerms && (
                <div className="border-t pt-4">
                  <h3 className="text-sm font-bold text-slate-700 mb-2">Condições Comerciais</h3>
                  <p className="text-sm text-slate-600 whitespace-pre-wrap">{selectedProposal.commercialTerms}</p>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4 border-t">
                <button onClick={() => copyPublicLink(selectedProposal)} className={btnSecondary}>
                  <Link2 className="h-4 w-4" /> Copiar Link
                </button>
                <button onClick={() => setShowViewModal(false)} className={btnPrimary}>Fechar</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================= */}
      {/* 🏆 MODAL: FECHAR NEGÓCIO (Substitui confirm() nativo) */}
      {/* ============================================================= */}
      {showCloseModal && selectedProposal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-green-100 rounded-full">
                <Trophy className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Fechar Negócio!</h3>
            </div>
            <p className="text-slate-600 mb-4">
              Confirme o fechamento da proposta <strong>{selectedProposal.proposalNumber}</strong> para o cliente <strong>{selectedProposal.clientName}</strong>.
            </p>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Valor Final Fechado (R$)</label>
            <input
              type="number"
              step="0.01"
              value={closedPrice}
              onChange={(e) => setClosedPrice(parseFloat(e.target.value) || 0)}
              className={inputClass}
            />
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setShowCloseModal(false)} className={btnSecondary}>Cancelar</button>
              <button onClick={handleCloseProposal} disabled={submitting} className="flex items-center gap-2 px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg">
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trophy className="h-4 w-4" />}
                Confirmar Vitória
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================= */}
      {/* 📉 MODAL: MARCAR COMO PERDIDA */}
      {/* ============================================================= */}
      {showLoseModal && selectedProposal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-red-100 rounded-full">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Marcar como Perdida</h3>
            </div>
            <p className="text-slate-600 mb-4">
              Informe o motivo da perda. Esses dados alimentam o BI de vendas e ajudam a melhorar sua taxa de conversão.
            </p>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Motivo da Perda *</label>
            <textarea
              value={lossReason}
              onChange={(e) => setLossReason(e.target.value)}
              rows={3}
              className={inputClass}
              placeholder="Ex: Preço acima do orçamento, fechou com concorrente..."
            />
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setShowLoseModal(false)} className={btnSecondary}>Cancelar</button>
              <button onClick={handleLoseProposal} disabled={submitting} className="flex items-center gap-2 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg">
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
                Confirmar Perda
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
// =================================================================
// FIM: frontend/src/app/dashboard/precificacao/page.tsx
// =================================================================