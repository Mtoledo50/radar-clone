
---

### 📂 `docs/adrs/ADR-050-motor-entrevista-intercambiavel.md`

```markdown
# ADR-050: Motor de Entrevista de Desligamento Intercambiável (Domínio Puro)

**Data:** 2026-08  
**Status:** ✅ Aceita  
**Decisor:** Marcos Toledo  
**Reversível:** Sim

---

## 📋 Contexto
O sistema oferece um formulário de entrevista de desligamento que, no futuro, poderá usar IA (LLM) para analisar o texto livre e sugerir a "causa primária" e um "plano de ação".

**Problema:** 
Acoplar a lógica de análise de texto diretamente no Service do NestJS tornaria o código dependente de uma API de IA específica (ex: OpenAI), dificultando a troca ou a criação de um modo "determinístico" (baseado em regras) para testes ou ambientes sem internet.

## 🎯 Decisão
Isolar a lógica de análise em um **Domínio Puro** (`exit-interview-engine.ts`), sem dependências externas (zero deps). O Service do NestJS apenas orquestra a chamada a este motor.

### Regras:
1. O motor recebe o texto e retorna: `{ primaryCause: string, confidence: number, actionPlan: string }`.
2. Na V1, o motor usa regras determinísticas (palavras-chave).
3. Na V2, o motor pode ser substituído por uma chamada à API da OpenAI/Claude **sem alterar o contrato do Service**.

## 💡 Implementação
```typescript
// backend/src/employees/domain/exit-interview-engine.ts
export interface InterviewAnalysis {
  primaryCause: 'SALARIO' | 'GESTAO' | 'CRESCIMENTO' | 'AMBIENTE' | 'OUTRO';
  confidence: number; // 0.0 a 1.0
  actionPlan: string;
}

export function analyzeExitInterview(text: string): InterviewAnalysis {
  const lowerText = text.toLowerCase();
  
  // Lógica determinística V1 (zero deps, zero chamadas de rede)
  if (lowerText.includes('salário') || lowerText.includes('pagamento')) {
    return { primaryCause: 'SALARIO', confidence: 0.9, actionPlan: 'Revisar faixa salarial do cargo.' };
  }
  if (lowerText.includes('chefe') || lowerText.includes('gestor')) {
    return { primaryCause: 'GESTAO', confidence: 0.85, actionPlan: 'Feedback 360º para a liderança.' };
  }
  
  // Fallback
  return { primaryCause: 'OUTRO', confidence: 0.5, actionPlan: 'Agendar reunião de RH para detalhamento.' };
}

✅ Consequências

Positivas: Testes de unidade instantâneos, sem mocks de API. Troca de provedor de IA no futuro é trivial (basta trocar a implementação do motor).
Negativas: A V1 determinística é limitada, mas cumpre o papel de validar o fluxo de UI/UX antes de gastar com tokens de LLM.

📚 Referências

backend/src/employees/domain/exit-interview-engine.ts
backend/src/employees/services/resignation.service.ts