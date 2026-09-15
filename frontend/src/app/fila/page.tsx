// =================================================================
// 🎯 F17: PÁGINA DA FILA DE ATENDIMENTO
// Interface operacional para atendentes gerenciarem conversas
// =================================================================

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation'; // ✅ Adicionado import do useRouter

// =========================================================================
//  BLOCO 1: INTERFACES TYPESCRIPT
// Definem a estrutura dos dados que vêm do backend
// =========================================================================

interface Contato {
  contatoId: string;
  telefone?: string;
  documento?: string;
}

interface Interacao {
  id: string;
  conteudo: string;
  canal: 'WHATSAPP' | 'INSTAGRAM' | 'FACEBOOK';
  criadoEm: string;
  contato?: Contato;
}

interface LockAtivo {
  lockId: string;
  interacaoId: string;
  contato: string;
  canal: string;
  atendenteNome: string;
  bloqueadoEm: string;
  expiraEm: string;
  minutosRestantes: number;
}

interface ConversaDisponivel {
  id: string;
  conteudo: string;
  canal: string;
  criadoEm: string;
  contato?: Contato;
}

// =========================================================================
//  BLOCO 2: COMPONENTE PRINCIPAL
// =========================================================================

export default function FilaPage() {
  const router = useRouter(); // ✅ Adicionado hook de roteamento
  
  // Estados para armazenar os dados da fila
  const [disponiveis, setDisponiveis] = useState<ConversaDisponivel[]>([]);
  const [emAtendimento, setEmAtendimento] = useState<LockAtivo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Dados do atendente atual (em produção virá do contexto de autenticação)
  const atendenteAtual = {
    id: 'user_001',
    nome: 'Ana Silva'
  };

  // =========================================================================
  // 🟡 BLOCO 3: FUNÇÃO AUXILIAR - ÍCONE DO CANAL
  // Retorna o emoji e nome do canal para exibição visual
  // =========================================================================
  const getCanalIcon = (canal: string) => {
    switch (canal) {
      case 'WHATSAPP': return '📱 WhatsApp';
      case 'INSTAGRAM': return '📸 Instagram';
      case 'FACEBOOK': return '📘 Facebook';
      default: return '💬 Mensagem';
    }
  };

  // =========================================================================
  // 🟠 BLOCO 4: FUNÇÃO - CARREGAR DADOS DA FILA
  // Busca conversas disponíveis e em atendimento do backend
  // =========================================================================
  const carregarFila = async () => {
    try {
      setLoading(true);
      setError('');

      // Busca conversas disponíveis (sem lock)
      const resDisponiveis = await fetch('http://localhost:3001/fila/disponiveis');
      const dataDisponiveis = await resDisponiveis.json();

      // Busca conversas em atendimento (com lock ativo)
      const resAtendimento = await fetch('http://localhost:3001/fila/status');
      const dataAtendimento = await resAtendimento.json();

      if (dataDisponiveis.status === 'ok') {
        setDisponiveis(dataDisponiveis.data.interacoes || []);
      }

      if (dataAtendimento.status === 'ok') {
        setEmAtendimento(dataAtendimento.data.locks || []);
      }
    } catch (err) {
      setError('Erro ao carregar a fila. Verifique se o backend está rodando.');
      console.error('Erro ao carregar fila:', err);
    } finally {
      setLoading(false);
    }
  };

  // Carrega os dados ao montar o componente
  useEffect(() => {
    carregarFila();
    
    // Atualiza a fila a cada 30 segundos (polling)
    const interval = setInterval(carregarFila, 30000);
    return () => clearInterval(interval);
  }, []);

  // =========================================================================
  //  BLOCO 5: FUNÇÃO - ASSUMIR CONVERSA
  // Quando o atendente clica em "Atender", cria um lock de 30 minutos
  // e redireciona para a tela de chat
  // =========================================================================
  const assumirConversa = async (interacaoId: string) => {
    try {
      const res = await fetch(`http://localhost:3001/fila/assumir/${interacaoId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          atendenteId: atendenteAtual.id,
          atendenteNome: atendenteAtual.nome,
        }),
      });

      const data = await res.json();

      if (data.status === 'ok') {
        // ✅ REDIRECIONA para a tela de chat após assumir
        router.push(`/fila/${interacaoId}`);
      } else {
        alert(`⚠️ ${data.message}`);
      }
    } catch (err) {
      alert('❌ Erro ao assumir conversa. Tente novamente.');
      console.error('Erro ao assumir:', err);
    }
  };

  // =========================================================================
  // 🟣 BLOCO 6: FUNÇÃO - LIBERAR CONVERSA
  // Quando o atendente termina o atendimento, libera o lock
  // =========================================================================
  const liberarConversa = async (interacaoId: string) => {
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
        carregarFila(); // Recarrega a fila
      } else {
        alert('️ Erro ao liberar conversa.');
      }
    } catch (err) {
      alert('❌ Erro ao liberar conversa.');
      console.error('Erro ao liberar:', err);
    }
  };

  // =========================================================================
  //  BLOCO 7: RENDERIZAÇÃO - TELA DE CARREGAMENTO
  // =========================================================================
  if (loading) {
    return (
      <div className="p-8 bg-gray-50 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando fila de atendimento...</p>
        </div>
      </div>
    );
  }

  // =========================================================================
  // 🟠 BLOCO 8: RENDERIZAÇÃO - TELA DE ERRO
  // =========================================================================
  if (error) {
    return (
      <div className="p-8 bg-gray-50 min-h-screen flex items-center justify-center">
        <div className="bg-white p-6 rounded-lg shadow border-l-4 border-red-500 max-w-md">
          <h2 className="text-xl font-bold text-red-600 mb-2">⚠️ Erro</h2>
          <p className="text-gray-700 mb-4">{error}</p>
          <button
            onClick={carregarFila}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  // =========================================================================
  // 🟢 BLOCO 9: RENDERIZAÇÃO - TELA PRINCIPAL DA FILA
  // =========================================================================
  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      {/* Cabeçalho da página */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">🎯 Fila de Atendimento</h1>
        <p className="text-gray-500">
          Atendente: <strong>{atendenteAtual.nome}</strong> | 
          Conversas disponíveis: <strong>{disponiveis.length}</strong> | 
          Em atendimento: <strong>{emAtendimento.length}</strong>
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ========================================================================= */}
        {/* 🟡 COLUNA 1: CONVERSAS DISPONÍVEIS (sem lock) */}
        {/* ========================================================================= */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <span className="text-green-500">🟢</span>
            Conversas Disponíveis
          </h2>

          {disponiveis.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p className="text-lg">Nenhuma conversa aguardando atendimento</p>
              <p className="text-sm mt-2">Novas conversas aparecerão aqui automaticamente</p>
            </div>
          ) : (
            <div className="space-y-3">
              {disponiveis.map((conversa) => (
                <div
                  key={conversa.id}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  {/* Cabeçalho da conversa */}
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm">
                        {getCanalIcon(conversa.canal)}
                      </span>
                      <span className="text-xs text-gray-500">
                        {new Date(conversa.criadoEm).toLocaleString('pt-BR')}
                      </span>
                    </div>
                  </div>

                  {/* Conteúdo da mensagem */}
                  <p className="text-gray-800 mb-3 line-clamp-2">
                    {conversa.conteudo}
                  </p>

                  {/* Informações do contato */}
                  {conversa.contato && (
                    <div className="text-xs text-gray-500 mb-3">
                      <p> {conversa.contato.contatoId}</p>
                      {conversa.contato.telefone && <p>📱 Telefone: {conversa.contato.telefone}</p>}
                    </div>
                  )}

                  {/* Botão de assumir */}
                  <button
                    onClick={() => assumirConversa(conversa.id)}
                    className="w-full px-4 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors"
                  >
                    ✅ Atender (30 min)
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ========================================================================= */}
        {/* 🔴 COLUNA 2: CONVERSAS EM ATENDIMENTO (com lock ativo) */}
        {/* ========================================================================= */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <span className="text-red-500">🔴</span>
            Em Atendimento
          </h2>

          {emAtendimento.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p className="text-lg">Nenhuma conversa em atendimento</p>
              <p className="text-sm mt-2">Assuma uma conversa da coluna ao lado</p>
            </div>
          ) : (
            <div className="space-y-3">
              {emAtendimento.map((lock) => (
                <div
                  key={lock.interacaoId}
                  className={`border-2 rounded-lg p-4 ${
                    lock.atendenteNome === atendenteAtual.nome
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 bg-gray-50'
                  }`}
                >
                  {/* Cabeçalho com status */}
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm">
                        {getCanalIcon(lock.canal)}
                      </span>
                      <span className="text-xs text-gray-500">
                        {new Date(lock.bloqueadoEm).toLocaleString('pt-BR')}
                      </span>
                    </div>
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      lock.minutosRestantes > 10
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      ⏱️ {lock.minutosRestantes} min
                    </span>
                  </div>

                  {/* Informações do contato */}
                  <div className="text-sm text-gray-700 mb-2">
                    <p className="font-semibold">👤 {lock.contato}</p>
                  </div>

                  {/* Atendente atual */}
                  <div className="text-xs text-gray-600 mb-3">
                    <p>
                      🔒 Atendido por: <strong>{lock.atendenteNome}</strong>
                      {lock.atendenteNome === atendenteAtual.nome && ' (você)'}
                    </p>
                    <p>
                      Expira em: {new Date(lock.expiraEm).toLocaleString('pt-BR')}
                    </p>
                  </div>

                  {/* Botão de liberar (só aparece se for o atendente atual) */}
                  {lock.atendenteNome === atendenteAtual.nome && (
                    <button
                      onClick={() => liberarConversa(lock.interacaoId)}
                      className="w-full px-4 py-2 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition-colors"
                    >
                      🔓 Liberar Conversa
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Botão de atualizar manualmente */}
      <div className="mt-6 text-center">
        <button
          onClick={carregarFila}
          className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
        >
          🔄 Atualizar Fila
        </button>
      </div>
    </div>
  );
}