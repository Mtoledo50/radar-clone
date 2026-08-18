// =================================================================
// INÍCIO: frontend/src/app/dashboard/funcionario-digital/nfse/page.tsx
// =================================================================
// 📥 NFS-e — Importação e gestão de notas de serviço (FD-3a)
//
// Funcionalidades:
//   - KPIs de status (Total, Importadas, Em revisão 🟡, Contabilizadas)
//   - Upload de XML individual (body { xml, clientId? })
//   - Botão "Reprocessar caixa" (dispara NFSE_IMPORT em lote)
//   - Tabela com todas as NFS-e do tenant
//   - Filtros: status, direção (emitida/recebida), busca livre
//   - Modal "Ver XML original" (preserva rawXml p/ auditoria — ADR-036)
//   - Destaque visual para registros em REVISÃO (linha amarela)
//
// ADRs aplicadas:
//   - ADR-001 (Tailwind, sem libs pesadas de tabela)
//   - ADR-021 (Lucide com <span title> wrapper)
//   - ADR-023 (?.map em opcionais)
//   - ADR-036 (ABRASF 2.0; rawXml preservado; nunca descarta)
//   - ADR-037 (source como atributo; e-mail/portal/OCR amanhã usam o mesmo canal)
// =================================================================
'use client';

import { useEffect, useState, useMemo, useRef } from 'react';
import {
  Receipt,
  Upload,
  RefreshCw,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  Eye,
  X,
  ArrowLeft,
  Building2,
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
// ✅ Usa a mesma instância do axios que o resto do projeto (com interceptor JWT)
import api from '@/lib/axios';

// -----------------------------------------------------------------
// Tipos (espelham o backend)
// -----------------------------------------------------------------
interface Nfse {
  id: string;
  number: string;
  series: string;
  verificationCode?: string;
  emissionDate: string;
  competenceDate?: string;
  issuerCnpj: string;
  issuerName: string;
  takerCnpj?: string;
  takerName?: string;
  serviceValue: string;
  issBase: string;
  issRate: string;
  issValue: string;
  issRetained: boolean;
  serviceCode?: string;
  serviceDescription?: string;
  municipalityCode?: string;
  direction: 'EMITIDA' | 'RECEBIDA';
  source: string;
  status: 'IMPORTED' | 'REVIEW' | 'ACCOUNTED' | 'REJECTED';
  rawXml?: string;
  client?: { id: string; companyName: string } | null;
}

const formatBRL = (v: string | number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
    Number(v) || 0,
  );

const statusConfig = {
  IMPORTED: {
    label: 'Importada',
    bg: 'bg-green-100',
    text: 'text-green-800',
    icon: CheckCircle2,
  },
  REVIEW: {
    label: 'Revisão 🟡',
    bg: 'bg-yellow-100',
    text: 'text-yellow-800',
    icon: AlertCircle,
  },
  ACCOUNTED: {
    label: 'Contabilizada',
    bg: 'bg-blue-100',
    text: 'text-blue-800',
    icon: CheckCircle2,
  },
  REJECTED: {
    label: 'Rejeitada',
    bg: 'bg-red-100',
    text: 'text-red-800',
    icon: X,
  },
};

// -----------------------------------------------------------------
// Componente principal
// -----------------------------------------------------------------
export default function NfsePage() {
  const [items, setItems] = useState<Nfse[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  // Upload
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadClientId, setUploadClientId] = useState('');

  // Filtros
  const [statusFilter, setStatusFilter] = useState('');
  const [directionFilter, setDirectionFilter] = useState('');
  const [searchFilter, setSearchFilter] = useState('');

  // Modal de XML
  const [xmlModal, setXmlModal] = useState<Nfse | null>(null);

  // -----------------------------------------------------------------
  // Fetch (via api do axios — token injetado automaticamente)
  // -----------------------------------------------------------------
  const fetchAll = async () => {
    try {
      setLoading(true);
      const params: Record<string, string> = {};
      if (statusFilter) params.status = statusFilter;
      const res = await api.get('/digital-employee/nfse', { params });
      setItems(res.data.value || []);
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Erro ao carregar NFS-e');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, [statusFilter]);

  // -----------------------------------------------------------------
  // Ações
  // -----------------------------------------------------------------
  const handleReprocessInbox = async () => {
    if (
      !confirm(
        'Reprocessar a caixa de entrada de NFS-e?\n(XMLs em uploads/nfse-inbox)',
      )
    )
      return;
    try {
      setProcessing(true);
      toast.loading('Reprocessando caixa...');
      const res = await api.post('/digital-employee/skills/NFSE_IMPORT/run');
      const data = res.data;
      toast.dismiss();
      if (data.status === 'SUCCESS') {
        toast.success(
          `✅ ${data.result.itemsProcessed} processadas (${data.result.itemsPendingHuman} p/ revisão)`,
        );
      } else {
        toast.warning(`⚠️ Parcial: ${data.result.itemsFailed} falhas`);
      }
      fetchAll();
    } catch (e: any) {
      toast.dismiss();
      toast.error(e?.response?.data?.message || 'Erro');
    } finally {
      setProcessing(false);
    }
  };

  const handleUploadXml = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.name.toLowerCase().endsWith('.xml')) {
      toast.error('Selecione um arquivo .xml');
      return;
    }
    try {
      toast.loading('Enviando XML...');
      const xml = await file.text();
      const body: any = { xml };
      if (uploadClientId.trim()) body.clientId = uploadClientId.trim();
      await api.post('/digital-employee/nfse/upload', body);
      toast.dismiss();
      toast.success(
        '📥 XML enviado para a caixa. Clique em "Reprocessar" para importar.',
      );
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err: any) {
      toast.dismiss();
      toast.error(err?.response?.data?.message || 'Erro no upload');
    }
  };

  // -----------------------------------------------------------------
  // Filtros em memória (direção e busca)
  // -----------------------------------------------------------------
  const filtered = useMemo(() => {
    let result = items;
    if (directionFilter) {
      result = result.filter((i) => i.direction === directionFilter);
    }
    if (searchFilter.trim()) {
      const q = searchFilter.toLowerCase();
      result = result.filter(
        (i) =>
          i.issuerName.toLowerCase().includes(q) ||
          (i.takerName || '').toLowerCase().includes(q) ||
          i.issuerCnpj.includes(q) ||
          (i.takerCnpj || '').includes(q) ||
          i.number.includes(q),
      );
    }
    return result;
  }, [items, directionFilter, searchFilter]);

  // Contadores
  const stats = useMemo(
    () => ({
      total: items.length,
      imported: items.filter((i) => i.status === 'IMPORTED').length,
      review: items.filter((i) => i.status === 'REVIEW').length,
      accounted: items.filter((i) => i.status === 'ACCOUNTED').length,
    }),
    [items],
  );

  // -----------------------------------------------------------------
  // Render
  // -----------------------------------------------------------------
  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/funcionario-digital"
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <span title="Voltar para a Aurora">
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </span>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Receipt className="w-7 h-7 text-teal-600" />
              NFS-e — Notas de Serviço
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Importação automática (ABRASF 2.0) — Aurora processa a caixa
              todo dia às 09:00
            </p>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          <label className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-lg font-medium text-sm cursor-pointer shadow-sm">
            <span title="Enviar XML">
              <Upload className="w-4 h-4" />
            </span>
            Enviar XML
            <input
              ref={fileInputRef}
              type="file"
              accept=".xml"
              onChange={handleUploadXml}
              className="hidden"
            />
          </label>
          <button
            onClick={handleReprocessInbox}
            disabled={processing}
            className="flex items-center gap-2 px-4 py-2.5 bg-teal-600 hover:bg-teal-700
                       disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg
                       font-medium text-sm transition-colors shadow-sm"
          >
            <RefreshCw
              className={`w-4 h-4 ${processing ? 'animate-spin' : ''}`}
            />
            {processing ? 'Reprocessando...' : 'Reprocessar caixa'}
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
          <p className="text-xs text-gray-500 font-medium">Total</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">
            {stats.total}
          </p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
          <p className="text-xs text-green-600 font-medium">Importadas</p>
          <p className="text-2xl font-bold text-green-700 mt-1">
            {stats.imported}
          </p>
        </div>
        <div className="bg-yellow-50 rounded-xl p-4 border border-yellow-200 shadow-sm">
          <p className="text-xs text-yellow-700 font-medium">
            Em revisão 🟡
          </p>
          <p className="text-2xl font-bold text-yellow-800 mt-1">
            {stats.review}
          </p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
          <p className="text-xs text-blue-600 font-medium">Contabilizadas</p>
          <p className="text-2xl font-bold text-blue-700 mt-1">
            {stats.accounted}
          </p>
        </div>
      </div>

      {/* Upload com cliente vinculado (opcional) */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="flex items-center gap-3 flex-wrap">
          <span title="Cliente">
            <Building2 className="w-4 h-4 text-gray-500" />
          </span>
          <span className="text-sm font-medium text-gray-700">
            Vincular upload a cliente (opcional):
          </span>
          <input
            type="text"
            value={uploadClientId}
            onChange={(e) => setUploadClientId(e.target.value)}
            placeholder="Cole o clientId aqui (ou deixe vazio para auto-detectar por CNPJ)"
            className="flex-1 min-w-[300px] px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="flex items-center gap-2 mb-3">
          <Filter className="w-4 h-4 text-gray-500" />
          <span className="text-sm font-medium text-gray-700">Filtros</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
            <option value="">Todos os status</option>
            <option value="IMPORTED">Importada</option>
            <option value="REVIEW">Revisão 🟡</option>
            <option value="ACCOUNTED">Contabilizada</option>
            <option value="REJECTED">Rejeitada</option>
          </select>

          <select
            value={directionFilter}
            onChange={(e) => setDirectionFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
            <option value="">Emitidas e recebidas</option>
            <option value="EMITIDA">Emitidas (receita)</option>
            <option value="RECEBIDA">Recebidas (despesa)</option>
          </select>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              placeholder="Buscar prestador, tomador, CNPJ, número..."
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
        </div>
      </div>

      {/* Tabela */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">
            {filtered.length} NFS-e
          </h2>
          <button
            onClick={fetchAll}
            className="text-xs font-medium text-teal-700 hover:text-teal-900 flex items-center gap-1"
          >
            <RefreshCw className="w-3 h-3" />
            Atualizar
          </button>
        </div>

        {loading ? (
          <div className="p-12 text-center text-gray-400">
            <RefreshCw className="w-8 h-8 mx-auto mb-2 animate-spin" />
            Carregando...
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <Receipt className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p className="text-gray-500 font-medium">
              Nenhuma NFS-e encontrada
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Envie um XML ou aguarde a coleta automática (todo dia às
              09:00).
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold text-gray-700">
                    Número
                  </th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-700">
                    Prestador
                  </th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-700">
                    Tomador
                  </th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-700">
                    Emissão
                  </th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-700">
                    Valor
                  </th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-700">
                    ISS
                  </th>
                  <th className="text-center px-4 py-3 font-semibold text-gray-700">
                    Direção
                  </th>
                  <th className="text-center px-4 py-3 font-semibold text-gray-700">
                    Status
                  </th>
                  <th className="text-center px-4 py-3 font-semibold text-gray-700">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((n) => {
                  const StatusIcon = statusConfig[n.status].icon;
                  const isReview = n.status === 'REVIEW';
                  return (
                    <tr
                      key={n.id}
                      className={`hover:bg-gray-50 transition-colors ${
                        isReview ? 'bg-yellow-50/50' : ''
                      }`}
                    >
                      <td className="px-4 py-3">
                        <div className="font-mono text-gray-900">
                          {n.number}
                        </div>
                        {n.verificationCode && (
                          <div className="text-xs text-gray-500">
                            {n.verificationCode}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900">
                          {n.issuerName}
                        </div>
                        <div className="text-xs text-gray-500">
                          {n.issuerCnpj}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-gray-900">
                          {n.takerName || '—'}
                        </div>
                        <div className="text-xs text-gray-500">
                          {n.takerCnpj || ''}
                        </div>
                        {n.client && (
                          <div className="text-xs text-teal-700 mt-0.5">
                            → {n.client.companyName}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-700">
                        {new Date(n.emissionDate).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-gray-900">
                        {formatBRL(n.serviceValue)}
                      </td>
                      <td className="px-4 py-3 text-right text-gray-700">
                        {formatBRL(n.issValue)}
                        <div className="text-xs text-gray-500">
                          {n.issRate}%
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                            n.direction === 'EMITIDA'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {n.direction === 'EMITIDA' ? 'Emitida' : 'Recebida'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${statusConfig[n.status].bg} ${statusConfig[n.status].text}`}
                        >
                          <StatusIcon className="w-3 h-3" />
                          {statusConfig[n.status].label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-1">
                          {n.rawXml && (
                            <button
                              onClick={() => setXmlModal(n)}
                              className="p-1.5 rounded hover:bg-gray-100 text-gray-600"
                            >
                              <span title="Ver XML original">
                                <Eye className="w-4 h-4" />
                              </span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal de XML original (preserva ADR-036 — nunca descarta) */}
      {xmlModal && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => setXmlModal(null)}
        >
          <div
            className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[80vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-gray-900">
                  NFS-e #{xmlModal.number} — XML original
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  {xmlModal.issuerName}
                </p>
              </div>
              <button
                onClick={() => setXmlModal(null)}
                className="p-1.5 rounded hover:bg-gray-100"
              >
                <span title="Fechar">
                  <X className="w-5 h-5 text-gray-500" />
                </span>
              </button>
            </div>
            <pre className="flex-1 overflow-auto p-6 text-xs bg-gray-50 font-mono text-gray-800 whitespace-pre-wrap">
              {xmlModal.rawXml}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}
// =================================================================
// FIM: nfse/page.tsx
// =================================================================