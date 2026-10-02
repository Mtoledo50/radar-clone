
---

### 📂 `docs/adrs/ADR-060-efd-contribuicoes-v1.md`

```markdown
# ADR-060: EFD-Contribuições v1 sem Filtro de Competência

**Data:** 2026-08  
**Status:** ✅ Aceita  
**Decisor:** Marcos Toledo  
**Reversível:** Sim

---

## 📋 Contexto
O módulo Aurora (Sprint FD-6) precisa gerar o arquivo da EFD-Contribuições (PIS/COFINS) para clientes do Lucro Real e Lucro Presumido, com base nos dados fiscais já importados no Radar.

**Problema:** 
A EFD-Contribuições é complexa (múltiplos blocos, registros M200/M600, CSTs variados) e exige precisão fiscal absoluta.

## 🎯 Decisão
Implementar a **EFD-Contribuições v1** focada apenas nos registros **M200** (PIS) e **M600** (COFINS), sem filtro de competência (gera para todos os meses disponíveis). Versões futuras adicionarão filtros de competência e outros blocos (A, C, D, F, I).

### Regras:
1. **Cálculo Determinístico (ADR-031):** Bases de PIS/COFINS são extraídas das NF-e de entrada/saída já importadas, com alíquotas fixas por CST.
2. **Zero IA Generativa:** Nenhum cálculo é feito por LLM, apenas código TypeScript puro.
3. **Layout Legal Fixo:** Arquivo `.txt` no formato exigido pela Receita Federal (pipe-delimited, campos posicionais).

## 💡 Implementação
```typescript
// backend/src/fiscal/services/efd-contribuicoes.service.ts
@Injectable()
export class EfdContribuicoesService {
  async generate(companyId: string, clientId: string): Promise<string> {
    // 1. Buscar NF-e de entrada (créditos)
    const creditos = await this.prisma.fiscalInvoice.findMany({
      where: { companyId, clientId, type: 'ENTRADA' },
      include: { items: true },
    });

    // 2. Buscar NF-e de saída (débitos)
    const debitos = await this.prisma.fiscalInvoice.findMany({
      where: { companyId, clientId, type: 'SAIDA' },
      include: { items: true },
    });

    // 3. Calcular bases por CST
    const basePis = this.calculateBase(creditos, debitos, 'PIS');
    const baseCofins = this.calculateBase(creditos, debitos, 'COFINS');

    // 4. Gerar registros M200 (PIS) e M600 (COFINS)
    const lines = [
      '|0000|...', // Registro 0000 (abertura)
      `|M200|${basePis.period}|${basePis.totalCredit}|${basePis.totalDebit}|${basePis saldo}|`,
      `|M600|${baseCofins.period}|${baseCofins.totalCredit}|${baseCofins.totalDebit}|${baseCofins.saldo}|`,
      '|9999|...', // Registro 9999 (encerramento)
    ];

    return lines.join('\r\n');
  }
}

✅ Consequências
Positivas: Geração rápida e determinística, compliance fiscal garantido, download direto no frontend.
Negativas: v1 não suporta filtros de competência (gera tudo), requer evolução para v2.
📚 Referências
backend/src/fiscal/services/efd-contribuicoes.service.ts
frontend/src/app/dashboard/fiscal/efd-contribuicoes/page.tsx

