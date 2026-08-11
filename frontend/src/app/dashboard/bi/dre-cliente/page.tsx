'use client';

/**
 * =================================================================
 * 📈 DRE do Cliente (Sprint 26)
 * =================================================================
 * DRE oficial a partir dos lançamentos contábeis promovidos
 * (source=BANCARIO) + confronto com o DRE bancário (gerencial).
 * Fecha o ciclo: Extrato → Fechamento → Contábil → BI.
 * =================================================================
 */
import { useState, useEffect, useCallback } from 'react';
import {
  BarChart3, Loader2, TrendingUp, TrendingDown, DollarSign,
  Landmark, Wallet, CheckCircle2, AlertCircle, ArrowRightLeft,
} from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/axios';

const formatBRL = (v: number) =>
  Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const MONTH_NAMES = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];

export default function DreClientePage() {
  const [clients, setClients] = useState<any[]>([]);
  const [clientId, setClientId] = useState('');
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/clients').then((r) => {
      const list = r.data.data || r.data || [];
      setClients(list);
      if (list.length > 0) setClientId(list[0].id);
    }).catch(() => {});
  }, []);

  const load = useCallback(async () => {
    if (!clientId) return;
    setLoading(true);
    try {
      const { data: res } = await api.get('/accounting/dre', {
        params: { clientId, year, month },
      });
      setData(res.data);
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [clientId, year, month]);

  useEffect(() => { load(); }, [load]);

  const c = data?.contabil;
  const b = data?.bancario;
  const diferenca = c && b ? c.resultado - b.resultado : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <BarChart3 className="h-7 w-7 text-teal-600" /> DRE do Cliente
          </h1>
          <p className="text-slate-600 mt-1">
            DRE oficial (contábil) com confronto do DRE bancário (gerencial).
          </p>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={clientId}
            onChange={(e) => setClientId(e.target.value)}
            className="border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white min-w-[260px]"
          >
            <option value="">Selecione o cliente...</option>
            {clients.map((cl) => (
              <option key={cl.id} value={cl.id}>{cl.companyName}</option>
            ))}
          </select>
          <select value={month} onChange={(e) => setMonth(Number(e.target.value))} className="border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white">
            {MONTH_NAMES.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
          </select>
          <select value={year} onChange={(e) => setYear(Number(e.target.value))} className="border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white">
            {[now.getFullYear() - 1, now.getFullYear(), now.getFullYear() + 1].map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 text-teal-600 animate-spin" /></div>
      ) : !c ? (
        <div className="bg-white rounded-xl border border-slate-200 p-10 text-center text-slate-500">
          Selecione um cliente para visualizar o DRE.
        </div>
      ) : (
        <>
          {/* Status da escrituração */}
          <div className={`rounded-xl border p-4 flex items-center gap-3 ${c.lancamentos > 0 ? 'bg-teal-50 border-teal-200' : 'bg-amber-50 border-amber-200'}`}>
            {c.lancamentos > 0 ? (
              <CheckCircle2 className="h-5 w-5 text-teal-700" />
            ) : (
              <AlertCircle className="h-5 w-5 text-amber-700" />
            )}
            <p className="text-sm text-slate-700">
              {c.lancamentos > 0 ? (
                <>
                  <strong>{c.lancamentos}</strong> lançamento(s) promovido(s) •{' '}
                  <strong>{c.conciliados}</strong> conciliado(s) •{' '}
                  <strong>{c.pendentes}</strong> pendente(s) de conciliação.
                </>
              ) : (
                <>
                  Nenhum lançamento contábil neste mês.{' '}
                  <Link href="/dashboard/fechamento" className="font-semibold text-teal-700 underline">
                    Fechar e promover o extrato
                  </Link>{' '}
                  para gerar o DRE oficial.
                </>
              )}
            </p>
          </div>

          {/* KPIs */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
              <p className="text-xs text-slate-500 flex items-center gap-1"><TrendingUp className="h-3.5 w-3.5 text-green-600" /> Receitas</p>
              <p className="text-lg font-bold text-green-700">{formatBRL(c.totalReceitas)}</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
              <p className="text-xs text-slate-500 flex items-center gap-1"><TrendingDown className="h-3.5 w-3.5 text-red-600" /> Despesas</p>
              <p className="text-lg font-bold text-red-700">{formatBRL(c.totalDespesas)}</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
              <p className="text-xs text-slate-500 flex items-center gap-1"><DollarSign className="h-3.5 w-3.5" /> Resultado</p>
              <p className={`text-lg font-bold ${c.resultado >= 0 ? 'text-green-800' : 'text-red-800'}`}>{formatBRL(c.resultado)}</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
              <p className="text-xs text-slate-500 flex items-center gap-1"><ArrowRightLeft className="h-3.5 w-3.5 text-blue-600" /> Diferença p/ Bancário</p>
              <p className={`text-lg font-bold ${Math.abs(diferenca) < 0.01 ? 'text-slate-700' : 'text-orange-600'}`}>{formatBRL(diferenca)}</p>
            </div>
          </div>

          {/* Confronto Contábil × Bancário */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
              <ArrowRightLeft className="h-4 w-4 text-blue-600" /> Confronto: Contábil × Bancário
            </h3>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-slate-500">
                  <th className="py-2 font-medium">Indicador</th>
                  <th className="py-2 font-medium text-right"><Landmark className="h-3.5 w-3.5 inline mr-1" />Contábil (oficial)</th>
                  <th className="py-2 font-medium text-right"><Wallet className="h-3.5 w-3.5 inline mr-1" />Bancário (gerencial)</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-slate-100">
                  <td className="py-2 text-slate-700">Receitas</td>
                  <td className="py-2 text-right font-semibold text-green-700">{formatBRL(c.totalReceitas)}</td>
                  <td className="py-2 text-right text-green-700">{formatBRL(b?.receita || 0)}</td>
                </tr>
                <tr className="border-b border-slate-100">
                  <td className="py-2 text-slate-700">Despesas + Impostos</td>
                  <td className="py-2 text-right font-semibold text-red-700">{formatBRL(c.totalDespesas)}</td>
                  <td className="py-2 text-right text-red-700">{formatBRL(b?.despesa || 0)}</td>
                </tr>
                <tr className="bg-slate-50 font-bold">
                  <td className="py-2 px-2">Resultado</td>
                  <td className={`py-2 px-2 text-right ${c.resultado >= 0 ? 'text-green-800' : 'text-red-800'}`}>{formatBRL(c.resultado)}</td>
                  <td className={`py-2 px-2 text-right ${(b?.resultado || 0) >= 0 ? 'text-green-800' : 'text-red-800'}`}>{formatBRL(b?.resultado || 0)}</td>
                </tr>
              </tbody>
            </table>
            {b && !b.temExtrato && (
              <p className="text-xs text-slate-500 mt-2">* Sem extrato bancário importado para este mês.</p>
            )}
          </div>

          {/* Detalhamento por conta */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <h3 className="font-bold text-slate-900 mb-3 text-green-700">Receitas por conta</h3>
              {c.receitas.length === 0 ? (
                <p className="text-sm text-slate-400">Nenhuma receita lançada.</p>
              ) : (
                <table className="w-full text-sm">
                  <tbody>
                    {c.receitas.map((r: any) => (
                      <tr key={r.code} className="border-b border-slate-100">
                        <td className="py-2 text-slate-600"><span className="font-mono text-xs">{r.code}</span> {r.name}</td>
                        <td className="py-2 text-right font-semibold text-green-700">{formatBRL(r.total)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <h3 className="font-bold text-slate-900 mb-3 text-red-700">Despesas por conta</h3>
              {c.despesas.length === 0 ? (
                <p className="text-sm text-slate-400">Nenhuma despesa lançada.</p>
              ) : (
                <table className="w-full text-sm">
                  <tbody>
                    {c.despesas.map((d: any) => (
                      <tr key={d.code} className="border-b border-slate-100">
                        <td className="py-2 text-slate-600"><span className="font-mono text-xs">{d.code}</span> {d.name}</td>
                        <td className="py-2 text-right font-semibold text-red-700">{formatBRL(d.total)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}