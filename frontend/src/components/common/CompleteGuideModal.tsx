/**
 * =================================================================
 * COMPONENTE: CompleteGuideModal — Guia Completo Contextual
 * =================================================================
 * Responsabilidade: Exibir o guia completo de uma página com:
 * - Introdução detalhada
 * - KPIs principais
 * - Workflow passo a passo
 * - Regras de negócio
 * - Exemplos práticos
 * - Passos detalhados
 * 
 * Integração: Usa o page-help-catalog.ts para buscar conteúdo
 * =================================================================
 */
'use client';

import { useEffect } from 'react';
import { X, BookOpen, TrendingUp, List, Shield, Lightbulb, ChevronRight } from 'lucide-react';
import { getRichHelpContent, PageHelpInfo } from '@/lib/page-help-catalog';

interface CompleteGuideModalProps {
  pathname: string;
  onClose: () => void;
}

export default function CompleteGuideModal({ pathname, onClose }: CompleteGuideModalProps) {
  const content = getRichHelpContent(pathname);

  // Fecha com ESC
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  if (!content?.richContent) {
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-8 text-center">
            <BookOpen className="h-16 w-16 text-slate-300 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-slate-900 mb-2">
              Guia Completo em Construção
            </h2>
            <p className="text-slate-600 mb-6">
              A documentação detalhada desta página está sendo elaborada.
            </p>
            <button
              onClick={onClose}
              className="px-6 py-3 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-lg transition-colors"
            >
              Fechar
            </button>
          </div>
        </div>
      </div>
    );
  }

  const { richContent, title } = content;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Cabeçalho */}
        <div className="sticky top-0 bg-gradient-to-r from-teal-50 to-orange-50 border-b border-slate-200 p-6 flex items-center justify-between rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white rounded-lg shadow-sm">
              <BookOpen className="h-6 w-6 text-teal-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-900">
                Guia Completo: {title}
              </h2>
              <p className="text-sm text-slate-600">Documentação detalhada e melhores práticas</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-white rounded-lg transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Conteúdo */}
        <div className="p-8 space-y-8">
          {/* Introdução */}
          {richContent.intro && (
            <section>
              <h3 className="text-lg font-bold text-slate-900 mb-3 flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-yellow-500" />
                Visão Geral
              </h3>
              <div className="bg-gradient-to-br from-yellow-50 to-orange-50 border border-yellow-200 rounded-xl p-5">
                <p className="text-slate-700 leading-relaxed">{richContent.intro}</p>
              </div>
            </section>
          )}

          {/* KPIs */}
          {richContent.kpis && richContent.kpis.length > 0 && (
            <section>
              <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-teal-600" />
                Principais KPIs e Métricas
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {richContent.kpis.map((kpi, index) => (
                  <div
                    key={index}
                    className="bg-white border border-slate-200 rounded-xl p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-semibold text-slate-900">{kpi.name}</h4>
                      <span className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded">
                        {kpi.location}
                      </span>
                    </div>
                    <p className="text-sm text-slate-600">{kpi.meaning}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Workflow */}
          {richContent.workflow && richContent.workflow.length > 0 && (
            <section>
              <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                <List className="h-5 w-5 text-blue-600" />
                Fluxo de Trabalho Recomendado
              </h3>
              <div className="bg-slate-50 rounded-xl p-6 space-y-3">
                {richContent.workflow.map((step, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-7 h-7 rounded-full bg-teal-600 text-white flex items-center justify-center text-sm font-bold">
                      {index + 1}
                    </div>
                    <p className="text-slate-700 pt-0.5">{step}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Regras */}
          {richContent.rules && richContent.rules.length > 0 && (
            <section>
              <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                <Shield className="h-5 w-5 text-red-600" />
                Regras e Restrições Importantes
              </h3>
              <div className="bg-red-50 border border-red-100 rounded-xl p-6">
                <ul className="space-y-3">
                  {richContent.rules.map((rule, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <ChevronRight className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                      <span className="text-slate-700">{rule}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </section>
          )}

          {/* Passos Detalhados */}
          {richContent.detailedSteps && richContent.detailedSteps.length > 0 && (
            <section>
              <h3 className="text-lg font-bold text-slate-900 mb-4">
                Passo a Passo Detalhado
              </h3>
              <div className="space-y-4">
                {richContent.detailedSteps.map((step, index) => (
                  <div
                    key={index}
                    className="bg-white border border-slate-200 rounded-xl p-5 hover:shadow-md transition-shadow"
                  >
                    <h4 className="font-semibold text-slate-900 mb-2 flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center text-sm font-bold">
                        {index + 1}
                      </div>
                      {step.title}
                    </h4>
                    <p className="text-slate-600 text-sm leading-relaxed pl-8">
                      {step.description}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Exemplos */}
          {richContent.examples && richContent.examples.length > 0 && (
            <section>
              <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-purple-600" />
                Exemplos Práticos
              </h3>
              <div className="space-y-4">
                {richContent.examples.map((example, index) => (
                  <div
                    key={index}
                    className="bg-purple-50 border border-purple-100 rounded-xl p-5"
                  >
                    <h4 className="font-semibold text-purple-900 mb-2">
                      {example.title}
                    </h4>
                    <pre className="bg-white rounded-lg p-4 text-sm text-slate-700 overflow-x-auto whitespace-pre-wrap">
                      {example.content}
                    </pre>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* Rodapé */}
        <div className="sticky bottom-0 bg-slate-50 border-t border-slate-200 p-6 rounded-b-2xl flex items-center justify-between">
          <p className="text-sm text-slate-600">
            Precisa de mais ajuda? Entre em contato com o suporte.
          </p>
          <button
            onClick={onClose}
            className="px-6 py-3 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-lg transition-colors"
          >
            Entendi, obrigado!
          </button>
        </div>
      </div>
    </div>
  );
}