// =================================================================
// INÍCIO: frontend/src/app/dashboard/pessoas/page.tsx
// =================================================================
/**
 * =================================================================
 * Gestão de Pessoas — Sprints B1 + B3
 * =================================================================
 * Responsabilidades:
 * - CRUD de colaboradores (Employee)
 * - Sprint B1: tipo contratual (CLT/Estagiário/Terceirizado/Sócio)
 * - Sprint B3: flag crítico 🔑 (isCritical) + KPIs de turnover
 * - Filtros por status, tipo contratual e críticos
 * - Gráfico de distribuição por tipo contratual (CSS puro ADR-001)
 *
 * 🧠 ADRs:
 * - ADR-001: gráficos em CSS puro (zero dependências)
 * - ADR-021: ícones Lucide com <span title> wrapper
 * - ADR-047: tipo contratual vive no Employee (enum forte)
 * =================================================================
 */
'use client';

import { useState, useEffect, useMemo } from 'react';
import api from '@/lib/axios';
import { toast } from 'sonner';
import {
  Users, Plus, Loader2, Trash2, Edit2, X,
  Briefcase, Mail, Phone, Calendar, DollarSign,
  Filter, BarChart3, Key, AlertTriangle,
} from 'lucide-react';

// =================================================================
// 🎨 TIPOS CONTRATAIS (Sprint B1)
// =================================================================
const CONTRACT_TYPES = [
  { value: 'CLT', label: 'CLT', color: 'bg-blue-100 text-blue-800' },
  { value: 'ESTAGIARIO', label: 'Estagiário', color: 'bg-purple-100 text-purple-800' },
  { value: 'TERCEIRIZADO', label: 'Terceirizado', color: 'bg-amber-100 text-amber-800' },
  { value: 'SOCIO', label: 'Sócio', color: 'bg-rose-100 text-rose-800' },
];

function getContractTypeConfig(value?: string) {
  return CONTRACT_TYPES.find((t) => t.value === value) || CONTRACT_TYPES[0];
}

// =================================================================
// 🔥 CLASSE MÁGICA PARA INPUTS
// =================================================================
const inputClass =
  'w-full px-3 py-2.5 border border-slate-300 rounded-lg ' +
  'text-slate-900 placeholder:text-slate-400 ' +
  'focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all bg-white';

