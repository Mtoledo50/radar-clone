// =================================================================
// INÍCIO: frontend/src/app/dashboard/funcionario-digital/legalizacao/page.tsx
// =================================================================
/**
 * ⚖️ Legalização — FD-8 + FD-6
 * Cofre 🔐 (senhas/procurações/eCAC), Certificado A1 (.pfx cifrado),
 * Obrigações legais (prazos c/ alerta) e EFD-Contribuições v1.
 * Segredo NUNCA renderiza em lista — só via reveal ADMIN (ADR-059).
 */
'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/axios';
import { toast } from 'sonner';
import {
  ShieldCheck, Loader2, Plus, Trash2, Eye, Download,
  CalendarClock, KeyRound, FileKey, RefreshCw,
} from 'lucide-react';

interface VaultItem {
  id: string; label: string; category: string; url: string | null;
  hasSecret: boolean; expiresAt: string | null; daysToExpire: number | null;
}
interface Deadline { id: string; title: string; dueDate: string; status: string; daysLeft: number; }

const CAT_LABEL: Record<string, string> = {
  PASSWORD: '🔑 Senha', CERT_A1: '🪪 Certificado A1', PROCURACAO: '📜 Procuração', ECAC: '🏛️ eCAC',
};

export default function LegalizacaoPage() {
  const [loading, setLoading] = useState(true);
  const [vault, setVault] = useState<VaultItem[]>([]);
  const [deadlines, setDeadlines] = useState<Deadline[]>([]);
  const [revealed, setRevealed] = useState<Record<string, string>>({});

  // forms
  const [newSecret, setNewSecret] = useState({ label: '', category: 'PASSWORD', secret: '', url: '' });
  const [newDeadline, setNewDeadline] = useState({ title: '', dueDate: '' });
  const [cert, setCert] = useState<{ label: string; password: string; expiresAt: string; pfxBase64: string } | null>(null);

  async function load() {
    try {
      setLoading(true);
      const [v, d] = await Promise.all([
        api.get('/digital-employee/legal/vault'),
        api.get('/digital-employee/legal/deadlines'),
      ]);
      setVault(v.data.data);
      setDeadlines(d.data.data);
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Erro ao carregar legalização.');
    } finally { setLoading(false); }
  }
  useEffect(() => { load(); }, []);

  async function addSecret() {
    try {
      await api.post('/digital-employee/legal/vault', newSecret);
      setNewSecret({ label: '', category: 'PASSWORD', secret: '', url: '' });
      toast.success('Item guardado no cofre 🔐');
      load();
    } catch (e: any) { toast.error(e.response?.data?.message || 'Erro ao guardar.'); }
  }

  async function reveal(id: string) {
    if (revealed[id]) { setRevealed({ ...revealed, [id]: '' }); return; }
    try {
      const res = await api.post(`/digital-employee/legal/vault/${id}/reveal`);
      setRevealed({ ...revealed, [id]: res.data.data.secret });
    } catch (e: any) { toast.error(e.response?.data?.message || 'Sem permissão p/ revelar.'); }
  }

  function onPickPfx(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const b64 = String(reader.result).split(',')[1];
      setCert((c) => ({ label: c?.label || file.name, password: c?.password || '', expiresAt: c?.expiresAt || '', pfxBase64: b64 }));
    };
    reader.readAsDataURL(file);
  }

  async function uploadCert() {
    if (!cert?.pfxBase64 || !cert.password) return toast.error('Selecione o .pfx e informe a senha.');
    try {
      await api.post('/digital-employee/legal/vault/certificate', cert);
      setCert(null);
      toast.success('Certificado A1 guardado 🔐');
      load();
    } catch (e: any) { toast.error(e.response?.data?.message || 'Erro no upload.'); }
  }

  async function addDeadline() {
    try {
      await api.post('/digital-employee/legal/deadlines', newDeadline);
      setNewDeadline({ title: '', dueDate: '' });
      toast.success('Obrigação cadastrada');
      load();
    } catch (e: any) { toast.error(e.response?.data?.message || 'Erro ao cadastrar.'); }
  }

  async function downloadEfd() {
    try {
      const res = await api.get('/digital-employee/legal/efd-contribuicoes');
      const blob = new Blob([res.data.data.txt], { type: 'text/plain' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'EFD_Contribuicoes_v1.txt';
      a.click();
      toast.success('EFD-Contribuições gerada 📄');
    } catch (e: any) { toast.error(e.response?.data?.message || 'Sem bases PIS/COFINS (importe NF-e c/ F6).'); }
  }

  const badgeExpire = (d: number | null) =>
    d === null ? null : d < 0 ? 'bg-red-100 text-red-800' : d <= 30 ? 'bg-amber-100 text-amber-800' : 'bg-green-100 text-green-800';

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh]">
      <Loader2 className="h-12 w-12 text-teal-600 animate-spin mb-4" />
      <p className="text-slate-600">Abrindo o cofre...</p>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
            <ShieldCheck className="h-8 w-8 text-teal-600" /> Legalização & Cofre
          </h1>
          <p className="text-slate-600 mt-1">Senhas, procurações, eCAC e certificado A1 cifrados (AES-256-GCM) + obrigações legais.</p>
        </div>
        <button onClick={downloadEfd} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-semibold">
          <Download className="h-4 w-4" /> EFD-Contribuições v1
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* COFRE */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
            <KeyRound className="h-5 w-5 text-teal-600" /> Cofre 🔐
          </h2>
          <div className="space-y-2 mb-5">
            {vault.length === 0 && <p className="text-sm text-slate-400 text-center py-4">Cofre vazio.</p>}
            {vault.map((v) => (
              <div key={v.id} className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 border border-slate-200">
                <span className="text-xs font-bold px-2 py-1 rounded-full bg-teal-100 text-teal-800">{CAT_LABEL[v.category] || v.category}</span>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-slate-800">{v.label}</p>
                  {v.daysToExpire !== null && (
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${badgeExpire(v.daysToExpire)}`}>
                      {v.daysToExpire < 0 ? `vencido há ${-v.daysToExpire}d` : `vence em ${v.daysToExpire}d`}
                    </span>
                  )}
                  {revealed[v.id] && (
                    <code className="block text-xs text-red-700 bg-red-50 rounded p-1 mt-1 break-all">{revealed[v.id]}</code>
                  )}
                </div>
                {v.hasSecret && (
                  <button onClick={() => reveal(v.id)} className="p-1.5 text-slate-400 hover:text-teal-600" title="Revelar (ADMIN)">
                    <Eye className="h-4 w-4" />
                  </button>
                )}
                {v.url && <a href={v.url} target="_blank" className="text-xs text-teal-700 underline">abrir</a>}
                <button onClick={async () => { await api.delete(`/digital-employee/legal/vault/${v.id}`); load(); }} className="p-1.5 text-slate-400 hover:text-red-600">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
          {/* add senha/procuração */}
          <div className="grid grid-cols-2 gap-2 mb-2">
            <input className="px-3 py-2 border border-slate-300 rounded-lg text-sm" placeholder="Label (ex: Senha eCAC)" value={newSecret.label} onChange={(e) => setNewSecret({ ...newSecret, label: e.target.value })} />
            <select className="px-3 py-2 border border-slate-300 rounded-lg text-sm" value={newSecret.category} onChange={(e) => setNewSecret({ ...newSecret, category: e.target.value })}>
              <option value="PASSWORD">Senha</option><option value="ECAC">eCAC</option><option value="PROCURACAO">Procuração</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-2 mb-2">
            <input type="password" className="px-3 py-2 border border-slate-300 rounded-lg text-sm" placeholder="Segredo (cifrado)" value={newSecret.secret} onChange={(e) => setNewSecret({ ...newSecret, secret: e.target.value })} />
            <input className="px-3 py-2 border border-slate-300 rounded-lg text-sm" placeholder="URL (opcional)" value={newSecret.url} onChange={(e) => setNewSecret({ ...newSecret, url: e.target.value })} />
          </div>
          <button onClick={addSecret} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-teal-600 text-white text-sm font-semibold">
            <Plus className="h-4 w-4" /> Guardar no cofre
          </button>

          {/* upload cert A1 */}
          <div className="mt-5 pt-4 border-t border-slate-100">
            <p className="text-sm font-bold text-slate-700 mb-2 flex items-center gap-1"><FileKey className="h-4 w-4" /> Certificado A1 (.pfx)</p>
            <input type="file" accept=".pfx,.p12" onChange={onPickPfx} className="text-xs mb-2" />
            {cert && (
              <div className="grid grid-cols-2 gap-2 mb-2">
                <input type="password" className="px-3 py-2 border border-slate-300 rounded-lg text-sm" placeholder="Senha do .pfx" value={cert.password} onChange={(e) => setCert({ ...cert, password: e.target.value })} />
                <input type="date" className="px-3 py-2 border border-slate-300 rounded-lg text-sm" value={cert.expiresAt} onChange={(e) => setCert({ ...cert, expiresAt: e.target.value })} />
              </div>
            )}
            <button onClick={uploadCert} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-orange-600 text-white text-sm font-semibold">
              <Plus className="h-4 w-4" /> Guardar certificado
            </button>
          </div>
        </div>

        {/* OBRIGAÇÕES */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
            <CalendarClock className="h-5 w-5 text-orange-600" /> Obrigações Legais
          </h2>
          <div className="space-y-2 mb-5">
            {deadlines.length === 0 && <p className="text-sm text-slate-400 text-center py-4">Nenhuma obrigação cadastrada.</p>}
            {deadlines.map((d) => (
              <div key={d.id} className={`flex items-center gap-3 p-3 rounded-lg border ${d.status === 'CONCLUIDO' ? 'bg-green-50 border-green-200' : 'bg-slate-50 border-slate-200'}`}>
                <div className="flex-1">
                  <p className={`text-sm font-semibold ${d.status === 'CONCLUIDO' ? 'line-through text-slate-400' : 'text-slate-800'}`}>{d.title}</p>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${badgeExpire(d.daysLeft)}`}>
                    {d.daysLeft < 0 ? `${-d.daysLeft}d em atraso` : `${d.daysLeft}d restantes`}
                  </span>
                </div>
                <button onClick={async () => { await api.patch(`/digital-employee/legal/deadlines/${d.id}`); load(); }} className="text-xs font-bold text-teal-700 underline">
                  {d.status === 'ABERTO' ? 'concluir' : 'reabrir'}
                </button>
                <button onClick={async () => { await api.delete(`/digital-employee/legal/deadlines/${d.id}`); load(); }} className="p-1.5 text-slate-400 hover:text-red-600">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-2 mb-2">
            <input className="px-3 py-2 border border-slate-300 rounded-lg text-sm" placeholder="Ex: DEFIS 2027" value={newDeadline.title} onChange={(e) => setNewDeadline({ ...newDeadline, title: e.target.value })} />
            <input type="date" className="px-3 py-2 border border-slate-300 rounded-lg text-sm" value={newDeadline.dueDate} onChange={(e) => setNewDeadline({ ...newDeadline, dueDate: e.target.value })} />
          </div>
          <button onClick={addDeadline} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-orange-600 text-white text-sm font-semibold">
            <Plus className="h-4 w-4" /> Cadastrar obrigação
          </button>
        </div>
      </div>
    </div>
  );
}
// =================================================================
// FIM: frontend/src/app/dashboard/funcionario-digital/legalizacao/page.tsx
// =================================================================