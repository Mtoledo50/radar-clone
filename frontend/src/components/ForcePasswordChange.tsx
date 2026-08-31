'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/axios';
import { toast } from 'sonner';
import { KeyRound, Loader2, ShieldAlert, CheckCircle2, XCircle } from 'lucide-react';

export default function ForcePasswordChange() {
  const [required, setRequired] = useState(false);
  const [checking, setChecking] = useState(true);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const check = async () => {
      try {
        const { data } = await api.get('/users/me');
        setRequired(!!data.mustChangePassword);
      } catch {
        // Falha silenciosa: não bloqueia o uso do sistema
      } finally {
        setChecking(false);
      }
    };
    check();
  }, []);

  // Checklist visual de força da senha (UX premium)
  const rules = [
    { ok: newPassword.length >= 8, label: 'Mínimo de 8 caracteres' },
    { ok: /[A-Z]/.test(newPassword), label: 'Uma letra maiúscula' },
    { ok: /[a-z]/.test(newPassword), label: 'Uma letra minúscula' },
    { ok: /[0-9]/.test(newPassword), label: 'Um número' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error('As senhas não coincidem.');
      return;
    }
    setSubmitting(true);
    try {
      await api.patch('/users/me/password', { newPassword });
      toast.success('Senha alterada com sucesso. Bem-vindo(a)!');
      setRequired(false);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erro ao alterar a senha.');
    } finally {
      setSubmitting(false);
    }
  };

  if (checking || !required) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="p-6 bg-gradient-to-r from-[#0d9488] to-[#0f766e] text-white">
          <div className="flex items-center gap-3">
            <ShieldAlert size={28} className="text-orange-300" />
            <div>
              <h2 className="text-lg font-bold">Troca de Senha Obrigatória</h2>
              <p className="text-teal-100 text-sm">Por segurança, defina uma nova senha para continuar.</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">Nova Senha</label>
            <input
              type="password"
              required
              autoFocus
              className="w-full border border-slate-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-[#0d9488]/20 focus:border-[#0d9488] outline-none transition-all text-slate-900"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
          </div>

          {/* Checklist de força em tempo real */}
          <div className="grid grid-cols-2 gap-2">
            {rules.map((rule) => (
              <div key={rule.label} className={`flex items-center gap-1.5 text-xs ${rule.ok ? 'text-emerald-600' : 'text-slate-400'}`}>
                {rule.ok ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
                {rule.label}
              </div>
            ))}
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">Confirmar Nova Senha</label>
            <input
              type="password"
              required
              className="w-full border border-slate-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-[#0d9488]/20 focus:border-[#0d9488] outline-none transition-all text-slate-900"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full px-4 py-2.5 bg-[#0d9488] text-white rounded-lg hover:bg-[#0f766e] font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-70"
          >
            {submitting ? <Loader2 className="animate-spin" size={18} /> : <KeyRound size={18} />}
            {submitting ? 'Salvando...' : 'Salvar Nova Senha'}
          </button>
        </form>
      </div>
    </div>
  );
}