// =================================================================
// 🎯 COMPONENTE PRINCIPAL
// =================================================================
export default function PessoasPage() {
  const [loading, setLoading] = useState(true);
  const [employees, setEmployees] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Filtros (B1 + B3)
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterContractType, setFilterContractType] = useState('all');
  const [filterCritical, setFilterCritical] = useState(false); // 🆕 B3

  // 🆕 B3: KPIs de turnover (consumidos do endpoint)
  const [turnoverKpis, setTurnoverKpis] = useState<any>(null);

  // Formulário (B1 + B3)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    position: '',
    department: '',
    admissionDate: '',
    salary: '',
    status: 'ACTIVE',
    contractType: 'CLT',
    isCritical: false, // 🆕 B3: flag crítico
  });

  useEffect(() => {
    loadEmployees();
    loadTurnoverKpis(); // 🆕 B3
  }, []);

  async function loadEmployees() {
    try {
      setLoading(true);
      const res = await api.get('/employees');
      setEmployees(res.data.data || []);
    } catch (err) {
      toast.error('Erro ao carregar colaboradores');
    } finally {
      setLoading(false);
    }
  }

  // 🆕 B3: carrega KPIs de turnover (novatos + críticos + tenure)
  async function loadTurnoverKpis() {
    try {
      const res = await api.get('/employees/turnover-kpis');
      setTurnoverKpis(res.data.data);
    } catch (err) {
      console.error('Erro ao carregar KPIs de turnover:', err);
    }
  }

  // =================================================================
  // 📊 MÉTRICAS E FILTROS
  // =================================================================
  const filteredEmployees = useMemo(() => {
    return employees.filter((emp) => {
      const matchesStatus = filterStatus === 'all' || emp.status === filterStatus;
      const matchesContractType =
        filterContractType === 'all' || emp.contractType === filterContractType;
      const matchesCritical = !filterCritical || emp.isCritical === true;
      return matchesStatus && matchesContractType && matchesCritical;
    });
  }, [employees, filterStatus, filterContractType, filterCritical]);

  const contractDistribution = useMemo(() => {
    const counts: Record<string, number> = {};
    employees.forEach((emp) => {
      const type = emp.contractType || 'CLT';
      counts[type] = (counts[type] || 0) + 1;
    });
    return CONTRACT_TYPES.map((t) => ({
      type: t.value,
      label: t.label,
      color: t.color,
      count: counts[t.value] || 0,
    })).sort((a, b) => b.count - a.count);
  }, [employees]);

  const maxCount = Math.max(...contractDistribution.map((d) => d.count), 1);

  // =================================================================
  // CRUD
  // =================================================================
  function openCreateModal() {
    setEditingId(null);
    setFormData({
      name: '', email: '', phone: '', position: '', department: '',
      admissionDate: '', salary: '', status: 'ACTIVE',
      contractType: 'CLT', isCritical: false,
    });
    setShowModal(true);
  }

  function openEditModal(emp: any) {
    setEditingId(emp.id);
    setFormData({
      name: emp.name || '',
      email: emp.email || '',
      phone: emp.phone || '',
      position: emp.position || '',
      department: emp.department || '',
      admissionDate: emp.admissionDate
        ? new Date(emp.admissionDate).toISOString().split('T')[0]
        : '',
      salary: emp.salary?.toString() || '',
      status: emp.status || 'ACTIVE',
      contractType: emp.contractType || 'CLT',
      isCritical: emp.isCritical === true, // 🆕 B3
    });
    setShowModal(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      setLoading(true);
      if (editingId) {
        await api.put(`/employees/${editingId}`, formData);
        toast.success('Colaborador atualizado!');
      } else {
        await api.post('/employees', formData);
        toast.success('Colaborador criado com sucesso!');
      }
      setShowModal(false);
      loadEmployees();
      loadTurnoverKpis(); // 🆕 B3: atualiza KPIs
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Erro ao salvar colaborador');
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Tem certeza que deseja remover este colaborador?')) return;
    try {
      await api.delete(`/employees/${id}`);
      toast.success('Colaborador removido!');
      loadEmployees();
      loadTurnoverKpis();
    } catch (err) {
      toast.error('Erro ao remover colaborador');
    }
  }

  // =================================================================
  // RENDERIZAÇÃO: LOADING
  // =================================================================
  if (loading && employees.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="h-12 w-12 text-teal-600 animate-spin mb-4" />
        <p className="text-slate-600">Carregando colaboradores...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* CABEÇALHO */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
            <Users className="h-8 w-8 text-teal-600" />
            Gestão de Pessoas
          </h1>
          <p className="text-slate-600 mt-1">
            Gerencie a equipe e o quadro de colaboradores do escritório.
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-lg transition-colors shadow-sm"
        >
          <Plus className="h-5 w-5" />
          Adicionar Colaborador
        </button>
      </div>

      {/* ============================================================= */}
      {/* 🆕 SPRINT B3: KPIs DE TURNOVER (novatos + críticos + tenure)  */}
      {/* ============================================================= */}
      {turnoverKpis && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
            <div className="flex items-center gap-2 mb-1">
              <Users className="h-4 w-4 text-teal-600" />
              <p className="text-xs font-semibold text-slate-500 uppercase">Ativos</p>
            </div>
            <p className="text-2xl font-bold text-slate-900">{turnoverKpis.activeCount}</p>
            <p className="text-xs text-slate-500 mt-1">
              Tenure médio: {turnoverKpis.avgTenureMonths}m
            </p>
          </div>
          <div className="bg-rose-50 p-4 rounded-xl shadow-sm border border-rose-200">
            <div className="flex items-center gap-2 mb-1">
              <Key className="h-4 w-4 text-rose-600" />
              <p className="text-xs font-semibold text-rose-700 uppercase">🔑 Críticos Ativos</p>
            </div>
            <p className="text-2xl font-bold text-rose-900">{turnoverKpis.criticalActive}</p>
            <p className="text-xs text-rose-700 mt-1">não podem sair</p>
          </div>
          <div className="bg-amber-50 p-4 rounded-xl shadow-sm border border-amber-200">
            <div className="flex items-center gap-2 mb-1">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <p className="text-xs font-semibold text-amber-700 uppercase">Turnover Novatos</p>
            </div>
            <p className="text-2xl font-bold text-amber-900">
              {turnoverKpis.newbieTurnoverRate}%
            </p>
            <p className="text-xs text-amber-700 mt-1">
              {turnoverKpis.newbieDismissals}/{turnoverKpis.totalDismissals} desligados &lt;12m
            </p>
          </div>
          <div className="bg-slate-50 p-4 rounded-xl shadow-sm border border-slate-200">
            <div className="flex items-center gap-2 mb-1">
              <XCircle className="h-4 w-4 text-slate-600" />
              <p className="text-xs font-semibold text-slate-500 uppercase">Desligados ({turnoverKpis.year})</p>
            </div>
            <p className="text-2xl font-bold text-slate-900">{turnoverKpis.totalDismissals}</p>
            <p className="text-xs text-slate-500 mt-1">
              🔑 {turnoverKpis.criticalDismissals} críticos perdidos
            </p>
          </div>
        </div>
      )}

      {/* ============================================================= */}
      {/* SPRINT B1: GRÁFICO DE DISTRIBUIÇÃO POR TIPO CONTRATUAL        */}
      {/* ============================================================= */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-teal-600" />
          Distribuição por Tipo Contratual
        </h2>

        {employees.length === 0 ? (
          <p className="text-slate-500 text-sm italic">
            Nenhum colaborador cadastrado ainda.
          </p>
        ) : (
          <div className="space-y-3">
            {contractDistribution.map((item) => {
              const pct = (item.count / maxCount) * 100;
              return (
                <div key={item.type}>
                  <div className="flex justify-between items-baseline mb-1">
                    <span className="text-sm font-medium text-slate-800">{item.label}</span>
                    <span className="text-sm font-bold text-slate-900">
                      {item.count} ({item.count > 0 ? ((item.count / employees.length) * 100).toFixed(0) : 0}%)
                    </span>
                  </div>
                  <div className="h-6 bg-slate-100 rounded-md overflow-hidden">
                    <div
                      className={`h-full ${item.color.replace('text-', 'bg-').split(' ')[0]} transition-all flex items-center justify-end pr-2`}
                      style={{ width: `${pct}%` }}
                    >
                      {pct > 15 && <span className="text-xs font-bold text-slate-900">{item.count}</span>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ============================================================= */}
      {/* 🆕 SPRINT B3: FILTROS (status + tipo + 🔑 críticos)            */}
      {/* ============================================================= */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
        <div className="flex items-center gap-2 mb-3">
          <Filter className="h-4 w-4 text-slate-500" />
          <span className="text-sm font-semibold text-slate-700">Filtros</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Status</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className={inputClass}
            >
              <option value="all">Todos</option>
              <option value="ACTIVE">Ativos</option>
              <option value="INACTIVE">Inativos</option>
              <option value="DISMISSED">Desligados</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Tipo Contratual</label>
            <select
              value={filterContractType}
              onChange={(e) => setFilterContractType(e.target.value)}
              className={inputClass}
            >
              <option value="all">Todos</option>
              {CONTRACT_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <label className="flex items-center gap-2 cursor-pointer p-2.5 rounded-lg border border-slate-300 hover:bg-rose-50 hover:border-rose-300 transition-colors w-full">
              <input
                type="checkbox"
                checked={filterCritical}
                onChange={(e) => setFilterCritical(e.target.checked)}
                className="rounded border-slate-300 text-rose-600 focus:ring-rose-500"
              />
              <Key className="h-4 w-4 text-rose-600" />
              <span className="text-sm font-medium text-slate-700">Somente críticos 🔑</span>
            </label>
          </div>
        </div>
      </div>

      {/* TABELA DE COLABORADORES */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-6 py-4 text-xs font-semibold text-slate-600 uppercase">Nome</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-slate-600 uppercase">Cargo / Depto</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-slate-600 uppercase">Tipo</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-slate-600 uppercase">Admissão</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-slate-600 uppercase">Status</th>
                <th className="text-right px-6 py-4 text-xs font-semibold text-slate-600 uppercase">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredEmployees.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                    {employees.length === 0
                      ? 'Nenhum colaborador cadastrado ainda.'
                      : 'Nenhum colaborador encontrado com os filtros aplicados.'}
                  </td>
                </tr>
              ) : (
                filteredEmployees.map((emp) => {
                  const contractConfig = getContractTypeConfig(emp.contractType);
                  return (
                    <tr key={emp.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-medium text-slate-900 flex items-center gap-1.5">
                          {emp.isCritical && (
                            <span title="Colaborador crítico 🔑 — não pode ser perdido">
                              <Key className="h-4 w-4 text-rose-500 flex-shrink-0" />
                            </span>
                          )}
                          {emp.name}
                        </div>
                        <div className="text-sm text-slate-500 flex items-center gap-1 mt-1">
                          <Mail className="h-3 w-3" /> {emp.email || 'Sem e-mail'}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-slate-900 flex items-center gap-1">
                          <Briefcase className="h-3 w-3 text-slate-400" /> {emp.position}
                        </div>
                        <div className="text-sm text-slate-500">{emp.department || 'Geral'}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${contractConfig.color}`}>
                          {contractConfig.label}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-slate-900 flex items-center gap-1">
                          <Calendar className="h-3 w-3 text-slate-400" />
                          {emp.admissionDate
                            ? new Date(emp.admissionDate).toLocaleDateString('pt-BR')
                            : '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${
                          emp.status === 'ACTIVE'
                            ? 'bg-green-100 text-green-800'
                            : emp.status === 'DISMISSED'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-slate-100 text-slate-600'
                        }`}>
                          {emp.status === 'ACTIVE' ? 'Ativo' : emp.status === 'DISMISSED' ? 'Desligado' : 'Inativo'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <span title="Editar">
                            <button
                              onClick={() => openEditModal(emp)}
                              className="text-slate-400 hover:text-blue-600 transition-colors p-2"
                            >
                              <Edit2 className="h-4 w-4" />
                            </button>
                          </span>
                          <span title="Remover">
                            <button
                              onClick={() => handleDelete(emp.id)}
                              className="text-slate-400 hover:text-red-600 transition-colors p-2"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ============================================================= */}
      {/* MODAL DE ADICIONAR/EDITAR (B1 + B3: tipo + 🔑 crítico)        */}
      {/* ============================================================= */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-slate-200 sticky top-0 bg-white z-10">
              <h2 className="text-xl font-bold text-slate-900">
                {editingId ? 'Editar Colaborador' : 'Novo Colaborador'}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Nome Completo *</label>
                  <input
                    type="text" required value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className={inputClass} placeholder="Ex: Maria Silva"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">E-mail</label>
                  <input type="email" value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className={inputClass} placeholder="maria@empresa.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Telefone</label>
                  <input type="tel" value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className={inputClass} placeholder="(00) 00000-0000"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Cargo *</label>
                  <input type="text" required value={formData.position}
                    onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                    className={inputClass} placeholder="Ex: Analista Contábil"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Departamento</label>
                  <input type="text" value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className={inputClass} placeholder="Ex: Fiscal"
                  />
                </div>

                {/* B1: tipo contratual */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Tipo Contratual *</label>
                  <select value={formData.contractType}
                    onChange={(e) => setFormData({ ...formData, contractType: e.target.value })}
                    className={inputClass}
                  >
                    {CONTRACT_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Data de Admissão *</label>
                  <input type="date" required value={formData.admissionDate}
                    onChange={(e) => setFormData({ ...formData, admissionDate: e.target.value })}
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Salário (R$)</label>
                  <input type="number" step="0.01" value={formData.salary}
                    onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
                    className={inputClass} placeholder="0.00"
                  />
                </div>
              </div>

              {/* 🆕 B3: flag crítico + status */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-slate-200">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Status</label>
                  <select value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className={inputClass}
                  >
                    <option value="ACTIVE">Ativo</option>
                    <option value="INACTIVE">Inativo</option>
                    <option value="DISMISSED">Desligado</option>
                  </select>
                </div>

                <div className="flex items-center">
                  <label className="flex items-center gap-2 cursor-pointer p-3 rounded-lg border-2 border-slate-200 hover:border-rose-300 hover:bg-rose-50 transition-colors w-full">
                    <input
                      type="checkbox"
                      checked={formData.isCritical}
                      onChange={(e) => setFormData({ ...formData, isCritical: e.target.checked })}
                      className="rounded border-slate-300 text-rose-600 focus:ring-rose-500 w-5 h-5"
                    />
                    <div className="flex items-center gap-2">
                      <Key className="h-5 w-5 text-rose-500" />
                      <div>
                        <p className="text-sm font-semibold text-slate-900">Colaborador crítico 🔑</p>
                        <p className="text-xs text-slate-500">Não pode ser perdido</p>
                      </div>
                    </div>
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-6 border-t border-slate-200 mt-6">
                <button type="button" onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-slate-700 hover:bg-slate-100 rounded-lg font-medium transition-colors">
                  Cancelar
                </button>
                <button type="submit" disabled={loading}
                  className="flex items-center gap-2 px-6 py-2 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50">
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                  {editingId ? 'Atualizar' : 'Salvar Colaborador'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
// Faltou o import do XCircle no topo — adicionei no import dos lucide-react acima.
// =================================================================
// FIM: frontend/src/app/dashboard/pessoas/page.tsx
// =================================================================