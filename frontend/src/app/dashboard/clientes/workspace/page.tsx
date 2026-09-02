'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/axios';
import { toast } from 'sonner';
import { useClientContextStore } from '@/store/clientContextStore';
import { WORKSPACE_SECTORS } from '@/lib/client-workspace-services';
import { FolderOpen, Lock, ExternalLink, Loader2, Power } from 'lucide-react';

export default function ClientWorkspacePage() {
  const router = useRouter();
  const { setActiveClient } = useClientContextStore();
  const [clients, setClients] = useState<any[]>([]);
  const [clientId, setClientId] = useState('');
  const [client, setClient] = useState<any | null>(null);
  const [active, setActive] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const r = await api.get('/clients');
      setClients(r.data.data || []);
    })();
  }, []);

  useEffect(() => {
    if (clientId) load(clientId);
  }, [clientId]);

  async function load(id: string) {
    setBusy('load');
    try {
      const r = await api.get(`/client-workspace/${id}`);
      setClient(r.data.data.client);
      setActive(new Set(r.data.data.activeServices));
      setActiveClient(id, r.data.data.client?.companyName); // ADR-077
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Erro ao carregar a ficha.');
    } finally { setBusy(null); }
  }

  async function toggle(code: string) {
    const willActivate = !active.has(code);
    setBusy(code);
    try {
      await api.post(`/client-workspace/${clientId}/toggle`, { serviceCode: code, active: willActivate });
      setActive((prev) => {
        const n = new Set(prev);
        if (willActivate) n.add(code); else n.delete(code);
        return n;
      });
      toast.success(willActivate ? '✅ Serviço ativado no plano do cliente.' : 'Serviço desativado do plano.');
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Erro ao alternar o serviço.');
    } finally { setBusy(null); }
  }

  function open(route: string) {
    if (client) setActiveClient(client.id, client.companyName);
    router.push(route);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-3 text-3xl font-bold text-slate-900">
          <FolderOpen className="h-8 w-8 text-teal-600" /> Ficha do Cliente por Setores
        </h1>
        <p className="mt-1 text-slate-600">
          Selecione o cliente e trabalhe cada setor separadamente. Serviços só liberam se ativados no plano.
        </p>
      </div>

      {/* Seletor de cliente */}
      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <label className="mb-1.5 block text-sm font-semibold text-slate-700">Cliente</label>
        <select
          value={clientId}
          onChange={(e) => setClientId(e.target.value)}
          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-slate-900"
        >
          <option value="">— Selecione o cliente —</option>
          {clients.map((c) => <option key={c.id} value={c.id}>{c.companyName}</option>)}
        </select>
      </div>

      {/* Dados do cliente */}
      {client && (
        <div className="rounded-xl border border-teal-200 bg-teal-50 p-4">
          <p className="text-lg font-bold text-teal-900">{client.companyName}</p>
          <p className="text-sm text-teal-800">
            CNPJ: {client.cnpj || '—'} • Contato: {client.contactName || '—'} •
            Plano contábil: {client.accountingPlan || 'Padrão do escritório'}
          </p>
        </div>
      )}

      {/* Setores × serviços */}
      {client && WORKSPACE_SECTORS.map((sector) => (
        <div key={sector.id} className="rounded-xl border border-slate-200 bg-white p-4">
          <h2 className="mb-3 text-base font-bold text-slate-900">{sector.label}</h2>
          <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
            {sector.services.map((svc) => {
              const enabled = active.has(svc.code);
              return (
                <div key={svc.code}
                  className={`flex items-center justify-between gap-3 rounded-lg border p-3 ${
                    enabled ? 'border-teal-200 bg-teal-50/50' : 'border-slate-200 bg-slate-50 opacity-80'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {enabled
                      ? <ExternalLink className="h-4 w-4 text-teal-600" />
                      : <Lock className="h-4 w-4 text-slate-400" />}
                    <span className={`text-sm font-medium ${enabled ? 'text-slate-900' : 'text-slate-500'}`}>
                      {svc.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggle(svc.code)}
                      disabled={busy === svc.code || busy === 'load'}
                      title={enabled ? 'Desativar do plano' : 'Ativar no plano do cliente'}
                      className={`flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-bold ${
                        enabled ? 'bg-teal-600 text-white' : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                      } disabled:opacity-50`}
                    >
                      {busy === svc.code ? <Loader2 className="h-3 w-3 animate-spin" /> : <Power className="h-3 w-3" />}
                      {enabled ? 'ATIVO' : 'ATIVAR'}
                    </button>
                    {enabled && (
                      <button
                        onClick={() => open(svc.route)}
                        className="rounded-md bg-slate-900 px-2 py-1 text-[11px] font-bold text-white hover:bg-slate-700"
                      >
                        ABRIR
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {client && (
        <p className="text-xs text-slate-500">
          🔗 Todos os serviços são vinculados à grade do catálogo do escritório.
          Próxima camada: ativação automática conforme o plano comercial contratado.
        </p>
      )}
    </div>
  );
}