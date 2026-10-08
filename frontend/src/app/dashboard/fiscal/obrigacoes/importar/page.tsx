'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Upload, FileSpreadsheet, CheckCircle, AlertTriangle, Loader2 } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import api from '@/lib/axios';

export default function ImportObligationsPage() {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setResult(null);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      toast.error('Selecione um arquivo Excel primeiro.');
      return;
    }

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await api.post('/obligations/import-excel', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      setResult(response.data);
      toast.success(response.data.message);
      setFile(null); // Limpar input
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erro ao processar o arquivo.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <FileSpreadsheet className="text-[#0d9488]" /> Importar Obrigações em Massa
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          Faça o upload dos arquivos Excel (ex: "DAS - Mensal.xlsx") para criar a obrigação e vincular as empresas automaticamente pelo CNPJ.
        </p>
      </div>

      {/* Área de Upload */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 text-center">
        <input
          type="file"
          id="excel-upload"
          accept=".xlsx, .xls"
          onChange={handleFileChange}
          className="hidden"
        />
        <label
          htmlFor="excel-upload"
          className="cursor-pointer flex flex-col items-center justify-center gap-3 p-6 border-2 border-dashed border-slate-300 rounded-lg hover:border-[#0d9488] hover:bg-slate-50 transition-all"
        >
          <Upload className="w-10 h-10 text-slate-400" />
          <div>
            <p className="text-sm font-medium text-slate-700">
              {file ? file.name : 'Clique para selecionar o arquivo Excel'}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Formatos aceitos: .xlsx, .xls (Máx. 10MB)
            </p>
          </div>
        </label>

        {file && (
          <button
            onClick={handleUpload}
            disabled={isUploading}
            className="mt-6 w-full sm:w-auto px-6 py-2.5 bg-[#0d9488] text-white rounded-lg hover:bg-[#0f766e] font-medium transition-colors disabled:opacity-70 flex items-center justify-center gap-2 mx-auto"
          >
            {isUploading ? <Loader2 className="animate-spin" size={18} /> : <Upload size={18} />}
            {isUploading ? 'Processando...' : 'Importar e Vincular'}
          </button>
        )}
      </div>

      {/* Resultado da Importação */}
      {result && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-slate-200">
            <h3 className="font-semibold text-slate-800 flex items-center gap-2">
              <CheckCircle className="text-emerald-600" size={20} />
              Resultado da Importação: {result.obligationName}
            </h3>
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg text-center">
              <p className="text-2xl font-bold text-emerald-700">{result.clientsLinked}</p>
              <p className="text-sm text-emerald-600">Empresas Vinculadas</p>
            </div>
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg text-center">
              <p className="text-2xl font-bold text-amber-700">{result.clientsNotFound}</p>
              <p className="text-sm text-amber-600">CNPJs Não Encontrados</p>
            </div>
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg text-center">
              <p className="text-2xl font-bold text-slate-700">{result.totalRowsProcessed}</p>
              <p className="text-sm text-slate-600">Total de Linhas Lidas</p>
            </div>
          </div>

          {result.clientsNotFound > 0 && (
            <div className="p-4 bg-red-50 border-t border-red-100">
              <p className="text-sm font-medium text-red-800 flex items-center gap-2 mb-2">
                <AlertTriangle size={16} /> CNPJs presentes no Excel, mas não cadastrados no sistema:
              </p>
              <div className="max-h-40 overflow-y-auto bg-white rounded border border-red-200 p-2">
                <p className="text-xs text-red-700 font-mono">
                  {result.notFoundList.join(', ')}
                </p>
              </div>
              <p className="text-xs text-red-600 mt-2">
                * Cadastre essas empresas no módulo "Carteira de Clientes" para vinculá-las futuramente.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}