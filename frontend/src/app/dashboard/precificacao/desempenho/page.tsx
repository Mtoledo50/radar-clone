// =================================================================
// INÍCIO: frontend/src/app/dashboard/precificacao/desempenho/page.tsx
// =================================================================
/**
 * =================================================================
 * 📈 DASHBOARD DE DESEMPENHO COMERCIAL — Sprint A7
 * =================================================================
 * A máquina comercial em números: funil de conversão, velocidade de
 * fechamento, desconto médio praticado e, o mais importante,
 * QUANTO DINHEIRO a equipe está ganhando (ou deixando na mesa).
 *
 * 🎯 Fonte da verdade:
 *    GET /proposals/performance?period=30d
 *    → consome o `closingDetails` gravado pela Sprint A4.
 *
 * 🧠 ADRs:
 * - ADR-001: gráficos em CSS puro (zero Recharts/Chart.js).
 * - ADR-020: valores monetários já round2 no backend.
 * =================================================================
 */
'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/axios';
import {
  Loader2, TrendingUp, TrendingDown, Target, Clock,
  Percent, DollarSign, Trophy, XCircle, ArrowRight,
} from 'lucide-react';

// =================================================================
// 📋 TIPOS (espelho do contrato do backend)
// =================================================================

interface PerformanceData {
  funnel: {
    total: number;
    sent: number;
    viewed: number;
    won: number;
    lost: number;
  };
  conversionRate: number;       // won ÷ total (%)
  avgDaysToClose: number;       // média sentAt → closedAt
  avgDiscountPercent: number;   // desconto médio praticado
  gain: {
    monthly: number;            // ganho mensal acumulado
    yearly: number;             // ganho anual acumulado
    concessionMonthly: number;  // quanto foi aberto mão / mês
    concessionYearly: number;   // quanto foi aberto mão / ano
  };
  topGains: Array<{
    clientName: string;
    closedAt: string;
    closedPrice: number;
    discountPercent: number;
    gainMonthly: number;
  }>;
  lossReasons: Array<{
    reason: string;
    count: number;
  }>;
}

// =================================================================
// 🔧 HELPERS
// =================================================================

/** BRL pt-BR (ADR-020: valores já round2 no backend). */
function brl(v: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })
    .format(v || 0);
}

function dateBR(iso: string): string {
  return new Date(iso).toLocaleDateString('pt-BR');
}

/** Sinal prefixado p/ valores monetários (+R$ 100 / -R$ 50). */
function brlSigned(v: number): string {
  return (v >= 0 ? '+' : '') + brl(v);
}

