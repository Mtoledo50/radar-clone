'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/axios';
import { 
  AlertTriangle, TrendingUp, DollarSign, CheckCircle, Loader2, 
  Calendar, ArrowUpRight, ShieldAlert 
} from 'lucide-react';

// =================================================================
// 🎨 PALETA E UTILITÁRIOS
// =================================================================
const formatCurrency = (value: number) => 
  value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const formatDate = (dateString: string) => 
  new Date(dateString).toLocaleDateString('pt-BR');

// =================================================================
// 🧩 COMPONENTE: Card de Alerta (Outlier)
// =================================================================
function OutlierCard({ outlier }: { outlier: any }) {
  // Define a cor do badge baseado no desvio
  const getDeviationColor = (deviation: number) => {
    if (deviation > 100) return 'bg-red-100 text-red-800 border-red-200';
    if (deviation > 50) return 'bg-orange-100 text-orange-800 border-orange-200';
    return 'bg-yellow-100 text-yellow-800 border-yellow-200';
  };

  return (
    <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-all hover:border-orange-300">
      <div className="flex justify-between items-start mb-4">
        <div>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700 mb-2">
            {outlier.category}
          </span>
          <h3 className="font-semibold text-slate-900 text-lg leading-tight">
            {outlier.description}
          </h3>
          <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
            <Calendar className="h-3 w-3" /> {formatDate(outlier.date)}
          </p>
        </div>
        <div className={`flex flex-col items-end px-3 py-1.5 rounded-lg border ${getDeviationColor(outlier.deviation)}`}>
          <span className="text-xs font-medium opacity-80">Desvio</span>
          <span className="font-bold flex items-center gap-1">
            <ArrowUpRight className="h-3 w-3" />
            +{outlier.deviation}%
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100">
        <div>
          <p className="text-xs text-slate-500 mb-1">Valor Detectado</p>
          <p className="text-xl font-bold text-slate-900">{formatCurrency(outlier.amount)}</p>
        </div>
        <div>
          <p className="text-xs text-slate-500 mb-1">Média Histórica</p>
          <p className="text-xl font-medium text-slate-600">{formatCurrency(outlier.average)}</p>
        </div>
      </div>
    </div>
  );
}

// =================================================================
// 🚀 PÁGINA PRINCIPAL: Ponto Fora da Curva
// =================================================================
export default function PontoForaDaCurvaPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        // 🔥 Chamada para a rota que criamos no backend
        const res = await api.get('/bi/outliers');
        setData(res.data.data);
      } catch (err) {
        console.error('Erro ao carregar outliers:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="h-12 w-12 text-teal-600 animate-spin mb-4" />
        <p className="text-slate-600 font-medium">Analisando padrões financeiros...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* CABEÇALHO */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
          <ShieldAlert className="h-8 w-8 text-orange-500" />
          Ponto Fora da Curva
        </h1>
        <p className="text-slate-600 mt-2 max-w-3xl">
          Análise inteligente de despesas que fugiram do padrão histórico. 
          Identifique erros de lançamento, gastos excessivos ou oportunidades de negociação.
        </p>
      </div>

      {/* ESTADO VAZIO (Tudo em ordem) */}
      {!data || data.totalOutliers === 0 ? (
        <div className="bg-green-50 border border-green-200 rounded-2xl p-12 text-center">
          <div className="inline-flex p-4 rounded-full bg-green-100 mb-4">
            <CheckCircle className="h-10 w-10 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-green-900 mb-2">Tudo em ordem!</h2>
          <p className="text-green-700 max-w-lg mx-auto">
            Nenhuma despesa fora do padrão foi detectada nos últimos 6 meses. 
            A saúde financeira do seu escritório está estável.
          </p>
        </div>
      ) : (
        <>
          {/* CARDS DE RESUMO EXECUTIVO */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex items-center gap-4">
              <div className="p-4 rounded-lg bg-red-50 text-red-600">
                <AlertTriangle className="h-8 w-8" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-600">Anomalias Detectadas</p>
                <p className="text-3xl font-bold text-slate-900">{data.totalOutliers}</p>
                <p className="text-xs text-slate-500 mt-1">Despesas acima de 50% da média</p>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex items-center gap-4">
              <div className="p-4 rounded-lg bg-orange-50 text-orange-600">
                <DollarSign className="h-8 w-8" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-600">Impacto Financeiro Total</p>
                <p className="text-3xl font-bold text-slate-900">{formatCurrency(data.totalImpact)}</p>
                <p className="text-xs text-slate-500 mt-1">Valor total das anomalias</p>
              </div>
            </div>
          </div>

          {/* LISTA DE OUTLIERS */}
          <div>
            <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-slate-400" />
              Detalhes das Anomalias
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {data.outliers.map((outlier: any) => (
                <OutlierCard key={outlier.id} outlier={outlier} />
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}