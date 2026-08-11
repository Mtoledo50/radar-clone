// =================================================================
// INÍCIO: frontend/src/app/dashboard/clientes/page.tsx
// =================================================================
// 🚀 MOTOR DE ONBOARDING E CONTRATOS (Enterprise Edition)
// Transforma o cadastro de clientes em um motor de vendas de planos
// e serviços avulsos, integrado ao Catálogo Dinâmico do SaaS.
//
// 🆕 Sprint 23: Importação em massa de clientes via CSV
// =================================================================
'use client';

import { useState, useEffect, useMemo } from 'react';
import api from '@/lib/axios';
import { toast } from 'sonner';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  Users, Plus, Search, Edit2, Trash2, Eye, Loader2, X, Save, FileText,
  Mail, Phone, Building2, Crown, Package, CheckCircle2, AlertTriangle,
  ChevronRight, ChevronLeft, DollarSign, Sparkles, Upload
} from 'lucide-react';
import ImportClientsModal from '@/components/clients/ImportClientsModal'; // 🆕 Sprint 23

// =================================================================
// TIPOS E INTERFACES (Tipagem Forte alinhada ao Backend)
// =================================================================

interface CommercialPlan {
  id: string;
  name: string;
  multiplier: number;
  badge?: string;
  color?: string;
  description?: string;
}

interface ServiceItem {
  id: string;
  name: string;
  description?: string;
  basePrice: number;
  recurrence: string; // AVULSO, MENSAL, ANUAL
  category?: { name: string };
}

interface ClientContract {
  id: string;
  commercialPlan: CommercialPlan;
  monthlyFee: number;
  status: string;
}

interface ClientService {
  id: string;
  serviceItem: ServiceItem;
  customPrice?: number;
  status: string;
}

interface Client {
  id: string;
  companyName: string;
  cnpj?: string;
  serviceType: string; // Mantido para compatibilidade legada
  monthlyFee: number;
  status: string;
  startDate: string;
  endDate?: string;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  observations?: string;
  contracts?: ClientContract[];
  services?: ClientService[];
}

