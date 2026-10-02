# ADR-031: Cálculo Tributário Determinístico (IA Só Sugere)

**Data:** 2026-08  
**Status:** ✅ Aceita (Regra Crítica de Compliance)  
**Decisor:** Marcos Toledo  
**Reversível:** Não (exigência legal)

---

## 📋 Contexto

O sistema calcula impostos (ICMS, IPI, PIS, COFINS, ISS, DAS) para clientes de diferentes regimes tributários (Simples Nacional, Lucro Presumido, Lucro Real). 

**Problema:** 
- Cálculos tributários têm consequências legais diretas (multas, autuações)
- Erros de arredondamento podem gerar divergências com o fisco
- IA generativa (LLMs) pode "alucinar" valores ou aplicar regras incorretas
- Contadores precisam de **reprodutibilidade total** (mesmo input = mesmo output)

**Dilema:** 
Como usar IA para acelerar o processo sem comprometer a precisão fiscal?

---

## 🎯 Decisão

**Todo cálculo tributário DEVE ser determinístico e implementado em código TypeScript/Python puro**, seguindo rigorosamente as regras da legislação (Lei Complementar 123/2006 para Simples, IN RFB para demais).

### Regras Inegociáveis:

1. **Zero IA Generativa em Cálculos:**
   - LLMs (GPT, Claude, Mistral) **NÃO** podem calcular valores de imposto
   - IA pode ser usada apenas para **sugerir classificação** (ex: "este lançamento parece ser ICMS-ST")
   - O cálculo final é sempre feito por funções matemáticas explícitas

2. **Precisão Decimal:**
   - Usar `Decimal(14, 4)` para bases de cálculo e alíquotas
   - Usar `Decimal(14, 2)` para valores finais de imposto
   - Arredondamento apenas no último passo (nunca intermediário)

3. **Auditoria Completa:**
   - Cada cálculo deve registrar: base, alíquota, valor, data/hora, usuário
   - Modelo `TaxCalculationAudit` armazena o "passo a passo" (ex: "Base R$ 10.000 × 3% = R$ 300")

4. **Reprodutibilidade:**
   - Mesmos dados de entrada → mesmo resultado (sem randomização, sem "aprendizado" que altere cálculos)
   - Versão da regra fiscal documentada (ex: "Simples Nacional Anexo III - vigência 2026")

---

## 💡 Implementação

### Backend: Serviço de Cálculo Determinístico

