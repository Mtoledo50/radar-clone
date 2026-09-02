'use client';
// =================================================================
// INÍCIO: frontend/src/app/dashboard/lancamentos/page.tsx (v3 - CORRIGIDO)
// =================================================================
// v3 (ADR-072):
//  • Partida dobrada real: D e C obrigatórios, valor espelha,
//    auto-CONCILIADO ao preencher as duas contas + select de status
//    + botão ✓ de conciliação rápida na tabela.
//  • Aba Extratos Conciliados: botões 🖨️ Imprimir e 📄 PDF por cliente.
//  • Aba Plano de Contas: filtro por plano, coluna Nº unificado e
//    ordenação por código / nome / nº.
// =================================================================
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/axios';
import { toast } from 'sonner';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import SmartImportTab from '@/components/accounting/SmartImportTab';
import {
  Plus, Search, Edit2, Trash2, Loader2, X, Save,
  BookOpen, Zap, CheckCircle, CheckSquare, Square,
  FolderOpen, Printer, FileDown, ArrowUp, ArrowDown,
} from 'lucide-react';

// =================================================================
// TIPOS
// =================================================================
type TabType = 'lancamentos' | 'contas' | 'importar' | 'extratos';

interface AccountingEntry {
  id: string;
  entryDate: string;
  description: string;
  documentNumber?: string;
  counterpartyName?: string;
  counterpartyCpfCnpj?: string;
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
}

interface AccountingAccount {
  id: string;
  code: string;
  name: string;
  type: string;
  nature: string;
  isActive: boolean;
  planName?: string;
  seq?: string | null;
  accountNumber?: string | null;
}

interface Client {
  id: string;
  companyName: string;
  cnpj?: string;
  accountingPlan?: string | null;
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
// COMPONENTE PRINCIPAL
// =================================================================
export default function LancamentosPage() {
  const router = useRouter();
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
  const [selectedEntries, setSelectedEntries] = useState<string[]>([]);
  const [showEditAccountModal, setShowEditAccountModal] = useState(false);
  const [editingAccount, setEditingAccount] = useState<AccountingAccount | null>(null);
  const [accountForm, setAccountForm] = useState({ code: '', name: '', type: 'ATIVO', nature: 'DEVEDORA', level: 1 });

  const [planFilter, setPlanFilter] = useState<string>('all');
  const [accountSortField, setAccountSortField] = useState<'code' | 'name' | 'seq'>('code');
  const [accountSortDir, setAccountSortDir] = useState<'asc' | 'desc'>('asc');

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
    { key: 'contas' as TabType, label: 'Plano de Contas', icon: FolderOpen },
    { key: 'importar' as TabType, label: 'Importar Extrato', icon: FolderOpen },
    { key: 'extratos' as TabType, label: 'Extratos Conciliados', icon: FolderOpen },
  ];

  const inputClass = 'w-full px-3 py-2.5 border border-slate-300 rounded-lg text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all bg-white';

  // =================================================================
  // CARREGAMENTO
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
      // 🛡️ Quick Fix (linha 1444): o backend pode retornar { data: [...], meta }
      // (paginado) ou array direto. Normaliza para SEMPRE guardar array no state.
      const rawEntries = entriesRes.data?.data;
      const rawAccounts = accountsRes.data?.data;
      setEntries(Array.isArray(rawEntries) ? rawEntries : (rawEntries?.data ?? []));
      setAccounts(Array.isArray(rawAccounts) ? rawAccounts : (rawAccounts?.data ?? []));
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
  // FILTROS / FORMATADORES / HELPERS
  // =================================================================
  const entriesList = Array.isArray(entries) ? entries : ((entries as any)?.data || []);

