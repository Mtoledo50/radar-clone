'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import api from '@/lib/axios';
import { toast } from 'sonner';
import { 
  Building2, MapPin, Monitor, TrendingUp, Save, Loader2, 
  X, Plus, Target, Briefcase, Users 
} from 'lucide-react';

// =================================================================
// CONSTANTES
// =================================================================
const ESTADOS = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
  'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
  'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
];

const SOFTWARE_CATEGORIES = [
  { id: 'consultoria', label: 'Consultoria' },
  { id: 'contabil', label: 'Sistema Contábil' },
  { id: 'fiscal', label: 'Levantamento Fiscal/CND/Caixa Postal' },
  { id: 'tarefas', label: 'Controle de Tarefas' },
  { id: 'financeiro', label: 'Sistema de Gestão Financeira' },
  { id: 'servicos_tomados', label: 'Serviços Tomados' },
  { id: 'speds', label: 'Entrega SPEDs' },
  { id: 'bpo', label: 'Dashboard BPO Financeiro' },
  { id: 'precificacao', label: 'Precificação de Honorários' },
  { id: 'mei', label: 'Automação MEI' },
  { id: 'fgts', label: 'FGTS Digital' },
  { id: 'convencao', label: 'Convenção Coletiva' },
  { id: 'infraestrutura', label: 'Servidor/Infraestrutura' },
  { id: 'pdi', label: 'Engajamento/PDI' },
  { id: 'whatsapp', label: 'WhatsApp/Comunicação' },
  { id: 'conciliacao', label: 'Conciliação Bancária' },
  { id: 'qualidade', label: 'Sistema de Qualidade' },
  { id: 'xml', label: 'Captura de XML' },
];

const inputClass = "w-full px-3 py-2.5 border border-slate-300 rounded-lg text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all bg-white";

