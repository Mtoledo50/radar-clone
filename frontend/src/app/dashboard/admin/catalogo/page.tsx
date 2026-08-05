// =================================================================
// INÍCIO: frontend/src/app/dashboard/admin/catalogo/page.tsx
// =================================================================
// 🛠️ ADMIN: CATÁLOGO DE SERVIÇOS (Enterprise Edition)
// Painel completo para gerenciar Categorias, Serviços e Planos
// Comerciais. Consome a API /commercial-plans refatorada.
// =================================================================
'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/axios';
import { toast } from 'sonner';
import {
  Settings, Plus, Edit2, Trash2, X, Save, Loader2,
  Folder, Package, Crown, Search, Link2, AlertTriangle,
  FileText, DollarSign, Clock, Tag
} from 'lucide-react';

// =================================================================
// 📋 TIPOS E INTERFACES
// =================================================================

interface ServiceCategory {
  id: string;
  name: string;
  icon?: string;
  order: number;
  description?: string;
  _count?: { items: number };
  items?: ServiceItem[];
}

interface ServiceItem {
  id: string;
  categoryId: string;
  name: string;
  description?: string;
  scope?: string;
  outOfScope?: string;
  requiredDocs?: string;
  basePrice: number;
  estimatedHours?: number;
  slaDays?: number;
  recurrence: string;
  order: number;
  isActive: boolean;
  category?: ServiceCategory;
}

interface CommercialPlan {
  id: string;
  name: string;
  multiplier: number;
  order: number;
  isIndependent: boolean;
  badge?: string;
  color?: string;
  description?: string;
  itemCount?: number;
  items?: { id: string; name: string; categoryName: string }[];
}

// =================================================================
// 🎨 CONFIGURAÇÕES VISUAIS
// =================================================================

const RECURRENCE_CONFIG: Record<string, { label: string; color: string }> = {
  AVULSO: { label: 'Avulso', color: 'bg-orange-100 text-orange-700' },
  MENSAL: { label: 'Mensal', color: 'bg-blue-100 text-blue-700' },
  TRIMESTRAL: { label: 'Trimestral', color: 'bg-purple-100 text-purple-700' },
  ANUAL: { label: 'Anual', color: 'bg-green-100 text-green-700' },
};

const ICON_OPTIONS = ['Folder', 'Package', 'Crown', 'FileText', 'DollarSign', 'Clock', 'Tag', 'Settings'];