```typescript
// backend/src/fiscal/services/tax-calculation.service.ts

import { Injectable } from '@nestjs/common';
import { Decimal } from '@prisma/client/runtime/library';

@Injectable()
export class TaxCalculationService {
  
  /**
   * Calcula DAS do Simples Nacional (Anexo III)
   * 
   * Regra: LC 123/2006, art. 19
   * Alíquota efetiva = (RPA × Receita Bruta - PD) / Receita Bruta
   * 
   * @param receitaBruta12m - Receita bruta dos últimos 12 meses
   * @param receitaAtual - Receita do mês atual
   * @returns Valor do DAS a pagar
   */
  calcularDAS(receitaBruta12m: Decimal, receitaAtual: Decimal): Decimal {
    // Tabela Anexo III (2026)
    const faixas = [
      { limite: 180000, aliquota: 0.06, deducao: 0 },
      { limite: 360000, aliquota: 0.112, deducao: 9360 },
      { limite: 720000, aliquota: 0.135, deducao: 17640 },
      { limite: 1800000, aliquota: 0.16, deducao: 35640 },
      { limite: 3600000, aliquota: 0.21, deducao: 125640 },
      { limite: 4800000, aliquota: 0.33, deducao: 648000 },
    ];

    // Encontrar faixa
    const faixa = faixas.find(f => receitaBruta12m.toNumber() <= f.limite) 
      || faixas[faixas.length - 1];

    // RPA (Receita Preta Acumulada) = Receita 12m × Alíquota Nominal - Dedução
    const rpa = receitaBruta12m.mul(faixa.aliquota).sub(faixa.deducao);

    // Alíquota efetiva = RPA / Receita 12m
    const aliquotaEfetiva = rpa.div(receitaBruta12m);

    // DAS = Receita Atual × Alíquota Efetiva
    const das = receitaAtual.mul(aliquotaEfetiva);

    // Arredondar para 2 casas decimais (último passo)
    return this.round2(das);
  }

  /**
   * Calcula ICMS (Lucro Presumido)
   * 
   * Regra: Crédito = NF-e de entrada × Alíquota
   *        Débito = NF-e de saída × Alíquota
   *        Saldo = Débito - Crédito
   * 
   * @param creditos - Total de créditos (NF-e de entrada)
   * @param debitos - Total de débitos (NF-e de saída)
   * @param aliquota - Alíquota estadual (ex: 18% para SP)
   * @returns Saldo a pagar (ou crédito acumulado se negativo)
   */
  calcularICMS(
    creditos: Decimal, 
    debitos: Decimal, 
    aliquota: Decimal
  ): { saldo: Decimal; creditos: Decimal; debitos: Decimal } {
    const debitoIcms = debitos.mul(aliquota);
    const creditoIcms = creditos.mul(aliquota);
    const saldo = debitoIcms.sub(creditoIcms);

    return {
      saldo: this.round2(saldo),
      creditos: this.round2(creditoIcms),
      debitos: this.round2(debitoIcms),
    };
  }

  /**
   * Arredonda para 2 casas decimais (evita erro de ponto flutuante)
   */
  private round2(value: Decimal): Decimal {
    return new Decimal(Math.round(value.toNumber() * 100) / 100);
  }
}

Backend: Auditoria de Cálculo

// backend/prisma/schema.prisma

model TaxCalculationAudit {
  id          String   @id @default(uuid())
  companyId   String
  clientId    String
  type        String   // DAS | ICMS | ISS | PIS | COFINS
  period      String   // "2026-08"
  
  // Dados de entrada
  inputBase   Decimal  @db.Decimal(14, 2)
  inputRate   Decimal  @db.Decimal(6, 4)
  
  // Resultado
  outputValue Decimal  @db.Decimal(14, 2)
  
  // Passo a passo (JSON)
  steps       Json     // ex: [{step: "RPA", formula: "180000 * 0.06", result: 10800}]
  
  // Rastreabilidade
  calculatedBy String  // userId ou "SYSTEM"
  calculatedAt DateTime @default(now())
  
  @@index([companyId, clientId, type, period])
  @@map("tax_calculation_audits")
}

Frontend: Exibição Transparente

// frontend/src/app/dashboard/fiscal/apuracao/page.tsx

<div className="bg-blue-50 border border-blue-200 p-4 rounded">
  <h3 className="font-semibold text-blue-900">Passo a Passo do Cálculo</h3>
  <ol className="mt-2 space-y-1 text-sm">
    {audit.steps.map((step, i) => (
      <li key={i} className="flex justify-between">
        <span>{step.description}</span>
        <span className="font-mono">R$ {step.value.toFixed(2)}</span>
      </li>
    ))}
  </ol>
  <div className="mt-3 pt-3 border-t border-blue-300 flex justify-between font-bold">
    <span>Total a Pagar:</span>
    <span>R$ {audit.outputValue.toFixed(2)}</span>
  </div>
</div>

✅ Consequências

Positivas

✅ Compliance Legal: Zero risco de "alucinação" da IA em cálculos fiscais
✅ Reprodutibilidade: Auditor pode replicar o cálculo exato
✅ Transparência: Contador vê o passo a passo (não é uma "caixa preta")
✅ Manutenibilidade: Regras fiscais estão em código, não em prompts de IA

Negativas

❌ Complexidade de Implementação: Cada regra fiscal exige código específico (não dá para "pedir para a IA calcular")
❌ Atualização Constante: Mudanças na legislação exigem atualização manual do código
❌ Sem "Aprendizado": O sistema não melhora sozinho (cada cliente segue a mesma regra)

📚 Referências

Arquivos que usam esta ADR:
backend/src/fiscal/services/tax-calculation.service.ts
backend/src/digital-employee/skills/tax-guides-skill.ts (Aurora)
frontend/src/app/dashboard/fiscal/apuracao/page.tsx

ADRs relacionadas:

ADR-030 (Human-in-the-Loop: IA sugere, humano aprova)
ADR-038 (Memória de cálculo: persiste passo a passo)

🔄 Histórico de Revisões

Data            Autor               Mudança
2026-08         Marcos Toledo       Criação inicial
2026-09         Marcos Toledo       Adicionado exemplo de DAS (Anexo III)