'use client';

import { useEffect, useState, useCallback } from 'react';
import api from '@/lib/axios';
import { toast } from 'sonner';
import {
  FolderKanban,
  Plus,
  Clock,
  AlertCircle,
  X,
  Calendar,
  Search,
  Filter,
  CheckCircle2,
  Loader2,
  AlertTriangle,
  ListTodo,
} from 'lucide-react';

// =================================================================
// CONSTANTES — Configuração das colunas do Kanban
// =================================================================
const COLUMNS = [
  { id: 'BACKLOG', label: 'Backlog', color: 'bg-slate-100 text-slate-700', border: 'border-slate-300', icon: ListTodo },
  { id: 'TODO', label: 'A Fazer', color: 'bg-blue-100 text-blue-700', border: 'border-blue-300', icon: Clock },
  { id: 'IN_PROGRESS', label: 'Em Andamento', color: 'bg-amber-100 text-amber-700', border: 'border-amber-300', icon: Loader2 },
  { id: 'REVIEW', label: 'Revisão', color: 'bg-purple-100 text-purple-700', border: 'border-purple-300', icon: Search },
  { id: 'DONE', label: 'Concluído', color: 'bg-emerald-100 text-emerald-700', border: 'border-emerald-300', icon: CheckCircle2 },
];

const PRIORITY_CONFIG: Record<string, { label: string; cls: string }> = {
  LOW: { label: 'Baixa', cls: 'bg-slate-200 text-slate-700' },
  MEDIUM: { label: 'Média', cls: 'bg-blue-200 text-blue-800' },
  HIGH: { label: 'Alta', cls: 'bg-orange-200 text-orange-800' },
  URGENT: { label: 'Urgente', cls: 'bg-red-200 text-red-800' },
};

const CATEGORIES = [
  { value: 'FISCAL', label: 'Fiscal' },
  { value: 'CONTABIL', label: 'Contábil' },
  { value: 'DEPARTAMENTO_PESSOAL', label: 'Departamento Pessoal' },
  { value: 'SOCIETARIO', label: 'Societário' },
  { value: 'FINANCEIRO', label: 'Financeiro' },
  { value: 'COMERCIAL', label: 'Comercial' },
  { value: 'INTERNO', label: 'Interno' },
  { value: 'OUTRO', label: 'Outro' },
];

// =================================================================
// TIPOS
// =================================================================
interface Task {
  id: string;
  title: string;
  description?: string;
  status: string;
  priority: string;
  category?: string;
  dueDate?: string;
  estimatedHours?: number;
  projectId?: string;
  project?: { id: string; name: string } | null;
  createdAt: string;
}

interface Project {
  id: string;
  name: string;
}

interface TaskMetrics {
  total: number;
  backlog: number;
  todo: number;
  inProgress: number;
  review: number;
  done: number;
  overdue: number;
  unassigned: number;
  completionRate: number;
}

