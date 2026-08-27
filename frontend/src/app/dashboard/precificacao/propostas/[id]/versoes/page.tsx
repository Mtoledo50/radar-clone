/**
 * =================================================================
 * PÁGINA: Versões de Proposta (Sprint A3 - Conta Certa 2.0)
 * =================================================================
 * Responsabilidade: Visualizar, criar, comparar e ativar versões 
 * de uma proposta comercial, mantendo o histórico imutável.
 * 
 * ADR-028: Versionamento imutável — versões antigas nunca são alteradas,
 * apenas clonadas. A "versão atual" é destacada visualmente.
 * =================================================================
 */
'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api from '@/lib/axios';
import { toast } from 'sonner';
import {
  FileText, Plus, GitBranch, CheckCircle2, ArrowRightLeft, 
  Eye, Clock, TrendingUp, Loader2, X
} from 'lucide-react';

interface ProposalVersion {
  id: string;
  version: number;
  proposalNumber: string;
  status: string;
  isCurrent: boolean;
  createdAt: string;
  clientName: string;
  basePrice: number;
  closingDetails?: any;
}

export default function VersoesPage() {
  const params = useParams();
  const router = useRouter();
  const proposalId = params.id as string;

  const [versions, setVersions] = useState<ProposalVersion[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  
  // Estado do comparador
  const [showCompare, setShowCompare] = useState(false);
  const [compareA, setCompareA] = useState<string>('');
  const [compareB, setCompareB] = useState<string>('');
  const [compareResult, setCompareResult] = useState<any>(null);
  const [comparing, setComparing] = useState(false);

  useEffect(() => {
    loadVersions();
  }, [proposalId]);

  async function loadVersions() {
    try {
      setLoading(true);
      const res = await api.get(`/proposals/${proposalId}/versions`);
      setVersions(res.data.data || []);
    } catch (err) {
      toast.error('Erro ao carregar versões da proposta');
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateVersion() {
    const reason = prompt('Motivo da nova versão (opcional, ex: "Cliente pediu 10% de desconto"):');
    if (reason === null) return; // Usuário cancelou

    try {
      setCreating(true);
      await api.post(`/proposals/${proposalId}/version`, { reason: reason || undefined });
      toast.success('Nova versão criada com sucesso!');
      await loadVersions();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Erro ao criar versão');
    } finally {
      setCreating(false);
    }
  }

  async function handleActivate(id: string, version: number) {
    if (!confirm(`Ativar a versão ${version}? Ela se tornará a versão atual e a anterior será arquivada.`)) return;
    try {
      await api.patch(`/proposals/${id}/activate`);
      toast.success(`Versão ${version} ativada com sucesso!`);
      await loadVersions();
    } catch (err) {
      toast.error('Erro ao ativar versão');
    }
  }

  async function handleCompare() {
    if (!compareA || !compareB) {
      toast.error('Selecione duas versões diferentes para comparar');
      return;
    }
    if (compareA === compareB) {
      toast.error('As versões selecionadas são iguais');
      return;
    }

    try {
      setComparing(true);
      const res = await api.post('/proposals/compare', {
        versionAId: compareA,
        versionBId: compareB,
      });
      setCompareResult(res.data.data);
    } catch (err) {
      toast.error('Erro ao comparar versões');
    } finally {
      setComparing(false);
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="h-12 w-12 text-teal-600 animate-spin mb-4" />
        <p className="text-slate-600">Carregando histórico de versões...</p>
      </div>
    );
  }

  const currentVersion = versions.find((v) => v.isCurrent);

  return (
    <div className="space-y-6 p-6 max-w-7xl mx-auto">
      {/* Cabeçalho */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
            <GitBranch className="h-8 w-8 text-teal-600" />
            Versões da Proposta
          </h1>
          <p className="text-slate-600 mt-1">
            Histórico imutável de alterações e versionamento da proposta #{proposalId.slice(0, 8)}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => { setShowCompare(!showCompare); setCompareResult(null); }}
            className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-lg transition-colors"
          >
            <ArrowRightLeft className="h-4 w-4" />
            Comparar
          </button>
          <button
            onClick={handleCreateVersion}
            disabled={creating}
            className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-lg disabled:opacity-50 transition-colors"
          >
            {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            Nova Versão
          </button>
        </div>
      </div>

      {/* Versão Atual (Destaque) */}
      {currentVersion && (
        <div className="bg-gradient-to-r from-teal-50 to-orange-50 border-2 border-teal-200 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 className="h-5 w-5 text-teal-700" />
            <span className="text-sm font-bold text-teal-700 uppercase">Versão Atual (Ativa)</span>
          </div>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">
                {currentVersion.proposalNumber}
              </h2>
              <p className="text-slate-600 mt-1 flex items-center gap-2">
                <span className="font-semibold">v{currentVersion.version}</span>
                <span>•</span>
                <span>{currentVersion.clientName}</span>
                <span>•</span>
                <span className="text-teal-700 font-bold">R$ {currentVersion.basePrice?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className={`px-3 py-1 text-sm font-semibold rounded-full ${
                currentVersion.status === 'CLOSED_WON' ? 'bg-green-100 text-green-700' :
                currentVersion.status === 'CLOSED_LOST' ? 'bg-red-100 text-red-700' :
                'bg-blue-100 text-blue-700'
              }`}>
                {currentVersion.status === 'CLOSED_WON' ? 'Fechada (Ganha)' : 
                 currentVersion.status === 'CLOSED_LOST' ? 'Fechada (Perdida)' : currentVersion.status}
              </span>
              <button
                onClick={() => router.push(`/dashboard/precificacao/propostas/${currentVersion.id}`)}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-medium rounded-lg transition-colors"
              >
                <Eye className="h-4 w-4" />
                Visualizar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Comparador de Versões (Expansível) */}
      {showCompare && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <ArrowRightLeft className="h-5 w-5 text-teal-600" />
              Comparar Versões
            </h3>
            <button onClick={() => setShowCompare(false)} className="text-slate-400 hover:text-slate-600">
              <X className="h-5 w-5" />
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Versão A (Base)</label>
              <select
                value={compareA}
                onChange={(e) => { setCompareA(e.target.value); setCompareResult(null); }}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
              >
                <option value="">Selecione a versão A</option>
                {versions.map((v) => (
                  <option key={v.id} value={v.id}>v{v.version} - {v.proposalNumber}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Versão B (Comparação)</label>
              <select
                value={compareB}
                onChange={(e) => { setCompareB(e.target.value); setCompareResult(null); }}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
              >
                <option value="">Selecione a versão B</option>
                {versions.map((v) => (
                  <option key={v.id} value={v.id}>v{v.version} - {v.proposalNumber}</option>
                ))}
              </select>
            </div>
          </div>
          
          <button
            onClick={handleCompare}
            disabled={comparing || !compareA || !compareB}
            className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-lg disabled:opacity-50 transition-colors"
          >
            {comparing ? <Loader2 className="h-4 w-4 animate-spin inline mr-2" /> : null}
            Comparar Agora
          </button>

          {compareResult && (
            <div className="mt-6 space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
              {/* Diferenças de Campos */}
              <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                <h4 className="font-bold text-slate-900 mb-3 flex items-center gap-2">
                  <FileText className="h-4 w-4" /> Campos Alterados
                </h4>
                {compareResult.differences.filter((d: any) => d.changed).length === 0 ? (
                  <p className="text-slate-500 text-sm italic">Nenhum campo de texto/valor foi alterado entre as versões.</p>
                ) : (
                  <ul className="space-y-2">
                    {compareResult.differences.filter((d: any) => d.changed).map((d: any, i: number) => (
                      <li key={i} className="text-sm bg-white p-2 rounded border border-slate-200">
                        <span className="font-semibold text-slate-700 capitalize">{d.field.replace(/([A-Z])/g, ' $1').trim()}:</span>
                        <div className="mt-1 grid grid-cols-2 gap-2">
                          <span className="text-red-600 line-through decoration-red-400">"{d.valueA || 'Vazio'}"</span>
                          <span className="text-green-600 font-medium">"{d.valueB || 'Vazio'}"</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Resumo de Itens */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                  <div className="text-sm font-semibold text-green-700 mb-1">Itens Adicionados</div>
                  <div className="text-3xl font-bold text-green-900">{compareResult.itemsAdded.length}</div>
                </div>
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
                  <div className="text-sm font-semibold text-red-700 mb-1">Itens Removidos</div>
                  <div className="text-3xl font-bold text-red-900">{compareResult.itemsRemoved.length}</div>
                </div>
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 text-center">
                  <div className="text-sm font-semibold text-orange-700 mb-1">Itens com Preço Alterado</div>
                  <div className="text-3xl font-bold text-orange-900">{compareResult.itemsChanged.length}</div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Lista de Histórico de Versões */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50">
          <h3 className="font-bold text-slate-900 flex items-center gap-2">
            <Clock className="h-5 w-5 text-slate-500" />
            Histórico Completo
          </h3>
        </div>
        <div className="divide-y divide-slate-200">
          {versions.map((v) => (
            <div key={v.id} className={`p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4 transition-colors ${v.isCurrent ? 'bg-teal-50/50' : 'hover:bg-slate-50'}`}>
              <div className="flex items-center gap-4">
                <div className={`w-14 h-14 rounded-lg flex flex-col items-center justify-center font-bold border ${v.isCurrent ? 'bg-teal-600 text-white border-teal-600' : 'bg-white text-slate-700 border-slate-200'}`}>
                  <span className="text-xs uppercase opacity-80">v</span>
                  <span className="text-xl leading-none">{v.version}</span>
                </div>
                <div>
                  <div className="font-semibold text-slate-900 text-lg">{v.proposalNumber}</div>
                  <div className="text-sm text-slate-600">
                    {v.clientName} • R$ {v.basePrice?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </div>
                  <div className="text-xs text-slate-500 mt-1 flex items-center gap-2">
                    <span>Criada em {new Date(v.createdAt).toLocaleDateString('pt-BR')}</span>
                    {v.closingDetails?.reason && (
                      <>
                        <span>•</span>
                        <span className="italic text-teal-700">Motivo: "{v.closingDetails.reason}"</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2 md:justify-end">
                <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${
                  v.status === 'DRAFT' ? 'bg-slate-100 text-slate-700' :
                  v.status === 'SENT' ? 'bg-blue-100 text-blue-700' :
                  v.status === 'VIEWED' ? 'bg-yellow-100 text-yellow-700' :
                  v.status === 'CLOSED_WON' ? 'bg-green-100 text-green-700' :
                  'bg-red-100 text-red-700'
                }`}>
                  {v.status === 'CLOSED_WON' ? 'GANHA' : v.status === 'CLOSED_LOST' ? 'PERDIDA' : v.status}
                </span>
                
                {v.isCurrent && (
                  <span className="px-2.5 py-1 bg-teal-100 text-teal-700 text-xs font-bold rounded-full flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" /> ATUAL
                  </span>
                )}
                
                {!v.isCurrent && (
                  <button
                    onClick={() => handleActivate(v.id, v.version)}
                    className="px-3 py-1.5 bg-white border border-teal-600 text-teal-700 hover:bg-teal-50 text-xs font-semibold rounded-lg transition-colors"
                  >
                    Ativar esta
                  </button>
                )}
                
                <button
                  onClick={() => router.push(`/dashboard/precificacao/propostas/${v.id}`)}
                  className="p-2 text-slate-400 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors"
                  title="Visualizar proposta"
                >
                  <Eye className="h-5 w-5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}