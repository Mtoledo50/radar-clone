// =================================================================
// INÍCIO: frontend/src/app/dashboard/minha-empresa/page.tsx
// =================================================================
/**
 * =================================================================
 * MinhaEmpresaPage — Perfil + Branding + Stack + Benchmark (A5 + C1)
 * =================================================================
 * Quatro responsabilidades (espelho do backend):
 * 1. PERFIL (CompanyProfile) — razão social, CNPJ, metas, visão.
 *    Salva via POST/PUT /company (mantido como estava).
 * 2. BRANDING (Company) — cores primária/secundária + rodapé da
 *    proposta pública. Salva via PATCH /company/branding (A5).
 * 3. STACK DE SOFTWARES (Company.softwareStack) — persiste via
 *    PATCH /company/software-stack (C1). Fonte da verdade.
 * 4. BENCHMARK DE MERCADO (C1) — exibe comparação do stack do
 *    tenant com rede + catálogo curado v1.
 *
 * 🧠 ADRs:
 *   - ADR-043: campos de cor vazios = fallback Conta Certa.
 *   - ADR-052: benchmark híbrido (rede + catálogo).
 *   - ADR-001: barras em CSS puro (zero dependências).
 * =================================================================
 */
'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import api from '@/lib/axios';
import { toast } from 'sonner';
import {
  Building2, MapPin, Monitor, TrendingUp, Save, Loader2,
  X, Plus, Target, Briefcase, Users,
  Palette,             // Sprint A5: ícone da seção de branding
  BarChart3,           // 🆕 Sprint C1: benchmark
  CheckCircle2,        // 🆕 Sprint C1: selo "Você tem"
  TrendingDown,        // 🆕 Sprint C1: selo "Sem cobertura"
  Info,                // 🆕 Sprint C1: empty state
} from 'lucide-react';

// =================================================================
// CONSTANTES
// =================================================================
const ESTADOS = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
  'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
  'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO',
];

/** Categorias de software do benchmark (formato "categoria:valor" no banco). */
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

/** Classes padrão de input (design system Conta Certa). */
const inputClass =
  'w-full px-3 py-2.5 border border-slate-300 rounded-lg text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all bg-white';

/** Regex de hex (espelho do DTO backend) p/ validar no client. */
const HEX_REGEX = /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/;