// =================================================================
// COMPONENTE PRINCIPAL
// =================================================================
export default function TarefasPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [metrics, setMetrics] = useState<TaskMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState('');
  const [filterProject, setFilterProject] = useState('');
  const [filterPriority, setFilterPriority] = useState('');

  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);

  const [form, setForm] = useState({
    title: '',
    description: '',
    status: 'BACKLOG',
    priority: 'MEDIUM',
    category: 'OUTRO',
    dueDate: '',
    estimatedHours: '',
    projectId: '',
  });

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [tasksRes, projectsRes, metricsRes] = await Promise.all([
        api.get('/tasks'),
        api.get('/projects'),
        api.get('/tasks/metrics'),
      ]);
      setTasks(tasksRes.data);
      setProjects(projectsRes.data);
      setMetrics(metricsRes.data);
    } catch (error) {
      toast.error('Erro ao carregar dados do quadro');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // =================================================================
  // DRAG & DROP
  // =================================================================
  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    setDraggedTaskId(taskId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', taskId);
  };

  const handleDragOver = (e: React.DragEvent, columnId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverColumn(columnId);
  };

  const handleDragLeave = () => {
    setDragOverColumn(null);
  };

  const handleDrop = async (e: React.DragEvent, newStatus: string) => {
    e.preventDefault();
    setDragOverColumn(null);
    
    if (!draggedTaskId) return;

    const task = tasks.find((t) => t.id === draggedTaskId);
    if (task?.status === newStatus) {
      setDraggedTaskId(null);
      return;
    }

    try {
      await api.patch(`/tasks/${draggedTaskId}`, { 
        status: newStatus,
        completedAt: newStatus === 'DONE' ? new Date().toISOString() : null,
      });
      
      toast.success(`Tarefa movida para "${COLUMNS.find((c) => c.id === newStatus)?.label}"`);
      loadData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erro ao mover tarefa');
    } finally {
      setDraggedTaskId(null);
    }
  };

  // =================================================================
  // MODAL E FORMULÁRIO
  // =================================================================
  const openModal = () => {
    setForm({
      title: '',
      description: '',
      status: 'BACKLOG',
      priority: 'MEDIUM',
      category: 'OUTRO',
      dueDate: '',
      estimatedHours: '',
      projectId: '',
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!form.title.trim()) {
      toast.error('O título é obrigatório');
      return;
    }

    try {
      // 🛡️ CONSTRUÇÃO CONDICIONAL DO PAYLOAD
      // Só envia o campo se ele tiver um valor válido, evitando strings vazias ou nulls
      const payload: any = {
        title: form.title.trim(),
      };

      if (form.description?.trim()) payload.description = form.description.trim();
      if (form.status) payload.status = form.status;
      if (form.priority) payload.priority = form.priority;
      if (form.category) payload.category = form.category;
      if (form.projectId) payload.projectId = form.projectId;
      if (form.dueDate) payload.dueDate = form.dueDate; // O input type="date" já envia "YYYY-MM-DD"
      if (form.estimatedHours) payload.estimatedHours = Number(form.estimatedHours);

      await api.post('/tasks', payload);
      
      toast.success('Tarefa criada com sucesso!');
      setShowModal(false);
      loadData();
    } catch (error: any) {
      // 🔍 LOG DE DEBUG: Abra o Console do Navegador (F12) para ver o erro exato de validação
      console.error('🚨 Erro de Validação do Backend:', error.response?.data);
      
      // Tenta extrair a mensagem de erro específica do class-validator
      const errorMsg = Array.isArray(error.response?.data?.message) 
        ? error.response.data.message.join(', ') 
        : (error.response?.data?.message || 'Erro ao criar tarefa. Verifique os dados.');
        
      toast.error(errorMsg);
    }
  };
  // =================================================================
  // FILTRAGEM E HELPERS
  // =================================================================
  const filteredTasks = tasks.filter((task) => {
    if (search) {
      const q = search.toLowerCase();
      const matchTitle = task.title.toLowerCase().includes(q);
      const matchDesc = task.description?.toLowerCase().includes(q);
      if (!matchTitle && !matchDesc) return false;
    }
    if (filterProject && task.projectId !== filterProject) return false;
    if (filterPriority && task.priority !== filterPriority) return false;
    return true;
  });

  const isOverdue = (task: Task) => {
    if (!task.dueDate || task.status === 'DONE') return false;
    return new Date(task.dueDate) < new Date();
  };

  // =================================================================
  // RENDER
  // =================================================================
  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-120px)]">
        <div className="text-center">
          <Loader2 className="animate-spin mx-auto text-teal-600" size={48} />
          <p className="text-slate-600 mt-4 font-medium">Carregando quadro de tarefas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* HEADER */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <FolderKanban className="text-teal-600" size={28} />
            Quadro de Tarefas
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Arraste as tarefas entre as colunas para atualizar o status automaticamente.
          </p>
        </div>
        <button
          onClick={openModal}
          className="flex items-center gap-2 bg-teal-600 text-white px-4 py-2.5 rounded-lg hover:bg-teal-700 font-medium shadow-sm transition-colors"
        >
          <Plus size={18} />
          Nova Tarefa
        </button>
      </div>

      {/* KPIs */}
      {metrics && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
          <KPICard label="Total" value={metrics.total} icon={<ListTodo size={16} />} color="slate" />
          <KPICard label="Em Andamento" value={metrics.inProgress} icon={<Loader2 size={16} />} color="amber" />
          <KPICard label="Em Revisão" value={metrics.review} icon={<Search size={16} />} color="purple" />
          <KPICard label="Concluídas" value={metrics.done} icon={<CheckCircle2 size={16} />} color="emerald" />
          <KPICard label="Atrasadas" value={metrics.overdue} icon={<AlertCircle size={16} />} color="red" />
          <KPICard label="Taxa de Conclusão" value={`${metrics.completionRate}%`} icon={<CheckCircle2 size={16} />} color="blue" />
        </div>
      )}

      {/* FILTROS */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por título ou descrição..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-teal-500 focus:border-transparent"
          />
        </div>
        
        <select
          value={filterProject}
          onChange={(e) => setFilterProject(e.target.value)}
          className="px-4 py-2.5 border border-slate-300 rounded-lg text-sm text-slate-900 bg-white focus:ring-2 focus:ring-teal-500 focus:border-transparent min-w-[200px]"
        >
          <option value="">Todos os projetos</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>

        <select
          value={filterPriority}
          onChange={(e) => setFilterPriority(e.target.value)}
          className="px-4 py-2.5 border border-slate-300 rounded-lg text-sm text-slate-900 bg-white focus:ring-2 focus:ring-teal-500 focus:border-transparent min-w-[160px]"
        >
          <option value="">Todas as prioridades</option>
          {Object.entries(PRIORITY_CONFIG).map(([key, cfg]) => (
            <option key={key} value={key}>{cfg.label}</option>
          ))}
        </select>
      </div>

      {/* KANBAN BOARD */}
      <div className="flex gap-4 overflow-x-auto pb-4">
        {COLUMNS.map((col) => {
          const colTasks = filteredTasks.filter((t) => t.status === col.id);
          const Icon = col.icon;
          
          return (
            <div
              key={col.id}
              onDragOver={(e) => handleDragOver(e, col.id)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, col.id)}
              className={`flex-shrink-0 w-80 rounded-xl p-3 flex flex-col transition-colors ${
                dragOverColumn === col.id ? 'bg-teal-50 ring-2 ring-teal-400' : 'bg-slate-50'
              }`}
              style={{ minHeight: '500px' }}
            >
              <div className={`flex items-center justify-between mb-3 px-3 py-2 rounded-lg ${col.color} border ${col.border}`}>
                <div className="flex items-center gap-2">
                  <Icon size={14} />
                  <span className="font-bold text-sm">{col.label}</span>
                </div>
                <span className="text-xs font-bold bg-white/70 px-2 py-0.5 rounded-full">
                  {colTasks.length}
                </span>
              </div>

              <div className="flex-1 space-y-2 overflow-y-auto">
                {colTasks.map((task) => {
                  const prio = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.MEDIUM;
                  const overdue = isOverdue(task);
                  
                  return (
                    <div
                      key={task.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, task.id)}
                      className={`bg-white p-3 rounded-lg border shadow-sm cursor-grab active:cursor-grabbing hover:shadow-md transition-all ${
                        overdue ? 'border-red-300 bg-red-50/30' : 'border-slate-200 hover:border-teal-400'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-2 gap-2">
                        <h4 className="font-semibold text-sm text-slate-900 line-clamp-2 flex-1">
                          {task.title}
                        </h4>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold flex-shrink-0 ${prio.cls}`}>
                          {prio.label}
                        </span>
                      </div>

                      {task.description && (
                        <p className="text-xs text-slate-600 mb-2 line-clamp-2">
                          {task.description}
                        </p>
                      )}

                      <div className="space-y-1 text-[10px] text-slate-500">
                        {task.project && (
                          <div className="flex items-center gap-1">
                            <FolderKanban size={10} />
                            <span className="truncate font-medium">{task.project.name}</span>
                          </div>
                        )}
                        
                        {task.category && task.category !== 'OUTRO' && (
                          <div className="flex items-center gap-1">
                            <Filter size={10} />
                            <span>{CATEGORIES.find((c) => c.value === task.category)?.label}</span>
                          </div>
                        )}
                        
                        {task.dueDate && (
                          <div className={`flex items-center gap-1 ${overdue ? 'text-red-600 font-semibold' : ''}`}>
                            <Calendar size={10} />
                            <span>{new Date(task.dueDate).toLocaleDateString('pt-BR')}</span>
                            {overdue && <AlertTriangle size={10} />}
                          </div>
                        )}
                        
                        {task.estimatedHours && (
                          <div className="flex items-center gap-1">
                            <Clock size={10} />
                            <span>{task.estimatedHours}h estimadas</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}

                {colTasks.length === 0 && (
                  <div className="text-center py-8 text-slate-400 text-xs border-2 border-dashed border-slate-200 rounded-lg">
                    {search || filterProject || filterPriority 
                      ? 'Nenhuma tarefa com estes filtros'
                      : 'Arraste tarefas para cá'}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* MODAL DE CRIAÇÃO */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <Plus className="text-teal-600" size={20} />
                Nova Tarefa
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Título <span className="text-red-500">*</span>
                </label>
                <input
                  required
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-slate-900 focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  placeholder="Ex: Revisar apuração ICMS do cliente X"
                  maxLength={160}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Descrição
                </label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={3}
                  className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-slate-900 focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  placeholder="Detalhes, contexto, documentos necessários..."
                  maxLength={2000}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Prioridade</label>
                  <select
                    value={form.priority}
                    onChange={(e) => setForm({ ...form, priority: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-slate-900 bg-white focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  >
                    {Object.entries(PRIORITY_CONFIG).map(([key, cfg]) => (
                      <option key={key} value={key}>{cfg.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Categoria</label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-slate-900 bg-white focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat.value} value={cat.value}>{cat.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Projeto (opcional)</label>
                  <select
                    value={form.projectId}
                    onChange={(e) => setForm({ ...form, projectId: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-slate-900 bg-white focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  >
                    <option value="">— Sem projeto —</option>
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Prazo (opcional)</label>
                  <input
                    type="date"
                    value={form.dueDate}
                    onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-slate-900 focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Horas estimadas (opcional)</label>
                <input
                  type="number"
                  min="0"
                  step="0.5"
                  value={form.estimatedHours}
                  onChange={(e) => setForm({ ...form, estimatedHours: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-slate-900 focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  placeholder="Ex: 4"
                />
              </div>

              <div className="flex gap-2 justify-end pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-50 font-medium transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 font-medium transition-colors shadow-sm"
                >
                  Criar Tarefa
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// =================================================================
// COMPONENTE AUXILIAR: KPI Card
// =================================================================
function KPICard({ label, value, icon, color }: { label: string; value: number | string; icon: React.ReactNode; color: string }) {
  const colors: Record<string, string> = {
    slate: 'bg-slate-50 border-slate-200 text-slate-700',
    teal: 'bg-teal-50 border-teal-200 text-teal-700',
    amber: 'bg-amber-50 border-amber-200 text-amber-700',
    emerald: 'bg-emerald-50 border-emerald-200 text-emerald-700',
    red: 'bg-red-50 border-red-200 text-red-700',
    blue: 'bg-blue-50 border-blue-200 text-blue-700',
    purple: 'bg-purple-50 border-purple-200 text-purple-700',
  };

  return (
    <div className={`p-4 rounded-xl border ${colors[color] || colors.slate}`}>
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-semibold uppercase">{label}</span>
        <span className="opacity-70">{icon}</span>
      </div>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  );
}