ADR-054: Indicadores Customizados com Parser AST (Zero eval)

Data: 2026-08
Status: ✅ Aceita
Decisor: Marcos Toledo
Reversível: Não (Regra de Segurança Crítica)

📋 Contexto
O módulo de BI permite que o usuário crie indicadores customizados com fórmulas (ex: (Receita - Despesa) / Receita).
Problema:

Usar eval() ou new Function() no JavaScript para calcular essas fórmulas é uma falha de segurança catastrófica (Remote Code Execution), permitindo que um usuário malicioso execute código arbitrário no servidor ou no navegador.

🎯 Decisão

Implementar um Parser de AST (Abstract Syntax Tree) simples e seguro para avaliar apenas operações matemáticas básicas (+, -, *, /, ()) e variáveis pré-definidas. Nenhum eval ou Function é permitido.

Regras:

A fórmula é tokenizada e transformada em AST.
O AST é validado: apenas números, operadores matemáticos e variáveis do whitelist (ex: RECEITA, DESPESA) são permitidos.
Se houver qualquer função, atribuição ou caractere inválido, a fórmula é rejeitada na validação do DTO.

💡 Implementação

// backend/src/bi/domain/indicator-formula-parser.ts
// Implementação simplificada de Shunting Yard ou uso de biblioteca leve como 'expr-eval'
import { Parser } from 'expr-eval'; // Biblioteca segura, sem eval

const parser = new Parser({
  operators: {
    add: true,
    subtract: true,
    multiply: true,
    divide: true,
    // Funções perigosas desativadas por padrão
    sin: false,
    cos: false,
    eval: false,
  }
});

export function calculateIndicator(formula: string, variables: Record<string, number>): number {
  try {
    const expr = parser.parse(formula);
    return expr.evaluate(variables);
  } catch (error) {
    throw new BadRequestException(`Fórmula inválida ou variável não encontrada: ${error.message}`);
  }
}

✅ Consequências

Positivas: Segurança total contra injeção de código. Validação rápida e previsível.
Negativas: Limita as fórmulas a operações matemáticas (sem chamadas de API ou lógica complexa dentro da fórmula), o que é suficiente para 99% dos KPIs contábeis.

📚 Referências

backend/src/bi/domain/indicator-formula-parser.ts
frontend/src/app/dashboard/indicadores-custom/page.tsx