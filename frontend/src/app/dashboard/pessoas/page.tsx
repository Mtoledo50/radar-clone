'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/axios';
import { 
  Users, UserPlus, Search, Edit2, Trash2, X, Loader2, Mail, Briefcase 
} from 'lucide-react';

// =================================================================
// 🧩 COMPONENTE: Card de Métrica
// =================================================================
function MetricCard({ icon: Icon, label, value, color }: { icon: any; label: string; value: string | number; color: string }) {
  const colorClasses: Record<string, string> = {
    teal: 'bg-teal-50 text-teal-600',
    orange: 'bg-orange-50 text-orange-600',
    green: 'bg-green-50 text-green-600',
    red: 'bg-red-50 text-red-600',
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
      <div className="flex items-center gap-3 mb-3">
        <div className={`p-2 rounded-lg ${colorClasses[color]}`}>
          <Icon className="h-5 w-5" />
        </div>
        <span className="text-sm font-medium text-slate-600">{label}</span>
      </div>
      <div className="text-3xl font-bold text-slate-900">{value}</div>
    </div>
  );
}

// =================================================================
// 🚀 PÁGINA: Gestão de Pessoas
// =================================================================
export default function PessoasPage() {
  const [employees, setEmployees] = useState<any[]>([]);
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Estado do Modal
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Estado do Formulário
  const [form, setForm] = useState({
    id: '',
    name: '',
    email: '',
    phone: '',
    position: '', // Cargo
    status: 'ACTIVE', // Valor real do banco, mas exibiremos em PT
  });

  // 🔥 CORREÇÃO UNIVERSAL DOS INPUTS (Texto visível)
  const inputClass = 
    "w-full px-3 py-2.5 border border-slate-300 rounded-lg " +
    "text-slate-900 placeholder:text-slate-400 " + 
    "focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all bg-white";

  // Carregar dados
  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      setError(null);
      const [empRes, metRes] = await Promise.all([
        api.get('/employees').catch(() => ({ data: { data: [] } })),
        api.get('/employees/metrics').catch(() => ({ data: { data: null } })),
      ]);
      setEmployees(empRes.data.data || []);
      setMetrics(metRes.data.data || null);
    } catch (err) {
      setError('Erro ao carregar dados. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  // Abrir modal para criar ou editar
  const openModal = (employee?: any) => {
    if (employee) {
      setIsEditing(true);
      setForm({
        id: employee.id,
        name: employee.name,
        email: employee.email || '',
        phone: employee.phone || '',
        position: employee.position || '',
        status: employee.status || 'ACTIVE',
      });
    } else {
      setIsEditing(false);
      setForm({ id: '', name: '', email: '', phone: '', position: '', status: 'ACTIVE' });
    }
    setShowModal(true);
  };

  // Salvar dados
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (isEditing) {
        await api.put(`/employees/${form.id}`, form);
      } else {
        await api.post('/employees', form);
      }
      setShowModal(false);
      loadData(); // Recarrega a tabela
    } catch (err: any) {
      alert(err.response?.data?.message || 'Erro ao salvar');
    } finally {
      setSubmitting(false);
    }
  };

  // Deletar colaborador
  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja remover este colaborador?')) return;
    try {
      await api.delete(`/employees/${id}`);
      loadData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Erro ao excluir');
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="h-12 w-12 text-teal-600 animate-spin mb-4" />
        <p className="text-slate-600 font-medium">Carregando colaboradores...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* CABEÇALHO */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Gestão de Pessoas</h1>
          <p className="text-slate-600 mt-1">Gerencie colaboradores, admissões e turnover.</p>
        </div>
        <button
          onClick={() => openModal()}
          className="flex items-center gap-2 px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-lg transition-colors shadow-sm"
        >
          <UserPlus className="h-5 w-5" />
          Novo Colaborador
        </button>
      </div>

      {/* MÉTRICAS */}
      {metrics && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard icon={Users} label="Total Ativos" value={metrics.totalActive || 0} color="teal" />
          <MetricCard icon={Briefcase} label="Total Geral" value={metrics.totalEmployees || 0} color="orange" />
          <MetricCard icon={UserPlus} label="Admissões (mês)" value={metrics.admissionsThisMonth || 0} color="green" />
          <MetricCard icon={Users} label="Turnover" value={`${(metrics.turnoverRate || 0).toFixed(1)}%`} color="red" />
        </div>
      )}

      {/* TABELA DE COLABORADORES */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center gap-3">
          <Search className="h-5 w-5 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por nome ou e-mail..."
            className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-white"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-slate-600 text-sm font-semibold">
              <tr>
                <th className="px-6 py-4">Nome</th>
                <th className="px-6 py-4">Cargo</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {employees.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-slate-500">
                    Nenhum colaborador encontrado. Clique em "Novo Colaborador" para começar.
                  </td>
                </tr>
              ) : (
                employees.map((emp) => {
                  // 🔥 TRADUÇÃO DO STATUS DO BANCO PARA PORTUGUÊS
                  const isAtivo = emp.status === 'ACTIVE';
                  const statusLabel = isAtivo ? 'Ativo' : 'Demitido';
                  const statusColor = isAtivo 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800';

                  return (
                    <tr key={emp.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-medium text-slate-900">{emp.name}</div>
                        <div className="text-sm text-slate-500 flex items-center gap-1">
                          <Mail className="h-3 w-3" /> {emp.email || 'Sem e-mail'}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-700">
                        {emp.position || <span className="text-slate-400 italic">Não informado</span>}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColor}`}>
                          {statusLabel}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => openModal(emp)}
                          className="text-teal-600 hover:text-teal-800 mr-3 transition-colors"
                          title="Editar"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(emp.id)}
                          className="text-red-600 hover:text-red-800 transition-colors"
                          title="Remover"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL DE CADASTRO/EDIÇÃO */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-slate-200">
              <h2 className="text-xl font-bold text-slate-900">
                {isEditing ? 'Editar Colaborador' : 'Novo Colaborador'}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nome Completo</label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className={inputClass}
                  placeholder="Ex: Maria Silva"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">E-mail</label>
                  <input
                    type="email"
                    required
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className={inputClass}
                    placeholder="email@empresa.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Telefone</label>
                  <input
                    type="text"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className={inputClass}
                    placeholder="(00) 00000-0000"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Cargo</label>
                  <input
                    type="text"
                    value={form.position}
                    onChange={(e) => setForm({ ...form, position: e.target.value })}
                    className={inputClass}
                    placeholder="Ex: Analista Contábil"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value })}
                    className={inputClass}
                  >
                    {/* 🔥 OPÇÕES TRADUZIDAS PARA O USUÁRIO, MAS MANTENDO O VALOR DO BANCO */}
                    <option value="ACTIVE">Ativo</option>
                    <option value="DISMISSED">Demitido</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 mt-6">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-slate-700 font-medium hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex items-center gap-2 px-6 py-2 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50"
                >
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  {submitting ? 'Salvando...' : 'Salvar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}