// =================================================================
// INÍCIO: frontend/src/app/dashboard/funcionario-digital/cobranca/page.tsx
// =================================================================
'use client';

import { useEffect, useState, useRef } from 'react';
import api from '@/lib/axios';
import { toast } from 'sonner';
import {
  Landmark, Loader2, Plus, Trash2, Download, Send, CheckCircle2,
  Upload, FileText, Calendar, RefreshCw, Power, XCircle,
  HelpCircle, // 🆕 Adicionado para o botão de ajuda
} from 'lucide-react';
import CobrancaHelpModal from '@/components/cobranca/CobrancaHelpModal'; // 🆕 Import do modal

// ============================================================================
// TIPOS
// ============================================================================
interface BillingInstruction {
  id: string;
  clientName: string;
  document: string | null;
  amount: number;
  dueDate: string;
  ourNumber: string;
  status: string;
  effectiveStatus: string;
  client: { id: string; companyName: string } | null;
}

interface CnabArquivo {
  id: string;
  tipo: 'REMESSA' | 'RETORNO';
  formato: string;
  banco: string;
  sequencial: number;
  status: string;
  nomeArquivo: string | null;
  tamanhoBytes: number | null;
  dataGeracao: string;
  _count?: { movimentos: number };
}

interface CnabMovimento {
  id: string;
  nossoNumero: string;
  numeroDocumento: string;
  dataOcorrencia: string;
  codigoMovimento: string;
  descricaoMovimento: string;
  valorTitulo: number;
  valorPago: number;
  tarifa: number;
  dataCredito: string | null;
  aplicado: boolean;
  observacao: string | null;
}

interface CobrancaRegra {
  id: string;
  nome: string;
  diasAposVencimento: number;
  canal: string;
  templateMensagem: string;
  requerAprovacao: boolean;
  ordem: number;
  ativa: boolean;
}

interface CobrancaEvento {
  id: string;
  canal: string;
  mensagemEnviada: string;
  status: string;
  valorDevido: number;
  dataVencimento: string;
  createdAt: string;
  motivoRejeicao: string | null;
  regra: { nome: string } | null;
  destinatario: string | null;
  client: { companyName: string; contactEmail: string | null; contactPhone: string | null } | null;
}

interface ClientOption {
  id: string;
  name: string;
  cnpj: string | null;
  fee: number | null;
}

// ============================================================================
// CONSTANTES + HELPERS
// ============================================================================
const STATUS_CFG: Record<string, { label: string; cls: string }> = {
  PENDENTE: { label: '🟡 Pendente', cls: 'bg-amber-100 text-amber-800' },
  VENCIDA:  { label: '🔴 Vencida',  cls: 'bg-red-100 text-red-800' },
  GERADA:   { label: '🔵 Gerada',   cls: 'bg-blue-100 text-blue-800' },
  ENVIADA:  { label: '🟣 Enviada',  cls: 'bg-purple-100 text-purple-800' },
  PAGA:     { label: '🟢 Paga',     cls: 'bg-green-100 text-green-800' },
};

const EVENTO_STATUS_CFG: Record<string, { label: string; cls: string }> = {
  AGUARDANDO_APROVACAO: { label: '⏳ Aguardando aprovação', cls: 'bg-amber-100 text-amber-800' },
  APROVADO: { label: '✅ Aprovado', cls: 'bg-blue-100 text-blue-800' },
  ENVIADO:  { label: '📨 Enviado',  cls: 'bg-green-100 text-green-800' },
  REJEITADO:{ label: '❌ Rejeitado', cls: 'bg-red-100 text-red-800' },
  FALHOU:   { label: '⚠️ Falhou',   cls: 'bg-red-100 text-red-800' },
};

const brl = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const brDate = (d: string) => new Date(d).toLocaleDateString('pt-BR');

// ============================================================================
// COMPONENTE AUXILIAR: TabButton (Definido ANTES do uso para evitar ReferenceError)
// ============================================================================
function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick}
      className={`px-4 py-2.5 text-sm font-semibold transition-colors ${active ? 'text-teal-600 border-b-2 border-teal-600' : 'text-slate-500 hover:text-slate-700'}`}>
      {children}
    </button>
  );
}

