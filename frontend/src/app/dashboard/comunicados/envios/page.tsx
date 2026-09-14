// ============================================================================
// SPRINT F15 — Tela 2: Histórico de Envios de Email (com Timeline + Tooltips)
// ----------------------------------------------------------------------------
// OBJETIVO:
//   Listar todos os envios de email do pipeline de Comunicados (Bloco 3)
//   com timeline completa: ENVIADO -> ABERTO (pixel) -> BAIXADO (download).
//
// 🆕 FIX F15-4 (pedido do Marcos): ao PASSAR O MOUSE nos ícones da timeline,
//    aparece um tooltip com a data e hora exatas do evento (ou "não ocorreu").
//
// CONSOME DO BACKEND:
//   GET /api/email-envios           -> lista paginada + eventos
//   GET /track/download/:id/:token  -> download do arquivo (proxy)
// ============================================================================
'use client';

// URL base do backend NestJS (porta 3001)
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

import { useEffect, useState } from 'react';

// ----------------------------------------------------------------------------
// TIPOS (espelham o schema EmailEnvio + EmailEvento do backend)
// ----------------------------------------------------------------------------
type StatusEnvio = 'AGENDADO' | 'ENVIADO' | 'FALHOU';
type TipoEventoEmail = 'ENVIADO' | 'ABERTO' | 'BAIXADO' | 'FALHA';

interface EmailEvento {
  id: string;
  tipo: TipoEventoEmail;
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
  status: StatusEnvio;
  setor: string;
  tentativas: number;
  ultimoErro: string | null;
  tokenDownload: string;
  linkExpiraEm: string | null;
  primeiraAberturaEm: string | null;
  primeiroDownloadEm: string | null;
  enviadoEm: string | null;
  eventos: EmailEvento[];
  anexos: Array<{ nomeOriginal: string; mime: string; tamanhoBytes: number }>;
}

