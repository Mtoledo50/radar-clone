# ADR-001: Gráficos em CSS Puro

**Data:** 2026-07  
**Status:** ✅ Aceita  
**Decisor:** Marcos Toledo  
**Reversível:** Sim

---

## 📋 Contexto

O projeto inicialmente considerou usar bibliotecas de gráficos como Recharts ou Chart.js para visualizações no Dashboard Executivo e páginas de BI. Durante testes com Next.js 16 + Turbopack + React 19, surgiram problemas:

1. **Incompatibilidades de build** com React 19 em modo experimental
2. **Bundle inflado** (+200KB de JavaScript)
3. **Problemas de hidratação** no servidor
4. **Dependência de bibliotecas externas** que podem quebrar com atualizações

O objetivo era criar visualizações de dados simples (barras, linhas, indicadores) sem comprometer a performance ou a estabilidade do sistema.

---

## 🎯 Decisão

Usar **CSS puro** (flexbox, grid, gradientes, animações) para todos os gráficos do sistema, sem dependências externas de visualização.

### Quando usar CSS puro:
- Gráficos de barras (verticais/horizontais)
- Indicadores de progresso
- Linhas simples com pontos
- Heatmaps simples
- Indicadores de tendência (setas, cores)

### Quando NÃO usar CSS puro:
- Gráficos complexos (pizza, radar, scatter plot)
- Visualizações interativas com zoom/pan
- Dados com milhares de pontos
- Necessidade de exportação para imagem/PDF

---

## 💡 Implementação

### Exemplo 1: Gráfico de Barras Vertical

```tsx
// frontend/src/components/charts/BarChart.tsx
'use client';

interface BarChartProps {
  data: Array<{ label: string; value: number; color?: string }>;
  height?: string;
  showValues?: boolean;
}

export function BarChart({ data, height = 'h-64', showValues = true }: BarChartProps) {
  const maxValue = Math.max(...data.map(d => d.value));
  
  return (
    <div className={`flex items-end gap-2 ${height} w-full`}>
      {data.map((item, index) => {
        const percentage = (item.value / maxValue) * 100;
        const color = item.color || 'bg-teal-500';
        
        return (
          <div 
            key={index}
            className="flex-1 flex flex-col items-center gap-2"
          >
            {/* Barra */}
            <div 
              className={`w-full ${color} rounded-t transition-all duration-300 hover:opacity-80 relative group`}
              style={{ height: `${percentage}%` }}
            >
              {/* Tooltip no hover */}
              {showValues && (
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                  {item.value.toLocaleString('pt-BR')}
                </div>
              )}
            </div>
            
            {/* Label */}
            <div className="text-xs text-gray-600 text-center truncate w-full">
              {item.label}
            </div>
          </div>
        );
      })}
    </div>
  );
}

Exemplo 2: Gráfico de Linha Simples

// frontend/src/components/charts/LineChart.tsx
interface LineChartProps {
  data: Array<{ label: string; value: number }>;
  color?: string;
  showDots?: boolean;
}

export function LineChart({ data, color = 'text-teal-500', showDots = true }: LineChartProps) {
  const maxValue = Math.max(...data.map(d => d.value));
  const minValue = Math.min(...data.map(d => d.value));
  const range = maxValue - minValue;
  
  return (
    <div className="relative h-48 w-full flex items-end gap-1">
      {data.map((item, index) => {
        const percentage = range === 0 ? 50 : ((item.value - minValue) / range) * 100;
        
        return (
          <div 
            key={index}
            className="flex-1 flex flex-col items-center justify-end"
          >
            {/* Ponto */}
            {showDots && (
              <div 
                className={`w-2 h-2 rounded-full ${color.replace('text-', 'bg-')} mb-1`}
                style={{ marginBottom: `${percentage}%` }}
              />
            )}
            
            {/* Label */}
            <div className="text-xs text-gray-500 mt-2">
              {item.label}
            </div>
          </div>
        );
      })}
    </div>
  );
}
Exemplo 3: Indicador de Progresso

// frontend/src/components/charts/ProgressBar.tsx
interface ProgressBarProps {
  value: number;
  max?: number;
  label?: string;
  color?: string;
}

export function ProgressBar({ value, max = 100, label, color = 'bg-teal-500' }: ProgressBarProps) {
  const percentage = (value / max) * 100;
  
  return (
    <div className="w-full">
      {label && (
        <div className="flex justify-between mb-1">
          <span className="text-sm text-gray-700">{label}</span>
          <span className="text-sm font-medium text-gray-900">
            {value} / {max}
          </span>
        </div>
      )}
      
      <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
        <div 
          className={`${color} h-full rounded-full transition-all duration-500`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

✅ Consequências

Positivas
✅ Performance: Bundle menor (~200KB economizados)
✅ Simplicidade: Zero dependências externas de gráfico
✅ Velocidade: Renderização mais rápida (sem canvas/SVG overhead)
✅ Consistência: Tema visual unificado com Tailwind
✅ Manutenibilidade: Código CSS é mais fácil de debugar que bibliotecas complexas

Negativas
❌ Limitações: Gráficos menos interativos (sem hover nativo avançado)
❌ Complexidade manual: Desenvolvimento manual de cada tipo de gráfico
❌ Escalabilidade: Não ideal para grandes volumes de dados (>1000 pontos)
❌ Exportação: Dificuldade em exportar para imagem/PDF sem bibliotecas adicionais

📚 Referências

Arquivos que usam esta ADR:
frontend/src/app/dashboard/page.tsx (gráficos do dashboard executivo)
frontend/src/app/dashboard/bi/page.tsx (DRE visual)
frontend/src/app/dashboard/pessoas/page.tsx (indicadores de RH)
frontend/src/components/charts/ (componentes reutilizáveis)

Alternativas consideradas:

Recharts: Descartado por incompatibilidade com React 19
Chart.js: Descartado por bundle pesado
D3.js: Descartado por complexidade excessiva para casos simples

🔄 Histórico de Revisões

Data            Autor           Mudança
2026-07         Marcos Toledo   Criação inicial
2026-08         Marcos Toledo   Adicionados exemplos de código

