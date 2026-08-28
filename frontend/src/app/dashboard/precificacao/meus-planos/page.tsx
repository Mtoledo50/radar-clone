/**
 * =================================================================
 * PÁGINA: Meus Planos Comerciais (Sprint A2 - Conta Certa 2.0)
 * =================================================================
 * Responsabilidade: Gerenciar a estrutura de planos, multiplicadores,
 * ordem de exibição e a associação explícita de itens de serviço.
 * 
 * REGRAS DE NEGÓCIO (ADRs):
 * - ADR-020: A herança de itens é calculada em memória pelo backend 
 *   (endpoint /resolved). O frontend apenas envia os 'explicitItems'.
 * - ADR-025: A ordenação dos planos é feita primeiro por 'order' (asc), 
 *   depois por 'multiplier' (asc).
 * - ADR-020 (Round2): Todos os cálculos de preço no backend usam round2 
 *   para evitar erros de ponto flutuante.
 * 
 * ARQUITETURA:
 * - Estado local gerencia a edição (formulários).
 * - Endpoint /resolved alimenta a visualização rica (herança + insights).
 * - Endpoint /bulk-update persiste apenas os dados essenciais.
 * =================================================================
 */
'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/axios';
import { toast } from 'sonner';
import {
  Package, Plus, Trash2, Edit2, Save, X, Loader2, 
  Tag, FolderOpen, FileText, DollarSign, Calculator,
  ChevronDown, ChevronRight, TrendingUp, TrendingDown, CheckCircle2, BookOpen
} from 'lucide-react';
import CompleteGuideModal from '@/components/common/CompleteGuideModal';
// =================================================================
//  CLASSES DE ESTILO REUTILIZÁVEIS (Design System)
// =================================================================
const inputClass =
  'w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 ' +
  'placeholder:text-slate-400 focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-white transition-all';

const buttonPrimary =
  'flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 ' +
  'text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed';

const buttonSecondary =
  'flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 ' +
  'text-slate-700 font-medium rounded-lg transition-colors';

// =================================================================
// 📐 TIPOS (Alinhados com os DTOs da Sprint A2)
// =================================================================

/** Item de serviço com flag de herança (retorno do /resolved) */
interface ResolvedServiceItem {
  id: string;
  name: string;
  categoryId: string;
  categoryName: string;
  isInherited: boolean;
}

/** Plano comercial enriquecido com dados resolvidos e insights */
interface ResolvedPlan {
  id: string;
  name: string;
  multiplier: number;
  order: number;
  isIndependent: boolean;
  badge?: string | null;
  description?: string | null;
  ownItems: ResolvedServiceItem[];
  inheritedItems: ResolvedServiceItem[];
  allItems: ResolvedServiceItem[];
  // Campos populados pelo endpoint /insights
  calculatedPrice?: number;
  percentVsBase?: number;
  moneyOnTable?: {
    hasLoss: boolean;
    monthlyLoss: number;
    annualLoss: number;
  };
}

/** Categoria para o CRUD do catálogo */
interface ServiceCategory {
  id: string;
  name: string;
  order: number;
  description?: string;
  items: Array<{ id: string; name: string; categoryId: string }>;
  _count: { items: number };
}

