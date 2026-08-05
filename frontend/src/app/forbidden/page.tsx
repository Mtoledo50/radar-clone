'use client';

import { useRouter } from 'next/navigation';
import { ShieldX, ArrowLeft } from 'lucide-react';

/**
 * =================================================================
 * 🚫 PÁGINA 403 — ACESSO NEGADO
 * =================================================================
 * Exibida quando um usuário autenticado tenta acessar uma área
 * restrita a ADMIN sem ter a permissão necessária.
 * =================================================================
 */
export default function ForbiddenPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
        {/* Ícone de acesso negado */}
        <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
          <ShieldX className="h-8 w-8 text-red-600" />
        </div>

        {/* Código e título */}
        <p className="text-sm font-bold text-red-600 mb-1">ERRO 403</p>
        <h1 className="text-2xl font-bold text-slate-900 mb-2">
          Acesso Negado
        </h1>

        {/* Mensagem explicativa */}
        <p className="text-slate-600 mb-6">
          Você não tem permissão para acessar esta área. Esta funcionalidade
          é exclusiva para administradores do sistema.
        </p>

        {/* Botão de retorno */}
        <button
          onClick={() => router.push('/dashboard')}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-lg transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar ao Dashboard
        </button>
      </div>
    </div>
  );
}