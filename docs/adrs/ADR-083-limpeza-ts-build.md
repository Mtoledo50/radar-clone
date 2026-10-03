# ADR-083: Limpeza Técnica de TypeScript Antes de Remover `ignoreBuildErrors`

**Data:** 2026-08-26  
**Status:** ✅ Aceita  
**Decisor:** Marcos Toledo  
**Reversível:** Não (regra de qualidade)

---

## 📋 Contexto

O build de produção do Next.js estava com `typescript.ignoreBuildErrors: true` no `next.config.mjs`, permitindo que erros de TypeScript passassem despercebidos. Isso mascarava problemas reais:

- 10 erros de tipo `never[]` em `insights` (array vazio sem tipagem)
- 6 erros de `never` no Canvas 2D API (`roundRect` fallback)
- 1 erro de import (`api` vs `{ api }` do axios)

**Problema:**
Remover `ignoreBuildErrors` sem corrigir os erros faria o build de produção quebrar.

## 🎯 Decisão

**Corrigir TODOS os erros de TypeScript ANTES** de remover `ignoreBuildErrors` do build Docker. A ordem é:

1. Identificar todos os erros com `npx tsc --noEmit`
2. Corrigir cada erro com tipagem adequada
3. Remover `ignoreBuildErrors: true` do `next.config.mjs`
4. Validar com `next build` em modo produção

## 💡 Implementação

### Correção 1: Tipagem de Insights
```typescript
// frontend/src/app/dashboard/indicadores/page.tsx
type Insight = {
  type: 'success' | 'warning' | 'info';
  message: string;
};

const insights: Insight[] = []; // ✅ Tipado corretamente

Correção 2: Canvas 2D API

// frontend/src/lib/proposal-png.ts
const ctx = canvas.getContext('2d') as CanvasRenderingContext2D; // ✅ Alias explícito

// Fallback para roundRect (não existe em todos os browsers)
if (ctx.roundRect) {
  ctx.roundRect(x, y, w, h, radius);
} else {
  // Fallback manual
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + w - radius, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
  // ...
}

Correção 3: Import do Axios
// ❌ Errado
import { api } from '@/lib/api';

// ✅ Correto (axios exporta default)
import api from '@/lib/api';


Remoção da Flag

// next.config.mjs
module.exports = {
  // ❌ Removido: typescript: { ignoreBuildErrors: true }
  output: 'standalone',
};

✅ Consequências

Positivas

✅ Build Rigoroso: next build agora valida TypeScript como tsc --noEmit
✅ Zero Erros: Found 0 errors no build de produção
✅ Segurança: Evita regressão silenciosa em CI futuro

Negativas

❌ Esforço Inicial: 17 erros corrigidos manualmente
❌ Tempo de Build: Aumentou de 6s para 8.5s (type-check agora é rigoroso)

📚 Referências

Arquivos afetados:

frontend/src/app/dashboard/indicadores/page.tsx
frontend/src/lib/proposal-png.ts
frontend/src/components/ClosingModal.tsx
frontend/next.config.mjs

ADRs relacionadas:

ADR-078 (ignoreBuildErrors no build Docker — agora removido)

🔄 Histórico de Revisões

Data                Autor               Mudança
2026-08-26          Marcos Toledo       Criação inicial (Sprint Limpeza TS)