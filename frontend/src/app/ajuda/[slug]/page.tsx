/**
 * =================================================================
 * Página de Ajuda Detalhada (Camada 2)
 * =================================================================
 * Rota dinâmica: /ajuda/[slug]
 * Exibe conteúdo rico completo da página correspondente.
 * =================================================================
 */
'use client';

import { usePathname, useRouter } from 'next/navigation';
import { ArrowLeft, CheckCircle2, Target, Zap, BookOpen, Lightbulb } from 'lucide-react';
import { getRichHelpContent, PageHelpInfo } from '@/lib/page-help-catalog';

// Mapeamento de slug → pathname
const slugToPathname: Record<string, string> = {
  'dashboard': '/dashboard',
  'minha-empresa': '/dashboard/minha-empresa',
  'pessoas': '/dashboard/pessoas',
  'turnover': '/dashboard/turnover',
  'benchmark': '/dashboard/pessoas/benchmark',
  'clientes': '/dashboard/clientes',
  'projetos': '/dashboard/projetos',
  'tarefas': '/dashboard/tarefas',
  'planejamento': '/dashboard/planejamento',
  'precificacao': '/dashboard/precificacao',
  'meus-planos': '/dashboard/precificacao/meus-planos',
  'desempenho': '/dashboard/precificacao/desempenho',
  'importar-nfe': '/dashboard/fiscal',
  'notas': '/dashboard/fiscal/notas',
  'estoque': '/dashboard/fiscal/estoque',
  'apuracao': '/dashboard/fiscal/apuracao',
  'sped': '/dashboard/fiscal/sped',
  'comparativo': '/dashboard/fiscal/comparativo',
  'relatorio-inventario': '/dashboard/fiscal/relatorio-inventario',
  'fechamento': '/dashboard/fechamento',
  'lancamentos': '/dashboard/lancamentos',
  'revisao': '/dashboard/lancamentos/revisao',
  'contabil': '/dashboard/contabil',
  'plano-contas': '/dashboard/contabil/plano-contas',
  'aurora': '/dashboard/funcionario-digital',
  'aprovacoes': '/dashboard/funcionario-digital/aprovacoes',
  'legalizacao': '/dashboard/funcionario-digital/legalizacao',
  'cobranca': '/dashboard/funcionario-digital/cobranca',
  'bi': '/dashboard/bi',
  'dre-cliente': '/dashboard/bi/dre-cliente',
  'ponto-fora-da-curva': '/dashboard/ponto-fora-da-curva',
  'indicadores': '/dashboard/indicadores',
  'indicadores-custom': '/dashboard/indicadores-custom',
  'score': '/dashboard/score',
  'mentoria': '/dashboard/mentoria',
  'ranking': '/dashboard/ranking',
  'planejamento-tributario': '/dashboard/planejamento-tributario',
  'reforma-tributaria': '/dashboard/reforma-tributaria',
  'admin': '/dashboard/admin',
  'catalogo': '/dashboard/admin/catalogo',
};

export default function AjudaDetalhadaPage() {
  const pathname = usePathname();
  const router = useRouter();
  const slug = pathname.split('/ajuda/')[1];
  const realPathname = slugToPathname[slug] || '';
  const info = getRichHelpContent(realPathname);

  if (!info || !info.richContent) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-8">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-2xl text-center">
          <h1 className="text-2xl font-bold text-slate-900 mb-4">Guia não encontrado</h1>
          <p className="text-slate-600 mb-6">
            A documentação detalhada para esta página ainda está sendo escrita.
          </p>
          <button
            onClick={() => router.back()}
            className="px-6 py-3 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-lg"
          >
            Voltar
          </button>
        </div>
      </div>
    );
  }

  const rich = info.richContent;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 text-slate-600 hover:text-teal-700 font-medium mb-3"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </button>
          <h1 className="text-3xl font-bold text-slate-900">{info.title}</h1>
          <p className="text-slate-600 mt-1">Guia completo de uso</p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 py-8 space-y-8">
        {/* Intro */}
        {rich.intro && (
          <div className="bg-gradient-to-r from-teal-50 to-orange-50 p-6 rounded-xl border border-teal-200">
            <p className="text-slate-700 text-lg leading-relaxed">{rich.intro}</p>
          </div>
        )}

        {/* KPIs */}
        {rich.kpis && rich.kpis.length > 0 && (
          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Target className="h-5 w-5 text-teal-600" />
              KPIs Principais
            </h2>
            <div className="grid gap-3">
              {rich.kpis.map((kpi, i) => (
                <div key={i} className="bg-white p-4 rounded-lg border border-slate-200">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-slate-900">{kpi.name}</h3>
                      <p className="text-sm text-slate-600 mt-1">{kpi.meaning}</p>
                    </div>
                    <span className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded">
                      {kpi.location}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Workflow */}
        {rich.workflow && rich.workflow.length > 0 && (
          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Zap className="h-5 w-5 text-orange-600" />
              Fluxo de Trabalho Recomendado
            </h2>
            <div className="bg-white p-6 rounded-lg border border-slate-200">
              <ol className="space-y-3">
                {rich.workflow.map((step, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-teal-100 text-teal-800 text-xs font-bold flex items-center justify-center">
                      {i + 1}
                    </span>
                    <span className="text-slate-700">{step}</span>
                  </li>
                ))}
              </ol>
            </div>
          </section>
        )}

        {/* Detailed Steps */}
        {rich.detailedSteps && rich.detailedSteps.length > 0 && (
          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-blue-600" />
              Passo a Passo Detalhado
            </h2>
            <div className="space-y-4">
              {rich.detailedSteps.map((step, i) => (
                <div key={i} className="bg-white p-5 rounded-lg border border-slate-200">
                  <h3 className="font-semibold text-slate-900 mb-2 flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-teal-600 text-white text-xs flex items-center justify-center">
                      {i + 1}
                    </span>
                    {step.title}
                  </h3>
                  <p className="text-slate-700 text-sm leading-relaxed pl-7">
                    {step.description}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Rules */}
        {rich.rules && rich.rules.length > 0 && (
          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              Regras de Ouro
            </h2>
            <div className="bg-amber-50 border border-amber-200 p-6 rounded-lg">
              <ul className="space-y-3">
                {rich.rules.map((rule, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-amber-600 font-bold">•</span>
                    <span className="text-slate-700">{rule}</span>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        )}

        {/* Examples */}
        {rich.examples && rich.examples.length > 0 && (
          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-yellow-600" />
              Exemplos Práticos
            </h2>
            <div className="space-y-4">
              {rich.examples.map((example, i) => (
                <div key={i} className="bg-slate-50 p-5 rounded-lg border border-slate-200">
                  <h3 className="font-semibold text-slate-900 mb-2">{example.title}</h3>
                  <pre className="text-sm text-slate-700 whitespace-pre-wrap font-mono bg-white p-3 rounded border border-slate-200">
                    {example.content}
                  </pre>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Related Pages */}
        {info.relatedPages && info.relatedPages.length > 0 && (
          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
              <ArrowLeft className="h-5 w-5 text-orange-600" />
              Páginas Relacionadas
            </h2>
            <div className="flex flex-wrap gap-2">
              {info.relatedPages.map((page, i) => (
                <span key={i} className="px-3 py-1.5 bg-slate-100 text-slate-700 text-sm rounded-lg">
                  {page}
                </span>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}