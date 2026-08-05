'use client';

// =================================================================
// INÍCIO: IMPORTS
// =================================================================
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/axios';
import { toast } from 'sonner';
import {
  Users, Plus, Search, Edit2, Trash2, Eye, Download,
  Loader2, X, Save, FileText, Briefcase, Mail, Phone,
  BookOpen, UploadCloud, BarChart3, Zap, CheckCircle,
  CheckSquare, Square, AlertTriangle, Clock, FolderOpen
} from 'lucide-react';
// =================================================================
// FIM: IMPORTS
// =================================================================


// =================================================================
// INÍCIO: TIPOS E INTERFACES
// =================================================================
type TabType = 'lancamentos' | 'contas' | 'importar' | 'extratos';

interface AccountingEntry {
  id: string;
  entryDate: string;
  description: string;
  documentNumber?: string;
  counterpartyName?: string;
  counterpartyCpfCnpj?: string;
  counterpartyType?: string;
  clientId?: string;
  client?: { companyName: string };
  debitAccountId?: string;
  debitAccount?: { code: string; name: string };
  debitValue: number;
  creditAccountId?: string;
  creditAccount?: { code: string; name: string };
  creditValue: number;
  source: string;
  status: string;
  isActive?: boolean;
}

interface AccountingAccount {
  id: string;
  code: string;
  name: string;
  type: string;
  nature: string;
  isActive: boolean;
}

interface ImportedEntry {
  id?: string;
  date: string;
  description: string;
  counterpartyName: string;
  counterpartyCpfCnpj: string;
  amount: number;
  type: 'ENTRADA' | 'SAIDA';
  status: string;
  debitAccountId?: string;
  creditAccountId?: string;
}

interface Client {
  id: string;
  companyName: string;
  cnpj?: string;
}

interface ReconciledStatement {
  clientId: string;
  clientName: string;
  totalEntries: number;
  conciliados: number;
  pendentes: number;
  naoIniciados: number;
  status: 'CONCILIADO' | 'PARCIAL' | 'NAO_INICIADO';
  entries: AccountingEntry[];
}
// =================================================================
// FIM: TIPOS E INTERFACES
// =================================================================


