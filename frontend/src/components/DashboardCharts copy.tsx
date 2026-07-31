'use client';

import { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

const PALETA = {
  teal: '#0d9488',
  laranja: '#f97316',
  cinza: '#64748b',
};

// =================================================================
// 📊 GRÁFICO DE PIZZA (Blindado contra NaN com isAnimationActive={false})
// =================================================================
export function PieChartComponent({ data }: { data: { name: string; value: number }[] }) {
  const [isMounted, setIsMounted] = useState(false);

  // 🔥 Garante que o gráfico só renderize no navegador (evita bugs de hidratação)
  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return <div className="h-[300px] flex items-center justify-center text-slate-400 text-sm">Carregando gráfico...</div>;
  }

  const safeData = (data || [])
    .map(item => ({
      name: String(item.name || 'Item'),
      value: Math.max(0, Number(item.value) || 0)
    }))
    .filter(item => item.value > 0);

  if (safeData.length === 0) {
    return (
      <div className="h-[300px] flex flex-col items-center justify-center text-slate-400 bg-slate-50 rounded-lg border-2 border-dashed border-slate-200">
        <p className="text-sm font-medium">Nenhum dado positivo para exibir</p>
        <p className="text-xs mt-1 text-slate-500">Cadastre softwares em "Minha Empresa"</p>
      </div>
    );
  }

  return (
    <div className="flex justify-center items-center w-full">
      <PieChart width={400} height={300}>
        <Pie
          data={safeData}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={100}
          paddingAngle={2}
          dataKey="value"
          nameKey="name"
          isAnimationActive={false} // 🔥 CRÍTICO: Desativa a animação que causa o bug NaN no React 19
        >
          {safeData.map((_, index) => (
            <Cell key={`cell-${index}`} fill={[PALETA.teal, PALETA.laranja, PALETA.cinza][index % 3]} />
          ))}
        </Pie>
        <Tooltip
          formatter={(value: number) => [`${value}`, 'Quantidade']}
          contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0' }}
        />
        <Legend />
      </PieChart>
    </div>
  );
}

// =================================================================
// 📊 GRÁFICO DE BARRAS (Blindado contra NaN)
// =================================================================
export function BarChartComponent({ data }: { data: any[] }) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return <div className="h-[300px] flex items-center justify-center text-slate-400 text-sm">Carregando gráfico...</div>;
  }

  const safeData = (data || []).map(item => ({
    name: String(item.name || 'Período'),
    Admissões: Math.max(0, Number(item.Admissões) || 0),
    Demissões: Math.max(0, Number(item.Demissões) || 0)
  }));

  return (
    <div className="flex justify-center items-center w-full">
      <BarChart width={500} height={300} data={safeData}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
        <XAxis dataKey="name" stroke="#64748b" />
        <YAxis stroke="#64748b" />
        <Tooltip
          contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0' }}
        />
        <Legend />
        <Bar dataKey="Admissões" fill={PALETA.teal} radius={[8, 8, 0, 0]} isAnimationActive={false} />
        <Bar dataKey="Demissões" fill={PALETA.laranja} radius={[8, 8, 0, 0]} isAnimationActive={false} />
      </BarChart>
    </div>
  );
}