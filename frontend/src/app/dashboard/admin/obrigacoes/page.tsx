'use client';

// =================================================================
// 📄 PÁGINA: GESTÃO DE OBRIGAÇÕES UNIFICADA
// =================================================================
// Sprint OB-1..7: Página única com 5 abas + modal completo de
// edição/criação + integração com Watch Folder + linha do tempo.
// =================================================================

import { useState, useEffect, useMemo } from 'react';
import {
  FileText, Upload, Users, FolderKanban, Plus, Edit3, Trash2,
  Download, Search, ChevronDown, ChevronRight, Clock,
  CheckCircle2, Briefcase, Bell,
  Bot, FileWarning, Settings, Save, X, Info, Layers,
  TrendingUp, Building2, UserCheck, CalendarDays, Tag, Loader2,
  ArrowUpAZ, ArrowDownZA
} from 'lucide-react';
import api from '@/lib/axios';
import { toast } from 'sonner';

// =================================================================
// 📦 TIPOS E INTERFACES
// =================================================================

type TabKey = 'visao-geral' | 'catalogo' | 'lotes' | 'cliente' | 'responsavel';
type SortOrder = 'A-Z' | 'Z-A';

interface ObligationSchedule {
  id: string;
  name: string;
  mininome?: string;
  responsibleUser?: string;
  departamento?: string;
  isActive: boolean;
  estimatedTimeMinutes?: number;
  deliveryDays?: Record<string, string>;
  deliveryDayType?: 'fixed' | 'business';
  reminderDays?: number;
  dayType?: 'corridos' | 'uteis';
  nonBusinessDayAction?: 'antecipar' | 'postergar' | 'manter';
  saturdayIsBusinessDay?: boolean;
  competenceRef?: 'mes-atual' | 'mes-anterior' | 'mes-seguinte';
  requireBot?: boolean;
  subjectToFine?: boolean;
  alertGuide?: boolean;
  defaultComment?: string;

  // ✅ Sprint OB-4: Watch Folder
  folderPath?: string;
  fileNamePattern?: string;
  postProcessAction?: 'manter' | 'mover' | 'deletar';

  deliveries: Delivery[];
  createdAt: string;
}

interface Delivery {
  id: string;
  clientId: string;
  status: 'PENDENTE' | 'ENVIADO' | 'ATRASADO' | 'CANCELADO';
  obs?: string;
  client?: {
    id: string;
    companyName: string;
    cnpj?: string;
  };
  createdAt: string;
}

// =================================================================
// 🎨 COMPONENTE PRINCIPAL DA PÁGINA
// =================================================================

