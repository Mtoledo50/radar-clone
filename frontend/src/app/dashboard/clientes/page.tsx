// =================================================================
// INÍCIO: frontend/src/app/dashboard/clientes/page.tsx
// =================================================================
/**
 * Página: Carteira de Clientes
 * Gestão de clientes, MRR e métricas de churn.
 */
'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/axios';
import { toast } from 'sonner';
import {
  Users, DollarSign, TrendingDown, Plus, Edit2, Trash2, X, Save, Loader2, Search, Download
} from 'lucide-react';

const inputClass = 'w-full px-3 py-2 border-2 border-slate-300 rounded-lg text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-white';
const btnPrimary = 'flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50';
const btnSecondary = 'flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg transition-colors';

export default function ClientesPage() {
  const [loading, setLoading] = useState(true);
  const [clients, setClients] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingClient, setEditingClient] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const [formData, setFormData] = useState({
    companyName: '', cnpj: '', serviceType: 'CONTABIL', monthlyFee: 0,
    status: 'ATIVO', contactName: '', contactEmail: '', contactPhone: '', observations: '',
  });

  // =================================================================
  // INÍCIO: Carregar Dados
  // =================================================================
  useEffect(() => { loadData(); }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [statsRes, clientsRes] = await Promise.all([
        api.get('/clients/dashboard'),
        api.get('/clients'),
      ]);
      setStats(statsRes.data.data);
      setClients(clientsRes.data.data);
    } catch (err) {
      toast.error('Erro ao carregar carteira de clientes');
    } finally {
      setLoading(false);
    }
  }
  // =================================================================
  // FIM: Carregar Dados
  // =================================================================

  // =================================================================
  // INÍCIO: Abrir Modal
  // =================================================================
  function openModal(client?: any) {
    if (client) {
      setEditingClient(client);
      setFormData({
        companyName: client.companyName, cnpj: client.cnpj || '', serviceType: client.serviceType,
        monthlyFee: client.monthlyFee, status: client.status, contactName: client.contactName || '',
        contactEmail: client.contactEmail || '', contactPhone: client.contactPhone || '',
        observations: client.observations || '',
      });
    } else {
      setEditingClient(null);
      setFormData({
        companyName: '', cnpj: '', serviceType: 'CONTABIL', monthlyFee: 0,
        status: 'ATIVO', contactName: '', contactEmail: '', contactPhone: '', observations: '',
      });
    }
    setShowModal(true);
  }
  // =================================================================
  // FIM: Abrir Modal
  // =================================================================

  // =================================================================
  // INÍCIO: Salvar Cliente
  // =================================================================
  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    try {
      if (editingClient) {
        await api.put(`/clients/${editingClient.id}`, formData);
        toast.success('Cliente atualizado!');
      } else {
        await api.post('/clients', formData);
        toast.success('Cliente adicionado!');
      }
      setShowModal(false);
      loadData();
    } catch (err) {
      toast.error('Erro ao salvar cliente');
    }
  }
  // =================================================================
  // FIM: Salvar Cliente
  // =================================================================

  // =================================================================
  // INÍCIO: Deletar Cliente
  // =================================================================
  async function handleDelete(id: string) {
    if (!confirm('Tem certeza que deseja remover este cliente?')) return;
    try {
      await api.delete(`/clients/${id}`);
      toast.success('Cliente removido');
      loadData();
    } catch (err) {
      toast.error('Erro ao remover cliente');
    }
  }
  // =================================================================
  // FIM: Deletar Cliente
  // =================================================================

  // =================================================================
  // INÍCIO: Exportar CSV
  // =================================================================
  function exportToCSV() {
    const headers = ['Empresa', 'CNPJ', 'Contato', 'Serviço', 'Honorário', 'Status'];
    const rows = clients.map((c) => [
      c.companyName,
      c.cnpj || '',
      c.contactName || '',
      c.serviceType,
      c.monthlyFee.toFixed(2).replace('.', ','),
      c.status,
    ]);

    const csvContent = [headers.join(';'), ...rows.map((row) => row.join(';'))].join('\n');
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `clientes-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success('Relatório CSV baixado com sucesso!');
  }
  // =================================================================
  // FIM: Exportar CSV
  // =================================================================

  const filteredClients = clients.filter((c) =>
    c.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.contactName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.serviceType.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 text-teal-600 animate-spin" /></div>;

  return (
    <div className="space-y-6">
      {/* ================================================================= */}
      {/* INÍCIO: Cabeçalho */}
      {/* ================================================================= */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
            <Users className="h-8 w-8 text-teal-600" />
            Gestão de Clientes
          </h1>
          <p className="text-slate-600 mt-1">Acompanhe sua carteira e faturamento mensal.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={exportToCSV} className={btnSecondary}>
            <Download className="h-4 w-4" /> Exportar CSV
          </button>
          <button onClick={() => openModal()} className={btnPrimary}>
            <Plus className="h-4 w-4" /> Novo Cliente
          </button>
        </div>
      </div>
      {/* ================================================================= */}
      {/* FIM: Cabeçalho */}
      {/* ================================================================= */}

      {/* ================================================================= */}
      {/* INÍCIO: KPIs */}
      {/* ================================================================= */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <Users className="h-5 w-5 text-teal-600" />
              <span className="text-sm font-semibold text-slate-600">Total de Clientes</span>
            </div>
            <p className="text-2xl font-bold text-slate-900">{stats.total}</p>
            <p className="text-xs text-slate-500">{stats.active} ativos</p>
          </div>
          <div className="bg-teal-50 p-4 rounded-xl border-2 border-teal-200 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="h-5 w-5 text-teal-700" />
              <span className="text-sm font-bold text-teal-800">MRR (Receita Recorrente)</span>
            </div>
            <p className="text-2xl font-bold text-teal-700">R$ {stats.mrr.toFixed(2)}</p>
            <p className="text-xs text-teal-600">Mensal</p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <TrendingDown className="h-5 w-5 text-red-600" />
              <span className="text-sm font-semibold text-slate-600">Taxa de Churn</span>
            </div>
            <p className="text-2xl font-bold text-slate-900">{stats.churnRate}%</p>
            <p className="text-xs text-slate-500">{stats.inactive} inativos</p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="h-5 w-5 text-blue-600" />
              <span className="text-sm font-semibold text-slate-600">Ticket Médio</span>
            </div>
            <p className="text-2xl font-bold text-slate-900">
              R$ {stats.averageTicket.toFixed(2)}
            </p>
            <p className="text-xs text-slate-500">Por cliente ativo</p>
          </div>
        </div>
      )}
      {/* ================================================================= */}
      {/* FIM: KPIs */}
      {/* ================================================================= */}

      {/* ================================================================= */}
      {/* INÍCIO: Busca */}
      {/* ================================================================= */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por empresa, contato ou tipo de serviço..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500"
          />
        </div>
      </div>
      {/* ================================================================= */}
      {/* FIM: Busca */}
      {/* ================================================================= */}

      {/* ================================================================= */}
      {/* INÍCIO: Tabela de Clientes */}
      {/* ================================================================= */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-bold text-slate-600 uppercase">Empresa</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-slate-600 uppercase">Serviço</th>
                <th className="text-right px-4 py-3 text-xs font-bold text-slate-600 uppercase">Honorário</th>
                <th className="text-center px-4 py-3 text-xs font-bold text-slate-600 uppercase">Status</th>
                <th className="text-right px-4 py-3 text-xs font-bold text-slate-600 uppercase">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredClients.map((client) => (
                <tr key={client.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <div className="font-medium text-slate-900">{client.companyName}</div>
                    <div className="text-xs text-slate-500">{client.contactName || 'Sem contato'}</div>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-700">{client.serviceType}</td>
                  <td className="px-4 py-3 text-sm text-slate-900 text-right font-semibold">
                    R$ {client.monthlyFee.toFixed(2)}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                      client.status === 'ATIVO' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {client.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => openModal(client)} className="p-1.5 text-slate-500 hover:text-teal-600 hover:bg-teal-50 rounded">
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button onClick={() => handleDelete(client.id)} className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredClients.length === 0 && (
            <div className="text-center py-12 text-slate-500">
              <Users className="h-12 w-12 mx-auto mb-3 text-slate-300" />
              <p>Nenhum cliente encontrado.</p>
            </div>
          )}
        </div>
      </div>
      {/* ================================================================= */}
      {/* FIM: Tabela de Clientes */}
      {/* ================================================================= */}

      {/* ================================================================= */}
      {/* INÍCIO: Modal de Cadastro/Edição */}
      {/* ================================================================= */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-slate-200 sticky top-0 bg-white z-10">
              <h2 className="text-xl font-bold text-slate-900">
                {editingClient ? 'Editar Cliente' : 'Novo Cliente'}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-6 w-6" />
              </button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Nome da Empresa *</label>
                  <input type="text" required value={formData.companyName} onChange={(e) => setFormData({...formData, companyName: e.target.value})} className={inputClass} />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">CNPJ</label>
                  <input type="text" value={formData.cnpj} onChange={(e) => setFormData({...formData, cnpj: e.target.value})} className={inputClass} />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Tipo de Serviço</label>
                  <select value={formData.serviceType} onChange={(e) => setFormData({...formData, serviceType: e.target.value})} className={inputClass}>
                    <option value="CONTABIL">Contábil</option>
                    <option value="FISCAL">Fiscal</option>
                    <option value="DP">Departamento Pessoal</option>
                    <option value="CONSULTORIA">Consultoria</option>
                    <option value="COMPLETO">Completo</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Honorário Mensal (R$) *</label>
                  <input type="number" step="0.01" required value={formData.monthlyFee} onChange={(e) => setFormData({...formData, monthlyFee: parseFloat(e.target.value) || 0})} className={inputClass} />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Status</label>
                  <select value={formData.status} onChange={(e) => setFormData({...formData, status: e.target.value})} className={inputClass}>
                    <option value="ATIVO">Ativo</option>
                    <option value="INATIVO">Inativo</option>
                    <option value="CHURN">Churn (Cancelado)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Nome do Contato</label>
                  <input type="text" value={formData.contactName} onChange={(e) => setFormData({...formData, contactName: e.target.value})} className={inputClass} />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">E-mail</label>
                  <input type="email" value={formData.contactEmail} onChange={(e) => setFormData({...formData, contactEmail: e.target.value})} className={inputClass} />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Telefone</label>
                  <input type="text" value={formData.contactPhone} onChange={(e) => setFormData({...formData, contactPhone: e.target.value})} className={inputClass} />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Observações</label>
                  <textarea value={formData.observations} onChange={(e) => setFormData({...formData, observations: e.target.value})} rows={3} className={inputClass} />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-slate-700 hover:bg-slate-100 rounded-lg font-medium">Cancelar</button>
                <button type="submit" className={btnPrimary}>
                  <Save className="h-4 w-4" /> Salvar Cliente
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* ================================================================= */}
      {/* FIM: Modal de Cadastro/Edição */}
      {/* ================================================================= */}
    </div>
  );
}
// =================================================================
// FIM: frontend/src/app/dashboard/clientes/page.tsx
// =================================================================