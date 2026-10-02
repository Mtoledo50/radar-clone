
---

### 📂 `docs/adrs/ADR-038-memoria-calculo-tributario.md`

```markdown
# ADR-038: Memória de Cálculo Tributário (Passo a Passo Auditável)

**Data:** 2026-08  
**Status:** ✅ Aceita  
**Decisor:** Marcos Toledo  
**Reversível:** Não (exigência de compliance fiscal)

---

## 📋 Contexto

O sistema calcula impostos (DAS, ISS, ICMS, PIS, COFINS) para clientes de diferentes regimes tributários. Contadores e auditores precisam entender **como** o valor foi calculado, não apenas o resultado final.

**Problema:**
- Se o sistema calcular "DAS = R$ 660", o contador precisa saber: qual foi a base de cálculo? Qual alíquota? Houve dedução?
- Sem memória de cálculo, o contador não consegue validar se o cálculo está correto
- Em caso de autuação fiscal, o escritório precisa provar como chegou ao valor

## 🎯 Decisão

Toda função de cálculo tributário **DEVE** retornar um objeto `TaxCalculationResult` contendo:
1. **Valor final** (`outputValue`)
2. **Passo a passo** (`steps: TaxCalculationStep[]`) com cada operação intermediária
3. **Dados de entrada** (`inputData`) usados no cálculo
4. **Versão da regra fiscal** (`ruleVersion`) aplicada (ex: "Simples Nacional Anexo III - 2026")

### Regras:
1. **Determinístico (ADR-031):** Mesmos inputs = mesmos outputs + mesmos steps
2. **Auditável:** Cada step tem `description`, `formula`, `value` e `cumulativeValue`
3. **Persistido:** Memória de cálculo é salva em `TaxCalculationAudit` (tabela imutável)
4. **Exibível:** Frontend mostra o passo a passo em formato de "receita de bolo"

## 💡 Implementação

### Backend: Tipo de Resultado
```typescript
// backend/src/fiscal/types/tax-calculation.types.ts

export interface TaxCalculationStep {
  stepNumber: number;
  description: string; // ex: "Calcular RPA (Receita Preta Acumulada)"
  formula: string; // ex: "RPA = Receita 12m × Alíquota Nominal - Dedução"
  value: number; // Resultado deste step
  cumulativeValue?: number; // Valor acumulado até aqui (opcional)
}

export interface TaxCalculationResult {
  outputValue: number; // Valor final do imposto
  inputData: Record<string, any>; // Dados usados (ex: {receita12m: 180000, receitaAtual: 15000})
  steps: TaxCalculationStep[];
  ruleVersion: string; // ex: "LC 123/2006 - Anexo III - vigência 2026"
  calculatedAt: Date;
}

Backend: Serviço de Cálculo com Memória

// backend/src/fiscal/services/das-calculation.service.ts

@Injectable()
export class DasCalculationService {
  
  /**
   * Calcula DAS do Simples Nacional (Anexo III) com memória de cálculo completa
   */
  calculateDAS(receitaBruta12m: number, receitaAtual: number): TaxCalculationResult {
    const steps: TaxCalculationStep[] = [];
    
    // Tabela Anexo III (2026)
    const faixas = [
      { limite: 180000, aliquota: 0.06, deducao: 0 },
      { limite: 360000, aliquota: 0.112, deducao: 9360 },
      { limite: 720000, aliquota: 0.135, deducao: 17640 },
      { limite: 1800000, aliquota: 0.16, deducao: 35640 },
      { limite: 3600000, aliquota: 0.21, deducao: 125640 },
      { limite: 4800000, aliquota: 0.33, deducao: 648000 },
    ];

    // Step 1: Encontrar faixa
    const faixa = faixas.find(f => receitaBruta12m <= f.limite) || faixas[faixas.length - 1];
    steps.push({
      stepNumber: 1,
      description: `Identificar faixa de faturamento (Receita 12m: R$ ${receitaBruta12m.toFixed(2)})`,
      formula: `Faixa: até R$ ${faixa.limite.toFixed(2)} → Alíquota ${faixa.aliquota * 100}%`,
      value: faixa.aliquota,
    });

    // Step 2: Calcular RPA
    const rpa = receitaBruta12m * faixa.aliquota - faixa.deducao;
    steps.push({
      stepNumber: 2,
      description: 'Calcular RPA (Receita Preta Acumulada)',
      formula: `RPA = ${receitaBruta12m.toFixed(2)} × ${faixa.aliquota} - ${faixa.deducao.toFixed(2)}`,
      value: rpa,
    });

    // Step 3: Calcular alíquota efetiva
    const aliquotaEfetiva = rpa / receitaBruta12m;
    steps.push({
      stepNumber: 3,
      description: 'Calcular alíquota efetiva',
      formula: `Alíquota Efetiva = RPA / Receita 12m = ${rpa.toFixed(2)} / ${receitaBruta12m.toFixed(2)}`,
      value: aliquotaEfetiva,
      cumulativeValue: aliquotaEfetiva * 100,
    });

    // Step 4: Calcular DAS
    const das = receitaAtual * aliquotaEfetiva;
    steps.push({
      stepNumber: 4,
      description: 'Calcular DAS do mês',
      formula: `DAS = Receita Atual × Alíquota Efetiva = ${receitaAtual.toFixed(2)} × ${(aliquotaEfetiva * 100).toFixed(4)}%`,
      value: das,
    });

    // Step 5: Arredondar
    const dasRounded = Math.round(das * 100) / 100;
    steps.push({
      stepNumber: 5,
      description: 'Arredondar para 2 casas decimais',
      formula: `DAS final = ${das.toFixed(4)} → ${dasRounded.toFixed(2)}`,
      value: dasRounded,
    });

    return {
      outputValue: dasRounded,
      inputData: { receitaBruta12m, receitaAtual },
      steps,
      ruleVersion: 'LC 123/2006 - Anexo III - vigência 2026',
      calculatedAt: new Date(),
    };
  }
}

