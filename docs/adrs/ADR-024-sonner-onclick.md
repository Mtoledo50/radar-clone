
---

### 📂 `docs/adrs/ADR-024-sonner-onclick.md`

```markdown
# ADR-024: Sonner Toast Actions Exigem `onClick` Definido

**Data:** 2026-09  
**Status:** ✅ Aceita  
**Decisor:** Marcos Toledo  
**Reversível:** Não (exigência do compilador TypeScript rigoroso)

---

## 📋 Contexto

Utilizamos a biblioteca `sonner` para notificações (toasts) no frontend. O `sonner` permite adicionar ações (botões) dentro do toast, como "Desfazer" ou "Cancelar".

**Problema:** Nas versões mais recentes do TypeScript e do `sonner`, a propriedade `action` ou `cancel` dentro do objeto de opções do toast exige estritamente que a função `onClick` seja definida. Passar apenas uma `label` ou um componente sem o handler `onClick` resulta em erro de tipo (TypeScript) ou comportamento indefinido no runtime.

---

## 🎯 Decisão

Sempre que utilizar as propriedades `action` ou `cancel` em um toast do `sonner`, a função `onClick` **DEVE** ser explicitamente definida, mesmo que seja uma função vazia (`() => {}`) caso a ação seja apenas visual ou tratada de outra forma.

---

## 💡 Implementação

### ❌ Errado (Erro de TypeScript / Comportamento Inesperado)

typescript
import { toast } from 'sonner';
toast('Mensagem enviada', {
cancel: {
label: 'Desfazer',
// Falta o onClick, causando erro de tipo ou falha silenciosa
}
});


### ✅ Correto (Padrão do Projeto)
```typescript
import { toast } from 'sonner';

toast('Mensagem enviada', {
  cancel: {
    label: 'Desfazer',
    onClick: () => {
      // Lógica de desfazer ou ao menos um handler vazio para satisfazer o tipo
      console.log('Ação desfeita');
    }
  }
});

// Ou, se for apenas um toast informativo sem ação real:
toast.success('Operação concluída com sucesso'); // Sem action/cancel

Exemplo Real (Sprint 31)

// frontend/src/app/dashboard/planejamento/page.tsx
toast.error('Erro ao salvar', {
  cancel: {
    label: 'Fechar',
    onClick: () => {} // Handler vazio obrigatório para satisfazer o tipo do Sonner
  }
});

✅ Consequências

Positivas

✅ Type Safety: Zero erros de TypeScript relacionados ao sonner.
✅ Previsibilidade: Garante que toda ação no toast tenha um comportamento definido.

Negativas

❌ Verbosidade mínima: Exige escrever onClick: () => {} mesmo quando não há lógica complexa.

📚 Referências

frontend/src/app/dashboard/planejamento/page.tsx
Documentação do Sonner: https://sonner.emilkowal.ski/toast

🔄 Histórico de Revisões
Data                Autor           Mudança
2026-09             Marcos Toledo   Criação inicial após falha no build rigoroso de produção
