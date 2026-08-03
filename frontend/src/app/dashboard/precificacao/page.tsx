/**
 * Página: Precificação (Meus Planos e Categorias)
 * Permite configurar planos comerciais, multiplicadores e itens de serviço.
 */
'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/axios';
import { toast } from 'sonner';
import {
  Package, Plus, Trash2, Edit2, Save, X, Check,
  ChevronDown, ChevronRight, Loader2, Tag, FolderOpen, FileText
} from 'lucide-react';

const inputClass = 'w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-white';
const btnPrimary = 'flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50';
const btnSecondary = 'flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-lg transition-colors';

export default function PrecificacaoPage() {
  const [activeTab, setActiveTab] = useState<'plans' | 'categories'>('plans');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [plans, setPlans] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [editingPlanId, setEditingPlanId] = useState<string | null>(null);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    try {
      setLoading(true);
      const [plansRes, catsRes] = await Promise.all([
        api.get('/commercial-plans/plans'),
        api.get('/commercial-plans/categories'),
      ]);
      setPlans(plansRes.data.data || []);
      setCategories(catsRes.data.data || []);
    } catch (err) {
      toast.error('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  }

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

  function handleAddPlan() {
    setPlans([...plans, { id: '', name: `Novo Plano`, multiplier: 1.0, order: plans.length, isIndependent: false, itemCount: 0, items: [] }]);
    setEditingPlanId('new');
  }

  function handleUpdatePlan(id: string, field: string, value: any) {
    setPlans(plans.map((p) => (p.id === id || (id === 'new' && !p.id) ? { ...p, [field]: value } : p)));
  }

  async function handleDeletePlan(id: string) {
    if (!confirm('Remover este plano?')) return;
    try {
      if (id) await api.delete(`/commercial-plans/plans/${id}`);
      setPlans(plans.filter((p) => p.id !== id));
      toast.success('Plano removido');
    } catch { toast.error('Erro ao remover'); }
  }

  function handleToggleItem(planIndex: number, itemId: string) {
    const plan = plans[planIndex];
    const hasItem = plan.items.some((i: any) => i.id === itemId);
    const newItems = hasItem ? plan.items.filter((i: any) => i.id !== itemId) : [...plan.items, { id: itemId, name: '', categoryId: '', categoryName: '' }];
    const newPlans = [...plans];
    newPlans[planIndex] = { ...plan, items: newItems, itemCount: newItems.length };
    setPlans(newPlans);
  }

  async function handleAddCategory() {
    const name = prompt('Nome da nova categoria:');
    if (!name) return;
    try {
      await api.post('/commercial-plans/categories', { name, order: categories.length });
      toast.success('Categoria criada');
      loadData();
    } catch { toast.error('Erro ao criar categoria'); }
  }

  async function handleDeleteCategory(id: string) {
    if (!confirm('Remover esta categoria e todos os seus itens?')) return;
    try {
      await api.delete(`/commercial-plans/categories/${id}`);
      toast.success('Categoria removida');
      loadData();
    } catch { toast.error('Erro ao remover'); }
  }

  async function handleAddItem(categoryId: string) {
    const name = prompt('Nome do novo item de serviço:');
    if (!name) return;
    try {
      await api.post('/commercial-plans/items', { categoryId, name });
      toast.success('Item criado');
      loadData();
    } catch { toast.error('Erro ao criar item'); }
  }

  async function handleDeleteItem(itemId: string) {
    if (!confirm('Remover este item?')) return;
    try {
      await api.delete(`/commercial-plans/items/${itemId}`);
      toast.success('Item removido');
      loadData();
    } catch { toast.error('Erro ao remover'); }
  }

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh]">
      <Loader2 className="h-12 w-12 text-teal-600 animate-spin mb-4" />
      <p className="text-slate-600">Carregando...</p>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
            <Package className="h-8 w-8 text-teal-600" />
            Precificação
          </h1>
          <p className="text-slate-600 mt-1">Configure custos, defina regras e calcule o preço ideal de honorários.</p>
        </div>
        <div className="flex gap-2">
          {activeTab === 'plans' && (
            <button onClick={handleSaveAll} disabled={saving} className={btnPrimary}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {saving ? 'Salvando...' : 'Salvar Planos'}
            </button>
          )}
        </div>
      </div>

      <div className="flex gap-2 bg-slate-100 p-1 rounded-lg w-fit">
        <button onClick={() => setActiveTab('plans')} className={`flex items-center gap-2 px-4 py-2 rounded-md font-medium transition-colors ${activeTab === 'plans' ? 'bg-white text-teal-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}>
          <Tag className="h-4 w-4" /> Meus Planos
        </button>
        <button onClick={() => setActiveTab('categories')} className={`flex items-center gap-2 px-4 py-2 rounded-md font-medium transition-colors ${activeTab === 'categories' ? 'bg-white text-teal-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}>
          <FolderOpen className="h-4 w-4" /> Categorias e Itens
        </button>
      </div>

      {activeTab === 'plans' && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-slate-900">Planos Comerciais</h2>
            <button onClick={handleAddPlan} className={btnSecondary}>
              <Plus className="h-4 w-4" /> Adicionar Plano
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {plans.map((plan, idx) => (
              <div key={plan.id || `new-${idx}`} className="border border-slate-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    {editingPlanId === plan.id || (editingPlanId === 'new' && !plan.id) ? (
                      <input 
                        type="text" 
                        value={plan.name} 
                        onChange={(e) => handleUpdatePlan(plan.id || 'new', 'name', e.target.value)} 
                        className={inputClass + ' font-bold text-lg'} 
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
                    {editingPlanId === plan.id || (editingPlanId === 'new' && !plan.id) ? (
                      <button onClick={() => setEditingPlanId(null)} className="p-1.5 text-slate-400 hover:text-slate-600">
                        <X className="h-4 w-4" />
                      </button>
                    ) : (
                      <button onClick={() => setEditingPlanId(plan.id || 'new')} className="p-1.5 text-slate-400 hover:text-teal-600">
                        <Edit2 className="h-4 w-4" />
                      </button>
                    )}
                    <button onClick={() => handleDeletePlan(plan.id)} className="p-1.5 text-slate-400 hover:text-red-600">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                
                {editingPlanId === plan.id || (editingPlanId === 'new' && !plan.id) ? (
                  <div className="space-y-3 mb-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Multiplicador</label>
                      <input 
                        type="number" 
                        step="0.01" 
                        value={plan.multiplier} 
                        onChange={(e) => handleUpdatePlan(plan.id || 'new', 'multiplier', parseFloat(e.target.value) || 0)} 
                        className={inputClass} 
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Badge (opcional)</label>
                      <input 
                        type="text" 
                        value={plan.badge || ''} 
                        onChange={(e) => handleUpdatePlan(plan.id || 'new', 'badge', e.target.value)} 
                        className={inputClass} 
                        placeholder="Ex: MAIS POPULAR" 
                      />
                    </div>
                  </div>
                ) : (
                  <div className="mb-4">
                    <div className="text-2xl font-bold text-teal-600">×{plan.multiplier.toFixed(2)}</div>
                    <div className="text-sm text-slate-500">{plan.itemCount} itens selecionados</div>
                  </div>
                )}

                {(editingPlanId === plan.id || (editingPlanId === 'new' && !plan.id)) && (
                  <div className="border-t border-slate-200 pt-3">
                    <p className="text-xs font-semibold text-slate-600 mb-2">Itens inclusos:</p>
                    <div className="space-y-2 max-h-64 overflow-y-auto pr-2">
                      {categories.map((cat: any) => (
                        <div key={cat.id}>
                          <p className="text-xs font-medium text-slate-500 mb-1">{cat.name}</p>
                          {cat.items.map((item: any) => {
                            const isChecked = plan.items.some((i: any) => i.id === item.id);
                            return (
                              <label key={item.id} className="flex items-center gap-2 text-sm hover:bg-slate-50 p-1 rounded cursor-pointer">
                                <input 
                                  type="checkbox" 
                                  checked={isChecked} 
                                  onChange={() => handleToggleItem(idx, item.id)} 
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
            ))}
          </div>
        </div>
      )}

      {activeTab === 'categories' && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-slate-900">Categorias e Itens de Serviço</h2>
            <button onClick={handleAddCategory} className={btnSecondary}>
              <Plus className="h-4 w-4" /> Nova Categoria
            </button>
          </div>
          <div className="space-y-4">
            {categories.map((cat: any) => (
              <CategoryCard 
                key={cat.id} 
                category={cat} 
                onAddItem={handleAddItem} 
                onDeleteItem={handleDeleteItem} 
                onDeleteCategory={handleDeleteCategory} 
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Componente auxiliar para Categoria
function CategoryCard({ category, onAddItem, onDeleteItem, onDeleteCategory }: any) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="w-full border border-slate-200 rounded-lg overflow-hidden">
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
          <button onClick={() => onAddItem(category.id)} className="p-1.5 text-slate-400 hover:text-teal-600" title="Adicionar item">
            <Plus className="h-4 w-4" />
          </button>
          <button onClick={onDeleteCategory} className="p-1.5 text-slate-400 hover:text-red-600" title="Remover categoria">
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
      
      {expanded && (
        <div className="border-t border-slate-200">
          {category.items.length === 0 ? (
            <p className="p-4 text-sm text-slate-500 text-center">Nenhum item nesta categoria</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {category.items.map((item: any) => (
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