/**
 * Página: Precificação e CRM de Propostas
 * Abas: Calculadora | Configurações | Regras de Horas | Meus Planos | Categorias | Propostas
 */
'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/axios';
import { toast } from 'sonner';
import {
  Package, Plus, Trash2, Edit2, Save, X, Check,
  ChevronDown, ChevronRight, Loader2, Tag, FolderOpen, FileText,
  Calculator, Settings, Clock, AlertTriangle, Download, TrendingUp, 
  FileCheck, FileX, DollarSign, Users
} from 'lucide-react';

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  AreaChart, Area, ResponsiveContainer
} from 'recharts';

const inputClass = 'w-full px-3 py-2 border-2 border-slate-300 rounded-lg text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-white';
const btnPrimary = 'flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50';
const btnSecondary = 'flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg transition-colors';

export default function PrecificacaoPage() {
  const [activeTab, setActiveTab] = useState<'calculator' | 'config' | 'rules' | 'plans' | 'categories' | 'propostas'>('calculator');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
          <Calculator className="h-8 w-8 text-teal-600" />
          Precificação & Propostas
        </h1>
        <p className="text-slate-600 mt-1">Configure custos, calcule preços e acompanhe o fechamento de propostas.</p>
      </div>

      <div className="flex gap-2 bg-slate-100 p-1 rounded-lg w-fit overflow-x-auto">
        {[
          { key: 'calculator', label: 'Calcular Preço', icon: Calculator },
          { key: 'config', label: 'Configurações', icon: Settings },
          { key: 'rules', label: 'Regras de Horas', icon: Clock },
          { key: 'plans', label: 'Meus Planos', icon: Tag },
          { key: 'categories', label: 'Categorias', icon: FolderOpen },
          { key: 'propostas', label: 'Propostas (CRM)', icon: TrendingUp },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={`flex items-center gap-2 px-4 py-2 rounded-md font-medium transition-colors whitespace-nowrap ${
              activeTab === tab.key ? 'bg-white text-teal-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <tab.icon className="h-4 w-4" /> {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'calculator' && <CalculatorTab />}
      {activeTab === 'config' && <ConfigTab />}
      {activeTab === 'rules' && <RulesTab />}
      {activeTab === 'plans' && <PlansTab />}
      {activeTab === 'categories' && <CategoriesTab />}
      {activeTab === 'propostas' && <PropostasTab />}
    </div>
  );
}

// =================================================================
// 📊 ABA: PROPOSTAS (CRM)
// =================================================================// =================================================================
// 📊 ABA: PROPOSTAS (CRM) COM GRÁFICOS
// =================================================================
function PropostasTab() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [proposals, setProposals] = useState<any[]>([]);
  const [trendData, setTrendData] = useState<any[]>([]);
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [showLostModal, setShowLostModal] = useState(false);
  const [selectedProposal, setSelectedProposal] = useState<any>(null);
  
  const [closeForm, setCloseForm] = useState({ planId: '', price: 0, discount: 0 });
  const [lostReason, setLostReason] = useState('Preço alto');

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [statsRes, proposalsRes, trendRes] = await Promise.all([
        api.get('/proposals/dashboard/stats'),
        api.get('/proposals'),
        api.get('/proposals/trend-data'),
      ]);
      setStats(statsRes.data.data);
      setProposals(proposalsRes.data.data);
      setTrendData(trendRes.data.data);
    } catch (err) {
      toast.error('Erro ao carregar dados do CRM');
    } finally {
      setLoading(false);
    }
  }

  async function handleCloseProposal() {
    try {
      await api.post(`/proposals/${selectedProposal.id}/close`, closeForm);
      toast.success('Proposta marcada como fechada!');
      setShowCloseModal(false);
      loadData();
    } catch (err) {
      toast.error('Erro ao fechar proposta');
    }
  }

  async function handleMarkAsLost() {
    try {
      await api.post(`/proposals/${selectedProposal.id}/lost`, { reason: lostReason });
      toast.success('Proposta marcada como perdida.');
      setShowLostModal(false);
      loadData();
    } catch (err) {
      toast.error('Erro ao marcar como perdida');
    }
  }

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 text-teal-600 animate-spin" /></div>;

  return (
    <div className="space-y-6">
      {/* KPIs */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <FileCheck className="h-5 w-5 text-teal-600" />
              <span className="text-sm font-semibold text-slate-600">Enviadas</span>
            </div>
            <p className="text-2xl font-bold text-slate-900">{stats.sent}</p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <Check className="h-5 w-5 text-green-600" />
              <span className="text-sm font-semibold text-slate-600">Fechadas</span>
            </div>
            <p className="text-2xl font-bold text-slate-900">{stats.closed}</p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <FileX className="h-5 w-5 text-red-600" />
              <span className="text-sm font-semibold text-slate-600">Perdidas</span>
            </div>
            <p className="text-2xl font-bold text-slate-900">{stats.lost}</p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-5 w-5 text-blue-600" />
              <span className="text-sm font-semibold text-slate-600">Conversão</span>
            </div>
            <p className="text-2xl font-bold text-slate-900">{stats.conversion}%</p>
          </div>
          <div className="bg-teal-50 p-4 rounded-xl border-2 border-teal-200 shadow-sm md:col-span-2">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="h-5 w-5 text-teal-700" />
              <span className="text-sm font-bold text-teal-800">Ganho Mensal Total</span>
            </div>
            <p className="text-3xl font-bold text-teal-700">R$ {stats.totalGain.toFixed(2)}</p>
          </div>
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 shadow-sm md:col-span-2">
            <div className="flex items-center gap-2 mb-2">
              <Users className="h-5 w-5 text-slate-600" />
              <span className="text-sm font-bold text-slate-700">Total de Propostas</span>
            </div>
            <p className="text-3xl font-bold text-slate-900">{stats.totalProposals}</p>
          </div>
        </div>
      )}

      {/* Gráficos de Tendência */}
      {trendData.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Gráfico de Propostas por Mês */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Propostas por Mês (Últimos 6 meses)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="month" stroke="#64748b" style={{ fontSize: '12px' }} />
                <YAxis stroke="#64748b" style={{ fontSize: '12px' }} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#f8fafc', 
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px'
                  }}
                />
                <Legend />
                <Bar dataKey="sent" name="Enviadas" fill="#14b8a6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="closed" name="Fechadas" fill="#22c55e" radius={[4, 4, 0, 0]} />
                <Bar dataKey="lost" name="Perdidas" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Gráfico de Receita por Mês */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Receita Gerada por Mês (R$)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="month" stroke="#64748b" style={{ fontSize: '12px' }} />
                <YAxis stroke="#64748b" style={{ fontSize: '12px' }} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#f8fafc', 
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px'
                  }}
                  formatter={(value: number) => [`R$ ${value.toFixed(2)}`, 'Receita']}
                />
                <Area 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#14b8a6" 
                  fill="#14b8a6" 
                  fillOpacity={0.3}
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Tabela de Propostas */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200">
          <h3 className="text-lg font-bold text-slate-900">Histórico de Propostas</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-bold text-slate-600 uppercase">Nº</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-slate-600 uppercase">Cliente</th>
                <th className="text-center px-4 py-3 text-xs font-bold text-slate-600 uppercase">Status</th>
                <th className="text-right px-4 py-3 text-xs font-bold text-slate-600 uppercase">Valor Base</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-slate-600 uppercase">Plano Fechado</th>
                <th className="text-right px-4 py-3 text-xs font-bold text-slate-600 uppercase">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {proposals.map((prop) => {
                const statusColors: any = {
                  DRAFT: 'bg-slate-100 text-slate-700',
                  SENT: 'bg-blue-100 text-blue-700',
                  CLOSED: 'bg-green-100 text-green-700',
                  LOST: 'bg-red-100 text-red-700',
                };
                const statusLabels: any = {
                  DRAFT: 'Rascunho',
                  SENT: 'Enviada',
                  CLOSED: 'Fechada',
                  LOST: 'Perdida',
                };

                return (
                  <tr key={prop.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 text-sm font-medium text-slate-900">{prop.proposalNumber}</td>
                    <td className="px-4 py-3 text-sm text-slate-700">{prop.clientName}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-1 rounded-full text-xs font-bold ${statusColors[prop.status]}`}>
                        {statusLabels[prop.status]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-700 text-right font-medium">R$ {prop.basePrice.toFixed(2)}</td>
                    <td className="px-4 py-3 text-sm text-slate-700">
                      {prop.status === 'CLOSED' ? prop.closedPlanName || 'N/A' : '-'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <a 
                          href={`/proposta/${prop.slug}`} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="p-1.5 text-slate-500 hover:text-teal-600 hover:bg-teal-50 rounded"
                          title="Ver Proposta"
                        >
                          <FileText className="h-4 w-4" />
                        </a>
                        {prop.status === 'SENT' && (
                          <>
                            <button 
                              onClick={() => { setSelectedProposal(prop); setShowCloseModal(true); }}
                              className="p-1.5 text-green-600 hover:bg-green-50 rounded"
                              title="Marcar como Fechada"
                            >
                              <Check className="h-4 w-4" />
                            </button>
                            <button 
                              onClick={() => { setSelectedProposal(prop); setShowLostModal(true); }}
                              className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                              title="Marcar como Perdida"
                            >
                              <FileX className="h-4 w-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {proposals.length === 0 && (
            <div className="text-center py-12 text-slate-500">
              <TrendingUp className="h-12 w-12 mx-auto mb-3 text-slate-300" />
              <p>Nenhuma proposta registrada ainda.</p>
            </div>
          )}
        </div>
      </div>

      {/* Modal: Fechar Proposta */}
      {showCloseModal && selectedProposal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <h3 className="text-xl font-bold text-slate-900 mb-4">Registrar Fechamento</h3>
            <p className="text-sm text-slate-600 mb-4">Cliente: <strong>{selectedProposal.clientName}</strong></p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Plano Escolhido</label>
                <select 
                  value={closeForm.planId} 
                  onChange={(e) => setCloseForm({...closeForm, planId: e.target.value})}
                  className="w-full px-3 py-2 border-2 border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-white"
                >
                  <option value="">Selecione o plano...</option>
                  {selectedProposal.includedPlans?.map((p: any) => (
                    <option key={p.planId} value={p.planId}>{p.planName} (R$ {p.finalPrice.toFixed(2)})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Preço Final Negociado (R$)</label>
                <input 
                  type="number" 
                  value={closeForm.price || ''} 
                  onChange={(e) => setCloseForm({...closeForm, price: parseFloat(e.target.value) || 0})}
                  className="w-full px-3 py-2 border-2 border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-white"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Desconto Aplicado (R$)</label>
                <input 
                  type="number" 
                  value={closeForm.discount || ''} 
                  onChange={(e) => setCloseForm({...closeForm, discount: parseFloat(e.target.value) || 0})}
                  className="w-full px-3 py-2 border-2 border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-white"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowCloseModal(false)} className="flex-1 px-4 py-2 text-slate-700 hover:bg-slate-100 rounded-lg font-medium">Cancelar</button>
              <button onClick={handleCloseProposal} className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg">Confirmar Fechamento</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Marcar como Perdida */}
      {showLostModal && selectedProposal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <h3 className="text-xl font-bold text-slate-900 mb-4">Motivo da Perda</h3>
            <p className="text-sm text-slate-600 mb-4">Cliente: <strong>{selectedProposal.clientName}</strong></p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Motivo Principal</label>
                <select 
                  value={lostReason} 
                  onChange={(e) => setLostReason(e.target.value)}
                  className="w-full px-3 py-2 border-2 border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-white"
                >
                  <option value="Preço alto">Preço alto</option>
                  <option value="Concorrência">Concorrência</option>
                  <option value="Sem resposta">Sem resposta do cliente</option>
                  <option value="Não atende necessidades">Não atende às necessidades</option>
                  <option value="Outro">Outro</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowLostModal(false)} className="flex-1 px-4 py-2 text-slate-700 hover:bg-slate-100 rounded-lg font-medium">Cancelar</button>
              <button onClick={handleMarkAsLost} className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg">Confirmar Perda</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// =================================================================
// 🧮 ABA: CALCULADORA DE PREÇO
// =================================================================
function CalculatorTab() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [showProposalModal, setShowProposalModal] = useState(false);
  
  const [form, setForm] = useState({
    clientName: '',
    taxRegime: 'Simples Nacional',
    annex: '',
    activity: 'Serviço',
    monthlyRevenue: 0,
    employeeCount: 0,
    dpMethod: 'PER_EMPLOYEE',
    dpValue: 60,
    hasBranches: false,
    hasErp: false,
    currentCharge: 0,
  });

  const updateForm = (field: string, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  async function handleCalculate() {
    setLoading(true);
    try {
      const res = await api.post('/pricing-calculator/calculate', form);
      setResult(res.data.data);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Erro ao calcular');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h2 className="text-xl font-bold text-slate-900 mb-4">Perfil do Cliente</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2">
            <label className="block text-sm font-semibold text-slate-700 mb-1">Nome do Cliente</label>
            <input type="text" value={form.clientName} onChange={(e) => updateForm('clientName', e.target.value)} className={inputClass} placeholder="Ex: Restaurante Sabor & Arte" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Regime Tributário</label>
            <select value={form.taxRegime} onChange={(e) => updateForm('taxRegime', e.target.value)} className={inputClass}>
              <option value="Simples Nacional">Simples Nacional</option>
              <option value="Lucro Presumido">Lucro Presumido</option>
              <option value="Lucro Real">Lucro Real</option>
              <option value="MEI">MEI</option>
              <option value="Imune/Isenta">Imune/Isenta</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Atividade</label>
            <select value={form.activity} onChange={(e) => updateForm('activity', e.target.value)} className={inputClass}>
              <option value="Comércio">Comércio</option>
              <option value="Indústria">Indústria</option>
              <option value="Serviço">Serviço</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Faturamento Médio (R$)</label>
            <input type="number" value={form.monthlyRevenue || ''} onChange={(e) => updateForm('monthlyRevenue', parseFloat(e.target.value) || 0)} className={inputClass} placeholder="Ex: 50000" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Nº Funcionários</label>
            <input type="number" value={form.employeeCount || ''} onChange={(e) => updateForm('employeeCount', parseInt(e.target.value) || 0)} className={inputClass} placeholder="Ex: 5" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Cálculo do DP</label>
            <div className="flex gap-2 items-center">
              <select value={form.dpMethod} onChange={(e) => updateForm('dpMethod', e.target.value)} className={inputClass + ' flex-1'}>
                <option value="MARGIN">Margem (%)</option>
                <option value="PER_EMPLOYEE">Valor / func.</option>
              </select>
              <input type="number" value={form.dpValue || ''} onChange={(e) => updateForm('dpValue', parseFloat(e.target.value) || 0)} className={inputClass + ' w-24'} placeholder="Valor" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Quanto cobra hoje? (R$)</label>
            <input type="number" value={form.currentCharge || ''} onChange={(e) => updateForm('currentCharge', parseFloat(e.target.value) || 0)} className={inputClass} placeholder="Opcional" />
          </div>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-sm font-medium">
              <input type="checkbox" checked={form.hasBranches} onChange={(e) => updateForm('hasBranches', e.target.checked)} className="rounded border-slate-300 text-teal-600 focus:ring-teal-500" />
              <span>Filiais?</span>
            </label>
            <label className="flex items-center gap-2 text-sm font-medium">
              <input type="checkbox" checked={form.hasErp} onChange={(e) => updateForm('hasErp', e.target.checked)} className="rounded border-slate-300 text-teal-600 focus:ring-teal-500" />
              <span>ERP?</span>
            </label>
          </div>
        </div>
        <div className="mt-6">
          <button onClick={handleCalculate} disabled={loading} className={btnPrimary}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Calculator className="h-4 w-4" />}
            {loading ? 'Calculando...' : 'Calcular Preço'}
          </button>
        </div>
      </div>

      {result && (
        <div className="space-y-6">
          {result.leavingOnTable > 0 && (
            <div className="bg-orange-50 border-2 border-orange-200 rounded-xl p-4 flex items-center gap-3">
              <AlertTriangle className="h-6 w-6 text-orange-500 flex-shrink-0" />
              <div>
                <p className="font-bold text-orange-800">Você está deixando R$ {result.leavingOnTable.toFixed(2)} por mês na mesa!</p>
                <p className="text-sm text-orange-600">Ideal: R$ {result.basePrice.toFixed(2)} | Hoje: R$ {(form.currentCharge || 0).toFixed(2)}</p>
              </div>
            </div>
          )}

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h2 className="text-xl font-bold text-slate-900 mb-2">PREÇO SUGERIDO: <span className="text-teal-600">R$ {result.basePrice.toFixed(2)}</span></h2>
            <p className="text-sm text-slate-500 mb-4">{form.taxRegime} • {form.activity} • {form.employeeCount} funcionário(s)</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                <p className="text-xs font-semibold text-slate-500 mb-1">Fiscal / Contábil</p>
                <p className="text-lg font-bold text-slate-900">R$ {result.priceFC.toFixed(2)}</p>
                <p className="text-xs text-slate-500">{result.totalHours}h × R$ {result.costPerHour.toFixed(2)}/h</p>
              </div>
              <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                <p className="text-xs font-semibold text-slate-500 mb-1">Departamento Pessoal</p>
                <p className="text-lg font-bold text-slate-900">R$ {result.priceDP.toFixed(2)}</p>
                <p className="text-xs text-slate-500">{form.employeeCount} func.</p>
              </div>
              <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                <p className="text-xs font-semibold text-slate-500 mb-1">Total</p>
                <p className="text-lg font-bold text-teal-600">R$ {result.basePrice.toFixed(2)}</p>
              </div>
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-3">Enquadramento em Planos</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {result.planPrices.map((plan: any, idx: number) => (
                <div key={plan.planId} className={`border-2 rounded-xl p-4 text-center ${idx === 1 ? 'border-teal-500 bg-teal-50' : 'border-slate-200'}`}>
                  {plan.badge && <span className="inline-block px-2 py-1 rounded text-xs font-bold bg-orange-500 text-white mb-2">{plan.badge}</span>}
                  <h4 className="font-bold text-slate-900">{plan.planName}</h4>
                  <p className="text-3xl font-bold text-teal-600 mt-2">R$ {plan.finalPrice.toFixed(2)}</p>
                  <p className="text-xs text-slate-500 mt-1">×{plan.multiplier.toFixed(2)} /mês</p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 text-center">
            <h3 className="text-lg font-bold text-slate-900 mb-2">Pronto para enviar ao cliente?</h3>
            <p className="text-sm text-slate-500 mb-4">Gere um link público profissional com os planos e preços calculados.</p>
            <button onClick={() => setShowProposalModal(true)} className="px-6 py-3 bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 text-white font-bold rounded-lg shadow-lg transition-all">
              📄 Gerar Proposta Comercial
            </button>
          </div>
        </div>
      )}

      <GenerateProposalModal
        isOpen={showProposalModal}
        onClose={() => setShowProposalModal(false)}
        calculationResult={result}
        clientForm={form}
      />
    </div>
  );
}

// =================================================================
// ⚙️ ABA: CONFIGURAÇÕES
// =================================================================
function ConfigTab() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState<any>(null);

  useEffect(() => { loadConfig(); }, []);

  async function loadConfig() {
    try {
      const res = await api.get('/pricing-calculator/config');
      setConfig(res.data.data);
    } catch (err) {
      toast.error('Erro ao carregar configuração');
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    try {
      await api.put('/pricing-calculator/config', config);
      toast.success('Configuração salva!');
      loadConfig();
    } catch (err) {
      toast.error('Erro ao salvar');
    } finally {
      setSaving(false);
    }
  }

  const updateConfig = (field: string, value: any) => {
    setConfig((prev: any) => ({ ...prev, [field]: value }));
  };

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 text-teal-600 animate-spin" /></div>;
  if (!config) return null;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-900">Configurações de Custo</h2>
        <button onClick={handleSave} disabled={saving} className={btnPrimary}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Salvar
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-slate-700 uppercase border-b-2 border-slate-200 pb-2">Custo do Colaborador</h3>
          <div><label className="block text-sm font-semibold text-slate-600 mb-1">Salário Médio (R$)</label><input type="number" value={config.salaryAverage} onChange={(e) => updateConfig('salaryAverage', parseFloat(e.target.value) || 0)} className={inputClass} /></div>
          <div><label className="block text-sm font-semibold text-slate-600 mb-1">Encargos (%)</label><input type="number" value={config.chargesPercent} onChange={(e) => updateConfig('chargesPercent', parseFloat(e.target.value) || 0)} className={inputClass} /></div>
          <div><label className="block text-sm font-semibold text-slate-600 mb-1">Horas/Mês</label><input type="number" value={config.hoursPerMonth} onChange={(e) => updateConfig('hoursPerMonth', parseFloat(e.target.value) || 0)} className={inputClass} /></div>
          <div><label className="block text-sm font-semibold text-slate-600 mb-1">Vidas por Colaborador (DP)</label><input type="number" value={config.livesPerEmployee} onChange={(e) => updateConfig('livesPerEmployee', parseFloat(e.target.value) || 0)} className={inputClass} /></div>
        </div>
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-slate-700 uppercase border-b-2 border-slate-200 pb-2">Deduções / Markup</h3>
          <div><label className="block text-sm font-semibold text-slate-600 mb-1">Impostos (%)</label><input type="number" value={config.taxesPercent} onChange={(e) => updateConfig('taxesPercent', parseFloat(e.target.value) || 0)} className={inputClass} /></div>
          <div><label className="block text-sm font-semibold text-slate-600 mb-1">Back Office (%)</label><input type="number" value={config.backOfficePercent} onChange={(e) => updateConfig('backOfficePercent', parseFloat(e.target.value) || 0)} className={inputClass} /></div>
          <div><label className="block text-sm font-semibold text-slate-600 mb-1">Administrativo (%)</label><input type="number" value={config.adminPercent} onChange={(e) => updateConfig('adminPercent', parseFloat(e.target.value) || 0)} className={inputClass} /></div>
          <div><label className="block text-sm font-semibold text-slate-600 mb-1">Margem Fiscal/Contábil (%)</label><input type="number" value={config.marginFC} onChange={(e) => updateConfig('marginFC', parseFloat(e.target.value) || 0)} className={inputClass} /></div>
          <div><label className="block text-sm font-semibold text-slate-600 mb-1">Margem DP (%)</label><input type="number" value={config.marginDP} onChange={(e) => updateConfig('marginDP', parseFloat(e.target.value) || 0)} className={inputClass} /></div>
        </div>
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-slate-700 uppercase border-b-2 border-slate-200 pb-2">Prévia do Cálculo</h3>
          {config.derived && (
            <div className="bg-slate-50 rounded-lg p-4 space-y-2 text-sm border border-slate-200">
              <div className="flex justify-between"><span className="text-slate-600 font-medium">Custo Colaborador:</span><span className="font-bold text-slate-900">R$ {config.derived.employeeCost.toFixed(2)}</span></div>
              <div className="flex justify-between"><span className="text-slate-600 font-medium">Custo/Hora:</span><span className="font-bold text-slate-900">R$ {config.derived.costPerHour.toFixed(2)}</span></div>
              <div className="flex justify-between"><span className="text-slate-600 font-medium">Fator Markup FC:</span><span className="font-bold text-slate-900">{config.derived.markupFC.toFixed(4)}</span></div>
              <div className="flex justify-between"><span className="text-slate-600 font-medium">Fator Markup DP:</span><span className="font-bold text-slate-900">{config.derived.markupDP.toFixed(4)}</span></div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// =================================================================
// 📏 ABA: REGRAS DE HORAS
// =================================================================
function RulesTab() {
  const [rules, setRules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ regime: 'Simples Nacional', activity: 'Serviço', annex: '', revenueMin: 0, revenueMax: 0, hoursFiscal: 0, hoursAccounting: 0 });

  useEffect(() => { loadRules(); }, []);

  async function loadRules() {
    try {
      const res = await api.get('/pricing-calculator/hour-rules');
      setRules(res.data.data || []);
    } catch (err) { toast.error('Erro ao carregar regras'); } finally { setLoading(false); }
  }

  async function handleAdd() {
    try {
      await api.post('/pricing-calculator/hour-rules', form);
      toast.success('Regra adicionada!');
      setShowForm(false);
      setForm({ regime: 'Simples Nacional', activity: 'Serviço', annex: '', revenueMin: 0, revenueMax: 0, hoursFiscal: 0, hoursAccounting: 0 });
      loadRules();
    } catch (err) { toast.error('Erro ao adicionar regra'); }
  }

  async function handleDelete(id: string) {
    if (!confirm('Remover esta regra?')) return;
    try { await api.delete(`/pricing-calculator/hour-rules/${id}`); toast.success('Regra removida'); loadRules(); } catch (err) { toast.error('Erro ao remover'); }
  }

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 text-teal-600 animate-spin" /></div>;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-slate-900">Regras de Horas</h2>
        <button onClick={() => setShowForm(!showForm)} className={btnSecondary}><Plus className="h-4 w-4" /> Nova Regra</button>
      </div>
      {showForm && (
        <div className="bg-slate-50 rounded-lg p-4 mb-6 space-y-4 border-2 border-slate-200">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div><label className="block text-sm font-semibold text-slate-700 mb-1">Regime</label><select value={form.regime} onChange={(e) => setForm({ ...form, regime: e.target.value })} className={inputClass}><option value="Qualquer">Qualquer</option><option value="Simples Nacional">Simples Nacional</option><option value="Lucro Presumido">Lucro Presumido</option><option value="Lucro Real">Lucro Real</option><option value="MEI">MEI</option></select></div>
            <div><label className="block text-sm font-semibold text-slate-700 mb-1">Atividade</label><select value={form.activity} onChange={(e) => setForm({ ...form, activity: e.target.value })} className={inputClass}><option value="Qualquer">Qualquer</option><option value="Comércio">Comércio</option><option value="Indústria">Indústria</option><option value="Serviço">Serviço</option></select></div>
            <div><label className="block text-sm font-semibold text-slate-700 mb-1">Fat. Mínimo (R$)</label><input type="number" value={form.revenueMin || ''} onChange={(e) => setForm({ ...form, revenueMin: parseFloat(e.target.value) || 0 })} className={inputClass} placeholder="0 = sem mínimo" /></div>
            <div><label className="block text-sm font-semibold text-slate-700 mb-1">Fat. Máximo (R$)</label><input type="number" value={form.revenueMax || ''} onChange={(e) => setForm({ ...form, revenueMax: parseFloat(e.target.value) || 0 })} className={inputClass} placeholder="0 = ilimitado" /></div>
            <div><label className="block text-sm font-semibold text-slate-700 mb-1">H. Fiscal</label><input type="number" step="0.5" value={form.hoursFiscal || ''} onChange={(e) => setForm({ ...form, hoursFiscal: parseFloat(e.target.value) || 0 })} className={inputClass} /></div>
            <div><label className="block text-sm font-semibold text-slate-700 mb-1">H. Contábil</label><input type="number" step="0.5" value={form.hoursAccounting || ''} onChange={(e) => setForm({ ...form, hoursAccounting: parseFloat(e.target.value) || 0 })} className={inputClass} /></div>
          </div>
          <button onClick={handleAdd} className={btnPrimary}><Plus className="h-4 w-4" /> Adicionar Regra</button>
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slate-100 border-b-2 border-slate-300">
            <tr>
              <th className="text-left px-4 py-3 text-sm font-bold text-slate-700 uppercase">Regime</th>
              <th className="text-left px-4 py-3 text-sm font-bold text-slate-700 uppercase">Atividade</th>
              <th className="text-left px-4 py-3 text-sm font-bold text-slate-700 uppercase">Fat. Mín</th>
              <th className="text-left px-4 py-3 text-sm font-bold text-slate-700 uppercase">Fat. Máx</th>
              <th className="text-center px-4 py-3 text-sm font-bold text-slate-700 uppercase">H. Fiscal</th>
              <th className="text-center px-4 py-3 text-sm font-bold text-slate-700 uppercase">H. Contábil</th>
              <th className="text-center px-4 py-3 text-sm font-bold text-slate-700 uppercase">Total</th>
              <th className="text-right px-4 py-3 text-sm font-bold text-slate-700 uppercase">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {rules.map((rule) => (
              <tr key={rule.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-4 py-3 text-sm font-semibold text-slate-900">{rule.regime}</td>
                <td className="px-4 py-3 text-sm font-semibold text-slate-900">{rule.activity}</td>
                <td className="px-4 py-3 text-sm text-slate-700">{rule.revenueMin === 0 ? <span className="text-slate-400">-</span> : `R$ ${rule.revenueMin.toLocaleString()}`}</td>
                <td className="px-4 py-3 text-sm text-slate-700">{rule.revenueMax === 0 ? <span className="text-slate-400">Ilimitado</span> : `R$ ${rule.revenueMax.toLocaleString()}`}</td>
                <td className="px-4 py-3 text-sm font-bold text-teal-700 text-center">{rule.hoursFiscal}h</td>
                <td className="px-4 py-3 text-sm font-bold text-teal-700 text-center">{rule.hoursAccounting}h</td>
                <td className="px-4 py-3 text-sm font-bold text-slate-900 text-center">{(rule.hoursFiscal + rule.hoursAccounting).toFixed(1)}h</td>
                <td className="px-4 py-3 text-right"><button onClick={() => handleDelete(rule.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Excluir regra"><Trash2 className="h-4 w-4" /></button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {rules.length === 0 && (
        <div className="text-center py-12 bg-slate-50 rounded-lg border-2 border-dashed border-slate-300">
          <Clock className="h-12 w-12 text-slate-400 mx-auto mb-3" />
          <p className="text-slate-500 font-medium">Nenhuma regra cadastrada</p>
          <p className="text-sm text-slate-400 mt-1">Clique em "Nova Regra" para começar</p>
        </div>
      )}
    </div>
  );
}

// =================================================================
// 📦 ABA: MEUS PLANOS
// =================================================================
function PlansTab() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [plans, setPlans] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [editingPlanId, setEditingPlanId] = useState<string | null>(null);

  useEffect(() => { loadData(); }, []);
  async function loadData() {
    try {
      const [plansRes, catsRes] = await Promise.all([api.get('/commercial-plans/plans'), api.get('/commercial-plans/categories')]);
      setPlans(plansRes.data.data || []);
      setCategories(catsRes.data.data || []);
    } catch (err) { toast.error('Erro ao carregar planos'); } finally { setLoading(false); }
  }
  async function handleSaveAll() {
    setSaving(true);
    try {
      await api.post('/commercial-plans/save-configuration', { plans });
      toast.success('Planos salvos!');
      setEditingPlanId(null);
      await loadData();
    } catch (err: any) { toast.error(err.response?.data?.message || 'Erro ao salvar'); } finally { setSaving(false); }
  }
  function handleAddPlan() {
    setPlans([...plans, { id: '', name: 'Novo Plano', multiplier: 1.0, order: plans.length, isIndependent: false, itemCount: 0, items: [] }]);
    setEditingPlanId('new');
  }
  function handleUpdatePlan(id: string, field: string, value: any) {
    setPlans(plans.map((p) => (p.id === id || (id === 'new' && !p.id) ? { ...p, [field]: value } : p)));
  }
  async function handleDeletePlan(id: string) {
    if (!confirm('Remover este plano?')) return;
    try {
      if (id) await api.delete(`/commercial-plans/plans/${id}`);
      setPlans(plans.filter((p) => p.id !== id));
      toast.success('Plano removido');
    } catch { toast.error('Erro ao remover'); }
  }
  function handleToggleItem(planIndex: number, itemId: string) {
    const plan = plans[planIndex];
    const hasItem = plan.items.some((i: any) => i.id === itemId);
    const newItems = hasItem ? plan.items.filter((i: any) => i.id !== itemId) : [...plan.items, { id: itemId, name: '', categoryId: '', categoryName: '' }];
    const newPlans = [...plans];
    newPlans[planIndex] = { ...plan, items: newItems, itemCount: newItems.length };
    setPlans(newPlans);
  }
  if (loading) return <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 text-teal-600 animate-spin" /></div>;
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-slate-900">Planos Comerciais</h2>
        <div className="flex gap-2">
          <button onClick={handleAddPlan} className={btnSecondary}><Plus className="h-4 w-4" /> Adicionar</button>
          <button onClick={handleSaveAll} disabled={saving} className={btnPrimary}>{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Salvar</button>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {plans.map((plan, idx) => (
          <div key={plan.id || `new-${idx}`} className="border-2 border-slate-300 rounded-lg p-4 hover:shadow-md hover:border-teal-400 transition-all">
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                {editingPlanId === plan.id || (editingPlanId === 'new' && !plan.id) ? (
                  <input type="text" value={plan.name} onChange={(e) => handleUpdatePlan(plan.id || 'new', 'name', e.target.value)} className="w-full px-3 py-2 border-2 border-slate-300 rounded-lg text-slate-900 font-bold text-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent" />
                ) : (<h3 className="font-bold text-lg text-slate-900">{plan.name}</h3>)}
              </div>
              <div className="flex gap-1">
                {editingPlanId === plan.id || (editingPlanId === 'new' && !plan.id) ? (
                  <button onClick={() => setEditingPlanId(null)} className="p-1.5 text-slate-500 hover:text-slate-700"><X className="h-4 w-4" /></button>
                ) : (
                  <button onClick={() => setEditingPlanId(plan.id || 'new')} className="p-1.5 text-slate-500 hover:text-teal-600"><Edit2 className="h-4 w-4" /></button>
                )}
                <button onClick={() => handleDeletePlan(plan.id)} className="p-1.5 text-slate-500 hover:text-red-600"><Trash2 className="h-4 w-4" /></button>
              </div>
            </div>
            {editingPlanId === plan.id || (editingPlanId === 'new' && !plan.id) ? (
              <div className="space-y-3 mb-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Multiplicador</label>
                  <input type="number" step="0.01" value={plan.multiplier} onChange={(e) => handleUpdatePlan(plan.id || 'new', 'multiplier', parseFloat(e.target.value) || 0)} className="w-full px-3 py-2 border-2 border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-teal-500 focus:border-transparent" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Badge</label>
                  <input type="text" value={plan.badge || ''} onChange={(e) => handleUpdatePlan(plan.id || 'new', 'badge', e.target.value)} className="w-full px-3 py-2 border-2 border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-teal-500 focus:border-transparent" placeholder="Ex: MAIS POPULAR" />
                </div>
                <div className="border-t-2 border-slate-200 pt-3">
                  <p className="text-xs font-bold text-slate-700 mb-2">Itens inclusos:</p>
                  <div className="space-y-1 max-h-48 overflow-y-auto pr-2">
                    {categories.map((cat: any) => (
                      <div key={cat.id}>
                        <p className="text-xs font-bold text-slate-600 mb-1 mt-2">{cat.name}</p>
                        {cat.items.map((item: any) => {
                          const isChecked = plan.items.some((i: any) => i.id === item.id);
                          return (<label key={item.id} className="flex items-center gap-2 text-sm hover:bg-slate-100 p-1.5 rounded cursor-pointer"><input type="checkbox" checked={isChecked} onChange={() => handleToggleItem(idx, item.id)} className="rounded border-slate-400 text-teal-600 focus:ring-teal-500" /><span className="text-slate-800 font-medium">{item.name}</span></label>);
                        })}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="mb-4">
                <div className="text-3xl font-bold text-teal-600">×{plan.multiplier.toFixed(2)}</div>
                <div className="text-sm font-semibold text-slate-600">{plan.itemCount} itens</div>
                {plan.badge && (
                  <span className="inline-block mt-2 px-2 py-1 rounded text-xs font-bold bg-orange-500 text-white">
                    {plan.badge}
                  </span>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// =================================================================
// 📁 ABA: CATEGORIAS E ITENS
// =================================================================
function CategoriesTab() {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => { loadCategories(); }, []);
  async function loadCategories() {
    try { const res = await api.get('/commercial-plans/categories'); setCategories(res.data.data || []); } catch (err) { toast.error('Erro ao carregar categorias'); } finally { setLoading(false); }
  }
  async function handleAddCategory() {
    const name = prompt('Nome da nova categoria:');
    if (!name) return;
    try { await api.post('/commercial-plans/categories', { name, order: categories.length }); toast.success('Categoria criada'); loadCategories(); } catch { toast.error('Erro ao criar'); }
  }
  async function handleDeleteCategory(id: string) {
    if (!confirm('Remover esta categoria e todos os seus itens?')) return;
    try { await api.delete(`/commercial-plans/categories/${id}`); toast.success('Categoria removida'); loadCategories(); } catch { toast.error('Erro ao remover'); }
  }
  async function handleAddItem(categoryId: string) {
    const name = prompt('Nome do novo item:');
    if (!name) return;
    try { await api.post('/commercial-plans/items', { categoryId, name }); toast.success('Item criado'); loadCategories(); } catch { toast.error('Erro ao criar item'); }
  }
  async function handleDeleteItem(itemId: string) {
    if (!confirm('Remover este item?')) return;
    try { await api.delete(`/commercial-plans/items/${itemId}`); toast.success('Item removido'); loadCategories(); } catch { toast.error('Erro ao remover'); }
  }
  if (loading) return <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 text-teal-600 animate-spin" /></div>;
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-slate-900">Categorias e Itens de Serviço</h2>
        <button onClick={handleAddCategory} className={btnSecondary}><Plus className="h-4 w-4" /> Nova Categoria</button>
      </div>
      <div className="space-y-4">
        {categories.map((cat: any) => (<CategoryCard key={cat.id} category={cat} onAddItem={handleAddItem} onDeleteItem={handleDeleteItem} onDeleteCategory={handleDeleteCategory} />))}
      </div>
      {categories.length === 0 && (<p className="text-center text-slate-500 py-8">Nenhuma categoria criada.</p>)}
    </div>
  );
}

function CategoryCard({ category, onAddItem, onDeleteItem, onDeleteCategory }: any) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="border-2 border-slate-300 rounded-lg overflow-hidden hover:border-teal-400 transition-colors">
      <div className="flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100 cursor-pointer" onClick={() => setExpanded(!expanded)}>
        <div className="flex items-center gap-3 flex-1">
          {expanded ? <ChevronDown className="h-4 w-4 text-slate-500" /> : <ChevronRight className="h-4 w-4 text-slate-500" />}
          <FolderOpen className="h-5 w-5 text-teal-600" />
          <div>
            <h3 className="font-bold text-slate-900">{category.name}</h3>
            <p className="text-xs text-slate-500 font-medium">{category._count.items} itens</p>
          </div>
        </div>
        <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
          <button onClick={() => onAddItem(category.id)} className="p-1.5 text-slate-500 hover:text-teal-600"><Plus className="h-4 w-4" /></button>
          <button onClick={onDeleteCategory} className="p-1.5 text-slate-500 hover:text-red-600"><Trash2 className="h-4 w-4" /></button>
        </div>
      </div>
      {expanded && (
        <div className="border-t-2 border-slate-200">
          {category.items.length === 0 ? (<p className="p-4 text-sm text-slate-500 text-center">Nenhum item nesta categoria</p>) : (
            <ul className="divide-y divide-slate-100">
              {category.items.map((item: any) => (
                <li key={item.id} className="flex items-center justify-between p-3 hover:bg-slate-50">
                  <div className="flex items-center gap-2"><FileText className="h-4 w-4 text-slate-400" /><span className="text-sm font-medium text-slate-700">{item.name}</span></div>
                  <button onClick={() => onDeleteItem(item.id)} className="text-slate-400 hover:text-red-600"><Trash2 className="h-4 w-4" /></button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

// =================================================================
// 📄 MODAL: GERAR PROPOSTA
// =================================================================
function GenerateProposalModal({ isOpen, onClose, calculationResult, clientForm }: { isOpen: boolean; onClose: () => void; calculationResult: any; clientForm: any }) {
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [proposal, setProposal] = useState<any>(null);
  const [formData, setFormData] = useState({
    clientName: clientForm?.clientName || '',
    clientCnpj: '',
    aboutOffice: '',
    differentials: '',
    onboarding: '',
    commercialTerms: '',
    specificNote: '',
    includedPlanIds: [] as string[],
  });

  useEffect(() => {
    if (isOpen && calculationResult) {
      const allPlanIds = calculationResult.planPrices?.map((p: any) => p.planId) || [];
      setFormData(prev => ({ ...prev, includedPlanIds: allPlanIds }));
    }
  }, [isOpen, calculationResult]);

  async function handleGenerate() {
    setLoading(true);
    try {
      const includedPlans = calculationResult.planPrices.filter((p: any) => formData.includedPlanIds.includes(p.planId));
      const res = await api.post('/proposals', {
        ...formData,
        taxRegime: clientForm.taxRegime,
        activity: clientForm.activity,
        monthlyRevenue: clientForm.monthlyRevenue,
        employeeCount: clientForm.employeeCount,
        basePrice: calculationResult.basePrice,
        includedPlans,
      });
      setProposal(res.data.data);
      setStep(2);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Erro ao gerar proposta');
    } finally {
      setLoading(false);
    }
  }

  function togglePlan(planId: string) {
    setFormData(prev => ({
      ...prev,
      includedPlanIds: prev.includedPlanIds.includes(planId) ? prev.includedPlanIds.filter((id) => id !== planId) : [...prev.includedPlanIds, planId],
    }));
  }

  function copyLink() {
    const link = `${window.location.origin}/proposta/${proposal.slug}`;
    navigator.clipboard.writeText(link);
    toast.success('Link copiado!');
  }

  function openProposal() {
    window.open(`/proposta/${proposal.slug}`, '_blank');
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b-2 border-slate-200 sticky top-0 bg-white z-10">
          <h2 className="text-xl font-bold text-slate-900">{step === 1 ? 'Gerar Proposta' : 'Proposta Gerada!'}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X className="h-6 w-6" /></button>
        </div>
        {step === 1 && (
          <div className="p-6 space-y-4">
            <div><label className="block text-sm font-semibold text-slate-700 mb-1">Nome do Cliente *</label><input type="text" value={formData.clientName} onChange={(e) => setFormData({ ...formData, clientName: e.target.value })} className={inputClass} /></div>
            <div><label className="block text-sm font-semibold text-slate-700 mb-1">CNPJ (opcional)</label><input type="text" value={formData.clientCnpj} onChange={(e) => setFormData({ ...formData, clientCnpj: e.target.value })} className={inputClass} placeholder="00.000.000/0000-00" /></div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Planos a incluir</label>
              <div className="space-y-2">
                {calculationResult?.planPrices?.map((plan: any) => (
                  <label key={plan.planId} className="flex items-center gap-3 p-3 border-2 border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer">
                    <input type="checkbox" checked={formData.includedPlanIds.includes(plan.planId)} onChange={() => togglePlan(plan.planId)} className="rounded border-slate-300 text-teal-600 focus:ring-teal-500" />
                    <div className="flex-1"><p className="font-semibold text-slate-900">{plan.planName}</p><p className="text-sm text-slate-500">R$ {plan.finalPrice.toFixed(2)}/mês</p></div>
                  </label>
                ))}
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t-2 border-slate-200">
              <button onClick={onClose} className="px-4 py-2 text-slate-700 hover:bg-slate-100 rounded-lg font-medium">Cancelar</button>
              <button onClick={handleGenerate} disabled={loading || !formData.clientName || formData.includedPlanIds.length === 0} className={btnPrimary}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null} {loading ? 'Gerando...' : 'Gerar Proposta'}
              </button>
            </div>
          </div>
        )}
        {step === 2 && proposal && (
          <div className="p-6 space-y-4">
            <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4">
              <p className="font-bold text-green-800 mb-1">✅ Proposta gerada com sucesso!</p>
              <p className="text-sm text-green-700">Nº {proposal.proposalNumber}</p>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Link Público</label>
              <div className="flex gap-2">
                <input type="text" readOnly value={`${window.location.origin}/proposta/${proposal.slug}`} className={inputClass + ' flex-1'} />
                <button onClick={copyLink} className={btnSecondary}>Copiar</button>
              </div>
            </div>
            <div className="flex gap-3 flex-wrap">
              <button onClick={openProposal} className={btnPrimary + ' flex-1 min-w-[140px]'}>
                Abrir Proposta
              </button>
              <button 
                onClick={() => {
                  window.open(`/proposta/${proposal.slug}`, '_blank');
                  toast.success('A proposta foi aberta. Clique no botão "Baixar PDF" dentro dela.');
                }} 
                className={btnSecondary + ' flex-1 min-w-[140px]'}
              >
                <Download className="h-4 w-4 mr-2" />
                Baixar PDF
              </button>
              <button onClick={onClose} className={btnSecondary}>
                Fechar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}