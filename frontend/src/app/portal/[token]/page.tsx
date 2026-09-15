// ============================================================================
// SPRINT F18-B + F18-B.1 + F18-B.2 — Portal do Cliente (ADR-121/122)
// ----------------------------------------------------------------------------
// Página pública (sem login). Seções Tarefas/Propostas viram vitrine
// "🔜 implementação futura" quando as flags do cliente estão OFF.
// Master OFF → tela de "acesso não liberado".
// ============================================================================
'use client';

import { useEffect, useState, cloneElement } from 'react';
import { useParams } from 'next/navigation';
import {
  CheckCircle2,
  Clock,
  AlertCircle,
  FileText,
  Download,
  Loader2,
  Shield,
  Calendar,
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
  Mail,
  Sparkles,
} from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

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
  createdAt: string;
}

interface Proposal {
  id: string;
  proposalNumber: string;
  clientName: string;
  basePrice: number;
  status: string;
  sentAt?: string;
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

interface DocumentoEnviado {
  id: string;
  tipo: 'EMAIL_ENVIO';
  assunto: string;
  enviadoEm: string;
  linkExpiraEm: string | null;
  nomeArquivo: string;
  tamanhoBytes: number;
  mime: string;
  setor: string;
  aberto: boolean;
  baixado: boolean;
  expirado: boolean;
}

interface DashboardData {
  client: Client;
  tasks: Task[];
  monthlyReports: MonthlyReport[];
  proposals: Proposal[];
  dreSummary: DreSummary | null;
  documentosEnviados: DocumentoEnviado[];
  mostrarTarefas: boolean; // 🆕 F18-B.2
  mostrarPropostas: boolean; // 🆕 F18-B.2
}

// =================================================================
// CONFIG VISUAL
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

const SETOR_COLOR: Record<string, string> = {
  Fiscal: 'bg-blue-100 text-blue-700',
  'Contábil': 'bg-purple-100 text-purple-700',
  Pessoal: 'bg-pink-100 text-pink-700',
  Legalização: 'bg-amber-100 text-amber-700',
  BPO: 'bg-emerald-100 text-emerald-700',
};

// =================================================================
// HELPERS
// =================================================================
const fmtBRL = (value: number) =>
  value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const fmtPercent = (value: number) => `${value.toFixed(1)}%`;
const fmtData = (iso: string) =>
  new Date(iso).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
const fmtTamanho = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

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

  // fetch puro (sem axios/JWT) — página 100% pública
  async function loadPortal() {
    try {
      setLoading(true);
      setError(null);

      const [validateRes, dashboardRes] = await Promise.all([
        fetch(`${API_URL}/api/client-portal/validate/${token}`),
        fetch(`${API_URL}/api/client-portal/dashboard/${token}`),
      ]);

      if (!validateRes.ok || !dashboardRes.ok) {
        const body = await validateRes.json().catch(() => null);
        throw new Error(
          body?.message || 'Token inválido ou expirado. Solicite novo link ao escritório.',
        );
      }

      const validate = await validateRes.json();
      const dashboard = await dashboardRes.json();

      setExpiresAt(validate.expiresAt);
      setData(dashboard);
    } catch (err: any) {
      setError(err?.message || 'Portal indisponível. Entre em contato com seu contador.');
    } finally {
      setLoading(false);
    }
  }

  const baixarDocumento = (doc: DocumentoEnviado) => {
    window.open(`${API_URL}/api/client-portal/documentos/${token}/${doc.id}`, '_blank');
  };

  // =================================================================
  // LOADING / ERROR
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

  const { client, tasks, monthlyReports, proposals, dreSummary, documentosEnviados } = data;
  const mostrarTarefas = data.mostrarTarefas === true; // 🆕 F18-B.2
  const mostrarPropostas = data.mostrarPropostas === true; // 🆕 F18-B.2

  // =================================================================
  // RENDER
  // =================================================================
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-teal-50">
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
              <p className="text-2xl font-bold text-teal-600">{fmtBRL(client.monthlyFee)}</p>
            </div>
          </div>
        </div>