// =================================================================
// COMPONENTE AUXILIAR: Software Category
// =================================================================
function SoftwareCategory({
  title,
  categoryId,
  data,
  onUpdate,
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
    onUpdate(categoryId, { ...data, items: data.items.filter((i) => i !== itemToRemove) });
  };

  return (
    <div className="border border-slate-200 rounded-lg p-4 bg-slate-50">
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-semibold text-slate-800 text-sm">{title}</h4>
        <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer hover:text-slate-800">
          <input
            type="checkbox"
            checked={data.notUsed}
            onChange={(e) =>
              onUpdate(categoryId, {
                ...data,
                notUsed: e.target.checked,
                items: e.target.checked ? [] : data.items,
              })
            }
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
              <span
                key={idx}
                className="inline-flex items-center gap-1 px-2 py-1 bg-teal-100 text-teal-800 text-xs font-medium rounded-full"
              >
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

  // ----- Estado do PERFIL (CompanyProfile) -----
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

  // ----- 🆕 SPRINT A5: estado do BRANDING (Company) -----
  const [branding, setBranding] = useState({
    primaryColor: '',        // '' = usa fallback teal
    secondaryColor: '',      // '' = usa fallback laranja
    proposalFooterText: '',  // '' = sem rodapé customizado
  });
  const [savingBranding, setSavingBranding] = useState(false);

  // ----- Estado do STACK DE SOFTWARES -----
  const initialSoftwareState = SOFTWARE_CATEGORIES.reduce((acc, cat) => {
    acc[cat.id] = { notUsed: false, items: [] };
    return acc;
  }, {} as Record<string, { notUsed: boolean; items: string[] }>);

  const [softwareData, setSoftwareData] =
    useState<Record<string, { notUsed: boolean; items: string[] }>>(initialSoftwareState);

  // ----- 🆕 SPRINT C1: BENCHMARK DE MERCADO -----
  const [benchmark, setBenchmark] = useState<any>(null);
  const [loadingBenchmark, setLoadingBenchmark] = useState(false);
    // ----- 🆕 SPRINT C2: BENCHMARK DE SERVIÇOS EXTRAS -----
  const [extraBenchmark, setExtraBenchmark] = useState<any>(null);
  const [loadingExtraBenchmark, setLoadingExtraBenchmark] = useState(false);

  // =================================================================
  // CARREGAR DADOS (perfil + branding + stack + benchmark em paralelo)
  // =================================================================
  useEffect(() => {
    async function fetchData() {
      try {
        setFetching(true);

        // 1) Perfil (CompanyProfile) — rota já existente
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
        }

        // 2) 🆕 SPRINT A5: Branding (Company)
        const brandRes = await api.get('/company/branding').catch(() => null);
        if (brandRes?.data) {
          setBranding({
            primaryColor: brandRes.data.primaryColor === '#0d9488' ? '' : brandRes.data.primaryColor || '',
            secondaryColor: brandRes.data.secondaryColor === '#f97316' ? '' : brandRes.data.secondaryColor || '',
            proposalFooterText: brandRes.data.proposalFooterText || '',
          });
        }

        // 3) 🆕 SPRINT C1: Stack de softwares (Company.softwareStack)
        //    Esta é a FONTE DA VERDADE real dos softwares do tenant.
        const stackRes = await api.get('/company/software-stack').catch(() => null);
        if (stackRes?.data?.data && Array.isArray(stackRes.data.data)) {
          const loaded = { ...initialSoftwareState };
          stackRes.data.data.forEach((entry: string) => {
            const idx = entry.indexOf(':');
            if (idx === -1) return;
            const catId = entry.slice(0, idx);
            const value = entry.slice(idx + 1);
            if (!loaded[catId]) return;
            if (value === 'NÃO_UTILIZADO') {
              loaded[catId].notUsed = true;
              loaded[catId].items = [];
            } else if (value && !loaded[catId].items.includes(value)) {
              loaded[catId].items.push(value);
            }
          });
          setSoftwareData(loaded);
        }

        // 4) 🆕 SPRINT C1: Benchmark de mercado (rede + catálogo v1)
        const benchRes = await api.get('/company/software-benchmark').catch(() => null);
        if (benchRes?.data?.data) {
          setBenchmark(benchRes.data.data);
        }
      } catch (error) {
        console.error('Erro ao carregar dados da empresa:', error);
      } finally {
        setFetching(false);
      }
            // 5) 🆕 SPRINT C2: Benchmark de serviços extras (dinheiro na mesa)
        const extraRes = await api.get('/company/extra-services-benchmark').catch(() => null);
        if (extraRes?.data?.data) {
          setExtraBenchmark(extraRes.data.data);
        }
    }
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // =================================================================
  // SALVAR PERFIL + STACK (único botão — salva tudo de uma vez)
  // =================================================================
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Achata softwares p/ array de strings compatível com o banco
    const flattenedSoftware = Object.entries(softwareData).flatMap(([categoryId, data]) => {
      if (data.notUsed) return [`${categoryId}:NÃO_UTILIZADO`];
      return data.items.map((item) => `${categoryId}:${item}`);
    });

    const payload = { ...formData };

    try {
      // 1) Salva o perfil (CompanyProfile — metas, visão, etc.)
      let response;
      if (companyId) {
        response = await api.put(`/company/${companyId}`, payload);
      } else {
        response = await api.post('/company', payload);
        if (response.data && response.data.data) {
          setCompanyId(response.data.data.id);
        }
      }

      // 2) 🆕 SPRINT C1: salva o stack em Company.softwareStack
      //    (fonte da verdade que o benchmark e a memória da UI consomem)
      await api
        .patch('/company/software-stack', { softwareStack: flattenedSoftware })
        .catch(() => null);

        // 3) Recarrega benchmarks (stack ou catálogo podem ter mudado)
      const [benchRes, extraRes] = await Promise.all([
        api.get('/company/software-benchmark').catch(() => null),
        api.get('/company/extra-services-benchmark').catch(() => null),
      ]);
      if (benchRes?.data?.data) setBenchmark(benchRes.data.data);
      if (extraRes?.data?.data) setExtraBenchmark(extraRes.data.data);

      toast.success(response.data.message || 'Dados da empresa salvos com sucesso!');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erro ao salvar dados. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  // =================================================================
  // 🆕 SPRINT A5: SALVAR BRANDING (PATCH /company/branding — separado)
  // =================================================================
  const handleSaveBranding = async () => {
    // Validação client-side (espelho do DTO backend)
    if (branding.primaryColor && !HEX_REGEX.test(branding.primaryColor)) {
      return toast.error('Cor primária inválida. Use formato hex, ex: #0d9488');
    }
    if (branding.secondaryColor && !HEX_REGEX.test(branding.secondaryColor)) {
      return toast.error('Cor de destaque inválida. Use formato hex, ex: #f97316');
    }

    setSavingBranding(true);
    try {
      await api.patch('/company/branding', {
        primaryColor: branding.primaryColor || null,         // null = fallback
        secondaryColor: branding.secondaryColor || null,     // null = fallback
        proposalFooterText: branding.proposalFooterText?.trim() || null,
      });
      toast.success('🎨 Branding salvo! Abra uma proposta pública para ver.');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erro ao salvar branding.');
    } finally {
      setSavingBranding(false);
    }
  };

  // =================================================================
  // RENDERIZAÇÃO: LOADING
  // =================================================================
  if (fetching) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="h-12 w-12 text-teal-600 animate-spin mb-4" />
        <p className="text-slate-600 font-medium">Carregando dados da empresa...</p>
      </div>
    );
  }

  // Cores efetivas p/ preview (vazio = fallback Conta Certa)
  const previewPrimary = branding.primaryColor || '#0d9488';
  const previewSecondary = branding.secondaryColor || '#f97316';

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
                onUpdate={(catId, newData) => setSoftwareData((prev) => ({ ...prev, [catId]: newData }))}
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

        {/* ============================================================= */}
        {/* 🆕 SEÇÃO 5: BRANDING DA PROPOSTA PÚBLICA (Sprint A5)          */}
        {/* ============================================================= */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-3 mb-2 pb-2 border-b border-slate-100">
            <Palette className="h-5 w-5 text-teal-600" />
            <h2 className="text-lg font-semibold text-slate-900">🎨 Branding da Proposta Pública</h2>
          </div>
          <p className="text-xs text-slate-500 mb-6">
            Personalize as cores e o rodapé das propostas enviadas aos seus clientes.
            Deixe em branco para usar a identidade padrão Conta Certa.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Cor primária */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Cor Primária <span className="text-xs text-slate-400">(header, botões, preços)</span>
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={previewPrimary}
                  onChange={(e) => setBranding({ ...branding, primaryColor: e.target.value })}
                  className="h-11 w-16 rounded-lg border border-slate-300 cursor-pointer bg-white"
                  title="Selecionar cor primária"
                />
                <input
                  type="text"
                  value={branding.primaryColor}
                  onChange={(e) => setBranding({ ...branding, primaryColor: e.target.value })}
                  placeholder="#0d9488 (padrão)"
                  className={`${inputClass} font-mono`}
                />
                {branding.primaryColor && (
                  <span title="Restaurar padrão">
                    <button
                      type="button"
                      onClick={() => setBranding({ ...branding, primaryColor: '' })}
                      className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </span>
                )}
              </div>
              {branding.primaryColor && !HEX_REGEX.test(branding.primaryColor) && (
                <p className="text-xs text-red-600 mt-1">Hex inválido — use ex: #0d9488</p>
              )}
            </div>
            {/* Cor de destaque */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Cor de Destaque <span className="text-xs text-slate-400">(acentos, badges)</span>
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={previewSecondary}
                  onChange={(e) => setBranding({ ...branding, secondaryColor: e.target.value })}
                  className="h-11 w-16 rounded-lg border border-slate-300 cursor-pointer bg-white"
                  title="Selecionar cor de destaque"
                />
                <input
                  type="text"
                  value={branding.secondaryColor}
                  onChange={(e) => setBranding({ ...branding, secondaryColor: e.target.value })}
                  placeholder="#f97316 (padrão)"
                  className={`${inputClass} font-mono`}
                />
                {branding.secondaryColor && (
                  <span title="Restaurar padrão">
                    <button
                      type="button"
                      onClick={() => setBranding({ ...branding, secondaryColor: '' })}
                      className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </span>
                )}
              </div>
              {branding.secondaryColor && !HEX_REGEX.test(branding.secondaryColor) && (
                <p className="text-xs text-red-600 mt-1">Hex inválido — use ex: #f97316</p>
              )}
            </div>
          </div>
          {/* Rodapé customizado */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Texto do Rodapé <span className="text-xs text-slate-400">(opcional, máx. 300)</span>
            </label>
            <textarea
              value={branding.proposalFooterText}
              onChange={(e) => setBranding({ ...branding, proposalFooterText: e.target.value })}
              rows={2}
              maxLength={300}
              className={inputClass}
              placeholder="Ex: Contato: (11) 9999-9999 • contato@seuescritorio.com.br"
            />
          </div>
          {/* Preview ao vivo */}
          <div className="rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 p-4 mb-4">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">👁️ Preview ao vivo</p>
            <div className="rounded-lg p-5 text-white shadow-lg" style={{ backgroundColor: previewPrimary }}>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center font-bold text-lg">
                  {(formData.razaoSocial || 'E').charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-bold text-lg leading-tight">{formData.razaoSocial || 'Seu Escritório'}</p>
                  <p className="text-xs opacity-90">Proposta Comercial</p>
                </div>
              </div>
              <div className="bg-white/10 rounded-md p-3 text-sm">
                Investimento: <strong>R$ 1.500,00/mês</strong>
                <span className="ml-2 font-bold" style={{ color: previewSecondary }}>• 10% OFF</span>
              </div>
            </div>
            {branding.proposalFooterText && (
              <p className="text-center text-xs text-slate-500 mt-3 italic">{branding.proposalFooterText}</p>
            )}
          </div>
          {/* Salvar branding (independente do submit do perfil) */}
          <button
            type="button"
            onClick={handleSaveBranding}
            disabled={savingBranding}
            className="flex items-center gap-2 px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-lg disabled:opacity-50"
          >
            {savingBranding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {savingBranding ? 'Salvando...' : 'Salvar Branding'}
          </button>
        </div>

        {/* BOTÃO SALVAR PERFIL (+ stack) */}
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

      {/* ============================================================= */}
      {/* 🆕 SPRINT C1: BENCHMARK DE MERCADO (abaixo do form)            */}
      {/* ============================================================= */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <div className="flex items-center gap-3 mb-2 pb-2 border-b border-slate-100">
          <BarChart3 className="h-5 w-5 text-teal-600" />
          <h2 className="text-lg font-semibold text-slate-900">📊 Benchmark de Mercado</h2>
        </div>
        <p className="text-xs text-slate-500 mb-4">
          Comparação do seu stack com outros escritórios contábeis do Radar Conta Certa.
          Percentuais baseados no catálogo de mercado v1 + rede real (ADR-052).
        </p>

        {loadingBenchmark && (
          <div className="flex items-center justify-center py-8 text-slate-500">
            <Loader2 className="h-5 w-5 animate-spin mr-2" />
            Calculando benchmark...
          </div>
        )}

        {!loadingBenchmark && !benchmark && (
          <div className="text-center py-8 text-slate-400">
            <Info className="h-8 w-8 mx-auto mb-2" />
            <p className="text-sm">Nenhum dado disponível. Cadastre seus softwares acima.</p>
          </div>
        )}

        {!loadingBenchmark && benchmark && (
          <div className="space-y-5">
            {/* KPIs de coverage */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                <p className="text-xs font-semibold text-slate-500 uppercase">Amostra</p>
                <p className="text-2xl font-bold text-slate-900">{benchmark.sampleSize}</p>
                <p className="text-xs text-slate-500">escritório(s) na rede</p>
              </div>
              <div className="bg-teal-50 p-4 rounded-lg border border-teal-200">
                <p className="text-xs font-semibold text-teal-700 uppercase">Cobertura</p>
                <p className="text-2xl font-bold text-teal-900">{benchmark.coveragePct}%</p>
                <p className="text-xs text-teal-700">categorias essenciais cobertas</p>
              </div>
              <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                <p className="text-xs font-semibold text-orange-700 uppercase">Fonte</p>
                <p className="text-2xl font-bold text-orange-900 capitalize">{benchmark.source}</p>
                <p className="text-xs text-orange-700">
                  {benchmark.source === 'rede' ? 'dados reais da rede' : 'catálogo curado v1'}
                </p>
              </div>
            </div>

            {/* Cards por categoria */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {benchmark.categories
                .filter((c: any) => c.category !== 'Outros')
                .map((cat: any) => (
                <div key={cat.category} className="border border-slate-200 rounded-lg p-4 bg-slate-50">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-slate-900 text-sm">{cat.category}</h3>
                    {cat.youCovered ? (
                      <span className="inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full bg-green-100 text-green-800">
                        <CheckCircle2 className="h-3 w-3" /> Você tem
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                        <TrendingDown className="h-3 w-3" /> Sem cobertura
                      </span>
                    )}
                  </div>
                  <div className="space-y-2">
                    {cat.entries.slice(0, 5).map((e: any) => {
                      const barColor = e.youUse ? 'bg-teal-500' : 'bg-slate-300';
                      const pct = Math.max(e.marketPct, 3);
                      return (
                        <div key={e.name}>
                          <div className="flex justify-between text-xs mb-1">
                            <span className={`font-medium ${e.youUse ? 'text-teal-900' : 'text-slate-700'}`}>
                              {e.youUse && '✓ '}{e.name}
                            </span>
                            <span className="text-slate-500">{e.marketPct}% do mercado</span>
                          </div>
                          <div className="h-2 bg-white rounded-full overflow-hidden">
                            <div className={`h-full ${barColor} transition-all`} style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  {cat.recommendation && (
                    <p className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded p-2 mt-3">
                      💡 {cat.recommendation}
                    </p>
                  )}
                </div>
              ))}
            </div>

            {/* Insights finais */}
            {benchmark.insights && benchmark.insights.length > 0 && (
              <div className="bg-teal-50 border border-teal-200 rounded-lg p-4">
                <h4 className="text-sm font-bold text-teal-900 mb-2 flex items-center gap-1">
                  <TrendingUp className="h-4 w-4" /> Insights para sua diretoria
                </h4>
                <ul className="space-y-1">
                  {benchmark.insights.map((insight: string, i: number) => (
                    <li key={i} className="text-sm text-teal-900 flex items-start gap-2">
                      <span className="text-teal-600 font-bold">•</span>
                      <span>{insight}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
          {/* ============================================================= */}
      {/* 🆕 SPRINT C2: BENCHMARK DE SERVIÇOS EXTRAS (dinheiro na mesa) */}
      {/* ============================================================= */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <div className="flex items-center gap-3 mb-2 pb-2 border-b border-slate-100">
          <Briefcase className="h-5 w-5 text-orange-600" />
          <h2 className="text-lg font-semibold text-slate-900">💼 Serviços Extras — Mercado</h2>
        </div>
        <p className="text-xs text-slate-500 mb-4">
          Quanto você deixa na mesa por não oferecer os serviços extras que o mercado contábil cobra à parte?
          Cruzamento do seu catálogo com o catálogo curado v1 (ADR-053).
        </p>

        {loadingExtraBenchmark && (
          <div className="flex items-center justify-center py-8 text-slate-500">
            <Loader2 className="h-5 w-5 animate-spin mr-2" />
            Calculando...
          </div>
        )}

        {!loadingExtraBenchmark && !extraBenchmark && (
          <div className="text-center py-8 text-slate-400">
            <Info className="h-8 w-8 mx-auto mb-2" />
            <p className="text-sm">Sem dados. Cadastre serviços em "Catálogo de Serviços".</p>
          </div>
        )}

        {!loadingExtraBenchmark && extraBenchmark && (
          <div className="space-y-5">
            {/* KPIs de dinheiro na mesa */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                <p className="text-xs font-semibold text-slate-500 uppercase">Catálogo</p>
                <p className="text-2xl font-bold text-slate-900">{extraBenchmark.catalogSize}</p>
                <p className="text-xs text-slate-500">serviços no radar</p>
              </div>
              <div className="bg-teal-50 p-4 rounded-lg border border-teal-200">
                <p className="text-xs font-semibold text-teal-700 uppercase">Você oferece</p>
                <p className="text-2xl font-bold text-teal-900">{extraBenchmark.offeredCount}</p>
                <p className="text-xs text-teal-700">{extraBenchmark.coveragePct}% de cobertura</p>
              </div>
              <div className="bg-orange-50 p-4 rounded-lg border-2 border-orange-300">
                <p className="text-xs font-semibold text-orange-800 uppercase">💰 Dinheiro na Mesa</p>
                <p className="text-2xl font-bold text-orange-900">
                  R$ {extraBenchmark.potentialMonthly.toFixed(2)}
                </p>
                <p className="text-xs text-orange-700">/mês em serviços mensais não oferecidos</p>
              </div>
              <div className="bg-rose-50 p-4 rounded-lg border border-rose-200">
                <p className="text-xs font-semibold text-rose-700 uppercase">Avulsos/Hora</p>
                <p className="text-2xl font-bold text-rose-900">{extraBenchmark.notOfferedOneOff}</p>
                <p className="text-xs text-rose-700">serviços pontuais não oferecidos</p>
              </div>
            </div>

            {/* Lista de serviços (oferecidos em verde, não em laranja) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {extraBenchmark.services.map((s: any) => {
                const isOffered = s.youOffer;
                return (
                  <div
                    key={s.name}
                    className={`p-3 rounded-lg border ${
                      isOffered
                        ? 'bg-green-50 border-green-200'
                        : 'bg-orange-50 border-orange-200'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-sm text-slate-900">{s.name}</span>
                      {isOffered ? (
                        <span className="inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full bg-green-100 text-green-800">
                          <CheckCircle2 className="h-3 w-3" /> Você vende
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full bg-orange-100 text-orange-800">
                          <TrendingDown className="h-3 w-3" /> Não vende
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-600 mb-2">{s.description}</p>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500">
                        Média mercado: <strong className="text-slate-900">R$ {s.avgPrice.toFixed(2)}</strong>
                        {s.unit === 'mensal' ? '/mês' : s.unit === 'hora' ? '/hora' : ''}
                      </span>
                      {isOffered && s.yourPrice !== null && (
                        <span className="font-semibold text-teal-700">
                          Seu preço: R$ {s.yourPrice.toFixed(2)}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Insights */}
            {extraBenchmark.insights && extraBenchmark.insights.length > 0 && (
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <h4 className="text-sm font-bold text-orange-900 mb-2 flex items-center gap-1">
                  💡 Insights para sua diretoria
                </h4>
                <ul className="space-y-1">
                  {extraBenchmark.insights.map((insight: string, i: number) => (
                    <li key={i} className="text-sm text-orange-900 flex items-start gap-2">
                      <span className="text-orange-600 font-bold">•</span>
                      <span>{insight}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
// =================================================================
// FIM: frontend/src/app/dashboard/minha-empresa/page.tsx
// =================================================================