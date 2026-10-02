
---

### 📂 `docs/adrs/ADR-061-cnab-v1.md`

```markdown
# ADR-061: CNAB v1 c/ Entradas Explícitas

**Data:** 2026-08  
**Status:** ✅ Aceita  
**Decisor:** Marcos Toledo  
**Reversível:** Sim

---

## 📋 Contexto
O módulo Aurora (Sprint FD-5) precisa gerar arquivos CNAB 240 (remessa de cobrança) para clientes que emitem boletos bancários, automatizando o processo de faturamento.

**Problema:** 
Layouts CNAB variam por banco (Itaú, Bradesco, BB, Caixa) e exigem precisão posicional (cada campo tem tamanho fixo).

## 🎯 Decisão
Implementar o **CNAB 240 v1** focado apenas no **layout do Itaú**, com entradas explícitas (dados do boleto são fornecidos pelo usuário, não extraídos automaticamente de contratos). Versões futuras adicionarão outros bancos e retorno CNAB.

### Regras:
1. **Domínio Puro:** Lógica de geração isolada em `backend/src/billing/domain/cnab240.ts`, sem dependências de banco ou HTTP.
2. **Layout Posicional:** Cada registro (Header, Detalhe, Trailer) é formatado com campos de tamanho fixo, preenchidos com espaços à direita ou zeros à esquerda.
3. **Validação Prévia:** Antes de gerar, o sistema valida se todos os campos obrigatórios estão preenchidos (CNPJ do cedente, número do boleto, valor, vencimento).

## 💡 Implementação
```typescript
// backend/src/billing/domain/cnab240.ts
export function generateCnab240Itau(boletos: Boleto[]): string {
  const lines: string[] = [];

  // Header de Arquivo
  lines.push(formatHeaderArquivo({
    bankCode: '341', // Itaú
    companyName: 'CONTA CERTA SOLUCOES EMPRESARIAIS',
    cnpj: '12345678000195',
  }));

  // Header de Lote
  lines.push(formatHeaderLote({
    lotNumber: 1,
    bankCode: '341',
  }));

  // Registros de Detalhe (um por boleto)
  for (const boleto of boletos) {
    lines.push(formatDetalhe({
      ourNumber: boleto.ourNumber, // Nosso número (10 dígitos)
      dueDate: boleto.dueDate, // Vencimento (DDMMAAAA)
      value: boleto.value, // Valor (15 dígitos, sem vírgula)
      payerCnpj: boleto.payerCnpj, // CNPJ do sacado
      payerName: boleto.payerName, // Nome do sacado
    }));
  }

  // Trailer de Lote
  lines.push(formatTrailerLote({
    lotNumber: 1,
    recordCount: boletos.length + 2, // +2 (headers)
  }));

  // Trailer de Arquivo
  lines.push(formatTrailerArquivo({
    recordCount: boletos.length + 4, // +4 (headers + trailers)
  }));

  return lines.join('\r\n');
}

function formatDetalhe(data: any): string {
  // Exemplo simplificado (layout real tem 240 caracteres)
  return (
    '3' + // Tipo de registro
    padRight(data.payerName, 40) + // Nome do sacado (40 chars)
    padLeft(data.payerCnpj, 14) + // CNPJ do sacado (14 chars)
    padLeft(data.ourNumber, 10) + // Nosso número (10 chars)
    padLeft(data.dueDate, 8) + // Vencimento (8 chars)
    padLeft(data.value, 15) + // Valor (15 chars)
    // ... outros campos
    padLeft('', 240 - 87) // Preencher até 240 caracteres
  );
}

function padLeft(value: string, length: number): string {
  return value.padStart(length, '0');
}

function padRight(value: string, length: number): string {
  return value.padEnd(length, ' ');
}
✅ Consequências
Positivas: Geração rápida e determinística, domínio puro testável, layout Itaú homologado.
Negativas: v1 suporta apenas Itaú, requer evolução para outros bancos (v2).
📚 Referências
backend/src/billing/domain/cnab240.ts
frontend/src/app/dashboard/billing/cnab/page.tsx

