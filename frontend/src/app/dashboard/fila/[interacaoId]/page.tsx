// =================================================================
// 🎯 F17: TELA DE CHAT DA CONVERSA (LAYOUT FINAL OTIMIZADO)
// Interface para visualizar e responder a conversa assumida
// COM AS 3 CORREÇÕES SOLICITADAS:
// 1. Histórico MAIOR (60%) e Conversa Atual MENOR (40%)
// 2. Input de resposta FIXO logo abaixo das mensagens (não no fim da página)
// 3. Histórico organizado: 2 recentes detalhadas + resumo das antigas
// =================================================================

'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { toast } from 'sonner';
import {
  ArrowLeft,
  Send,
  Clock,
  Phone,
  FileText,
  Loader2,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  Building2,
} from 'lucide-react';

// =========================================================================
// 🟦 BLOCO 1: INTERFACES (Definição dos tipos de dados)
// =========================================================================

interface Mensagem {
  id: string;
  conteudo: string;
  remetente: 'cliente' | 'atendente' | 'bot';
  criadoEm: string;
  canal: string;
}

interface Contato {
  contatoId: string;
  nomeCliente?: string;
  telefone?: string;
  documento?: string;
}

interface Interacao {
  id: string;
  canal: string;
  criadoEm: string;
  contato: Contato;
}

interface HistoricoConversa {
  id: string;
  assunto?: string;
  departamento?: string;
  criadoEm: string;
  ultimaMensagem?: string;
  status: string;
  totalMensagens: number;
}

// =========================================================================
// 🟦 BLOCO 2: COMPONENTE PRINCIPAL
// =========================================================================

