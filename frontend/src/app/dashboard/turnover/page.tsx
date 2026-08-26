// =================================================================
// INÍCIO: frontend/src/app/dashboard/turnover/page.tsx
// =================================================================
/**
 * =================================================================
 * 📊 Módulo Turnover (Sprints B1 + B2 + B3 + B4)
 * =================================================================
 * Análise de rotatividade de colaboradores.
 * 4 abas: Empresa, Tipo Contratual, Setores, Rescisões.
 *
 * 🆕 Sprint B2 (ADR-048): distribuição VALIDADA (ao vivo) derivada
 *    dos Employee ATIVOS, comparada com benchmark contábil.
 * 🆕 Sprint B3 (ADR-049): KPIs de novatos/críticos + checkbox 🔑
 *    "Era colaborador crítico?" no modal de rescisão.
 * 🆕 Sprint B4 (ADR-050): Entrevista de desligamento + motor de
 *    análise (rules-v1) + sub-aba "Análises IA".
 * =================================================================
 */
'use client';

import { useState, useEffect, useMemo } from 'react';
import api from '@/lib/axios';
import { toast } from 'sonner';
import {
  Users, TrendingUp, TrendingDown, Plus, X, Loader2,
  Edit2, Trash2, CheckCircle, AlertCircle, Calendar,
  Briefcase, Settings, BarChart3, FileText, ChevronDown, ChevronRight,
  Check, AlertTriangle, Key, XCircle, MessageSquare, Brain, Lightbulb,
} from 'lucide-react';
import { ExitInterviewModal } from '@/components/turnover/ExitInterviewModal';

// =================================================================
// 🎨 PALETA E UTILITÁRIOS
// =================================================================
const inputClass =
  'w-full px-3 py-2 border border-slate-300 rounded-lg ' +
  'text-slate-900 placeholder:text-slate-400 ' +
  'focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all bg-white';

const months = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];
const monthsShort = [
  'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
  'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez',
];

const contractTypes = [
  { key: 'clt', label: 'CLT' },
  { key: 'intern', label: 'Estagiário' },
  { key: 'third', label: 'Terceiro' },
  { key: 'partner', label: 'Sócio' },
];

// 🆕 Sprint B2 — tipos do endpoint sector-distribution
interface SectorDist {
  name: string;
  current: number;
  currentPct: number;
  recommendedPct: number;
  recommendedHeadcount: number;
  delta: number;
  status: 'OK' | 'OVER' | 'UNDER';
}

interface SectorDistributionResponse {
  totalActive: number;
  sectors: SectorDist[];
  unmapped: Array<{ name: string; current: number }>;
}

