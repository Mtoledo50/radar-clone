'use client';

/**
 * =================================================================
 * 🤖 PÁGINA DE CONCILIAÇÃO BANCÁRIA AUTOMÁTICA
 * =================================================================
 * 
 * FUNCIONALIDADES:
 * 1. Upload de 2 arquivos: Excel (controle de caixa) + CSV (base contábil)
 * 2. Exibição dos resultados da conciliação automática
 * 3. Edição manual das contas de débito/crédito quando necessário
 * 4. Salvamento dos lançamentos confirmados no banco de dados
 * 
 * ENDPOINTS UTILIZADOS:
 * - POST /accounting/reconcile - Processa os arquivos e retorna sugestões
 * - GET /accounting/accounts - Lista de contas contábeis para dropdowns
 * - POST /accounting/entries - Salva lançamentos confirmados
 */

import { useState, useEffect } from 'react';
import api from '@/lib/axios';
import { toast } from 'sonner';
import {
  Upload, FileSpreadsheet, FileText, Loader2, CheckCircle, AlertCircle,
  Save, X, Download
} from 'lucide-react';

/**
 * Interface que representa um lançamento conciliado
 */
interface ReconciledEntry {
  id: string;
  date: string;
  description: string;
  counterpartyName: string;
  counterpartyCpfCnpj: string;
  amount: number;
  type: 'ENTRADA' | 'SAIDA';
  matchStatus: 'VALOR_ENCONTRADO' | 'DESCRICAO_ENCONTRADA' | 'NAO_VINCULADO';
  debitAccountId: string | null;
  creditAccountId: string | null;
  matchedFrom?: {
    debitCode: string;
    creditCode: string;
    description: string;
    value: number;
  };
}

/**
 * Interface que representa uma conta contábil
 */
interface AccountingAccount {
  id: string;
  code: string;
  name: string;
  type: string;
  nature: string;
}

