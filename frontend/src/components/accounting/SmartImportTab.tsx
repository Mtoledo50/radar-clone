// =================================================================
// INÍCIO: frontend/src/components/accounting/SmartImportTab.tsx (v3)
// =================================================================
/**
 * 🧠 SmartImportTab v3 — anti-duplicidade de LANÇAMENTOS:
 *   • Após analisar, consulta /import/overlap e AVISA:
 *     "⚠️ Extrato 05–07/2026 já existe (58 lançamentos até 21/07)"
 *   • Ao salvar: modal com [Somente novos] [Substituir período]
 *   • 🗑 "Excluir extrato importado" apaga só lançamentos de extrato
 *   • Contas NUNCA são tocadas (autocomplete + ➕ nova conta mantidos)
 */
'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import api from '@/lib/axios';
import { toast } from 'sonner';
import { UploadCloud, Loader2, FileText, X, Save, Plus, Trash2, Search, AlertTriangle } from 'lucide-react';

interface Account { id: string; code: string; name: string; seq?: string | null }
interface Draft {
  key: string; date: string; description: string; counterparty: string;
  amount: number; side: 'ENTRADA' | 'SAIDA';
  confidence: 'ALTA' | 'MEDIA' | 'REVISAR'; reason: string; bankAccount: string;
  debit: Account | null; credit: Account | null; alreadyExists?: boolean;
}
interface Overlap { hasExisting: boolean; existingCount: number; lastDate: string | null; months: string[] }

const fmtBRL = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const fmtDate = (d: string) => new Date(d + 'T00:00:00').toLocaleDateString('pt-BR');
const fmtMes = (m: string) => `${m.split('-')[1]}/${m.split('-')[0]}`;
const accLabel = (a: Account) => `${a.seq ? a.seq + ' • ' : ''}${a.code} • ${a.name}`;
const norm = (s: string) => s.toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

async function readCsvText(file: File): Promise<string> {
  const buf = await file.arrayBuffer();
  const utf8 = new TextDecoder('utf-8').decode(buf);
  return utf8.includes('\uFFFD') ? new TextDecoder('windows-1252').decode(buf) : utf8;
}

