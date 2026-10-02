# ADR-031: Cálculo Tributário Determinístico

## Status
Aceito (2026-08-19)

## Contexto
O módulo Fiscal importa NF-e de entrada e precisa auditar se os cálculos de impostos (ICMS, IPI, PIS, COFINS) estão corretos. A fórmula básica é `Base × Alíquota = Valor`, mas há casos especiais:
- CST 51 (Diferimento): `vICMS = vICMSOp - vICMSDif`
- CST 60 (ST retido): `vBC = vBCSTRet`, `vICMS = vICMSSTRet`
- IPI por unidade: `vIPI = qUnid × vUnid` (não há alíquota percentual)
- PIS/COFINS por quantidade: `vPIS = qBCProd × vAliqProd`
- Redução de base: `vBC = vProd × (1 - pRedBC/100)`

## Decisão
**Separação de responsabilidades em 2 camadas:**

1. **Parser (backend)**: apenas extrai os campos do XML (vBC, pICMS, vICMS, etc.) e grava no banco. **Nunca calcula** nada além do que está explícito no XML.
2. **Auditoria (frontend)**: aplica a fórmula `Base × Alíquota / 100 = Esperado` e compara com o valor da nota. Tolerância de R$ 0,02 para arredondamento.

**Por que não calcular no backend?**
- O parser deve ser **tolerante a falhas** (aceitar XMLs incompletos sem quebrar).
- A auditoria é uma **regra de negócio de apresentação** (como exibir a divergência).
- Separar permite reutilizar o parser para outros fins (ex: apuração de ICMS) sem acoplamento.

## Consequências
- **Positivas**:
  - Parser simples e robusto (não quebra com XMLs atípicos).
  - Auditoria centralizada em 1 componente (`TaxAuditTable`).
  - Fácil adicionar novas regras (ex: IPI por unidade) sem alterar o parser.
- **Negativas**:
  - Notas antigas (importadas antes da Sprint F6) têm alíquotas zeradas → precisam ser reimportadas.
  - Casos muito atípicos (ex: IPI com CST desconhecido) podem não ser tratados → auditoria mostra ⚠ com explicação genérica.

## Exemplo de Uso
```tsx
<TaxAuditTable item={item} />

Renderiza:
| Tributo | Base     | × | Alíq.  | = | Esperado | Nota   | Status |
|---------|----------|---|--------|---|----------|--------|--------|
| ICMS    | 8.136,14 | × | 12,00% | = | 976,34   | 976,34 | ✓ OK   |
| IPI     | 8.136,14 | × | 9,75%  | = | 793,27   | 793,27 | ✓ OK   |
| PIS     | 8.136,14 | × | 1,65%  | = | 134,25   | 134,25 | ✓ OK   |
| COFINS  | 8.136,14 | × | 7,60%  | = | 618,35   | 618,35 | ✓ OK   |

Se houver divergência (ex: PIS calculado sobre base errada), exibe linha explicativa:

❌ Erro: PIS: DIVERGÊNCIA DE CÁLCULO — R$ 8.136,14 × 1,65% = R$ 134,25, mas a nota informa R$ 100,00.
🎯 Esperado: R$ 134,25 (diferença de R$ 34,25). Verifique redução de base (pRedBC), diferimento (pDif) ou benefício fiscal no XML.

Referências
Sprint F6 (Auditoria Tributária de NF-e)
Arquivos: backend/src/fiscal/services/xml-parser.service.ts, frontend/src/components/fiscal/TaxAuditTable.tsx


---

## ✅ Resumo do que foi documentado

| Artefato | Atualização |
|---|---|
| `CHANGELOG.md` | Sprint F6 completa (parser + service + componente + decisões) |
| `CONTEXTO_PROJETO.md` | §9 atualizado marcando Sprint F6 como HOMOLOGADA |
| `README.md` | Nova seção "Auditoria Tributária de NF-e" com tabela de diferenciais |
| `docs/ADR-031` | Decisão técnica completa (separação parser × auditoria) |

---

## 🎯 Próximo Passo

Agora que a Sprint F6 está **documentada e homologada**, podemos partir para a **Sprint F7**:

**Endpoint consolidado `GET /fiscal/invoices/tax-rates-by-product`** que retorna uma tabela de alíquotas médias por NCM/produto, permitindo identificar padrões tributários (ex: "todos os produtos com NCM 3919.90.20 têm IPI 9,75%").

Quer que eu entregue o código da Sprint F7 agora? 🚀

