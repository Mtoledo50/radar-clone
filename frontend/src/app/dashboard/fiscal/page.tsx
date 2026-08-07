'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import {
  Upload,
  FileText,
  X,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Inbox,
  Receipt,
} from 'lucide-react';
import api from '@/lib/axios';

// =================================================================
// 📦 Tipos do módulo fiscal (frontend)
// =================================================================
interface UploadResult {
  fileName: string;
  status: 'PROCESSED' | 'ERROR';
  accessKey?: string;
  invoiceId?: string;
  items?: number;
  totalValue?: number;
  error?: string;
}

interface Invoice {
  id: string;
  number: string;
  series: string;
  emissionDate: string;
  status: string;
  totalValue: number;
  supplier: { id: string; name: string; cnpj: string };
  _count: { items: number };
}

const formatBRL = (v: number) =>
  Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const formatDate = (d: string) => new Date(d).toLocaleDateString('pt-BR');

// =================================================================
// 📄 Página: Importação de NF-e (Upload de XML)
// =================================================================
export default function FiscalUploadPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [results, setResults] = useState<UploadResult[] | null>(null);
  const [recent, setRecent] = useState<Invoice[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Carrega últimas notas importadas
  const loadRecent = useCallback(async () => {
    try {
      const { data } = await api.get('/fiscal/invoices', {
        params: { limit: 10 },
      });
      setRecent(data.data || []);
    } catch {
      // silencioso — lista recente é complementar
    }
  }, []);

  useEffect(() => {
    loadRecent();
  }, [loadRecent]);

  // ---------------------------------------------------------------
  // 📥 Seleção de arquivos (input + drag & drop)
  // ---------------------------------------------------------------
  const addFiles = (list: FileList | null) => {
    if (!list) return;
    const xmls = Array.from(list).filter(
      (f) => f.name.toLowerCase().endsWith('.xml'),
    );
    const rejected = list.length - xmls.length;

    if (rejected > 0) {
      toast.error(`${rejected} arquivo(s) ignorado(s) — apenas .xml são aceitos.`);
    }
    if (xmls.length > 0) {
      setFiles((prev) => {
        const names = new Set(prev.map((p) => p.name));
        return [...prev, ...xmls.filter((f) => !names.has(f.name))];
      });
    }
  };

  const removeFile = (name: string) =>
    setFiles((prev) => prev.filter((f) => f.name !== name));

  // ---------------------------------------------------------------
  // 🚀 Upload para o backend
  // ---------------------------------------------------------------
  const handleUpload = async () => {
    if (files.length === 0) return;

    setUploading(true);
    setResults(null);

    try {
      const form = new FormData();
      files.forEach((f) => form.append('files', f));

      const { data } = await api.post('/fiscal/invoices/upload', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setResults(data.results);

      if (data.processed > 0) {
        toast.success(`${data.processed} nota(s) importada(s) com sucesso!`);
      }
      if (data.errors > 0) {
        toast.error(`${data.errors} arquivo(s) com erro — veja o detalhamento.`);
      }

      setFiles([]);
      loadRecent();
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Erro no upload dos XMLs.');
    } finally {
      setUploading(false);
    }
  };

  // ---------------------------------------------------------------
  // 🎨 Renderização
  // ---------------------------------------------------------------
  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <Receipt className="h-7 w-7 text-teal-600" />
          Importação de NF-e
        </h1>
        <p className="text-slate-600 mt-1">
          Envie os XMLs de compra para alimentar o estoque fiscal e a apuração de ICMS.
        </p>
      </div>

      {/* Zona de Upload */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragActive(true);
          }}
          onDragLeave={() => setDragActive(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragActive(false);
            addFiles(e.dataTransfer.files);
          }}
          onClick={() => inputRef.current?.click()}
          className={`
            border-2 border-dashed rounded-xl p-10 text-center cursor-pointer
            transition-colors
            ${dragActive ? 'border-teal-500 bg-teal-50' : 'border-slate-300 hover:border-teal-400 hover:bg-slate-50'}
          `}
        >
          <Upload className="h-10 w-10 text-teal-600 mx-auto mb-3" />
          <p className="font-semibold text-slate-700">
            Arraste os XMLs aqui ou clique para selecionar
          </p>
          <p className="text-sm text-slate-500 mt-1">
            Até 50 arquivos por envio • Somente .xml
          </p>
          <input
            ref={inputRef}
            type="file"
            accept=".xml"
            multiple
            className="hidden"
            onChange={(e) => {
              addFiles(e.target.files);
              e.target.value = '';
            }}
          />
        </div>

        {/* Arquivos selecionados */}
        {files.length > 0 && (
          <div className="mt-4 space-y-2">
            {files.map((f) => (
              <div
                key={f.name}
                className="flex items-center justify-between bg-slate-50 rounded-lg px-4 py-2"
              >
                <div className="flex items-center gap-2 text-sm text-slate-700">
                  <FileText className="h-4 w-4 text-teal-600" />
                  {f.name}
                </div>
                <button
                  onClick={() => removeFile(f.name)}
                  className="text-slate-400 hover:text-red-600"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}

            <button
              onClick={handleUpload}
              disabled={uploading}
              className="w-full flex items-center justify-center gap-2 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-lg py-3 transition-colors disabled:opacity-50"
            >
              {uploading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Upload className="h-5 w-5" />
              )}
              {uploading ? 'Processando...' : `Importar ${files.length} arquivo(s)`}
            </button>
          </div>
        )}
      </div>

      {/* Resultado do processamento */}
      {results && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h3 className="font-bold text-slate-900 mb-4">Resultado da Importação</h3>
          <div className="space-y-2">
            {results.map((r, i) => (
              <div
                key={i}
                className={`flex items-start gap-3 rounded-lg px-4 py-3 ${
                  r.status === 'PROCESSED' ? 'bg-green-50' : 'bg-red-50'
                }`}
              >
                {r.status === 'PROCESSED' ? (
                  <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                )}
                <div className="text-sm">
                  <p className="font-medium text-slate-800">{r.fileName}</p>
                  {r.status === 'PROCESSED' ? (
                    <p className="text-slate-600">
                      {r.items} item(ns) • Total {formatBRL(r.totalValue || 0)}
                    </p>
                  ) : (
                    <p className="text-red-700">{r.error}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Últimas notas importadas */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h3 className="font-bold text-slate-900 mb-4">Últimas Notas Importadas</h3>

        {recent.length === 0 ? (
          <div className="text-center py-10 text-slate-400">
            <Inbox className="h-10 w-10 mx-auto mb-2" />
            <p className="text-sm">Nenhuma nota importada ainda.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-slate-500">
                  <th className="py-2 pr-4 font-medium">NF-e</th>
                  <th className="py-2 pr-4 font-medium">Fornecedor</th>
                  <th className="py-2 pr-4 font-medium">Emissão</th>
                  <th className="py-2 pr-4 font-medium text-center">Itens</th>
                  <th className="py-2 font-medium text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {recent.map((inv) => (
                  <tr key={inv.id} className="border-b border-slate-100">
                    <td className="py-3 pr-4 font-medium text-slate-800">
                      #{inv.number} / série {inv.series}
                    </td>
                    <td className="py-3 pr-4 text-slate-600">{inv.supplier?.name}</td>
                    <td className="py-3 pr-4 text-slate-600">
                      {formatDate(inv.emissionDate)}
                    </td>
                    <td className="py-3 pr-4 text-center text-slate-600">
                      {inv._count?.items}
                    </td>
                    <td className="py-3 text-right font-semibold text-slate-800">
                      {formatBRL(inv.totalValue)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}