'use client';

// =================================================================
// frontend/src/app/dashboard/fechamento/extrato-pdf/page.tsx
// =================================================================
/**
 * 🧾 ADR-098 — Extratos PDF → CSV
 * 🆕 Sprint F11-a (ADR-048) — Unificação com o Extrator Bancário Python
 *
 * Cadeia de extração:
 *   1) Extrator Python (FastAPI :8000) — parsers específicos + Mistral OCR
 *   2) Fallback nativo do NestJS (adapters existentes) se o Python estiver fora
 *
 * A página continua exibindo preview + CSV + importação p/ contábil,
 * independente de qual motor processou.
 */
import { useEffect, useRef, useState } from 'react';
import api from '@/lib/axios';
import { toast } from 'sonner';
import { FileUp, Loader2, Download, Upload } from 'lucide-react';
import { useClientContextStore } from '@/store/clientContextStore';

interface Row {
  date: string;
  description: string;
  debit: number;
  credit: number;
}

export default function ExtratoPdfPage() {
  const { activeClientId } = useClientContextStore();
  const [clients, setClients] = useState<any[]>([]);
  const [clientId, setClientId] = useState('');
  const [adapters, setAdapters] = useState<{ id: string; label: string }[]>([]);
  const [bank, setBank] = useState('auto');
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<any | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  // 🆕 F11-a: qual motor processou o último upload
  const [engine, setEngine] = useState<string | null>(null);

  // ---------------------------------------------------------------
  // Carrega clientes + lista de adaptadores do backend
  // ---------------------------------------------------------------
  useEffect(() => {
    (async () => {
      try {
        const [c, a] = await Promise.all([
          api.get('/clients'),
          api.get('/accounting/pdf-adapters'),
        ]);
        const list = c.data.data || c.data || [];
        setClients(list);
        setAdapters(a.data.data || []);
        const saved = list.find((x: any) => x.id === activeClientId);
        if (saved) setClientId(saved.id);
      } catch {
        toast.error('Erro ao carregar a página.');
      }
    })();
  }, []);

  // ---------------------------------------------------------------
  // 🆕 F11-a: upload UNIFICADO
  // Endpoint /extract-pdf-unified decide Python vs nativo no backend.
  // A resposta tem shape {success, engine, data}
  // ---------------------------------------------------------------
  async function handleUpload(file: File) {
    console.log('📤 Enviando arquivo:', {
      name: file.name,
      size: file.size,
      type: file.type,
    });

    setBusy(true);
    setResult(null);
    setEngine(null);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('bank', bank);

      console.log('📋 FormData criado:', {
        hasFile: fd.has('file'),
        hasBank: fd.has('bank'),
      });

      // 🆕 F11-a: endpoint UNIFICADO (proxy Python → fallback nativo)
      const res = await api.post('/accounting/extract-pdf-unified', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      console.log('📨 Resposta recebida:', res.data);

      if (!res.data.success) {
        toast.error(res.data.message || 'Falha na extração.');
        return;
      }

      // 🆕 F11-a: guarda qual motor processou (badge da UI)
      setEngine(res.data.engine || 'nativo');
      setResult(res.data.data);
      toast.success(
        `${res.data.data.bankLabel}: ${res.data.data.totalRows} lançamento(s) • ` +
          (res.data.engine === 'extrator-python'
            ? 'motor: Extrator Python (OCR)'
            : 'motor: adaptadores nativos'),
      );
    } catch (e: any) {
      console.error('❌ Erro no upload:', e);
      toast.error(e.response?.data?.message || 'Erro ao extrair o PDF.');
    } finally {
      setBusy(false);
    }
  }

  // ---------------------------------------------------------------
  // Gera CSV padrão (UTF-8 + BOM para o Excel acentuar corretamente)
  // ---------------------------------------------------------------
  function buildCsv(): string {
    if (!result) return '';
    const lines = ['Data;Débito;Crédito;Complemento;CNPJ'];
    for (const r of result.rows as Row[]) {
      lines.push(
        `${r.date};${r.debit ? r.debit.toFixed(2) : ''};${r.credit ? r.credit.toFixed(2) : ''};${r.description};`,
      );
    }
    return lines.join('\n');
  }

  function downloadCsv() {
    const blob = new Blob(['\uFEFF' + buildCsv()], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `extrato-${result.bank || result.bankLabel || 'banco'}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('CSV padrão baixado.');
  }

  async function importToSci() {
    if (!clientId) return toast.error('Selecione o cliente para importar.');
    try {
      const res = await api.post('/accounting/history/import-statement', {
        clientId,
        content: buildCsv(),
      });
      const d = res.data.data;
      toast.success(
        `Importado p/ contábil: ${d.imported} PENDENTE(S)` +
          (d.duplicadosIgnorados
            ? ` • ${d.duplicadosIgnorados} duplicado(s) bloqueado(s).`
            : ''),
      );
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Erro ao importar.');
    }
  }

  const fmt = (v: number) =>
    Number(v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Extratos PDF → CSV</h1>
        <p className="text-sm text-slate-600 mt-1">
          Envie o PDF do banco (ou deixe o sistema detectar) e gere o CSV padrão de conciliação.
        </p>
      </div>

      {/* Seleção de cliente + banco */}
      <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-slate-700">
              Cliente destino
            </label>
            <select
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-slate-900"
            >
              <option value="">— Selecione —</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.companyName}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-slate-700">
              Banco do extrato
            </label>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setBank('auto')}
                className={`rounded-full border px-3 py-1.5 text-xs font-bold transition-colors ${
                  bank === 'auto'
                    ? 'border-teal-600 bg-teal-600 text-white'
                    : 'border-slate-300 bg-white text-slate-600 hover:border-teal-400'
                }`}
              >
                Auto-detectar
              </button>
              {adapters.map((a) => (
                <button
                  key={a.id}
                  onClick={() => setBank(a.id)}
                  className={`rounded-full border px-3 py-1.5 text-xs font-bold transition-colors ${
                    bank === a.id
                      ? 'border-teal-600 bg-teal-600 text-white'
                      : 'border-slate-300 bg-white text-slate-600 hover:border-teal-400'
                  }`}
                >
                  {a.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <input
          ref={fileRef}
          type="file"
          accept="application/pdf"
          hidden
          onChange={(e) => {
            const f = e.target.files?.[0];
            e.target.value = ''; // 🛡️ permite reenviar o mesmo arquivo
            if (f) handleUpload(f);
          }}
        />
        <button
          onClick={() => fileRef.current?.click()}
          disabled={busy}
          className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-teal-300 px-4 py-3 font-semibold text-teal-700 transition-colors hover:bg-teal-50 disabled:opacity-50"
        >
          {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : <FileUp className="h-5 w-5" />}
          {busy ? 'Extraindo...' : 'Enviar PDF do extrato'}
        </button>
      </div>

      {/* Resultado */}
      {result && (
        <>
          {/* 🆕 F11-a: badge do motor + cabeçalho do extrato (quando disponível) */}
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`rounded-full px-3 py-1 text-xs font-bold ${
                engine === 'extrator-python'
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-slate-100 text-slate-600 border border-slate-200'
              }`}
            >
              {engine === 'extrator-python'
                ? '🐍 Motor: Extrator Python (parsers + OCR)'
                : '🧩 Motor: Adaptadores nativos'}
            </span>
            {result.agencia && (
              <span className="text-xs text-slate-500">
                Ag {result.agencia} • Conta {result.conta} • Comp {result.competencia}
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <div className="rounded-xl border border-slate-200 bg-white p-4 text-center">
              <p className="text-xs font-semibold uppercase text-slate-500">Banco detectado</p>
              <p className="text-lg font-bold text-teal-700">{result.bankLabel}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-4 text-center">
              <p className="text-xs font-semibold uppercase text-slate-500">Lançamentos</p>
              <p className="text-lg font-bold text-slate-900">{result.totalRows}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-4 text-center">
              <p className="text-xs font-semibold uppercase text-slate-500">Débitos</p>
              <p className="text-lg font-bold text-red-600">R$ {fmt(result.totalDebit)}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-4 text-center">
              <p className="text-xs font-semibold uppercase text-slate-500">Créditos</p>
              <p className="text-lg font-bold text-emerald-600">R$ {fmt(result.totalCredit)}</p>
            </div>
          </div>

          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 p-4">
              <h3 className="font-bold text-slate-900">Pré-visualização (primeiros 50)</h3>
              <div className="flex gap-2">
                <button
                  onClick={downloadCsv}
                  className="flex items-center gap-2 rounded-lg bg-slate-700 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
                >
                  <Download className="h-4 w-4" /> Baixar CSV padrão
                </button>
                <button
                  onClick={importToSci}
                  className="flex items-center gap-2 rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700"
                >
                  <Upload className="h-4 w-4" /> Importar p/ Contábil
                </button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-slate-200 bg-slate-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-bold uppercase text-slate-600">
                      Data
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-bold uppercase text-slate-600">
                      Complemento
                    </th>
                    <th className="px-4 py-2 text-right text-xs font-bold uppercase text-slate-600">
                      Débito
                    </th>
                    <th className="px-4 py-2 text-right text-xs font-bold uppercase text-slate-600">
                      Crédito
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {(result.rows as Row[]).slice(0, 50).map((r, i) => (
                    <tr key={i} className="hover:bg-slate-50">
                      <td className="whitespace-nowrap px-4 py-2 text-sm text-slate-900">
                        {r.date}
                      </td>
                      <td className="max-w-md truncate px-4 py-2 text-sm text-slate-700">
                        {r.description}
                      </td>
                      <td className="px-4 py-2 text-right text-sm text-red-600">
                        {r.debit ? fmt(r.debit) : '-'}
                      </td>
                      <td className="px-4 py-2 text-right text-sm text-emerald-600">
                        {r.credit ? fmt(r.credit) : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
// =================================================================
// FIM: extrato-pdf/page.tsx
// =================================================================