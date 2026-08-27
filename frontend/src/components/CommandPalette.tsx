/**
 * =================================================================
 * CommandPalette — Command + K (Fase E — ADR-091)
 * =================================================================
 * Modal de busca rápida por páginas e ações. Abre com Ctrl+K / Cmd+K.
 * Navegação por teclado: ↑↓ para navegar, Enter para abrir, Esc para fechar.
 * Histórico das últimas 5 páginas visitadas aparece no topo.
 * =================================================================
 */
'use client';

import { useEffect, useState, useRef, useMemo } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import {
  Search,
  LayoutDashboard,
  Building2,
  Users,
  UsersRound,
  FolderKanban,
  Calculator,
  CalendarDays,
  Receipt,
  Wallet,
  BookOpen,
  Bot,
  FileText,
  Scale,
  Landmark,
  Building,
  AlertTriangle,
  Activity,
  Gauge,
  Telescope,
  Trophy,
  Shield,
  X,
  ArrowRight,
  Clock,
  Zap,
} from 'lucide-react';

// =================================================================
// Catálogo de páginas e ações rápidas
// =================================================================
interface PaletteItem {
  id: string;
  title: string;
  section: string;
  href: string;
  icon: any;
  type: 'page' | 'action';
  keywords?: string[];
}

const PAGES: PaletteItem[] = [
  { id: 'dashboard', title: 'Dashboard', section: 'Operacional', href: '/dashboard', icon: LayoutDashboard, type: 'page' },
  { id: 'minha-empresa', title: 'Minha Empresa', section: 'Operacional', href: '/dashboard/minha-empresa', icon: Building2, type: 'page' },
  { id: 'pessoas', title: 'Colaboradores', section: 'Operacional', href: '/dashboard/pessoas', icon: Users, type: 'page' },
  { id: 'turnover', title: 'Turnover', section: 'Operacional', href: '/dashboard/turnover', icon: Users, type: 'page' },
  { id: 'benchmark', title: 'Benchmark de Cargos', section: 'Operacional', href: '/dashboard/pessoas/benchmark', icon: Users, type: 'page' },
  { id: 'clientes', title: 'Carteira de Clientes', section: 'Operacional', href: '/dashboard/clientes', icon: UsersRound, type: 'page' },
  { id: 'projetos', title: 'Projetos', section: 'Operacional', href: '/dashboard/projetos', icon: FolderKanban, type: 'page' },
  { id: 'tarefas', title: 'Tarefas', section: 'Operacional', href: '/dashboard/tarefas', icon: FolderKanban, type: 'page' },
  { id: 'precificacao', title: 'Precificação', section: 'Comercial', href: '/dashboard/precificacao', icon: Calculator, type: 'page' },
  { id: 'meus-planos', title: 'Meus Planos', section: 'Comercial', href: '/dashboard/precificacao/meus-planos', icon: Calculator, type: 'page' },
  { id: 'desempenho', title: 'Desempenho Comercial', section: 'Comercial', href: '/dashboard/precificacao/desempenho', icon: Calculator, type: 'page' },
  { id: 'planejamento', title: 'Planejamento', section: 'Comercial', href: '/dashboard/planejamento', icon: CalendarDays, type: 'page' },
  { id: 'fiscal', title: 'Importar NF-e', section: 'Fiscal', href: '/dashboard/fiscal', icon: Receipt, type: 'page' },
  { id: 'notas', title: 'Notas Fiscais', section: 'Fiscal', href: '/dashboard/fiscal/notas', icon: Receipt, type: 'page' },
  { id: 'estoque', title: 'Estoque', section: 'Fiscal', href: '/dashboard/fiscal/estoque', icon: Receipt, type: 'page' },
  { id: 'apuracao', title: 'Apuração ICMS', section: 'Fiscal', href: '/dashboard/fiscal/apuracao', icon: Receipt, type: 'page' },
  { id: 'sped', title: 'SPED Fiscal', section: 'Fiscal', href: '/dashboard/fiscal/sped', icon: Receipt, type: 'page' },
  { id: 'fechamento', title: 'Fechamento + DRE Bancário', section: 'Bancário', href: '/dashboard/fechamento', icon: Wallet, type: 'page' },
  { id: 'lancamentos', title: 'Lançamentos Contábeis', section: 'Contábil', href: '/dashboard/lancamentos', icon: BookOpen, type: 'page' },
  { id: 'plano-contas', title: 'Plano de Contas', section: 'Contábil', href: '/dashboard/contabil/plano-contas', icon: BookOpen, type: 'page' },
  { id: 'ciclo-contabil', title: 'Ciclo Contábil', section: 'Contábil', href: '/dashboard/contabil/ciclo-contabil', icon: BookOpen, type: 'page' },
  { id: 'aurora', title: 'Dashboard da Aurora', section: 'Inteligência', href: '/dashboard/funcionario-digital', icon: Bot, type: 'page' },
  { id: 'aprovacoes', title: 'Central de Aprovações', section: 'Inteligência', href: '/dashboard/funcionario-digital/aprovacoes', icon: Bot, type: 'page' },
  { id: 'relatorios', title: 'Relatórios Mensais', section: 'Inteligência', href: '/dashboard/funcionario-digital/relatorios', icon: FileText, type: 'page' },
  { id: 'nfse', title: 'NFS-e', section: 'Inteligência', href: '/dashboard/funcionario-digital/nfse', icon: Receipt, type: 'page' },
  { id: 'guias', title: 'Guias de Imposto', section: 'Inteligência', href: '/dashboard/funcionario-digital/guias', icon: Scale, type: 'page' },
  { id: 'legalizacao', title: 'Legalização & Cofre', section: 'Inteligência', href: '/dashboard/funcionario-digital/legalizacao', icon: Shield, type: 'page' },
  { id: 'cobranca', title: 'Cobrança & CNAB', section: 'Inteligência', href: '/dashboard/funcionario-digital/cobranca', icon: Landmark, type: 'page' },
  { id: 'bi', title: 'DRE do Escritório', section: 'Inteligência', href: '/dashboard/bi', icon: Building, type: 'page' },
  { id: 'dre-cliente', title: 'DRE do Cliente', section: 'Inteligência', href: '/dashboard/bi/dre-cliente', icon: BookOpen, type: 'page' },
  { id: 'ponto-fora', title: 'Ponto Fora da Curva', section: 'Inteligência', href: '/dashboard/ponto-fora-da-curva', icon: AlertTriangle, type: 'page' },
  { id: 'indicadores', title: 'Indicadores', section: 'Inteligência', href: '/dashboard/indicadores', icon: Activity, type: 'page' },
  { id: 'indicadores-custom', title: 'Indicadores Customizados', section: 'Inteligência', href: '/dashboard/indicadores-custom', icon: Calculator, type: 'page' },
  { id: 'score', title: 'Score do Escritório', section: 'Inteligência', href: '/dashboard/score', icon: Gauge, type: 'page' },
  { id: 'mentoria', title: 'Visão de Futuro', section: 'Inteligência', href: '/dashboard/mentoria', icon: Telescope, type: 'page' },
  { id: 'ranking', title: 'Ranking de Níveis', section: 'Inteligência', href: '/dashboard/ranking', icon: Trophy, type: 'page' },
  { id: 'tributario', title: 'Planejamento Tributário', section: 'Inteligência', href: '/dashboard/planejamento-tributario', icon: Scale, type: 'page' },
  { id: 'reforma', title: 'Reforma Tributária', section: 'Inteligência', href: '/dashboard/reforma-tributaria', icon: Scale, type: 'page' },
  { id: 'admin', title: 'Administração', section: 'Sistema', href: '/dashboard/admin', icon: Shield, type: 'page' },
];

