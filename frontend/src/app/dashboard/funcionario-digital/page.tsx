'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { 
  Bot, Play, Pause, CheckCircle, XCircle, Clock, 
  TrendingUp, AlertTriangle, ShieldCheck, Loader2, RefreshCw 
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import api from '@/lib/axios';

// =================================================================
// 📦 TIPOS (Alinhados ao Schema Prisma da Aurora)
// =================================================================
type AuroraStatus = 'ACTIVE' | 'PAUSED';

type Skill = {
  id: string;
  skillKey: string;
  enabled: boolean;
  cronExpr: string;
  autonomy: 'AUTO' | 'REVIEW' | 'MANUAL';
  lastRunAt: string | null;
};

type PendingItem = {
  id: string;
  type: string; // ex: 'RECONCILIATION', 'CLASSIFICATION'
  confidence: number | null;
  payload: any;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: string;
};

type DashboardMetrics = {
  runsToday: number;
  itemsAutoApproved: number;
  itemsPendingHuman: number;
  secondsSaved: number;
};

// =================================================================
// 🎨 COMPONENTE PRINCIPAL
// =================================================================
export default function AuroraDashboardPage() {
  const router = useRouter();
  const { user } = useAuthStore();

  const [loading, setLoading] = useState(true);
  const [auroraStatus, setAuroraStatus] = useState<AuroraStatus>('ACTIVE');
  const [metrics, setMetrics] = useState<DashboardMetrics>({ runsToday: 0, itemsAutoApproved: 0, itemsPendingHuman: 0, secondsSaved: 0 });
  const [skills, setSkills] = useState<Skill[]>([]);
  const [pendings, setPendings] = useState<PendingItem[]>([]);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // =================================================================
  // 🔄 CARREGAMENTO INICIAL
  // =================================================================
  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // Nota: Ajuste as rotas conforme a implementação exata do seu DigitalEmployeeController
      const [metricsRes, skillsRes, pendingsRes] = await Promise.all([
        api.get('/digital-employee/dashboard/metrics').catch(() => ({ data: { runsToday: 0, itemsAutoApproved: 0, itemsPendingHuman: 0, secondsSaved: 0 } })),
        api.get('/digital-employee/skills').catch(() => ({ data: [] })),
        api.get('/digital-employee/pending').catch(() => ({ data: [] }))
      ]);

      setMetrics(metricsRes.data);
      setSkills(skillsRes.data);
      setPendings(pendingsRes.data.filter((p: PendingItem) => p.status === 'PENDING'));
    } catch (error) {
      toast.error('Falha ao carregar dados da Aurora.');
    } finally {
      setLoading(false);
    }
  };

  // =================================================================
  // ⚡ AÇÕES
  // =================================================================
  const toggleSkill = async (skillId: string, currentEnabled: boolean) => {
    try {
      await api.patch(`/digital-employee/skills/${skillId}`, { enabled: !currentEnabled });
      toast.success(`Skill ${!currentEnabled ? 'ativada' : 'pausada'} com sucesso.`);
      fetchDashboardData();
    } catch (error) {
      toast.error('Erro ao alterar status da skill.');
    }
  };

  const runSkillNow = async (skillKey: string) => {
    setActionLoading(skillKey);
    try {
      await api.post(`/digital-employee/skills/${skillKey}/run`);
      toast.success(`Execução da skill ${skillKey} iniciada em segundo plano.`);
      setTimeout(fetchDashboardData, 2000); // Atualiza após 2s
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erro ao executar skill.');
    } finally {
      setActionLoading(null);
    }
  };

  const handlePendingAction = async (pendingId: string, decision: 'APPROVED' | 'REJECTED') => {
    setActionLoading(pendingId);
    try {
      await api.patch(`/digital-employee/pending/${pendingId}/resolve`, { decision });
      toast.success(decision === 'APPROVED' ? 'Aprovado com sucesso!' : 'Rejeitado com sucesso.');
      
      // Remove localmente para UX instantânea
      setPendings(prev => prev.filter(p => p.id !== pendingId));
      setMetrics(prev => ({
        ...prev,
        itemsPendingHuman: Math.max(0, prev.itemsPendingHuman - 1)
      }));
    } catch (error) {
      toast.error('Erro ao processar a decisão.');
    } finally {
      setActionLoading(null);
    }
  };

  // =================================================================
  // 🎨 RENDERIZAÇÃO
  // =================================================================
  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="animate-spin text-[#0d9488]" size={48} />
        <span className="ml-3 text-slate-600 font-medium">Acordando a Aurora...</span>
      </div>
    );
  }

  const formatTimeSaved = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    const mins = Math.floor(seconds / 60);
    if (mins < 60) return `${mins}min`;
    const hours = Math.floor(mins / 60);
    return `${hours}h ${mins % 60}min`;
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* HEADER DA AURORA */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-[#0d9488] to-[#0f766e] p-6 rounded-2xl text-white shadow-lg">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-3xl shadow-inner">
            🌅
          </div>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              Funcionário Digital (Aurora)
              <span className={`text-xs px-2 py-1 rounded-full font-bold uppercase tracking-wider ${auroraStatus === 'ACTIVE' ? 'bg-emerald-400/20 text-emerald-100' : 'bg-amber-400/20 text-amber-100'}`}>
                {auroraStatus === 'ACTIVE' ? 'Trabalhando' : 'Em Pausa'}
              </span>
            </h1>
            <p className="text-teal-100 text-sm mt-1 max-w-xl">
              A Aurora executa rotinas de conciliação, classificação e ponte contábil automaticamente. 
              <span className="font-semibold text-[#f97316]"> Regra de Ouro:</span> Ações legais sempre exigem sua aprovação.
            </p>
          </div>
        </div>
        <button 
          onClick={() => {
            setAuroraStatus(prev => prev === 'ACTIVE' ? 'PAUSED' : 'ACTIVE');
            toast.info(`Aurora ${auroraStatus === 'ACTIVE' ? 'pausada' : 'retomada'}.`);
          }}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-semibold transition-all shadow-md ${
            auroraStatus === 'ACTIVE' 
              ? 'bg-white/10 hover:bg-white/20 text-white border border-white/20' 
              : 'bg-[#f97316] hover:bg-orange-600 text-white'
          }`}
        >
          {auroraStatus === 'ACTIVE' ? <Pause size={18} /> : <Play size={18} />}
          {auroraStatus === 'ACTIVE' ? 'Pausar Automações' : 'Retomar Automações'}
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard 
          icon={<RefreshCw className="text-blue-600" />} 
          label="Execuções Hoje" 
          value={metrics.runsToday.toString()} 
          subtext="Crons e manuais"
        />
        <KPICard 
          icon={<CheckCircle className="text-emerald-600" />} 
          label="Auto-Aprovados" 
          value={metrics.itemsAutoApproved.toString()} 
          subtext="Confiança ≥ 80%"
        />
        <KPICard 
          icon={<AlertTriangle className="text-amber-600" />} 
          label="Pendentes de Revisão" 
          value={metrics.itemsPendingHuman.toString()} 
          subtext="Aguardando sua decisão"
          highlight={metrics.itemsPendingHuman > 0}
        />
        <KPICard 
          icon={<TrendingUp className="text-[#0d9488]" />} 
          label="Tempo Economizado" 
          value={formatTimeSaved(metrics.secondsSaved)} 
          subtext="Desde o início do mês"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* COLUNA ESQUERDA: SKILLS (2/3 da tela) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
              <Bot size={20} className="text-[#0d9488]" /> Habilidades Configuradas
            </h2>
            <div className="space-y-3">
              {skills.length === 0 ? (
                <p className="text-slate-500 text-center py-8">Nenhuma skill configurada ainda.</p>
              ) : (
                skills.map((skill) => (
                  <div key={skill.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-100 hover:border-[#0d9488]/30 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className={`w-2 h-10 rounded-full ${skill.enabled ? 'bg-[#0d9488]' : 'bg-slate-300'}`} />
                      <div>
                        <h3 className="font-semibold text-slate-800">{skill.skillKey.replace('_', ' ')}</h3>
                        <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                          <Clock size={12} /> Cron: <span className="font-mono bg-slate-200 px-1.5 py-0.5 rounded">{skill.cronExpr}</span>
                          <span className="mx-1">•</span>
                          Autonomia: 
                          <span className={`font-medium ${skill.autonomy === 'AUTO' ? 'text-emerald-600' : skill.autonomy === 'REVIEW' ? 'text-amber-600' : 'text-slate-600'}`}>
                            {skill.autonomy}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => runSkillNow(skill.skillKey)}
                        disabled={actionLoading === skill.skillKey || !skill.enabled}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-[#0d9488] bg-teal-50 hover:bg-teal-100 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {actionLoading === skill.skillKey ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} />}
                        Rodar Agora
                      </button>
                      <button
                        onClick={() => toggleSkill(skill.id, skill.enabled)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${skill.enabled ? 'bg-[#0d9488]' : 'bg-slate-300'}`}
                      >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${skill.enabled ? 'translate-x-6' : 'translate-x-1'}`} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* COLUNA DIREITA: FILA DE APROVAÇÃO (1/3 da tela) */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col h-full max-h-[600px]">
          <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
            <ShieldCheck size={20} className="text-[#f97316]" /> Fila de Revisão 🟡
          </h2>
          
          <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
            {pendings.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 text-slate-400 text-center">
                <CheckCircle size={40} className="mb-2 text-emerald-500/50" />
                <p className="font-medium">Tudo em dia!</p>
                <p className="text-sm">Nenhuma pendência aguardando sua revisão.</p>
              </div>
            ) : (
              pendings.map((pending) => (
                <div key={pending.id} className="p-4 bg-amber-50/50 border border-amber-200 rounded-lg space-y-3">
                  <div className="flex justify-between items-start">
                    <span className="text-xs font-bold uppercase tracking-wider text-amber-800 bg-amber-200/50 px-2 py-0.5 rounded">
                      {pending.type}
                    </span>
                    <span className="text-xs font-mono text-slate-500">
                      {new Date(pending.createdAt).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                  
                  <div className="text-sm text-slate-700">
                    <p className="font-medium mb-1">Confiança do Motor:</p>
                    <div className="w-full bg-slate-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${pending.confidence && pending.confidence >= 80 ? 'bg-emerald-500' : 'bg-amber-500'}`} 
                        style={{ width: `${pending.confidence || 0}%` }}
                      />
                    </div>
                    <p className="text-right text-xs mt-1 text-slate-500">{pending.confidence || 0}%</p>
                  </div>

                  <div className="flex gap-2 pt-2 border-t border-amber-200/50">
                    <button
                      onClick={() => handlePendingAction(pending.id, 'APPROVED')}
                      disabled={actionLoading === pending.id}
                      className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-md transition-colors disabled:opacity-50"
                    >
                      {actionLoading === pending.id ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={14} />}
                      Aprovar
                    </button>
                    <button
                      onClick={() => handlePendingAction(pending.id, 'REJECTED')}
                      disabled={actionLoading === pending.id}
                      className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-white border border-slate-300 hover:bg-red-50 hover:text-red-600 hover:border-red-200 text-slate-700 text-sm font-medium rounded-md transition-colors disabled:opacity-50"
                    >
                      <XCircle size={14} />
                      Rejeitar
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// =================================================================
// 🧩 SUB-COMPONENTE: KPI CARD
// =================================================================
function KPICard({ icon, label, value, subtext, highlight = false }: { icon: React.ReactNode, label: string, value: string, subtext: string, highlight?: boolean }) {
  return (
    <div className={`bg-white p-5 rounded-xl border transition-all ${highlight ? 'border-amber-300 shadow-md ring-1 ring-amber-100' : 'border-slate-200 shadow-sm hover:shadow-md'}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <h3 className="text-3xl font-bold text-slate-800 mt-1">{value}</h3>
        </div>
        <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
          {icon}
        </div>
      </div>
      <p className="text-xs text-slate-400 mt-3 flex items-center gap-1">
        {subtext}
      </p>
    </div>
  );
}