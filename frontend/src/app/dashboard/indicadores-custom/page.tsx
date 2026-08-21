// =================================================================
// INICIO: frontend/src/app/dashboard/indicadores/page.tsx
// =================================================================
/**
 * =================================================================
 * IndicadoresPage - Sprint C3
 * =================================================================
 * Dashboard de indicadores customizados com formulas matematicas.
 *
 * Backend:
 * - GET    /company/indicators/dashboard
 * - POST   /company/indicators
 * - PUT    /company/indicators/:id
 * - DELETE /company/indicators/:id
 * - PATCH  /company/indicators/:id/favorite
 * - POST   /company/indicators/preview
 * - GET    /company/indicators/variables
 *
 * Decisao tecnica:
 * O frontend apenas envia a formula. Quem valida e calcula e o backend,
 * usando parser seguro por whitelist (ADR-054). Nao existe eval no front.
 * =================================================================
 */
'use client';

import { useEffect, useMemo, useState } from 'react';
import api from '@/lib/axios';
import { toast } from 'sonner';
import {
  BarChart3,
  Calculator,
  CheckCircle2,
  Edit3,
  Loader2,
  Plus,
  RefreshCw,
  Save,
  Star,
  Target,
  Trash2,
  X,
  AlertTriangle,
  Info,
} from 'lucide-react';

// =================================================================
// TIPOS
// =================================================================

type IndicatorCategory =
  | 'COMERCIAL'
  | 'OPERACIONAL'
  | 'FINANCEIRO'
  | 'EQUIPE'
  | 'CUSTOM';

interface EvaluatedIndicator {
  id: string;
  name: string;
  description: string | null;
  formula: string;
  target: number | null;
  unit: string;
  category: IndicatorCategory;
  color: string;
  isFavorite: boolean;
  currentValue: number | null;
  progressPct: number | null;
  error: string | null;
}

interface IndicatorFormState {
  id?: string;
  name: string;
  description: string;
  formula: string;
  target: string;
  unit: string;
  category: IndicatorCategory;
  color: string;
}

interface PreviewState {
  checking: boolean;
  valid: boolean | null;
  error: string | null;
}

// =================================================================
// CONSTANTES
// =================================================================

const inputClass =
  'w-full px-3 py-2.5 border border-slate-300 rounded-lg text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all bg-white';

const categoryLabel: Record<IndicatorCategory, string> = {
  COMERCIAL: 'Comercial',
  OPERACIONAL: 'Operacional',
  FINANCEIRO: 'Financeiro',
  EQUIPE: 'Equipe',
  CUSTOM: 'Custom',
};

const categoryOptions: IndicatorCategory[] = [
  'COMERCIAL',
  'OPERACIONAL',
  'FINANCEIRO',
  'EQUIPE',
  'CUSTOM',
];

const defaultForm: IndicatorFormState = {
  name: '',
  description: '',
  formula: '',
  target: '',
  unit: '%',
  category: 'CUSTOM',
  color: '#0d9488',
};

// =================================================================
// HELPERS
// =================================================================

function formatNumber(value: number | null, unit: string): string {
  if (value === null || Number.isNaN(value)) return '--';

  const rounded = Math.round(value * 100) / 100;

  if (unit === 'R$') {
    return rounded.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });
  }

  return `${rounded.toLocaleString('pt-BR')}${unit ? ` ${unit}` : ''}`;
}

function progressColor(progress: number | null): string {
  if (progress === null) return 'bg-slate-300';
  if (progress >= 80) return 'bg-green-500';
  if (progress >= 50) return 'bg-amber-500';
  return 'bg-red-500';
}

function progressTextColor(progress: number | null): string {
  if (progress === null) return 'text-slate-500';
  if (progress >= 80) return 'text-green-700';
  if (progress >= 50) return 'text-amber-700';
  return 'text-red-700';
}

function safeProgressWidth(progress: number | null): string {
  if (progress === null) return '0%';
  return `${Math.min(Math.max(progress, 0), 100)}%`;
}

