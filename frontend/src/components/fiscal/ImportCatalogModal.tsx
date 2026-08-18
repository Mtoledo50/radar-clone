'use client';

/**
 * =================================================================
 * 📦 ImportCatalogModal — Importação de Catálogo Permanente (Sprint F8)
 * =================================================================
 * ADR-043: importa planilha CSV (descrição + código) para criar/atualizar
 * produtos permanentes do cliente.
 * 
 * - Produtos existentes recebem unifiedCode (sem sobrescrever code)
 * - Produtos novos são criados com estoque 0
 * - Conflitos (mesma descrição → 2 códigos) → fila de revisão
 * 
 * Padrão seguido: UnifyCodesModal.tsx (Sprint 19)
 * =================================================================
 */

import { useState } from 'react';
import { toast } from 'sonner';
import { X, Loader2, Upload, CheckCircle2, AlertTriangle, HelpCircle } from 'lucide-react';
import api from '@/lib/axios';
import { useFiscalClientStore } from '@/store/fiscalClientStore';
import { parseCatalogCsv, CatalogRow } from '@/lib/parseCatalogCsv';

interface Props {
  open: boolean;
  onClose: () => void;
  onImported: () => void;
}

export default function ImportCatalogModal({ open, onClose, onImported }: Props) {
  const { selected } = useFiscalClientStore();

  const [csvName, setCsvName] = useState('');
  const [rows, setRows] = useState<CatalogRow[]>([]);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<{
    created: number;
    updated: number;
    skipped: number;
    conflicts: { description: string; codes: string[] }[];
  } | null>(null);

  const handleFile = async (file: File | null) => {
    if (!file) return;
    try {
      const text = await file.text();
      const parsed = parseCatalogCsv(text);
      setRows(parsed);
      setCsvName(file.name);
      setResult(null);
      toast.success(`${parsed.length} linha(s) da planilha carregada(s).`);
    } catch (e: any) {
      toast.error(e.message || 'Erro ao ler CSV.');
    }
  };

  const confirmImport = async () => {
    if (rows.length === 0) return;
    setImporting(true);
    try {
      const { data } = await api.post('/fiscal/inventory/import-catalog', {
        clientId: selected.id || null,
        items: rows,
      });
      setResult(data);
      toast.success(
        `Catálogo importado: ${data.created} criado(s), ${data.updated} atualizado(s), ${data.skipped} ignorado(s)` +
          (data.conflicts?.length ? `, ${data.conflicts.length} conflito(s).` : '.'),
      );
      if (data.created > 0 || data.updated > 0) {
        onImported();
      }
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Erro ao importar catálogo.');
    } finally {
      setImporting(false);
    }
  };

  const handleClose = () => {
    setCsvName('');
    setRows([]);
    setResult(null);
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-3xl max-h-[90vh] flex flex-col">
        {/* Cabeçalho */}
        <div className="flex items-center justify-between p-5 border-b border-slate-200">
          <div>
            <h3 className="font-bold text-slate-900 flex items-center gap-2">
              <Upload className="h-5 w-5 text-teal-600" />
              Importar Catálogo Permanente
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {selected.id ? `Cliente: ${selected.name}` : 'Catálogo geral (sem cliente)'}
              {' • '}Produtos novos serão criados com <strong>estoque 0</strong>
            </p>
          </div>
          <button onClick={handleClose} className="text-slate-400 hover:text-slate-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Corpo */}
        <div className="p-5 overflow-y-auto space-y-4">
          {/* Upload */}
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">
              1. CSV do catálogo (colunas: Descrição; Código)
            </label>
            <input
              type="file"
              accept=".csv,.txt"
              onChange={(e) => handleFile(e.target.files?.[0] || null)}
              disabled={importing}
              className="block w-full text-sm text-slate-600 file:mr-3 file:px-4 file:py-2 file:rounded-lg file:border-0 file:bg-teal-50 file:text-teal-700 file:font-medium file:cursor-pointer hover:file:bg-teal-100"
            />
            {csvName && <p className="text-xs text-teal-700 mt-1">Planilha: {csvName}</p>}
          </div>

          {/* Preview antes de confirmar */}
          {rows.length > 0 && !result && (
            <>
              <div className="bg-teal-50 border border-teal-200 rounded-lg p-3">
                <p className="text-sm font-medium text-teal-900 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4" />
                  {rows.length} produto(s) pronto(s) para importar
                </p>
                <p className="text-xs text-teal-700 mt-1">
                  Produtos existentes receberão o código unificado; novos serão criados com estoque 0.
                </p>
              </div>

              <div className="border border-slate-200 rounded-lg max-h-64 overflow-y-auto">
                <table className="w-full text-xs">
                  <thead className="bg-slate-50 sticky top-0">
                    <tr className="text-left text-slate-500">
                      <th className="py-2 px-3 font-medium">Descrição</th>
                      <th className="py-2 px-3 font-medium w-32">Código</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.slice(0, 20).map((r, i) => (
                      <tr key={i} className="border-t border-slate-100">
                        <td className="py-1.5 px-3 text-slate-700 max-w-[300px] truncate">
                          {r.description}
                        </td>
                        <td className="py-1.5 px-3 font-bold text-teal-700">{r.code}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {rows.length > 20 && (
                  <p className="text-xs text-slate-500 text-center py-2">
                    ...e mais {rows.length - 20} produto(s)
                  </p>
                )}
              </div>
            </>
          )}

          {/* Resultado após confirmar */}
          {result && (
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center">
                  <p className="text-xl font-bold text-green-700 flex items-center justify-center gap-1">
                    <CheckCircle2 className="h-5 w-5" /> {result.created}
                  </p>
                  <p className="text-xs text-green-700">Criados (estoque 0)</p>
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-center">
                  <p className="text-xl font-bold text-blue-700 flex items-center justify-center gap-1">
                    <Upload className="h-5 w-5" /> {result.updated}
                  </p>
                  <p className="text-xs text-blue-700">Atualizados</p>
                </div>
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-center">
                  <p className="text-xl font-bold text-slate-600 flex items-center justify-center gap-1">
                    <HelpCircle className="h-5 w-5" /> {result.skipped}
                  </p>
                  <p className="text-xs text-slate-600">Ignorados (já existiam)</p>
                </div>
              </div>

              {result.conflicts.length > 0 && (
                <div>
                  <h4 className="text-sm font-bold text-amber-700 mb-2 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" />
                    {result.conflicts.length} conflito(s) detectado(s)
                  </h4>
                  <p className="text-xs text-amber-700 mb-2">
                    Mesma descrição com códigos diferentes — revise manualmente:
                  </p>
                  <div className="border border-amber-200 rounded-lg max-h-40 overflow-y-auto bg-amber-50/40">
                    <table className="w-full text-xs">
                      <tbody>
                        {result.conflicts.map((c, i) => (
                          <tr key={i} className="border-t border-amber-100">
                            <td className="py-1.5 px-3 text-slate-700 max-w-[300px] truncate">
                              {c.description}
                            </td>
                            <td className="py-1.5 px-3 text-amber-700">
                              Códigos: {c.codes.join(', ')}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Rodapé */}
        <div className="flex gap-2 p-5 border-t border-slate-200">
          {result ? (
            <button
              onClick={handleClose}
              className="flex-1 px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-lg transition-colors"
            >
              Fechar
            </button>
          ) : (
            <>
              <button
                onClick={handleClose}
                className="flex-1 px-4 py-2.5 border border-slate-300 text-slate-700 font-semibold rounded-lg hover:bg-slate-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={confirmImport}
                disabled={importing || rows.length === 0}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50"
              >
                {importing && <Loader2 className="h-4 w-4 animate-spin" />}
                {importing ? 'Importando...' : 'Confirmar Importação'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}