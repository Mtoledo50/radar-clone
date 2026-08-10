'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import {
  X,
  Loader2,
  Shuffle,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
} from 'lucide-react';
import api from '@/lib/axios';
import { useFiscalClientStore } from '@/store/fiscalClientStore';

/**
 * =================================================================
 * 🔀 UnifyCodesModal — Código Unificado via Planilha
 * =================================================================
 * Sprint 18: casamento por similaridade (Dice sobre tokens).
 * 🆕 Sprint 19:
 *   - Limiar a partir de 10%
 *   - NÃO altera o código do catálogo: grava o Código Unificado
 *     na coluna extra `unifiedCode`
 *   - Conflitos de "código já em uso" deixam de existir (sem constraint)
 *
 * 🛡️ Segurança: usuário revisa tudo (tabela com % de match) antes
 * de aplicar; backend valida posse + transação atômica.
 * =================================================================
 */
interface ProductLite {
  id: string;
  code: string;
  description: string;
}

interface MatchRow {
  product: ProductLite;
  newCode: string;
  csvDesc: string;
  score: number;
}

interface CsvRow {
  desc: string;
  newCode: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  onApplied: () => void;
}

/** Normaliza: maiúsculas, sem acentos, pontuação → espaço */
const normalize = (s: string) =>
  (s || '')
    .toUpperCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^A-Z0-9]+/g, ' ')
    .trim();

/** Tokens significativos (descarta palavras de 1–2 letras) */
const tokenize = (s: string) =>
  normalize(s)
    .split(' ')
    .filter((t) => t.length > 2);

const countInter = (tokens: string[], set: Set<string>) => {
  let n = 0;
  for (const t of tokens) if (set.has(t)) n++;
  return n;
};

