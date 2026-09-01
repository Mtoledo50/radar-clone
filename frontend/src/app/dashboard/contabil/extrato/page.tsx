'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/axios';
import { toast } from 'sonner';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { BookOpen, Search, Loader2, FileText, TrendingUp, TrendingDown, DollarSign } from 'lucide-react';

interface AccountingEntry {
  id: string;
  entryDate: string;
  description: string;
  debitAccount?: { code: string; name: string };
  creditAccount?: { code: string; name: string };
  debitValue: number;
  creditValue: number;
}

interface Client {
  id: string;
  companyName: string;
  cnpj?: string;
}

export default function ExtratoContabilPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClient, setSelectedClient] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [entries, setEntries] = useState<AccountingEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Inicializa com o mês atual
  useEffect(() => {
    loadClients();
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
    const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().split('T')[0];
    setStartDate(firstDay);
    setEndDate(lastDay);
  }, []);

  async function loadClients() {
    try {
      const res = await api.get('/clients');
      setClients(res.data.data || []);
    } catch (error) {
      toast.error('Erro ao carregar clientes');
    }
  }

  async function loadEntries() {
    if (!selectedClient || !startDate || !endDate) {
      toast.error('Selecione o cliente e o período');
      return;
    }

    setLoading(true);
    try {
      const res = await api.get('/accounting/entries/period', {
  params: { clientId: selectedClient, startDate, endDate },
});
      setEntries(res.data.data || []);
      toast.success(`${res.data.data.length} lançamentos encontrados`);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erro ao carregar lançamentos');
      setEntries([]);
    } finally {
      setLoading(false);
    }
  }

  function exportToPDF() {
    if (entries.length === 0) {
      toast.error('Nenhum lançamento para exportar');
      return;
    }

    const client = clients.find(c => c.id === selectedClient);
    const doc = new jsPDF();
    
    // Cabeçalho do PDF
    doc.setFontSize(16);
    doc.setTextColor(13, 148, 136); // Teal da marca
    doc.text('Razão Analítico / Extrato Contábil', 14, 20);
    
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Cliente: ${client?.companyName || ''}`, 14, 28);
    doc.text(`Período: ${new Date(startDate).toLocaleDateString('pt-BR')} a ${new Date(endDate).toLocaleDateString('pt-BR')}`, 14, 34);

    // Prepara dados da tabela
    const tableData = entries.map(entry => {
      const account = entry.debitAccount || entry.creditAccount;
      const accountName = account ? `${account.code} - ${account.name}` : 'Conta não identificada';
      return [
        new Date(entry.entryDate).toLocaleDateString('pt-BR'),
        accountName,
        entry.description.substring(0, 50),
        entry.debitValue > 0 ? entry.debitValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : '',
        entry.creditValue > 0 ? entry.creditValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : '',
      ];
    });

    // Gera tabela
    autoTable(doc, {
      startY: 40,
      head: [['Data', 'Conta Contábil', 'Histórico', 'Débito', 'Crédito']],
      body: tableData,
      theme: 'striped',
      headStyles: { fillColor: [13, 148, 136], textColor: 255 },
      styles: { fontSize: 8, cellPadding: 2 },
    });

    // Totais no rodapé
    const totalDebit = entries.reduce((sum, e) => sum + Number(e.debitValue), 0);
    const totalCredit = entries.reduce((sum, e) => sum + Number(e.creditValue), 0);
    const finalY = (doc as any).lastAutoTable.finalY + 10;
    
    doc.setFontSize(10);
    doc.setFont(undefined, 'bold');
    doc.text(`Total Débito: R$ ${totalDebit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 14, finalY);
    doc.text(`Total Crédito: R$ ${totalCredit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 100, finalY);
    doc.text(`Saldo: R$ ${(totalCredit - totalDebit).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 160, finalY);

    doc.save(`razao-analitico_${client?.companyName.replace(/\s+/g, '_')}.pdf`);
    toast.success('PDF exportado com sucesso!');
  }

  // Filtragem local na tabela
  const filteredEntries = entries.filter(entry =>
    entry.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    entry.debitAccount?.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    entry.creditAccount?.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalDebit = entries.reduce((sum, e) => sum + Number(e.debitValue), 0);
  const totalCredit = entries.reduce((sum, e) => sum + Number(e.creditValue), 0);
  const balance = totalCredit - totalDebit;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
          <BookOpen className="h-8 w-8 text-teal-600" />
          Extrato Contábil / Razão Analítico
        </h1>
        <p className="text-slate-600 mt-1">
          Consulte, filtre e exporte os lançamentos contábeis consolidados do cliente.
        </p>
      </div>

      {/* Filtros de Busca */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Cliente *</label>
            <select
              value={selectedClient}
              onChange={(e) => setSelectedClient(e.target.value)}
              className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 bg-white"
            >
              <option value="">Selecione um cliente...</option>
              {clients.map(client => (
                <option key={client.id} value={client.id}>{client.companyName}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Data Inicial *</label>
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Data Final *</label>
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500" />
          </div>
          <div className="flex items-end">
            <button onClick={loadEntries} disabled={loading || !selectedClient}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50">
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Search className="h-5 w-5" />}
              Buscar Lançamentos
            </button>
          </div>
        </div>
      </div>

      {/* KPIs do Período */}
      {entries.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-red-100 rounded-lg"><TrendingDown className="h-6 w-6 text-red-600" /></div>
              <div>
                <p className="text-sm font-semibold text-slate-600">Total Débitos</p>
                <p className="text-2xl font-bold text-red-600">R$ {totalDebit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-emerald-100 rounded-lg"><TrendingUp className="h-6 w-6 text-emerald-600" /></div>
              <div>
                <p className="text-sm font-semibold text-slate-600">Total Créditos</p>
                <p className="text-2xl font-bold text-emerald-600">R$ {totalCredit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
            <div className="flex items-center gap-3">
              <div className={`p-3 rounded-lg ${balance >= 0 ? 'bg-teal-100' : 'bg-orange-100'}`}>
                <DollarSign className={`h-6 w-6 ${balance >= 0 ? 'text-teal-600' : 'text-orange-600'}`} />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-600">Saldo do Período</p>
                <p className={`text-2xl font-bold ${balance >= 0 ? 'text-teal-600' : 'text-orange-600'}`}>
                  R$ {Math.abs(balance).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} {balance >= 0 ? '(C)' : '(D)'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tabela de Lançamentos e Exportação */}
      {entries.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between flex-wrap gap-4">
            <h3 className="font-bold text-slate-900 flex items-center gap-2">
              <FileText className="h-5 w-5 text-teal-600" />
              Lançamentos Contábeis ({entries.length})
            </h3>
            <div className="flex gap-3">
              <input type="text" placeholder="Buscar por conta ou histórico..." value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500" />
              <button onClick={exportToPDF}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-colors">
                <FileText className="h-4 w-4" /> Imprimir PDF
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-bold text-slate-600 uppercase">Data</th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-slate-600 uppercase">Conta Contábil</th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-slate-600 uppercase">Histórico</th>
                  <th className="text-right px-4 py-3 text-xs font-bold text-slate-600 uppercase">Débito</th>
                  <th className="text-right px-4 py-3 text-xs font-bold text-slate-600 uppercase">Crédito</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredEntries.map((entry) => {
                  const account = entry.debitAccount || entry.creditAccount;
                  const accountName = account ? `${account.code} - ${account.name}` : 'Conta não identificada';
                  return (
                    <tr key={entry.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 text-sm text-slate-900">{new Date(entry.entryDate).toLocaleDateString('pt-BR')}</td>
                      <td className="px-4 py-3 text-sm font-medium text-slate-700">{accountName}</td>
                      <td className="px-4 py-3 text-sm text-slate-600 max-w-md truncate">{entry.description}</td>
                      <td className="px-4 py-3 text-sm text-red-600 text-right font-medium">
                        {entry.debitValue > 0 ? entry.debitValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-emerald-600 text-right font-medium">
                        {entry.creditValue > 0 ? entry.creditValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : '-'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Estado Vazio */}
      {entries.length === 0 && !loading && selectedClient && (
        <div className="text-center py-16 bg-white rounded-xl border border-dashed border-slate-300">
          <BookOpen className="h-12 w-12 mx-auto mb-3 text-slate-300" />
          <p className="text-slate-500 font-medium">Nenhum lançamento encontrado para este período.</p>
          <p className="text-sm text-slate-400 mt-1">Importe o extrato na aba "Integração SCI" ou o balancete na aba "Ciclo Contábil".</p>
        </div>
      )}
    </div>
  );
}