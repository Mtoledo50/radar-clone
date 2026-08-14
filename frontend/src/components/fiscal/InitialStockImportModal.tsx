'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import {
  FileUp,
  X,
  ClipboardPaste,
  FileSpreadsheet,
  Loader2,
  Trash2,
  Plus,
  CheckCircle2,
} from 'lucide-react';
import api from '@/lib/axios';
import { useFiscalClientStore } from '@/store/fiscalClientStore';
import {
  InitialStockItem,
  parsePastedStockText,
  parseStockCsv,
} from '@/lib/parseInitialStock';

/**
 * =================================================================
 * 📥 InitialStockImportModal — Importação de Estoque Inicial
 * =================================================================
 * Fluxo em 2 etapas (segurança enterprise):
 *   1. PARSE: cola o texto do relatório (PDF) ou envia um CSV
 *      → parser best-effort gera linhas candidatas
 *   2. REVISÃO: tabela editável (código, descrição, un, qtd, custo)
 *      → usuário confere/corrige/remove antes de gravar
 *
 * 🛡️ Regras:
 *   - Respeita o cliente selecionado no seletor (clientId)
 *   - Data-base padrão 31/12/2025 (editável)
 *   - Itens com saldo 0 são ocultados por padrão (toggle inclui)
 *   - Backend aplica regras anti-duplicidade (SALDO_INICIAL)
 * =================================================================
 */
interface Props {
  onClose: () => void;
  onImported: () => void; // recarrega estoque/KPIs após sucesso
}

