// =================================================================
// 🎯 F17: TELA DE CHAT DO ATENDENTE
// Interface onde o atendimento realmente acontece
// =================================================================

'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';

// =========================================================================
//  BLOCO 1: INTERFACES TYPESCRIPT
// Definem a estrutura dos dados que vêm do backend
// =========================================================================

interface Contato {
  contatoId: string;
  telefone?: string;
  documento?: string;
  instagramId?: string;
  facebookId?: string;
}

interface Interacao {
  id: string;
  tipo: string;
  conteudo: string;
  canal: 'WHATSAPP' | 'INSTAGRAM' | 'FACEBOOK';
  criadoEm: string;
  metadata?: any;
}

interface LockInfo {
  lockId: string;
  atendenteNome: string;
  expiraEm: string;
  minutosRestantes: number;
}

// =========================================================================
//  BLOCO 2: COMPONENTE PRINCIPAL
// =========================================================================

export default function ChatPage() {
  const params = useParams();
  const router = useRouter();
  const interacaoId = params.interacaoId as string;

  // Estados para armazenar os dados
  const [interacoes, setInteracoes] = useState<Interacao[]>([]);
  const [contato, setContato] = useState<Contato | null>(null);
  const [lock, setLock] = useState<LockInfo | null>(null);
  const [mensagem, setMensagem] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [enviando, setEnviando] = useState(false);

  // Referência para scroll automático
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Atendente atual (em produção virá do contexto de autenticação)
  const atendenteAtual = {
    id: 'user_001',
    nome: 'Ana Silva'
  };

  // =========================================================================
  //  BLOCO 3: FUNÇÃO AUXILIAR - ÍCONE DO CANAL
  // Retorna o emoji e nome do canal para exibição visual
  // =========================================================================
  const getCanalIcon = (canal: string) => {
    switch (canal) {
      case 'WHATSAPP': return ' WhatsApp';
      case 'INSTAGRAM': return '📸 Instagram';
      case 'FACEBOOK': return '📘 Facebook';
      default: return '💬 Mensagem';
    }
  };

  // =========================================================================
  // 🟠 BLOCO 4: FUNÇÃO - CARREGAR DADOS DO CHAT
  // Busca histórico, perfil do cliente e informações do lock
  // =========================================================================
  const carregarChat = async () => {
    try {
      setLoading(true);
      setError('');

      // Busca o histórico completo do contato
      const resHistorico = await fetch(`http://localhost:3001/memoria/${interacaoId}`);
      const dataHistorico = await resHistorico.json();

      if (dataHistorico.status === 'ok') {
        setContato(dataHistorico.data.perfil);
        setInteracoes(dataHistorico.data.historico);
      }

      // Busca informações do lock atual
      const resLock = await fetch('http://localhost:3001/fila/status');
      const dataLock = await resLock.json();

      if (dataLock.status === 'ok') {
        const lockAtual = dataLock.data.locks.find(
          (l: any) => l.interacaoId === interacaoId
        );
        if (lockAtual) {
          setLock(lockAtual);
        }
      }
    } catch (err) {
      setError('Erro ao carregar o chat. Verifique se o backend está rodando.');
      console.error('Erro ao carregar chat:', err);
    } finally {
      setLoading(false);
    }
  };

  // Carrega os dados ao montar o componente
  useEffect(() => {
    carregarChat();
    
    // Atualiza a cada 30 segundos (para refresh do lock e novas mensagens)
    const interval = setInterval(carregarChat, 30000);
    return () => clearInterval(interval);
  }, [interacaoId]);

  // Scroll automático para a última mensagem
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [interacoes]);

  // =========================================================================
  // 🔴 BLOCO 5: FUNÇÃO - ENVIAR MENSAGEM
  // Quando o atendente digita e envia uma resposta
  // =========================================================================
  const enviarMensagem = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!mensagem.trim() || !contato) {
      return;
    }

    try {
      setEnviando(true);

      // Envia a mensagem via endpoint de unificação
      const res = await fetch('http://localhost:3001/memoria/unificar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          documento: contato.documento,
          telefone: contato.telefone,
          canal: 'WHATSAPP', // Canal de saída (pode ser dinâmico no futuro)
          canalExternoId: `atendente_${atendenteAtual.id}`,
          conteudo: mensagem,
          tipo: 'mensagem',
          metadata: {
            remetente: 'atendente',
            atendenteId: atendenteAtual.id,
            atendenteNome: atendenteAtual.nome,
          },
        }),
      });

      const data = await res.json();

      if (data.status === 'ok') {
        setMensagem(''); // Limpa o campo
        await carregarChat(); // Recarrega o histórico
      } else {
        alert('Erro ao enviar mensagem.');
      }
    } catch (err) {
      alert('Erro ao enviar mensagem.');
      console.error('Erro ao enviar:', err);
    } finally {
      setEnviando(false);
    }
  };

  // =========================================================================
  //  BLOCO 6: FUNÇÃO - LIBERAR CONVERSA
  // Quando o atendente termina o atendimento
  // =========================================================================
  const liberarConversa = async () => {
    if (!confirm('Tem certeza que deseja liberar esta conversa?')) {
      return;
    }

    try {
      const res = await fetch(`http://localhost:3001/fila/liberar/${interacaoId}`, {
        method: 'POST',
      });

      const data = await res.json();

      if (data.status === 'ok') {
        alert('✅ Conversa liberada com sucesso!');
        router.push('/fila'); // Volta para a fila
      } else {
        alert('Erro ao liberar conversa.');
      }
    } catch (err) {
      alert('Erro ao liberar conversa.');
      console.error('Erro ao liberar:', err);
    }
  };

  // =========================================================================
  //  BLOCO 7: RENDERIZAÇÃO - TELA DE CARREGAMENTO
  // =========================================================================
  if (loading) {
    return (
      <div className="h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando conversa...</p>
        </div>
      </div>
    );
  }

  // =========================================================================
  //  BLOCO 8: RENDERIZAÇÃO - TELA DE ERRO
  // =========================================================================
  if (error) {
    return (
      <div className="h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-6 rounded-lg shadow border-l-4 border-red-500 max-w-md">
          <h2 className="text-xl font-bold text-red-600 mb-2">⚠️ Erro</h2>
          <p className="text-gray-700 mb-4">{error}</p>
          <button
            onClick={() => router.push('/fila')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Voltar para a Fila
          </button>
        </div>
      </div>
    );
  }

  // =========================================================================
  // 🟢 BLOCO 9: RENDERIZAÇÃO - TELA PRINCIPAL DO CHAT
  // =========================================================================
  return (
    <div className="h-screen bg-gray-50 flex flex-col">
      {/* ========================================================================= */}
      {/* 🔵 HEADER: Informações do cliente e timer do lock */}
      {/* ========================================================================= */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 shadow-sm">
        <div className="flex items-center justify-between">
          {/* Informações do cliente */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/fila')}
              className="text-gray-600 hover:text-gray-900"
            >
              ← Voltar
            </button>
            <div>
              <h1 className="text-lg font-bold text-gray-800">
                {contato?.contatoId || 'Cliente'}
              </h1>
              <p className="text-sm text-gray-500">
                {contato?.telefone && `📱 ${contato.telefone}`}
                {contato?.documento && ` | 📄 ${contato.documento}`}
              </p>
            </div>
          </div>

          {/* Timer do lock */}
          {lock && (
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm text-gray-600">
                  Atendido por: <strong>{lock.atendenteNome}</strong>
                </p>
                <p className="text-xs text-gray-500">
                  Expira em: {new Date(lock.expiraEm).toLocaleTimeString('pt-BR')}
                </p>
              </div>
              <div className={`px-3 py-2 rounded-lg font-semibold ${
                lock.minutosRestantes > 10
                  ? 'bg-green-100 text-green-800'
                  : 'bg-red-100 text-red-800'
              }`}>
                ️ {lock.minutosRestantes} min
              </div>
            </div>
          )}
        </div>
      </header>

      {/* ========================================================================= */}
      {/* 🟡 CORPO: Chat + Sidebar de informações */}
      {/* ========================================================================= */}
      <div className="flex-1 flex overflow-hidden">
        {/* ========================================================================= */}
        {/* 🟢 COLUNA 1: Timeline de mensagens (70% da largura) */}
        {/* ========================================================================= */}
        <div className="flex-1 flex flex-col bg-white">
          {/* Área de mensagens */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {interacoes.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <p className="text-lg">Nenhuma mensagem nesta conversa</p>
                <p className="text-sm mt-2">Envie a primeira mensagem abaixo</p>
              </div>
            ) : (
              interacoes.map((interacao) => (
                <div
                  key={interacao.id}
                  className={`flex ${
                    interacao.metadata?.remetente === 'atendente'
                      ? 'justify-end'
                      : 'justify-start'
                  }`}
                >
                  <div className={`max-w-[70%] rounded-lg px-4 py-3 ${
                    interacao.metadata?.remetente === 'atendente'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-900'
                  }`}>
                    {/* Cabeçalho da mensagem */}
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-semibold">
                        {getCanalIcon(interacao.canal)}
                      </span>
                      <span className="text-xs opacity-75">
                        {new Date(interacao.criadoEm).toLocaleString('pt-BR')}
                      </span>
                    </div>
                    
                    {/* Conteúdo */}
                    <p className="text-sm whitespace-pre-wrap">
                      {interacao.conteudo}
                    </p>
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* ========================================================================= */}
          {/* 🟠 ÁREA DE RESPOSTA: Campo de texto + botão enviar */}
          {/* ========================================================================= */}
          <div className="border-t border-gray-200 p-4 bg-gray-50">
            <form onSubmit={enviarMensagem} className="flex gap-3">
              <input
                type="text"
                value={mensagem}
                onChange={(e) => setMensagem(e.target.value)}
                placeholder="Digite sua resposta..."
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={enviando}
              />
              <button
                type="submit"
                disabled={!mensagem.trim() || enviando}
                className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {enviando ? 'Enviando...' : 'Enviar'}
              </button>
            </form>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 🔵 COLUNA 2: Sidebar com informações do cliente (30% da largura) */}
        {/* ========================================================================= */}
        <aside className="w-80 bg-white border-l border-gray-200 overflow-y-auto">
          <div className="p-6 space-y-6">
            {/* Perfil do cliente */}
            <div>
              <h3 className="text-sm font-bold text-gray-500 uppercase mb-3">
                Perfil do Cliente
              </h3>
              <div className="space-y-3">
                {contato?.contatoId && (
                  <div>
                    <p className="text-xs text-gray-500">ID do Contato</p>
                    <p className="text-sm font-semibold text-gray-900 break-all">
                      {contato.contatoId}
                    </p>
                  </div>
                )}
                {contato?.documento && (
                  <div>
                    <p className="text-xs text-gray-500">Documento</p>
                    <p className="text-sm text-gray-900">{contato.documento}</p>
                  </div>
                )}
                {contato?.telefone && (
                  <div>
                    <p className="text-xs text-gray-500">Telefone</p>
                    <p className="text-sm text-gray-900">📱 {contato.telefone}</p>
                  </div>
                )}
                {contato?.instagramId && (
                  <div>
                    <p className="text-xs text-gray-500">Instagram</p>
                    <p className="text-sm text-gray-900">📸 {contato.instagramId}</p>
                  </div>
                )}
                {contato?.facebookId && (
                  <div>
                    <p className="text-xs text-gray-500">Facebook</p>
                    <p className="text-sm text-gray-900">📘 {contato.facebookId}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Ações rápidas */}
            <div>
              <h3 className="text-sm font-bold text-gray-500 uppercase mb-3">
                Ações
              </h3>
              <div className="space-y-2">
                <button
                  onClick={liberarConversa}
                  className="w-full px-4 py-2 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition-colors"
                >
                  🔓 Liberar Conversa
                </button>
                <button
                  onClick={() => alert('Funcionalidade de transferência em desenvolvimento')}
                  className="w-full px-4 py-2 bg-gray-600 text-white font-semibold rounded-lg hover:bg-gray-700 transition-colors"
                >
                  🔄 Transferir
                </button>
              </div>
            </div>

            {/* Histórico de interações */}
            <div>
              <h3 className="text-sm font-bold text-gray-500 uppercase mb-3">
                Resumo
              </h3>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-700">
                  <strong>Total de mensagens:</strong> {interacoes.length}
                </p>
                <p className="text-sm text-gray-700 mt-2">
                  <strong>Canais:</strong>{' '}
                  {Array.from(new Set(interacoes.map(i => i.canal))).join(', ')}
                </p>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}