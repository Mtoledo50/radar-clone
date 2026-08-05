// =================================================================
// INÍCIO: frontend/src/app/proposta/[slug]/page.tsx
// =================================================================
// 🌐 PÁGINA PÚBLICA DA PROPOSTA COMERCIAL
// Acessada pelo cliente do escritório via link compartilhado.
// Não requer autenticação. Design premium Conta Certa.
// =================================================================
'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import api from '@/lib/axios';
import { toast } from 'sonner';
import {
  FileText, Loader2, AlertTriangle, CheckCircle2, MessageCircle,
  Building2, DollarSign, Briefcase, Users, Sparkles, Shield,
  ArrowRight, Phone, Mail, Calendar
} from 'lucide-react';

// =================================================================
// 📋 TIPOS E INTERFACES
// =================================================================

interface ProposalItem {
  id: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  commercialPlan?: {
    name: string;
    badge?: string;
    color?: string;
    description?: string;
  } | null;
  serviceItem?: {
    name: string;
    description?: string;
    scope?: string;
    category?: { name: string };
  } | null;
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
  createdAt: string;
  items: ProposalItem[];
  company: {
    name: string;
    logoUrl?: string;
    email?: string;
    phone?: string;
  };
}

// =================================================================
// 🎨 CONFIGURAÇÕES VISUAIS
// =================================================================

const REGIME_LABELS: Record<string, string> = {
  MEI: 'MEI',
  SIMPLES_NACIONAL: 'Simples Nacional',
  LUCRO_PRESUMIDO: 'Lucro Presumido',
  LUCRO_REAL: 'Lucro Real',
};

