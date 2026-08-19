// =================================================================
// INÍCIO: frontend/src/app/proposta/[slug]/page.tsx
// =================================================================
/**
 * =================================================================
 * 🌐 PÁGINA PÚBLICA DA PROPOSTA COMERCIAL (White-label — Sprint A5)
 * =================================================================
 * Acessada pelo cliente do escritório via link compartilhado.
 * Não requer autenticação.
 *
 * 🎨 SPRINT A5 (ADR-043): as cores vêm do objeto `branding` retornado
 * pelo backend (findBySlug) e são injetadas como CSS variables
 * (--brand-primary / --brand-secondary) no container raiz. Todos os
 * pontos de cor da página consomem as variables → white-label total
 * sem quebrar o cache do Tailwind. Fallback = identidade Conta Certa.
 * =================================================================
 */
'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import api from '@/lib/axios';
import {
  FileText, Loader2, AlertTriangle, MessageCircle,
  Building2, DollarSign, Briefcase, Users, Sparkles, Shield,
  ArrowRight, Phone, Mail, Calendar,
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

/** 🆕 Sprint A5: branding derivado no backend (fallback já aplicado). */
interface Branding {
  companyName: string;
  logoUrl?: string | null;
  primaryColor: string;
  secondaryColor: string;
  proposalFooterText?: string | null;
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
  branding?: Branding; // 🆕 Sprint A5
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

  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [whatsappClicked, setWhatsappClicked] = useState(false);

  // Ref p/ evitar dupla contagem de views (StrictMode do React 19)
  const viewTracked = useRef(false);

  // =================================================================
  // CARREGAR PROPOSTA + TRACK DE VIEW
  // =================================================================
  useEffect(() => {
    if (!slug) return;
    loadProposal();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  async function loadProposal() {
    try {
      setLoading(true);
      const res = await api.get(`/public/proposals/${slug}`);
      setProposal(res.data.data);

      // Track de view (apenas 1x)
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

  // Soma dos itens (plano + avulsos)
  const totalValue =
    proposal?.items.reduce((sum, item) => sum + Number(item.totalPrice), 0) || 0;

  // =================================================================
  // 🎨 SPRINT A5: branding efetivo c/ fallback Conta Certa (ADR-043)
  // =================================================================
  const brand: Branding = {
    companyName: proposal?.branding?.companyName || proposal?.company?.name || '',
    logoUrl: proposal?.branding?.logoUrl ?? proposal?.company?.logoUrl ?? null,
    primaryColor: proposal?.branding?.primaryColor || '#0d9488',
    secondaryColor: proposal?.branding?.secondaryColor || '#f97316',
    proposalFooterText: proposal?.branding?.proposalFooterText ?? null,
  };

  // =================================================================
  // AÇÃO: CLIQUE NO WHATSAPP (com tracking)
  // =================================================================
  function handleWhatsAppClick() {
    if (!proposal) return;
    api.post(`/public/proposals/${slug}/whatsapp`).catch(() => {});
    setWhatsappClicked(true);

    const message = encodeURIComponent(
      `Olá! Sou ${proposal.clientName} e gostaria de falar sobre a proposta ${proposal.proposalNumber}.`,
    );
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
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Proposta não encontrada</h1>
          <p className="text-slate-600 mb-6">
            O link pode ter expirado ou a proposta não está mais disponível.
            Entre em contato com o escritório para mais informações.
          </p>
        </div>
      </div>
    );
  }

  // =================================================================
  // RENDERIZAÇÃO: PROPOSTA ENCONTRADA (white-label via CSS variables)
  // =================================================================
  return (
    <div
      className="min-h-screen bg-slate-50"
      style={{
        //  ADR-043: injeta as cores do tenant como CSS variables
        ['--brand-primary' as any]: brand.primaryColor,
        ['--brand-secondary' as any]: brand.secondaryColor,
      }}
    >
      {/* ============================================================= */}
      {/* HEADER — identidade do escritório (cor primária do tenant)    */}
      {/* ============================================================= */}
      <header className="text-white" style={{ backgroundColor: 'var(--brand-primary)' }}>
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* Logo do escritório (ou inicial, se sem logo) */}
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-white text-xl shadow-md overflow-hidden"
                style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}
              >
                {brand.logoUrl ? (
                  <img
                    src={brand.logoUrl}
                    alt={brand.companyName}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  brand.companyName.charAt(0)
                )}
              </div>
              <div>
                <h1 className="text-xl font-bold">{brand.companyName}</h1>
                <p className="text-white/70 text-sm">Proposta Comercial</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-white/70 text-xs">Proposta</p>
              <p className="font-mono font-bold">{proposal.proposalNumber}</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        {/* ============================================================= */}
        {/* HERO — Destaque principal                                     */}
        {/* ============================================================= */}
        <section className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
          <div className="text-center mb-6">
            <p className="text-slate-500 text-sm mb-1">Proposta para</p>
            <h2 className="text-3xl font-bold text-slate-900 mb-2">{proposal.clientName}</h2>
            {proposal.clientCnpj && <p className="text-slate-500">CNPJ: {proposal.clientCnpj}</p>}
          </div>

          {/* Valor em destaque (tint da cor primária) */}
          <div
            className="rounded-xl p-6 text-center"
            style={{ backgroundColor: 'color-mix(in srgb, var(--brand-primary) 8%, white)' }}
          >
            <p className="text-slate-600 text-sm mb-1">Investimento Mensal</p>
            <p className="text-4xl font-bold" style={{ color: 'var(--brand-primary)' }}>
              {formatCurrency(totalValue)}
            </p>
          </div>

          {/* Dados do cliente */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            <InfoCard icon={Briefcase} label="Regime" value={REGIME_LABELS[proposal.taxRegime] || proposal.taxRegime} />
            <InfoCard icon={Building2} label="Atividade" value={proposal.activity || '-'} />
            <InfoCard icon={DollarSign} label="Faturamento" value={formatCurrency(proposal.monthlyRevenue)} />
            <InfoCard icon={Users} label="Funcionários" value={String(proposal.employeeCount)} />
          </div>
        </section>

        {/* ============================================================= */}
        {/* ITENS DA PROPOSTA                                             */}
        {/* ============================================================= */}
        <section className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <h3 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
            <FileText className="h-5 w-5" style={{ color: 'var(--brand-primary)' }} />
            Serviços Inclusos
          </h3>
          <div className="space-y-3">
            {proposal.items.map((item) => {
              const isPlan = !!item.commercialPlan;
              const itemData = isPlan ? item.commercialPlan : item.serviceItem;
              return (
                <div key={item.id} className="border border-slate-200 rounded-xl p-4 hover:shadow-md transition-shadow">
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
                      <h4 className="font-semibold text-slate-900">{itemData?.name || 'Item'}</h4>
                      {itemData?.description && (
                        <p className="text-sm text-slate-500 mt-1">{itemData.description}</p>
                      )}
                    </div>
                    <div className="text-right ml-4">
                      <p className="font-bold" style={{ color: 'var(--brand-primary)' }}>
                        {formatCurrency(item.totalPrice)}
                      </p>
                      {isPlan && <p className="text-xs text-slate-500">/mês</p>}
                    </div>
                  </div>
                  {!isPlan && item.serviceItem?.scope && (
                    <div className="mt-3 pt-3 border-t border-slate-100">
                      <p className="text-xs font-semibold text-slate-700 mb-1">✓ Escopo incluso:</p>
                      <p className="text-sm text-slate-600">{item.serviceItem.scope}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* SOBRE O ESCRITÓRIO */}
        {proposal.aboutOffice && (
          <section className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <h3 className="text-xl font-bold text-slate-900 mb-3 flex items-center gap-2">
              <Building2 className="h-5 w-5" style={{ color: 'var(--brand-primary)' }} />
              Sobre o Escritório
            </h3>
            <p className="text-slate-600 whitespace-pre-wrap leading-relaxed">{proposal.aboutOffice}</p>
          </section>
        )}

        {/* DIFERENCIAIS */}
        {proposal.differentials && (
          <section className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <h3 className="text-xl font-bold text-slate-900 mb-3 flex items-center gap-2">
              <Sparkles className="h-5 w-5" style={{ color: 'var(--brand-secondary)' }} />
              Nossos Diferenciais
            </h3>
            <p className="text-slate-600 whitespace-pre-wrap leading-relaxed">{proposal.differentials}</p>
          </section>
        )}

        {/* ONBOARDING */}
        {proposal.onboarding && (
          <section className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <h3 className="text-xl font-bold text-slate-900 mb-3 flex items-center gap-2">
              <ArrowRight className="h-5 w-5" style={{ color: 'var(--brand-primary)' }} />
              Como Funciona o Início
            </h3>
            <p className="text-slate-600 whitespace-pre-wrap leading-relaxed">{proposal.onboarding}</p>
          </section>
        )}

        {/* TERMOS COMERCIAIS */}
        {proposal.commercialTerms && (
          <section className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <h3 className="text-xl font-bold text-slate-900 mb-3 flex items-center gap-2">
              <Shield className="h-5 w-5" style={{ color: 'var(--brand-primary)' }} />
              Condições Comerciais
            </h3>
            <p className="text-slate-600 whitespace-pre-wrap leading-relaxed">{proposal.commercialTerms}</p>
          </section>
        )}

        {/* OBSERVAÇÕES ESPECÍFICAS (tint da cor de destaque) */}
        {proposal.specificNote && (
          <section
            className="rounded-2xl border p-6"
            style={{
              backgroundColor: 'color-mix(in srgb, var(--brand-secondary) 8%, white)',
              borderColor: 'color-mix(in srgb, var(--brand-secondary) 30%, white)',
            }}
          >
            <h3 className="text-lg font-bold text-slate-900 mb-2">📌 Observações Importantes</h3>
            <p className="text-slate-700 whitespace-pre-wrap">{proposal.specificNote}</p>
          </section>
        )}

        {/* ============================================================= */}
        {/* CTA — CHAMADA PARA AÇÃO (cor primária do tenant)              */}
        {/* ============================================================= */}
        <section
          className="rounded-2xl shadow-lg p-8 text-center text-white"
          style={{ backgroundColor: 'var(--brand-primary)' }}
        >
          <h3 className="text-2xl font-bold mb-2">Vamos conversar?</h3>
          <p className="text-white/80 mb-6">
            Tire suas dúvidas e formalize a parceria com nosso escritório.
          </p>
          <button
            onClick={handleWhatsAppClick}
            className="inline-flex items-center gap-3 px-8 py-4 bg-green-500 hover:bg-green-600 text-white font-bold text-lg rounded-xl transition-colors shadow-lg"
          >
            <MessageCircle className="h-6 w-6" />
            {whatsappClicked ? 'Abrindo WhatsApp...' : 'Falar no WhatsApp'}
          </button>
          <div className="flex items-center justify-center gap-6 mt-6 text-white/80 text-sm">
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
        {/* FOOTER — 🆕 Sprint A5: rodapé customizado do tenant           */}
        {/* ============================================================= */}
        <footer className="text-center py-6 text-slate-400 text-sm">
          <p className="flex items-center justify-center gap-1 mb-1">
            <Calendar className="h-4 w-4" />
            Proposta emitida em {formatDate(proposal.createdAt)}
          </p>
          <p>{brand.companyName} — Todos os direitos reservados</p>
          {brand.proposalFooterText && (
            <p className="mt-2 text-slate-500 whitespace-pre-wrap">{brand.proposalFooterText}</p>
          )}
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

/** Card de informação do cliente — ícone herda a cor primária (ADR-043). */
function InfoCard({ icon: Icon, label, value }: InfoCardProps) {
  return (
    <div className="bg-slate-50 rounded-lg p-3 text-center">
      <Icon className="h-5 w-5 mx-auto mb-1" style={{ color: 'var(--brand-primary)' }} />
      <p className="text-xs text-slate-500">{label}</p>
      <p className="text-sm font-semibold text-slate-900 truncate">{value}</p>
    </div>
  );
}

// =================================================================
// 🔧 HELPERS
// =================================================================
function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('pt-BR');
}
// =================================================================
// FIM: frontend/src/app/proposta/[slug]/page.tsx
// =================================================================