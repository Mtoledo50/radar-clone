'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { 
  FileSpreadsheet, 
  ChevronDown, 
  ChevronRight, 
  Users, 
  CheckCircle2, 
  Clock, 
  AlertTriangle,
  Loader2,
  Search,
  Trash2,
  Edit,
  Download,
  X,
  Save,
  Unlink
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import api from '@/lib/axios';

interface Client {
  id: string;
  companyName: string;
  cnpj?: string;
}

interface Delivery {
  id: string;
  clientId: string;
  status: 'PENDENTE' | 'ENVIADO' | 'ATRASADO' | 'CANCELADO';
  obs?: string;
  client?: Client;
  createdAt: string;
}

interface ObligationSchedule {
  id: string;
  name: string;
  responsibleUser?: string;
  isActive: boolean;
  deliveries: Delivery[];
  createdAt: string;
}

interface UserOption {
  id: string;
  name: string;
  email: string;
  role: string;
  roleLabel: string;
  label: string;
}

export default function ObligationBatchesPage() {
  const { user } = useAuthStore();
  const [schedules, setSchedules] = useState<ObligationSchedule[]>([]);
  const [users, setUsers] = useState<UserOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filterResponsible, setFilterResponsible] = useState('');
  const [searchCompany, setSearchCompany] = useState('');
  
  // Estados para edição
  const [editingScheduleId, setEditingScheduleId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ name: '', responsibleUser: '' });
  const [showRemoveConfirm, setShowRemoveConfirm] = useState<{scheduleId: string, clientId: string, companyName: string} | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [schedulesRes, usersRes] = await Promise.all([
        api.get('/obligations/schedules'),
        api.get('/obligations/users'),
      ]);
      setSchedules(schedulesRes.data);
      setUsers(usersRes.data);
    } catch (error) {
      toast.error('Falha ao carregar dados.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // ✅ DELETAR OBRIGAÇÃO INTEIRA
  const handleDeleteSchedule = async (scheduleId: string, scheduleName: string) => {
    if (!confirm(`⚠️ ATENÇÃO: Isso excluirá PERMANENTEMENTE a obrigação "${scheduleName}" e todos os seus vínculos.\n\nDeseja continuar?`)) {
      return;
    }

    try {
      await api.delete(`/obligations/schedules/${scheduleId}`);
      toast.success(`Obrigação "${scheduleName}" excluída com sucesso!`);
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erro ao excluir obrigação.');
    }
  };

  // ✅ REMOVER EMPRESA ESPECÍFICA
  const handleRemoveClient = async () => {
    if (!showRemoveConfirm) return;

    try {
      await api.delete(`/obligations/schedules/${showRemoveConfirm.scheduleId}/clients/${showRemoveConfirm.clientId}`);
      toast.success(`Empresa "${showRemoveConfirm.companyName}" removida da obrigação!`);
      fetchData();
      setShowRemoveConfirm(null);
    } catch (error) {
      toast.error('Erro ao remover empresa.');
    }
  };

  // ✅ INICIAR EDIÇÃO
  const startEditing = (schedule: ObligationSchedule) => {
    setEditingScheduleId(schedule.id);
    setEditForm({
      name: schedule.name,
      responsibleUser: schedule.responsibleUser || '',
    });
  };

  // ✅ SALVAR EDIÇÃO
  const saveEdit = async (scheduleId: string) => {
    try {
      await api.patch(`/obligations/schedules/${scheduleId}`, editForm);
      toast.success('Obrigação atualizada com sucesso!');
      setEditingScheduleId(null);
      fetchData();
    } catch (error) {
      toast.error('Erro ao atualizar obrigação.');
    }
  };

  // ✅ IMPRIMIR/EXPORTAR PDF
  const handlePrint = (schedule: ObligationSchedule) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error('Permita pop-ups para imprimir');
      return;
    }

    const htmlContent = `
      <html>
        <head>
          <title>${schedule.name} - Relatório</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            h1 { color: #0d9488; border-bottom: 2px solid #0d9488; padding-bottom: 10px; }
            .info { margin-bottom: 20px; color: #64748b; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #e2e8f0; padding: 8px; text-align: left; }
            th { background-color: #f1f5f9; font-weight: 600; }
            tr:nth-child(even) { background-color: #f8fafc; }
            .status-pendente { color: #d97706; font-weight: 600; }
            .status-enviado { color: #059669; font-weight: 600; }
            .status-atrasado { color: #dc2626; font-weight: 600; }
            @media print {
              body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
            }
          </style>
        </head>
        <body>
          <h1>${schedule.name}</h1>
          <div class="info">
            <p><strong>Responsável:</strong> ${schedule.responsibleUser || 'Não definido'}</p>
            <p><strong>Total de Empresas:</strong> ${schedule.deliveries.length}</p>
            <p><strong>Data de Criação:</strong> ${new Date(schedule.createdAt).toLocaleDateString('pt-BR')}</p>
          </div>
          <table>
            <thead>
              <tr>
                <th>EMPRESA</th>
                <th>CNPJ</th>
                <th>STATUS</th>
              </tr>
            </thead>
            <tbody>
              ${schedule.deliveries.map(d => `
                <tr>
                  <td>${d.client?.companyName || 'Não encontrada'}</td>
                  <td>${d.client?.cnpj || '-'}</td>
                  <td class="status-${d.status.toLowerCase()}">${d.status}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          <script>window.print();</script>
        </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  const getStatusConfig = (status: string) => {
    const config = {
      PENDENTE: { 
        label: 'Pendente', 
        color: 'bg-amber-100 text-amber-800 border-amber-200', 
        icon: Clock,
        description: 'Aguardando arquivo na pasta do Drive'
      },
      ENVIADO: { 
        label: 'Enviado', 
        color: 'bg-emerald-100 text-emerald-800 border-emerald-200', 
        icon: CheckCircle2,
        description: 'Arquivo enviado ao cliente'
      },
      ATRASADO: { 
        label: 'Atrasado', 
        color: 'bg-red-100 text-red-800 border-red-200', 
        icon: AlertTriangle,
        description: 'Prazo de entrega vencido'
      },
      CANCELADO: { 
        label: 'Cancelado', 
        color: 'bg-slate-100 text-slate-600 border-slate-200', 
        icon: FileSpreadsheet,
        description: 'Obrigação cancelada'
      },
    };
    return config[status as keyof typeof config] || config.PENDENTE;
  };

  const getStats = (deliveries: Delivery[]) => {
    const total = deliveries.length;
    const enviados = deliveries.filter(d => d.status === 'ENVIADO').length;
    const pendentes = deliveries.filter(d => d.status === 'PENDENTE').length;
    const atrasados = deliveries.filter(d => d.status === 'ATRASADO').length;
    return { total, enviados, pendentes, atrasados };
  };

  const filteredSchedules = schedules.filter(s => {
    if (filterResponsible && s.responsibleUser !== filterResponsible) return false;
    return true;
  });

  const responsibles = Array.from(new Set(schedules.map(s => s.responsibleUser).filter(Boolean)));

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('pt-BR');
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <FileSpreadsheet className="text-[#f97316]" /> Obrigações em Lote
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Obrigações importadas via Excel com empresas vinculadas.
          </p>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 flex flex-col md:flex-row gap-3">
        <div className="flex-1">
          <label className="text-xs font-medium text-slate-600 mb-1 block">Responsável</label>
          <select 
            value={filterResponsible} 
            onChange={(e) => setFilterResponsible(e.target.value)}
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#0d9488]/20 focus:border-[#0d9488] outline-none"
          >
            <option value="">Todos os responsáveis</option>
            {responsibles.map(r => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </div>
        <div className="flex-1">
          <label className="text-xs font-medium text-slate-600 mb-1 block">Buscar empresa</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Nome da empresa..."
              value={searchCompany} 
              onChange={(e) => setSearchCompany(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-[#0d9488]/20 focus:border-[#0d9488] outline-none"
            />
          </div>
        </div>
      </div>

      {/* Lista de Obrigações */}
      <div className="space-y-3">
        {loading ? (
          <div className="p-12 flex flex-col items-center justify-center gap-3 text-slate-500 bg-white rounded-xl border border-slate-200">
            <Loader2 className="animate-spin text-[#0d9488]" size={32} />
            <span>Carregando obrigações...</span>
          </div>
        ) : filteredSchedules.length === 0 ? (
          <div className="p-12 text-center text-slate-500 bg-white rounded-xl border border-slate-200">
            <FileSpreadsheet className="w-12 h-12 mx-auto mb-3 text-slate-300" />
            <p className="font-medium">Nenhuma obrigação importada encontrada</p>
            <p className="text-sm mt-1">Importe um arquivo Excel para começar.</p>
          </div>
        ) : (
          filteredSchedules.map((schedule) => {
            const stats = getStats(schedule.deliveries);
            const isExpanded = expandedId === schedule.id;
            const isEditing = editingScheduleId === schedule.id;

            return (
              <div key={schedule.id} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                {/* Header da Obrigação */}
                <div className="flex items-center justify-between p-5 hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-4 flex-1">
                    <button
                      onClick={() => setExpandedId(isExpanded ? null : schedule.id)}
                      className="flex items-center gap-2"
                    >
                      {isExpanded ? <ChevronDown className="w-5 h-5 text-slate-400" /> : <ChevronRight className="w-5 h-5 text-slate-400" />}
                    </button>
                    
                    <div className="flex-1">
                      {isEditing ? (
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <input
                            type="text"
                            value={editForm.name}
                            onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                            className="px-2 py-1 border border-slate-300 rounded text-sm font-semibold flex-1 min-w-[200px]"
                            placeholder="Nome da obrigação"
                          />
                          
                          {/* ✅ DROPDOWN DE USUÁRIOS COM SETOR/ROLE */}
                          <select
                            value={editForm.responsibleUser}
                            onChange={(e) => setEditForm({...editForm, responsibleUser: e.target.value})}
                            className="px-2 py-1 border border-slate-300 rounded text-sm flex-1 min-w-[200px] bg-white"
                          >
                            <option value="">Selecione o responsável...</option>
                            {users.map(u => (
                              <option key={u.id} value={u.name}>
                                {u.name} - {u.roleLabel}
                              </option>
                            ))}
                          </select>

                          <button
                            onClick={() => saveEdit(schedule.id)}
                            className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded border border-emerald-200"
                            title="Salvar"
                          >
                            <Save size={18} />
                          </button>
                          <button
                            onClick={() => setEditingScheduleId(null)}
                            className="p-1.5 text-slate-600 hover:bg-slate-100 rounded border border-slate-200"
                            title="Cancelar"
                          >
                            <X size={18} />
                          </button>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-center gap-3">
                            <h3 className="font-semibold text-slate-900 text-lg">{schedule.name}</h3>
                            {schedule.responsibleUser && (
                              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-teal-100 text-teal-800 border border-teal-200">
                                {schedule.responsibleUser}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-500 mt-1">
                            Criada em {formatDate(schedule.createdAt)} • {stats.total} empresas vinculadas
                          </p>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Ações e Stats */}
                  <div className="flex items-center gap-4">
                    {!isEditing && (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handlePrint(schedule)}
                          className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg"
                          title="Imprimir/Exportar PDF"
                        >
                          <Download size={18} />
                        </button>
                        <button
                          onClick={() => startEditing(schedule)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                          title="Editar obrigação"
                        >
                          <Edit size={18} />
                        </button>
                        <button
                          onClick={() => handleDeleteSchedule(schedule.id, schedule.name)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                          title="Excluir obrigação"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    )}
                    
                    <div className="flex items-center gap-4 border-l pl-4">
                      {stats.enviados > 0 && (
                        <div className="text-center">
                          <p className="text-lg font-bold text-emerald-600">{stats.enviados}</p>
                          <p className="text-[10px] text-slate-500 uppercase">Enviados</p>
                        </div>
                      )}
                      {stats.pendentes > 0 && (
                        <div className="text-center">
                          <p className="text-lg font-bold text-amber-600">{stats.pendentes}</p>
                          <p className="text-[10px] text-slate-500 uppercase">Pendentes</p>
                        </div>
                      )}
                      {stats.atrasados > 0 && (
                        <div className="text-center">
                          <p className="text-lg font-bold text-red-600">{stats.atrasados}</p>
                          <p className="text-[10px] text-slate-500 uppercase">Atrasados</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Lista de Empresas (expandida) */}
                {isExpanded && (
                  <div className="border-t border-slate-200 bg-slate-50/50">
                    <div className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                          <Users className="w-4 h-4" />
                          Empresas Vinculadas ({schedule.deliveries.length})
                        </h4>
                      </div>

                      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                        <div className="overflow-x-auto max-h-96 overflow-y-auto">
                          <table className="w-full text-left text-sm">
                            <thead className="bg-slate-50 sticky top-0">
                              <tr>
                                <th className="px-4 py-2 text-xs font-semibold text-slate-600 uppercase">Empresa</th>
                                <th className="px-4 py-2 text-xs font-semibold text-slate-600 uppercase">CNPJ</th>
                                <th className="px-4 py-2 text-xs font-semibold text-slate-600 uppercase">Status</th>
                                <th className="px-4 py-2 text-xs font-semibold text-slate-600 uppercase">Observação</th>
                                <th className="px-4 py-2 text-xs font-semibold text-slate-600 uppercase text-right">Ações</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {schedule.deliveries
                                .filter(d => {
                                  if (!searchCompany) return true;
                                  const companyName = d.client?.companyName || '';
                                  return companyName.toLowerCase().includes(searchCompany.toLowerCase());
                                })
                                .map((delivery) => {
                                  const statusConfig = getStatusConfig(delivery.status);
                                  const StatusIcon = statusConfig.icon;
                                  return (
                                    <tr key={delivery.id} className="hover:bg-slate-50/50">
                                      <td className="px-4 py-2 font-medium text-slate-900">
                                        {delivery.client?.companyName || 'Empresa não encontrada'}
                                      </td>
                                      <td className="px-4 py-2 text-slate-600 text-xs font-mono">
                                        {delivery.client?.cnpj || '-'}
                                      </td>
                                      <td className="px-4 py-2">
                                        <div className="flex items-center gap-1">
                                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium border ${statusConfig.color}`}>
                                            <StatusIcon size={12} />
                                            {statusConfig.label}
                                          </span>
                                          <span className="text-[10px] text-slate-400" title={statusConfig.description}>ⓘ</span>
                                        </div>
                                      </td>
                                      <td className="px-4 py-2 text-xs text-slate-500">
                                        {delivery.obs || '-'}
                                      </td>
                                      <td className="px-4 py-2 text-right">
                                        <button
                                          onClick={() => setShowRemoveConfirm({
                                            scheduleId: schedule.id,
                                            clientId: delivery.clientId,
                                            companyName: delivery.client?.companyName || 'Esta empresa'
                                          })}
                                          className="text-red-600 hover:text-red-700 p-1 hover:bg-red-50 rounded"
                                          title="Remover empresa desta obrigação"
                                        >
                                          <Unlink size={16} />
                                        </button>
                                      </td>
                                    </tr>
                                  );
                                })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Modal de Confirmação para Remover Empresa */}
      {showRemoveConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
            <h3 className="text-lg font-bold text-slate-800 mb-2">Remover Empresa</h3>
            <p className="text-sm text-slate-600 mb-4">
              Deseja realmente remover <strong>{showRemoveConfirm.companyName}</strong> desta obrigação?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowRemoveConfirm(null)}
                className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 font-medium"
              >
                Cancelar
              </button>
              <button
                onClick={handleRemoveClient}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium"
              >
                Remover
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}