export default function InitialStockImportModal({ onClose, onImported }: Props) {
  const { selected } = useFiscalClientStore();

  // Etapa 1: entrada de dados
  const [tab, setTab] = useState<'paste' | 'csv'>('paste');
  const [pastedText, setPastedText] = useState('');
  const [csvText, setCsvText] = useState('');
  const [csvName, setCsvName] = useState('');
  const [includeZeros, setIncludeZeros] = useState(false);
  const [referenceDate, setReferenceDate] = useState('2025-12-31');

  // Etapa 2: revisão
  const [items, setItems] = useState<InitialStockItem[]>([]);
  const [reviewing, setReviewing] = useState(false);
  const [importing, setImporting] = useState(false);

  // ---------------------------------------------------------------
  // 📥 Leitura do arquivo CSV (texto puro, sem upload ao servidor)
  // ---------------------------------------------------------------
  const handleCsvFile = async (file: File | null) => {
    if (!file) return;
    const text = await file.text();
    setCsvText(text);
    setCsvName(file.name);
  };

  // ---------------------------------------------------------------
  // 🔍 Etapa 1 → 2: processar o texto e abrir a revisão
  // ---------------------------------------------------------------
    const handleProcess = () => {
    // 🔄 HOTFIX BUILD: Os parsers agora retornam { items, skipped }.
    // Desestruturamos para pegar o array de itens e a métrica de linhas puladas.
    const result =
      tab === 'paste' ? parsePastedStockText(pastedText) : parseStockCsv(csvText);
    
    let parsed: InitialStockItem[] = result.items;
    const skippedCount = result.skipped ?? 0; // 🔒 Defensivo: garante número

    // ... resto do código continua igual
    // Filtro de saldo zero (ruído de relatório) — opcional via toggle
    if (!includeZeros) {
      parsed = parsed.filter((i) => i.quantity !== 0);
    }

    if (parsed.length === 0) {
      toast.error(
        'Nenhuma linha reconhecida. Verifique o formato (código + descrição + 3 números) ou use CSV.',
      );
      return;
    }

    setItems(parsed);
    setReviewing(true);
    toast.success(`${parsed.length} linha(s) carregada(s) para revisão.`);
  };

  // ---------------------------------------------------------------
  // ✏️ Edição na tabela de revisão
  // ---------------------------------------------------------------
  const updateItem = (key: string, patch: Partial<InitialStockItem>) => {
    setItems((prev) => prev.map((i) => (i.key === key ? { ...i, ...patch } : i)));
  };

  const removeItem = (key: string) => {
    setItems((prev) => prev.filter((i) => i.key !== key));
  };

  const addRow = () => {
    setItems((prev) => [
      ...prev,
      {
        key: `manual-${Date.now()}`,
        code: '',
        description: '',
        unit: 'UN',
        quantity: 0,
        averageCost: 0,
        totalCost: 0, // 🆕 ADICIONE ESTA LINHA
      },
    ]);
  };

  // Valor total do inventário em revisão (soma qtd × custo)
  const totalValue = items.reduce((s, i) => s + i.quantity * i.averageCost, 0);

  // ---------------------------------------------------------------
  // 🚀 Etapa 2 → backend: confirmar importação
  // ---------------------------------------------------------------
  const handleConfirm = async () => {
    const valid = items.filter((i) => i.code.trim() && i.description.trim());
    if (valid.length === 0) {
      toast.error('Nenhum item válido (código e descrição obrigatórios).');
      return;
    }

    setImporting(true);
    try {
      const { data } = await api.post('/fiscal/inventory/initial-import', {
        clientId: selected.id || null,
        referenceDate,
        items: valid.map((i) => ({
          code: i.code.trim(),
          description: i.description.trim(),
          ncm: i.ncm,
          unit: i.unit,
          quantity: Number(i.quantity) || 0,
          averageCost: Number(i.averageCost) || 0,
        })),
      });

      toast.success(
        `Estoque inicial importado: ${data.created} criado(s), ${data.updated} atualizado(s), ${data.skipped} ignorado(s).`,
      );
      onImported();
      onClose();
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Erro na importação do estoque inicial.');
    } finally {
      setImporting(false);
    }
  };

  // ---------------------------------------------------------------
  // 🎨 Renderização
  // ---------------------------------------------------------------
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-5xl max-h-[90vh] flex flex-col">
        {/* ================= Cabeçalho ================= */}
        <div className="flex items-center justify-between p-5 border-b border-slate-200">
          <div>
            <h3 className="font-bold text-slate-900 flex items-center gap-2">
              <FileUp className="h-5 w-5 text-teal-600" />
              Importar Estoque Inicial
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {selected.id
                ? `Destino: ${selected.name}`
                : 'Destino: catálogo geral (todos os clientes)'}
            </p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* ================= Corpo (rolável) ================= */}
        <div className="p-5 overflow-y-auto space-y-4">
          {/* Controles: data-base + toggle zeros */}
          <div className="flex flex-wrap items-center gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">
                Data-base do inventário
              </label>
              <input
                type="date"
                value={referenceDate}
                onChange={(e) => setReferenceDate(e.target.value)}
                className="border border-slate-300 rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer mt-5">
              <input
                type="checkbox"
                checked={includeZeros}
                onChange={(e) => setIncludeZeros(e.target.checked)}
                className="rounded border-slate-300 text-teal-600 focus:ring-teal-500"
              />
              Incluir itens com saldo zero
            </label>
          </div>

          {/* ============ Etapa 1: entrada (se ainda não revisando) ============ */}
          {!reviewing && (
            <>
              {/* Abas: colar texto | CSV */}
              <div className="flex gap-2">
                <button
                  onClick={() => setTab('paste')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
                    tab === 'paste'
                      ? 'border-teal-500 bg-teal-50 text-teal-700'
                      : 'border-slate-300 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <ClipboardPaste className="h-4 w-4" />
                  Colar texto do relatório (PDF)
                </button>
                <button
                  onClick={() => setTab('csv')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
                    tab === 'csv'
                      ? 'border-teal-500 bg-teal-50 text-teal-700'
                      : 'border-slate-300 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <FileSpreadsheet className="h-4 w-4" />
                  Arquivo CSV
                </button>
              </div>

              {tab === 'paste' ? (
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">
                    Cole aqui o texto copiado do PDF (Ctrl+A → Ctrl+C no relatório)
                  </label>
                  <textarea
                    value={pastedText}
                    onChange={(e) => setPastedText(e.target.value)}
                    rows={10}
                    placeholder={'845701 ABRAÇADEIRA GRANDE P/ ROLO DE VINIL 6,83 21,00 143,45\n390 VINIL BRANCO BRILHO 0,08 120GR 1,06 X 50M- SEIWA 242,33 20,00 4.846,60'}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">
                    Selecione o CSV exportado do sistema anterior
                  </label>
                  <input
                    type="file"
                    accept=".csv,.txt"
                    onChange={(e) => handleCsvFile(e.target.files?.[0] || null)}
                    className="block w-full text-sm text-slate-600 file:mr-3 file:px-4 file:py-2 file:rounded-lg file:border-0 file:bg-teal-50 file:text-teal-700 file:font-medium file:cursor-pointer hover:file:bg-teal-100"
                  />
                  {csvName && (
                    <p className="text-xs text-teal-700 mt-1">Arquivo carregado: {csvName}</p>
                  )}
                </div>
              )}

              <button
                onClick={handleProcess}
                disabled={tab === 'paste' ? !pastedText.trim() : !csvText.trim()}
                className="w-full flex items-center justify-center gap-2 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-lg py-2.5 transition-colors disabled:opacity-50"
              >
                <FileUp className="h-4 w-4" />
                Processar e revisar
              </button>
            </>
          )}

          {/* ============ Etapa 2: tabela de revisão ============ */}
          {reviewing && (
            <>
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-slate-700 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-teal-600" />
                  Revise e corrija antes de importar ({items.length} linha(s))
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setReviewing(false)}
                    className="text-sm text-slate-500 hover:text-slate-700 px-2"
                  >
                    ← Voltar
                  </button>
                  <button
                    onClick={addRow}
                    className="flex items-center gap-1 text-sm text-teal-700 hover:bg-teal-50 px-2 py-1 rounded"
                  >
                    <Plus className="h-4 w-4" />
                    Adicionar linha
                  </button>
                </div>
              </div>

              <div className="border border-slate-200 rounded-lg overflow-x-auto max-h-96 overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 sticky top-0">
                    <tr className="text-left text-slate-500">
                      <th className="py-2 px-2 font-medium w-32">Código</th>
                      <th className="py-2 px-2 font-medium">Descrição</th>
                      <th className="py-2 px-2 font-medium w-16">Un</th>
                      <th className="py-2 px-2 font-medium w-24">Qtd</th>
                      <th className="py-2 px-2 font-medium w-28">Custo Médio</th>
                      <th className="py-2 px-2 font-medium w-10"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((i) => (
                      <tr key={i.key} className="border-t border-slate-100">
                        <td className="py-1.5 px-2">
                          <input
                            value={i.code}
                            onChange={(e) => updateItem(i.key, { code: e.target.value })}
                            className="w-full px-2 py-1 border border-slate-200 rounded text-xs"
                          />
                        </td>
                        <td className="py-1.5 px-2">
                          <input
                            value={i.description}
                            onChange={(e) => updateItem(i.key, { description: e.target.value })}
                            className="w-full px-2 py-1 border border-slate-200 rounded text-xs"
                          />
                        </td>
                        <td className="py-1.5 px-2">
                          <input
                            value={i.unit}
                            onChange={(e) => updateItem(i.key, { unit: e.target.value })}
                            className="w-full px-2 py-1 border border-slate-200 rounded text-xs"
                          />
                        </td>
                        <td className="py-1.5 px-2">
                          <input
                            type="number"
                            step="any"
                            value={i.quantity}
                            onChange={(e) =>
                              updateItem(i.key, { quantity: parseFloat(e.target.value) || 0 })
                            }
                            className="w-full px-2 py-1 border border-slate-200 rounded text-xs"
                          />
                        </td>
                        <td className="py-1.5 px-2">
                          <input
                            type="number"
                            step="any"
                            value={i.averageCost}
                            onChange={(e) =>
                              updateItem(i.key, { averageCost: parseFloat(e.target.value) || 0 })
                            }
                            className="w-full px-2 py-1 border border-slate-200 rounded text-xs"
                          />
                        </td>
                        <td className="py-1.5 px-2 text-center">
                          <button
                            onClick={() => removeItem(i.key)}
                            className="p-1 text-slate-400 hover:text-red-600"
                            title="Remover linha"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <p className="text-sm text-slate-600 text-right">
                Valor total do inventário:{' '}
                <span className="font-bold text-teal-700">
                  {totalValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </span>
              </p>
            </>
          )}
        </div>

        {/* ================= Rodapé ================= */}
        {reviewing && (
          <div className="flex gap-2 p-5 border-t border-slate-200">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-slate-300 text-slate-700 font-semibold rounded-lg hover:bg-slate-50"
            >
              Cancelar
            </button>
            <button
              onClick={handleConfirm}
              disabled={importing || items.length === 0}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-lg disabled:opacity-50"
            >
              {importing && <Loader2 className="h-4 w-4 animate-spin" />}
              {importing ? 'Importando...' : `Importar ${items.length} item(ns)`}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}