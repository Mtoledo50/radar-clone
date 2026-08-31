// =================================================================
// INÍCIO: frontend/src/app/dashboard/contabil/ciclo-contabil/page.tsx
// =================================================================
/**
📒 Ciclo Contábil do Cliente — ETAPA 1 (ADR-066/070)
Fluxo: seleciona cliente → importa BALANCETE (base inicial) e
RAZÃO (lançamentos) → vê o SUGERIDOR contraparte→conta p/ lançar.
🆕 ADR-070: duas colunas separadas no balancete:
• "Conta" (seq SCI, ex.: 819)
• "Classificação" (código + nome, ex.: 01.1.1.02.026 Sicredi 07417-6)
 Botão ➕ Adicionar conta inline no sugeridor (cria conta no plano
do tenant sem sair da tela).
Upload via TEXTO (file.text()) — zero multipart/boundary (ADR-066).
*/
'use client';
import { useEffect, useRef, useState } from 'react';
import api from '@/lib/axios';
import { toast } from 'sonner';
import {
  BookOpen, Upload, Lightbulb, Eye, FileSpreadsheet, X, Loader2, Plus, Trash2,
} from 'lucide-react';

// Formata número como R$ (Decimal chega como string do Prisma)
const fmtBRL = (v: any) =>
  Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

// =================================================================
// 🧩 DROPZONE REUTILIZÁVEL (arrastar/soltar OU clicar p/ escolher)
// =================================================================
interface DropzoneProps {
  file: File | null;
  onFile: (f: File | null) => void;
  accent?: 'teal' | 'orange';
}

// =================================================================
// ️ Leitor de CSV com detecção de encoding (ADR-071 proposto)
// O SCI exporta balancetes em ANSI (Windows-1252); extratos/razão
// costumam vir em UTF-8. Detecta pelo caractere de substituição
// (U+FFFD) e re-decodifica — nunca mais "APLICAES".
// =================================================================
async function readCsvText(file: File): Promise<string> {
  const buf = await file.arrayBuffer();
  const utf8 = new TextDecoder('utf-8').decode(buf);
  return utf8.includes('\uFFFD')
    ? new TextDecoder('windows-1252').decode(buf)
    : utf8;
}

function Dropzone({ file, onFile, accent = 'teal' }: DropzoneProps) {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const accept = (f: File | null | undefined) => {
    if (!f) return;
    if (!f.name.toLowerCase().endsWith('.csv')) {
      toast.error('Apenas arquivos .csv são aceitos.');
      return;
    }
    onFile(f);
  };

  const dragCls =
    accent === 'teal'
      ? 'border-teal-500 bg-teal-50'
      : 'border-orange-500 bg-orange-50';

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        accept(e.dataTransfer.files?.[0]);
      }}
      onClick={() => inputRef.current?.click()}
      className={`cursor-pointer rounded-xl border-2 border-dashed p-4 text-center transition-colors ${
        dragging ? dragCls : 'border-slate-300 bg-slate-50 hover:border-slate-400'
      }`}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".csv"
        className="hidden"
        onChange={(e) => accept(e.target.files?.[0])}
      />
      {file ? (
        <div className="flex items-center justify-center gap-2 text-sm">
          <FileSpreadsheet className="h-4 w-4 text-teal-600" />
          {/* 🆕 CORREÇÃO: texto preto/escuro */}
          <span className="font-medium text-slate-900">{file.name}</span>
          <button
            onClick={(e) => { e.stopPropagation(); onFile(null); }}
            className="text-slate-400 hover:text-red-500"
            title="Remover arquivo"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <p className="text-sm text-slate-600">
          📂 Arraste o CSV aqui{' '}
          <span className="text-slate-500">ou clique para escolher</span>
        </p>
      )}
    </div>
  );
}

