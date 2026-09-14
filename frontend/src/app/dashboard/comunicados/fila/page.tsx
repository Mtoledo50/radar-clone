// ============================================================================
// SPRINT F15 — Fila de Aprovacao de Comunicados
// MARCADOR F15-A: APROVAR_CHAMA_APROVAR (botoes corretos)
// ============================================================================
'use client';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

import { useEffect, useState } from 'react';

type StatusArquivoFila =
  | 'AGUARDANDO_APROVACAO'
  | 'SEM_CLIENTE'
  | 'SEM_EMAIL'
  | 'ERRO'
  | 'APROVADO'
  | 'REJEITADO'
  | 'ENVIADO';

interface ArquivoFila {
  id: string;
  nomeOriginal: string;
  cnpjDetectado: string | null;
  tipoDocumento: string | null;
  competencia: string | null;
  clienteId: string | null;
  clienteEmail: string | null;
  confianca: number;
  status: StatusArquivoFila;
  erro: string | null;
  createdAt: string;
}

export default function FilaPage() {
  const [arquivos, setArquivos] = useState<ArquivoFila[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroStatus, setFiltroStatus] = useState<StatusArquivoFila | 'TODOS'>(
    'AGUARDANDO_APROVACAO',
  );

  useEffect(() => {
    const fetchArquivos = async () => {
      try {
        const params = new URLSearchParams();
        if (filtroStatus !== 'TODOS') params.append('status', filtroStatus);
        const response = await fetch(`${API_URL}/api/arquivos-fila?${params}`);
        const data = await response.json();
        setArquivos(data.data || []);
      } catch (error) {
        console.error('Erro ao carregar arquivos:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchArquivos();
    const interval = setInterval(fetchArquivos, 5000);
    return () => clearInterval(interval);
  }, [filtroStatus]);

  // MARCADOR F15-A: botao VERDE chama /aprovar
  const aprovar = async (id: string) => {
    if (!confirm('Confirma aprovacao deste arquivo?')) return;
    try {
      const response = await fetch(
        `${API_URL}/api/arquivos-fila/${id}/aprovar`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ setor: 'Fiscal' }),
        },
      );
      if (response.ok) {
        alert('Arquivo aprovado! Email sera enviado.');
        window.location.reload();
      } else {
        const err = await response.json().catch(() => null);
        alert(`Erro ao aprovar: ${err?.message ?? response.status}`);
      }
    } catch (error) {
      console.error('Erro ao aprovar:', error);
      alert('Erro de conexao.');
    }
  };

  // MARCADOR F15-A: botao VERMELHO chama /rejeitar
  const rejeitar = async (id: string) => {
    const motivo = prompt('Motivo da rejeicao (obrigatorio):');
    if (!motivo || motivo.trim() === '') {
      alert('Motivo e obrigatorio (ADR-030).');
      return;
    }
    try {
      const response = await fetch(
        `${API_URL}/api/arquivos-fila/${id}/rejeitar`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ motivo }),
        },
      );
      if (response.ok) {
        alert('Arquivo rejeitado.');
        window.location.reload();
      } else {
        const err = await response.json().catch(() => null);
        alert(`Erro ao rejeitar: ${err?.message ?? response.status}`);
      }
    } catch (error) {
      console.error('Erro ao rejeitar:', error);
      alert('Erro de conexao.');
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-900">
          Fila de Aprovacao de Comunicados
        </h1>
        <p className="text-slate-600 mt-2">
          Revise e aprove os documentos antes do envio automatico por email.
        </p>
      </div>

      <div className="mb-6 flex gap-2 flex-wrap">
        {(
          ['TODOS', 'AGUARDANDO_APROVACAO', 'SEM_CLIENTE', 'SEM_EMAIL', 'ERRO'] as const
        ).map((status) => (
          <button
            key={status}
            onClick={() => setFiltroStatus(status)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filtroStatus === status
                ? 'bg-blue-600 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            {status === 'TODOS' && 'Todos'}
            {status === 'AGUARDANDO_APROVACAO' && 'Aguardando'}
            {status === 'SEM_CLIENTE' && 'Sem Cliente'}
            {status === 'SEM_EMAIL' && 'Sem Email'}
            {status === 'ERRO' && 'Erro'}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-12 text-slate-500">Carregando...</div>
      ) : arquivos.length === 0 ? (
        <div className="text-center py-12 bg-slate-50 rounded-lg">
          <p className="text-slate-500 text-lg">
            Nenhum arquivo na fila com o filtro selecionado.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {arquivos.map((arquivo) => (
            <ArquivoCard
              key={arquivo.id}
              arquivo={arquivo}
              onAprovar={aprovar}
              onRejeitar={rejeitar}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ArquivoCard({
  arquivo,
  onAprovar,
  onRejeitar,
}: {
  arquivo: ArquivoFila;
  onAprovar: (id: string) => void;
  onRejeitar: (id: string) => void;
}) {
  const badgeColor = {
    AGUARDANDO_APROVACAO: 'bg-yellow-100 text-yellow-800',
    SEM_CLIENTE: 'bg-orange-100 text-orange-800',
    SEM_EMAIL: 'bg-orange-100 text-orange-800',
    ERRO: 'bg-red-100 text-red-800',
    APROVADO: 'bg-green-100 text-green-800',
    REJEITADO: 'bg-slate-100 text-slate-800',
    ENVIADO: 'bg-blue-100 text-blue-800',
  }[arquivo.status];

  const confiancaColor =
    arquivo.confianca >= 0.8
      ? 'text-green-600'
      : arquivo.confianca >= 0.5
        ? 'text-yellow-600'
        : 'text-red-600';

  return (
    <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-slate-900 mb-1">
            {arquivo.nomeOriginal}
          </h3>
          <div className="flex gap-2 items-center text-sm text-slate-600">
            <span className={badgeColor + ' px-2 py-1 rounded text-xs font-medium'}>
              {arquivo.status}
            </span>
            <span className={confiancaColor + ' font-medium'}>
              Confianca: {(arquivo.confianca * 100).toFixed(0)}%
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
        <div>
          <span className="text-slate-500">CNPJ:</span>{' '}
          <span className="font-mono text-slate-900">
            {arquivo.cnpjDetectado || 'N/A'}
          </span>
        </div>
        <div>
          <span className="text-slate-500">Tipo:</span>{' '}
          <span className="font-medium text-slate-900">
            {arquivo.tipoDocumento || 'N/A'}
          </span>
        </div>
        <div>
          <span className="text-slate-500">Competencia:</span>{' '}
          <span className="text-slate-900">{arquivo.competencia || 'N/A'}</span>
        </div>
        <div>
          <span className="text-slate-500">Email:</span>{' '}
          <span className="text-slate-900">{arquivo.clienteEmail || 'N/A'}</span>
        </div>
      </div>

      {arquivo.erro && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-800">
          <strong>Erro:</strong> {arquivo.erro}
        </div>
      )}

      {arquivo.status === 'AGUARDANDO_APROVACAO' && (
        <div className="flex gap-2">
          <button
            onClick={() => onAprovar(arquivo.id)}
            className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700 transition-colors"
          >
            Aprovar Envio
          </button>
          <button
            onClick={() => onRejeitar(arquivo.id)}
            className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-red-700 transition-colors"
          >
            Rejeitar
          </button>
        </div>
      )}

      {arquivo.status === 'SEM_CLIENTE' && (
        <div className="p-3 bg-orange-50 border border-orange-200 rounded text-sm text-orange-800">
          Cliente nao encontrado. Use o vinculo manual.
        </div>
      )}

      {arquivo.status === 'SEM_EMAIL' && (
        <div className="p-3 bg-orange-50 border border-orange-200 rounded text-sm text-orange-800">
          Cliente encontrado mas sem email.
        </div>
      )}
    </div>
  );
}