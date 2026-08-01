'use client';

import { useState } from 'react';
import api from '@/lib/axios';
import { toast } from 'sonner';
import {
  Calculator, TrendingUp, DollarSign, CheckCircle, AlertTriangle,
  Loader2, ArrowRight, Building2, Briefcase, Users
} from 'lucide-react';

// =================================================================
// 🎨 PALETA E UTILITÁRIOS CONTA CERTA
// =================================================================
const formatCurrency = (value: number) => 
  value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

// 🔥 CLASSE MÁGICA PARA INPUTS (Texto sempre visível)
const inputClass = 
  "w-full px-3 py-2.5 border border-slate-300 rounded-lg " +
  "text-slate-900 placeholder:text-slate-400 " + 
  "focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all bg-white";

// =================================================================
// 🧩 COMPONENTE: Card de Regime Tributário
// =================================================================
function RegimeCard({ regime, isBest, maxTax }: { regime: any; isBest: boolean; maxTax: number }) {
  const barWidth = maxTax > 0 ? (regime.imposto / maxTax) * 100 : 0;

  return (
    <div className={`relative p-6 rounded-xl border-2 transition-all ${
      isBest 
        ? 'bg-teal-50 border-teal-500 shadow-md' 
        : 'bg-white border-slate-200 hover:border-slate-300'
    }`}>
      {isBest && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-teal-600 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 shadow-sm">
          <CheckCircle className="h-3 w-3" /> MELHOR OPÇÃO
        </div>
      )}
      
      <div className="text-center mb-4">
        <h3 className={`text-lg font-bold ${isBest ? 'text-teal-800' : 'text-slate-800'}`}>
          {regime.nome}
        </h3>
        <p className="text-xs text-slate-500 mt-1">{regime.descricao}</p>
      </div>

      <div className="text-center mb-4">
        <p className="text-3xl font-bold text-slate-900">{formatCurrency(regime.imposto)}</p>
        <p className="text-sm text-slate-600 mt-1">Imposto Anual Estimado</p>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between text-xs text-slate-600">
          <span>Carga Efetiva</span>
          <span className="font-semibold">{regime.aliquotaEfetiva.toFixed(2)}%</span>
        </div>
        {/* Barra de Comparação Visual */}
        <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
          <div 
            className={`h-3 rounded-full transition-all duration-700 ${isBest ? 'bg-teal-500' : 'bg-slate-400'}`}
            style={{ width: `${barWidth}%` }}
          />
        </div>
      </div>
    </div>
  );
}

