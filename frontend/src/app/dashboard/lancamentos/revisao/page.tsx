'use client';

// =================================================================
// INÍCIO: IMPORTS
// =================================================================
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/axios';
import { toast } from 'sonner';
import {
  AlertCircle, Save, Search, CheckCircle, ArrowLeft,
  Loader2, Users, Filter, Copy
} from 'lucide-react';
// =================================================================
// FIM: IMPORTS
// =================================================================


// =================================================================
// INÍCIO: TIPOS E INTERFACES
// =================================================================
interface AccountingEntry {
  id: string;
  entryDate: string;
  description: string;
  counterpartyName?: string;
  counterpartyCpfCnpj?: string;
  clientId?: string;
  client?: { companyName: string; cnpj?: string };
  debitAccountId?: string;
  debitAccount?: { code: string; name: string };
  debitValue: number;
  creditAccountId?: string;
  creditAccount?: { code: string; name: string };
  creditValue: number;
  status: string;
}

interface AccountingAccount {
  id: string;
  code: string;
  name: string;
  type: string;
  isActive: boolean;
}

interface Client {
  id: string;
  companyName: string;
  cnpj?: string;
}

interface EntryWithAutocomplete extends AccountingEntry {
  debitSearch: string;
  creditSearch: string;
  debitSuggestions: AccountingAccount[];
  creditSuggestions: AccountingAccount[];
}
// =================================================================
// FIM: TIPOS E INTERFACES
// =================================================================


