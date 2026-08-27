/**
 * =================================================================
 * PÁGINA: Listagem de Propostas Comerciais
 * =================================================================
 * Responsabilidade: Listar todas as propostas do escritório, permitindo
 * busca, visualização e acesso rápido ao gerenciamento de versões (Sprint A3).
 * =================================================================
 */
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/axios';
import { toast } from 'sonner';
import { FileText, Plus, GitBranch, Eye, Loader2, Search } from 'lucide-react';

interface Proposal {
  id: string;
  proposalNumber: string;
  clientName: string;
  status: string;
  basePrice: number;
  version: number;
  isCurrent: boolean;
  createdAt: string;
}

export default function PropostasPage() {
  const router = useRouter();
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadProposals();
  }, []);

  async function loadProposals() {
    try {
      setLoading(true);
      const res = await api.get('/proposals');
      // O backend retorna { success: true, data: [...] }
      setProposals(res.data.data || []);
    } catch (err) {
      console.error(err);
      toast.error('Erro ao carregar propostas');
    } finally {
      setLoading(false);
    }
  }

  const filteredProposals = proposals.filter(p => 
    p.clientName.toLowerCase().includes(search.toLowerCase()) ||
    p.proposalNumber.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="h-12 w-12 text-teal-600 animate-spin mb-4" />
        <p className="text-slate-600">Carregando propostas...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 max-w-7xl mx-auto">
      {/* Cabeçalho */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
            <FileText className="h-8 w-8 text-teal-600" />
            Propostas Comerciais
          </h1>
          <p className="text-slate-600 mt-1">
            Gerencie o funil de vendas e o histórico de versões das suas propostas.
          </p>
        </div>
        <button 
          onClick={() => router.push('/dashboard/precificacao/propostas/nova')} 
          className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-lg transition-colors"
        >
          <Plus className="h-4 w-4" /> Nova Proposta
        </button>
      </div>

      {/* Tabela de Propostas */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center gap-2">
          <Search className="h-5 w-5 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por cliente ou número da proposta..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 bg-transparent outline-none text-slate-900 placeholder:text-slate-500"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="px-6 py-3">Nº Proposta</th>
                <th className="px-6 py-3">Cliente</th>
                <th className="px-6 py-3">Valor Base</th>
                <th className="px-6 py-3">Versão</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredProposals.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                    Nenhuma proposta encontrada.
                  </td>
                </tr>
              ) : (
                filteredProposals.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-slate-900">{p.proposalNumber}</td>
                    <td className="px-6 py-4 text-slate-700">{p.clientName}</td>
                    <td className="px-6 py-4 text-slate-700">
                      R$ {p.basePrice?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${p.isCurrent ? 'bg-teal-100 text-teal-700' : 'bg-slate-100 text-slate-600'}`}>
                        v{p.version} {p.isCurrent && '(Atual)'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        p.status === 'CLOSED_WON' ? 'bg-green-100 text-green-700' :
                        p.status === 'CLOSED_LOST' ? 'bg-red-100 text-red-700' :
                        p.status === 'SENT' ? 'bg-blue-100 text-blue-700' :
                        'bg-slate-100 text-slate-600'
                      }`}>
                        {p.status === 'CLOSED_WON' ? 'GANHA' : p.status === 'CLOSED_LOST' ? 'PERDIDA' : p.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {/* 🆕 BOTÃO PARA A PÁGINA DE VERSÕES (Sprint A3) */}
                        <button
                          onClick={() => router.push(`/dashboard/precificacao/propostas/${p.id}/versoes`)}
                          className="p-2 text-slate-500 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors"
                          title="Gerenciar Versões"
                        >
                          <GitBranch className="h-4 w-4" />
                        </button>
                        
                        {/* Botão para visualizar a proposta */}
                        <button
                          onClick={() => router.push(`/dashboard/precificacao/propostas/${p.id}`)}
                          className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Visualizar Proposta"
                        >
                          <Eye className="h-4 w-4" />
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
    </div>
  );
}