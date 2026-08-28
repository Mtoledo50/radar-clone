/**
 * =================================================================
 * PÁGINA: Detalhes da Proposta (Sprint A4 — Fechamento com Ganho)
 * =================================================================
 * Responsabilidade: Exibir e editar os dados de uma proposta específica.
 * Inclui botão "Fechar Proposta" que abre o modal de ganho (Sprint A4).
 * 
 * ADR-029: Fechamento com memória de cálculo (closingDetails JSON).
 * =================================================================
 */
'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api from '@/lib/axios';
import { toast } from 'sonner';
import {
  FileText,
  ArrowLeft,
  Edit2,
  Send,
  CheckCircle2,
  Loader2,
  GitBranch,
  TrendingUp,
  Eye,
  ExternalLink,
} from 'lucide-react';
import CloseProposalModal from '@/components/proposals/CloseProposalModal';

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
  version: number;
  isCurrent: boolean;
  createdAt: string;
  sentAt?: string;
  closedAt?: string;
  closedPrice?: number;
  closingDetails?: any;
  aboutOffice?: string;
  differentials?: string;
  onboarding?: string;
  commercialTerms?: string;
  specificNote?: string;
  items: any[];
}

export default function ProposalDetailPage() {
  const params = useParams();
  const router = useRouter();
  const proposalId = params.id as string;

  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showCloseModal, setShowCloseModal] = useState(false);

  // Campos editáveis
  const [clientName, setClientName] = useState('');
  const [clientCnpj, setClientCnpj] = useState('');
  const [taxRegime, setTaxRegime] = useState('');
  const [activity, setActivity] = useState('');
  const [monthlyRevenue, setMonthlyRevenue] = useState(0);
  const [employeeCount, setEmployeeCount] = useState(0);
  const [basePrice, setBasePrice] = useState(0);
  const [aboutOffice, setAboutOffice] = useState('');
  const [differentials, setDifferentials] = useState('');
  const [onboarding, setOnboarding] = useState('');
  const [commercialTerms, setCommercialTerms] = useState('');
  const [specificNote, setSpecificNote] = useState('');

  useEffect(() => {
    loadProposal();
  }, [proposalId]);

  async function loadProposal() {
    try {
      setLoading(true);
      const res = await api.get(`/proposals/${proposalId}`);
      const data = res.data.data || res.data;
      setProposal(data);

      // Popula os campos editáveis
      setClientName(data.clientName || '');
      setClientCnpj(data.clientCnpj || '');
      setTaxRegime(data.taxRegime || '');
      setActivity(data.activity || '');
      setMonthlyRevenue(data.monthlyRevenue || 0);
      setEmployeeCount(data.employeeCount || 0);
      setBasePrice(data.basePrice || 0);
      setAboutOffice(data.aboutOffice || '');
      setDifferentials(data.differentials || '');
      setOnboarding(data.onboarding || '');
      setCommercialTerms(data.commercialTerms || '');
      setSpecificNote(data.specificNote || '');
    } catch (err) {
      toast.error('Erro ao carregar proposta');
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    try {
      setSaving(true);
      await api.patch(`/proposals/${proposalId}`, {
        clientName,
        clientCnpj,
        taxRegime,
        activity,
        monthlyRevenue,
        employeeCount,
        basePrice,
        aboutOffice,
        differentials,
        onboarding,
        commercialTerms,
        specificNote,
      });
      toast.success('Proposta salva com sucesso!');
      await loadProposal();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Erro ao salvar proposta');
    } finally {
      setSaving(false);
    }
  }

  async function handleMarkAsSent() {
    if (!confirm('Marcar esta proposta como ENVIADA ao cliente?')) return;
    try {
      await api.patch(`/proposals/${proposalId}/mark-sent`);
      toast.success('Proposta marcada como enviada!');
      await loadProposal();
    } catch (err) {
      toast.error('Erro ao marcar como enviada');
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="h-12 w-12 text-teal-600 animate-spin mb-4" />
        <p className="text-slate-600">Carregando proposta...</p>
      </div>
    );
  }

  if (!proposal) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <FileText className="h-12 w-12 text-slate-300 mb-4" />
        <p className="text-slate-600">Proposta não encontrada</p>
      </div>
    );
  }

  const statusColors: Record<string, string> = {
    DRAFT: 'bg-slate-100 text-slate-700',
    SENT: 'bg-blue-100 text-blue-700',
    VIEWED: 'bg-yellow-100 text-yellow-700',
    CLOSED_WON: 'bg-green-100 text-green-700',
    CLOSED_LOST: 'bg-red-100 text-red-700',
  };

  const statusLabels: Record<string, string> = {
    DRAFT: 'Rascunho',
    SENT: 'Enviada',
    VIEWED: 'Visualizada',
    CLOSED_WON: 'Fechada (Ganha)',
    CLOSED_LOST: 'Fechada (Perdida)',
  };

  const isClosed = proposal.status === 'CLOSED_WON' || proposal.status === 'CLOSED_LOST';

  return (
    <div className="space-y-6 p-6 max-w-7xl mx-auto">
      {/* Cabeçalho */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push('/dashboard/precificacao/propostas')}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
              <FileText className="h-8 w-8 text-teal-600" />
              {proposal.proposalNumber}
            </h1>
            <p className="text-slate-600 mt-1">
              v{proposal.version} • {proposal.clientName}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <span className={`px-3 py-1 text-sm font-semibold rounded-full ${statusColors[proposal.status] || 'bg-slate-100'}`}>
            {statusLabels[proposal.status] || proposal.status}
          </span>

          {/* Botão de Versões (Sprint A3) */}
          <button
            onClick={() => router.push(`/dashboard/precificacao/propostas/${proposalId}/versoes`)}
            className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-lg transition-colors"
          >
            <GitBranch className="h-4 w-4" />
            Versões
          </button>

          {/* Botão Visualizar (link público) */}
          <button
            onClick={() => window.open(`/proposta/${proposal.slug}`, '_blank')}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-medium rounded-lg transition-colors"
          >
            <ExternalLink className="h-4 w-4" />
            Visualizar
          </button>

          {/* Botão Marcar como Enviada */}
          {proposal.status === 'DRAFT' && (
            <button
              onClick={handleMarkAsSent}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
            >
              <Send className="h-4 w-4" />
              Enviar
            </button>
          )}

          {/*  Botão Fechar Proposta (Sprint A4) */}
          {!isClosed && (
            <button
              onClick={() => setShowCloseModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-colors"
            >
              <CheckCircle2 className="h-4 w-4" />
              Fechar Proposta
            </button>
          )}

          {/* Botão Salvar */}
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Edit2 className="h-4 w-4" />}
            {saving ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </div>

      {/* Dados da Proposta (editáveis) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Dados do Cliente */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="text-lg font-bold text-slate-900 mb-4">Dados do Cliente</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Nome do Cliente</label>
              <input
                type="text"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">CNPJ</label>
              <input
                type="text"
                value={clientCnpj}
                onChange={(e) => setClientCnpj(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Regime Tributário</label>
              <select
                value={taxRegime}
                onChange={(e) => setTaxRegime(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
              >
                <option value="SIMPLES">Simples Nacional</option>
                <option value="PRESUMIDO">Lucro Presumido</option>
                <option value="REAL">Lucro Real</option>
                <option value="MEI">MEI</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Atividade</label>
              <input
                type="text"
                value={activity}
                onChange={(e) => setActivity(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
              />
            </div>
          </div>
        </div>

        {/* Dados Financeiros */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="text-lg font-bold text-slate-900 mb-4">Dados Financeiros</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Faturamento Mensal (R$)</label>
              <input
                type="number"
                value={monthlyRevenue}
                onChange={(e) => setMonthlyRevenue(Number(e.target.value))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Número de Funcionários</label>
              <input
                type="number"
                value={employeeCount}
                onChange={(e) => setEmployeeCount(Number(e.target.value))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Preço Base (R$)</label>
              <input
                type="number"
                value={basePrice}
                onChange={(e) => setBasePrice(Number(e.target.value))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Textos da Proposta */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h2 className="text-lg font-bold text-slate-900 mb-4">Textos da Proposta</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Sobre o Escritório</label>
            <textarea
              value={aboutOffice}
              onChange={(e) => setAboutOffice(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none resize-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Diferenciais</label>
            <textarea
              value={differentials}
              onChange={(e) => setDifferentials(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none resize-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Onboarding</label>
            <textarea
              value={onboarding}
              onChange={(e) => setOnboarding(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none resize-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Termos Comerciais</label>
            <textarea
              value={commercialTerms}
              onChange={(e) => setCommercialTerms(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none resize-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Observação Específica</label>
            <textarea
              value={specificNote}
              onChange={(e) => setSpecificNote(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none resize-none"
            />
          </div>
        </div>
      </div>

      {/* Itens da Proposta */}
      {proposal.items && proposal.items.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="text-lg font-bold text-slate-900 mb-4">Itens da Proposta</h2>
          <div className="space-y-3">
            {proposal.items.map((item: any, index: number) => (
              <div key={item.id || index} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <div>
                  <p className="font-semibold text-slate-900">
                    {item.commercialPlan?.name || item.serviceItem?.name || 'Item'}
                  </p>
                  <p className="text-sm text-slate-600">
                    {item.serviceItem?.category?.name && `Categoria: ${item.serviceItem.category.name}`}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-teal-700">
                    R$ {item.totalPrice?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                  <p className="text-xs text-slate-500">Qtd: {item.quantity}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Memória de Fechamento (se fechada) */}
      {isClosed && proposal.closingDetails && (
        <div className="bg-gradient-to-br from-green-50 to-teal-50 rounded-xl border-2 border-green-200 p-6">
          <h2 className="text-lg font-bold text-green-900 mb-4 flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Memória de Fechamento
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg p-3 border border-green-100">
              <p className="text-xs text-slate-600 mb-1">Desconto</p>
              <p className="text-xl font-bold text-green-700">{proposal.closingDetails.discountPercent}%</p>
            </div>
            <div className="bg-white rounded-lg p-3 border border-green-100">
              <p className="text-xs text-slate-600 mb-1">Preço Final</p>
              <p className="text-xl font-bold text-green-700">
                R$ {proposal.closingDetails.finalPrice?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
            <div className="bg-white rounded-lg p-3 border border-green-100">
              <p className="text-xs text-slate-600 mb-1">Ganho Mensal</p>
              <p className="text-xl font-bold text-green-700">
                R$ {proposal.closingDetails.gainMonthly?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
            <div className="bg-white rounded-lg p-3 border border-green-100">
              <p className="text-xs text-slate-600 mb-1">Ganho Anual</p>
              <p className="text-xl font-bold text-green-700">
                R$ {proposal.closingDetails.gainYearly?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
            <div className="bg-white rounded-lg p-3 border border-red-100">
              <p className="text-xs text-slate-600 mb-1">Concessão Mensal</p>
              <p className="text-xl font-bold text-red-700">
                -R$ {proposal.closingDetails.concessionMonthly?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
            <div className="bg-white rounded-lg p-3 border border-red-100">
              <p className="text-xs text-slate-600 mb-1">Concessão Anual</p>
              <p className="text-xl font-bold text-red-700">
                -R$ {proposal.closingDetails.concessionYearly?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>
          {proposal.closingDetails.notes && (
            <div className="mt-4 p-3 bg-white rounded-lg border border-slate-200">
              <p className="text-sm font-semibold text-slate-700 mb-1">Observações:</p>
              <p className="text-sm text-slate-600">{proposal.closingDetails.notes}</p>
            </div>
          )}
        </div>
      )}

      {/* 🆕 Modal de Fechamento com Ganho (Sprint A4) */}
      {showCloseModal && (
        <CloseProposalModal
          proposalId={proposal.id}
          basePrice={proposal.basePrice}
          clientName={proposal.clientName}
          proposalNumber={proposal.proposalNumber}
          onClose={() => setShowCloseModal(false)}
          onClosed={() => {
            loadProposal();
          }}
        />
      )}
    </div>
  );
}