// =================================================================
// INÍCIO: frontend/src/components/turnover/ExitInterviewModal.tsx
// =================================================================
/**
 * =================================================================
 * 📝 ExitInterviewModal — Sprint B4 (Entrevista de Desligamento)
 * =================================================================
 * Modal de 2 passos para conduzir a entrevista de desligamento:
 *
 * PASSO 1: Formulário com 5 perguntas-chave (texto livre)
 * PASSO 2: Resultado da análise (causa-raiz + plano de ação + confiança)
 *
 * 🧠 ADRs:
 * - ADR-050: motor de análise intercambiável (rules-v1 hoje, LLM amanhã)
 * - ADR-031: IA só sugere, humano decide (exibe como "sugestão")
 * =================================================================
 */
'use client';

import { useState } from 'react';
import api from '@/lib/axios';
import { toast } from 'sonner';
import {
  X, Loader2, MessageSquare, Brain, Lightbulb,
  AlertTriangle, CheckCircle, TrendingUp,
} from 'lucide-react';

// =================================================================
// 📋 TIPOS
// =================================================================
interface ExitInterviewModalProps {
  resignationId: string;
  employeeName: string;
  onClose: () => void;
  onAnalyzed: () => void; // callback p/ recarregar dados
}

interface ExitAnalysis {
  causes: Array<{
    category: string;
    label: string;
    score: number;
    matched: string[];
  }>;
  primaryCause: string | null;
  primaryLabel: string | null;
  confidence: number;
  actionPlan: string[];
  engine: string;
  analyzedAt: string;
}

// =================================================================
// 📝 AS 5 PERGUNTAS-CHAVE DA ENTREVISTA
// =================================================================
const QUESTIONS = [
  {
    id: 1,
    text: 'Qual foi o principal motivo da sua saída?',
    placeholder: 'Ex: Saí por causa do salário, que estava abaixo do mercado...',
  },
  {
    id: 2,
    text: 'Como era sua relação com seu líder direto?',
    placeholder: 'Ex: A relação era boa, mas faltava feedback frequente...',
  },
  {
    id: 3,
    text: 'Você via oportunidades de crescimento aqui?',
    placeholder: 'Ex: Não via crescimento, estava estagnado sem perspectiva de promoção...',
  },
  {
    id: 4,
    text: 'O que mais e o que menos gostava no ambiente?',
    placeholder: 'Ex: Gostava da equipe, mas o volume de trabalho era excessivo...',
  },
  {
    id: 5,
    text: 'O que poderíamos ter feito para você ficar?',
    placeholder: 'Ex: Nada, minha decisão foi pessoal. Ou: Um plano de carreira claro...',
  },
];

// =================================================================
// 🎨 CLASSE MÁGICA PARA INPUTS
// =================================================================
const inputClass =
  'w-full px-3 py-2.5 border border-slate-300 rounded-lg ' +
  'text-slate-900 placeholder:text-slate-400 ' +
  'focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all bg-white';

