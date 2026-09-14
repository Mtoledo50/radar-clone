// =================================================================
// DASHBOARD UNIFICADO: FALE CONOSCO (Versão 2.0 - Dados Reais)
// Consolida F13 (Tracking), F14 (Memória) e F15 (Análise)
// =================================================================

'use client';

import { useEffect, useState } from 'react';

interface Envio {
  id: string;
  protocolo: string;
  canal: string;
  status: string;
  criadoEm: string;
}

interface TipoPedido {
  tipo: string;
  quantidade: number;
  porcentagem: number;
  tempoMedioMin: number;
}

interface Estatisticas {
  totalClassificadas: number;
  totalPendentes: number;
  topTipos: TipoPedido[];
  gargalos: TipoPedido[];
}

export default function FaleConoscoDashboard() {
  const [envios, setEnvios] = useState<Envio[]>([]);
  const [estatisticas, setEstatisticas] = useState<Estatisticas | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const carregarDados = async () => {
      try {
        const [enviosRes, statsRes] = await Promise.all([
          fetch('http://localhost:3001/tracking/envios'),
          fetch('http://localhost:3001/analise/estatisticas'),
        ]);

        const enviosData = await enviosRes.json();
        const statsData = await statsRes.json();

        if (enviosData.status === 'ok') setEnvios(enviosData.data);
        if (statsData.status === 'ok') setEstatisticas(statsData.data);
      } catch (error) {
        console.error('Erro ao carregar dashboard:', error);
      } finally {
        setLoading(false);
      }
    };

    carregarDados();
  }, []);

  // Calcula métricas do funil
  const total = envios.length;
  const visualizados = envios.filter(e => e.status === 'visualizado' || e.status === 'respondido' || e.status === 'concluido').length;
  const respondidos = envios.filter(e => e.status === 'respondido' || e.status === 'concluido').length;
  const concluidos = envios.filter(e => e.status === 'concluido').length;

  if (loading) return <div className="p-8 text-center text-gray-500">Carregando dashboard...</div>;

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold text-gray-800 mb-2"> Dashboard Fale Conosco</h1>
      <p className="text-gray-500 mb-8">Visão unificada de Tracking, Memória e Análise de Conversas</p>

      {/* ============================================ */}
      {/* PAINEL 1: FUNIL DE COMUNICAÇÕES (F13) */}
      {/* ============================================ */}
      <div className="mb-8">
        <h2 className="text-xl font-bold text-gray-700 mb-4">📊 Funil de Comunicações</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
      </div>

      {/* ============================================ */}
      {/* PAINEL 2: TOP TIPOS E GARGALOS (F15) */}
      {/* ============================================ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Top Tipos de Pedidos */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-bold text-gray-700 mb-4">📈 Top Tipos de Pedidos</h2>
          {estatisticas && estatisticas.topTipos.length > 0 ? (
            <div className="space-y-3">
              {estatisticas.topTipos.map((item, idx) => (
                <div key={item.tipo} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium text-gray-700">
                      {idx + 1}. {item.tipo.replace('_', ' ')}
                    </span>
                    <span className="text-gray-500">
                      {item.porcentagem}% ({item.quantidade})
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-500 h-2 rounded-full transition-all"
                      style={{ width: `${item.porcentagem}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400 italic">Nenhuma classificação registrada ainda.</p>
          )}
        </div>

        {/* Gargalos de Tempo */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-bold text-gray-700 mb-4">⚠️ Gargalos de Tempo</h2>
          {estatisticas && estatisticas.gargalos.length > 0 ? (
            <div className="space-y-3">
              {estatisticas.gargalos.map((item) => (
                <div key={item.tipo} className="flex items-center justify-between p-3 bg-red-50 rounded-lg border-l-4 border-red-500">
                  <div>
                    <p className="font-medium text-gray-800">{item.tipo.replace('_', ' ')}</p>
                    <p className="text-xs text-gray-500">Tempo médio</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-red-600">{item.tempoMedioMin} min</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-gray-400 italic">Nenhum gargalo identificado (tempo médio &lt; 20 min).</p>
              <p className="text-sm text-gray-500">
                💡 Dica: Classifique mais conversas com tempo alto para ver gargalos aqui.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ============================================ */}
      {/* PAINEL 3: MEMÓRIA E PENDÊNCIAS (F14 + F15) */}
      {/* ============================================ */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-gradient-to-br from-purple-500 to-purple-700 text-white p-6 rounded-lg shadow">
          <p className="text-sm uppercase opacity-80">Conversas Classificadas</p>
          <p className="text-3xl font-bold">{estatisticas?.totalClassificadas || 0}</p>
          <p className="text-xs mt-2 opacity-70">Análises concluídas</p>
        </div>
        <div className="bg-gradient-to-br from-indigo-500 to-indigo-700 text-white p-6 rounded-lg shadow">
          <p className="text-sm uppercase opacity-80">Envios de Tracking</p>
          <p className="text-3xl font-bold">{total}</p>
          <p className="text-xs mt-2 opacity-70">Comunicações rastreadas</p>
        </div>
        <div className="bg-gradient-to-br from-red-500 to-red-700 text-white p-6 rounded-lg shadow">
          <p className="text-sm uppercase opacity-80">Pendentes de Análise</p>
          <p className="text-3xl font-bold">{estatisticas?.totalPendentes || 0}</p>
          <p className="text-xs mt-2 opacity-70">Aguardam classificação</p>
        </div>
      </div>

      {/* ============================================ */}
      {/* LINKS RÁPIDOS */}
      {/* ============================================ */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-lg font-bold text-gray-700 mb-4">🔗 Acesso Rápido aos Módulos</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <a href="/envios" className="block p-4 border-2 border-blue-200 rounded-lg hover:bg-blue-50 transition-colors">
            <p className="font-semibold text-blue-700">📬 Envios & Tracking</p>
            <p className="text-sm text-gray-500">Funil completo de comunicações</p>
          </a>
          <a href="/memoria" className="block p-4 border-2 border-purple-200 rounded-lg hover:bg-purple-50 transition-colors">
            <p className="font-semibold text-purple-700"> Memória do Cliente</p>
            <p className="text-sm text-gray-500">Perfil unificado e histórico</p>
          </a>
          <a href="/analise" className="block p-4 border-2 border-green-200 rounded-lg hover:bg-green-50 transition-colors">
            <p className="font-semibold text-green-700">📊 Análise de Conversas</p>
            <p className="text-sm text-gray-500">Classificação manual e insights</p>
          </a>
        </div>
      </div>
    </div>
  );
}