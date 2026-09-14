// ============================================================================
// SPRINT F15 — Tela de Histórico de Envios de Email
// ----------------------------------------------------------------------------
// OBJETIVO:
//   Listar todos os emails enviados com timeline de eventos:
//   ENVIADO → ABERTO → BAIXADO
//
// FUNCIONALIDADES:
//   1. Lista todos os envios (EmailEnvio)
//   2. Mostra timeline visual de eventos
//   3. Tooltips com data/hora ao passar o mouse nos ícones
//   4. Modal com detalhes completos (eventos, preview, download)
// ============================================================================
'use client';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

import { useEffect, useState } from 'react';

interface EmailEvento {
  id: string;
  tipo: 'ENVIADO' | 'ABERTO' | 'BAIXADO' | 'FALHA';
  ip: string | null;
  userAgent: string | null;
  metadata: any;
  createdAt: string;
}

interface EmailEnvio {
  id: string;
  clienteNome: string;
  clienteCnpj: string | null;
  emailDestinatario: string;
  assunto: string;
  corpoHtml: string;
  status: 'AGENDADO' | 'ENVIADO' | 'FALHOU';
  tokenDownload: string;
  primeiraAberturaEm: string | null;
  primeiroDownloadEm: string | null;
  enviadoEm: string | null;
  eventos: EmailEvento[];
}

