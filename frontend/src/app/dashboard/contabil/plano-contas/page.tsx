// =================================================================
// INÍCIO: frontend/src/app/dashboard/contabil/plano-contas/page.tsx
// =================================================================
/**
 * 📒 Plano de Contas — CRUD completo + ordenação
 * • ✏️ Editar conta (modal) • ➕ Nova conta • 🗑️ Desativar conta
 * • Ordenar por código ou nome, crescente/decrescente
 * • Filtro por plano + busca + toggle de analíticas
 */
'use client';

import { useEffect, useMemo, useState } from 'react';
import api from '@/lib/axios';
import { toast } from 'sonner';
import {
  Loader2, Search, FolderTree, Info, Pencil, Trash2, Plus,
  ArrowUp, ArrowDown, X,
} from 'lucide-react';

interface Account {
  id: string;
  code: string;
  name: string;
  type: string;
  nature: string;
  level: number;
  planName: string;
}

const TYPE_BADGE: Record<string, string> = {
  ATIVO: 'bg-teal-100 text-teal-800',
  PASSIVO: 'bg-orange-100 text-orange-800',
  PATRIMONIO_LIQUIDO: 'bg-purple-100 text-purple-800',
  RECEITA: 'bg-green-100 text-green-800',
  DESPESA: 'bg-red-100 text-red-800',
};

const TYPE_LABEL: Record<string, string> = {
  ATIVO: 'Ativo', PASSIVO: 'Passivo', PATRIMONIO_LIQUIDO: 'PL',
  RECEITA: 'Receita', DESPESA: 'Despesa',
};

const TYPES = ['ATIVO', 'PASSIVO', 'PATRIMONIO_LIQUIDO', 'RECEITA', 'DESPESA'];

