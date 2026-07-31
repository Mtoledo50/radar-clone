'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { Mail, Lock, LogIn, Loader2 } from 'lucide-react';
import api from '@/lib/axios';

export default function LoginPage() {
  const router = useRouter();
  
  // 🔥 CORREÇÃO 1: O authStore exporta apenas 'setUser' (que recebe user e token juntos).
  // Removemos 'setToken' pois essa função não existe mais no store.
  const { setUser } = useAuthStore();
  
  const [isRegister, setIsRegister] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const endpoint = isRegister ? '/auth/register' : '/auth/login';
      
      // 🔥 CORREÇÃO 2: Enviamos apenas os dados necessários para cada rota.
      // No login, não enviamos o campo 'name' vazio, evitando warnings no backend.
      const payload = isRegister
        ? { name: form.name, email: form.email, password: form.password }
        : { email: form.email, password: form.password };

      const { data } = await api.post(endpoint, payload);

      // 🔥 CORREÇÃO 3: Chamada correta do Zustand.
      // O 'setUser' do seu authStore.ts espera DOIS parâmetros: (user, token)
      if (data.user && data.token) {
        setUser(data.user, data.token);
        router.push('/dashboard');
      } else {
        setError('Resposta do servidor inválida.');
      }
    } catch (err: any) {
      // 🔥 CORREÇÃO 4: Tratamento de erro específico para o código 409 (Conflito)
      if (err.response?.status === 409) {
        setError('Este e-mail já está cadastrado. Tente fazer login ou use outro e-mail.');
      } else {
        const msg = err.response?.data?.message || 'Erro ao autenticar. Verifique seus dados.';
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  // Classe padrão para todos os inputs (com texto visível e contraste correto)
  const inputClass = 
    "w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-lg " +
    "text-slate-900 placeholder:text-slate-400 " + // 👈 Garante que o texto digitado seja escuro
    "focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all";

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-900 via-slate-900 to-teal-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-8">
        
        {/* LOGOTIPO COM FUNDO CIRCULAR (Visível e com as cores da marca) */}
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-teal-500 to-orange-500 flex items-center justify-center shadow-lg">
            <span className="text-white font-bold text-3xl">C</span>
          </div>
        </div>

        {/* TÍTULO COM CORES DA MARCA */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold">
            <span className="text-orange-500">Conta</span>{' '}
            <span className="text-teal-600">Certa</span>
          </h1>
          <p className="text-slate-500 mt-2 text-sm">
            {isRegister ? 'Crie sua conta' : 'Entre na sua conta'}
          </p>
        </div>

        {/* FORMULÁRIO */}
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Campo Nome (apenas no registro) */}
          {isRegister && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Nome
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className={inputClass}
                placeholder="Seu nome completo"
                required
              />
            </div>
          )}

          {/* Campo E-mail */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              E-mail
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className={inputClass}
                placeholder="seu@email.com"
                required
              />
            </div>
          </div>

          {/* Campo Senha */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Senha
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
              <input
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className={inputClass}
                placeholder="Mínimo 6 caracteres"
                required
              />
            </div>
          </div>

          {/* Mensagem de Erro */}
          {error && (
            <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg border border-red-200 flex items-center gap-2">
              <span>⚠️</span> {error}
            </div>
          )}

          {/* Botão Principal */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-teal-600 hover:bg-teal-700 text-white font-semibold py-3 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2 shadow-md"
          >
            {loading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <LogIn className="h-5 w-5" />
            )}
            {loading ? 'Carregando...' : isRegister ? 'Criar conta' : 'Entrar'}
          </button>
        </form>

        {/* Toggle Login/Registro */}
        <div className="mt-6 text-center">
          <button
            onClick={() => setIsRegister(!isRegister)}
            className="text-teal-600 hover:text-teal-700 text-sm font-medium transition-colors"
          >
            {isRegister
              ? 'Já tem conta? Faça login'
              : 'Não tem conta? Cadastre-se'}
          </button>
        </div>

        {/* Rodapé */}
        <div className="mt-8 pt-6 border-t border-slate-200 text-center">
          <p className="text-xs text-slate-400">
            © 2026 Conta Certa • Soluções Empresariais
          </p>
        </div>
      </div>
    </div>
  );
}