        {/* Abas */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="flex border-b border-slate-200 bg-slate-50">
            <TabButton active={activeTab === 'overview'} onClick={() => setActiveTab('overview')}
              icon={<LayoutDashboard size={16} />} label="Visão Geral" />
            <TabButton active={activeTab === 'dre'} onClick={() => setActiveTab('dre')}
              icon={<BarChart3 size={16} />} label="DRE do Mês" />
            <TabButton active={activeTab === 'proposals'} onClick={() => setActiveTab('proposals')}
              icon={<FileSignature size={16} />} label="Propostas" />
            <TabButton active={activeTab === 'documents'} onClick={() => setActiveTab('documents')}
              icon={<FolderOpen size={16} />} label="Documentos" />
          </div>

          <div className="p-6">
            {/* ============ ABA: VISÃO GERAL ============ */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <KPICard label="Documentos Disponíveis"
                    value={documentosEnviados.length + monthlyReports.length}
                    icon={<FileText size={20} />} color="emerald" />
                  <KPICard label="Guias Enviadas"
                    value={documentosEnviados.length}
                    icon={<Mail size={20} />} color="blue" />
                  <KPICard label="Relatórios Mensais"
                    value={monthlyReports.length}
                    icon={<FolderOpen size={20} />} color="teal" />
                </div>

                {/* 🆕 F18-B.2: tarefas reais OU teaser */}
                {mostrarTarefas ? (
                  <div>
                    <h3 className="font-bold text-slate-900 flex items-center gap-2 mb-4">
                      <CheckCircle2 className="h-5 w-5 text-teal-600" />
                      Tarefas em Andamento
                    </h3>
                    {tasks.length === 0 ? (
                      <EmptyState icon={<CheckCircle2 />} title="Tudo em dia!"
                        desc="Nenhuma tarefa pendente no momento." />
                    ) : (
                      <div className="space-y-2">
                        {tasks.map((task) => {
                          const statusCfg = STATUS_CONFIG[task.status] || STATUS_CONFIG.TODO;
                          const prioCfg = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.MEDIUM;
                          const isOverdue =
                            task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'DONE';
                          return (
                            <div key={task.id} className="bg-slate-50 rounded-lg p-4">
                              <div className="flex items-start justify-between gap-4">
                                <div className="flex-1">
                                  <h4 className="font-semibold text-slate-900">{task.title}</h4>
                                  <div className="flex items-center gap-3 mt-2 flex-wrap">
                                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusCfg.cls}`}>
                                      {statusCfg.label}
                                    </span>
                                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${prioCfg.cls}`}>
                                      {prioCfg.label}
                                    </span>
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
                ) : (
                  <TeaserCard
                    titulo="Acompanhamento de Tarefas em Tempo Real"
                    desc="Em breve você poderá acompanhar aqui o andamento de cada tarefa do seu escritório, com prazos e responsáveis."
                  />
                )}
              </div>
            )}

            {/* ============ ABA: DRE DO MÊS ============ */}
            {activeTab === 'dre' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-slate-900 flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-teal-600" /> DRE do Mês
                  </h3>
                  {dreSummary && (
                    <span className="text-sm text-slate-500 capitalize">
                      Referência: {dreSummary.periodLabel}
                    </span>
                  )}
                </div>

                {dreSummary ? (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <DreCard label="Receitas" value={dreSummary.receitas}
                        icon={<ArrowUpRight className="h-5 w-5 text-emerald-600" />}
                        color="emerald" trend="up" />
                      <DreCard label="Despesas" value={dreSummary.despesas}
                        icon={<ArrowDownRight className="h-5 w-5 text-red-600" />}
                        color="red" trend="down" />
                      <DreCard label="Resultado" value={dreSummary.resultado}
                        icon={dreSummary.resultado >= 0
                          ? <TrendingUp className="h-5 w-5 text-teal-600" />
                          : <TrendingDown className="h-5 w-5 text-red-600" />}
                        color={dreSummary.resultado >= 0 ? 'teal' : 'red'}
                        trend={dreSummary.resultado >= 0 ? 'up' : 'down'} />
                    </div>

                    <div className="bg-gradient-to-r from-teal-50 to-blue-50 rounded-xl border border-teal-200 p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-semibold text-slate-700 uppercase">Margem de Lucro</p>
                          <p className="text-3xl font-bold text-slate-900 mt-1">{fmtPercent(dreSummary.margem)}</p>
                        </div>
                        <Percent className="h-10 w-10 text-teal-600" />
                      </div>
                    </div>

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
                  <EmptyState icon={<BarChart3 />} title="DRE não disponível"
                    desc="Os dados contábeis do mês aparecerão aqui quando processados." />
                )}
              </div>
            )}

            {/* ============ ABA: PROPOSTAS (🆕 F18-B.2: reais OU teaser) ============ */}
            {activeTab === 'proposals' && (
              <div className="space-y-6">
                <h3 className="font-bold text-slate-900 flex items-center gap-2">
                  <FileSignature className="h-5 w-5 text-teal-600" /> Propostas Comerciais
                </h3>
                {mostrarPropostas ? (
                  proposals.length === 0 ? (
                    <EmptyState icon={<FileSignature />} title="Nenhuma proposta enviada"
                      desc="As propostas comerciais aparecerão aqui quando enviadas." />
                  ) : (
                    <div className="space-y-3">
                      {proposals.map((proposal) => {
                        const statusCfg = PROPOSAL_STATUS_CONFIG[proposal.status] || PROPOSAL_STATUS_CONFIG.DRAFT;
                        const StatusIcon = statusCfg.icon;
                        return (
                          <div key={proposal.id} className="bg-slate-50 rounded-lg p-4">
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
                                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusCfg.cls}`}>
                                  {statusCfg.label}
                                </span>
                              </div>
                              <div className="text-right">
                                <p className="text-xs text-slate-500 uppercase font-semibold">Valor</p>
                                <p className="text-lg font-bold text-teal-600">{fmtBRL(proposal.basePrice)}</p>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )
                ) : (
                  <TeaserCard
                    titulo="Propostas Comerciais Online"
                    desc="Em breve: consulte propostas, valores e histórico de contratação direto no portal, sem papel."
                  />
                )}
              </div>
            )}

            {/* ============ ABA: DOCUMENTOS (2 seções) ============ */}
            {activeTab === 'documents' && (
              <div className="space-y-8">
                <section>
                  <h3 className="font-bold text-slate-900 flex items-center gap-2 mb-2">
                    <Mail className="h-5 w-5 text-teal-600" />
                    Guias e Documentos Enviadas
                    <span className="ml-1 text-xs bg-teal-100 text-teal-700 px-2 py-0.5 rounded-full font-medium">
                      {documentosEnviados.length}
                    </span>
                  </h3>
                  <p className="text-sm text-slate-500 mb-4">
                    DAS, DARF, balancetes e demais documentos enviados pelo escritório nos últimos 24 meses.
                  </p>

                  {documentosEnviados.length === 0 ? (
                    <EmptyState icon={<Mail />} title="Nenhuma guia enviada"
                      desc="Quando o escritório enviar uma guia (DAS, DARF, etc.), ela aparecerá aqui para download." />
                  ) : (
                    <div className="space-y-2">
                      {documentosEnviados.map((doc) => {
                        const setorCls = SETOR_COLOR[doc.setor] || 'bg-slate-100 text-slate-700';
                        return (
                          <div
                            key={doc.id}
                            className={`bg-white border rounded-lg p-4 transition-all hover:shadow-md ${
                              doc.expirado ? 'border-slate-200 opacity-60' : 'border-slate-200'
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              <div className="w-12 h-12 rounded-lg bg-red-50 flex items-center justify-center flex-shrink-0">
                                <FileText className="h-6 w-6 text-red-600" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="font-semibold text-slate-900 truncate">{doc.assunto}</h4>
                                <div className="flex flex-wrap gap-2 mt-1 text-xs text-slate-500">
                                  <span className="font-mono">{doc.nomeArquivo}</span>
                                  <span>•</span>
                                  <span>{fmtTamanho(doc.tamanhoBytes)}</span>
                                  <span>•</span>
                                  <span>{fmtData(doc.enviadoEm)}</span>
                                </div>
                                <div className="flex flex-wrap gap-1 mt-2">
                                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${setorCls}`}>
                                    {doc.setor}
                                  </span>
                                  {doc.baixado && (
                                    <span className="px-2 py-0.5 rounded text-xs bg-green-100 text-green-800">
                                      📥 Baixado
                                    </span>
                                  )}
                                  {doc.expirado && (
                                    <span className="px-2 py-0.5 rounded text-xs bg-red-100 text-red-800">
                                      ⏰ Expirado
                                    </span>
                                  )}
                                  {doc.linkExpiraEm && !doc.expirado && (
                                    <span className="px-2 py-0.5 rounded text-xs bg-slate-100 text-slate-600">
                                      Válido até {fmtData(doc.linkExpiraEm)}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <button
                                onClick={() => baixarDocumento(doc)}
                                disabled={doc.expirado}
                                className={`flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                                  doc.expirado
                                    ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                    : 'bg-teal-600 text-white hover:bg-teal-700 active:bg-teal-800'
                                }`}
                              >
                                <Download size={14} />
                                {doc.expirado ? 'Expirado' : 'Baixar'}
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </section>

                <section>
                  <h3 className="font-bold text-slate-900 flex items-center gap-2 mb-2">
                    <FolderOpen className="h-5 w-5 text-teal-600" />
                    Relatórios Mensais
                    <span className="ml-1 text-xs bg-teal-100 text-teal-700 px-2 py-0.5 rounded-full font-medium">
                      {monthlyReports.length}
                    </span>
                  </h3>
                  <p className="text-sm text-slate-500 mb-4">
                    Relatórios gerados mensalmente pela Aurora com o resumo da sua operação.
                  </p>
                  {monthlyReports.length === 0 ? (
                    <EmptyState icon={<FolderOpen />} title="Nenhum relatório mensal"
                      desc="Os relatórios mensais aparecerão aqui quando gerados pela Aurora." />
                  ) : (
                    <div className="space-y-2">
                      {monthlyReports.map((report) => (
                        <div key={report.id} className="bg-white border border-slate-200 rounded-lg p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                                <FileText className="h-5 w-5 text-blue-600" />
                              </div>
                              <div>
                                <h4 className="font-semibold text-slate-900">Relatório {report.period}</h4>
                                <p className="text-xs text-slate-500">
                                  Gerado em {new Date(report.createdAt).toLocaleDateString('pt-BR')}
                                </p>
                              </div>
                            </div>
                            {report.status === 'READY' && report.pdfPath && (
                              <button
                                onClick={() => window.open(report.pdfPath, '_blank')}
                                className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-sm font-medium rounded-lg"
                              >
                                <Download size={14} /> Baixar PDF
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              </div>
            )}
          </div>
        </div>

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
function TabButton({ active, onClick, icon, label }: any) {
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

function KPICard({ label, value, icon, color }: any) {
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

function DreCard({ label, value, icon, color }: any) {
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
      <p className="text-2xl font-bold text-slate-900">{fmtBRL(value)}</p>
    </div>
  );
}

function EmptyState({ icon, title, desc }: any) {
  return (
    <div className="text-center py-12 bg-slate-50 rounded-xl">
      {cloneElement(icon, { className: 'h-12 w-12 mx-auto mb-3 text-slate-300' })}
      <p className="font-medium text-slate-700">{title}</p>
      <p className="text-sm text-slate-500 mt-1">{desc}</p>
    </div>
  );
}

// 🆕 F18-B.2: vitrine "implementação futura" (gera curiosidade no cliente)
function TeaserCard({ titulo, desc }: { titulo: string; desc: string }) {
  return (
    <div className="text-center py-10 bg-gradient-to-br from-slate-50 to-teal-50/60 rounded-xl border border-dashed border-teal-300">
      <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-teal-100 flex items-center justify-center">
        <Sparkles className="h-7 w-7 text-teal-500" />
      </div>
      <p className="font-semibold text-slate-800">{titulo}</p>
      <p className="text-sm text-slate-500 mt-1 max-w-md mx-auto">{desc}</p>
      <span className="inline-block mt-3 text-xs font-medium bg-teal-100 text-teal-700 px-3 py-1 rounded-full">
        🔜 Implementação futura — seu escritório vai liberar em breve
      </span>
    </div>
  );
}