export default function ChatConversaPage() {
  const params = useParams();
  const router = useRouter();
  const { user, token } = useAuthStore();
  const interacaoId = params.interacaoId as string;

  // Estados da conversa atual
  const [interacao, setInteracao] = useState<Interacao | null>(null);
  const [mensagens, setMensagens] = useState<Mensagem[]>([]);
  const [novaMensagem, setNovaMensagem] = useState('');
  const [loading, setLoading] = useState(true);
  const [enviando, setEnviando] = useState(false);
  
  // Estados do histórico lateral
  const [historico, setHistorico] = useState<HistoricoConversa[]>([]);
  const [historicoExpandido, setHistoricoExpandido] = useState<number[]>([]);
  
  // Referência para scroll automático até a última mensagem
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // =========================================================================
  // 🟨 BLOCO 3: CARREGAR CONVERSA ATUAL
  // =========================================================================
  const carregarConversa = async () => {
    try {
      const res = await fetch(`http://localhost:3001/fila/conversa/${interacaoId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error(`Erro ${res.status}`);

      const data = await res.json();
      if (data.status === 'ok') {
        setInteracao(data.data.interacao);
        setMensagens(data.data.mensagens);
      }
    } catch (error) {
      console.error('Erro ao carregar conversa:', error);
      toast.error('Erro ao carregar conversa.');
      router.push('/dashboard/fila');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token && interacaoId) carregarConversa();
  }, [token, interacaoId]);

  // Scroll automático para a última mensagem
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [mensagens]);

  // =========================================================================
  // 🟩 BLOCO 4: ENVIAR MENSAGEM
  // =========================================================================
  const enviarMensagem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!novaMensagem.trim()) return;

    setEnviando(true);
    try {
      const res = await fetch(`http://localhost:3001/fila/conversa/${interacaoId}/mensagem`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ conteudo: novaMensagem }),
      });

      const data = await res.json();
      if (data.status === 'ok') {
        setMensagens((prev) => [...prev, data.data.mensagem]);
        setNovaMensagem('');
        toast.success('Mensagem enviada');
      } else {
        toast.error(data.message || 'Erro ao enviar mensagem');
      }
    } catch (error) {
      toast.error('Erro de conexão ao enviar mensagem');
    } finally {
      setEnviando(false);
    }
  };

  // =========================================================================
  // 🟧 BLOCO 5: LIBERAR CONVERSA
  // =========================================================================
  const liberarConversa = async () => {
    if (!confirm('Tem certeza que deseja liberar esta conversa?')) return;

    try {
      const res = await fetch(`http://localhost:3001/fila/liberar/${interacaoId}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();
      if (data.status === 'ok') {
        toast.success('Conversa liberada com sucesso!');
        router.push('/dashboard/fila');
      } else {
        toast.error('Erro ao liberar conversa');
      }
    } catch (error) {
      toast.error('Erro de conexão ao liberar conversa');
    }
  };

  // =========================================================================
  // 🟦 BLOCO 6: CARREGAR HISTÓRICO DO CLIENTE
  // =========================================================================
  const carregarHistoricoCliente = async (contatoId: string) => {
    try {
      const res = await fetch(`http://localhost:3001/fila/historico/${contatoId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();

      if (data.status === 'ok') {
        // Pega as últimas 5 conversas
        setHistorico(data.data.slice(0, 5));
      }
    } catch (error) {
      console.error('Erro ao carregar histórico:', error);
    }
  };

  useEffect(() => {
    if (interacao?.contato.contatoId) {
      carregarHistoricoCliente(interacao.contato.contatoId);
    }
  }, [interacao]);

  // =========================================================================
  // 🟪 BLOCO 7: FUNÇÕES AUXILIARES DE FORMATAÇÃO
  // =========================================================================
  const toggleHistorico = (index: number) => {
    if (historicoExpandido.includes(index)) {
      setHistoricoExpandido(historicoExpandido.filter(i => i !== index));
    } else {
      setHistoricoExpandido([...historicoExpandido, index]);
    }
  };

  const formatarDataRelativa = (dataISO: string) => {
    const data = new Date(dataISO);
    const agora = new Date();
    const diffDias = Math.floor((agora.getTime() - data.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDias === 0) return 'Hoje';
    if (diffDias === 1) return 'Ontem';
    if (diffDias < 7) return `${diffDias} dias atrás`;
    return data.toLocaleDateString('pt-BR');
  };

  const formatarHora = (dataISO: string) => {
    return new Date(dataISO).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };

  const formatarData = (dataISO: string) => {
    return new Date(dataISO).toLocaleDateString('pt-BR');
  };

  // =========================================================================
  // 🟥 BLOCO 8: RENDERIZAÇÃO DA UI (COM AS 3 CORREÇÕES)
  // =========================================================================
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-teal-600 mx-auto mb-2" />
          <p className="text-sm text-gray-500">Carregando conversa...</p>
        </div>
      </div>
    );
  }

  if (!interacao) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <FileText className="h-12 w-12 text-gray-300 mx-auto mb-2" />
          <p className="text-gray-500">Conversa não encontrada</p>
          <button onClick={() => router.push('/dashboard/fila')} className="mt-4 text-teal-600 hover:underline text-sm">
            Voltar para a fila
          </button>
        </div>
      </div>
    );
  }

  // Separa as conversas: 2 mais recentes (detalhadas) e o restante (resumo)
  const conversasRecentes = historico.slice(0, 2);
  const conversasAntigas = historico.slice(2);

  return (
    // ✅ CORREÇÃO 1 & 2: h-screen garante que o layout ocupe 100% da altura da janela, 
    // permitindo que o flex funcione corretamente para fixar o input.
    <div className="flex flex-col h-screen bg-gray-50">
      
      {/* CABEÇALHO FIXO (Não rola com a página) */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex-none z-10">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button onClick={() => router.push('/dashboard/fila')} className="p-2 hover:bg-gray-100 rounded-lg transition-colors" title="Voltar para a fila">
              <ArrowLeft className="h-5 w-5 text-gray-600" />
            </button>
            <div>
              <h1 className="text-lg font-semibold text-gray-800">
                {interacao.contato.nomeCliente || interacao.contato.contatoId}
              </h1>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <span className="px-2 py-0.5 bg-gray-100 rounded text-xs uppercase">{interacao.canal}</span>
                {interacao.contato.telefone && (
                  <span className="flex items-center gap-1">
                    <Phone className="h-3 w-3" />{interacao.contato.telefone}
                  </span>
                )}
              </div>
            </div>
          </div>
          <button onClick={liberarConversa} className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 border border-red-200 rounded-lg hover:bg-red-100 transition-colors text-sm font-medium">
            <Clock className="h-4 w-4" /> Liberar Conversa
          </button>
        </div>
      </div>

      {/* CONTEÚDO PRINCIPAL - 2 COLUNAS */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* ================================================================= */}
        {/* ✅ CORREÇÃO 1: COLUNA ESQUERDA (CONVERSA ATUAL) AGORA É MENOR (40%) */}
        {/* ================================================================= */}
        <div className="w-2/5 flex flex-col border-r border-gray-200 bg-white">
          
          {/* Área de Mensagens: flex-1 faz ela ocupar TODO o espaço disponível, empurrando o input para baixo */}
          <div className="flex-1 overflow-y-auto p-4">
            <div className="space-y-4">
              {mensagens.length === 0 ? (
                <div className="text-center text-gray-400 py-12">
                  <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Nenhuma mensagem nesta conversa</p>
                </div>
              ) : (
                mensagens.map((msg, index) => {
                  const mostrarData = index === 0 || new Date(msg.criadoEm).toDateString() !== new Date(mensagens[index - 1].criadoEm).toDateString();
                  return (
                    <div key={msg.id}>
                      {mostrarData && (
                        <div className="text-center my-4">
                          <span className="px-3 py-1 bg-gray-200 text-gray-600 text-xs rounded-full">{formatarData(msg.criadoEm)}</span>
                        </div>
                      )}
                      <div className={`flex ${msg.remetente === 'atendente' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[85%] rounded-lg p-3 shadow-sm ${
                          msg.remetente === 'atendente' ? 'bg-teal-600 text-white rounded-br-none' :
                          msg.remetente === 'bot' ? 'bg-gray-200 text-gray-800 rounded-bl-none' :
                          'bg-white border border-gray-200 text-gray-800 rounded-bl-none'
                        }`}>
                          <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.conteudo}</p>
                          <p className={`text-[10px] mt-1 text-right ${msg.remetente === 'atendente' ? 'text-teal-100' : 'text-gray-400'}`}>
                            {formatarHora(msg.criadoEm)}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* ✅ CORREÇÃO 2: INPUT FIXO NO FUNDO DA COLUNA (flex-none) */}
          {/* Como a coluna é flex-col e a área de mensagens é flex-1, este bloco fica sempre grudado no rodapé da coluna de chat */}
          <div className="border-t border-gray-200 p-4 flex-none bg-white">
            <form onSubmit={enviarMensagem} className="flex gap-2">
              <input
                type="text"
                value={novaMensagem}
                onChange={(e) => setNovaMensagem(e.target.value)}
                placeholder="Digite sua resposta..."
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition-all"
                disabled={enviando}
                autoFocus
              />
              <button
                type="submit"
                disabled={enviando || !novaMensagem.trim()}
                className="px-6 py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 font-medium"
              >
                {enviando ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
                Enviar
              </button>
            </form>
          </div>
        </div>

        {/* ================================================================= */}
        {/* ✅ CORREÇÃO 1 & 3: COLUNA DIREITA (HISTÓRICO) AGORA É MAIOR (60%) */}
        {/* ================================================================= */}
        <div className="w-3/5 bg-gray-50 overflow-y-auto p-6">
          <div className="max-w-3xl mx-auto space-y-6">
            
            {/* Cabeçalho do Histórico */}
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-gray-800 flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-teal-600" />
                Histórico do Cliente
              </h2>
              <span className="text-xs text-gray-500 bg-gray-200 px-2.5 py-1 rounded-full font-medium">
                {historico.length} {historico.length === 1 ? 'conversa' : 'conversas'}
              </span>
            </div>

            {historico.length === 0 ? (
              <div className="text-center text-gray-400 py-12 bg-white rounded-xl border border-dashed border-gray-300">
                <MessageSquare className="h-10 w-10 mx-auto mb-3 opacity-50" />
                <p className="text-sm">Nenhuma conversa anterior encontrada</p>
              </div>
            ) : (
              <>
                {/* ✅ CORREÇÃO 3: 2 CONVERSAS MAIS RECENTES DETALHADAS */}
                <div className="space-y-4">
                  {conversasRecentes.map((conv) => (
                    <div key={conv.id} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                      <div className="p-4 bg-gray-50 border-b border-gray-200">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="text-sm font-semibold text-gray-800">
                              {new Date(conv.criadoEm).toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                            </p>
                            <div className="flex items-center gap-2 mt-1.5">
                              <span className="flex items-center gap-1 text-xs text-gray-600 bg-white px-2 py-0.5 rounded border border-gray-200">
                                <Building2 className="h-3 w-3" /> {conv.departamento || 'Geral'}
                              </span>
                              <span className="text-xs text-gray-500">{conv.totalMensagens} mensagens</span>
                            </div>
                          </div>
                          <span className={`text-xs font-medium px-2 py-1 rounded ${conv.status === 'ATIVO' ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'}`}>
                            {conv.status}
                          </span>
                        </div>
                      </div>
                      <div className="p-4">
                        <p className="text-sm text-gray-700 italic bg-gray-50 p-3 rounded-lg border border-gray-100">
                          "{conv.ultimaMensagem || 'Sem conteúdo de mensagem'}"
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* ✅ CORREÇÃO 3: RESUMO DAS CONVERSAS ANTIGAS (Compacto) */}
                {conversasAntigas.length > 0 && (
                  <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                    <div className="p-3 bg-gray-50 border-b border-gray-200">
                      <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                        Conversas Antigas ({conversasAntigas.length})
                      </p>
                    </div>
                    <div className="divide-y divide-gray-100">
                      {conversasAntigas.map((conv) => (
                        <div key={conv.id} className="p-3 hover:bg-gray-50 transition-colors cursor-pointer group">
                          <div className="flex items-center justify-between mb-1">
                            <p className="text-xs font-medium text-gray-700 group-hover:text-teal-700">
                              {new Date(conv.criadoEm).toLocaleDateString('pt-BR')}
                            </p>
                            <span className="text-[10px] text-gray-400">{conv.totalMensagens} msgs</span>
                          </div>
                          <p className="text-xs text-gray-500 line-clamp-1">
                            {conv.assunto || conv.departamento || 'Sem assunto identificado'}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Resumo Rápido (Card de Estatísticas) */}
                <div className="mt-6 p-4 bg-teal-50 rounded-xl border border-teal-200">
                  <h3 className="text-xs font-semibold text-teal-900 mb-3 flex items-center gap-1.5">
                    📊 Resumo do Relacionamento
                  </h3>
                  <div className="grid grid-cols-2 gap-3 text-xs text-teal-800">
                    <div className="bg-white/60 p-2 rounded-lg">
                      <p className="font-semibold text-teal-900">{historico.length}</p>
                      <p className="text-teal-600">Total de interações</p>
                    </div>
                    <div className="bg-white/60 p-2 rounded-lg">
                      <p className="font-semibold text-teal-900">{formatarDataRelativa(historico[0]?.criadoEm || '')}</p>
                      <p className="text-teal-600">Último contato</p>
                    </div>
                  </div>
                </div>

              </>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}