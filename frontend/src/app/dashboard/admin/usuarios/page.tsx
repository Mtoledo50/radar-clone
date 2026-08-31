'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { 
  UserPlus, 
  KeyRound, 
  Shield, 
  Mail, 
  Building2, 
  Loader2, 
  X,
  Trash2
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import api from '@/lib/axios';

type UserRole = 'SUPER_ADMIN' | 'ADMIN' | 'MANAGER' | 'USER' | 'CLIENTE';

type User = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  mustChangePassword: boolean;
  createdAt: string;
};

const ROLE_BADGES: Record<UserRole, string> = {
  SUPER_ADMIN: 'bg-purple-100 text-purple-800 border-purple-200',
  ADMIN: 'bg-orange-100 text-orange-800 border-orange-200',
  MANAGER: 'bg-blue-100 text-blue-800 border-blue-200',
  USER: 'bg-slate-100 text-slate-800 border-slate-200',
  CLIENTE: 'bg-emerald-100 text-emerald-800 border-emerald-200',
};

const ROLE_LABELS: Record<UserRole, string> = {
  SUPER_ADMIN: 'Super Admin',
  ADMIN: 'Administrador',
  MANAGER: 'Gerente',
  USER: 'Colaborador',
  CLIENTE: 'Cliente',
};

