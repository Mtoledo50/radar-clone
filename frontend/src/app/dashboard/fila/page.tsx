// =================================================================
// 🎯 F17: TELA DA FILA DE ATENDIMENTO (INTEGRADA COM AUTH)
// Lista conversas disponíveis e permite assumir atendimento
// =================================================================

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { toast } from 'sonner';
import {
  Headset,
  Clock,
  MessageSquare,
  AlertCircle,
  RefreshCw,
  User,
  Phone,
  Loader2,
} from 'lucide-react';

// =========================================================================
// 🟦 BLOCO 1: INTERFACES TYPESCRIPT
// =========================================================================

interface Contato {
  contatoId: string;
  telefone?: string;
  documento?: string;
}

interface Interacao {
  id: string;
  conteudo: string;
  canal: string;
  criadoEm: string;
  contato: Contato;
}

interface LockAtivo {
  lockId: string;
  interacaoId: string;
  contato: string;
  canal: string;
  bloqueadoEm: string;
  expiraEm: string;
  minutosRestantes: number;
}

interface StatusFila {
  totalLocksAtivos: number;
  porAtendente: Record<string, LockAtivo[]>;
  locks: any[];
}

// =========================================================================
// 🟦 BLOCO 2: COMPONENTE PRINCIPAL
// =========================================================================

