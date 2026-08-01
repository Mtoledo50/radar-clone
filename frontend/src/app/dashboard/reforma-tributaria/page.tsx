'use client';

import { useState } from 'react';
import api from '@/lib/axios';
import { toast } from 'sonner';
import {
  Scale, TrendingUp, TrendingDown, DollarSign, AlertTriangle,
  Loader2, ArrowRight, CheckCircle, Calendar, MapPin, Briefcase
} from 'lucide-react';

// =================================================================
//  PALETA E UTILITÁRIOS CONTA CERTA
// =================================================================
const formatCurrency = (value: number) => 
  value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

// 🔥 CLASSE MÁGICA PARA INPUTS (Texto sempre visível)
const inputClass = 
  "w-full px-3 py-2.5 border border-slate-300 rounded-lg " +
  "text-slate-900 placeholder:text-slate-400 " + 
  "focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all bg-white";

// =================================================================
// 🧩 COMPONENTE: Card de Cenário (Atual vs Reforma)
// =================================================================
function CenarioCard({ 
  titulo, 
  icone: Icon, 
  cor, 
  dados, 
  total, 
  aliquotaEfetiva 
}: { 
  titulo: string; 
  icone: any; 
  cor: 'teal' | 'orange'; 
  dados: { label: string; value: number }[]; 
  total: number; 
  aliquotaEfetiva: number;
}) {
  const colorMap = {
    teal: {
      bg: 'bg-teal-50',
      text: 'text-teal-600',
      border: 'border-teal-200',
      badge: 'bg-teal-100 text-teal-800',
    },
    orange: {
      bg: 'bg-orange-50',
      text: 'text-orange-600',
      border: 'border-orange-200',
      badge: 'bg-orange-100 text-orange-800',
    },
  };
  const colors = colorMap[cor];

  return (
    <div className={`p-6 rounded-xl border-2 ${colors.border} ${colors.bg}`}>
      <div className="flex items-center gap-3 mb-4">
        <div className={`p-3 rounded-lg ${colors.bg}`}>
          <Icon className={`h-6 w-6 ${colors.text}`} />
        </div>
        <h3 className="text-xl font-bold text-slate-900">{titulo}</h3>
      </div>

      <div className="space-y-3 mb-4">
        {dados.map((item, idx) => (
          <div key={idx} className="flex justify-between items-center py-2 border-b border-slate-200/50">
            <span className="text-sm text-slate-700">{item.label}</span>
            <span className="font-semibold text-slate-900">{formatCurrency(item.value)}</span>
          </div>
        ))}
      </div>

      <div className="pt-4 border-t-2 border-slate-300">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-slate-700">Total de Impostos</span>
          <span className={`text-2xl font-bold ${colors.text}`}>{formatCurrency(total)}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-xs text-slate-600">Alíquota Efetiva</span>
          <span className={`px-2 py-1 rounded-full text-xs font-bold ${colors.badge}`}>
            {aliquotaEfetiva.toFixed(2)}%
          </span>
        </div>
      </div>
    </div>
  );
}

// =================================================================
//  COMPONENTE: Barra do Cronograma de Transição
// =================================================================
function CronogramaBar({ ano, aliquota, imposto, fase, maxImposto }: { 
  ano: number; 
  aliquota: number; 
  imposto: number; 
  fase: string;
  maxImposto: number;
}) {
  const width = maxImposto > 0 ? (imposto / maxImposto) * 100 : 0;
  const isCurrentYear = ano === new Date().getFullYear();

  return (
    <div className={`p-3 rounded-lg border ${isCurrentYear ? 'border-teal-400 bg-teal-50' : 'border-slate-200 bg-white'}`}>
      <div className="flex justify-between items-center mb-2">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-slate-500" />
          <span className="font-bold text-slate-900">{ano}</span>
          {isCurrentYear && (
            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-teal-600 text-white">
              ATUAL
            </span>
          )}
        </div>
        <span className={`text-xs font-medium px-2 py-1 rounded-full ${
          fase === 'Início' ? 'bg-blue-100 text-blue-800' :
          fase === 'Plena vigência' ? 'bg-red-100 text-red-800' :
          'bg-slate-100 text-slate-700'
        }`}>
          {fase}
        </span>
      </div>
      <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden mb-2">
        <div 
          className="h-2 rounded-full bg-gradient-to-r from-teal-500 to-orange-500 transition-all duration-700"
          style={{ width: `${width}%` }}
        />
      </div>
      <div className="flex justify-between text-xs text-slate-600">
        <span>Alíquota: {aliquota.toFixed(2)}%</span>
        <span className="font-semibold">{formatCurrency(imposto)}</span>
      </div>
    </div>
  );
}