// =================================================================
// 🎯 COMPONENTE PRINCIPAL
// =================================================================
export function ExitInterviewModal({
  resignationId,
  employeeName,
  onClose,
  onAnalyzed,
}: ExitInterviewModalProps) {
  const [step, setStep] = useState<1 | 2>(1);
  const [loading, setLoading] = useState(false);
  const [answers, setAnswers] = useState<string[]>(Array(5).fill(''));
  const [analysis, setAnalysis] = useState<ExitAnalysis | null>(null);

  // =================================================================
  // PASSO 1: Salvar as 5 respostas
  // =================================================================
  async function handleSaveInterview() {
    // Validação: pelo menos 3 respostas não-vazias
    const filledCount = answers.filter((a) => a.trim().length > 0).length;
    if (filledCount < 3) {
      toast.error('Responda pelo menos 3 perguntas para continuar.');
      return;
    }

    try {
      setLoading(true);
      await api.post(`/turnover/resignations/${resignationId}/interview`, {
        answers,
      });
      toast.success('Entrevista salva! Agora vamos analisar...');
      // Avança p/ passo 2 automaticamente
      handleAnalyze();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Erro ao salvar entrevista');
      setLoading(false);
    }
  }

  // =================================================================
  // PASSO 2: Rodar a análise (motor rules-v1 — ADR-050)
  // =================================================================
  async function handleAnalyze() {
    try {
      setLoading(true);
      const res = await api.post(`/turnover/resignations/${resignationId}/analyze`);
      setAnalysis(res.data.data.exitAnalysis);
      setStep(2);
      onAnalyzed(); // recarrega dados da aba pai
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Erro ao analisar entrevista');
      setLoading(false);
    }
  }

  // =================================================================
  // HELPERS DE RENDERIZAÇÃO
  // =================================================================
  function updateAnswer(index: number, value: string) {
    const newAnswers = [...answers];
    newAnswers[index] = value;
    setAnswers(newAnswers);
  }

  // =================================================================
  // RENDERIZAÇÃO: PASSO 1 — FORMULÁRIO
  // =================================================================
  if (step === 1) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
          {/* HEADER */}
          <div className="flex items-center justify-between p-6 border-b border-slate-200 sticky top-0 bg-white z-10">
            <div className="flex items-center gap-3">
              <MessageSquare className="h-6 w-6 text-teal-600" />
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  Entrevista de Desligamento
                </h2>
                <p className="text-sm text-slate-500">{employeeName}</p>
              </div>
            </div>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* FORMULÁRIO */}
          <div className="p-6 space-y-5">
            <p className="text-sm text-slate-600 bg-teal-50 p-3 rounded-lg border border-teal-200">
              💡 <strong>Dica:</strong> conduza a entrevista em local privado. As respostas são
              anônimas e alimentam análises agregadas para melhorar a retenção.
            </p>

            {QUESTIONS.map((q, idx) => (
              <div key={q.id}>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  {q.id}. {q.text}
                </label>
                <textarea
                  value={answers[idx]}
                  onChange={(e) => updateAnswer(idx, e.target.value)}
                  rows={3}
                  className={inputClass}
                  placeholder={q.placeholder}
                />
              </div>
            ))}
          </div>

          {/* FOOTER */}
          <div className="flex justify-end gap-3 p-6 border-t border-slate-200 sticky bottom-0 bg-white">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-700 hover:bg-slate-100 rounded-lg font-medium transition-colors"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSaveInterview}
              disabled={loading}
              className="flex items-center gap-2 px-6 py-2 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Brain className="h-4 w-4" />
              )}
              Salvar e Analisar com IA 🤖
            </button>
          </div>
        </div>
      </div>
    );
  }

  // =================================================================
  // RENDERIZAÇÃO: PASSO 2 — RESULTADO DA ANÁLISE
  // =================================================================
  if (step === 2 && analysis) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
          {/* HEADER */}
          <div className="flex items-center justify-between p-6 border-b border-slate-200 sticky top-0 bg-white z-10">
            <div className="flex items-center gap-3">
              <Brain className="h-6 w-6 text-teal-600" />
              <div>
                <h2 className="text-xl font-bold text-slate-900">Análise Concluída</h2>
                <p className="text-sm text-slate-500">{employeeName}</p>
              </div>
            </div>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* RESULTADO */}
          <div className="p-6 space-y-6">
            {/* CAUSA PRIMÁRIA */}
            <div className="bg-gradient-to-r from-teal-50 to-orange-50 p-5 rounded-xl border-2 border-teal-200">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="text-xs font-bold text-slate-600 uppercase mb-1">
                    Causa-raiz identificada
                  </p>
                  <h3 className="text-2xl font-bold text-teal-900">
                    {analysis.primaryLabel}
                  </h3>
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-500">Confiança</p>
                  <p className="text-2xl font-bold text-teal-700">
                    {analysis.confidence}%
                  </p>
                </div>
              </div>
              <p className="text-xs text-slate-600 italic">
                Motor: {analysis.engine} • Analisado em{' '}
                {new Date(analysis.analyzedAt).toLocaleString('pt-BR')}
              </p>
            </div>

            {/* TODAS AS CAUSAS IDENTIFICADAS */}
            <div>
              <h4 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-teal-600" />
                Causas identificadas (ordenadas por score)
              </h4>
              <div className="space-y-2">
                {analysis.causes.map((cause) => (
                  <div
                    key={cause.category}
                    className="p-3 bg-slate-50 rounded-lg border border-slate-200"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-slate-900">{cause.label}</span>
                      <span className="text-xs font-bold text-slate-600 bg-slate-200 px-2 py-0.5 rounded-full">
                        {cause.score} keyword(s)
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {cause.matched.map((kw) => (
                        <span
                          key={kw}
                          className="text-xs bg-teal-100 text-teal-800 px-2 py-0.5 rounded"
                        >
                          {kw}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* PLANO DE AÇÃO SUGERIDO */}
            <div className="bg-amber-50 p-5 rounded-xl border-2 border-amber-200">
              <h4 className="text-sm font-bold text-amber-900 mb-3 flex items-center gap-2">
                <Lightbulb className="h-4 w-4" />
                Plano de ação sugerido (IA)
              </h4>
              <ul className="space-y-2">
                {analysis.actionPlan.map((action, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-amber-900">{action}</span>
                  </li>
                ))}
              </ul>
              <p className="text-xs text-amber-700 italic mt-3 flex items-start gap-1">
                <AlertTriangle className="h-3 w-3 mt-0.5 flex-shrink-0" />
                <span>
                  <strong>Importante:</strong> estas são sugestões automáticas.
                  O diretor deve revisar e decidir quais ações implementar.
                </span>
              </p>
            </div>
          </div>

          {/* FOOTER */}
          <div className="flex justify-end gap-3 p-6 border-t border-slate-200 sticky bottom-0 bg-white">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-lg transition-colors"
            >
              Concluir
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
// =================================================================
// FIM: frontend/src/components/turnover/ExitInterviewModal.tsx
// =================================================================