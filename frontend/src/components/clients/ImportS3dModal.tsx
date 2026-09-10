'use client';

// =================================================================
// INÍCIO: ImportS3dModal.tsx — 🆕 Sprint F12
// =================================================================
/**
 * Modal de importação do cadastro completo S3D.
 * Fluxo da casa: Parse → Revisão → Confirmar (nada é gravado antes).
 */
import { useState } from 'react';
import { toast } from 'sonner';
import { X, Loader2, Upload, Building2, Users, UserCog } from 'lucide-react';
import api from '@/lib/axios';
import { parseS3dCsv, S3dCompany } from '@/lib/parseS3dCsv';

interface Props {
  open: boolean;
  onClose: () => void;
  onImported: () => void;
}

export default function ImportS3dModal({ open, onClose, onImported }: Props) {
  const [csvName, setCsvName] = useState('');
  const [companies, setCompanies] = useState<S3dCompany[]>([]);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<any | null>(null);

  const totalContacts = companies.reduce(
    (s, c) => s + (c.contacts?.length || 0),
    0,
  );
  const totalOwners = companies.reduce(
    (s, c) => s + (c.owners?.length || 0),
    0,
  );

  const handleFile = async (file: File | null) => {
    if (!file) return;
    try {
      const text = await file.text();
      const parsed = parseS3dCsv(text);
      if (parsed.length === 0) {
        toast.error('Nenhuma empresa reconhecida no CSV.');
        return;
      }
      setCompanies(parsed);
      setCsvName(file.name);
      setResult(null);
      toast.success(`${parsed.length} empresa(s) agrupada(s) por CNPJ.`);
    } catch (e: any) {
      toast.error(e.message || 'Erro ao ler o CSV.');
    }
  };

  const confirmImport = async () => {
    setImporting(true);
    try {
      const { data } = await api.post('/clients/import-s3d', { companies });
      setResult(data);
      toast.success(
        `S3D importado: ${data.created} criado(s), ${data.updated} atualizado(s), ` +
          `${data.contactsSynced} contato(s), ${data.ownersSynced} responsável(is).`,
      );
      onImported();
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Erro na importação S3D.');
    } finally {
      setImporting(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-3xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-5 border-b border-slate-200">
          <div>
            <h3 className="font-bold text-slate-900 flex items-center gap-2">
              <Building2 className="h-5 w-5 text-teal-600" />
              Importar Cadastro Completo (S3D)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Endereço, regime, registros, contatos e responsáveis por departamento.
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
            disabled={importing}
            className="block w-full text-sm text-slate-600 file:mr-3 file:px-4 file:py-2 file:rounded-lg file:border-0 file:bg-teal-50 file:text-teal-700 file:font-medium file:cursor-pointer hover:file:bg-teal-100"
          />
          {csvName && <p className="text-xs text-teal-700">Planilha: {csvName}</p>}

          {companies.length > 0 && !result && (
            <>
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-teal-50 border border-teal-200 rounded-lg p-3 text-center">
                  <p className="text-xl font-bold text-teal-700">{companies.length}</p>
                  <p className="text-xs text-teal-700">Empresas (agrupadas por CNPJ)</p>
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-center">
                  <p className="text-xl font-bold text-blue-700 flex items-center justify-center gap-1">
                    <Users className="h-4 w-4" /> {totalContacts}
                  </p>
                  <p className="text-xs text-blue-700">Contatos</p>
                </div>
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 text-center">
                  <p className="text-xl font-bold text-orange-700 flex items-center justify-center gap-1">
                    <UserCog className="h-4 w-4" /> {totalOwners}
                  </p>
                  <p className="text-xs text-orange-700">Responsáveis por depto</p>
                </div>
              </div>

              <div className="border border-slate-200 rounded-lg max-h-64 overflow-y-auto">
                <table className="w-full text-xs">
                  <thead className="bg-slate-50 sticky top-0">
                    <tr className="text-left text-slate-500">
                      <th className="py-2 px-3 font-medium">Empresa</th>
                      <th className="py-2 px-3 font-medium">Regime</th>
                      <th className="py-2 px-3 font-medium text-center">Contatos</th>
                      <th className="py-2 px-3 font-medium text-center">Deptos</th>
                    </tr>
                  </thead>
                  <tbody>
                    {companies.slice(0, 30).map((c, i) => (
                      <tr key={i} className="border-t border-slate-100">
                        <td className="py-1.5 px-3 text-slate-700 max-w-[260px] truncate">
                          {c.companyName}
                        </td>
                        <td className="py-1.5 px-3 text-slate-600">{c.taxRegime || '—'}</td>
                        <td className="py-1.5 px-3 text-center">{c.contacts?.length || 0}</td>
                        <td className="py-1.5 px-3 text-center">{c.owners?.length || 0}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {companies.length > 30 && (
                  <p className="text-xs text-slate-500 text-center py-2">
                    ...e mais {companies.length - 30} empresa(s)
                  </p>
                )}
              </div>
            </>
          )}

          {result && (
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 text-sm space-y-1">
              <p><strong>Criados:</strong> {result.created}</p>
              <p><strong>Atualizados:</strong> {result.updated}</p>
              <p><strong>Contatos sincronizados:</strong> {result.contactsSynced}</p>
              <p><strong>Responsáveis sincronizados:</strong> {result.ownersSynced}</p>
              {result.errors?.length > 0 && (
                <p className="text-red-600">
                  Erros: {result.errors.map((e: any) => e.company).join(', ')}
                </p>
              )}
            </div>
          )}
        </div>

        <div className="flex gap-2 p-5 border-t border-slate-200">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 border border-slate-300 text-slate-700 font-semibold rounded-lg hover:bg-slate-50"
          >
            {result ? 'Fechar' : 'Cancelar'}
          </button>
          {!result && (
            <button
              onClick={confirmImport}
              disabled={importing || companies.length === 0}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-lg disabled:opacity-50"
            >
              {importing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Upload className="h-4 w-4" />
              )}
              {importing ? 'Importando...' : `Importar ${companies.length} empresa(s)`}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
// =================================================================
// FIM: ImportS3dModal.tsx
// =================================================================