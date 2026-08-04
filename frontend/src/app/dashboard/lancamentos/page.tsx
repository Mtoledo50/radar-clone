'use client';

/**
 * =================================================================
 * 📒 LANÇAMENTOS CONTÁBEIS - Conta Certa
 * =================================================================
 * 
 * Página para visualização e gestão dos lançamentos contábeis.
 * Layout com colunas: Data | Histórico | CPF/CNPJ | Débito (Conta) | Crédito (Conta) | Valores
 */

import { useState, useEffect } from 'react';
import api from '@/lib/axios';
import { toast } from 'sonner';
import {
  BookOpen, Plus, Search, Filter, Download, Edit2, Trash2,
  Calendar, FileText, DollarSign, Loader2, X, CheckCircle
} from 'lucide-react';

type TabType = 'lancamentos' | 'contas' | 'importar';

interface AccountingEntry {
  id: string;
  entryDate: string;
  description: string;
  documentNumber?: string;
  counterpartyName?: string;
  counterpartyCpfCnpj?: string;
  counterpartyType?: string;
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

export default function LancamentosPage() {
  const [activeTab, setActiveTab] = useState<TabType>('lancamentos');
  const [entries, setEntries] = useState<AccountingEntry[]>([]);
  const [accounts, setAccounts] = useState<AccountingAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [editingEntry, setEditingEntry] = useState<AccountingEntry | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Estado do formulário
  const [form, setForm] = useState({
    entryDate: new Date().toISOString().split('T')[0],
    description: '',
    documentNumber: '',
    counterpartyName: '',
    counterpartyCpfCnpj: '',
    counterpartyType: 'FORNECEDOR',
    debitAccountId: '',
    debitValue: 0,
    creditAccountId: '',
    creditValue: 0,
    status: 'PENDENTE',
  });

  const tabs = [
    { key: 'lancamentos' as TabType, label: 'Lançamentos', icon: BookOpen },
    { key: 'contas' as TabType, label: 'Plano de Contas', icon: FileText },
    { key: 'importar' as TabType, label: 'Importar Extrato', icon: Download },
  ];

  const inputClass = 'w-full px-3 py-2.5 border border-slate-300 rounded-lg text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all bg-white';

  useEffect(() => {
    loadData();
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
      console.error('Erro ao carregar dados contábeis:', err);
      toast.error('Erro ao carregar dados contábeis');
    } finally {
      setLoading(false);
    }
  }

  const filteredEntries = entries.filter((entry) => {
    const matchesSearch = 
      entry.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.counterpartyName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.counterpartyCpfCnpj?.includes(searchTerm);
    const matchesStatus = filterStatus === 'all' || entry.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const formatCurrency = (value: number) => 
    value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const formatDate = (date: string) => 
    new Date(date).toLocaleDateString('pt-BR');

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
    if (form.debitValue <= 0 || form.creditValue <= 0) {
      toast.error('Os valores de débito e crédito devem ser maiores que zero');
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

  // 🔥 FUNÇÃO ADICIONADA: Criar nova conta contábil
  async function handleAddAccount() {
    const code = prompt('Código da conta (ex: 1.1.1.01):');
    if (!code) return;
    
    const name = prompt('Nome da conta:');
    if (!name) return;

    try {
      await api.post('/accounting/accounts', {
        code: code.trim(),
        name: name.trim(),
        type: 'ATIVO', // Valor padrão, pode ser ajustado depois
        nature: 'DEBITORA',
        level: code.split('.').length,
        isActive: true,
      });
      toast.success('Conta criada com sucesso!');
      loadData(); // Recarrega a lista de contas
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Erro ao criar conta');
    }
  }

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
      {/* CABEÇALHO */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
            <BookOpen className="h-8 w-8 text-teal-600" />
            Lançamentos Contábeis
          </h1>
          <p className="text-slate-600 mt-1">Gestão completa dos lançamentos de débito e crédito</p>
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
              activeTab === tab.key
                ? 'bg-white text-teal-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* CONTEÚDO DAS ABAS */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 min-h-[500px]">
        
        {/* ================= ABA: LANÇAMENTOS ================= */}
        {activeTab === 'lancamentos' && (
          <div className="space-y-4">
            {/* FILTROS */}
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
                className={`px-3 py-2.5 ${inputClass} w-full md:w-48`}
              >
                <option value="all">Todos os status</option>
                <option value="PENDENTE">Pendente</option>
                <option value="CONCILIADO">Conciliado</option>
                <option value="CANCELADO">Cancelado</option>
              </select>
            </div>

            {/* TABELA DE LANÇAMENTOS */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 uppercase">Data</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 uppercase">Histórico / Descrição</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 uppercase">CPF/CNPJ</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-slate-600 uppercase">Débito</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 uppercase">Conta Débito</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-slate-600 uppercase">Crédito</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 uppercase">Conta Crédito</th>
                    <th className="text-center px-4 py-3 text-xs font-semibold text-slate-600 uppercase">Status</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-slate-600 uppercase">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredEntries.map((entry) => (
                    <tr key={entry.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 text-sm text-slate-700 whitespace-nowrap">
                        {formatDate(entry.entryDate)}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-900 font-medium max-w-xs truncate" title={entry.description}>
                        {entry.description}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-700 whitespace-nowrap">
                        {entry.counterpartyCpfCnpj || '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-right font-semibold text-orange-600 whitespace-nowrap">
                        {entry.debitValue > 0 ? formatCurrency(entry.debitValue) : '-'}
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-600 max-w-xs truncate">
                        {entry.debitAccount ? `${entry.debitAccount.code} - ${entry.debitAccount.name}` : '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-right font-semibold text-teal-600 whitespace-nowrap">
                        {entry.creditValue > 0 ? formatCurrency(entry.creditValue) : '-'}
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-600 max-w-xs truncate">
                        {entry.creditAccount ? `${entry.creditAccount.code} - ${entry.creditAccount.name}` : '-'}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                          entry.status === 'CONCILIADO' ? 'bg-green-100 text-green-700' :
                          entry.status === 'CANCELADO' ? 'bg-red-100 text-red-700' :
                          'bg-orange-100 text-orange-700'
                        }`}>
                          {entry.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openModal(entry)}
                            className="p-1.5 text-slate-500 hover:text-teal-600 hover:bg-teal-50 rounded"
                            title="Editar"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(entry.id)}
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
              {filteredEntries.length === 0 && (
                <div className="text-center py-12 text-slate-500">
                  <BookOpen className="h-12 w-12 mx-auto mb-3 text-slate-300" />
                  <p className="text-lg font-medium">Nenhum lançamento encontrado</p>
                  <p className="text-sm mt-1">Clique em "Novo Lançamento" para começar</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ================= ABA: PLANO DE CONTAS ================= */}
        {activeTab === 'contas' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900">Plano de Contas</h3>
              {/* 🔥 BOTÃO CORRIGIDO COM ONCLICK */}
              <button 
                onClick={handleAddAccount}
                className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-lg transition-colors"
              >
                <Plus className="h-4 w-4" /> Nova Conta
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 uppercase">Código</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 uppercase">Nome</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 uppercase">Tipo</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 uppercase">Natureza</th>
                    <th className="text-center px-4 py-3 text-xs font-semibold text-slate-600 uppercase">Status</th>
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
                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                          account.isActive ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-700'
                        }`}>
                          {account.isActive ? 'Ativa' : 'Inativa'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {accounts.length === 0 && (
                <div className="text-center py-12 text-slate-500">
                  <FileText className="h-12 w-12 mx-auto mb-3 text-slate-300" />
                  <p className="text-lg font-medium">Nenhuma conta contábil cadastrada</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ================= ABA: IMPORTAR EXTRATO ================= */}
        {activeTab === 'importar' && (
          <div className="space-y-6">
            <div className="bg-slate-50 p-8 rounded-xl border-2 border-dashed border-slate-300 text-center">
              <Download className="h-12 w-12 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-slate-900 mb-2">Importar Extrato Bancário</h3>
              <p className="text-slate-600 mb-6 max-w-md mx-auto">
                Arraste um arquivo PDF, Excel ou CSV para converter automaticamente em lançamentos contábeis. O sistema identificará a empresa e classificará como débito/crédito.
              </p>
              <button className="px-6 py-3 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-lg transition-colors">
                Selecionar Arquivo
              </button>
              <p className="text-xs text-slate-500 mt-4">
                Formatos aceitos: PDF, XLS, XLSX, CSV (máx. 10MB)
              </p>
            </div>
            <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
              <h4 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                <CheckCircle className="h-5 w-5" /> Como funciona a importação inteligente:
              </h4>
              <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                <li>O sistema lê o arquivo e identifica os lançamentos bancários.</li>
                <li>Classifica automaticamente como débito ou crédito com base no valor.</li>
                <li>Identifica a empresa pelo nome e verifica se já existe no cadastro de clientes/fornecedores.</li>
                <li>Se não existir, solicita o cadastro rápido da empresa.</li>
                <li>Alimenta automaticamente o BI e outras abas com os dados processados.</li>
              </ol>
            </div>
          </div>
        )}
      </div>

      {/* ================= MODAL DE NOVO/EDIÇÃO ================= */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-slate-200 sticky top-0 bg-white z-10">
              <h2 className="text-xl font-bold text-slate-900">
                {editingEntry ? 'Editar Lançamento' : 'Novo Lançamento Contábil'}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 p-2 hover:bg-slate-100 rounded-lg transition-colors">
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <form onSubmit={handleSave} className="p-6 space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Data do Lançamento *</label>
                  <input 
                    type="date" 
                    required 
                    value={form.entryDate} 
                    onChange={(e) => setForm({ ...form, entryDate: e.target.value })} 
                    className={inputClass} 
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Nº do Documento</label>
                  <input 
                    type="text" 
                    value={form.documentNumber} 
                    onChange={(e) => setForm({ ...form, documentNumber: e.target.value })} 
                    className={inputClass} 
                    placeholder="Ex: NF-001, Comprovante, etc." 
                  />
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Histórico / Descrição *</label>
                  <textarea 
                    required 
                    rows={2} 
                    value={form.description} 
                    onChange={(e) => setForm({ ...form, description: e.target.value })} 
                    className={inputClass} 
                    placeholder="Descreva o lançamento (ex: Pagamento de fornecedor, Recebimento de honorários...)" 
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Nome da Empresa (Cliente/Fornecedor)</label>
                  <input 
                    type="text" 
                    value={form.counterpartyName} 
                    onChange={(e) => setForm({ ...form, counterpartyName: e.target.value })} 
                    className={inputClass} 
                    placeholder="Razão social ou nome fantasia" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">CPF/CNPJ</label>
                  <input 
                    type="text" 
                    value={form.counterpartyCpfCnpj} 
                    onChange={(e) => setForm({ ...form, counterpartyCpfCnpj: e.target.value })} 
                    className={inputClass} 
                    placeholder="00.000.000/0000-00" 
                  />
                </div>

                {/* SEÇÃO DE DÉBITO */}
                <div className="md:col-span-2 border-t border-slate-200 pt-4 mt-2">
                  <h3 className="font-bold text-orange-600 mb-3 flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m7 7 10 10"/><path d="M17 7v10H7"/></svg>
                    Débito
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1.5">Conta Contábil *</label>
                      <select 
                        required 
                        value={form.debitAccountId} 
                        onChange={(e) => setForm({ ...form, debitAccountId: e.target.value })} 
                        className={inputClass}
                      >
                        <option value="">Selecione a conta de débito...</option>
                        {accounts.map((acc) => (
                          <option key={acc.id} value={acc.id}>{acc.code} - {acc.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1.5">Valor (R$) *</label>
                      <input 
                        type="number" 
                        step="0.01" 
                        min="0.01"
                        required 
                        value={form.debitValue || ''} 
                        onChange={(e) => setForm({ ...form, debitValue: parseFloat(e.target.value) || 0 })} 
                        className={inputClass} 
                        placeholder="0,00" 
                      />
                    </div>
                  </div>
                </div>

                {/* SEÇÃO DE CRÉDITO */}
                <div className="md:col-span-2 border-t border-slate-200 pt-4">
                  <h3 className="font-bold text-teal-600 mb-3 flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M7 7h10v10"/><path d="M7 17 17 7"/></svg>
                    Crédito
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1.5">Conta Contábil *</label>
                      <select 
                        required 
                        value={form.creditAccountId} 
                        onChange={(e) => setForm({ ...form, creditAccountId: e.target.value })} 
                        className={inputClass}
                      >
                        <option value="">Selecione a conta de crédito...</option>
                        {accounts.map((acc) => (
                          <option key={acc.id} value={acc.id}>{acc.code} - {acc.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1.5">Valor (R$) *</label>
                      <input 
                        type="number" 
                        step="0.01" 
                        min="0.01"
                        required 
                        value={form.creditValue || ''} 
                        onChange={(e) => setForm({ ...form, creditValue: parseFloat(e.target.value) || 0 })} 
                        className={inputClass} 
                        placeholder="0,00" 
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 sticky bottom-0 bg-white">
                <button 
                  type="button" 
                  onClick={() => setShowModal(false)} 
                  className="px-5 py-2.5 text-slate-700 font-medium hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  disabled={submitting} 
                  className="flex items-center gap-2 px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 shadow-sm"
                >
                  {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                  {submitting ? 'Salvando...' : 'Salvar Lançamento'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}