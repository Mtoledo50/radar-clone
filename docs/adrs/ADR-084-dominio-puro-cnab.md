
---

### 📂 `docs/adrs/ADR-084-dominio-puro-cnab.md`

```markdown
# ADR-084: Domínio Puro CNAB Isolado com Aprovação Humana Obrigatória

**Data:** 2026-08-27  
**Status:** ✅ Aceita (Regra Crítica)  
**Decisor:** Marcos Toledo  
**Reversível:** Não

---

## 📋 Contexto

O módulo de Billing precisa gerar e processar arquivos CNAB 240/400 (remessa e retorno de cobrança bancária). Esses arquivos são enviados aos bancos para registrar boletos e processar pagamentos.

**Problema:**
- CNAB tem regras complexas (layout posicional, validações bancárias)
- Erros podem gerar boletos inválidos ou baixas incorretas
- Misturar lógica CNAB com lógica de negócio contamina o domínio

## 🎯 Decisão

1. **Domínio Puro Isolado:**
   - Toda lógica CNAB vive em `backend/src/billing/domain/cnab/`
   - Zero dependências de Prisma, HTTP ou frameworks
   - 100% testável com testes unitários puros

2. **Aprovação Humana Obrigatória:**
   - Toda geração de remessa CNAB exige aprovação humana antes do envio ao banco
   - Status: `PENDENTE_APROVACAO` → `APROVADO` → `ENVIADO` → `PROCESSADO`
   - Nunca automatizar envio ao banco (risco financeiro)

3. **Separação de Responsabilidades:**
   - `Cnab240Generator`: Gera arquivo de remessa (layout posicional)
   - `Cnab240Parser`: Lê arquivo de retorno (extrai movimentos)
   - `CnabDispatcher`: Orquestra envio (com aprovação)
   - `ClientMatcher`: Vincula movimentos do retorno a clientes (auto-match)

## 💡 Implementação

### Estrutura do Domínio Puro
backend/src/billing/domain/
├── cnab/
│ ├── cnab240-generator.ts # Gera remessa
│ ├── cnab240-parser.ts # Lê retorno
│ ├── cnab240.types.ts # Interfaces
│ ├── cnab240-validator.ts # Validações
│ └── cnab240.spec.ts # 7 testes unitários
├── billing-instruction.service.ts
├── cnab-dispatcher.service.ts # 5 testes
└── client-matcher.service.ts # 4 testes


### Exemplo de Generator
```typescript
// backend/src/billing/domain/cnab/cnab240-generator.ts

export interface Cnab240Boleto {
  nossoNumero: string;      // 10 dígitos
  vencimento: Date;
  valor: number;            // Em centavos
  sacadoCnpj: string;       // 14 dígitos
  sacadoNome: string;
  especie: string;          // '01' = Duplicata Mercantil
}

export function generateCnab240Remessa(
  cedente: { cnpj: string; nome: string; convenio: string },
  boletos: Cnab240Boleto[]
): string {
  const lines: string[] = [];

  // Header de Arquivo (registro 0)
  lines.push(formatHeaderArquivo(cedente));

  // Header de Lote (registro 1)
  lines.push(formatHeaderLote(cedente));

  // Segmento P (dados do boleto)
  // Segmento Q (dados do sacado)
  // Segmento R (multa/juros, opcional)
  for (const boleto of boletos) {
    lines.push(formatSegmentoP(boleto));
    lines.push(formatSegmentoQ(boleto));
  }

  // Trailer de Lote (registro 5)
  lines.push(formatTrailerLote(boletos.length));

  // Trailer de Arquivo (registro 9)
  lines.push(formatTrailerArquivo(lines.length + 1));

  return lines.join('\r\n');
}

