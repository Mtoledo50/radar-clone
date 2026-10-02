
---

### 📂 `docs/adrs/ADR-058-ranking-niveis-gamification.md`

```markdown
# ADR-058: Ranking de Níveis (Bronze → Diamante) Multi-Tenant

**Data:** 2026-08  
**Status:** ✅ Aceita  
**Decisor:** Marcos Toledo  
**Reversível:** Sim

---

## 📋 Contexto
Como parte da gamificação (Fase D), o sistema exibe um "pódio" mostrando a evolução do escritório em relação a si mesmo e, opcionalmente, de forma anônima, em relação à base de usuários da plataforma.

**Problema:** 
Comparar escritórios de tamanhos diferentes (10 funcionários vs 100 funcionários) em métricas absolutas é injusto e desmotivador.

## 🎯 Decisão
O ranking é baseado **exclusivamente no Score Ponderado (ADR-055)** e na **Evolutividade (Delta do Score nos últimos 3 meses)**, não em valores absolutos de faturamento ou número de clientes.

### Níveis:
- **Bronze:** Score < 50
- **Prata:** Score 50 - 69
- **Ouro:** Score 70 - 84
- **Platina:** Score 85 - 94
- **Diamante:** Score ≥ 95

### Regras de Privacidade:
- O ranking "Global" mostra apenas a posição percentil (ex: "Você está no top 15% dos escritórios"), **nunca** expõe dados ou nomes de outros tenants.
- O ranking "Pessoal" mostra a evolução mês a mês do próprio escritório.

## 💡 Implementação
```typescript
// backend/src/bi/services/ranking.service.ts
export function getLevelName(score: number): string {
  if (score >= 95) return 'DIAMANTE 💎';
  if (score >= 85) return 'PLATINA 🥇';
  if (score >= 70) return 'OURO 🥇';
  if (score >= 50) return 'PRATA 🥈';
  return 'BRONZE 🥉';
}

✅ Consequências
Positivas: Gamificação segura, que respeita a LGPD e o sigilo competitivo entre escritórios, ao mesmo tempo que motiva a melhoria.
Negativas: Requer cálculo agregado anônimo no backend para determinar os percentis, o que adiciona uma query de agregação leve.
📚 Referências
backend/src/bi/services/ranking.service.ts
frontend/src/app/dashboard/ranking/page.tsx

