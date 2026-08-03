/**
 * Página: Meus Planos Comerciais
 * 
 * Permite ao usuário:
 * - Criar/editar/excluir planos comerciais (START, PRIME, BLACK)
 * - Definir multiplicadores de cada plano
 * - Associar itens de serviço a cada plano
 * - Criar/editar/excluir categorias e itens de serviço
 * 
 * FLUXO DE USO:
 * 1. Usuário cria categorias (ex: "Fiscal e Tributário")
 * 2. Usuário cria itens dentro das categorias (ex: "Apuração de impostos")
 * 3. Usuário cria planos (ex: START, PRIME, BLACK) com multiplicadores
 * 4. Usuário marca quais itens cada plano inclui
 * 5. Usuário salva a configuração completa
 * 
 * @author Marcos
 */
'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/axios';
import { toast } from 'sonner';
import {
  Package,
  Plus,
  Trash2,
  Edit2,
  Save,
  X,
  Check,
  ChevronDown,
  ChevronRight,
  GripVertical,
  Loader2,
  Tag,
  FolderOpen,
  FileText,
} from 'lucide-react';

// =================================================================
// 🎨 CLASSES DE ESTILO REUTILIZÁVEIS
// =================================================================
const inputClass =
  'w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 ' +
  'placeholder:text-slate-400 focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-white';

const buttonPrimary =
  'flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 ' +
  'text-white font-semibold rounded-lg transition-colors disabled:opacity-50';

const buttonSecondary =
  'flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 ' +
  'text-slate-700 font-medium rounded-lg transition-colors';

const buttonDanger =
  'flex items-center gap-2 px-3 py-1.5 bg-red-50 hover:bg-red-100 ' +
  'text-red-600 font-medium rounded-lg transition-colors';

// =================================================================
// 📦 TIPOS
// =================================================================
interface ServiceCategory {
  id: string;
  name: string;
  icon?: string;
  order: number;
  description?: string;
  items: ServiceItem[];
  _count: { items: number };
}

interface ServiceItem {
  id: string;
  name: string;
  description?: string;
  order: number;
  categoryId: string;
}

