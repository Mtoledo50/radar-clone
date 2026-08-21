// =================================================================
// INÍCIO: frontend/src/app/dashboard/mentoria/page.tsx
// =================================================================
/**
 * 🧭 Visão de Futuro — Sprint D1 (ADR-056)
 * Dashboard de mentoria: norte (visão), progresso das metas e
 * focos derivados do Score (2 dimensões mais fracas + ações).
 */
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/axios';
import { toast } from 'sonner';
import {
  Telescope, Loader2, RefreshCw, Target, TrendingUp,
  Compass, CheckCircle2, Edit3, Users, Briefcase,
} from 'lucide-react';

interface Goal { key: string; label: string; current: number; target: number; pct: number; remaining: number; }
interface Focus { dimensionKey: string; label: string; score: number; actions: string[]; }
interface Mentoria {
  hasVision: boolean;
  vision: { visaoEmpresa: string | null; maiorDesafio: string | null; compromisso: string | null };
  goals: Goal[];
  focusAreas: Focus[];
  nextMilestone: string;
}

export default function MentoriaPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<Mentoria | null>(null);

  async function load() {
    try {
      setLoading(true);
      const res = await api.get('/company/mentoria');
      setData(res.data.data);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Erro ao carregar a mentoria.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="h-12 w-12 text-teal-600 animate-spin mb-4" />
        <p className="text-slate-600">Montando seu plano de mentoria...</p>
      </div>
    );
  }
  if (!data) return null;

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
            <Telescope className="h-8 w-8 text-teal-600" />
            Visão de Futuro
          </h1>
          <p className="text-slate-600 mt-1">
            Seu norte estratégico + o plano de mentoria derivado do Score do Escritório.
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={load} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 font-semibold">
            <RefreshCw className="h-4 w-4" /> Atualizar
          </button>
          <button onClick={() => router.push('/dashboard/minha-empresa')} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-semibold">
            <Edit3 className="h-4 w-4" /> Editar visão
          </button>
        </div>
      </div>

      {/* SEM VISÃO → CTA */}
      {!data.hasVision && (
        <div className="bg-white rounded-2xl border-2 border-dashed border-slate-300 p-10 text-center">
          <Compass className="h-12 w-12 text-slate-300 mx-auto mb-3" />
          <h2 className="text-lg font-bold text-slate-900 mb-1">Sua Visão de Futuro ainda não existe</h2>
          <p className="text-slate-500 mb-5 max-w-md mx-auto">
            Escreva a visão da empresa ideal daqui a 1 ano, o maior desafio e o seu
            compromisso — a mentoria usa isso como norte.
          </p>
          <button onClick={() => router.push('/dashboard/minha-empresa')} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-semibold">
            <Edit3 className="h-4 w-4" /> Criar minha visão agora
          </button>
        </div>
      )}

      {/* NORTE (visão/desafio/compromisso) */}
      {data.hasVision && (
        <div className="bg-gradient-to-br from-teal-600 to-teal-800 rounded-2xl p-8 text-white shadow-md">
          <p className="text-xs font-bold uppercase tracking-widest text-teal-200 mb-3">🧭 Norte da empresa</p>
          {data.vision.visaoEmpresa && (
            <p className="text-2xl font-bold leading-snug mb-4">“{data.vision.visaoEmpresa}”</p>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            {data.vision.maiorDesafio && (
              <div className="bg-white/10 rounded-lg p-4">
                <p className="font-bold text-teal-100 mb-1">🎯 Maior desafio</p>
                <p className="text-teal-50">{data.vision.maiorDesafio}</p>
              </div>
            )}
            {data.vision.compromisso && (
              <div className="bg-white/10 rounded-lg p-4">
                <p className="font-bold text-teal-100 mb-1">🤝 Compromisso</p>
                <p className="text-teal-50">{data.vision.compromisso}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* METAS (progresso) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {data.goals.map((g) => {
          const Icon = g.key === 'clientes' ? Briefcase : Users;
          return (
            <div key={g.key} className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
              <div className="flex justify-between items-baseline mb-2">
                <span className="font-bold text-slate-900 flex items-center gap-2">
                  <Icon className="h-4 w-4 text-teal-600" /> {g.label}
                </span>
                <span className="text-sm text-slate-500">{g.current} / {g.target}</span>
              </div>
              <div className="h-3 bg-slate-200 rounded-full overflow-hidden">
                <div className={`h-full rounded-full ${g.pct >= 80 ? 'bg-green-500' : g.pct >= 40 ? 'bg-teal-500' : 'bg-orange-500'}`} style={{ width: `${g.pct}%` }} />
              </div>
              <p className="text-xs text-slate-500 mt-2">
                {g.target > 0 ? `${g.pct}% da meta de 1 ano • faltam ${g.remaining}` : 'Defina a meta em Minha Empresa'}
              </p>
            </div>
          );
        })}
      </div>

      {/* FOCOS DA MENTORIA */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <h2 className="text-lg font-bold text-slate-900 mb-1 flex items-center gap-2">
          <Target className="h-5 w-5 text-orange-600" /> Focos da mentoria
        </h2>
        <p className="text-xs text-slate-500 mb-5">
          Derivados automaticamente das 2 dimensões mais fracas do Score (ADR-056).
        </p>
        {data.focusAreas.length === 0 ? (
          <div className="flex items-center gap-3 p-4 bg-green-50 rounded-lg">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            <p className="text-sm text-green-800">Todas as dimensões acima de 70 — mentoria em modo manutenção. 🏆</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {data.focusAreas.map((f) => (
              <div key={f.dimensionKey} className="border border-orange-200 bg-orange-50 rounded-xl p-5">
                <div className="flex justify-between items-baseline mb-3">
                  <span className="font-bold text-slate-900">{f.label}</span>
                  <span className="text-sm font-bold text-orange-700">{f.score}/100</span>
                </div>
                <ul className="space-y-2">
                  {f.actions.map((a, i) => (
                    <li key={i} className="text-sm text-slate-700 flex items-start gap-2">
                      <span className="text-orange-600 font-bold">→</span>{a}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* PRÓXIMO MARCO */}
      <div className="bg-teal-50 border border-teal-200 rounded-xl p-5 flex items-start gap-3">
        <TrendingUp className="h-5 w-5 text-teal-700 mt-0.5" />
        <p className="text-sm text-teal-900 font-medium">{data.nextMilestone}</p>
      </div>
    </div>
  );
}
// =================================================================
// FIM: frontend/src/app/dashboard/mentoria/page.tsx
// =================================================================