// =================================================================
// 🎯 COMPONENTE PRINCIPAL
// =================================================================
export default function MeusPlanosPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  // 🆕 ADICIONE EXATAMENTE ESTA LINHA AQUI:
  const [showCompleteGuide, setShowCompleteGuide] = useState(false); 
  // Estado para o Simulador "Dinheiro na Mesa"
  const [baseValue, setBaseValue] = useState<number>(2000);
  const [currentMonthly, setCurrentMonthly] = useState<number>(1500);
  const [insightsData, setInsightsData] = useState<ResolvedPlan[]>([]);
  const [calculating, setCalculating] = useState(false);
  
  // Estado para CRUD e Edição
  const [plans, setPlans] = useState<ResolvedPlan[]>([]);
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [editingPlanId, setEditingPlanId] = useState<string | null>(null);
  
  // Estado para criação rápida de catálogo
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newItemName, setNewItemName] = useState<Record<string, string>>({});

  // Carrega dados iniciais
  useEffect(() => {
    loadData();
  }, []);

  /**
   * Carrega os planos RESOLVIDOS (com herança) e o catálogo de categorias.
   * Usamos /resolved em vez de /plans para já alimentar a UI rica da Sprint A2.
   */
  async function loadData() {
    try {
      setLoading(true);
      const [plansRes, categoriesRes] = await Promise.all([
        api.get('/commercial-plans/resolved'),
        api.get('/commercial-plans/categories'),
      ]);
      
      setPlans(plansRes.data.data || []);
      setCategories(categoriesRes.data.data || []);
    } catch (err) {
      console.error(err);
      toast.error('Erro ao carregar dados dos planos');
    } finally {
      setLoading(false);
    }
  }

  /**
   * Calcula o "Dinheiro na Mesa" chamando o endpoint de insights.
   * Compara o Valor de Referência com o Valor Cobrado Hoje.
   */
  async function handleCalculateInsights() {
    try {
      setCalculating(true);
      const res = await api.post('/commercial-plans/insights', {
        baseValue: Number(baseValue),
        currentMonthly: Number(currentMonthly),
      });
      setInsightsData(res.data.data || []);
      toast.success('Impacto financeiro calculado com sucesso!');
    } catch (err) {
      console.error(err);
      toast.error('Erro ao calcular insights');
    } finally {
      setCalculating(false);
    }
  }

  /**
   * Salva todas as alterações em lote.
   * ⚠️ IMPORTANTE: Enviamos apenas os campos mutáveis e os 'explicitItems'.
   * Os campos de herança (inheritedItems) são ignorados, pois são recalculados 
   * pelo backend na próxima leitura (ADR-020).
   */
  async function handleSaveAll() {
    setSaving(true);
    try {
      const payload = {
        valorReferencia: baseValue,
        plans: plans.map(({ id, name, multiplier, order, isIndependent, badge, description, ownItems }) => ({
          id,
          name,
          multiplier,
          order,
          isIndependent,
          badge,
          description,
          // Mapeia os itens próprios de volta para o formato que o backend espera no bulk-update
          explicitItems: ownItems.map(item => ({ id: item.id }))
        }))
      };

      await api.post('/commercial-plans/bulk-update', payload);
      toast.success('Planos e valores salvos com sucesso!');
      setEditingPlanId(null);
      await loadData(); // Recarrega para garantir que a herança foi recalculada
      await handleCalculateInsights(); // Atualiza os insights com os novos dados
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Erro ao salvar planos');
    } finally {
      setSaving(false);
    }
  }

  // --- Funções de Manipulação de Estado Local (CRUD) ---

  function handleAddPlan() {
    const newPlan: ResolvedPlan = {
      id: crypto.randomUUID(), // ID temporário até o save
      name: `Novo Plano ${plans.length + 1}`,
      multiplier: 1.0,
      order: plans.length,
      isIndependent: false,
      badge: null,
      description: null,
      ownItems: [],
      inheritedItems: [],
      allItems: [],
    };
    setPlans([...plans, newPlan]);
    setEditingPlanId(newPlan.id);
  }

  function handleUpdatePlan(id: string, field: string, value: unknown) {
    setPlans(prev => prev.map((p) => 
      (p.id === id) ? { ...p, [field]: value } : p
    ));
  }

  async function handleDeletePlan(id: string) {
    if (!confirm('Tem certeza que deseja remover este plano? Esta ação é irreversível.')) return;
    try {
      // Só chama a API se o plano já estiver persistido no banco (ID real, não UUID temporário)
      if (id.length > 20) { 
        await api.delete(`/commercial-plans/plans/${id}`);
      }
      setPlans(prev => prev.filter((p) => p.id !== id));
      toast.success('Plano removido');
    } catch (err) {
      toast.error('Erro ao remover plano');
    }
  }

  /**
   * Alterna a seleção de um item em um plano.
   * Atualiza o array 'ownItems' localmente. O backend recalculará a herança no save.
   */
  function handleToggleItem(planId: string, itemId: string) {
    setPlans(prevPlans => prevPlans.map(plan => {
      if (plan.id !== planId) return plan;

      const hasItem = plan.ownItems.some((i) => i.id === itemId);
      
      if (hasItem) {
        return { 
          ...plan, 
          ownItems: plan.ownItems.filter((i) => i.id !== itemId),
          allItems: plan.allItems.filter((i) => i.id !== itemId) // Atualiza visualização local
        };
      } else {
        const itemToAdd = categories.flatMap(c => c.items).find(i => i.id === itemId);
        const categoryOfItem = categories.find(c => c.id === itemToAdd?.categoryId);
        
        if (!itemToAdd || !categoryOfItem) return plan;

        const newItem: ResolvedServiceItem = {
          id: itemToAdd.id,
          name: itemToAdd.name,
          categoryId: categoryOfItem.id,
          categoryName: categoryOfItem.name,
          isInherited: false
        };

        return {
          ...plan,
          ownItems: [...plan.ownItems, newItem],
          allItems: [...plan.allItems, newItem]
        };
      }
    }));
  }

  // --- Funções de CRUD do Catálogo (Categorias e Itens) ---

  async function handleAddCategory() {
    if (!newCategoryName.trim()) return;
    try {
      await api.post('/commercial-plans/categories', { 
        name: newCategoryName.trim(), 
        order: categories.length 
      });
      setNewCategoryName('');
      toast.success('Categoria criada');
      await loadData();
    } catch (err) {
      toast.error('Erro ao criar categoria');
    }
  }

  async function handleDeleteCategory(id: string) {
    if (!confirm('Remover esta categoria e TODOS os seus itens?')) return;
    try {
      await api.delete(`/commercial-plans/categories/${id}`);
      toast.success('Categoria removida');
      await loadData();
    } catch (err) {
      toast.error('Erro ao remover categoria (verifique se há itens vinculados)');
    }
  }

  async function handleAddItem(categoryId: string) {
    const name = newItemName[categoryId]?.trim();
    if (!name) return;
    try {
      await api.post('/commercial-plans/items', { categoryId, name, order: 0 });
      setNewItemName(prev => ({ ...prev, [categoryId]: '' }));
      toast.success('Item criado');
      await loadData();
    } catch (err) {
      toast.error('Erro ao criar item');
    }
  }

  async function handleDeleteItem(itemId: string) {
    if (!confirm('Remover este item de serviço?')) return;
    try {
      await api.delete(`/commercial-plans/items/${itemId}`);
      toast.success('Item removido');
      await loadData();
    } catch (err) {
      toast.error('Erro ao remover item');
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="h-12 w-12 text-teal-600 animate-spin mb-4" />
        <p className="text-slate-600">Carregando estrutura comercial...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-6 max-w-7xl mx-auto">
      {/* Cabeçalho da Página */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
            <Package className="h-8 w-8 text-teal-600" />
            Meus Planos Comerciais
          </h1>
          <p className="text-slate-600 mt-1">
            Configure os planos, multiplicadores e o catálogo. A herança de itens é calculada automaticamente.
          </p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => setShowCompleteGuide(true)} 
            className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-lg transition-colors"
          >
            <BookOpen className="h-4 w-4" />
            Ver guia completo
          </button>
          <button onClick={handleAddPlan} className={buttonSecondary}>
            <Plus className="h-4 w-4" /> Adicionar Plano
          </button>
          <button onClick={handleSaveAll} disabled={saving} className={buttonPrimary}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {saving ? 'Salvando...' : 'Salvar Alterações'}
          </button>
        </div>
      </div>

      {/* 🆕 SEÇÃO A2: Simulador "Dinheiro na Mesa" */}
      <section className="bg-gradient-to-br from-teal-50 to-orange-50 rounded-xl shadow-sm border border-teal-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Calculator className="h-5 w-5 text-teal-700" />
          <h2 className="text-lg font-bold text-teal-900">Simulador: Dinheiro na Mesa</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Valor de Referência (Base R$)
            </label>
            <input
              type="number"
              value={baseValue}
              onChange={(e) => setBaseValue(Number(e.target.value))}
              className={inputClass}
              placeholder="Ex: 2000"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Valor Cobrado Hoje (R$)
            </label>
            <input
              type="number"
              value={currentMonthly}
              onChange={(e) => setCurrentMonthly(Number(e.target.value))}
              className={inputClass}
              placeholder="Ex: 1500"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={handleCalculateInsights}
              disabled={calculating}
              className={`w-full ${buttonPrimary}`}
            >
              {calculating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Calculator className="h-4 w-4" />}
              {calculating ? 'Calculando...' : 'Calcular Impacto'}
            </button>
          </div>
        </div>

        {/* Resultados do Simulador */}
        {insightsData.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {insightsData.map((plan) => (
              <div key={plan.id} className="bg-white rounded-lg p-4 border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold text-slate-900">{plan.name}</h3>
                  {plan.isIndependent && (
                    <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-xs font-semibold rounded-full">
                      Independente
                    </span>
                  )}
                </div>
                
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-600">Preço Ideal:</span>
                    <span className="font-semibold text-slate-900">
                      R$ {plan.calculatedPrice?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">vs. Base:</span>
                    <span className={`font-semibold ${plan.percentVsBase! > 0 ? 'text-green-600' : 'text-slate-600'}`}>
                      +{plan.percentVsBase}%
                    </span>
                  </div>
                  
                  {plan.moneyOnTable && plan.moneyOnTable.hasLoss && (
                    <div className="mt-3 pt-3 border-t border-red-100">
                      <div className="flex items-center gap-1 text-red-600 mb-1">
                        <TrendingDown className="h-4 w-4" />
                        <span className="font-semibold text-xs uppercase">Perda Mensal</span>
                      </div>
                      <div className="text-xl font-bold text-red-700">
                        R$ {plan.moneyOnTable.monthlyLoss.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </div>
                      <div className="text-xs text-red-500 mt-1">
                        = R$ {plan.moneyOnTable.annualLoss.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} / ano
                      </div>
                    </div>
                  )}

                  {!plan.moneyOnTable?.hasLoss && (
                    <div className="mt-3 pt-3 border-t border-green-100">
                      <div className="flex items-center gap-1 text-green-600 mb-1">
                        <CheckCircle2 className="h-4 w-4" />
                        <span className="font-semibold text-xs uppercase">Sem Perda</span>
                      </div>
                      <p className="text-xs text-green-700">O valor cobrado está alinhado ou acima do ideal.</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* SEÇÃO 1: Planos Comerciais (Com visualização de Herança) */}
      <section className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
          <Tag className="h-5 w-5 text-teal-600" /> Estrutura de Planos
        </h2>

        {plans.length === 0 ? (
          <div className="text-center py-12 text-slate-500 border-2 border-dashed border-slate-200 rounded-lg">
            <Package className="h-12 w-12 mx-auto mb-4 text-slate-300" />
            <p className="font-medium">Nenhum plano criado ainda.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {plans.map((plan) => (
              <PlanCard
                key={plan.id}
                plan={plan}
                isEditing={editingPlanId === plan.id}
                onEdit={() => setEditingPlanId(plan.id)}
                onCancelEdit={() => setEditingPlanId(null)}
                onUpdate={(field: string, value: unknown) => handleUpdatePlan(plan.id, field, value)}
                onDelete={() => handleDeletePlan(plan.id)}
                onToggleItem={(itemId: string) => handleToggleItem(plan.id, itemId)}
                categories={categories}
              />
            ))}
          </div>
        )}
      </section>

      {/* SEÇÃO 2: Categorias e Itens de Serviço (Catálogo) */}
      <section className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <FolderOpen className="h-5 w-5 text-teal-600" /> Catálogo de Serviços
          </h2>
        </div>

        <div className="flex gap-2 mb-6">
          <input
            type="text"
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
            placeholder="Nome da nova categoria (ex: Fiscal e Tributário)"
            className={`${inputClass} max-w-md`}
            onKeyDown={(e) => e.key === 'Enter' && handleAddCategory()}
          />
          <button onClick={handleAddCategory} disabled={!newCategoryName.trim()} className={buttonPrimary}>
            <Plus className="h-4 w-4" /> Nova Categoria
          </button>
        </div>

        {categories.length > 0 && (
          <div className="space-y-4">
            {categories.map((category) => (
              <CategoryCard
                key={category.id}
                category={category}
                newItemName={newItemName[category.id] || ''}
                onNewItemNameChange={(name: string) => setNewItemName(prev => ({ ...prev, [category.id]: name }))}
                onAddItem={() => handleAddItem(category.id)}
                onDeleteItem={handleDeleteItem}
                onDeleteCategory={() => handleDeleteCategory(category.id)}
                showCompleteGuide={showCompleteGuide}
                setShowCompleteGuide={setShowCompleteGuide}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

// =================================================================
// 📦 SUB-COMPONENTE: CARD DE PLANO
// =================================================================
/**
 * Exibe os dados do plano. 
 * - Modo Edição: Permite alterar nome, multiplicador, ordem e selecionar 'ownItems'.
 * - Modo Visualização: Mostra o preço calculado e separa visualmente 'ownItems' de 'inheritedItems'.
 */
function PlanCard({ plan, isEditing, onEdit, onCancelEdit, onUpdate, onDelete, onToggleItem, categories }: any) {
  return (
    <div className={`border rounded-xl p-5 transition-all ${isEditing ? 'border-teal-500 ring-1 ring-teal-500 shadow-md' : 'border-slate-200 hover:shadow-md'}`}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          {isEditing ? (
            <input type="text" value={plan.name} onChange={(e) => onUpdate('name', e.target.value)} className={`${inputClass} font-bold text-lg mb-1`} placeholder="Nome do plano" />
          ) : (
            <h3 className="font-bold text-lg text-slate-900">{plan.name}</h3>
          )}
          
          {plan.badge && !isEditing && (
            <span className="inline-block mt-1 px-2 py-0.5 rounded text-xs font-bold bg-orange-100 text-orange-700">{plan.badge}</span>
          )}
          
          {isEditing && (
            <input type="text" value={plan.badge || ''} onChange={(e) => onUpdate('badge', e.target.value)} className={`${inputClass} text-sm mt-1`} placeholder="Badge (ex: MAIS POPULAR)" />
          )}
        </div>
        
        <div className="flex gap-1">
          {isEditing ? (
            <button onClick={onCancelEdit} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-md hover:bg-slate-100"><span title="Cancelar"><X className="h-4 w-4" /></span></button>
          ) : (
            <button onClick={onEdit} className="p-1.5 text-slate-400 hover:text-teal-600 rounded-md hover:bg-slate-100"><span title="Editar"><Edit2 className="h-4 w-4" /></span></button>
          )}
          <button onClick={onDelete} className="p-1.5 text-slate-400 hover:text-red-600 rounded-md hover:bg-slate-100"><span title="Excluir"><Trash2 className="h-4 w-4" /></span></button>
        </div>
      </div>

      <div className="mb-4 p-3 bg-slate-50 rounded-lg">
        {isEditing ? (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Multiplicador</label>
                <input type="number" step="0.01" value={plan.multiplier} onChange={(e) => onUpdate('multiplier', parseFloat(e.target.value) || 0)} className={inputClass} />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Ordem</label>
                <input type="number" step="1" value={plan.order} onChange={(e) => onUpdate('order', parseInt(e.target.value) || 0)} className={inputClass} />
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" checked={plan.isIndependent} onChange={(e) => onUpdate('isIndependent', e.target.checked)} className="rounded border-slate-300 text-teal-600 focus:ring-teal-500" />
              <span className="text-slate-700"><strong>Independente</strong> (Não herda e não doa itens)</span>
            </label>
          </div>
        ) : (
          <div>
            <div className="text-3xl font-bold text-teal-700">
              {plan.calculatedPrice ? `R$ ${plan.calculatedPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : 'N/A'}
            </div>
            {plan.percentVsBase !== undefined && (
              <div className="text-sm text-slate-500 mt-1">
                {plan.percentVsBase === 0 ? 'Valor Base' : plan.percentVsBase > 0 ? `+${plan.percentVsBase}% sobre a base` : `${plan.percentVsBase}% abaixo da base`}
              </div>
            )}
            <div className="text-xs text-slate-400 mt-2 pt-2 border-t border-slate-200 flex justify-between">
              <span>Total: {plan.allItems.length} itens</span>
              <span>({plan.ownItems.length} próprios + {plan.inheritedItems.length} herdados)</span>
            </div>
          </div>
        )}
      </div>

      {isEditing && (
        <div className="border-t border-slate-200 pt-3">
          <p className="text-xs font-semibold text-slate-600 mb-2 uppercase tracking-wide">Selecionar Itens Próprios:</p>
          <div className="space-y-3 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
            {categories.map((category: any) => (
              <div key={category.id}>
                <p className="text-xs font-bold text-teal-700 mb-1 flex items-center gap-1"><FolderOpen className="h-3 w-3" /> {category.name}</p>
                <div className="space-y-1 pl-2 border-l-2 border-slate-100">
                  {category.items.map((item: any) => {
                    const isChecked = plan.ownItems.some((i: any) => i.id === item.id);
                    return (
                      <label key={item.id} className="flex items-start gap-2 text-sm hover:bg-slate-50 p-1.5 rounded cursor-pointer transition-colors">
                        <input type="checkbox" checked={isChecked} onChange={() => onToggleItem(item.id)} className="mt-0.5 rounded border-slate-300 text-teal-600 focus:ring-teal-500" />
                        <span className="text-slate-700 leading-tight">{item.name}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {!isEditing && plan.allItems.length > 0 && (
        <div className="border-t border-slate-200 pt-3 space-y-3">
          {plan.ownItems.length > 0 && (
            <div>
              <p className="text-xs font-bold text-teal-700 mb-1 flex items-center gap-1"><CheckCircle2 className="h-3 w-3" /> Itens Próprios</p>
              <ul className="space-y-1 pl-2 border-l-2 border-teal-100">
                {plan.ownItems.map((item: any) => (
                  <li key={item.id} className="text-xs text-slate-700">• {item.name}</li>
                ))}
              </ul>
            </div>
          )}
          {plan.inheritedItems.length > 0 && (
            <div>
              <p className="text-xs font-bold text-orange-600 mb-1 flex items-center gap-1"><TrendingUp className="h-3 w-3" /> Itens Herdados</p>
              <ul className="space-y-1 pl-2 border-l-2 border-orange-100">
                {plan.inheritedItems.map((item: any) => (
                  <li key={item.id} className="text-xs text-slate-600 italic">• {item.name}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// =================================================================
// 📁 SUB-COMPONENTE: CARD DE CATEGORIA
// =================================================================
function CategoryCard({ category, newItemName, onNewItemNameChange, onAddItem, onDeleteItem, onDeleteCategory, showCompleteGuide, setShowCompleteGuide, }: any) {
  const [expanded, setExpanded] = useState(true);

  return (
    <div className="border border-slate-200 rounded-lg overflow-hidden bg-white">
      <div className="flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100 cursor-pointer transition-colors" onClick={() => setExpanded(!expanded)}>
        <div className="flex items-center gap-3 flex-1">
          {expanded ? <span title="Recolher"><ChevronDown className="h-5 w-5 text-slate-500" /></span> : <span title="Expandir"><ChevronRight className="h-5 w-5 text-slate-500" /></span>}
          <FolderOpen className="h-5 w-5 text-teal-600" />
          <div>
            <h3 className="font-semibold text-slate-900">{category.name}</h3>
            <p className="text-xs text-slate-500">{category._count.items} itens cadastrados</p>
          </div>
        </div>
        <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
          <button onClick={onDeleteCategory} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors">
            <span title="Remover categoria"><Trash2 className="h-4 w-4" /></span>
          </button>
        </div>
      </div>

      {expanded && (
        <div className="border-t border-slate-200 bg-white">
          <div className="p-3 bg-slate-50 border-b border-slate-100 flex gap-2">
            <input type="text" value={newItemName} onChange={(e) => onNewItemNameChange(e.target.value)} placeholder="Nome do novo serviço..." className={`${inputClass} text-sm py-1.5`} onKeyDown={(e) => e.key === 'Enter' && onAddItem()} />
            <button onClick={onAddItem} disabled={!newItemName.trim()} className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white text-sm font-medium rounded-md transition-colors disabled:opacity-50">Adicionar</button>
          </div>

          {category.items.length === 0 ? (
            <p className="p-6 text-sm text-slate-500 text-center italic">Nenhum item nesta categoria. Adicione um acima.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {category.items.map((item: any) => (
                <li key={item.id} className="flex items-center justify-between p-3 hover:bg-slate-50 transition-colors group">
                  <div className="flex items-center gap-3">
                    <FileText className="h-4 w-4 text-slate-400" />
                    <span className="text-sm text-slate-700">{item.name}</span>
                  </div>
                  <button onClick={() => onDeleteItem(item.id)} className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-all">
                    <span title="Remover item"><Trash2 className="h-4 w-4" /></span>
                  </button>
                </li>
              ))}
            </ul>
            
          )}
        </div>
      )}
      {showCompleteGuide && (
  <CompleteGuideModal
    pathname="/dashboard/precificacao/meus-planos"
    onClose={() => setShowCompleteGuide(false)}
  />
)}
    </div>
  );
}