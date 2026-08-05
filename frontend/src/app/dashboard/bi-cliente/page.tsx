'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import api from '@/lib/axios';
import { BarChart3, TrendingUp, AlertTriangle } from 'lucide-react';

export default function BIClientePage() {
  const searchParams = useSearchParams();
  const clientId = searchParams.get('client');
  
  const [clientData, setClientData] = useState<any>(null);
  const [entries, setEntries] = useState<any[]>([]);
  const [outliers, setOutliers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (clientId) loadData();
  }, [clientId]);

  async function loadData() {
    try {
      const [clientRes, entriesRes, outliersRes] = await Promise.all([
        api.get(`/clients/${clientId}`),
        api.get(`/accounting/entries?clientId=${clientId}`),
        api.get(`/accounting/outliers?clientId=${clientId}`),
      ]);
      
      setClientData(clientRes.data.data);
      setEntries(entriesRes.data.data);
      setOutliers(outliersRes.data.data);
    } catch (err) {
      toast.error('Erro ao carregar dados do cliente');
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <div>Carregando...</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">BI: {clientData?.companyName}</h1>
      
      {/* KPIs */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-xl border">
          <TrendingUp className="h-6 w-6 text-green-600 mb-2" />
          <p className="text-sm text-slate-600">Receita Total</p>
          <p className="text-2xl font-bold">
            R$ {entries.filter(e => e.creditValue > 0).reduce((s, e) => s + Number(e.creditValue), 0).toFixed(2)}
          </p>
        </div>
        <div className="bg-white p-6 rounded-xl border">
          <TrendingUp className="h-6 w-6 text-red-600 mb-2" />
          <p className="text-sm text-slate-600">Despesa Total</p>
          <p className="text-2xl font-bold">
            R$ {entries.filter(e => e.debitValue > 0).reduce((s, e) => s + Number(e.debitValue), 0).toFixed(2)}
          </p>
        </div>
      </div>

      {/* PONTO FORA DA CURVA */}
      {outliers.length > 0 && (
        <div className="bg-orange-50 border-2 border-orange-200 p-6 rounded-xl">
          <h3 className="text-lg font-bold text-orange-900 mb-4 flex items-center gap-2">
            <AlertTriangle className="h-6 w-6" />
            Análise Ponto Fora da Curva
          </h3>
          <div className="space-y-2">
            {outliers.map((outlier, idx) => (
              <div key={idx} className="bg-white p-3 rounded-lg">
                <p className="font-semibold">{outlier.description}</p>
                <p className="text-sm text-slate-600">
                  Valor: R$ {outlier.value.toFixed(2)} | Data: {new Date(outlier.date).toLocaleDateString('pt-BR')}
                </p>
                <p className="text-xs text-orange-600 mt-1">
                  Desvio: {outlier.deviation}% acima da média
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}