// ============================================================================
// COMPONENTE PRINCIPAL (abas)
// ============================================================================
export default function CobrancaPage() {
  const [tab, setTab] = useState<'cobrancas' | 'remessas' | 'retornos' | 'regua'>('cobrancas');
  const [showHelp, setShowHelp] = useState(false); // 🆕 Estado do modal de ajuda

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      {/* 🆕 HEADER COM BOTÃO "O QUE É ISSO?" */}
      <div>
        <div className="flex items-center gap-3">
          <Landmark className="h-8 w-8 text-teal-600" />
          <h1 className="text-3xl font-bold text-slate-900">Cobrança & CNAB</h1>
          <button
            onClick={() => setShowHelp(true)}
            className="p-2 text-slate-400 hover:text-teal-600 transition-colors"
            title="O que é isso?"
          >
            <HelpCircle className="h-5 w-5" />
          </button>
        </div>
        <p className="text-slate-600 mt-1">Régua de cobrança + remessa/retorno CNAB 240/400 (FD-5, ADR-084).</p>
      </div>

      <div className="flex gap-1 border-b border-slate-200">
        <TabButton active={tab === 'cobrancas'} onClick={() => setTab('cobrancas')}>💰 Cobranças</TabButton>
        <TabButton active={tab === 'remessas'} onClick={() => setTab('remessas')}>🏦 Remessas</TabButton>
        <TabButton active={tab === 'retornos'} onClick={() => setTab('retornos')}>📥 Retornos</TabButton>
        <TabButton active={tab === 'regua'} onClick={() => setTab('regua')}>📧 Régua</TabButton>
      </div>

      {tab === 'cobrancas' && <CobrancasTab />}
      {tab === 'remessas' && <RemessasTab />}
      {tab === 'retornos' && <RetornosTab />}
      {tab === 'regua' && <ReguaTab />}

      {/* 🆕 MODAL DE AJUDA (renderizado no final do componente) */}
      <CobrancaHelpModal isOpen={showHelp} onClose={() => setShowHelp(false)} />
    </div>
  );
}