export default function ConciliacaoPage() {
  // =================================================================
  // ESTADOS DO COMPONENTE
  // =================================================================
  
  // Arquivos selecionados pelo usuário
  const [cashControlFile, setCashControlFile] = useState<File | null>(null);
  const [accountingFile, setAccountingFile] = useState<File | null>(null);
  
  // Estado de processamento
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Resultados da conciliação
  const [reconciledEntries, setReconciledEntries] = useState<ReconciledEntry[]>([]);
  
  // Lista de contas contábeis para os dropdowns
  const [accounts, setAccounts] = useState<AccountingAccount[]>([]);
  
  // Carregar lista de contas contábeis ao montar o componente
  useEffect(() => {
    loadAccounts();
  }, []);

  /**
   * Busca a lista de contas contábeis do backend
   */
  async function loadAccounts() {
    try {
      const res = await api.get('/accounting/accounts');
      setAccounts(res.data.data || []);
    } catch (err) {
      console.error('Erro ao carregar contas:', err);
      toast.error('Erro ao carregar plano de contas');
    }
  }

  /**
   * =================================================================
   * FUNÇÃO: Processar Conciliação
   * =================================================================
   * Envia os 2 arquivos para o backend e recebe os resultados
   */
  async function handleProcessReconciliation() {
    // Validação: verificar se ambos os arquivos foram selecionados
    if (!cashControlFile || !accountingFile) {
      toast.error('Selecione os dois arquivos antes de processar');
      return;
    }

    setIsProcessing(true);

    // Criar FormData para enviar os arquivos
    const formData = new FormData();
    formData.append('files', cashControlFile);
    formData.append('files', accountingFile);

    try {
      // Chamar endpoint de conciliação
      const res = await api.post('/accounting/reconcile', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (res.data.success) {
        // Atualizar estado com os resultados
        setReconciledEntries(res.data.data);
        
        // Mostrar estatísticas da conciliação
        const stats = {
          total: res.data.data.length,
          valorEncontrado: res.data.data.filter((e: ReconciledEntry) => e.matchStatus === 'VALOR_ENCONTRADO').length,
          descricaoEncontrada: res.data.data.filter((e: ReconciledEntry) => e.matchStatus === 'DESCRICAO_ENCONTRADA').length,
          naoVinculado: res.data.data.filter((e: ReconciledEntry) => e.matchStatus === 'NAO_VINCULADO').length,
        };
        
        toast.success(
          `Conciliação processada! ${stats.valorEncontrado} por valor, ${stats.descricaoEncontrada} por descrição, ${stats.naoVinculado} para revisar`
        );
      } else {
        toast.error(res.data.message || 'Erro ao processar conciliação');
      }
    } catch (err: any) {
      console.error('Erro na conciliação:', err);
      toast.error(err.response?.data?.message || 'Erro ao processar arquivos');
    } finally {
      setIsProcessing(false);
    }
  }

  /**
   * =================================================================
   * FUNÇÃO: Atualizar Conta de Débito ou Crédito
   * =================================================================
   * Permite ao usuário ajustar manualmente as contas sugeridas
   */
  function updateEntryAccount(
    entryId: string, 
    field: 'debitAccountId' | 'creditAccountId', 
    accountId: string
  ) {
    setReconciledEntries(prev => 
      prev.map(entry => 
        entry.id === entryId 
          ? { ...entry, [field]: accountId }
          : entry
      )
    );
  }

  /**
   * =================================================================
   * FUNÇÃO: Salvar Lançamentos Confirmados
   * =================================================================
   * Envia os lançamentos revisados para o banco de dados
   */
  async function handleSaveEntries() {
    // Validação: verificar se todos os lançamentos têm contas definidas
    const invalidEntries = reconciledEntries.filter(
      e => !e.debitAccountId || !e.creditAccountId
    );

    if (invalidEntries.length > 0) {
      toast.error(`${invalidEntries.length} lançamentos ainda precisam de contas de débito/crédito`);
      return;
    }

    setIsSaving(true);

    try {
      // Preparar dados para salvar (formato esperado pelo backend)
      const entriesToSave = reconciledEntries.map(entry => ({
        entryDate: entry.date,
        description: entry.description,
        counterpartyName: entry.counterpartyName,
        counterpartyCpfCnpj: entry.counterpartyCpfCnpj,
        counterpartyType: 'CLIENTE', // Valor padrão, pode ser ajustado
        debitAccountId: entry.debitAccountId,
        debitValue: entry.type === 'SAIDA' ? entry.amount : 0,
        creditAccountId: entry.creditAccountId,
        creditValue: entry.type === 'ENTRADA' ? entry.amount : 0,
        status: 'CONCILIADO',
      }));

      // Salvar cada lançamento individualmente
      for (const entry of entriesToSave) {
        await api.post('/accounting/entries', entry);
      }

      toast.success(`${entriesToSave.length} lançamentos salvos com sucesso!`);
      
      // Limpar estado após salvamento bem-sucedido
      setReconciledEntries([]);
      setCashControlFile(null);
      setAccountingFile(null);
    } catch (err: any) {
      console.error('Erro ao salvar lançamentos:', err);
      toast.error(err.response?.data?.message || 'Erro ao salvar lançamentos');
    } finally {
      setIsSaving(false);
    }
  }

  /**
   * =================================================================
   * FUNÇÃO AUXILIAR: Formatar Valor Monetário
   * =================================================================
   */
  function formatCurrency(value: number) {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }

  /**
   * =================================================================
   * FUNÇÃO AUXILIAR: Formatar Data
   * =================================================================
   */
  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString('pt-BR');
  }

  /**
   * =================================================================
   * FUNÇÃO AUXILIAR: Badge de Status do Match
   * =================================================================
   */
  function getStatusBadge(status: string) {
    const badges = {
      'VALOR_ENCONTRADO': { bg: 'bg-green-100', text: 'text-green-700', label: '✓ Valor' },
      'DESCRICAO_ENCONTRADA': { bg: 'bg-blue-100', text: 'text-blue-700', label: '✓ Descrição' },
      'NAO_VINCULADO': { bg: 'bg-orange-100', text: 'text-orange-700', label: '⚠ Revisar' }
    };
    
    const badge = badges[status as keyof typeof badges] || badges['NAO_VINCULADO'];
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-bold ${badge.bg} ${badge.text}`}>
        {badge.label}
      </span>
    );
  }

  // =================================================================
  // RENDERIZAÇÃO DO COMPONENTE
  // =================================================================
  return (
    <div className="space-y-6">
      {/* CABEÇALHO */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
          <FileSpreadsheet className="h-8 w-8 text-teal-600" />
          Conciliação Bancária Automática
        </h1>
        <p className="text-slate-600 mt-1">
          Faça upload do controle de caixa (Excel) e da base contábil (CSV) para conciliação automática
        </p>
      </div>

      {/* ================================================================= */}
      {/* SEÇÃO 1: UPLOAD DE ARQUIVOS */}
      {/* ================================================================= */}
      {reconciledEntries.length === 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
            <Upload className="h-5 w-5 text-teal-600" />
            Upload de Arquivos
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Upload Excel (Controle de Caixa) */}
            <div className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
              cashControlFile ? 'border-teal-500 bg-teal-50' : 'border-slate-300 hover:border-teal-400'
            }`}>
              <FileSpreadsheet className="h-12 w-12 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-slate-900 mb-2">Controle de Caixa (Excel)</h3>
              <p className="text-sm text-slate-600 mb-4">
                {cashControlFile ? cashControlFile.name : 'Selecione o arquivo Excel com o controle de caixa'}
              </p>
              <input
                type="file"
                id="cash-control-upload"
                accept=".xlsx,.xls"
                onChange={(e) => setCashControlFile(e.target.files?.[0] || null)}
                className="hidden"
              />
              <label
                htmlFor="cash-control-upload"
                className="cursor-pointer px-6 py-2 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-lg transition-colors"
              >
                Selecionar Excel
              </label>
            </div>

            {/* Upload CSV (Base Contábil) */}
            <div className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
              accountingFile ? 'border-teal-500 bg-teal-50' : 'border-slate-300 hover:border-teal-400'
            }`}>
              <FileText className="h-12 w-12 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-slate-900 mb-2">Base Contábil (CSV)</h3>
              <p className="text-sm text-slate-600 mb-4">
                {accountingFile ? accountingFile.name : 'Selecione o arquivo CSV com a base contábil'}
              </p>
              <input
                type="file"
                id="accounting-upload"
                accept=".csv"
                onChange={(e) => setAccountingFile(e.target.files?.[0] || null)}
                className="hidden"
              />
              <label
                htmlFor="accounting-upload"
                className="cursor-pointer px-6 py-2 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-lg transition-colors"
              >
                Selecionar CSV
              </label>
            </div>
          </div>

          {/* Botão Processar */}
          <div className="mt-6 flex justify-center">
            <button
              onClick={handleProcessReconciliation}
              disabled={!cashControlFile || !accountingFile || isProcessing}
              className="px-8 py-3 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isProcessing && <Loader2 className="h-5 w-5 animate-spin" />}
              {isProcessing ? 'Processando...' : 'Processar Conciliação'}
            </button>
          </div>

          {/* Instruções */}
          <div className="mt-6 bg-blue-50 border border-blue-200 p-4 rounded-lg">
            <h4 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
              <AlertCircle className="h-5 w-5" /> Como funciona:
            </h4>
            <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
              <li>O sistema faz <strong>matching automático</strong> por valor e descrição</li>
              <li>Lançamentos encontrados são marcados com ✓ (verde/azul)</li>
              <li>Lançamentos não encontrados precisam de revisão manual (⚠ laranja)</li>
              <li>Você pode ajustar as contas de débito/crédito antes de salvar</li>
            </ol>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* SEÇÃO 2: RESULTADOS DA CONCILIAÇÃO */}
      {/* ================================================================= */}
      {reconciledEntries.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          {/* Cabeçalho com estatísticas */}
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Resultados da Conciliação</h2>
              <p className="text-sm text-slate-600">
                {reconciledEntries.length} lançamentos analisados •{' '}
                <span className="text-green-600 font-semibold">
                  {reconciledEntries.filter(e => e.matchStatus === 'VALOR_ENCONTRADO').length} por valor
                </span> •{' '}
                <span className="text-blue-600 font-semibold">
                  {reconciledEntries.filter(e => e.matchStatus === 'DESCRICAO_ENCONTRADA').length} por descrição
                </span> •{' '}
                <span className="text-orange-600 font-semibold">
                  {reconciledEntries.filter(e => e.matchStatus === 'NAO_VINCULADO').length} para revisar
                </span>
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setReconciledEntries([]);
                  setCashControlFile(null);
                  setAccountingFile(null);
                }}
                className="px-4 py-2 text-slate-700 hover:bg-slate-100 font-medium rounded-lg transition-colors flex items-center gap-2"
              >
                <X className="h-4 w-4" /> Cancelar
              </button>
              <button
                onClick={handleSaveEntries}
                disabled={isSaving}
                className="px-6 py-2 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
                {isSaving ? 'Salvando...' : 'Salvar Lançamentos'}
              </button>
            </div>
          </div>

          {/* Tabela de resultados */}
          <div className="overflow-x-auto border border-slate-200 rounded-lg">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 uppercase">Data</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 uppercase">Descrição</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 uppercase">Contraparte</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-slate-600 uppercase">Valor</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-slate-600 uppercase">Status</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 uppercase">Conta Débito</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 uppercase">Conta Crédito</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {reconciledEntries.map((entry) => (
                  <tr key={entry.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 text-slate-700 whitespace-nowrap">
                      {formatDate(entry.date)}
                    </td>
                    <td className="px-4 py-3 text-slate-900 font-medium max-w-xs truncate" title={entry.description}>
                      {entry.description}
                    </td>
                    <td className="px-4 py-3 text-slate-600 max-w-xs truncate" title={entry.counterpartyName}>
                      {entry.counterpartyName || '-'}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold whitespace-nowrap">
                      {formatCurrency(entry.amount)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {getStatusBadge(entry.matchStatus)}
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={entry.debitAccountId || ''}
                        onChange={(e) => updateEntryAccount(entry.id, 'debitAccountId', e.target.value)}
                        className="w-full px-2 py-1 border border-slate-300 rounded text-xs focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                      >
                        <option value="">Selecione...</option>
                        {accounts.map(acc => (
                          <option key={acc.id} value={acc.id}>
                            {acc.code} - {acc.name}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={entry.creditAccountId || ''}
                        onChange={(e) => updateEntryAccount(entry.id, 'creditAccountId', e.target.value)}
                        className="w-full px-2 py-1 border border-slate-300 rounded text-xs focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                      >
                        <option value="">Selecione...</option>
                        {accounts.map(acc => (
                          <option key={acc.id} value={acc.id}>
                            {acc.code} - {acc.name}
                          </option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}