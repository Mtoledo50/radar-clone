'use client';

import { useState, useEffect } from 'react';
import { X, Loader2 } from 'lucide-react';
import api from '@/lib/axios';
import { Project, CreateProjectDto, ProjectStatus, TaskPriority } from '@/types/projects';

interface ProjectModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (dto: CreateProjectDto) => Promise<void>;
  project?: Project | null;
}

const COLORS = [
  '#0d9488', // Teal (padrão)
  '#f97316', // Laranja
  '#3b82f6', // Azul
  '#8b5cf6', // Roxo
  '#ec4899', // Rosa
  '#ef4444', // Vermelho
  '#22c55e', // Verde
  '#64748b', // Cinza
];

export default function ProjectModal({ open, onClose, onSave, project }: ProjectModalProps) {
  const [saving, setSaving] = useState(false);
  const [clients, setClients] = useState<{ id: string; companyName: string }[]>([]);
  const [form, setForm] = useState<CreateProjectDto>({
    name: '',
    description: '',
    status: 'PLANNING',
    priority: 'MEDIUM',
    clientId: '',
    startDate: '',
    dueDate: '',
    color: '#0d9488',
  });

  useEffect(() => {
    if (open) {
      fetchClients();
      if (project) {
        setForm({
          name: project.name,
          description: project.description || '',
          status: project.status,
          priority: project.priority,
          clientId: project.clientId || '',
          startDate: project.startDate ? project.startDate.split('T')[0] : '',
          dueDate: project.dueDate ? project.dueDate.split('T')[0] : '',
          color: project.color || '#0d9488',
        });
      } else {
        setForm({
          name: '',
          description: '',
          status: 'PLANNING',
          priority: 'MEDIUM',
          clientId: '',
          startDate: '',
          dueDate: '',
          color: '#0d9488',
        });
      }
    }
  }, [open, project]);

  const fetchClients = async () => {
    try {
      const { data } = await api.get('/clients');
      setClients(data.slice(0, 50));
    } catch {
      // Silencioso - clientes são opcionais
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave({
        ...form,
        clientId: form.clientId || undefined,
        startDate: form.startDate || undefined,
        dueDate: form.dueDate || undefined,
      });
    } catch {
      // Erro já tratado pelo toast no parent
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <h2 className="text-lg font-semibold text-slate-800">
            {project ? 'Editar Projeto' : 'Novo Projeto'}
          </h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Nome */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Nome do projeto *
            </label>
            <input
              type="text"
              required
              maxLength={120}
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="Ex: Fechamento Mensal Julho"
              className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            />
          </div>

          {/* Descrição */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Descrição
            </label>
            <textarea
              rows={3}
              maxLength={1000}
              value={form.description || ''}
              onChange={(e) =>
                setForm((f) => ({ ...f, description: e.target.value }))
              }
              placeholder="Descreva o escopo do projeto..."
              className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none"
            />
          </div>

          {/* Cliente + Prioridade */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Cliente
              </label>
              <select
                value={form.clientId || ''}
                onChange={(e) =>
                  setForm((f) => ({ ...f, clientId: e.target.value }))
                }
                className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
              >
                <option value="">Sem cliente</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.companyName}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Prioridade
              </label>
              <select
                value={form.priority}
                onChange={(e) =>
                  setForm((f) => ({ ...f, priority: e.target.value as TaskPriority }))
                }
                className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
              >
                <option value="LOW">Baixa</option>
                <option value="MEDIUM">Média</option>
                <option value="HIGH">Alta</option>
                <option value="URGENT">Urgente</option>
              </select>
            </div>
          </div>

          {/* Status + Datas */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Status
              </label>
              <select
                value={form.status}
                onChange={(e) =>
                  setForm((f) => ({ ...f, status: e.target.value as ProjectStatus }))
                }
                className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
              >
                <option value="PLANNING">Planejamento</option>
                <option value="ACTIVE">Ativo</option>
                <option value="ON_HOLD">Pausado</option>
                <option value="COMPLETED">Concluído</option>
                <option value="CANCELLED">Cancelado</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Início
              </label>
              <input
                type="date"
                value={form.startDate || ''}
                onChange={(e) =>
                  setForm((f) => ({ ...f, startDate: e.target.value }))
                }
                className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Prazo
              </label>
              <input
                type="date"
                value={form.dueDate || ''}
                onChange={(e) =>
                  setForm((f) => ({ ...f, dueDate: e.target.value }))
                }
                className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>

          {/* Cor */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Cor de identificação
            </label>
            <div className="flex gap-2">
              {COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, color }))}
                  className={`w-8 h-8 rounded-full transition-transform ${
                    form.color === color
                      ? 'ring-2 ring-offset-2 ring-teal-500 scale-110'
                      : 'hover:scale-105'
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 rounded-lg transition-colors disabled:opacity-50"
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              {project ? 'Salvar Alterações' : 'Criar Projeto'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}