// =================================================================
// COMPONENTE AUXILIAR: Software Category
// =================================================================
function SoftwareCategory({ 
  title, 
  categoryId, 
  data, 
  onUpdate 
}: { 
  title: string; 
  categoryId: string; 
  data: { notUsed: boolean; items: string[] }; 
  onUpdate: (categoryId: string, newData: { notUsed: boolean; items: string[] }) => void;
}) {
  const [newItem, setNewItem] = useState('');

  const handleAdd = () => {
    if (newItem.trim() && !data.notUsed) {
      onUpdate(categoryId, { ...data, items: [...data.items, newItem.trim()] });
      setNewItem('');
    }
  };

  const handleRemove = (itemToRemove: string) => {
    onUpdate(categoryId, { ...data, items: data.items.filter(i => i !== itemToRemove) });
  };

  return (
    <div className="border border-slate-200 rounded-lg p-4 bg-slate-50">
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-semibold text-slate-800 text-sm">{title}</h4>
        <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer hover:text-slate-800">
          <input 
            type="checkbox" 
            checked={data.notUsed} 
            onChange={(e) => onUpdate(categoryId, { ...data, notUsed: e.target.checked, items: e.target.checked ? [] : data.items })}
            className="rounded border-slate-300 text-teal-600 focus:ring-teal-500"
          />
          Não utilizo
        </label>
      </div>
      
      {!data.notUsed && (
        <div className="space-y-3">
          <div className="flex gap-2">
            <input
              type="text"
              value={newItem}
              onChange={(e) => setNewItem(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAdd())}
              placeholder="Nome do software..."
              className="flex-1 px-3 py-1.5 border border-slate-300 rounded-md text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            />
            <button 
              type="button"
              onClick={handleAdd}
              className="px-3 py-1.5 bg-teal-600 text-white rounded-md hover:bg-teal-700 text-sm font-medium flex items-center gap-1"
            >
              <Plus className="h-3 w-3" /> Adicionar
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {data.items.map((item, idx) => (
              <span key={idx} className="inline-flex items-center gap-1 px-2 py-1 bg-teal-100 text-teal-800 text-xs font-medium rounded-full">
                {item}
                <button type="button" onClick={() => handleRemove(item)} className="hover:text-teal-900">
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
            {data.items.length === 0 && (
              <span className="text-xs text-slate-400 italic">Nenhum software adicionado</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// =================================================================
// PÁGINA PRINCIPAL
// =================================================================
export default function MinhaEmpresaPage() {
  const { user } = useAuthStore();
  const [fetching, setFetching] = useState(true);
  const [loading, setLoading] = useState(false);
  const [companyId, setCompanyId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    razaoSocial: '',
    cnpj: '',
    estado: '',
    clientesHoje: 0,
    clientesAno: 0,
    funcionariosHoje: 0,
    funcionariosAno: 0,
    visaoEmpresa: '',
    maiorDesafio: '',
    compromisso: '',
  });

  const initialSoftwareState = SOFTWARE_CATEGORIES.reduce((acc, cat) => {
    acc[cat.id] = { notUsed: false, items: [] };
    return acc;
  }, {} as Record<string, { notUsed: boolean; items: string[] }>);

  const [softwareData, setSoftwareData] = useState<Record<string, { notUsed: boolean; items: string[] }>>(initialSoftwareState);

  // =================================================================
  // CARREGAR DADOS
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
            clientesHoje: data.clientesHoje || 0,
            clientesAno: data.clientesAno || 0,
            funcionariosHoje: data.funcionariosHoje || 0,
            funcionariosAno: data.funcionariosAno || 0,
            visaoEmpresa: data.visaoEmpresa || '',
            maiorDesafio: data.maiorDesafio || '',
            compromisso: data.compromisso || '',
          });

          // Carregar softwares do formato "categoria:valor"
          const loadedSoftware = { ...initialSoftwareState };
          if (data.softwareStack && Array.isArray(data.softwareStack)) {
            data.softwareStack.forEach((entry: string) => {
              const parts = entry.split(':');
              const catId = parts[0];
              const value = parts.slice(1).join(':');
              if (loadedSoftware[catId]) {
                if (value === 'NÃO_UTILIZADO') {
                  loadedSoftware[catId].notUsed = true;
                } else {
                  loadedSoftware[catId].items.push(value);
                }
              }
            });
          }
          setSoftwareData(loadedSoftware);
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
  // SALVAR DADOS
  // =================================================================
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Formatar softwares para array de strings compatível com o banco
    const flattenedSoftware = Object.entries(softwareData).flatMap(([categoryId, data]) => {
      if (data.notUsed) return [`${categoryId}:NÃO_UTILIZADO`];
      return data.items.map(item => `${categoryId}:${item}`);
    });

    const payload = {
      ...formData,
      softwareStack: flattenedSoftware,
    };

    try {
      let response;
      if (companyId) {
        response = await api.put(`/company/${companyId}`, payload);
      } else {
        response = await api.post('/company', payload);
        if (response.data && response.data.data) {
          setCompanyId(response.data.data.id);
        }
      }
      toast.success(response.data.message || 'Dados da empresa salvos com sucesso!');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erro ao salvar dados. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  // =================================================================
  // RENDERIZAÇÃO
  // =================================================================
  if (fetching) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="h-12 w-12 text-teal-600 animate-spin mb-4" />
        <p className="text-slate-600 font-medium">Carregando dados da empresa...</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12">
      {/* CABEÇALHO */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900 mb-2 flex items-center gap-3">
          <Building2 className="h-8 w-8 text-teal-600" />
          Minha Empresa
        </h1>
        <p className="text-slate-600">
          Cadastre os dados da sua empresa para personalizar sua experiência e desbloquear relatórios de benchmark.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* SEÇÃO 1: DADOS BÁSICOS */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-3 mb-6 pb-2 border-b border-slate-100">
            <MapPin className="h-5 w-5 text-teal-600" />
            <h2 className="text-lg font-semibold text-slate-900">Dados Básicos</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Razão Social</label>
              <input
                type="text"
                value={formData.razaoSocial}
                onChange={(e) => setFormData({ ...formData, razaoSocial: e.target.value })}
                className={inputClass}
                placeholder="Ex: Minha Empresa Teste LTDA"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">CNPJ</label>
              <input
                type="text"
                value={formData.cnpj}
                onChange={(e) => setFormData({ ...formData, cnpj: e.target.value })}
                className={inputClass}
                placeholder="00.000.000/0000-00"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Estado (UF)</label>
              <select
                value={formData.estado}
                onChange={(e) => setFormData({ ...formData, estado: e.target.value })}
                className={inputClass}
              >
                <option value="">Selecione um estado</option>
                {ESTADOS.map((uf) => (
                  <option key={uf} value={uf}>{uf}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* SEÇÃO 2: SOFTWARES UTILIZADOS */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-3 mb-6 pb-2 border-b border-slate-100">
            <Monitor className="h-5 w-5 text-teal-600" />
            <h2 className="text-lg font-semibold text-slate-900">Stack de Softwares</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {SOFTWARE_CATEGORIES.map((cat) => (
              <SoftwareCategory
                key={cat.id}
                title={cat.label}
                categoryId={cat.id}
                data={softwareData[cat.id]}
                onUpdate={(catId, newData) => setSoftwareData(prev => ({ ...prev, [catId]: newData }))}
              />
            ))}
          </div>
        </div>

        {/* SEÇÃO 3: METAS E NÚMEROS */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-3 mb-6 pb-2 border-b border-slate-100">
            <TrendingUp className="h-5 w-5 text-orange-600" />
            <h2 className="text-lg font-semibold text-slate-900">Visão de Futuro (Metas)</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
              <div className="flex items-center gap-2 mb-3 text-slate-700 font-medium">
                <Briefcase className="h-4 w-4" />
                <span>Carteira de Clientes</span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Clientes hoje</label>
                  <input
                    type="number"
                    value={formData.clientesHoje}
                    onChange={(e) => setFormData({ ...formData, clientesHoje: parseInt(e.target.value) || 0 })}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Meta em 1 ano</label>
                  <input
                    type="number"
                    value={formData.clientesAno}
                    onChange={(e) => setFormData({ ...formData, clientesAno: parseInt(e.target.value) || 0 })}
                    className={`${inputClass} border-orange-200 focus:ring-orange-500`}
                  />
                </div>
              </div>
            </div>
            <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
              <div className="flex items-center gap-2 mb-3 text-slate-700 font-medium">
                <Users className="h-4 w-4" />
                <span>Equipe</span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Funcionários hoje</label>
                  <input
                    type="number"
                    value={formData.funcionariosHoje}
                    onChange={(e) => setFormData({ ...formData, funcionariosHoje: parseInt(e.target.value) || 0 })}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Meta em 1 ano</label>
                  <input
                    type="number"
                    value={formData.funcionariosAno}
                    onChange={(e) => setFormData({ ...formData, funcionariosAno: parseInt(e.target.value) || 0 })}
                    className={`${inputClass} border-orange-200 focus:ring-orange-500`}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* SEÇÃO 4: POSICIONAMENTO E COMPROMISSO */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-3 mb-6 pb-2 border-b border-slate-100">
            <Target className="h-5 w-5 text-teal-600" />
            <h2 className="text-lg font-semibold text-slate-900">Posicionamento e Compromisso</h2>
          </div>
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Se você pudesse descrever sua empresa ideal daqui a 1 ano em uma frase, qual seria?
              </label>
              <textarea
                value={formData.visaoEmpresa}
                onChange={(e) => setFormData({ ...formData, visaoEmpresa: e.target.value })}
                rows={3}
                className={inputClass}
                placeholder="Ex: Ser referência em consultoria contábil no estado, com processos 100% automatizados..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Qual é o maior desafio que você quer ter superado ao final da mentoria?
              </label>
              <textarea
                value={formData.maiorDesafio}
                onChange={(e) => setFormData({ ...formData, maiorDesafio: e.target.value })}
                rows={3}
                className={inputClass}
                placeholder="Ex: Falta de processos bem elaborados e equipe sobrecarregada..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Seu Compromisso: O que você está disposto(a) a mudar na sua rotina para alcançar essa visão?
              </label>
              <textarea
                value={formData.compromisso}
                onChange={(e) => setFormData({ ...formData, compromisso: e.target.value })}
                rows={3}
                className={`${inputClass} border-teal-200 focus:ring-teal-600`}
                placeholder="Ex: Dedicar 2 horas por semana exclusivamente para gestão e planejamento..."
              />
            </div>
          </div>
        </div>

        {/* BOTÃO SALVAR */}
        <div className="flex justify-end pt-4 sticky bottom-4 bg-slate-50/80 backdrop-blur-sm p-4 -mx-4 rounded-b-xl">
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 px-8 py-3 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 shadow-lg shadow-teal-600/20"
          >
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
            {loading ? 'Salvando...' : 'Atualizar Visão de Futuro'}
          </button>
        </div>
      </form>
    </div>
  );
}