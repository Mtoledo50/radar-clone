
---

### 📂 `docs/adrs/ADR-052-benchmark-softwares.md`

```markdown
# ADR-052: Benchmark de Softwares (Híbrido Rede + Catálogo)

**Data:** 2026-08  
**Status:** ✅ Aceita  
**Decisor:** Marcos Toledo  
**Reversível:** Sim

---

## 📋 Contexto
O módulo "Minha Empresa" (Fase C1) precisa mostrar ao escritório quais softwares contábeis são mais usados no mercado (Domínio, Questor, Sage, Alterdata, etc.) e como ele se posiciona em relação à concorrência.

**Problema:** 
Criar um benchmark apenas com dados internos do Radar é limitado (poucos tenants). Precisamos de dados de mercado reais.

## 🎯 Decisão
Implementar um **benchmark híbrido**:
1. **Catálogo Canônico:** Lista pré-definida de softwares contábeis com descrição, faixa de preço e público-alvo.
2. **Rede de Tenants:** Contagem anônima de quantos escritórios no Radar usam cada software (agregado, sem expor dados individuais).
3. **Visualização:** Gráfico de barras CSS puro (ADR-001) mostrando "Você usa X" vs "Mercado usa Y".

### Regras de Privacidade:
- A contagem de tenants é **agregada** (ex: "35 escritórios usam Domínio"), nunca individual.
- O usuário vê apenas percentuais, nunca nomes de outros escritórios.

## 💡 Implementação
```typescript
// backend/src/company/domain/software-benchmark.ts
export const SOFTWARE_CATALOG = [
  { name: 'Domínio Sistemas', category: 'ERP Contábil', marketShare: 0.28 },
  { name: 'Questor', category: 'ERP Contábil', marketShare: 0.22 },
  { name: 'Sage', category: 'ERP Contábil', marketShare: 0.15 },
  { name: 'Alterdata', category: 'ERP Contábil', marketShare: 0.12 },
  { name: 'Conta Azul', category: 'ERP PME', marketShare: 0.10 },
  { name: 'Outro', category: 'Outros', marketShare: 0.13 },
];

// backend/src/company/company.service.ts
async getSoftwareBenchmark(companyId: string) {
  // 1. Buscar software do tenant atual
  const company = await this.prisma.company.findUnique({
    where: { id: companyId },
    select: { softwareStack: true },
  });

  // 2. Contar quantos tenants usam cada software (anônimo)
  const usage = await this.prisma.company.groupBy({
    by: ['softwareStack'],
    _count: true,
  });

  // 3. Calcular percentuais
  const total = usage.reduce((sum, u) => sum + u._count, 0);
  const benchmark = usage.map(u => ({
    software: u.softwareStack,
    percent: (u._count / total) * 100,
  }));

  return { current: company.softwareStack, benchmark };
}

✅ Consequências
Positivas: Benchmark real baseado em dados da base de tenants, privacidade garantida.
Negativas: Requer que o tenant informe qual software usa (campo opcional no cadastro).
📚 Referências
backend/src/company/domain/software-benchmark.ts
backend/src/company/company.service.ts
frontend/src/app/dashboard/minha-empresa/page.tsx