// =================================================================
// COMPONENTE PRINCIPAL
// =================================================================
export default function ClientesPage() {
  // =================================================================
  // ESTADOS GLOBAIS
  // =================================================================
  const [clients, setClients] = useState<Client[]>([]);
  const [plans, setPlans] = useState<CommercialPlan[]>([]);
  const [serviceItems, setServiceItems] = useState<ServiceItem[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortOrder, setSortOrder] = useState('az'); // 🆕 padrão: A → Z  
  // Modais (incluindo o novo de importação)
  const [showFormModal, setShowFormModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false); // 🆕 Sprint 23
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [submitting, setSubmitting] = useState(false);
  
  // Wizard (Abas)
  const [currentTab, setCurrentTab] = useState(1);

  // Estado do Formulário (Alinhado ao CreateClientDto do Backend)
  const [form, setForm] = useState({
    companyName: '',
    cnpj: '',
    contactName: '',
    contactEmail: '',
    contactPhone: '',
    observations: '',
    status: 'ATIVO',
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    // 🚀 NOVOS CAMPOS ENTERPRISE
    commercialPlanId: '',
    avulsoServiceIds: [] as string[],
    manualMonthlyFee: 0, // Permite override manual se não houver plano
  });

  // =================================================================
  // CARREGAR DADOS (Clientes + Catálogo)
  // =================================================================
  useEffect(() => {
    loadInitialData();
  }, []);

  async function loadInitialData() {
    try {
      setLoading(true);
      // ✅ URLs CORRETAS do catálogo
      const [clientsRes, plansRes, itemsRes] = await Promise.all([
        api.get('/clients'),
        api.get('/commercial-plans/plans').catch(() => ({ data: { data: [] } })),
        api.get('/commercial-plans/items').catch(() => ({ data: { data: [] } })),
      ]);

      setClients(clientsRes.data.data || []);
      setPlans(plansRes.data.data || []);
      setServiceItems(itemsRes.data.data || []);
    } catch (err) {
      toast.error('Erro ao carregar dados iniciais');
    } finally {
      setLoading(false);
    }
  }

  // =================================================================
  // LÓGICA DE NEGÓCIO: CALCULADORA DE HONORÁRIOS
  // =================================================================
  const calculatedFee = useMemo(() => {
    let total = 0;
    
    // 1. Soma o valor do Plano Comercial (se selecionado)
    if (form.commercialPlanId) {
      total += form.manualMonthlyFee;
    }
    
    // 2. Soma os Serviços Avulsos Recorrentes
    const avulsos = serviceItems.filter(item => form.avulsoServiceIds.includes(item.id));
    avulsos.forEach(item => {
      if (item.recurrence === 'MENSAL') {
        total += Number(item.basePrice);
      }
    });
    
    // Se não houver plano nem avulsos mensais, usa o fee manual
    if (total === 0 && form.manualMonthlyFee > 0) {
      total = form.manualMonthlyFee;
    }
    
    return total;
  }, [form.commercialPlanId, form.avulsoServiceIds, form.manualMonthlyFee, serviceItems]);

   // =================================================================
  // FILTRAGEM + ORDENAÇÃO INTELIGENTES
  // =================================================================
  const filteredClients = useMemo(() => {
    const filtered = clients.filter((client) => {
      const matchesSearch =
        client.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.cnpj?.includes(searchTerm) ||
        client.contactName?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = filterStatus === 'all' || client.status === filterStatus;

      return matchesSearch && matchesStatus;
    });

    // 🆕 Ordenação (A→Z é o padrão)
    const sorted = [...filtered];
    switch (sortOrder) {
      case 'az':
        sorted.sort((a, b) => a.companyName.localeCompare(b.companyName, 'pt-BR', { sensitivity: 'base' }));
        break;
      case 'za':
        sorted.sort((a, b) => b.companyName.localeCompare(a.companyName, 'pt-BR', { sensitivity: 'base' }));
        break;
      case 'fee-desc':
        sorted.sort((a, b) => (b.monthlyFee || 0) - (a.monthlyFee || 0));
        break;
      case 'fee-asc':
        sorted.sort((a, b) => (a.monthlyFee || 0) - (b.monthlyFee || 0));
        break;
      default:
        break; // 'default' = ordem de cadastro (como vem do servidor)
    }
    return sorted;
  }, [clients, searchTerm, filterStatus, sortOrder]);

  // =================================================================
  // FUNÇÕES DE UI: ABRIR MODAIS
  // =================================================================
  function openCreateModal() {
    setSelectedClient(null);
    setForm({
      companyName: '', cnpj: '', contactName: '', contactEmail: '', contactPhone: '',
      observations: '', status: 'ATIVO',
      startDate: new Date().toISOString().split('T')[0], endDate: '',
      commercialPlanId: plans[0]?.id || '',
      avulsoServiceIds: [],
      manualMonthlyFee: 0,
    });
    setCurrentTab(1);
    setShowFormModal(true);
  }

  function openEditModal(client: Client) {
    setSelectedClient(client);
    
    // Extrai dados do contrato ativo (se existir)
    const activeContract = client.contracts?.find(c => c.status === 'ATIVO');
    
    // Extrai IDs dos serviços avulsos ativos
    const activeAvulsos = client.services
      ?.filter(s => s.status === 'ATIVO')
      .map(s => s.serviceItem.id) || [];

    setForm({
      companyName: client.companyName,
      cnpj: client.cnpj || '',
      contactName: client.contactName || '',
      contactEmail: client.contactEmail || '',
      contactPhone: client.contactPhone || '',
      observations: client.observations || '',
      status: client.status,
      startDate: client.startDate.split('T')[0],
      endDate: client.endDate?.split('T')[0] || '',
      commercialPlanId: activeContract?.commercialPlan.id || '',
      avulsoServiceIds: activeAvulsos,
      manualMonthlyFee: client.monthlyFee,
    });
    setCurrentTab(1);
    setShowFormModal(true);
  }

  function openViewModal(client: Client) {
    setSelectedClient(client);
    setShowViewModal(true);
  }

  function openDeleteModal(client: Client) {
    setSelectedClient(client);
    setShowDeleteModal(true);
  }

  // =================================================================
  // FUNÇÕES CRUD: SALVAR (INTEGRAÇÃO COM BACKEND ENTERPRISE)
  // =================================================================
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    if (!form.companyName) {
      toast.error('Preencha a Razão Social na aba 1');
      setCurrentTab(1);
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        companyName: form.companyName,
        cnpj: form.cnpj,
        serviceType: 'CONTABIL',
        monthlyFee: calculatedFee,
        status: form.status,
        startDate: form.startDate,
        endDate: form.endDate || null,
        contactName: form.contactName,
        contactEmail: form.contactEmail,
        contactPhone: form.contactPhone,
        observations: form.observations,
        commercialPlanId: form.commercialPlanId || undefined,
        avulsoServiceIds: form.avulsoServiceIds,
      };

      if (selectedClient) {
        await api.put(`/clients/${selectedClient.id}`, payload);
        toast.success('Cliente e contrato atualizados!');
      } else {
        await api.post('/clients', payload);
        toast.success('Cliente, contrato e serviços criados!');
      }
      
      setShowFormModal(false);
      loadInitialData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Erro ao salvar cliente');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!selectedClient) return;
    setSubmitting(true);
    try {
      await api.delete(`/clients/${selectedClient.id}`);
      toast.success('Cliente encerrado (Churn) com sucesso.');
      setShowDeleteModal(false);
      loadInitialData();
    } catch (err) {
      toast.error('Erro ao excluir cliente');
    } finally {
      setSubmitting(false);
    }
  }

  // =================================================================
  // EXPORTAR PDF
  // =================================================================
  function exportToPDF() {
    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.setTextColor(13, 148, 136);
    doc.text('Conta Certa - Carteira de Clientes', 14, 20);
    
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Relatório gerado em: ${new Date().toLocaleDateString('pt-BR')}`, 14, 28);
    doc.text(`Total de clientes: ${filteredClients.length}`, 14, 34);
    
    const tableData = filteredClients.map(client => {
      const planName = client.contracts?.[0]?.commercialPlan.name || '-';
      const avulsosCount = client.services?.length || 0;
      
      return [
        client.companyName,
        client.cnpj || '-',
        planName,
        `${avulsosCount} add-on(s)`,
        `R$ ${client.monthlyFee.toFixed(2)}`,
        client.status,
      ];
    });
    
    autoTable(doc, {
      startY: 40,
      head: [['Empresa', 'CNPJ', 'Plano Ativo', 'Add-ons', 'Honorário', 'Status']],
      body: tableData,
      theme: 'striped',
      headStyles: { fillColor: [13, 148, 136] },
      styles: { fontSize: 9 },
    });
    
    doc.save(`carteira_clientes_${new Date().toISOString().split('T')[0]}.pdf`);
    toast.success('PDF exportado com sucesso!');
  }

  // =================================================================
  // CLASSES DE ESTILO (DESIGN SYSTEM)
  // =================================================================
  const inputClass = 'w-full px-3 py-2.5 border border-slate-300 rounded-lg text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all bg-white';
  const btnPrimary = 'flex items-center justify-center gap-2 px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-lg transition-colors shadow-sm disabled:opacity-50';
  const btnSecondary = 'flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold rounded-lg transition-colors';

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-12 w-12 text-teal-600 animate-spin" />
      </div>
    );
  }

  // =================================================================
  // RENDERIZAÇÃO
  // =================================================================
  return (
    <div className="space-y-6">
      {/* CABEÇALHO */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
            <Users className="h-8 w-8 text-teal-600" />
            Carteira de Clientes
          </h1>
          <p className="text-slate-600 mt-1">Gerencie contratos, planos e serviços avulsos</p>
        </div>
        <div className="flex gap-3 flex-wrap">
          {/* 🆕 Sprint 23: Botão de importação CSV */}
          <button onClick={() => setShowImportModal(true)} className={btnSecondary}>
            <Upload className="h-5 w-5" /> Importar CSV
          </button>
          <button onClick={exportToPDF} className={btnSecondary}>
            <FileText className="h-5 w-5" /> Exportar
          </button>
          <button onClick={openCreateModal} className={btnPrimary}>
            <Plus className="h-5 w-5" /> Novo Contrato
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
                  <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className={inputClass}>
            <option value="all">Todos os status</option>
            <option value="ATIVO">Ativos</option>
            <option value="INATIVO">Inativos</option>
            <option value="CHURN">Churn (Cancelados)</option>
          </select>
          <select value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} className={inputClass}>
            <option value="az">Ordenar: A → Z</option>
            <option value="za">Ordenar: Z → A</option>
            <option value="fee-desc">Honorário: maior → menor</option>
            <option value="fee-asc">Honorário: menor → maior</option>
            <option value="default">Ordem de cadastro</option>
          </select>
        </div>
      </div>

      {/* TABELA ENTERPRISE */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-6 py-4 text-xs font-bold text-slate-600 uppercase">Empresa</th>
                <th className="text-left px-6 py-4 text-xs font-bold text-slate-600 uppercase">Plano Ativo</th>
                <th className="text-left px-6 py-4 text-xs font-bold text-slate-600 uppercase">Add-ons</th>
                <th className="text-right px-6 py-4 text-xs font-bold text-slate-600 uppercase">Honorário</th>
                <th className="text-center px-6 py-4 text-xs font-bold text-slate-600 uppercase">Status</th>
                <th className="text-right px-6 py-4 text-xs font-bold text-slate-600 uppercase">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredClients.map((client) => {
                const activeContract = client.contracts?.find(c => c.status === 'ATIVO');
                const activeServices = client.services?.filter(s => s.status === 'ATIVO') || [];
                
                return (
                  <tr key={client.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-900">{client.companyName}</div>
                      <div className="text-xs text-slate-500">{client.cnpj || 'Sem CNPJ'}</div>
                    </td>
                    <td className="px-6 py-4">
                      {activeContract ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-teal-100 text-teal-800 border border-teal-200">
                          <Crown className="h-3 w-3" />
                          {activeContract.commercialPlan.name}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400 italic">Sem plano</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {activeServices.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {activeServices.slice(0, 2).map(s => (
                            <span key={s.id} className="px-2 py-0.5 rounded text-xs bg-purple-100 text-purple-700">
                              {s.serviceItem.name}
                            </span>
                          ))}
                          {activeServices.length > 2 && (
                            <span className="px-2 py-0.5 rounded text-xs bg-slate-100 text-slate-600">
                              +{activeServices.length - 2}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-900 text-right font-semibold">
                      R$ {client.monthlyFee.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                        client.status === 'ATIVO' ? 'bg-green-100 text-green-700' :
                        client.status === 'INATIVO' ? 'bg-slate-100 text-slate-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {client.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => openViewModal(client)} className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg" title="Ver"><Eye className="h-4 w-4" /></button>
                        <button onClick={() => openEditModal(client)} className="p-2 text-slate-500 hover:text-teal-600 hover:bg-teal-50 rounded-lg" title="Editar"><Edit2 className="h-4 w-4" /></button>
                        <button onClick={() => openDeleteModal(client)} className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg" title="Encerrar"><Trash2 className="h-4 w-4" /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
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

      {/* ================================================================= */}
      {/* MODAL: WIZARD DE CADASTRO (3 ETAPAS) */}
      {/* ================================================================= */}
      {showFormModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
            {/* HEADER DO MODAL */}
            <div className="flex items-center justify-between p-6 border-b border-slate-200 bg-slate-50 rounded-t-2xl">
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <Sparkles className="h-6 w-6 text-teal-600" />
                {selectedClient ? 'Editar Contrato' : 'Novo Contrato de Cliente'}
              </h2>
              <button onClick={() => setShowFormModal(false)} className="text-slate-400 hover:text-slate-600"><X className="h-6 w-6" /></button>
            </div>

            {/* TABS (WIZARD) */}
            <div className="flex border-b border-slate-200 px-6 bg-white">
              <button
                onClick={() => setCurrentTab(1)}
                className={`px-4 py-3 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${
                  currentTab === 1 ? 'border-teal-600 text-teal-600' : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                <Building2 className="h-4 w-4" /> 1. Empresa
              </button>
              <button
                onClick={() => setCurrentTab(2)}
                className={`px-4 py-3 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${
                  currentTab === 2 ? 'border-teal-600 text-teal-600' : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                <Crown className="h-4 w-4" /> 2. Plano Mensal
              </button>
              <button
                onClick={() => setCurrentTab(3)}
                className={`px-4 py-3 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${
                  currentTab === 3 ? 'border-teal-600 text-teal-600' : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                <Package className="h-4 w-4" /> 3. Serviços Avulsos
              </button>
            </div>

            {/* CONTEÚDO DAS ABAS */}
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6">
              
              {/* ABA 1: DADOS DA EMPRESA */}
              {currentTab === 1 && (
                <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-semibold text-slate-700 mb-1">Razão Social *</label>
                      <input type="text" required value={form.companyName} onChange={(e) => setForm({ ...form, companyName: e.target.value })} className={inputClass} placeholder="Ex: Tech Solutions LTDA" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1">CNPJ</label>
                      <input type="text" value={form.cnpj} onChange={(e) => setForm({ ...form, cnpj: e.target.value })} className={inputClass} placeholder="00.000.000/0000-00" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1">Status</label>
                      <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className={inputClass}>
                        <option value="ATIVO">Ativo</option>
                        <option value="INATIVO">Inativo</option>
                        <option value="CHURN">Churn</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1">Data de Início *</label>
                      <input type="date" required value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} className={inputClass} />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1">Data de Término</label>
                      <input type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} className={inputClass} />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1">Nome do Contato</label>
                      <input type="text" value={form.contactName} onChange={(e) => setForm({ ...form, contactName: e.target.value })} className={inputClass} />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1">E-mail</label>
                      <input type="email" value={form.contactEmail} onChange={(e) => setForm({ ...form, contactEmail: e.target.value })} className={inputClass} />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1">Telefone</label>
                      <input type="text" value={form.contactPhone} onChange={(e) => setForm({ ...form, contactPhone: e.target.value })} className={inputClass} />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-semibold text-slate-700 mb-1">Observações Internas</label>
                      <textarea value={form.observations} onChange={(e) => setForm({ ...form, observations: e.target.value })} rows={3} className={inputClass} />
                    </div>
                  </div>
                </div>
              )}

              {/* ABA 2: PLANO COMERCIAL (MRR) */}
              {currentTab === 2 && (
                <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                  <p className="text-sm text-slate-600 mb-4">
                    Selecione o plano de honorários mensais. Isso criará um <strong>Contrato de Prestação de Serviços</strong> vinculado a este cliente.
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {plans.length === 0 && (
                      <div className="col-span-3 text-center py-8 bg-slate-50 rounded-lg border border-dashed border-slate-300">
                        <p className="text-slate-500">Nenhum plano comercial cadastrado no sistema.</p>
                        <p className="text-xs text-slate-400 mt-1">Cadastre planos em "Configurações → Planos"</p>
                      </div>
                    )}
                    
                    {plans.map((plan) => {
                      const isSelected = form.commercialPlanId === plan.id;
                      return (
                        <button
                          key={plan.id}
                          type="button"
                          onClick={() => setForm({ ...form, commercialPlanId: plan.id })}
                          className={`p-4 rounded-xl border-2 text-left transition-all relative ${
                            isSelected 
                              ? 'border-teal-600 bg-teal-50 shadow-md scale-[1.02]' 
                              : 'border-slate-200 hover:border-slate-300 bg-white'
                          }`}
                        >
                          {isSelected && (
                            <div className="absolute top-2 right-2 bg-teal-600 rounded-full p-1">
                              <CheckCircle2 className="h-4 w-4 text-white" />
                            </div>
                          )}
                          {plan.badge && (
                            <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase mb-2" style={{ backgroundColor: plan.color || '#64748b', color: 'white' }}>
                              {plan.badge}
                            </span>
                          )}
                          <h3 className="font-bold text-lg text-slate-900">{plan.name}</h3>
                          <p className="text-xs text-slate-500 mt-1 mb-3 min-h-[30px]">{plan.description}</p>
                          <div className="text-sm font-semibold text-slate-700">
                            Multiplicador: {plan.multiplier}x
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  <div className="pt-4 border-t border-slate-200">
                    <label className="block text-sm font-semibold text-slate-700 mb-1">
                      Honorário Base do Plano (R$) *
                    </label>
                    <input 
                      type="number" 
                      step="0.01" 
                      value={form.manualMonthlyFee} 
                      onChange={(e) => setForm({ ...form, manualMonthlyFee: parseFloat(e.target.value) || 0 })} 
                      className={inputClass}
                      placeholder="Ex: 450.00"
                    />
                    <p className="text-xs text-slate-500 mt-1">
                      Valor base que será somado aos serviços avulsos mensais.
                    </p>
                  </div>
                </div>
              )}

              {/* ABA 3: SERVIÇOS AVULSOS (ADD-ONS) */}
              {currentTab === 3 && (
                <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                  <p className="text-sm text-slate-600 mb-4">
                    Adicione serviços extras ao contrato (ex: IRPF, Abertura de Empresa, Consultoria). 
                    Serviços <strong>MENSAIS</strong> serão somados ao honorário. <strong>AVULSOS</strong> serão cobrados à parte.
                  </p>
                  
                  <div className="space-y-2">
                    {serviceItems.length === 0 && (
                      <div className="text-center py-8 bg-slate-50 rounded-lg border border-dashed border-slate-300">
                        <p className="text-slate-500">Nenhum serviço cadastrado no catálogo.</p>
                      </div>
                    )}
                    
                    {serviceItems.map((item) => {
                      const isSelected = form.avulsoServiceIds.includes(item.id);
                      const isMonthly = item.recurrence === 'MENSAL';
                      
                      return (
                        <label
                          key={item.id}
                          className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                            isSelected 
                              ? 'border-purple-500 bg-purple-50' 
                              : 'border-slate-200 hover:bg-slate-50'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setForm({ ...form, avulsoServiceIds: [...form.avulsoServiceIds, item.id] });
                              } else {
                                setForm({ ...form, avulsoServiceIds: form.avulsoServiceIds.filter(id => id !== item.id) });
                              }
                            }}
                            className="mt-1 h-4 w-4 text-purple-600 rounded focus:ring-purple-500"
                          />
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-slate-900">{item.name}</span>
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                isMonthly ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'
                              }`}>
                                {item.recurrence}
                              </span>
                            </div>
                            {item.description && (
                              <p className="text-xs text-slate-500 mt-1">{item.description}</p>
                            )}
                            <p className="text-sm font-semibold text-teal-600 mt-1">
                              R$ {Number(item.basePrice).toFixed(2)}
                              {isMonthly && <span className="text-xs text-slate-500 font-normal"> /mês</span>}
                            </p>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}
            </form>

            {/* RODAPÉ: NAVEGAÇÃO + RESUMO FINANCEIRO */}
            <div className="p-4 border-t border-slate-200 bg-slate-50 rounded-b-2xl">
              <div className="flex items-center justify-between mb-4 p-3 bg-white rounded-lg border border-slate-200">
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <DollarSign className="h-4 w-4 text-teal-600" />
                  <span>Honorário Mensal Total:</span>
                </div>
                <div className="text-xl font-bold text-teal-600">
                  R$ {calculatedFee.toFixed(2)}
                </div>
              </div>
              
              <div className="flex justify-between">
                <button
                  type="button"
                  onClick={() => setCurrentTab(Math.max(1, currentTab - 1))}
                  disabled={currentTab === 1}
                  className={btnSecondary + ' disabled:opacity-50'}
                >
                  <ChevronLeft className="h-4 w-4" /> Anterior
                </button>
                
                <div className="flex gap-3">
                  <button type="button" onClick={() => setShowFormModal(false)} className={btnSecondary}>
                    Cancelar
                  </button>
                  
                  {currentTab < 3 ? (
                    <button
                      type="button"
                      onClick={() => setCurrentTab(currentTab + 1)}
                      className={btnPrimary}
                    >
                      Próximo <ChevronRight className="h-4 w-4" />
                    </button>
                  ) : (
                     <button
                      type="button"
                      onClick={handleSubmit}
                      disabled={submitting}
                      className={btnPrimary}
                    >
                      {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                      {selectedClient ? 'Atualizar Contrato' : 'Criar Contrato'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* MODAL: VISUALIZAR DETALHES (COM ESCOPO) */}
      {/* ================================================================= */}
      {showViewModal && selectedClient && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-slate-200 sticky top-0 bg-white z-10">
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <Eye className="h-6 w-6 text-blue-600" /> {selectedClient.companyName}
              </h2>
              <button onClick={() => setShowViewModal(false)} className="text-slate-400 hover:text-slate-600"><X className="h-6 w-6" /></button>
            </div>
            <div className="p-6 space-y-6">
              {/* DADOS BÁSICOS */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase">CNPJ</label>
                  <p className="text-slate-900">{selectedClient.cnpj || '-'}</p>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase">Contato</label>
                  <p className="text-slate-900">{selectedClient.contactName || '-'}</p>
                </div>
              </div>

              {/* CONTRATO ATIVO */}
              <div className="border-t pt-4">
                <h3 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
                  <Crown className="h-4 w-4 text-teal-600" /> Contrato Ativo
                </h3>
                {selectedClient.contracts && selectedClient.contracts.length > 0 ? (
                  <div className="bg-teal-50 p-4 rounded-lg border border-teal-200">
                    <p className="font-bold text-teal-900">
                      Plano {selectedClient.contracts[0].commercialPlan.name}
                    </p>
                    <p className="text-sm text-teal-700 mt-1">
                      Honorário: R$ {selectedClient.contracts[0].monthlyFee.toFixed(2)} / mês
                    </p>
                  </div>
                ) : (
                  <p className="text-sm text-slate-500 italic">Sem plano mensal ativo.</p>
                )}
              </div>

              {/* SERVIÇOS AVULSOS */}
              <div className="border-t pt-4">
                <h3 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
                  <Package className="h-4 w-4 text-purple-600" /> Serviços Avulsos Contratados
                </h3>
                {selectedClient.services && selectedClient.services.length > 0 ? (
                  <ul className="space-y-2">
                    {selectedClient.services.map(s => (
                      <li key={s.id} className="flex justify-between items-center p-2 bg-slate-50 rounded">
                        <span className="text-sm font-medium text-slate-900">{s.serviceItem.name}</span>
                        <span className="text-xs text-slate-500">{s.serviceItem.recurrence}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-slate-500 italic">Nenhum serviço avulso.</p>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <button onClick={() => setShowViewModal(false)} className={btnSecondary}>Fechar</button>
                <button onClick={() => { setShowViewModal(false); openEditModal(selectedClient); }} className={btnPrimary}>
                  <Edit2 className="h-4 w-4" /> Editar Contrato
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* MODAL: CONFIRMAÇÃO DE EXCLUSÃO (SUBSTITUI O `confirm()`) */}
      {/* ================================================================= */}
      {showDeleteModal && selectedClient && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-red-100 rounded-full">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Encerrar Contrato?</h3>
            </div>
            <p className="text-slate-600 mb-6">
              O cliente <strong>{selectedClient.companyName}</strong> será marcado como <strong>CHURN</strong>. 
              O histórico financeiro e contábil será preservado por lei.
            </p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setShowDeleteModal(false)} className={btnSecondary}>Cancelar</button>
              <button onClick={handleDelete} disabled={submitting} className="flex items-center gap-2 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg">
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                Sim, Encerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* 🆕 SPRINT 23: MODAL DE IMPORTAÇÃO DE CLIENTES VIA CSV */}
      {/* ================================================================= */}
      {showImportModal && (
        <ImportClientsModal
          onClose={() => setShowImportModal(false)}
          onImported={() => loadInitialData()}
        />
      )}
    </div>
  );
}