// ----------------------------------------------------------------------------
// HELPER: formata data/hora completa para o tooltip
// ----------------------------------------------------------------------------
function formatarDataHora(iso: string): string {
  return new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

// ----------------------------------------------------------------------------
// COMPONENTE PRINCIPAL
// ----------------------------------------------------------------------------
export default function EnviosPage() {
  const [envios, setEnvios] = useState<EmailEnvio[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroStatus, setFiltroStatus] = useState<StatusEnvio | 'TODOS'>('TODOS');
  const [busca, setBusca] = useState('');
  const [envioSelecionado, setEnvioSelecionado] = useState<EmailEnvio | null>(null);

  // -------------------------------------------------------------------------
  // CARREGAR DADOS
  // -------------------------------------------------------------------------
  useEffect(() => {
    const fetchEnvios = async () => {
      try {
        const params = new URLSearchParams();
        if (filtroStatus !== 'TODOS') params.append('status', filtroStatus);

        const response = await fetch(`${API_URL}/api/email-envios?${params}`);
        const data = await response.json();
        setEnvios(data.data || []);
      } catch (error) {
        console.error('Erro ao carregar envios:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchEnvios();
  }, [filtroStatus]);

  // -------------------------------------------------------------------------
  // BUSCA CLIENTE (nome, CNPJ, email ou assunto)
  // -------------------------------------------------------------------------
  const enviosFiltrados = envios.filter((e) => {
    if (!busca) return true;
    const q = busca.toLowerCase();
    return (
      e.clienteNome.toLowerCase().includes(q) ||
      (e.clienteCnpj ?? '').includes(q) ||
      e.emailDestinatario.toLowerCase().includes(q) ||
      e.assunto.toLowerCase().includes(q)
    );
  });

  // -------------------------------------------------------------------------
  // MÉTRICAS DO FUNIL
  // -------------------------------------------------------------------------
  const totalEnviados = envios.filter((e) => e.status === 'ENVIADO').length;
  const totalAbertos = envios.filter((e) => e.primeiraAberturaEm).length;
  const totalBaixados = envios.filter((e) => e.primeiroDownloadEm).length;
  const totalFalhas = envios.filter((e) => e.status === 'FALHOU').length;

  const taxaAbertura =
    totalEnviados > 0 ? ((totalAbertos / totalEnviados) * 100).toFixed(1) : '0.0';

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
          <span className="text-slate-400"> (passe o mouse nos ícones da timeline para ver data/hora)</span>
        </p>
      </div>

      {/* CARDS DE MÉTRICAS */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <MetricCard label="Total Enviados" value={totalEnviados} color="bg-blue-600" icon="📤" />
        <MetricCard label="Abertos" value={totalAbertos} color="bg-yellow-500" icon="👁️" />
        <MetricCard label="Baixados" value={totalBaixados} color="bg-green-600" icon="📥" />
        <MetricCard label="Taxa Abertura" value={`${taxaAbertura}%`} color="bg-indigo-600" icon="📊" />
        <MetricCard label="Falhas" value={totalFalhas} color="bg-red-600" icon="❌" />
      </div>

      {/* FILTROS + BUSCA */}
      <div className="mb-6 flex gap-3 flex-wrap items-center">
        <div className="flex gap-2 flex-wrap">
          {(['TODOS', 'ENVIADO', 'AGENDADO', 'FALHOU'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setFiltroStatus(s)}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                filtroStatus === s
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {s === 'TODOS' && 'Todos'}
              {s === 'ENVIADO' && '✅ Enviados'}
              {s === 'AGENDADO' && '⏳ Agendados'}
              {s === 'FALHOU' && '❌ Falhas'}
            </button>
          ))}
        </div>

        <input
          type="text"
          placeholder="🔍 Buscar por cliente, CNPJ, email ou assunto..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          className="flex-1 min-w-[250px] px-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* TABELA DE ENVIOS */}
      {loading ? (
        <div className="text-center py-12 text-slate-500">Carregando...</div>
      ) : enviosFiltrados.length === 0 ? (
        <div className="text-center py-12 bg-slate-50 rounded-lg">
          <p className="text-slate-500 text-lg">
            📭 Nenhum envio encontrado com os filtros atuais.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Cliente</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Assunto</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-slate-600 uppercase">
                  Timeline
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Data</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600 uppercase">Ações</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {enviosFiltrados.map((envio) => (
                <EnvioRow
                  key={envio.id}
                  envio={envio}
                  onVerDetalhes={() => setEnvioSelecionado(envio)}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* MODAL DE DETALHES */}
      {envioSelecionado && (
        <DetalhesModal
          envio={envioSelecionado}
          onClose={() => setEnvioSelecionado(null)}
        />
      )}
    </div>
  );
}

// ----------------------------------------------------------------------------
// COMPONENTE: CARD DE MÉTRICA
// ----------------------------------------------------------------------------
function MetricCard({
  label,
  value,
  color,
  icon,
}: {
  label: string;
  value: number | string;
  color: string;
  icon: string;
}) {
  return (
    <div className="bg-white rounded-lg shadow-sm p-4 border border-slate-200">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-lg">{icon}</span>
        <span className="text-xs text-slate-500 uppercase font-medium">{label}</span>
      </div>
      <p className={`text-2xl font-bold ${color.replace('bg-', 'text-')}`}>{value}</p>
    </div>
  );
}

// ----------------------------------------------------------------------------
// COMPONENTE: LINHA DA TABELA
// ----------------------------------------------------------------------------
function EnvioRow({
  envio,
  onVerDetalhes,
}: {
  envio: EmailEnvio;
  onVerDetalhes: () => void;
}) {
  const temEnviado = envio.status === 'ENVIADO' || envio.status === 'FALHOU';
  const temAberto = !!envio.primeiraAberturaEm;
  const temBaixado = !!envio.primeiroDownloadEm;

  const statusBadge = {
    ENVIADO: 'bg-green-100 text-green-800',
    AGENDADO: 'bg-yellow-100 text-yellow-800',
    FALHOU: 'bg-red-100 text-red-800',
  }[envio.status];

  return (
    <tr className="hover:bg-slate-50 transition-colors">
      {/* COLUNA: CLIENTE */}
      <td className="px-4 py-3">
        <div className="flex flex-col">
          <span className="font-medium text-slate-900 text-sm">{envio.clienteNome}</span>
          <span className="text-xs text-slate-500">{envio.emailDestinatario}</span>
          {envio.clienteCnpj && (
            <span className="text-xs text-slate-400 font-mono">{envio.clienteCnpj}</span>
          )}
        </div>
      </td>

      {/* COLUNA: ASSUNTO */}
      <td className="px-4 py-3">
        <div className="flex flex-col max-w-xs">
          <span className="text-sm text-slate-800 truncate">{envio.assunto}</span>
          <span className={`text-xs px-2 py-0.5 rounded w-fit mt-1 ${statusBadge}`}>
            {envio.status}
          </span>
        </div>
      </td>

      {/* COLUNA: TIMELINE — 🆕 tooltips com data/hora ao passar o mouse */}
      <td className="px-4 py-3">
        <div className="flex items-center justify-center gap-1">
          <TimelineIcon
            ativo={temEnviado}
            icon="📤"
            label="Enviado"
            dataHora={envio.enviadoEm}
          />
          <span className="text-slate-300">→</span>
          <TimelineIcon
            ativo={temAberto}
            icon="👁️"
            label="Aberto"
            dataHora={envio.primeiraAberturaEm}
          />
          <span className="text-slate-300">→</span>
          <TimelineIcon
            ativo={temBaixado}
            icon="📥"
            label="Baixado"
            dataHora={envio.primeiroDownloadEm}
          />
        </div>
      </td>

      {/* COLUNA: DATA */}
      <td className="px-4 py-3 text-sm text-slate-600">
        {envio.enviadoEm
          ? new Date(envio.enviadoEm).toLocaleString('pt-BR', {
              day: '2-digit',
              month: '2-digit',
              year: '2-digit',
              hour: '2-digit',
              minute: '2-digit',
            })
          : '—'}
      </td>

      {/* COLUNA: AÇÕES */}
      <td className="px-4 py-3 text-right">
        <button
          onClick={onVerDetalhes}
          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
        >
          Ver detalhes →
        </button>
      </td>
    </tr>
  );
}

// ----------------------------------------------------------------------------
// 🆕 COMPONENTE: ÍCONE DA TIMELINE COM TOOLTIP (data/hora ao passar o mouse)
// ----------------------------------------------------------------------------
function TimelineIcon({
  ativo,
  icon,
  label,
  dataHora,
}: {
  ativo: boolean;
  icon: string;
  label: string;
  dataHora: string | null;
}) {
  return (
    // O wrapper "group" é o que ativa o tooltip no hover (group-hover)
    <div className="relative group">
      <div
        className={`flex items-center justify-center w-8 h-8 rounded-full cursor-help ${
          ativo ? 'bg-green-100' : 'bg-slate-100 opacity-40'
        }`}
      >
        <span className="text-sm">{icon}</span>
      </div>

      {/* Tooltip customizado: aparece acima do ícone ao passar o mouse */}
      <div className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-2 hidden -translate-x-1/2 whitespace-nowrap rounded-md bg-slate-900 px-3 py-1.5 text-xs font-medium text-white shadow-lg group-hover:block">
        {label}: {dataHora ? formatarDataHora(dataHora) : 'não ocorreu'}
        {/* Setinha do tooltip */}
        <div className="absolute left-1/2 top-full -translate-x-1/2 border-4 border-transparent border-t-slate-900" />
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
  const urlDownload = `${API_URL}/track/download/${envio.id}/${envio.tokenDownload}`;

  const eventosOrdenados = [...envio.eventos].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  );

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* HEADER DO MODAL */}
        <div className="p-6 border-b border-slate-200 flex justify-between items-start">
          <div className="flex-1">
            <h2 className="text-xl font-bold text-slate-900">{envio.assunto}</h2>
            <p className="text-sm text-slate-600 mt-1">
              Para: <strong>{envio.emailDestinatario}</strong>
            </p>
            <p className="text-xs text-slate-500 mt-1">
              {envio.clienteNome} {envio.clienteCnpj && `• ${envio.clienteCnpj}`}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 text-2xl leading-none"
          >
            ×
          </button>
        </div>

        {/* CORPO DO MODAL */}
        <div className="p-6 overflow-y-auto flex-1">
          {/* TIMELINE VISUAL */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-slate-700 mb-3 uppercase">
              📊 Timeline de Eventos
            </h3>
            <div className="space-y-2">
              {eventosOrdenados.map((evt) => (
                <div
                  key={evt.id}
                  className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg"
                >
                  <div className="w-10 h-10 rounded-full bg-white border-2 border-slate-200 flex items-center justify-center">
                    {evt.tipo === 'ENVIADO' && '📤'}
                    {evt.tipo === 'ABERTO' && '👁️'}
                    {evt.tipo === 'BAIXADO' && '📥'}
                    {evt.tipo === 'FALHA' && '❌'}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-900">{evt.tipo}</span>
                      <span className="text-xs text-slate-500">
                        {new Date(evt.createdAt).toLocaleString('pt-BR')}
                      </span>
                    </div>
                    {evt.ip && (
                      <div className="text-xs text-slate-500">
                        IP: {evt.ip}
                        {evt.userAgent && ` • ${evt.userAgent.slice(0, 60)}...`}
                      </div>
                    )}
                    {evt.metadata?.provider && (
                      <div className="text-xs text-slate-500">
                        Provider: {evt.metadata.provider}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {eventosOrdenados.length === 0 && (
                <p className="text-sm text-slate-500 italic">
                  Nenhum evento registrado ainda.
                </p>
              )}
            </div>
          </div>

          {/* PREVIEW DO EMAIL */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-slate-700 mb-3 uppercase">
              📨 Preview do Email
            </h3>
            <div className="border border-slate-200 rounded-lg overflow-hidden bg-slate-50">
              <iframe
                srcDoc={envio.corpoHtml}
                className="w-full h-80 bg-white"
                title="Preview do email"
                sandbox=""
              />
            </div>
          </div>

          {/* ANEXOS */}
          {envio.anexos && envio.anexos.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-slate-700 mb-3 uppercase">
                📎 Anexos
              </h3>
              <div className="space-y-2">
                {envio.anexos.map((anexo, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
                  >
                    <div>
                      <div className="font-medium text-slate-900 text-sm">
                        {anexo.nomeOriginal}
                      </div>
                      <div className="text-xs text-slate-500">
                        {anexo.mime} • {(anexo.tamanhoBytes / 1024).toFixed(1)} KB
                      </div>
                    </div>
                    <a
                      href={urlDownload}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors"
                    >
                      📥 Baixar
                    </a>
                  </div>
                ))}
              </div>
              {envio.linkExpiraEm && (
                <p className="text-xs text-slate-500 mt-2">
                  ⏰ Link válido até:{' '}
                  {new Date(envio.linkExpiraEm).toLocaleDateString('pt-BR')}
                </p>
              )}
            </div>
          )}

          {/* ERRO (se houver) */}
          {envio.status === 'FALHOU' && envio.ultimoErro && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <h3 className="text-sm font-semibold text-red-800 mb-1">❌ Erro no envio</h3>
              <p className="text-sm text-red-700">{envio.ultimoErro}</p>
            </div>
          )}
        </div>

        {/* FOOTER DO MODAL */}
        <div className="p-4 border-t border-slate-200 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}