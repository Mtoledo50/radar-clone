'use client';

// =================================================================
// 📄 PÁGINA: FECHAMENTO MENSAL (Módulo Bancário)
// =================================================================
// Sprints 21–24: importação de extrato, classificação por naturezas,
//   DRE bancário, relatório por natureza, fechar/reabrir mês.
// Sprint 25.2: promoção p/ Contábil (partida dobrada).
// Sprint 29: abas Extrato | DRE | Conciliação NF-e.
// =================================================================

import { useState, useEffect, useCallback, useMemo } from 'react';
import { toast } from 'sonner';
import {
  Calendar, Upload, Loader2, FileText, TrendingUp, TrendingDown, DollarSign,
  User, Sparkles, Lock, Unlock, CheckSquare, Square, Pencil, Trash2, Plus,
  BarChart3, Printer, FileDown, X, Sigma, Tag, Settings2, Save,
  ArrowRightLeft, CheckCircle2,
} from 'lucide-react';
import api from '@/lib/axios';
import FiscalClientSelector from '@/components/fiscal/FiscalClientSelector';
import { useFiscalClientStore } from '@/store/fiscalClientStore';
import { parseBankCsv } from '@/lib/parseBankCsv';
import { exportToCSV } from '@/lib/exportToCSV';
import AccountCombobox from '@/components/accounting/AccountCombobox';
import ReconcileTab from '@/components/banking/ReconcileTab';

// =================================================================
// 📦 TIPOS (alinhados ao backend)
// =================================================================

/** Transação bancária importada do extrato */
interface Transaction {
  id: string;
  date: string;
  description: string;
  counterparty: string | null;
  amount: number;
  nature: string;
  classifiedBy: string | null;
}

/** Natureza/categoria personalizada do cliente (Sprint 24) */
interface Category {
  id: string;
  label: string;
  group: string;
  isSystem: boolean;
}

// =================================================================
// 🎨 CONSTANTES DE APRESENTAÇÃO
// =================================================================

/** Grupos fixos do DRE (garantem que o DRE sempre feche) */
const DRE_GROUPS = ['RECEITA', 'FINANCEIRA', 'DESPESA', 'IMPOSTO', 'SOCIO', 'PENDENTE'] as const;

/** Estilo visual (chip/badge) de cada grupo DRE */
const GROUP_STYLE: Record<string, { label: string; chip: string; dot: string }> = {
  RECEITA: { label: 'Receita', chip: 'bg-green-50 text-green-700 border-green-200', dot: 'bg-green-500' },
  FINANCEIRA: { label: 'Financeira', chip: 'bg-teal-50 text-teal-700 border-teal-200', dot: 'bg-teal-500' },
  DESPESA: { label: 'Despesa', chip: 'bg-red-50 text-red-700 border-red-200', dot: 'bg-red-500' },
  IMPOSTO: { label: 'Imposto', chip: 'bg-purple-50 text-purple-700 border-purple-200', dot: 'bg-purple-500' },
  SOCIO: { label: 'Sócio', chip: 'bg-slate-100 text-slate-600 border-slate-300', dot: 'bg-slate-500' },
  PENDENTE: { label: 'Pendente', chip: 'bg-amber-50 text-amber-700 border-amber-200', dot: 'bg-amber-500' },
};

/** Formata número como moeda brasileira */
const formatBRL = (v: number) => Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

/** Formata data ISO para dd/mm/aaaa */
const formatDate = (d: string) => new Date(d).toLocaleDateString('pt-BR');

/** Arredonda para 2 casas (evita float impreciso) */
const round2 = (v: number) => Math.round((v + Number.EPSILON) * 100) / 100;

/** Nomes dos meses para selects e relatórios */
const MONTH_NAMES = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];