// =================================================================
// INÍCIO: COMPONENTE PRINCIPAL
// =================================================================
export default function RevisaoManualPage() {
  const router = useRouter();
  const [entries, setEntries] = useState<EntryWithAutocomplete[]>([]);
  const [accounts, setAccounts] = useState<AccountingAccount[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [filterClientId, setFilterClientId] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // =================================================================
  // INÍCIO: CARREGAMENTO INICIAL
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

      const allEntries = entriesRes.data.data || [];
      const allAccounts = accountsRes.data.data || [];

      // Filtrar apenas lançamentos PENDENTES que precisam de revisão
      const pendingEntries = allEntries
        .filter((e: AccountingEntry) => e.status === 'PENDENTE')
        .map((e: AccountingEntry) => ({
          ...e,
          debitSearch: e.debitAccount ? `${e.debitAccount.code} - ${e.debitAccount.name}` : '',
          creditSearch: e.creditAccount ? `${e.creditAccount.code} - ${e.creditAccount.name}` : '',
          debitSuggestions: [],
          creditSuggestions: [],
        }));

      setEntries(pendingEntries);
      setAccounts(allAccounts);
    } catch (err) {
      console.error('Erro ao carregar dados:', err);
      toast.error('Erro ao carregar lançamentos pendentes');
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
  // FIM: CARREGAMENTO INICIAL
  // =================================================================


  // =================================================================
  // INÍCIO: FUNÇÕES DE FILTRAGEM
  // =================================================================
  const filteredEntries = entries.filter((entry) => {
    const matchesClient = filterClientId === 'all' || entry.clientId === filterClientId;
    const matchesSearch = 
      entry.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.counterpartyName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.counterpartyCpfCnpj?.includes(searchTerm);
    return matchesClient && matchesSearch;
  });

  const entriesByClient = filteredEntries.reduce((acc, entry) => {
    const clientId = entry.clientId || 'sem-cliente';
    if (!acc[clientId]) {
      acc[clientId] = [];
    }
    acc[clientId].push(entry);
    return acc;
  }, {} as Record<string, EntryWithAutocomplete[]>);

  const getClientName = (clientId: string) => {
    if (clientId === 'sem-cliente') return 'Cliente não vinculado';
    const client = clients.find(c => c.id === clientId);
    return client?.companyName || 'Cliente desconhecido';
  };
  // =================================================================
  // FIM: FUNÇÕES DE FILTRAGEM
  // =================================================================


  // =================================================================
  // INÍCIO: FUNÇÕES DE AUTOCOMPLETE
  // =================================================================
  function handleSearchDebit(index: number, query: string) {
    const updated = [...entries];
    const entry = updated[index];
    
    if (!query || query.length < 2) {
      entry.debitSuggestions = [];
      entry.debitSearch = query;
      setEntries(updated);
      return;
    }

    const queryLower = query.toLowerCase();
  
  // Filtrar todas as contas que contêm a busca
  const allMatches = accounts.filter(acc => 
      acc.name.toLowerCase().includes(query.toLowerCase()) ||
      acc.code.toLowerCase().includes(query.toLowerCase())
  );

  // ✅ CORREÇÃO: Ordenar por relevância
  const sorted = allMatches.sort((a, b) => {
    const aNameStart = a.name.toLowerCase().startsWith(queryLower);
    const bNameStart = b.name.toLowerCase().startsWith(queryLower);
    const aCodeStart = a.code.toLowerCase().startsWith(queryLower);
    const bCodeStart = b.code.toLowerCase().startsWith(queryLower);
    
    // Prioriza match no início do nome
    if (aNameStart && !bNameStart) return -1;
    if (!aNameStart && bNameStart) return 1;
    
    // Depois prioriza match no início do código
    if (aCodeStart && !bCodeStart) return -1;
    if (!aCodeStart && bCodeStart) return 1;
    
    // Por último, ordem alfabética
    return a.name.localeCompare(b.name);
  });

  // ✅ CORREÇÃO: Aumentar limite para 20 resultados
     entry.debitSuggestions = sorted.slice(0, 20);
  entry.debitSearch = query;
  setEntries(updated);
}

  function handleSearchCredit(index: number, query: string) {
    const updated = [...entries];
    const entry = updated[index];
    
    if (!query || query.length < 2) {
      entry.creditSuggestions = [];
      entry.creditSearch = query;
      setEntries(updated);
      return;
    }

    const queryLower = query.toLowerCase();
  
  // Filtrar todas as contas que contêm a busca
  const allMatches = accounts.filter(acc => 
      acc.name.toLowerCase().includes(query.toLowerCase()) ||
      acc.code.toLowerCase().includes(query.toLowerCase())
    );

  // ✅ CORREÇÃO: Ordenar por relevância
  const sorted = allMatches.sort((a, b) => {
    const aNameStart = a.name.toLowerCase().startsWith(queryLower);
    const bNameStart = b.name.toLowerCase().startsWith(queryLower);
    const aCodeStart = a.code.toLowerCase().startsWith(queryLower);
    const bCodeStart = b.code.toLowerCase().startsWith(queryLower);
    
    // Prioriza match no início do nome
    if (aNameStart && !bNameStart) return -1;
    if (!aNameStart && bNameStart) return 1;
    
    // Depois prioriza match no início do código
    if (aCodeStart && !bCodeStart) return -1;
    if (!aCodeStart && bCodeStart) return 1;
    
    // Por último, ordem alfabética
    return a.name.localeCompare(b.name);
  });

  // ✅ CORREÇÃO: Aumentar limite para 20 resultados
  entry.creditSuggestions = sorted.slice(0, 20);
  entry.creditSearch = query;
  setEntries(updated);
}
  // =================================================================
  // FIM: FUNÇÕES DE AUTOCOMPLETE
  // =================================================================


  // =================================================================
  // INÍCIO: FUNÇÕES DE SALVAMENTO
  // =================================================================
  async function handleSaveAll() {
  // Filtrar apenas lançamentos com ambas as contas preenchidas
  const readyEntries = filteredEntries.filter(
    (e) => e.debitAccountId && e.creditAccountId
  );

  if (readyEntries.length === 0) {
    toast.error('Nenhum lançamento com contas preenchidas para conciliar');
    return;
  }

  setSaving(true);
  try {
    // ✅ CORREÇÃO: Usar PUT para cada lançamento individualmente
    const updatePromises = readyEntries.map((entry) =>
      api.put(`/accounting/entries/${entry.id}`, {
        debitAccountId: entry.debitAccountId,
        creditAccountId: entry.creditAccountId,
        status: 'CONCILIADO', // ✅ Forçar status para CONCILIADO
      })
    );

    await Promise.all(updatePromises);

    toast.success(`${readyEntries.length} lançamento(s) conciliado(s) com sucesso!`);
    
    // Recarregar dados
    await loadData();
  } catch (err: any) {
    console.error('Erro ao salvar:', err);
    toast.error(err.response?.data?.message || 'Erro ao salvar em lote');
  } finally {
    setSaving(false);
  }
}

  async function handleCheckDuplicates() {
    // Agrupar por descrição + valor
    const groups: Record<string, EntryWithAutocomplete[]> = {};
    filteredEntries.forEach(entry => {
      const key = `${entry.description}|${entry.debitValue || entry.creditValue}`;
      if (!groups[key]) groups[key] = [];
      groups[key].push(entry);
    });

    const duplicates = Object.values(groups).filter(g => g.length > 1);
    
    if (duplicates.length === 0) {
      toast.success('Nenhuma duplicidade encontrada!');
    } else {
      toast.warning(`${duplicates.length} grupo(s) de duplicidades encontrado(s)`);
      // Destacar visualmente (poderia implementar highlight aqui)
    }
  }
  // =================================================================
  // FIM: FUNÇÕES DE SALVAMENTO
  // =================================================================


  // =================================================================
  // INÍCIO: RENDERIZAÇÃO
  // =================================================================
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="h-12 w-12 text-teal-600 animate-spin mb-4" />
        <p className="text-slate-600 font-medium">Carregando lançamentos pendentes...</p>
      </div>
    );
  }

  const inputClass = 'w-full px-3 py-2.5 border border-slate-300 rounded-lg text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all bg-white';

  return (
    <div className="space-y-6">
      {/* ================================================================= */}
      {/* INÍCIO: CABEÇALHO */}
      {/* ================================================================= */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <button
            onClick={() => router.push('/dashboard/lancamentos')}
            className="flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-2 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar para Lançamentos
          </button>
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
            <AlertCircle className="h-8 w-8 text-orange-600" />
            Revisão Manual
          </h1>
          <p className="text-slate-600 mt-1">
            {filteredEntries.length} lançamento(s) pendente(s) de classificação contábil
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleCheckDuplicates}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg transition-colors"
          >
            <Copy className="h-5 w-5" />
            Verificar Duplicidades
          </button>
          <button
            onClick={handleSaveAll}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-lg transition-colors shadow-sm disabled:opacity-50"
          >
            {saving ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Save className="h-5 w-5" />
            )}
            {saving ? 'Salvando...' : 'Salvar Todos em Lote'}
          </button>
        </div>
      </div>
      {/* ================================================================= */}
      {/* FIM: CABEÇALHO */}
      {/* ================================================================= */}


      {/* ================================================================= */}
      {/* INÍCIO: FILTROS */}
      {/* ================================================================= */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5 flex items-center gap-2">
              <Users className="h-4 w-4" />
              Filtrar por Cliente
            </label>
            <select
              value={filterClientId}
              onChange={(e) => setFilterClientId(e.target.value)}
              className={inputClass}
            >
              <option value="all">Todos os clientes ({filteredEntries.length})</option>
              {clients.map((client) => {
                const count = entries.filter(e => e.clientId === client.id).length;
                return (
                  <option key={client.id} value={client.id}>
                    {client.companyName} ({count})
                  </option>
                );
              })}
              <option value="sem-cliente">
                Cliente não vinculado ({entries.filter(e => !e.clientId).length})
              </option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5 flex items-center gap-2">
              <Search className="h-4 w-4" />
              Buscar por descrição
            </label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Digite para buscar..."
              className={inputClass}
            />
          </div>
        </div>
      </div>
      {/* ================================================================= */}
      {/* FIM: FILTROS */}
      {/* ================================================================= */}


      {/* ================================================================= */}
      {/* INÍCIO: LISTA DE LANÇAMENTOS AGRUPADA POR CLIENTE */}
      {/* ================================================================= */}
      {Object.keys(entriesByClient).length === 0 ? (
        <div className="bg-white p-12 rounded-xl shadow-sm border border-slate-200 text-center">
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-slate-900 mb-2">
            Nenhum lançamento pendente!
          </h3>
          <p className="text-slate-600">
            {filterClientId === 'all' 
              ? 'Todos os lançamentos já foram conciliados.' 
              : 'Não há lançamentos pendentes para este cliente.'}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(entriesByClient).map(([clientId, clientEntries]) => (
            <div key={clientId} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              {/* Cabeçalho do grupo de cliente */}
              <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Users className="h-5 w-5 text-teal-600" />
                  <h3 className="text-lg font-bold text-slate-900">
                    {getClientName(clientId)}
                  </h3>
                  <span className="px-2 py-1 bg-teal-100 text-teal-700 text-xs font-bold rounded-full">
                    {clientEntries.length} lançamento(s)
                  </span>
                </div>
                <div className="text-sm text-slate-600">
                  {clientEntries.filter(e => e.debitAccountId && e.creditAccountId).length} prontos para salvar
                </div>
              </div>

              {/* Tabela de lançamentos */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-slate-600 uppercase">Data</th>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-slate-600 uppercase">Descrição</th>
                      <th className="text-right px-6 py-3 text-xs font-semibold text-slate-600 uppercase">Valor</th>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-slate-600 uppercase">Conta Débito</th>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-slate-600 uppercase">Conta Crédito</th>
                      <th className="text-center px-6 py-3 text-xs font-semibold text-slate-600 uppercase">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {clientEntries.map((entry, idx) => {
                      // Encontrar o índice real no array entries
                      const realIndex = entries.findIndex(e => e.id === entry.id);
                      const isComplete = entry.debitAccountId && entry.creditAccountId;

                      return (
                        <tr key={entry.id} className={`hover:bg-slate-50 transition-colors ${
                          isComplete ? 'bg-green-50/30' : ''
                        }`}>
                          <td className="px-6 py-4 text-sm text-slate-700 whitespace-nowrap">
                            {new Date(entry.entryDate).toLocaleDateString('pt-BR')}
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm font-medium text-slate-900 max-w-xs truncate" title={entry.description}>
                              {entry.description}
                            </div>
                            {entry.counterpartyCpfCnpj && (
                              <div className="text-xs text-slate-500 mt-1">
                                {entry.counterpartyCpfCnpj}
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 text-sm text-right font-semibold text-slate-900 whitespace-nowrap">
  R$ {Number(entry.debitValue > 0 ? entry.debitValue : entry.creditValue).toFixed(2)}
</td>

                          {/* COLUNA: CONTA DÉBITO COM AUTOCOMPLETE */}
                          <td className="px-6 py-4 relative">
                            <div className="relative">
                              <input
  type="text"
  value={entry.debitSearch}
  onChange={(e) => handleSearchDebit(realIndex, e.target.value)}
  placeholder="Digite para buscar"
  title={entry.debitSearch} // ✅ Mostra texto completo no hover
  className="w-full min-w-[180px] px-3 py-2.5 border-2 border-orange-300 rounded-lg text-sm font-semibold bg-orange-50 text-orange-900 placeholder:text-orange-400 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 hover:bg-orange-100 transition-colors truncate"
/>
                              {entry.debitSearch && (
                                <button
                                  onClick={() => handleClearDebit(realIndex)}
                                  className="absolute right-2 top-2 text-slate-400 hover:text-slate-600"
                                >
                                  ×
                                </button>
                              )}
                              {entry.debitSuggestions.length > 0 && (
                                <div className="absolute z-10 mt-1 w-full bg-white border border-slate-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                                  {entry.debitSuggestions.map(acc => (
                                    <button
                                      key={acc.id}
                                      onClick={() => handleSelectDebit(realIndex, acc)}
                                      className="w-full text-left px-3 py-2 text-sm hover:bg-teal-50 transition-colors border-b border-slate-100 last:border-0"
                                    >
                                      <span className="font-mono text-teal-600">{acc.code}</span>
                                      <span className="ml-2 text-slate-700">{acc.name}</span>
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                          </td>

                          {/* COLUNA: CONTA CRÉDITO COM AUTOCOMPLETE */}
                          <td className="px-6 py-4 relative">
                            <div className="relative">
                              <input
  type="text"
  value={entry.creditSearch}
  onChange={(e) => handleSearchCredit(realIndex, e.target.value)}
  placeholder="Digite para buscar"
  title={entry.creditSearch} // ✅ Mostra texto completo no hover
  className="w-full min-w-[180px] px-3 py-2.5 border-2 border-teal-300 rounded-lg text-sm font-semibold bg-teal-50 text-teal-900 placeholder:text-teal-400 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 hover:bg-teal-100 transition-colors truncate"
/>
                              {entry.creditSearch && (
                                <button
                                  onClick={() => handleClearCredit(realIndex)}
                                  className="absolute right-2 top-2 text-slate-400 hover:text-slate-600"
                                >
                                  ×
                                </button>
                              )}
                              {entry.creditSuggestions.length > 0 && (
                                <div className="absolute z-10 mt-1 w-full bg-white border border-slate-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                                  {entry.creditSuggestions.map(acc => (
                                    <button
                                      key={acc.id}
                                      onClick={() => handleSelectCredit(realIndex, acc)}
                                      className="w-full text-left px-3 py-2 text-sm hover:bg-teal-50 transition-colors border-b border-slate-100 last:border-0"
                                    >
                                      <span className="font-mono text-teal-600">{acc.code}</span>
                                      <span className="ml-2 text-slate-700">{acc.name}</span>
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                          </td>

                          {/* COLUNA: AÇÕES */}
                          <td className="px-6 py-4 text-center">
                            {isComplete ? (
                              <CheckCircle className="h-6 w-6 text-green-600 mx-auto" title="Pronto para salvar" />
                            ) : (
                              <AlertCircle className="h-6 w-6 text-orange-400 mx-auto" title="Preencha ambas as contas" />
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}
      {/* ================================================================= */}
      {/* FIM: LISTA DE LANÇAMENTOS */}
      {/* ================================================================= */}


      {/* ================================================================= */}
      {/* INÍCIO: RESUMO INFERIOR */}
      {/* ================================================================= */}
      {filteredEntries.length > 0 && (
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div>
              <p className="text-xs text-slate-600">Total de lançamentos</p>
              <p className="text-2xl font-bold text-slate-900">{filteredEntries.length}</p>
            </div>
            <div>
              <p className="text-xs text-slate-600">Prontos para salvar</p>
              <p className="text-2xl font-bold text-green-600">
                {filteredEntries.filter(e => e.debitAccountId && e.creditAccountId).length}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-600">Pendentes</p>
              <p className="text-2xl font-bold text-orange-600">
                {filteredEntries.filter(e => !e.debitAccountId || !e.creditAccountId).length}
              </p>
            </div>
          </div>
          <button
            onClick={handleSaveAll}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-3 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-lg transition-colors shadow-sm disabled:opacity-50"
          >
            {saving ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Save className="h-5 w-5" />
            )}
            {saving ? 'Salvando...' : 'Salvar Todos em Lote'}
          </button>
        </div>
      )}
      {/* ================================================================= */}
      {/* FIM: RESUMO INFERIOR */}
      {/* ================================================================= */}
    </div>
  );
}
// =================================================================
// FIM: COMPONENTE PRINCIPAL
// =================================================================