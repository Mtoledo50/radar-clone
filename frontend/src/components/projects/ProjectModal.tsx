'use client';

/**
 * =====================================================================
 * RADAR CONTA CERTA — FRONTEND — Modal de Projeto (Criar / Editar)
 * ---------------------------------------------------------------------
 * Arquivo..: frontend/src/components/projects/ProjectModal.tsx
 * Sprint...: 31 (Homologação Docker Compose)
 *
 * COMPATIBILIDADE:
 *   A página projetos/page.tsx chama este modal com:
 *     <ProjectModal open={...} onClose={...} onSave={...} project={...} />
 *
 *   Por isso as props são: open, onClose, onSave, project.
 * =====================================================================
 */

import { useEffect, useState } from 'react';
import { Loader2, X } from 'lucide-react';
import type { CreateProjectDto, Project } from '@/types/projects';

// ---------------------------------------------------------------------
// TIPO DAS PROPS (compatível com projetos/page.tsx)
// ---------------------------------------------------------------------
interface ProjectModalProps {
  open: boolean;                              // Controla visibilidade
  onClose: () => void;                        // Fecha o modal
  onSave: (data: CreateProjectDto) => Promise<void> | void;
  project?: Project | null;                   // Projeto em edição
}

// ---------------------------------------------------------------------
// CLASSE CSS PADRÃO DOS INPUTS (identidade visual Conta Certa)
// ---------------------------------------------------------------------
const inputClass =
  'w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm text-slate-900 ' +
  'placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 ' +
  'focus:border-transparent transition-all bg-white';

// Opções fixas dos selects (iguais aos filtros da página)
const STATUS_OPTIONS = [
  { value: 'PLANNING', label: 'Planejamento' },
  { value: 'ACTIVE', label: 'Ativo' },
  { value: 'ON_HOLD', label: 'Pausado' },
  { value: 'COMPLETED', label: 'Concluído' },
  { value: 'CANCELLED', label: 'Cancelado' },
];

const PRIORITY_OPTIONS = [
  { value: 'LOW', label: 'Baixa' },
  { value: 'MEDIUM', label: 'Média' },
  { value: 'HIGH', label: 'Alta' },
  { value: 'URGENT', label: 'Urgente' },
];

// ---------------------------------------------------------------------
// COMPONENTE PRINCIPAL
// ---------------------------------------------------------------------
export default function ProjectModal({
  open,
  onClose,
  onSave,
  project,
}: ProjectModalProps) {
  // --- ESTADO DO FORMULÁRIO ---
  const [form, setForm] = useState({
    name: '',
    description: '',
    color: '#0d9488',
    status: 'PLANNING',
    priority: 'MEDIUM',
    dueDate: '',
    budget: '',
  });
  const [loading, setLoading] = useState(false);

  // --- SINCRONIZA O FORMULÁRIO quando o modal abre para editar ---
  useEffect(() => {
    if (project) {
      setForm({
        name: project.name ?? '',
        description: project.description ?? '',
        color: project.color ?? '#0d9488',
        status: project.status ?? 'PLANNING',
        priority: project.priority ?? 'MEDIUM',
        dueDate: project.dueDate ? project.dueDate.split('T')[0] : '',
        budget: project.budget != null ? String(project.budget) : '',
      });
    } else {
      setForm({
        name: '',
        description: '',
        color: '#0d9488',
        status: 'PLANNING',
        priority: 'MEDIUM',
        dueDate: '',
        budget: '',
      });
    }
  }, [project, open]);

  // Se o modal está fechado, não renderiza nada
  if (!open) return null;

  // --- ENVIO DO FORMULÁRIO ---
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const payload: CreateProjectDto = {
        name: form.name,
        description: form.description || undefined,
        color: form.color,
        status: form.status,
        priority: form.priority,
        dueDate: form.dueDate || undefined,
        budget: form.budget !== '' ? Number(form.budget) : undefined,
      };

      await onSave(payload);
      // O modal só fecha após onSave (a página controla isso via onClose)
    } catch (error) {
      // Erros de API são tratados pela página
      console.error('Erro ao salvar projeto:', error);
    } finally {
      setLoading(false);
    }
  }

  // ---------------------------------------------------------------------
  // RENDERIZAÇÃO
  // ---------------------------------------------------------------------
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto flex flex-col">
        {/* Cabeçalho fixo */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200 sticky top-0 bg-white z-10 rounded-t-2xl">
          <h2 className="text-xl font-bold text-slate-900">
            {project ? 'Editar Projeto' : 'Novo Projeto'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-2 rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 flex-1">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Nome do Projeto *
            </label>
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className={inputClass}
              placeholder="Ex: Implantação de ERP — Cliente X"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Descrição
            </label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={3}
              className={inputClass}
              placeholder="Descreva o escopo do projeto..."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Cor de Identificação
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={form.color}
                  onChange={(e) => setForm({ ...form, color: e.target.value })}
                  className="w-12 h-10 rounded-lg border border-slate-200 cursor-pointer"
                />
                <input
                  type="text"
                  value={form.color}
                  onChange={(e) => setForm({ ...form, color: e.target.value })}
                  className={`${inputClass} font-mono`}
                  placeholder="#0d9488"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Prazo (Due Date)
              </label>
              <input
                type="date"
                value={form.dueDate}
                onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                className={inputClass}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Status
              </label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
                className={inputClass}
              >
                {STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
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
                onChange={(e) => setForm({ ...form, priority: e.target.value })}
                className={inputClass}
              >
                {PRIORITY_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Orçamento (R$)
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={form.budget}
              onChange={(e) => setForm({ ...form, budget: e.target.value })}
              className={inputClass}
              placeholder="0,00"
            />
          </div>

          {/* Rodapé fixo */}
          <div className="flex justify-end gap-3 pt-6 border-t border-slate-200 sticky bottom-0 bg-white mt-auto">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 text-slate-700 font-medium hover:bg-slate-100 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {loading ? 'Salvando...' : project ? 'Atualizar' : 'Criar Projeto'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}