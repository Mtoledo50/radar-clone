/**
 * =================================================================
 * PÁGINA: Nova Proposta Comercial
 * =================================================================
 * Responsabilidade: Formulário para criar uma nova proposta do zero.
 * =================================================================
 */
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/axios';
import { toast } from 'sonner';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';

const inputClass = 'w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-white transition-all';
const buttonPrimary = 'flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed';
const buttonSecondary = 'flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-lg transition-colors';

export default function NovaPropostaPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    clientName: '',
    clientCnpj: '',
    taxRegime: 'SIMPLES',
    activity: '',
    monthlyRevenue: 0,
    employeeCount: 0,
    basePrice: 0,
  });

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      // ✅ CORRETO: Usar POST /proposals para criar
      const res = await api.post('/proposals', formData);
      toast.success('Proposta criada com sucesso!');
      // Redireciona para a página de detalhes da proposta criada
      router.push(`/dashboard/precificacao/propostas/${res.data.data.id}`);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Erro ao criar proposta');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6 p-6 max-w-4xl mx-auto">
      {/* Cabeçalho */}
      <div className="flex items-center gap-4">
        <button onClick={() => router.push('/dashboard/precificacao/propostas')} className={buttonSecondary}>
          <ArrowLeft className="h-4 w-4" /> Voltar
        </button>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Nova Proposta Comercial</h1>
          <p className="text-slate-600 text-sm">Preencha os dados iniciais para criar uma nova proposta.</p>
        </div>
      </div>

      {/* Formulário */}
      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-slate-200 p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Nome do Cliente *</label>
            <input required type="text" value={formData.clientName} onChange={(e) => handleChange('clientName', e.target.value)} className={inputClass} placeholder="Ex: Empresa Exemplo Ltda" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">CNPJ</label>
            <input type="text" value={formData.clientCnpj} onChange={(e) => handleChange('clientCnpj', e.target.value)} className={inputClass} placeholder="00.000.000/0001-00" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Regime Tributário</label>
            <select value={formData.taxRegime} onChange={(e) => handleChange('taxRegime', e.target.value)} className={inputClass}>
              <option value="SIMPLES">Simples Nacional</option>
              <option value="LUCRO_PRESUMIDO">Lucro Presumido</option>
              <option value="LUCRO_REAL">Lucro Real</option>
              <option value="MEI">MEI</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Atividade Principal</label>
            <input type="text" value={formData.activity} onChange={(e) => handleChange('activity', e.target.value)} className={inputClass} placeholder="Ex: Comércio Varejista" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Faturamento Mensal (R$)</label>
            <input type="number" value={formData.monthlyRevenue} onChange={(e) => handleChange('monthlyRevenue', Number(e.target.value))} className={inputClass} placeholder="0.00" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Nº de Funcionários</label>
            <input type="number" value={formData.employeeCount} onChange={(e) => handleChange('employeeCount', Number(e.target.value))} className={inputClass} placeholder="0" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Preço Base Sugerido (R$)</label>
            <input type="number" step="0.01" value={formData.basePrice} onChange={(e) => handleChange('basePrice', Number(e.target.value))} className={inputClass} placeholder="0.00" />
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
          <button type="button" onClick={() => router.push('/dashboard/precificacao/propostas')} className={buttonSecondary}>Cancelar</button>
          <button type="submit" disabled={saving} className={buttonPrimary}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {saving ? 'Criando...' : 'Criar Proposta'}
          </button>
        </div>
      </form>
    </div>
  );
}