// ============================================================================
// ABA 1: COBRANÇAS (CRUD + seletor de cliente + coluna Vínculo)
// ============================================================================
function CobrancasTab() {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<BillingInstruction[]>([]);
  const [clients, setClients] = useState<ClientOption[]>([]);
  const [form, setForm] = useState({ clientName: '', document: '', amount: '', dueDate: '', clientId: '' });

  async function load() {
    try {
      setLoading(true);
      const res = await api.get('/billing');
      setItems(res.data);
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Erro ao carregar cobranças.');
    } finally { setLoading(false); }
  }

  async function loadClients() {
    try {
      const res = await api.get('/clients');
      const list = Array.isArray(res.data) ? res.data : (res.data?.data ?? []);
      setClients(list.map((c: any) => ({
        id: c.id,
        name: c.companyName,
        cnpj: c.cnpj ?? null,
        fee: c.monthlyFee ?? null,
      })));
    } catch { /* seletor opcional — falha silenciosa */ }
  }

  useEffect(() => { load(); loadClients(); }, []);

  async function add() {
    if (!form.clientName || !form.amount || !form.dueDate) {
      toast.error('Preencha cliente, valor e vencimento.');
      return;
    }
    try {
      await api.post('/billing', {
        clientName: form.clientName,
        document: form.document || null,
        amount: Number(form.amount),
        dueDate: form.dueDate,
        clientId: form.clientId || null,
      });
      setForm({ clientName: '', document: '', amount: '', dueDate: '', clientId: '' });
      toast.success('Cobrança criada!');
      load();
    } catch (e: any) { toast.error(e.response?.data?.message || 'Erro ao criar.'); }
  }

  async function setStatus(id: string, status: 'ENVIADA' | 'PAGA') {
    await api.patch(`/billing/${id}/status`, { status });
    toast.success(`Marcada como ${status}`);
    load();
  }

  async function remove(id: string) {
    if (!confirm('Excluir cobrança?')) return;
    await api.delete(`/billing/${id}`);
    toast.success('Cobrança excluída.');
    load();
  }

  async function linkClient(billingId: string, clientId: string) {
    try {
      await api.patch(`/billing/${billingId}/client`, { clientId: clientId || null });
      toast.success(clientId ? 'Cliente vinculado!' : 'Vínculo removido.');
      load();
    } catch (e: any) { toast.error(e.response?.data?.message || 'Erro ao vincular.'); }
  }

  const kpi = {
    pend: items.filter((i) => i.effectiveStatus === 'PENDENTE' || i.effectiveStatus === 'VENCIDA'),
    paid: items.filter((i) => i.effectiveStatus === 'PAGA'),
  };
  const sum = (arr: BillingInstruction[]) => arr.reduce((s, i) => s + Number(i.amount), 0);

  if (loading) return <Loader />;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <KPICard title="A vencer / vencidas" value={kpi.pend.length} subtitle={`${brl(sum(kpi.pend))} em aberto`} color="amber" />
        <KPICard title="Em trânsito" value={items.length - kpi.pend.length - kpi.paid.length} subtitle="aguardando retorno do banco" color="blue" />
        <KPICard title="Recebidas" value={kpi.paid.length} subtitle={`${brl(sum(kpi.paid))} recebidos`} color="green" />
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
        <p className="font-bold text-slate-800 mb-3 flex items-center gap-2"><Plus className="h-4 w-4" /> Nova cobrança</p>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
          <input className="px-3 py-2 border border-slate-300 rounded-lg text-sm" placeholder="Cliente" value={form.clientName} onChange={(e) => setForm({ ...form, clientName: e.target.value })} />
          <input className="px-3 py-2 border border-slate-300 rounded-lg text-sm" placeholder="CNPJ/CPF" value={form.document} onChange={(e) => setForm({ ...form, document: e.target.value })} />
          <input type="number" step="0.01" className="px-3 py-2 border border-slate-300 rounded-lg text-sm" placeholder="Valor R$" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
          <input type="date" className="px-3 py-2 border border-slate-300 rounded-lg text-sm" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} />
          <select
            className="px-3 py-2 border border-slate-300 rounded-lg text-sm"
            value={form.clientId}
            onChange={(e) => {
              const id = e.target.value;
              const cli = clients.find((c) => c.id === id);
              setForm({
                ...form,
                clientId: id,
                clientName: cli ? cli.name : form.clientName,
                document: cli ? (cli.cnpj ?? '') : form.document,
                amount: cli && cli.fee != null ? String(cli.fee) : form.amount,
              });
            }}
          >
            <option value="">Cliente da casa (opcional)</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}{c.cnpj ? ` — ${c.cnpj}` : ''}
              </option>
            ))}
          </select>
        </div>
        <button onClick={add} className="mt-3 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-teal-600 text-white text-sm font-semibold hover:bg-teal-700">
          <Plus className="h-4 w-4" /> Adicionar à régua
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-600 text-xs uppercase">
            <tr>
              <th className="px-4 py-3 text-left">Cliente</th>
              <th className="px-4 py-3 text-left">Vencimento</th>
              <th className="px-4 py-3 text-right">Valor</th>
              <th className="px-4 py-3 text-left">Nosso nº</th>
              <th className="px-4 py-3 text-left">Vínculo</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {items.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-slate-400">Nenhuma cobrança na régua.</td></tr>
            )}
            {items.map((i) => {
              const cfg = STATUS_CFG[i.effectiveStatus] || STATUS_CFG.PENDENTE;
              return (
                <tr key={i.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-semibold text-slate-800">{i.clientName}</td>
                  <td className="px-4 py-3 text-slate-600">{brDate(i.dueDate)}</td>
                  <td className="px-4 py-3 text-right font-bold text-slate-900">{brl(Number(i.amount))}</td>
                  <td className="px-4 py-3 font-mono text-xs text-slate-500">{i.ourNumber}</td>
                  <td className="px-4 py-3">
                    {i.client ? (
                      <span className="text-xs font-bold px-2 py-1 rounded-full bg-teal-100 text-teal-800" title={i.client.companyName}>
                        🔗 {i.client.companyName.length > 18 ? i.client.companyName.slice(0, 18) + '…' : i.client.companyName}
                      </span>
                    ) : (
                      <select
                        defaultValue=""
                        onChange={(e) => linkClient(i.id, e.target.value)}
                        className="text-xs border border-slate-300 rounded-lg px-2 py-1 bg-white"
                        title="Vincular cliente da casa (define o destinatário dos envios)"
                      >
                        <option value="">— vincular —</option>
                        {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                    )}
                  </td>
                  <td className="px-4 py-3"><span className={`text-xs font-bold px-2 py-1 rounded-full ${cfg.cls}`}>{cfg.label}</span></td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      {i.effectiveStatus === 'GERADA' && (
                        <button title="Marcar ENVIADA ao banco" onClick={() => setStatus(i.id, 'ENVIADA')} className="p-1.5 text-slate-400 hover:text-purple-600"><Send className="h-4 w-4" /></button>
                      )}
                      {(i.effectiveStatus === 'ENVIADA' || i.effectiveStatus === 'VENCIDA' || i.effectiveStatus === 'PENDENTE') && (
                        <button title="Marcar PAGA" onClick={() => setStatus(i.id, 'PAGA')} className="p-1.5 text-slate-400 hover:text-green-600"><CheckCircle2 className="h-4 w-4" /></button>
                      )}
                      {i.status === 'PENDENTE' && (
                        <button title="Excluir" onClick={() => remove(i.id)} className="p-1.5 text-slate-400 hover:text-red-600"><Trash2 className="h-4 w-4" /></button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ============================================================================
// ABA 2: REMESSAS
// ============================================================================
function RemessasTab() {
  const [loading, setLoading] = useState(false);
  const [arquivos, setArquivos] = useState<CnabArquivo[]>([]);

  async function load() {
    try {
      const res = await api.get('/billing/arquivos');
      setArquivos(res.data.filter((a: CnabArquivo) => a.tipo === 'REMESSA'));
    } catch { toast.error('Erro ao carregar histórico.'); }
  }
  useEffect(() => { load(); }, []);

  async function generateCnab() {
    setLoading(true);
    try {
      const res = await api.post('/billing/generate-cnab');
      const { txt, count } = res.data;
      const blob = new Blob([txt], { type: 'text/plain' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `remessa_cnab240_${Date.now()}.rem`;
      a.click();
      toast.success(`Remessa gerada: ${count} boleto(s) → GERADA`);
      load();
    } catch (e: any) { toast.error(e.response?.data?.message || 'Sem PENDENTES p/ remessa.'); }
    finally { setLoading(false); }
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <h2 className="text-lg font-bold text-slate-800 mb-2">Gerar remessa CNAB 240</h2>
        <p className="text-sm text-slate-600 mb-4">Gera arquivo com todas as cobranças PENDENTES e baixa automaticamente (.rem).</p>
        <button onClick={generateCnab} disabled={loading}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-orange-600 hover:bg-orange-700 text-white font-semibold disabled:opacity-50">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
          {loading ? 'Gerando...' : 'Gerar e baixar remessa'}
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200"><h3 className="font-bold text-slate-800">Histórico de remessas</h3></div>
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-600 text-xs uppercase">
            <tr>
              <th className="px-4 py-3 text-left">Data</th>
              <th className="px-4 py-3 text-left">Banco</th>
              <th className="px-4 py-3 text-left">Sequencial</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-right">Tamanho</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {arquivos.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-400">Nenhuma remessa gerada ainda.</td></tr>
            )}
            {arquivos.map((a) => (
              <tr key={a.id} className="hover:bg-slate-50">
                <td className="px-4 py-3 text-slate-600">{brDate(a.dataGeracao)}</td>
                <td className="px-4 py-3 font-semibold text-slate-800 uppercase">{a.banco}</td>
                <td className="px-4 py-3 font-mono text-slate-600">#{a.sequencial}</td>
                <td className="px-4 py-3"><span className="text-xs font-bold px-2 py-1 rounded-full bg-blue-100 text-blue-800">{a.status}</span></td>
                <td className="px-4 py-3 text-right text-slate-600">{a.tamanhoBytes?.toLocaleString()} bytes</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ============================================================================
// ABA 3: RETORNOS
// ============================================================================
function RetornosTab() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [arquivos, setArquivos] = useState<CnabArquivo[]>([]);
  const [movimentos, setMovimentos] = useState<CnabMovimento[]>([]);
  const [selectedArquivo, setSelectedArquivo] = useState<string | null>(null);

  async function load() {
    try {
      const res = await api.get('/billing/arquivos');
      setArquivos(res.data.filter((a: CnabArquivo) => a.tipo === 'RETORNO'));
    } catch { toast.error('Erro ao carregar histórico.'); }
  }
  useEffect(() => { load(); }, []);

  async function uploadRetorno(file: File) {
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('formato', 'CNAB_240');
      formData.append('banco', 'bb');
      const res = await api.post('/billing/retorno/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast.success(`Retorno processado: ${res.data.totalMovimentos} movimento(s)`);
      load();
    } catch (e: any) { toast.error(e.response?.data?.message || 'Erro ao processar retorno.'); }
    finally {
      setLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  async function loadMovimentos(arquivoId: string) {
    try {
      const res = await api.get(`/billing/arquivos/${arquivoId}/movimentos`);
      setMovimentos(res.data);
      setSelectedArquivo(arquivoId);
    } catch { toast.error('Erro ao carregar movimentos.'); }
  }

  async function processMovimento(movimentoId: string) {
    try {
      await api.post('/billing/movimento/process', { movimentoId });
      toast.success('Movimento aplicado (baixa automática).');
      if (selectedArquivo) loadMovimentos(selectedArquivo);
    } catch (e: any) { toast.error(e.response?.data?.message || 'Erro ao processar movimento.'); }
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <h2 className="text-lg font-bold text-slate-800 mb-2">Upload de retorno CNAB</h2>
        <p className="text-sm text-slate-600 mb-4">Envie o arquivo de retorno do banco (.txt/.ret) para processar pagamentos e baixas.</p>
        <input ref={fileInputRef} type="file" accept=".txt,.ret,.cnv" className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadRetorno(f); }} />
        <button onClick={() => fileInputRef.current?.click()} disabled={loading}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-semibold disabled:opacity-50">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
          {loading ? 'Processando...' : 'Selecionar arquivo de retorno'}
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200"><h3 className="font-bold text-slate-800">Histórico de retornos</h3></div>
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-600 text-xs uppercase">
            <tr>
              <th className="px-4 py-3 text-left">Data</th>
              <th className="px-4 py-3 text-left">Banco</th>
              <th className="px-4 py-3 text-left">Sequencial</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-right">Movimentos</th>
              <th className="px-4 py-3 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {arquivos.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-400">Nenhum retorno processado ainda.</td></tr>
            )}
            {arquivos.map((a) => (
              <tr key={a.id} className="hover:bg-slate-50">
                <td className="px-4 py-3 text-slate-600">{brDate(a.dataGeracao)}</td>
                <td className="px-4 py-3 font-semibold text-slate-800 uppercase">{a.banco}</td>
                <td className="px-4 py-3 font-mono text-slate-600">#{a.sequencial}</td>
                <td className="px-4 py-3"><span className="text-xs font-bold px-2 py-1 rounded-full bg-green-100 text-green-800">{a.status}</span></td>
                <td className="px-4 py-3 text-right text-slate-600">{a._count?.movimentos ?? '-'}</td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => loadMovimentos(a.id)} className="p-1.5 text-slate-400 hover:text-teal-600" title="Ver movimentos">
                    <FileText className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedArquivo && movimentos.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200">
            <h3 className="font-bold text-slate-800">Movimentos do retorno #{arquivos.find((a) => a.id === selectedArquivo)?.sequencial}</h3>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-600 text-xs uppercase">
              <tr>
                <th className="px-4 py-3 text-left">Nosso nº</th>
                <th className="px-4 py-3 text-left">Documento</th>
                <th className="px-4 py-3 text-left">Ocorrência</th>
                <th className="px-4 py-3 text-left">Movimento</th>
                <th className="px-4 py-3 text-right">Valor pago</th>
                <th className="px-4 py-3 text-right">Tarifa</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {movimentos.map((m) => (
                <tr key={m.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-mono text-xs text-slate-600">{m.nossoNumero}</td>
                  <td className="px-4 py-3 text-slate-800">{m.numeroDocumento}</td>
                  <td className="px-4 py-3 text-slate-600">{brDate(m.dataOcorrencia)}</td>
                  <td className="px-4 py-3 text-xs font-semibold text-slate-700">{m.descricaoMovimento}</td>
                  <td className="px-4 py-3 text-right font-bold text-green-700">{brl(m.valorPago)}</td>
                  <td className="px-4 py-3 text-right text-slate-500">{brl(m.tarifa)}</td>
                  <td className="px-4 py-3 text-center">
                    {m.aplicado
                      ? <span className="text-xs font-bold px-2 py-1 rounded-full bg-green-100 text-green-800">✅ Aplicado</span>
                      : <span className="text-xs font-bold px-2 py-1 rounded-full bg-amber-100 text-amber-800">⏳ Pendente</span>}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {!m.aplicado && (
                      <button onClick={() => processMovimento(m.id)} className="p-1.5 text-slate-400 hover:text-teal-600" title="Aplicar baixa">
                        <CheckCircle2 className="h-4 w-4" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// ABA 4: RÉGUA (regras + eventos c/ coluna Destinatário + override ✏️)
// ============================================================================
function ReguaTab() {
  const [regras, setRegras] = useState<CobrancaRegra[]>([]);
  const [eventos, setEventos] = useState<CobrancaEvento[]>([]);
  const [loading, setLoading] = useState(true);
  const [executing, setExecuting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    nome: '', dias: '1', canal: 'EMAIL',
    template: 'Olá {nome}, identificamos o vencimento de {valor} em {vencimento}. Pode verificar?',
    requerAprovacao: true,
  });

  async function load() {
    try {
      setLoading(true);
      const [r, e] = await Promise.all([
        api.get('/billing/regras'),
        api.get('/billing/eventos'),
      ]);
      setRegras(r.data);
      setEventos(e.data);
    } catch { toast.error('Erro ao carregar a régua.'); }
    finally { setLoading(false); }
  }
  useEffect(() => { load(); }, []);

  async function criarRegra() {
    if (!form.nome.trim()) { toast.error('Nome da regra obrigatório.'); return; }
    try {
      await api.post('/billing/regras', {
        nome: form.nome,
        diasAposVencimento: Number(form.dias),
        canal: form.canal,
        templateMensagem: form.template,
        requerAprovacao: form.requerAprovacao,
      });
      toast.success('Regra criada!');
      setShowForm(false);
      setForm({ ...form, nome: '' });
      load();
    } catch (e: any) { toast.error(e.response?.data?.message || 'Erro ao criar regra.'); }
  }

  async function toggleRegra(id: string) {
    await api.patch(`/billing/regras/${id}/toggle`);
    load();
  }

  async function executarRegua() {
    setExecuting(true);
    try {
      const res = await api.post('/billing/executar-regua');
      toast.success(`Régua executada: ${res.data.eventosCriados} evento(s) criado(s).`);
      load();
    } catch (e: any) { toast.error(e.response?.data?.message || 'Erro ao executar a régua.'); }
    finally { setExecuting(false); }
  }

  async function aprovar(id: string, enviarDepois: boolean) {
    try {
      await api.post(`/billing/eventos/${id}/aprovar`, { aprovado: true });
      if (enviarDepois) {
        await api.post(`/billing/eventos/${id}/enviar`);
        toast.success('Evento aprovado e enviado!');
      } else toast.success('Evento aprovado!');
      load();
    } catch (e: any) { toast.error(e.response?.data?.message || 'Erro ao aprovar.'); }
  }

  async function rejeitar(id: string) {
    const motivo = window.prompt('Motivo da rejeição (obrigatório):');
    if (motivo === null) return;
    if (!motivo.trim()) { toast.error('Motivo é obrigatório p/ rejeitar.'); return; }
    try {
      await api.post(`/billing/eventos/${id}/aprovar`, { aprovado: false, motivoRejeicao: motivo });
      toast.success('Evento rejeitado.');
      load();
    } catch (e: any) { toast.error(e.response?.data?.message || 'Erro ao rejeitar.'); }
  }

  async function enviar(id: string) {
    try {
      await api.post(`/billing/eventos/${id}/enviar`);
      toast.success('Evento enviado!');
      load();
    } catch (e: any) { toast.error(e.response?.data?.message || 'Erro ao enviar.'); }
  }

  async function setDestinatario(ev: CobrancaEvento) {
    const resolved =
      ev.destinatario ??
      (ev.canal === 'EMAIL' ? ev.client?.contactEmail : ev.client?.contactPhone) ??
      '';
    const novo = window.prompt('Destinatário (email ou telefone):', resolved);
    if (novo === null || !novo.trim()) return;
    try {
      await api.patch(`/billing/eventos/${ev.id}/destinatario`, { destinatario: novo });
      toast.success('Destinatário atualizado!');
      load();
    } catch (e: any) { toast.error(e.response?.data?.message || 'Erro ao atualizar destinatário.'); }
  }

  if (loading) return <Loader />;
  const pendentes = eventos.filter((e) => e.status === 'AGUARDANDO_APROVACAO');

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-800">Régua de cobrança automática</h2>
          <p className="text-sm text-slate-600">Cria eventos p/ cobranças vencidas conforme as regras. Nada sai sem aprovação humana (ADR-084).</p>
        </div>
        <button onClick={executarRegua} disabled={executing}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-semibold disabled:opacity-50">
          {executing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          {executing ? 'Executando...' : 'Executar régua agora'}
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
          <h3 className="font-bold text-slate-800">Regras da régua</h3>
          <button onClick={() => setShowForm(!showForm)} className="inline-flex items-center gap-1 text-sm font-semibold text-teal-600 hover:text-teal-700">
            <Plus className="h-4 w-4" /> Nova regra
          </button>
        </div>

        {showForm && (
          <div className="p-5 bg-teal-50/50 border-b border-slate-200 space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
              <input className="px-3 py-2 border border-slate-300 rounded-lg text-sm" placeholder="Nome (ex: Lembrete +3 dias)" value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} />
              <input type="number" min={0} className="px-3 py-2 border border-slate-300 rounded-lg text-sm" placeholder="Dias após vencimento" value={form.dias} onChange={(e) => setForm({ ...form, dias: e.target.value })} />
              <select className="px-3 py-2 border border-slate-300 rounded-lg text-sm" value={form.canal} onChange={(e) => setForm({ ...form, canal: e.target.value })}>
                <option value="EMAIL">📧 E-mail</option>
                <option value="WHATSAPP">💬 WhatsApp</option>
                <option value="SMS">📱 SMS</option>
              </select>
              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input type="checkbox" checked={form.requerAprovacao} onChange={(e) => setForm({ ...form, requerAprovacao: e.target.checked })} />
                Exigir aprovação humana
              </label>
            </div>
            <textarea className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" rows={2} placeholder="Template c/ {nome}, {valor}, {vencimento}" value={form.template} onChange={(e) => setForm({ ...form, template: e.target.value })} />
            <button onClick={criarRegra} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-teal-600 text-white text-sm font-semibold hover:bg-teal-700">
              <Plus className="h-4 w-4" /> Salvar regra
            </button>
          </div>
        )}

        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-600 text-xs uppercase">
            <tr>
              <th className="px-4 py-3 text-left">Regra</th>
              <th className="px-4 py-3 text-left">Dispara após</th>
              <th className="px-4 py-3 text-left">Canal</th>
              <th className="px-4 py-3 text-left">Aprovação</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {regras.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-400">Nenhuma regra cadastrada.</td></tr>
            )}
            {regras.map((r) => (
              <tr key={r.id} className="hover:bg-slate-50">
                <td className="px-4 py-3 font-semibold text-slate-800">{r.nome}</td>
                <td className="px-4 py-3 text-slate-600">{r.diasAposVencimento} dia(s)</td>
                <td className="px-4 py-3 text-slate-600">{r.canal}</td>
                <td className="px-4 py-3">{r.requerAprovacao ? '🧑‍⚖️ Humana' : '🤖 Automática'}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs font-bold px-2 py-1 rounded-full ${r.ativa ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-slate-500'}`}>
                    {r.ativa ? 'Ativa' : 'Inativa'}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => toggleRegra(r.id)} title={r.ativa ? 'Desativar' : 'Ativar'} className="p-1.5 text-slate-400 hover:text-teal-600">
                    <Power className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200">
          <h3 className="font-bold text-slate-800">
            Eventos de cobrança
            {pendentes.length > 0 && (
              <span className="ml-2 text-xs font-bold px-2 py-1 rounded-full bg-amber-100 text-amber-800">{pendentes.length} pendente(s)</span>
            )}
          </h3>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-600 text-xs uppercase">
            <tr>
              <th className="px-4 py-3 text-left">Criado em</th>
              <th className="px-4 py-3 text-left">Regra</th>
              <th className="px-4 py-3 text-left">Canal</th>
              <th className="px-4 py-3 text-left">Destinatário</th>
              <th className="px-4 py-3 text-right">Valor</th>
              <th className="px-4 py-3 text-left">Mensagem</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {eventos.length === 0 && (
              <tr><td colSpan={8} className="px-4 py-8 text-center text-slate-400">Nenhum evento ainda. Clique em "Executar régua agora".</td></tr>
            )}
            {eventos.map((ev) => {
              const cfg = EVENTO_STATUS_CFG[ev.status] || EVENTO_STATUS_CFG.AGUARDANDO_APROVACAO;
              const resolved =
                ev.destinatario ??
                (ev.canal === 'EMAIL' ? ev.client?.contactEmail : ev.client?.contactPhone) ??
                null;
              const canEdit = ev.status === 'AGUARDANDO_APROVACAO' || ev.status === 'APROVADO';
              return (
                <tr key={ev.id} className="hover:bg-slate-50 align-top">
                  <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{brDate(ev.createdAt)}</td>
                  <td className="px-4 py-3 font-semibold text-slate-800">{ev.regra?.nome ?? '—'}</td>
                  <td className="px-4 py-3 text-slate-600">{ev.canal}</td>
                  <td className="px-4 py-3 text-slate-600">
                    <span className="inline-flex items-center gap-1">
                      {resolved ?? <span className="text-slate-400 text-xs">— (modo log)</span>}
                      {canEdit && (
                        <button
                          title="Editar destinatário"
                          onClick={() => setDestinatario(ev)}
                          className="p-1 text-slate-400 hover:text-teal-600"
                        >
                          ✏️
                        </button>
                      )}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-bold text-slate-900">{brl(Number(ev.valorDevido))}</td>
                  <td className="px-4 py-3 text-slate-600 max-w-xs">
                    <span title={ev.mensagemEnviada}>{ev.mensagemEnviada.slice(0, 80)}{ev.mensagemEnviada.length > 80 ? '…' : ''}</span>
                  </td>
                  <td className="px-4 py-3"><span className={`text-xs font-bold px-2 py-1 rounded-full ${cfg.cls}`}>{cfg.label}</span></td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      {ev.status === 'AGUARDANDO_APROVACAO' && (
                        <>
                          <button title="Aprovar" onClick={() => aprovar(ev.id, false)} className="p-1.5 text-slate-400 hover:text-green-600"><CheckCircle2 className="h-4 w-4" /></button>
                          <button title="Aprovar e enviar" onClick={() => aprovar(ev.id, true)} className="p-1.5 text-slate-400 hover:text-teal-600"><Send className="h-4 w-4" /></button>
                          <button title="Rejeitar" onClick={() => rejeitar(ev.id)} className="p-1.5 text-slate-400 hover:text-red-600"><XCircle className="h-4 w-4" /></button>
                        </>
                      )}
                      {ev.status === 'APROVADO' && (
                        <button title="Enviar" onClick={() => enviar(ev.id)} className="p-1.5 text-slate-400 hover:text-teal-600"><Send className="h-4 w-4" /></button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ============================================================================
// HELPERS VISUAIS
// ============================================================================
function KPICard({ title, value, subtitle, color }: { title: string; value: number; subtitle: string; color: 'amber' | 'blue' | 'green' }) {
  const colors = { amber: 'text-amber-700', blue: 'text-blue-700', green: 'text-green-700' };
  return (
    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
      <p className="text-xs font-semibold text-slate-500 uppercase">{title}</p>
      <p className={`text-2xl font-bold ${colors[color]}`}>{value}</p>
      <p className="text-xs text-slate-500">{subtitle}</p>
    </div>
  );
}

function Loader() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh]">
      <Loader2 className="h-12 w-12 text-teal-600 animate-spin mb-4" />
      <p className="text-slate-600">Carregando...</p>
    </div>
  );
}
// =================================================================
// FIM: frontend/src/app/dashboard/funcionario-digital/cobranca/page.tsx
// =================================================================