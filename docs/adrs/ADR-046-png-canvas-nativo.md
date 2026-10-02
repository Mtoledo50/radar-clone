
---

### 📂 `docs/adrs/ADR-046-png-canvas-nativo.md`

```markdown
# ADR-046: Geração de PNG da Capa via Canvas 2D Nativo

**Data:** 2026-08  
**Status:** ✅ Aceita  
**Decisor:** Marcos Toledo  
**Reversível:** Sim

---

## 📋 Contexto
Corretores precisam enviar a "capa" da proposta comercial pelo WhatsApp. Um PDF não é visualmente atraente no preview do WhatsApp. Precisamos de uma imagem PNG (ex: 1080x1350px) gerada dinamicamente com o nome do cliente, valor e logo do escritório.

**Problema:** 
Bibliotecas de geração de imagem a partir de DOM (como `html2canvas`) são pesadas, lentas e falham em ambientes SSR ou com fontes customizadas.

## 🎯 Decisão
Usar a **Canvas 2D API nativa do navegador** para desenhar a imagem programaticamente. É leve, rápido e não requer dependências externas.

## 💡 Implementação
```typescript
// frontend/src/lib/proposal-png.ts
export function generateProposalCover(proposalData: any): string {
  const canvas = document.createElement('canvas');
  canvas.width = 1080;
  canvas.height = 1350;
  const ctx = canvas.getContext('2d')!;

  // Fundo
  ctx.fillStyle = proposalData.company.primaryColor || '#0d9488';
  ctx.fillRect(0, 0, 1080, 1350);

  // Texto
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 60px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('PROPOSTA COMERCIAL', 540, 200);
  
  ctx.font = '40px Arial';
  ctx.fillText(`Para: ${proposalData.clientName}`, 540, 400);
  
  ctx.font = 'bold 80px Arial';
  ctx.fillText(`R$ ${proposalData.totalValue.toFixed(2)}/mês`, 540, 600);

  return canvas.toDataURL('image/png');
}

✅ Consequências

Positivas: Performance extrema, zero dependências, controle pixel-perfect do design.
Negativas: Desenhar texto e formas via código é mais verboso que usar HTML/CSS.

📚 Referências
frontend/src/lib/proposal-png.ts
