'use client';

import { useState, useEffect, useRef } from 'react';
import api from '@/lib/axios';
import { toast } from 'sonner';
import {
  Calculator, Users, Database, Landmark, RefreshCw, Download,
  Upload, Loader2, CheckCircle2, ChevronDown, Search, FileText,
} from 'lucide-react';

interface Client { id: string; companyName: string; cnpj?: string; accountingPlan?: string | null }
interface Summary { baseCount: number; pendingCount: number; reconciledCount: number }

// 🆕 Quadro de formato aceito/gerado (documentação viva na tela)
function FormatHint({ title, lines }: { title: string; lines: string[] }) {
  return (
    <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-[10px] text-slate-600 space-y-1">
      <p className="font-bold text-slate-700">{title}</p>
      {lines.map((l, i) => (
        <p key={i} className="font-mono whitespace-pre-wrap break-all">{l}</p>
      ))}
    </div>
  );
}
export default function ContabilPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [clientSearch, setClientSearch] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [plans, setPlans] = useState<string[]>([]); // 🆕 ADR-072
  const baseInputRef = useRef<HTMLInputElement>(null);
  const statementInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { loadClients(); }, []);
  useEffect(() => { if (selectedClient) loadSummary(); }, [selectedClient]);

   async function loadClients() {
    try {
      const [res, accRes] = await Promise.all([
        api.get('/clients'),
        api.get('/accounting/plans').catch(() => ({ data: { data: [] } })),
      ]);
      setClients(res.data.data || []);
      setPlans(accRes.data.data || []);
    } catch { toast.error('Erro ao carregar clientes'); }
  }

  async function loadSummary() {
    if (!selectedClient) return;
    try {
      const res = await api.get(`/accounting/history/summary?clientId=${selectedClient.id}`);
      setSummary(res.data.data);
    } catch { setSummary(null); }
  }

  const filteredClients = clients.filter((c) =>
    c.companyName.toLowerCase().includes(clientSearch.toLowerCase()),
  );

  async function readFile(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsText(file, 'UTF-8');
    });
  }

  // 📥 Passo 1: Base histórica 2025
  async function handleImportBase(file: File) {
    setBusy('base');
    try {
      const content = await readFile(file);
      const res = await api.post('/accounting/history/import-base', {
        clientId: selectedClient!.id, year: 2025, content,
      });
      toast.success(`Base histórica importada: ${res.data.data.imported} lançamentos!`);
      loadSummary();
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Erro ao importar base');
    } finally { setBusy(null); }
  }

  // 🏦 Passo 2: Extrato do mês
  async function handleImportStatement(file: File) {
    setBusy('statement');
    try {
      const content = await readFile(file);
      const res = await api.post('/accounting/history/import-statement', {
        clientId: selectedClient!.id, content,
      });
      toast.success(`Extrato importado: ${res.data.data.imported} lançamentos PENDENTES!`);
      loadSummary();
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Erro ao importar extrato');
    } finally { setBusy(null); }
  }

  // 🤖 Passo 3: Conciliar
  async function handleReconcile() {
    setBusy('reconcile');
    try {
      const res = await api.post('/accounting/history/reconcile', { clientId: selectedClient!.id });
      const d = res.data.data;
      toast.success(`Conciliação: ${d.matched} de ${d.total} lançamentos conciliados!`);
      if (d.notMatched > 0) toast.info(`${d.notMatched} pendentes → use a Revisão (Tela 2)`);
      loadSummary();
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Erro ao conciliar');
    } finally { setBusy(null); }
  }

  // 📤 Passo 4: Exportar TXT p/ SCI
  async function handleExport() {
    setBusy('export');
    try {
      const res = await api.post('/accounting/history/export-sci', { clientId: selectedClient!.id });
      const { fileName, content, totalLines } = res.data.data;
      const blob = new Blob(['\uFEFF' + content], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = fileName; a.click();
      URL.revokeObjectURL(url);
      toast.success(`TXT gerado com ${totalLines} lançamentos!`);
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Nada para exportar');
    } finally { setBusy(null); }
  }
  // 🆕 ADR-072: vincula/troca o plano do cliente — grava PERMANENTE no cadastro
  async function handlePlanChange(e: React.ChangeEvent<HTMLSelectElement>) {
    if (!selectedClient) return;
    const planName = e.target.value || null;
    try {
      const res = await api.put('/accounting/client-plan', { clientId: selectedClient.id, planName });
      setSelectedClient({ ...selectedClient, accountingPlan: res.data.data.accountingPlan });
      toast.success(
        res.data.data.accountingPlan
          ? `Plano ${res.data.data.accountingPlan} vinculado ao cliente (permanente).`
          : 'Cliente voltou ao padrão do escritório.',
      );
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Erro ao vincular o plano.');
    }
  }
  const inputClass = 'w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-white';
  const btn = 'flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-semibold transition-colors disabled:opacity-50';

  return (
    <div className="space-y-6">
      {/* CABEÇALHO */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
          <Calculator className="h-8 w-8 text-teal-600" /> Integração Contábil SCI
        </h1>
        <p className="text-slate-600 mt-1">
          Importe extratos, concilie com a base histórica e exporte TXT pronto p/ SCI-Único
        </p>
      </div>

      {/* SELETOR DE CLIENTE (30+ com busca) */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 relative">
        <label className="block text-sm font-semibold text-slate-700 mb-1.5 flex items-center gap-2">
          <Users className="h-4 w-4 text-teal-600" /> Cliente (perfil contábil)
        </label>
        <div className="relative">
          <Search className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
          <input
            className={`pl-10 ${inputClass}`}
            placeholder="Buscar cliente..."
            value={selectedClient ? selectedClient.companyName : clientSearch}
            onFocus={() => { setShowDropdown(true); setClientSearch(''); }}
            onChange={(e) => { setClientSearch(e.target.value); setSelectedClient(null); setShowDropdown(true); }}
          />
          <ChevronDown className="absolute right-3 top-3 h-5 w-5 text-slate-400" />
        </div>
        {showDropdown && (
          <div className="absolute z-20 mt-1 w-full max-w-md bg-white border border-slate-200 rounded-lg shadow-lg max-h-64 overflow-y-auto">
            {filteredClients.map((c) => (
              <button
                key={c.id}
                className="w-full text-left px-4 py-2.5 hover:bg-teal-50 text-sm"
                onClick={() => { setSelectedClient(c); setShowDropdown(false); }}
              >
                <span className="font-medium text-slate-900">{c.companyName}</span>
                <span className="text-xs text-slate-500 ml-2">{c.cnpj || ''}</span>
              </button>
            ))}
            {filteredClients.length === 0 && (
              <p className="px-4 py-3 text-sm text-slate-500">Nenhum cliente encontrado</p>
            )}
                  {/* 🆕 ADR-072: plano de contas do cliente — visível e trocável, mas permanente */}
      {selectedClient && (
        <div className="mt-3 flex items-center gap-3 flex-wrap">
          <span className="text-sm font-semibold text-slate-700">Plano de contas:</span>
          <select
            value={selectedClient.accountingPlan || ''}
            onChange={handlePlanChange}
            className="px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white"
          >
            <option value="">Padrão do escritório</option>
            {plans.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
          {selectedClient.accountingPlan ? (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-700">
              📒 ativo: {selectedClient.accountingPlan}
            </span>
          ) : (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-500">
              sem plano próprio
            </span>
          )}
        </div>
      )}
          </div>
        )}
      </div>

      {selectedClient && summary && (
        <>
          {/* STEPPER DE STATUS */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: 'Base Histórica', value: summary.baseCount, ok: summary.baseCount > 0 },
              { label: 'Pendentes', value: summary.pendingCount, ok: summary.pendingCount === 0 },
              { label: 'Conciliados', value: summary.reconciledCount, ok: summary.reconciledCount > 0 },
            ].map((s, i) => (
              <div key={i} className={`p-4 rounded-xl border text-center ${s.ok ? 'bg-teal-50 border-teal-200' : 'bg-slate-50 border-slate-200'}`}>
                <p className="text-2xl font-bold text-slate-900">{s.value}</p>
                <p className="text-xs font-semibold text-slate-600 uppercase">{s.label}</p>
              </div>
            ))}
            <div className="p-4 rounded-xl border bg-orange-50 border-orange-200 text-center">
              <p className="text-2xl font-bold text-orange-600">{summary.pendingCount === 0 && summary.reconciledCount > 0 ? '✔' : '…'}</p>
              <p className="text-xs font-semibold text-slate-600 uppercase">Pronto p/ Exportar</p>
            </div>
          </div>

          {/* CARDS DE AÇÃO */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* 1. BASE HISTÓRICA */}
            <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 space-y-3">
              <div className="flex items-center gap-2">
                <Database className="h-5 w-5 text-purple-600" />
                <h3 className="font-bold text-slate-900">1. Base Histórica 2025</h3>
              </div>
              <p className="text-xs text-slate-500">
                {summary.baseCount > 0
                  ? `✅ ${summary.baseCount} lançamentos na memória do cliente.`
                  : 'Importe o arquivo de lançamentos do ano anterior (SCI).'}
              </p>
                        <FormatHint
            title="📥 Aceita .csv ou .txt (PDF não) — 2 layouts:"
            lines={[
              'A) TXT SCI sem cabeçalho:',
              'data;contaDébito;contaCrédito;valor;histórico',
              '30/06/2026;03.2.1.01.011;01.1.1.02.026;300,00;PAGAMENTO PIX...',
              'B) Razão/Livro Caixa com cabeçalho:',
              'Conta;Data;Histórico;;Débito;Crédito;Saldo',
              '819 - 01.1.1.02.026 - Sicredi;15/05/2026;SOLANGE;;200,00;;200,00',
            ]}
          />
              <input ref={baseInputRef} type="file" accept=".csv,.txt" hidden
                onChange={(e) => e.target.files?.[0] && handleImportBase(e.target.files[0])} />
              <button className={`${btn} w-full bg-purple-600 hover:bg-purple-700 text-white`}
                disabled={busy === 'base'} onClick={() => baseInputRef.current?.click()}>
                {busy === 'base' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                {summary.baseCount > 0 ? 'Reimportar Base' : 'Importar Base'}
              </button>
            </div>

            {/* 2. EXTRATO DO MÊS */}
            <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 space-y-3">
              <div className="flex items-center gap-2">
                <Landmark className="h-5 w-5 text-blue-600" />
                <h3 className="font-bold text-slate-900">2. Extrato do Mês</h3>
              </div>
              <p className="text-xs text-slate-500">
                Importe o extrato bancário (CSV/TXT). Gera lançamentos PENDENTES.
              </p>
                        <FormatHint
            title="📥 Aceita .csv ou .txt (PDF não) — cabeçalho obrigatório:"
            lines={[
              'Data;Débito;Crédito;Complemento;CNPJ',
              '15/05/2026;200,00;;PAGAMENTO PIX 04200503964...;04200503964',
              'Data dd/mm/aaaa • valor c/ vírgula ou ponto',
              'Débito > 0 = saída • Crédito > 0 = entrada',
            ]}
          />
              <input ref={statementInputRef} type="file" accept=".csv,.txt" hidden
                onChange={(e) => e.target.files?.[0] && handleImportStatement(e.target.files[0])} />
              <button className={`${btn} w-full bg-blue-600 hover:bg-blue-700 text-white`}
                disabled={busy === 'statement'} onClick={() => statementInputRef.current?.click()}>
                {busy === 'statement' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                Importar Extrato
              </button>
            </div>

            {/* 3. CONCILIAR + EXPORTAR */}
            <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 space-y-3">
              <div className="flex items-center gap-2">
                <RefreshCw className="h-5 w-5 text-teal-600" />
                <h3 className="font-bold text-slate-900">3. Conciliar + Exportar</h3>
              </div>
              <button className={`${btn} w-full bg-teal-600 hover:bg-teal-700 text-white`}
                disabled={busy === 'reconcile' || summary.pendingCount === 0} onClick={handleReconcile}>
                {busy === 'reconcile' ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                Conciliar Automaticamente
              </button>
              <button className={`${btn} w-full bg-orange-500 hover:bg-orange-600 text-white`}
                disabled={busy === 'export' || summary.reconciledCount === 0} onClick={handleExport}>
                {busy === 'export' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                Exportar TXT p/ SCI
              </button>
                        <FormatHint
            title="📤 Gera .txt separador TAB (UTF-8 BOM):"
            lines={[
              'controle;data;contaDébito;contaCrédito;valor;;histórico',
              '000001\t20260720\t00000503\t00000819\t1500.00\t\tPAGAMENTO PIX...',
              'controle fixo 000001 • data AAAAMMDD',
              'contas c/ 8 dígitos • valor com PONTO (1500.00)',
            ]}
          />
            </div>
          </div>
        </>
      )}

      {!selectedClient && (
        <div className="text-center py-16 bg-white rounded-xl border border-dashed border-slate-300">
          <FileText className="h-12 w-12 mx-auto mb-3 text-slate-300" />
          <p className="text-slate-500">Selecione um cliente para iniciar o pipeline contábil</p>
        </div>
      )}
    </div>
  );
}