// =================================================================
// 🎯 COMPONENTE PRINCIPAL
// =================================================================
export default function CatalogoAdminPage() {
  // =================================================================
  // ESTADOS GLOBAIS
  // =================================================================
  const [activeTab, setActiveTab] = useState<'categories' | 'items' | 'plans'>('categories');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Dados
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [items, setItems] = useState<ServiceItem[]>([]);
  const [plans, setPlans] = useState<CommercialPlan[]>([]);

  // Filtros
  const [filterCategoryId, setFilterCategoryId] = useState('all');

  // Modais
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showItemModal, setShowItemModal] = useState(false);
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [showVinculoModal, setShowVinculoModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Entidades selecionadas
  const [editingCategory, setEditingCategory] = useState<ServiceCategory | null>(null);
  const [editingItem, setEditingItem] = useState<ServiceItem | null>(null);
  const [editingPlan, setEditingPlan] = useState<CommercialPlan | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ type: string; id: string; name: string } | null>(null);

  // Formulários
  const [categoryForm, setCategoryForm] = useState({ name: '', icon: 'Folder', order: 0, description: '' });
  const [itemForm, setItemForm] = useState({
    categoryId: '', name: '', description: '', scope: '', outOfScope: '',
    requiredDocs: '', basePrice: 0, estimatedHours: 0, slaDays: 5,
    recurrence: 'MENSAL', order: 0, isActive: true,
  });
  const [planForm, setPlanForm] = useState({
    name: '', multiplier: 1.0, order: 0, isIndependent: false,
    badge: '', color: '#0d9488', description: '',
  });
  const [vinculoPlanId, setVinculoPlanId] = useState<string>('');
  const [vinculoItemIds, setVinculoItemIds] = useState<string[]>([]);

  // =================================================================
  // ESTILOS (Design System Conta Certa)
  // =================================================================
  const inputClass = 'w-full px-3 py-2.5 border border-slate-300 rounded-lg text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all bg-white';
  const btnPrimary = 'flex items-center justify-center gap-2 px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-lg transition-colors shadow-sm disabled:opacity-50';
  const btnSecondary = 'flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold rounded-lg transition-colors';
  const btnDanger = 'flex items-center justify-center gap-2 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg';

  // =================================================================
  // CARREGAR DADOS (Paralelo para performance)
  // =================================================================
  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      const [catRes, itemRes, planRes] = await Promise.all([
        api.get('/commercial-plans/categories'),
        api.get('/commercial-plans/items'),
        api.get('/commercial-plans/plans'),
      ]);
      setCategories(catRes.data.data || []);
      setItems(itemRes.data.data || []);
      setPlans(planRes.data.data || []);
    } catch (err) {
      toast.error('Erro ao carregar catálogo');
    } finally {
      setLoading(false);
    }
  }

  // =================================================================
  // 🔍 FILTRAGEM DE SERVIÇOS POR CATEGORIA
  // =================================================================
  const filteredItems = filterCategoryId === 'all'
    ? items
    : items.filter(i => i.categoryId === filterCategoryId);

  // =================================================================
  // HANDLERS: CATEGORIAS
  // =================================================================
  function openCategoryModal(category?: ServiceCategory) {
    if (category) {
      setEditingCategory(category);
      setCategoryForm({
        name: category.name,
        icon: category.icon || 'Folder',
        order: category.order,
        description: category.description || '',
      });
    } else {
      setEditingCategory(null);
      setCategoryForm({ name: '', icon: 'Folder', order: categories.length + 1, description: '' });
    }
    setShowCategoryModal(true);
  }

  async function handleSaveCategory() {
    if (!categoryForm.name.trim()) {
      toast.error('Informe o nome da categoria');
      return;
    }
    setSubmitting(true);
    try {
      if (editingCategory) {
        await api.put(`/commercial-plans/categories/${editingCategory.id}`, categoryForm);
        toast.success('Categoria atualizada!');
      } else {
        await api.post('/commercial-plans/categories', categoryForm);
        toast.success('Categoria criada!');
      }
      setShowCategoryModal(false);
      loadData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Erro ao salvar categoria');
    } finally {
      setSubmitting(false);
    }
  }

  // =================================================================
  // HANDLERS: SERVIÇOS
  // =================================================================
  function openItemModal(item?: ServiceItem) {
    if (item) {
      setEditingItem(item);
      setItemForm({
        categoryId: item.categoryId,
        name: item.name,
        description: item.description || '',
        scope: item.scope || '',
        outOfScope: item.outOfScope || '',
        requiredDocs: item.requiredDocs || '',
        basePrice: Number(item.basePrice),
        estimatedHours: item.estimatedHours || 0,
        slaDays: item.slaDays || 5,
        recurrence: item.recurrence,
        order: item.order,
        isActive: item.isActive,
      });
    } else {
      setEditingItem(null);
      setItemForm({
        categoryId: categories[0]?.id || '',
        name: '', description: '', scope: '', outOfScope: '',
        requiredDocs: '', basePrice: 0, estimatedHours: 0, slaDays: 5,
        recurrence: 'MENSAL', order: items.length + 1, isActive: true,
      });
    }
    setShowItemModal(true);
  }

  async function handleSaveItem() {
    if (!itemForm.name.trim() || !itemForm.categoryId) {
      toast.error('Preencha nome e categoria');
      return;
    }
    setSubmitting(true);
    try {
      if (editingItem) {
        await api.put(`/commercial-plans/items/${editingItem.id}`, itemForm);
        toast.success('Serviço atualizado!');
      } else {
        await api.post('/commercial-plans/items', itemForm);
        toast.success('Serviço criado!');
      }
      setShowItemModal(false);
      loadData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Erro ao salvar serviço');
    } finally {
      setSubmitting(false);
    }
  }

  // =================================================================
  // HANDLERS: PLANOS
  // =================================================================
  function openPlanModal(plan?: CommercialPlan) {
    if (plan) {
      setEditingPlan(plan);
      setPlanForm({
        name: plan.name,
        multiplier: plan.multiplier,
        order: plan.order,
        isIndependent: plan.isIndependent,
        badge: plan.badge || '',
        color: plan.color || '#0d9488',
        description: plan.description || '',
      });
    } else {
      setEditingPlan(null);
      setPlanForm({
        name: '', multiplier: 1.0, order: plans.length + 1,
        isIndependent: false, badge: '', color: '#0d9488', description: '',
      });
    }
    setShowPlanModal(true);
  }

  async function handleSavePlan() {
    if (!planForm.name.trim()) {
      toast.error('Informe o nome do plano');
      return;
    }
    setSubmitting(true);
    try {
      if (editingPlan) {
        await api.put(`/commercial-plans/plans/${editingPlan.id}`, planForm);
        toast.success('Plano atualizado!');
      } else {
        await api.post('/commercial-plans/plans', planForm);
        toast.success('Plano criado!');
      }
      setShowPlanModal(false);
      loadData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Erro ao salvar plano');
    } finally {
      setSubmitting(false);
    }
  }

  // =================================================================
  // HANDLERS: VINCULAÇÃO PLANO × SERVIÇOS
  // =================================================================
  function openVinculoModal(plan: CommercialPlan) {
    setVinculoPlanId(plan.id);
    setVinculoItemIds(plan.items?.map(i => i.id) || []);
    setShowVinculoModal(true);
  }

  function toggleVinculoItem(itemId: string) {
    setVinculoItemIds(prev =>
      prev.includes(itemId)
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  }

  async function handleSaveVinculo() {
    setSubmitting(true);
    try {
      await api.put(`/commercial-plans/plans/${vinculoPlanId}`, { itemIds: vinculoItemIds });
      toast.success('Vinculação salva!');
      setShowVinculoModal(false);
      loadData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Erro ao salvar vinculação');
    } finally {
      setSubmitting(false);
    }
  }

  // =================================================================
  // HANDLERS: DELETE (Soft Delete com confirmação)
  // =================================================================
  function openDeleteModal(type: 'category' | 'item' | 'plan', id: string, name: string) {
    setDeleteTarget({ type, id, name });
    setShowDeleteModal(true);
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setSubmitting(true);
    try {
      const endpoints: Record<string, string> = {
        category: `/commercial-plans/categories/${deleteTarget.id}`,
        item: `/commercial-plans/items/${deleteTarget.id}`,
        plan: `/commercial-plans/plans/${deleteTarget.id}`,
      };
      await api.delete(endpoints[deleteTarget.type]);
      toast.success('Removido com sucesso!');
      setShowDeleteModal(false);
      setDeleteTarget(null);
      loadData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Erro ao remover');
    } finally {
      setSubmitting(false);
    }
  }

  // =================================================================
  // RENDERIZAÇÃO: LOADING
  // =================================================================
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-12 w-12 text-teal-600 animate-spin" />
      </div>
    );
  }

  // =================================================================
  // RENDERIZAÇÃO: PÁGINA PRINCIPAL
  // =================================================================
  return (
    <div className="space-y-6">
      {/* CABEÇALHO */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
            <Settings className="h-8 w-8 text-teal-600" />
            Catálogo de Serviços
          </h1>
          <p className="text-slate-600 mt-1">Gerencie categorias, serviços e planos comerciais</p>
        </div>
      </div>

      {/* TABS */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="flex border-b border-slate-200">
          {[
            { key: 'categories', label: 'Categorias', icon: Folder, count: categories.length },
            { key: 'items', label: 'Serviços', icon: Package, count: items.length },
            { key: 'plans', label: 'Planos', icon: Crown, count: plans.length },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`flex items-center gap-2 px-6 py-4 text-sm font-semibold border-b-2 transition-colors ${
                activeTab === tab.key
                  ? 'border-teal-600 text-teal-600 bg-teal-50'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
              <span className="px-2 py-0.5 rounded-full text-xs bg-slate-100">{tab.count}</span>
            </button>
          ))}
        </div>

        <div className="p-6">
          {/* ============================================================= */}
          {/* ABA 1: CATEGORIAS */}
          {/* ============================================================= */}
          {activeTab === 'categories' && (
            <div className="space-y-4">
              <div className="flex justify-end">
                <button onClick={() => openCategoryModal()} className={btnPrimary}>
                  <Plus className="h-4 w-4" /> Nova Categoria
                </button>
              </div>

              {categories.length === 0 ? (
                <div className="text-center py-12 text-slate-500">
                  <Folder className="h-12 w-12 mx-auto mb-3 text-slate-300" />
                  <p className="text-lg font-medium">Nenhuma categoria criada</p>
                  <p className="text-sm mt-1">Crie sua primeira categoria para começar</p>
                </div>
              ) : (
                <table className="w-full">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="text-left px-4 py-3 text-xs font-bold text-slate-600 uppercase">Nome</th>
                      <th className="text-left px-4 py-3 text-xs font-bold text-slate-600 uppercase">Descrição</th>
                      <th className="text-center px-4 py-3 text-xs font-bold text-slate-600 uppercase">Ordem</th>
                      <th className="text-center px-4 py-3 text-xs font-bold text-slate-600 uppercase">Serviços</th>
                      <th className="text-right px-4 py-3 text-xs font-bold text-slate-600 uppercase">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {categories.map(cat => (
                      <tr key={cat.id} className="hover:bg-slate-50">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <Folder className="h-4 w-4 text-teal-600" />
                            <span className="font-semibold text-slate-900">{cat.name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-600">{cat.description || '-'}</td>
                        <td className="px-4 py-3 text-center text-slate-700">{cat.order}</td>
                        <td className="px-4 py-3 text-center">
                          <span className="px-2 py-1 rounded-full text-xs font-semibold bg-teal-100 text-teal-700">
                            {cat._count?.items || 0}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex justify-end gap-2">
                            <button onClick={() => openCategoryModal(cat)} className="p-2 text-slate-500 hover:text-teal-600 hover:bg-teal-50 rounded-lg">
                              <Edit2 className="h-4 w-4" />
                            </button>
                            <button onClick={() => openDeleteModal('category', cat.id, cat.name)} className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg">
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {/* ============================================================= */}
          {/* ABA 2: SERVIÇOS */}
          {/* ============================================================= */}
          {activeTab === 'items' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-4">
                <select
                  value={filterCategoryId}
                  onChange={(e) => setFilterCategoryId(e.target.value)}
                  className="px-3 py-2 border border-slate-300 rounded-lg text-sm"
                >
                  <option value="all">Todas as categorias</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
                <button onClick={() => openItemModal()} className={btnPrimary}>
                  <Plus className="h-4 w-4" /> Novo Serviço
                </button>
              </div>

              {filteredItems.length === 0 ? (
                <div className="text-center py-12 text-slate-500">
                  <Package className="h-12 w-12 mx-auto mb-3 text-slate-300" />
                  <p className="text-lg font-medium">Nenhum serviço encontrado</p>
                  <p className="text-sm mt-1">Crie um novo serviço ou ajuste o filtro</p>
                </div>
              ) : (
                <table className="w-full">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="text-left px-4 py-3 text-xs font-bold text-slate-600 uppercase">Serviço</th>
                      <th className="text-left px-4 py-3 text-xs font-bold text-slate-600 uppercase">Categoria</th>
                      <th className="text-right px-4 py-3 text-xs font-bold text-slate-600 uppercase">Preço</th>
                      <th className="text-center px-4 py-3 text-xs font-bold text-slate-600 uppercase">Recorrência</th>
                      <th className="text-center px-4 py-3 text-xs font-bold text-slate-600 uppercase">SLA</th>
                      <th className="text-center px-4 py-3 text-xs font-bold text-slate-600 uppercase">Status</th>
                      <th className="text-right px-4 py-3 text-xs font-bold text-slate-600 uppercase">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {filteredItems.map(item => {
                      const rec = RECURRENCE_CONFIG[item.recurrence] || RECURRENCE_CONFIG.MENSAL;
                      return (
                        <tr key={item.id} className="hover:bg-slate-50">
                          <td className="px-4 py-3">
                            <div className="font-semibold text-slate-900">{item.name}</div>
                            {item.description && <div className="text-xs text-slate-500 mt-0.5">{item.description}</div>}
                          </td>
                          <td className="px-4 py-3 text-sm text-slate-600">{item.category?.name || '-'}</td>
                          <td className="px-4 py-3 text-right font-semibold text-slate-900">
                            R$ {Number(item.basePrice).toFixed(2)}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${rec.color}`}>
                              {rec.label}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center text-sm text-slate-600">{item.slaDays}d</td>
                          <td className="px-4 py-3 text-center">
                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                              item.isActive ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'
                            }`}>
                              {item.isActive ? 'Ativo' : 'Inativo'}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex justify-end gap-2">
                              <button onClick={() => openItemModal(item)} className="p-2 text-slate-500 hover:text-teal-600 hover:bg-teal-50 rounded-lg">
                                <Edit2 className="h-4 w-4" />
                              </button>
                              <button onClick={() => openDeleteModal('item', item.id, item.name)} className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg">
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {/* ============================================================= */}
          {/* ABA 3: PLANOS */}
          {/* ============================================================= */}
          {activeTab === 'plans' && (
            <div className="space-y-4">
              <div className="flex justify-end">
                <button onClick={() => openPlanModal()} className={btnPrimary}>
                  <Plus className="h-4 w-4" /> Novo Plano
                </button>
              </div>

              {plans.length === 0 ? (
                <div className="text-center py-12 text-slate-500">
                  <Crown className="h-12 w-12 mx-auto mb-3 text-slate-300" />
                  <p className="text-lg font-medium">Nenhum plano criado</p>
                  <p className="text-sm mt-1">Crie planos comerciais para vender aos clientes</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {plans.map(plan => (
                    <div key={plan.id} className="border border-slate-200 rounded-xl p-5 hover:shadow-md transition-shadow">
                      <div className="flex items-center justify-between mb-3">
                        {plan.badge && (
                          <span className="px-2 py-1 rounded text-xs font-bold uppercase text-white" style={{ backgroundColor: plan.color || '#64748b' }}>
                            {plan.badge}
                          </span>
                        )}
                        <div className="flex gap-1">
                          <button onClick={() => openVinculoModal(plan)} className="p-1.5 text-slate-500 hover:text-purple-600 hover:bg-purple-50 rounded" title="Vincular serviços">
                            <Link2 className="h-4 w-4" />
                          </button>
                          <button onClick={() => openPlanModal(plan)} className="p-1.5 text-slate-500 hover:text-teal-600 hover:bg-teal-50 rounded" title="Editar">
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button onClick={() => openDeleteModal('plan', plan.id, plan.name)} className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded" title="Excluir">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                      <h3 className="text-xl font-bold text-slate-900">{plan.name}</h3>
                      <p className="text-sm text-slate-500 mt-1 mb-3">{plan.description || 'Sem descrição'}</p>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-600">Multiplicador: <strong>{plan.multiplier}x</strong></span>
                        <span className="px-2 py-1 rounded-full text-xs font-semibold bg-teal-100 text-teal-700">
                          {plan.itemCount || 0} serviços
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ============================================================= */}
      {/* MODAL: CATEGORIA */}
      {/* ============================================================= */}
      {showCategoryModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-slate-200">
              <h2 className="text-xl font-bold text-slate-900">
                {editingCategory ? 'Editar Categoria' : 'Nova Categoria'}
              </h2>
              <button onClick={() => setShowCategoryModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Nome *</label>
                <input type="text" value={categoryForm.name} onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })} className={inputClass} placeholder="Ex: MEI, IRPF, Fiscal" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Ícone</label>
                <select value={categoryForm.icon} onChange={(e) => setCategoryForm({ ...categoryForm, icon: e.target.value })} className={inputClass}>
                  {ICON_OPTIONS.map(icon => <option key={icon} value={icon}>{icon}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Ordem</label>
                <input type="number" value={categoryForm.order} onChange={(e) => setCategoryForm({ ...categoryForm, order: parseInt(e.target.value) || 0 })} className={inputClass} />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Descrição</label>
                <textarea value={categoryForm.description} onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })} rows={3} className={inputClass} />
              </div>
            </div>
            <div className="flex justify-end gap-3 p-6 border-t border-slate-200">
              <button onClick={() => setShowCategoryModal(false)} className={btnSecondary}>Cancelar</button>
              <button onClick={handleSaveCategory} disabled={submitting} className={btnPrimary}>
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================= */}
      {/* MODAL: SERVIÇO (Rico com escopo) */}
      {/* ============================================================= */}
      {showItemModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-slate-200 sticky top-0 bg-white z-10">
              <h2 className="text-xl font-bold text-slate-900">
                {editingItem ? 'Editar Serviço' : 'Novo Serviço'}
              </h2>
              <button onClick={() => setShowItemModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Nome *</label>
                  <input type="text" value={itemForm.name} onChange={(e) => setItemForm({ ...itemForm, name: e.target.value })} className={inputClass} placeholder="Ex: IRPF Completo" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Categoria *</label>
                  <select value={itemForm.categoryId} onChange={(e) => setItemForm({ ...itemForm, categoryId: e.target.value })} className={inputClass}>
                    <option value="">Selecione...</option>
                    {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Recorrência *</label>
                  <select value={itemForm.recurrence} onChange={(e) => setItemForm({ ...itemForm, recurrence: e.target.value })} className={inputClass}>
                    {Object.entries(RECURRENCE_CONFIG).map(([key, cfg]) => (
                      <option key={key} value={key}>{cfg.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Preço Base (R$) *</label>
                  <input type="number" step="0.01" value={itemForm.basePrice} onChange={(e) => setItemForm({ ...itemForm, basePrice: parseFloat(e.target.value) || 0 })} className={inputClass} />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Horas Estimadas</label>
                  <input type="number" step="0.5" value={itemForm.estimatedHours} onChange={(e) => setItemForm({ ...itemForm, estimatedHours: parseFloat(e.target.value) || 0 })} className={inputClass} />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">SLA (dias)</label>
                  <input type="number" value={itemForm.slaDays} onChange={(e) => setItemForm({ ...itemForm, slaDays: parseInt(e.target.value) || 5 })} className={inputClass} />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Ordem</label>
                  <input type="number" value={itemForm.order} onChange={(e) => setItemForm({ ...itemForm, order: parseInt(e.target.value) || 0 })} className={inputClass} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Descrição Curta</label>
                <input type="text" value={itemForm.description} onChange={(e) => setItemForm({ ...itemForm, description: e.target.value })} className={inputClass} />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">📋 Escopo (o que está incluso)</label>
                <textarea value={itemForm.scope} onChange={(e) => setItemForm({ ...itemForm, scope: e.target.value })} rows={3} className={inputClass} placeholder="Ex: Análise de documentos, transmissão, acompanhamento..." />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">🚫 Fora do Escopo (cobração extra)</label>
                <textarea value={itemForm.outOfScope} onChange={(e) => setItemForm({ ...itemForm, outOfScope: e.target.value })} rows={2} className={inputClass} placeholder="Ex: Retificações por omissão de documentos..." />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">📄 Documentos Necessários</label>
                <textarea value={itemForm.requiredDocs} onChange={(e) => setItemForm({ ...itemForm, requiredDocs: e.target.value })} rows={2} className={inputClass} placeholder="Ex: Informes de rendimentos, recibos médicos..." />
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="isActive" checked={itemForm.isActive} onChange={(e) => setItemForm({ ...itemForm, isActive: e.target.checked })} className="h-4 w-4 text-teal-600 rounded" />
                <label htmlFor="isActive" className="text-sm font-semibold text-slate-700">Serviço ativo (disponível para venda)</label>
              </div>
            </div>
            <div className="flex justify-end gap-3 p-6 border-t border-slate-200">
              <button onClick={() => setShowItemModal(false)} className={btnSecondary}>Cancelar</button>
              <button onClick={handleSaveItem} disabled={submitting} className={btnPrimary}>
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Salvar Serviço
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================= */}
      {/* MODAL: PLANO */}
      {/* ============================================================= */}
      {showPlanModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-slate-200">
              <h2 className="text-xl font-bold text-slate-900">
                {editingPlan ? 'Editar Plano' : 'Novo Plano'}
              </h2>
              <button onClick={() => setShowPlanModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Nome *</label>
                <input type="text" value={planForm.name} onChange={(e) => setPlanForm({ ...planForm, name: e.target.value })} className={inputClass} placeholder="Ex: START, PRIME, BLACK" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Multiplicador *</label>
                <input type="number" step="0.05" value={planForm.multiplier} onChange={(e) => setPlanForm({ ...planForm, multiplier: parseFloat(e.target.value) || 1 })} className={inputClass} />
                <p className="text-xs text-slate-500 mt-1">O preço final = Valor Base × Multiplicador</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Badge</label>
                  <input type="text" value={planForm.badge} onChange={(e) => setPlanForm({ ...planForm, badge: e.target.value })} className={inputClass} placeholder="Ex: MAIS POPULAR" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Cor</label>
                  <input type="color" value={planForm.color} onChange={(e) => setPlanForm({ ...planForm, color: e.target.value })} className="w-full h-11 rounded-lg border border-slate-300" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Descrição</label>
                <textarea value={planForm.description} onChange={(e) => setPlanForm({ ...planForm, description: e.target.value })} rows={3} className={inputClass} />
              </div>
            </div>
            <div className="flex justify-end gap-3 p-6 border-t border-slate-200">
              <button onClick={() => setShowPlanModal(false)} className={btnSecondary}>Cancelar</button>
              <button onClick={handleSavePlan} disabled={submitting} className={btnPrimary}>
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Salvar Plano
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================= */}
      {/* MODAL: VINCULAÇÃO PLANO × SERVIÇOS */}
      {/* ============================================================= */}
      {showVinculoModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-slate-200 sticky top-0 bg-white z-10">
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <Link2 className="h-5 w-5 text-purple-600" /> Vincular Serviços ao Plano
              </h2>
              <button onClick={() => setShowVinculoModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="p-6">
              <p className="text-sm text-slate-600 mb-4">
                Selecione os serviços que fazem parte deste plano. <strong>{vinculoItemIds.length}</strong> selecionado(s).
              </p>
              {categories.map(cat => {
                const catItems = items.filter(i => i.categoryId === cat.id);
                if (catItems.length === 0) return null;
                return (
                  <div key={cat.id} className="mb-4">
                    <h3 className="text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
                      <Folder className="h-4 w-4 text-teal-600" /> {cat.name}
                    </h3>
                    <div className="space-y-1 pl-4">
                      {catItems.map(item => (
                        <label key={item.id} className="flex items-center gap-2 p-2 rounded-lg hover:bg-slate-50 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={vinculoItemIds.includes(item.id)}
                            onChange={() => toggleVinculoItem(item.id)}
                            className="h-4 w-4 text-purple-600 rounded"
                          />
                          <span className="text-sm text-slate-900">{item.name}</span>
                          <span className="text-xs text-slate-500 ml-auto">R$ {Number(item.basePrice).toFixed(2)}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="flex justify-end gap-3 p-6 border-t border-slate-200">
              <button onClick={() => setShowVinculoModal(false)} className={btnSecondary}>Cancelar</button>
              <button onClick={handleSaveVinculo} disabled={submitting} className={btnPrimary}>
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Salvar Vinculação
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================= */}
      {/* MODAL: CONFIRMAÇÃO DE DELETE */}
      {/* ============================================================= */}
      {showDeleteModal && deleteTarget && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-red-100 rounded-full">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Confirmar Remoção</h3>
            </div>
            <p className="text-slate-600 mb-6">
              Tem certeza que deseja remover <strong>{deleteTarget.name}</strong>? 
              Esta ação não pode ser desfeita.
            </p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setShowDeleteModal(false)} className={btnSecondary}>Cancelar</button>
              <button onClick={handleDelete} disabled={submitting} className={btnDanger}>
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                Sim, Remover
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
// =================================================================
// FIM: frontend/src/app/dashboard/admin/catalogo/page.tsx
// =================================================================