function ConfidenceBadge({ level }: { level: Draft['confidence'] }) {
  const map = {
    ALTA: { cls: 'bg-green-100 text-green-700', txt: '🟢 Auto' },
    MEDIA: { cls: 'bg-yellow-100 text-yellow-700', txt: '🟡 Regra' },
    REVISAR: { cls: 'bg-orange-100 text-orange-700', txt: '🟠 Revisar' },
  } as const;
  const m = map[level];
  return <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold whitespace-nowrap ${m.cls}`}>{m.txt}</span>;
}

/** 🔎 Combobox c/ autocomplete por código OU nome (sem acento) */
function AccountPicker({ value, onChange, accounts, accent }: {
  value: Account | null; onChange: (a: Account | null) => void; accounts: Account[]; accent: 'orange' | 'teal';
}) {
  const [open, setOpen] = useState(false);
  const [term, setTerm] = useState('');
  const wrapRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const h = (e: MouseEvent) => { if (!wrapRef.current?.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);
  const filtered = useMemo(() => {
    const raw = term.trim();
    const t = norm(raw);
    if (!t) return accounts.slice(0, 30);
    return accounts
      .filter(
        (a) =>
          norm(a.code).includes(t) ||            // classificação: 04.2.1.03.040
          norm(a.name).includes(t) ||            // parte do nome: "sicredi"
          (a.seq || '').includes(raw) ||         // nº unificado: 819
          ((a as any).accountNumber || '').includes(raw), // legado espelho
      )
      .slice(0, 30);
  }, [term, accounts]);
  const borderCls = value
    ? accent === 'orange' ? 'border-orange-300 bg-white' : 'border-teal-300 bg-white'
    : accent === 'orange' ? 'border-orange-500 bg-orange-50' : 'border-teal-500 bg-teal-50';
  return (
    <div ref={wrapRef} className="relative">
      <div className="flex items-center gap-1">
        <Search className="h-3.5 w-3.5 text-slate-400 shrink-0" />
        <input
          value={open ? term : value ? accLabel(value) : ''}
          placeholder={value ? 'trocar conta...' : 'buscar nome, código ou nº (ex: 819)...'}
          onFocus={() => { setOpen(true); setTerm(''); }}
          onChange={(e) => { setTerm(e.target.value); setOpen(true); }}
          className={`w-full px-2 py-1 border-2 rounded-lg text-xs font-semibold text-slate-800 ${borderCls}`}
        />
        {value && (
          <button onClick={() => onChange(null)} className="text-slate-400 hover:text-red-500" title="Limpar">
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
      {open && (
        <div className="absolute z-20 mt-1 w-full max-h-48 overflow-y-auto bg-white border border-slate-200 rounded-lg shadow-lg">
          {filtered.length === 0 && <p className="px-3 py-2 text-xs text-slate-400">Nenhuma conta encontrada.</p>}
          {filtered.map((a) => (
            <button key={a.id} onClick={() => { onChange(a); setOpen(false); }}
              className="w-full text-left px-3 py-1.5 text-xs hover:bg-teal-50 font-mono text-slate-700">
              {accLabel(a)}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function SmartImportTab({ onImportSuccess }: { onImportSuccess: () => void }) {
  const [clients, setClients] = useState<any[]>([]);
  const [clientId, setClientId] = useState('');
  const [bankCode, setBankCode] = useState('');
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [busy, setBusy] = useState(false);
  const [saving, setSaving] = useState(false);
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [range, setRange] = useState<{ start: string; end: string } | null>(null);
  const [overlap, setOverlap] = useState<Overlap | null>(null);
  const [showOverlapModal, setShowOverlapModal] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [newCode, setNewCode] = useState('');
  const [newName, setNewName] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const uniqueAccounts = useMemo(() => {
    const byCode = new Map<string, Account>();
    for (const a of accounts) {
      const prev = byCode.get(a.code);
      if (!prev || (a.seq && !prev.seq)) byCode.set(a.code, a);
    }
    return [...byCode.values()].sort((x, y) => x.code.localeCompare(y.code, 'pt-BR', { numeric: true }));
  }, [accounts]);

  const bankAccounts = uniqueAccounts.filter(
    (a) => a.code.startsWith('01.1.1.01') || a.code.startsWith('01.1.1.02') || a.code.startsWith('01.1.1.03'),
  );

  useEffect(() => {
    api.get('/clients').then((r) => setClients(r.data.data || [])).catch(() => {});
    api.get('/accounting/accounts').then((r) => setAccounts(r.data.data || r.data || [])).catch(() => {});
  }, []);

  function accept(f: File | null | undefined) {
    if (!f) return;
    if (!/\.(csv|txt)$/i.test(f.name)) return toast.error('Apenas arquivos .csv ou .txt');
    setFile(f); setDrafts([]); setStats(null); setOverlap(null); setRange(null);
  }

  // ── 1) Analisar + consultar overlap automaticamente (AVISO) ──
  async function handleParse() {
    if (!clientId) return toast.error('Selecione o cliente primeiro.');
    if (!file) return toast.error('Arraste ou selecione o extrato.');
    setBusy(true);
    try {
      const content = await readCsvText(file);
      const res = await api.post('/accounting/import/parse-smart', { clientId, content, bankCode: bankCode || undefined });
      if (res.data.success) {
        const d = res.data.data;
        setDrafts(d.drafts || []);
        setStats(d.stats || null);
        const dates = (d.drafts || []).map((x: Draft) => x.date).sort();
        const rg = dates.length ? { start: dates[0], end: dates[dates.length - 1] } : null;
        setRange(rg);
        if (rg) {
          const ov = await api.get('/accounting/import/overlap', { params: { clientId, start: rg.start, end: rg.end } });
          setOverlap(ov.data.data);
        }
        toast.success(`${d.stats?.total ?? 0} lançamentos analisados.`);
      } else toast.error(res.data.message || 'Erro na análise.');
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Erro ao analisar o extrato.');
    } finally { setBusy(false); }
  }

  function updateDraft(idx: number, field: 'debit' | 'credit', acc: Account | null) {
    setDrafts((prev) => prev.map((d, i) => (i === idx ? { ...d, [field]: acc } : d)));
  }

  async function handleCreateAccount() {
    if (!newCode.trim() || !newName.trim()) return toast.error('Preencha código e nome.');
    try {
      await api.post('/accounting/accounts', { code: newCode.trim(), name: newName.trim() });
      toast.success(`Conta ${newCode} criada.`);
      const r = await api.get('/accounting/accounts');
      setAccounts(r.data.data || r.data || []);
      setNewCode(''); setNewName(''); setShowNew(false);
    } catch (e: any) { toast.error(e.response?.data?.message || 'Erro ao criar conta.'); }
  }

  // ── 🗑 Excluir extrato importado (SÓ lançamentos de extrato) ──
  async function handleDeleteExtrato() {
    const faixa = range ? ` entre ${fmtDate(range.start)} e ${fmtDate(range.end)}` : ' (TODO o histórico)';
    if (!window.confirm(`Excluir os lançamentos de EXTRATO importados deste cliente${faixa}?\nAs contas do plano NÃO serão tocadas.`)) return;
    try {
      const params: any = { clientId };
      if (range) { params.start = range.start; params.end = range.end; }
      const r = await api.delete('/accounting/import/extrato', { params });
      toast.success(`${r.data.data.deleted} lançamento(s) de extrato excluído(s).`);
      setDrafts([]); setStats(null); setOverlap(null);
      onImportSuccess();
    } catch (e: any) { toast.error(e.response?.data?.message || 'Erro ao excluir extrato.'); }
  }

  const savable = drafts.filter((d) => !d.alreadyExists);
  const incomplete = savable.filter((d) => !d.debit || !d.credit).length;

  // ── Salvar: se houver overlap → modal de decisão ──
  function handleSaveClick() {
    if (incomplete > 0) return toast.error(`Complete as contas dos ${incomplete} lançamento(s) 🟠.`);
    if (overlap?.hasExisting) { setShowOverlapModal(true); return; }
    doSave('ONLY_NEW');
  }

  async function doSave(mode: 'ONLY_NEW' | 'REPLACE') {
    setShowOverlapModal(false);
    setSaving(true);
    try {
      const res = await api.post('/accounting/import/save-smart', { clientId, drafts: savable, mode });
      if (res.data.success) {
        toast.success(res.data.message);
        setFile(null); setDrafts([]); setStats(null); setOverlap(null); setRange(null);
        onImportSuccess();
      } else toast.error(res.data.message || 'Erro ao salvar.');
    } catch (e: any) { toast.error(e.response?.data?.message || 'Erro ao salvar lançamentos.'); }
    finally { setSaving(false); }
  }

  return (
    <div className="space-y-6">
      {/* Passo 1 */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 space-y-4">
        <h3 className="text-lg font-bold text-slate-900">1. Cliente e conta bancária</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <select value={clientId} onChange={(e) => setClientId(e.target.value)}
            className="w-full px-4 py-3 border-2 border-slate-300 rounded-lg text-slate-900">
            <option value="">Selecione um cliente da carteira...</option>
            {clients.map((c) => <option key={c.id} value={c.id}>{c.companyName} - {c.cnpj || 'Sem CNPJ'}</option>)}
          </select>
          <select value={bankCode} onChange={(e) => setBankCode(e.target.value)}
            className="w-full px-4 py-3 border-2 border-slate-300 rounded-lg text-slate-900">
            <option value="">Banco p/ partida dobrada (detecta pela seção)</option>
            {bankAccounts.map((a) => <option key={a.id} value={a.code}>{accLabel(a)}</option>)}
          </select>
        </div>
      </div>

      {/* Passo 2: dropzone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => { e.preventDefault(); setDragging(false); accept(e.dataTransfer.files?.[0]); }}
        onClick={() => inputRef.current?.click()}
        className={`cursor-pointer rounded-xl border-2 border-dashed p-8 text-center transition-colors ${
          dragging || file ? 'border-teal-500 bg-teal-50' : 'border-slate-300 hover:border-teal-400 bg-slate-50'}`}
      >
        <input ref={inputRef} type="file" accept=".csv,.txt" className="hidden" onChange={(e) => accept(e.target.files?.[0])} />
        {file ? (
          <div className="flex items-center justify-center gap-3">
            <FileText className="h-6 w-6 text-teal-600" />
            <span className="font-medium text-slate-800">{file.name}</span>
            <button onClick={(e) => { e.stopPropagation(); setFile(null); }} className="text-slate-400 hover:text-red-500"><X className="h-5 w-5" /></button>
          </div>
        ) : (
          <>
            <UploadCloud className="h-12 w-12 text-slate-400 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-slate-900">2. Arraste o extrato aqui ou clique para escolher</h3>
            <p className="text-sm text-slate-500 mt-1">.csv ou .txt — formato Sicredi/banco (multi-conta ok)</p>
          </>
        )}
      </div>

      <button onClick={handleParse} disabled={busy || !file || !clientId}
        className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-lg disabled:opacity-50">
        {busy && <Loader2 className="h-5 w-5 animate-spin" />}
        {busy ? 'Analisando...' : '3. Analisar e sugerir contas'}
      </button>

      {/* 🆕 AVISO de overlap (aparece sozinho após analisar) */}
      {overlap?.hasExisting && (
        <div className="flex items-start gap-3 bg-amber-50 border border-amber-300 rounded-lg p-4">
          <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-sm text-amber-800">
            <strong>Extrato {overlap.months.map(fmtMes).join(', ')} já existe:</strong>{' '}
            {overlap.existingCount} lançamento(s) importado(s){overlap.lastDate ? ` — último em ${fmtDate(overlap.lastDate.slice(0, 10))}` : ''}.
            Ao salvar você escolhe entre <strong>importar somente os novos</strong> ou <strong>substituir o período</strong>.
          </div>
        </div>
      )}

      {drafts.length > 0 && stats && (
        <div className="space-y-4">
          {/* Cards */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200"><p className="text-xs text-slate-600 font-medium">Total</p><p className="text-xl font-bold text-slate-900">{stats.total}</p></div>
            <div className="bg-green-50 p-3 rounded-lg border border-green-200"><p className="text-xs text-green-700 font-medium">🟢 Auto</p><p className="text-xl font-bold text-green-800">{stats.alta}</p></div>
            <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200"><p className="text-xs text-yellow-700 font-medium">🟡 Regra</p><p className="text-xl font-bold text-yellow-800">{stats.media}</p></div>
            <div className="bg-orange-50 p-3 rounded-lg border border-orange-200"><p className="text-xs text-orange-700 font-medium">🟠 Revisar</p><p className="text-xl font-bold text-orange-800">{stats.revisar}</p></div>
            <div className="bg-blue-50 p-3 rounded-lg border border-blue-200"><p className="text-xs text-blue-700 font-medium">Saldo período</p><p className={`text-xl font-bold ${(stats.totalEntradas - stats.totalSaidas) >= 0 ? 'text-green-800' : 'text-red-800'}`}>{fmtBRL(stats.totalEntradas - stats.totalSaidas)}</p></div>
          </div>

          {/* Toolbar */}
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <p className="text-sm font-bold text-slate-700">
              4. Revisão ({savable.length} a salvar{incomplete > 0 ? ` • ${incomplete} pendentes` : ''})
            </p>
            <div className="flex gap-2">
              <button onClick={handleDeleteExtrato}
                className="inline-flex items-center gap-1 px-3 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 text-xs font-semibold">
                <Trash2 className="h-3.5 w-3.5" /> Excluir extrato importado
              </button>
              <button onClick={() => setShowNew(!showNew)}
                className="inline-flex items-center gap-1 px-3 py-1.5 bg-teal-600 text-white rounded-lg hover:bg-teal-700 text-xs font-semibold">
                <Plus className="h-3.5 w-3.5" /> Nova conta
              </button>
            </div>
          </div>

          {showNew && (
            <div className="bg-teal-50 border border-teal-200 rounded-lg p-3 flex flex-col md:flex-row gap-2">
              <input type="text" placeholder="Código (ex.: 03.2.1.01.015)" value={newCode} onChange={(e) => setNewCode(e.target.value)}
                className="flex-1 px-3 py-2 border border-teal-300 rounded-lg text-sm font-mono" />
              <input type="text" placeholder="Nome (ex.: Doações de Terceiros)" value={newName} onChange={(e) => setNewName(e.target.value)}
                className="flex-[2] px-3 py-2 border border-teal-300 rounded-lg text-sm" />
              <button onClick={handleCreateAccount} className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 text-sm font-semibold">Criar</button>
              <button onClick={() => setShowNew(false)} className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 text-sm">Cancelar</button>
            </div>
          )}

          {/* Tabela */}
          <div className="overflow-x-auto border border-slate-200 rounded-lg max-h-[500px] overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 sticky top-0">
                <tr>
                  <th className="text-left px-3 py-2 text-xs font-semibold text-slate-600 uppercase">Data</th>
                  <th className="text-left px-3 py-2 text-xs font-semibold text-slate-600 uppercase">Contraparte / histórico</th>
                  <th className="text-center px-3 py-2 text-xs font-semibold text-slate-600 uppercase">Tipo</th>
                  <th className="text-right px-3 py-2 text-xs font-semibold text-slate-600 uppercase">Valor</th>
                  <th className="text-center px-3 py-2 text-xs font-semibold text-slate-600 uppercase">Confiança</th>
                  <th className="text-left px-3 py-2 text-xs font-semibold text-orange-600 uppercase">Conta Débito (busque)</th>
                  <th className="text-left px-3 py-2 text-xs font-semibold text-teal-600 uppercase">Conta Crédito (busque)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {drafts.map((d, idx) => (
                  <tr key={d.key + idx} className="hover:bg-slate-50 align-top">
                    <td className="px-3 py-2 whitespace-nowrap text-slate-700">{fmtDate(d.date)}</td>
                    <td className="px-3 py-2 text-slate-900 font-medium max-w-[220px]">
                      <p className="truncate" title={d.description}>{d.counterparty || d.description}</p>
                      <p className="text-[10px] text-slate-400 truncate" title={d.reason}>{d.reason}</p>
                    </td>
                    <td className="px-3 py-2 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${d.side === 'ENTRADA' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {d.side === 'ENTRADA' ? '↗ Entrada' : '↙ Saída'}
                      </span>
                    </td>
                    <td className={`px-3 py-2 text-right font-semibold whitespace-nowrap ${d.side === 'ENTRADA' ? 'text-green-700' : 'text-red-700'}`}>{fmtBRL(d.amount)}</td>
                    <td className="px-3 py-2 text-center"><ConfidenceBadge level={d.confidence} /></td>
                    <td className="px-3 py-2 min-w-[240px]"><AccountPicker value={d.debit} onChange={(a) => updateDraft(idx, 'debit', a)} accounts={uniqueAccounts} accent="orange" /></td>
                    <td className="px-3 py-2 min-w-[240px]"><AccountPicker value={d.credit} onChange={(a) => updateDraft(idx, 'credit', a)} accounts={uniqueAccounts} accent="teal" /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <button onClick={handleSaveClick} disabled={saving || incomplete > 0 || savable.length === 0}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-lg disabled:opacity-50">
            {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
            {incomplete > 0 ? `Complete ${incomplete} lançamento(s) 🟠 para salvar` : `5. Confirmar e salvar ${savable.length} lançamento(s)`}
          </button>
        </div>
      )}

      {/* 🆕 MODAL de decisão quando já existe extrato no período */}
      {showOverlapModal && overlap && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-6 w-6 text-amber-500 shrink-0" />
              <div>
                <h3 className="text-lg font-bold text-slate-900">Extrato {overlap.months.map(fmtMes).join(', ')} já existe</h3>
                <p className="text-sm text-slate-600 mt-1">
                  Já há <strong>{overlap.existingCount} lançamento(s)</strong> importado(s) neste período
                  {overlap.lastDate ? ` (último em ${fmtDate(overlap.lastDate.slice(0, 10))})` : ''}. O que deseja fazer?
                </p>
              </div>
            </div>
            <div className="space-y-2">
              <button onClick={() => doSave('ONLY_NEW')}
                className="w-full px-4 py-3 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-sm font-semibold text-left">
                ➕ Importar SOMENTE os novos (recomendado — não duplica)
              </button>
              <button onClick={() => doSave('REPLACE')}
                className="w-full px-4 py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-sm font-semibold text-left">
                🔄 Substituir o período (apaga o extrato antigo e reimporta tudo)
              </button>
              <button onClick={() => setShowOverlapModal(false)}
                className="w-full px-4 py-3 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-sm font-medium">
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
// =================================================================
// FIM: frontend/src/components/accounting/SmartImportTab.tsx (v3)
// =================================================================