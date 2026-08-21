// =================================================================
// INÍCIO: frontend/src/app/dashboard/funcionario-digital/cobranca/page.tsx
// =================================================================
/**
 * 💰 Cobrança CNAB — FD-5
 * Régua de cobrança (PENDENTE→GERADA→ENVIADA→PAGA) + remessa CNAB 240.
 * KPIs da régua + tabela + nova cobrança + download da remessa.
 */
'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/axios';
import { toast } from 'sonner';
import { Landmark, Loader2, Plus, Trash2, Download, Send, CheckCircle2, RefreshCw } from 'lucide-react';

interface Instruction {
  id: string; clientName: string; document: string | null;
  amount: number; dueDate: string; ourNumber: string;
  status: string; effectiveStatus: string;
}

const STATUS_CFG: Record<string, { label: string; cls: string }> = {
  PENDENTE: { label: '🟡 Pendente', cls: 'bg-amber-100 text-amber-800' },
  VENCIDA:  { label: '🔴 Vencida', cls: 'bg-red-100 text-red-800' },
  GERADA:   { label: '🔵 Gerada', cls: 'bg-blue-100 text-blue-800' },
  ENVIADA:  { label: '🟣 Enviada', cls: 'bg-purple-100 text-purple-800' },
  PAGA:     { label: '🟢 Paga', cls: 'bg-green-100 text-green-800' },
};

