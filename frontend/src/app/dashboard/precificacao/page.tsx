'use client';

/**
 * =================================================================
 * MÓDULO DE PRECIFICAÇÃO (VERSÃO CONTA CERTA)
 * =================================================================
 * 
 * CARACTERÍSTICAS:
 * - Identidade visual Teal/Laranja/Cinza aplicada.
 * - Correção definitiva de inputs (texto sempre visível).
 * - Notificações Toast elegantes (sonner).
 * - Exportação CSV com suporte a UTF-8.
 * - Cálculo e gestão de honorários contábeis.
 */

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import api from '@/lib/axios';
import { exportToCSV } from '@/lib/exportToCSV';
import { toast } from 'sonner';
import {
  Calculator, DollarSign, TrendingUp, FileText, Plus, Search,
  Edit2, Trash2, X, Loader2, AlertCircle, Download
} from 'lucide-react';

// --- TIPOS (TypeScript) ---
interface Pricing {
  id: string;
  title: string;
  serviceType: string;
  complexity: string;
  estimatedHours: number;
  hourlyRate: number;
  softwareCost: number;
  profitMargin: number;
  finalValue: number;
  status: string;
  observations: string;
}

interface Metrics {
  totalPricings: number;
  averageFinalValue: number;
}

export default function PrecificacaoPage() {
  const { user } = useAuthStore();
  
  // --- ESTADOS ---
  const [pricings, setPricings] = useState<Pricing[]>([]);
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    title: '', serviceType: 'CONTABIL', complexity: 'MEDIA',
    estimatedHours: '', hourlyRate: '', softwareCost: '',
    profitMargin: '20', finalValue: '', status: 'RASCUNHO', observations: '',
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
      const [priRes, metRes] = await Promise.all([
        api.get('/pricings').catch(() => ({ data: { data: [] } })),
        api.get('/pricings/metrics').catch(() => ({ data: { data: null } })),
      ]);
      setPricings(priRes.data.data || []);
      setMetrics(metRes.data.data || null);
    } catch (err: any) {
      setError('Erro ao carregar dados.');
      toast.error('Falha ao carregar dados de precificação');
    } finally {
      setLoading(false);
    }
  }

  // 2. FILTRAGEM INTELIGENTE
  const filteredPricings = pricings.filter((pri) =>
    pri.title.toLowerCase().includes(search.toLowerCase()) ||
    pri.serviceType.toLowerCase().includes(search.toLowerCase()) ||
    pri.status.toLowerCase().includes(search.toLowerCase())
  );

  // 3. ABRIR FORMULÁRIO
  function openForm(pricing?: Pricing) {
    if (pricing) {
      setEditingId(pricing.id);
      setForm({
        title: pricing.title, serviceType: pricing.serviceType,
        complexity: pricing.complexity,
        estimatedHours: pricing.estimatedHours.toString(),
        hourlyRate: pricing.hourlyRate.toString(),
        softwareCost: pricing.softwareCost.toString(),
        profitMargin: pricing.profitMargin.toString(),
        finalValue: pricing.finalValue.toString(),
        status: pricing.status, observations: pricing.observations || '',
      });
    } else {
      setEditingId(null);
      setForm({
        title: '', serviceType: 'CONTABIL', complexity: 'MEDIA',
        estimatedHours: '', hourlyRate: '', softwareCost: '',
        profitMargin: '20', finalValue: '', status: 'RASCUNHO', observations: '',
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
        estimatedHours: parseFloat(form.estimatedHours) || 0,
        hourlyRate: parseFloat(form.hourlyRate) || 0,
        softwareCost: parseFloat(form.softwareCost) || 0,
        profitMargin: parseFloat(form.profitMargin) || 0,
        finalValue: parseFloat(form.finalValue) || 0,
      };
      
      if (editingId) {
        await api.put(`/pricings/${editingId}`, payload);
        toast.success('Precificação atualizada com sucesso!');
      } else {
        await api.post('/pricings', payload);
        toast.success('Precificação criada com sucesso!');
      }
      
      setShowForm(false);
      await loadData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Erro ao salvar precificação.');
    } finally {
      setSubmitting(false);
    }
  }

  // 5. REMOVER COM TOAST INTERATIVO
  function handleDelete(id: string) {
    toast('Tem certeza que deseja remover esta precificação?', {
      description: 'Esta ação não pode ser desfeita.',
      action: {
        label: 'Remover',
        onClick: async () => {
          try {
            await api.delete(`/pricings/${id}`);
            toast.success('Precificação removida com sucesso!');
            await loadData();
          } catch (err) {
            toast.error('Erro ao remover precificação.');
          }
        },
      },
      cancel: { label: 'Cancelar' },
      style: { background: '#ffffff', color: '#0f172a', border: '1px solid #e2e8f0' },
    });
  }

  // 6. EXPORTAR PARA CSV
  function handleExport() {
    const dataToExport = search.trim() !== '' ? filteredPricings : pricings;
    if (dataToExport.length === 0) {
      toast.warning('Nenhum dado disponível para exportar');
      return;
    }
    exportToCSV(dataToExport, 'precificacoes_conta_certa');
    toast.success(`${dataToExport.length} precificação(ões) exportada(s) com sucesso!`);
  }

  // --- RENDERIZAÇÃO: CARREGAMENTO ---
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="h-12 w-12 text-teal-600 animate-spin mb-4" />
        <p className="text-slate-600 font-medium">Carregando precificações...</p>
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
          <h1 className="text-3xl font-bold text-slate-900">Precificação de Serviços</h1>
          <p className="text-slate-600 mt-1">Gerencie os valores, margens e propostas comerciais.</p>
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
            Nova Precificação
          </button>
        </div>
      </div>

      {/* Cards de Métricas */}
      {metrics && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard icon={FileText} label="Total de Modelos" value={metrics.totalPricings} color="teal" />
          <MetricCard icon={DollarSign} label="Valor Médio Final" value={`R$ ${metrics.averageFinalValue.toFixed(2)}`} color="green" />
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
            placeholder="Buscar por título, tipo de serviço ou status..."
            className={`pl-10 ${inputClass}`}
          />
        </div>
      </div>

      {/* Tabela de Precificações */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {filteredPricings.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <Calculator className="h-12 w-12 mx-auto mb-4 text-slate-300" />
            <p className="text-lg font-medium">Nenhuma precificação cadastrada</p>
            <p className="text-sm mt-1">Clique em "Nova Precificação" para começar</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-slate-600 uppercase tracking-wider">Título</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-slate-600 uppercase tracking-wider">Serviço</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-slate-600 uppercase tracking-wider">Complexidade</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-slate-600 uppercase tracking-wider">Valor Final</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-slate-600 uppercase tracking-wider">Status</th>
                  <th className="text-right px-6 py-4 text-xs font-semibold text-slate-600 uppercase tracking-wider">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredPricings.map((pri) => (
                  <tr key={pri.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-900">{pri.title}</div>
                    </td>
                    <td className="px-6 py-4 text-slate-700 text-sm">{pri.serviceType}</td>
                    <td className="px-6 py-4 text-slate-700 text-sm">{pri.complexity}</td>
                    <td className="px-6 py-4 font-bold text-teal-700 text-sm">R$ {pri.finalValue.toFixed(2)}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2.5 py-1 text-xs font-semibold rounded-full ${
                        pri.status === 'APROVADO' ? 'bg-teal-100 text-teal-800' : 
                        pri.status === 'RASCUNHO' ? 'bg-orange-100 text-orange-800' : 'bg-slate-100 text-slate-800'
                      }`}>
                        {pri.status === 'APROVADO' ? 'Aprovado' : pri.status === 'RASCUNHO' ? 'Rascunho' : 'Rejeitado'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button onClick={() => openForm(pri)} className="text-teal-600 hover:text-teal-800 mr-3 transition-colors" title="Editar">
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button onClick={() => handleDelete(pri.id)} className="text-red-600 hover:text-red-800 transition-colors" title="Remover">
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
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-slate-200 sticky top-0 bg-white z-10">
              <h2 className="text-xl font-bold text-slate-900">
                {editingId ? 'Editar Precificação' : 'Nova Precificação'}
              </h2>
              <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Título da Proposta *</label>
                  <input type="text" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className={inputClass} placeholder="Ex: Honorário Contábil Completo" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Tipo de Serviço *</label>
                  <select required value={form.serviceType} onChange={(e) => setForm({ ...form, serviceType: e.target.value })} className={inputClass}>
                    <option value="CONTABIL">Contábil</option>
                    <option value="FISCAL">Fiscal</option>
                    <option value="PESSOAL">Pessoal</option>
                    <option value="COMPLETO">Completo</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Complexidade *</label>
                  <select required value={form.complexity} onChange={(e) => setForm({ ...form, complexity: e.target.value })} className={inputClass}>
                    <option value="BAIXA">Baixa</option>
                    <option value="MEDIA">Média</option>
                    <option value="ALTA">Alta</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Horas Estimadas *</label>
                  <input type="number" step="0.5" required value={form.estimatedHours} onChange={(e) => setForm({ ...form, estimatedHours: e.target.value })} className={inputClass} placeholder="0" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Valor da Hora (R$) *</label>
                  <input type="number" step="0.01" required value={form.hourlyRate} onChange={(e) => setForm({ ...form, hourlyRate: e.target.value })} className={inputClass} placeholder="0.00" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Custo de Software (R$)</label>
                  <input type="number" step="0.01" value={form.softwareCost} onChange={(e) => setForm({ ...form, softwareCost: e.target.value })} className={inputClass} placeholder="0.00" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Margem de Lucro (%)</label>
                  <input type="number" step="0.1" value={form.profitMargin} onChange={(e) => setForm({ ...form, profitMargin: e.target.value })} className={inputClass} placeholder="20" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Valor Final Calculado (R$) *</label>
                  <input 
                    type="number" 
                    step="0.01" 
                    required 
                    value={form.finalValue} 
                    onChange={(e) => setForm({ ...form, finalValue: e.target.value })} 
                    className={`${inputClass} font-semibold text-teal-700`} 
                    placeholder="0.00" 
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Status *</label>
                  <select required value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className={inputClass}>
                    <option value="RASCUNHO">Rascunho</option>
                    <option value="APROVADO">Aprovado</option>
                    <option value="REJEITADO">Rejeitado</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Observações</label>
                  <textarea 
                    value={form.observations} 
                    onChange={(e) => setForm({ ...form, observations: e.target.value })} 
                    rows={3} 
                    className={inputClass} 
                    placeholder="Detalhes adicionais sobre a proposta..." 
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-6 border-t border-slate-200 sticky bottom-0 bg-white">
                <button type="button" onClick={() => setShowForm(false)} className="px-5 py-2.5 text-slate-700 font-medium hover:bg-slate-100 rounded-lg transition-colors">
                  Cancelar
                </button>
                <button type="submit" disabled={submitting} className="flex items-center gap-2 px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 shadow-sm">
                  {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                  {submitting ? 'Salvando...' : 'Salvar Precificação'}
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
    slate: 'bg-slate-50 text-slate-600',
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