Backend: Persistência da Memória


// backend/prisma/schema.prisma

model TaxCalculationAudit {
  id            String   @id @default(uuid())
  companyId     String
  clientId      String
  type          String   // DAS | ISS | ICMS | PIS | COFINS
  period        String   // "2026-08"
  
  // Dados de entrada
  inputData     Json     // {receita12m: 180000, receitaAtual: 15000}
  
  // Resultado
  outputValue   Decimal  @db.Decimal(14, 2)
  
  // Passo a passo
  steps         Json     // Array de TaxCalculationStep
  
  // Rastreabilidade
  ruleVersion   String   // "LC 123/2006 - Anexo III - 2026"
  calculatedBy  String   // userId ou "AURORA"
  calculatedAt  DateTime @default(now())
  
  @@index([companyId, clientId, type, period])
  @@map("tax_calculation_audits")
}

Frontend: Exibição do Passo a Passo


// frontend/src/app/dashboard/fiscal/apuracao/[id]/page.tsx

<div className="bg-blue-50 border border-blue-200 p-6 rounded-lg">
  <h3 className="text-lg font-bold text-blue-900 mb-4">
    📊 Memória de Cálculo do DAS
  </h3>
  
  <div className="space-y-3">
    {calculation.steps.map((step) => (
      <div key={step.stepNumber} className="flex items-start gap-4">
        <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
          {step.stepNumber}
        </div>
        <div className="flex-1">
          <p className="font-semibold text-gray-800">{step.description}</p>
          <p className="text-sm text-gray-600 font-mono mt-1">{step.formula}</p>
          <p className="text-sm text-blue-700 font-semibold mt-1">
            Resultado: R$ {step.value.toFixed(2)}
          </p>
        </div>
      </div>
    ))}
  </div>
  
  <div className="mt-6 pt-4 border-t border-blue-300">
    <div className="flex justify-between items-center">
      <span className="text-lg font-bold text-gray-800">Valor Final:</span>
      <span className="text-2xl font-bold text-blue-700">
        R$ {calculation.outputValue.toFixed(2)}
      </span>
    </div>
    <p className="text-xs text-gray-500 mt-2">
      Regra aplicada: {calculation.ruleVersion}
    </p>
  </div>
</div>

✅ Consequências

Positivas

✅ Transparência Total: Contador vê exatamente como o valor foi calculado
✅ Auditoria Facilitada: Em caso de autuação, o escritório prova o cálculo
✅ Debug Rápido: Se o valor estiver errado, o contador identifica em qual step houve erro
✅ Reprodutibilidade: Mesmos inputs = mesmos outputs + mesmos steps (ADR-031)

Negativas

❌ Complexidade: Cada função de cálculo precisa construir o array de steps
❌ Armazenamento: Memória de cálculo ocupa espaço no banco (mitigado por índice e retenção de 5 anos)

📚 Referências

Arquivos que usam esta ADR:

backend/src/fiscal/services/das-calculation.service.ts
backend/src/fiscal/services/iss-calculation.service.ts
backend/prisma/schema.prisma (model TaxCalculationAudit)
frontend/src/app/dashboard/fiscal/apuracao/[id]/page.tsx

ADRs relacionadas:

ADR-031 (Cálculo tributário determinístico)
ADR-030 (Human-in-the-Loop: auditor aprova o cálculo)

🔄 Histórico de Revisões

Data                Autor           Mudança
2026-08             Marcos Toledo   Criação inicial