function formatSegmentoP(boleto: Cnab240Boleto): string {
  // Layout posicional CNAB 240 (cada campo tem tamanho fixo)
  return (
    '001' +                              // Banco (3)
    '0001' +                             // Lote (4)
    '3' +                                // Tipo registro (1)
    '00001' +                            // Nº sequencial (5)
    'P' +                                // Segmento (1)
    padLeft(boleto.nossoNumero, 15) +    // Nosso número (15)
    formatDate(boleto.vencimento) +      // Vencimento (8)
    padLeft(boleto.valor, 15) +          // Valor (15)
    // ... outros campos até completar 240 chars
    ' '.repeat(240 - 80)
  );
}

function padLeft(value: string, length: number): string {
  return value.padStart(length, '0');
}

function padRight(value: string, length: number): string {
  return value.padEnd(length, ' ').substring(0, length);
}

Exemplo de Parser de Retorno
// backend/src/billing/domain/cnab/cnab240-parser.ts

export interface Cnab240Movimento {
  nossoNumero: string;
  dataPagamento: Date;
  valorPago: number;
  valorTarifa: number;
  ocorrencia: string; // '06' = Liquidação, '02' = Entrada confirmada
}

export function parseCnab240Retorno(content: string): Cnab240Movimento[] {
  const lines = content.split('\r\n').filter(l => l.length === 240);
  const movimentos: Cnab240Movimento[] = [];

  for (const line of lines) {
    const tipoRegistro = line.substring(7, 8);
    const segmento = line.substring(13, 14);

    if (tipoRegistro === '3' && segmento === 'T') {
      movimentos.push({
        nossoNumero: line.substring(37, 52).trim(),
        dataPagamento: parseDate(line.substring(145, 153)),
        valorPago: parseInt(line.substring(153, 168)) / 100,
        valorTarifa: parseInt(line.substring(175, 190)) / 100,
        ocorrencia: line.substring(15, 17),
      });
    }
  }

  return movimentos;
}
Aprovação Humana no Controller
// backend/src/billing/cnab.controller.ts

@Post('remessa/:id/enviar')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('CONTADOR', 'SUPERVISOR') // Apenas perfis altos
async enviarRemessa(
  @Param('id') id: string,
  @CurrentUser() user: any
) {
  // 1. Buscar arquivo pendente
  const arquivo = await this.prisma.cnabArquivo.findUnique({
    where: { id, companyId: user.companyId },
  });

  if (!arquivo) throw new NotFoundException();
  if (arquivo.status !== 'PENDENTE_APROVACAO') {
    throw new BadRequestException('Arquivo não está pendente de aprovação');
  }

  // 2. Aprovar (muda status)
  await this.prisma.cnabArquivo.update({
    where: { id },
    data: {
      status: 'APROVADO',
      aprovadoPor: user.id,
      aprovadoEm: new Date(),
    },
  });

  // 3. Auditoria
  await this.prisma.automationAudit.create({
    data: {
      companyId: user.companyId,
      actor: 'USER',
      action: 'CNAB_REMESSA_APROVADA',
      entity: 'CnabArquivo',
      entityId: id,
      detail: { userId: user.id },
    },
  });

  return { success: true, message: 'Remessa aprovada. Envio ao banco pendente.' };
}

✅ Consequências

Positivas

✅ Testabilidade: 16 testes unitários verdes (7 CNAB + 5 dispatcher + 4 matcher)
✅ Segurança: Aprovação humana obrigatória evita envio acidental
✅ Manutenibilidade: Domínio isolado, fácil evoluir para novos layouts

Negativas

❌ Complexidade: Layout CNAB é verboso (240 chars por linha, muitos campos)
❌ Homologação Bancária: Cada banco tem pequenas variações (requer testes reais)

📚 Referências

Arquivos que usam esta ADR:

backend/src/billing/domain/cnab/ (domínio puro)
backend/src/billing/cnab.controller.ts (endpoints com aprovação)
frontend/src/app/dashboard/funcionario-digital/cobranca/page.tsx (UI)

ADRs relacionadas:

ADR-030 (Human-in-the-Loop)
ADR-031 (Cálculo determinístico)
ADR-085 (Arquitetura híbrida Billing)

🔄 Histórico de Revisões

Data                Autor               Mudança
2026-08-27          Marcos Toledo       Criação inicial (Sprint FD-5)