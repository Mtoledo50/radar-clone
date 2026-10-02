
---

### 📂 `docs/adrs/ADR-045-pdf-v2-propostas.md`

```markdown
# ADR-045: PDF v2 de Propostas no Cliente (Zero Carga no Servidor)

**Data:** 2026-08  
**Status:** ✅ Aceita  
**Decisor:** Marcos Toledo  
**Reversível:** Sim

---

## 📋 Contexto
Diferente dos relatórios contábeis mensais (que são gerados no backend - ADR-035), as **Propostas Comerciais** são visualizadas e baixadas com alta frequência pelos corretores durante reuniões com clientes.

**Problema:** 
Gerar PDFs de propostas no servidor para cada visualização consome CPU desnecessária e cria gargalos de concorrência.

## 🎯 Decisão
A geração do PDF da proposta comercial (v2) e do PNG da capa (para WhatsApp) é feita **100% no cliente (Frontend)**, usando `jspdf` + `jspdf-autotable` para o PDF e Canvas 2D nativo para o PNG.

### Regras:
1. O backend fornece apenas os dados JSON da proposta (itens, valores, dados da empresa).
2. O frontend monta o layout e dispara a geração do arquivo.
3. Isso transfere o custo de processamento para a máquina do usuário, escalando infinitamente sem afetar o backend.

## 💡 Implementação
```typescript
// frontend/src/lib/proposal-pdf.ts
import jsPDF from 'jspdf';
import 'jspdf-autotable';

export function generateProposalPdf(proposalData: any) {
  const doc = new jsPDF();
  
  // Cabeçalho com cores da marca
  doc.setFillColor(proposalData.company.primaryColor || '#0d9488');
  doc.rect(0, 0, 210, 40, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.text(proposalData.title, 14, 25);
  
  // Tabela de itens
  (doc as any).autoTable({
    startY: 50,
    head: [['Serviço', 'Qtd', 'Valor Unit.', 'Total']],
    body: proposalData.items.map((item: any) => [
      item.name,
      item.quantity,
      `R$ ${item.unitPrice.toFixed(2)}`,
      `R$ ${item.totalPrice.toFixed(2)}`
    ]),
    theme: 'grid',
    headStyles: { fillColor: [13, 148, 136] } // Teal
  });
  
  doc.save(`proposta-${proposalData.clientName}.pdf`);
}

✅ Consequências
Positivas: Escalabilidade infinita no backend, geração instantânea sem latência de rede.
Negativas: Depende da performance do dispositivo do usuário (geralmente irrelevante para PDFs de 1-5 páginas).
📚 Referências
frontend/src/lib/proposal-pdf.ts
frontend/src/app/dashboard/precificacao/propostas/page.tsx

