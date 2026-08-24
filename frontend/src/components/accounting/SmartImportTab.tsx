// =================================================================
// INÍCIO: frontend/src/components/accounting/SmartImportTab.tsx
// =================================================================
/**
 * 🧠 SmartImportTab — ETAPA 2 (ADR-068)
 * Aba "Importar Extrato" com classificação SUGERIDA em 3 camadas:
 *   1️⃣ memória do Razão (contraparte→conta) → 🟢 ALTA
 *   2️⃣ regras por palavra-chave              → 🟡 MEDIA
 *   3️⃣ sem match                             → 🟠 REVISAR (manual)
 *
 * FLUXO: cliente + banco → dropzone (arrastar/clicar) → Analisar
 * (POST parse-smart, upload via TEXTO) → preview com selects
 * pré-preenchidos → trava de contas incompletas → Salvar (save-smart).
 */
'use client';

import { useEffect, useRef, useState } from 'react';
import api from '@/lib/axios';
import { toast } from 'sonner';
import {
  UploadCloud, Loader2, FileText, X, Save, Banknote,
} from 'lucide-react';

// ── Tipos mínimos (espelham o domínio do backend) ──
interface AccountRef { id: string; code: string; name: string }
interface Draft {
  key: string;
  date: string;
  description: string;
  counterparty: string;
  amount: number;
  side: 'ENTRADA' | 'SAIDA';
  confidence: 'ALTA' | 'MEDIA' | 'REVISAR';
  reason: string;
  debit: AccountRef | null;
  credit: AccountRef | null;
}

const fmtBRL = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const fmtDate = (d: string) => new Date(d + 'T00:00:00').toLocaleDateString('pt-BR');