// =================================================================
// 🎯 PÁGINA PRINCIPAL
// =================================================================
export default function TurnoverPage() {
  // =================================================================
  // 📋 TODOS OS useState — DECLARADOS ANTES DE QUALQUER useEffect
  // =================================================================
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'empresa' | 'contratual' | 'setores' | 'rescisoes'>('empresa');
  const [rescisaoSubTab, setRescisaoSubTab] = useState<'dashboard' | 'registros' | 'config' | 'analises'>('dashboard');
  const [year, setYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(1);

  const [data, setData] = useState<any>(null);
  const [sectors, setSectors] = useState<any[]>([]);
  const [reasons, setReasons] = useState<any[]>([]);
  const [positions, setPositions] = useState<any[]>([]);
  const [resignations, setResignations] = useState<any[]>([]);
  const [sectorDistribution, setSectorDistribution] = useState<any[]>([]);

  // 🆕 Sprint B3: KPIs de turnover (novatos + críticos + tenure)
  const [turnoverKpis, setTurnoverKpis] = useState<any>(null);
  // 🆕 Sprint B3+B4: dashboard de rescisões + análises agregadas
  const [resignationsDash, setResignationsDash] = useState<any>(null);
  // 🆕 Sprint B2: distribuição validada em tempo real
  const [liveDistribution, setLiveDistribution] = useState<SectorDistributionResponse | null>(null);

  // Modais
  const [showEditModal, setShowEditModal] = useState(false);
  const [showResignationModal, setShowResignationModal] = useState(false);
  const [showSectorModal, setShowSectorModal] = useState(false);

  // 🆕 Sprint B4: modal de entrevista de desligamento
  const [showExitInterviewModal, setShowExitInterviewModal] = useState(false);
  const [selectedResignation, setSelectedResignation] = useState<any>(null);

  // =================================================================
  // 🔄 useEffects — DEPOIS de todos os useState declarados
  // =================================================================
  useEffect(() => {
    loadData();
    loadTurnoverKpis();
    loadResignationsDash();
    loadLiveDistribution();
  }, [year]);

  useEffect(() => {
    if (activeTab === 'setores') loadSectorDistribution();
  }, [selectedMonth, activeTab]);

  // =================================================================
  // 🌐 FUNÇÕES DE CARREGAMENTO
  // =================================================================
  async function loadData() {
    try {
      setLoading(true);
      const [dashRes, sectorsRes, reasonsRes, positionsRes, resignationsRes] = await Promise.all([
        api.get(`/turnover/dashboard?year=${year}`),
        api.get('/turnover/sectors'),
        api.get('/turnover/reasons'),
        api.get('/turnover/positions'),
        api.get(`/turnover/resignations?year=${year}`),
      ]);
      setData(dashRes.data.data);
      setSectors(sectorsRes.data.data);
      setReasons(reasonsRes.data.data);
      setPositions(positionsRes.data.data);
      setResignations(resignationsRes.data.data);
    } catch (err) {
      toast.error('Erro ao carregar dados de turnover');
    } finally {
      setLoading(false);
    }
  }

  async function loadSectorDistribution() {
    try {
      const res = await api.get(`/turnover/sector-distribution?year=${year}&month=${selectedMonth}`);
      setSectorDistribution(res.data.data || []);
    } catch (err) {
      console.error('Erro ao carregar distribuição:', err);
    }
  }

  // 🆕 Sprint B3: carrega KPIs de turnover (EmployeeService)
  async function loadTurnoverKpis() {
    try {
      const res = await api.get('/employees/turnover-kpis');
      setTurnoverKpis(res.data.data);
    } catch (err) {
      console.error('Erro ao carregar turnover-kpis:', err);
    }
  }

  // 🆕 Sprint B3+B4: carrega dashboard de rescisões + análises agregadas
  async function loadResignationsDash() {
    try {
      const [resDash, resAnalyses] = await Promise.all([
        api.get(`/turnover/resignations-dashboard?year=${year}`),
        api.get(`/turnover/exit-analyses?year=${year}`),
      ]);
      setResignationsDash({
        ...resDash.data.data,
        analyzedCount: resAnalyses.data.data.analyzedCount,
        topCauses: resAnalyses.data.data.topCauses,
      });
    } catch (err) {
      console.error('Erro ao carregar dashboard de rescisões:', err);
    }
  }

  // 🆕 Sprint B2: distribuição validada derivada dos Employee ATIVOS
  async function loadLiveDistribution() {
    try {
      const res = await api.get('/employees/sector-distribution');
      setLiveDistribution(res.data.data);
    } catch (err) {
      console.error('Erro ao carregar distribuição validada:', err);
    }
  }

  // =================================================================
  // RENDERIZAÇÃO: LOADING (SEM modal dentro)
  // =================================================================
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="h-12 w-12 text-teal-600 animate-spin mb-4" />
        <p className="text-slate-600">Carregando módulo de turnover...</p>
      </div>
    );
  }

  // =================================================================
  // RENDERIZAÇÃO: PÁGINA PRINCIPAL
  // =================================================================
  return (
    <div className="space-y-6">
      {/* CABEÇALHO */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
            <Users className="h-8 w-8 text-teal-600" />
            Módulo Turnover
          </h1>
          <p className="text-slate-600 mt-1">Análise de rotatividade de colaboradores</p>
        </div>
        <select
          value={year}
          onChange={(e) => setYear(parseInt(e.target.value))}
          className={`${inputClass} w-32`}
        >
          {[2024, 2025, 2026, 2027].map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
      </div>

      {/* TABS PRINCIPAIS */}
      <div className="flex gap-2 bg-slate-100 p-1 rounded-lg">
        {[
          { key: 'empresa', label: 'Empresa' },
          { key: 'contratual', label: 'Tipo Contratual' },
          { key: 'setores', label: 'Setores' },
          { key: 'rescisoes', label: 'Rescisões' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={`flex-1 px-4 py-2 rounded-md font-medium transition-colors ${
              activeTab === tab.key
                ? 'bg-white text-teal-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* CONTEÚDO DAS TABS */}
      {activeTab === 'empresa' && (
        <EmpresaTab
          data={data}
          liveDistribution={liveDistribution}
          year={year}
          onEdit={(month: number) => { setSelectedMonth(month); setShowEditModal(true); }}
          onRefreshLive={loadLiveDistribution}
        />
      )}
      {activeTab === 'contratual' && (
        <ContratualTab
          data={data}
          selectedMonth={selectedMonth}
          setSelectedMonth={setSelectedMonth}
          onEdit={() => setShowEditModal(true)}
        />
      )}
      {activeTab === 'setores' && (
        <SetoresTab
          data={data}
          selectedMonth={selectedMonth}
          setSelectedMonth={setSelectedMonth}
          sectors={sectors}
          sectorDistribution={sectorDistribution}
          setSectorDistribution={setSectorDistribution}
          liveDistribution={liveDistribution}
          onManageSectors={() => setShowSectorModal(true)}
          onRefreshLive={loadLiveDistribution}
          onSaveDistribution={async () => {
            try {
              await api.post('/turnover/sector-distribution', {
                year,
                month: selectedMonth,
                distributions: sectorDistribution,
              });
              toast.success('Distribuição salva com sucesso!');
              loadData();
            } catch (err) {
              toast.error('Erro ao salvar distribuição');
            }
          }}
        />
      )}
      {activeTab === 'rescisoes' && (
        <RescisoesTab
          subTab={rescisaoSubTab}
          setSubTab={setRescisaoSubTab}
          resignations={resignations}
          reasons={reasons}
          positions={positions}
          sectors={sectors}
          turnoverKpis={turnoverKpis}
          resignationsDash={resignationsDash}
          year={year}
          onAdd={() => setShowResignationModal(true)}
          onOpenExitInterview={(r: any) => {
            setSelectedResignation(r);
            setShowExitInterviewModal(true);
          }}
          onDelete={async (id: string) => {
            await api.delete(`/turnover/resignations/${id}`);
            toast.success('Rescisão removida');
            loadData();
            loadTurnoverKpis();
            loadResignationsDash();
          }}
        />
      )}

      {/* ============================================================= */}
      {/* MODAIS (SEMPRE NO FINAL DO COMPONENTE, FORA DO LOADING)        */}
      {/* ============================================================= */}
      {showEditModal && (
        <EditMonthlyModal
          month={selectedMonth}
          year={year}
          initialData={data?.monthlyData?.find((m: any) => m.month === selectedMonth)}
          onClose={() => setShowEditModal(false)}
          onSave={async (formData: any) => {
            await api.post('/turnover/monthly', { year, month: selectedMonth, data: formData });
            toast.success('Dados salvos com sucesso!');
            setShowEditModal(false);
            loadData();
          }}
        />
      )}

      {showResignationModal && (
        <AddResignationModal
          reasons={reasons}
          positions={positions}
          sectors={sectors}
          onClose={() => setShowResignationModal(false)}
          onSave={async (formData: any) => {
            await api.post('/turnover/resignations', formData);
            toast.success('Rescisão registrada!');
            setShowResignationModal(false);
            loadData();
            loadTurnoverKpis();
            loadResignationsDash();
          }}
        />
      )}

      {showSectorModal && (
        <ManageSectorsModal
          sectors={sectors}
          onClose={() => setShowSectorModal(false)}
          onAdd={async (name: string) => {
            await api.post('/turnover/sectors', { name });
            toast.success('Setor adicionado!');
            loadData();
          }}
          onDelete={async (id: string) => {
            await api.delete(`/turnover/sectors/${id}`);
            toast.success('Setor removido');
            loadData();
          }}
          onAddCell={async (sectorId: string, cellName: string) => {
            await api.post(`/turnover/sectors/${sectorId}/cells`, { name: cellName });
            toast.success('Célula adicionada!');
            loadData();
          }}
          onDeleteCell={async (sectorId: string, cellId: string) => {
            await api.delete(`/turnover/sectors/${sectorId}/cells/${cellId}`);
            toast.success('Célula removida');
            loadData();
          }}
        />
      )}

      {/* 🆕 Sprint B4: Modal de entrevista de desligamento */}
      {showExitInterviewModal && selectedResignation && (
        <ExitInterviewModal
          resignationId={selectedResignation.id}
          employeeName={selectedResignation.employeeName}
          onClose={() => {
            setShowExitInterviewModal(false);
            setSelectedResignation(null);
          }}
          onAnalyzed={() => {
            loadData();
            loadTurnoverKpis();
            loadResignationsDash();
          }}
        />
      )}
    </div>
  );
}

// =================================================================
// 📊 TAB EMPRESA
// =================================================================
function EmpresaTab({ data, liveDistribution, year, onEdit, onRefreshLive }: any) {
  if (!data) return null;

  const turnoverAcumuladoSafe = Number(data.turnoverAcumulado) >= 0 ? Number(data.turnoverAcumulado).toFixed(1) : '0.0';
  const totalEquipe = liveDistribution?.totalActive ?? 0;

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <KpiCard icon={Users} label="Total da Equipe" value={totalEquipe} sublabel="Colaboradores ativos (ao vivo)" color="teal" />
        <KpiCard
          icon={TrendingUp}
          label="Turnover Acumulado 12m"
          value={`${turnoverAcumuladoSafe}%`}
          sublabel="Média anual"
          extra={
            <div className="text-xs text-slate-500 mt-2 p-2 bg-slate-50 rounded">
              <p><strong>Fórmula:</strong> (Demissões / Headcount Médio) × 100</p>
              <p><strong>Cálculo:</strong> HC Médio = (Inicial + Final) / 2</p>
            </div>
          }
          color="orange"
        />
        <KpiCard icon={BarChart3} label="Turnover por Setor" value="-" sublabel="Veja na aba Setores" color="slate" />
        <KpiCard icon={Briefcase} label="Turnover por Tipo" value="Detalhes" sublabel="Veja na aba Tipo Contratual" color="teal" />
      </div>

      {/* 🆕 Sprint B2: preview da distribuição validada no dashboard */}
      {liveDistribution && liveDistribution.totalActive > 0 && (
        <div className="bg-gradient-to-r from-teal-50 to-blue-50 rounded-xl p-5 border border-teal-200">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-bold text-teal-900 flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              Distribuição por Setor (ao vivo)
            </h3>
            <button onClick={onRefreshLive} className="text-xs text-teal-700 hover:text-teal-900 underline">
              Atualizar
            </button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {liveDistribution.sectors.map((s: any) => (
                            <div key={s.name} className="bg-white rounded-lg p-3 border border-white shadow-sm">
                <p className="text-xs font-semibold text-slate-600 uppercase mb-1">{s.name}</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-bold text-slate-900">{s.current}</span>
                  <span className="text-xs text-slate-500">/ {s.recommendedHeadcount}</span>
                </div>
                <StatusBadge status={s.status} delta={s.delta} />
              </div>
            ))}
          </div>
          <p className="text-xs text-slate-600 mt-3 italic">
            💡 Recomendado baseado em benchmark contábil (ADR-048): Fiscal 30% • Contábil 25% • DP 20% • Admin 15% • Outros 10%. Tolerância ±5 p.p.
          </p>
        </div>
      )}

      {liveDistribution && liveDistribution.totalActive === 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
          <p className="text-sm text-amber-900 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            <span><strong>Sem colaboradores ativos.</strong> Cadastre colaboradores em "Gestão de Pessoas" para ativar a distribuição por setor.</span>
          </p>
        </div>
      )}

      {/* Gráfico de Linha */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <h3 className="text-lg font-bold text-slate-900 mb-4">Turnover nos Últimos 12 Meses</h3>
        <div className="h-64 flex items-end justify-around gap-2 border-b border-l border-slate-200 pb-2 pl-2">
          {data.monthlyData?.map((m: any, idx: number) => {
            const initial = Number(m.initial) || 0;
            const final = Number(m.final) || 0;
            const dismissals = Number(m.dismissals) || 0;
            const hcMedio = (initial + final) / 2;
            const turnover = hcMedio > 0 ? (dismissals / hcMedio) * 100 : 0;
            const maxVal = Math.max(...data.monthlyData.map((mm: any) => {
              const hc = (Number(mm.initial) + Number(mm.final)) / 2;
              return hc > 0 ? (Number(mm.dismissals) / hc) * 100 : 0;
            }), 1);
            const height = (turnover / maxVal) * 100;
            return (
              <div key={idx} className="flex flex-col items-center flex-1">
                <div className="w-full flex justify-center" style={{ height: '200px' }}>
                  <div
                    className="w-4 bg-teal-500 rounded-t transition-all hover:bg-teal-700 cursor-pointer"
                    style={{ height: `${Math.max(height, 2)}%`, marginBottom: '0px' }}
                    title={`${monthsShort[idx]}: ${turnover.toFixed(2)}%`}
                  />
                </div>
                <span className="text-xs text-slate-600 mt-2">{monthsShort[idx]}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Tabela de Dados Mensais */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200">
          <h3 className="text-lg font-bold text-slate-900">Dados Mensais</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-600 uppercase">Mês</th>
                <th className="text-center px-6 py-3 text-xs font-semibold text-slate-600 uppercase">Equipe Inicial</th>
                <th className="text-center px-6 py-3 text-xs font-semibold text-slate-600 uppercase">Admissões</th>
                <th className="text-center px-6 py-3 text-xs font-semibold text-slate-600 uppercase">Demissões</th>
                <th className="text-center px-6 py-3 text-xs font-semibold text-slate-600 uppercase">Equipe Final</th>
                <th className="text-center px-6 py-3 text-xs font-semibold text-slate-600 uppercase">Turnover Mensal (%)</th>
                <th className="text-center px-6 py-3 text-xs font-semibold text-slate-600 uppercase">Turnover Acumulado (%)</th>
                <th className="text-right px-6 py-3 text-xs font-semibold text-slate-600 uppercase">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {data.monthlyData?.map((m: any, idx: number) => {
                const initial = Number(m.initial) || 0;
                const final = Number(m.final) || 0;
                const admissions = Number(m.admissions) || 0;
                const dismissals = Number(m.dismissals) || 0;
                const hcMedio = (initial + final) / 2;
                const turnoverMensal = hcMedio > 0 ? (dismissals / hcMedio) * 100 : 0;
                const demissAcum = data.monthlyData.slice(0, idx + 1).reduce((acc: number, mm: any) => acc + (Number(mm.dismissals) || 0), 0);
                const hcAcum = data.monthlyData.slice(0, idx + 1).reduce((acc: number, mm: any) => acc + ((Number(mm.initial) || 0) + (Number(mm.final) || 0)) / 2, 0);
                const turnoverAcum = hcAcum > 0 ? (demissAcum / hcAcum) * 100 : 0;
                return (
                  <tr key={idx} className="hover:bg-slate-50">
                    <td className="px-6 py-4 font-medium text-slate-900">{months[idx]}</td>
                    <td className="px-6 py-4 text-center">{initial}</td>
                    <td className="px-6 py-4 text-center text-green-600">{admissions}</td>
                    <td className="px-6 py-4 text-center text-red-600">{dismissals}</td>
                    <td className="px-6 py-4 text-center font-semibold">{final}</td>
                    <td className="px-6 py-4 text-center text-teal-600 font-medium">{turnoverMensal.toFixed(2)}%</td>
                    <td className="px-6 py-4 text-center font-semibold">{turnoverAcum.toFixed(2)}%</td>
                    <td className="px-6 py-4 text-right">
                      <button onClick={() => onEdit(m.month)} className="text-teal-600 hover:text-teal-800">
                        <Edit2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// =================================================================
// 📋 TAB TIPO CONTRATUAL
// =================================================================
function ContratualTab({ data, selectedMonth, setSelectedMonth, onEdit }: any) {
  if (!data) return null;
  const monthData = data.monthlyData?.find((m: any) => m.month === selectedMonth);

  return (
    <div className="space-y-6">
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
        <h3 className="font-semibold text-slate-900 mb-3">Selecione o Mês</h3>
        <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
          {monthsShort.map((m, idx) => (
            <button
              key={idx}
              onClick={() => setSelectedMonth(idx + 1)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                selectedMonth === idx + 1 ? 'bg-teal-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      {monthData && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h3 className="text-lg font-bold text-slate-900 mb-4">Resumo da Empresa - {months[selectedMonth - 1]}</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-slate-600">Equipe Inicial Total</p>
              <p className="text-2xl font-bold text-slate-900">{Number(monthData.initial) || 0}</p>
            </div>
            <div>
              <p className="text-sm text-slate-600">Admissões Totais</p>
              <p className="text-2xl font-bold text-green-600">{Number(monthData.admissions) || 0}</p>
            </div>
            <div>
              <p className="text-sm text-slate-600">Demissões Totais</p>
              <p className="text-2xl font-bold text-red-600">{Number(monthData.dismissals) || 0}</p>
            </div>
            <div>
              <p className="text-sm text-slate-600">Equipe Final Total</p>
              <p className="text-2xl font-bold text-slate-900">{Number(monthData.final) || 0}</p>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200">
          <h3 className="text-lg font-bold text-slate-900">Distribuição por Tipo Contratual - {months[selectedMonth - 1]}</h3>
        </div>
        <table className="w-full">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="text-left px-6 py-3 text-xs font-semibold text-slate-600 uppercase">Tipo</th>
              <th className="text-center px-6 py-3 text-xs font-semibold text-slate-600 uppercase">Equipe Inicial</th>
              <th className="text-center px-6 py-3 text-xs font-semibold text-slate-600 uppercase">Admissões</th>
              <th className="text-center px-6 py-3 text-xs font-semibold text-slate-600 uppercase">Demissões</th>
              <th className="text-center px-6 py-3 text-xs font-semibold text-slate-600 uppercase">Equipe Final</th>
              <th className="text-center px-6 py-3 text-xs font-semibold text-slate-600 uppercase">Turnover (%)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {contractTypes.map((ct) => {
              const initial = Number(data?.monthlyData?.find((m: any) => m.month === selectedMonth)?.[`${ct.key}Initial`]) || 0;
              const admissions = Number(data?.monthlyData?.find((m: any) => m.month === selectedMonth)?.[`${ct.key}Admissions`]) || 0;
              const dismissals = Number(data?.monthlyData?.find((m: any) => m.month === selectedMonth)?.[`${ct.key}Dismissals`]) || 0;
              const final = initial + admissions - dismissals;
              const hcMedio = (initial + final) / 2;
              const turnover = hcMedio > 0 ? (dismissals / hcMedio) * 100 : 0;
              return (
                <tr key={ct.key} className="hover:bg-slate-50">
                  <td className="px-6 py-4 font-medium text-slate-900">{ct.label}</td>
                  <td className="px-6 py-4 text-center">{initial}</td>
                  <td className="px-6 py-4 text-center text-green-600">{admissions}</td>
                  <td className="px-6 py-4 text-center text-red-600">{dismissals}</td>
                  <td className="px-6 py-4 text-center font-semibold">{final}</td>
                  <td className="px-6 py-4 text-center text-teal-600 font-medium">{turnover.toFixed(2)}%</td>
                </tr>
              );
            })}
            <tr className="bg-slate-50 font-bold">
              <td className="px-6 py-4">Total</td>
              <td className="px-6 py-4 text-center">{Number(monthData?.initial) || 0}</td>
              <td className="px-6 py-4 text-center text-green-600">{Number(monthData?.admissions) || 0}</td>
              <td className="px-6 py-4 text-center text-red-600">{Number(monthData?.dismissals) || 0}</td>
              <td className="px-6 py-4 text-center">{Number(monthData?.final) || 0}</td>
              <td className="px-6 py-4 text-center text-teal-600">
                {monthData ? (() => {
                  const hc = (Number(monthData.initial) + Number(monthData.final)) / 2;
                  return hc > 0 ? ((Number(monthData.dismissals) / hc) * 100).toFixed(2) + '%' : '0.00%';
                })() : '0.00%'}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

// =================================================================
// 🆕 SPRINT B2: TAB SETORES (com distribuição VALIDADA no topo)
// =================================================================
function SetoresTab({
  data, selectedMonth, setSelectedMonth, sectors, sectorDistribution,
  setSectorDistribution, liveDistribution, onManageSectors, onRefreshLive,
  onSaveDistribution,
}: any) {
  const monthData = data?.monthlyData?.find((m: any) => m.month === selectedMonth);

  const distributedTotals = useMemo(() => {
    const initial = sectorDistribution.reduce((acc: number, d: any) => acc + (Number(d.initial) || 0), 0);
    const admissions = sectorDistribution.reduce((acc: number, d: any) => acc + (Number(d.admissions) || 0), 0);
    const dismissals = sectorDistribution.reduce((acc: number, d: any) => acc + (Number(d.dismissals) || 0), 0);
    return { initial, admissions, dismissals };
  }, [sectorDistribution]);

  const isDistributionValid = useMemo(() => {
    if (!monthData) return false;
    return (
      distributedTotals.initial === Number(monthData.initial) &&
      distributedTotals.admissions === Number(monthData.admissions) &&
      distributedTotals.dismissals === Number(monthData.dismissals)
    );
  }, [distributedTotals, monthData]);

  const updateSectorDistribution = (sectorId: string, field: string, value: number) => {
    setSectorDistribution((prev: any[]) =>
      prev.map((d: any) => d.sectorId === sectorId ? { ...d, [field]: value } : d)
    );
  };

  const getSectorTurnover = (dist: any) => {
    const initial = Number(dist.initial) || 0;
    const admissions = Number(dist.admissions) || 0;
    const dismissals = Number(dist.dismissals) || 0;
    const final = initial + admissions - dismissals;
    const hcMedio = (initial + final) / 2;
    return hcMedio > 0 ? (dismissals / hcMedio) * 100 : 0;
  };

  const turnoverRanking = useMemo(() => {
    return sectorDistribution
      .map((d: any) => ({ sector: d.sector?.name || 'Setor', turnover: getSectorTurnover(d) }))
      .sort((a: any, b: any) => b.turnover - a.turnover);
  }, [sectorDistribution]);

  return (
    <div className="space-y-6">
      {/* 🆕 Sprint B2: DISTRIBUIÇÃO VALIDADA (AO VIVO) */}
      {liveDistribution && liveDistribution.totalActive > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border-2 border-teal-300 overflow-hidden">
          <div className="bg-gradient-to-r from-teal-600 to-teal-700 text-white p-5 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold flex items-center gap-2">
                <CheckCircle className="h-6 w-6" />
                Distribuição por Setor — VALIDADA (ao vivo)
              </h2>
              <p className="text-sm text-teal-100 mt-1">
                Fonte: <strong>{liveDistribution.totalActive} colaboradores ativos</strong> • Benchmark contábil (ADR-048) • Tolerância ±5 p.p.
              </p>
            </div>
            <button onClick={onRefreshLive} className="px-3 py-1.5 bg-white/20 hover:bg-white/30 text-white text-xs font-semibold rounded-lg transition-colors">
              🔄 Atualizar
            </button>
          </div>

          <div className="p-6 space-y-3">
            {liveDistribution.sectors.map((s) => (
              <ValidatedSectorRow key={s.name} sector={s} />
            ))}

            {liveDistribution.unmapped.length > 0 && (
              <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-sm font-semibold text-amber-900 flex items-center gap-2 mb-2">
                  <AlertTriangle className="h-4 w-4" />
                  Departamentos não reconhecidos ({liveDistribution.unmapped.reduce((s, u) => s + u.current, 0)} pessoas)
                </p>
                <p className="text-xs text-amber-800 mb-2">
                  Esses departamentos foram contados em "Outros". Para que sejam mapeados automaticamente, use nomes padronizados
                  (ex: "Fiscal", "Contábil", "Departamento Pessoal", "Comercial").
                </p>
                <div className="flex flex-wrap gap-2">
                  {liveDistribution.unmapped.map((u) => (
                    <span key={u.name} className="inline-flex px-2 py-1 bg-white border border-amber-300 rounded text-xs font-medium text-amber-900">
                      {u.name}: {u.current}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <p className="text-xs text-slate-500 italic pt-3 border-t border-slate-100">
              💡 <strong>Como melhorar:</strong> cadastre colaboradores com departamentos padronizados em
              <span className="font-semibold"> Gestão de Pessoas</span> — a distribuição se atualiza automaticamente.
            </p>
          </div>
        </div>
      )}

      {liveDistribution && liveDistribution.totalActive === 0 && (
        <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-6 text-center">
          <AlertTriangle className="h-10 w-10 text-amber-600 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-amber-900 mb-1">Sem colaboradores ativos</h3>
          <p className="text-sm text-amber-800">
            Cadastre colaboradores em "Gestão de Pessoas" para ativar a distribuição validada por setor.
          </p>
        </div>
      )}

      {/* Distribuição MANUAL (legado) */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex-1">
          <h3 className="font-semibold text-slate-900 mb-3">📋 Distribuição Histórica (preenchimento manual) — Selecione o Mês</h3>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
            {monthsShort.map((m, idx) => (
              <button
                key={idx}
                onClick={() => setSelectedMonth(idx + 1)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  selectedMonth === idx + 1 ? 'bg-teal-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>
        <button
          onClick={onManageSectors}
          className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-800 text-white font-semibold rounded-lg transition-colors"
        >
          <Settings className="h-4 w-4" />
          Gerenciar Setores
        </button>
      </div>

      {monthData && (
        <div className="bg-blue-50 border border-blue-200 p-4 rounded-xl">
          <h4 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
            <Briefcase className="h-4 w-4 text-blue-600" />
            Valores do Tipo Contratual para Distribuir - {months[selectedMonth - 1]}
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-slate-600">Equipe Inicial</p>
              <p className="text-2xl font-bold text-slate-900">{Number(monthData.initial) || 0}</p>
            </div>
            <div>
              <p className="text-sm text-slate-600">Admissões</p>
              <p className="text-2xl font-bold text-green-600">{Number(monthData.admissions) || 0}</p>
            </div>
            <div>
              <p className="text-sm text-slate-600">Demissões</p>
              <p className="text-2xl font-bold text-red-600">{Number(monthData.dismissals) || 0}</p>
            </div>
            <div>
              <p className="text-sm text-slate-600">Equipe Final</p>
              <p className="text-2xl font-bold text-slate-900">{Number(monthData.final) || 0}</p>
            </div>
          </div>
        </div>
      )}

      <div className={`p-4 rounded-xl border-2 ${isDistributionValid ? 'bg-green-50 border-green-500' : 'bg-red-50 border-red-500'}`}>
        <div className="flex items-center gap-3">
          {isDistributionValid ? (
            <>
              <CheckCircle className="h-6 w-6 text-green-600" />
              <div>
                <p className="font-semibold text-green-800">Distribuição Histórica Válida</p>
                <p className="text-sm text-green-700">A soma dos setores está igual aos totais da empresa</p>
              </div>
            </>
          ) : (
            <>
              <AlertCircle className="h-6 w-6 text-red-600" />
              <div>
                <p className="font-semibold text-red-800">Distribuição Histórica Inválida</p>
                <p className="text-sm text-red-700">A soma dos setores deve ser igual aos totais da empresa</p>
              </div>
            </>
          )}
        </div>
      </div>

      {turnoverRanking.length > 0 && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h3 className="text-lg font-bold text-slate-900 mb-4">Ranking de Turnover por Setor (histórico) - {months[selectedMonth - 1]}</h3>
          <div className="space-y-2">
            {turnoverRanking.map((item: any, idx: number) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-slate-600">{idx + 1}º</span>
                  <span className="font-medium text-slate-900">{item.sector}</span>
                </div>
                <span className="text-teal-600 font-bold">{item.turnover.toFixed(2)}%</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex justify-between items-center">
          <h3 className="text-lg font-bold text-slate-900">Distribuição Histórica por Setor - {months[selectedMonth - 1]}</h3>
          <button
            onClick={onSaveDistribution}
            disabled={!isDistributionValid}
            className={`flex items-center gap-2 px-4 py-2 font-semibold rounded-lg transition-colors ${
              isDistributionValid ? 'bg-teal-600 hover:bg-teal-700 text-white' : 'bg-slate-300 text-slate-500 cursor-not-allowed'
            }`}
          >
            <CheckCircle className="h-4 w-4" />
            Salvar Distribuição
          </button>
        </div>

        {sectors.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <AlertCircle className="h-12 w-12 mx-auto mb-4 text-slate-300" />
            <p>Nenhum setor cadastrado. Clique em "Gerenciar Setores" para começar.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-600 uppercase">Setor</th>
                  <th className="text-center px-6 py-3 text-xs font-semibold text-slate-600 uppercase">Eq. Inicial</th>
                  <th className="text-center px-6 py-3 text-xs font-semibold text-slate-600 uppercase">Admissões</th>
                  <th className="text-center px-6 py-3 text-xs font-semibold text-slate-600 uppercase">Demissões</th>
                  <th className="text-center px-6 py-3 text-xs font-semibold text-slate-600 uppercase">Eq. Final</th>
                  <th className="text-center px-6 py-3 text-xs font-semibold text-slate-600 uppercase">Turnover (%)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {sectors.map((sector: any) => {
                  const dist = sectorDistribution.find((d: any) => d.sectorId === sector.id) || {
                    sectorId: sector.id, initial: 0, admissions: 0, dismissals: 0, sector,
                  };
                  const turnover = getSectorTurnover(dist);
                  return (
                    <tr key={sector.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4 font-medium text-slate-900">{sector.name}</td>
                      <td className="px-6 py-4 text-center">
                        <input
                          type="number"
                          value={dist.initial || 0}
                          onChange={(e) => updateSectorDistribution(sector.id, 'initial', parseInt(e.target.value) || 0)}
                          className="w-20 px-2 py-1 border border-slate-300 rounded text-center text-slate-900 focus:ring-2 focus:ring-teal-500"
                        />
                      </td>
                      <td className="px-6 py-4 text-center">
                        <input
                          type="number"
                          value={dist.admissions || 0}
                          onChange={(e) => updateSectorDistribution(sector.id, 'admissions', parseInt(e.target.value) || 0)}
                          className="w-20 px-2 py-1 border border-slate-300 rounded text-center text-green-600 focus:ring-2 focus:ring-teal-500"
                        />
                      </td>
                      <td className="px-6 py-4 text-center">
                        <input
                          type="number"
                          value={dist.dismissals || 0}
                          onChange={(e) => updateSectorDistribution(sector.id, 'dismissals', parseInt(e.target.value) || 0)}
                          className="w-20 px-2 py-1 border border-slate-300 rounded text-center text-red-600 focus:ring-2 focus:ring-teal-500"
                        />
                      </td>
                      <td className="px-6 py-4 text-center font-semibold">
                        {(Number(dist.initial) || 0) + (Number(dist.admissions) || 0) - (Number(dist.dismissals) || 0)}
                      </td>
                      <td className="px-6 py-4 text-center text-teal-600 font-medium">{turnover.toFixed(2)}%</td>
                    </tr>
                  );
                })}
                <tr className="bg-slate-100 font-bold">
                  <td className="px-6 py-4">Total Distribuído</td>
                  <td className="px-6 py-4 text-center text-slate-900">{distributedTotals.initial}</td>
                  <td className="px-6 py-4 text-center text-green-600">{distributedTotals.admissions}</td>
                  <td className="px-6 py-4 text-center text-red-600">{distributedTotals.dismissals}</td>
                  <td className="px-6 py-4 text-center">{distributedTotals.initial + distributedTotals.admissions - distributedTotals.dismissals}</td>
                  <td className="px-6 py-4 text-center">-</td>
                </tr>
                {monthData && (
                  <tr className="bg-blue-50">
                    <td className="px-6 py-4 font-medium text-blue-900">Meta (Tipo Contratual)</td>
                    <td className="px-6 py-4 text-center text-blue-900">{Number(monthData.initial) || 0}</td>
                    <td className="px-6 py-4 text-center text-blue-900">{Number(monthData.admissions) || 0}</td>
                    <td className="px-6 py-4 text-center text-blue-900">{Number(monthData.dismissals) || 0}</td>
                    <td className="px-6 py-4 text-center text-blue-900">{Number(monthData.final) || 0}</td>
                    <td className="px-6 py-4 text-center">-</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// =================================================================
// 📤 TAB RESCISÕES (completo — dashboard, registros, análises, config)
// =================================================================
function RescisoesTab({
  subTab, setSubTab, resignations, reasons, positions, sectors,
  turnoverKpis, resignationsDash, year, onAdd, onOpenExitInterview, onDelete,
}: any) {
  return (
    <div className="space-y-6">
      <div className="flex gap-2 bg-slate-100 p-1 rounded-lg">
        {[
          { key: 'dashboard', label: 'Dashboard' },
          { key: 'registros', label: 'Registros' },
          { key: 'analises', label: 'Análises IA' },
          { key: 'config', label: 'Configurações' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setSubTab(tab.key)}
            className={`flex-1 px-4 py-2 rounded-md font-medium transition-colors ${
              subTab === tab.key ? 'bg-white text-teal-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {subTab === 'dashboard' && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard
              icon={Users}
              label="Total de Desligamentos"
              value={resignationsDash?.totalDismissals ?? 0}
              sublabel={`Em ${resignationsDash?.year ?? new Date().getFullYear()}`}
              color="teal"
            />
            <KpiCard
              icon={TrendingUp}
              label="Turnover de Novatos"
              value={`${resignationsDash?.newbieTurnoverRate ?? 0}%`}
              sublabel={`${resignationsDash?.newbieDismissals ?? 0} com tenure < 12m`}
              color={(resignationsDash?.newbieTurnoverRate ?? 0) > 30 ? 'red' : 'orange'}
            />
            <KpiCard
              icon={AlertCircle}
              label="Motivo Mais Frequente"
              value={resignationsDash?.topReason?.name ?? 'N/A'}
              sublabel={`${resignationsDash?.topReason?.count ?? 0} ocorrências`}
              color="slate"
            />
            <KpiCard
              icon={Briefcase}
              label="Setor Crítico"
              value={resignationsDash?.topSector?.name ?? 'N/A'}
              sublabel={`${resignationsDash?.topSector?.count ?? 0} desligamentos`}
              color="slate"
            />
          </div>

          {/* 🆕 Sprint B3: KPIs avançados (tenure + críticos) */}
          {turnoverKpis && (
            <div className="bg-gradient-to-r from-rose-50 to-amber-50 rounded-xl p-6 border border-rose-200">
              <h3 className="text-lg font-bold text-rose-900 mb-4 flex items-center gap-2">
                <Key className="h-5 w-5" />
                KPIs Avançados de Turnover
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-xs text-rose-800 uppercase font-semibold">Equipe Ativa</p>
                  <p className="text-2xl font-bold text-rose-900">{turnoverKpis.activeCount}</p>
                </div>
                <div>
                  <p className="text-xs text-rose-800 uppercase font-semibold">🔑 Críticos Ativos</p>
                  <p className="text-2xl font-bold text-rose-900">{turnoverKpis.criticalActive}</p>
                </div>
                <div>
                  <p className="text-xs text-rose-800 uppercase font-semibold">Tenure Médio</p>
                  <p className="text-2xl font-bold text-rose-900">{turnoverKpis.avgTenureMonths}m</p>
                </div>
                <div>
                  <p className="text-xs text-rose-800 uppercase font-semibold">🔑 Críticos Perdidos</p>
                  <p className="text-2xl font-bold text-rose-900">{turnoverKpis.criticalDismissals}</p>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {subTab === 'registros' && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-4 border-b border-slate-200 flex justify-between items-center">
            <h3 className="font-semibold text-slate-900">Registros de Rescisão</h3>
            <button onClick={onAdd} className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-lg transition-colors">
              <Plus className="h-4 w-4" /> Adicionar Rescisão
            </button>
          </div>
          {resignations.length === 0 ? (
            <div className="p-12 text-center text-slate-500">
              <AlertCircle className="h-12 w-12 mx-auto mb-4 text-slate-300" />
              <p>Nenhum desligamento registrado</p>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-600 uppercase">Colaborador</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-600 uppercase">Desligamento</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-600 uppercase">Setor</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-600 uppercase">Cargo</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-600 uppercase">Tipo</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-600 uppercase">Motivo</th>
                  <th className="text-right px-6 py-3 text-xs font-semibold text-slate-600 uppercase">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {resignations.map((r: any) => (
                  <tr key={r.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 font-medium text-slate-900">
                      <div className="flex items-center gap-1.5">
                        {r.isCritical && (
                          <span title="Desligamento de colaborador crítico 🔑">
                            <Key className="h-4 w-4 text-rose-500 flex-shrink-0" />
                          </span>
                        )}
                        {r.employeeName}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-700">{new Date(r.dismissalDate).toLocaleDateString('pt-BR')}</td>
                    <td className="px-6 py-4 text-slate-700">{r.sector?.name || '-'}</td>
                    <td className="px-6 py-4 text-slate-700">{r.position?.name || '-'}</td>
                    <td className="px-6 py-4 text-slate-700">{r.contractType}</td>
                    <td className="px-6 py-4 text-slate-700">{r.dismissalReason?.name || '-'}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <span title="Entrevista de desligamento">
                          <button
                            onClick={() => onOpenExitInterview(r)}
                            className="text-slate-400 hover:text-teal-600 transition-colors p-2"
                          >
                            <MessageSquare className="h-4 w-4" />
                          </button>
                        </span>
                        <span title="Remover">
                          <button onClick={() => onDelete(r.id)} className="text-red-600 hover:text-red-800 p-2">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* 🆕 Sprint B4: SUB-ABA ANÁLISES */}
      {subTab === 'analises' && (
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-teal-50 to-orange-50 p-6 rounded-xl border border-teal-200">
            <h3 className="text-lg font-bold text-teal-900 mb-2 flex items-center gap-2">
              <Brain className="h-5 w-5" />
              Análises de Entrevista de Desligamento
            </h3>
            <p className="text-sm text-teal-800">
              Motor de análise ({resignationsDash?.analyzedCount || 0} entrevistas analisadas em {year})
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <h4 className="text-lg font-bold text-slate-900 mb-4">Top Causas-raiz de Desligamento</h4>
            {(resignationsDash?.analyzedCount || 0) === 0 ? (
              <p className="text-slate-500 text-center py-8">
                Nenhuma entrevista analisada ainda. Conduza entrevistas na aba "Registros".
              </p>
            ) : (
              <div className="space-y-3">
                {resignationsDash?.topCauses?.map((cause: any) => (
                  <div key={cause.category} className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold text-slate-900">{cause.label}</span>
                      <span className="text-sm font-bold text-teal-700 bg-teal-100 px-3 py-1 rounded-full">
                        {cause.count} ocorrência(s)
                      </span>
                    </div>
                    <div className="mt-3 p-3 bg-amber-50 rounded border border-amber-200">
                      <p className="text-xs font-semibold text-amber-900 mb-2 flex items-center gap-1">
                        <Lightbulb className="h-3 w-3" /> Plano de ação sugerido:
                      </p>
                      <ul className="space-y-1">
                        {cause.actionPlan?.map((action: string, idx: number) => (
                          <li key={idx} className="text-sm text-amber-800 flex items-start gap-2">
                            <CheckCircle className="h-3 w-3 text-amber-600 mt-0.5 flex-shrink-0" />
                            {action}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {subTab === 'config' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Motivos de Desligamento</h3>
                <p className="text-sm text-slate-600">Motivos disponíveis para categorização</p>
              </div>
              <button
                onClick={async () => {
                  const name = prompt('Nome do motivo:');
                  if (name) {
                    await api.post('/turnover/reasons', { name });
                    toast.success('Motivo adicionado!');
                    window.location.reload();
                  }
                }}
                className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-lg"
              >
                <Plus className="h-4 w-4" /> Adicionar Novo
              </button>
            </div>
            <div className="space-y-2">
              {reasons.map((r: any) => (
                <div key={r.id} className="flex items-center justify-between p-3 border border-slate-200 rounded-lg">
                  <span className="font-medium text-slate-900">{r.name}</span>
                  <button
                    onClick={async () => {
                      await api.delete(`/turnover/reasons/${r.id}`);
                      toast.success('Motivo removido');
                      window.location.reload();
                    }}
                    className="text-red-600 hover:text-red-800"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Cargos</h3>
                <p className="text-sm text-slate-600">Cargos disponíveis para seleção</p>
              </div>
              <button
                onClick={async () => {
                  const name = prompt('Nome do cargo:');
                  if (name) {
                    await api.post('/turnover/positions', { name });
                    toast.success('Cargo adicionado!');
                    window.location.reload();
                  }
                }}
                className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-lg"
              >
                <Plus className="h-4 w-4" /> Adicionar Novo
              </button>
            </div>
            <div className="space-y-2">
              {positions.map((p: any) => (
                <div key={p.id} className="flex items-center justify-between p-3 border border-slate-200 rounded-lg">
                  <span className="font-medium text-slate-900">{p.name}</span>
                  <button
                    onClick={async () => {
                      await api.delete(`/turnover/positions/${p.id}`);
                      toast.success('Cargo removido');
                      window.location.reload();
                    }}
                    className="text-red-600 hover:text-red-800"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// =================================================================
// 🆕 SPRINT B2: LINHA DE SETOR VALIDADO
// =================================================================
function ValidatedSectorRow({ sector }: { sector: SectorDist }) {
  const statusColors = {
    OK: { bg: 'bg-green-500', text: 'text-green-700', pill: 'bg-green-100 text-green-800' },
    OVER: { bg: 'bg-amber-500', text: 'text-amber-700', pill: 'bg-amber-100 text-amber-800' },
    UNDER: { bg: 'bg-red-500', text: 'text-red-700', pill: 'bg-red-100 text-red-800' },
  };
  const c = statusColors[sector.status];
  const statusLabel = {
    OK: '✓ Dentro do ideal',
    OVER: `⚠ +${sector.delta.toFixed(1)} p.p. acima`,
    UNDER: `⚠ ${Math.abs(sector.delta).toFixed(1)} p.p. abaixo`,
  };

  return (
    <div className="p-3 bg-slate-50 rounded-lg">
      <div className="flex justify-between items-baseline mb-2">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-900">{sector.name}</span>
          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${c.pill}`}>
            {statusLabel[sector.status]}
          </span>
        </div>
        <div className="text-right">
          <span className="text-lg font-bold text-slate-900">{sector.current}</span>
          <span className="text-xs text-slate-500 ml-1">/ {sector.recommendedHeadcount} recomendado</span>
        </div>
      </div>

      <div className="relative h-7 bg-white rounded-md overflow-hidden border border-slate-200">
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-slate-400 z-10"
          style={{ left: `${Math.min(sector.recommendedPct * 2, 100)}%` }}
          title={`Recomendado: ${sector.recommendedPct}%`}
        />
        <div
          className={`h-full ${c.bg} transition-all flex items-center justify-end pr-2`}
          style={{ width: `${Math.min(sector.currentPct * 2, 100)}%` }}
        >
          {sector.currentPct > 3 && (
            <span className="text-xs font-bold text-white drop-shadow">{sector.currentPct}%</span>
          )}
        </div>
      </div>

      <div className="flex justify-between mt-1 text-xs text-slate-500">
        <span>{sector.current} pessoas ({sector.currentPct}%)</span>
        <span>Meta: {sector.recommendedPct}%</span>
      </div>
    </div>
  );
}

// =================================================================
// 🆕 SPRINT B2: BADGE DE STATUS
// =================================================================
function StatusBadge({ status, delta }: { status: 'OK' | 'OVER' | 'UNDER'; delta: number }) {
  const configs = {
    OK: { icon: Check, color: 'text-green-700 bg-green-100', label: '✓ OK' },
    OVER: { icon: AlertTriangle, color: 'text-amber-700 bg-amber-100', label: `+${delta.toFixed(1)}` },
    UNDER: { icon: AlertTriangle, color: 'text-red-700 bg-red-100', label: `${delta.toFixed(1)}` },
  };
  const cfg = configs[status];
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold ${cfg.color} mt-1`}>
      <Icon className="h-3 w-3" />
      {cfg.label}
    </span>
  );
}

// =================================================================
// 🧩 KPI CARD (genérico)
// =================================================================
function KpiCard({ icon: Icon, label, value, sublabel, extra, color }: any) {
  const colorMap: any = {
    teal: 'bg-teal-50 text-teal-600',
    orange: 'bg-orange-50 text-orange-600',
    green: 'bg-green-50 text-green-600',
    red: 'bg-red-50 text-red-600',
    slate: 'bg-slate-50 text-slate-600',
  };
  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
      <div className="flex items-center gap-3 mb-3">
        <div className={`p-2 rounded-lg ${colorMap[color]}`}>
          <Icon className="h-5 w-5" />
        </div>
        <span className="text-sm font-medium text-slate-600">{label}</span>
      </div>
      <div className="text-3xl font-bold text-slate-900">{value}</div>
      {sublabel && <p className="text-xs text-slate-500 mt-1">{sublabel}</p>}
      {extra}
    </div>
  );
}

// =================================================================
// 📝 MODAL: Editar Dados Mensais
// =================================================================
function EditMonthlyModal({ month, year, initialData, onClose, onSave }: any) {
  const [form, setForm] = useState({
    cltInitial: initialData?.cltInitial || 0,
    cltAdmissions: initialData?.cltAdmissions || 0,
    cltDismissals: initialData?.cltDismissals || 0,
    internInitial: initialData?.internInitial || 0,
    internAdmissions: initialData?.internAdmissions || 0,
    internDismissals: initialData?.internDismissals || 0,
    thirdInitial: initialData?.thirdInitial || 0,
    thirdAdmissions: initialData?.thirdAdmissions || 0,
    thirdDismissals: initialData?.thirdDismissals || 0,
    partnerInitial: initialData?.partnerInitial || 0,
    partnerAdmissions: initialData?.partnerAdmissions || 0,
    partnerDismissals: initialData?.partnerDismissals || 0,
  });

  const totalInitial = Number(form.cltInitial) + Number(form.internInitial) + Number(form.thirdInitial) + Number(form.partnerInitial);
  const totalAdmissions = Number(form.cltAdmissions) + Number(form.internAdmissions) + Number(form.thirdAdmissions) + Number(form.partnerAdmissions);
  const totalDismissals = Number(form.cltDismissals) + Number(form.internDismissals) + Number(form.thirdDismissals) + Number(form.partnerDismissals);
  const totalFinal = totalInitial + totalAdmissions - totalDismissals;
  const hcMedio = (totalInitial + totalFinal) / 2;
  const turnoverMes = hcMedio > 0 ? (totalDismissals / hcMedio) * 100 : 0;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-slate-200 sticky top-0 bg-white z-10">
          <h2 className="text-xl font-bold text-slate-900">Editar Dados - {months[month - 1]}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {contractTypes.map((ct) => (
            <div key={ct.key} className="space-y-3">
              <h3 className="font-semibold text-teal-700">{ct.label}</h3>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Equipe Inicial</label>
                  <input
                    type="number"
                    value={form[`${ct.key}Initial` as keyof typeof form]}
                    onChange={(e) => setForm({ ...form, [`${ct.key}Initial`]: parseInt(e.target.value) || 0 })}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Admissões</label>
                  <input
                    type="number"
                    value={form[`${ct.key}Admissions` as keyof typeof form]}
                    onChange={(e) => setForm({ ...form, [`${ct.key}Admissions`]: parseInt(e.target.value) || 0 })}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Demissões</label>
                  <input
                    type="number"
                    value={form[`${ct.key}Dismissals` as keyof typeof form]}
                    onChange={(e) => setForm({ ...form, [`${ct.key}Dismissals`]: parseInt(e.target.value) || 0 })}
                    className={inputClass}
                  />
                </div>
              </div>
            </div>
          ))}

          <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
            <h3 className="font-semibold text-slate-900 mb-3">Resumo Automático</h3>
            <div className="grid grid-cols-3 gap-4 mb-3">
              <div>
                <p className="text-xs text-slate-600">Equipe Final</p>
                <p className="text-lg font-bold text-slate-900">{totalFinal}</p>
              </div>
              <div>
                <p className="text-xs text-slate-600">Headcount Médio</p>
                <p className="text-lg font-bold text-slate-900">{hcMedio.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-xs text-slate-600">Turnover do Mês</p>
                <p className="text-lg font-bold text-teal-600">{turnoverMes.toFixed(2)}%</p>
              </div>
            </div>
            <div className="text-xs text-slate-500 space-y-1">
              <p><strong>Fórmula:</strong> Turnover = (Demissões / Headcount Médio) × 100</p>
              <p><strong>Cálculo:</strong> ({totalDismissals} / {hcMedio.toFixed(2)}) × 100 = {turnoverMes.toFixed(2)}%</p>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 p-6 border-t border-slate-200 sticky bottom-0 bg-white">
          <button onClick={onClose} className="px-4 py-2 text-slate-700 hover:bg-slate-100 rounded-lg">Cancelar</button>
          <button onClick={() => onSave(form)} className="px-6 py-2 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-lg">
            Salvar Alterações
          </button>
        </div>
      </div>
    </div>
  );
}

// =================================================================
// 📝 MODAL: Adicionar Rescisão (🆕 B3: checkbox "era crítico")
// =================================================================
function AddResignationModal({ reasons, positions, sectors, onClose, onSave }: any) {
  const [form, setForm] = useState({
    employeeName: '',
    admissionDate: '',
    dismissalDate: '',
    sectorId: '',
    cellId: '',
    contractType: 'CLT',
    positionId: '',
    dismissalReasonId: '',
    isCritical: false,
    observations: '',
  });

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <h2 className="text-xl font-bold text-slate-900">Adicionar Rescisão</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Nome do Colaborador *</label>
            <input
              type="text" value={form.employeeName}
              onChange={(e) => setForm({ ...form, employeeName: e.target.value })}
              className={inputClass} placeholder="Nome completo"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Data de Admissão *</label>
              <input type="date" value={form.admissionDate}
                onChange={(e) => setForm({ ...form, admissionDate: e.target.value })}
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Data de Desligamento *</label>
              <input type="date" value={form.dismissalDate}
                onChange={(e) => setForm({ ...form, dismissalDate: e.target.value })}
                className={inputClass}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Setor</label>
              <select value={form.sectorId}
                onChange={(e) => setForm({ ...form, sectorId: e.target.value })}
                className={inputClass}
              >
                <option value="">Selecionar setor</option>
                {sectors.map((s: any) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Tipo de Contrato</label>
              <select value={form.contractType}
                onChange={(e) => setForm({ ...form, contractType: e.target.value })}
                className={inputClass}
              >
                <option value="CLT">CLT</option>
                <option value="ESTAGIARIO">Estagiário</option>
                <option value="TERCEIRO">Terceiro</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Cargo</label>
            <select value={form.positionId}
              onChange={(e) => setForm({ ...form, positionId: e.target.value })}
              className={inputClass}
            >
              <option value="">Selecionar cargo</option>
              {positions.map((p: any) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Motivo de Desligamento</label>
            <select value={form.dismissalReasonId}
              onChange={(e) => setForm({ ...form, dismissalReasonId: e.target.value })}
              className={inputClass}
            >
              <option value="">Selecionar motivo</option>
              {reasons.map((r: any) => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </select>
          </div>

          {/* 🆕 Sprint B3: checkbox "era crítico?" */}
          <label className="flex items-center gap-3 cursor-pointer p-4 rounded-lg border-2 border-slate-200 hover:border-rose-300 hover:bg-rose-50 transition-colors">
            <input
              type="checkbox"
              checked={form.isCritical}
              onChange={(e) => setForm({ ...form, isCritical: e.target.checked })}
              className="rounded border-slate-300 text-rose-600 focus:ring-rose-500 w-5 h-5"
            />
            <div className="flex items-center gap-2">
              <Key className="h-5 w-5 text-rose-500" />
              <div>
                <p className="text-sm font-semibold text-slate-900">Era colaborador crítico 🔑?</p>
                <p className="text-xs text-slate-500">
                  Marca esta perda como crítica — alimenta o KPI de turnover de críticos.
                </p>
              </div>
            </div>
          </label>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Observações</label>
            <textarea value={form.observations}
              onChange={(e) => setForm({ ...form, observations: e.target.value })}
              rows={3} className={inputClass} placeholder="Observações adicionais..."
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 p-6 border-t border-slate-200">
          <button onClick={onClose} className="px-4 py-2 text-slate-700 hover:bg-slate-100 rounded-lg">Cancelar</button>
          <button
            onClick={() => onSave(form)}
            disabled={!form.employeeName || !form.admissionDate || !form.dismissalDate}
            className="px-6 py-2 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-lg disabled:opacity-50"
          >
            Salvar
          </button>
        </div>
      </div>
    </div>
  );
}

// =================================================================
// ⚙️ MODAL: Gerenciar Setores e Células
// =================================================================
function ManageSectorsModal({ sectors, onClose, onAdd, onDelete, onAddCell, onDeleteCell }: any) {
  const [newSector, setNewSector] = useState('');
  const [expandedSector, setExpandedSector] = useState<string | null>(null);
  const [newCellName, setNewCellName] = useState('');
  const [showOtherSectors, setShowOtherSectors] = useState(false);

  const otherSectors = [
    { name: 'Diretoria', count: 9 },
    { name: 'Administrativo', count: 8 },
    { name: 'Comercial', count: 7 },
    { name: 'Financeiro', count: 7 },
    { name: 'Atendimento', count: 4 },
    { name: 'Direção', count: 4 },
    { name: 'Controladoria', count: 3 },
  ];

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <h2 className="text-xl font-bold text-slate-900">Gerenciar Setores e Células</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="flex gap-2">
            <input
              type="text" value={newSector}
              onChange={(e) => setNewSector(e.target.value)}
              placeholder="Nome do novo setor..."
              className={inputClass + ' flex-1'}
            />
            <button
              onClick={() => {
                if (newSector.trim()) { onAdd(newSector.trim()); setNewSector(''); }
              }}
              className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-lg flex items-center gap-2"
            >
              <Plus className="h-4 w-4" /> Adicionar
            </button>
            <button
              onClick={() => setShowOtherSectors(!showOtherSectors)}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-lg flex items-center gap-2"
            >
              <Briefcase className="h-4 w-4" /> Setores de outras empresas (20)
            </button>
          </div>

          {showOtherSectors && (
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
              <p className="text-xs text-slate-600 mb-2 font-medium">Setores usados por outras empresas</p>
              <div className="space-y-1">
                {otherSectors.map((s) => (
                  <button
                    key={s.name}
                    onClick={() => { onAdd(s.name); setShowOtherSectors(false); }}
                    className="w-full flex items-center justify-between px-3 py-2 bg-white hover:bg-teal-50 rounded border border-slate-200 transition-colors"
                  >
                    <span className="text-sm font-medium text-slate-700">{s.name}</span>
                    <span className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded">{s.count} empresas</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <p className="text-xs text-slate-500">
            ℹ️ Setores com cadeado são obrigatórios e não podem ser removidos
          </p>

          <div className="space-y-2">
            {sectors.map((s: any) => (
              <div key={s.id} className="border border-slate-200 rounded-lg overflow-hidden">
                <div className="flex items-center justify-between p-3 bg-white hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-2 flex-1">
                    <button
                      onClick={() => setExpandedSector(expandedSector === s.id ? null : s.id)}
                      className="text-slate-400 hover:text-slate-600"
                    >
                      {expandedSector === s.id ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                    </button>
                    <span className="font-medium text-slate-900">{s.name}</span>
                    {s.mandatory && (
                      <span className="px-2 py-0.5 rounded-full text-xs bg-slate-100 text-slate-600">Obrigatório</span>
                    )}
                  </div>
                  {!s.mandatory && (
                    <button onClick={() => onDelete(s.id)} className="text-red-600 hover:text-red-800">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>

                {expandedSector === s.id && (
                  <div className="border-t border-slate-200 bg-slate-50 p-3">
                    <p className="text-xs font-medium text-slate-600 mb-2">Células de Trabalho</p>
                    <div className="flex gap-2 mb-3">
                      <input
                        type="text" value={newCellName}
                        onChange={(e) => setNewCellName(e.target.value)}
                        placeholder="Nome da célula..."
                        className={inputClass + ' flex-1 text-sm'}
                      />
                      <button
                        onClick={() => {
                          if (newCellName.trim()) { onAddCell(s.id, newCellName.trim()); setNewCellName(''); }
                        }}
                        className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white text-sm font-medium rounded-lg flex items-center gap-1"
                      >
                        <Plus className="h-3 w-3" /> Adicionar
                      </button>
                    </div>

                    {s.cells && s.cells.length > 0 ? (
                      <div className="space-y-1">
                        {s.cells.map((cell: any) => (
                          <div key={cell.id} className="flex items-center justify-between px-3 py-2 bg-white rounded border border-slate-200">
                            <span className="text-sm text-slate-700">{cell.name}</span>
                            <button onClick={() => onDeleteCell(s.id, cell.id)} className="text-red-600 hover:text-red-800">
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400 text-center py-2">Nenhuma célula cadastrada</p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
// =================================================================
// FIM: frontend/src/app/dashboard/turnover/page.tsx
// =================================================================