const brl = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export default function CobrancaPage() {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<Instruction[]>([]);
  const [form, setForm] = useState({ clientName: '', document: '', amount: '', dueDate: '' });

  async function load() {
    try {
      setLoading(true);
      const res = await api.get('/digital-employee/billing');
      setItems(res.data.data);
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Erro ao carregar cobranças.');
    } finally { setLoading(false); }
  }
  useEffect(() => { load(); }, []);

  async function add() {
    try {
      await api.post('/digital-employee/billing', {
        clientName: form.clientName,
        document: form.document || null,
        amount: Number(form.amount),
        dueDate: form.dueDate,
      });
      setForm({ clientName: '', document: '', amount: '', dueDate: '' });
      toast.success('Cobrança criada!');
      load();
    } catch (e: any) { toast.error(e.response?.data?.message || 'Erro ao criar.'); }
  }

  async function setStatus(id: string, status: 'ENVIADA' | 'PAGA') {
    await api.post(`/digital-employee/billing/${id}/status`, { status });
    toast.success(`Marcada como ${status}`);
    load();
  }

  async function downloadCnab() {
    try {
      const res = await api.get('/digital-employee/billing/cnab');
      const blob = new Blob([res.data.data.txt], { type: 'text/plain' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `remessa_cnab240_${Date.now()}.txt`;
      a.click();
      toast.success(`Remessa gerada: ${res.data.data.count} cobrança(s) → GERADA`);
      load();
    } catch (e: any) { toast.error(e.response?.data?.message || 'Sem PENDENTES p/ remessa.'); }
  }

  // KPIs da régua
  const kpi = {
    pend: items.filter((i) => i.effectiveStatus === 'PENDENTE' || i.effectiveStatus === 'VENCIDA'),
    open: items.filter((i) => ['PENDENTE', 'VENCIDA', 'GERADA', 'ENVIADA'].includes(i.effectiveStatus)),
    paid: items.filter((i) => i.effectiveStatus === 'PAGA'),
  };
  const sum = (arr: Instruction[]) => arr.reduce((s, i) => s + Number(i.amount), 0);

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh]">
      <Loader2 className="h-12 w-12 text-teal-600 animate-spin mb-4" />
      <p className="text-slate-600">Carregando régua de cobrança...</p>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
            <Landmark className="h-8 w-8 text-teal-600" /> Cobrança CNAB
          </h1>
          <p className="text-slate-600 mt-1">Régua de cobrança + remessa CNAB 240 (FD-5, ADR-061).</p>
        </div>
        <button onClick={downloadCnab} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-orange-600 hover:bg-orange-700 text-white font-semibold">
          <Download className="h-4 w-4" /> Gerar remessa CNAB
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs font-semibold text-slate-500 uppercase">A vencer / vencidas</p>
          <p className="text-2xl font-bold text-amber-700">{kpi.pend.length}</p>
          <p className="text-xs text-slate-500">{brl(sum(kpi.pend))} em aberto</p>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs font-semibold text-slate-500 uppercase">Em trânsito (gerada/enviada)</p>
          <p className="text-2xl font-bold text-blue-700">{items.length - kpi.pend.length - kpi.paid.length}</p>
          <p className="text-xs text-slate-500">aguardando retorno do banco</p>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs font-semibold text-slate-500 uppercase">Recebidas (pagas)</p>
          <p className="text-2xl font-bold text-green-700">{kpi.paid.length}</p>
          <p className="text-xs text-slate-500">{brl(sum(kpi.paid))} recebidos</p>
        </div>
      </div>

      {/* Nova cobrança */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
        <p className="font-bold text-slate-800 mb-3 flex items-center gap-2"><Plus className="h-4 w-4" /> Nova cobrança</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          <input className="px-3 py-2 border border-slate-300 rounded-lg text-sm" placeholder="Cliente" value={form.clientName} onChange={(e) => setForm({ ...form, clientName: e.target.value })} />
          <input className="px-3 py-2 border border-slate-300 rounded-lg text-sm" placeholder="CNPJ/CPF" value={form.document} onChange={(e) => setForm({ ...form, document: e.target.value })} />
          <input type="number" step="0.01" className="px-3 py-2 border border-slate-300 rounded-lg text-sm" placeholder="Valor R$" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
          <input type="date" className="px-3 py-2 border border-slate-300 rounded-lg text-sm" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} />
        </div>
        <button onClick={add} className="mt-3 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-teal-600 text-white text-sm font-semibold">
          <Plus className="h-4 w-4" /> Adicionar à régua
        </button>
      </div>

      {/* Tabela */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-600 text-xs uppercase">
            <tr>
              <th className="px-4 py-3 text-left">Cliente</th>
              <th className="px-4 py-3 text-left">Vencimento</th>
              <th className="px-4 py-3 text-right">Valor</th>
              <th className="px-4 py-3 text-left">Nosso nº</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {items.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-400">Nenhuma cobrança na régua.</td></tr>
            )}
            {items.map((i) => {
              const cfg = STATUS_CFG[i.effectiveStatus] || STATUS_CFG.PENDENTE;
              return (
                <tr key={i.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-semibold text-slate-800">{i.clientName}</td>
                  <td className="px-4 py-3 text-slate-600">{new Date(i.dueDate).toLocaleDateString('pt-BR')}</td>
                  <td className="px-4 py-3 text-right font-bold text-slate-900">{brl(Number(i.amount))}</td>
                  <td className="px-4 py-3 font-mono text-xs text-slate-500">{i.ourNumber}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-bold px-2 py-1 rounded-full ${cfg.cls}`}>{cfg.label}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      {i.effectiveStatus === 'GERADA' && (
                        <button title="Marcar ENVIADA ao banco" onClick={() => setStatus(i.id, 'ENVIADA')} className="p-1.5 text-slate-400 hover:text-purple-600"><Send className="h-4 w-4" /></button>
                      )}
                      {(i.effectiveStatus === 'ENVIADA' || i.effectiveStatus === 'VENCIDA' || i.effectiveStatus === 'PENDENTE') && (
                        <button title="Marcar PAGA" onClick={() => setStatus(i.id, 'PAGA')} className="p-1.5 text-slate-400 hover:text-green-600"><CheckCircle2 className="h-4 w-4" /></button>
                      )}
                      {i.status === 'PENDENTE' && (
                        <button title="Excluir" onClick={async () => { await api.delete(`/digital-employee/billing/${i.id}`); load(); }} className="p-1.5 text-slate-400 hover:text-red-600"><Trash2 className="h-4 w-4" /></button>
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
// =================================================================
// FIM: frontend/src/app/dashboard/funcionario-digital/cobranca/page.tsx
// =================================================================