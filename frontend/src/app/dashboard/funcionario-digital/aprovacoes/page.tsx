// =================================================================
// INÍCIO: frontend/src/app/dashboard/funcionario-digital/aprovacoes/page.tsx
// =================================================================
// 🟡 CENTRAL DE APROVAÇÕES DA AURORA (FD-2 final)
//
// Tela onde o contador revisa as pendências que a Aurora enfileirou
// (score 50–79%): inspeciona detalhes (👁), escreve notas e aprova/rejeita.
//
// Fluxo: aprovar/rejeitar → POST /pending/:id/resolve →
//   1. AutomationPending vira APPROVED/REJECTED
//   2. ApprovalRecord criado (trava de transmissão — Regra de Ouro)
//   3. Auditoria USER_APPROVED/USER_REJECTED registrada
//   4. (CLASSIFICATION aprovada) natureza aplicada na transação
//
// ADRs: ADR-021 (tooltips via <span title>) • ADR-023 (?. em listas) •
// ADR-024 (toasts Sonner simples). Cores: teal/laranja/cinza.
// =================================================================
'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Eye,
  Search,
  Inbox,
  Tag,
  Link2,
  ClipboardCheck,
} from 'lucide-react';
import { useDigitalEmployee } from '@/lib/hooks/useDigitalEmployee';
import api from '@/lib/axios';

// -----------------------------------------------------------------
// Metadados por tipo de pendência (badge + ícone + cor)
// -----------------------------------------------------------------
const TYPE_META: Record<string, { label: string; icon: any; classes: string }> = {
  CLASSIFICATION: { label: 'Classificação', icon: Tag, classes: 'bg-purple-50 text-purple-700' },
  MATCH: { label: 'Conciliação', icon: Link2, classes: 'bg-teal-50 text-teal-700' },
};

// Helpers de formatação (PT-BR)
const formatBRL = (v: any) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(v || 0));

const formatDT = (iso?: string | null) =>
  iso
    ? new Date(iso).toLocaleString('pt-BR', {
        day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
      })
    : '—';

// Cor do badge de confiança (régua 80/50 das skills)
const confidenceClasses = (c?: number | null) =>
  (c ?? 0) >= 80 ? 'bg-green-100 text-green-700'
  : (c ?? 0) >= 50 ? 'bg-orange-100 text-orange-700'
  : 'bg-red-100 text-red-700';

// -----------------------------------------------------------------
// Dossiê da pendência (payload por tipo)
// -----------------------------------------------------------------
function PayloadDetails({ pending }: { pending: any }) {
  const p = pending?.payload || {};

  if (pending?.type === 'CLASSIFICATION') {
    return (
      <div className="space-y-2 text-sm">
        <p><span className="text-gray-500">Descrição:</span> <b>{p?.description || '—'}</b></p>
        <p><span className="text-gray-500">Valor:</span> <b>{formatBRL(p?.amount)}</b></p>
        <p>
          <span className="text-gray-500">Natureza sugerida:</span>{' '}
          <b className="text-purple-700">{p?.suggestedNature || '—'}</b>
        </p>
      </div>
    );
  }

  if (pending?.type === 'MATCH') {
    return (
      <div className="space-y-2 text-sm">
        <p><span className="text-gray-500">Valor no banco:</span> <b>{formatBRL(p?.bankAmount)}</b></p>
        <p><span className="text-gray-500">Valor na NF-e:</span> <b>{formatBRL(p?.invoiceTotal)}</b></p>
        {p?.breakdown && (
          <p className="text-xs text-gray-500">
            Breakdown do score: <code>{JSON.stringify(p.breakdown)}</code>
          </p>
        )}
      </div>
    );
  }

  return <pre className="text-xs bg-gray-50 p-3 rounded overflow-auto">{JSON.stringify(p, null, 2)}</pre>;
}