export default function UnifyCodesModal({ open, onClose, onApplied }: Props) {
  const { selected } = useFiscalClientStore();

  const [products, setProducts] = useState<ProductLite[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);

  const [csvName, setCsvName] = useState('');
  const [csvRows, setCsvRows] = useState<CsvRow[]>([]);
  const [threshold, setThreshold] = useState(40);

  const [matched, setMatched] = useState<MatchRow[]>([]);
  const [duplicates, setDuplicates] = useState<MatchRow[]>([]);
  const [unmatched, setUnmatched] = useState<CsvRow[]>([]);
  const [applying, setApplying] = useState(false);

  // ---------------------------------------------------------------
  // 📥 Carrega o catálogo do escopo selecionado
  // ---------------------------------------------------------------
  useEffect(() => {
    if (!open) return;
    setCsvRows([]);
    setCsvName('');
    setMatched([]);
    setDuplicates([]);
    setUnmatched([]);

    const load = async () => {
      setLoadingProducts(true);
      try {
        const { data } = await api.get('/fiscal/inventory/balance', {
          params: { page: 1, limit: 100000, clientId: selected.id || undefined },
        });
        setProducts(
          (data.data || []).map((p: any) => ({
            id: p.id,
            code: p.code,
            description: p.description,
          })),
        );
      } catch {
        toast.error('Erro ao carregar o catálogo de produtos.');
      } finally {
        setLoadingProducts(false);
      }
    };
    load();
  }, [open, selected.id]);

  // ---------------------------------------------------------------
  // 📄 Parser do CSV (coluna E = descrição, W = código unificado)
  // ---------------------------------------------------------------
  const handleFile = async (file: File | null) => {
    if (!file) return;
    const text = await file.text();
    const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    if (lines.length < 2) {
      toast.error('CSV vazio ou sem linhas de dados.');
      return;
    }

    const first = lines[0];
    const sep = [';', '\t', ','].reduce(
      (best, s) => (first.split(s).length > first.split(best).length ? s : best),
      ';',
    );
    const split = (line: string) =>
      line.split(sep).map((c) => c.trim().replace(/^"|"$/g, ''));

    const header = split(first).map(normalize);
    let descIdx = header.findIndex((h) => h.includes('DESCRICAO'));
    let codeIdx = header.findIndex((h) => h.includes('CODIGO UNIFICADO'));
    if (descIdx < 0) descIdx = 4;
    if (codeIdx < 0) codeIdx = 22;

    const rows: CsvRow[] = [];
    for (let i = 1; i < lines.length; i++) {
      const cols = split(lines[i]);
      const desc = cols[descIdx] || '';
      const newCode = (cols[codeIdx] || '').trim();
      if (desc && newCode) rows.push({ desc, newCode });
    }

    setCsvRows(rows);
    setCsvName(file.name);
    toast.success(`${rows.length} linha(s) da planilha carregada(s).`);
  };

  // ---------------------------------------------------------------
  // 🧠 Motor de casamento: idêntico OU similaridade ≥ limiar
  // 🆕 Sprint 19: sem bloqueio por "código já em uso" — o código
  // unificado vai para coluna extra (unifiedCode), não substitui code.
  // ---------------------------------------------------------------
  useEffect(() => {
    if (csvRows.length === 0 || products.length === 0) return;

    const candidates = products.map((p) => {
      const tokens = tokenize(p.description);
      return { p, tokens, set: new Set(tokens), norm: normalize(p.description) };
    });

    const min = threshold / 100;
    const m: MatchRow[] = [];
    const d: MatchRow[] = [];
    const u: CsvRow[] = [];
    const usedProducts = new Set<string>();

    for (const row of csvRows) {
      const rowNorm = normalize(row.desc);

      // 1) Caminho rápido: descrição idêntica
      let bestProd: ProductLite | null = null;
      let bestScore = 0;
      const exact = candidates.find((cd) => cd.norm === rowNorm);
      if (exact) {
        bestProd = exact.p;
        bestScore = 1;
      } else {
        // 2) Fuzzy: Dice sobre tokens com poda
        const rowTokens = tokenize(row.desc);
        const rowSet = new Set(rowTokens);
        if (rowTokens.length > 0) {
          for (const cd of candidates) {
            if (cd.tokens.length === 0) continue;
            const smaller =
              rowTokens.length <= cd.tokens.length ? rowTokens : cd.tokens;
            const otherSet =
              rowTokens.length <= cd.tokens.length ? cd.set : rowSet;
            let share = false;
            for (const t of smaller) {
              if (otherSet.has(t)) {
                share = true;
                break;
              }
            }
            if (!share) continue;

            const inter = countInter(rowTokens, cd.set);
            const score = (2 * inter) / (rowTokens.length + cd.tokens.length);
            if (score > bestScore) {
              bestScore = score;
              bestProd = cd.p;
            }
          }
        }
      }

      // 3) Classifica
      if (!bestProd || bestScore < min) {
        u.push(row);
        continue;
      }
      if (usedProducts.has(bestProd.id)) {
        d.push({ product: bestProd, newCode: row.newCode, csvDesc: row.desc, score: bestScore });
        continue;
      }
      usedProducts.add(bestProd.id);
      m.push({ product: bestProd, newCode: row.newCode, csvDesc: row.desc, score: bestScore });
    }

    setMatched(m);
    setDuplicates(d);
    setUnmatched(u);
  }, [csvRows, threshold, products]);

  // ---------------------------------------------------------------
  // 🚀 Aplica: grava unifiedCode (NÃO toca no code)
  // ---------------------------------------------------------------
  const confirmApply = async () => {
    if (matched.length === 0) return;
    setApplying(true);
    try {
      const { data } = await api.post('/fiscal/inventory/unify-codes', {
        items: matched.map((r) => ({ productId: r.product.id, newCode: r.newCode })),
      });
      toast.success(
        `Código Unificado adicionado a ${data.updated} produto(s)` +
          (data.skipped?.length ? `, ${data.skipped.length} ignorado(s).` : '.'),
      );
      onApplied();
      onClose();
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Erro na unificação de códigos.');
    } finally {
      setApplying(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Cabeçalho */}
        <div className="flex items-center justify-between p-5 border-b border-slate-200">
          <div>
            <h3 className="font-bold text-slate-900 flex items-center gap-2">
              <Shuffle className="h-5 w-5 text-teal-600" />
              Unificar Códigos pela Planilha
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {selected.id ? `Escopo: ${selected.name}` : 'Escopo: todos os clientes'} •
              Similaridade ≥ {threshold}% •{' '}
              <strong>Não altera o código</strong> — adiciona a coluna "Cód. Unificado".
            </p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Corpo */}
        <div className="p-5 overflow-y-auto space-y-4">
          {loadingProducts && (
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <Loader2 className="h-4 w-4 animate-spin" /> Carregando catálogo...
            </div>
          )}

          {/* Upload + limiar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">
                1. CSV da planilha (coluna E = descrição, W = código unificado)
              </label>
              <input
                type="file"
                accept=".csv,.txt"
                onChange={(e) => handleFile(e.target.files?.[0] || null)}
                disabled={loadingProducts}
                className="block w-full text-sm text-slate-600 file:mr-3 file:px-4 file:py-2 file:rounded-lg file:border-0 file:bg-teal-50 file:text-teal-700 file:font-medium file:cursor-pointer hover:file:bg-teal-100"
              />
              {csvName && <p className="text-xs text-teal-700 mt-1">Planilha: {csvName}</p>}
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">
                2. Similaridade mínima para casar
              </label>
              <select
                value={threshold}
                onChange={(e) => setThreshold(Number(e.target.value))}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white"
              >
                <option value={10}>10% — máximo alcance (revise com atenção)</option>
                <option value={20}>20% — muito abrangente</option>
                <option value={30}>30% — abrangente</option>
                <option value={40}>40% — padrão</option>
                <option value={50}>50% — equilibrado</option>
                <option value={60}>60% — rigoroso</option>
                <option value={70}>70% — muito rigoroso</option>
                <option value={80}>80% — quase idêntico</option>
              </select>
              <p className="text-[10px] text-slate-400 mt-1">
                Recalcula na hora — revise o % de cada casamento na tabela.
              </p>
            </div>
          </div>

          {/* Resumo */}
          {csvRows.length > 0 && (
            <>
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center">
                  <p className="text-xl font-bold text-green-700 flex items-center justify-center gap-1">
                    <CheckCircle2 className="h-5 w-5" /> {matched.length}
                  </p>
                  <p className="text-xs text-green-700">Casados (receberão Cód. Unificado)</p>
                </div>
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-center">
                  <p className="text-xl font-bold text-amber-700 flex items-center justify-center gap-1">
                    <AlertTriangle className="h-5 w-5" /> {duplicates.length}
                  </p>
                  <p className="text-xs text-amber-700">Duplicados na planilha</p>
                </div>
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-center">
                  <p className="text-xl font-bold text-slate-600 flex items-center justify-center gap-1">
                    <HelpCircle className="h-5 w-5" /> {unmatched.length}
                  </p>
                  <p className="text-xs text-slate-600">Abaixo do limiar / não encontrados</p>
                </div>
              </div>

              {/* Casados */}
              {matched.length > 0 && (
                <div>
                  <h4 className="text-sm font-bold text-slate-700 mb-2">
                    ✅ Produtos que receberão o Código Unificado (coluna extra)
                  </h4>
                  <div className="border border-slate-200 rounded-lg max-h-64 overflow-y-auto">
                    <table className="w-full text-xs">
                      <thead className="bg-slate-50 sticky top-0">
                        <tr className="text-left text-slate-500">
                          <th className="py-2 px-3 font-medium">Produto (catálogo)</th>
                          <th className="py-2 px-3 font-medium">Código (mantido)</th>
                          <th className="py-2 px-3 font-medium">+ Cód. Unificado</th>
                          <th className="py-2 px-3 font-medium text-center">Match</th>
                        </tr>
                      </thead>
                      <tbody>
                        {matched.map((r) => (
                          <tr key={r.product.id} className="border-t border-slate-100">
                            <td className="py-1.5 px-3 text-slate-700 max-w-[300px] truncate">
                              {r.product.description}
                            </td>
                            <td className="py-1.5 px-3 font-medium text-slate-600">
                              {r.product.code || '—'}
                            </td>
                            <td className="py-1.5 px-3 font-bold text-teal-700">{r.newCode}</td>
                            <td className="py-1.5 px-3 text-center">
                              <span
                                className={`px-1.5 py-0.5 rounded font-bold ${
                                  r.score >= 0.99
                                    ? 'bg-green-100 text-green-700'
                                    : r.score >= 0.7
                                      ? 'bg-teal-50 text-teal-700'
                                      : r.score >= 0.4
                                        ? 'bg-amber-50 text-amber-700'
                                        : 'bg-red-50 text-red-700'
                                }`}
                              >
                                {Math.round(r.score * 100)}%
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Duplicados */}
              {duplicates.length > 0 && (
                <div>
                  <h4 className="text-sm font-bold text-amber-700 mb-2">
                    ⚠️ Duplicados — produto já casado por outra linha da planilha
                  </h4>
                  <div className="border border-amber-200 rounded-lg max-h-40 overflow-y-auto bg-amber-50/40">
                    <table className="w-full text-xs">
                      <tbody>
                        {duplicates.map((r, i) => (
                          <tr key={i} className="border-t border-amber-100">
                            <td className="py-1.5 px-3 text-slate-700 max-w-[300px] truncate">
                              {r.product.description}
                            </td>
                            <td className="py-1.5 px-3 text-amber-700">
                              {r.csvDesc} → {r.newCode}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Não encontrados */}
              {unmatched.length > 0 && (
                <div>
                  <h4 className="text-sm font-bold text-slate-600 mb-2">
                    ❌ Sem match ≥ {threshold}%
                  </h4>
                  <div className="border border-slate-200 rounded-lg max-h-40 overflow-y-auto">
                    <table className="w-full text-xs">
                      <tbody>
                        {unmatched.map((r, i) => (
                          <tr key={i} className="border-t border-slate-100">
                            <td className="py-1.5 px-3 text-slate-600 max-w-[380px] truncate">
                              {r.desc}
                            </td>
                            <td className="py-1.5 px-3 text-slate-500">{r.newCode}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Rodapé */}
        <div className="flex gap-2 p-5 border-t border-slate-200">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 border border-slate-300 text-slate-700 font-semibold rounded-lg hover:bg-slate-50"
          >
            Cancelar
          </button>
          <button
            onClick={confirmApply}
            disabled={applying || matched.length === 0}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-lg disabled:opacity-50"
          >
            {applying && <Loader2 className="h-4 w-4 animate-spin" />}
            {applying ? 'Aplicando...' : `Adicionar Cód. Unificado a ${matched.length} produto(s)`}
          </button>
        </div>
      </div>
    </div>
  );
}