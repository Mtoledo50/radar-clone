// =================================================================
// F13 - Frontend: Página de Envios (Tracking) com Funil Visual
// =================================================================

'use client';

import { useEffect, useState } from 'react';

interface Envio {
  id: string;
  protocolo: string;
  canal: string;
  contatoId: string;
  status: 'enviado' | 'visualizado' | 'respondido' | 'concluido';
  criadoEm: string;
  eventos: { tipo: string; registradoEm: string }[];
}

export default function EnviosPage() {
  const [envios, setEnvios] = useState<Envio[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEnvios = async () => {
      try {
        const res = await fetch('http://localhost:3001/tracking/envios');
        const data = await res.json();
        if (data.status === 'ok') setEnvios(data.data);
      } catch (error) {
        console.error('Erro ao buscar envios:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchEnvios();
  }, []);

  // Calcula as métricas para o funil
  const total = envios.length;
  const visualizados = envios.filter(e => e.status === 'visualizado' || e.status === 'respondido' || e.status === 'concluido').length;
  const respondidos = envios.filter(e => e.status === 'respondido' || e.status === 'concluido').length;
  const concluidos = envios.filter(e => e.status === 'concluido').length;

  if (loading) return <div className="p-8 text-center text-gray-500">Carregando dados do funil...</div>;

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">📊 Funil de Comunicações</h1>
      
      {/* Cards do Funil */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-6 rounded-lg shadow border-l-4 border-gray-400">
          <p className="text-sm text-gray-500 uppercase">Total Enviados</p>
          <p className="text-3xl font-bold text-gray-800">{total}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow border-l-4 border-blue-500">
          <p className="text-sm text-gray-500 uppercase">Visualizados</p>
          <p className="text-3xl font-bold text-blue-600">{visualizados}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow border-l-4 border-yellow-500">
          <p className="text-sm text-gray-500 uppercase">Respondidos</p>
          <p className="text-3xl font-bold text-yellow-600">{respondidos}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow border-l-4 border-green-500">
          <p className="text-sm text-gray-500 uppercase">Concluídos</p>
          <p className="text-3xl font-bold text-green-600">{concluidos}</p>
        </div>
      </div>

      {/* Tabela Detalhada */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-700">Histórico Detalhado</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Protocolo</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Canal</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Eventos</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {envios.map((envio) => (
                <tr key={envio.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{envio.protocolo}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">{envio.canal}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                      ${envio.status === 'concluido' ? 'bg-green-100 text-green-800' : 
                        envio.status === 'respondido' ? 'bg-yellow-100 text-yellow-800' : 
                        envio.status === 'visualizado' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}>
                      {envio.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(envio.criadoEm).toLocaleString('pt-BR')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {envio.eventos.length}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}