// =================================================================
// 🧩 COMPONENTE PRINCIPAL DA PÁGINA
// =================================================================
export default function FechamentoMensalPage() {
  // -----------------------------------------------------------------
  // 🌐 ESTADO GLOBAL: cliente fiscal selecionado (Zustand)
  // -----------------------------------------------------------------
  const { selected } = useFiscalClientStore();
  const now = new Date();

  // -----------------------------------------------------------------
  // 📅 ESTADO: período (mês/ano) do fechamento
  // -----------------------------------------------------------------
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);

  // 🆕 Sprint 29: aba ativa (CORRIGIDO: dentro do componente!)
  const [activeTab, setActiveTab] = useState<'extrato' | 'dre' | 'reconcile'>('extrato');

  // -----------------------------------------------------------------
  // 📥 ESTADO: dados do extrato do mês
  // -----------------------------------------------------------------
  const [statement, setStatement] = useState<any>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);

  // -----------------------------------------------------------------
  // ☑️ ESTADO: seleção em lote p/ reclassificação
  // -----------------------------------------------------------------
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkNature, setBulkNature] = useState('');
  const [bulkLearning, setBulkLearning] = useState(true);
  const [savingBulk, setSavingBulk] = useState(false);

  // -----------------------------------------------------------------
  // ✏️ ESTADO: modal de lançar/editar transação
  // -----------------------------------------------------------------
  const [modal, setModal] = useState<{ mode: 'create' } | { mode: 'edit'; tx: Transaction } | null>(null);
  const [fDate, setFDate] = useState('');
  const [fDesc, setFDesc] = useState('');
  const [fAmount, setFAmount] = useState('');
  const [fType, setFType] = useState<'C' | 'D'>('C');
  const [fNature, setFNature] = useState('');
  const [savingModal, setSavingModal] = useState(false);

  // -----------------------------------------------------------------
  // 🗑️ ESTADO: confirmação de exclusão (transação ou mês)
  // -----------------------------------------------------------------
  const [deleteTarget, setDeleteTarget] = useState<{ kind: 'tx'; id: string } | { kind: 'statement' } | null>(null);
  const [deleting, setDeleting] = useState(false);

  // -----------------------------------------------------------------
  // 📊 ESTADO: modais de DRE / filtro / relatório
  // -----------------------------------------------------------------
  const [dreOpen, setDreOpen] = useState(false);
  const [showRunning, setShowRunning] = useState(false);
  const [filterNature, setFilterNature] = useState('all');
  const [reportOpen, setReportOpen] = useState(false);

  // -----------------------------------------------------------------
  // 🏷️ ESTADO: gestão de naturezas (criar/editar/excluir)
  // -----------------------------------------------------------------
  const [catMgrOpen, setCatMgrOpen] = useState(false);
  const [newCatLabel, setNewCatLabel] = useState('');
  const [newCatGroup, setNewCatGroup] = useState('RECEITA');
  const [savingCat, setSavingCat] = useState(false);
  const [editingCat, setEditingCat] = useState<Category | null>(null);
  const [editLabel, setEditLabel] = useState('');
  const [editGroup, setEditGroup] = useState('RECEITA');
  const [savingEdit, setSavingEdit] = useState(false);
  const [deleteCatTarget, setDeleteCatTarget] = useState<Category | null>(null);
  const [deletingCat, setDeletingCat] = useState(false);

  // -----------------------------------------------------------------
  // 📒 ESTADO: promoção p/ Contábil (Sprint 25.2)
  // -----------------------------------------------------------------
  const [promoteOpen, setPromoteOpen] = useState(false);
  const [promoting, setPromoting] = useState(false);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [accountMapping, setAccountMapping] = useState<Record<string, string>>({});
  const [bankAccountId, setBankAccountId] = useState('');
  const [creatingAccount, setCreatingAccount] = useState(false);
  const [newAccCode, setNewAccCode] = useState('1.1.2.01');
  const [newAccName, setNewAccName] = useState('PAGBANK');
  const [savingAcc, setSavingAcc] = useState(false);

  // =================================================================
  // 📥 CARREGAMENTO DO EXTRATO DO MÊS
  // =================================================================
  const loadStatement = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/banking/statement', {
        params: { clientId: selected.id || undefined, year, month },
      });
      setStatement(data.statement);
      setTransactions(data.transactions || []);
      setCategories(data.categories || []);
      setSelectedIds(new Set());
    } catch {
      toast.error('Erro ao carregar o fechamento.');
    } finally {
      setLoading(false);
    }
  }, [selected.id, year, month]);

  useEffect(() => { loadStatement(); }, [loadStatement]);

  // =================================================================
  // 📤 UPLOAD DO CSV (parser no frontend → POST no backend)
  // =================================================================
  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    try {
      const text = await file.text();
      const parsed = parseBankCsv(text);
      if (parsed.rows.length === 0) { toast.error('Nenhuma transação válida no CSV.'); return; }
      const { data } = await api.post('/banking/import', {
        clientId: selected.id || null, year, month, fileName: file.name, rows: parsed.rows,
      });
      toast.success(`Importado: ${data.imported} transações (${data.autoClassified} auto, ${data.pendingReview} pendentes).`);
      await loadStatement();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Erro ao importar.');
    } finally {
      setImporting(false);
      e.target.value = '';
    }
  };

  // =================================================================
  // 🏷️ GESTÃO DE NATUREZAS (editar / excluir / criar)
  // =================================================================
  const openEditCat = (cat: Category) => {
    setEditingCat(cat);
    setEditLabel(cat.label);
    setEditGroup(cat.group);
  };

  const saveEditCat = async () => {
    if (!editingCat || !editLabel.trim()) return;
    setSavingEdit(true);
    try {
      await api.patch(`/banking/categories/${editingCat.id}`, { label: editLabel.trim(), group: editGroup });
      toast.success('Natureza atualizada!');
      setEditingCat(null);
      await loadStatement();
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Erro ao editar natureza.');
    } finally {
      setSavingEdit(false);
    }
  };

  const confirmDeleteCat = async () => {
    if (!deleteCatTarget) return;
    setDeletingCat(true);
    try {
      await api.delete(`/banking/categories/${deleteCatTarget.id}`);
      toast.success(`Natureza "${deleteCatTarget.label}" excluída.`);
      setDeleteCatTarget(null);
      await loadStatement();
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Erro ao excluir natureza.');
    } finally {
      setDeletingCat(false);
    }
  };

  const createCategory = async () => {
    if (!newCatLabel.trim()) { toast.error('Informe o nome da natureza.'); return; }
    setSavingCat(true);
    try {
      await api.post('/banking/categories', { clientId: selected.id || null, label: newCatLabel.trim(), group: newCatGroup });
      toast.success('Natureza criada!');
      setNewCatLabel('');
      await loadStatement();
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Erro ao criar natureza.');
    } finally {
      setSavingCat(false);
    }
  };

  // =================================================================
  // ✏️ LANÇAR / EDITAR TRANSAÇÃO (modal)
  // =================================================================
  const openCreate = () => {
    setFDate(`${year}-${String(month).padStart(2, '0')}-01`);
    setFDesc(''); setFAmount(''); setFType('C');
    setFNature(categories[0]?.label || '');
    setModal({ mode: 'create' });
  };

  const openEdit = (tx: Transaction) => {
    setFDate(tx.date.slice(0, 10));
    setFDesc(tx.description);
    setFAmount(String(Math.abs(tx.amount)));
    setFType(tx.amount < 0 ? 'D' : 'C');
    setFNature(tx.nature);
    setModal({ mode: 'edit', tx });
  };

  const saveModal = async () => {
    const abs = Math.abs(Number(fAmount || 0));
    const amount = fType === 'D' ? -abs : abs;
    if (!fDesc.trim() || !abs) { toast.error('Preencha descrição e valor.'); return; }
    setSavingModal(true);
    try {
      if (modal?.mode === 'edit') {
        await api.patch(`/banking/transactions/${modal.tx.id}`, {
          description: fDesc, date: fDate, amount, nature: fNature, learn: true,
        });
        toast.success('Lançamento atualizado!');
      } else {
        await api.post('/banking/transactions', {
          clientId: selected.id || null, year, month,
          date: fDate, description: fDesc, amount, nature: fNature,
        });
        toast.success('Lançamento adicionado!');
      }
      setModal(null);
      await loadStatement();
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Erro ao salvar.');
    } finally {
      setSavingModal(false);
    }
  };

  // =================================================================
  // 🗑️ EXCLUSÕES (transação única ou mês inteiro)
  // =================================================================
  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      if (deleteTarget.kind === 'tx') {
        await api.delete(`/banking/transactions/${deleteTarget.id}`);
        toast.success('Transação excluída.');
      } else {
        await api.delete(`/banking/statements/${statement.id}`);
        toast.success('Importação do mês excluída.');
      }
      setDeleteTarget(null);
      await loadStatement();
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Erro ao excluir.');
    } finally {
      setDeleting(false);
    }
  };

  // =================================================================
  // ☑️ SELEÇÃO EM LOTE + RECLASSIFICAÇÃO (com aprendizado)
  // =================================================================
  const toggleSelect = (id: string) =>
    setSelectedIds((p) => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const toggleAll = () =>
    setSelectedIds(
      selectedIds.size === visibleTransactions.length
        ? new Set()
        : new Set(visibleTransactions.map((t) => t.id)),
    );

  const applyBulk = async () => {
    const effectiveNature = bulkNature || firstCat;
    if (selectedIds.size === 0 || !effectiveNature) return;
    setSavingBulk(true);
    try {
      for (const id of selectedIds) {
        await api.patch(`/banking/transactions/${id}`, { nature: effectiveNature, learn: bulkLearning });
      }
      toast.success(`${selectedIds.size} reclassificada(s)${bulkLearning ? ' + regras aprendidas' : ''}.`);
      setSelectedIds(new Set());
      await loadStatement();
    } catch { toast.error('Erro ao reclassificar.'); } finally { setSavingBulk(false); }
  };

  // =================================================================
  // 🔒 FECHAR / REABRIR MÊS (trava de compliance)
  // =================================================================
  const closeMonth = async () => {
    if (!statement) return;
    if (summary.pendentes > 0) {
      toast.error(`Ainda há ${summary.pendentes} transação(ões) pendente(s) de classificação.`);
      return;
    }
    try {
      await api.post(`/banking/close/${statement.id}`);
      toast.success('Mês FECHADO! A apuração foi travada.');
      await loadStatement();
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Erro ao fechar mês.');
    }
  };

  const reopenMonth = async () => {
    if (!statement) return;
    try {
      await api.post(`/banking/reopen/${statement.id}`);
      toast.success('Mês reaberto para ajustes.');
      await loadStatement();
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Erro ao reabrir mês.');
    }
  };

  // =================================================================
  // 📒 PROMOÇÃO P/ CONTÁBIL (Sprint 25.2)
  // =================================================================

  /** Cria conta bancária inline no Plano de Contas (upsert no backend) */
  const createAccountInline = async () => {
    if (!newAccCode.trim() || !newAccName.trim()) return;
    setSavingAcc(true);
    try {
      const prefix = newAccCode.trim().replace(/\D/g, '').charAt(0);
      const typeByPrefix: Record<string, string> = {
        '1': 'ATIVO', '2': 'PASSIVO', '3': 'PATRIMONIO_LIQUIDO', '4': 'RECEITA', '5': 'DESPESA',
      };
      await api.post('/accounting/accounts', {
        code: newAccCode.trim(),
        name: newAccName.trim().toUpperCase(),
        type: typeByPrefix[prefix] || 'ATIVO',
      });
      toast.success(`Conta "${newAccName.trim().toUpperCase()}" criada no Plano de Contas!`);
      setCreatingAccount(false);
      const { data } = await api.get('/accounting/accounts');
      const list = data.data || [];
      setAccounts(list);
      const created = list.find((a: any) => a.code === newAccCode.trim());
      if (created) setBankAccountId(created.id);
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Erro ao criar conta.');
    } finally {
      setSavingAcc(false);
    }
  };

  /** Abre o modal de promoção carregando o plano de contas */
  const openPromote = async () => {
    try {
      const { data } = await api.get('/accounting/accounts');
      const accountList = data.data || [];
      setAccounts(accountList);
      const defaultMapping: Record<string, string> = {};
      for (const cat of categories) {
        if (cat.group === 'RECEITA') defaultMapping[cat.label] = '4.1.1.01';
        if (cat.group === 'FINANCEIRA') defaultMapping[cat.label] = '4.4.1.01';
        if (cat.group === 'DESPESA') defaultMapping[cat.label] = '3.2.1.01';
        if (cat.group === 'IMPOSTO') defaultMapping[cat.label] = '3.1.1.01';
        if (cat.group === 'SOCIO') defaultMapping[cat.label] = '2.3.1.01';
        if (cat.group === 'PENDENTE') defaultMapping[cat.label] = '';
      }
      setAccountMapping(defaultMapping);
      const bankAcc = accountList.find((a: any) => a.code === '1.1.1.01');
      setBankAccountId(bankAcc?.id || '');
      setPromoteOpen(true);
    } catch {
      toast.error('Erro ao carregar contas contábeis.');
    }
  };

  /** Executa a promoção (idempotente no backend) */
  const confirmPromote = async () => {
    if (!statement || !bankAccountId) {
      toast.error('Selecione a conta bancária (Caixa/Banco).');
      return;
    }
    setPromoting(true);
    try {
      const { data } = await api.post('/accounting/promote-from-banking', {
        statementId: statement.id,
        clientId: selected.id || null,
        accountMapping,
        bankAccountId,
      });
      const result = data.data || data;
      toast.success(`Promovido: ${result.promoted} lançamento(s). ${result.skipped} já existiam. ${result.failed} falharam.`);
      setPromoteOpen(false);
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Erro ao promover.');
    } finally {
      setPromoting(false);
    }
  };

  // =================================================================
  // 📊 MEMOS: cálculos derivados (DRE, autosoma, filtros, relatório)
  // =================================================================

  /** Resumo DRE por natureza + totais por grupo */
  const summary = useMemo(() => {
    const catMap = new Map(categories.map((c) => [c.label, c.group]));
    const groupOf = (nature: string) => catMap.get(nature) || 'PENDENTE';
    const sumGroup = (g: string) =>
      round2(transactions.filter((t) => groupOf(t.nature) === g).reduce((s, t) => s + t.amount, 0));
    const linhas: { label: string; group: string; total: number; count: number }[] = [];
    const map = new Map<string, typeof linhas[0]>();
    for (const t of transactions) {
      const group = groupOf(t.nature);
      const line = map.get(t.nature) || { label: t.nature, group, total: 0, count: 0 };
      line.total = round2(line.total + t.amount);
      line.count++;
      map.set(t.nature, line);
    }
    linhas.push(...[...map.values()].sort((a, b) => {
      const ga = DRE_GROUPS.indexOf(a.group as any);
      const gb = DRE_GROUPS.indexOf(b.group as any);
      return ga !== gb ? ga - gb : b.total - a.total;
    }));
    const receita = sumGroup('RECEITA');
    const financeira = sumGroup('FINANCEIRA');
    const despesa = sumGroup('DESPESA');
    const imposto = sumGroup('IMPOSTO');
    const socioEnv = round2(transactions.filter((t) => groupOf(t.nature) === 'SOCIO' && t.amount < 0).reduce((s, t) => s + t.amount, 0));
    const socioRec = round2(transactions.filter((t) => groupOf(t.nature) === 'SOCIO' && t.amount > 0).reduce((s, t) => s + t.amount, 0));
    return {
      linhas, receita, financeira, despesa, imposto, socioEnv, socioRec,
      saldoSocio: round2(socioRec + socioEnv),
      resultado: round2(receita + financeira + despesa + imposto),
      pendentes: transactions.filter((t) => groupOf(t.nature) === 'PENDENTE').length,
      totalCreditos: round2(transactions.filter((t) => t.amount > 0).reduce((s, t) => s + t.amount, 0)),
      totalDebitos: round2(transactions.filter((t) => t.amount < 0).reduce((s, t) => s + t.amount, 0)),
    };
  }, [transactions, categories]);

  /** Autosoma: saldo acumulado cronológico (opcional na tabela) */
  const running = useMemo(() => {
    const map = new Map<string, number>();
    let acc = 0;
    for (const t of [...transactions].sort((a, b) => a.date.localeCompare(b.date))) {
      acc = round2(acc + t.amount);
      map.set(t.id, acc);
    }
    return map;
  }, [transactions]);

  /** Mapa natureza → grupo (p/ filtro por grupo) */
  const catGroupMap = useMemo(() => new Map(categories.map((c) => [c.label, c.group])), [categories]);

  /** Transações visíveis após filtro por natureza/grupo */
  const visibleTransactions = useMemo(() => {
    if (filterNature === 'all') return transactions;
    if (filterNature.startsWith('group:')) {
      const g = filterNature.slice(6);
      return transactions.filter((t) => (catGroupMap.get(t.nature) || 'PENDENTE') === g);
    }
    return transactions.filter((t) => t.nature === filterNature);
  }, [transactions, filterNature, catGroupMap]);

  /** Totais da visão filtrada (rodapé da tabela) */
  const visibleTotals = useMemo(
    () => ({
      creditos: round2(visibleTransactions.filter((t) => t.amount > 0).reduce((s, t) => s + t.amount, 0)),
      debitos: round2(visibleTransactions.filter((t) => t.amount < 0).reduce((s, t) => s + t.amount, 0)),
    }),
    [visibleTransactions],
  );

  /** Relatório agrupado por grupo DRE (subtotais p/ confronto) */
  const reportByGroup = useMemo(() => {
    return DRE_GROUPS.map((g) => {
      const linhas = summary.linhas.filter((l) => l.group === g);
      const subtotal = round2(linhas.reduce((s, l) => s + l.total, 0));
      const count = linhas.reduce((s, l) => s + l.count, 0);
      return { group: g as string, linhas, subtotal, count };
    }).filter((g) => g.linhas.length > 0);
  }, [summary.linhas]);

  // =================================================================
  // 📤 EXPORTAÇÕES (CSV + impressão)
  // =================================================================
  const exportTransactions = () => {
    if (transactions.length === 0) { toast.error('Nada para exportar.'); return; }
    exportToCSV(
      transactions.map((t) => ({
        data: formatDate(t.date), descricao: t.description, contraparte: t.counterparty || '',
        valor: t.amount, natureza: t.nature,
      })),
      ['data', 'descricao', 'contraparte', 'valor', 'natureza'],
      `extrato-${year}-${String(month).padStart(2, '0')}`,
    );
    toast.success('Extrato exportado.');
  };

  const exportDRE = () => {
    exportToCSV(
      [
        ...summary.linhas.map((l) => ({ categoria: `[${GROUP_STYLE[l.group]?.label}] ${l.label}`, valor: l.total })),
        { categoria: '---', valor: 0 },
        { categoria: 'RESULTADO LÍQUIDO', valor: summary.resultado },
        { categoria: 'Saldo Líquido Sócios (fora do DRE)', valor: summary.saldoSocio },
      ],
      ['categoria', 'valor'],
      `DRE-${year}-${String(month).padStart(2, '0')}`,
    );
    toast.success('DRE exportado.');
  };

  const printDRE = () => {
    const w = window.open('', '_blank');
    if (!w) { toast.error('Permita pop-ups para imprimir.'); return; }
    const rowsHtml = summary.linhas
      .map((l) => {
        const style = GROUP_STYLE[l.group] || GROUP_STYLE.PENDENTE;
        const cls = l.group === 'DESPESA' || l.group === 'IMPOSTO' || l.group === 'SOCIO' ? (l.total < 0 ? 'neg' : '') : (l.total > 0 ? 'pos' : '');
        return `<tr><td><span style="display:inline-block;width:8px;height:8px;border-radius:50%;margin-right:8px" class="${style.dot}"></span>${l.label}</td><td class="${cls}">${formatBRL(l.total)}</td></tr>`;
      })
      .join('');
    w.document.write(`
      <html><head><title>DRE ${MONTH_NAMES[month - 1]} ${year}</title>
      <style>
        body{font-family:Arial,sans-serif;padding:32px;color:#0f172a}
        h1{font-size:20px;margin:0} h2{font-size:14px;color:#475569;margin:4px 0 20px}
        table{width:100%;border-collapse:collapse;margin-top:12px}
        td,th{border:1px solid #cbd5e1;padding:8px;font-size:12px;text-align:left}
        th{background:#0d9488;color:#fff}
        .neg{color:#b91c1c}.pos{color:#15803d}.tot{font-weight:bold;background:#f1f5f9}
        .bg-green-500{background:#22c55e}.bg-teal-500{background:#14b8a6}
        .bg-red-500{background:#ef4444}.bg-purple-500{background:#a855f7}
        .bg-slate-500{background:#64748b}.bg-amber-500{background:#f59e0b}
      </style></head><body>
      <h1>DRE — DEMONSTRAÇÃO DO RESULTADO DO EXERCÍCIO</h1>
      <h2>${selected.name || 'Cliente'} • ${MONTH_NAMES[month - 1]}/${year} • Gerado em ${new Date().toLocaleDateString('pt-BR')}</h2>
      <table>
        <tr><th>Categoria</th><th>Valor (R$)</th></tr>
        ${rowsHtml}
        <tr class="tot"><td>(=) RESULTADO LÍQUIDO</td><td>${formatBRL(summary.resultado)}</td></tr>
        <tr><td>Saldo Líquido Sócios (fora do DRE)</td><td>${formatBRL(summary.saldoSocio)}</td></tr>
      </table>
      </body></html>`);
    w.document.close();
    w.focus();
    w.print();
  };

  const exportReport = () => {
    const rows: any[] = [];
    for (const g of reportByGroup) {
      const gLabel = GROUP_STYLE[g.group]?.label || g.group;
      for (const l of g.linhas) rows.push({ grupo: gLabel, natureza: l.label, qtd: l.count, subtotal: l.total });
      rows.push({ grupo: gLabel, natureza: `SUBTOTAL ${gLabel.toUpperCase()}`, qtd: g.count, subtotal: g.subtotal });
    }
    rows.push({ grupo: 'GERAL', natureza: 'RESULTADO LÍQUIDO', qtd: '', subtotal: summary.resultado });
    rows.push({ grupo: 'GERAL', natureza: 'SALDO LÍQUIDO SÓCIOS (FORA DO DRE)', qtd: '', subtotal: summary.saldoSocio });
    exportToCSV(rows, ['grupo', 'natureza', 'qtd', 'subtotal'], `relatorio-naturezas-${year}-${String(month).padStart(2, '0')}`);
    toast.success('Relatório por natureza exportado.');
  };

  const printReport = () => {
    const w = window.open('', '_blank');
    if (!w) { toast.error('Permita pop-ups para imprimir.'); return; }
    const groupsHtml = reportByGroup
      .map((g) => {
        const style = GROUP_STYLE[g.group] || GROUP_STYLE.PENDENTE;
        const rows = g.linhas
          .map((l) => `<tr><td style="padding:4px 8px 4px 24px">${l.label}</td><td style="text-align:center">${l.count}</td><td style="text-align:right">${formatBRL(l.total)}</td></tr>`)
          .join('');
        return `
          <tr style="background:#0d9488;color:#fff"><td colspan="3" style="padding:6px 8px;font-weight:bold">${style.label.toUpperCase()}</td></tr>
          ${rows}
          <tr style="font-weight:bold;background:#f1f5f9"><td style="padding:4px 8px">Subtotal — ${style.label}</td><td style="text-align:center">${g.count}</td><td style="text-align:right">${formatBRL(g.subtotal)}</td></tr>`;
      })
      .join('');
    w.document.write(`
      <html><head><title>Relatório por Natureza ${MONTH_NAMES[month - 1]} ${year}</title>
      <style>
        body{font-family:Arial,sans-serif;padding:32px;color:#0f172a}
        h1{font-size:18px;margin:0} h2{font-size:13px;color:#475569;margin:4px 0 16px}
        table{width:100%;border-collapse:collapse;margin-top:12px}
        td,th{border:1px solid #cbd5e1;padding:6px 8px;font-size:12px;text-align:left}
        .tot{font-weight:bold;background:#e2e8f0}
      </style></head><body>
      <h1>RELATÓRIO DETALHADO POR NATUREZA</h1>
      <h2>${selected.name || 'Cliente'} • ${MONTH_NAMES[month - 1]}/${year} • Gerado em ${new Date().toLocaleDateString('pt-BR')} • Confronto com DRE</h2>
      <table>
        <tr><th>Natureza</th><th style="text-align:center">Qtd</th><th style="text-align:right">Subtotal (R$)</th></tr>
        ${groupsHtml}
        <tr class="tot"><td>(=) RESULTADO LÍQUIDO</td><td></td><td style="text-align:right">${formatBRL(summary.resultado)}</td></tr>
        <tr><td>Saldo Líquido Sócios (fora do DRE)</td><td></td><td style="text-align:right">${formatBRL(summary.saldoSocio)}</td></tr>
      </table>
      </body></html>`);
    w.document.close();
    w.focus();
    w.print();
  };

  // -----------------------------------------------------------------
  // Derivados simples de renderização
  // -----------------------------------------------------------------
  const isClosed = statement?.status === 'FECHADO';
  const firstCat = categories[0]?.label || '';

  // =================================================================
  // 🎨 RENDERIZAÇÃO
  // =================================================================
  return (
    <div className="space-y-6">
      {/* ---------- CABEÇALHO ---------- */}
      <div className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Calendar className="h-7 w-7 text-teal-600" /> Fechamento Mensal
          </h1>
          <p className="text-slate-600 mt-1">Importe o extrato, classifique, gere o DRE e feche o mês.</p>
        </div>
        <FiscalClientSelector />
      </div>

      {/* ---------- BANNER DO CLIENTE SELECIONADO ---------- */}
      {selected.id && (
        <div className="bg-teal-50 border border-teal-200 rounded-xl p-4 flex items-center gap-3">
          <div className="p-1.5 bg-teal-100 rounded-lg"><FileText className="h-4 w-4 text-teal-700" /></div>
          <p className="text-sm font-medium text-teal-900">Fechamento de: <span className="font-bold">{selected.name}</span></p>
        </div>
      )}

      {/* ---------- 🆕 SPRINT 29: ABAS DE NAVEGAÇÃO ---------- */}
      <div className="flex gap-2 bg-slate-100 p-1 rounded-lg w-fit">
        <button
          onClick={() => setActiveTab('extrato')}
          className={`flex items-center gap-2 px-4 py-2 rounded-md font-medium transition-colors ${activeTab === 'extrato' ? 'bg-white text-teal-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
        >
          <FileText className="h-4 w-4" /> Extrato
        </button>
        <button
          onClick={() => setActiveTab('dre')}
          className={`flex items-center gap-2 px-4 py-2 rounded-md font-medium transition-colors ${activeTab === 'dre' ? 'bg-white text-teal-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
        >
          <BarChart3 className="h-4 w-4" /> DRE
        </button>
        <button
          onClick={() => setActiveTab('reconcile')}
          className={`flex items-center gap-2 px-4 py-2 rounded-md font-medium transition-colors ${activeTab === 'reconcile' ? 'bg-white text-teal-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
        >
          <CheckCircle2 className="h-4 w-4" /> Conciliação NF-e
        </button>
      </div>

      {/* ========================================================= */}
      {/* ABA 1: EXTRATO (conteúdo original)                        */}
      {/* ========================================================= */}
      {activeTab === 'extrato' && (
        <>
          {/* ---------- CONTROLES DO MÊS ---------- */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex flex-wrap items-center gap-3">
              <select value={month} onChange={(e) => setMonth(Number(e.target.value))} className="border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white">
                {MONTH_NAMES.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
              </select>
              <select value={year} onChange={(e) => setYear(Number(e.target.value))} className="border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white">
                {[now.getFullYear() - 1, now.getFullYear(), now.getFullYear() + 1].map((y) => <option key={y} value={y}>{y}</option>)}
              </select>
              <label className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold rounded-lg cursor-pointer">
                {importing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                Importar Extrato (CSV)
                <input type="file" accept=".csv,.txt" onChange={handleUpload} disabled={importing || isClosed} className="hidden" />
              </label>
              <button onClick={openCreate} disabled={isClosed} className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white text-sm font-semibold rounded-lg disabled:opacity-50">
                <Plus className="h-4 w-4" /> Lançamento Manual
              </button>
              <button onClick={() => setCatMgrOpen(true)} className="flex items-center gap-2 px-4 py-2 border border-slate-300 text-slate-700 text-sm font-semibold rounded-lg hover:bg-slate-50">
                <Settings2 className="h-4 w-4" /> Naturezas ({categories.length})
              </button>
              <button onClick={() => setDreOpen(true)} disabled={transactions.length === 0} className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded-lg disabled:opacity-50">
                <BarChart3 className="h-4 w-4" /> Gerar DRE
              </button>
              <button onClick={exportTransactions} disabled={transactions.length === 0} className="flex items-center gap-2 px-3 py-2 text-sm text-slate-600 border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50">
                <FileDown className="h-4 w-4" /> Exportar Extrato
              </button>
              {statement && !isClosed && (
                <button onClick={closeMonth} className="flex items-center gap-2 px-3 py-2 text-sm text-teal-700 border border-teal-300 rounded-lg hover:bg-teal-50">
                  <Lock className="h-4 w-4" /> Fechar Mês
                </button>
              )}
              {statement && isClosed && (
                <button onClick={openPromote} className="flex items-center gap-2 px-3 py-2 text-sm text-blue-700 border border-blue-300 rounded-lg hover:bg-blue-50">
                  <ArrowRightLeft className="h-4 w-4" /> Promover p/ Contábil
                </button>
              )}
              {statement && isClosed && (
                <button onClick={reopenMonth} className="flex items-center gap-2 px-3 py-2 text-sm text-orange-700 border border-orange-300 rounded-lg hover:bg-orange-50">
                  <Unlock className="h-4 w-4" /> Reabrir Mês
                </button>
              )}
              {statement && !isClosed && (
                <button onClick={() => setDeleteTarget({ kind: 'statement' })} className="flex items-center gap-2 px-3 py-2 text-sm text-red-600 border border-red-300 rounded-lg hover:bg-red-50">
                  <Trash2 className="h-4 w-4" /> Excluir Importação
                </button>
              )}
              {statement && (
                <span className="flex items-center gap-1 text-xs text-slate-500">
                  {isClosed ? <Lock className="h-3.5 w-3.5 text-teal-600" /> : <Unlock className="h-3.5 w-3.5" />}
                  {isClosed ? 'FECHADO' : 'Aberto'} {statement.fileName && `• ${statement.fileName}`}
                </span>
              )}
            </div>
          </div>

          {/* ---------- KPIs DO MÊS ---------- */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
              <p className="text-xs text-slate-500 flex items-center gap-1"><TrendingUp className="h-3.5 w-3.5 text-green-600" /> Receita</p>
              <p className="text-lg font-bold text-green-700">{formatBRL(summary.receita)}</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
              <p className="text-xs text-slate-500 flex items-center gap-1"><Sparkles className="h-3.5 w-3.5 text-teal-600" /> Financeira</p>
              <p className="text-lg font-bold text-teal-700">{formatBRL(summary.financeira)}</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
              <p className="text-xs text-slate-500 flex items-center gap-1"><TrendingDown className="h-3.5 w-3.5 text-red-600" /> Despesas</p>
              <p className="text-lg font-bold text-red-700">{formatBRL(summary.despesa)}</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
              <p className="text-xs text-slate-500 flex items-center gap-1"><FileText className="h-3.5 w-3.5 text-purple-600" /> Impostos</p>
              <p className="text-lg font-bold text-purple-700">{formatBRL(summary.imposto)}</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
              <p className="text-xs text-slate-500 flex items-center gap-1"><User className="h-3.5 w-3.5 text-slate-600" /> Sócio (líquido)</p>
              <p className="text-lg font-bold text-slate-700">{formatBRL(summary.saldoSocio)}</p>
            </div>
            <div className={`rounded-xl shadow-sm border p-4 ${summary.resultado >= 0 ? 'bg-green-50 border-green-300' : 'bg-red-50 border-red-300'}`}>
              <p className="text-xs text-slate-600 flex items-center gap-1"><DollarSign className="h-3.5 w-3.5" /> Resultado Líquido</p>
              <p className={`text-lg font-bold ${summary.resultado >= 0 ? 'text-green-800' : 'text-red-800'}`}>{formatBRL(summary.resultado)}</p>
            </div>
          </div>

          {/* ---------- BARRA DE RECLASSIFICAÇÃO EM LOTE ---------- */}
          {selectedIds.size > 0 && !isClosed && (
            <div className="bg-teal-50 border border-teal-300 rounded-xl p-4 flex flex-wrap items-center gap-3">
              <p className="text-sm font-semibold text-teal-900">{selectedIds.size} selecionada(s)</p>
              <select value={bulkNature || firstCat} onChange={(e) => setBulkNature(e.target.value)} className="border border-teal-300 rounded-lg px-3 py-2 text-sm bg-white">
                {categories.map((c) => (
                  <option key={c.id} value={c.label}>[{GROUP_STYLE[c.group]?.label}] {c.label}</option>
                ))}
              </select>
              <label className="flex items-center gap-2 text-sm text-teal-800">
                <input type="checkbox" checked={bulkLearning} onChange={(e) => setBulkLearning(e.target.checked)} className="rounded" />
                Aprender p/ próximo mês
              </label>
              <button onClick={applyBulk} disabled={savingBulk} className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold rounded-lg disabled:opacity-50">
                {savingBulk ? 'Aplicando...' : 'Aplicar'}
              </button>
              <button onClick={() => setSelectedIds(new Set())} className="text-sm text-teal-700">Limpar</button>
            </div>
          )}

          {/* ---------- TABELA DE TRANSAÇÕES ---------- */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <h3 className="font-bold text-slate-900">
                Transações ({visibleTransactions.length}{filterNature !== 'all' ? ` de ${transactions.length}` : ''})
              </h3>
              <div className="flex flex-wrap items-center gap-3">
                <select value={filterNature} onChange={(e) => setFilterNature(e.target.value)} className="border border-slate-300 rounded-lg px-3 py-1.5 text-xs bg-white">
                  <option value="all">Todas as naturezas</option>
                  {DRE_GROUPS.map((g) => (
                    <option key={g} value={`group:${g}`}>— Grupo: {GROUP_STYLE[g].label} (todas) —</option>
                  ))}
                  {categories.map((c) => (
                    <option key={c.id} value={c.label}>[{GROUP_STYLE[c.group]?.label}] {c.label}</option>
                  ))}
                </select>
                {filterNature !== 'all' && (
                  <button onClick={() => setFilterNature('all')} className="text-xs text-teal-700 hover:text-teal-900 font-semibold">Limpar filtro</button>
                )}
                <button onClick={() => setReportOpen(true)} disabled={transactions.length === 0} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50">
                  <BarChart3 className="h-3.5 w-3.5" /> Relatório por Natureza
                </button>
                <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer">
                  <input type="checkbox" checked={showRunning} onChange={(e) => setShowRunning(e.target.checked)} className="rounded" />
                  <Sigma className="h-3.5 w-3.5" /> Saldo acumulado (autosoma)
                </label>
              </div>
            </div>

            {loading ? (
              <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 text-teal-600 animate-spin" /></div>
            ) : transactions.length === 0 ? (
              <div className="text-center py-10 text-slate-400">
                <Upload className="h-10 w-10 mx-auto mb-2" />
                <p className="text-sm">Nenhuma transação. Importe o CSV ou faça um lançamento manual.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm whitespace-nowrap">
                  <thead>
                    <tr className="border-b border-slate-200 text-left text-slate-500">
                      <th className="py-2 pr-2 w-8">
                        <button onClick={toggleAll}>{selectedIds.size === transactions.length ? <CheckSquare className="h-4 w-4 text-teal-600" /> : <Square className="h-4 w-4" />}</button>
                      </th>
                      <th className="py-2 pr-4 font-medium">Data</th>
                      <th className="py-2 pr-4 font-medium">Descrição</th>
                      <th className="py-2 pr-4 font-medium">Contraparte</th>
                      <th className="py-2 pr-4 font-medium text-right">Valor</th>
                      {showRunning && <th className="py-2 pr-4 font-medium text-right">Saldo Acum.</th>}
                      <th className="py-2 pr-4 font-medium">Natureza</th>
                      <th className="py-2 font-medium text-center">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visibleTransactions.map((t) => {
                      const cat = categories.find((c) => c.label === t.nature);
                      const style = GROUP_STYLE[cat?.group || 'PENDENTE'];
                      return (
                        <tr key={t.id} className={`border-b border-slate-100 hover:bg-slate-50 ${selectedIds.has(t.id) ? 'bg-teal-50/50' : ''}`}>
                          <td className="py-3 pr-2">
                            <button onClick={() => toggleSelect(t.id)}>{selectedIds.has(t.id) ? <CheckSquare className="h-4 w-4 text-teal-600" /> : <Square className="h-4 w-4 text-slate-400" />}</button>
                          </td>
                          <td className="py-3 pr-4 text-slate-600">{formatDate(t.date)}</td>
                          <td className="py-3 pr-4 text-slate-700 max-w-[280px] truncate" title={t.description}>{t.description}</td>
                          <td className="py-3 pr-4 text-slate-600 max-w-[180px] truncate">{t.counterparty || '—'}</td>
                          <td className={`py-3 pr-4 text-right font-semibold ${t.amount >= 0 ? 'text-green-700' : 'text-red-700'}`}>{formatBRL(t.amount)}</td>
                          {showRunning && <td className="py-3 pr-4 text-right text-slate-600">{formatBRL(running.get(t.id) || 0)}</td>}
                          <td className="py-3 pr-4">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border whitespace-nowrap ${style.chip}`}>{t.nature}</span>
                          </td>
                          <td className="py-3">
                            <div className="flex items-center justify-center gap-1">
                              <button onClick={() => openEdit(t)} disabled={isClosed} className="p-1.5 text-slate-400 hover:text-teal-600 hover:bg-teal-50 rounded-lg" title="Editar">
                                <Pencil className="h-4 w-4" />
                              </button>
                              <button onClick={() => setDeleteTarget({ kind: 'tx', id: t.id })} disabled={isClosed} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg" title="Excluir">
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="bg-slate-50 font-semibold text-slate-700">
                      <td colSpan={4} className="py-3 px-2 text-right">TOTAIS {filterNature !== 'all' ? '(FILTRADO)' : ''}:</td>
                      <td className="py-3 pr-4 text-right">
                        <span className="text-green-700">+{formatBRL(visibleTotals.creditos)}</span>{' '}
                        <span className="text-red-700">{formatBRL(visibleTotals.debitos)}</span>
                      </td>
                      {showRunning && <td className="py-3 pr-4 text-right">{formatBRL(round2(visibleTotals.creditos + visibleTotals.debitos))}</td>}
                      <td colSpan={2} className="py-3 px-2 text-right">= {formatBRL(round2(visibleTotals.creditos + visibleTotals.debitos))}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {/* ========================================================= */}
      {/* ABA 2: DRE (visão inline)                                 */}
      {/* ========================================================= */}
      {activeTab === 'dre' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* DRE por categoria */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-900">DRE — {MONTH_NAMES[month - 1]}/{year}</h3>
              <div className="flex gap-2">
                <button onClick={exportDRE} className="flex items-center gap-1 px-2.5 py-1.5 text-xs bg-green-600 hover:bg-green-700 text-white rounded"><FileDown className="h-3.5 w-3.5" /> CSV</button>
                <button onClick={printDRE} className="flex items-center gap-1 px-2.5 py-1.5 text-xs bg-slate-800 hover:bg-slate-900 text-white rounded"><Printer className="h-3.5 w-3.5" /> Imprimir</button>
              </div>
            </div>
            <table className="w-full text-sm">
              <tbody>
                {summary.linhas.map((l) => {
                  const style = GROUP_STYLE[l.group];
                  return (
                    <tr key={l.label} className="border-b border-slate-100">
                      <td className="py-2 text-slate-700 flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${style.dot}`} />
                        <span className="text-[10px] font-bold uppercase text-slate-400">{style.label}</span>
                        <span>{l.label}</span>
                        <span className="text-[10px] text-slate-400">({l.count})</span>
                      </td>
                      <td className={`py-2 text-right font-semibold ${l.total >= 0 ? 'text-green-700' : 'text-red-700'}`}>{formatBRL(l.total)}</td>
                    </tr>
                  );
                })}
                <tr className="bg-slate-50 font-bold">
                  <td className="py-2 px-2 text-slate-800">(=) RESULTADO LÍQUIDO</td>
                  <td className={`py-2 px-2 text-right ${summary.resultado >= 0 ? 'text-green-800' : 'text-red-800'}`}>{formatBRL(summary.resultado)}</td>
                </tr>
                <tr className="bg-slate-50 font-semibold">
                  <td className="py-2 px-2 text-slate-700 text-xs">Saldo Líquido Sócios (fora do DRE)</td>
                  <td className="py-2 px-2 text-right text-slate-700 text-xs">{formatBRL(summary.saldoSocio)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Relatório por grupo (subtotais) */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-900">Subtotais por Grupo</h3>
              <button onClick={exportReport} className="flex items-center gap-1 px-2.5 py-1.5 text-xs bg-green-600 hover:bg-green-700 text-white rounded"><FileDown className="h-3.5 w-3.5" /> CSV</button>
            </div>
            <table className="w-full text-sm">
              <tbody>
                {reportByGroup.map((g) => {
                  const style = GROUP_STYLE[g.group];
                  return (
                    <tr key={g.group} className="border-b border-slate-100">
                      <td className="py-2 text-slate-700">{style.label}</td>
                      <td className="py-2 text-center text-slate-500">{g.count}</td>
                      <td className={`py-2 text-right font-semibold ${g.subtotal >= 0 ? 'text-green-700' : 'text-red-700'}`}>{formatBRL(g.subtotal)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* ABA 3: CONCILIAÇÃO NF-e (Sprint 29)                       */}
      {/* ========================================================= */}
      {activeTab === 'reconcile' && selected.id && (
        <ReconcileTab clientId={selected.id} year={year} month={month} />
      )}

      {/* ========================================================= */}
      {/* MODAIS (globais — funcionam em qualquer aba)              */}
      {/* ========================================================= */}

      {/* ---------- MODAL: LANÇAR/EDITAR TRANSAÇÃO ---------- */}
      {modal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md">
            <div className="flex items-center justify-between p-5 border-b border-slate-200">
              <h3 className="font-bold text-slate-900">{modal.mode === 'edit' ? 'Editar Lançamento' : 'Lançamento Manual'}</h3>
              <button onClick={() => setModal(null)} className="text-slate-400 hover:text-slate-600"><X className="h-5 w-5" /></button>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Data</label>
                  <input type="date" value={fDate} onChange={(e) => setFDate(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Tipo</label>
                  <select value={fType} onChange={(e) => setFType(e.target.value as 'C' | 'D')} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white">
                    <option value="C">Crédito (+)</option>
                    <option value="D">Débito (−)</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Descrição</label>
                <input value={fDesc} onChange={(e) => setFDesc(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" placeholder="Ex: Pix recebido - Fulano" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Valor (R$)</label>
                  <input type="number" step="0.01" value={fAmount} onChange={(e) => setFAmount(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Natureza</label>
                  <select value={fNature} onChange={(e) => setFNature(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white">
                    {categories.map((c) => (
                      <option key={c.id} value={c.label}>[{GROUP_STYLE[c.group]?.label}] {c.label}</option>
                    ))}
                  </select>
                </div>
              </div>
              <button onClick={saveModal} disabled={savingModal} className="w-full bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-lg py-2.5 disabled:opacity-50">
                {savingModal ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---------- MODAL: GESTÃO DE NATUREZAS ---------- */}
      {catMgrOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-2xl max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between p-5 border-b border-slate-200">
              <div>
                <h3 className="font-bold text-slate-900 flex items-center gap-2">
                  <Tag className="h-5 w-5 text-teal-600" /> Naturezas (Categorias)
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">{selected.id ? `Personalizadas para ${selected.name}` : 'Gerais do escritório'}</p>
              </div>
              <button onClick={() => setCatMgrOpen(false)} className="text-slate-400 hover:text-slate-600"><X className="h-5 w-5" /></button>
            </div>
            <div className="p-5 overflow-y-auto space-y-4">
              <div className="border border-slate-200 rounded-lg divide-y divide-slate-100 max-h-64 overflow-y-auto">
                {categories.length === 0 && (
                  <div className="p-4 text-center text-slate-400 text-sm">Nenhuma natureza cadastrada.</div>
                )}
                {DRE_GROUPS.map((g) => {
                  const groupCats = categories.filter((c) => c.group === g);
                  if (groupCats.length === 0) return null;
                  const style = GROUP_STYLE[g];
                  return (
                    <div key={g}>
                      <div className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-wide ${style.chip}`}>{style.label}</div>
                      {groupCats.map((c) => (
                        <div key={c.id} className="px-4 py-2 flex items-center justify-between text-sm hover:bg-slate-50">
                          <span className="text-slate-700">{c.label}</span>
                          <div className="flex items-center gap-1">
                            {c.isSystem && <span className="text-[10px] text-slate-400 italic mr-2">sistema</span>}
                            <button onClick={() => openEditCat(c)} className="p-1 text-slate-400 hover:text-teal-600 hover:bg-teal-50 rounded" title="Editar">
                              <Pencil className="h-3.5 w-3.5" />
                            </button>
                            {!c.isSystem && (
                              <button onClick={() => setDeleteCatTarget(c)} className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded" title="Excluir">
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
              <div className="border-t border-slate-200 pt-4">
                <p className="text-sm font-semibold text-slate-700 mb-2">➕ Adicionar nova natureza</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Nome</label>
                    <input value={newCatLabel} onChange={(e) => setNewCatLabel(e.target.value)} placeholder="Ex: Mensalidade, Energia" className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Grupo (DRE)</label>
                    <select value={newCatGroup} onChange={(e) => setNewCatGroup(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white">
                      {DRE_GROUPS.map((g) => <option key={g} value={g}>{GROUP_STYLE[g].label}</option>)}
                    </select>
                  </div>
                </div>
                <button onClick={createCategory} disabled={savingCat || !newCatLabel.trim()} className="mt-3 flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold rounded-lg disabled:opacity-50">
                  {savingCat ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                  {savingCat ? 'Criando...' : 'Criar Natureza'}
                </button>
              </div>
            </div>
            <div className="p-4 border-t border-slate-200 bg-slate-50">
              <button onClick={() => setCatMgrOpen(false)} className="w-full px-4 py-2 border border-slate-300 text-slate-700 font-semibold rounded-lg hover:bg-white">Fechar</button>
            </div>
          </div>
        </div>
      )}

      {/* ---------- MODAL: EDITAR NATUREZA ---------- */}
      {editingCat && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-xl w-full max-w-md">
            <div className="flex items-center justify-between p-5 border-b border-slate-200">
              <h3 className="font-bold text-slate-900 flex items-center gap-2">
                <Pencil className="h-4 w-4 text-teal-600" /> Editar Natureza
              </h3>
              <button onClick={() => setEditingCat(null)} className="text-slate-400 hover:text-slate-600"><X className="h-5 w-5" /></button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Nome</label>
                <input value={editLabel} onChange={(e) => setEditLabel(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Grupo (DRE)</label>
                <select value={editGroup} onChange={(e) => setEditGroup(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white">
                  {DRE_GROUPS.map((g) => <option key={g} value={g}>{GROUP_STYLE[g].label}</option>)}
                </select>
              </div>
              {editingCat.isSystem && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-800">
                  Categoria padrão (sistema). Pode renomear e trocar grupo, mas <strong>não pode excluir</strong>.
                </div>
              )}
              <div className="flex gap-2 pt-2">
                <button onClick={() => setEditingCat(null)} className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 font-semibold rounded-lg hover:bg-slate-50">Cancelar</button>
                <button onClick={saveEditCat} disabled={savingEdit || !editLabel.trim()} className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-lg disabled:opacity-50">
                  {savingEdit ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  Salvar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ---------- MODAL: CONFIRMAR EXCLUSÃO DE NATUREZA ---------- */}
      {deleteCatTarget && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-xl w-full max-w-md p-6">
            <div className="flex items-start gap-3 mb-4">
              <div className="p-2.5 bg-red-50 rounded-full flex-shrink-0"><Trash2 className="h-5 w-5 text-red-600" /></div>
              <div>
                <h3 className="font-bold text-slate-900">Excluir "{deleteCatTarget.label}"?</h3>
                <p className="text-sm text-slate-600 mt-1">Natureza será removida permanentemente.</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setDeleteCatTarget(null)} className="flex-1 px-4 py-2.5 border border-slate-300 text-slate-700 font-semibold rounded-lg hover:bg-slate-50">Cancelar</button>
              <button onClick={confirmDeleteCat} disabled={deletingCat} className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg disabled:opacity-50">
                {deletingCat ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---------- MODAL: DRE (versão modal) ---------- */}
      {dreOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-2xl max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-slate-200 sticky top-0 bg-white">
              <div>
                <h3 className="font-bold text-slate-900">DRE — {MONTH_NAMES[month - 1]}/{year}</h3>
                <p className="text-xs text-slate-500">{selected.name || 'Todos os clientes'}</p>
              </div>
              <button onClick={() => setDreOpen(false)} className="text-slate-400 hover:text-slate-600"><X className="h-5 w-5" /></button>
            </div>
            <div className="p-5">
              <table className="w-full text-sm">
                <tbody>
                  {summary.linhas.map((l) => {
                    const style = GROUP_STYLE[l.group];
                    return (
                      <tr key={l.label} className="border-b border-slate-100">
                        <td className="py-2 text-slate-700 flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${style.dot}`} />
                          <span className="text-[10px] font-bold uppercase text-slate-400">{style.label}</span>
                          <span>{l.label}</span>
                          <span className="text-[10px] text-slate-400">({l.count})</span>
                        </td>
                        <td className={`py-2 text-right font-semibold ${l.total >= 0 ? 'text-green-700' : 'text-red-700'}`}>{formatBRL(l.total)}</td>
                      </tr>
                    );
                  })}
                  <tr className="bg-slate-50 font-bold">
                    <td className="py-2 px-2 text-slate-800">(=) RESULTADO LÍQUIDO</td>
                    <td className={`py-2 px-2 text-right ${summary.resultado >= 0 ? 'text-green-800' : 'text-red-800'}`}>{formatBRL(summary.resultado)}</td>
                  </tr>
                  <tr className="bg-slate-50 font-semibold">
                    <td className="py-2 px-2 text-slate-700 text-xs">Saldo Líquido Sócios (fora do DRE)</td>
                    <td className="py-2 px-2 text-right text-slate-700 text-xs">{formatBRL(summary.saldoSocio)}</td>
                  </tr>
                </tbody>
              </table>
              <div className="flex gap-2 mt-5">
                <button onClick={exportDRE} className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg text-sm">
                  <FileDown className="h-4 w-4" /> Exportar DRE (CSV)
                </button>
                <button onClick={printDRE} className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-900 text-white font-semibold rounded-lg text-sm">
                  <Printer className="h-4 w-4" /> Imprimir
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ---------- MODAL: PROMOVER P/ CONTÁBIL ---------- */}
      {promoteOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-2xl max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between p-5 border-b border-slate-200">
              <div>
                <h3 className="font-bold text-slate-900 flex items-center gap-2">
                  <ArrowRightLeft className="h-5 w-5 text-blue-600" /> Promover p/ Contábil
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">Transforma transações de {MONTH_NAMES[month - 1]}/{year} em lançamentos contábeis.</p>
              </div>
              <button onClick={() => setPromoteOpen(false)} className="text-slate-400 hover:text-slate-600"><X className="h-5 w-5" /></button>
            </div>
            <div className="p-5 overflow-y-auto space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-medium text-slate-700">Conta Bancária (Caixa/Banco) *</label>
                  <button type="button" onClick={() => setCreatingAccount((v) => !v)} className="text-[11px] font-semibold text-blue-600 hover:text-blue-700">
                    {creatingAccount ? 'Cancelar nova conta' : '+ Criar nova conta'}
                  </button>
                </div>
                {creatingAccount && (
                  <div className="mb-2 p-3 bg-blue-50 border border-blue-200 rounded-lg space-y-2">
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="block text-[10px] text-slate-500 mb-0.5">Código</label>
                        <input value={newAccCode} onChange={(e) => setNewAccCode(e.target.value)} placeholder="1.1.2.01" className="w-full px-2 py-1.5 border border-slate-300 rounded text-xs" />
                      </div>
                      <div className="col-span-2">
                        <label className="block text-[10px] text-slate-500 mb-0.5">Nome</label>
                        <input value={newAccName} onChange={(e) => setNewAccName(e.target.value)} placeholder="PAGBANK" className="w-full px-2 py-1.5 border border-slate-300 rounded text-xs" />
                      </div>
                    </div>
                    <button type="button" onClick={createAccountInline} disabled={savingAcc || !newAccCode.trim() || !newAccName.trim()} className="w-full px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded disabled:opacity-50">
                      {savingAcc ? 'Criando...' : 'Salvar conta no Plano de Contas'}
                    </button>
                  </div>
                )}
                <AccountCombobox
                  accounts={accounts}
                  value={bankAccountId}
                  valueKey="id"
                  onSelect={(acc) => setBankAccountId(acc ? acc.id : '')}
                  placeholder="Digite código ou nome da conta bancária..."
                  className="w-full"
                />
                <p className="text-[10px] text-slate-500 mt-1">Esta conta receberá os débitos/créditos. Use "+ Criar nova conta" se não achar.</p>
              </div>
              <div className="border-t pt-4">
                <p className="text-sm font-semibold text-slate-700 mb-2">Mapeamento de Naturezas → Contas Contábeis</p>
                <p className="text-[11px] text-slate-500 mb-3">Cada natureza será debitada/creditada na conta escolhida.</p>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {categories.map((cat) => {
                    const style = GROUP_STYLE[cat.group];
                    return (
                      <div key={cat.id} className="flex items-center gap-3 py-1">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${style.chip} whitespace-nowrap`}>{style.label}</span>
                        <span className="text-sm text-slate-700 w-40 truncate" title={cat.label}>{cat.label}</span>
                        <AccountCombobox
                          accounts={accounts}
                          value={accountMapping[cat.label] || ''}
                          valueKey="code"
                          onSelect={(acc) => setAccountMapping({ ...accountMapping, [cat.label]: acc ? acc.code : '' })}
                          placeholder="Código ou nome..."
                          className="flex-1"
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-800">
                <strong>Idempotência:</strong> transações já promovidas serão ignoradas (sem duplicação).
              </div>
            </div>
            <div className="flex gap-2 p-5 border-t border-slate-200 bg-slate-50">
              <button onClick={() => setPromoteOpen(false)} className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 font-semibold rounded-lg hover:bg-white">Cancelar</button>
              <button onClick={confirmPromote} disabled={promoting || !bankAccountId} className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg disabled:opacity-50">
                {promoting ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRightLeft className="h-4 w-4" />}
                {promoting ? 'Promovendo...' : 'Promover'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---------- MODAL: RELATÓRIO POR NATUREZA ---------- */}
      {reportOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-2xl max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-slate-200 sticky top-0 bg-white">
              <div>
                <h3 className="font-bold text-slate-900">Relatório por Natureza — {MONTH_NAMES[month - 1]}/{year}</h3>
                <p className="text-xs text-slate-500">{selected.name || 'Cliente'} • confronto com DRE</p>
              </div>
              <button onClick={() => setReportOpen(false)} className="text-slate-400 hover:text-slate-600"><X className="h-5 w-5" /></button>
            </div>
            <div className="p-5">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-left text-slate-500">
                    <th className="py-2 font-medium">Natureza</th>
                    <th className="py-2 font-medium text-center">Qtd</th>
                    <th className="py-2 font-medium text-right">Subtotal</th>
                  </tr>
                </thead>
                {reportByGroup.map((g) => {
                  const style = GROUP_STYLE[g.group];
                  return (
                    <tbody key={g.group}>
                      <tr className="bg-teal-600 text-white">
                        <td className="py-1.5 px-2 font-bold uppercase text-xs">{style.label}</td>
                        <td></td>
                        <td></td>
                      </tr>
                      {g.linhas.map((l) => (
                        <tr key={l.label} className="border-b border-slate-100">
                          <td className="py-2 pl-6 text-slate-700">{l.label}</td>
                          <td className="py-2 text-center text-slate-500">{l.count}</td>
                          <td className={`py-2 text-right font-semibold ${l.total >= 0 ? 'text-green-700' : 'text-red-700'}`}>{formatBRL(l.total)}</td>
                        </tr>
                      ))}
                      <tr className="bg-slate-50 font-bold border-b border-slate-200">
                        <td className="py-2 px-2">Subtotal — {style.label}</td>
                        <td className="py-2 text-center">{g.count}</td>
                        <td className={`py-2 px-2 text-right ${g.subtotal >= 0 ? 'text-green-800' : 'text-red-800'}`}>{formatBRL(g.subtotal)}</td>
                      </tr>
                    </tbody>
                  );
                })}
                <tfoot>
                  <tr className="bg-slate-100 font-bold">
                    <td className="py-2 px-2">(=) RESULTADO LÍQUIDO</td>
                    <td></td>
                    <td className={`py-2 px-2 text-right ${summary.resultado >= 0 ? 'text-green-800' : 'text-red-800'}`}>{formatBRL(summary.resultado)}</td>
                  </tr>
                  <tr className="font-semibold">
                    <td className="py-2 px-2 text-xs text-slate-600">Saldo Líquido Sócios (fora do DRE)</td>
                    <td></td>
                    <td className="py-2 px-2 text-right text-slate-700 text-xs">{formatBRL(summary.saldoSocio)}</td>
                  </tr>
                </tfoot>
              </table>
              <div className="flex gap-2 mt-5">
                <button onClick={exportReport} className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg text-sm">
                  <FileDown className="h-4 w-4" /> Exportar CSV
                </button>
                <button onClick={printReport} className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-900 text-white font-semibold rounded-lg text-sm">
                  <Printer className="h-4 w-4" /> Imprimir
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ---------- MODAL: CONFIRMAR EXCLUSÃO (transação/mês) ---------- */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md p-6">
            <h3 className="font-bold text-slate-900">
              {deleteTarget.kind === 'tx' ? 'Excluir esta transação?' : 'Excluir a importação do mês?'}
            </h3>
            <p className="text-sm text-slate-600 mt-2">
              {deleteTarget.kind === 'tx' ? 'Transação será removida.' : 'Todas as transações serão removidas. Irreversível.'}
            </p>
            <div className="flex gap-2 mt-6">
              <button onClick={() => setDeleteTarget(null)} className="flex-1 px-4 py-2.5 border border-slate-300 text-slate-700 font-semibold rounded-lg hover:bg-slate-50">Cancelar</button>
              <button onClick={confirmDelete} disabled={deleting} className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg disabled:opacity-50">
                {deleting ? 'Excluindo...' : 'Excluir'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}