
---

### 📂 `docs/adrs/ADR-023-optional-chaining-map.md`

```markdown
# ADR-023: Optional Chaining (?.) em `.map` de Arrays Opcionais no JSX

**Data:** 2026-09  
**Status:** ✅ Aceita  
**Decisor:** Marcos Toledo  
**Reversível:** Não (regra de segurança de runtime)

---

## 📋 Contexto

No React/Next.js, é comum renderizar listas de dados usando o método `.map()`. Muitas vezes, esses dados vêm de uma API e podem ser `null` ou `undefined` até que a requisição seja concluída, ou o campo no objeto pode ser opcional.

**Problema:** Chamar `.map()` em `null` ou `undefined` lança um erro fatal de runtime: `TypeError: Cannot read properties of null (reading 'map')`, quebrando toda a árvore de componentes do React (White Screen of Death).

---

## 🎯 Decisão

Sempre utilizar **Optional Chaining (`?.`)** ao chamar `.map()` em qualquer array que possa ser `null`, `undefined` ou que seja uma propriedade opcional de um objeto. Como fallback, fornecer um array vazio `[]` ou renderização condicional.

---

## 💡 Implementação

### ❌ Errado (Risco de Crash)
tsx
// Se item.children for null ou undefined, a aplicação quebra
{item.children.map((child: any) => (
<li key={child.id}>{child.name}</li>
))}


### ✅ Correto (Padrão do Projeto)
```tsx
// Opção 1: Optional chaining com fallback de array vazio (Recomendado)
{item.children?.map((child: any) => (
  <li key={child.id}>{child.name}</li>
))}

// Opção 2: Renderização condicional explícita (Melhor para performance se a lista for grande)
{item.children && item.children.length > 0 && (
  <ul>
    {item.children.map((child: any) => (
      <li key={child.id}>{child.name}</li>
    ))}
  </ul>
)}

Tipagem no TypeScript
Garanta que a interface reflita a opcionalidade:

interface MenuItem {
  id: string;
  name: string;
  children?: MenuItem[]; // ✅ Marcado como opcional
}

✅ Consequências

Positivas

✅ Estabilidade: Elimina uma das causas mais comuns de crashes em tempo de execução no frontend.
✅ Legibilidade: ?. é conciso e amplamente compreendido por desenvolvedores JavaScript/TypeScript.

Negativas

❌ Nenhuma significativa. O overhead de performance é inexistente.

📚 Referências

frontend/src/app/dashboard/layout.tsx (menu lateral com subitens)
Correção aplicada na Sprint 31 para resolver crash no menu lateral.

🔄 Histórico de Revisões
Data                Autor               Mudança
2026-09             Marcos Toledo       Criação inicial após crash no menu lateral
