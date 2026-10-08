'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { 
  Building2, 
  ChevronDown, 
  ChevronRight, 
  Loader2,
  Search,
  ThumbsUp,
  ThumbsDown,
  AlertTriangle,
  Send,
  Clock,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import api from '@/lib/axios';

interface Obligation {
  id: string;
  name: string;
  status: 'PENDENTE' | 'ENVIADO' | 'ATRASADO' | 'CANCELADO';
  isActive: boolean;
  estimatedTimeMinutes: number;
  scheduleId: string;
}

interface Department {
  department: string;
  total: number;
  ok: number;
  problem: number;
  alert: number;
  sent: number;
  obligations: Obligation[];
}

interface ClientWithObligations {
  id: string;
  companyName: string;
  cnpj?: string;
  taxRegime?: string;
  status?: string;
  departments: Department[];
  totalObligations: number;
}

export default function ObligationsByClientPage() {
  const { user } = useAuthStore();
  const [clients, setClients] = useState<ClientWithObligations[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedClientId, setExpandedClientId] = useState<string | null>(null);
  const [expandedDepts, setExpandedDepts] = useState<Set<string>>(new Set());
  const [searchClient, setSearchClient] = useState('');

  const fetchClients = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/obligations/clients-with-obligations');
      setClients(data);
    } catch (error) {
      toast.error('Falha ao carregar clientes.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  const toggleClient = (clientId: string) => {
    setExpandedClientId(expandedClientId === clientId ? null : clientId);
  };

  const toggleDept = (deptKey: string) => {
    const newDepts = new Set(expandedDepts);
    if (newDepts.has(deptKey)) {
      newDepts.delete(deptKey);
    } else {
      newDepts.add(deptKey);
    }
    setExpandedDepts(newDepts);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ENVIADO': return 'bg-emerald-500';
      case 'ATRASADO': return 'bg-red-500';
      case 'PENDENTE': return 'bg-amber-500';
      case 'CANCELADO': return 'bg-slate-400';
      default: return 'bg-slate-300';
    }
  };

  const filteredClients = clients.filter(c => 
    c.companyName.toLowerCase().includes(searchClient.toLowerCase())
  );

  const formatCNPJ = (cnpj?: string) => {
    if (!cnpj) return '-';
    return cnpj.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <Building2 className="text-[#0d9488]" /> Obrigações por Cliente
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          Visualize as obrigações de cada cliente agrupadas por departamento.
        </p>
      </div>

      {/* Busca */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Buscar cliente por nome..."
            value={searchClient} 
            onChange={(e) => setSearchClient(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-[#0d9488]/20 focus:border-[#0d9488] outline-none"
          />
        </div>
      </div>

      {/* Lista de Clientes */}
      <div className="space-y-3">
        {loading ? (
          <div className="p-12 flex flex-col items-center justify-center gap-3 text-slate-500 bg-white rounded-xl border border-slate-200">
            <Loader2 className="animate-spin text-[#0d9488]" size={32} />
            <span>Carregando clientes...</span>
          </div>
        ) : filteredClients.length === 0 ? (
          <div className="p-12 text-center text-slate-500 bg-white rounded-xl border border-slate-200">
            <Building2 className="w-12 h-12 mx-auto mb-3 text-slate-300" />
            <p className="font-medium">Nenhum cliente encontrado</p>
          </div>
        ) : (
          filteredClients.map((client) => {
            const isExpanded = expandedClientId === client.id;

            return (
              <div key={client.id} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                {/* Header do Cliente */}
                <button
                  onClick={() => toggleClient(client.id)}
                  className="w-full flex items-center justify-between p-5 hover:bg-slate-50 transition-colors text-left"
                >
                  <div className="flex items-center gap-4 flex-1">
                    {isExpanded ? <ChevronDown className="w-5 h-5 text-slate-400" /> : <ChevronRight className="w-5 h-5 text-slate-400" />}
                    <div className="flex-1">
                      <h3 className="font-semibold text-slate-900 text-lg">{client.companyName}</h3>
                      <div className="flex items-center gap-4 mt-1 text-xs text-slate-500">
                        <span>CNPJ: {formatCNPJ(client.cnpj)}</span>
                        {client.taxRegime && <span>• Regime: {client.taxRegime}</span>}
                        <span>• {client.totalObligations} obrigações</span>
                      </div>
                    </div>
                  </div>
                </button>

                {/* Conteúdo Expandido */}
                {isExpanded && (
                  <div className="border-t border-slate-200 bg-slate-50/50 p-5">
                    {client.departments.length === 0 ? (
                      <p className="text-sm text-slate-500 text-center py-8">
                        Este cliente não possui obrigações cadastradas.
                      </p>
                    ) : (
                      <div className="space-y-4">
                        {client.departments.map((dept) => {
                          const deptKey = `${client.id}-${dept.department}`;
                          const isDeptExpanded = expandedDepts.has(deptKey);

                          return (
                            <div key={deptKey} className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                              {/* Header do Departamento */}
                              <button
                                onClick={() => toggleDept(deptKey)}
                                className="w-full flex items-center justify-between p-3 hover:bg-slate-50 transition-colors"
                              >
                                <div className="flex items-center gap-3">
                                  {isDeptExpanded ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
                                  <span className="font-semibold text-slate-800">{dept.department}</span>
                                  <span className="text-xs text-slate-500">({dept.total} obrigações)</span>
                                </div>

                                {/* Indicadores Coloridos */}
                                <div className="flex items-center gap-2">
                                  <div className="flex items-center gap-1 px-2 py-1 bg-emerald-100 rounded text-xs">
                                    <ThumbsUp className="w-3 h-3 text-emerald-600" />
                                    <span className="font-semibold text-emerald-700">{dept.ok}</span>
                                  </div>
                                  <div className="flex items-center gap-1 px-2 py-1 bg-red-100 rounded text-xs">
                                    <ThumbsDown className="w-3 h-3 text-red-600" />
                                    <span className="font-semibold text-red-700">{dept.problem}</span>
                                  </div>
                                  <div className="flex items-center gap-1 px-2 py-1 bg-amber-100 rounded text-xs">
                                    <AlertTriangle className="w-3 h-3 text-amber-600" />
                                    <span className="font-semibold text-amber-700">{dept.alert}</span>
                                  </div>
                                  <div className="flex items-center gap-1 px-2 py-1 bg-blue-100 rounded text-xs">
                                    <Send className="w-3 h-3 text-blue-600" />
                                    <span className="font-semibold text-blue-700">{dept.sent}</span>
                                  </div>
                                </div>
                              </button>

                              {/* Lista de Obrigações do Departamento */}
                              {isDeptExpanded && (
                                <div className="border-t border-slate-200">
                                  <table className="w-full text-sm">
                                    <thead className="bg-slate-50">
                                      <tr>
                                        <th className="px-4 py-2 text-left text-xs font-semibold text-slate-600 uppercase">Obrigação</th>
                                        <th className="px-4 py-2 text-left text-xs font-semibold text-slate-600 uppercase">Status</th>
                                        <th className="px-4 py-2 text-left text-xs font-semibold text-slate-600 uppercase">Tempo Previsto</th>
                                        <th className="px-4 py-2 text-left text-xs font-semibold text-slate-600 uppercase">Ativa?</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                      {dept.obligations.map((obligation) => (
                                        <tr key={obligation.id} className="hover:bg-slate-50/50">
                                          <td className="px-4 py-2 font-medium text-slate-900">{obligation.name}</td>
                                          <td className="px-4 py-2">
                                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium text-white ${getStatusColor(obligation.status)}`}>
                                              {obligation.status}
                                            </span>
                                          </td>
                                          <td className="px-4 py-2 text-slate-600">
                                            <div className="flex items-center gap-1">
                                              <Clock className="w-3 h-3" />
                                              {obligation.estimatedTimeMinutes} min
                                            </div>
                                          </td>
                                          <td className="px-4 py-2">
                                            {obligation.isActive ? (
                                              <span className="inline-flex items-center gap-1 text-emerald-600 text-xs font-medium">
                                                <CheckCircle2 className="w-3 h-3" /> Sim
                                              </span>
                                            ) : (
                                              <span className="inline-flex items-center gap-1 text-slate-400 text-xs font-medium">
                                                <XCircle className="w-3 h-3" /> Não
                                              </span>
                                            )}
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}