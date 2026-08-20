// =================================================================
// INÍCIO: frontend/src/app/dashboard/pessoas/benchmark/page.tsx
// =================================================================
/**
 * 🎯 Benchmark de Cargos por Setor — Sprint B5 (fecha a Fase B)
 * Compara cargos REAIS × benchmark contábil (ADR-051):
 * barras preenchido × recomendado, selos OK/VACANCY/OVER,
 * chips de cargos não reconhecidos e KPIs totais.
 * 🧠 ADRs: ADR-001 (CSS puro) • ADR-051 (domínio puro).
 */
'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/axios';
import { toast } from 'sonner';
import {
  Users, Loader2, AlertTriangle, UserPlus,
  Briefcase, Building2, TrendingUp, HelpCircle,
} from 'lucide-react';

// =================================================================
// 📋 TIPOS (espelho do contrato do backend)
// =================================================================
interface PositionGap {
  title: string;
  description: string;
  recommended: number;
  filled: number;
  gap: number;
  status: 'OK' | 'VACANCY' | 'OVER';
}

interface SectorAnalysis {
  sector: string;
  headcount: number;
  positions: PositionGap[];
  unmappedPositions: Array<{ name: string; count: number }>;
}

interface BenchmarkData {
  totalActive: number;
  vacancies: number;
  over: number;
  sectors: SectorAnalysis[];
}

// =================================================================
// 🔧 HELPER DE STATUS (selo + cor da barra)
// =================================================================
function getStatusCfg(status: 'OK' | 'VACANCY' | 'OVER', gap: number) {
  switch (status) {
    case 'OK':
      return { pill: 'bg-green-100 text-green-800', bar: 'bg-green-500', label: '✓ OK' };
    case 'VACANCY':
      return {
        pill: 'bg-amber-100 text-amber-800',
        bar: 'bg-amber-500',
        label: `⚠ ${gap} vaga(s) em aberto`,
      };
    default:
      return {
        pill: 'bg-rose-100 text-rose-800',
        bar: 'bg-rose-500',
        label: `⚠ ${-gap} acima do ideal`,
      };
  }
}

