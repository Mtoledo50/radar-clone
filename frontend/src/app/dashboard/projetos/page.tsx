'use client';

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import {
  FolderKanban,
  Plus,
  Search,
  Pencil,
  Trash2,
  Calendar,
  Users,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Loader2,
  X,
} from 'lucide-react';
import api from '@/lib/axios';
import { Project, ProjectMetrics, ProjectFilters, CreateProjectDto } from '@/types/projects';
import ProjectModal from '@/components/projects/ProjectModal';
import ProjectStatusBadge from '@/components/projects/ProjectStatusBadge';
import ProjectPriorityBadge from '@/components/projects/ProjectPriorityBadge';

export default function ProjetosPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [metrics, setMetrics] = useState<ProjectMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<Project | null>(null);
  const [filters, setFilters] = useState<ProjectFilters>({});

  const fetchProjects = useCallback(async () => {
    try {
      setLoading(true);
      const params = Object.fromEntries(
        Object.entries(filters).filter(([_, v]) => v !== '' && v !== undefined)
      );
      const { data } = await api.get('/projects', { params });
      setProjects(data);
    } catch (error) {
      toast.error('Erro ao carregar projetos');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const fetchMetrics = useCallback(async () => {
    try {
      const { data } = await api.get('/projects/metrics');
      setMetrics(data);
    } catch (error) {
      console.error('Erro ao carregar métricas');
    }
  }, []);

  useEffect(() => {
    fetchProjects();
    fetchMetrics();
  }, [fetchProjects, fetchMetrics]);

  const handleCreate = () => {
    setEditingProject(null);
    setModalOpen(true);
  };

  const handleEdit = (project: Project) => {
    setEditingProject(project);
    setModalOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    try {
      await api.delete(`/projects/${deleteConfirm.id}`);
      toast.success('Projeto removido com sucesso');
      setDeleteConfirm(null);
      fetchProjects();
      fetchMetrics();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erro ao remover projeto');
    }
  };

  const handleSave = async (dto: CreateProjectDto) => {
    try {
      if (editingProject) {
        await api.patch(`/projects/${editingProject.id}`, dto);
        toast.success('Projeto atualizado com sucesso');
      } else {
        await api.post('/projects', dto);
        toast.success('Projeto criado com sucesso');
      }
      setModalOpen(false);
      fetchProjects();
      fetchMetrics();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erro ao salvar projeto');
      throw error;
    }
  };

  const kpiCards = [
    {
      label: 'Total de Projetos',
      value: metrics?.total ?? 0,
      icon: FolderKanban,
      color: 'bg-slate-50 text-slate-600',
      iconColor: 'text-slate-500',
    },
    {
      label: 'Ativos',
      value: metrics?.active ?? 0,
      icon: Clock,
      color: 'bg-teal-50 text-teal-700',
      iconColor: 'text-teal-600',
    },
    {
      label: 'Concluídos',
      value: metrics?.completed ?? 0,
      icon: CheckCircle2,
      color: 'bg-emerald-50 text-emerald-700',
      iconColor: 'text-emerald-600',
    },
    {
      label: 'Atrasados',
      value: metrics?.overdue ?? 0,
      icon: AlertTriangle,
      color: 'bg-red-50 text-red-700',
      iconColor: 'text-red-500',
    },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Projetos</h1>
          <p className="text-sm text-slate-500 mt-1">
            Gerencie projetos e acompanhe o progresso das entregas
          </p>
        </div>
        <button
          onClick={handleCreate}
          className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white px-4 py-2.5 rounded-lg font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          Novo Projeto
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiCards.map((card) => (
          <div
            key={card.label}
            className="bg-white rounded-xl border border-slate-200 p-5 flex items-center gap-4"
          >
            <div className={`p-3 rounded-lg ${card.color}`}>
              <card.icon className={`w-5 h-5 ${card.iconColor}`} />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-800">{card.value}</p>
              <p className="text-xs text-slate-500">{card.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Progresso Geral */}
      {metrics && metrics.totalTasks > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-slate-700">
              Progresso Geral das Tarefas
            </span>
            <span className="text-sm font-bold text-teal-600">
              {metrics.overallProgress}%
            </span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2.5">
            <div
              className="bg-teal-600 h-2.5 rounded-full transition-all duration-500"
              style={{ width: `${metrics.overallProgress}%` }}
            />
          </div>
          <p className="text-xs text-slate-400 mt-2">
            {metrics.completedTasks} de {metrics.totalTasks} tarefas concluídas
          </p>
        </div>
      )}

      {/* Filtros */}
      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por nome ou descrição..."
              value={filters.search || ''}
              onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
              className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            />
          </div>
          <select
            value={filters.status || ''}
            onChange={(e) =>
              setFilters((f) => ({ ...f, status: e.target.value as any }))
            }
            className="px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
          >
            <option value="">Todos os status</option>
            <option value="PLANNING">Planejamento</option>
            <option value="ACTIVE">Ativo</option>
            <option value="ON_HOLD">Pausado</option>
            <option value="COMPLETED">Concluído</option>
            <option value="CANCELLED">Cancelado</option>
          </select>
          <select
            value={filters.priority || ''}
            onChange={(e) =>
              setFilters((f) => ({ ...f, priority: e.target.value as any }))
            }
            className="px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
          >
            <option value="">Todas as prioridades</option>
            <option value="LOW">Baixa</option>
            <option value="MEDIUM">Média</option>
            <option value="HIGH">Alta</option>
            <option value="URGENT">Urgente</option>
          </select>
        </div>
      </div>

      {/* Lista de Projetos */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 text-teal-600 animate-spin" />
          </div>
        ) : projects.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400">
            <FolderKanban className="w-12 h-12 mb-3" />
            <p className="text-sm">Nenhum projeto encontrado</p>
            <button
              onClick={handleCreate}
              className="mt-4 text-teal-600 hover:text-teal-700 text-sm font-medium"
            >
              Criar primeiro projeto
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50">
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Projeto
                  </th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Prioridade
                  </th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Prazo
                  </th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Progresso
                  </th>
                  <th className="text-right px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {projects.map((project) => (
                  <tr
                    key={project.id}
                    className="hover:bg-slate-50/50 transition-colors"
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-3 h-3 rounded-full flex-shrink-0"
                          style={{ backgroundColor: project.color || '#0d9488' }}
                        />
                        <div>
                          <p className="font-medium text-slate-800">
                            {project.name}
                          </p>
                          {project.client && (
                            <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                              <Users className="w-3 h-3" />
                              {project.client?.companyName ?? project.client?.name ?? '—'}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <ProjectStatusBadge status={project.status} />
                    </td>
                    <td className="px-5 py-4">
                      <ProjectPriorityBadge priority={project.priority} />
                    </td>
                    <td className="px-5 py-4">
                      {project.dueDate ? (
                        <span className="text-sm text-slate-600 flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          {new Date(project.dueDate).toLocaleDateString('pt-BR')}
                        </span>
                      ) : (
                        <span className="text-sm text-slate-300">—</span>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-16 bg-slate-100 rounded-full h-1.5">
                          <div
                            className="bg-teal-500 h-1.5 rounded-full"
                            style={{ width: `${project.progress}%` }}
                          />
                        </div>
                        <span className="text-xs text-slate-500 w-8">
                          {project.progress}%
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleEdit(project)}
                          className="p-2 text-slate-400 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors"
                          title="Editar"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(project)}
                          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Excluir"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Criar/Editar */}
      <ProjectModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSave}
        project={editingProject}
      />

      {/* Modal Confirmar Exclusão */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-red-50 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-red-500" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-slate-800">
                  Excluir projeto
                </h3>
                <p className="text-sm text-slate-500 mt-1">
                  Tem certeza que deseja excluir{' '}
                  <strong>{deleteConfirm.name}</strong>?
                  {(deleteConfirm.totalTasks ?? 0) > 0 && (
                    <span className="block mt-2 text-amber-600">
                      ⚠️ Este projeto possui {deleteConfirm.totalTasks} tarefa(s)
                      vinculada(s). Todas devem ser concluídas ou removidas antes
                      da exclusão.
                    </span>
                  )}
                </p>
              </div>
              <button
                onClick={() => setDeleteConfirm(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}