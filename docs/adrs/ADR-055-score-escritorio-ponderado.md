
---

### 📂 `docs/adrs/ADR-055-score-escritorio-ponderado.md`

```markdown
# ADR-055: Score 0-100 do Escritório com 5 Dimensões Ponderadas

**Data:** 2026-08  
**Status:** ✅ Aceita  
**Decisor:** Marcos Toledo  
**Reversível:** Sim

---

## 📋 Contexto
O sistema precisa dar uma "nota" geral de saúde do escritório contábil (gamificação), similar a um score de crédito, para motivar a melhoria contínua.

**Problema:** 
Uma média aritmética simples de KPIs distorce a realidade (ex: ter 100% em "Tarefas" não compensa ter 0% em "Faturamento").

## 🎯 Decisão
O Score é calculado como uma **média ponderada de 5 dimensões fixas**, cada uma com peso diferente, baseado na importância estratégica para um escritório contábil.

### Dimensões e Pesos:
1. **Financeiro (35%)**: Faturamento vs Meta, Inadimplência.
2. **Operacional (25%)**: Tarefas no prazo, Fechamentos em dia.
3. **Pessoas (20%)**: Turnover de críticos, Distribuição de setores.
4. **Comercial (10%)**: Taxa de conversão de propostas.
5. **Fiscal/Contábil (10%)**: Pendências fiscais, conciliações em aberto.

### Regras:
- Cada dimensão retorna um score normalizado de 0 a 100.
- Score Final = `(Fin * 0.35) + (Op * 0.25) + (Pes * 0.20) + (Com * 0.10) + (Fis * 0.10)`.
- O resultado é classificado em faixas: 0-40 (Crítico), 41-60 (Atenção), 61-80 (Bom), 81-100 (Excelente).

## 💡 Implementação
```typescript
// backend/src/bi/domain/office-score.ts
export function calculateOfficeScore(metrics: OfficeMetrics): number {
  const financialScore = calculateFinancialScore(metrics); // 0-100
  const operationalScore = calculateOperationalScore(metrics); // 0-100
  // ... (outras dimensões)

  const finalScore = 
    (financialScore * 0.35) +
    (operationalScore * 0.25) +
    (peopleScore * 0.20) +
    (commercialScore * 0.10) +
    (fiscalScore * 0.10);

  return Math.round(finalScore);
}

✅ Consequências

Positivas: Score justo e alinhado com a estratégia de negócio. Fácil de explicar ao usuário ("seu score caiu porque a inadimplência subiu, que tem peso 35%").
Negativas: Requer que todos os 5 pilares tenham pelo menos um KPI calculável, caso contrário o score fica distorcido.

📚 Referências
backend/src/bi/domain/office-score.ts
frontend/src/app/dashboard/score/page.tsx