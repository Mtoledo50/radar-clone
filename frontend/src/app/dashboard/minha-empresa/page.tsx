// =================================================================
// INÍCIO: frontend/src/app/dashboard/minha-empresa/page.tsx
// =================================================================
/**
 * Página: Minha Empresa
 * Cadastro e configuração dos dados da empresa, softwares utilizados e metas.
 */
'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import api from '@/lib/axios';
import { Building2, MapPin, Monitor, TrendingUp, Save, Loader2 } from 'lucide-react';

export default function MinhaEmpresaPage() {
  const { user } = useAuthStore();
  const [fetching, setFetching] = useState(true);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [companyId, setCompanyId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    razaoSocial: '',
    cnpj: '',
    estado: '',
    softwareConsultoria: false,
    softwareContabil: false,
    softwareFiscal: false,
    clientesHoje: 0,
    clientesAno: 0,
    funcionariosHoje: 0,
    funcionariosAno: 0,
    visaoEmpresa: '',
    maiorDesafio: '',
    compromisso: '',
  });

  // =================================================================
  // INÍCIO: Constantes de Estilos
  // =================================================================
  const estados = [
    'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
    'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
    'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
  ];

  const inputClass =
    "w-full px-3 py-2.5 border border-slate-300 rounded-lg " +
    "text-slate-900 placeholder:text-slate-400 " +
    "focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all bg-white";

  const checkboxClass = "h-4 w-4 text-teal-600 focus:ring-teal-500 border-slate-300 rounded cursor-pointer";
  // =================================================================
  // FIM: Constantes de Estilos
  // =================================================================

  // =================================================================
  // INÍCIO: Carregar Dados Existentes
  // =================================================================
  useEffect(() => {
    async function fetchData() {
      try {
        setFetching(true);
        const response = await api.get('/company');
        if (response.data && response.data.data) {
          const data = response.data.data;
          setCompanyId(data.id);
          setFormData({
            razaoSocial: data.razaoSocial || '',
            cnpj: data.cnpj || '',
            estado: data.estado || '',
            softwareConsultoria: data.softwareConsultoria || false,
            softwareContabil: data.softwareContabil || false,
            softwareFiscal: data.softwareFiscal || false,
            clientesHoje: data.clientesHoje || 0,
            clientesAno: data.clientesAno || 0,
            funcionariosHoje: data.funcionariosHoje || 0,
            funcionariosAno: data.funcionariosAno || 0,
            visaoEmpresa: data.visaoEmpresa || '',
            maiorDesafio: data.maiorDesafio || '',
            compromisso: data.compromisso || '',
          });
        }
      } catch (error) {
        console.error('Erro ao carregar dados da empresa:', error);
      } finally {
        setFetching(false);
      }
    }
    fetchData();
  }, []);
  // =================================================================
  // FIM: Carregar Dados Existentes
  // =================================================================

  // =================================================================
  // INÍCIO: Salvar ou Atualizar Dados
  // =================================================================
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      let response;
      if (companyId) {
        // Se já existe ID, faz UPDATE
        response = await api.put(`/company/${companyId}`, formData);
      } else {
        // Se não existe, faz CREATE
        response = await api.post('/company', formData);
        if (response.data && response.data.data) {
          setCompanyId(response.data.data.id);
        }
      }

      setMessage({
        type: 'success',
        text: response.data.message || 'Dados da empresa salvos com sucesso!'
      });
    } catch (error: any) {
      setMessage({
        type: 'error',
        text: error.response?.data?.message || 'Erro ao salvar dados. Tente novamente.'
      });
    } finally {
      setLoading(false);
    }
  };
  // =================================================================
  // FIM: Salvar ou Atualizar Dados
  // =================================================================

  // =================================================================
  // INÍCIO: Renderização - Loading
  // =================================================================
  if (fetching) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="h-12 w-12 text-teal-600 animate-spin mb-4" />
        <p className="text-slate-600 font-medium">Carregando dados da empresa...</p>
      </div>
    );
  }
  // =================================================================
  // FIM: Renderização - Loading
  // =================================================================

  // =================================================================
  // INÍCIO: Renderização - Formulário Principal
  // =================================================================
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* CABEÇALHO */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Minha Empresa</h1>
        <p className="text-slate-600">
          Cadastre os dados da sua empresa para personalizar sua experiência e desbloquear relatórios.
        </p>
      </div>

      {/* MENSAGEM DE SUCESSO OU ERRO */}
      {message.text && (
        <div className={`p-4 rounded-lg flex items-center gap-3 border ${
          message.type === 'success'
            ? 'bg-green-50 text-green-800 border-green-200'
            : 'bg-red-50 text-red-800 border-red-200'
        }`}>
          <span className="text-xl">{message.type === 'success' ? '✅' : '❌'}</span>
          <span className="font-medium">{message.text}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* ================================================================= */}
        {/* SEÇÃO 1: DADOS BÁSICOS */}
        {/* ================================================================= */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-3 mb-6">
            <Building2 className="h-6 w-6 text-teal-600" />
            <h2 className="text-xl font-semibold text-slate-900">Dados Básicos</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">Razão Social</label>
              <input
                type="text"
                value={formData.razaoSocial}
                onChange={(e) => setFormData({ ...formData, razaoSocial: e.target.value })}
                className={inputClass}
                placeholder="Ex: Minha Empresa Teste LTDA"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">CNPJ</label>
              <input
                type="text"
                value={formData.cnpj}
                onChange={(e) => setFormData({ ...formData, cnpj: e.target.value })}
                className={inputClass}
                placeholder="00.000.000/0000-00"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Estado</label>
              <select
                value={formData.estado}
                onChange={(e) => setFormData({ ...formData, estado: e.target.value })}
                className={inputClass}
              >
                <option value="">Selecione um estado</option>
                {estados.map((uf) => (
                  <option key={uf} value={uf}>{uf}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* ================================================================= */}
        {/* SEÇÃO 2: SOFTWARES UTILIZADOS */}
        {/* ================================================================= */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-3 mb-6">
            <Monitor className="h-6 w-6 text-teal-600" />
            <h2 className="text-xl font-semibold text-slate-900">Softwares Utilizados</h2>
          </div>
          <div className="space-y-3">
            <label className="flex items-center gap-3 p-3 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors">
              <input
                type="checkbox"
                checked={formData.softwareConsultoria}
                onChange={(e) => setFormData({ ...formData, softwareConsultoria: e.target.checked })}
                className={checkboxClass}
              />
              <span className="text-slate-700 font-medium">Consultoria Tributária/Fiscal</span>
            </label>
            <label className="flex items-center gap-3 p-3 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors">
              <input
                type="checkbox"
                checked={formData.softwareContabil}
                onChange={(e) => setFormData({ ...formData, softwareContabil: e.target.checked })}
                className={checkboxClass}
              />
              <span className="text-slate-700 font-medium">Contábil (Folha, Balanço, etc.)</span>
            </label>
            <label className="flex items-center gap-3 p-3 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors">
              <input
                type="checkbox"
                checked={formData.softwareFiscal}
                onChange={(e) => setFormData({ ...formData, softwareFiscal: e.target.checked })}
                className={checkboxClass}
              />
              <span className="text-slate-700 font-medium">Lançamento Fiscal/CND/Caixa Postal</span>
            </label>
          </div>
        </div>

        {/* ================================================================= */}
        {/* SEÇÃO 3: METAS E NÚMEROS */}
        {/* ================================================================= */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-3 mb-6">
            <TrendingUp className="h-6 w-6 text-orange-600" />
            <h2 className="text-xl font-semibold text-slate-900">Metas e Números</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Quantos clientes você tem hoje?</label>
              <input
                type="number"
                value={formData.clientesHoje}
                onChange={(e) => setFormData({ ...formData, clientesHoje: parseInt(e.target.value) || 0 })}
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Quantos clientes quer ter em 1 ano?</label>
              <input
                type="number"
                value={formData.clientesAno}
                onChange={(e) => setFormData({ ...formData, clientesAno: parseInt(e.target.value) || 0 })}
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Quantos funcionários você tem hoje?</label>
              <input
                type="number"
                value={formData.funcionariosHoje}
                onChange={(e) => setFormData({ ...formData, funcionariosHoje: parseInt(e.target.value) || 0 })}
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Quantos funcionários quer ter em 1 ano?</label>
              <input
                type="number"
                value={formData.funcionariosAno}
                onChange={(e) => setFormData({ ...formData, funcionariosAno: parseInt(e.target.value) || 0 })}
                className={inputClass}
              />
            </div>
          </div>
        </div>

        {/* ================================================================= */}
        {/* SEÇÃO 4: VISÃO DE FUTURO */}
        {/* ================================================================= */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-3 mb-6">
            <TrendingUp className="h-6 w-6 text-teal-600" />
            <h2 className="text-xl font-semibold text-slate-900">Visão de Futuro</h2>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Visão da Empresa</label>
              <textarea
                value={formData.visaoEmpresa}
                onChange={(e) => setFormData({ ...formData, visaoEmpresa: e.target.value })}
                rows={3}
                className={inputClass}
                placeholder="Ex: Ser referência em consultoria contábil no estado..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Maior Desafio Atual</label>
              <textarea
                value={formData.maiorDesafio}
                onChange={(e) => setFormData({ ...formData, maiorDesafio: e.target.value })}
                rows={3}
                className={inputClass}
                placeholder="Ex: Falta de processos bem elaborados e automatizados..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Seu Compromisso</label>
              <textarea
                value={formData.compromisso}
                onChange={(e) => setFormData({ ...formData, compromisso: e.target.value })}
                rows={3}
                className={inputClass}
                placeholder="O que você está disposto(a) a mudar para alcançar essa visão?"
              />
            </div>
          </div>
        </div>

        {/* ================================================================= */}
        {/* BOTÃO SALVAR */}
        {/* ================================================================= */}
        <div className="flex justify-end pt-4">
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 px-8 py-3 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 shadow-sm"
          >
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
            {loading ? 'Salvando...' : 'Salvar Dados'}
          </button>
        </div>
      </form>
    </div>
  );
  // =================================================================
  // FIM: Renderização - Formulário Principal
  // =================================================================
}
// =================================================================
// FIM: frontend/src/app/dashboard/minha-empresa/page.tsx
// =================================================================