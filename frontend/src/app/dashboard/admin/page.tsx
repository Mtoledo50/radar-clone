'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/axios';
import { toast } from 'sonner';
import { Shield, Users, Building2, Loader2, Check, X, Plus, UserPlus, Trash2 } from 'lucide-react';

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

const inputClass = "w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-white";

export default function AdminPanelPage() {
  const [activeTab, setActiveTab] = useState<'companies' | 'users'>('companies');
  const [companies, setCompanies] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);

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
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Erro ao atualizar empresa');
    }
  }

  // 🔥 FUNÇÃO DE DELETAR EMPRESA
  async function handleDeleteCompany(id: string, companyName: string) {
    if (!confirm(`⚠️ ATENÇÃO!\n\nVocê está prestes a deletar a empresa "${companyName}" e TODOS os usuários vinculados a ela.\n\nEsta ação NÃO pode ser desfeita.\n\nDeseja continuar?`)) {
      return;
    }

    try {
      await api.delete(`/admin/companies/${id}`);
      toast.success('Empresa removida com sucesso!');
      loadData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Erro ao deletar empresa');
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

  async function handleDeleteUser(id: string, userName: string) {
    if (!confirm(`Tem certeza que deseja deletar o usuário "${userName}"?`)) {
      return;
    }

    try {
      await api.delete(`/admin/users/${id}`);
      toast.success('Usuário removido com sucesso!');
      loadData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Erro ao deletar usuário');
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
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
            <Shield className="h-8 w-8 text-teal-600" />
            Painel Administrativo
          </h1>
          <p className="text-slate-600 mt-1">Gerencie planos, módulos e permissões do seu SaaS.</p>
        </div>
        
        {activeTab === 'companies' && (
          <button
            onClick={() => setShowOnboarding(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-lg transition-colors shadow-sm"
          >
            <UserPlus className="h-5 w-5" />
            Novo Cliente (Onboarding)
          </button>
        )}
      </div>

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

      {activeTab === 'companies' && (
        <div className="space-y-4">
          {companies.map((company) => (
            <CompanyCard 
              key={company.id} 
              company={company} 
              onUpdate={handleUpdateCompany}
              onDelete={handleDeleteCompany}
            />
          ))}
        </div>
      )}

      {activeTab === 'users' && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-600 uppercase">Nome</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-600 uppercase">E-mail</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-600 uppercase">Empresa</th>
                <th className="text-center px-6 py-3 text-xs font-semibold text-slate-600 uppercase">Role</th>
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
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => handleUpdateUserRole(user.id, user.role === 'ADMIN' ? 'CLIENTE' : 'ADMIN')}
                        className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                          user.role === 'ADMIN' ? 'bg-red-100 text-red-700 hover:bg-red-200' : 'bg-teal-100 text-teal-700 hover:bg-teal-200'
                        }`}
                      >
                        {user.role === 'ADMIN' ? 'Rebaixar' : 'Promover'}
                      </button>
                      <button
                        onClick={() => handleDeleteUser(user.id, user.name)}
                        className="p-1.5 rounded text-red-600 hover:bg-red-50 transition-colors"
                        title="Deletar usuário"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showOnboarding && (
        <OnboardingModal 
          onClose={() => setShowOnboarding(false)} 
          onSuccess={() => { setShowOnboarding(false); loadData(); }} 
        />
      )}
    </div>
  );
}

// =================================================================
// 🏢 CARD DA EMPRESA (COM BOTÃO DELETAR)
// =================================================================
function CompanyCard({ company, onUpdate, onDelete }: { 
  company: any; 
  onUpdate: (id: string, plan: string, modules: string[]) => void; 
  onDelete: (id: string, name: string) => void 
}) {
  const [plan, setPlan] = useState(company.plan);
  const [modules, setModules] = useState<string[]>(company.allowedModules || []);

  const toggleModule = (moduleId: string) => {
    setModules((prev) => prev.includes(moduleId) ? prev.filter((m) => m !== moduleId) : [...prev, moduleId]);
  };

  const isDefaultCompany = company.name.includes('Escritório Padrão') || company.id === '00000000-0000-0000-0000-000000000001';

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-lg font-bold text-slate-900">{company.name}</h3>
            {isDefaultCompany && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-100 text-orange-700 border border-orange-200">
                SISTEMA
              </span>
            )}
          </div>
          <p className="text-sm text-slate-500">{company.cnpj || 'Sem CNPJ'} • {company.users.length} usuário(s)</p>
        </div>

        {/* 🔥 AQUI ESTÃO OS 3 BOTÕES: PLANO + SALVAR + DELETAR */}
        <div className="flex items-center gap-2">
          <select value={plan} onChange={(e) => setPlan(e.target.value)} className="px-3 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-900 bg-white">
            {PLANS.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
          
          <button onClick={() => onUpdate(company.id, plan, modules)} className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold rounded-lg transition-colors">
            <Check className="h-4 w-4" /> Salvar
          </button>

          {/*  BOTÃO DELETAR - SÓ APARECE SE NÃO FOR A EMPRESA PADRÃO */}
          {!isDefaultCompany && (
            <button
              onClick={() => onDelete(company.id, company.name)}
              className="flex items-center gap-2 px-3 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-lg transition-colors"
              title="Deletar empresa"
            >
              <Trash2 className="h-4 w-4" />
              <span className="hidden md:inline">Deletar</span>
            </button>
          )}
        </div>
      </div>

      <div className="border-t border-slate-100 pt-4">
        <p className="text-xs font-semibold text-slate-500 uppercase mb-3">Módulos Liberados:</p>
        <div className="flex flex-wrap gap-2">
          {ALL_MODULES.map((mod) => {
            const isActive = modules.includes(mod.id);
            return (
              <button key={mod.id} onClick={() => toggleModule(mod.id)} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${isActive ? 'bg-teal-50 border-teal-500 text-teal-800' : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'}`}>
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

// =================================================================
// 📝 MODAL DE ONBOARDING
// =================================================================
function OnboardingModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    companyName: '',
    cnpj: '',
    plan: 'BASIC',
    allowedModules: ['dashboard', 'pessoas', 'clientes'],
    userName: '',
    email: '',
    password: '',
  });

  const toggleModule = (moduleId: string) => {
    setFormData((prev) => ({
      ...prev,
      allowedModules: prev.allowedModules.includes(moduleId)
        ? prev.allowedModules.filter((m) => m !== moduleId)
        : [...prev.allowedModules, moduleId],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/admin/onboard', formData);
      toast.success('Cliente onboardado com sucesso!');
      onSuccess();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Erro ao criar cliente');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-slate-200 sticky top-0 bg-white z-10">
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <UserPlus className="h-6 w-6 text-teal-600" />
            Onboarding de Novo Cliente
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider border-b pb-2">Dados da Empresa</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">Nome da Empresa *</label>
                <input type="text" required value={formData.companyName} onChange={(e) => setFormData({ ...formData, companyName: e.target.value })} className={inputClass} placeholder="Ex: Contabilidade Silva Ltda" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">CNPJ</label>
                <input type="text" value={formData.cnpj} onChange={(e) => setFormData({ ...formData, cnpj: e.target.value })} className={inputClass} placeholder="00.000.000/0000-00" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Plano Inicial</label>
                <select value={formData.plan} onChange={(e) => setFormData({ ...formData, plan: e.target.value })} className={inputClass}>
                  {PLANS.map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider border-b pb-2">Módulos Liberados</h3>
            <div className="flex flex-wrap gap-2">
              {ALL_MODULES.map((mod) => {
                const isActive = formData.allowedModules.includes(mod.id);
                return (
                  <button key={mod.id} type="button" onClick={() => toggleModule(mod.id)} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${isActive ? 'bg-teal-50 border-teal-500 text-teal-800' : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'}`}>
                    {isActive ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                    {mod.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider border-b pb-2">Usuário de Acesso (Admin da Empresa)</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">Nome Completo *</label>
                <input type="text" required value={formData.userName} onChange={(e) => setFormData({ ...formData, userName: e.target.value })} className={inputClass} placeholder="Nome do responsável" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">E-mail *</label>
                <input type="email" required value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className={inputClass} placeholder="email@empresa.com" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Senha Provisória *</label>
                <input type="password" required value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} className={inputClass} placeholder="Mínimo 6 caracteres" />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
            <button type="button" onClick={onClose} className="px-4 py-2 text-slate-700 hover:bg-slate-100 rounded-lg font-medium">Cancelar</button>
            <button type="submit" disabled={loading} className="flex items-center gap-2 px-6 py-2 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-lg disabled:opacity-50">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              {loading ? 'Criando...' : 'Criar Empresa e Usuário'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}