// =================================================================
// INÍCIO: COMPONENTE PRINCIPAL (LancamentosPage)
// =================================================================
export default function LancamentosPage() {
  const router = useRouter();
  
  // =================================================================
  // INÍCIO: ESTADOS GLOBAIS DA PÁGINA
  // =================================================================
  const [activeTab, setActiveTab] = useState<TabType>('lancamentos');
  const [entries, setEntries] = useState<AccountingEntry[]>([]);
  const [accounts, setAccounts] = useState<AccountingAccount[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterClient, setFilterClient] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [editingEntry, setEditingEntry] = useState<AccountingEntry | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showReconciliationModal, setShowReconciliationModal] = useState(false);
  
  // ✅ NOVOS ESTADOS: Seleção múltipla e edição de contas
  const [selectedEntries, setSelectedEntries] = useState<string[]>([]);
  const [showEditAccountModal, setShowEditAccountModal] = useState(false);
  const [editingAccount, setEditingAccount] = useState<AccountingAccount | null>(null);
  const [accountForm, setAccountForm] = useState({ code: '', name: '', type: 'ATIVO', nature: 'DEBITORA', level: 1 });

  const [form, setForm] = useState({
    entryDate: new Date().toISOString().split('T')[0],
    description: '',
    documentNumber: '',
    counterpartyName: '',
    counterpartyCpfCnpj: '',
    counterpartyType: 'FORNECEDOR',
    clientId: '',
    debitAccountId: '',
    debitValue: 0,
    creditAccountId: '',
    creditValue: 0,
    status: 'PENDENTE',
  });

  const tabs = [
    { key: 'lancamentos' as TabType, label: 'Lançamentos', icon: BookOpen },
    { key: 'contas' as TabType, label: 'Plano de Contas', icon: FileText },
    { key: 'importar' as TabType, label: 'Importar Extrato', icon: UploadCloud },
    { key: 'extratos' as TabType, label: 'Extratos Conciliados', icon: FolderOpen },
  ];

  const inputClass = 'w-full px-3 py-2.5 border border-slate-300 rounded-lg text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all bg-white';
  // =================================================================
  // FIM: ESTADOS GLOBAIS DA PÁGINA
  // =================================================================


  // =================================================================
  // INÍCIO: EFEITOS E CARREGAMENTO INICIAL
  // =================================================================
  useEffect(() => { 
    loadData(); 
    loadClients();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      const [entriesRes, accountsRes] = await Promise.all([
        api.get('/accounting/entries'),
        api.get('/accounting/accounts'),
      ]);
      setEntries(entriesRes.data.data || []);
      setAccounts(accountsRes.data.data || []);
    } catch (err) {
      console.error('Erro ao carregar dados:', err);
      toast.error('Erro ao carregar dados contábeis');
    } finally {
      setLoading(false);
    }
  }

  async function loadClients() {
    try {
      const res = await api.get('/clients');
      setClients(res.data.data || []);
    } catch (err) {
      console.error('Erro ao carregar clientes:', err);
    }
  }
  // =================================================================
  // FIM: EFEITOS E CARREGAMENTO INICIAL
  // =================================================================


  // =================================================================
  // INÍCIO: FUNÇÕES DE FILTRAGEM E FORMATAÇÃO
  // =================================================================
  const filteredEntries = entries.filter((entry) => {
    const matchesSearch = 
      entry.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.counterpartyName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.counterpartyCpfCnpj?.includes(searchTerm);
    
    const matchesStatus = filterStatus === 'all' || entry.status === filterStatus;
    const matchesClient = filterClient === 'all' || entry.clientId === filterClient;
    
    return matchesSearch && matchesStatus && matchesClient;
  });

  const formatCurrency = (value: number) =>
    value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString('pt-BR');
  // =================================================================
  // FIM: FUNÇÕES DE FILTRAGEM E FORMATAÇÃO
  // =================================================================


  // =================================================================
  // INÍCIO: FUNÇÕES DE SELEÇÃO MÚLTIPLA
  // =================================================================
  function toggleSelectEntry(entryId: string) {
    setSelectedEntries(prev => 
      prev.includes(entryId) 
        ? prev.filter(id => id !== entryId)
        : [...prev, entryId]
    );
  }

  function toggleSelectAll() {
    if (selectedEntries.length === filteredEntries.length) {
      setSelectedEntries([]);
    } else {
      setSelectedEntries(filteredEntries.map(e => e.id));
    }
  }

  async function handleBulkDelete() {
    if (selectedEntries.length === 0) {
      toast.error('Selecione pelo menos um lançamento');
      return;
    }
    
    if (!confirm(`Tem certeza que deseja excluir ${selectedEntries.length} lançamento(s)?`)) {
      return;
    }

    try {
      await Promise.all(
        selectedEntries.map(id => api.delete(`/accounting/entries/${id}`))
      );
      toast.success(`${selectedEntries.length} lançamento(s) excluído(s)`);
      setSelectedEntries([]);
      loadData();
    } catch (err) {
      toast.error('Erro ao excluir lançamentos');
    }
  }

  async function handleForceConciliate() {
    if (selectedEntries.length === 0) {
      toast.error('Selecione pelo menos um lançamento');
      return;
    }

    const pendentes = selectedEntries.filter(id => {
      const entry = entries.find(e => e.id === id);
      return entry?.status === 'PENDENTE';
    });

    if (pendentes.length === 0) {
      toast.info('Nenhum lançamento pendente selecionado');
      return;
    }

    if (!confirm(`Deseja forçar a conciliação de ${pendentes.length} lançamento(s) pendente(s)?`)) {
      return;
    }

    try {
      await Promise.all(
        pendentes.map(id => 
          api.put(`/accounting/entries/${id}`, { status: 'CONCILIADO' })
        )
      );
      toast.success(`${pendentes.length} lançamento(s) conciliado(s) com sucesso!`);
      setSelectedEntries([]);
      loadData();
    } catch (err) {
      toast.error('Erro ao conciliar lançamentos');
    }
  }
  // =================================================================
  // FIM: FUNÇÕES DE SELEÇÃO MÚLTIPLA
  // =================================================================


  // =================================================================
  // INÍCIO: FUNÇÕES DE CRUD DE LANÇAMENTOS
  // =================================================================
  function openModal(entry?: AccountingEntry) {
    if (entry) {
      setEditingEntry(entry);
      setForm({
        entryDate: entry.entryDate.split('T')[0],
        description: entry.description,
        documentNumber: entry.documentNumber || '',
        counterpartyName: entry.counterpartyName || '',
        counterpartyCpfCnpj: entry.counterpartyCpfCnpj || '',
        counterpartyType: entry.counterpartyType || 'FORNECEDOR',
        clientId: entry.clientId || '',
        debitAccountId: entry.debitAccountId || '',
        debitValue: entry.debitValue || 0,
        creditAccountId: entry.creditAccountId || '',
        creditValue: entry.creditValue || 0,
        status: entry.status,
      });
    } else {
      setEditingEntry(null);
      setForm({
        entryDate: new Date().toISOString().split('T')[0],
        description: '',
        documentNumber: '',
        counterpartyName: '',
        counterpartyCpfCnpj: '',
        counterpartyType: 'FORNECEDOR',
        clientId: '',
        debitAccountId: '',
        debitValue: 0,
        creditAccountId: '',
        creditValue: 0,
        status: 'PENDENTE',
      });
    }
    setShowModal(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    
    if (!form.debitAccountId || !form.creditAccountId) {
      toast.error('Selecione as contas de débito e crédito');
      return;
    }
    
    if (form.debitValue <= 0 && form.creditValue <= 0) {
      toast.error('Preencha o valor de débito OU crédito');
      return;
    }
    
    if (form.debitValue > 0 && form.creditValue > 0) {
      toast.error('Preencha apenas débito OU crédito, não ambos');
      return;
    }

    setSubmitting(true);
    try {
      if (editingEntry) {
        await api.put(`/accounting/entries/${editingEntry.id}`, form);
        toast.success('Lançamento atualizado com sucesso!');
      } else {
        await api.post('/accounting/entries', form);
        toast.success('Lançamento criado com sucesso!');
      }
      setShowModal(false);
      loadData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Erro ao salvar lançamento');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Tem certeza que deseja excluir este lançamento?')) return;
    try {
      await api.delete(`/accounting/entries/${id}`);
      toast.success('Lançamento excluído');
      loadData();
    } catch (err) {
      toast.error('Erro ao excluir lançamento');
    }
  }
  // =================================================================
  // FIM: FUNÇÕES DE CRUD DE LANÇAMENTOS
  // =================================================================


  // =================================================================
  // INÍCIO: FUNÇÕES DE CRUD DE CONTAS CONTÁBEIS
  // =================================================================
  async function handleAddAccount() {
    const code = prompt('Código da conta (ex: 1.1.1.01):');
    if (!code) return;
    const name = prompt('Nome da conta:');
    if (!name) return;

    try {
      await api.post('/accounting/accounts', {
        code: code.trim(),
        name: name.trim(),
        type: 'ATIVO',
        nature: 'DEBITORA',
        level: code.split('.').length,
        isActive: true,
      });
      toast.success('Conta criada com sucesso!');
      loadData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Erro ao criar conta');
    }
  }

  function openEditAccountModal(account: AccountingAccount) {
    setEditingAccount(account);
    setAccountForm({
      code: account.code,
      name: account.name,
      type: account.type,
      nature: account.nature,
      level: account.code.split('.').length,
    });
    setShowEditAccountModal(true);
  }

  async function handleSaveAccount(e: React.FormEvent) {
    e.preventDefault();
    if (!editingAccount) return;

    try {
      await api.put(`/accounting/accounts/${editingAccount.id}`, accountForm);
      toast.success('Conta atualizada com sucesso!');
      setShowEditAccountModal(false);
      setEditingAccount(null);
      loadData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Erro ao atualizar conta');
    }
  }

  async function handleDeleteAccount(id: string) {
    if (!confirm('Tem certeza que deseja excluir esta conta?')) return;
    try {
      await api.delete(`/accounting/accounts/${id}`);
      toast.success('Conta excluída');
      loadData();
    } catch (err) {
      toast.error('Erro ao excluir conta');
    }
  }
  // =================================================================
  // FIM: FUNÇÕES DE CRUD DE CONTAS CONTÁBEIS
  // =================================================================


  // =================================================================
  // INÍCIO: FUNÇÕES DA ABA EXTRATOS CONCILIADOS
  // =================================================================
  function getReconciledStatements(): ReconciledStatement[] {
  const clientMap = new Map<string, AccountingEntry[]>();
  
  entries.forEach(entry => {
    const clientId = entry.clientId || 'sem-cliente';
    if (!clientMap.has(clientId)) {
      clientMap.set(clientId, []);
    }
    clientMap.get(clientId)!.push(entry);
  });

  const statements: ReconciledStatement[] = [];
  
  clientMap.forEach((clientEntries, clientId) => {
    const client = clients.find(c => c.id === clientId);
    const clientName = client?.companyName || 'Cliente não vinculado';
    
    // ✅ CORREÇÃO: Lógica correta de contagem
    const conciliados = clientEntries.filter(e => e.status === 'CONCILIADO').length;
    
    // Não iniciados = SEM nenhuma conta definida (débito E crédito vazios)
    const naoIniciados = clientEntries.filter(e => 
      !e.debitAccountId && !e.creditAccountId
    ).length;
    
    // Pendentes = tem pelo menos UMA conta definida mas status ainda é PENDENTE
    // OU status é PENDENTE mas já começou a conciliação
    const pendentes = clientEntries.filter(e => 
      e.status === 'PENDENTE' && (e.debitAccountId || e.creditAccountId)
    ).length;
    
    let status: 'CONCILIADO' | 'PARCIAL' | 'NAO_INICIADO';
    if (conciliados === clientEntries.length) {
      status = 'CONCILIADO';
    } else if (conciliados === 0 && naoIniciados === clientEntries.length) {
      status = 'NAO_INICIADO';
    } else {
      status = 'PARCIAL';
    }
    
    statements.push({
      clientId,
      clientName,
      totalEntries: clientEntries.length,
      conciliados,
      pendentes,
      naoIniciados,
      status,
      entries: clientEntries,
    });
  });

  return statements.sort((a, b) => a.clientName.localeCompare(b.clientName));
}
  // =================================================================
  // FIM: FUNÇÕES DA ABA EXTRATOS CONCILIADOS
  // =================================================================


  // =================================================================
  // INÍCIO: RENDERIZAÇÃO DO LAYOUT PRINCIPAL
  // =================================================================
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="h-12 w-12 text-teal-600 animate-spin mb-4" />
        <p className="text-slate-600 font-medium">Carregando lançamentos...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* CABEÇALHO DA PÁGINA */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
            <BookOpen className="h-8 w-8 text-teal-600" />
            Lançamentos Contábeis
          </h1>
          <p className="text-slate-600 mt-1">Gestão completa e importação inteligente de débito e crédito</p>
        </div>
        <button
          onClick={() => openModal()}
          className="flex items-center gap-2 px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-lg transition-colors shadow-sm"
        >
          <Plus className="h-5 w-5" />
          Novo Lançamento
        </button>
      </div>

      {/* NAVEGAÇÃO DE ABAS */}
      <div className="flex gap-2 bg-slate-100 p-1 rounded-lg w-fit overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-md font-medium transition-colors whitespace-nowrap ${
              activeTab === tab.key ? 'bg-white text-teal-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* CONTEÚDO DAS ABAS */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 min-h-[500px]">
        
        {/* ================= ABA 1: LANÇAMENTOS ================= */}
        {activeTab === 'lancamentos' && (
          <div className="space-y-4">
            {/* Filtros e Ações em Massa */}
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar por descrição, empresa ou CPF/CNPJ..."
                  className={`pl-10 ${inputClass}`}
                />
              </div>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className={`${inputClass} w-full md:w-48`}
              >
                <option value="all">Todos os status</option>
                <option value="PENDENTE">Pendente</option>
                <option value="CONCILIADO">Conciliado</option>
                <option value="CANCELADO">Cancelado</option>
              </select>
              <select
                value={filterClient}
                onChange={(e) => setFilterClient(e.target.value)}
                className={`${inputClass} w-full md:w-64`}
              >
                <option value="all">Todos os clientes</option>
                {clients.map(c => (
                  <option key={c.id} value={c.id}>{c.companyName}</option>
                ))}
              </select>
            </div>

            {/* Barra de Ações em Massa */}
            {selectedEntries.length > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CheckSquare className="h-5 w-5 text-blue-600" />
                  <span className="font-semibold text-blue-900">
                    {selectedEntries.length} lançamento(s) selecionado(s)
                  </span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleForceConciliate}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-colors"
                  >
                    <CheckCircle className="h-4 w-4" />
                    Finalizar Conciliação
                  </button>
                  <button
                    onClick={handleBulkDelete}
                    className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                    Excluir Selecionados
                  </button>
                  <button
                    onClick={() => setSelectedEntries([])}
                    className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold rounded-lg transition-colors"
                  >
                    Limpar
                  </button>
                </div>
              </div>
            )}

            <div className="flex justify-end">
              <button
                onClick={() => setShowReconciliationModal(true)}
                className="flex items-center gap-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition-colors shadow-sm"
              >
                <Zap className="h-5 w-5" />
                Conciliar Automaticamente
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3 text-left">
                      <button onClick={toggleSelectAll} className="hover:opacity-70">
                        {selectedEntries.length === filteredEntries.length && filteredEntries.length > 0 ? (
                          <CheckSquare className="h-5 w-5 text-teal-600" />
                        ) : (
                          <Square className="h-5 w-5 text-slate-400" />
                        )}
                      </button>
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 uppercase">Data</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 uppercase">Histórico</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 uppercase">CPF/CNPJ</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-slate-600 uppercase">Débito</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-slate-600 uppercase">Crédito</th>
                    <th className="text-center px-4 py-3 text-xs font-semibold text-slate-600 uppercase">Status</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-slate-600 uppercase">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredEntries.map((entry) => (
                    <tr key={entry.id} className={`hover:bg-slate-50 transition-colors ${
                      selectedEntries.includes(entry.id) ? 'bg-blue-50' : ''
                    }`}>
                      <td className="px-4 py-3">
                        <button onClick={() => toggleSelectEntry(entry.id)} className="hover:opacity-70">
                          {selectedEntries.includes(entry.id) ? (
                            <CheckSquare className="h-5 w-5 text-teal-600" />
                          ) : (
                            <Square className="h-5 w-5 text-slate-400" />
                          )}
                        </button>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-700 whitespace-nowrap">{formatDate(entry.entryDate)}</td>
                      <td className="px-4 py-3 text-sm text-slate-900 font-medium max-w-xs truncate" title={entry.description}>{entry.description}</td>
                      <td className="px-4 py-3 text-sm text-slate-700 whitespace-nowrap">{entry.counterpartyCpfCnpj || '-'}</td>
                      <td className="px-4 py-3 text-sm text-right font-semibold text-orange-600 whitespace-nowrap">{entry.debitValue > 0 ? formatCurrency(entry.debitValue) : '-'}</td>
                      <td className="px-4 py-3 text-sm text-right font-semibold text-teal-600 whitespace-nowrap">{entry.creditValue > 0 ? formatCurrency(entry.creditValue) : '-'}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                          entry.status === 'CONCILIADO' ? 'bg-green-100 text-green-700' :
                          entry.status === 'CANCELADO' ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'
                        }`}>{entry.status}</span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => openModal(entry)} className="p-1.5 text-slate-500 hover:text-teal-600 hover:bg-teal-50 rounded" title="Editar"><Edit2 className="h-4 w-4" /></button>
                          <button onClick={() => handleDelete(entry.id)} className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded" title="Excluir"><Trash2 className="h-4 w-4" /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredEntries.length === 0 && (
                <div className="text-center py-12 text-slate-500">
                  <BookOpen className="h-12 w-12 mx-auto mb-3 text-slate-300" />
                  <p className="text-lg font-medium">Nenhum lançamento encontrado</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ================= ABA 2: PLANO DE CONTAS ================= */}
        {activeTab === 'contas' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900">Plano de Contas</h3>
              <button onClick={handleAddAccount} className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-lg transition-colors">
                <Plus className="h-4 w-4" /> Nova Conta
              </button>
            </div>
            <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200 sticky top-0">
                  <tr>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 uppercase">Código</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 uppercase">Nome</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 uppercase">Tipo</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 uppercase">Natureza</th>
                    <th className="text-center px-4 py-3 text-xs font-semibold text-slate-600 uppercase">Status</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-slate-600 uppercase">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {accounts.map((account) => (
                    <tr key={account.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 text-sm font-mono text-slate-700">{account.code}</td>
                      <td className="px-4 py-3 text-sm font-medium text-slate-900">{account.name}</td>
                      <td className="px-4 py-3 text-sm text-slate-600">{account.type}</td>
                      <td className="px-4 py-3 text-sm text-slate-600">{account.nature}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${account.isActive ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-700'}`}>
                          {account.isActive ? 'Ativa' : 'Inativa'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button 
                            onClick={() => openEditAccountModal(account)} 
                            className="p-1.5 text-slate-500 hover:text-teal-600 hover:bg-teal-50 rounded" 
                            title="Editar"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button 
                            onClick={() => handleDeleteAccount(account.id)} 
                            className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded" 
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
            </div>
          </div>
        )}

        {/* ================= ABA 3: IMPORTAR EXTRATO ================= */}
        {activeTab === 'importar' && <ImportTab onImportSuccess={loadData} accounts={accounts} />}

        {/* ================= ABA 4: EXTRATOS CONCILIADOS ================= */}
        {activeTab === 'extratos' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900">Extratos Conciliados por Cliente</h3>
            </div>
            
            {getReconciledStatements().length === 0 ? (
              <div className="bg-slate-50 p-8 rounded-lg border border-slate-200 text-center">
                <FolderOpen className="h-12 w-12 text-slate-400 mx-auto mb-3" />
                <p className="text-slate-600">Nenhum extrato importado ainda.</p>
                <p className="text-sm text-slate-500 mt-2">Importe um extrato na aba "Importar Extrato" para começar.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {getReconciledStatements().map((stmt) => (
                  <div key={stmt.clientId} className="bg-white border border-slate-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h4 className="text-lg font-bold text-slate-900">{stmt.clientName}</h4>
                        <p className="text-sm text-slate-600">
                          {stmt.totalEntries} lançamento(s) no total
                        </p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                        stmt.status === 'CONCILIADO' ? 'bg-green-100 text-green-700' :
                        stmt.status === 'PARCIAL' ? 'bg-orange-100 text-orange-700' :
                        'bg-slate-100 text-slate-700'
                      }`}>
                        {stmt.status === 'CONCILIADO' ? '✓ Conciliado' :
                         stmt.status === 'PARCIAL' ? '⚠ Parcial' : '○ Não Iniciado'}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4 mb-4">
                      <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                        <p className="text-xs text-green-700 font-medium">Conciliados</p>
                        <p className="text-2xl font-bold text-green-800">{stmt.conciliados}</p>
                      </div>
                      <div className="bg-orange-50 p-3 rounded-lg border border-orange-200">
                        <p className="text-xs text-orange-700 font-medium">Pendentes</p>
                        <p className="text-2xl font-bold text-orange-800">{stmt.pendentes}</p>
                      </div>
                      <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                        <p className="text-xs text-slate-700 font-medium">Não Iniciados</p>
                        <p className="text-2xl font-bold text-slate-800">{stmt.naoIniciados}</p>
                      </div>
                    </div>

                    <div className="border-t border-slate-200 pt-4">
                      <h5 className="text-sm font-semibold text-slate-700 mb-2">Lançamentos:</h5>
                      <div className="max-h-40 overflow-y-auto space-y-1">
                        {stmt.entries.slice(0, 5).map(entry => (
                          <div key={entry.id} className="flex items-center justify-between text-sm bg-slate-50 px-3 py-2 rounded">
                            <span className="text-slate-900 font-medium">{entry.description}</span>
                            <div className="flex items-center gap-2">
                              <span className="text-slate-600">
                                {entry.debitValue > 0 ? `Débito: ${formatCurrency(entry.debitValue)}` : 
                                 entry.creditValue > 0 ? `Crédito: ${formatCurrency(entry.creditValue)}` : '-'}
                              </span>
                              <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                                entry.status === 'CONCILIADO' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                              }`}>
                                {entry.status}
                              </span>
                            </div>
                          </div>
                        ))}
                        {stmt.entries.length > 5 && (
                          <p className="text-xs text-slate-500 text-center mt-2">
                            + {stmt.entries.length - 5} lançamento(s) adicional(is)
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ================= MODAL DE NOVO/EDIÇÃO DE LANÇAMENTO ================= */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-slate-200 sticky top-0 bg-white z-10">
              <h2 className="text-xl font-bold text-slate-900">{editingEntry ? 'Editar' : 'Novo'} Lançamento</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 p-2 hover:bg-slate-100 rounded-lg"><X className="h-6 w-6" /></button>
            </div>
            
            <form onSubmit={handleSave} className="p-6 space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Data *</label>
                  <input type="date" required value={form.entryDate} onChange={(e) => setForm({ ...form, entryDate: e.target.value })} className={inputClass} />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Nº Documento</label>
                  <input type="text" value={form.documentNumber} onChange={(e) => setForm({ ...form, documentNumber: e.target.value })} className={inputClass} placeholder="Ex: NF-001" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Histórico *</label>
                  <textarea required rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className={inputClass} />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Nome da Empresa</label>
                  <input type="text" value={form.counterpartyName} onChange={(e) => setForm({ ...form, counterpartyName: e.target.value })} className={inputClass} />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">CPF/CNPJ</label>
                  <input type="text" value={form.counterpartyCpfCnpj} onChange={(e) => setForm({ ...form, counterpartyCpfCnpj: e.target.value })} className={inputClass} />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Vincular à Empresa/Cliente</label>
                  <select 
                    value={form.clientId} 
                    onChange={(e) => setForm({ ...form, clientId: e.target.value })} 
                    className={inputClass}
                  >
                    <option value="">Selecione uma empresa (opcional)</option>
                    {clients.map((client) => (
                      <option key={client.id} value={client.id}>
                        {client.companyName} - {client.cnpj || 'Sem CNPJ'}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="md:col-span-2 border-t pt-4">
                  <h3 className="font-bold text-orange-600 mb-3">Débito</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <select required value={form.debitAccountId} onChange={(e) => setForm({ ...form, debitAccountId: e.target.value })} className={inputClass}>
                      <option value="">Selecione a conta...</option>
                      {accounts.map((acc) => (
                        <option key={acc.id} value={acc.id}>{acc.code} - {acc.name}</option>
                      ))}
                    </select>
                    <input 
                      type="number" 
                      step="0.01" 
                      min="0" 
                      value={form.debitValue || ''} 
                      onChange={(e) => setForm({ ...form, debitValue: parseFloat(e.target.value) || 0 })} 
                      className={inputClass} 
                      placeholder="Valor (deixe 0 se for crédito)" 
                    />
                  </div>
                </div>

                <div className="md:col-span-2 border-t pt-4">
                  <h3 className="font-bold text-teal-600 mb-3">Crédito</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <select required value={form.creditAccountId} onChange={(e) => setForm({ ...form, creditAccountId: e.target.value })} className={inputClass}>
                      <option value="">Selecione a conta...</option>
                      {accounts.map((acc) => (
                        <option key={acc.id} value={acc.id}>{acc.code} - {acc.name}</option>
                      ))}
                    </select>
                    <input 
                      type="number" 
                      step="0.01" 
                      min="0" 
                      value={form.creditValue || ''} 
                      onChange={(e) => setForm({ ...form, creditValue: parseFloat(e.target.value) || 0 })} 
                      className={inputClass} 
                      placeholder="Valor (deixe 0 se for débito)" 
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t sticky bottom-0 bg-white">
                <button type="button" onClick={() => setShowModal(false)} className="px-5 py-2.5 text-slate-700 hover:bg-slate-100 rounded-lg font-medium">Cancelar</button>
                <button type="submit" disabled={submitting} className="flex items-center gap-2 px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-lg disabled:opacity-50">
                  {submitting && <Loader2 className="h-4 w-4 animate-spin" />}{submitting ? 'Salvando...' : 'Salvar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL DE EDIÇÃO DE CONTA CONTÁBIL ================= */}
      {showEditAccountModal && editingAccount && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
            <div className="flex items-center justify-between p-6 border-b border-slate-200">
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <Edit2 className="h-6 w-6 text-teal-600" />
                Editar Conta Contábil
              </h2>
              <button onClick={() => setShowEditAccountModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <form onSubmit={handleSaveAccount} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Código *</label>
                <input 
                  type="text" 
                  required 
                  value={accountForm.code} 
                  onChange={(e) => setAccountForm({ ...accountForm, code: e.target.value })} 
                  className={inputClass}
                  placeholder="Ex: 1.1.01.001"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Nome *</label>
                <input 
                  type="text" 
                  required 
                  value={accountForm.name} 
                  onChange={(e) => setAccountForm({ ...accountForm, name: e.target.value })} 
                  className={inputClass}
                  placeholder="Ex: Caixa e Equivalentes"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Tipo *</label>
                  <select 
                    required 
                    value={accountForm.type} 
                    onChange={(e) => setAccountForm({ ...accountForm, type: e.target.value })} 
                    className={inputClass}
                  >
                    <option value="ATIVO">Ativo</option>
                    <option value="PASSIVO">Passivo</option>
                    <option value="PATRIMONIO_LIQUIDO">Patrimônio Líquido</option>
                    <option value="RECEITA">Receita</option>
                    <option value="DESPESA">Despesa</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Natureza *</label>
                  <select 
                    required 
                    value={accountForm.nature} 
                    onChange={(e) => setAccountForm({ ...accountForm, nature: e.target.value })} 
                    className={inputClass}
                  >
                    <option value="DEBITORA">Devedora</option>
                    <option value="CREDORA">Credora</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <button type="button" onClick={() => setShowEditAccountModal(false)} className="px-5 py-2.5 text-slate-700 hover:bg-slate-100 rounded-lg font-medium">Cancelar</button>
                <button type="submit" className="flex items-center gap-2 px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-lg">
                  <Save className="h-4 w-4" /> Salvar Alterações
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DE CONCILIAÇÃO AUTOMÁTICA */}
      {showReconciliationModal && (
        <ReconciliationModal
          onClose={() => setShowReconciliationModal(false)}
          onSuccess={() => {
            setShowReconciliationModal(false);
            loadData();
          }}
        />
      )}
    </div>
  );
}
// =================================================================
// FIM: COMPONENTE PRINCIPAL (LancamentosPage)
// =================================================================


// =================================================================
// INÍCIO: COMPONENTE ABA DE IMPORTAÇÃO (ImportTab)
// =================================================================
function ImportTab({ onImportSuccess, accounts }: { onImportSuccess: () => void, accounts: AccountingAccount[] }) {
  const [clients, setClients] = useState<any[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [isReviewing, setIsReviewing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const formatCurrency = (value: number) => 
    value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  useEffect(() => {
    loadClients();
  }, []);

  async function loadClients() {
    try {
      const res = await api.get('/clients');
      setClients(res.data.data || []);
    } catch (err) {
      toast.error('Erro ao carregar clientes');
    }
  }

  async function handleParse() {
    if (!file || !selectedClientId) {
      toast.error('Selecione o cliente E o arquivo para continuar');
      return;
    }

    setIsProcessing(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('clientId', selectedClientId);

    try {
      const res = await api.post('/accounting/import/parse', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (res.data.success) {
        setPreviewData(res.data.data.entries);
        setStats(res.data.data);
        setIsReviewing(true);
        toast.success(`${res.data.data.linhasProcessadas} lançamentos prontos para revisão!`);
      } else {
        toast.error(res.data.message || 'Erro ao processar arquivo');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Erro ao fazer upload');
    } finally {
      setIsProcessing(false);
    }
  }

  async function handleUpdateEntry(index: number, field: 'debitAccountId' | 'creditAccountId', value: string) {
    const updatedData = [...previewData];
    updatedData[index] = { ...updatedData[index], [field]: value };
    setPreviewData(updatedData);

    const entry = updatedData[index];
    if (entry.id && entry.debitAccountId && entry.creditAccountId) {
      try {
        await api.put(`/accounting/entries/${entry.id}`, {
          debitAccountId: entry.debitAccountId,
          creditAccountId: entry.creditAccountId,
          status: 'CONCILIADO',
        });
        updatedData[index] = { ...updatedData[index], status: 'CONCILIADO' };
        setPreviewData([...updatedData]);
        toast.success('Lançamento conciliado!');
      } catch (err: any) {
        toast.error('Erro ao atualizar');
      }
    }
  }

  async function handleSave() {
    if (previewData.length === 0 || !selectedClientId) return;
    setIsSaving(true);

    try {
      const res = await api.post('/accounting/import/save', { 
        entries: previewData,
        clientId: selectedClientId 
      });

      if (res.data.success) {
        toast.success(res.data.message);
        setFile(null);
        setPreviewData([]);
        setStats(null);
        setIsReviewing(false);
        setSelectedClientId('');
        onImportSuccess();
      } else {
        toast.error(res.data.message);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Erro ao salvar');
    } finally {
      setIsSaving(false);
    }
  }

  if (!isReviewing) {
    return (
      <div className="space-y-6">
        <div className="bg-white p-6 rounded-xl border border-slate-200">
          <h3 className="text-lg font-bold text-slate-900 mb-4">1. Selecione o Cliente</h3>
          <select
            value={selectedClientId}
            onChange={(e) => setSelectedClientId(e.target.value)}
            className="w-full px-4 py-3 border-2 border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
          >
            <option value="">Selecione um cliente da carteira...</option>
            {clients.map((client) => (
              <option key={client.id} value={client.id}>
                {client.companyName} - {client.cnpj || 'Sem CNPJ'}
              </option>
            ))}
          </select>
        </div>

        <div className={`bg-slate-50 p-8 rounded-xl border-2 border-dashed text-center transition-colors ${
          file ? 'border-teal-500 bg-teal-50' : 'border-slate-300 hover:border-teal-400'
        }`}>
          <UploadCloud className="h-12 w-12 text-slate-400 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-slate-900 mb-2">
            {file ? file.name : '2. Selecione o Extrato Bancário (.txt ou .csv)'}
          </h3>
          <p className="text-sm text-slate-600 mb-6 max-w-md mx-auto">
            Formato esperado: Código, Data, Conta Débito, Conta Crédito, Débito, Crédito, Complemento, CNPJ
          </p>
          
          <input 
            type="file" 
            id="extrato-upload" 
            accept=".txt,.csv" 
            disabled={!selectedClientId}
            onChange={(e) => { 
              setFile(e.target.files?.[0] || null); 
              setIsReviewing(false); 
            }} 
            className="hidden" 
          />
          
          <div className="flex justify-center gap-4">
            <label 
              htmlFor="extrato-upload" 
              className={`cursor-pointer px-6 py-3 font-semibold rounded-lg transition-colors ${
                selectedClientId 
                  ? 'bg-slate-200 hover:bg-slate-300 text-slate-800' 
                  : 'bg-slate-100 text-slate-400 cursor-not-allowed'
              }`}
            >
              Selecionar Arquivo
            </label>
            {file && (
              <button 
                onClick={handleParse} 
                disabled={isProcessing} 
                className="px-6 py-3 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-lg disabled:opacity-50 flex items-center gap-2"
              >
                {isProcessing && <Loader2 className="h-4 w-4 animate-spin" />}
                {isProcessing ? 'Processando...' : 'Pré-visualizar'}
              </button>
            )}
          </div>
          {!selectedClientId && (
            <p className="text-xs text-orange-600 mt-3">
              ️ Selecione um cliente primeiro para habilitar o upload
            </p>
          )}
        </div>
      </div>
    );
  }

  const totalEntradas = previewData.filter(e => e.type === 'ENTRADA').reduce((s, e) => s + e.amount, 0);
  const totalSaidas = previewData.filter(e => e.type === 'SAIDA').reduce((s, e) => s + e.amount, 0);

  return (
    <div className="space-y-4">
      <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="font-bold text-slate-900">Pré-visualização do Extrato</h3>
            <p className="text-sm text-slate-600">
              Cliente: <strong>{clients.find(c => c.id === selectedClientId)?.companyName}</strong>
            </p>
            <p className="text-sm text-slate-600">
              {previewData.length} lançamentos • {stats?.linhasIgnoradas || 0} linhas ignoradas
            </p>
          </div>
          <div className="flex gap-3">
            <button 
              onClick={() => { setFile(null); setPreviewData([]); setIsReviewing(false); }} 
              className="px-4 py-2 text-slate-700 hover:bg-slate-200 font-medium rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button 
              onClick={handleSave} 
              disabled={isSaving} 
              className="px-6 py-2 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-lg disabled:opacity-50 flex items-center gap-2"
            >
              {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
              {isSaving ? 'Salvando...' : 'Confirmar e Salvar'}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="bg-green-50 p-3 rounded-lg border border-green-200">
            <p className="text-xs text-green-700 font-medium">Receitas</p>
            <p className="text-lg font-bold text-green-800">{formatCurrency(totalEntradas)}</p>
          </div>
          <div className="bg-red-50 p-3 rounded-lg border border-red-200">
            <p className="text-xs text-red-700 font-medium">Despesas</p>
            <p className="text-lg font-bold text-red-800">{formatCurrency(totalSaidas)}</p>
          </div>
          <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
            <p className="text-xs text-blue-700 font-medium">Saldo</p>
            <p className={`text-lg font-bold ${totalEntradas - totalSaidas >= 0 ? 'text-green-800' : 'text-red-800'}`}>
              {formatCurrency(totalEntradas - totalSaidas)}
            </p>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto border border-slate-200 rounded-lg max-h-[500px] overflow-y-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200 sticky top-0">
            <tr>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 uppercase">Data</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 uppercase">Histórico</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 uppercase">CPF/CNPJ</th>
              <th className="text-center px-4 py-3 text-xs font-semibold text-slate-600 uppercase">Tipo</th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-slate-600 uppercase">Valor</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 uppercase">Conta Débito</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 uppercase">Conta Crédito</th>
              <th className="text-center px-4 py-3 text-xs font-semibold text-slate-600 uppercase">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {previewData.map((row, idx) => (
              <tr key={idx} className="hover:bg-slate-50">
                <td className="px-4 py-3 text-slate-700 whitespace-nowrap">
                  {new Date(row.date).toLocaleDateString('pt-BR')}
                </td>
                <td className="px-4 py-3 text-slate-900 font-medium max-w-xs truncate" title={row.description}>
                  {row.description}
                </td>
                <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
                  {row.counterpartyCpfCnpj || '-'}
                </td>
                <td className="px-4 py-3 text-center">
                  <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                    row.type === 'ENTRADA' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                  }`}>
                    {row.type === 'ENTRADA' ? '↗ Receita' : '↙ Despesa'}
                  </span>
                </td>
                <td className={`px-4 py-3 text-right font-semibold whitespace-nowrap ${
                  row.type === 'ENTRADA' ? 'text-green-700' : 'text-red-700'
                }`}>
                  {formatCurrency(row.amount)}
                </td>
                <td className="px-4 py-3">
                  <select 
                    value={row.debitAccountId || ''} 
                    onChange={(e) => handleUpdateEntry(idx, 'debitAccountId', e.target.value)} 
                    className="w-full px-2 py-1 border-2 border-orange-400 rounded-lg text-xs font-semibold bg-orange-50 text-orange-900 focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="">Selecione...</option>
                    {accounts.map(acc => (
                      <option key={acc.id} value={acc.id}>{acc.code} - {acc.name}</option>
                    ))}
                  </select>
                </td>
                <td className="px-4 py-3">
                  <select 
                    value={row.creditAccountId || ''} 
                    onChange={(e) => handleUpdateEntry(idx, 'creditAccountId', e.target.value)} 
                    className="w-full px-2 py-1 border-2 border-teal-400 rounded-lg text-xs font-semibold bg-teal-50 text-teal-900 focus:ring-2 focus:ring-teal-500"
                  >
                    <option value="">Selecione...</option>
                    {accounts.map(acc => (
                      <option key={acc.id} value={acc.id}>{acc.code} - {acc.name}</option>
                    ))}
                  </select>
                </td>
                <td className="px-4 py-3 text-center">
                  <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                    row.status === 'CONCILIADO' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                  }`}>
                    {row.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
// =================================================================
// FIM: COMPONENTE ABA DE IMPORTAÇÃO (ImportTab)
// =================================================================


// =================================================================
// INÍCIO: COMPONENTE MODAL DE CONCILIAÇÃO (ReconciliationModal)
// =================================================================
function ReconciliationModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);

  const formatCurrency = (value: number) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  async function handleReconcile() {
    if (!file) return;
    setIsProcessing(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await api.post('/accounting/reconciliation/process', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (res.data.success) {
        setResults(res.data.data.results);
        setStats(res.data.data);
        toast.success('Conciliação concluída!');
      } else {
        toast.error(res.data.message);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Erro ao conciliar');
    } finally {
      setIsProcessing(false);
    }
  }

  async function handleSaveSuggestions() {
    setIsSaving(true);
    try {
      const suggestions = results
        .filter(r => r.suggestedDebitAccountId && r.suggestedCreditAccountId)
        .map(r => ({
          entryId: r.entryId,
          suggestedDebitAccountId: r.suggestedDebitAccountId,
          suggestedCreditAccountId: r.suggestedCreditAccountId
        }));

      const res = await api.post('/accounting/reconciliation/save', { suggestions });
      if (res.data.success) {
        toast.success(res.data.message);
        onSuccess();
      } else {
        toast.error(res.data.message);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Erro ao salvar');
    } finally {
      setIsSaving(false);
    }
  }

  if (!stats) {
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between p-6 border-b border-slate-200 sticky top-0 bg-white z-10">
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <Zap className="h-6 w-6 text-purple-600" />
              Conciliação Automática
            </h2>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-2 hover:bg-slate-100 rounded-lg">
              <X className="h-6 w-6" />
            </button>
          </div>

          <div className="p-6 space-y-6">
            <div className="bg-purple-50 border border-purple-200 p-4 rounded-lg">
              <h3 className="font-semibold text-purple-900 mb-2">Como funciona:</h3>
              <ol className="text-sm text-purple-800 space-y-1 list-decimal list-inside">
                <li>Envie o arquivo CSV da base contábil do SCI (lançamentos já classificados)</li>
                <li>O sistema tentará vincular automaticamente com os lançamentos pendentes</li>
                <li>Match por VALOR EXATO ou SIMILARIDADE DE TEXTO</li>
                <li>Você poderá revisar e confirmar as sugestões antes de salvar</li>
              </ol>
            </div>

            <div className={`border-2 border-dashed rounded-xl p-8 text-center ${file ? 'border-purple-500 bg-purple-50' : 'border-slate-300'}`}>
              <FileText className="h-12 w-12 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-slate-900 mb-2">{file ? file.name : 'Base Contábil do SCI (CSV)'}</h3>
              <p className="text-sm text-slate-600 mb-4">{file ? 'Arquivo selecionado' : 'Selecione o arquivo CSV exportado do SCI'}</p>
              <input type="file" id="sci-upload" accept=".csv" onChange={(e) => setFile(e.target.files?.[0] || null)} className="hidden" />
              <label htmlFor="sci-upload" className="cursor-pointer px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg">Selecionar CSV</label>
            </div>

            <div className="flex justify-end gap-3">
              <button onClick={onClose} className="px-5 py-2.5 text-slate-700 hover:bg-slate-100 rounded-lg font-medium">Cancelar</button>
              <button onClick={handleReconcile} disabled={!file || isProcessing} className="flex items-center gap-2 px-6 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg disabled:opacity-50">
                {isProcessing && <Loader2 className="h-4 w-4 animate-spin" />}
                {isProcessing ? 'Conciliando...' : 'Iniciar Conciliação'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-slate-200 sticky top-0 bg-white z-10">
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Zap className="h-6 w-6 text-purple-600" />
            Conciliação Automática
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-2 hover:bg-slate-100 rounded-lg">
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="font-bold text-slate-900">Resultados da Conciliação</h3>
                <p className="text-sm text-slate-600">{stats.total} lançamentos analisados</p>
              </div>
              <div className="flex gap-3">
                <button onClick={onClose} className="px-4 py-2 text-slate-700 hover:bg-slate-200 font-medium rounded-lg">Fechar</button>
                <button onClick={handleSaveSuggestions} disabled={isSaving} className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg disabled:opacity-50 flex items-center gap-2">
                  {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
                  {isSaving ? 'Salvando...' : 'Confirmar e Salvar'}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                <p className="text-xs text-green-700 font-medium">Por Valor</p>
                <p className="text-2xl font-bold text-green-800">{stats.vinculadosPorValor}</p>
              </div>
              <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                <p className="text-xs text-blue-700 font-medium">Por Descrição</p>
                <p className="text-2xl font-bold text-blue-800">{stats.vinculadosPorDescricao}</p>
              </div>
              <div className="bg-orange-50 p-3 rounded-lg border border-orange-200">
                <p className="text-xs text-orange-700 font-medium">Não Vinculados</p>
                <p className="text-2xl font-bold text-orange-800">{stats.naoVinculados}</p>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-lg max-h-[400px] overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 sticky top-0">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 uppercase">Data</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 uppercase">Descrição</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-slate-600 uppercase">Valor</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-slate-600 uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {results.map((r, idx) => (
                  <tr key={idx} className="hover:bg-slate-50">
                    <td className="px-4 py-3 text-slate-700 whitespace-nowrap">{new Date(r.date).toLocaleDateString('pt-BR')}</td>
                    <td className="px-4 py-3 text-slate-900 font-medium max-w-xs truncate" title={r.description}>{r.description}</td>
                    <td className="px-4 py-3 text-right font-semibold whitespace-nowrap">{formatCurrency(r.amount)}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                        r.matchStatus === 'VALOR_ENCONTRADO' ? 'bg-green-100 text-green-700' :
                        r.matchStatus === 'DESCRICAO_ENCONTRADA' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'
                      }`}>
                        {r.matchStatus === 'VALOR_ENCONTRADO' ? '✓ Valor' : r.matchStatus === 'DESCRICAO_ENCONTRADA' ? '✓ Descrição' : '⚠ Revisar'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
// =================================================================
// FIM: COMPONENTE MODAL DE CONCILIAÇÃO (ReconciliationModal)
// =================================================================