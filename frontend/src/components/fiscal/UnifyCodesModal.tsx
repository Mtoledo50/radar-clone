'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import {
  X,
  FileUp,
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
 * 🔀 UnifyCodesModal — Unificação de Códigos via Planilha (Sprint 14)
 * =================================================================
 * Fluxo em 3 etapas (segurança enterprise):
 *   1. Carrega o catálogo de produtos do escopo selecionado
 *   2. Parser do CSV: coluna E (descrição) + W (código unificado)
 *      → casa por descrição NORMALIZADA (maiúsculas, sem acentos)
 *   3. Revisão: ✅ casados | ⚠️ conflitos | ❌ não encontrados
 *      → confirmação → POST unify-codes
 *
 * 🛡️ O histórico das notas NÃO é reescrito (auditoria preservada).
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
}

interface UnmatchedRow {
  desc: string;
  newCode: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  onApplied: () => void;
}

/** Normaliza descrição para casamento: maiúsculas, sem acentos,
 *  pontuação virada espaço, espaços comprimidos. */
const normalize = (s: string) =>
  (s || '')
    .toUpperCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^A-Z0-9]+/g, ' ')
    .trim();

export default function UnifyCodesModal({ open, onClose, onApplied }: Props) {
  const { selected } = useFiscalClientStore();

  const [products, setProducts] = useState<ProductLite[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);

  const [csvName, setCsvName] = useState('');
  const [parsed, setParsed] = useState(false);
  const [matched, setMatched] = useState<MatchRow[]>([]);
  const [collisions, setCollisions] = useState<MatchRow[]>([]);
  const [unmatched, setUnmatched] = useState<UnmatchedRow[]>([]);
  const [applying, setApplying] = useState(false);

  // ---------------------------------------------------------------
  // 📥 Carrega o catálogo do escopo selecionado ao abrir
  // ---------------------------------------------------------------
  useEffect(() => {
    if (!open) return;
    setParsed(false);
    setMatched([]);
    setCollisions([]);
    setUnmatched([]);
    setCsvName('');

    const load = async () => {
      setLoadingProducts(true);
      try {
        const { data } = await api.get('/fiscal/inventory/balance', {
          params: {
            page: 1,
            limit: 100000,
            clientId: selected.id || undefined,
          },
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
  // 📄 Parser do CSV + casamento por descrição normalizada
  // ---------------------------------------------------------------
  const handleFile = async (file: File | null) => {
    if (!file) return;
    const text = await file.text();
    const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    if (lines.length < 2) {
      toast.error('CSV vazio ou sem linhas de dados.');
      return;
    }

    // Detecção de separador na 1ª linha
    const first = lines[0];
    const sep = [';', '\t', ','].reduce(
      (best, s) => (first.split(s).length > first.split(best).length ? s : best),
      ';',
    );
    const split = (line: string) =>
      line.split(sep).map((c) => c.trim().replace(/^"|"$/g, ''));

    // Localiza colunas pelo cabeçalho (fallback: E=4, W=22)
    const header = split(first).map(normalize);
    let descIdx = header.findIndex((h) => h.includes('DESCRICAO'));
    let codeIdx = header.findIndex((h) => h.includes('CODIGO UNIFICADO'));
    if (descIdx < 0) descIdx = 4;   // coluna E
    if (codeIdx < 0) codeIdx = 22;  // coluna W

    // Índices de casamento: descrição normalizada → produto
    const byNorm = new Map<string, ProductLite>();
    for (const p of products) {
      const key = normalize(p.description);
      if (key && !byNorm.has(key)) byNorm.set(key, p);
    }
    const usedCodes = new Set(products.map((p) => p.code));
    const targetCodes = new Set<string>(); // anti-colisão dentro do próprio lote

    const m: MatchRow[] = [];
    const c: MatchRow[] = [];
    const u: UnmatchedRow[] = [];

    for (let i = 1; i < lines.length; i++) {
      const cols = split(lines[i]);
      const desc = cols[descIdx] || '';
      const newCode = (cols[codeIdx] || '').trim();
      if (!desc || !newCode) continue;

      const product = byNorm.get(normalize(desc));
      if (!product) {
        u.push({ desc, newCode });
        continue;
      }
      // Conflito: código já usado por OUTRO produto ou duplicado no lote
      if (
        (usedCodes.has(newCode) && product.code !== newCode) ||
        targetCodes.has(newCode)
      ) {
        c.push({ product, newCode, csvDesc: desc });
        continue;
      }
      targetCodes.add(newCode);
      m.push({ product, newCode, csvDesc: desc });
    }

    setMatched(m);
    setCollisions(c);
    setUnmatched(u);
    setCsvName(file.name);
    setParsed(true);
    toast.success(
      `Planilha processada: ${m.length} casado(s), ${c.length} conflito(s), ${u.length} não encontrado(s).`,
    );
  };

  // ---------------------------------------------------------------
  // 🚀 Aplica a unificação (apenas os casados)
  // ---------------------------------------------------------------
  const confirmApply = async () => {
    if (matched.length === 0) return;
    setApplying(true);
    try {
      const { data } = await api.post('/fiscal/inventory/unify-codes', {
        items: matched.map((r) => ({
          productId: r.product.id,
          newCode: r.newCode,
        })),
      });
      toast.success(
        `Unificação concluída: ${data.updated} código(s) atualizado(s)` +
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
              Casa a descrição (coluna E) e aplica o Código Unificado (coluna W).
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

          {/* Upload do CSV */}
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">
              1. Selecione o CSV com o mapeamento (coluna E = descrição, W = código unificado)
            </label>
            <input
              type="file"
              accept=".csv,.txt"
              onChange={(e) => handleFile(e.target.files?.[0] || null)}
              disabled={loadingProducts}
              className="block w-full text-sm text-slate-600 file:mr-3 file:px-4 file:py-2 file:rounded-lg file:border-0 file:bg-teal-50 file:text-teal-700 file:font-medium file:cursor-pointer hover:file:bg-teal-100"
            />
            {csvName && (
              <p className="text-xs text-teal-700 mt-1">Planilha carregada: {csvName}</p>
            )}
          </div>

          {/* Resumo do casamento */}
          {parsed && (
            <>
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center">
                  <p className="text-xl font-bold text-green-700 flex items-center justify-center gap-1">
                    <CheckCircle2 className="h-5 w-5" /> {matched.length}
                  </p>
                  <p className="text-xs text-green-700">Casados (serão atualizados)</p>
                </div>
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-center">
                  <p className="text-xl font-bold text-amber-700 flex items-center justify-center gap-1">
                    <AlertTriangle className="h-5 w-5" /> {collisions.length}
                  </p>
                  <p className="text-xs text-amber-700">Conflitos (não aplicados)</p>
                </div>
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-center">
                  <p className="text-xl font-bold text-slate-600 flex items-center justify-center gap-1">
                    <HelpCircle className="h-5 w-5" /> {unmatched.length}
                  </p>
                  <p className="text-xs text-slate-600">Não encontrados no catálogo</p>
                </div>
              </div>

              {/* Tabela de casados */}
              {matched.length > 0 && (
                <div>
                  <h4 className="text-sm font-bold text-slate-700 mb-2">
                    ✅ Códigos que serão substituídos
                  </h4>
                  <div className="border border-slate-200 rounded-lg max-h-64 overflow-y-auto">
                    <table className="w-full text-xs">
                      <thead className="bg-slate-50 sticky top-0">
                        <tr className="text-left text-slate-500">
                          <th className="py-2 px-3 font-medium">Produto</th>
                          <th className="py-2 px-3 font-medium">Código Atual</th>
                          <th className="py-2 px-3 font-medium">→ Código Unificado</th>
                        </tr>
                      </thead>
                      <tbody>
                        {matched.map((r) => (
                          <tr key={r.product.id} className="border-t border-slate-100">
                            <td className="py-1.5 px-3 text-slate-700 max-w-[320px] truncate">
                              {r.product.description}
                            </td>
                            <td className="py-1.5 px-3 font-medium text-red-600">
                              {r.product.code}
                            </td>
                            <td className="py-1.5 px-3 font-bold text-green-700">
                              {r.newCode}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Conflitos */}
              {collisions.length > 0 && (
                <div>
                  <h4 className="text-sm font-bold text-amber-700 mb-2">
                    ⚠️ Conflitos — código unificado já em uso (não serão aplicados)
                  </h4>
                  <div className="border border-amber-200 rounded-lg max-h-40 overflow-y-auto bg-amber-50/40">
                    <table className="w-full text-xs">
                      <tbody>
                        {collisions.map((r, i) => (
                          <tr key={i} className="border-t border-amber-100">
                            <td className="py-1.5 px-3 text-slate-700 max-w-[320px] truncate">
                              {r.product.description}
                            </td>
                            <td className="py-1.5 px-3 text-amber-700">
                              {r.product.code} → {r.newCode}
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
                    ❌ Descrições da planilha sem produto correspondente
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
            {applying ? 'Aplicando...' : `Aplicar ${matched.length} código(s)`}
          </button>
        </div>
      </div>
    </div>
  );
}