// =================================================================
// INÍCIO: frontend/src/app/dashboard/clientes/page.tsx
// =================================================================
'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/axios';
import { toast } from 'sonner';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  Users, Plus, Search, Edit2, Trash2, Eye, Download,
  Loader2, X, Save, FileText, Briefcase, Mail, Phone
} from 'lucide-react';

// =================================================================
// TIPOS E INTERFACES
// =================================================================
interface Client {
  id: string;
  companyName: string;
  cnpj?: string;
  serviceType: string;
  monthlyFee: number;
  status: string;
  startDate: string;
  endDate?: string;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  observations?: string;
  createdAt: string;
  updatedAt: string;
}

// =================================================================
// COMPONENTE PRINCIPAL
// =================================================================
export default function ClientesPage() {
  // =================================================================
  // ESTADOS
  // =================================================================
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterService, setFilterService] = useState('all');
  
  // Modais
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Formulário
  const [form, setForm] = useState({
    companyName: '',
    cnpj: '',
    serviceType: 'CONTABIL',
    monthlyFee: 0,
    status: 'ATIVO',
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    contactName: '',
    contactEmail: '',
    contactPhone: '',
    observations: '',
  });

  const inputClass = 'w-full px-3 py-2.5 border border-slate-300 rounded-lg text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all bg-white';
  const btnPrimary = 'flex items-center gap-2 px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-lg transition-colors shadow-sm disabled:opacity-50';
  const btnSecondary = 'flex items-center gap-2 px-4 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold rounded-lg transition-colors';
  const btnDanger = 'flex items-center gap-2 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-colors';

  // =================================================================
  // CARREGAR DADOS
  // =================================================================
  useEffect(() => {
    loadClients();
  }, []);

  async function loadClients() {
    try {
      setLoading(true);
      const res = await api.get('/clients');
      setClients(res.data.data || []);
    } catch (err) {
      toast.error('Erro ao carregar clientes');
    } finally {
      setLoading(false);
    }
  }

  // =================================================================
  // FILTRAGEM
  // =================================================================
  const filteredClients = clients.filter((client) => {
    const matchesSearch = 
      client.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.cnpj?.includes(searchTerm) ||
      client.contactName?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || client.status === filterStatus;
    const matchesService = filterService === 'all' || client.serviceType === filterService;
    
    return matchesSearch && matchesStatus && matchesService;
  });

  // =================================================================
  // FUNÇÕES CRUD
  // =================================================================
  function openCreateModal() {
    setForm({
      companyName: '',
      cnpj: '',
      serviceType: 'CONTABIL',
      monthlyFee: 0,
      status: 'ATIVO',
      startDate: new Date().toISOString().split('T')[0],
      endDate: '',
      contactName: '',
      contactEmail: '',
      contactPhone: '',
      observations: '',
    });
    setShowCreateModal(true);
  }

  function openEditModal(client: Client) {
    setSelectedClient(client);
    setForm({
      companyName: client.companyName,
      cnpj: client.cnpj || '',
      serviceType: client.serviceType,
      monthlyFee: client.monthlyFee,
      status: client.status,
      startDate: client.startDate.split('T')[0],
      endDate: client.endDate?.split('T')[0] || '',
      contactName: client.contactName || '',
      contactEmail: client.contactEmail || '',
      contactPhone: client.contactPhone || '',
      observations: client.observations || '',
    });
    setShowEditModal(true);
  }

  function openViewModal(client: Client) {
    setSelectedClient(client);
    setShowViewModal(true);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/clients', form);
      toast.success('Cliente criado com sucesso!');
      setShowCreateModal(false);
      loadClients();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Erro ao criar cliente');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedClient) return;
    setSubmitting(true);
    try {
      await api.put(`/clients/${selectedClient.id}`, form);
      toast.success('Cliente atualizado com sucesso!');
      setShowEditModal(false);
      loadClients();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Erro ao atualizar cliente');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(clientId: string) {
    if (!confirm('Tem certeza que deseja excluir este cliente?')) return;
    try {
      await api.delete(`/clients/${clientId}`);
      toast.success('Cliente removido com sucesso!');
      loadClients();
    } catch (err) {
      toast.error('Erro ao excluir cliente');
    }
  }

  // =================================================================
  // EXPORTAR PDF
  // =================================================================
  function exportToPDF() {
    const doc = new jsPDF();
    
    // Cabeçalho
    doc.setFontSize(20);
    doc.setTextColor(13, 148, 136); // Teal
    doc.text('Conta Certa - Carteira de Clientes', 14, 20);
    
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Relatório gerado em: ${new Date().toLocaleDateString('pt-BR')}`, 14, 28);
    doc.text(`Total de clientes: ${filteredClients.length}`, 14, 34);
    
    // Tabela
    const tableData = filteredClients.map(client => [
      client.companyName,
      client.cnpj || '-',
      client.serviceType,
      `R$ ${client.monthlyFee.toFixed(2)}`,
      client.status,
      new Date(client.startDate).toLocaleDateString('pt-BR'),
    ]);
    
    autoTable(doc, {
      startY: 40,
      head: [['Empresa', 'CNPJ', 'Serviço', 'Honorário', 'Status', 'Início']],
      body: tableData,
      theme: 'striped',
      headStyles: { fillColor: [13, 148, 136] }, // Teal
      styles: { fontSize: 9 },
    });
    
    doc.save(`carteira_clientes_${new Date().toISOString().split('T')[0]}.pdf`);
    toast.success('PDF exportado com sucesso!');
  }

  // =================================================================
  // RENDERIZAÇÃO
  // =================================================================
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-12 w-12 text-teal-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* CABEÇALHO */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
            <Users className="h-8 w-8 text-teal-600" />
            Carteira de Clientes
          </h1>
          <p className="text-slate-600 mt-1">Gerencie seus clientes e acompanhe o faturamento</p>
        </div>
        <div className="flex gap-3">
          <button onClick={exportToPDF} className={btnSecondary}>
            <FileText className="h-5 w-5" /> Exportar PDF
          </button>
          <button onClick={openCreateModal} className={btnPrimary}>
            <Plus className="h-5 w-5" /> Novo Cliente
          </button>
        </div>
      </div>

      {/* FILTROS */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por empresa, CNPJ ou contato..."
              className={`pl-10 ${inputClass}`}
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className={inputClass}
          >
            <option value="all">Todos os status</option>
            <option value="ATIVO">Ativo</option>
            <option value="INATIVO">Inativo</option>
            <option value="CHURN">Churn</option>
          </select>
          <select
            value={filterService}
            onChange={(e) => setFilterService(e.target.value)}
            className={inputClass}
          >
            <option value="all">Todos os serviços</option>
            <option value="CONTABIL">Contábil</option>
            <option value="FISCAL">Fiscal</option>
            <option value="DP">Departamento Pessoal</option>
            <option value="CONSULTORIA">Consultoria</option>
            <option value="COMPLETO">Completo</option>
          </select>
        </div>
      </div>

      {/* TABELA DE CLIENTES */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-6 py-4 text-xs font-bold text-slate-600 uppercase">Empresa</th>
                <th className="text-left px-6 py-4 text-xs font-bold text-slate-600 uppercase">CNPJ</th>
                <th className="text-left px-6 py-4 text-xs font-bold text-slate-600 uppercase">Serviço</th>
                <th className="text-right px-6 py-4 text-xs font-bold text-slate-600 uppercase">Honorário</th>
                <th className="text-center px-6 py-4 text-xs font-bold text-slate-600 uppercase">Status</th>
                <th className="text-right px-6 py-4 text-xs font-bold text-slate-600 uppercase">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredClients.map((client) => (
                <tr key={client.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-semibold text-slate-900">{client.companyName}</div>
                    <div className="text-xs text-slate-500">{client.contactName || 'Sem contato'}</div>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-700">{client.cnpj || '-'}</td>
                  <td className="px-6 py-4 text-sm text-slate-700">{client.serviceType}</td>
                  <td className="px-6 py-4 text-sm text-slate-900 text-right font-semibold">
                    R$ {client.monthlyFee.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                      client.status === 'ATIVO' ? 'bg-green-100 text-green-700' :
                      client.status === 'INATIVO' ? 'bg-slate-100 text-slate-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {client.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => openViewModal(client)}
                        className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Visualizar"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => openEditModal(client)}
                        className="p-2 text-slate-500 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors"
                        title="Editar"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(client.id)}
                        className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Excluir"
                      >
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
              <p className="text-lg font-medium">Nenhum cliente encontrado</p>
            </div>
          )}
        </div>
      </div>

      {/* MODAL: CRIAR CLIENTE */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-slate-200 sticky top-0 bg-white z-10">
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <Plus className="h-6 w-6 text-teal-600" />
                Novo Cliente
              </h2>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-6 w-6" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Razão Social *</label>
                  <input
                    type="text"
                    required
                    value={form.companyName}
                    onChange={(e) => setForm({ ...form, companyName: e.target.value })}
                    className={inputClass}
                    placeholder="Ex: Empresa XYZ LTDA"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">CNPJ</label>
                  <input
                    type="text"
                    value={form.cnpj}
                    onChange={(e) => setForm({ ...form, cnpj: e.target.value })}
                    className={inputClass}
                    placeholder="00.000.000/0000-00"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Tipo de Serviço *</label>
                  <select
                    required
                    value={form.serviceType}
                    onChange={(e) => setForm({ ...form, serviceType: e.target.value })}
                    className={inputClass}
                  >
                    <option value="CONTABIL">Contábil</option>
                    <option value="FISCAL">Fiscal</option>
                    <option value="DP">Departamento Pessoal</option>
                    <option value="CONSULTORIA">Consultoria</option>
                    <option value="COMPLETO">Completo</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Honorário Mensal (R$) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={form.monthlyFee}
                    onChange={(e) => setForm({ ...form, monthlyFee: parseFloat(e.target.value) || 0 })}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Status *</label>
                  <select
                    required
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value })}
                    className={inputClass}
                  >
                    <option value="ATIVO">Ativo</option>
                    <option value="INATIVO">Inativo</option>
                    <option value="CHURN">Churn</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Data de Início *</label>
                  <input
                    type="date"
                    required
                    value={form.startDate}
                    onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Data de Término</label>
                  <input
                    type="date"
                    value={form.endDate}
                    onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Nome do Contato</label>
                  <input
                    type="text"
                    value={form.contactName}
                    onChange={(e) => setForm({ ...form, contactName: e.target.value })}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">E-mail</label>
                  <input
                    type="email"
                    value={form.contactEmail}
                    onChange={(e) => setForm({ ...form, contactEmail: e.target.value })}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Telefone</label>
                  <input
                    type="text"
                    value={form.contactPhone}
                    onChange={(e) => setForm({ ...form, contactPhone: e.target.value })}
                    className={inputClass}
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Observações</label>
                  <textarea
                    value={form.observations}
                    onChange={(e) => setForm({ ...form, observations: e.target.value })}
                    rows={3}
                    className={inputClass}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                <button type="button" onClick={() => setShowCreateModal(false)} className={btnSecondary}>
                  Cancelar
                </button>
                <button type="submit" disabled={submitting} className={btnPrimary}>
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  {submitting ? 'Salvando...' : 'Salvar Cliente'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EDITAR CLIENTE */}
      {showEditModal && selectedClient && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-slate-200 sticky top-0 bg-white z-10">
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <Edit2 className="h-6 w-6 text-teal-600" />
                Editar Cliente
              </h2>
              <button onClick={() => setShowEditModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-6 w-6" />
              </button>
            </div>
            <form onSubmit={handleUpdate} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Razão Social *</label>
                  <input
                    type="text"
                    required
                    value={form.companyName}
                    onChange={(e) => setForm({ ...form, companyName: e.target.value })}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">CNPJ</label>
                  <input
                    type="text"
                    value={form.cnpj}
                    onChange={(e) => setForm({ ...form, cnpj: e.target.value })}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Tipo de Serviço *</label>
                  <select
                    required
                    value={form.serviceType}
                    onChange={(e) => setForm({ ...form, serviceType: e.target.value })}
                    className={inputClass}
                  >
                    <option value="CONTABIL">Contábil</option>
                    <option value="FISCAL">Fiscal</option>
                    <option value="DP">Departamento Pessoal</option>
                    <option value="CONSULTORIA">Consultoria</option>
                    <option value="COMPLETO">Completo</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Honorário Mensal (R$) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={form.monthlyFee}
                    onChange={(e) => setForm({ ...form, monthlyFee: parseFloat(e.target.value) || 0 })}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Status *</label>
                  <select
                    required
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value })}
                    className={inputClass}
                  >
                    <option value="ATIVO">Ativo</option>
                    <option value="INATIVO">Inativo</option>
                    <option value="CHURN">Churn</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Data de Início *</label>
                  <input
                    type="date"
                    required
                    value={form.startDate}
                    onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Data de Término</label>
                  <input
                    type="date"
                    value={form.endDate}
                    onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Nome do Contato</label>
                  <input
                    type="text"
                    value={form.contactName}
                    onChange={(e) => setForm({ ...form, contactName: e.target.value })}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">E-mail</label>
                  <input
                    type="email"
                    value={form.contactEmail}
                    onChange={(e) => setForm({ ...form, contactEmail: e.target.value })}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Telefone</label>
                  <input
                    type="text"
                    value={form.contactPhone}
                    onChange={(e) => setForm({ ...form, contactPhone: e.target.value })}
                    className={inputClass}
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Observações</label>
                  <textarea
                    value={form.observations}
                    onChange={(e) => setForm({ ...form, observations: e.target.value })}
                    rows={3}
                    className={inputClass}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                <button type="button" onClick={() => setShowEditModal(false)} className={btnSecondary}>
                  Cancelar
                </button>
                <button type="submit" disabled={submitting} className={btnPrimary}>
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  {submitting ? 'Salvando...' : 'Atualizar Cliente'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: VISUALIZAR CLIENTE */}
      {showViewModal && selectedClient && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-slate-200 sticky top-0 bg-white z-10">
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <Eye className="h-6 w-6 text-blue-600" />
                Detalhes do Cliente
              </h2>
              <button onClick={() => setShowViewModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Razão Social</label>
                  <p className="text-lg font-bold text-slate-900">{selectedClient.companyName}</p>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">CNPJ</label>
                  <p className="text-slate-900">{selectedClient.cnpj || '-'}</p>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Tipo de Serviço</label>
                  <p className="text-slate-900">{selectedClient.serviceType}</p>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Honorário Mensal</label>
                  <p className="text-lg font-bold text-teal-600">R$ {selectedClient.monthlyFee.toFixed(2)}</p>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Status</label>
                  <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${
                    selectedClient.status === 'ATIVO' ? 'bg-green-100 text-green-700' :
                    selectedClient.status === 'INATIVO' ? 'bg-slate-100 text-slate-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {selectedClient.status}
                  </span>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Data de Início</label>
                  <p className="text-slate-900">{new Date(selectedClient.startDate).toLocaleDateString('pt-BR')}</p>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Data de Término</label>
                  <p className="text-slate-900">
                    {selectedClient.endDate ? new Date(selectedClient.endDate).toLocaleDateString('pt-BR') : '-'}
                  </p>
                </div>
                <div className="md:col-span-2 border-t border-slate-200 pt-4">
                  <h3 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
                    <Users className="h-4 w-4" /> Contato
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Nome</label>
                      <p className="text-slate-900">{selectedClient.contactName || '-'}</p>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">E-mail</label>
                      <p className="text-slate-900 flex items-center gap-1">
                        {selectedClient.contactEmail ? (
                          <>
                            <Mail className="h-4 w-4 text-slate-400" />
                            {selectedClient.contactEmail}
                          </>
                        ) : '-'}
                      </p>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Telefone</label>
                      <p className="text-slate-900 flex items-center gap-1">
                        {selectedClient.contactPhone ? (
                          <>
                            <Phone className="h-4 w-4 text-slate-400" />
                            {selectedClient.contactPhone}
                          </>
                        ) : '-'}
                      </p>
                    </div>
                  </div>
                </div>
                {selectedClient.observations && (
                  <div className="md:col-span-2 border-t border-slate-200 pt-4">
                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Observações</label>
                    <p className="text-slate-700 whitespace-pre-wrap">{selectedClient.observations}</p>
                  </div>
                )}
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                <button onClick={() => setShowViewModal(false)} className={btnSecondary}>
                  Fechar
                </button>
                <button
                  onClick={() => {
                    setShowViewModal(false);
                    openEditModal(selectedClient);
                  }}
                  className={btnPrimary}
                >
                  <Edit2 className="h-4 w-4" /> Editar Cliente
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
// =================================================================
// FIM: frontend/src/app/dashboard/clientes/page.tsx
// =================================================================