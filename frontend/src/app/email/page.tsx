"use client";

import { useEffect, useState } from "react";

// Interface atualizada para incluir as datas de rastreamento
interface Envio {
  id: string;
  clienteNome: string;
  nomeArquivo: string;
  status: string;
  criadoEm: string;
  dataEnvio: string | null;
  dataAbertura: string | null; // 👈 Adicionado
  dataDownload: string | null; // 👈 Adicionado
  aberto: boolean;
  baixado: boolean;
}

export default function PainelEnvios() {
  const [envios, setEnvios] = useState<Envio[]>([]);
  const [loading, setLoading] = useState(true);
  const [erroApi, setErroApi] = useState<string | null>(null);

  const buscarEnvios = async () => {
    try {
      setErroApi(null);
      const res = await fetch("http://localhost:3001/api/email/track/lista");
      
      if (!res.ok) {
        throw new Error(`Erro na API: ${res.status} ${res.statusText}`);
      }

      const data = await res.json();

      if (Array.isArray(data)) {
        setEnvios(data);
      } else {
        setEnvios([]);
      }
    } catch (error: any) {
      console.error("❌ Erro ao buscar envios:", error);
      setErroApi(error.message || "Falha ao conectar com o backend.");
      setEnvios([]);
    } finally {
      setLoading(false);
    }
  };

  const dispararEnvios = async () => {
    try {
      const res = await fetch("http://localhost:3001/api/email/track/disparar");
      if (res.ok) {
        alert("✅ Processo de envio em massa iniciado! Atualizando lista...");
        setTimeout(buscarEnvios, 2000);
      } else {
        alert("❌ Erro ao disparar envios.");
      }
    } catch (error) {
      alert("❌ Erro de conexão ao disparar envios.");
    }
  };

  const enviarIndividual = async (id: string, clienteNome: string) => {
    if (!confirm(`Deseja enviar o e-mail agora para ${clienteNome}?`)) return;

    try {
      const res = await fetch(`http://localhost:3001/api/email/track/enviar-individual/${id}`);
      if (res.ok) {
        alert(`✅ E-mail enviado com sucesso para ${clienteNome}!`);
        setTimeout(buscarEnvios, 2000);
      } else {
        alert("❌ Erro ao enviar e-mail.");
      }
    } catch (error) {
      alert("❌ Erro de conexão.");
    }
  };

  const excluirRegistro = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este registro do banco de dados?")) return;

    try {
      const res = await fetch(`http://localhost:3001/api/email/track/excluir/${id}`);
      if (res.ok) {
        alert("🗑️ Registro excluído com sucesso!");
        setTimeout(buscarEnvios, 1000);
      } else {
        alert("❌ Erro ao excluir.");
      }
    } catch (error) {
      alert("❌ Erro de conexão.");
    }
  };

  useEffect(() => {
    buscarEnvios();
  }, []);

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      PENDENTE: "bg-yellow-100 text-yellow-800 border-yellow-200",
      ENVIADO: "bg-blue-100 text-blue-800 border-blue-200",
      FALHOU: "bg-red-100 text-red-800 border-red-200",
    };
    return styles[status] || "bg-gray-100 text-gray-800";
  };

  // Função auxiliar para formatar datas
  const formatarData = (dataString: string | null) => {
    if (!dataString) return "";
    return new Date(dataString).toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">
          📊 Painel de Controle de Envios
        </h1>
        <button
          onClick={dispararEnvios}
          className="bg-teal-600 hover:bg-teal-700 text-white font-bold py-2 px-6 rounded-lg shadow transition disabled:opacity-50"
          disabled={loading}
        >
          🚀 Disparar Todos os Pendentes
        </button>
      </div>

      {erroApi && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <strong>Erro de Conexão:</strong> {erroApi}
        </div>
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data Envio</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cliente</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Arquivo</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rastreamento</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
            </tr>
          </thead>
          
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr><td colSpan={6} className="text-center py-8 text-gray-500">Carregando dados...</td></tr>
            ) : envios.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-8 text-gray-500">Nenhum envio registrado no momento.</td></tr>
            ) : (
              envios.map((envio) => (
                <tr key={envio.id} className="hover:bg-gray-50 transition">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {envio.dataEnvio ? new Date(envio.dataEnvio).toLocaleString("pt-BR") : "-"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {envio.clienteNome}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 truncate max-w-xs" title={envio.nomeArquivo}>
                    {envio.nomeArquivo}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full border ${getStatusBadge(envio.status)}`}>
                      {envio.status}
                    </span>
                  </td>
                  
                  {/* 👇 COLUNA DE RASTREAMENTO ATUALIZADA COM DATA E HORA */}
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex flex-col gap-1">
                      {envio.aberto && (
                        <span className="flex items-center gap-1 text-blue-600" title={`Aberto em: ${formatarData(envio.dataAbertura)}`}>
                          👁️ Aberto <span className="text-xs text-gray-400 font-normal">({formatarData(envio.dataAbertura)})</span>
                        </span>
                      )}
                      {envio.baixado && (
                        <span className="flex items-center gap-1 text-teal-700 font-medium" title={`Baixado em: ${formatarData(envio.dataDownload)}`}>
                          📥 Baixado <span className="text-xs text-gray-400 font-normal">({formatarData(envio.dataDownload)})</span>
                        </span>
                      )}
                      {!envio.aberto && !envio.baixado && (
                        <span className="text-gray-300">Aguardando interação</span>
                      )}
                    </div>
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex space-x-3">
                      <button
                        onClick={() => enviarIndividual(envio.id, envio.clienteNome)}
                        className="text-teal-600 hover:text-teal-800 font-medium flex items-center gap-1 transition"
                        disabled={envio.status !== 'PENDENTE'}
                      >
                        📤 Enviar
                      </button>
                      <button
                        onClick={() => excluirRegistro(envio.id)}
                        className="text-red-600 hover:text-red-800 font-medium flex items-center gap-1 transition"
                      >
                        🗑️ Excluir
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}