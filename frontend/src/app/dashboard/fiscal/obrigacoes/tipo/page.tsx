'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { 
  FileSpreadsheet, 
  ChevronDown, 
  ChevronRight, 
  CheckCircle2,
  AlertTriangle,
  Clock,
  Calendar,
  Loader2,
  Search,
  TrendingUp,
  AlertCircle,
  ArrowRight
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import api from '@/lib/axios';
import { useRouter } from 'next/navigation';

interface ClientObligation {
  id: string;
  companyName: string;
  cnpj?: string;
  taxRegime?: string;
  status: 'PENDENTE' | 'ENVIADO' | 'ATRASADO' | 'CANCELADO';
  deliveryId: string;
  scheduleId: string;
}

interface ObligationType {
  name: string;
  totalClients: number;
  green: number;   // Entregues
  red: number;     // Atrasadas/Pendentes vencidas
  orange: number;  // Próximos 30 dias
  blue: number;    // Futuras
  clients: ClientObligation[];
}

export default function ObligationsByTypePage() {
  const { user } = useAuthStore();
  const router = useRouter();
  const [obligations, setObligations] = useState<ObligationType[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedType, setExpandedType] = useState<string | null>(null);
  const [searchClient, setSearchClient] = useState('');

  const fetchObligations = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/obligations/by-obligation-type');
      setObligations(data);
    } catch (error) {
      toast.error('Falha ao carregar obrigações.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchObligations();
  }, []);

  const toggleType = (typeName: string) => {
    setExpandedType(expandedType === typeName ? null : typeName);
  };

  // Navega para gestão de tarefas com o filtro adequado
  const navigateToTaskManagement = (obligationName: string, filterType: 'green' | 'red' | 'orange' | 'blue') => {
    // Constrói a URL com parâmetros de filtro
    let statusFilter = '';
    let dateFilter = '';
    
    switch (filterType) {
      case 'green':
        // Entregues/Enviadas
        statusFilter = 'entregues';
        break;
      case 'red':
        // Pendentes e justificadas (atrasadas)
        statusFilter = 'pendentes,justificadas';
        break;
      case 'orange':
        // Próximos 30 dias
        statusFilter = 'pendentes';
        dateFilter = 'proximos-30-dias';
        break;
      case 'blue':
        // Futuras até final do ano
        statusFilter = 'previsoes';
        dateFilter = 'ate-final-ano';
        break;
    }

    const params = new URLSearchParams();
    params.set('obrigacao', obligationName);
    if (statusFilter) params.set('status', statusFilter);
    if (dateFilter) params.set('prazo', dateFilter);

    router.push(`/dashboard/gestao-tarefas?${params.toString()}`);
  };

  const filteredObligations = obligations.filter(obs => {
    if (!searchClient) return true;
    return obs.clients.some(c => 
      c.companyName.toLowerCase().includes(searchClient.toLowerCase())
    );
  });

  const formatCNPJ = (cnpj?: string) => {
    if (!cnpj) return '-';
    return cnpj.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      ENVIADO: { color: 'bg-emerald-100 text-emerald-800', label: 'Enviado', icon: CheckCircle2 },
      PENDENTE: { color: 'bg-amber-100 text-amber-800', label: 'Pendente', icon: Clock },
      ATRASADO: { color: 'bg-red-100 text-red-800', label: 'Atrasado', icon: AlertTriangle },
      CANCELADO: { color: 'bg-slate-100 text-slate-600', label: 'Cancelado', icon: FileSpreadsheet },
    };
    const badge = badges[status as keyof typeof badges] || badges.PENDENTE;
    const Icon = badge.icon;
    
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${badge.color}`}>
        <Icon size={12} />
        {badge.label}
      </span>
    );
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <FileSpreadsheet className="text-[#0d9488]" /> Gestão de Obrigações por Tipo
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          Clique nos indicadores coloridos para acessar a gestão de tarefas com filtros automáticos.
        </p>
      </div>

      {/* Legenda */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
        <h3 className="text-sm font-semibold text-slate-700 mb-3">Legenda dos Indicadores:</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="flex items-center gap-2 p-2 bg-emerald-50 rounded-lg border border-emerald-200">
            <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center">
              <CheckCircle2 size={16} className="text-white" />
            </div>
            <div>
              <p className="text-xs font-semibold text-emerald-800">Verde</p>
              <p className="text-[10px] text-emerald-600">Entregues/Resolvidas</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 p-2 bg-red-50 rounded-lg border border-red-200">
            <div className="w-8 h-8 rounded-full bg-red-500 flex items-center justify-center">
              <AlertTriangle size={16} className="text-white" />
            </div>
            <div>
              <p className="text-xs font-semibold text-red-800">Vermelho</p>
              <p className="text-[10px] text-red-600">Atraso Técnico</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 p-2 bg-amber-50 rounded-lg border border-amber-200">
            <div className="w-8 h-8 rounded-full bg-amber-500 flex items-center justify-center">
              <Clock size={16} className="text-white" />
            </div>
            <div>
              <p className="text-xs font-semibold text-amber-800">Laranja</p>
              <p className="text-[10px] text-amber-600">Próximos 30 dias</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 p-2 bg-blue-50 rounded-lg border border-blue-200">
            <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center">
              <Calendar size={16} className="text-white" />
            </div>
            <div>
              <p className="text-xs font-semibold text-blue-800">Azul</p>
              <p className="text-[10px] text-blue-600">Futuras (até final do ano)</p>
            </div>
          </div>
        </div>
      </div>

      {/* Busca */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Buscar cliente..."
            value={searchClient} 
            onChange={(e) => setSearchClient(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-[#0d9488]/20 focus:border-[#0d9488] outline-none"
          />
        </div>
      </div>

      {/* Lista de Obrigações por Tipo */}
      <div className="space-y-3">
        {loading ? (
          <div className="p-12 flex flex-col items-center justify-center gap-3 text-slate-500 bg-white rounded-xl border border-slate-200">
            <Loader2 className="animate-spin text-[#0d9488]" size={32} />
            <span>Carregando obrigações...</span>
          </div>
        ) : filteredObligations.length === 0 ? (
          <div className="p-12 text-center text-slate-500 bg-white rounded-xl border border-slate-200">
            <FileSpreadsheet className="w-12 h-12 mx-auto mb-3 text-slate-300" />
            <p className="font-medium">Nenhuma obrigação encontrada</p>
          </div>
        ) : (
          filteredObligations.map((obligation) => {
            const isExpanded = expandedType === obligation.name;

            return (
              <div key={obligation.name} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                {/* Header da Obrigação */}
                <div className="p-5">
                  <div className="flex items-center justify-between mb-4">
                    <button
                      onClick={() => toggleType(obligation.name)}
                      className="flex items-center gap-3 flex-1 text-left"
                    >
                      {isExpanded ? <ChevronDown className="w-5 h-5 text-slate-400" /> : <ChevronRight className="w-5 h-5 text-slate-400" />}
                      <div>
                        <h3 className="font-bold text-lg text-slate-900">{obligation.name}</h3>
                        <p className="text-xs text-slate-500">{obligation.totalClients} empresas vinculadas</p>
                      </div>
                    </button>
                  </div>

                  {/* Indicadores Coloridos Clicáveis */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {/* Verde - Entregues */}
                    <button
                      onClick={() => navigateToTaskManagement(obligation.name, 'green')}
                      className="flex items-center justify-between p-3 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors group"
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                          <CheckCircle2 size={18} className="text-white" />
                        </div>
                        <div className="text-left">
                          <p className="text-2xl font-bold text-emerald-700">{obligation.green}</p>
                          <p className="text-[10px] text-emerald-600 font-medium">Entregues</p>
                        </div>
                      </div>
                      <ArrowRight size={16} className="text-emerald-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>

                    {/* Vermelho - Atrasadas */}
                    <button
                      onClick={() => navigateToTaskManagement(obligation.name, 'red')}
                      className="flex items-center justify-between p-3 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition-colors group"
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-10 h-10 rounded-full bg-red-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                          <AlertTriangle size={18} className="text-white" />
                        </div>
                        <div className="text-left">
                          <p className="text-2xl font-bold text-red-700">{obligation.red}</p>
                          <p className="text-[10px] text-red-600 font-medium">Atraso Técnico</p>
                        </div>
                      </div>
                      <ArrowRight size={16} className="text-red-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>

                    {/* Laranja - Próximos 30 dias */}
                    <button
                      onClick={() => navigateToTaskManagement(obligation.name, 'orange')}
                      className="flex items-center justify-between p-3 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-lg transition-colors group"
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-10 h-10 rounded-full bg-amber-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                          <Clock size={18} className="text-white" />
                        </div>
                        <div className="text-left">
                          <p className="text-2xl font-bold text-amber-700">{obligation.orange}</p>
                          <p className="text-[10px] text-amber-600 font-medium">Próximos 30 dias</p>
                        </div>
                      </div>
                      <ArrowRight size={16} className="text-amber-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>

                    {/* Azul - Futuras */}
                    <button
                      onClick={() => navigateToTaskManagement(obligation.name, 'blue')}
                      className="flex items-center justify-between p-3 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors group"
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                          <Calendar size={18} className="text-white" />
                        </div>
                        <div className="text-left">
                          <p className="text-2xl font-bold text-blue-700">{obligation.blue}</p>
                          <p className="text-[10px] text-blue-600 font-medium">Futuras</p>
                        </div>
                      </div>
                      <ArrowRight size={16} className="text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>
                  </div>
                </div>

                {/* Lista de Clientes (expandida) */}
                {isExpanded && (
                  <div className="border-t border-slate-200 bg-slate-50/50 p-5">
                    <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                      <table className="w-full text-sm">
                        <thead className="bg-slate-50">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Empresa</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">CNPJ</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Regime</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {obligation.clients
                            .filter(c => c.companyName.toLowerCase().includes(searchClient.toLowerCase()))
                            .map((client) => (
                              <tr key={client.deliveryId} className="hover:bg-slate-50/50">
                                <td className="px-4 py-3 font-medium text-slate-900">{client.companyName}</td>
                                <td className="px-4 py-3 text-slate-600 text-xs font-mono">{formatCNPJ(client.cnpj)}</td>
                                <td className="px-4 py-3 text-slate-600 text-xs">{client.taxRegime || '-'}</td>
                                <td className="px-4 py-3">{getStatusBadge(client.status)}</td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
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