// =================================================================
// 🚀 PÁGINA PRINCIPAL
// =================================================================
export default function CicloContabilPage() {
  const [clients, setClients] = useState<any[]>([]);
  const [clientId, setClientId] = useState('');

  // ── Balancete ─
  const [tbCompetence, setTbCompetence] = useState('2026-04');
  const [tbFile, setTbFile] = useState<File | null>(null);
  const [tbList, setTbList] = useState<any[]>([]);
  const [tbRows, setTbRows] = useState<any[] | null>(null);

  // ── Razão ──
  const [lgPeriod, setLgPeriod] = useState('2026-05_a_2026-06');
  const [lgFile, setLgFile] = useState<File | null>(null);
  const [lgList, setLgList] = useState<any[]>([]);
  const [cpMap, setCpMap] = useState<Record<string, any>>({});

  // ── Criar conta inline ──
  const [showAddAccount, setShowAddAccount] = useState(false);
  const [newAccount, setNewAccount] = useState({ code: '', name: '' });
  const [busy, setBusy] = useState(false);

  // Carrega a carteira de clientes ao montar — COM diagnóstico visível
  useEffect(() => {
    (async () => {
      try {
        const r = await api.get('/clients');
        const payload: any = r.data;
        // Tolera os 3 formatos possíveis de resposta do backend
        const list = Array.isArray(payload)
          ? payload
          : Array.isArray(payload?.data)
          ? payload.data
          : Array.isArray(payload?.clients)
          ? payload.clients
          : [];
        setClients(list);
        if (list.length === 0) {
          toast.error('Backend respondeu, mas sem clientes (verifique o tenant logado).');
        }
      } catch (e: any) {
        // 👇 Agora o erro APARECE em vez de ficar silencioso
        toast.error(
          `Erro ao carregar clientes (HTTP ${e.response?.status ?? 'sem resposta'}):` +
          (e.response?.data?.message ?? e.message),
        );
      }
    })();
  }, []);

  // ── Importa BALANCETE (texto → JSON, sem multipart) ──
  async function importTrialBalance() {
    if (!clientId || !tbFile) return toast.error('Selecione cliente e arquivo do balancete.');
    setBusy(true);
    try {
      const content = await readCsvText(tbFile);
      const r = await api.post('/accounting/trial-balance/import', {
        clientId, competence: tbCompetence, content, fileName: tbFile.name,
      });
      const sync = r.data.data.sync;
      toast.success(
        `Balancete ${tbCompetence}: ${r.data.data.rowCount} contas •` +
        `plano sincronizado (${sync?.updated ?? 0} atualizadas, ${sync?.created ?? 0} criadas)`
      );
      setTbFile(null);
      const l = await api.get('/accounting/trial-balance', { params: { clientId } });
      setTbList(l.data.data || []);
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Erro ao importar balancete.');
    } finally { setBusy(false); }
  }

  // ── Excluir balancete importado ──
  async function handleDeleteTrialBalance(id: string) {
    if (!window.confirm('Excluir este balancete importado? As linhas serão removidas.')) return;
    try {
      await api.delete(`/accounting/trial-balance/${id}`);
      toast.success('Balancete excluído.');
      const l = await api.get('/accounting/trial-balance', { params: { clientId } });
      setTbList(l.data.data || []);
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Erro ao excluir balancete.');
    }
  }

  // ── Importa RAZÃO (mesmo padrão) ──
  async function importLedger() {
    if (!clientId || !lgFile) return toast.error('Selecione cliente e arquivo do razão.');
    setBusy(true);
    try {
      const content = await readCsvText(lgFile);
      const r = await api.post('/accounting/ledger/import', {
        clientId, periodLabel: lgPeriod, content, fileName: lgFile.name,
      });
      toast.success(`Razão ${lgPeriod}: ${r.data.data.entryCount} lançamentos.`);
      setLgFile(null);
      const l = await api.get('/accounting/ledger', { params: { clientId } });
      setLgList(l.data.data || []);
      const m = await api.get('/accounting/ledger/counterparty-map', { params: { clientId } });
      setCpMap(m.data.data || {});
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Erro ao importar razão.');
    } finally { setBusy(false); }
  }

  // ── Abre as linhas de um balancete importado ──
  async function openRows(id: string) {
    try {
      const r = await api.get(`/accounting/trial-balance/${id}/rows`);
      setTbRows(r.data.data.rows || []);
    } catch { toast.error('Erro ao carregar linhas do balancete.'); }
  }

  // ── Criar conta inline (ADR-070) ──
  async function handleAddAccount() {
    if (!newAccount.code || !newAccount.name) {
      return toast.error('Preencha código e nome da conta.');
    }
    try {
      await api.post('/accounting/accounts', {
        code: newAccount.code.trim(),
        name: newAccount.name.trim(),
        planName: 'SCI 90113',
      });
      toast.success(`Conta ${newAccount.code} criada com sucesso!`);
      setNewAccount({ code: '', name: '' });
      setShowAddAccount(false);
      // Recarrega sugeridor para incluir a nova conta
      if (clientId) {
        const m = await api.get('/accounting/ledger/counterparty-map', { params: { clientId } });
        setCpMap(m.data.data || {});
      }
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Erro ao criar conta.');
    }
  }

  const cpEntries = Object.entries(cpMap);

  // =================================================================
  // RENDER
  // =================================================================
  return (
    <div className="space-y-6">
      {/* Cabeçalho + seletor de cliente */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <BookOpen className="h-7 w-7 text-teal-600" /> Ciclo Contábil do Cliente
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Balancete inicial + razão + sugeridor de conta — base dos lançamentos mensais (SCI Único).
          </p>
        </div>
        {/* 🆕 CORREÇÃO: texto preto/escuro no select */}
        <select
          value={clientId}
          onChange={(e) => setClientId(e.target.value)}
          className="px-3 py-2.5 border border-slate-300 rounded-lg text-sm bg-white min-w-[260px] text-slate-900 font-medium"
        >
          <option value="">— Selecione o cliente —</option>
          {clients.map((c) => (
            <option key={c.id} value={c.id}>{c.companyName || c.name}</option>
          ))}
        </select>
      </div>

      {!clientId && (
        <p className="text-sm text-slate-400 text-center py-10">
          Selecione um cliente para começar (ex.: Grupo de Escoteiros).
        </p>
      )}

      {clientId && (
        <>
          {/* Cards de importação com DROPZONE */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* ── Card Balancete ── */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-3">
              <h3 className="font-bold text-slate-900 flex items-center gap-2">
                <FileSpreadsheet className="h-5 w-5 text-teal-600" /> Balancete Inicial (base)
              </h3>
              <div className="flex gap-2">
                {/* 🆕 CORREÇÃO: texto preto no input month */}
                <input
                  type="month"
                  value={tbCompetence}
                  onChange={(e) => setTbCompetence(e.target.value)}
                  className="px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 font-medium"
                />
                <Dropzone file={tbFile} onFile={setTbFile} accent="teal" />
              </div>
              <button
                onClick={importTrialBalance}
                disabled={busy || !tbFile}
                className="inline-flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50 text-sm font-medium"
              >
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                Importar Balancete
              </button>
              {/* Balancetes já importados */}
              <div className="space-y-1 pt-2">
                {tbList.map((tb) => (
                  <div key={tb.id} className="flex items-center justify-between text-sm bg-slate-50 rounded-lg px-3 py-2">
                    {/* 🆕 CORREÇÃO: texto preto/escuro */}
                    <span className="text-slate-900 font-medium">{tb.competence} • {tb.rowCount} contas • D {fmtBRL(tb.totalDebit)}</span>
                    <div className="flex items-center gap-2">
                      <button onClick={() => openRows(tb.id)} className="text-teal-600 hover:underline" title="Ver linhas">
                        <Eye className="h-4 w-4" />
                      </button>
                      <button onClick={() => handleDeleteTrialBalance(tb.id)} className="text-red-500 hover:underline" title="Excluir balancete">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* ─ Card Razão ── */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-3">
              <h3 className="font-bold text-slate-900 flex items-center gap-2">
                <FileSpreadsheet className="h-5 w-5 text-orange-500" /> Razão / Livro Caixa
              </h3>
              <div className="flex gap-2">
                {/* 🆕 CORREÇÃO: texto preto no input text */}
                <input
                  type="text"
                  value={lgPeriod}
                  onChange={(e) => setLgPeriod(e.target.value)}
                  placeholder="período (ex.: 2026-05_a_2026-06)"
                  className="px-3 py-2 border border-slate-300 rounded-lg text-sm flex-1 text-slate-900 font-medium"
                />
                <Dropzone file={lgFile} onFile={setLgFile} accent="orange" />
              </div>
              <button
                onClick={importLedger}
                disabled={busy || !lgFile}
                className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 text-sm font-medium"
              >
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                Importar Razão
              </button>
              <div className="space-y-1 pt-2">
                {lgList.map((lg) => (
                  /* 🆕 CORREÇÃO: texto preto/escuro */
                  <div key={lg.id} className="text-sm bg-slate-50 rounded-lg px-3 py-2 text-slate-900 font-medium">
                    {lg.periodLabel} • {lg._count?.entries ?? 0} lançamentos
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── Linhas do balancete aberto (ADR-070: Conta + Classificação separados) ── */}
          {tbRows && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-4 py-3 border-b bg-slate-50 flex justify-between items-center">
                {/* 🆕 CORREÇÃO: texto preto/escuro */}
                <p className="text-sm font-bold text-slate-900">
                  Linhas do balancete ({tbRows.length})
                </p>
                <button onClick={() => setTbRows(null)} className="text-xs text-slate-600 hover:underline">
                  fechar
                </button>
              </div>
              <div className="max-h-[50vh] overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-100 border-b border-slate-200 sticky top-0">
                    <tr>
                      <th className="text-left px-4 py-2 text-xs font-semibold text-slate-600 uppercase w-24">
                        Conta
                      </th>
                      <th className="text-left px-4 py-2 text-xs font-semibold text-slate-600 uppercase w-40">
                        Classificação
                      </th>
                      <th className="text-left px-4 py-2 text-xs font-semibold text-slate-600 uppercase">
                        Nome da conta
                      </th>
                      <th className="text-right px-4 py-2 text-xs font-semibold text-slate-600 uppercase w-32">
                        Saldo atual
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {tbRows.map((r) => (
                      <tr key={r.id} className="hover:bg-slate-50">
                        <td className="px-4 py-1.5 font-mono text-xs text-slate-600">
                          {r.seq || '—'}
                        </td>
                        <td className="px-4 py-1.5 font-mono text-xs text-teal-700 font-semibold">
                          {r.code}
                        </td>
                        <td className="px-4 py-1.5 text-slate-900">
                          {r.isSynthetic ? (
                            <span className="font-bold text-slate-900">{r.name}</span>
                          ) : (
                            r.name
                          )}
                        </td>
                        <td className="px-4 py-1.5 text-right font-medium text-slate-900">
                          {fmtBRL(r.currentBalance)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── Sugeridor contraparte → conta (com botão ➕ Adicionar conta) ── */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b bg-amber-50 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-amber-600" />
                {/* 🆕 CORREÇÃO: texto preto/escuro */}
                <p className="text-sm font-bold text-amber-900">
                  Sugeridor de conta (contraparte → conta do razão) — {cpEntries.length} pares
                </p>
              </div>
              <button
                onClick={() => setShowAddAccount(!showAddAccount)}
                className="inline-flex items-center gap-1 px-3 py-1.5 bg-teal-600 text-white rounded-lg hover:bg-teal-700 text-xs font-semibold"
              >
                <Plus className="h-3.5 w-3.5" />
                Nova conta
              </button>
            </div>
            {/* Formulário inline p/ criar conta */}
            {showAddAccount && (
              <div className="px-4 py-3 bg-teal-50 border-b border-teal-200 space-y-2">
                <p className="text-xs font-semibold text-teal-900">
                  Adicionar conta ao plano SCI 90113 do tenant:
                </p>
                <div className="flex flex-col md:flex-row gap-2">
                  {/* 🆕 CORREÇÃO: texto preto nos inputs */}
                  <input
                    type="text"
                    placeholder="Código (ex.: 03.2.1.01.015)"
                    value={newAccount.code}
                    onChange={(e) => setNewAccount({ ...newAccount, code: e.target.value })}
                    className="flex-1 px-3 py-2 border border-teal-300 rounded-lg text-sm font-mono text-slate-900"
                  />
                  <input
                    type="text"
                    placeholder="Nome (ex.: Doações de Terceiros)"
                    value={newAccount.name}
                    onChange={(e) => setNewAccount({ ...newAccount, name: e.target.value })}
                    className="flex-[2] px-3 py-2 border border-teal-300 rounded-lg text-sm text-slate-900"
                  />
                  <button
                    onClick={handleAddAccount}
                    className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 text-sm font-semibold"
                  >
                    Criar
                  </button>
                  <button
                    onClick={() => {
                      setShowAddAccount(false);
                      setNewAccount({ code: '', name: '' });
                    }}
                    className="px-4 py-2 bg-slate-200 text-slate-900 rounded-lg hover:bg-slate-300 text-sm font-medium"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}
            <div className="max-h-[40vh] overflow-y-auto divide-y divide-slate-100">
              {cpEntries.length === 0 && (
                <p className="text-sm text-slate-500 text-center py-6">
                  Importe o razão para alimentar o sugeridor.
                </p>
              )}
              {cpEntries.map(([cp, info]) => (
                <div key={cp} className="flex items-center gap-3 px-4 py-1.5 text-sm">
                  {/* 🆕 CORREÇÃO: texto preto/escuro */}
                  <span className="flex-1 font-medium text-slate-900">{cp}</span>
                  <span className="font-mono text-xs text-teal-700 font-semibold">{info.code}</span>
                  <span className="text-xs text-slate-700 w-56 truncate">{info.name}</span>
                  <span className="text-xs text-slate-600 font-medium">{info.hits}×</span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
// =================================================================
// FIM: frontend/src/app/dashboard/contabil/ciclo-contabil/page.tsx
// =================================================================