// =================================================================
// 🎯 COMPONENTE PRINCIPAL
// =================================================================
export default function PublicProposalPage() {
  const params = useParams();
  const slug = params.slug as string;

  // Estados
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [whatsappClicked, setWhatsappClicked] = useState(false);

  // Ref para evitar dupla contagem de views (StrictMode)
  const viewTracked = useRef(false);

  // =================================================================
  // CARREGAR PROPOSTA + TRACK DE VIEW
  // =================================================================
  useEffect(() => {
    if (!slug) return;
    loadProposal();
  }, [slug]);

  async function loadProposal() {
    try {
      setLoading(true);
      const res = await api.get(`/public/proposals/${slug}`);
      setProposal(res.data.data);

      // Track de view (apenas uma vez)
      if (!viewTracked.current) {
        viewTracked.current = true;
        api.post(`/public/proposals/${slug}/view`).catch(() => {});
      }
    } catch (err) {
      setError(true);
    } finally {
      setLoading(false);
    }
  }

  // =================================================================
  // CALCULAR TOTAL DA PROPOSTA
  // =================================================================
  const totalValue = proposal?.items.reduce(
    (sum, item) => sum + Number(item.totalPrice), 0
  ) || 0;

  // =================================================================
  // AÇÃO: CLIQUE NO WHATSAPP (com tracking)
  // =================================================================
  function handleWhatsAppClick() {
    if (!proposal) return;

    // Track do clique
    api.post(`/public/proposals/${slug}/whatsapp`).catch(() => {});
    setWhatsappClicked(true);

    // Monta mensagem pré-definida
    const message = encodeURIComponent(
      `Olá! Sou ${proposal.clientName} e gostaria de falar sobre a proposta ${proposal.proposalNumber}.`
    );

    // Número do WhatsApp da empresa (remove caracteres não numéricos)
    const phone = proposal.company.phone?.replace(/\D/g, '') || '';
    const whatsappUrl = phone
      ? `https://wa.me/55${phone}?text=${message}`
      : `https://wa.me/?text=${message}`;

    window.open(whatsappUrl, '_blank');
  }

  // =================================================================
  // RENDERIZAÇÃO: LOADING
  // =================================================================
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 text-teal-600 animate-spin mx-auto mb-4" />
          <p className="text-slate-600">Carregando proposta...</p>
        </div>
      </div>
    );
  }

  // =================================================================
  // RENDERIZAÇÃO: ERRO (Proposta não encontrada)
  // =================================================================
  if (error || !proposal) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="h-8 w-8 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">
            Proposta não encontrada
          </h1>
          <p className="text-slate-600 mb-6">
            O link pode ter expirado ou a proposta não está mais disponível.
            Entre em contato com o escritório para mais informações.
          </p>
        </div>
      </div>
    );
  }

  // =================================================================
  // RENDERIZAÇÃO: PROPOSTA ENCONTRADA
  // =================================================================
  return (
    <div className="min-h-screen bg-slate-50">
      
      {/* ============================================================= */}
      {/* HEADER - Identidade do Escritório */}
      {/* ============================================================= */}
      <header className="bg-gradient-to-r from-teal-900 to-teal-700 text-white">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* Logo do escritório */}
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-teal-400 to-orange-500 flex items-center justify-center font-bold text-white text-xl shadow-md">
                {proposal.company.logoUrl ? (
                  <img 
                    src={proposal.company.logoUrl} 
                    alt={proposal.company.name}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  proposal.company.name.charAt(0)
                )}
              </div>
              <div>
                <h1 className="text-xl font-bold">{proposal.company.name}</h1>
                <p className="text-teal-200 text-sm">Proposta Comercial</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-teal-200 text-xs">Proposta</p>
              <p className="font-mono font-bold">{proposal.proposalNumber}</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        
        {/* ============================================================= */}
        {/* HERO - Destaque Principal */}
        {/* ============================================================= */}
        <section className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
          <div className="text-center mb-6">
            <p className="text-slate-500 text-sm mb-1">Proposta para</p>
            <h2 className="text-3xl font-bold text-slate-900 mb-2">
              {proposal.clientName}
            </h2>
            {proposal.clientCnpj && (
              <p className="text-slate-500">CNPJ: {proposal.clientCnpj}</p>
            )}
          </div>

          {/* Valor em destaque */}
          <div className="bg-gradient-to-r from-teal-50 to-orange-50 rounded-xl p-6 text-center">
            <p className="text-slate-600 text-sm mb-1">Investimento Mensal</p>
            <p className="text-4xl font-bold text-teal-600">
              {formatCurrency(totalValue)}
            </p>
          </div>

          {/* Dados do cliente */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            <InfoCard
              icon={Briefcase}
              label="Regime"
              value={REGIME_LABELS[proposal.taxRegime] || proposal.taxRegime}
            />
            <InfoCard
              icon={Building2}
              label="Atividade"
              value={proposal.activity || '-'}
            />
            <InfoCard
              icon={DollarSign}
              label="Faturamento"
              value={formatCurrency(proposal.monthlyRevenue)}
            />
            <InfoCard
              icon={Users}
              label="Funcionários"
              value={String(proposal.employeeCount)}
            />
          </div>
        </section>

        {/* ============================================================= */}
        {/* ITENS DA PROPOSTA */}
        {/* ============================================================= */}
        <section className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <h3 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
            <FileText className="h-5 w-5 text-teal-600" />
            Serviços Inclusos
          </h3>

          <div className="space-y-3">
            {proposal.items.map((item) => {
              const isPlan = !!item.commercialPlan;
              const itemData = isPlan ? item.commercialPlan : item.serviceItem;

              return (
                <div
                  key={item.id}
                  className="border border-slate-200 rounded-xl p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        {isPlan && item.commercialPlan?.badge && (
                          <span
                            className="px-2 py-0.5 rounded text-xs font-bold uppercase text-white"
                            style={{ backgroundColor: item.commercialPlan.color || '#64748b' }}
                          >
                            {item.commercialPlan.badge}
                          </span>
                        )}
                        {!isPlan && item.serviceItem?.category && (
                          <span className="px-2 py-0.5 rounded text-xs font-semibold bg-slate-100 text-slate-600">
                            {item.serviceItem.category.name}
                          </span>
                        )}
                      </div>
                      <h4 className="font-semibold text-slate-900">
                        {itemData?.name || 'Item'}
                      </h4>
                      {itemData?.description && (
                        <p className="text-sm text-slate-500 mt-1">
                          {itemData.description}
                        </p>
                      )}
                    </div>
                    <div className="text-right ml-4">
                      <p className="font-bold text-teal-600">
                        {formatCurrency(item.totalPrice)}
                      </p>
                      {isPlan && <p className="text-xs text-slate-500">/mês</p>}
                    </div>
                  </div>

                  {/* Escopo do serviço (se houver) */}
                  {!isPlan && item.serviceItem?.scope && (
                    <div className="mt-3 pt-3 border-t border-slate-100">
                      <p className="text-xs font-semibold text-slate-700 mb-1">
                        ✓ Escopo incluso:
                      </p>
                      <p className="text-sm text-slate-600">
                        {item.serviceItem.scope}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* ============================================================= */}
        {/* SOBRE O ESCRITÓRIO */}
        {/* ============================================================= */}
        {proposal.aboutOffice && (
          <section className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <h3 className="text-xl font-bold text-slate-900 mb-3 flex items-center gap-2">
              <Building2 className="h-5 w-5 text-teal-600" />
              Sobre o Escritório
            </h3>
            <p className="text-slate-600 whitespace-pre-wrap leading-relaxed">
              {proposal.aboutOffice}
            </p>
          </section>
        )}

        {/* ============================================================= */}
        {/* DIFERENCIAIS */}
        {/* ============================================================= */}
        {proposal.differentials && (
          <section className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <h3 className="text-xl font-bold text-slate-900 mb-3 flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-orange-500" />
              Nossos Diferenciais
            </h3>
            <p className="text-slate-600 whitespace-pre-wrap leading-relaxed">
              {proposal.differentials}
            </p>
          </section>
        )}

        {/* ============================================================= */}
        {/* ONBOARDING */}
        {/* ============================================================= */}
        {proposal.onboarding && (
          <section className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <h3 className="text-xl font-bold text-slate-900 mb-3 flex items-center gap-2">
              <ArrowRight className="h-5 w-5 text-teal-600" />
              Como Funciona o Início
            </h3>
            <p className="text-slate-600 whitespace-pre-wrap leading-relaxed">
              {proposal.onboarding}
            </p>
          </section>
        )}

        {/* ============================================================= */}
        {/* TERMOS COMERCIAIS */}
        {/* ============================================================= */}
        {proposal.commercialTerms && (
          <section className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <h3 className="text-xl font-bold text-slate-900 mb-3 flex items-center gap-2">
              <Shield className="h-5 w-5 text-teal-600" />
              Condições Comerciais
            </h3>
            <p className="text-slate-600 whitespace-pre-wrap leading-relaxed">
              {proposal.commercialTerms}
            </p>
          </section>
        )}

        {/* ============================================================= */}
        {/* OBSERVAÇÕES ESPECÍFICAS */}
        {/* ============================================================= */}
        {proposal.specificNote && (
          <section className="bg-orange-50 border border-orange-200 rounded-2xl p-6">
            <h3 className="text-lg font-bold text-orange-900 mb-2">
              📌 Observações Importantes
            </h3>
            <p className="text-orange-800 whitespace-pre-wrap">
              {proposal.specificNote}
            </p>
          </section>
        )}

        {/* ============================================================= */}
        {/* CTA - CHAMADA PARA AÇÃO */}
        {/* ============================================================= */}
        <section className="bg-gradient-to-r from-teal-600 to-teal-700 rounded-2xl shadow-lg p-8 text-center text-white">
          <h3 className="text-2xl font-bold mb-2">
            Vamos conversar?
          </h3>
          <p className="text-teal-100 mb-6">
            Tire suas dúvidas e formalize a parceria com nosso escritório.
          </p>
          <button
            onClick={handleWhatsAppClick}
            className="inline-flex items-center gap-3 px-8 py-4 bg-green-500 hover:bg-green-600 text-white font-bold text-lg rounded-xl transition-colors shadow-lg"
          >
            <MessageCircle className="h-6 w-6" />
            {whatsappClicked ? 'Abrindo WhatsApp...' : 'Falar no WhatsApp'}
          </button>

          {/* Contatos alternativos */}
          <div className="flex items-center justify-center gap-6 mt-6 text-teal-100 text-sm">
            {proposal.company.email && (
              <span className="flex items-center gap-1">
                <Mail className="h-4 w-4" />
                {proposal.company.email}
              </span>
            )}
            {proposal.company.phone && (
              <span className="flex items-center gap-1">
                <Phone className="h-4 w-4" />
                {proposal.company.phone}
              </span>
            )}
          </div>
        </section>

        {/* ============================================================= */}
        {/* FOOTER */}
        {/* ============================================================= */}
        <footer className="text-center py-6 text-slate-400 text-sm">
          <p className="flex items-center justify-center gap-1 mb-1">
            <Calendar className="h-4 w-4" />
            Proposta emitida em {formatDate(proposal.createdAt)}
          </p>
          <p>{proposal.company.name} — Todos os direitos reservados</p>
        </footer>
      </main>
    </div>
  );
}

// =================================================================
// 🎨 COMPONENTES AUXILIARES
// =================================================================

interface InfoCardProps {
  icon: any;
  label: string;
  value: string;
}

function InfoCard({ icon: Icon, label, value }: InfoCardProps) {
  return (
    <div className="bg-slate-50 rounded-lg p-3 text-center">
      <Icon className="h-5 w-5 text-teal-600 mx-auto mb-1" />
      <p className="text-xs text-slate-500">{label}</p>
      <p className="text-sm font-semibold text-slate-900 truncate">{value}</p>
    </div>
  );
}

// =================================================================
// 🔧 HELPERS
// =================================================================

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value || 0);
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('pt-BR');
}