export default function EnviosPage() {
  const [envios, setEnvios] = useState<EmailEnvio[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEnvio, setSelectedEnvio] = useState<EmailEnvio | null>(null);

  // -------------------------------------------------------------------------
  // CARREGAR ENVIOS
  // -------------------------------------------------------------------------
  useEffect(() => {
    const fetchEnvios = async () => {
      try {
        const response = await fetch(`${API_URL}/api/email-envios`);
        const data = await response.json();
        setEnvios(data.data || []);
      } catch (error) {
        console.error('Erro ao carregar envios:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchEnvios();
  }, []);

  // -------------------------------------------------------------------------
  // CALCULAR MÉTRICAS
  // -------------------------------------------------------------------------
  const metricas = {
    total: envios.length,
    enviados: envios.filter((e) => e.status === 'ENVIADO').length,
    abertos: envios.filter((e) => e.primeiraAberturaEm).length,
    baixados: envios.filter((e) => e.primeiroDownloadEm).length,
  };

  const taxaAbertura =
    metricas.enviados > 0
      ? ((metricas.abertos / metricas.enviados) * 100).toFixed(1)
      : '0.0';

  // -------------------------------------------------------------------------
  // RENDER
  // -------------------------------------------------------------------------
  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* HEADER */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-900">
          📧 Histórico de Envios de Email
        </h1>
        <p className="text-slate-600 mt-2">
          Acompanhe o ciclo completo: envio → abertura → download do documento.
        </p>
      </div>

      {/* MÉTRICAS */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <p className="text-sm text-slate-500">Total</p>
          <p className="text-2xl font-bold text-slate-900">{metricas.total}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <p className="text-sm text-slate-500">Enviados</p>
          <p className="text-2xl font-bold text-blue-600">{metricas.enviados}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <p className="text-sm text-slate-500">Abertos</p>
          <p className="text-2xl font-bold text-yellow-600">{metricas.abertos}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <p className="text-sm text-slate-500">Baixados</p>
          <p className="text-2xl font-bold text-green-600">{metricas.baixados}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <p className="text-sm text-slate-500">Taxa de Abertura</p>
          <p className="text-2xl font-bold text-purple-600">{taxaAbertura}%</p>
        </div>
      </div>

      {/* LISTA DE ENVIOS */}
      {loading ? (
        <div className="text-center py-12 text-slate-500">Carregando envios...</div>
      ) : envios.length === 0 ? (
        <div className="text-center py-12 bg-slate-50 rounded-lg">
          <p className="text-slate-500 text-lg">
            ✅ Nenhum envio registrado ainda.
          </p>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Cliente
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Assunto
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Timeline
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Data
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {envios.map((envio) => (
                <EnvioRow
                  key={envio.id}
                  envio={envio}
                  onDetalhes={() => setSelectedEnvio(envio)}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* MODAL DE DETALHES */}
      {selectedEnvio && (
        <DetalhesModal
          envio={selectedEnvio}
          onClose={() => setSelectedEnvio(null)}
        />
      )}
    </div>
  );
}

// ----------------------------------------------------------------------------
// COMPONENTE: LINHA DA TABELA
// ----------------------------------------------------------------------------
function EnvioRow({
  envio,
  onDetalhes,
}: {
  envio: EmailEnvio;
  onDetalhes: () => void;
}) {
  return (
    <tr className="hover:bg-slate-50">
      {/* CLIENTE */}
      <td className="px-6 py-4">
        <div className="text-sm font-medium text-slate-900">{envio.clienteNome}</div>
        <div className="text-sm text-slate-500">{envio.emailDestinatario}</div>
        {envio.clienteCnpj && (
          <div className="text-xs text-slate-400 font-mono">{envio.clienteCnpj}</div>
        )}
      </td>

      {/* ASSUNTO */}
      <td className="px-6 py-4">
        <div className="text-sm text-slate-900 max-w-xs truncate">{envio.assunto}</div>
        <div className="mt-1">
          <span
            className={`inline-block px-2 py-1 text-xs font-medium rounded ${
              envio.status === 'ENVIADO'
                ? 'bg-green-100 text-green-800'
                : envio.status === 'AGENDADO'
                ? 'bg-yellow-100 text-yellow-800'
                : 'bg-red-100 text-red-800'
            }`}
          >
            {envio.status}
          </span>
        </div>
      </td>

      {/* TIMELINE */}
      <td className="px-6 py-4">
        <TimelineIcones envio={envio} />
      </td>

      {/* DATA */}
      <td className="px-6 py-4 text-sm text-slate-500">
        {envio.enviadoEm
          ? new Date(envio.enviadoEm).toLocaleDateString('pt-BR')
          : '—'}
      </td>

      {/* AÇÕES */}
      <td className="px-6 py-4 text-right">
        <button
          onClick={onDetalhes}
          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
        >
          Ver detalhes →
        </button>
      </td>
    </tr>
  );
}

// ----------------------------------------------------------------------------
// COMPONENTE: ÍCONES DA TIMELINE COM TOOLTIPS
// ----------------------------------------------------------------------------
function TimelineIcones({ envio }: { envio: EmailEnvio }) {
  const temEnviado = envio.status === 'ENVIADO';
  const temAberto = !!envio.primeiraAberturaEm;
  const temBaixado = !!envio.primeiroDownloadEm;

  return (
    <div className="flex items-center justify-center gap-2">
      {/* ENVIADO */}
      <div className="relative group">
        <div
          className={`w-8 h-8 rounded-full flex items-center justify-center ${
            temEnviado ? 'bg-green-100' : 'bg-slate-100 opacity-40'
          }`}
        >
          <span className="text-sm">📤</span>
        </div>
        {temEnviado && (
          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-slate-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
            Enviado em {new Date(envio.enviadoEm!).toLocaleString('pt-BR')}
          </div>
        )}
      </div>

      <span className="text-slate-300">→</span>

      {/* ABERTO */}
      <div className="relative group">
        <div
          className={`w-8 h-8 rounded-full flex items-center justify-center ${
            temAberto ? 'bg-yellow-100' : 'bg-slate-100 opacity-40'
          }`}
        >
          <span className="text-sm">👁️</span>
        </div>
        {temAberto && (
          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-slate-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
            Aberto em {new Date(envio.primeiraAberturaEm!).toLocaleString('pt-BR')}
          </div>
        )}
      </div>

      <span className="text-slate-300">→</span>

      {/* BAIXADO */}
      <div className="relative group">
        <div
          className={`w-8 h-8 rounded-full flex items-center justify-center ${
            temBaixado ? 'bg-green-100' : 'bg-slate-100 opacity-40'
          }`}
        >
          <span className="text-sm">📥</span>
        </div>
        {temBaixado && (
          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-slate-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
            Baixado em {new Date(envio.primeiroDownloadEm!).toLocaleString('pt-BR')}
          </div>
        )}
      </div>
    </div>
  );
}

// ----------------------------------------------------------------------------
// COMPONENTE: MODAL DE DETALHES
// ----------------------------------------------------------------------------
function DetalhesModal({
  envio,
  onClose,
}: {
  envio: EmailEnvio;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* HEADER */}
        <div className="p-6 border-b border-slate-200 flex justify-between items-start">
          <div>
            <h2 className="text-xl font-bold text-slate-900">{envio.assunto}</h2>
            <p className="text-sm text-slate-600 mt-1">
              Para: {envio.emailDestinatario}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 text-2xl"
          >
            ×
          </button>
        </div>

        {/* CONTEÚDO */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* TIMELINE DE EVENTOS */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-slate-700 mb-3 uppercase">
              📊 Timeline de Eventos
            </h3>
            <div className="space-y-2">
              {envio.eventos.map((evento) => (
                <div
                  key={evento.id}
                  className="flex items-start gap-3 p-3 bg-slate-50 rounded"
                >
                  <div className="text-lg">
                    {evento.tipo === 'ENVIADO' && '📤'}
                    {evento.tipo === 'ABERTO' && '👁️'}
                    {evento.tipo === 'BAIXADO' && '📥'}
                    {evento.tipo === 'FALHA' && '❌'}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-slate-900">{evento.tipo}</span>
                      <span className="text-xs text-slate-500">
                        {new Date(evento.createdAt).toLocaleString('pt-BR')}
                      </span>
                    </div>
                    {evento.ip && (
                      <div className="text-xs text-slate-500 mt-1">
                        IP: {evento.ip}
                      </div>
                    )}
                    {evento.metadata?.provider && (
                      <div className="text-xs text-slate-500 mt-1">
                        Provider: {evento.metadata.provider}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* PREVIEW DO EMAIL */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-slate-700 mb-3 uppercase">
              📨 Preview do Email
            </h3>
            <div className="border border-slate-200 rounded p-4 bg-white">
              <div
                dangerouslySetInnerHTML={{ __html: envio.corpoHtml }}
              />
            </div>
          </div>

          {/* LINK DE DOWNLOAD */}
          <div>
            <h3 className="text-sm font-semibold text-slate-700 mb-3 uppercase">
              🔗 Download do Documento
            </h3>
            <a
              href={`${API_URL}/track/download/${envio.id}/${envio.tokenDownload}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              📥 Baixar Documento
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}