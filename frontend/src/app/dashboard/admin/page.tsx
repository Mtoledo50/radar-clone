'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/axios';
import { toast } from 'sonner';
import { Shield, Users, Building2, Loader2, Check, X } from 'lucide-react';

// Lista de todos os módulos disponíveis no sistema
const ALL_MODULES = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'minha-empresa', label: 'Minha Empresa' },
  { id: 'pessoas', label: 'Gestão de Pessoas' },
  { id: 'turnover', label: 'Turnover' },
  { id: 'clientes', label: 'Clientes' },
  { id: 'precificacao', label: 'Precificação' },
  { id: 'planejamento', label: 'Planejamento' },
  { id: 'bi', label: 'B.I. Contábil' },
  { id: 'ponto-fora-da-curva', label: 'Ponto Fora da Curva' },
  { id: 'indicadores', label: 'Indicadores' },
  { id: 'planejamento-tributario', label: 'Planejamento Tributário' },
  { id: 'reforma-tributaria', label: 'Reforma Tributária' },
];

const PLANS = ['BASIC', 'PRO', 'PREMIUM', 'ENTERPRISE'];

export default function AdminPanelPage() {
  const [activeTab, setActiveTab] = useState<'companies' | 'users'>('companies');
  const [companies, setCompanies] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [compRes, usersRes] = await Promise.all([
        api.get('/admin/companies'),
        api.get('/admin/users'),
      ]);
      setCompanies(compRes.data);
      setUsers(usersRes.data);
    } catch (err) {
      toast.error('Erro ao carregar dados do admin');
    } finally {
      setLoading(false);
    }
  }

  async function handleUpdateCompany(id: string, plan: string, allowedModules: string[]) {
    try {
      await api.put(`/admin/companies/${id}`, { plan, allowedModules });
      toast.success('Empresa atualizada com sucesso!');
      loadData();
    } catch (err) {
      toast.error('Erro ao atualizar empresa');
    }
  }

  async function handleUpdateUserRole(id: string, role: string) {
    try {
      await api.put(`/admin/users/${id}/role`, { role });
      toast.success('Permissão do usuário atualizada!');
      loadData();
    } catch (err) {
      toast.error('Erro ao atualizar usuário');
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="h-12 w-12 text-teal-600 animate-spin mb-4" />
        <p className="text-slate-600">Carregando painel administrativo...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
          <Shield className="h-8 w-8 text-teal-600" />
          Painel Administrativo
        </h1>
        <p className="text-slate-600 mt-1">Gerencie planos, módulos e permissões do seu SaaS.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 bg-slate-100 p-1 rounded-lg w-fit">
        <button
          onClick={() => setActiveTab('companies')}
          className={`flex items-center gap-2 px-4 py-2 rounded-md font-medium transition-colors ${
            activeTab === 'companies' ? 'bg-white text-teal-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Building2 className="h-4 w-4" /> Empresas & Planos
        </button>
        <button
          onClick={() => setActiveTab('users')}
          className={`flex items-center gap-2 px-4 py-2 rounded-md font-medium transition-colors ${
            activeTab === 'users' ? 'bg-white text-teal-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Users className="h-4 w-4" /> Usuários & Roles
        </button>
      </div>

      {/* Conteúdo: Empresas */}
      {activeTab === 'companies' && (
        <div className="space-y-4">
          {companies.map((company) => (
            <CompanyCard 
              key={company.id} 
              company={company} 
              onUpdate={handleUpdateCompany} 
            />
          ))}
        </div>
      )}

      {/* Conteúdo: Usuários */}
      {activeTab === 'users' && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-600 uppercase">Nome</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-600 uppercase">E-mail</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-600 uppercase">Empresa</th>
                <th className="text-center px-6 py-3 text-xs font-semibold text-slate-600 uppercase">Role Atual</th>
                <th className="text-center px-6 py-3 text-xs font-semibold text-slate-600 uppercase">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4 font-medium text-slate-900">{user.name}</td>
                  <td className="px-6 py-4 text-slate-700">{user.email}</td>
                  <td className="px-6 py-4 text-slate-700">{user.company?.name || '-'}</td>
                  <td className="px-6 py-4 text-center">
                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                      user.role === 'ADMIN' ? 'bg-orange-100 text-orange-800' : 'bg-slate-100 text-slate-700'
                    }`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <button
                      onClick={() => handleUpdateUserRole(user.id, user.role === 'ADMIN' ? 'CLIENTE' : 'ADMIN')}
                      className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                        user.role === 'ADMIN' 
                          ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                          : 'bg-teal-100 text-teal-700 hover:bg-teal-200'
                      }`}
                    >
                      {user.role === 'ADMIN' ? 'Rebaixar para Cliente' : 'Promover para Admin'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// Componente auxiliar para o Card da Empresa
function CompanyCard({ company, onUpdate }: { company: any; onUpdate: (id: string, plan: string, modules: string[]) => void }) {
  const [plan, setPlan] = useState(company.plan);
  const [modules, setModules] = useState<string[]>(company.allowedModules || []);

  const toggleModule = (moduleId: string) => {
    setModules((prev) => 
      prev.includes(moduleId) ? prev.filter((m) => m !== moduleId) : [...prev, moduleId]
    );
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
        <div>
          <h3 className="text-lg font-bold text-slate-900">{company.name}</h3>
          <p className="text-sm text-slate-500">{company.cnpj || 'Sem CNPJ'} • {company.users.length} usuário(s)</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={plan}
            onChange={(e) => setPlan(e.target.value)}
            className="px-3 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-900 bg-white"
          >
            {PLANS.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
          <button
            onClick={() => onUpdate(company.id, plan, modules)}
            className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold rounded-lg transition-colors"
          >
            <Check className="h-4 w-4" /> Salvar Alterações
          </button>
        </div>
      </div>

      <div className="border-t border-slate-100 pt-4">
        <p className="text-xs font-semibold text-slate-500 uppercase mb-3">Módulos Liberados para esta Empresa:</p>
        <div className="flex flex-wrap gap-2">
          {ALL_MODULES.map((mod) => {
            const isActive = modules.includes(mod.id);
            return (
              <button
                key={mod.id}
                onClick={() => toggleModule(mod.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                  isActive 
                    ? 'bg-teal-50 border-teal-500 text-teal-800' 
                    : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'
                }`}
              >
                {isActive ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                {mod.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}