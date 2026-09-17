// =================================================================
// 🎯 F15: TELA DE ANÁLISE E CLASSIFICAÇÃO DE CONVERSAS
// Interface para o gestor ler conversas e identificar gargalos
// =================================================================

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

// =========================================================================
// 🟦 BLOCO 1: INTERFACES TYPESCRIPT
// =========================================================================

interface Contato {
  contatoId: string;
  nomeCliente?: string;
  telefone?: string;
  ultimoAssunto?: string;
}

interface Analise {
  id: string;
  tipo?: string;
  complexidade?: number;
  tempoGastoMin?: number;
  observacao?: string;
  status: string;
}

interface Interacao {
  id: string;
  conteudo: string;
  canal: string;
  criadoEm: string;
  contato: Contato;
  analise: Analise | null;
}

// =========================================================================
// 🟦 BLOCO 2: COMPONENTE PRINCIPAL
// =========================================================================

export default function AnalisePage() {
  const router = useRouter();
  const [interacoes, setInteracoes] = useState<Interacao[]>([]);
  const [selecionada, setSelecionada] = useState<Interacao | null>(null);
  const [filtro, setFiltro] = useState<'todas' | 'pendente' | 'classificado'>('pendente');
  const [loading, setLoading] = useState(true);

  // Estado do formulário de classificação
  const [form, setForm] = useState({
    tipo: 'duvida_simples',
    complexidade: 3,
    tempoGastoMin: 5,
    observacao: '',
  });

  // =========================================================================
  // 🟨 BLOCO 3: CARREGAR LISTA DE CONVERSAS
  // =========================================================================
  const carregarConversas = async () => {
    try {
      setLoading(true);
      const url = filtro === 'todas' 
        ? 'http://localhost:3001/analise/conversas'
        : `http://localhost:3001/analise/conversas?status=${filtro}`;
        
      const res = await fetch(url);
      const data = await res.json();
      
      if (data.status === 'ok') {
        setInteracoes(data.data);
      }
    } catch (err) {
      console.error('Erro ao carregar conversas:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarConversas();
  }, [filtro]);

  // =========================================================================
  // 🟩 BLOCO 4: SELECIONAR CONVERSA E PREENCHER FORMULÁRIO
  // =========================================================================
  const selecionarConversa = (interacao: Interacao) => {
    setSelecionada(interacao);
    
    // Se já tiver classificação, preenche o formulário com os dados existentes
    if (interacao.analise) {
      setForm({
        tipo: interacao.analise.tipo || 'duvida_simples',
        complexidade: interacao.analise.complexidade || 3,
        tempoGastoMin: interacao.analise.tempoGastoMin || 5,
        observacao: interacao.analise.observacao || '',
      });
    } else {
      // Reseta para valores padrão
      setForm({ tipo: 'duvida_simples', complexidade: 3, tempoGastoMin: 5, observacao: '' });
    }
  };

  // =========================================================================
  // 🟧 BLOCO 5: SALVAR CLASSIFICAÇÃO
  // =========================================================================
  const salvarClassificacao = async () => {
    if (!selecionada) return;

    try {
      const res = await fetch(`http://localhost:3001/analise/classificar/${selecionada.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (data.status === 'ok') {
        alert('✅ Classificação salva com sucesso!');
        // Atualiza a lista e limpa a seleção
        setSelecionada(null);
        carregarConversas();
      } else {
        alert(`⚠️ ${data.message || 'Erro ao salvar classificação.'}`);
      }
    } catch (err) {
      alert('❌ Erro de conexão ao salvar classificação.');
      console.error(err);
    }
  };

  // =========================================================================
  // 🟥 BLOCO 6: RENDERIZAÇÃO DA UI
  // =========================================================================
  return (
    <div className="h-screen bg-gray-50 flex flex-col p-6">
      {/* CABEÇALHO */}
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">📊 Análise de Conversas (F15)</h1>
          <p className="text-gray-500 text-sm">Classifique as interações para identificar gargalos e treinar o bot.</p>
        </div>
        <button 
          onClick={() => router.push('/fila')}
          className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
        >
          ← Voltar para a Fila
        </button>
      </div>

      <div className="flex-1 flex gap-6 overflow-hidden">
        
        {/* ========================================================================= */}
        {/* 🟦 COLUNA 1: LISTA DE CONVERSAS (35% da largura) */}
        {/* ========================================================================= */}
        <div className="w-1/3 bg-white rounded-lg shadow flex flex-col">
          {/* Filtros */}
          <div className="p-4 border-b border-gray-200 flex gap-2">
            {(['pendente', 'classificado', 'todas'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFiltro(f)}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                  filtro === f 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {f === 'pendente' ? 'Pendentes' : f === 'classificado' ? 'Classificadas' : 'Todas'}
              </button>
            ))}
          </div>

          {/* Lista */}
          <div className="flex-1 overflow-y-auto p-2 space-y-2">
            {loading ? (
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : interacoes.length === 0 ? (
              <p className="text-center text-gray-500 py-8">Nenhuma conversa encontrada.</p>
            ) : (
              interacoes.map((item) => (
                <div
                  key={item.id}
                  onClick={() => selecionarConversa(item)}
                  className={`p-3 rounded-lg border cursor-pointer transition-all ${
                    selecionada?.id === item.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex justify-between items-start mb-1">
                    <span className="font-semibold text-sm text-gray-800 truncate">
                      {item.contato.nomeCliente || item.contato.contatoId}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      item.analise ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {item.analise ? 'Classificado' : 'Pendente'}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 line-clamp-2 mb-1">{item.conteudo}</p>
                  <div className="flex justify-between text-xs text-gray-400">
                    <span>{item.canal}</span>
                    <span>{new Date(item.criadoEm).toLocaleDateString('pt-BR')}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 🟩 COLUNA 2: DETALHES E CLASSIFICAÇÃO (65% da largura) */}
        {/* ========================================================================= */}
        <div className="flex-1 bg-white rounded-lg shadow flex flex-col overflow-hidden">
          {selecionada ? (
            <>
              {/* Timeline da Conversa */}
              <div className="flex-1 overflow-y-auto p-6 border-b border-gray-200 bg-gray-50">
                <h3 className="text-sm font-bold text-gray-500 uppercase mb-4">Timeline da Conversa</h3>
                <div className="space-y-4">
                  <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                    <p className="text-sm text-gray-800 whitespace-pre-wrap">{selecionada.conteudo}</p>
                    <div className="mt-2 flex justify-between text-xs text-gray-400">
                      <span className="font-medium">{selecionada.canal}</span>
                      <span>{new Date(selecionada.criadoEm).toLocaleString('pt-BR')}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Formulário de Classificação */}
              <div className="p-6 bg-white overflow-y-auto">
                <h3 className="text-sm font-bold text-gray-500 uppercase mb-4">Classificação Manual</h3>
                
                <div className="grid grid-cols-2 gap-4 mb-4">
                  {/* Tipo de Demanda */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Demanda</label>
                    <select
                      value={form.tipo}
                      onChange={(e) => setForm({ ...form, tipo: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    >
                      <option value="duvida_simples">Dúvida Simples</option>
                      <option value="pedido_documento">Pedido de Documento</option>
                      <option value="abertura_empresa">Abertura de Empresa</option>
                      <option value="fechamento_mensal">Fechamento Mensal</option>
                      <option value="problema_tecnico">Problema Técnico</option>
                      <option value="so_informacao">Só Informação (sem ação)</option>
                    </select>
                  </div>

                  {/* Complexidade */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Complexidade (1-5)
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="5"
                      value={form.complexidade}
                      onChange={(e) => setForm({ ...form, complexidade: Number(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>

                  {/* Tempo Gasto */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tempo Gasto (min)</label>
                    <input
                      type="number"
                      value={form.tempoGastoMin}
                      onChange={(e) => setForm({ ...form, tempoGastoMin: Number(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                </div>

                {/* Observações */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Observações / Tags</label>
                  <textarea
                    value={form.observacao}
                    onChange={(e) => setForm({ ...form, observacao: e.target.value })}
                    placeholder="Ex: #urgente, cliente pediu para ligar, bot não entendeu..."
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>

                {/* Botão de Ação */}
                <button
                  onClick={salvarClassificacao}
                  className="w-full px-4 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
                >
                  💾 Salvar Classificação
                </button>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-400">
              <div className="text-center">
                <p className="text-lg">Selecione uma conversa ao lado</p>
                <p className="text-sm">para visualizar o histórico e classificar.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}