// =================================================================
// 🎯 COMPONENTE PRINCIPAL (export default OBRIGATÓRIO p/ App Router)
// =================================================================
export default function BenchmarkCargosPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<BenchmarkData | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      const res = await api.get('/employees/position-benchmark');
      setData(res.data.data);
    } catch (err) {
      toast.error('Erro ao carregar o benchmark de cargos');
    } finally {
      setLoading(false);
    }
  }

  // LOADING
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="h-12 w-12 text-teal-600 animate-spin mb-4" />
        <p className="text-slate-600">Calculando benchmark de cargos...</p>
      </div>
    );
  }

  // SEM COLABORADORES
  if (!data || data.totalActive === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <Briefcase className="h-16 w-16 text-slate-300 mb-4" />
        <h2 className="text-xl font-bold text-slate-900 mb-2">Sem colaboradores ativos</h2>
        <p className="text-slate-600 max-w-md">
          Cadastre colaboradores em <strong>Gestão de Pessoas → Colaboradores</strong> com
          departamento e cargo preenchidos para ativar o benchmark.
        </p>
      </div>
    );
  }

  // PÁGINA PRINCIPAL
  return (
    <div className="space-y-6">
      {/* CABEÇALHO */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
          <Briefcase className="h-8 w-8 text-teal-600" />
          Benchmark de Cargos
        </h1>
        <p className="text-slate-600 mt-1">
          Sua equipe tem os cargos certos em cada setor? Comparação ao vivo com o
          benchmark contábil (ADR-051).
        </p>
      </div>

      {/* KPIs TOTAIS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-2 mb-1">
            <Users className="h-4 w-4 text-teal-600" />
            <p className="text-xs font-semibold text-slate-500 uppercase">Equipe Ativa</p>
          </div>
          <p className="text-3xl font-bold text-slate-900">{data.totalActive}</p>
        </div>
        <div className="bg-amber-50 p-5 rounded-xl shadow-sm border border-amber-200">
          <div className="flex items-center gap-2 mb-1">
            <UserPlus className="h-4 w-4 text-amber-600" />
            <p className="text-xs font-semibold text-amber-700 uppercase">Vagas em Aberto</p>
          </div>
          <p className="text-3xl font-bold text-amber-900">{data.vacancies}</p>
          <p className="text-xs text-amber-700 mt-1">cargos recomendados sem ninguém</p>
        </div>
        <div className="bg-rose-50 p-5 rounded-xl shadow-sm border border-rose-200">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="h-4 w-4 text-rose-600" />
            <p className="text-xs font-semibold text-rose-700 uppercase">Acima do Ideal</p>
          </div>
          <p className="text-3xl font-bold text-rose-900">{data.over}</p>
          <p className="text-xs text-rose-700 mt-1">pessoas além do recomendado</p>
        </div>
      </div>

      {/* LEGENDA */}
      <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600 bg-white p-3 rounded-lg border border-slate-200">
        <span className="font-semibold text-slate-700">Legenda:</span>
        <span className="inline-flex items-center gap-1">
          <span className="w-3 h-3 rounded-full bg-green-500" /> ✓ OK
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="w-3 h-3 rounded-full bg-amber-500" /> ⚠ VACANCY (falta)
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="w-3 h-3 rounded-full bg-rose-500" /> ⚠ OVER (sobra)
        </span>
      </div>

      {/* CARDS POR SETOR */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {data.sectors.map((sector) => (
          <SectorCard key={sector.sector} sector={sector} />
        ))}
      </div>

      {/* RODAPÉ EXPLICATIVO */}
      <div className="bg-teal-50 border border-teal-200 rounded-xl p-4 text-sm text-teal-900">
        <p className="flex items-start gap-2">
          <HelpCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
          <span>
            <strong>Como funciona:</strong> o recomendado usa o método dos maiores
            restos (pesos do benchmark × headcount do setor). O preenchido classifica
            seus cargos reais por palavras-chave normalizadas (ex.: "Auxiliar Fiscal" →
            Assistente). Cargos não reconhecidos viram chips para você padronizar em
            <strong> Gestão de Pessoas</strong>.
          </span>
        </p>
      </div>
    </div>
  );
}

// =================================================================
// 🧩 CARD DE SETOR (barras preenchido × recomendado + selos)
// =================================================================
function SectorCard({ sector }: { sector: SectorAnalysis }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      {/* Header do setor */}
      <div className="bg-gradient-to-r from-teal-600 to-teal-700 text-white p-4 flex items-center justify-between">
        <h2 className="text-lg font-bold flex items-center gap-2">
          <Building2 className="h-5 w-5" />
          {sector.sector}
        </h2>
        <span className="text-sm bg-white/20 px-3 py-1 rounded-full font-semibold">
          {sector.headcount} pessoa(s)
        </span>
      </div>

      <div className="p-5 space-y-4">
        {/* Setor sem benchmark (ex: "Outros") */}
        {sector.positions.length === 0 && (
          <div>
            <p className="text-sm text-slate-600 mb-3">
              Setor sem benchmark padrão — cargos livres (sem comparação):
            </p>
            <div className="flex flex-wrap gap-2">
              {sector.unmappedPositions.map((u) => (
                <span
                  key={u.name}
                  className="inline-flex px-2.5 py-1 bg-slate-100 border border-slate-200 rounded-full text-xs font-medium text-slate-700"
                >
                  {u.name}: {u.count}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Linhas de cargo: barra + selo */}
        {sector.positions.map((pos) => {
          const cfg = getStatusCfg(pos.status, pos.gap);
          const pct =
            pos.recommended > 0
              ? Math.min(100, (pos.filled / pos.recommended) * 100)
              : pos.filled > 0
                ? 100
                : 0;
          return (
            <div key={pos.title}>
              <div className="flex justify-between items-baseline mb-1">
                <span className="font-semibold text-slate-900 text-sm">{pos.title}</span>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${cfg.pill}`}>
                  {cfg.label}
                </span>
              </div>
              <div className="relative h-6 bg-slate-100 rounded-md overflow-hidden border border-slate-200">
                <div
                  className={`h-full ${cfg.bar} transition-all flex items-center justify-end pr-2`}
                  style={{ width: `${pct}%` }}
                >
                  {pct > 12 && (
                    <span className="text-xs font-bold text-white drop-shadow">
                      {pos.filled}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex justify-between mt-1 text-xs text-slate-500">
                <span>{pos.description}</span>
                <span className="font-semibold">
                  {pos.filled} / {pos.recommended} recomendado
                </span>
              </div>
            </div>
          );
        })}

        {/* Cargos reais não reconhecidos (setores com benchmark) */}
        {sector.positions.length > 0 && sector.unmappedPositions.length > 0 && (
          <div className="pt-3 border-t border-slate-100">
            <p className="text-xs font-semibold text-amber-800 mb-2 flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              Cargos não reconhecidos (padronize p/ entrar no benchmark):
            </p>
            <div className="flex flex-wrap gap-2">
              {sector.unmappedPositions.map((u) => (
                <span
                  key={u.name}
                  className="inline-flex px-2.5 py-1 bg-amber-50 border border-amber-200 rounded-full text-xs font-medium text-amber-900"
                >
                  {u.name}: {u.count}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
// =================================================================
// FIM: frontend/src/app/dashboard/pessoas/benchmark/page.tsx
// =================================================================