// Badge de confiança (mesma linguagem visual da conciliação Banco×NF-e)
function ConfidenceBadge({ level }: { level: Draft['confidence'] }) {
  const map = {
    ALTA:    { cls: 'bg-green-100 text-green-700',  txt: '🟢 Auto' },
    MEDIA:   { cls: 'bg-yellow-100 text-yellow-700', txt: '🟡 Regra' },
    REVISAR: { cls: 'bg-orange-100 text-orange-700', txt: '🟠 Revisar' },
  } as const;
  const m = map[level];
  return (
    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold whitespace-nowrap ${m.cls}`}>
      {m.txt}
    </span>
  );
}

export default function SmartImportTab({
  onImportSuccess,
  accounts,
}: {
  onImportSuccess: () => void;
  accounts: AccountRef[];
}) {
  // ── Estados ──
  const [clients, setClients] = useState<any[]>([]);
  const [clientId, setClientId] = useState('');
  const [bankCode, setBankCode] = useState(''); // contrapartida bancária
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [busy, setBusy] = useState(false);
  const [saving, setSaving] = useState(false);
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [stats, setStats] = useState<any>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Contas bancárias/caixa p/ o seletor de contrapartida
  const bankAccounts = accounts.filter(
    (a) =>
      a.code.startsWith('01.1.1.01') ||
      a.code.startsWith('01.1.1.02') ||
      a.code.startsWith('01.1.1.03'),
  );

  useEffect(() => {
    api.get('/clients').then((r) => setClients(r.data.data || [])).catch(() => {});
  }, []);

  // ── Dropzone: valida extensão e guarda o arquivo ──
  function accept(f: File | null | undefined) {
    if (!f) return;
    if (!/\.(csv|txt)$/i.test(f.name)) {
      toast.error('Apenas arquivos .csv ou .txt');
      return;
    }
    setFile(f);
    setDrafts([]); // novo arquivo zera a análise anterior
    setStats(null);
  }

  // ── 1) Analisar: lê como TEXTO e manda p/ parse-smart ──
  async function handleParse() {
    if (!clientId) return toast.error('Selecione o cliente primeiro.');
    if (!file) return toast.error('Arraste ou selecione o extrato.');
    setBusy(true);
    try {
      const content = await file.text(); // ← texto puro (zero multipart)
      const res = await api.post('/accounting/import/parse-smart', {
        clientId,
        content,
        bankCode: bankCode || undefined,
      });
      if (res.data.success) {
        setDrafts(res.data.data.drafts || []);
        setStats(res.data.data.stats || null);
        toast.success(`${res.data.data.stats?.total ?? 0} lançamentos analisados.`);
        // 🆕 Mostra quais contas bancárias o CSV continha (multi-conta)
if (res.data.data.contasDetectadas?.length) {
  toast.info(`🏦 Contas detectadas: ${res.data.data.contasDetectadas.join(' • ')}`);
}
      } else {
        toast.error(res.data.message || 'Erro na análise.');
      }
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Erro ao analisar o extrato.');
    } finally {
      setBusy(false);
    }
  }

  // ── 2) Edição manual dos selects (revisão humana obrigatória) ──
  function updateDraft(idx: number, field: 'debit' | 'credit', id: string) {
    const acc = accounts.find((a) => a.id === id) || null;
    setDrafts((prev) => prev.map((d, i) => (i === idx ? { ...d, [field]: acc } : d)));
  }

  // ── 3) Salvar: trava lançamentos sem as duas contas ──
  async function handleSave() {
    const incomplete = drafts.filter((d) => !d.debit || !d.credit).length;
    if (incomplete > 0) {
      toast.error(`Complete as contas dos ${incomplete} lançamento(s) 🟠 antes de salvar.`);
      return;
    }
    setSaving(true);
    try {
      const res = await api.post('/accounting/import/save-smart', { clientId, drafts });
      if (res.data.success) {
        toast.success(res.data.message);
        setFile(null);
        setDrafts([]);
        setStats(null);
        onImportSuccess(); // refresca a aba Lançamentos
      } else {
        toast.error(res.data.message || 'Erro ao salvar.');
      }
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Erro ao salvar lançamentos.');
    } finally {
      setSaving(false);
    }
  }

  const incomplete = drafts.filter((d) => !d.debit || !d.credit).length;

  // =================================================================
  // RENDER
  // =================================================================
  return (
    <div className="space-y-6">
      {/* ── Passo 1: cliente + conta bancária ── */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 space-y-4">
        <h3 className="text-lg font-bold text-slate-900">1. Cliente e conta bancária</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <select
            value={clientId}
            onChange={(e) => setClientId(e.target.value)}
            className="w-full px-4 py-3 border-2 border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-teal-500"
          >
            <option value="">Selecione um cliente da carteira...</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.companyName} - {c.cnpj || 'Sem CNPJ'}
              </option>
            ))}
          </select>
          <select
            value={bankCode}
            onChange={(e) => setBankCode(e.target.value)}
            className="w-full px-4 py-3 border-2 border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-teal-500"
          >
        <option value="">Banco padrão (fallback se o CSV não identificar a conta)</option>
                    {bankAccounts.map((a) => (
              <option key={a.id} value={a.code}>{a.code} - {a.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* ── Passo 2: dropzone do extrato ── */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => { e.preventDefault(); setDragging(false); accept(e.dataTransfer.files?.[0]); }}
        onClick={() => inputRef.current?.click()}
        className={`cursor-pointer rounded-xl border-2 border-dashed p-8 text-center transition-colors ${
          dragging || file
            ? 'border-teal-500 bg-teal-50'
            : 'border-slate-300 hover:border-teal-400 bg-slate-50'
        }`}
      >
        <input
          ref={inputRef} type="file" accept=".csv,.txt" className="hidden"
          onChange={(e) => accept(e.target.files?.[0])}
        />
        {file ? (
          <div className="flex items-center justify-center gap-3">
            <FileText className="h-6 w-6 text-teal-600" />
            <span className="font-medium text-slate-800">{file.name}</span>
            <button
              onClick={(e) => { e.stopPropagation(); setFile(null); }}
              className="text-slate-400 hover:text-red-500" title="Remover arquivo"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        ) : (
          <>
            <UploadCloud className="h-12 w-12 text-slate-400 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-slate-900">2. Arraste o extrato aqui ou clique para escolher</h3>
            <p className="text-sm text-slate-500 mt-1">.csv ou .txt — formato do banco (ENTRADAS/SAÍDAS)</p>
          </>
        )}
      </div>

      {/* ── Botão analisar ── */}
      <button
        onClick={handleParse}
        disabled={busy || !file || !clientId}
        className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-lg disabled:opacity-50"
      >
        {busy && <Loader2 className="h-5 w-5 animate-spin" />}
        {busy ? 'Analisando...' : '3. Analisar e sugerir contas'}
      </button>

      {/* ── Passo 4: preview com sugestões ── */}
      {drafts.length > 0 && stats && (
        <div className="space-y-4">
          {/* Cards de estatística */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
              <p className="text-xs text-slate-600 font-medium">Total</p>
              <p className="text-xl font-bold text-slate-900">{stats.total}</p>
            </div>
            <div className="bg-green-50 p-3 rounded-lg border border-green-200">
              <p className="text-xs text-green-700 font-medium">🟢 Auto</p>
              <p className="text-xl font-bold text-green-800">{stats.alta}</p>
            </div>
            <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
              <p className="text-xs text-yellow-700 font-medium">🟡 Regra</p>
              <p className="text-xl font-bold text-yellow-800">{stats.media}</p>
            </div>
            <div className="bg-orange-50 p-3 rounded-lg border border-orange-200">
              <p className="text-xs text-orange-700 font-medium">🟠 Revisar</p>
              <p className="text-xl font-bold text-orange-800">{stats.revisar}</p>
            </div>
            <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
              <p className="text-xs text-blue-700 font-medium">Saldo do período</p>
              <p className={`text-xl font-bold ${(stats.totalEntradas - stats.totalSaidas) >= 0 ? 'text-green-800' : 'text-red-800'}`}>
                {fmtBRL(stats.totalEntradas - stats.totalSaidas)}
              </p>
            </div>
          </div>

          {/* Tabela de revisão */}
          <div className="overflow-x-auto border border-slate-200 rounded-lg max-h-[500px] overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 sticky top-0">
                <tr>
                  <th className="text-left px-3 py-2 text-xs font-semibold text-slate-600 uppercase">Data</th>
                  <th className="text-left px-3 py-2 text-xs font-semibold text-slate-600 uppercase">Contraparte / histórico</th>
                  <th className="text-center px-3 py-2 text-xs font-semibold text-slate-600 uppercase">Tipo</th>
                  <th className="text-right px-3 py-2 text-xs font-semibold text-slate-600 uppercase">Valor</th>
                  <th className="text-center px-3 py-2 text-xs font-semibold text-slate-600 uppercase">Confiança</th>
                  <th className="text-left px-3 py-2 text-xs font-semibold text-orange-600 uppercase">Conta Débito</th>
                  <th className="text-left px-3 py-2 text-xs font-semibold text-teal-600 uppercase">Conta Crédito</th>
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
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        d.side === 'ENTRADA' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {d.side === 'ENTRADA' ? '↗ Entrada' : '↙ Saída'}
                      </span>
                    </td>
                    <td className={`px-3 py-2 text-right font-semibold whitespace-nowrap ${
                      d.side === 'ENTRADA' ? 'text-green-700' : 'text-red-700'
                    }`}>
                      {fmtBRL(d.amount)}
                    </td>
                    <td className="px-3 py-2 text-center"><ConfidenceBadge level={d.confidence} /></td>
                    <td className="px-3 py-2 min-w-[220px]">
                      <select
                        value={d.debit?.id || ''}
                        onChange={(e) => updateDraft(idx, 'debit', e.target.value)}
                        className={`w-full px-2 py-1 border-2 rounded-lg text-xs font-semibold ${
                          d.debit ? 'border-orange-300 bg-white text-slate-800' : 'border-orange-500 bg-orange-50 text-orange-900'
                        }`}
                      >
                        <option value="">Selecione...</option>
                        {accounts.map((a) => (
                          <option key={a.id} value={a.id}>{a.code} - {a.name}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-3 py-2 min-w-[220px]">
                      <select
                        value={d.credit?.id || ''}
                        onChange={(e) => updateDraft(idx, 'credit', e.target.value)}
                        className={`w-full px-2 py-1 border-2 rounded-lg text-xs font-semibold ${
                          d.credit ? 'border-teal-300 bg-white text-slate-800' : 'border-teal-500 bg-teal-50 text-teal-900'
                        }`}
                      >
                        <option value="">Selecione...</option>
                        {accounts.map((a) => (
                          <option key={a.id} value={a.id}>{a.code} - {a.name}</option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* ── Salvar ── */}
          <button
            onClick={handleSave}
            disabled={saving || incomplete > 0}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-lg disabled:opacity-50"
          >
            {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
            {incomplete > 0
              ? `Complete ${incomplete} lançamento(s) 🟠 para salvar`
              : '4. Confirmar e salvar lançamentos'}
          </button>
        </div>
      )}
    </div>
  );
}
// =================================================================
// FIM: frontend/src/components/accounting/SmartImportTab.tsx
// =================================================================