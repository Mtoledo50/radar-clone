'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/axios';
import { toast } from 'sonner';
import { 
  Users, Plus, Loader2, Trash2, Edit2, X, 
  Briefcase, Mail, Phone, Calendar, DollarSign 
} from 'lucide-react';

// 🔥 CLASSE MÁGICA PARA INPUTS
const inputClass = 
  "w-full px-3 py-2.5 border border-slate-300 rounded-lg " +
  "text-slate-900 placeholder:text-slate-400 " + 
  "focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all bg-white";

export default function PessoasPage() {
  const [loading, setLoading] = useState(true);
  const [employees, setEmployees] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  
  // 🔥 ESTADO DO FORMULÁRIO COM ADMISSIONDATE INCLUÍDO
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    position: '',
    department: '',
    admissionDate: '', // Campo obrigatório para o backend
    salary: '',
    status: 'ACTIVE',
  });

  useEffect(() => {
    loadEmployees();
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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    try {
      setLoading(true);
      // Envia o formData completo, incluindo admissionDate
      await api.post('/employees', formData);
      toast.success('Colaborador criado com sucesso!');
      setShowModal(false);
      resetForm();
      loadEmployees();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Erro ao criar colaborador');
    } finally {
      setLoading(false);
    }
  }

  function resetForm() {
    setFormData({
      name: '',
      email: '',
      phone: '',
      position: '',
      department: '',
      admissionDate: '',
      salary: '',
      status: 'ACTIVE',
    });
  }

  async function handleDelete(id: string) {
    if (!confirm('Tem certeza que deseja remover este colaborador?')) return;
    try {
      await api.delete(`/employees/${id}`);
      toast.success('Colaborador removido!');
      loadEmployees();
    } catch (err) {
      toast.error('Erro ao remover colaborador');
    }
  }

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
          <p className="text-slate-600 mt-1">Gerencie a equipe e o quadro de colaboradores do escritório.</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-lg transition-colors shadow-sm"
        >
          <Plus className="h-5 w-5" />
          Adicionar Colaborador
        </button>
      </div>

      {/* TABELA DE COLABORADORES */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-6 py-4 text-xs font-semibold text-slate-600 uppercase">Nome</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-slate-600 uppercase">Cargo / Depto</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-slate-600 uppercase">Admissão</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-slate-600 uppercase">Status</th>
                <th className="text-right px-6 py-4 text-xs font-semibold text-slate-600 uppercase">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {employees.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                    Nenhum colaborador cadastrado ainda.
                  </td>
                </tr>
              ) : (
                employees.map((emp) => (
                  <tr key={emp.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-900">{emp.name}</div>
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
                      <div className="text-sm text-slate-900 flex items-center gap-1">
                        <Calendar className="h-3 w-3 text-slate-400" /> 
                        {emp.admissionDate ? new Date(emp.admissionDate).toLocaleDateString('pt-BR') : '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${
                        emp.status === 'ACTIVE' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-slate-100 text-slate-600'
                      }`}>
                        {emp.status === 'ACTIVE' ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => handleDelete(emp.id)}
                        className="text-slate-400 hover:text-red-600 transition-colors p-2"
                        title="Remover"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL DE ADICIONAR COLABORADOR */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-slate-200 sticky top-0 bg-white z-10">
              <h2 className="text-xl font-bold text-slate-900">Novo Colaborador</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Nome Completo *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className={inputClass}
                    placeholder="Ex: Maria Silva"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">E-mail</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className={inputClass}
                    placeholder="maria@empresa.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Telefone</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className={inputClass}
                    placeholder="(00) 00000-0000"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Cargo *</label>
                  <input
                    type="text"
                    required
                    value={formData.position}
                    onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                    className={inputClass}
                    placeholder="Ex: Analista Contábil"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Departamento</label>
                  <input
                    type="text"
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className={inputClass}
                    placeholder="Ex: Fiscal"
                  />
                </div>

                {/* 🔥 CAMPO DE DATA DE ADMISSÃO ADICIONADO E OBRIGATÓRIO */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Data de Admissão *</label>
                  <input
                    type="date"
                    required
                    value={formData.admissionDate}
                    onChange={(e) => setFormData({ ...formData, admissionDate: e.target.value })}
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Salário (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.salary}
                    onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
                    className={inputClass}
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-6 border-t border-slate-200 mt-6">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-slate-700 hover:bg-slate-100 rounded-lg font-medium transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center gap-2 px-6 py-2 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50"
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                  Salvar Colaborador
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}