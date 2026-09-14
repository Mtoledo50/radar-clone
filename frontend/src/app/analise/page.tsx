// =================================================================
// F15 - Frontend: Página de Análise e Classificação de Conversas
// =================================================================

'use client';

import { useEffect, useState } from 'react';

interface Interacao {
  id: string;
  tipo: string;
  conteudo: string;
  criadoEm: string;
  contato: {
    contatoId: string;
    ultimoAssunto: string | null;
  };
}

export default function AnalisePage() {
  const [pendentes, setPendentes] = useState<Interacao[]>([]);
  const [loading, setLoading] = useState(true);
  const [selecionada, setSelecionada] = useState<Interacao | null>(null);
  
  // Estado do formulário de classificação
  const [formData, setFormData] = useState({
    tipo: 'duvida_simples',
    complexidade: 3,
    tempoGastoMin: 5,
    observacao: ''
  });
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    buscarPendentes();
  }, []);

  const buscarPendentes = async () => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:3001/analise/pendentes');
      const data = await res.json();
      if (data.status === 'ok') {
        setPendentes(data.data);
      }
    } catch (error) {
      console.error('Erro ao buscar pendentes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClassificar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selecionada) return;

    setSalvando(true);
    try {
      const res = await fetch(`http://localhost:3001/analise/classificar/${selecionada.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      
      if (data.status === 'ok') {
        alert('Conversa classificada com sucesso!');
        setSelecionada(null);
        setFormData({ tipo: 'duvida_simples', complexidade: 3, tempoGastoMin: 5, observacao: '' });
        buscarPendentes(); // Atualiza a lista removendo a que foi classificada
      } else {
        alert('Erro ao classificar: ' + data.message);
      }
    } catch (error) {
      console.error('Erro ao salvar classificação:', error);
      alert('Erro de conexão com o servidor.');
    } finally {
      setSalvando(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Carregando conversas pendentes...</div>;

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">📊 Análise e Classificação de Conversas</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Lista de Pendentes */}
        <div className="lg:col-span-1 bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <h2 className="text-lg font-semibold text-gray-700">Pendentes de Análise ({pendentes.length})</h2>
          </div>
          <div className="max-h-[600px] overflow-y-auto">
            {pendentes.length === 0 ? (
              <p className="p-6 text-center text-gray-500">Nenhuma conversa pendente! Tudo em dia. 🎉</p>
            ) : (
              <ul className="divide-y divide-gray-200">
                {pendentes.map((item) => (
                  <li 
                    key={item.id}
                    onClick={() => {
                      setSelecionada(item);
                      setFormData({ tipo: 'duvida_simples', complexidade: 3, tempoGastoMin: 5, observacao: '' });
                    }}
                    className={`p-4 cursor-pointer hover:bg-blue-50 transition-colors ${selecionada?.id === item.id ? 'bg-blue-100 border-l-4 border-blue-500' : ''}`}
                  >
                    <p className="font-medium text-gray-900 truncate">{item.contato.contatoId}</p>
                    <p className="text-sm text-gray-600 truncate mt-1">{item.conteudo}</p>
                    <p className="text-xs text-gray-400 mt-2">{new Date(item.criadoEm).toLocaleString('pt-BR')}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Formulário de Classificação */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow p-6">
          {selecionada ? (
            <form onSubmit={handleClassificar} className="space-y-6">
              <div className="border-b border-gray-200 pb-4">
                <h2 className="text-xl font-bold text-gray-800 mb-2">Detalhes da Interação</h2>
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <p className="text-sm text-gray-500 mb-1">Contato: <span className="font-semibold text-gray-900">{selecionada.contato.contatoId}</span></p>
                  <p className="text-sm text-gray-500 mb-1">Assunto: <span className="font-semibold text-gray-900">{selecionada.contato.ultimoAssunto || 'Não informado'}</span></p>
                  <p className="text-sm text-gray-500 mb-1">Data: {new Date(selecionada.criadoEm).toLocaleString('pt-BR')}</p>
                  <div className="mt-3 p-3 bg-white rounded border border-gray-300">
                    <p className="text-gray-800 whitespace-pre-wrap">{selecionada.conteudo}</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Pedido</label>
                  <select 
                    value={formData.tipo}
                    onChange={(e) => setFormData({...formData, tipo: e.target.value})}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="duvida_simples">Dúvida simples</option>
                    <option value="pedido_documento">Pedido de documento</option>
                    <option value="abertura_empresa">Abertura de empresa</option>
                    <option value="fechamento_mensal">Fechamento mensal</option>
                    <option value="problema_tecnico">Problema técnico</option>
                    <option value="so_informacao">Só informação (sem ação)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Complexidade (1 a 5)</label>
                  <input 
                    type="number" 
                    min="1" 
                    max="5"
                    value={formData.complexidade}
                    onChange={(e) => setFormData({...formData, complexidade: parseInt(e.target.value)})}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tempo Gasto (minutos)</label>
                  <input 
                    type="number" 
                    min="0"
                    value={formData.tempoGastoMin}
                    onChange={(e) => setFormData({...formData, tempoGastoMin: parseInt(e.target.value)})}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Observações / Insights</label>
                <textarea 
                  value={formData.observacao}
                  onChange={(e) => setFormData({...formData, observacao: e.target.value})}
                  placeholder="Ex: Cliente confuso com o menu, sugerir melhoria no texto..."
                  rows={3}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex gap-4 pt-4 border-t border-gray-200">
                <button 
                  type="submit" 
                  disabled={salvando}
                  className="flex-1 bg-blue-600 text-white font-semibold py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {salvando ? 'Salvando...' : '💾 Salvar Classificação'}
                </button>
                <button 
                  type="button"
                  onClick={() => setSelecionada(null)}
                  className="px-6 py-3 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </form>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-gray-400 min-h-[400px]">
              <svg className="w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
              <p className="text-lg">Selecione uma conversa à esquerda para classificar.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}