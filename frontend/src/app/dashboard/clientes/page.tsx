'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/axios';
import { toast } from 'sonner';
import {
  Users, TrendingUp, TrendingDown, DollarSign, Calendar,
  Edit2, Download, X, Loader2
} from 'lucide-react';

const months = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
const monthsShort = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

const inputClass = "w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all bg-white";

export default function ClientesPage() {
  const [loading, setLoading] = useState(true);
  const [year, setYear] = useState(new Date().getFullYear());
  const [stats, setStats] = useState<any>(null);
  const [monthlyData, setMonthlyData] = useState<any[]>([]);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingMonth, setEditingMonth] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<any>({});

  useEffect(() => {
    loadData();
  }, [year]);

  async function loadData() {
    try {
      setLoading(true);
      const [statsRes, monthlyRes] = await Promise.all([
        api.get(`/clients/dashboard?year=${year}`),
        api.get(`/clients/monthly?year=${year}`),
      ]);
      setStats(statsRes.data.data);
      setMonthlyData(monthlyRes.data.data || []);
    } catch (err) {
      toast.error('Erro ao carregar dados da carteira');
    } finally {
      setLoading(false);
    }
  }

  function openEditModal(month: number) {
    const data = monthlyData.find((m) => m.month === month) || {};
    setEditingMonth(month);
    setEditForm({
      initialClients: data.initialClients || 0,
      newClients: data.newClients || 0,
      churnedClients: data.churnedClients || 0,
      newRevenue: data.newRevenue || 0,
      lostRevenue: data.lostRevenue || 0,
    });
    setShowEditModal(true);
  }

  async function saveMonthlyData() {
    if (!editingMonth) return;
    try {
      await api.post('/clients/monthly', {
        year,
        month: editingMonth,
        data: editForm,
      });
      toast.success('Dados mensais salvos com sucesso!');
      setShowEditModal(false);
      loadData();
    } catch (err) {
      toast.error('Erro ao salvar dados mensais');
    }
  }

  // 🔥 CÁLCULOS AUTOMÁTICOS EM TEMPO REAL NO MODAL
  const finalClients = (editForm.initialClients || 0) + (editForm.newClients || 0) - (editForm.churnedClients || 0);
  const churnRate = (editForm.initialClients || 0) > 0 ? ((editForm.churnedClients || 0) / (editForm.initialClients || 0)) * 100 : 0;
  const estimatedFinalRevenue = ((editForm.initialClients || 0) * (stats?.averageTicket || 0)) + (editForm.newRevenue || 0) - (editForm.lostRevenue || 0);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="h-12 w-12 text-teal-600 animate-spin mb-4" />
        <p className="text-slate-600">Carregando carteira de clientes...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* CABEÇALHO */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
            <Users className="h-8 w-8 text-teal-600" />
            Carteira de Clientes
          </h1>
          <p className="text-slate-600 mt-1">Acompanhe o crescimento, churn e receita recorrente</p>
        </div>
        <div className="flex gap-3">
          <select
            value={year}
            onChange={(e) => setYear(parseInt(e.target.value))}
            className={`${inputClass} w-32`}
          >
            {[2023, 2024, 2025, 2026, 2027].map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
      </div>

      {/* KPIs */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <KpiCard 
            icon={Users} 
            label="Total de Clientes" 
            value={stats.totalClients} 
            sublabel={`${stats.totalClients - (stats.churnedThisYear || 0)} ativos`} 
            color="teal" 
          />
          <KpiCard 
            icon={TrendingDown} 
            label="Taxa de Churn (Ano)" 
            value={`${stats.churnRate}%`} 
            sublabel={`${stats.churnedThisYear || 0} clientes perdidos`} 
            color="red" 
            extra={
              <div className="text-[10px] text-slate-500 mt-2 p-2 bg-slate-50 rounded border border-slate-100">
                <strong>Fórmula:</strong> (Clientes Perdidos / Média de Clientes) × 100
              </div>
            }
          />
          <KpiCard 
            icon={DollarSign} 
            label="Receita Recorrente (MRR)" 
            value={`R$ ${stats.monthlyRevenue?.toFixed(2) || '0.00'}`} 
            sublabel="Faturamento mensal ativo" 
            color="green" 
          />
          <KpiCard 
            icon={TrendingUp} 
            label="Ticket Médio" 
            value={`R$ ${stats.averageTicket?.toFixed(2) || '0.00'}`} 
            sublabel="Por cliente ativo" 
            color="blue" 
          />
        </div>
      )}

      {/* GRÁFICO DE EVOLUÇÃO (CSS Puro - Sem bugs de biblioteca) */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <h3 className="text-lg font-bold text-slate-900 mb-4">Evolução de Clientes (Últimos 12 Meses)</h3>
        <div className="h-64 flex items-end justify-around gap-2 border-b border-l border-slate-200 pb-2 pl-2">
          {monthlyData.map((m, idx) => {
            const maxClients = Math.max(...monthlyData.map((mm) => mm.finalClients), 1);
            const height = (m.finalClients / maxClients) * 100;
            return (
              <div key={m.month} className="flex flex-col items-center flex-1 group">
                <div className="relative w-full flex justify-center" style={{ height: '200px' }}>
                  <div 
                    className="w-4 bg-teal-500 rounded-t transition-all group-hover:bg-teal-700 cursor-pointer"
                    style={{ height: `${Math.max(height, 2)}%` }}
                    title={`Final: ${m.finalClients} | Novos: ${m.newClients} | Churn: ${m.churnedClients}`}
                  />
                  <div className="absolute bottom-full mb-2 hidden group-hover:block bg-slate-800 text-white text-xs rounded px-2 py-1 whitespace-nowrap z-10">
                    Início: {m.initialClients} | Final: {m.finalClients}
                  </div>
                </div>
                <span className="text-xs text-slate-600 mt-2">{monthsShort[idx]}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* TABELA DE DADOS MENSAIS */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex justify-between items-center">
          <h3 className="text-lg font-bold text-slate-900">Dados Mensais</h3>
          <button className="flex items-center gap-2 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
            <Download className="h-4 w-4" /> Exportar CSV
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-600 uppercase">Mês</th>
                <th className="text-center px-6 py-3 text-xs font-semibold text-slate-600 uppercase">Clientes Início</th>
                <th className="text-center px-6 py-3 text-xs font-semibold text-slate-600 uppercase text-green-700">Novos</th>
                <th className="text-center px-6 py-3 text-xs font-semibold text-slate-600 uppercase text-red-700">Cancelados</th>
                <th className="text-center px-6 py-3 text-xs font-semibold text-slate-600 uppercase">Clientes Final</th>
                <th className="text-center px-6 py-3 text-xs font-semibold text-slate-600 uppercase">Churn Mês (%)</th>
                <th className="text-center px-6 py-3 text-xs font-semibold text-slate-600 uppercase">Churn Acumulado (%)</th>
                <th className="text-right px-6 py-3 text-xs font-semibold text-slate-600 uppercase">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {monthlyData.map((m, idx) => (
                <tr key={m.month} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 font-medium text-slate-900">{months[idx]}</td>
                  <td className="px-6 py-4 text-center text-slate-700">{m.initialClients}</td>
                  <td className="px-6 py-4 text-center text-green-600 font-medium">+{m.newClients}</td>
                  <td className="px-6 py-4 text-center text-red-600 font-medium">-{m.churnedClients}</td>
                  <td className="px-6 py-4 text-center font-bold text-slate-900">{m.finalClients}</td>
                  <td className="px-6 py-4 text-center text-teal-600 font-medium">{m.churnRate}%</td>
                  <td className="px-6 py-4 text-center text-slate-600">{m.accumulatedChurn}%</td>
                  <td className="px-6 py-4 text-right">
                    <button 
                      onClick={() => openEditModal(m.month)} 
                      className="p-1.5 text-slate-500 hover:text-teal-600 hover:bg-teal-50 rounded transition-colors"
                      title="Editar dados do mês"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL DE EDIÇÃO MENSAL */}
      {showEditModal && editingMonth && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-slate-200 sticky top-0 bg-white z-10">
              <h2 className="text-xl font-bold text-slate-900">Editar Dados - {months[editingMonth - 1]}</h2>
              <button onClick={() => setShowEditModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Clientes no Início do Mês</label>
                  <input
                    type="number"
                    value={editForm.initialClients}
                    onChange={(e) => setEditForm({ ...editForm, initialClients: parseInt(e.target.value) || 0 })}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Novos Clientes</label>
                  <input
                    type="number"
                    value={editForm.newClients}
                    onChange={(e) => setEditForm({ ...editForm, newClients: parseInt(e.target.value) || 0 })}
                    className={`${inputClass} text-green-700`}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Clientes Cancelados (Churn)</label>
                  <input
                    type="number"
                    value={editForm.churnedClients}
                    onChange={(e) => setEditForm({ ...editForm, churnedClients: parseInt(e.target.value) || 0 })}
                    className={`${inputClass} text-red-700`}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Receita de Novos (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editForm.newRevenue}
                    onChange={(e) => setEditForm({ ...editForm, newRevenue: parseFloat(e.target.value) || 0 })}
                    className={inputClass}
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-slate-700 mb-1">Receita Perdida com Churn (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editForm.lostRevenue}
                    onChange={(e) => setEditForm({ ...editForm, lostRevenue: parseFloat(e.target.value) || 0 })}
                    className={inputClass}
                  />
                </div>
              </div>

              {/* Resumo Automático em Tempo Real */}
              <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 mt-4">
                <h3 className="font-semibold text-slate-900 mb-3 text-sm">Resumo Automático do Mês</h3>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-xs text-slate-600">Clientes Final</p>
                    <p className="text-xl font-bold text-slate-900">{finalClients}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-600">Churn do Mês</p>
                    <p className="text-xl font-bold text-red-600">{churnRate.toFixed(2)}%</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-600">Receita Final Estimada</p>
                    <p className="text-xl font-bold text-green-600">R$ {estimatedFinalRevenue.toFixed(2)}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 p-6 border-t border-slate-200 sticky bottom-0 bg-white">
              <button onClick={() => setShowEditModal(false)} className="px-4 py-2 text-slate-700 hover:bg-slate-100 rounded-lg font-medium">
                Cancelar
              </button>
              <button onClick={saveMonthlyData} className="px-6 py-2 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-lg transition-colors">
                Salvar Alterações
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Componente KPI Card Reutilizável
function KpiCard({ icon: Icon, label, value, sublabel, extra, color }: any) {
  const colorMap: any = {
    teal: 'bg-teal-50 text-teal-600',
    red: 'bg-red-50 text-red-600',
    green: 'bg-green-50 text-green-600',
    blue: 'bg-blue-50 text-blue-600',
  };
  return (
    <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
      <div className="flex items-center gap-3 mb-3">
        <div className={`p-2 rounded-lg ${colorMap[color]}`}>
          <Icon className="h-5 w-5" />
        </div>
        <span className="text-sm font-semibold text-slate-600">{label}</span>
      </div>
      <div className="text-2xl font-bold text-slate-900 mb-1">{value}</div>
      <p className="text-xs text-slate-500">{sublabel}</p>
      {extra}
    </div>
  );
}