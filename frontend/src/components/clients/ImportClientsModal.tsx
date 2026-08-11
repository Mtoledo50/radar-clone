'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { X, Upload, Loader2, Users } from 'lucide-react';
import api from '@/lib/axios';
import { parseClientsCsv, ParsedClient } from '@/lib/parseClientsCsv';

/**
 * 📥 ImportClientsModal — revisão + confirmação da carteira (Sprint 23)
 */
interface Props {
  onClose: () => void;
  onImported: () => void;
}

const formatBRL = (v: number | null) =>
  (v ?? 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const formatDate = (d: string | null) =>
  d ? new Date(d).toLocaleDateString('pt-BR') : '—';

export default function ImportClientsModal({ onClose, onImported }: Props) {
  const [rows, setRows] = useState<ParsedClient[]>([]);
  const [fileName, setFileName] = useState('');
  const [importing, setImporting] = useState(false);

  const handleFile = async (file: File | null) => {
    if (!file) return;
    try {
      const text = await file.text();
      const parsed = parseClientsCsv(text);
      if (parsed.rows.length === 0) {
        toast.error('Nenhum cliente válido no CSV.');
        return;
      }
      setRows(parsed.rows);
      setFileName(file.name);
      toast.success(`${parsed.rows.length} cliente(s) carregado(s) para revisão.`);
    } catch (e: any) {
      toast.error(e.message || 'Erro ao ler o CSV.');
    }
  };

  const confirmImport = async () => {
    setImporting(true);
    try {
      const { data } = await api.post('/clients/import', { items: rows });
      toast.success(
        `Importação concluída: ${data.created} criado(s), ${data.updated} atualizado(s).`,
      );
      onImported();
      onClose();
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Erro ao importar clientes.');
    } finally {
      setImporting(false);
    }
  };

  const totalFee = rows.reduce((s, r) => s + (r.monthlyFee || 0), 0);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-5 border-b border-slate-200">
          <div>
            <h3 className="font-bold text-slate-900 flex items-center gap-2">
              <Users className="h-5 w-5 text-teal-600" />
              Importar Clientes (CSV)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Reimportar atualiza clientes existentes (não duplica).
            </p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-5 overflow-y-auto space-y-4">
          <input
            type="file"
            accept=".csv,.txt"
            onChange={(e) => handleFile(e.target.files?.[0] || null)}
            className="block w-full text-sm text-slate-600 file:mr-3 file:px-4 file:py-2 file:rounded-lg file:border-0 file:bg-teal-50 file:text-teal-700 file:font-medium file:cursor-pointer hover:file:bg-teal-100"
          />
          {fileName && <p className="text-xs text-teal-700">Planilha: {fileName}</p>}

          {rows.length > 0 && (
            <>
              <div className="bg-teal-50 border border-teal-200 rounded-lg p-3 text-sm text-teal-900">
                <strong>{rows.length}</strong> cliente(s) • Honorários totais:{' '}
                <strong>{formatBRL(totalFee)}/mês</strong>
              </div>

              <div className="border border-slate-200 rounded-lg max-h-72 overflow-y-auto">
                <table className="w-full text-xs whitespace-nowrap">
                  <thead className="bg-slate-50 sticky top-0">
                    <tr className="text-left text-slate-500">
                      <th className="py-2 px-3 font-medium">Cliente</th>
                      <th className="py-2 px-3 font-medium">Início</th>
                      <th className="py-2 px-3 font-medium">Término</th>
                      <th className="py-2 px-3 font-medium text-right">Honorário</th>
                      <th className="py-2 px-3 font-medium text-right">Em Aberto</th>
                      <th className="py-2 px-3 font-medium text-right">Vencido</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r, i) => (
                      <tr key={i} className="border-t border-slate-100">
                        <td className="py-1.5 px-3 text-slate-700 max-w-[260px] truncate">
                          {r.companyName}
                        </td>
                        <td className="py-1.5 px-3 text-slate-600">{formatDate(r.startDate)}</td>
                        <td className="py-1.5 px-3 text-slate-600">{formatDate(r.endDate)}</td>
                        <td className="py-1.5 px-3 text-right font-medium text-slate-800">
                          {formatBRL(r.monthlyFee)}
                        </td>
                        <td className="py-1.5 px-3 text-right text-amber-700">
                          {formatBRL(r.openAmount)}
                        </td>
                        <td className="py-1.5 px-3 text-right text-red-700">
                          {formatBRL(r.overdueAmount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>

        <div className="flex gap-2 p-5 border-t border-slate-200">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 border border-slate-300 text-slate-700 font-semibold rounded-lg hover:bg-slate-50"
          >
            Cancelar
          </button>
          <button
            onClick={confirmImport}
            disabled={importing || rows.length === 0}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-lg disabled:opacity-50"
          >
            {importing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            {importing ? 'Importando...' : `Importar ${rows.length} cliente(s)`}
          </button>
        </div>
      </div>
    </div>
  );
}