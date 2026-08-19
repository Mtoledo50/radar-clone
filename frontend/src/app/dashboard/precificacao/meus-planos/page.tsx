/**
 * Página: Meus Planos Comerciais
 * 
 * Responsabilidade: Gerenciar a estrutura de planos, multiplicadores e 
 * a associação explícita de itens de serviço.
 * 
 * REGRA DE NEGÓCIO (ADR-020):
 * - O frontend envia apenas as associações EXPLÍCITAS feitas pelo usuário.
 * - A herança de itens (planos menores -> maiores) é calculada pelo backend 
 *   no endpoint /commercial-plans/resolved.
 * - O preço final é: Valor de Referência × Multiplicador do Plano.
 */
'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/axios';
import { toast } from 'sonner';
import {
  Package, Plus, Trash2, Edit2, Save, X, Loader2, 
  Tag, FolderOpen, FileText, DollarSign,
  ChevronDown, ChevronRight // ✅ CORREÇÃO: Imports faltantes que quebrariam o build
} from 'lucide-react';

// =================================================================
// 🎨 CLASSES DE ESTILO REUTILIZÁVEIS (Design System)
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
//  TIPOS (Alinhados com o Schema Prisma)
// =================================================================
interface ServiceItem {
  id: string;
  name: string;
  description?: string;
  order: number;
  categoryId: string;
}

interface ServiceCategory {
  id: string;
  name: string;
  order: number;
  description?: string;
  items: ServiceItem[];
  _count: { items: number };
}

interface CommercialPlan {
  id: string;
  name: string;
  multiplier: number;
  order: number;
  isIndependent: boolean;
  badge?: string;
  description?: string;
  explicitItems: Array<{
    id: string;
    name: string;
    categoryId: string;
    categoryName: string;
  }>;
}

// =================================================================
// 🎯 COMPONENTE PRINCIPAL
// =================================================================
export default function MeusPlanosPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [valorReferencia, setValorReferencia] = useState<number>(2000);
  const [plans, setPlans] = useState<CommercialPlan[]>([]);
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  
  const [editingPlanId, setEditingPlanId] = useState<string | null>(null);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newItemName, setNewItemName] = useState<Record<string, string>>({});

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      // ✅ CORREÇÃO: Rota alinhada com o Controller (@Get('plans'))
      const [plansRes, categoriesRes] = await Promise.all([
        api.get('/commercial-plans/plans'),
        api.get('/commercial-plans/categories'),
      ]);
      
      const safePlans = (plansRes.data.data || []).map((p: any) => ({
        ...p,
        explicitItems: p.explicitItems || p.items || []
      }));
      
      setPlans(safePlans);
      setCategories(categoriesRes.data.data || []);
    } catch (err) {
      console.error(err);
      toast.error('Erro ao carregar dados dos planos');
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveAll() {
    setSaving(true);
    try {
      // ✅ CORREÇÃO: Rota alinhada com o Controller (@Post('bulk-update'))
      await api.post('/commercial-plans/bulk-update', { 
        valorReferencia,
        plans: plans.map(({ id, name, multiplier, order, isIndependent, explicitItems }) => ({
          id, name, multiplier, order, isIndependent, explicitItems
        }))
      });
      toast.success('Planos e valores salvos com sucesso!');
      setEditingPlanId(null);
      await loadData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Erro ao salvar planos');
    } finally {
      setSaving(false);
    }
  }

  function handleAddPlan() {
    const newPlan: CommercialPlan = {
      id: crypto.randomUUID(),
      name: `Novo Plano ${plans.length + 1}`,
      multiplier: 1.0,
      order: plans.length,
      isIndependent: false,
      explicitItems: [],
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
    if (!confirm('Tem certeza que deseja remover este plano? Esta ação não pode ser desfeita.')) return;
    try {
      if (id.length > 20) { 
        await api.delete(`/commercial-plans/plans/${id}`);
      }
      setPlans(prev => prev.filter((p) => p.id !== id));
      toast.success('Plano removido');
    } catch (err) {
      toast.error('Erro ao remover plano');
    }
  }

  function handleToggleItem(planId: string, itemId: string) {
    setPlans(prevPlans => prevPlans.map(plan => {
      if (plan.id !== planId) return plan;

      const hasItem = plan.explicitItems.some((i) => i.id === itemId);
      
      if (hasItem) {
        return { ...plan, explicitItems: plan.explicitItems.filter((i) => i.id !== itemId) };
      } else {
        const itemToAdd = categories.flatMap(c => c.items).find(i => i.id === itemId);
        const categoryOfItem = categories.find(c => c.id === itemToAdd?.categoryId);
        
        if (!itemToAdd || !categoryOfItem) return plan;

        return {
          ...plan,
          explicitItems: [
            ...plan.explicitItems,
            {
              id: itemToAdd.id,
              name: itemToAdd.name,
              categoryId: categoryOfItem.id,
              categoryName: categoryOfItem.name
            }
          ]
        };
      }
    }));
  }

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
      toast.error('Erro ao remover categoria');
    }
  }

  async function handleAddItem(categoryId: string) {
    const name = newItemName[categoryId]?.trim();
    if (!name) return;
    try {
      await api.post('/commercial-plans/items', { categoryId, name });
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
            Configure os planos, multiplicadores e o catálogo de serviços para a calculadora de propostas.
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={handleAddPlan} className={buttonSecondary}>
            <Plus className="h-4 w-4" /> Adicionar Plano
          </button>
          <button onClick={handleSaveAll} disabled={saving} className={buttonPrimary}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {saving ? 'Salvando...' : 'Salvar Alterações'}
          </button>
        </div>
      </div>

      {/* Bloco de Valor de Referência */}
      <section className="bg-gradient-to-r from-teal-50 to-white rounded-xl shadow-sm border border-teal-100 p-6">
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          <div className="flex-1">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-teal-600" />
              Valor de Referência Base
            </h2>
            <p className="text-sm text-slate-600 mt-1">
              Este é o valor base (multiplicador 1.00). Os preços dos outros planos serão calculados automaticamente.
            </p>
          </div>
          <div className="md:w-64">
            <label className="block text-xs font-semibold text-slate-600 mb-1">Valor Mensal (R$)</label>
            <input
              type="number"
              value={valorReferencia}
              onChange={(e) => setValorReferencia(parseFloat(e.target.value) || 0)}
              className={`${inputClass} text-xl font-bold text-teal-700`}
              placeholder="0.00"
              step="0.01"
            />
          </div>
        </div>
      </section>

      {/* Seção 1: Planos Comerciais */}
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
                valorReferencia={valorReferencia}
                isEditing={editingPlanId === plan.id}
                onEdit={() => setEditingPlanId(plan.id)}
                onCancelEdit={() => setEditingPlanId(null)}
                onUpdate={(field: string, value: unknown) => handleUpdatePlan(plan.id, field, value)}
                onDelete={() => handleDeletePlan(plan.id)}
                onToggleItem={(itemId: string) => handleToggleItem(plan.id, itemId)} // ✅ CORREÇÃO: Tipagem explícita
                categories={categories}
              />
            ))}
          </div>
        )}
      </section>

      {/* Seção 2: Categorias e Itens de Serviço */}
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
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

