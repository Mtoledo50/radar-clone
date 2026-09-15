// ============================================================================
// SPRINT F18-B.2 — Card de controle do Portal do Cliente (Ficha do Cliente)
// ----------------------------------------------------------------------------
// 3 interruptores (opt-in por cliente — ADR-122):
//   1. Portal do Cliente (master): ON gera token automático / OFF revoga
//   2. Tarefas no Portal:          OFF = teaser "implementação futura"
//   3. Propostas no Portal:        OFF = teaser "implementação futura"
// + linha com link do portal + botão "Copiar link" (só com master ON)
// ============================================================================
'use client';

import { useCallback, useEffect, useState } from 'react';
import { useAuthStore } from '@/store/authStore';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface PortalConfig {
  portalAtivo: boolean;
  portalMostrarTarefas: boolean;
  portalMostrarPropostas: boolean;
  portalToken: string | null;
  portalUrl: string | null;
}

export default function PortalClienteCard({
  clientId,
}: {
  clientId: string | null;
}) {
  const auth = useAuthStore() as any;
  const accessToken = auth.accessToken ?? auth.token ?? null;

  const [config, setConfig] = useState<PortalConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    if (!clientId) {
      setConfig(null);
      setLoading(false);
      return;
    }
    try {
      const r = await fetch(`${API_URL}/api/client-portal/config/${clientId}`, {
        headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
      });
      if (r.ok) setConfig(await r.json());
    } catch (e) {
      console.error('Erro ao carregar config do portal:', e);
    } finally {
      setLoading(false);
    }
  }, [clientId, accessToken]);

  useEffect(() => {
    setLoading(true);
    carregar();
  }, [carregar]);

  const toggle = async (campo: keyof PortalConfig, valor: boolean) => {
    if (!clientId) return;
    setSaving(campo);
    try {
      const r = await fetch(`${API_URL}/api/client-portal/config/${clientId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
        body: JSON.stringify({ [campo]: valor }),
      });
      if (r.ok) {
        setConfig(await r.json());
      } else {
        alert('Erro ao atualizar a configuração do portal.');
      }
    } catch {
      alert('Erro de conexão com o backend.');
    } finally {
      setSaving(null);
    }
  };

  const copiarLink = async () => {
    if (!config?.portalUrl) return;
    const url = `${window.location.origin}${config.portalUrl}`;
    await navigator.clipboard.writeText(url);
    alert(`Link do portal copiado!\n${url}`);
  };

  if (!clientId) return null;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mt-6">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-bold text-slate-900 flex items-center gap-2">
          🌐 Portal do Cliente
        </h3>
        <span
          className={`text-xs font-semibold px-2 py-1 rounded-full ${
            config?.portalAtivo
              ? 'bg-teal-100 text-teal-700'
              : 'bg-slate-100 text-slate-500'
          }`}
        >
          {config?.portalAtivo ? 'ATIVO' : 'INATIVO'}
        </span>
      </div>
      <p className="text-sm text-slate-500 mb-4">
        Controle o que este cliente vê no portal público. O link de acesso é
        gerado automaticamente ao ativar o master — e morre na hora ao desativar.
      </p>

      {loading ? (
        <p className="text-sm text-slate-400">Carregando configurações...</p>
      ) : (
        <>
          <div className="space-y-3">
            <SwitchRow
              label="Portal do Cliente (link de acesso)"
              desc="ON: gera token automaticamente • OFF: revoga o link na hora"
              ativo={config?.portalAtivo ?? false}
              saving={saving === 'portalAtivo'}
              onToggle={(v: boolean) => toggle('portalAtivo', v)}
            />
            <SwitchRow
              label="Tarefas no Portal"
              desc="OFF: cliente vê vitrine '🔜 implementação futura' (curiosidade)"
              ativo={config?.portalMostrarTarefas ?? false}
              saving={saving === 'portalMostrarTarefas'}
              onToggle={(v: boolean) => toggle('portalMostrarTarefas', v)}
            />
            <SwitchRow
              label="Propostas no Portal"
              desc="OFF: cliente vê vitrine '🔜 implementação futura' (curiosidade)"
              ativo={config?.portalMostrarPropostas ?? false}
              saving={saving === 'portalMostrarPropostas'}
              onToggle={(v: boolean) => toggle('portalMostrarPropostas', v)}
            />
          </div>

          {config?.portalAtivo && config?.portalUrl && (
            <div className="mt-4 p-3 bg-teal-50 border border-teal-200 rounded-lg flex items-center gap-2 flex-wrap">
              <code className="text-xs text-teal-800 flex-1 truncate">
                {config.portalUrl}
              </code>
              <button
                onClick={copiarLink}
                className="px-3 py-1.5 bg-teal-600 text-white text-xs font-medium rounded-lg hover:bg-teal-700"
              >
                📋 Copiar link
              </button>
              <a
                href={config.portalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 bg-white border border-teal-300 text-teal-700 text-xs font-medium rounded-lg hover:bg-teal-100"
              >
                Abrir portal
              </a>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function SwitchRow({
  label,
  desc,
  ativo,
  saving,
  onToggle,
}: {
  label: string;
  desc: string;
  ativo: boolean;
  saving: boolean;
  onToggle: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 p-3 bg-slate-50 rounded-lg">
      <div>
        <p className="text-sm font-medium text-slate-800">{label}</p>
        <p className="text-xs text-slate-500">{desc}</p>
      </div>
      <button
        onClick={() => onToggle(!ativo)}
        disabled={saving}
        title={ativo ? 'Desativar' : 'Ativar'}
        className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors ${
          ativo ? 'bg-teal-600' : 'bg-slate-300'
        } ${saving ? 'opacity-50' : ''}`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
            ativo ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
    </div>
  );
}