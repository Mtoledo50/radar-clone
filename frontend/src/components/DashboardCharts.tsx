'use client';

// 🎨 Paleta Conta Certa
const PALETA = {
  teal: '#0d9488',
  laranja: '#f97316',
  cinza: '#cbd5e1', // slate-300
};

// =================================================================
// 📊 GRÁFICO DE ROSCA (Donut Chart) com CSS Puro (conic-gradient)
// =================================================================
export function PieChartComponent({ data }: { data: { name: string; value: number }[] }) {
  if (!data || data.length === 0) {
    return (
      <div className="h-[300px] flex flex-col items-center justify-center text-slate-400 bg-slate-50 rounded-lg border-2 border-dashed border-slate-200">
        <p className="text-sm font-medium">Nenhum dado disponível</p>
        <p className="text-xs mt-1 text-slate-500">Cadastre softwares em "Minha Empresa"</p>
      </div>
    );
  }

  const total = data.reduce((acc, item) => acc + (Number(item.value) || 0), 0);
  if (total === 0) {
    return (
      <div className="h-[300px] flex flex-col items-center justify-center text-slate-400 bg-slate-50 rounded-lg border-2 border-dashed border-slate-200">
        <p className="text-sm font-medium">Valores zerados</p>
      </div>
    );
  }

  // Gera o conic-gradient dinamicamente com base nos valores
  let currentAngle = 0;
  const gradientParts: string[] = [];
  const colors = [PALETA.teal, PALETA.laranja, PALETA.cinza, '#14b8a6', '#fb923c'];

  data.forEach((item, index) => {
    const value = Number(item.value) || 0;
    const percentage = (value / total) * 100;
    const color = colors[index % colors.length];
    
    gradientParts.push(`${color} ${currentAngle}% ${currentAngle + percentage}%`);
    currentAngle += percentage;
  });

  const conicGradient = `conic-gradient(${gradientParts.join(', ')})`;

  return (
    <div className="h-[300px] flex flex-col items-center justify-center">
      {/* Gráfico de Rosca */}
      <div className="relative w-48 h-48 rounded-full shadow-sm" style={{ background: conicGradient }}>
        {/* Buraco no meio para fazer o efeito "Donut" */}
        <div className="absolute inset-4 bg-white rounded-full flex items-center justify-center shadow-inner">
          <div className="text-center">
            <span className="block text-3xl font-bold text-slate-900">{total}</span>
            <span className="text-xs text-slate-500 font-medium">Total</span>
          </div>
        </div>
      </div>
      
      {/* Legenda */}
      <div className="mt-6 flex flex-wrap justify-center gap-4">
        {data.map((item, index) => {
          const value = Number(item.value) || 0;
          const percentage = ((value / total) * 100).toFixed(0);
          const color = colors[index % colors.length];
          return (
            <div key={item.name} className="flex items-center gap-2 text-sm">
              <div className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: color }} />
              <span className="text-slate-600">
                {item.name} <span className="font-semibold text-slate-900">({percentage}%)</span>
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// =================================================================
// 📊 GRÁFICO DE BARRAS com CSS Puro (Flexbox)
// =================================================================
export function BarChartComponent({ data }: { data: any[] }) {
  if (!data || data.length === 0) {
    return (
      <div className="h-[300px] flex flex-col items-center justify-center text-slate-400 bg-slate-50 rounded-lg border-2 border-dashed border-slate-200">
        <p className="text-sm font-medium">Nenhuma movimentação registrada</p>
      </div>
    );
  }

  const safeData = data.map(item => ({
    name: String(item.name),
    Admissões: Math.max(0, Number(item.Admissões) || 0),
    Demissões: Math.max(0, Number(item.Demissões) || 0)
  }));

  // Encontrar o valor máximo para calcular as alturas relativas (mínimo 1 para evitar divisão por zero)
  const maxValue = Math.max(...safeData.flatMap(d => [d.Admissões, d.Demissões]), 1);

  return (
    <div className="h-[300px] flex flex-col justify-end px-4 pb-6">
      {/* Área das barras */}
      <div className="flex-1 flex items-end justify-around gap-8 border-b border-slate-200 pb-2">
        {safeData.map((item, idx) => (
          <div key={idx} className="flex flex-col items-center gap-2 flex-1">
            <div className="flex items-end gap-3 w-full justify-center h-full">
              {/* Barra de Admissões */}
              <div className="group relative flex flex-col items-center">
                <div 
                  className="w-10 sm:w-12 rounded-t-md transition-all duration-500 hover:opacity-80 cursor-pointer"
                  style={{ 
                    height: `${(item.Admissões / maxValue) * 100}%`, 
                    minHeight: item.Admissões > 0 ? '8px' : '0px',
                    backgroundColor: PALETA.teal 
                  }}
                />
                <span className="text-xs font-bold text-teal-700 mt-2">{item.Admissões}</span>
              </div>
              
              {/* Barra de Demissões */}
              <div className="group relative flex flex-col items-center">
                <div 
                  className="w-10 sm:w-12 rounded-t-md transition-all duration-500 hover:opacity-80 cursor-pointer"
                  style={{ 
                    height: `${(item.Demissões / maxValue) * 100}%`, 
                    minHeight: item.Demissões > 0 ? '8px' : '0px',
                    backgroundColor: PALETA.laranja 
                  }}
                />
                <span className="text-xs font-bold text-orange-700 mt-2">{item.Demissões}</span>
              </div>
            </div>
            <span className="text-sm font-semibold text-slate-600 mt-2">{item.name}</span>
          </div>
        ))}
      </div>
      
      {/* Legenda */}
      <div className="flex justify-center gap-6 mt-4">
        <div className="flex items-center gap-2 text-sm">
          <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: PALETA.teal }} />
          <span className="text-slate-600">Admissões</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: PALETA.laranja }} />
          <span className="text-slate-600">Demissões</span>
        </div>
      </div>
    </div>
  );
}