// =================================================================
// 🚀 PÁGINA PRINCIPAL: Planejamento Tributário
// =================================================================
export default function PlanejamentoTributarioPage() {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    faturamentoAnual: '',
    despesasAnual: '',
    folhaAnual: '',
    atividade: 'SERVICOS' as 'COMERCIO' | 'SERVICOS' | 'INDUSTRIA',
  });
  const [result, setResult] = useState<any>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const payload = {
      faturamentoAnual: parseFloat(formData.faturamentoAnual) || 0,
      despesasAnual: parseFloat(formData.despesasAnual) || 0,
      folhaAnual: parseFloat(formData.folhaAnual) || 0,
      atividade: formData.atividade,
    };

    if (payload.faturamentoAnual <= 0) {
      toast.error('Informe um faturamento anual válido.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/bi/simulate-tax', payload);
      setResult(res.data.data);
      toast.success('Simulação concluída com sucesso!');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Erro ao realizar simulação.');
    } finally {
      setLoading(false);
    }
  };

  const maxTax = result ? Math.max(...result.regimes.map((r: any) => r.imposto)) : 0;

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* CABEÇALHO */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
          <Calculator className="h-8 w-8 text-teal-600" />
          Planejamento Tributário
        </h1>
        <p className="text-slate-600 mt-2 max-w-3xl">
          Simule e compare a carga tributária entre Simples Nacional, Lucro Presumido e Lucro Real. 
          Identifique a melhor estratégia para maximizar a lucratividade do seu cliente.
        </p>
      </div>

      {/* FORMULÁRIO DE SIMULAÇÃO */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
          <Briefcase className="h-5 w-5 text-teal-600" />
          Dados da Empresa (Anual)
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Faturamento Bruto Anual (R$) *</label>
              <input
                type="number"
                required
                value={formData.faturamentoAnual}
                onChange={(e) => setFormData({ ...formData, faturamentoAnual: e.target.value })}
                className={inputClass}
                placeholder="Ex: 1200000"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Despesas Operacionais Anuais (R$)</label>
              <input
                type="number"
                value={formData.despesasAnual}
                onChange={(e) => setFormData({ ...formData, despesasAnual: e.target.value })}
                className={inputClass}
                placeholder="Ex: 600000"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Folha de Pagamento Anual (R$)</label>
              <input
                type="number"
                value={formData.folhaAnual}
                onChange={(e) => setFormData({ ...formData, folhaAnual: e.target.value })}
                className={inputClass}
                placeholder="Ex: 240000"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Atividade Principal *</label>
              <select
                value={formData.atividade}
                onChange={(e) => setFormData({ ...formData, atividade: e.target.value as any })}
                className={inputClass}
              >
                <option value="SERVICOS">Prestação de Serviços</option>
                <option value="COMERCIO">Comércio</option>
                <option value="INDUSTRIA">Indústria</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-slate-100">
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 shadow-sm"
            >
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Calculator className="h-5 w-5" />}
              {loading ? 'Calculando...' : 'Simular Regimes'}
            </button>
          </div>
        </form>
      </div>

      {/* RESULTADOS DA SIMULAÇÃO */}
      {result && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          
          {/* Banner de Economia */}
          <div className="bg-gradient-to-r from-teal-600 to-teal-800 p-6 rounded-xl shadow-md text-white flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white/20 rounded-full">
                <TrendingUp className="h-8 w-8" />
              </div>
              <div>
                <h3 className="text-xl font-bold">Melhor Regime: {result.melhorRegime}</h3>
                <p className="text-teal-100 text-sm">
                  Com base nos dados informados, este regime oferece a menor carga tributária.
                </p>
              </div>
            </div>
            <div className="text-center md:text-right bg-white/10 px-6 py-3 rounded-lg">
              <p className="text-xs text-teal-100 uppercase tracking-wider font-semibold">Economia Potencial</p>
              <p className="text-3xl font-bold">{formatCurrency(result.economiaAnual)}</p>
              <p className="text-sm text-teal-200">por ano ({formatCurrency(result.economiaMensal)}/mês)</p>
            </div>
          </div>

          {/* Cards Comparativos */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {result.regimes.map((regime: any) => (
              <RegimeCard 
                key={regime.nome} 
                regime={regime} 
                isBest={regime.nome === result.melhorRegime} 
                maxTax={maxTax} 
              />
            ))}
          </div>

          {/* Resumo do Negócio e Dica */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
              <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                <Building2 className="h-5 w-5 text-teal-600" />
                Resumo Financeiro Projetado
              </h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center py-2 border-b border-slate-100">
                  <span className="text-slate-600">Faturamento Anual</span>
                  <span className="font-semibold text-slate-900">{formatCurrency(result.resumo.faturamentoAnual)}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-slate-100">
                  <span className="text-slate-600">Despesas + Folha</span>
                  <span className="font-semibold text-slate-900">
                    {formatCurrency(result.resumo.despesasAnual + formData.folhaAnual as any)}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-slate-100">
                  <span className="text-slate-600">Imposto ({result.melhorRegime})</span>
                  <span className="font-semibold text-red-600">
                    - {formatCurrency(result.regimes.find((r: any) => r.nome === result.melhorRegime).imposto)}
                  </span>
                </div>
                <div className="flex justify-between items-center py-3 bg-teal-50 px-3 rounded-lg">
                  <span className="font-bold text-teal-800">Lucro Líquido Estimado</span>
                  <span className="font-bold text-teal-700 text-lg">
                    {formatCurrency(result.resumo.faturamentoAnual - result.resumo.despesasAnual - (formData.folhaAnual as any) - result.regimes.find((r: any) => r.nome === result.melhorRegime).imposto)}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-orange-50 border border-orange-200 p-6 rounded-xl">
              <h3 className="text-lg font-bold text-orange-900 mb-3 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Dica do Contador
              </h3>
              <ul className="space-y-3 text-sm text-orange-800">
                <li className="flex gap-2">
                  <ArrowRight className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <span>
                    O <strong>Simples Nacional</strong> é ideal para faturamentos menores e margens de lucro altas, pois o imposto incide sobre o faturamento, não sobre o lucro.
                  </span>
                </li>
                <li className="flex gap-2">
                  <ArrowRight className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <span>
                    O <strong>Lucro Real</strong> torna-se vantajoso quando a margem de lucro da empresa é muito baixa (ou há prejuízo), pois o imposto é calculado sobre o lucro efetivo.
                  </span>
                </li>
                <li className="flex gap-2">
                  <ArrowRight className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <span>
                    Utilize este relatório como base para uma reunião estratégica com o cliente, demonstrando o valor da sua consultoria tributária.
                  </span>
                </li>
              </ul>
            </div>
          </div>

        </div>
      )}
    </div>
  );
}