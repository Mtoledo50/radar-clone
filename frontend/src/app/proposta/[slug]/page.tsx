/**
 * Página Pública da Proposta Comercial
 * Acessível sem login via /proposta/[slug]
 * Usa window.print() para gerar PDF (mais estável que react-to-pdf no Next.js 16)
 */
'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import api from '@/lib/axios';
import { Loader2, Check, Phone, Building2, Download, Printer } from 'lucide-react';

export default function PublicProposalPage() {
  const params = useParams();
  const slug = params?.slug as string;
  
  const [loading, setLoading] = useState(true);
  const [proposal, setProposal] = useState<any>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (slug) loadProposal();
  }, [slug]);

  async function loadProposal() {
    try {
      const res = await api.get(`/proposals/public/${slug}`);
      setProposal(res.data.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Proposta não encontrada');
    } finally {
      setLoading(false);
    }
  }

  async function handleWhatsappClick(plan: any) {
    try {
      await api.post(`/proposals/public/${proposal.id}/whatsapp-click`);
    } catch {}

    const message = `Olá! Tenho interesse no plano "${plan.planName}" (proposta nº ${proposal.proposalNumber}). Empresa: ${proposal.clientName}. Valor: R$ ${plan.finalPrice.toFixed(2)}/mês. Gostaria de prosseguir com a contratação.`;
    const whatsappNumber = '5500000000000'; // Substitua pelo número real do escritório
    
    window.open(`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`, '_blank');
  }

  function handleDownloadPDF() {
    // Aciona o diálogo de impressão do navegador
    // O usuário pode escolher "Salvar como PDF" como destino
    window.print();
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <Loader2 className="h-12 w-12 text-teal-400 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl p-8 max-w-md text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-2">Proposta não encontrada</h1>
          <p className="text-slate-600">{error}</p>
        </div>
      </div>
    );
  }

  if (!proposal) return null;

  const plans = proposal.includedPlans || [];

  return (
    <>
      {/* Estilos específicos para impressão */}
      <style jsx global>{`
        @media print {
          /* Esconde elementos que não devem sair no PDF */
          .no-print {
            display: none !important;
          }
          
          /* Otimiza o layout para A4 */
          body {
            background: white !important;
            color: black !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          
          /* Quebra de página inteligente */
          section {
            page-break-inside: avoid;
          }
          
          /* Remove sombras e efeitos que pesam na impressão */
          * {
            box-shadow: none !important;
            text-shadow: none !important;
          }
        }
      `}</style>

      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-teal-900 text-white">
        <header className="border-b border-slate-700 bg-slate-900/50 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto px-4 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Building2 className="h-8 w-8 text-teal-400" />
                <div>
                  <h1 className="text-xl font-bold">{proposal.company?.name || 'Escritório Contábil'}</h1>
                  <p className="text-sm text-slate-400">Proposta Comercial nº {proposal.proposalNumber}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-slate-400">Preparada para</p>
                <p className="font-semibold">{proposal.clientName}</p>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 py-12">
          {proposal.aboutOffice && (
            <section className="mb-12">
              <h2 className="text-2xl font-bold mb-4 text-teal-400">Sobre o Escritório</h2>
              <p className="text-slate-300 leading-relaxed whitespace-pre-line">{proposal.aboutOffice}</p>
            </section>
          )}

          <section className="mb-12">
            <h2 className="text-3xl font-bold mb-2 text-center">Escolha o Plano Ideal</h2>
            <p className="text-slate-400 text-center mb-8">Valores calculados com base no perfil da sua empresa</p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {plans.map((plan: any, idx: number) => (
                <div
                  key={plan.planId}
                  className={`relative rounded-2xl p-6 border-2 ${
                    idx === 1 
                      ? 'border-teal-400 bg-gradient-to-br from-teal-900/50 to-slate-800 shadow-2xl shadow-teal-500/20' 
                      : 'border-slate-700 bg-slate-800/50'
                  }`}
                >
                  {plan.badge && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-orange-500 text-white text-xs font-bold rounded-full">
                      {plan.badge}
                    </span>
                  )}

                  <h3 className="text-2xl font-bold mb-2">{plan.planName}</h3>
                  <div className="mb-6">
                    <span className="text-sm text-slate-400">R$</span>
                    <span className="text-4xl font-bold text-teal-400 ml-1">{plan.finalPrice.toFixed(2)}</span>
                    <span className="text-sm text-slate-400">/mês</span>
                  </div>

                  {plan.items && plan.items.length > 0 && (
                    <ul className="space-y-2 mb-6">
                      {plan.items.map((item: any, i: number) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                          <Check className="h-4 w-4 text-teal-400 flex-shrink-0 mt-0.5" />
                          <span>{item.name}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </section>

          {proposal.onboarding && (
            <section className="mb-12">
              <h2 className="text-2xl font-bold mb-4 text-teal-400">Onboarding - Primeiros Passos</h2>
              <ol className="space-y-2">
                {proposal.onboarding.split('\n').filter((l: string) => l.trim()).map((line: string, idx: number) => (
                  <li key={idx} className="flex items-start gap-3 text-slate-300">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-teal-500 text-white text-xs font-bold flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <span>{line.replace(/^\d+[\.\)]\s*/, '')}</span>
                  </li>
                ))}
              </ol>
            </section>
          )}

          {proposal.commercialTerms && (
            <section className="mb-12">
              <h2 className="text-2xl font-bold mb-4 text-teal-400">Condições Comerciais</h2>
              <p className="text-slate-300 leading-relaxed whitespace-pre-line">{proposal.commercialTerms}</p>
            </section>
          )}

          {proposal.specificNote && (
            <section className="mb-12 bg-orange-500/10 border border-orange-500/30 rounded-xl p-6">
              <h2 className="text-xl font-bold mb-2 text-orange-400">Observação Especial</h2>
              <p className="text-slate-300 whitespace-pre-line">{proposal.specificNote}</p>
            </section>
          )}

          <section className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
            <h3 className="text-lg font-bold mb-4 text-teal-400">Base de Cálculo desta Proposta</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div><p className="text-slate-400">Regime Tributário</p><p className="font-semibold">{proposal.taxRegime}</p></div>
              <div><p className="text-slate-400">Atividade</p><p className="font-semibold">{proposal.activity}</p></div>
              <div><p className="text-slate-400">Faturamento Mensal</p><p className="font-semibold">R$ {proposal.monthlyRevenue?.toLocaleString()}</p></div>
              <div><p className="text-slate-400">Funcionários</p><p className="font-semibold">{proposal.employeeCount}</p></div>
            </div>
          </section>
        </main>

        <footer className="border-t border-slate-700 bg-slate-900/50 py-6">
          <div className="max-w-7xl mx-auto px-4 text-center text-sm text-slate-400">
            <p>Proposta gerada por {proposal.company?.name} • {new Date(proposal.createdAt).toLocaleDateString('pt-BR')}</p>
          </div>
        </footer>

        {/* 🔥 Botão Flutuante de Download (escondido na impressão) */}
        <div className="no-print fixed bottom-6 right-6 z-50">
          <button
            onClick={handleDownloadPDF}
            className="flex items-center gap-2 px-6 py-3 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-full shadow-2xl transition-all hover:scale-105"
          >
            <Printer className="h-5 w-5" />
            Imprimir / Salvar PDF
          </button>
        </div>
      </div>
    </>
  );
}