interface CommercialPlan {
  id: string;
  name: string;
  multiplier: number;
  order: number;
  isIndependent: boolean;
  color?: string;
  badge?: string;
  description?: string;
  itemCount: number;
  items: Array<{
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
  const [plans, setPlans] = useState<CommercialPlan[]>([]);
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [editingPlanId, setEditingPlanId] = useState<string | null>(null);

  // Carrega dados iniciais
  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      const [plansRes, categoriesRes] = await Promise.all([
        api.get('/commercial-plans/plans'),
        api.get('/commercial-plans/categories'),
      ]);
      setPlans(plansRes.data.data || []);
      setCategories(categoriesRes.data.data || []);
    } catch (err) {
      toast.error('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  }

  // Salva toda a configuração de uma vez
  async function handleSaveAll() {
    setSaving(true);
    try {
      await api.post('/commercial-plans/save-configuration', { plans });
      toast.success('Planos salvos com sucesso!');
      setEditingPlanId(null);
      await loadData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Erro ao salvar planos');
    } finally {
      setSaving(false);
    }
  }

  // Adiciona um novo plano
  async function handleAddPlan() {
    const newPlan: CommercialPlan = {
      id: '', // Será criado no backend
      name: `Novo Plano ${plans.length + 1}`,
      multiplier: 1.0,
      order: plans.length,
      isIndependent: false,
      itemCount: 0,
      items: [],
    };
    setPlans([...plans, newPlan]);
    setEditingPlanId('new');
  }

  // Atualiza dados de um plano
  function handleUpdatePlan(id: string, field: string, value: any) {
    setPlans(plans.map((p) => (p.id === id || (id === 'new' && !p.id) ? { ...p, [field]: value } : p)));
  }

  // Remove um plano
  async function handleDeletePlan(id: string) {
    if (!confirm('Tem certeza que deseja remover este plano?')) return;

    try {
      if (id) {
        await api.delete(`/commercial-plans/plans/${id}`);
      }
      setPlans(plans.filter((p) => p.id !== id));
      toast.success('Plano removido');
    } catch (err) {
      toast.error('Erro ao remover plano');
    }
  }

  // Toggle: marca/desmarca item em um plano
  function handleToggleItem(planIndex: number, itemId: string) {
    const plan = plans[planIndex];
    const hasItem = plan.items.some((i) => i.id === itemId);

    const newItems = hasItem
      ? plan.items.filter((i) => i.id !== itemId)
      : [...plan.items, { id: itemId, name: '', categoryId: '', categoryName: '' }];

    const newPlans = [...plans];
    newPlans[planIndex] = { ...plan, items: newItems, itemCount: newItems.length };
    setPlans(newPlans);
  }

  // Adiciona uma nova categoria
  async function handleAddCategory() {
    const name = prompt('Nome da nova categoria:');
    if (!name) return;

    try {
      await api.post('/commercial-plans/categories', { name, order: categories.length });
      toast.success('Categoria criada');
      await loadData();
    } catch (err) {
      toast.error('Erro ao criar categoria');
    }
  }

  // Remove uma categoria
  async function handleDeleteCategory(id: string) {
    if (!confirm('Remover esta categoria e todos os seus itens?')) return;

    try {
      await api.delete(`/commercial-plans/categories/${id}`);
      toast.success('Categoria removida');
      await loadData();
    } catch (err) {
      toast.error('Erro ao remover categoria');
    }
  }

  // Adiciona um novo item a uma categoria
  async function handleAddItem(categoryId: string) {
    const name = prompt('Nome do novo item de serviço:');
    if (!name) return;

    try {
      await api.post('/commercial-plans/items', { categoryId, name });
      toast.success('Item criado');
      await loadData();
    } catch (err) {
      toast.error('Erro ao criar item');
    }
  }

  // Remove um item
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

  // =================================================================
  // 🎨 RENDERIZAÇÃO
  // =================================================================
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="h-12 w-12 text-teal-600 animate-spin mb-4" />
        <p className="text-slate-600">Carregando planos comerciais...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
            <Package className="h-8 w-8 text-teal-600" />
            Meus Planos Comerciais
          </h1>
          <p className="text-slate-600 mt-1">
            Configure os planos que aparecerão na calculadora de preço e nas propostas.
          </p>
        </div>

        <div className="flex gap-2">
          <button onClick={handleAddPlan} className={buttonSecondary}>
            <Plus className="h-4 w-4" />
            Adicionar Plano
          </button>
          <button onClick={handleSaveAll} disabled={saving} className={buttonPrimary}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {saving ? 'Salvando...' : 'Salvar Alterações'}
          </button>
        </div>
      </div>

      {/* Seção 1: Planos Comerciais */}
      <section className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
          <Tag className="h-5 w-5 text-teal-600" />
          Planos Comerciais
        </h2>

        {plans.length === 0 ? (
          <div className="text-center py-12 text-slate-500">
            <Package className="h-12 w-12 mx-auto mb-4 text-slate-300" />
            <p>Nenhum plano criado ainda.</p>
            <p className="text-sm mt-2">Clique em "Adicionar Plano" para começar.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {plans.map((plan, planIndex) => (
              <PlanCard
                key={plan.id || `new-${planIndex}`}
                plan={plan}
                index={planIndex}
                isEditing={editingPlanId === plan.id || (editingPlanId === 'new' && !plan.id)}
                onEdit={() => setEditingPlanId(plan.id || 'new')}
                onCancelEdit={() => setEditingPlanId(null)}
                onUpdate={(field, value) => handleUpdatePlan(plan.id || 'new', field, value)}
                onDelete={() => handleDeletePlan(plan.id)}
                onToggleItem={(itemId) => handleToggleItem(planIndex, itemId)}
                categories={categories}
              />
            ))}
          </div>
        )}
      </section>

      {/* Seção 2: Categorias e Itens de Serviço */}
      <section className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <FolderOpen className="h-5 w-5 text-teal-600" />
            Categorias e Itens de Serviço
          </h2>
          <button onClick={handleAddCategory} className={buttonSecondary}>
            <Plus className="h-4 w-4" />
            Nova Categoria
          </button>
        </div>

        {categories.length === 0 ? (
          <div className="text-center py-12 text-slate-500">
            <FolderOpen className="h-12 w-12 mx-auto mb-4 text-slate-300" />
            <p>Nenhuma categoria criada ainda.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {categories.map((category) => (
              <CategoryCard
                key={category.id}
                category={category}
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
//  CARD DE PLANO
// =================================================================
function PlanCard({
  plan,
  index,
  isEditing,
  onEdit,
  onCancelEdit,
  onUpdate,
  onDelete,
  onToggleItem,
  categories,
}: {
  plan: CommercialPlan;
  index: number;
  isEditing: boolean;
  onEdit: () => void;
  onCancelEdit: () => void;
  onUpdate: (field: string, value: any) => void;
  onDelete: () => void;
  onToggleItem: (itemId: string) => void;
  categories: ServiceCategory[];
}) {
  return (
    <div className="border border-slate-200 rounded-lg p-4 hover:shadow-md transition-shadow">
      {/* Header do Card */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          {isEditing ? (
            <input
              type="text"
              value={plan.name}
              onChange={(e) => onUpdate('name', e.target.value)}
              className={inputClass + ' font-bold text-lg'}
              placeholder="Nome do plano"
            />
          ) : (
            <h3 className="font-bold text-lg text-slate-900">{plan.name}</h3>
          )}
          {plan.badge && (
            <span className="inline-block mt-1 px-2 py-0.5 rounded text-xs font-bold bg-orange-100 text-orange-700">
              {plan.badge}
            </span>
          )}
        </div>

        <div className="flex gap-1">
          {isEditing ? (
            <button onClick={onCancelEdit} className="p-1.5 text-slate-400 hover:text-slate-600">
              <X className="h-4 w-4" />
            </button>
          ) : (
            <button onClick={onEdit} className="p-1.5 text-slate-400 hover:text-teal-600">
              <Edit2 className="h-4 w-4" />
            </button>
          )}
          <button onClick={onDelete} className="p-1.5 text-slate-400 hover:text-red-600">
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Campos editáveis */}
      {isEditing ? (
        <div className="space-y-3 mb-4">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Multiplicador</label>
            <input
              type="number"
              step="0.01"
              value={plan.multiplier}
              onChange={(e) => onUpdate('multiplier', parseFloat(e.target.value) || 0)}
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Badge (opcional)</label>
            <input
              type="text"
              value={plan.badge || ''}
              onChange={(e) => onUpdate('badge', e.target.value)}
              className={inputClass}
              placeholder="Ex: MAIS POPULAR"
            />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={plan.isIndependent}
              onChange={(e) => onUpdate('isIndependent', e.target.checked)}
              className="rounded border-slate-300"
            />
            <span className="text-slate-700">Independente (não herda itens)</span>
          </label>
        </div>
      ) : (
        <div className="mb-4">
          <div className="text-2xl font-bold text-teal-600">×{plan.multiplier.toFixed(2)}</div>
          <div className="text-sm text-slate-500">{plan.itemCount} itens selecionados</div>
        </div>
      )}

      {/* Lista de itens marcados */}
      {isEditing && (
        <div className="border-t border-slate-200 pt-3">
          <p className="text-xs font-semibold text-slate-600 mb-2">Itens inclusos:</p>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {categories.map((category) => (
              <div key={category.id}>
                <p className="text-xs font-medium text-slate-500 mb-1">{category.name}</p>
                {category.items.map((item) => {
                  const isChecked = plan.items.some((i) => i.id === item.id);
                  return (
                    <label
                      key={item.id}
                      className="flex items-center gap-2 text-sm hover:bg-slate-50 p-1 rounded cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => onToggleItem(item.id)}
                        className="rounded border-slate-300"
                      />
                      <span className="text-slate-700">{item.name}</span>
                    </label>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// =================================================================
// 📁 CARD DE CATEGORIA
// =================================================================
function CategoryCard({
  category,
  onAddItem,
  onDeleteItem,
  onDeleteCategory,
}: {
  category: ServiceCategory;
  onAddItem: () => void;
  onDeleteItem: (itemId: string) => void;
  onDeleteCategory: () => void;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="border border-slate-200 rounded-lg overflow-hidden">
      {/* Header da Categoria */}
      <div
        className="flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3 flex-1">
          {expanded ? <ChevronDown className="h-4 w-4 text-slate-500" /> : <ChevronRight className="h-4 w-4 text-slate-500" />}
          <FolderOpen className="h-5 w-5 text-teal-600" />
          <div>
            <h3 className="font-semibold text-slate-900">{category.name}</h3>
            <p className="text-xs text-slate-500">{category._count.items} itens</p>
          </div>
        </div>

        <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
          <button onClick={onAddItem} className="p-1.5 text-slate-400 hover:text-teal-600" title="Adicionar item">
            <Plus className="h-4 w-4" />
          </button>
          <button onClick={onDeleteCategory} className="p-1.5 text-slate-400 hover:text-red-600" title="Remover categoria">
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Lista de Itens */}
      {expanded && (
        <div className="border-t border-slate-200">
          {category.items.length === 0 ? (
            <p className="p-4 text-sm text-slate-500 text-center">Nenhum item nesta categoria</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {category.items.map((item) => (
                <li key={item.id} className="flex items-center justify-between p-3 hover:bg-slate-50">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-slate-400" />
                    <span className="text-sm text-slate-700">{item.name}</span>
                  </div>
                  <button onClick={() => onDeleteItem(item.id)} className="text-slate-400 hover:text-red-600">
                    <Trash2 className="h-4 w-4" />
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