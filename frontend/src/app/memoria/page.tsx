// =================================================================
// F14 - Frontend: Página de Memória do Cliente
// Permite buscar um contato e visualizar seu perfil unificado e histórico.
// =================================================================

'use client';

import { useState } from 'react';

interface Interacao {
  id: string;
  tipo: string;
  conteudo: string;
  metadata: any;
  criadoEm: string;
}

interface Perfil {
  contatoId: string;
  documento: string | null;
  ultimoAssunto: string | null;
  totalInteracoes: number;
}

interface MemoriaData {
  perfil: Perfil;
  historico: Interacao[];
}

export default function MemoriaPage() {
  const [contatoId, setContatoId] = useState('');
  const [data, setData] = useState<MemoriaData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const buscarMemoria = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contatoId.trim()) return;

    setLoading(true);
    setError('');
    setData(null);

    try {
      const res = await fetch(`http://localhost:3001/memoria/${contatoId}`);
      const json = await res.json();

      if (json.status === 'ok') {
        setData(json.data);
      } else {
        setError(json.message || 'Cliente não encontrado na memória.');
      }
    } catch (err) {
      setError('Erro ao conectar com o backend. Verifique se o servidor está rodando.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">🧠 Memória do Cliente</h1>
      
      {/* Formulário de Busca */}
      <form onSubmit={buscarMemoria} className="mb-8 bg-white p-6 rounded-lg shadow">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Buscar por ID do Contato (ex: 5511999999999) ou Documento
        </label>
        <div className="flex gap-4">
          <input
            type="text"
            value={contatoId}
            onChange={(e) => setContatoId(e.target.value)}
            placeholder="Digite o ID ou CPF/CNPJ..."
            className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Buscando...' : 'Buscar'}
          </button>
        </div>
        {error && <p className="mt-4 text-red-600 font-medium">{error}</p>}
      </form>

      {/* Resultados */}
      {data && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Card de Perfil Unificado */}
          <div className="lg:col-span-1 bg-white p-6 rounded-lg shadow border-t-4 border-blue-500">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Perfil Unificado</h2>
            <div className="space-y-4">
              <div>
                <p className="text-xs text-gray-500 uppercase">ID do Contato</p>
                <p className="text-lg font-semibold text-gray-900 break-all">{data.perfil.contatoId}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase">Documento</p>
                <p className="text-gray-900">{data.perfil.documento || 'Não informado'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase">Último Assunto</p>
                <p className="text-gray-900 font-medium text-blue-700">
                  {data.perfil.ultimoAssunto || 'Nenhum assunto registrado'}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase">Total de Interações</p>
                <p className="text-2xl font-bold text-gray-800">{data.perfil.totalInteracoes}</p>
              </div>
            </div>
          </div>

          {/* Linha do Tempo de Interações */}
          <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Linha do Tempo de Interações</h2>
            {data.historico.length === 0 ? (
              <p className="text-gray-500 italic">Nenhuma interação registrada para este contato.</p>
            ) : (
              <div className="space-y-4">
                {data.historico.map((interacao) => (
                  <div key={interacao.id} className="border-l-4 border-gray-300 pl-4 py-2 hover:bg-gray-50 transition-colors">
                    <div className="flex justify-between items-start mb-1">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        interacao.tipo === 'mensagem' ? 'bg-blue-100 text-blue-800' :
                        interacao.tipo === 'evento_tracking' ? 'bg-green-100 text-green-800' :
                        'bg-purple-100 text-purple-800'
                      }`}>
                        {interacao.tipo.replace('_', ' ').toUpperCase()}
                      </span>
                      <span className="text-xs text-gray-500">
                        {new Date(interacao.criadoEm).toLocaleString('pt-BR')}
                      </span>
                    </div>
                    <p className="text-gray-800 mb-2">{interacao.conteudo}</p>
                    {interacao.metadata && (
                      <details className="text-xs text-gray-500 bg-gray-100 p-2 rounded">
                        <summary className="cursor-pointer font-medium">Ver metadados</summary>
                        <pre className="mt-2 overflow-x-auto">{JSON.stringify(interacao.metadata, null, 2)}</pre>
                      </details>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}