export default function ObrigacoesUnificadasPage() {
  // --- Estados principais ---
  const [activeTab, setActiveTab] = useState<TabKey>('catalogo');
  const [schedules, setSchedules] = useState<ObligationSchedule[]>([]);
  const [loading, setLoading] = useState(false);

  // --- Filtros e busca ---
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDepartamento, setFilterDepartamento] = useState('todos');
  const [filterResponsavel, setFilterResponsavel] = useState('todos');
  const [expandedLote, setExpandedLote] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<SortOrder>('A-Z'); // ✅ OB-1: ordenação A-Z/Z-A

  // --- Modal de edição/criação ---
  const [editingSchedule, setEditingSchedule] = useState<ObligationSchedule | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);

  // =================================================================
  // 🔄 FETCH: carrega todas as obrigações do backend
  // =================================================================
  const fetchSchedules = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/obligations/schedules');
      setSchedules(data);
    } catch {
      toast.error('Falha ao carregar obrigações.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchedules();
  }, []);

  // =================================================================
  // 🗑️ DELETE: exclui a obrigação inteira (com cascade no backend)
  // =================================================================
  const handleDeleteSchedule = async (scheduleId: string, scheduleName: string) => {
    if (!confirm(
      `⚠️ ATENÇÃO: Isso excluirá PERMANENTEMENTE a obrigação "${scheduleName}" e todos os seus vínculos.\n\nDeseja continuar?`
    )) {
      return;
    }

    try {
      await api.delete(`/obligations/schedules/${scheduleId}`);
      toast.success(`Obrigação "${scheduleName}" excluída com sucesso!`);
      fetchSchedules();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erro ao excluir obrigação.');
    }
  };

  // =================================================================
  // ✏️ EDIT: abre o modal em modo edição
  // =================================================================
  const handleEditSchedule = (schedule: ObligationSchedule) => {
    setEditingSchedule(schedule);
    setShowEditModal(true);
  };

  // =================================================================
  // 💾 SAVE (edição): PATCH parcial
  // =================================================================
  const handleSaveEdit = async (updatedData: any) => {
    if (!editingSchedule) return;
    try {
      await api.patch(`/obligations/schedules/${editingSchedule.id}`, updatedData);
      toast.success('Obrigação atualizada com sucesso!');
      setShowEditModal(false);
      setEditingSchedule(null);
      fetchSchedules();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erro ao atualizar obrigação.');
    }
  };

  // =================================================================
  // ➕ CREATE: POST nova obrigação
  // =================================================================
  const handleCreateSchedule = async (newData: any) => {
    try {
      await api.post('/obligations/schedules', newData);
      toast.success('Obrigação criada com sucesso!');
      setShowEditModal(false);
      setEditingSchedule(null);
      fetchSchedules();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erro ao criar obrigação.');
    }
  };

  // =================================================================
  // 🔀 TOGGLE: alterna ordenação A-Z / Z-A
  // =================================================================
  const toggleSortOrder = () => {
    setSortOrder(prev => prev === 'A-Z' ? 'Z-A' : 'A-Z');
  };

  // =================================================================
  // 🔔 VERIFY (Sprint OB-4): checa pasta + alerta Super Admin se vazia
  // =================================================================
  const handleVerify = async (ob: ObligationSchedule) => {
    try {
      const { data } = await api.post(`/obligations/schedules/${ob.id}/verify`);
      if (data.fulfilled) {
        toast.success(`✅ ${data.message}`);
      } else {
        toast.error(`⚠️ ${data.message}`);
      }
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Erro na verificação.');
    }
  };

  // =================================================================
  // 📊 STATS: contadores em tempo real
  // =================================================================
  const stats = useMemo(() => ({
    total: schedules.length,
    ativas: schedules.filter(o => o.isActive).length,
    inativas: schedules.filter(o => !o.isActive).length,
    porDepartamento: {
      Fiscal: schedules.filter(o => o.name.toUpperCase().includes('DAS') || o.name.toUpperCase().includes('FISCAL')).length,
      Pessoal: schedules.filter(o => o.name.toUpperCase().includes('PRO') || o.name.toUpperCase().includes('PESSOAL') || o.name.toUpperCase().includes('INSS')).length,
      Contabil: 0,
      Financeiro: 0,
      Legalizacao: 0,
    },
    lotesPendentes: schedules.filter(l => l.deliveries.some(d => d.status === 'PENDENTE')).length,
    lotesTotal: schedules.length,
  }), [schedules]);

  // =================================================================
  // 🎨 RENDER
  // =================================================================
  return (
    <div className="min-h-screen bg-slate-50 p-6">

      {/* ================== HEADER ================== */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
              <FileText className="text-[#0d9488]" size={28} />
              Gestão de Obrigações
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              Unificação completa: catálogo, lotes, importação, clientes e responsáveis
            </p>
          </div>
          <div className="flex gap-2">
            <a
              href="/dashboard/fiscal/obrigacoes/importar"
              className="px-4 py-2 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 flex items-center gap-2 text-sm font-medium transition-colors"
            >
              <Upload size={16} /> Importar Lote
            </a>
            <button
              onClick={() => { setEditingSchedule(null); setShowEditModal(true); }}
              className="px-4 py-2 bg-[#0d9488] text-white rounded-lg hover:bg-[#0f766e] flex items-center gap-2 text-sm font-medium transition-colors"
            >
              <Plus size={16} /> Nova Obrigação
            </button>
          </div>
        </div>
      </div>

      {/* ================== TABS ================== */}
      <div className="bg-white rounded-t-xl border border-slate-200 border-b-0">
        <div className="flex overflow-x-auto">
          {[
            { key: 'visao-geral', label: 'Visão Geral', icon: TrendingUp },
            { key: 'catalogo',    label: 'Catálogo de Obrigações', icon: FileText },
            { key: 'lotes',       label: 'Obrigações em Lote', icon: Layers },
            { key: 'cliente',     label: 'Por Cliente', icon: Building2 },
            { key: 'responsavel', label: 'Por Responsável', icon: UserCheck },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as TabKey)}
              className={`px-5 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap flex items-center gap-2 ${
                activeTab === tab.key
                  ? 'border-[#0d9488] text-[#0d9488] bg-teal-50/50'
                  : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <tab.icon size={16} />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ================== CONTEÚDO DAS ABAS ================== */}
      <div className="bg-white rounded-b-xl border border-slate-200 p-6">
        {loading ? (
          <div className="p-12 flex flex-col items-center justify-center gap-3 text-slate-500">
            <Loader2 className="animate-spin text-[#0d9488]" size={32} />
            <span>Carregando dados...</span>
          </div>
        ) : (
          <>
            {activeTab === 'visao-geral' && <TabVisaoGeral stats={stats} schedules={schedules} />}

            {activeTab === 'catalogo' && (
              <TabCatalogo
                schedules={schedules}
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                filterDepartamento={filterDepartamento}
                setFilterDepartamento={setFilterDepartamento}
                sortOrder={sortOrder}
                toggleSortOrder={toggleSortOrder}
                onVerify={handleVerify}
                onEdit={handleEditSchedule}
                onDelete={handleDeleteSchedule}
              />
            )}

            {activeTab === 'lotes' && (
              <TabLotes
                schedules={schedules}
                expandedLote={expandedLote}
                setExpandedLote={setExpandedLote}
                filterResponsavel={filterResponsavel}
                setFilterResponsavel={setFilterResponsavel}
                onDelete={handleDeleteSchedule}
              />
            )}

            {activeTab === 'cliente' && <TabPorCliente schedules={schedules} />}
            {activeTab === 'responsavel' && <TabPorResponsavel schedules={schedules} />}
          </>
        )}
      </div>

      {/* ================== MODAL DE EDIÇÃO/CRIAÇÃO ================== */}
      {showEditModal && (
        <EditObligationModal
          schedule={editingSchedule}
          onSave={editingSchedule ? handleSaveEdit : handleCreateSchedule}
          onClose={() => { setShowEditModal(false); setEditingSchedule(null); }}
        />
      )}
    </div>
  );
}

// =================================================================
// 📊 SUB-COMPONENTE: VISÃO GERAL
// =================================================================

function TabVisaoGeral({ stats, schedules }: { stats: any; schedules: ObligationSchedule[] }) {
  const cards = [
    { label: 'Total de Obrigações', value: stats.total,        icon: FileText,     color: 'blue'    },
    { label: 'Obrigações Ativas',   value: stats.ativas,       icon: CheckCircle2, color: 'emerald' },
    { label: 'Lotes Pendentes',     value: stats.lotesPendentes, icon: Clock,      color: 'amber'   },
    { label: 'Total de Lotes',      value: stats.lotesTotal,   icon: Layers,       color: 'purple'  },
  ];

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card, i) => (
          <div key={i} className="bg-slate-50 border border-slate-200 rounded-xl p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500 font-medium uppercase">{card.label}</p>
                <p className="text-3xl font-bold text-slate-800 mt-1">{card.value}</p>
              </div>
              <div className={`p-3 rounded-lg bg-${card.color}-100`}>
                <card.icon className={`text-${card.color}-600`} size={24} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Últimas importadas */}
      <div className="border border-slate-200 rounded-xl p-5">
        <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
          <Tag size={18} /> Últimas Obrigações Importadas
        </h3>
        <div className="space-y-2">
          {schedules.slice(0, 5).map((ob: ObligationSchedule) => (
            <div key={ob.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
              <div>
                <p className="text-sm font-medium text-slate-800">{ob.name}</p>
                <p className="text-xs text-slate-500">
                  {ob.responsibleUser || 'Sem responsável'} • {ob.deliveries.length} empresas
                </p>
              </div>
              <span className="text-xs font-medium px-2 py-1 bg-amber-100 text-amber-700 rounded">
                {ob.deliveries.filter((d: Delivery) => d.status === 'PENDENTE').length} Pendentes
              </span>
            </div>
          ))}
          {schedules.length === 0 && (
            <p className="text-sm text-slate-500 text-center py-4">Nenhuma obrigação cadastrada</p>
          )}
        </div>
      </div>
    </div>
  );
}

// =================================================================
// 📋 SUB-COMPONENTE: CATÁLOGO DE OBRIGAÇÕES (com ordenação e sino)
// =================================================================

function TabCatalogo({
  schedules,
  searchTerm,
  setSearchTerm,
  filterDepartamento,
  setFilterDepartamento,
  sortOrder,
  toggleSortOrder,
  onVerify,
  onEdit,
  onDelete
}: any) {

  // ✅ Filtra e ordena dinamicamente
  const filtered = useMemo(() => {
    const result = schedules.filter((ob: ObligationSchedule) =>
      ob.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    result.sort((a: ObligationSchedule, b: ObligationSchedule) => {
      const nameA = a.name.toUpperCase();
      const nameB = b.name.toUpperCase();
      return sortOrder === 'A-Z'
        ? nameA.localeCompare(nameB, 'pt-BR')
        : nameB.localeCompare(nameA, 'pt-BR');
    });

    return result;
  }, [schedules, searchTerm, sortOrder]);

  return (
    <div className="space-y-4">
      {/* Busca + ordenação */}
      <div className="flex flex-wrap gap-3 items-center justify-between">
        <div className="flex-1 min-w-[250px] relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Buscar por nome..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-[#0d9488] focus:border-transparent"
          />
        </div>

        <button
          onClick={toggleSortOrder}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 text-sm font-medium text-slate-700 transition-colors"
          title={`Ordenar ${sortOrder === 'A-Z' ? 'de Z a A' : 'de A a Z'}`}
        >
          {sortOrder === 'A-Z' ? (
            <><ArrowUpAZ size={16} className="text-[#0d9488]" /><span>A-Z</span></>
          ) : (
            <><ArrowDownZA size={16} className="text-[#0d9488]" /><span>Z-A</span></>
          )}
        </button>
      </div>

      {/* Tabela */}
      <div className="border border-slate-200 rounded-xl overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 uppercase">Obrigação</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 uppercase">Responsável</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 uppercase">Criada em</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 uppercase">Empresas</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 uppercase">Status</th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-slate-600 uppercase">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.map((ob: ObligationSchedule) => (
              <tr key={ob.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-4 py-3">
                  <p className="text-sm font-medium text-slate-800">{ob.name}</p>
                </td>
                <td className="px-4 py-3 text-sm text-slate-600">{ob.responsibleUser || '-'}</td>
                <td className="px-4 py-3 text-sm text-slate-600">
                  {new Date(ob.createdAt).toLocaleDateString('pt-BR')}
                </td>
                <td className="px-4 py-3 text-sm text-slate-600">{ob.deliveries.length}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                    ob.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
                  }`}>
                    {ob.isActive ? 'Ativa' : 'Inativa'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1">
                    {/* 🔔 Verificar cumprimento (OB-4) */}
                    <button
                      onClick={() => onVerify(ob)}
                      className="p-1.5 hover:bg-amber-50 rounded text-amber-600"
                      title="Verificar cumprimento agora"
                    >
                      <Bell size={16} />
                    </button>
                    {/* ✏️ Editar */}
                    <button
                      onClick={() => onEdit(ob)}
                      className="p-1.5 hover:bg-blue-50 rounded text-blue-600"
                      title="Editar obrigação"
                    >
                      <Edit3 size={16} />
                    </button>
                    {/* 🗑️ Excluir */}
                    <button
                      onClick={() => onDelete(ob.id, ob.name)}
                      className="p-1.5 hover:bg-red-50 rounded text-red-600"
                      title="Excluir obrigação"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filtered.length === 0 && (
          <div className="p-8 text-center text-slate-500">
            <FileText className="mx-auto mb-2 text-slate-300" size={40} />
            <p>Nenhuma obrigação encontrada</p>
            <p className="text-xs mt-1">Importe um arquivo Excel para começar</p>
          </div>
        )}
      </div>

      {/* Legenda */}
      <div className="flex items-center justify-end gap-2 text-xs text-slate-500">
        <span>Ordenado por:</span>
        <span className={`font-medium ${sortOrder === 'A-Z' ? 'text-[#0d9488]' : ''}`}>A-Z</span>
        <span>/</span>
        <span className={`font-medium ${sortOrder === 'Z-A' ? 'text-[#0d9488]' : ''}`}>Z-A</span>
      </div>
    </div>
  );
}

