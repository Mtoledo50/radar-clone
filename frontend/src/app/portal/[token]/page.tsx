// =================================================================
// INÍCIO: frontend/src/app/portal/[token]/page.tsx
// =================================================================
/**
 *  Portal do Cliente — Hub de Transparência (Fase 4.2)
 * =================================================================
 * Interface pública para clientes acessarem:
 * - Visão Geral (KPIs + Tarefas)
 * - DRE Real do Mês (Receitas, Despesas, Resultado, Margem)
 * - Propostas Comerciais (histórico)
 * - Documentos (relatórios PDF)
 * 
 * Acesso via token único com expiração (90 dias).
 * Sem autenticação de admin — link direto enviado por email/WhatsApp.
 * =================================================================
 */
'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import api from '@/lib/axios';
import { toast } from 'sonner';
import {
  Building2,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileText,
  Download,
  Loader2,
  Shield,
  Calendar,
  Tag,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  Send,
  Eye,
  XCircle,
  CheckCircle,
  LayoutDashboard,
  BarChart3,
  FileSignature,
  FolderOpen,
  TrendingUp,
  TrendingDown,
  Percent,
} from 'lucide-react';

// =================================================================
// TIPOS
// =================================================================
interface Client {
  id: string;
  companyName: string;
  cnpj?: string;
  monthlyFee: number;
  status: string;
  startDate: string;
}

interface Task {
  id: string;
  title: string;
  status: string;
  priority: string;
  dueDate?: string;
  category?: string;
}

interface MonthlyReport {
  id: string;
  period: string;
  status: string;
  pdfPath?: string;
  summary?: any;
  createdAt: string;
}

interface Proposal {
  id: string;
  proposalNumber: string;
  slug: string;
  clientName: string;
  basePrice: number;
  status: string;
  sentAt?: string;
  closedAt?: string;
  version: number;
}

interface DreSummary {
  period: string;
  periodLabel: string;
  receitas: number;
  despesas: number;
  resultado: number;
  margem: number;
}

interface DashboardData {
  client: Client;
  tasks: Task[];
  monthlyReports: MonthlyReport[];
  proposals: Proposal[];
  dreSummary: DreSummary | null;
}

// =================================================================
// CONSTANTES DE CONFIGURAÇÃO VISUAL
// =================================================================
const STATUS_CONFIG: Record<string, { label: string; cls: string }> = {
  BACKLOG: { label: 'Backlog', cls: 'bg-slate-100 text-slate-700' },
  TODO: { label: 'A Fazer', cls: 'bg-blue-100 text-blue-700' },
  IN_PROGRESS: { label: 'Em Andamento', cls: 'bg-amber-100 text-amber-700' },
  REVIEW: { label: 'Revisão', cls: 'bg-purple-100 text-purple-700' },
  DONE: { label: 'Concluído', cls: 'bg-emerald-100 text-emerald-700' },
};

const PRIORITY_CONFIG: Record<string, { label: string; cls: string }> = {
  LOW: { label: 'Baixa', cls: 'bg-slate-200 text-slate-700' },
  MEDIUM: { label: 'Média', cls: 'bg-blue-200 text-blue-800' },
  HIGH: { label: 'Alta', cls: 'bg-orange-200 text-orange-800' },
  URGENT: { label: 'Urgente', cls: 'bg-red-200 text-red-800' },
};

const PROPOSAL_STATUS_CONFIG: Record<string, { label: string; cls: string; icon: any }> = {
  DRAFT: { label: 'Rascunho', cls: 'bg-slate-100 text-slate-700', icon: FileText },
  SENT: { label: 'Enviada', cls: 'bg-blue-100 text-blue-700', icon: Send },
  VIEWED: { label: 'Visualizada', cls: 'bg-amber-100 text-amber-700', icon: Eye },
  CLOSED_WON: { label: 'Fechada (Ganha)', cls: 'bg-emerald-100 text-emerald-700', icon: CheckCircle },
  CLOSED_LOST: { label: 'Perdida', cls: 'bg-red-100 text-red-700', icon: XCircle },
};