export default function AdminUsersPage() {
  const router = useRouter();
  const { user: loggedUser } = useAuthStore();
  
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'USER' as UserRole,
  });

  // ✅ Todas as funções declaradas ANTES do useEffect e do JSX
  const fetchUsers = async () => {
    try {
      const { data } = await api.get('/users');
      setUsers(data);
    } catch (error) {
      toast.error('Falha ao carregar a lista de usuários.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      await api.post('/users', formData);
      toast.success('Usuário criado com sucesso! Uma senha provisória foi gerada.');
      setIsModalOpen(false);
      setFormData({ name: '', email: '', role: 'USER' });
      fetchUsers();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erro ao criar usuário. Verifique se o e-mail já existe.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetPassword = async (userId: string, userName: string) => {
    if (!confirm(`Deseja gerar uma nova senha provisória para ${userName}?`)) return;
    
    try {
      const { data } = await api.post(`/users/${userId}/reset-password`);
      
      await navigator.clipboard.writeText(data.tempPassword);
      
      toast.success(
        <div className="flex flex-col gap-1">
          <span>Senha redefinida com sucesso!</span>
          <span className="text-xs font-mono bg-slate-100 px-2 py-1 rounded text-slate-800">
            {data.tempPassword} (Copiada para a área de transferência)
          </span>
        </div>,
        { duration: 6000 }
      );
    } catch (error) {
      toast.error('Erro ao redefinir a senha.');
    }
  };

  // ✅ FUNÇÃO DE EXCLUSÃO CORRIGIDA (declarada antes do useEffect)
  const handleDeleteUser = async (userId: string, userName: string) => {
    if (!confirm(`Deseja realmente remover ${userName}? O acesso será revogado imediatamente.`)) return;
    
    try {
      await api.delete(`/users/${userId}`);
      toast.success(`Usuário ${userName} removido com sucesso.`);
      fetchUsers();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erro ao remover usuário.');
    }
  };

  useEffect(() => {
    if (loggedUser && loggedUser.role !== 'ADMIN' && loggedUser.role !== 'SUPER_ADMIN') {
      toast.error('Acesso negado. Apenas administradores podem gerenciar usuários.');
      router.push('/dashboard');
      return;
    }
    fetchUsers();
  }, [loggedUser, router]);

  if (!loggedUser || (loggedUser.role !== 'ADMIN' && loggedUser.role !== 'SUPER_ADMIN')) {
    return null;
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Shield className="text-[#f97316]" /> Gestão de Usuários
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Administre acessos, delegue funções e gerencie a segurança da sua equipe.
          </p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center justify-center gap-2 bg-[#0d9488] hover:bg-[#0f766e] text-white px-5 py-2.5 rounded-lg transition-all font-medium shadow-sm hover:shadow-md"
        >
          <UserPlus size={18} /> Novo Colaborador
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="p-12 flex flex-col items-center justify-center gap-3 text-slate-500">
            <Loader2 className="animate-spin text-[#0d9488]" size={32} />
            <span>Carregando equipe...</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-600 uppercase tracking-wider">Usuário</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-600 uppercase tracking-wider">Função</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-600 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-600 uppercase tracking-wider text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-semibold">
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-medium text-slate-900">{user.name}</div>
                          <div className="text-sm text-slate-500 flex items-center gap-1">
                            <Mail size={12} /> {user.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium border ${ROLE_BADGES[user.role]}`}>
                        {ROLE_LABELS[user.role]}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {user.mustChangePassword ? (
                        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-700 bg-amber-50 px-2.5 py-1 rounded-md border border-amber-200">
                          <KeyRound size={12} /> Troca Pendente
                        </span>
                      ) : (
                        <span className="text-xs font-medium text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
                          Ativo
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <button 
                        onClick={() => handleResetPassword(user.id, user.name)}
                        disabled={user.id === loggedUser.id}
                        className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-[#f97316] transition-colors disabled:opacity-50 disabled:cursor-not-allowed px-3 py-1.5 rounded-md hover:bg-slate-100"
                        title="Redefinir Senha"
                      >
                        <KeyRound size={16} /> Redefinir
                      </button>
                      <button 
                        onClick={() => handleDeleteUser(user.id, user.name)}
                        disabled={user.id === loggedUser.id}
                        className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed px-3 py-1.5 rounded-md hover:bg-red-50"
                        title={user.id === loggedUser.id ? "Você não pode excluir a si mesmo" : "Remover Usuário"}
                      >
                        <Trash2 size={16} /> Remover
                      </button>
                    </td>
                  </tr>
                ))}
                
                {users.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-6 py-16 text-center">
                      <div className="flex flex-col items-center gap-3 text-slate-400">
                        <Building2 size={48} />
                        <p className="text-lg font-medium">Nenhum colaborador cadastrado</p>
                        <p className="text-sm">Comece adicionando membros da sua equipe.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h2 className="text-xl font-bold text-slate-800">Adicionar Colaborador</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100 transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleCreateUser} className="p-6 space-y-5">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700">Nome Completo</label>
                <input 
                  required 
                  className="w-full border border-slate-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-[#0d9488]/20 focus:border-[#0d9488] outline-none transition-all text-slate-900 placeholder:text-slate-400"
                  placeholder="Ex: João Silva"
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                />
              </div>
              
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700">E-mail Corporativo</label>
                <input 
                  type="email"
                  required 
                  className="w-full border border-slate-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-[#0d9488]/20 focus:border-[#0d9488] outline-none transition-all text-slate-900 placeholder:text-slate-400"
                  placeholder="joao@contacerta.com.br"
                  value={formData.email}
                  onChange={e => setFormData({...formData, email: e.target.value})}
                />
              </div>
              
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700">Nível de Acesso</label>
                <select 
                  className="w-full border border-slate-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-[#0d9488]/20 focus:border-[#0d9488] outline-none transition-all bg-white text-slate-900"
                  value={formData.role}
                  onChange={e => setFormData({...formData, role: e.target.value as UserRole})}
                >
                  <option value="USER">Colaborador (Acesso Operacional)</option>
                  <option value="MANAGER">Gerente (Acesso a Relatórios)</option>
                  <option value="ADMIN">Administrador (Acesso Total)</option>
                </select>
              </div>

              <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 flex gap-3 text-sm text-blue-800">
                <KeyRound size={18} className="shrink-0 mt-0.5 text-blue-600" />
                <p>
                  Uma <strong>senha provisória</strong> será gerada automaticamente. O usuário será obrigado a alterá-la no primeiro acesso.
                </p>
              </div>

              <div className="flex gap-3 pt-2">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-2.5 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 font-medium transition-colors disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-2.5 bg-[#0d9488] text-white rounded-lg hover:bg-[#0f766e] font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-70"
                >
                  {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : <UserPlus size={18} />}
                  {isSubmitting ? 'Criando...' : 'Criar Usuário'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}