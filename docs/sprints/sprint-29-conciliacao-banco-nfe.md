# 🔗 Sprint 29: Conciliação Automática Banco × NF-e

**Data:** 08/2026 | **Status:** ✅ HOMOLOGADA

## 🎯 Objetivo
Reduzir de horas para minutos o trabalho mensal de conferência, cruzando débitos bancários com NF-e de entrada do mesmo cliente.

## 📦 O que foi entregue
- **Motor de Score:** Pesos configuráveis: Valor exato (60%) + Similaridade de nome Jaccard (30%) + Proximidade de data ±30 dias (10%).
- **Thresholds:** 🟢 ≥80% (sugestão forte) | 🟡 50–79% (revisão humana obrigatória) | <50% (ignorado).
- **UI:** Aba "Conciliação NF-e" no Fechamento com cards de resumo, tabela de sugestões e ações em lote (Confirmar/Descartar).
- **Rastreabilidade:** Tabela `BankNfeMatch` com status, `confirmedAt`, `confirmedBy` e `scoreBreakdown` (JSON).

## 🧠 Decisões Técnicas
- Conciliação apenas entre **débitos bancários** e **NF-e de ENTRADA** (compras), pois o estoque fiscal armazena notas de compra.
- Sugestões não gravam nada até a confirmação humana (Regra de Ouro ADR-030).
- Matches confirmados persistem e não reaparecem como sugestão (filtro de status no motor).

## 📂 Localização do Código
- **Backend:** `backend/src/banking/banking-reconcile.service.ts`
- **Frontend:** `frontend/src/components/banking/ReconcileTab.tsx`
- **Banco:** Model `BankNfeMatch` + Enums `MatchStatus`, `MatchType` no `schema.prisma`.