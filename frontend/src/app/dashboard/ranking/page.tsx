// =================================================================
// INÍCIO: frontend/src/app/dashboard/ranking/page.tsx
// =================================================================
/**
 * 🏆 Ranking de Níveis — Sprint D3 (ADR-058)
 * Seu nível (Bronze→Diamante) + progresso p/ o próximo + pódio da rede.
 * 100% CSS puro (ADR-001). Derivado do Score (C4).
 */
'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/axios';
import { toast } from 'sonner';
import { Trophy, Loader2, RefreshCw, TrendingUp, Medal } from 'lucide-react';

interface Level { key: string; label: string; badge: string; color: string; perk: string; }
interface Entry { companyId: string; name: string; score: number; level: Level; isYou: boolean; position: number; }
interface Ranking {
  you: { position: number; score: number; level: Level; next: Level | null; pointsToNext: number } | null;
  podium: Entry[];
  ranking: Entry[];
  total: number;
}

const MEDALS = ['🥇', '', '🥉'];

export default function RankingPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<Ranking | null>(null);

  async function load() {
    try {
      setLoading(true);
      const res = await api.get('/company/ranking');
      setData(res.data.data);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Erro ao carregar o ranking.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="h-12 w-12 text-teal-600 animate-spin mb-4" />
        <p className="text-slate-600">Montando o ranking da rede...</p>
      </div>
    );
  }
  if (!data) return null;

  // Ordem visual do pódio: 2º, 1º, 3º
  const podiumVisual = [data.podium[1], data.podium[0], data.podium[2]].filter(Boolean) as Entry[];

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
            <Trophy className="h-8 w-8 text-orange-500" />
            Ranking de Níveis
          </h1>
          <p className="text-slate-600 mt-1">
            Gamificação derivada do Score do Escritório (ADR-058) — sua posição entre os escritórios da rede.
          </p>
        </div>
        <button onClick={load} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 font-semibold">
          <RefreshCw className="h-4 w-4" /> Atualizar
        </button>
      </div>

      {/* SEU NÍVEL */}
      {data.you && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
          <div className="flex flex-col md:flex-row items-center gap-8">
            <div className="text-center">
              <div className="text-6xl mb-2">{data.you.level.badge}</div>
              <div className="text-2xl font-black" style={{ color: data.you.level.color }}>
                {data.you.level.label}
              </div>
              <div className="text-xs text-slate-500 mt-1">#{data.you.position} de {data.total} na rede</div>
            </div>
            <div className="flex-1 w-full">
              <div className="flex justify-between text-sm mb-1">
                <span className="font-semibold text-slate-700">Score atual</span>
                <span className="font-bold text-slate-900">{data.you.score}/100</span>
              </div>
              <div className="h-4 bg-slate-200 rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all duration-700" style={{ width: `${data.you.score}%`, backgroundColor: data.you.level.color }} />
              </div>
              {data.you.next ? (
                <p className="text-sm text-slate-600 mt-3 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-teal-600" />
                  Faltam <strong>{data.you.pointsToNext} pontos</strong> para o nível{' '}
                  <strong style={{ color: data.you.next.color }}>{data.you.next.badge} {data.you.next.label}</strong>
                </p>
              ) : (
                <p className="text-sm text-slate-600 mt-3">💎 Nível máximo alcançado — você é o benchmark da rede!</p>
              )}
              <p className="text-xs text-slate-500 mt-2 italic">{data.you.level.perk}</p>
            </div>
          </div>
        </div>
      )}

      {/* PÓDIO */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <h2 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
          <Medal className="h-5 w-5 text-orange-500" /> Pódio da rede
        </h2>
        <div className="flex items-end justify-center gap-4">
          {podiumVisual.map((e) => {
            const isFirst = e.position === 1;
            return (
              <div key={e.companyId} className="flex flex-col items-center w-1/3 max-w-[200px]">
                <div className="text-4xl mb-2">{MEDALS[e.position - 1]}</div>
                <p className={`text-sm font-bold text-center mb-1 ${e.isYou ? 'text-teal-700' : 'text-slate-800'}`}>
                  {e.name}{e.isYou && ' (você)'}
                </p>
                <p className="text-xs text-slate-500 mb-3">{e.level.badge} {e.score} pts</p>
                <div
                  className={`w-full rounded-t-xl flex items-start justify-center pt-3 ${e.isYou ? 'bg-teal-600' : 'bg-slate-200'}`}
                  style={{ height: isFirst ? 120 : e.position === 2 ? 90 : 70 }}
                >
                  <span className={`text-2xl font-black ${e.isYou ? 'text-white' : 'text-slate-500'}`}>
                    {e.position}º
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* RANKING COMPLETO */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <h2 className="text-lg font-bold text-slate-900 mb-4">Classificação completa</h2>
        <div className="space-y-2">
          {data.ranking.map((e) => (
            <div
              key={e.companyId}
              className={`flex items-center gap-4 p-3 rounded-lg border ${e.isYou ? 'bg-teal-50 border-teal-300' : 'bg-slate-50 border-slate-200'}`}
            >
              <span className="w-8 text-center font-black text-slate-700">{e.position}º</span>
              <span className="text-xl">{e.level.badge}</span>
              <span className={`flex-1 font-semibold ${e.isYou ? 'text-teal-800' : 'text-slate-800'}`}>
                {e.name}{e.isYou && ' (você)'}
              </span>
              <span className="text-sm text-slate-500">{e.level.label}</span>
              <span className="w-16 text-right font-black text-slate-900">{e.score}</span>
            </div>
          ))}
        </div>
        <p className="text-xs text-slate-400 mt-4">
          Ranking calculado deterministicamente pelo Score de cada escritório (ADR-055/058).
        </p>
      </div>
    </div>
  );
}
// =================================================================
// FIM: frontend/src/app/dashboard/ranking/page.tsx
// =================================================================