  // ✅ CORRIGIDO: filteredEntries agora está corretamente declarado
  const filteredEntries = entriesList.filter((entry: AccountingEntry) => {
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
  const formatDate = (date: string) => new Date(date).toLocaleDateString('pt-BR');

  const modalClient = form.clientId ? clients.find((c) => c.id === form.clientId) : null;
  const accountsForModal = modalClient?.accountingPlan
    ? accounts.filter((a) => a.planName === modalClient.accountingPlan)
    : accounts;
  const accLabel = (a: AccountingAccount) =>
    `${a.seq || a.accountNumber ? `${a.seq || a.accountNumber} • ` : ''}${a.code} - ${a.name}`;

  const plans = Array.from(new Set(accounts.map((a) => a.planName || 'Padrão'))).sort();
  const seqNum = (a: AccountingAccount) => parseInt(a.seq || a.accountNumber || '0', 10) || 0;
  const filteredAccounts = (() => {
    let list = accounts;
    if (planFilter !== 'all') list = list.filter((a) => (a.planName || 'Padrão') === planFilter);
    const dir = accountSortDir === 'asc' ? 1 : -1;
    return [...list].sort((a, b) => {
      if (accountSortField === 'code') return a.code.localeCompare(b.code, 'pt-BR', { numeric: true }) * dir;
      if (accountSortField === 'name') return a.name.localeCompare(b.name, 'pt-BR') * dir;
      return (seqNum(a) - seqNum(b)) * dir;
    });
  })();

  // =================================================================
  // SELEÇÃO MÚLTIPLA
  // =================================================================
  function toggleSelectEntry(entryId: string) {
    setSelectedEntries((prev) =>
      prev.includes(entryId) ? prev.filter((id) => id !== entryId) : [...prev, entryId],
    );
  }
  function toggleSelectAll() {
    if (selectedEntries.length === filteredEntries.length) setSelectedEntries([]);
    else setSelectedEntries(filteredEntries.map((e) => e.id));
  }
  async function handleBulkDelete() {
    if (selectedEntries.length === 0) return toast.error('Selecione pelo menos um lançamento');
    if (!confirm(`Tem certeza que deseja excluir ${selectedEntries.length} lançamento(s)?`)) return;
    try {
      await Promise.all(selectedEntries.map((id) => api.delete(`/accounting/entries/${id}`)));
      toast.success(`${selectedEntries.length} lançamento(s) excluído(s)`);
      setSelectedEntries([]);
      loadData();
    } catch (err) {
      toast.error('Erro ao excluir lançamentos');
    }
  }
  async function handleForceConciliate() {
    if (selectedEntries.length === 0) return toast.error('Selecione pelo menos um lançamento');
    const pendentes = selectedEntries.filter((id) => entries.find((e) => e.id === id)?.status === 'PENDENTE');
    if (pendentes.length === 0) return toast.info('Nenhum lançamento pendente selecionado');
    if (!confirm(`Deseja forçar a conciliação de ${pendentes.length} lançamento(s) pendente(s)?`)) return;
    try {
      await Promise.all(pendentes.map((id) => api.put(`/accounting/entries/${id}/conciliate`, {})));
      toast.success(`${pendentes.length} lançamento(s) conciliado(s) com sucesso!`, {
        action: {
          label: '📤 Ir p/ Exportação SCI',
          onClick: () => router.push('/dashboard/contabil'),
        },
      });
      setSelectedEntries([]);
      loadData();
    } catch (err) {
      toast.error('Erro ao conciliar lançamentos');
    }
  }

  async function handleConciliate(id: string) {
    try {
      await api.put(`/accounting/entries/${id}/conciliate`, {});
      toast.success('Lançamento conciliado!');
      loadData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Erro ao conciliar');
    }
  }

  // =================================================================
  // CRUD DE LANÇAMENTOS
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
        counterpartyType: 'FORNECEDOR',
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
        description: '', documentNumber: '', counterpartyName: '',
        counterpartyCpfCnpj: '', counterpartyType: 'FORNECEDOR', clientId: '',
        debitAccountId: '', debitValue: 0, creditAccountId: '', creditValue: 0,
        status: 'PENDENTE',
      });
    }
    setShowModal(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!form.debitAccountId || !form.creditAccountId) {
      toast.error('Partida dobrada: selecione as contas de DÉBITO e de CRÉDITO.');
      return;
    }
    let dVal = Number(form.debitValue) || 0;
    let cVal = Number(form.creditValue) || 0;
    if (dVal <= 0 && cVal <= 0) {
      toast.error('Informe o valor do lançamento.');
      return;
    }
    if (dVal > 0 && cVal <= 0) cVal = dVal;
    if (cVal > 0 && dVal <= 0) dVal = cVal;

    setSubmitting(true);
    try {
      const payload = { ...form, debitValue: dVal, creditValue: cVal };
      if (editingEntry) {
        await api.put(`/accounting/entries/${editingEntry.id}`, payload);
        toast.success('Lançamento atualizado com sucesso!');
      } else {
        await api.post('/accounting/entries', payload);
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
  // CRUD DE CONTAS
  // =================================================================
  async function handleAddAccount() {
    const code = prompt('Código da conta (ex: 1.1.1.01):');
    if (!code) return;
    const name = prompt('Nome da conta:');
    if (!name) return;
    try {
      await api.post('/accounting/accounts', {
        code: code.trim(), name: name.trim(), type: 'ATIVO', nature: 'DEVEDORA',
        level: code.split('.').length, isActive: true,
        planName: planFilter !== 'all' ? planFilter : undefined,
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
      code: account.code, name: account.name, type: account.type,
      nature: account.nature, level: account.code.split('.').length,
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
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Erro ao excluir conta');
    }
  }

  // =================================================================
  // EXTRATOS CONCILIADOS
  // =================================================================
  function getReconciledStatements(): ReconciledStatement[] {
    const clientMap = new Map<string, AccountingEntry[]>();
    entries.forEach((entry) => {
      const clientId = entry.clientId || 'sem-cliente';
      if (!clientMap.has(clientId)) clientMap.set(clientId, []);
      clientMap.get(clientId)!.push(entry);
    });
    const statements: ReconciledStatement[] = [];
    clientMap.forEach((clientEntries, clientId) => {
      const client = clients.find((c) => c.id === clientId);
      const clientName = client?.companyName || 'Cliente não vinculado';
      const conciliados = clientEntries.filter((e) => e.status === 'CONCILIADO').length;
      const naoIniciados = clientEntries.filter((e) => !e.debitAccountId && !e.creditAccountId).length;
      const pendentes = clientEntries.filter((e) => e.status === 'PENDENTE' && (e.debitAccountId || e.creditAccountId)).length;
      let status: 'CONCILIADO' | 'PARCIAL' | 'NAO_INICIADO';
      if (conciliados === clientEntries.length) status = 'CONCILIADO';
      else if (conciliados === 0 && naoIniciados === clientEntries.length) status = 'NAO_INICIADO';
      else status = 'PARCIAL';
      statements.push({ clientId, clientName, totalEntries: clientEntries.length, conciliados, pendentes, naoIniciados, status, entries: clientEntries });
    });
    return statements.sort((a, b) => a.clientName.localeCompare(b.clientName));
  }

  const sortedEntries = (stmt: ReconciledStatement) =>
    [...stmt.entries].sort((a, b) => a.entryDate.localeCompare(b.entryDate));

  function handlePrintStatement(stmt: ReconciledStatement) {
    const w = window.open('', '_blank', 'width=980,height=720');
    if (!w) return toast.error('Permita pop-ups para imprimir.');
    const rows = sortedEntries(stmt)
      .map((e) => `
        <tr>
          <td>${formatDate(e.entryDate)}</td>
          <td>${(e.description || '').replace(/</g, '&lt;')}</td>
          <td class="r">${e.debitValue > 0 ? formatCurrency(e.debitValue) : '-'}</td>
          <td class="r">${e.creditValue > 0 ? formatCurrency(e.creditValue) : '-'}</td>
          <td class="c ${e.status}">${e.status}</td>
        </tr>`)
      .join('');
    w.document.write(`
      <html><head><title>Extrato - ${stmt.clientName}</title>
      <style>
        body{font-family:Arial,Helvetica,sans-serif;font-size:12px;color:#0f172a;padding:24px}
        h1{font-size:18px;margin:0} h2{font-size:14px;color:#0d9488;margin:4px 0}
        p{font-size:11px;color:#475569}
        table{width:100%;border-collapse:collapse;margin-top:12px}
        th,td{border:1px solid #cbd5e1;padding:6px 8px;text-align:left;vertical-align:top}
        th{background:#f1f5f9;text-transform:uppercase;font-size:10px}
        .r{text-align:right}.c{text-align:center}
        .PENDENTE{color:#c2410c;font-weight:bold}.CONCILIADO{color:#047857;font-weight:bold}.CANCELADO{color:#b91c1c;font-weight:bold}
      </style></head><body>
      <h1>Conta Certa — Extrato Contábil do Cliente</h1>
      <h2>${stmt.clientName}</h2>
      <p>Total: ${stmt.totalEntries} • Conciliados: ${stmt.conciliados} • Pendentes: ${stmt.pendentes} • Emitido em ${new Date().toLocaleDateString('pt-BR')}</p>
      <table>
        <thead><tr><th>Data</th><th>Histórico</th><th>Débito</th><th>Crédito</th><th>Status</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
      <script>window.onload = function(){ window.focus(); window.print(); }<\/script>
      </body></html>`);
    w.document.close();
  }

  function handlePdfStatement(stmt: ReconciledStatement) {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.setTextColor(13, 148, 136);
    doc.text('Conta Certa — Extrato Contábil do Cliente', 14, 18);
    doc.setFontSize(11);
    doc.setTextColor(30);
    doc.text(stmt.clientName, 14, 26);
    doc.setFontSize(9);
    doc.setTextColor(100);
    doc.text(
      `Total: ${stmt.totalEntries} • Conciliados: ${stmt.conciliados} • Pendentes: ${stmt.pendentes} • Emitido em ${new Date().toLocaleDateString('pt-BR')}`,
      14, 32,
    );
    autoTable(doc, {
      startY: 38,
      head: [['Data', 'Histórico', 'Débito', 'Crédito', 'Status']],
      body: sortedEntries(stmt).map((e) => [
        formatDate(e.entryDate),
        e.description,
        e.debitValue > 0 ? formatCurrency(e.debitValue) : '-',
        e.creditValue > 0 ? formatCurrency(e.creditValue) : '-',
        e.status,
      ]),
      styles: { fontSize: 8 },
      headStyles: { fillColor: [13, 148, 136] },
      columnStyles: { 2: { halign: 'right' }, 3: { halign: 'right' }, 4: { halign: 'center' } },
    });
    doc.save(`extrato_${stmt.clientName.replace(/\s+/g, '_')}.pdf`);
    toast.success('PDF gerado!');
  }

  // =================================================================
  // RENDER
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
      {/* CABEÇALHO */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
            <BookOpen className="h-8 w-8 text-teal-600" /> Lançamentos Contábeis
          </h1>
          <p className="text-slate-600 mt-1">Gestão completa e importação inteligente de débito e crédito</p>
        </div>
        <button
          onClick={() => openModal()}
          className="flex items-center gap-2 px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-lg transition-colors shadow-sm"
        >
          <Plus className="h-5 w-5" /> Novo Lançamento
        </button>
      </div>

      {/* ABAS */}
      <div className="flex gap-2 bg-slate-100 p-1 rounded-lg w-fit overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-md font-medium transition-colors whitespace-nowrap ${
              activeTab === tab.key ? 'bg-white text-teal-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <tab.icon className="h-4 w-4" /> {tab.label}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 min-h-[500px]">
        {/* ================= ABA 1: LANÇAMENTOS ================= */}
        {activeTab === 'lancamentos' && (
          <div className="space-y-4">
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
              <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className={`${inputClass} w-full md:w-48`}>
                <option value="all">Todos os status</option>
                <option value="PENDENTE">Pendente</option>
                <option value="CONCILIADO">Conciliado</option>
                <option value="CANCELADO">Cancelado</option>
              </select>
              <select value={filterClient} onChange={(e) => setFilterClient(e.target.value)} className={`${inputClass} w-full md:w-64`}>
                <option value="all">Todos os clientes</option>
                {clients.map((c) => (<option key={c.id} value={c.id}>{c.companyName}</option>))}
              </select>
            </div>

            {selectedEntries.length > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CheckSquare className="h-5 w-5 text-blue-600" />
                  <span className="font-semibold text-blue-900">{selectedEntries.length} lançamento(s) selecionado(s)</span>
                </div>
                <div className="flex gap-2">
                  <button onClick={handleForceConciliate} className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg">
                    <CheckCircle className="h-4 w-4" /> Finalizar Conciliação
                  </button>
                  <button onClick={handleBulkDelete} className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg">
                    <Trash2 className="h-4 w-4" /> Excluir Selecionados
                  </button>
                  <button onClick={() => setSelectedEntries([])} className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold rounded-lg">
                    Limpar
                  </button>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowReconciliationModal(true)}
                className="flex items-center gap-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition-colors shadow-sm"
              >
                <Zap className="h-5 w-5" /> Conciliar Automaticamente
              </button>
              <button
                onClick={() => router.push('/dashboard/contabil')}
                className="flex items-center gap-2 px-4 py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-lg transition-colors shadow-sm"
              >
                <FileDown className="h-5 w-5" />
                Exportar p/ SCI
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3 text-left">
                      <button onClick={toggleSelectAll} className="hover:opacity-70">
                        {selectedEntries.length === filteredEntries.length && filteredEntries.length > 0
                          ? <CheckSquare className="h-5 w-5 text-teal-600" />
                          : <Square className="h-5 w-5 text-slate-400" />}
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
                    <tr key={entry.id} className={`hover:bg-slate-50 transition-colors ${selectedEntries.includes(entry.id) ? 'bg-blue-50' : ''}`}>
                      <td className="px-4 py-3">
                        <button onClick={() => toggleSelectEntry(entry.id)} className="hover:opacity-70">
                          {selectedEntries.includes(entry.id)
                            ? <CheckSquare className="h-5 w-5 text-teal-600" />
                            : <Square className="h-5 w-5 text-slate-400" />}
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
                          {entry.status !== 'CONCILIADO' && (
                            <button onClick={() => handleConciliate(entry.id)} className="p-1.5 text-slate-500 hover:text-green-600 hover:bg-green-50 rounded" title="Conciliar">
                              <CheckCircle className="h-4 w-4" />
                            </button>
                          )}
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
            <div className="flex flex-col lg:flex-row lg:items-center gap-3">
              <h3 className="text-lg font-bold text-slate-900 flex-1">
                Plano de Contas
                {planFilter !== 'all' && (
                  <span className="ml-2 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-700">📒 {planFilter}</span>
                )}
              </h3>
              <select value={planFilter} onChange={(e) => setPlanFilter(e.target.value)} className="px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white">
                <option value="all">Todos os planos</option>
                {plans.map((p) => (<option key={p} value={p}>{p}</option>))}
              </select>
              <select value={accountSortField} onChange={(e) => setAccountSortField(e.target.value as 'code' | 'name' | 'seq')} className="px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white">
                <option value="code">Ordenar por código</option>
                <option value="seq">Ordenar por nº unificado</option>
                <option value="name">Ordenar por nome</option>
              </select>
              <button
                onClick={() => setAccountSortDir(accountSortDir === 'asc' ? 'desc' : 'asc')}
                className="inline-flex items-center gap-2 px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white hover:bg-slate-50"
              >
                {accountSortDir === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />}
                {accountSortDir === 'asc' ? 'Crescente' : 'Decrescente'}
              </button>
              <button onClick={handleAddAccount} className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-lg">
                <Plus className="h-4 w-4" /> Nova Conta
              </button>
            </div>
            <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200 sticky top-0">
                  <tr>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 uppercase w-16">Nº</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 uppercase">Código</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 uppercase">Nome</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 uppercase">Tipo</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 uppercase">Natureza</th>
                    <th className="text-center px-4 py-3 text-xs font-semibold text-slate-600 uppercase">Status</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-slate-600 uppercase">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredAccounts.map((account) => (
                    <tr key={account.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 text-sm font-mono font-bold text-blue-600">{account.seq || account.accountNumber || '-'}</td>
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
                          <button onClick={() => openEditAccountModal(account)} className="p-1.5 text-slate-500 hover:text-teal-600 hover:bg-teal-50 rounded" title="Editar"><Edit2 className="h-4 w-4" /></button>
                          <button onClick={() => handleDeleteAccount(account.id)} className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded" title="Excluir"><Trash2 className="h-4 w-4" /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredAccounts.length === 0 && (
                <p className="text-sm text-slate-400 text-center py-8">Nenhuma conta neste plano.</p>
              )}
            </div>
          </div>
        )}

        {/* ================= ABA 3: IMPORTAR EXTRATO ================= */}
        {activeTab === 'importar' && <SmartImportTab onImportSuccess={loadData} />}

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
                    <div className="flex items-start justify-between mb-4 gap-3 flex-wrap">
                      <div>
                        <h4 className="text-lg font-bold text-slate-900">{stmt.clientName}</h4>
                        <p className="text-sm text-slate-600">{stmt.totalEntries} lançamento(s) no total</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handlePrintStatement(stmt)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-semibold bg-white hover:bg-slate-50"
                        >
                          <Printer className="h-3.5 w-3.5" /> Imprimir
                        </button>
                        <button
                          onClick={() => handlePdfStatement(stmt)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-semibold bg-white hover:bg-slate-50"
                        >
                          <FileDown className="h-3.5 w-3.5" /> PDF
                        </button>
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                          stmt.status === 'CONCILIADO' ? 'bg-green-100 text-green-700' :
                          stmt.status === 'PARCIAL' ? 'bg-orange-100 text-orange-700' : 'bg-slate-100 text-slate-700'
                        }`}>
                          {stmt.status === 'CONCILIADO' ? '✓ Conciliado' : stmt.status === 'PARCIAL' ? '⚠ Parcial' : '○ Não Iniciado'}
                        </span>
                      </div>
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
                        {sortedEntries(stmt).slice(0, 5).map((entry) => (
                          <div key={entry.id} className="flex items-center justify-between text-sm bg-slate-50 px-3 py-2 rounded">
                            <span className="text-slate-900 font-medium">{entry.description}</span>
                            <div className="flex items-center gap-2">
                              <span className="text-slate-600">
                                {entry.debitValue > 0 ? `Débito: ${formatCurrency(entry.debitValue)}` :
                                 entry.creditValue > 0 ? `Crédito: ${formatCurrency(entry.creditValue)}` : '-'}
                              </span>
                              <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                                entry.status === 'CONCILIADO' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                              }`}>{entry.status}</span>
                            </div>
                          </div>
                        ))}
                        {stmt.entries.length > 5 && (
                          <p className="text-xs text-slate-500 text-center mt-2">+ {stmt.entries.length - 5} lançamento(s) adicional(is)</p>
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

      {/* ================= MODAL NOVO/EDIÇÃO DE LANÇAMENTO ================= */}
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
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Vincular à Empresa/Cliente</label>
                  <select value={form.clientId} onChange={(e) => setForm({ ...form, clientId: e.target.value })} className={inputClass}>
                    <option value="">Selecione uma empresa (opcional)</option>
                    {clients.map((client) => (
                      <option key={client.id} value={client.id}>
                        {client.companyName} - {client.cnpj || 'Sem CNPJ'}{client.accountingPlan ? ` (📒 ${client.accountingPlan})` : ''}
                      </option>
                    ))}
                  </select>
                  {modalClient?.accountingPlan && (
                    <p className="text-xs text-blue-600 mt-1">📒 Contas filtradas pelo plano {modalClient.accountingPlan} deste cliente.</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Status</label>
                  <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className={inputClass}>
                    <option value="PENDENTE">Pendente</option>
                    <option value="CONCILIADO">Conciliado</option>
                    <option value="CANCELADO">Cancelado</option>
                  </select>
                  <p className="text-xs text-slate-500 mt-1">Ao preencher DÉBITO e CRÉDITO, vira CONCILIADO automaticamente.</p>
                </div>

                {/* DÉBITO */}
                <div className="md:col-span-2 border-t pt-4">
                  <h3 className="font-bold text-orange-600 mb-3">Débito</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <select
                      required
                      value={form.debitAccountId}
                      onChange={(e) => {
                        const debitAccountId = e.target.value;
                        setForm((f) => ({
                          ...f,
                          debitAccountId,
                          status: debitAccountId && f.creditAccountId ? 'CONCILIADO' : f.status,
                        }));
                      }}
                      className={inputClass}
                    >
                      <option value="">Selecione a conta...</option>
                      {accountsForModal.map((acc) => (<option key={acc.id} value={acc.id}>{accLabel(acc)}</option>))}
                    </select>
                    <input
                      type="number" step="0.01" min="0"
                      value={form.debitValue || ''}
                      onChange={(e) => setForm({ ...form, debitValue: parseFloat(e.target.value) || 0 })}
                      className={inputClass}
                      placeholder="Valor"
                    />
                  </div>
                </div>

                {/* CRÉDITO */}
                <div className="md:col-span-2 border-t pt-4">
                  <h3 className="font-bold text-teal-600 mb-3">Crédito</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <select
                      required
                      value={form.creditAccountId}
                      onChange={(e) => {
                        const creditAccountId = e.target.value;
                        setForm((f) => ({
                          ...f,
                          creditAccountId,
                          status: creditAccountId && f.debitAccountId ? 'CONCILIADO' : f.status,
                        }));
                      }}
                      className={inputClass}
                    >
                      <option value="">Selecione a conta...</option>
                      {accountsForModal.map((acc) => (<option key={acc.id} value={acc.id}>{accLabel(acc)}</option>))}
                    </select>
                    <input
                      type="number" step="0.01" min="0"
                      value={form.creditValue || ''}
                      onChange={(e) => setForm({ ...form, creditValue: parseFloat(e.target.value) || 0 })}
                      className={inputClass}
                      placeholder="Valor (espelha automático)"
                    />
                  </div>
                  <p className="text-xs text-slate-500 mt-2">Partida dobrada: o valor informado é espelhado nos dois lados (D = C).</p>
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

      {/* ================= MODAL EDIÇÃO DE CONTA ================= */}
      {showEditAccountModal && editingAccount && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
            <div className="flex items-center justify-between p-6 border-b border-slate-200">
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <Edit2 className="h-6 w-6 text-teal-600" /> Editar Conta Contábil
              </h2>
              <button onClick={() => setShowEditAccountModal(false)} className="text-slate-400 hover:text-slate-600"><X className="h-6 w-6" /></button>
            </div>
            <form onSubmit={handleSaveAccount} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Código *</label>
                <input type="text" required value={accountForm.code} onChange={(e) => setAccountForm({ ...accountForm, code: e.target.value })} className={inputClass} placeholder="Ex: 1.1.01.001" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Nome *</label>
                <input type="text" required value={accountForm.name} onChange={(e) => setAccountForm({ ...accountForm, name: e.target.value })} className={inputClass} placeholder="Ex: Caixa e Equivalentes" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Tipo *</label>
                  <select required value={accountForm.type} onChange={(e) => setAccountForm({ ...accountForm, type: e.target.value })} className={inputClass}>
                    <option value="ATIVO">Ativo</option>
                    <option value="PASSIVO">Passivo</option>
                    <option value="PATRIMONIO_LIQUIDO">Patrimônio Líquido</option>
                    <option value="RECEITA">Receita</option>
                    <option value="DESPESA">Despesa</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Natureza *</label>
                  <select required value={accountForm.nature} onChange={(e) => setAccountForm({ ...accountForm, nature: e.target.value })} className={inputClass}>
                    <option value="DEVEDORA">Devedora</option>
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
          onSuccess={() => { setShowReconciliationModal(false); loadData(); }}
        />
      )}
    </div>
  );
}

// =================================================================
// MODAL DE CONCILIAÇÃO AUTOMÁTICA
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
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      if (res.data.success) {
        setResults(res.data.data.results);
        setStats(res.data.data);
        toast.success('Conciliação concluída!');
      } else {
        toast.error(res.data.message);
      }
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Erro ao conciliar');
    } finally {
      setIsProcessing(false);
    }
  }

  async function handleSaveSuggestions() {
    setIsSaving(true);
    try {
      const suggestions = results
        .filter((r) => r.suggestedDebitAccountId && r.suggestedCreditAccountId)
        .map((r) => ({
          entryId: r.entryId,
          suggestedDebitAccountId: r.suggestedDebitAccountId,
          suggestedCreditAccountId: r.suggestedCreditAccountId,
        }));
      const res = await api.post('/accounting/reconciliation/save', { suggestions });
      if (res.data.success) {
        toast.success(res.data.message);
        onSuccess();
      } else {
        toast.error(res.data.message);
      }
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Erro ao salvar');
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
              <Zap className="h-6 w-6 text-purple-600" /> Conciliação Automática
            </h2>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-2 hover:bg-slate-100 rounded-lg"><X className="h-6 w-6" /></button>
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
              <FolderOpen className="h-12 w-12 text-slate-400 mx-auto mb-4" />
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
            <Zap className="h-6 w-6 text-purple-600" /> Conciliação Automática
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-2 hover:bg-slate-100 rounded-lg"><X className="h-6 w-6" /></button>
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
// FIM: frontend/src/app/dashboard/lancamentos/page.tsx (v3 - CORRIGIDO)
// =================================================================