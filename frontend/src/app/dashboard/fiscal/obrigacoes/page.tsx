'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { 
  FileText, 
  Plus, 
  Search, 
  Filter,
  CheckCircle2, 
  Clock, 
  AlertTriangle,
  XCircle,
  Loader2,
  TrendingUp,
  DollarSign
} from 'lucide-react';
import CreateObligationModal from '@/components/fiscal/CreateObligationModal';
import { useAuthStore } from '@/store/authStore';
import api from '@/lib/axios';

type ObligationStatus = 'PENDENTE' | 'PAGO' | 'ATRASADO' | 'CANCELADO' | 'DISPENSADO';
type ObligationType = 'DAS' | 'DARF_IRRF' | 'DARF_CSLL' | 'DARF_PIS_COFINS' | 'GPS' | 'FGTS' | 'ISS' | 'ICMS' | 'OUTROS';

interface TaxObligation {
  id: string;
  type: ObligationType;
  competence: string;
  dueDate: string;
  amount: number;
  status: ObligationStatus;
  obs?: string;
  clientId: string;
}

interface Metrics {
  pendente: { count: number; total: number };
  atrasado: { count: number; total: number };
  pago: { total: number };
}

const STATUS_CONFIG: Record<ObligationStatus, { label: string; color: string; icon: any }> = {
  PAGO: { label: 'Pago', color: 'bg-emerald-100 text-emerald-800 border-emerald-200', icon: CheckCircle2 },
  PENDENTE: { label: 'Pendente', color: 'bg-amber-100 text-amber-800 border-amber-200', icon: Clock },
  ATRASADO: { label: 'Atrasado', color: 'bg-red-100 text-red-800 border-red-200', icon: AlertTriangle },
  CANCELADO: { label: 'Cancelado', color: 'bg-slate-100 text-slate-600 border-slate-200', icon: XCircle },
  DISPENSADO: { label: 'Dispensado', color: 'bg-blue-100 text-blue-800 border-blue-200', icon: FileText },
};

const TYPE_LABELS: Record<ObligationType, string> = {
  DAS: 'DAS (Simples)',
  DARF_IRRF: 'DARF IRRF',
  DARF_CSLL: 'DARF CSLL',
  DARF_PIS_COFINS: 'DARF PIS/COFINS',
  GPS: 'GPS (INSS)',
  FGTS: 'FGTS',
  ISS: 'ISS',
  ICMS: 'ICMS',
  OUTROS: 'Outros',
};