// =================================================================
// HELPERS DE FORMATAÇÃO
// =================================================================
const fmtBRL = (value: number) =>
  value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const fmtPercent = (value: number) =>
  `${value.toFixed(1)}%`;

// =================================================================
// COMPONENTE PRINCIPAL
// =================================================================
export default function ClientPortalPage() {
  const params = useParams();
  const token = params.token as string;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<DashboardData | null>(null);
  const [expiresAt, setExpiresAt] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'overview' | 'dre' | 'proposals' | 'documents'>('overview');

  useEffect(() => {
    loadPortal();
  }, [token]);

  async function loadPortal() {
    try {
      setLoading(true);
      setError(null);

      const [validateRes, dashboardRes] = await Promise.all([
        api.get(`/client-portal/validate/${token}`),
        api.get(`/client-portal/dashboard/${token}`),
      ]);

      setExpiresAt(validateRes.data.expiresAt);
      setData(dashboardRes.data);
    } catch (err: any) {
      setError(
        err.response?.data?.message || 'Portal indisponível. Entre em contato com seu contador.',
      );
    } finally {
      setLoading(false);
    }
  }

  // =================================================================
  // RENDER — Loading State
  // =================================================================
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-teal-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="animate-spin mx-auto text-teal-600" size={48} />
          <p className="text-slate-600 mt-4 font-medium">Carregando portal...</p>
        </div>
      </div>
    );
  }

  // =================================================================
  // RENDER — Error State
  // =================================================================
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-red-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl border border-red-200 p-8 max-w-md text-center">
          <div className="w-16 h-16 mx-auto rounded-full bg-red-100 flex items-center justify-center mb-4">
            <Shield className="h-8 w-8 text-red-600" />
          </div>
          <h1 className="text-xl font-bold text-slate-900 mb-2">Acesso Inválido</h1>
          <p className="text-slate-600 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const { client, tasks, monthlyReports, proposals, dreSummary } = data;

  // =================================================================
  // RENDER — Interface Principal com Abas
  // =================================================================
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-teal-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-400 to-orange-500 flex items-center justify-center font-bold text-white text-lg shadow-md">
              C
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-900">
                Conta <span className="text-orange-500">Certa</span>
              </h1>
              <p className="text-xs text-slate-500">Portal do Cliente</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-slate-500">Sessão válida até</p>
            <p className="text-sm font-medium text-slate-700">
              {new Date(expiresAt).toLocaleDateString('pt-BR')}
            </p>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8 space-y-6">
        {/* Card do Cliente */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">{client.companyName}</h2>
              {client.cnpj && (
                <p className="text-sm text-slate-500 mt-1">CNPJ: {client.cnpj}</p>
              )}
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-500 uppercase font-semibold">Honorário Mensal</p>
              <p className="text-2xl font-bold text-teal-600">
                {fmtBRL(client.monthlyFee)}
              </p>
            </div>
          </div>
        </div>

        {/* Sistema de Abas */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          {/* Tabs Header */}
          <div className="flex border-b border-slate-200 bg-slate-50">
            <TabButton
              active={activeTab === 'overview'}
              onClick={() => setActiveTab('overview')}
              icon={<LayoutDashboard size={16} />}
              label="Visão Geral"
            />
            <TabButton
              active={activeTab === 'dre'}
              onClick={() => setActiveTab('dre')}
              icon={<BarChart3 size={16} />}
              label="DRE do Mês"
            />
            <TabButton
              active={activeTab === 'proposals'}
              onClick={() => setActiveTab('proposals')}
              icon={<FileSignature size={16} />}
              label="Propostas"
            />
            <TabButton
              active={activeTab === 'documents'}
              onClick={() => setActiveTab('documents')}
              icon={<FolderOpen size={16} />}
              label="Documentos"
            />
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {/* ABA 1: VISÃO GERAL */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* KPIs */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <KPICard
                    label="Tarefas em Andamento"
                    value={tasks.filter((t) => t.status === 'IN_PROGRESS').length}
                    icon={<Clock size={20} />}
                    color="amber"
                  />
                  <KPICard
                    label="Tarefas Aguardando"
                    value={tasks.filter((t) => t.status === 'TODO' || t.status === 'BACKLOG').length}
                    icon={<Calendar size={20} />}
                    color="blue"
                  />
                  <KPICard
                    label="Documentos Disponíveis"
                    value={monthlyReports.length}
                    icon={<FileText size={20} />}
                    color="emerald"
                  />
                </div>

                {/* Tarefas */}
                <div>
                  <h3 className="font-bold text-slate-900 flex items-center gap-2 mb-4">
                    <CheckCircle2 className="h-5 w-5 text-teal-600" />
                    Tarefas em Andamento
                  </h3>
                  {tasks.length === 0 ? (
                    <div className="text-center py-8 bg-slate-50 rounded-xl">
                      <CheckCircle2 className="h-12 w-12 mx-auto mb-3 text-emerald-500/50" />
                      <p className="font-medium text-slate-700">Tudo em dia!</p>
                      <p className="text-sm text-slate-500">Nenhuma tarefa pendente no momento.</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {tasks.map((task) => {
                        const statusCfg = STATUS_CONFIG[task.status] || STATUS_CONFIG.TODO;
                        const prioCfg = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.MEDIUM;
                        const isOverdue =
                          task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'DONE';

                        return (
                          <div key={task.id} className="bg-slate-50 rounded-lg p-4 hover:bg-slate-100 transition-colors">
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1">
                                <h4 className="font-semibold text-slate-900">{task.title}</h4>
                                <div className="flex items-center gap-3 mt-2">
                                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusCfg.cls}`}>
                                    {statusCfg.label}
                                  </span>
                                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${prioCfg.cls}`}>
                                    {prioCfg.label}
                                  </span>
                                  {task.category && (
                                    <span className="text-xs text-slate-500 flex items-center gap-1">
                                      <Tag size={10} /> {task.category}
                                    </span>
                                  )}
                                </div>
                              </div>
                              {task.dueDate && (
                                <div className={`text-right ${isOverdue ? 'text-red-600' : 'text-slate-500'}`}>
                                  <p className="text-xs font-semibold uppercase">Prazo</p>
                                  <p className="text-sm font-medium">
                                    {new Date(task.dueDate).toLocaleDateString('pt-BR')}
                                  </p>
                                  {isOverdue && (
                                    <p className="text-xs flex items-center gap-1 mt-1">
                                      <AlertCircle size={10} /> Atrasada
                                    </p>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ABA 2: DRE REAL DO MÊS (Fase 4.2) */}
            {activeTab === 'dre' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-slate-900 flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-teal-600" />
                    DRE do Mês
                  </h3>
                  {dreSummary && (
                    <span className="text-sm text-slate-500 capitalize">
                      Referência: {dreSummary.periodLabel}
                    </span>
                  )}
                </div>

                {dreSummary ? (
                  <>
                    {/* Cards principais */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <DreCard
                        label="Receitas"
                        value={dreSummary.receitas}
                        icon={<ArrowUpRight className="h-5 w-5 text-emerald-600" />}
                        color="emerald"
                        trend="up"
                      />
                      <DreCard
                        label="Despesas"
                        value={dreSummary.despesas}
                        icon={<ArrowDownRight className="h-5 w-5 text-red-600" />}
                        color="red"
                        trend="down"
                      />
                      <DreCard
                        label="Resultado"
                        value={dreSummary.resultado}
                        icon={
                          dreSummary.resultado >= 0
                            ? <TrendingUp className="h-5 w-5 text-teal-600" />
                            : <TrendingDown className="h-5 w-5 text-red-600" />
                        }
                        color={dreSummary.resultado >= 0 ? 'teal' : 'red'}
                        trend={dreSummary.resultado >= 0 ? 'up' : 'down'}
                      />
                    </div>

                    {/* Card de Margem */}
                    <div className="bg-gradient-to-r from-teal-50 to-blue-50 rounded-xl border border-teal-200 p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-semibold text-slate-700 uppercase">Margem de Lucro</p>
                          <p className="text-3xl font-bold text-slate-900 mt-1">
                            {fmtPercent(dreSummary.margem)}
                          </p>
                          <p className="text-xs text-slate-500 mt-1">
                            {dreSummary.resultado >= 0
                              ? 'Resultado positivo sobre a receita'
                              : 'Resultado negativo — atenção ao controle de despesas'}
                          </p>
                        </div>
                        <div className="w-20 h-20 rounded-full bg-white/70 flex items-center justify-center">
                          <Percent className="h-10 w-10 text-teal-600" />
                        </div>
                      </div>

                      {/* Barra visual de proporção */}
                      <div className="mt-4">
                        <div className="flex justify-between text-xs text-slate-600 mb-1">
                          <span>Despesas</span>
                          <span>Receitas</span>
                        </div>
                        <div className="w-full h-3 bg-red-200 rounded-full overflow-hidden flex">
                          <div
                            className="h-full bg-red-500 transition-all"
                            style={{
                              width: `${dreSummary.receitas > 0 ? (dreSummary.despesas / dreSummary.receitas) * 100 : 0}%`,
                            }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Detalhamento */}
                    <div className="bg-slate-50 rounded-xl p-4 space-y-2">
                      <div className="flex justify-between items-center py-2 border-b border-slate-200">
                        <span className="text-sm font-medium text-slate-700">Receitas Brutas</span>
                        <span className="text-sm font-bold text-emerald-700">{fmtBRL(dreSummary.receitas)}</span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-slate-200">
                        <span className="text-sm font-medium text-slate-700">(-) Despesas</span>
                        <span className="text-sm font-bold text-red-700">- {fmtBRL(dreSummary.despesas)}</span>
                      </div>
                      <div className="flex justify-between items-center py-2">
                        <span className="text-sm font-bold text-slate-900">= Resultado do Exercício</span>
                        <span className={`text-lg font-bold ${dreSummary.resultado >= 0 ? 'text-teal-700' : 'text-red-700'}`}>
                          {fmtBRL(dreSummary.resultado)}
                        </span>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-12 bg-slate-50 rounded-xl">
                    <BarChart3 className="h-12 w-12 mx-auto mb-3 text-slate-300" />
                    <p className="font-medium text-slate-700">DRE não disponível</p>
                    <p className="text-sm text-slate-500 mt-1">
                      Os dados contábeis do mês aparecerão aqui quando processados.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* ABA 3: PROPOSTAS */}
            {activeTab === 'proposals' && (
              <div className="space-y-6">
                <h3 className="font-bold text-slate-900 flex items-center gap-2">
                  <FileSignature className="h-5 w-5 text-teal-600" />
                  Propostas Comerciais
                </h3>
                {proposals.length === 0 ? (
                  <div className="text-center py-12 bg-slate-50 rounded-xl">
                    <FileSignature className="h-12 w-12 mx-auto mb-3 text-slate-300" />
                    <p className="font-medium text-slate-700">Nenhuma proposta enviada</p>
                    <p className="text-sm text-slate-500">
                      As propostas comerciais aparecerão aqui quando enviadas.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {proposals.map((proposal) => {
                      const statusCfg = PROPOSAL_STATUS_CONFIG[proposal.status] || PROPOSAL_STATUS_CONFIG.DRAFT;
                      const StatusIcon = statusCfg.icon;
                      return (
                        <div key={proposal.id} className="bg-slate-50 rounded-lg p-4 hover:bg-slate-100 transition-colors">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <StatusIcon className="h-4 w-4 text-slate-600" />
                                <h4 className="font-semibold text-slate-900">
                                  Proposta #{proposal.proposalNumber}
                                </h4>
                                <span className="text-xs text-slate-500">v{proposal.version}</span>
                              </div>
                              <p className="text-sm text-slate-600 mb-2">{proposal.clientName}</p>
                              <div className="flex items-center gap-3">
                                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusCfg.cls}`}>
                                  {statusCfg.label}
                                </span>
                                {proposal.sentAt && (
                                  <span className="text-xs text-slate-500">
                                    Enviada em {new Date(proposal.sentAt).toLocaleDateString('pt-BR')}
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-xs text-slate-500 uppercase font-semibold">Valor</p>
                              <p className="text-lg font-bold text-teal-600">
                                {fmtBRL(proposal.basePrice)}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* ABA 4: DOCUMENTOS */}
            {activeTab === 'documents' && (
              <div className="space-y-6">
                <h3 className="font-bold text-slate-900 flex items-center gap-2">
                  <FolderOpen className="h-5 w-5 text-teal-600" />
                  Relatórios Mensais
                </h3>
                {monthlyReports.length === 0 ? (
                  <div className="text-center py-12 bg-slate-50 rounded-xl">
                    <FolderOpen className="h-12 w-12 mx-auto mb-3 text-slate-300" />
                    <p className="font-medium text-slate-700">Nenhum documento disponível</p>
                    <p className="text-sm text-slate-500">
                      Os relatórios mensais aparecerão aqui quando gerados.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {monthlyReports.map((report) => (
                      <div key={report.id} className="bg-slate-50 rounded-lg p-4 hover:bg-slate-100 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
                              <FileText className="h-5 w-5 text-red-600" />
                            </div>
                            <div>
                              <h4 className="font-semibold text-slate-900">
                                Relatório {report.period}
                              </h4>
                              <p className="text-xs text-slate-500">
                                Gerado em {new Date(report.createdAt).toLocaleDateString('pt-BR')}
                              </p>
                            </div>
                          </div>
                          {report.status === 'READY' && report.pdfPath && (
                            <button
                              onClick={() => window.open(report.pdfPath, '_blank')}
                              className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-sm font-medium rounded-lg transition-colors"
                            >
                              <Download size={14} /> Baixar PDF
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <footer className="text-center py-6 text-xs text-slate-500">
          <p>Portal seguro • Conta Certa Soluções Empresariais</p>
          <p className="mt-1">Em caso de dúvidas, entre em contato com seu contador.</p>
        </footer>
      </main>
    </div>
  );
}

// =================================================================
// COMPONENTES AUXILIARES
// =================================================================

function TabButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-6 py-3 text-sm font-medium transition-colors ${
        active
          ? 'bg-white text-teal-700 border-b-2 border-teal-600'
          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

function KPICard({
  label,
  value,
  icon,
  color,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  color: string;
}) {
  const colors: Record<string, string> = {
    slate: 'bg-slate-50 border-slate-200 text-slate-700',
    teal: 'bg-teal-50 border-teal-200 text-teal-700',
    amber: 'bg-amber-50 border-amber-200 text-amber-700',
    emerald: 'bg-emerald-50 border-emerald-200 text-emerald-700',
    red: 'bg-red-50 border-red-200 text-red-700',
    blue: 'bg-blue-50 border-blue-200 text-blue-700',
  };

  return (
    <div className={`p-5 rounded-xl border ${colors[color] || colors.slate}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold uppercase">{label}</span>
        {icon}
      </div>
      <p className="text-3xl font-bold">{value}</p>
    </div>
  );
}

function DreCard({
  label,
  value,
  icon,
  color,
  trend,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  color: string;
  trend: 'up' | 'down';
}) {
  const colors: Record<string, string> = {
    emerald: 'bg-emerald-50 border-emerald-200',
    red: 'bg-red-50 border-red-200',
    teal: 'bg-teal-50 border-teal-200',
  };

  return (
    <div className={`p-6 rounded-xl border ${colors[color]}`}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-semibold text-slate-700">{label}</span>
        {icon}
      </div>
      <p className="text-2xl font-bold text-slate-900">
        {fmtBRL(value)}
      </p>
      <div className="flex items-center gap-1 mt-2">
        {trend === 'up' ? (
          <TrendingUp className="h-3 w-3 text-emerald-600" />
        ) : (
          <TrendingDown className="h-3 w-3 text-red-600" />
        )}
        <span className={`text-xs font-medium ${trend === 'up' ? 'text-emerald-600' : 'text-red-600'}`}>
          {trend === 'up' ? 'Entrada' : 'Saída'}
        </span>
      </div>
    </div>
  );
}
// =================================================================
// FIM: frontend/src/app/portal/[token]/page.tsx
// =================================================================