// =================================================================
// PAGINA PRINCIPAL
// =================================================================

export default function IndicadoresPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [indicators, setIndicators] = useState<EvaluatedIndicator[]>([]);
  const [variables, setVariables] = useState<string[]>([]);

  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<IndicatorFormState>(defaultForm);

  const [preview, setPreview] = useState<PreviewState>({
    checking: false,
    valid: null,
    error: null,
  });

  // ===============================================================
  // LOAD
  // ===============================================================

  async function fetchData() {
    try {
      setLoading(true);

      const [dashboardRes, variablesRes] = await Promise.all([
        api.get('/company/indicators/dashboard').catch(() => null),
        api.get('/company/indicators/variables').catch(() => null),
      ]);

      if (dashboardRes?.data?.data) {
        setIndicators(dashboardRes.data.data);
      }

      if (variablesRes?.data?.data) {
        setVariables(variablesRes.data.data);
      }
    } catch (error: any) {
      toast.error(
        error.response?.data?.message ||
          'Erro ao carregar indicadores customizados.',
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchData();
  }, []);

  // ===============================================================
  // PREVIEW DA FORMULA
  // ===============================================================

  useEffect(() => {
    if (!modalOpen) return;

    const formula = form.formula.trim();

    if (!formula) {
      setPreview({ checking: false, valid: null, error: null });
      return;
    }

    const timeout = setTimeout(async () => {
      try {
        setPreview({ checking: true, valid: null, error: null });

        const res = await api.post('/company/indicators/preview', {
          formula,
        });

        setPreview({
          checking: false,
          valid: Boolean(res.data?.data?.valid),
          error: res.data?.data?.error || null,
        });
      } catch (error: any) {
        setPreview({
          checking: false,
          valid: false,
          error:
            error.response?.data?.message ||
            'Erro ao validar formula.',
        });
      }
    }, 350);

    return () => clearTimeout(timeout);
  }, [form.formula, modalOpen]);

  // ===============================================================
  // METRICAS DO TOPO
  // ===============================================================

  const summary = useMemo(() => {
    const total = indicators.length;
    const withError = indicators.filter((i) => i.error).length;
    const favorites = indicators.filter((i) => i.isFavorite).length;
    const withTarget = indicators.filter((i) => i.target !== null).length;

    const avgProgressItems = indicators.filter(
      (i) => i.progressPct !== null && !i.error,
    );

    const avgProgress =
      avgProgressItems.length > 0
        ? Math.round(
            avgProgressItems.reduce(
              (sum, item) => sum + (item.progressPct || 0),
              0,
            ) / avgProgressItems.length,
          )
        : null;

    return {
      total,
      withError,
      favorites,
      withTarget,
      avgProgress,
    };
  }, [indicators]);

  // ===============================================================
  // MODAL ACTIONS
  // ===============================================================

  function openCreateModal() {
    setForm(defaultForm);
    setPreview({ checking: false, valid: null, error: null });
    setModalOpen(true);
  }

  function openEditModal(indicator: EvaluatedIndicator) {
    setForm({
      id: indicator.id,
      name: indicator.name,
      description: indicator.description || '',
      formula: indicator.formula,
      target: indicator.target !== null ? String(indicator.target) : '',
      unit: indicator.unit || '%',
      category: indicator.category || 'CUSTOM',
      color: indicator.color || '#0d9488',
    });
    setPreview({ checking: false, valid: true, error: null });
    setModalOpen(true);
  }

  function closeModal() {
    if (saving) return;
    setModalOpen(false);
  }

  // ===============================================================
  // CRUD
  // ===============================================================

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!form.name.trim()) {
      toast.error('Informe o nome do indicador.');
      return;
    }

    if (!form.formula.trim()) {
      toast.error('Informe a formula do indicador.');
      return;
    }

    if (preview.valid === false) {
      toast.error(preview.error || 'Corrija a formula antes de salvar.');
      return;
    }

    const payload = {
      name: form.name.trim(),
      description: form.description.trim() || null,
      formula: form.formula.trim(),
      target: form.target.trim() ? Number(form.target) : null,
      unit: form.unit.trim() || '%',
      category: form.category,
      color: form.color || '#0d9488',
    };

    try {
      setSaving(true);

      if (form.id) {
        await api.put(`/company/indicators/${form.id}`, payload);
        toast.success('Indicador atualizado!');
      } else {
        await api.post('/company/indicators', payload);
        toast.success('Indicador criado!');
      }

      setModalOpen(false);
      await fetchData();
    } catch (error: any) {
      toast.error(
        error.response?.data?.message ||
          'Erro ao salvar indicador.',
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(indicator: EvaluatedIndicator) {
    const ok = window.confirm(
      `Remover o indicador "${indicator.name}"?`,
    );
    if (!ok) return;

    try {
      await api.delete(`/company/indicators/${indicator.id}`);
      toast.success('Indicador removido.');
      await fetchData();
    } catch (error: any) {
      toast.error(
        error.response?.data?.message ||
          'Erro ao remover indicador.',
      );
    }
  }

  async function handleToggleFavorite(indicator: EvaluatedIndicator) {
    try {
      await api.patch(`/company/indicators/${indicator.id}/favorite`);
      await fetchData();
    } catch (error: any) {
      toast.error(
        error.response?.data?.message ||
          'Erro ao favoritar indicador.',
      );
    }
  }

  // ===============================================================
  // RENDER LOADING
  // ===============================================================

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="h-12 w-12 text-teal-600 animate-spin mb-4" />
        <p className="text-slate-600 font-medium">
          Carregando indicadores...
        </p>
      </div>
    );
  }

  // ===============================================================
  // RENDER
  // ===============================================================

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-12">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2 flex items-center gap-3">
            <Calculator className="h-8 w-8 text-teal-600" />
            Indicadores Customizados
          </h1>
          <p className="text-slate-600">
            Crie KPIs proprios com formulas matematicas seguras.
          </p>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={fetchData}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-slate-300 text-slate-700 bg-white hover:bg-slate-50 font-semibold"
          >
            <RefreshCw className="h-4 w-4" />
            Atualizar
          </button>

          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-semibold shadow-lg shadow-teal-600/20"
          >
            <Plus className="h-4 w-4" />
            Novo Indicador
          </button>
        </div>
      </div>

      {/* KPIS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <p className="text-xs font-bold text-slate-500 uppercase">
            Indicadores
          </p>
          <p className="text-3xl font-bold text-slate-900 mt-1">
            {summary.total}
          </p>
          <p className="text-xs text-slate-500 mt-1">
            ativos no dashboard
          </p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <p className="text-xs font-bold text-slate-500 uppercase">
            Favoritos
          </p>
          <p className="text-3xl font-bold text-amber-600 mt-1">
            {summary.favorites}
          </p>
          <p className="text-xs text-slate-500 mt-1">
            aparecem primeiro
          </p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <p className="text-xs font-bold text-slate-500 uppercase">
            Com Meta
          </p>
          <p className="text-3xl font-bold text-teal-700 mt-1">
            {summary.withTarget}
          </p>
          <p className="text-xs text-slate-500 mt-1">
            possuem barra de progresso
          </p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <p className="text-xs font-bold text-slate-500 uppercase">
            Progresso Medio
          </p>
          <p
            className={`text-3xl font-bold mt-1 ${progressTextColor(
              summary.avgProgress,
            )}`}
          >
            {summary.avgProgress !== null ? `${summary.avgProgress}%` : '--'}
          </p>
          <p className="text-xs text-slate-500 mt-1">
            media dos indicadores com meta
          </p>
        </div>
      </div>

      {/* HELP VARIAVEIS */}
      <div className="bg-teal-50 border border-teal-200 rounded-xl p-5">
        <div className="flex items-start gap-3">
          <Info className="h-5 w-5 text-teal-700 mt-0.5" />
          <div>
            <h2 className="font-bold text-teal-950 mb-1">
              Variaveis disponiveis nas formulas
            </h2>
            <p className="text-sm text-teal-900 mb-3">
              Use apenas estas variaveis, numeros, parenteses e operadores:
              {' '}
              <strong>+ - * /</strong>
            </p>

            <div className="flex flex-wrap gap-2">
              {variables.map((v) => (
                <code
                  key={v}
                  className="px-2 py-1 rounded-md bg-white border border-teal-200 text-xs font-semibold text-teal-900"
                >
                  {v}
                </code>
              ))}
            </div>

            <p className="text-xs text-teal-800 mt-3">
              Exemplos:
              {' '}
              <code className="bg-white px-1 rounded">
                (clientesHoje / clientesAno) * 100
              </code>
              {' '}
              ou
              {' '}
              <code className="bg-white px-1 rounded">
                clientesHoje / funcionariosHoje
              </code>
            </p>
          </div>
        </div>
      </div>

      {/* EMPTY */}
      {indicators.length === 0 && (
        <div className="bg-white rounded-xl border border-dashed border-slate-300 p-10 text-center">
          <BarChart3 className="h-12 w-12 text-slate-300 mx-auto mb-3" />
          <h2 className="text-lg font-bold text-slate-900 mb-1">
            Nenhum indicador criado ainda
          </h2>
          <p className="text-slate-500 mb-5">
            Crie seu primeiro KPI customizado com uma formula simples.
          </p>
          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-semibold"
          >
            <Plus className="h-4 w-4" />
            Criar primeiro indicador
          </button>
        </div>
      )}

      {/* CARDS */}
      {indicators.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {indicators.map((indicator) => {
            const hasError = Boolean(indicator.error);
            const progress = indicator.progressPct;

            return (
              <div
                key={indicator.id}
                className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden"
              >
                <div
                  className="h-1.5"
                  style={{ backgroundColor: indicator.color || '#0d9488' }}
                />

                <div className="p-5">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-slate-900">
                          {indicator.name}
                        </h3>
                        {indicator.isFavorite && (
                          <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
                        )}
                      </div>

                      <p className="text-xs text-slate-500 mt-1">
                        {categoryLabel[indicator.category] || 'Custom'}
                      </p>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleToggleFavorite(indicator)}
                        className="p-1.5 rounded-md text-slate-400 hover:text-amber-500 hover:bg-amber-50"
                        title="Favoritar"
                      >
                        <Star
                          className={`h-4 w-4 ${
                            indicator.isFavorite
                              ? 'fill-amber-500 text-amber-500'
                              : ''
                          }`}
                        />
                      </button>

                      <button
                        type="button"
                        onClick={() => openEditModal(indicator)}
                        className="p-1.5 rounded-md text-slate-400 hover:text-teal-600 hover:bg-teal-50"
                        title="Editar"
                      >
                        <Edit3 className="h-4 w-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDelete(indicator)}
                        className="p-1.5 rounded-md text-slate-400 hover:text-red-600 hover:bg-red-50"
                        title="Excluir"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {indicator.description && (
                    <p className="text-sm text-slate-600 mb-4">
                      {indicator.description}
                    </p>
                  )}

                  <div className="bg-slate-50 rounded-lg border border-slate-200 p-4 mb-4">
                    <p className="text-xs font-bold text-slate-500 uppercase mb-1">
                      Valor atual
                    </p>

                    {hasError ? (
                      <div className="flex items-center gap-2 text-red-700">
                        <AlertTriangle className="h-5 w-5" />
                        <span className="font-semibold text-sm">
                          {indicator.error}
                        </span>
                      </div>
                    ) : (
                      <p className="text-3xl font-bold text-slate-900">
                        {formatNumber(
                          indicator.currentValue,
                          indicator.unit,
                        )}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500">
                        Formula:
                        {' '}
                        <code className="font-semibold text-slate-700">
                          {indicator.formula}
                        </code>
                      </span>
                    </div>

                    {indicator.target !== null && (
                      <>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-500">
                            Meta:
                            {' '}
                            <strong className="text-slate-900">
                              {formatNumber(
                                indicator.target,
                                indicator.unit,
                              )}
                            </strong>
                          </span>

                          <span
                            className={`font-bold ${progressTextColor(
                              progress,
                            )}`}
                          >
                            {progress !== null ? `${progress}%` : '--'}
                          </span>
                        </div>

                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${progressColor(progress)} transition-all`}
                            style={{
                              width: safeProgressWidth(progress),
                            }}
                          />
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  {form.id ? 'Editar Indicador' : 'Novo Indicador'}
                </h2>
                <p className="text-xs text-slate-500">
                  Crie uma formula usando apenas variaveis permitidas.
                </p>
              </div>

              <button
                type="button"
                onClick={closeModal}
                className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                    Nome do indicador
                  </label>
                  <input
                    className={inputClass}
                    value={form.name}
                    onChange={(e) =>
                      setForm({ ...form, name: e.target.value })
                    }
                    placeholder="Ex: % da Meta de Clientes"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                    Descricao
                  </label>
                  <input
                    className={inputClass}
                    value={form.description}
                    onChange={(e) =>
                      setForm({ ...form, description: e.target.value })
                    }
                    placeholder="Ex: Progresso em relacao a meta de 1 ano"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                    Formula
                  </label>
                  <input
                    className={inputClass}
                    value={form.formula}
                    onChange={(e) =>
                      setForm({ ...form, formula: e.target.value })
                    }
                    placeholder="Ex: (clientesHoje / clientesAno) * 100"
                  />

                  <div className="mt-2 min-h-[24px]">
                    {preview.checking && (
                      <p className="text-xs text-slate-500 flex items-center gap-1">
                        <Loader2 className="h-3 w-3 animate-spin" />
                        Validando formula...
                      </p>
                    )}

                    {!preview.checking && preview.valid === true && (
                      <p className="text-xs text-green-700 flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3" />
                        Formula valida.
                      </p>
                    )}

                    {!preview.checking && preview.valid === false && (
                      <p className="text-xs text-red-700 flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3" />
                        {preview.error || 'Formula invalida.'}
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                    Meta numerica
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    className={inputClass}
                    value={form.target}
                    onChange={(e) =>
                      setForm({ ...form, target: e.target.value })
                    }
                    placeholder="Ex: 100"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                    Unidade
                  </label>
                  <input
                    className={inputClass}
                    value={form.unit}
                    onChange={(e) =>
                      setForm({ ...form, unit: e.target.value })
                    }
                    placeholder="%, R$, un, dias"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                    Categoria
                  </label>
                  <select
                    className={inputClass}
                    value={form.category}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        category: e.target.value as IndicatorCategory,
                      })
                    }
                  >
                    {categoryOptions.map((cat) => (
                      <option key={cat} value={cat}>
                        {categoryLabel[cat]}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                    Cor do card
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={form.color}
                      onChange={(e) =>
                        setForm({ ...form, color: e.target.value })
                      }
                      className="h-11 w-16 rounded-lg border border-slate-300 bg-white"
                    />
                    <input
                      className={`${inputClass} font-mono`}
                      value={form.color}
                      onChange={(e) =>
                        setForm({ ...form, color: e.target.value })
                      }
                      placeholder="#0d9488"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                <p className="text-xs font-bold text-slate-500 uppercase mb-2">
                  Variaveis permitidas
                </p>
                <div className="flex flex-wrap gap-2">
                  {variables.map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() =>
                        setForm({
                          ...form,
                          formula: form.formula
                            ? `${form.formula} ${v}`
                            : v,
                        })
                      }
                      className="px-2 py-1 rounded-md bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:border-teal-300 hover:text-teal-700"
                    >
                      {v}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={saving}
                  className="px-5 py-2.5 rounded-lg border border-slate-300 text-slate-700 bg-white hover:bg-slate-50 font-semibold disabled:opacity-50"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={saving || preview.valid === false}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-semibold disabled:opacity-50"
                >
                  {saving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  {saving ? 'Salvando...' : 'Salvar Indicador'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
// =================================================================
// FIM: frontend/src/app/dashboard/indicadores/page.tsx
// =================================================================