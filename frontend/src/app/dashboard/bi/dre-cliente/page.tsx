'use client';
// =================================================================
// INÍCIO: frontend/src/app/dashboard/bi/dre-cliente/page.tsx (v3)
// =================================================================
// 🆕 ADR-076: DRE mensal OU acumulado por período (start/end YYYY-MM)
// Mantém: cards dos 3 DREs, confronto Contábil × Bancário, 🖨️/📄.
// =================================================================
import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  Loader2, TrendingUp, TrendingDown, DollarSign,
  Landmark, Wallet, CheckCircle2, AlertCircle, ArrowRightLeft,
  Building, BookOpen, Printer, FileDown,
} from 'lucide-react';
import api from '@/lib/axios';

const formatBRL = (v: number) =>
  Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const MONTH_NAMES = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
const pad2 = (n: number) => String(n).padStart(2, '0');

export default function DreClientePage() {
  const [clients, setClients] = useState<any[]>([]);
  const [clientId, setClientId] = useState('');
  const now = new Date();

  // 🆕 ADR-076: modo mensal ou acumulado
  const [mode, setMode] = useState<'mensal' | 'periodo'>('mensal');
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [startM, setStartM] = useState(1);
  const [startY, setStartY] = useState(now.getFullYear());
  const [endM, setEndM] = useState(now.getMonth() + 1);
  const [endY, setEndY] = useState(now.getFullYear());

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/clients').then((r) => {
      const list = r.data.data || r.data || [];
      setClients(list);
      if (list.length > 0) setClientId(list[0].id);
    }).catch(() => {});
  }, []);

  const periodLabel =
    mode === 'mensal'
      ? `${MONTH_NAMES[month - 1]}/${year}`
      : `${MONTH_NAMES[startM - 1]}/${startY} → ${MONTH_NAMES[endM - 1]}/${endY} (acumulado)`;

  const load = useCallback(async () => {
    if (!clientId) return;
    setLoading(true);
    try {
      const params: any = { clientId };
      if (mode === 'mensal') {
        params.year = year;
        params.month = month;
      } else {
        params.start = `${startY}-${pad2(startM)}`;
        params.end = `${endY}-${pad2(endM)}`;
      }
      const { data: res } = await api.get('/accounting/dre', { params });
      setData(res.data);
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [clientId, mode, month, year, startM, startY, endM, endY]);

  useEffect(() => { load(); }, [load]);

  const c = data?.contabil;
  const b = data?.bancario;
  const diferenca = c && b ? c.resultado - b.resultado : 0;
  const clientName = clients.find((cl) => cl.id === clientId)?.companyName || 'Cliente';

  // =================================================================
  // 🖨️ IMPRIMIR (impressora)
  // =================================================================
  function handlePrint() {
    if (!c) return;
    const w = window.open('', '_blank', 'width=980,height=720');
    if (!w) { toast.error('Permita pop-ups para imprimir.'); return; }
    const rowsRec = (c.receitas || []).map((r: any) =>
      `<tr><td><span style="font-family:monospace;font-size:10px">${r.code}</span> ${r.name}</td><td class="r g">${formatBRL(r.total)}</td></tr>`).join('');
    const rowsDes = (c.despesas || []).map((d: any) =>
      `<tr><td><span style="font-family:monospace;font-size:10px">${d.code}</span> ${d.name}</td><td class="r rd">${formatBRL(d.total)}</td></tr>`).join('');
    w.document.write(`
      <html><head><title>DRE ${clientName} ${periodLabel}</title>
      <style>
        body{font-family:Arial,Helvetica,sans-serif;font-size:12px;color:#0f172a;padding:24px}
        h1{font-size:18px;margin:0} h2{font-size:14px;color:#0d9488;margin:4px 0}
        p{font-size:11px;color:#475569} h3{font-size:13px;margin:16px 0 4px}
        table{width:100%;border-collapse:collapse;margin-top:8px}
        th,td{border:1px solid #cbd5e1;padding:6px 8px;text-align:left}
        th{background:#f1f5f9;text-transform:uppercase;font-size:10px}
        .r{text-align:right} .g{color:#047857;font-weight:bold} .rd{color:#b91c1c;font-weight:bold}
      </style></head><body>
      <h1>Conta Certa — DRE do Cliente (Oficial) ${mode === 'periodo' ? '— ACUMULADO' : ''}</h1>
      <h2>${clientName}</h2>
      <p>Período: ${periodLabel} • Emitido em ${new Date().toLocaleDateString('pt-BR')}</p>
      <p><strong>Receitas:</strong> ${formatBRL(c.totalReceitas)} • <strong>Despesas:</strong> ${formatBRL(c.totalDespesas)} • <strong>Resultado:</strong> ${formatBRL(c.resultado)}</p>
      <h3>Confronto: Contábil × Bancário</h3>
      <table>
        <thead><tr><th>Indicador</th><th class="r">Contábil (oficial)</th><th class="r">Bancário (gerencial)</th></tr></thead>
        <tbody>
          <tr><td>Receitas</td><td class="r g">${formatBRL(c.totalReceitas)}</td><td class="r">${formatBRL(b?.receita || 0)}</td></tr>
          <tr><td>Despesas + Impostos</td><td class="r rd">${formatBRL(c.totalDespesas)}</td><td class="r">${formatBRL(b?.despesa || 0)}</td></tr>
          <tr><td><strong>Resultado</strong></td><td class="r ${c.resultado >= 0 ? 'g' : 'rd'}">${formatBRL(c.resultado)}</td><td class="r">${formatBRL(b?.resultado || 0)}</td></tr>
        </tbody>
      </table>
      <h3>Receitas por conta</h3>
      <table><thead><tr><th>Conta</th><th class="r">Valor</th></tr></thead><tbody>${rowsRec || '<tr><td colspan="2">Nenhuma receita no período.</td></tr>'}</tbody></table>
      <h3>Despesas por conta</h3>
      <table><thead><tr><th>Conta</th><th class="r">Valor</th></tr></thead><tbody>${rowsDes || '<tr><td colspan="2">Nenhuma despesa no período.</td></tr>'}</tbody></table>
      <script>window.onload = function(){ window.focus(); window.print(); }<\/script>
      </body></html>`);
    w.document.close();
  }

  // =================================================================
  // 📄 PDF
  // =================================================================
  function handlePdf() {
    if (!c) return;
    const doc = new jsPDF();
    doc.setFontSize(16); doc.setTextColor(13, 148, 136);
    doc.text(`Conta Certa — DRE do Cliente (Oficial)${mode === 'periodo' ? ' — ACUMULADO' : ''}`, 14, 16);
    doc.setFontSize(11); doc.setTextColor(30);
    doc.text(clientName, 14, 24);
    doc.setFontSize(9); doc.setTextColor(100);
    doc.text(`Período: ${periodLabel} • Emitido em ${new Date().toLocaleDateString('pt-BR')}`, 14, 30);
    doc.text(
      `Receitas ${formatBRL(c.totalReceitas)} • Despesas ${formatBRL(c.totalDespesas)} • Resultado ${formatBRL(c.resultado)}`,
      14, 36,
    );
    autoTable(doc, {
      startY: 42,
      head: [['Indicador', 'Contábil (oficial)', 'Bancário (gerencial)']],
      body: [
        ['Receitas', formatBRL(c.totalReceitas), formatBRL(b?.receita || 0)],
        ['Despesas + Impostos', formatBRL(c.totalDespesas), formatBRL(b?.despesa || 0)],
        ['Resultado', formatBRL(c.resultado), formatBRL(b?.resultado || 0)],
      ],
      styles: { fontSize: 9 },
      headStyles: { fillColor: [13, 148, 136] },
      columnStyles: { 1: { halign: 'right' }, 2: { halign: 'right' } },
    });
    const y1 = (doc as any).lastAutoTable?.finalY ?? 70;
    autoTable(doc, {
      startY: y1 + 6,
      head: [['Receitas por conta', 'Valor']],
      body: (c.receitas || []).map((r: any) => [`${r.code} ${r.name}`, formatBRL(r.total)]),
      styles: { fontSize: 8 }, headStyles: { fillColor: [4, 120, 87] },
      columnStyles: { 1: { halign: 'right' } },
    });
    const y2 = (doc as any).lastAutoTable?.finalY ?? y1 + 40;
    autoTable(doc, {
      startY: y2 + 6,
      head: [['Despesas por conta', 'Valor']],
      body: (c.despesas || []).map((d: any) => [`${d.code} ${d.name}`, formatBRL(d.total)]),
      styles: { fontSize: 8 }, headStyles: { fillColor: [185, 28, 28] },
      columnStyles: { 1: { halign: 'right' } },
    });
    doc.save(`dre-cliente-${mode === 'periodo' ? `${startY}-${pad2(startM)}_a_${endY}-${pad2(endM)}` : `${year}-${pad2(month)}`}.pdf`);
    toast.success('PDF do DRE gerado!');
  }

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <BookOpen className="h-7 w-7 text-teal-600" /> DRE do Cliente (Oficial)
          </h1>
          <p className="text-slate-600 mt-1">
            DRE contábil oficial derivado dos <strong>lançamentos promovidos</strong> do extrato.
            Confronta com o DRE bancário do mesmo período.
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={handlePrint} disabled={!c || loading}
            className="inline-flex items-center gap-2 px-4 py-2.5 border border-slate-300 rounded-lg text-sm font-semibold bg-white hover:bg-slate-50 disabled:opacity-50">
            <Printer className="h-4 w-4" /> Imprimir
          </button>
          <button onClick={handlePdf} disabled={!c || loading}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-teal-600 hover:bg-teal-700 rounded-lg text-sm font-semibold text-white disabled:opacity-50">
            <FileDown className="h-4 w-4" /> PDF
          </button>
        </div>
      </div>

      {/* Cards dos 3 DREs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="bg-white rounded-xl border-2 border-teal-300 p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <BookOpen className="h-4 w-4 text-teal-600" />
            <span className="text-xs font-bold text-teal-700 uppercase tracking-wide">Oficial (atual)</span>
          </div>
          <p className="text-sm font-semibold text-slate-900">DRE do Cliente</p>
          <p className="text-xs text-slate-500 mt-0.5">Fonte: Lançamentos Contábeis</p>
        </div>
        <Link href="/dashboard/fechamento" className="bg-white rounded-xl border border-slate-200 p-4 hover:border-teal-400 hover:shadow-sm transition-all">
          <div className="flex items-center gap-2 mb-1">
            <Wallet className="h-4 w-4 text-orange-600" />
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">Bancário</span>
          </div>
          <p className="text-sm font-semibold text-slate-900">DRE do Cliente (Bancário)</p>
          <p className="text-xs text-slate-500 mt-0.5">Fonte: Extrato + Classificação</p>
        </Link>
        <Link href="/dashboard/bi" className="bg-white rounded-xl border border-slate-200 p-4 hover:border-teal-400 hover:shadow-sm transition-all">
          <div className="flex items-center gap-2 mb-1">
            <Building className="h-4 w-4 text-purple-600" />
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">Escritório</span>
          </div>
          <p className="text-sm font-semibold text-slate-900">DRE do Escritório</p>
          <p className="text-xs text-slate-500 mt-0.5">Fonte: Transações Financeiras</p>
        </Link>
      </div>

      {/* 🆕 Filtros: cliente + modo + período */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <select value={clientId} onChange={(e) => setClientId(e.target.value)}
            className="border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white min-w-[260px]">
            <option value="">Selecione o cliente...</option>
            {clients.map((cl) => (<option key={cl.id} value={cl.id}>{cl.companyName}</option>))}
          </select>

          {/* 🆕 ADR-076: seletor de modo */}
          <div className="flex rounded-lg border border-slate-300 overflow-hidden">
            <button onClick={() => setMode('mensal')}
              className={`px-4 py-2 text-sm font-semibold ${mode === 'mensal' ? 'bg-teal-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-50'}`}>
              Mensal
            </button>
            <button onClick={() => setMode('periodo')}
              className={`px-4 py-2 text-sm font-semibold ${mode === 'periodo' ? 'bg-teal-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-50'}`}>
              Acumulado por período
            </button>
          </div>
        </div>

        {mode === 'mensal' ? (
          <div className="flex flex-wrap items-center gap-3">
            <select value={month} onChange={(e) => setMonth(Number(e.target.value))} className="border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white">
              {MONTH_NAMES.map((m, i) => (<option key={i} value={i + 1}>{m}</option>))}
            </select>
            <select value={year} onChange={(e) => setYear(Number(e.target.value))} className="border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white">
              {[now.getFullYear() - 1, now.getFullYear(), now.getFullYear() + 1].map((y) => (<option key={y} value={y}>{y}</option>))}
            </select>
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-sm font-semibold text-slate-600">De</span>
            <select value={startM} onChange={(e) => setStartM(Number(e.target.value))} className="border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white">
              {MONTH_NAMES.map((m, i) => (<option key={i} value={i + 1}>{m}</option>))}
            </select>
            <select value={startY} onChange={(e) => setStartY(Number(e.target.value))} className="border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white">
              {[now.getFullYear() - 1, now.getFullYear(), now.getFullYear() + 1].map((y) => (<option key={y} value={y}>{y}</option>))}
            </select>
            <span className="text-sm font-semibold text-slate-600">até</span>
            <select value={endM} onChange={(e) => setEndM(Number(e.target.value))} className="border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white">
              {MONTH_NAMES.map((m, i) => (<option key={i} value={i + 1}>{m}</option>))}
            </select>
            <select value={endY} onChange={(e) => setEndY(Number(e.target.value))} className="border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white">
              {[now.getFullYear() - 1, now.getFullYear(), now.getFullYear() + 1].map((y) => (<option key={y} value={y}>{y}</option>))}
            </select>
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 text-teal-600 animate-spin" /></div>
      ) : !c ? (
        <div className="bg-white rounded-xl border border-slate-200 p-10 text-center text-slate-500">
          Selecione um cliente para visualizar o DRE.
        </div>
      ) : (
        <>
          <div className={`rounded-xl border p-4 flex items-center gap-3 ${c.lancamentos > 0 ? 'bg-teal-50 border-teal-200' : 'bg-amber-50 border-amber-200'}`}>
            {c.lancamentos > 0 ? <CheckCircle2 className="h-5 w-5 text-teal-700" /> : <AlertCircle className="h-5 w-5 text-amber-700" />}
            <p className="text-sm text-slate-700">
              {c.lancamentos > 0 ? (
                <>
                  <strong>{c.lancamentos}</strong> lançamento(s) no período •{' '}
                  <strong>{c.conciliados}</strong> conciliado(s) •{' '}
                  <strong>{c.pendentes}</strong> pendente(s).
                </>
              ) : (
                <>
                  Nenhum lançamento contábil no período selecionado.{' '}
                  <Link href="/dashboard/fechamento" className="font-semibold text-teal-700 underline">
                    Fechar e promover o extrato
                  </Link>{' '}
                  para gerar o DRE oficial.
                </>
              )}
            </p>
          </div>

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

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
              <ArrowRightLeft className="h-4 w-4 text-blue-600" /> Confronto: Contábil × Bancário ({periodLabel})
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
              <p className="text-xs text-slate-500 mt-2">* Sem extrato bancário importado para este período.</p>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <h3 className="font-bold text-slate-900 mb-3 text-green-700">Receitas por conta (acumulado)</h3>
              {c.receitas.length === 0 ? (
                <p className="text-sm text-slate-400">Nenhuma receita no período.</p>
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
              <h3 className="font-bold text-slate-900 mb-3 text-red-700">Despesas por conta (acumulado)</h3>
              {c.despesas.length === 0 ? (
                <p className="text-sm text-slate-400">Nenhuma despesa no período.</p>
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
// =================================================================
// FIM: frontend/src/app/dashboard/bi/dre-cliente/page.tsx (v3)
// =================================================================