// =================================================================
// COMPONENTE PRINCIPAL — Central de Aprovações
// =================================================================
export default function AprovacoesPage() {
  const { pendings, fetchAll } = useDigitalEmployee();

  // Filtros locais
  const [filterType, setFilterType] = useState<'ALL' | 'CLASSIFICATION' | 'MATCH'>('ALL');
  const [search, setSearch] = useState('');

  // Modal de revisão (pendência selecionada + nota do contador)
  const [selected, setSelected] = useState<any | null>(null);
  const [notes, setNotes] = useState('');
  const [busy, setBusy] = useState(false);

  // Lista filtrada (tipo + busca) — ADR-023
  const filtered = useMemo(() => {
    const list = pendings || [];
    return list
      .filter((p: any) => (filterType === 'ALL' ? true : p?.type === filterType))
      .filter((p: any) => {
        if (!search) return true;
        const hay = `${p?.payload?.description || ''} ${p?.payload?.suggestedNature || ''}`.toLowerCase();
        return hay.includes(search.toLowerCase());
      });
  }, [pendings, filterType, search]);

  // Resolver pendência (aprovar/rejeitar) com nota opcional
  const resolve = async (id: string, decision: 'APPROVED' | 'REJECTED', note?: string) => {
    setBusy(true);
    try {
      await api.post(`/digital-employee/pending/${id}/resolve`, {
        decision,
        ...(note ? { notes: note } : {}),
      });
      toast.success(
        decision === 'APPROVED'
          ? '✅ Aprovado! Decisão gravada no ApprovalRecord + auditoria.'
          : '❌ Rejeitado. Decisão registrada — a Aurora aprende com isso.',
      );
      setSelected(null);
      setNotes('');
      await fetchAll(); // refresca fila + KPIs + auditoria
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Erro ao resolver pendência.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* ===== Header ===== */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/funcionario-digital"
            className="p-2 rounded-lg hover:bg-gray-100 text-gray-500"
          >
            <span title="Voltar para a mesa da Aurora"><ArrowLeft className="w-5 h-5" /></span>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <ClipboardCheck className="w-6 h-6 text-orange-500" />
              Central de Aprovações
            </h1>
            <p className="text-sm text-gray-500">
              O que a Aurora não teve certeza (50–79%) espera sua decisão aqui.
            </p>
          </div>
        </div>
        <span className="text-sm bg-orange-100 text-orange-700 px-3 py-1 rounded-full font-medium">
          {filtered.length} pendência(s)
        </span>
      </div>

      {/* ===== Barra de filtros ===== */}
      <div className="flex items-center gap-3 flex-wrap bg-white p-3 rounded-xl border border-gray-200">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por descrição ou natureza..."
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value as any)}
          className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
        >
          <option value="ALL">Todos os tipos</option>
          <option value="CLASSIFICATION">Classificação</option>
          <option value="MATCH">Conciliação</option>
        </select>
      </div>

      {/* ===== Lista de pendências ===== */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <Inbox className="w-10 h-10 text-green-400 mx-auto mb-3" />
          <p className="text-gray-600 font-medium">Tudo em dia! Nenhuma pendência aguardando revisão.</p>
          <p className="text-sm text-gray-400 mt-1">
            Quando a Aurora tiver dúvida (score 50–79%), o item aparece aqui.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered?.map((p: any) => {
            const meta = TYPE_META[p?.type] || TYPE_META.CLASSIFICATION;
            const Icon = meta.icon;
            return (
              <div
                key={p.id}
                className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-4 flex-wrap hover:shadow-sm transition"
              >
                <div className={`p-2 rounded-lg ${meta.classes}`}>
                  <Icon className="w-5 h-5" />
                </div>

                <div className="flex-1 min-w-[220px]">
                  <p className="font-medium text-gray-900 text-sm">
                    {p?.payload?.description || p?.type}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {meta.label} • {formatDT(p?.createdAt)}
                    {p?.payload?.amount ? ` • ${formatBRL(p.payload.amount)}` : ''}
                    {p?.payload?.suggestedNature ? ` • sugerido: ${p.payload.suggestedNature}` : ''}
                  </p>
                </div>

                <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${confidenceClasses(p?.confidence)}`}>
                  {p?.confidence != null ? `${Number(p.confidence).toFixed(0)}%` : '—'}
                </span>

                {/* Ações: 👁 detalhes+nota • ✅ aprovar direto • ❌ rejeitar direto */}
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => { setSelected(p); setNotes(''); }}
                    className="p-2 rounded-lg hover:bg-gray-100 text-gray-500"
                  >
                    <span title="Ver detalhes e escrever nota"><Eye className="w-4 h-4" /></span>
                  </button>
                  <button
                    onClick={() => resolve(p.id, 'APPROVED')}
                    disabled={busy}
                    className="p-2 rounded-lg hover:bg-green-50 text-green-600"
                  >
                    <span title="Aprovar direto (sem nota)"><CheckCircle2 className="w-4 h-4" /></span>
                  </button>
                  <button
                    onClick={() => resolve(p.id, 'REJECTED')}
                    disabled={busy}
                    className="p-2 rounded-lg hover:bg-red-50 text-red-600"
                  >
                    <span title="Rejeitar direto (sem nota)"><XCircle className="w-4 h-4" /></span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ===== Modal de revisão (detalhes + nota) ===== */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setSelected(null)}
            aria-hidden="true"
          />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">Revisar pendência</h2>
              <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${confidenceClasses(selected?.confidence)}`}>
                confiança {selected?.confidence != null ? `${Number(selected.confidence).toFixed(0)}%` : '—'}
              </span>
            </div>

            <PayloadDetails pending={selected} />

            <div>
              <label className="text-xs font-medium text-gray-600 block mb-1">
                Nota da revisão (opcional, mas recomendada)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                placeholder="Ex.: confirmado com o cliente; natureza correta é X..."
                className="w-full text-sm border border-gray-200 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => resolve(selected.id, 'REJECTED', notes || undefined)}
                disabled={busy}
                className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-medium disabled:opacity-50"
              >
                ❌ Rejeitar
              </button>
              <button
                onClick={() => resolve(selected.id, 'APPROVED', notes || undefined)}
                disabled={busy}
                className="px-4 py-2 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-sm font-medium disabled:opacity-50"
              >
                ✅ Aprovar com nota
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
// =================================================================
// FIM: aprovacoes/page.tsx
// =================================================================