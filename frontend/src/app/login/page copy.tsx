'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import api from '@/lib/axios';
import { toast } from 'sonner';
import { LogIn, Loader2, Eye, EyeOff } from 'lucide-react';

/**
 * =================================================================
 * 🔐 LoginPage — Página de Autenticação (Conta Certa)
 * =================================================================
 * 🧠 DECISÃO TÉCNICA (ADR-style):
 * O Next.js 14+ (App Router) exige que qualquer Server Component que
 * consuma hooks dinâmicos como `useSearchParams()` esteja envolto em
 * uma fronteira de `<Suspense>`. Sem isso, o `next build` falha com:
 *
 *   "useSearchParams() should be wrapped in a suspense boundary"
 *
 * Solução adotada (tudo em um único arquivo):
 *   - `LoginFormContent`: componente interno que usa o hook + estado.
 *   - `LoginPage` (export default): wrapper com <Suspense> + fallback.
 *
 * Isso permite que o Next.js pré-renderize a página estática e,
 * no cliente, hidrate os parâmetros da URL sem travar o build.
 * =================================================================
 */

// =================================================================
// 🎨 LoadingFallback — Estado de carregamento do Suspense
// =================================================================
/**
 * Exibido enquanto os parâmetros da URL ainda não foram hidratados
 * no cliente. Mantém a identidade visual da Conta Certa.
 */
function LoadingFallback() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="flex flex-col items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-teal-400 to-orange-500 flex items-center justify-center font-bold text-white text-2xl shadow-md animate-pulse">
          C
        </div>
        <div className="flex items-center gap-2 text-slate-500 text-sm">
          <Loader2 className="h-4 w-4 animate-spin" />
          Carregando...
        </div>
      </div>
    </div>
  );
}

// =================================================================
// 📝 LoginFormContent — Formulário de Login (usa useSearchParams)
// =================================================================
/**
 * Componente interno que contém toda a lógica do formulário.
 * 
 * 🎯 Responsabilidades:
 *   - Capturar e-mail/senha
 *   - Chamar POST /auth/login
 *   - Salvar user + token no Zustand (sincroniza cookies)
 *   - Redirecionar para `?redirect=` ou `/dashboard`
 * 
 * ⚠️ IMPORTANTE: este componente DEVE estar dentro de um <Suspense>
 * no componente pai, pois usa `useSearchParams()`.
 */
function LoginFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams(); // 🔒 Exige Suspense boundary
  const { login } = useAuthStore();

  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  /**
   * Submete o formulário: autentica e redireciona.
   * Se a URL tiver `?redirect=/dashboard/admin/catalogo`, o usuário
   * volta exatamente para a página que tentava acessar antes do login.
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // 🔐 Chama o backend de autenticação
      const response = await api.post('/auth/login', formData);
      const { user, token } = response.data;

      // 💾 Salva no Zustand (com sincronização automática de cookies
      // para o middleware Next.js proteger rotas /admin/*)
      login({ user, token });

      toast.success('Login realizado com sucesso!');

      // 🎯 Redireciona para o destino original (se existir) ou dashboard
      const redirect = searchParams.get('redirect');
      router.push(redirect || '/dashboard');
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || 'Erro ao autenticar. Verifique seus dados.',
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-200 p-8">
        {/* ================= Cabeçalho ================= */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-teal-400 to-orange-500 flex items-center justify-center font-bold text-white text-2xl shadow-md mb-4">
            C
          </div>
          <h1 className="text-2xl font-bold text-slate-900">
            Conta <span className="text-orange-500">Certa</span>
          </h1>
          <p className="text-slate-500 text-sm mt-1">Acesse sua conta para continuar</p>
        </div>

        {/* ================= Formulário ================= */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* E-mail */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              E-mail
            </label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-4 py-3 border border-slate-300 rounded-lg text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all bg-white"
              placeholder="seu@email.com"
              autoComplete="email"
            />
          </div>

          {/* Senha (com toggle de visibilidade) */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Senha
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all bg-white pr-12"
                placeholder="••••••••"
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          {/* Botão de submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 shadow-sm"
          >
            {loading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <LogIn className="h-5 w-5" />
            )}
            {loading ? 'Entrando...' : 'Entrar no Sistema'}
          </button>
        </form>

        {/* ================= Rodapé ================= */}
        <div className="mt-6 text-center">
          <p className="text-xs text-slate-400">
            Sistema de Gestão Empresarial © {new Date().getFullYear()} Conta Certa
          </p>
        </div>
      </div>
    </div>
  );
}

// =================================================================
// 🎁 LoginPage (export default) — Wrapper com Suspense
// =================================================================
/**
 * Componente raiz exportado pela rota `/login`.
 * 
 * 🛡️ Envolve o `LoginFormContent` em <Suspense> para satisfazer
 * a exigência do Next.js sobre o uso de `useSearchParams()`.
 * 
 * Enquanto os parâmetros da URL não são hidratados no cliente,
 * o `LoadingFallback` é exibido — uma transição suave e profissional.
 */
export default function LoginPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <LoginFormContent />
    </Suspense>
  );
}