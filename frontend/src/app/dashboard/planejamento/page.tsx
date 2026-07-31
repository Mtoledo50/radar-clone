'use client';

/**
 * =================================================================
 * MÓDULO DE PLANEJAMENTO ESTRATÉGICO (VERSÃO CONTA CERTA)
 * =================================================================
 * 
 * CARACTERÍSTICAS:
 * - Identidade visual Teal/Laranja/Cinza aplicada.
 * - Correção definitiva de inputs (texto sempre visível).
 * - Notificações Toast elegantes (sonner).
 * - Exportação CSV com suporte a UTF-8.
 * - Barras de progresso visuais para acompanhamento de metas.
 */

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import api from '@/lib/axios';
import { exportToCSV } from '@/lib/exportToCSV';
import { toast } from 'sonner';
import {
  Target, CheckCircle, Clock, Calendar, Plus, Search,
  Edit2, Trash2, X, Loader2, AlertCircle, Download
} from 'lucide-react';

// --- TIPOS (TypeScript) ---
interface Planning {
  id: string;
  title: string;
  description: string;
  category: string;
  targetDate: string;
  status: string;
  progress: number;
}

interface Metrics {
  totalPlans: number;
  completedPlans: number;
  averageProgress: number;
}

export default function PlanejamentoPage() {
  const { user } = useAuthStore();
  
  // --- ESTADOS ---
  const [plannings, setPlannings] = useState<Planning[]>([]);
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    title: '', description: '', category: 'COMERCIAL',
    targetDate: '', status: 'PENDENTE', progress: '0',
  });

  // 🔥 CLASSE MÁGICA PARA INPUTS (CORREÇÃO DEFINITIVA)
  const inputClass = 
    "w-full px-3 py-2.5 border border-slate-300 rounded-lg " +
    "text-slate-900 placeholder:text-slate-400 " + 
    "focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all bg-white";

  // 1. CARREGAR DADOS
  useEffect(() => { loadData(); }, []);

  async function loadData() {
    try {
      setLoading(true);
      setError(null);
      const [planRes, metRes] = await Promise.all([
        api.get('/plannings').catch(() => ({ data: { data: [] } })),
        api.get('/plannings/metrics').catch(() => ({ data: { data: null } })),
      ]);
      setPlannings(planRes.data.data || []);
      setMetrics(metRes.data.data || null);
    } catch (err: any) {
      setError('Erro ao carregar dados.');
      toast.error('Falha ao carregar dados de planejamento');
    } finally {
      setLoading(false);
    }
  }

  // 2. FILTRAGEM INTELIGENTE
  const filteredPlannings = plannings.filter((plan) =>
    plan.title.toLowerCase().includes(search.toLowerCase()) ||
    plan.category.toLowerCase().includes(search.toLowerCase()) ||
    plan.status.toLowerCase().includes(search.toLowerCase())
  );

  // 3. ABRIR FORMULÁRIO
  function openForm(planning?: Planning) {
    if (planning) {
      setEditingId(planning.id);
      setForm({
        title: planning.title, description: planning.description || '',
        category: planning.category,
        targetDate: planning.targetDate.split('T')[0],
        status: planning.status, progress: planning.progress.toString(),
      });
    } else {
      setEditingId(null);
      setForm({
        title: '', description: '', category: 'COMERCIAL',
        targetDate: '', status: 'PENDENTE', progress: '0',
      });
    }
    setShowForm(true);
  }

  // 4. SALVAR (POST ou PUT)
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        ...form,
        progress: parseFloat(form.progress) || 0,
        targetDate: form.targetDate,
      };
      
      if (editingId) {
        await api.put(`/plannings/${editingId}`, payload);
        toast.success('Planejamento atualizado com sucesso!');
      } else {
        await api.post('/plannings', payload);
        toast.success('Planejamento criado com sucesso!');
      }
      
      setShowForm(false);
      await loadData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Erro ao salvar planejamento.');
    } finally {
      setSubmitting(false);
    }
  }

  // 5. REMOVER COM TOAST INTERATIVO
  function handleDelete(id: string) {
    toast('Tem certeza que deseja remover este planejamento?', {
      description: 'Esta ação não pode ser desfeita.',
      action: {
        label: 'Remover',
        onClick: async () => {
          try {
            await api.delete(`/plannings/${id}`);
            toast.success('Planejamento removido com sucesso!');
            await loadData();
          } catch (err) {
            toast.error('Erro ao remover planejamento.');
          }
        },
      },
      cancel: { label: 'Cancelar' },
      style: { background: '#ffffff', color: '#0f172a', border: '1px solid #e2e8f0' },
    });
  }

  // 6. EXPORTAR PARA CSV
  function handleExport() {
    const dataToExport = search.trim() !== '' ? filteredPlannings : plannings;
    if (dataToExport.length === 0) {
      toast.warning('Nenhum dado disponível para exportar');
      return;
    }
    exportToCSV(dataToExport, 'planejamento_estrategico_conta_certa');
    toast.success(`${dataToExport.length} meta(s) exportada(s) com sucesso!`);
  }

  // Função auxiliar para cor do status (Atualizada para a paleta da marca)
  function getStatusColor(status: string) {
    switch (status) {
      case 'CONCLUIDO': return 'bg-green-100 text-green-800';
      case 'EM_ANDAMENTO': return 'bg-orange-100 text-orange-800'; // Laranja da marca
      default: return 'bg-slate-100 text-slate-800'; // Cinza neutro para pendente
    }
  }

  // --- RENDERIZAÇÃO: CARREGAMENTO ---
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="h-12 w-12 text-teal-600 animate-spin mb-4" />
        <p className="text-slate-600 font-medium">Carregando planejamentos...</p>
      </div>
    );
  }

  // --- RENDERIZAÇÃO: ERRO ---
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
        <p className="text-slate-700 mb-4">{error}</p>
        <button onClick={loadData} className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors">
          Tentar novamente
        </button>
      </div>
    );
  }

  // --- RENDERIZAÇÃO: TELA PRINCIPAL ---
  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Planejamento Estratégico</h1>
          <p className="text-slate-600 mt-1">Gerencie metas, objetivos e planos de ação do escritório.</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-700 hover:bg-slate-800 text-white font-semibold rounded-lg transition-colors shadow-sm"
          >
            <Download className="h-5 w-5" />
            Exportar CSV
          </button>
          <button
            onClick={() => openForm()}
            className="flex items-center gap-2 px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-lg transition-colors shadow-sm"
          >
            <Plus className="h-5 w-5" />
            Novo Planejamento
          </button>
        </div>
      </div>

      {/* Cards de Métricas */}
      {metrics && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <MetricCard icon={Target} label="Total de Metas" value={metrics.totalPlans} color="teal" />
          <MetricCard icon={CheckCircle} label="Metas Concluídas" value={metrics.completedPlans} color="green" />
          <MetricCard icon={Clock} label="Progresso Médio" value={`${metrics.averageProgress}%`} color="orange" />
        </div>
      )}

      {/* Barra de Busca */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
        <div className="relative">
          <Search className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por título, categoria ou status..."
            className={`pl-10 ${inputClass}`}
          />
        </div>
      </div>

      {/* Tabela de Planejamentos */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {filteredPlannings.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <Target className="h-12 w-12 mx-auto mb-4 text-slate-300" />
            <p className="text-lg font-medium">Nenhum planejamento cadastrado</p>
            <p className="text-sm mt-1">Clique em "Novo Planejamento" para começar</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-slate-600 uppercase tracking-wider">Meta / Objetivo</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-slate-600 uppercase tracking-wider">Categoria</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-slate-600 uppercase tracking-wider">Prazo</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-slate-600 uppercase tracking-wider">Progresso</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-slate-600 uppercase tracking-wider">Status</th>
                  <th className="text-right px-6 py-4 text-xs font-semibold text-slate-600 uppercase tracking-wider">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredPlannings.map((plan) => (
                  <tr key={plan.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-900">{plan.title}</div>
                      {plan.description && (
                        <div className="text-sm text-slate-500 truncate max-w-xs mt-1">{plan.description}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-slate-700 text-sm">{plan.category}</td>
                    <td className="px-6 py-4 text-slate-700 text-sm">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-slate-400" />
                        {new Date(plan.targetDate).toLocaleDateString('pt-BR')}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-24 bg-slate-200 rounded-full h-2 overflow-hidden">
                          <div 
                            className="bg-teal-600 h-2 rounded-full transition-all duration-500" 
                            style={{ width: `${Math.min(plan.progress, 100)}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium text-slate-700">{plan.progress}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2.5 py-1 text-xs font-semibold rounded-full ${getStatusColor(plan.status)}`}>
                        {plan.status === 'EM_ANDAMENTO' ? 'Em Andamento' : plan.status === 'CONCLUIDO' ? 'Concluído' : 'Pendente'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button onClick={() => openForm(plan)} className="text-teal-600 hover:text-teal-800 mr-3 transition-colors" title="Editar">
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button onClick={() => handleDelete(plan.id)} className="text-red-600 hover:text-red-800 transition-colors" title="Remover">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL DE FORMULÁRIO */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-slate-200 sticky top-0 bg-white z-10">
              <h2 className="text-xl font-bold text-slate-900">
                {editingId ? 'Editar Planejamento' : 'Novo Planejamento'}
              </h2>
              <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Título da Meta *</label>
                  <input type="text" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className={inputClass} placeholder="Ex: Atingir 50 clientes ativos" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Descrição / Plano de Ação</label>
                  <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} className={inputClass} placeholder="Descreva as etapas para alcançar esta meta..." />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Categoria *</label>
                  <select required value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className={inputClass}>
                    <option value="COMERCIAL">Comercial</option>
                    <option value="OPERACIONAL">Operacional</option>
                    <option value="FINANCEIRO">Financeiro</option>
                    <option value="PESSOAS">Pessoas</option>
                    <option value="TECNOLOGIA">Tecnologia</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Data Alvo *</label>
                  <input type="date" required value={form.targetDate} onChange={(e) => setForm({ ...form, targetDate: e.target.value })} className={inputClass} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Status *</label>
                  <select required value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className={inputClass}>
                    <option value="PENDENTE">Pendente</option>
                    <option value="EM_ANDAMENTO">Em Andamento</option>
                    <option value="CONCLUIDO">Concluído</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Progresso (%)</label>
                  <input type="number" min="0" max="100" value={form.progress} onChange={(e) => setForm({ ...form, progress: e.target.value })} className={inputClass} placeholder="0" />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-6 border-t border-slate-200 sticky bottom-0 bg-white">
                <button type="button" onClick={() => setShowForm(false)} className="px-5 py-2.5 text-slate-700 font-medium hover:bg-slate-100 rounded-lg transition-colors">
                  Cancelar
                </button>
                <button type="submit" disabled={submitting} className="flex items-center gap-2 px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 shadow-sm">
                  {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                  {submitting ? 'Salvando...' : 'Salvar Planejamento'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// --- COMPONENTE AUXILIAR: Card de Métrica ---
function MetricCard({ icon: Icon, label, value, color }: { icon: any; label: string; value: string | number; color: string }) {
  const colorClasses: Record<string, string> = {
    teal: 'bg-teal-50 text-teal-600',
    green: 'bg-green-50 text-green-600',
    orange: 'bg-orange-50 text-orange-600',
  };
  
  return (
    <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
      <div className="flex items-center gap-3 mb-3">
        <div className={`p-2.5 rounded-lg ${colorClasses[color]}`}>
          <Icon className="h-5 w-5" />
        </div>
        <span className="text-sm font-medium text-slate-600">{label}</span>
      </div>
      <div className="text-2xl font-bold text-slate-900">{value}</div>
    </div>
  );
}