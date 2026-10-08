'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Upload, FileSpreadsheet, Loader2, CheckCircle2, AlertTriangle } from 'lucide-react';
import api from '@/lib/axios';

export default function ImportClientsPage() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleImport = async () => {
    if (!file) {
      toast.error('Selecione um arquivo CSV primeiro.');
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const { data } = await api.post('/clients/import-csv', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setResult(data);
      toast.success(data.message);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erro na importação do CSV.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <FileSpreadsheet className="text-[#0d9488]" /> Importar Clientes em Massa (S3D)
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          Importe a base completa de clientes e seus múltiplos contatos a partir do CSV exportado.
        </p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">
        <input
          type="file"
          accept=".csv"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          className="hidden"
          id="csv-upload"
        />
        <label
          htmlFor="csv-upload"
          className="cursor-pointer flex flex-col items-center justify-center gap-3 p-8 border-2 border-dashed border-slate-300 rounded-lg hover:border-[#0d9488] hover:bg-slate-50 transition-all"
        >
          <Upload className="w-12 h-12 text-slate-400" />
          <div className="text-center">
            <p className="text-sm font-medium text-slate-700">
              {file ? file.name : 'Clique para selecionar o arquivo CSV'}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Formato: CSV com separador ";" (Exportação S3D)
            </p>
          </div>
        </label>

        {file && (
          <button
            onClick={handleImport}
            disabled={uploading}
            className="mt-6 w-full px-6 py-3 bg-[#0d9488] text-white rounded-lg hover:bg-[#0f766e] font-medium transition-colors disabled:opacity-70 flex items-center justify-center gap-2"
          >
            {uploading ? <Loader2 className="animate-spin" size={20} /> : <Upload size={20} />}
            {uploading ? 'Processando e Vinculando...' : 'Importar Clientes'}
          </button>
        )}
      </div>

      {result && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 animate-in fade-in slide-in-from-bottom-4">
          <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <CheckCircle2 className="text-emerald-600" />
            Resultado da Importação
          </h3>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg text-center">
              <p className="text-2xl font-bold text-blue-700">{result.stats.totalProcessed}</p>
              <p className="text-xs text-blue-600 font-medium">CNPJs Processados</p>
            </div>
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg text-center">
              <p className="text-2xl font-bold text-emerald-700">{result.stats.created}</p>
              <p className="text-xs text-emerald-600 font-medium">Clientes Criados</p>
            </div>
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg text-center">
              <p className="text-2xl font-bold text-amber-700">{result.stats.updated}</p>
              <p className="text-xs text-amber-600 font-medium">Clientes Atualizados</p>
            </div>
            <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg text-center">
              <p className="text-2xl font-bold text-purple-700">{result.stats.contactsCreated}</p>
              <p className="text-xs text-purple-600 font-medium">Contatos Vinculados</p>
            </div>
          </div>

          {result.stats.errors > 0 && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-red-800">
                  {result.stats.errors} erro(s) ocorreram durante a importação.
                </p>
                <p className="text-xs text-red-600 mt-1">
                  Verifique os logs do backend para detalhes. Geralmente são CNPJs inválidos ou dados faltantes críticos.
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}