export default function FilaPage() {
  const router = useRouter();
  
  // ✅ CRÍTICO: Captura o usuário logado e o token JWT do Zustand
  const { user, token } = useAuthStore();

  const [disponiveis, setDisponiveis] = useState<Interacao[]>([]);
  const [statusFila, setStatusFila] = useState<StatusFila | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // =========================================================================
  //  BLOCO 3: CARREGAR DADOS DA FILA
  // =========================================================================
  const carregarFila = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    
    try {
      // ✅ CRÍTICO: Monta o header de autorização com o token do usuário logado
      const authHeaders = {
        'Authorization': `Bearer ${token}`,
      };

      // 1. Busca conversas disponíveis (sem lock)
      const resDisponiveis = await fetch('http://localhost:3001/fila/disponiveis', {
        headers: authHeaders,
      });
      const dataDisponiveis = await resDisponiveis.json();

      // 2. Busca status da fila (quem está com lock ativo)
      const resAtendimento = await fetch('http://localhost:3001/fila/status', {
        headers: authHeaders,
      });
      const dataAtendimento = await resAtendimento.json();

      if (dataDisponiveis.status === 'ok') {
        setDisponiveis(dataDisponiveis.data.interacoes || []);
      }
      
      if (dataAtendimento.status === 'ok') {
        setStatusFila(dataAtendimento.data);
      }
    } catch (err) {
      console.error('Erro ao carregar fila:', err);
      toast.error('Erro de conexão ao carregar dados da fila');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Recarrega a fila sempre que o componente monta ou o token muda
  useEffect(() => {
    if (token) {
      carregarFila();
    }
  }, [token]);

  // =========================================================================
  // 🟩 BLOCO 4: ASSUMIR CONVERSA
  // =========================================================================
const assumirConversa = async (interacaoId: string) => {
  try {
    const res = await fetch(`http://localhost:3001/fila/assumir/${interacaoId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        atendenteId: user?.id,
        atendenteNome: user?.name,
      }),
    });

    const data = await res.json();

    if (data.status === 'ok') {
      toast.success(data.message);
      // ✅ CORRETO: Redireciona usando o ID real da interação no banco
      router.push(`/dashboard/fila/${interacaoId}`); 
    } else {
      toast.error(data.message || 'Erro ao assumir conversa');
    }
  } catch (err) {
    console.error('Erro ao assumir:', err);
    toast.error('Erro de conexão ao assumir conversa');
  }
};

  // =========================================================================
  // 🟧 BLOCO 5: LIBERAR CONVERSA
  // =========================================================================
  const liberarConversa = async (interacaoId: string) => {
    if (!confirm('Tem certeza que deseja liberar esta conversa?')) return;
    
    try {
      const res = await fetch(`http://localhost:3001/fila/liberar/${interacaoId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`, // ✅ Impede o erro 401
        },
      });

      const data = await res.json();

      if (data.status === 'ok') {
        toast.success('Conversa liberada com sucesso!');
        carregarFila(true); // Recarrega a lista
      } else {
        toast.error('Erro ao liberar conversa');
      }
    } catch (err) {
      console.error('Erro ao liberar:', err);
      toast.error('Erro de conexão ao liberar');
    }
  };

  // =========================================================================
  // 🟪 BLOCO 6: FORMATAR TEMPO
  // =========================================================================
  const formatarTempo = (dataISO: string) => {
    const data = new Date(dataISO);
    const agora = new Date();
    const diffMinutos = Math.floor((agora.getTime() - data.getTime()) / 60000);

    if (diffMinutos < 1) return 'Agora mesmo';
    if (diffMinutos < 60) return `${diffMinutos} min atrás`;
    const diffHoras = Math.floor(diffMinutos / 60);
    return `${diffHoras}h atrás`;
  };

  // =========================================================================
  //  BLOCO 7: RENDERIZAÇÃO DA UI
  // =========================================================================
  
  // Proteção: Se não houver usuário logado, redireciona para login
  if (!user || !token) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500 flex items-center gap-2">
          <Loader2 className="h-5 w-5 animate-spin" />
          Verificando autenticação...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* CABEÇALHO DA PÁGINA */}
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Headset className="h-7 w-7 text-teal-600" />
            Fila de Atendimento
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Olá, <span className="font-semibold text-gray-700">{user.name}</span>! Aqui estão as conversas aguardando atendimento.
          </p>
        </div>
        <button
          onClick={() => carregarFila(true)}
          disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          Atualizar
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ========================================================================= */}
        {/* 🟦 COLUNA 1: CONVERSAS DISPONÍVEIS (Ocupa 2/3 da largura em telas grandes) */}
        {/* ========================================================================= */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-4 border-b border-gray-200 flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-teal-600" />
              Conversas Disponíveis
            </h2>
            <span className="text-sm text-gray-500">
              {disponiveis.length} {disponiveis.length === 1 ? 'conversa' : 'conversas'}
            </span>
          </div>

          <div className="p-4">
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
              </div>
            ) : disponiveis.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                <MessageSquare className="h-12 w-12 mb-2" />
                <p className="text-lg font-medium">Nenhuma conversa na fila</p>
                <p className="text-sm">Novas mensagens aparecerão aqui automaticamente</p>
              </div>
            ) : (
              <div className="space-y-3">
                {disponiveis.map((interacao) => (
                  <div
                    key={interacao.id}
                    className="border border-gray-200 rounded-lg p-4 hover:border-teal-500 hover:shadow-md transition-all"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded">
                          {interacao.canal}
                        </span>
                        <span className="text-sm text-gray-500">
                          {formatarTempo(interacao.criadoEm)}
                        </span>
                      </div>
                      <button
                        onClick={() => assumirConversa(interacao.id)}
                        className="px-4 py-2 bg-teal-600 text-white text-sm font-medium rounded-lg hover:bg-teal-700 transition-colors"
                      >
                        Atender
                      </button>
                    </div>

                    <div className="mb-2">
                      <p className="text-sm text-gray-800 line-clamp-2">
                        {interacao.conteudo}
                      </p>
                    </div>

                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {interacao.contato.contatoId}
                      </span>
                      {interacao.contato.telefone && (
                        <span className="flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {interacao.contato.telefone}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 🟩 COLUNA 2: STATUS DA FILA (Ocupa 1/3 da largura em telas grandes) */}
        {/* ========================================================================= */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <Clock className="h-5 w-5 text-orange-500" />
              Status da Fila
            </h2>
          </div>

          <div className="p-4">
            {statusFila ? (
              <>
                {/* Total de locks ativos */}
                <div className="mb-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <AlertCircle className="h-4 w-4 text-orange-600" />
                    <span className="text-sm font-medium text-orange-800">
                      Conversas em Atendimento
                    </span>
                  </div>
                  <p className="text-2xl font-bold text-orange-700">
                    {statusFila.totalLocksAtivos}
                  </p>
                </div>

                {/* Lista por atendente */}
                <div className="space-y-3">
                  <h3 className="text-sm font-medium text-gray-700">Atendentes Ativos:</h3>
                  {Object.entries(statusFila.porAtendente).map(([atendente, locks]) => (
                    <div key={atendente} className="border border-gray-200 rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center">
                          <User className="h-4 w-4 text-teal-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-800">{atendente}</p>
                          <p className="text-xs text-gray-500">
                            {locks.length} {locks.length === 1 ? 'conversa' : 'conversas'}
                          </p>
                        </div>
                      </div>

                      <div className="space-y-1 ml-10">
                        {locks.map((lock) => (
                          <div key={lock.lockId} className="text-xs text-gray-600">
                            <span className="text-gray-500">{lock.contato}</span>
                            <span className="mx-1">•</span>
                            <span className="text-orange-600 font-medium">
                              {lock.minutosRestantes} min
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}

                  {Object.keys(statusFila.porAtendente).length === 0 && (
                    <p className="text-sm text-gray-500 text-center py-4">
                      Nenhum atendente ativo no momento
                    </p>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-64">
                <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}