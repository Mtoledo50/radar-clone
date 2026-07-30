'use client';

import { useAuthStore } from '@/store/authStore';

export default function DashboardPage() {
  const { user } = useAuthStore();

  return (
    <div>
      <h1 className="text-3xl font-bold text-slate-900 mb-2">
        Bem-vindo, {user?.name}! 👋
      </h1>
      <p className="text-slate-600 mb-8">
        Este é o seu painel de controle. Aqui você vai gerenciar sua empresa.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h3 className="text-sm font-medium text-slate-500">Status</h3>
          <p className="text-2xl font-bold text-slate-900 mt-2">Ativo</p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h3 className="text-sm font-medium text-slate-500">Plano</h3>
          <p className="text-2xl font-bold text-slate-900 mt-2">Free</p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h3 className="text-sm font-medium text-slate-500">Módulos</h3>
          <p className="text-2xl font-bold text-slate-900 mt-2">5</p>
        </div>
      </div>
    </div>
  );
}