// =================================================================
//  SUB-COMPONENTE: CARD DE PLANO
// =================================================================
function PlanCard({ plan, valorReferencia, isEditing, onEdit, onCancelEdit, onUpdate, onDelete, onToggleItem, categories }: any) {
  const precoCalculado = valorReferencia * plan.multiplier;
  const percentualDiferenca = ((plan.multiplier - 1) * 100).toFixed(0);

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
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Multiplicador</label>
              <input type="number" step="0.01" value={plan.multiplier} onChange={(e) => onUpdate('multiplier', parseFloat(e.target.value) || 0)} className={inputClass} />
            </div>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" checked={plan.isIndependent} onChange={(e) => onUpdate('isIndependent', e.target.checked)} className="rounded border-slate-300 text-teal-600 focus:ring-teal-500" />
              <span className="text-slate-700"><strong>Independente</strong> (Não herda itens)</span>
            </label>
          </div>
        ) : (
          <div>
            <div className="text-3xl font-bold text-teal-700">R$ {precoCalculado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
            <div className="text-sm text-slate-500 mt-1">
              {plan.multiplier === 1 ? 'Valor Base' : plan.multiplier < 1 ? `${percentualDiferenca}% abaixo da base` : `+${percentualDiferenca}% sobre a base`}
            </div>
            <div className="text-xs text-slate-400 mt-2 pt-2 border-t border-slate-200">{plan.explicitItems.length} itens selecionados</div>
          </div>
        )}
      </div>

      {isEditing && (
        <div className="border-t border-slate-200 pt-3">
          <p className="text-xs font-semibold text-slate-600 mb-2 uppercase tracking-wide">Selecionar Itens Inclusos:</p>
          <div className="space-y-3 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
            {categories.map((category: any) => (
              <div key={category.id}>
                <p className="text-xs font-bold text-teal-700 mb-1 flex items-center gap-1"><FolderOpen className="h-3 w-3" /> {category.name}</p>
                <div className="space-y-1 pl-2 border-l-2 border-slate-100">
                  {category.items.map((item: any) => {
                    const isChecked = plan.explicitItems.some((i: any) => i.id === item.id);
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
    </div>
  );
}

// =================================================================
// 📁 SUB-COMPONENTE: CARD DE CATEGORIA
// =================================================================
function CategoryCard({ category, newItemName, onNewItemNameChange, onAddItem, onDeleteItem, onDeleteCategory }: any) {
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
    </div>
  );
}