export default function PlanoContasPage() {
  const [loading, setLoading] = useState(true);
  const [accounts, setAccounts] = useState<Account[]>([]);

  // Filtros + ordenação
  const [search, setSearch] = useState('');
  const [showAll, setShowAll] = useState(false);
  const [planFilter, setPlanFilter] = useState('all');
  const [sortField, setSortField] = useState<'code' | 'name'>('code');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  // Modal de criar/editar
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Account | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    code: '', name: '', type: 'ATIVO', nature: 'DEVEDORA', planName: 'SCI 90113',
  });

  async function load() {
    try {
      setLoading(true);
      const res = await api.get('/accounting/accounts');
      setAccounts(res.data.data || []);
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Erro ao carregar o plano de contas.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  // Planos distintos p/ o filtro
  const plans = useMemo(
    () => Array.from(new Set(accounts.map((a) => a.planName))).sort(),
    [accounts],
  );

  // Lista filtrada + ordenada
  const filtered = useMemo(() => {
    let list = accounts;
    if (planFilter !== 'all') list = list.filter((a) => a.planName === planFilter);
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (a) => a.code.toLowerCase().includes(q) || a.name.toLowerCase().includes(q),
      );
    } else if (!showAll) {
      list = list.filter((a) => a.level <= 3);
    }
    const dir = sortDir === 'asc' ? 1 : -1;
    return [...list].sort((a, b) =>
      sortField === 'code'
        ? a.code.localeCompare(b.code, 'pt-BR', { numeric: true }) * dir
        : a.name.localeCompare(b.name, 'pt-BR') * dir,
    );
  }, [accounts, search, showAll, planFilter, sortField, sortDir]);

  // KPIs por tipo
  const kpis = useMemo(() => {
    const by = (t: string) => accounts.filter((a) => a.type === t).length;
    return { total: accounts.length, ativo: by('ATIVO'), passivo: by('PASSIVO'), pl: by('PATRIMONIO_LIQUIDO'), rec: by('RECEITA'), desp: by('DESPESA') };
  }, [accounts]);

  // ── CRUD ──
  function openCreate() {
    setEditing(null);
    setForm({
      code: '', name: '', type: 'ATIVO', nature: 'DEVEDORA',
      planName: planFilter !== 'all' ? planFilter : 'SCI 90113',
    });
    setModalOpen(true);
  }

  function openEdit(a: Account) {
    setEditing(a);
    setForm({ code: a.code, name: a.name, type: a.type, nature: a.nature, planName: a.planName });
    setModalOpen(true);
  }

  async function save() {
    if (!form.code.trim() || !form.name.trim()) {
      toast.error('Código e nome são obrigatórios.');
      return;
    }
    setSaving(true);
    try {
      if (editing) {
        await api.put(`/accounting/accounts/${editing.id}`, {
          code: form.code.trim(),
          name: form.name.trim(),
          type: form.type,
          nature: form.nature,
        });
        toast.success('Conta atualizada!');
      } else {
        await api.post('/accounting/accounts', {
          code: form.code.trim(),
          name: form.name.trim(),
          type: form.type,
          nature: form.nature,
          planName: form.planName,
        });
        toast.success('Conta criada!');
      }
      setModalOpen(false);
      load();
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Erro ao salvar a conta.');
    } finally {
      setSaving(false);
    }
  }

  async function remove(a: Account) {
    if (!window.confirm(`Desativar a conta ${a.code} — ${a.name}?`)) return;
    try {
      await api.delete(`/accounting/accounts/${a.id}`);
      toast.success('Conta desativada.');
      load();
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Erro ao desativar a conta.');
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="h-12 w-12 text-teal-600 animate-spin mb-4" />
        <p className="text-slate-600">Carregando plano de contas...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* CABEÇALHO */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <FolderTree className="h-7 w-7 text-teal-600" /> Plano de Contas
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            {kpis.total} contas • edite, crie ou desative contas e ordene como preferir.
          </p>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-semibold"
        >
          <Plus className="h-4 w-4" /> Nova Conta
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: 'Total', value: kpis.total, cls: 'text-slate-900' },
          { label: 'Ativo', value: kpis.ativo, cls: 'text-teal-700' },
          { label: 'Passivo', value: kpis.passivo, cls: 'text-orange-700' },
          { label: 'PL', value: kpis.pl, cls: 'text-purple-700' },
          { label: 'Receitas', value: kpis.rec, cls: 'text-green-700' },
          { label: 'Despesas', value: kpis.desp, cls: 'text-red-700' },
        ].map((k) => (
          <div key={k.label} className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
            <p className="text-xs font-semibold text-slate-500 uppercase">{k.label}</p>
            <p className={`text-2xl font-bold ${k.cls}`}>{k.value}</p>
          </div>
        ))}
      </div>

      {/* BARRA DE CONTROLES: busca + plano + ordenação + analíticas */}
      <div className="flex flex-col lg:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por código ou nome (ex: 01.1.1 ou Caixa)..."
            className="w-full pl-9 pr-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-white"
          />
        </div>

        <select
          value={planFilter}
          onChange={(e) => setPlanFilter(e.target.value)}
          className="px-3 py-2.5 border border-slate-300 rounded-lg text-sm bg-white"
        >
          <option value="all">Todos os planos</option>
          {plans.map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>

        <select
          value={sortField}
          onChange={(e) => setSortField(e.target.value as 'code' | 'name')}
          className="px-3 py-2.5 border border-slate-300 rounded-lg text-sm bg-white"
        >
          <option value="code">Ordenar por código</option>
          <option value="name">Ordenar por nome</option>
        </select>

        <button
          onClick={() => setSortDir(sortDir === 'asc' ? 'desc' : 'asc')}
          className="inline-flex items-center gap-2 px-3 py-2.5 border border-slate-300 rounded-lg text-sm bg-white hover:bg-slate-50"
          title="Alternar direção da ordenação"
        >
          {sortDir === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />}
          {sortDir === 'asc' ? 'Crescente' : 'Decrescente'}
        </button>

        <label className="flex items-center gap-2 text-sm text-slate-700 bg-white border border-slate-300 rounded-lg px-3 py-2.5 cursor-pointer">
          <input
            type="checkbox"
            checked={showAll}
            onChange={(e) => setShowAll(e.target.checked)}
            className="h-4 w-4 rounded text-teal-600 focus:ring-teal-500"
          />
          Mostrar analíticas (níveis 4+)
        </label>
      </div>

      {/* TABELA */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <p className="text-sm font-bold text-slate-700">
            {search ? `Resultados (${filtered.length})` : `Contas exibidas (${filtered.length})`}
          </p>
          <p className="text-xs text-slate-500">
            ordenado por {sortField === 'code' ? 'código' : 'nome'} ({sortDir === 'asc' ? 'crescente' : 'decrescente'})
          </p>
        </div>
        <div className="divide-y divide-slate-100 max-h-[60vh] overflow-y-auto">
          {filtered.length === 0 && (
            <p className="text-sm text-slate-400 text-center py-8">Nenhuma conta encontrada.</p>
          )}
          {filtered.map((a) => (
            <div key={a.id} className="flex items-center gap-3 py-2 pr-4 hover:bg-slate-50 group">
              <span className="font-mono text-xs text-slate-500 w-40 flex-shrink-0 truncate" title={a.code}>
                {a.code}
              </span>
              <span className={`text-sm flex-1 ${a.level <= 2 ? 'font-bold text-slate-900' : 'text-slate-700'}`}>
                {a.name}
              </span>
              <span className="text-[10px] text-slate-400 hidden md:inline">
                {a.nature === 'DEVEDORA' ? 'D' : 'C'}
              </span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${TYPE_BADGE[a.type] || 'bg-slate-100 text-slate-700'}`}>
                {TYPE_LABEL[a.type] || a.type}
              </span>
              {/* Ações da linha */}
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => openEdit(a)}
                  className="p-1.5 text-slate-400 hover:text-teal-600 hover:bg-teal-50 rounded"
                  title="Editar conta"
                >
                  <Pencil className="h-4 w-4" />
                </button>
                <button
                  onClick={() => remove(a)}
                  className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded"
                  title="Desativar conta"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* MODAL CRIAR/EDITAR */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-slate-900">
                {editing ? `Editar conta ${editing.code}` : 'Nova conta'}
              </h3>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Código</label>
                  <input
                    type="text"
                    value={form.code}
                    onChange={(e) => setForm({ ...form, code: e.target.value })}
                    placeholder="Ex: 04.2.1.03.090"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Plano</label>
                  <input
                    type="text"
                    value={form.planName}
                    onChange={(e) => setForm({ ...form, planName: e.target.value })}
                    disabled={!!editing}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm disabled:bg-slate-100"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nome da conta</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Ex: Serviços de Consultoria"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Tipo</label>
                  <select
                    value={form.type}
                    onChange={(e) => setForm({ ...form, type: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white"
                  >
                    {TYPES.map((t) => (
                      <option key={t} value={t}>{TYPE_LABEL[t]}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Natureza</label>
                  <select
                    value={form.nature}
                    onChange={(e) => setForm({ ...form, nature: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white"
                  >
                    <option value="DEVEDORA">Devedora (D)</option>
                    <option value="CREDORA">Credora (C)</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setModalOpen(false)}
                  className="flex-1 px-4 py-2.5 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 font-medium"
                >
                  Cancelar
                </button>
                <button
                  onClick={save}
                  disabled={saving}
                  className="flex-1 px-4 py-2.5 bg-teal-600 text-white rounded-lg hover:bg-teal-700 font-semibold disabled:opacity-50"
                >
                  {saving ? 'Salvando...' : editing ? 'Salvar alterações' : 'Criar conta'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
// =================================================================
// FIM: frontend/src/app/dashboard/contabil/plano-contas/page.tsx
// =================================================================