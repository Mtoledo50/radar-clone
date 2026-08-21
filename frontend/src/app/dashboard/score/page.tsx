// =================================================================
// INÍCIO: frontend/src/app/dashboard/score/page.tsx
// =================================================================
/**
 * 🏆 Score do Escritório — Sprint C4 (ADR-055)
 * Nota 0–100 consolidada + breakdown por dimensão + insights.
 * Gráficos 100% CSS puro (ADR-001).
 */
'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/axios';
import { toast } from 'sonner';
import { Gauge, Loader2, RefreshCw, TrendingUp, AlertTriangle, CheckCircle2, Info } from 'lucide-react';

interface Dimension { key: string; label: string; weight: number; score: number; detail: string; }
interface ScoreResult { total: number; level: string; dimensions: Dimension[]; insights: string[]; }

const LEVEL_CFG: Record<string, { label: string; color: string; bg: string }> = {
  EXCELENTE: { label: '🏆 Excelente', color: 'text-green-700', bg: 'bg-green-500' },
  SAUDAVEL:  { label: '✅ Saudável', color: 'text-teal-700', bg: 'bg-teal-500' },
  ATENCAO:   { label: '⚠️ Atenção', color: 'text-amber-700', bg: 'bg-amber-500' },
  CRITICO:   { label: '🚨 Crítico', color: 'text-red-700', bg: 'bg-red-500' },
};

export default function ScorePage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<ScoreResult | null>(null);

  async function load() {
    try {
      setLoading(true);
      const res = await api.get('/company/score');
      setData(res.data.data);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Erro ao calcular o score.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="h-12 w-12 text-teal-600 animate-spin mb-4" />
        <p className="text-slate-600">Calculando score do escritório...</p>
      </div>
    );
  }

  if (!data) return null;
  const cfg = LEVEL_CFG[data.level] || LEVEL_CFG.ATENCAO;

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
            <Gauge className="h-8 w-8 text-teal-600" />
            Score do Escritório
          </h1>
          <p className="text-slate-600 mt-1">
            Nota única de saúde consolidando Mercado, Pessoas, Comercial, Crescimento e Gestão.
          </p>
        </div>
        <button onClick={load} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 font-semibold">
          <RefreshCw className="h-4 w-4" /> Recalcular
        </button>
      </div>

      {/* NOTA TOTAL */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
        <div className="flex flex-col md:flex-row items-center gap-8">
          <div className="text-center">
            <div className={`text-7xl font-black ${cfg.color}`}>{data.total}</div>
            <div className="text-sm text-slate-500 mt-1">de 100 pontos</div>
          </div>
          <div className="flex-1 w-full">
            <div className={`inline-flex px-3 py-1 rounded-full text-sm font-bold text-white ${cfg.bg}`}>
              {cfg.label}
            </div>
            <div className="mt-4 h-4 bg-slate-200 rounded-full overflow-hidden">
              <div className={`h-full ${cfg.bg} transition-all duration-700`} style={{ width: `${data.total}%` }} />
            </div>
            <div className="flex justify-between text-xs text-slate-400 mt-1">
              <span>0</span><span>40</span><span>60</span><span>80</span><span>100</span>
            </div>
          </div>
        </div>
      </div>

      {/* DIMENSÕES */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {data.dimensions.map((d) => (
          <div key={d.key} className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
            <div className="flex justify-between items-baseline mb-2">
              <span className="font-bold text-slate-900">{d.label}</span>
              <span className="text-xs text-slate-500">peso {d.weight}%</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex-1 h-3 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${d.score >= 80 ? 'bg-green-500' : d.score >= 60 ? 'bg-teal-500' : d.score >= 40 ? 'bg-amber-500' : 'bg-red-500'}`}
                  style={{ width: `${d.score}%` }}
                />
              </div>
              <span className="text-lg font-bold text-slate-900 w-10 text-right">{d.score}</span>
            </div>
            <p className="text-xs text-slate-500 mt-2">{d.detail}</p>
          </div>
        ))}
      </div>

      {/* INSIGHTS */}
      <div className="bg-teal-50 border border-teal-200 rounded-xl p-5">
        <h3 className="font-bold text-teal-900 mb-3 flex items-center gap-2">
          <TrendingUp className="h-4 w-4" /> Insights da diretoria
        </h3>
        <ul className="space-y-2">
          {data.insights.map((ins, i) => (
            <li key={i} className="text-sm text-teal-900 flex items-start gap-2">
              <span className="text-teal-600 font-bold">•</span>{ins}
            </li>
          ))}
        </ul>
      </div>

      {/* COMO É CALCULADO */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 text-xs text-slate-600">
        <p className="font-bold text-slate-700 mb-2 flex items-center gap-1">
          <Info className="h-3 w-3" /> Como o score é calculado (ADR-055)
        </p>
        <p>
          Cada dimensão vira um sub-score 0–100 com fórmulas determinísticas
          (ex.: conversão 40% = 100 pts; desconto ≤5% = 100 pts; turnover novatos 50% = 0 pts).
          O total é a média ponderada pelos pesos (25/20/20/15/20). Sem IA: 100% auditável.
        </p>
      </div>
    </div>
  );
}
// =================================================================
// FIM: frontend/src/app/dashboard/score/page.tsx
// =================================================================