// =================================================================
// 🚀 PÁGINA PRINCIPAL: Reforma Tributária
// =================================================================
export default function ReformaTributariaPage() {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    faturamentoAnual: '',
    despesasComInsumos: '',
    folhaAnual: '',
    setor: 'SERVICOS' as 'COMERCIO' | 'SERVICOS' | 'INDUSTRIA',
    estado: 'SP',
  });
  const [result, setResult] = useState<any>(null);

  const estados = [
    'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
    'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
    'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const payload = {
      faturamentoAnual: parseFloat(formData.faturamentoAnual) || 0,
      despesasComInsumos: parseFloat(formData.despesasComInsumos) || 0,
      folhaAnual: parseFloat(formData.folhaAnual) || 0,
      setor: formData.setor,
      estado: formData.estado,
    };

    if (payload.faturamentoAnual <= 0) {
      toast.error('Informe um faturamento anual válido.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/bi/simulate-reform', payload);
      setResult(res.data.data);
      toast.success('Simulação da Reforma concluída!');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Erro ao realizar simulação.');
    } finally {
      setLoading(false);
    }
  };

  const maxImpostoCronograma = result?.cronogramaTransicao 
    ? Math.max(...result.cronogramaTransicao.map((c: any) => c.impostoEstimado))
    : 0;

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* CABEÇALHO */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
          <Scale className="h-8 w-8 text-teal-600" />
          Reforma Tributária
        </h1>
        <p className="text-slate-600 mt-2 max-w-3xl">
          Simule o impacto da EC 132/2023 (IVA Dual: CBS + IBS) na carga tributária da sua empresa 
          e visualize o cronograma de transição até 2033.
        </p>
      </div>

      {/* FORMULÁRIO */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
          <Briefcase className="h-5 w-5 text-teal-600" />
          Dados da Empresa para Simulação
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Faturamento Bruto Anual (R$) *</label>
              <input
                type="number"
                required
                value={formData.faturamentoAnual}
                onChange={(e) => setFormData({ ...formData, faturamentoAnual: e.target.value })}
                className={inputClass}
                placeholder="Ex: 2400000"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Despesas com Insumos Anuais (R$)</label>
              <input
                type="number"
                value={formData.despesasComInsumos}
                onChange={(e) => setFormData({ ...formData, despesasComInsumos: e.target.value })}
                className={inputClass}
                placeholder="Compras com crédito tributário"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Folha de Pagamento Anual (R$)</label>
              <input
                type="number"
                value={formData.folhaAnual}
                onChange={(e) => setFormData({ ...formData, folhaAnual: e.target.value })}
                className={inputClass}
                placeholder="Ex: 480000"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Setor de Atuação *</label>
              <select
                value={formData.setor}
                onChange={(e) => setFormData({ ...formData, setor: e.target.value as any })}
                className={inputClass}
              >
                <option value="SERVICOS">Prestação de Serviços</option>
                <option value="COMERCIO">Comércio</option>
                <option value="INDUSTRIA">Indústria</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Estado (UF) *</label>
              <select
                value={formData.estado}
                onChange={(e) => setFormData({ ...formData, estado: e.target.value })}
                className={inputClass}
              >
                {estados.map((uf) => (
                  <option key={uf} value={uf}>{uf}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-slate-100">
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 shadow-sm"
            >
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Scale className="h-5 w-5" />}
              {loading ? 'Calculando...' : 'Simular Reforma'}
            </button>
          </div>
        </form>
      </div>

      {/* RESULTADOS */}
      {result && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          
          {/* Banner de Impacto Financeiro */}
          <div className={`p-6 rounded-xl shadow-md text-white flex flex-col md:flex-row items-center justify-between gap-4 ${
            result.impacto.color === 'vermelho' 
              ? 'bg-gradient-to-r from-red-600 to-red-800' 
              : result.impacto.color === 'verde'
              ? 'bg-gradient-to-r from-green-600 to-green-800'
              : 'bg-gradient-to-r from-slate-600 to-slate-800'
          }`}>
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white/20 rounded-full">
                {result.impacto.color === 'vermelho' ? (
                  <TrendingUp className="h-8 w-8" />
                ) : result.impacto.color === 'verde' ? (
                  <TrendingDown className="h-8 w-8" />
                ) : (
                  <Scale className="h-8 w-8" />
                )}
              </div>
              <div>
                <h3 className="text-xl font-bold">{result.impacto.label}</h3>
                <p className="text-white/80 text-sm">
                  Impacto de {result.impacto.impactoPercentual.toFixed(1)}% na carga tributária
                </p>
              </div>
            </div>
            <div className="text-center md:text-right bg-white/10 px-6 py-3 rounded-lg">
              <p className="text-xs text-white/80 uppercase tracking-wider font-semibold">Diferença Anual</p>
              <p className="text-3xl font-bold">{formatCurrency(Math.abs(result.impacto.diferencaAnual))}</p>
              <p className="text-sm text-white/70">
                {result.impacto.diferencaAnual > 0 ? '+' : ''}{formatCurrency(result.impacto.diferencaMensal)}/mês
              </p>
            </div>
          </div>

          {/* Cards Comparativos: Cenário Atual vs Reforma */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <CenarioCard
              titulo="Cenário Atual (2026)"
              icone={Briefcase}
              cor="teal"
              dados={[
                { label: 'PIS/COFINS', value: result.cenarioAtual.pisCofins },
                { label: 'ICMS/ISS', value: result.cenarioAtual.icmsIss },
                { label: 'IPI', value: result.cenarioAtual.ipi },
              ]}
              total={result.cenarioAtual.total}
              aliquotaEfetiva={result.cenarioAtual.aliquotaEfetiva}
            />
            <CenarioCard
              titulo="Cenário Pós-Reforma (2033)"
              icone={Scale}
              cor="orange"
              dados={[
                { label: `CBS (${result.cenarioReforma.aliquotaCBS}%)`, value: result.cenarioReforma.cbs },
                { label: `IBS (${result.cenarioReforma.aliquotaIBS}%)`, value: result.cenarioReforma.ibs },
              ]}
              total={result.cenarioReforma.total}
              aliquotaEfetiva={result.cenarioReforma.aliquotaEfetiva}
            />
          </div>

          {/* Cronograma de Transição 2026-2033 */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Calendar className="h-5 w-5 text-teal-600" />
              Cronograma de Transição (2026-2033)
            </h3>
            <p className="text-sm text-slate-600 mb-6">
              A reforma entra em vigor gradualmente. Em 2026 começa com 1/9 da alíquota total, 
              aumentando progressivamente até 2033.
            </p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {result.cronogramaTransicao.map((item: any) => (
                <CronogramaBar
                  key={item.ano}
                  ano={item.ano}
                  aliquota={item.aliquotaEfetiva}
                  imposto={item.impostoEstimado}
                  fase={item.fase}
                  maxImposto={maxImpostoCronograma}
                />
              ))}
            </div>
          </div>

          {/* Recomendações Estratégicas */}
          <div className="bg-gradient-to-br from-teal-600 to-teal-800 p-6 rounded-xl shadow-md text-white">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold mb-3">Recomendações Estratégicas</h3>
                <ul className="space-y-2 text-sm text-teal-50">
                  <li className="flex gap-2">
                    <ArrowRight className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <span>
                      <strong>Antecipe a migração:</strong> Empresas do setor de {result.resumo.setor.toLowerCase()} 
                      em {result.resumo.estado} tendem a ter {result.impacto.color === 'vermelho' ? 'aumento' : 'redução'} 
                      de carga tributária. Planeje a transição contábil com antecedência.
                    </span>
                  </li>
                  <li className="flex gap-2">
                    <ArrowRight className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <span>
                      <strong>Crédito de insumos:</strong> Com despesas de {formatCurrency(result.resumo.despesasComInsumos)} 
                      em insumos, o crédito tributário no novo sistema será de aproximadamente{' '}
                      {formatCurrency(result.resumo.despesasComInsumos * 0.46)}.
                    </span>
                  </li>
                  <li className="flex gap-2">
                    <ArrowRight className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <span>
                      <strong>Revisão de preços:</strong> Considere repassar parte do impacto tributário 
                      aos preços de venda para manter a margem de lucro.
                    </span>
                  </li>
                  <li className="flex gap-2">
                    <ArrowRight className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <span>
                      <strong>Consultoria especializada:</strong> A reforma exige ajustes no sistema fiscal, 
                      notas fiscais e apuração. Agende uma reunião para detalhar o plano de ação.
                    </span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

        </div>
      )}
    </div>
  );
}