// =================================================================
// 📦 SUB-COMPONENTE: OBRIGAÇÕES EM LOTE (com linha do tempo OB-7)
// =================================================================

function TabLotes({
  schedules,
  expandedLote,
  setExpandedLote,
  filterResponsavel,
  setFilterResponsavel,
  onDelete,
}: any) {
  const responsibles = Array.from(
    new Set(schedules.map((s: ObligationSchedule) => s.responsibleUser).filter(Boolean))
  );

  // ✅ OB-7: referência de mês/ano + cache de timelines
  const [refDate, setRefDate] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() + 1 };
  });
  const [timelines, setTimelines] = useState<Record<string, any>>({});

  // Busca a timeline sempre que o lote expandido ou o mês mudarem
  const fetchTimeline = async (scheduleId: string) => {
    try {
      const { data } = await api.get(
        `/obligations/schedules/${scheduleId}/timeline?year=${refDate.year}&month=${refDate.month}`
      );
      setTimelines(prev => ({ ...prev, [scheduleId]: data }));
    } catch {
      setTimelines(prev => ({ ...prev, [scheduleId]: null }));
    }
  };

  useEffect(() => {
    if (expandedLote) fetchTimeline(expandedLote);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expandedLote, refDate]);

  // Filtro por responsável
  const filtered = schedules.filter((s: ObligationSchedule) =>
    filterResponsavel === 'todos' || s.responsibleUser === filterResponsavel
  );

  return (
    <div className="space-y-4">
      {/* Filtros */}
      <div className="flex flex-wrap gap-3">
        <select
          value={filterResponsavel}
          onChange={(e) => setFilterResponsavel(e.target.value)}
          className="px-4 py-2 border border-slate-300 rounded-lg text-sm bg-white"
        >
          <option value="todos">Todos os responsáveis</option>
          {responsibles.map((r: string) => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>

        {/* ✅ OB-7: seletor de mês/ano de referência */}
        <input
          type="month"
          value={`${refDate.year}-${String(refDate.month).padStart(2, '0')}`}
          onChange={(e) => {
            const [y, m] = e.target.value.split('-').map(Number);
            if (y && m) setRefDate({ year: y, month: m });
          }}
          className="px-4 py-2 border border-slate-300 rounded-lg text-sm bg-white"
          title="Mês/ano de referência para vencimentos"
        />
      </div>

      {/* Lista de lotes */}
      <div className="space-y-3">
        {filtered.map((lote: ObligationSchedule) => {
          const isExpanded = expandedLote === lote.id;
          const pendentes = lote.deliveries.filter((d: Delivery) => d.status === 'PENDENTE').length;
          const timeline = timelines[lote.id];

          // Itens normalizados: se timeline existir usa, senão fallback em deliveries
          const items = timeline?.items || lote.deliveries.map((d: Delivery) => ({
            deliveryId: d.id,
            client: d.client,
            status: d.status,
            situation: 'NA' as const,
            tracking: { sentAt: null, openedAt: null, downloadedAt: null },
          }));

          return (
            <div key={lote.id} className="border border-slate-200 rounded-xl overflow-hidden">
              {/* Cabeçalho do lote */}
              <div className="bg-slate-50 px-5 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <button onClick={() => setExpandedLote(isExpanded ? null : lote.id)}>
                    {isExpanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                  </button>
                  <div>
                    <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                      {lote.name}
                      {lote.responsibleUser && (
                        <span className="text-xs bg-teal-100 text-teal-700 px-2 py-0.5 rounded-full">
                          {lote.responsibleUser}
                        </span>
                      )}
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Criada em {new Date(lote.createdAt).toLocaleDateString('pt-BR')} • {lote.deliveries.length} empresas vinculadas
                      {timeline?.dueDateFmt && (
                        <> • Vencimento: <strong className="text-slate-700">{timeline.dueDateFmt}</strong></>
                      )}
                      {timeline?.competence && (
                        <> • Competência: <strong className="text-slate-700">{timeline.competence}</strong></>
                      )}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button className="p-2 hover:bg-white rounded text-slate-600" title="Exportar">
                    <Download size={16} />
                  </button>
                  <button
                    onClick={() => onDelete(lote.id, lote.name)}
                    className="p-2 hover:bg-red-50 rounded text-red-600"
                    title="Excluir obrigação"
                  >
                    <Trash2 size={16} />
                  </button>
                  <div className="ml-3 pl-3 border-l border-slate-300">
                    <p className="text-2xl font-bold text-amber-600">{pendentes}</p>
                    <p className="text-xs text-slate-500 uppercase">Pendentes</p>
                  </div>
                </div>
              </div>

              {/* Tabela expandida — OB-7 */}
              {isExpanded && (
                <div className="border-t border-slate-200">
                  <table className="w-full">
                    <thead className="bg-white border-b border-slate-200">
                      <tr>
                        <th className="text-left px-4 py-2 text-xs font-semibold text-slate-600 uppercase">Empresa</th>
                        <th className="text-left px-4 py-2 text-xs font-semibold text-slate-600 uppercase">CNPJ</th>
                        <th className="text-left px-4 py-2 text-xs font-semibold text-slate-600 uppercase">Situação</th>
                        <th className="text-left px-4 py-2 text-xs font-semibold text-slate-600 uppercase">Enviado</th>
                        <th className="text-left px-4 py-2 text-xs font-semibold text-slate-600 uppercase">Aberto</th>
                        <th className="text-left px-4 py-2 text-xs font-semibold text-slate-600 uppercase">Baixado</th>
                        <th className="text-left px-4 py-2 text-xs font-semibold text-slate-600 uppercase">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {items.map((item: any) => {
                        // Badge de situação
                        const situacaoClass = {
                          ATRASADA:   'bg-red-100 text-red-700',
                          VENCE_HOJE: 'bg-orange-100 text-orange-700',
                          CUMPRIDA:   'bg-emerald-100 text-emerald-700',
                          FUTURA:     'bg-blue-100 text-blue-700',
                          CANCELADA:  'bg-slate-200 text-slate-600',
                          NA:         'bg-slate-100 text-slate-500',
                        }[item.situation] || 'bg-slate-100 text-slate-500';

                        const situacaoLabel: Record<string, string> = {
                          ATRASADA: 'Atrasada',
                          VENCE_HOJE: 'Vence hoje',
                          CUMPRIDA: 'Cumprida',
                          FUTURA: 'Futura',
                          CANCELADA: 'Cancelada',
                          NA: 'N/A',
                        };

                        return (
                          <tr key={item.deliveryId} className="hover:bg-slate-50">
                            <td className="px-4 py-3 text-sm font-medium text-slate-800">
                              {item.client?.companyName || 'Empresa não encontrada'}
                            </td>
                            <td className="px-4 py-3 text-sm font-mono text-slate-600">
                              {item.client?.cnpj || '-'}
                            </td>
                            <td className="px-4 py-3">
                              <span className={`text-xs px-2 py-1 rounded-full font-medium ${situacaoClass}`}>
                                {situacaoLabel[item.situation] || item.situation}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-sm text-slate-600">
                              {item.tracking?.sentAt
                                ? new Date(item.tracking.sentAt).toLocaleString('pt-BR')
                                : '—'}
                            </td>
                            <td className="px-4 py-3 text-sm text-slate-600">
                              {item.tracking?.openedAt
                                ? new Date(item.tracking.openedAt).toLocaleString('pt-BR')
                                : '—'}
                            </td>
                            <td className="px-4 py-3 text-sm text-slate-600">
                              {item.tracking?.downloadedAt
                                ? new Date(item.tracking.downloadedAt).toLocaleString('pt-BR')
                                : '—'}
                            </td>
                            <td className="px-4 py-3">
                              <span className={`text-xs px-2 py-1 rounded-full flex items-center gap-1 w-fit ${
                                item.status === 'PENDENTE' ? 'bg-amber-100 text-amber-700' :
                                item.status === 'ENVIADO'   ? 'bg-emerald-100 text-emerald-700' :
                                item.status === 'ATRASADO'  ? 'bg-red-100 text-red-700' :
                                'bg-slate-100 text-slate-500'
                              }`}>
                                <Clock size={10} /> {item.status}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div className="p-8 text-center text-slate-500 bg-slate-50 rounded-xl">
            <Layers className="mx-auto mb-2 text-slate-300" size={40} />
            <p>Nenhum lote encontrado</p>
          </div>
        )}
      </div>
    </div>
  );
}

// =================================================================
// 🏢 SUB-COMPONENTE: POR CLIENTE
// =================================================================

function TabPorCliente({ schedules }: { schedules: ObligationSchedule[] }) {
  const clientesMap = new Map<string, { nome: string; cnpj?: string; obrigacoes: ObligationSchedule[] }>();

  schedules.forEach(ob => {
    ob.deliveries.forEach(delivery => {
      if (!delivery.client) return;
      const clientId = delivery.client.id;
      if (!clientesMap.has(clientId)) {
        clientesMap.set(clientId, {
          nome: delivery.client.companyName,
          cnpj: delivery.client.cnpj,
          obrigacoes: [],
        });
      }
      clientesMap.get(clientId)!.obrigacoes.push(ob);
    });
  });

  const clientes = Array.from(clientesMap.entries()).map(([id, data]) => ({ id, ...data }));

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {clientes.map(cliente => (
          <div key={cliente.id} className="border border-slate-200 rounded-xl p-5 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h4 className="font-semibold text-slate-800 text-sm">{cliente.nome}</h4>
                <p className="text-xs text-slate-500 font-mono mt-0.5">{cliente.cnpj || '-'}</p>
              </div>
              <span className="text-xs bg-teal-100 text-teal-700 px-2 py-1 rounded-full font-medium">
                {cliente.obrigacoes.length} obrigações
              </span>
            </div>
            <div className="space-y-1.5">
              {cliente.obrigacoes.slice(0, 4).map(ob => (
                <div key={ob.id} className="flex items-center justify-between text-xs p-2 bg-slate-50 rounded">
                  <span className="font-medium text-slate-700 truncate">{ob.name}</span>
                  <span className="text-slate-500">
                    {ob.deliveries.filter(d => d.clientId === cliente.id)[0]?.status || '-'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
        {clientes.length === 0 && (
          <div className="col-span-3 p-8 text-center text-slate-500 bg-slate-50 rounded-xl">
            <Building2 className="mx-auto mb-2 text-slate-300" size={40} />
            <p>Nenhum cliente com obrigações encontradas</p>
          </div>
        )}
      </div>
    </div>
  );
}

// =================================================================
// 👤 SUB-COMPONENTE: POR RESPONSÁVEL
// =================================================================

function TabPorResponsavel({ schedules }: { schedules: ObligationSchedule[] }) {
  const responsaveisMap = new Map<string, ObligationSchedule[]>();

  schedules.forEach(ob => {
    const resp = ob.responsibleUser || 'Não atribuído';
    if (!responsaveisMap.has(resp)) {
      responsaveisMap.set(resp, []);
    }
    responsaveisMap.get(resp)!.push(ob);
  });

  const responsaveis = Array.from(responsaveisMap.entries());

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {responsaveis.map(([resp, obs]) => (
          <div key={resp} className="border border-slate-200 rounded-xl p-5 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center text-white font-bold">
                {resp.charAt(0)}
              </div>
              <div>
                <h4 className="font-semibold text-slate-800">{resp}</h4>
                <p className="text-xs text-slate-500">{obs.length} obrigações</p>
              </div>
            </div>
            <div className="space-y-2">
              {obs.slice(0, 5).map(ob => (
                <div key={ob.id} className="flex items-center justify-between text-xs p-2 bg-slate-50 rounded">
                  <div>
                    <p className="font-medium text-slate-700 truncate">{ob.name}</p>
                    <p className="text-slate-500">{ob.deliveries.length} empresas</p>
                  </div>
                  <span className="text-xs font-mono bg-white px-2 py-1 rounded border">
                    {ob.deliveries.filter(d => d.status === 'PENDENTE').length} pendentes
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
        {responsaveis.length === 0 && (
          <div className="col-span-3 p-8 text-center text-slate-500 bg-slate-50 rounded-xl">
            <UserCheck className="mx-auto mb-2 text-slate-300" size={40} />
            <p>Nenhum responsável encontrado</p>
          </div>
        )}
      </div>
    </div>
  );
}

// =================================================================
// ⚙️ SUB-COMPONENTE: MODAL DE EDIÇÃO/CRIAÇÃO DE OBRIGAÇÃO
// =================================================================

function EditObligationModal({
  schedule,
  onSave,
  onClose,
}: {
  schedule: ObligationSchedule | null;
  onSave: (data: any) => void;
  onClose: () => void;
}) {
  // Estado do formulário (com todos os campos, incluindo Watch Folder)
  const [formData, setFormData] = useState({
    name: schedule?.name || '',
    mininome: schedule?.mininome || '',
    departamento: schedule?.departamento || 'Fiscal',
    responsavel: schedule?.responsibleUser || '',
    estimatedTimeMinutes: schedule?.estimatedTimeMinutes || 0,
    deliveryDays: schedule?.deliveryDays || {
      jan: '20', fev: '20', mar: '20', abr: '20', mai: '20', jun: '20',
      jul: '20', ago: '20', set: '20', out: '20', nov: '20', dez: '20',
    },
    deliveryDayType: (schedule as any)?.deliveryDayType || 'fixed',
    reminderDays: schedule?.reminderDays || 5,
    dayType: schedule?.dayType || 'corridos',
    nonBusinessDayAction: schedule?.nonBusinessDayAction || 'antecipar',
    saturdayIsBusinessDay: schedule?.saturdayIsBusinessDay || false,
    competenceRef: schedule?.competenceRef || 'mes-anterior',
    requireBot: schedule?.requireBot || false,
    subjectToFine: schedule?.subjectToFine || false,
    alertGuide: schedule?.alertGuide || true,
    isActive: schedule?.isActive !== undefined ? schedule.isActive : true,
    defaultComment: schedule?.defaultComment || '',
    // ✅ Sprint OB-4: Watch Folder
    folderPath: (schedule as any)?.folderPath || '',
    fileNamePattern: (schedule as any)?.fileNamePattern || '',
    postProcessAction: (schedule as any)?.postProcessAction || 'manter',
  });

  const meses = [
    { key: 'jan', label: 'Janeiro'   }, { key: 'fev', label: 'Fevereiro' },
    { key: 'mar', label: 'Março'     }, { key: 'abr', label: 'Abril'     },
    { key: 'mai', label: 'Maio'      }, { key: 'jun', label: 'Junho'     },
    { key: 'jul', label: 'Julho'     }, { key: 'ago', label: 'Agosto'    },
    { key: 'set', label: 'Setembro'  }, { key: 'out', label: 'Outubro'   },
    { key: 'nov', label: 'Novembro'  }, { key: 'dez', label: 'Dezembro'  },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl max-w-6xl w-full max-h-[95vh] overflow-y-auto">

        {/* HEADER DO MODAL */}
        <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between z-10">
          <div>
            <h2 className="text-lg font-bold text-slate-800">
              {schedule ? 'Editar Obrigação' : 'Nova Obrigação'}
            </h2>
            <p className="text-xs text-slate-500">Configure todos os parâmetros da obrigação</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">

          {/* SEÇÃO 1: Dados Básicos */}
          <section className="space-y-4">
            <h3 className="text-sm font-semibold text-slate-700 uppercase flex items-center gap-2">
              <FileText size={16} /> Dados Básicos
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-slate-600 mb-1">Nome da Obrigação *</label>
                <input
                  type="text" required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-[#0d9488]"
                  placeholder="Ex: DAS - SIMPLES NACIONAL"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Mininome *</label>
                <input
                  type="text" required
                  value={formData.mininome}
                  onChange={(e) => setFormData({ ...formData, mininome: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-[#0d9488]"
                  placeholder="Ex: DAS"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Tempo Previsto (min)</label>
                <input
                  type="number"
                  value={formData.estimatedTimeMinutes}
                  onChange={(e) => setFormData({ ...formData, estimatedTimeMinutes: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-[#0d9488]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Departamento *</label>
                <select
                  value={formData.departamento}
                  onChange={(e) => setFormData({ ...formData, departamento: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white"
                >
                  <option value="Fiscal">Fiscal</option>
                  <option value="Pessoal">Pessoal</option>
                  <option value="Contábil">Contábil</option>
                  <option value="Financeiro">Financeiro</option>
                  <option value="Legalização">Legalização</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Responsável *</label>
                <select
                  value={formData.responsavel}
                  onChange={(e) => setFormData({ ...formData, responsavel: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white"
                >
                  <option value="">Selecione...</option>
                  {['Neila', 'Ediane', 'Emilia', 'Evelyn', 'Juliane', 'Bárbara', 'Graziela', 'Fernanda Lopes'].map(r => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Competências referentes a</label>
                <select
                  value={formData.competenceRef}
                  onChange={(e) => setFormData({ ...formData, competenceRef: e.target.value as any })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white"
                >
                  <option value="mes-atual">Mês atual</option>
                  <option value="mes-anterior">Mês anterior</option>
                  <option value="mes-seguinte">Mês seguinte</option>
                </select>
              </div>
            </div>
          </section>

          {/* SEÇÃO 2: Dias de Entrega por Mês */}
          <section className="space-y-4">
            <h3 className="text-sm font-semibold text-slate-700 uppercase flex items-center gap-2">
              <CalendarDays size={16} /> Dias de Entrega (por mês)
            </h3>

            {/* Toggle: dia fixo × dia útil */}
            <div className="flex gap-6 mb-2 p-3 bg-slate-50 rounded-lg border border-slate-200">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="deliveryDayType"
                  checked={formData.deliveryDayType === 'fixed'}
                  onChange={() => setFormData({ ...formData, deliveryDayType: 'fixed' })}
                  className="w-4 h-4 text-[#0d9488] focus:ring-[#0d9488]"
                />
                <span className="text-sm font-medium text-slate-700">Dia fixo do mês (ex: dia 20)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="deliveryDayType"
                  checked={formData.deliveryDayType === 'business'}
                  onChange={() => setFormData({ ...formData, deliveryDayType: 'business' })}
                  className="w-4 h-4 text-[#0d9488] focus:ring-[#0d9488]"
                />
                <span className="text-sm font-medium text-slate-700">Dia útil (ex: 1º dia útil)</span>
              </label>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {meses.map((mes) => (
                <div key={mes.key}>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Entrega {mes.label}</label>
                  <select
                    value={formData.deliveryDays[mes.key]}
                    onChange={(e) => setFormData({
                      ...formData,
                      deliveryDays: { ...formData.deliveryDays, [mes.key]: e.target.value },
                    })}
                    className="w-full px-2 py-1.5 border border-slate-300 rounded text-sm bg-white focus:ring-1 focus:ring-[#0d9488]"
                  >
                    <option value="0">Não se aplica</option>

                    {formData.deliveryDayType === 'fixed' ? (
                      <>
                        {Array.from({ length: 31 }, (_, n) => n + 1).map(d => (
                          <option key={d} value={d.toString()}>Dia {d}</option>
                        ))}
                        <option value="ultimo">Último dia</option>
                      </>
                    ) : (
                      <>
                        <option value="1u">1º dia útil</option>
                        <option value="2u">2º dia útil</option>
                        <option value="3u">3º dia útil</option>
                        <option value="4u">4º dia útil</option>
                        <option value="5u">5º dia útil</option>
                        <option value="ultimou">Último dia útil</option>
                      </>
                    )}
                  </select>
                </div>
              ))}
            </div>
          </section>

          {/* SEÇÃO 3: Configurações de Prazo */}
          <section className="space-y-4">
            <h3 className="text-sm font-semibold text-slate-700 uppercase flex items-center gap-2">
              <Clock size={16} /> Configurações de Prazo
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Lembrar quantos dias antes?</label>
                <input
                  type="number"
                  value={formData.reminderDays}
                  onChange={(e) => setFormData({ ...formData, reminderDays: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Tipo de dias</label>
                <select
                  value={formData.dayType}
                  onChange={(e) => setFormData({ ...formData, dayType: e.target.value as any })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white"
                >
                  <option value="corridos">Dias corridos</option>
                  <option value="uteis">Dias úteis</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Prazos fixos em dias não-úteis</label>
                <select
                  value={formData.nonBusinessDayAction}
                  onChange={(e) => setFormData({ ...formData, nonBusinessDayAction: e.target.value as any })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white"
                >
                  <option value="antecipar">Antecipar para o dia útil anterior</option>
                  <option value="postergar">Postergar para o dia útil seguinte</option>
                  <option value="manter">Manter no dia (não-útil)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Sábado é útil?</label>
                <select
                  value={formData.saturdayIsBusinessDay ? 'sim' : 'nao'}
                  onChange={(e) => setFormData({ ...formData, saturdayIsBusinessDay: e.target.value === 'sim' })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white"
                >
                  <option value="nao">Não</option>
                  <option value="sim">Sim</option>
                </select>
              </div>
            </div>
          </section>

          {/* SEÇÃO 4: Watch Folder (Sprint OB-4) */}
          <section className="space-y-4">
            <h3 className="text-sm font-semibold text-slate-700 uppercase flex items-center gap-2">
              <FolderKanban size={16} /> Localização de Arquivos (Watch Folder)
            </h3>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-4">
              <p className="text-xs text-blue-800">
                📌 Configure onde os arquivos serão monitorados para disparo automático do primeiro gatilho da obrigação.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Caminho da Pasta de Monitoramento *
                  </label>
                  <input
                    type="text"
                    value={formData.folderPath}
                    onChange={(e) => setFormData({ ...formData, folderPath: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-[#0d9488]"
                    placeholder="Ex: /servidor/obrigacoes/fiscal/das ou C:\Obrigacoes\Fiscal\DAS"
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    Caminho completo da pasta onde os usuários devem colocar os arquivos para serem processados.
                  </p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Padrão de Nome do Arquivo
                  </label>
                  <input
                    type="text"
                    value={formData.fileNamePattern}
                    onChange={(e) => setFormData({ ...formData, fileNamePattern: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-[#0d9488]"
                    placeholder="Ex: DAS_*.pdf ou *.xml"
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    Use wildcards (* e ?) para identificar os arquivos corretos.
                  </p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Ação Após Processamento
                  </label>
                  <select
                    value={formData.postProcessAction}
                    onChange={(e) => setFormData({ ...formData, postProcessAction: e.target.value as any })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-[#0d9488]"
                  >
                    <option value="manter">Manter na pasta original</option>
                    <option value="mover">Mover para pasta de processados</option>
                    <option value="deletar">Excluir após processamento</option>
                  </select>
                  <p className="text-xs text-slate-500 mt-1">
                    O que o sistema deve fazer com o arquivo após o disparo bem-sucedido.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* SEÇÃO 5: Flags e Alertas */}
          <section className="space-y-4">
            <h3 className="text-sm font-semibold text-slate-700 uppercase flex items-center gap-2">
              <Settings size={16} /> Flags e Alertas
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { key: 'requireBot',    label: 'Exigir Robô?',        icon: Bot },
                { key: 'subjectToFine', label: 'Passível de multa?',  icon: FileWarning },
                { key: 'alertGuide',    label: 'Alerta guia fi-lida?',icon: Bell },
                { key: 'isActive',      label: 'Ativa?',              icon: CheckCircle2 },
              ].map(field => (
                <div key={field.key}>
                  <label className="block text-xs font-medium text-slate-600 mb-1">{field.label}</label>
                  <select
                    value={(formData as any)[field.key] ? 'sim' : 'nao'}
                    onChange={(e) => setFormData({ ...formData, [field.key]: e.target.value === 'sim' })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white"
                  >
                    <option value="nao">Não</option>
                    <option value="sim">Sim</option>
                  </select>
                </div>
              ))}
            </div>
          </section>

          {/* SEÇÃO 6: Comentário Padrão */}
          <section className="space-y-2">
            <h3 className="text-sm font-semibold text-slate-700 uppercase flex items-center gap-2">
              <Info size={16} /> Comentário Padrão
            </h3>
            <textarea
              value={formData.defaultComment}
              onChange={(e) => setFormData({ ...formData, defaultComment: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-[#0d9488]"
              placeholder="Comentário que aparecerá em todas as entregas desta obrigação..."
            />
          </section>

          {/* FOOTER DO MODAL */}
          <div className="sticky bottom-0 bg-white border-t border-slate-200 pt-4 flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 font-medium text-sm flex items-center justify-center gap-2 transition-colors"
            >
              <X size={16} /> Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2.5 bg-[#0d9488] text-white rounded-lg hover:bg-[#0f766e] font-medium text-sm flex items-center justify-center gap-2 transition-colors"
            >
              <Save size={16} /> Salvar Obrigação
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}