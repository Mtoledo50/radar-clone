'use client';

/**
 * =================================================================
 * MÓDULO DE GESTÃO DE CLIENTES (VERSÃO CONTA CERTA)
 * =================================================================
 * 
 * CARACTERÍSTICAS:
 * - Identidade visual Teal/Laranja/Cinza aplicada.
 * - Correção definitiva de inputs (texto sempre visível).
 * - Notificações Toast elegantes (sonner).
 * - Exportação CSV com suporte a UTF-8.
 */

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import api from '@/lib/axios';
import { exportToCSV } from '@/lib/exportToCSV';
import { toast } from 'sonner';
import {
  Briefcase, UserPlus, TrendingUp, DollarSign, Plus, Search,
  Edit2, Trash2, X, Loader2, AlertCircle, Download, Building2
} from 'lucide-react';

// --- TIPOS (TypeScript) ---
interface Client {
  id: string;
  companyName: string;
  cnpj: string;
  serviceType: string;
  monthlyFee: number;
  status: string;
  startDate: string;
  endDate: string | null;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  observations: string;
}

interface Metrics {
  totalActive: number;
  totalClients: number;
  monthlyRevenue: number;
  newClientsThisMonth: number;
  averageTicket: number;
}

export default function ClientesPage() {
  const { user } = useAuthStore();
  
  // --- ESTADOS ---
  const [clients, setClients] = useState<Client[]>([]);
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    companyName: '', cnpj: '', serviceType: 'CONTABIL', monthlyFee: '',
    status: 'ATIVO', startDate: '', endDate: '', contactName: '',
    contactEmail: '', contactPhone: '', observations: '',
  });

  // 🔥 CLASSE MÁGICA PARA INPUTS (CORREÇÃO DEFINITIVA)
  // Garante texto escuro, placeholder cinza claro e fundo branco.
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
      const [cliRes, metRes] = await Promise.all([
        api.get('/clients').catch(() => ({ data: { data: [] } })),
        api.get('/clients/metrics').catch(() => ({ data: { data: null } })),
      ]);
      setClients(cliRes.data.data || []);
      setMetrics(metRes.data.data || null);
    } catch (err: any) {
      setError('Erro ao carregar dados.');
      toast.error('Falha ao carregar dados dos clientes');
    } finally {
      setLoading(false);
    }
  }

  // 2. FILTRAGEM INTELIGENTE
  const filteredClients = clients.filter((cli) =>
    cli.companyName.toLowerCase().includes(search.toLowerCase()) ||
    cli.contactName?.toLowerCase().includes(search.toLowerCase()) ||
    cli.serviceType.toLowerCase().includes(search.toLowerCase())
  );

  // 3. ABRIR FORMULÁRIO
  function openForm(client?: Client) {
    if (client) {
      setEditingId(client.id);
      setForm({
        companyName: client.companyName, cnpj: client.cnpj || '',
        serviceType: client.serviceType, monthlyFee: client.monthlyFee.toString(),
        status: client.status, startDate: client.startDate.split('T')[0],
        endDate: client.endDate?.split('T')[0] || '', contactName: client.contactName || '',
        contactEmail: client.contactEmail || '', contactPhone: client.contactPhone || '',
        observations: client.observations || '',
      });
    } else {
      setEditingId(null);
      setForm({
        companyName: '', cnpj: '', serviceType: 'CONTABIL', monthlyFee: '',
        status: 'ATIVO', startDate: '', endDate: '', contactName: '',
        contactEmail: '', contactPhone: '', observations: '',
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
        monthlyFee: parseFloat(form.monthlyFee) || 0,
        startDate: form.startDate,
        endDate: form.endDate || undefined,
      };
      
      if (editingId) {
        await api.put(`/clients/${editingId}`, payload);
        toast.success('Cliente atualizado com sucesso!');
      } else {
        await api.post('/clients', payload);
        toast.success('Cliente criado com sucesso!');
      }
      setShowForm(false);
      await loadData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Erro ao salvar cliente.');
    } finally {
      setSubmitting(false);
    }
  }

  // 5. REMOVER COM TOAST INTERATIVO
  function handleDelete(id: string) {
    toast('Tem certeza que deseja remover este cliente?', {
      description: 'Esta ação não pode ser desfeita.',
      action: {
        label: 'Remover',
        onClick: async () => {
          try {
            await api.delete(`/clients/${id}`);
            toast.success('Cliente removido com sucesso!');
            await loadData();
          } catch (err) {
            toast.error('Erro ao remover cliente.');
          }
        },
      },
      cancel: { label: 'Cancelar' },
      style: { background: '#ffffff', color: '#0f172a', border: '1px solid #e2e8f0' },
    });
  }

  // 6. EXPORTAR PARA CSV
  function handleExport() {
    const dataToExport = search.trim() !== '' ? filteredClients : clients;
    if (dataToExport.length === 0) {
      toast.warning('Nenhum dado disponível para exportar');
      return;
    }
    exportToCSV(dataToExport, 'carteira_de_clientes');
    toast.success(`${dataToExport.length} cliente(s) exportado(s) com sucesso!`);
  }

  // --- RENDERIZAÇÃO: CARREGAMENTO ---
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="h-12 w-12 text-teal-600 animate-spin mb-4" />
        <p className="text-slate-600 font-medium">Carregando carteira de clientes...</p>
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
          <h1 className="text-3xl font-bold text-slate-900">Gestão de Clientes</h1>
          <p className="text-slate-600 mt-1">Acompanhe sua carteira e faturamento mensal.</p>
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
            Novo Cliente
          </button>
        </div>
      </div>

      {/* Cards de Métricas */}
      {metrics && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <MetricCard icon={Briefcase} label="Total Ativos" value={metrics.totalActive} color="teal" />
          <MetricCard icon={DollarSign} label="Faturamento Mensal" value={`R$ ${metrics.monthlyRevenue.toFixed(2)}`} color="green" />
          <MetricCard icon={UserPlus} label="Novos (mês)" value={metrics.newClientsThisMonth} color="orange" />
          <MetricCard icon={TrendingUp} label="Ticket Médio" value={`R$ ${metrics.averageTicket.toFixed(2)}`} color="slate" />
          <MetricCard icon={Building2} label="Total Geral" value={metrics.totalClients} color="slate" />
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
            placeholder="Buscar por empresa, contato ou tipo de serviço..."
            className={`pl-10 ${inputClass}`}
          />
        </div>
      </div>

      {/* Tabela de Clientes */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {filteredClients.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <Briefcase className="h-12 w-12 mx-auto mb-4 text-slate-300" />
            <p className="text-lg font-medium">Nenhum cliente encontrado</p>
            <p className="text-sm mt-1">Clique em "Novo Cliente" para começar</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-slate-600 uppercase tracking-wider">Empresa</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-slate-600 uppercase tracking-wider">Serviço</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-slate-600 uppercase tracking-wider">Honorário</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-slate-600 uppercase tracking-wider">Status</th>
                  <th className="text-right px-6 py-4 text-xs font-semibold text-slate-600 uppercase tracking-wider">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredClients.map((cli) => (
                  <tr key={cli.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-900">{cli.companyName}</div>
                      {cli.contactName && <div className="text-sm text-slate-500 mt-0.5">{cli.contactName}</div>}
                    </td>
                    <td className="px-6 py-4 text-slate-700 text-sm">{cli.serviceType}</td>
                    <td className="px-6 py-4 text-slate-900 font-medium text-sm">R$ {cli.monthlyFee.toFixed(2)}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2.5 py-1 text-xs font-semibold rounded-full ${
                        cli.status === 'ATIVO' ? 'bg-teal-100 text-teal-800' : 
                        cli.status === 'PROSPECT' ? 'bg-orange-100 text-orange-800' : 'bg-slate-100 text-slate-800'
                      }`}>
                        {cli.status === 'ATIVO' ? 'Ativo' : cli.status === 'PROSPECT' ? 'Prospect' : 'Inativo'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button onClick={() => openForm(cli)} className="text-teal-600 hover:text-teal-800 mr-3 transition-colors" title="Editar">
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button onClick={() => handleDelete(cli.id)} className="text-red-600 hover:text-red-800 transition-colors" title="Remover">
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
                {editingId ? 'Editar Cliente' : 'Novo Cliente'}
              </h2>
              <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Razão Social *</label>
                  <input type="text" required value={form.companyName} onChange={(e) => setForm({ ...form, companyName: e.target.value })} className={inputClass} placeholder="Ex: Empresa Exemplo LTDA" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">CNPJ</label>
                  <input type="text" value={form.cnpj} onChange={(e) => setForm({ ...form, cnpj: e.target.value })} className={inputClass} placeholder="00.000.000/0000-00" />
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
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Honorário Mensal (R$) *</label>
                  <input type="number" step="0.01" required value={form.monthlyFee} onChange={(e) => setForm({ ...form, monthlyFee: e.target.value })} className={inputClass} placeholder="0.00" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Status *</label>
                  <select required value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className={inputClass}>
                    <option value="ATIVO">Ativo</option>
                    <option value="PROSPECT">Prospect</option>
                    <option value="INATIVO">Inativo</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Data de Início *</label>
                  <input type="date" required value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} className={inputClass} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Data de Encerramento</label>
                  <input type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} className={inputClass} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Nome do Contato</label>
                  <input type="text" value={form.contactName} onChange={(e) => setForm({ ...form, contactName: e.target.value })} className={inputClass} placeholder="Ex: João Silva" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">E-mail do Contato</label>
                  <input type="email" value={form.contactEmail} onChange={(e) => setForm({ ...form, contactEmail: e.target.value })} className={inputClass} placeholder="contato@empresa.com" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Observações</label>
                  <textarea value={form.observations} onChange={(e) => setForm({ ...form, observations: e.target.value })} rows={3} className={inputClass} placeholder="Informações adicionais sobre o cliente..." />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-6 border-t border-slate-200 sticky bottom-0 bg-white">
                <button type="button" onClick={() => setShowForm(false)} className="px-5 py-2.5 text-slate-700 font-medium hover:bg-slate-100 rounded-lg transition-colors">
                  Cancelar
                </button>
                <button type="submit" disabled={submitting} className="flex items-center gap-2 px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 shadow-sm">
                  {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                  {submitting ? 'Salvando...' : 'Salvar Cliente'}
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