const ACTIONS: PaletteItem[] = [
  { id: 'new-client', title: 'Novo Cliente', section: 'Ações Rápidas', href: '/dashboard/clientes', icon: UsersRound, type: 'action', keywords: ['criar', 'cadastrar'] },
  { id: 'new-proposal', title: 'Nova Proposta', section: 'Ações Rápidas', href: '/dashboard/precificacao', icon: Calculator, type: 'action', keywords: ['criar', 'venda'] },
  { id: 'new-task', title: 'Nova Tarefa', section: 'Ações Rápidas', href: '/dashboard/tarefas', icon: FolderKanban, type: 'action', keywords: ['criar'] },
  { id: 'new-billing', title: 'Nova Cobrança', section: 'Ações Rápidas', href: '/dashboard/funcionario-digital/cobranca', icon: Landmark, type: 'action', keywords: ['boleto', 'criar'] },
  { id: 'run-aurora', title: 'Executar Régua Agora', section: 'Ações Rápidas', href: '/dashboard/funcionario-digital/cobranca', icon: Zap, type: 'action', keywords: ['aurora', 'régua'] },
];

// =================================================================
// Componente principal
// =================================================================
export default function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [history, setHistory] = useState<string[]>([]);
  const router = useRouter();
  const pathname = usePathname();
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Atalho Ctrl+K / Cmd+K
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setOpen((v) => !v);
      }
      if (e.key === 'Escape' && open) {
        setOpen(false);
        setQuery('');
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open]);

  // Carrega histórico do localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('command-palette-history');
      if (saved) setHistory(JSON.parse(saved));
    } catch {}
  }, []);

  // Salva página atual no histórico
  useEffect(() => {
    if (!pathname || pathname === '/login') return;
    setHistory((prev) => {
      const filtered = prev.filter((p) => p !== pathname);
      const next = [pathname, ...filtered].slice(0, 5);
      localStorage.setItem('command-palette-history', JSON.stringify(next));
      return next;
    });
  }, [pathname]);

  // Filtragem fuzzy simples (case-insensitive, busca em título + keywords)
  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    const all = [...ACTIONS, ...PAGES];
    if (!q) return all;
    return all.filter((item) => {
      const inTitle = item.title.toLowerCase().includes(q);
      const inKeywords = item.keywords?.some((k) => k.includes(q));
      const inSection = item.section.toLowerCase().includes(q);
      return inTitle || inKeywords || inSection;
    });
  }, [query]);

  // Histórico filtrado (só aparece se query vazia)
  const historyItems = useMemo(() => {
    if (query) return [];
    return history
      .map((href) => PAGES.find((p) => p.href === href))
      .filter(Boolean) as PaletteItem[];
  }, [query, history]);

  // Lista combinada: histórico (se vazio) + filtrados
  const displayList = query ? filtered : historyItems.length > 0 ? [...historyItems, ...filtered] : filtered;

  // Reset do índice quando a lista muda
  useEffect(() => {
    setSelectedIndex(0);
  }, [displayList.length]);

  // Navegação por teclado
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((i) => (i + 1) % displayList.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((i) => (i - 1 + displayList.length) % displayList.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const item = displayList[selectedIndex];
      if (item) {
        router.push(item.href);
        setOpen(false);
        setQuery('');
      }
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header com busca */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-200">
          <Search className="h-5 w-5 text-slate-400" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Buscar páginas, ações..."
            className="flex-1 bg-transparent outline-none text-slate-900 placeholder-slate-400"
            autoFocus
          />
          <button
            onClick={() => { setOpen(false); setQuery(''); }}
            className="p-1 text-slate-400 hover:text-slate-700"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Lista de resultados */}
        <div ref={listRef} className="max-h-[60vh] overflow-y-auto py-2">
          {displayList.length === 0 && (
            <div className="px-4 py-8 text-center text-slate-500 text-sm">
              Nenhum resultado para "{query}"
            </div>
          )}

          {historyItems.length > 0 && !query && (
            <div className="mb-2">
              <div className="px-4 py-1 text-xs font-semibold text-slate-500 uppercase flex items-center gap-1">
                <Clock className="h-3 w-3" /> Visitadas recentemente
              </div>
              {historyItems.map((item, i) => (
                <PaletteRow
                  key={`h-${item.id}`}
                  item={item}
                  selected={selectedIndex === i}
                  onClick={() => {
                    router.push(item.href);
                    setOpen(false);
                  }}
                  onMouseEnter={() => setSelectedIndex(i)}
                />
              ))}
              <div className="border-t border-slate-100 my-2" />
            </div>
          )}

          {filtered.map((item, i) => {
            const realIndex = query ? i : historyItems.length + i;
            return (
              <PaletteRow
                key={item.id}
                item={item}
                selected={selectedIndex === realIndex}
                onClick={() => {
                  router.push(item.href);
                  setOpen(false);
                  setQuery('');
                }}
                onMouseEnter={() => setSelectedIndex(realIndex)}
              />
            );
          })}
        </div>

        {/* Footer com dicas */}
        <div className="px-4 py-2 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1"><Kbd>↑↓</Kbd> navegar</span>
            <span className="flex items-center gap-1"><Kbd>↵</Kbd> abrir</span>
            <span className="flex items-center gap-1"><Kbd>esc</Kbd> fechar</span>
          </div>
          <span className="text-slate-400">Command Palette • Fase E</span>
        </div>
      </div>
    </div>
  );
}

// =================================================================
// Linha individual da paleta
// =================================================================
function PaletteRow({
  item,
  selected,
  onClick,
  onMouseEnter,
}: {
  item: PaletteItem;
  selected: boolean;
  onClick: () => void;
  onMouseEnter: () => void;
}) {
  const Icon = item.icon;
  return (
    <button
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
        selected ? 'bg-teal-50 text-teal-900' : 'text-slate-700 hover:bg-slate-50'
      }`}
    >
      <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${
        selected ? 'bg-teal-100 text-teal-700' : 'bg-slate-100 text-slate-600'
      }`}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-medium text-sm truncate">{item.title}</div>
        <div className="text-xs text-slate-500 truncate">{item.section}</div>
      </div>
      {item.type === 'action' && (
        <Zap className={`h-4 w-4 ${selected ? 'text-teal-600' : 'text-orange-500'}`} />
      )}
      {item.type === 'page' && (
        <ArrowRight className={`h-4 w-4 ${selected ? 'text-teal-600' : 'text-slate-400'}`} />
      )}
    </button>
  );
}

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="px-1.5 py-0.5 rounded bg-slate-200 text-slate-700 font-mono text-[10px]">
      {children}
    </kbd>
  );
}