// =================================================================
// 🎯 COMPONENTE PRINCIPAL
// =================================================================
export default function DesempenhoPage() {
  const [period, setPeriod] = useState('30d');
  const [data, setData] = useState<PerformanceData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period]);

  async function loadData() {
    try {
      setLoading(true);
      const res = await api.get(`/proposals/performance?period=${period}`);
      setData(res.data.data);
    } catch (err) {
      console.error('Erro ao carregar desempenho:', err);
    } finally {
      setLoading(false);
    }
  }

  // =================================================================
  // RENDERIZAÇÃO: LOADING
  // =================================================================
  if (loading || !data) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-12 w-12 text-teal-600 animate-spin" />
      </div>
    );
  }

  const { funnel, conversionRate, avgDaysToClose, avgDiscountPercent, gain, topGains, lossReasons } = data;

  // Base do funil (total ou 1 p/ evitar divisão por zero)
  const funnelBase = Math.max(funnel.total, 1);

  // Base dos motivos de perda (p/ barra proporcional)
  const maxLossCount = Math.max(...lossReasons.map((r) => r.count), 1);
  const totalLosses = lossReasons.reduce((s, r) => s + r.count, 0);

  return (
    <div className="space-y-6">
      {/* ============================================================= */}
      {/* HEADER                                                        */}
      {/* ============================================================= */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
            <TrendingUp className="h-8 w-8 text-teal-600" />
            Desempenho Comercial
          </h1>
          <p className="text-slate-600 mt-1">
            A máquina comercial em números — conversão, velocidade, ganho e motivos de perda.
          </p>
        </div>

        {/* Seletor de período */}
        <select
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
          className="px-4 py-2.5 border border-slate-300 rounded-lg bg-white text-slate-900 font-medium focus:ring-2 focus:ring-teal-500"
        >
          <option value="7d">Últimos 7 dias</option>
          <option value="30d">Últimos 30 dias</option>
          <option value="90d">Últimos 90 dias</option>
          <option value="12m">Últimos 12 meses</option>
          <option value="ytd">Este ano</option>
        </select>
      </div>

      {/* ============================================================= */}
      {/* 4 KPIs PRINCIPAIS                                             */}
      {/* ============================================================= */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard
          icon={Target}
          label="Taxa de Conversão"
          value={`${conversionRate}%`}
          hint={`${funnel.won} de ${funnel.total} propostas`}
          color="teal"
        />
        <KpiCard
          icon={Clock}
          label="Tempo p/ Fechar"
          value={`${avgDaysToClose}d`}
          hint="média sentAt → closedAt"
          color="blue"
        />
        <KpiCard
          icon={Percent}
          label="Desconto Médio"
          value={`${avgDiscountPercent}%`}
          hint="praticado em fechamentos"
          color="orange"
        />
        <KpiCard
          icon={DollarSign}
          label="Ganho Acumulado"
          value={brl(gain.yearly)}
          hint={`${brl(gain.monthly)}/mês • ADR-04`}
          color="green"
        />
      </div>

      {/* ============================================================= */}
      {/* 💰 CARD DE DESTAQUE — Ganho × Concessão (dinheiro real)       */}
      {/* ============================================================= */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
        <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
          <DollarSign className="h-5 w-5 text-teal-600" />
          Dinheiro em Jogo (fechamentos do período)
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Coluna 1: GANHO (quanto o escritório está ganhando a mais) */}
          <div className="p-5 rounded-xl bg-gradient-to-br from-green-50 to-teal-50 border border-green-200">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="h-5 w-5 text-green-700" />
              <p className="text-sm font-bold text-green-900 uppercase tracking-wide">
                Ganho vs. Cobrado Hoje
              </p>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-baseline">
                <span className="text-sm text-green-800">Mensal</span>
                <span className="text-2xl font-bold text-green-700">
                  {brlSigned(gain.monthly)}
                </span>
              </div>
              <div className="flex justify-between items-baseline">
                <span className="text-sm text-green-800">Anual</span>
                <span className="text-xl font-bold text-green-700">
                  {brlSigned(gain.yearly)}
                </span>
              </div>
            </div>
            <p className="text-xs text-green-700/80 mt-3">
              💰 Diferença entre o preço fechado e o que o cliente já pagava.
            </p>
          </div>

          {/* Coluna 2: CONCESSÃO (quanto abriu mão via desconto) */}
          <div className="p-5 rounded-xl bg-gradient-to-br from-orange-50 to-amber-50 border border-orange-200">
            <div className="flex items-center gap-2 mb-3">
              <TrendingDown className="h-5 w-5 text-orange-700" />
              <p className="text-sm font-bold text-orange-900 uppercase tracking-wide">
                Concessão (Desconto)
              </p>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-baseline">
                <span className="text-sm text-orange-800">Mensal</span>
                <span className="text-2xl font-bold text-orange-700">
                  {brl(gain.concessionMonthly)}
                </span>
              </div>
              <div className="flex justify-between items-baseline">
                <span className="text-sm text-orange-800">Anual</span>
                <span className="text-xl font-bold text-orange-700">
                  {brl(gain.concessionYearly)}
                </span>
              </div>
            </div>
            <p className="text-xs text-orange-700/80 mt-3">
              🟡 Quanto ficou na mesa — preço cheio menos preço fechado.
            </p>
          </div>
        </div>

        {/* Balanço líquido anual (ganho − concessão) */}
        {gain.yearly > 0 && (
          <div className="mt-4 p-3 rounded-lg bg-slate-50 border border-slate-200 text-center">
            <p className="text-xs text-slate-600 mb-1">Balanço líquido anual</p>
            <p className="text-lg font-bold text-slate-900">
              {brlSigned(gain.yearly - gain.concessionYearly)}
            </p>
            <p className="text-xs text-slate-500 mt-0.5">
              (Ganho real do período − Concessão acumulada)
            </p>
          </div>
        )}
      </div>

      {/* ============================================================= */}
      {/* FUNIL DE CONVERSÃO (CSS puro — ADR-001)                       */}
      {/* ============================================================= */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
        <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
          <Target className="h-5 w-5 text-teal-600" />
          Funil de Conversão
        </h2>

        <div className="space-y-3">
          <FunnelRow
            label="Total Criadas"
            count={funnel.total}
            percent={100}
            color="bg-slate-400"
          />
          <FunnelRow
            label="Enviadas"
            count={funnel.sent}
            percent={(funnel.sent / funnelBase) * 100}
            color="bg-blue-500"
          />
          <FunnelRow
            label="Visualizadas"
            count={funnel.viewed}
            percent={(funnel.viewed / funnelBase) * 100}
            color="bg-amber-500"
          />
          <FunnelRow
            label="Ganhas ✅"
            count={funnel.won}
            percent={(funnel.won / funnelBase) * 100}
            color="bg-green-600"
            highlight
          />
          <FunnelRow
            label="Perdidas ❌"
            count={funnel.lost}
            percent={(funnel.lost / funnelBase) * 100}
            color="bg-red-500"
          />
        </div>

        <p className="text-xs text-slate-500 mt-4 italic">
          💡 Dica: propostas em rascunho contam no total mas não avançam no funil.
        </p>
      </div>

      {/* ============================================================= */}
      {/* TOP GANHOS × MOTIVOS DE PERDA (2 colunas)                     */}
      {/* ============================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 🏆 Top 5 fechamentos por ganho mensal */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
            <Trophy className="h-5 w-5 text-green-600" />
            Top 5 Fechamentos (ganho)
          </h2>

          {topGains.length === 0 ? (
            <EmptyState
              icon={Trophy}
              message="Nenhum fechamento com ganho no período."
              hint="Feche propostas com desconto p/ alimentar este ranking."
            />
          ) : (
            <div className="space-y-2">
              {topGains.map((g, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 border border-slate-100"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-500 to-teal-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-900 truncate">
                      {g.clientName}
                    </p>
                    <p className="text-xs text-slate-500">
                      {dateBR(g.closedAt)} • fechada com −{g.discountPercent.toFixed(1)}%
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-bold text-green-700">
                      {brlSigned(g.gainMonthly)}
                    </p>
                    <p className="text-xs text-slate-500">/mês</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ❌ Motivos de perda */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
            <XCircle className="h-5 w-5 text-red-600" />
            Motivos de Perda
          </h2>

          {lossReasons.length === 0 ? (
            <EmptyState
              icon={XCircle}
              message="Nenhuma proposta perdida no período."
              hint="Ótimo sinal — ou cadastre o motivo ao marcar como perdida."
            />
          ) : (
            <div className="space-y-3">
              {lossReasons.map((r, i) => {
                const pct = (r.count / maxLossCount) * 100;
                const share = totalLosses > 0 ? ((r.count / totalLosses) * 100).toFixed(0) : '0';
                return (
                  <div key={i}>
                    <div className="flex justify-between items-baseline mb-1">
                      <span className="text-sm font-medium text-slate-800 truncate pr-2">
                        {r.reason}
                      </span>
                      <span className="text-sm font-bold text-slate-900 flex-shrink-0">
                        {r.count} ({share}%)
                      </span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-red-400 to-red-600 rounded-full transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ============================================================= */}
      {/* RODAPÉ CONTEXTUAL                                             */}
      {/* ============================================================= */}
      <div className="bg-teal-50 border border-teal-200 rounded-xl p-4 text-sm text-teal-900">
        <p className="flex items-start gap-2">
          <ArrowRight className="h-4 w-4 mt-0.5 flex-shrink-0" />
          <span>
            <strong>Sprint A4 alimenta esta página:</strong> cada proposta fechada com o
            modal "Fechar com Ganho" grava desconto, preço final, ganho mensal e
            concessão em <code className="px-1 py-0.5 bg-teal-100 rounded text-xs">closingDetails</code>.
            Sem fechamentos A4, o dashboard aparece zerado.
          </span>
        </p>
      </div>
    </div>
  );
}

// =================================================================
// 🎨 SUBCOMPONENTES
// =================================================================

interface KpiCardProps {
  icon: any;
  label: string;
  value: string;
  hint: string;
  color: 'teal' | 'blue' | 'orange' | 'green';
}

const KPI_COLORS = {
  teal: { bg: 'bg-teal-50', icon: 'text-teal-600', value: 'text-teal-700' },
  blue: { bg: 'bg-blue-50', icon: 'text-blue-600', value: 'text-blue-700' },
  orange: { bg: 'bg-orange-50', icon: 'text-orange-600', value: 'text-orange-700' },
  green: { bg: 'bg-green-50', icon: 'text-green-600', value: 'text-green-700' },
};

function KpiCard({ icon: Icon, label, value, hint, color }: KpiCardProps) {
  const c = KPI_COLORS[color];
  return (
    <div className={`${c.bg} rounded-xl p-5 border border-white shadow-sm`}>
      <div className="flex items-center justify-between mb-2">
        <Icon className={`h-5 w-5 ${c.icon}`} />
      </div>
      <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">
        {label}
      </p>
      <p className={`text-2xl font-bold ${c.value} mb-1`}>{value}</p>
      <p className="text-xs text-slate-600">{hint}</p>
    </div>
  );
}

interface FunnelRowProps {
  label: string;
  count: number;
  percent: number;
  color: string;
  highlight?: boolean;
}

/** Linha do funil — barra proporcional em CSS puro (ADR-001). */
function FunnelRow({ label, count, percent, color, highlight }: FunnelRowProps) {
  const pct = Math.max(2, Math.min(100, percent)); // mínimo 2% p/ visibilidade
  return (
    <div className={highlight ? 'p-2 rounded-lg bg-green-50 -mx-2' : ''}>
      <div className="flex justify-between items-baseline mb-1">
        <span className={`text-sm font-semibold ${highlight ? 'text-green-900' : 'text-slate-800'}`}>
          {label}
        </span>
        <span className={`text-sm font-bold ${highlight ? 'text-green-700' : 'text-slate-700'}`}>
          {count} ({percent.toFixed(1)}%)
        </span>
      </div>
      <div className="h-7 bg-slate-100 rounded-md overflow-hidden relative">
        <div
          className={`h-full ${color} transition-all flex items-center justify-end pr-2`}
          style={{ width: `${pct}%` }}
        >
          {percent > 8 && (
            <span className="text-xs font-bold text-white drop-shadow">
              {count}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

interface EmptyStateProps {
  icon: any;
  message: string;
  hint: string;
}

function EmptyState({ icon: Icon, message, hint }: EmptyStateProps) {
  return (
    <div className="text-center py-8">
      <Icon className="h-10 w-10 text-slate-300 mx-auto mb-2" />
      <p className="text-sm text-slate-600 font-medium">{message}</p>
      <p className="text-xs text-slate-400 mt-1">{hint}</p>
    </div>
  );
}
// =================================================================
// FIM: frontend/src/app/dashboard/precificacao/desempenho/page.tsx
// =================================================================