'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { X, Save, RefreshCw, User, Building2, Shield, Loader2 } from 'lucide-react';
import api from '@/lib/axios';

interface UserEmployee {
  id: string;
  position?: string | null;
  department?: string | null;
}

interface UserDetails {
  id: string;
  name: string;
  email: string;
  role: 'SUPER_ADMIN' | 'ADMIN' | 'MANAGER' | 'USER' | 'CLIENTE';
  employees: UserEmployee[];
  permission?: { permissions: string } | null;
}

interface UserEditModalProps {
  userId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function UserEditModal({ userId, isOpen, onClose, onSuccess }: UserEditModalProps) {
  const [loading, setLoading] = useState(false);
  const [resettingPassword, setResettingPassword] = useState(false);
  const [details, setDetails] = useState<UserDetails | null>(null);
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<UserDetails['role']>('USER');
  const [department, setDepartment] = useState('');
  const [position, setPosition] = useState('');

  useEffect(() => {
    if (isOpen && userId) {
      fetchUserDetails();
    }
  }, [isOpen, userId]);

  const fetchUserDetails = async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/users/${userId}/details`);
      setDetails(data);
      setName(data.name);
      setEmail(data.email);
      setRole(data.role);
      setDepartment(data.employees?.[0]?.department || '');
      setPosition(data.employees?.[0]?.position || '');
    } catch (error) {
      toast.error('Erro ao carregar detalhes do usuário.');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // 1. Atualiza dados do User (Login/RBAC)
      await api.patch(`/users/${userId}/details`, { name, email, role });

      // 2. Atualiza dados do Employee (RH), se houver campos preenchidos e existir um registro
      if ((department || position) && details?.employees?.[0]?.id) {
        await api.patch(`/users/${userId}/employee`, { department, position });
      }

      toast.success('Usuário atualizado com sucesso!');
      onSuccess();
      onClose();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erro ao salvar alterações.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!confirm(`Tem certeza que deseja redefinir a senha de ${name}?`)) return;

    setResettingPassword(true);
    try {
      const { data } = await api.post(`/users/${userId}/reset-password`);
      await navigator.clipboard.writeText(data.tempPassword);
      
      toast.success(
        <div className="flex flex-col gap-1">
          <span>Senha redefinida com sucesso!</span>
          <span className="text-xs font-mono bg-slate-100 px-2 py-1 rounded text-slate-800">
            {data.tempPassword} (Copiada)
          </span>
        </div>,
        { duration: 6000 }
      );
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erro ao redefinir senha.');
    } finally {
      setResettingPassword(false);
    }
  };

  if (!isOpen || !userId) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200">
        
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-teal-100 rounded-lg">
              <User className="w-5 h-5 text-[#0d9488]" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800">Editar Usuário</h2>
              <p className="text-sm text-slate-500">Gerencie acesso, setor e credenciais</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSave} className="p-6 space-y-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-[#0d9488] animate-spin" />
              <span className="ml-3 text-slate-500">Carregando dados...</span>
            </div>
          ) : (
            <>
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                  <Shield className="w-4 h-4 text-[#0d9488]" /> Dados de Acesso
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Nome Completo</label>
                    <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#0d9488]/20 focus:border-[#0d9488] outline-none transition-all text-slate-900" required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">E-mail</label>
                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#0d9488]/20 focus:border-[#0d9488] outline-none transition-all text-slate-900" required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Função no Sistema</label>
                    <select value={role} onChange={(e) => setRole(e.target.value as any)} className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#0d9488]/20 focus:border-[#0d9488] outline-none transition-all bg-white text-slate-900">
                      <option value="USER">Colaborador</option>
                      <option value="MANAGER">Gerente</option>
                      <option value="ADMIN">Administrador</option>
                      <option value="SUPER_ADMIN">Super Admin</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-100" />

              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-[#0d9488]" /> Dados do Colaborador
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Departamento / Setor</label>
                    <input type="text" value={department} onChange={(e) => setDepartment(e.target.value)} placeholder="Ex: Fiscal, Contábil, RH" className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#0d9488]/20 focus:border-[#0d9488] outline-none transition-all text-slate-900 placeholder:text-slate-400" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Cargo</label>
                    <input type="text" value={position} onChange={(e) => setPosition(e.target.value)} placeholder="Ex: Analista, Gerente, Sócio" className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#0d9488]/20 focus:border-[#0d9488] outline-none transition-all text-slate-900 placeholder:text-slate-400" />
                  </div>
                </div>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <RefreshCw className="w-5 h-5 text-amber-600" />
                  <div>
                    <p className="text-sm font-semibold text-amber-900">Redefinir Senha</p>
                    <p className="text-xs text-amber-700">Gera uma senha temporária e força a troca no próximo login.</p>
                  </div>
                </div>
                <button type="button" onClick={handleResetPassword} disabled={resettingPassword} className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2">
                  {resettingPassword && <Loader2 className="w-4 h-4 animate-spin" />}
                  {resettingPassword ? 'Redefinindo...' : 'Redefinir Senha'}
                </button>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button type="button" onClick={onClose} className="px-4 py-2.5 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 font-medium transition-colors">Cancelar</button>
                <button type="submit" disabled={loading} className="flex items-center gap-2 px-6 py-2.5 bg-[#0d9488] hover:bg-[#0f766e] text-white rounded-lg transition-colors font-medium disabled:opacity-70">
                  <Save className="w-4 h-4" />
                  {loading ? 'Salvando...' : 'Salvar Alterações'}
                </button>
              </div>
            </>
          )}
        </form>
      </div>
    </div>
  );
}