export default function TaxObligationsPage() {
  const { user } = useAuthStore();
  const [obligations, setObligations] = useState<TaxObligation[]>([]);
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [filterCompetence, setFilterCompetence] = useState<string>('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false); 
  const fetchData = async () => {
    setLoading(true);
    try {
      const [obligationsRes, metricsRes] = await Promise.all([
        api.get('/tax-obligations', { 
          params: { 
            status: filterStatus || undefined,
            competence: filterCompetence || undefined 
          } 
        }),
        api.get('/tax-obligations/metrics'),
      ]);
      setObligations(obligationsRes.data);
      setMetrics(metricsRes.data);
    } catch (error) {
      toast.error('Falha ao carregar obrigações fiscais.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [filterStatus, filterCompetence]);

  const handleMarkAsPaid = async (id: string) => {
    if (!confirm('Confirmar pagamento desta obrigação?')) return;
    try {
      await api.patch(`/tax-obligations/${id}/pagar`);
      toast.success('Obrigação marcada como paga!');
      fetchData();
    } catch (error) {
      toast.error('Erro ao marcar como paga.');
    }
  };

  const formatCurrency = (value: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  const formatDate = (dateStr: string) => 
    new Date(dateStr).toLocaleDateString('pt-BR');

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <FileText className="text-[#f97316]" /> Obrigações Fiscais
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Gestão de impostos e guias tributárias da empresa.
          </p>
        </div>
        <button 
  onClick={() => setIsCreateModalOpen(true)}
  className="flex items-center justify-center gap-2 bg-[#0d9488] hover:bg-[#0f766e] text-white px-5 py-2.5 rounded-lg transition-all font-medium shadow-sm hover:shadow-md"
>
  <Plus size={18} /> Nova Obrigação
</button>
      </div>

      {/* Cards de Métricas */}
      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Pendentes</p>
                <p className="text-2xl font-bold text-slate-800 mt-1">{metrics.pendente.count}</p>
                <p className="text-sm text-slate-600 mt-1">{formatCurrency(metrics.pendente.total)}</p>
              </div>
              <div className="p-3 bg-amber-100 rounded-lg">
                <Clock className="w-6 h-6 text-amber-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Atrasadas</p>
                <p className="text-2xl font-bold text-red-600 mt-1">{metrics.atrasado.count}</p>
                <p className="text-sm text-red-600 mt-1">{formatCurrency(metrics.atrasado.total)}</p>
              </div>
              <div className="p-3 bg-red-100 rounded-lg">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Pagas (Total)</p>
                <p className="text-2xl font-bold text-emerald-600 mt-1">{formatCurrency(metrics.pago.total)}</p>
              </div>
              <div className="p-3 bg-emerald-100 rounded-lg">
                <TrendingUp className="w-6 h-6 text-emerald-600" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filtros */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 flex flex-col md:flex-row gap-3">
        <div className="flex-1">
          <label className="text-xs font-medium text-slate-600 mb-1 block">Status</label>
          <select 
            value={filterStatus} 
            onChange={(e) => setFilterStatus(e.target.value)}
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#0d9488]/20 focus:border-[#0d9488] outline-none"
          >
            <option value="">Todos os status</option>
            <option value="PENDENTE">Pendentes</option>
            <option value="PAGO">Pagas</option>
            <option value="ATRASADO">Atrasadas</option>
            <option value="CANCELADO">Canceladas</option>
            <option value="DISPENSADO">Dispensadas</option>
          </select>
        </div>
        <div className="flex-1">
          <label className="text-xs font-medium text-slate-600 mb-1 block">Competência</label>
          <input 
            type="text" 
            placeholder="Ex: 10/2026"
            value={filterCompetence} 
            onChange={(e) => setFilterCompetence(e.target.value)}
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#0d9488]/20 focus:border-[#0d9488] outline-none"
          />
        </div>
      </div>

      {/* Tabela de Obrigações */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="p-12 flex flex-col items-center justify-center gap-3 text-slate-500">
            <Loader2 className="animate-spin text-[#0d9488]" size={32} />
            <span>Carregando obrigações...</span>
          </div>
        ) : obligations.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <FileText className="w-12 h-12 mx-auto mb-3 text-slate-300" />
            <p className="font-medium">Nenhuma obrigação encontrada</p>
            <p className="text-sm mt-1">Ajuste os filtros ou cadastre uma nova obrigação.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-600 uppercase tracking-wider">Tipo</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-600 uppercase tracking-wider">Competência</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-600 uppercase tracking-wider">Vencimento</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-600 uppercase tracking-wider">Valor</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-600 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-600 uppercase tracking-wider text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {obligations.map((obligation) => {
                  const statusConfig = STATUS_CONFIG[obligation.status];
                  const StatusIcon = statusConfig.icon;
                  
                  return (
                    <tr key={obligation.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-medium text-slate-900">{TYPE_LABELS[obligation.type]}</div>
                        {obligation.obs && (
                          <div className="text-xs text-slate-500 mt-0.5">{obligation.obs}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">{obligation.competence}</td>
                      <td className="px-6 py-4 text-sm text-slate-600">{formatDate(obligation.dueDate)}</td>
                      <td className="px-6 py-4 text-sm font-medium text-slate-900">{formatCurrency(obligation.amount)}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border ${statusConfig.color}`}>
                          <StatusIcon size={12} />
                          {statusConfig.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        {obligation.status === 'PENDENTE' || obligation.status === 'ATRASADO' ? (
                          <button 
                            onClick={() => handleMarkAsPaid(obligation.id)}
                            className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-600 hover:text-emerald-700 px-3 py-1.5 rounded-md hover:bg-emerald-50 transition-colors"
                          >
                            <CheckCircle2 size={16} /> Marcar Pago
                          </button>
                        ) : (
                          <span className="text-xs text-slate-400">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
  
      {/* Modal de Criação */}
      <CreateObligationModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={() => {
          // Recarrega a tabela e as métricas
          fetchData();
        }}
      />
    </div>
  );
}
