
---

### 📂 `docs/adrs/ADR-085-arquitetura-hibrida-billing.md`

```markdown
# ADR-085: Arquitetura Híbrida Billing (Fonte de Verdade + Histórico + Workflow)

**Data:** 2026-08-27  
**Status:** ✅ Aceita  
**Decisor:** Marcos Toledo  
**Reversível:** Não

---

## 📋 Contexto

O módulo de Billing precisa gerenciar:
- Instruções de cobrança (o que cobrar, de quem, quanto)
- Arquivos CNAB gerados (remessas enviadas ao banco)
- Movimentos de retorno (pagamentos recebidos)
- Regras de régua de cobrança (quando enviar, quantas tentativas)
- Eventos de cobrança (histórico de interações)

**Problema:**
Como modelar isso sem duplicar dados e mantendo rastreabilidade completa?

## 🎯 Decisão

Arquitetura híbrida com 3 camadas de dados:

1. **`BillingInstruction` — Fonte da Verdade:**
   - O que deve ser cobrado (cliente, valor, vencimento)
   - Status atual da cobrança (PENDENTE, GERADA, ENVIADA, PAGA, VENCIDA)
   - Vínculo com `Client` (via `clientId`)

2. **`CnabArquivo` + `CnabMovimento` — Histórico:**
   - Arquivos CNAB gerados (remessa e retorno)
   - Movimentos extraídos do retorno (pagamentos, tarifas)
   - Vínculo com `BillingInstruction` (via `billingInstructionId`)

3. **`CobrancaRegra` + `CobrancaEvento` — Workflow da Régua:**
   - Regras de cobrança (ex: "enviar 3 dias antes do vencimento")
   - Eventos de cobrança (envio de email, SMS, WhatsApp)
   - Workflow humano (aprovações, overrides)

## 💡 Implementação

### Schema Prisma

```prisma
// ═══════════════════════════════════════════════════════════════════
// FONTE DA VERDADE: O que cobrar
// ═══════════════════════════════════════════════════════════════════

model BillingInstruction {
  id              String   @id @default(uuid())
  companyId       String
  clientId        String   // 🔗 Vínculo com cliente
  
  // Dados da cobrança
  description     String   // "Mensalidade Janeiro/2026"
  value           Decimal  @db.Decimal(12, 2)
  dueDate         DateTime
  
  // Status
  status          BillingStatus @default(PENDENTE)
  // PENDENTE → GERADA → ENVIADA → PAGA (ou VENCIDA)
  
  // Vínculos
  cnabMovimentoId String?  // Movimento de pagamento (quando PAGA)
  
  company         Company  @relation(fields: [companyId], references: [id])
  client          Client   @relation(fields: [clientId], references: [id])
  cnabMovimento   CnabMovimento? @relation(fields: [cnabMovimentoId], references: [id])
  
  @@index([companyId, clientId, status])
  @@map("billing_instructions")
}

enum BillingStatus {
  PENDENTE
  GERADA
  ENVIADA
  PAGA
  VENCIDA
  CANCELADA
}

// ═══════════════════════════════════════════════════════════════════
// HISTÓRICO: Arquivos CNAB e movimentos
// ═══════════════════════════════════════════════════════════════════

model CnabArquivo {
  id              String   @id @default(uuid())
  companyId       String
  
  tipo            CnabTipoArquivo // REMESSA | RETORNO
  layout          String          // 'CNAB240' | 'CNAB400'
  bank            String          // '001' (BB), '341' (Itaú), etc.
  
  filePath        String
  fileHash        String          // SHA-256 do arquivo (integridade)
  lineCount       Int
  
  status          String          // PENDENTE_APROVACAO | APROVADO | ENVIADO | PROCESSADO
  
  // Aprovação humana (ADR-084)
  aprovadoPor     String?
  aprovadoEm      DateTime?
  
  createdAt       DateTime @default(now())
  
  movimentos      CnabMovimento[]
  
  @@map("cnab_arquivos")
}

enum CnabTipoArquivo {
  REMESSA
  RETORNO
}

model CnabMovimento {
  id                  String   @id @default(uuid())
  cnabArquivoId       String
  
  nossoNumero         String
  dataPagamento       DateTime?
  valorPago           Decimal? @db.Decimal(12, 2)
  valorTarifa         Decimal? @db.Decimal(12, 2)
  ocorrencia          String   // '06' = Liquidação, '02' = Entrada
  
  // Vínculo com instrução (quando pago)
  billingInstructionId String?
  
  cnabArquivo         CnabArquivo @relation(fields: [cnabArquivoId], references: [id])
  billingInstruction  BillingInstruction? @relation(fields: [billingInstructionId], references: [id])
  
  @@map("cnab_movimentos")
}

// ═══════════════════════════════════════════════════════════════════
// WORKFLOW: Régua de cobrança
// ═══════════════════════════════════════════════════════════════════

model CobrancaRegra {
  id              String   @id @default(uuid())
  companyId       String
  clientId        String?  // NULL = regra global
  
  nome            String   // "Cobrança 3 dias antes"
  diasAntesVenc   Int      // -3 (3 dias antes) ou +5 (5 dias após)
  canal           String   // 'EMAIL' | 'SMS' | 'WHATSAPP'
  
  ativo           Boolean  @default(true)
  
  eventos         CobrancaEvento[]
  
  @@map("cobranca_regras")
}

model CobrancaEvento {
  id              String   @id @default(uuid())
  companyId       String
  regraId         String
  
  billingInstructionId String?
  
  canal           String   // 'EMAIL' | 'SMS' | 'WHATSAPP'
  destinatario    String   // email/telefone real (pode ser override)
  provider        String   // 'SENDGRID' | 'TWILIO' | 'LOG'
  externalId      String?  // ID no provedor externo
  
  status          String   // 'AGENDADO' | 'ENVIADO' | 'FALHOU'
  
  enviadoEm       DateTime?
  
  regra           CobrancaRegra @relation(fields: [regraId], references: [id])
  
  @@map("cobranca_eventos")
}

Service: Execução da Régua

// backend/src/billing/services/cobranca-régua.service.ts

@Injectable()
export class CobrancaReguaService {
  async executarRegua(companyId: string) {
    const hoje = new Date();
    
    // 1. Buscar instruções PENDENTES ou VENCIDAS
    const instrucoes = await this.prisma.billingInstruction.findMany({
      where: {
        companyId,
        status: { in: ['PENDENTE', 'VENCIDA'] },
      },
      include: { client: true },
    });

    // 2. Para cada instrução, verificar regras aplicáveis
    for (const instrucao of instrucoes) {
      const diasParaVenc = this.diasEntre(hoje, instrucao.dueDate);
      
      const regras = await this.prisma.cobrancaRegra.findMany({
        where: {
          companyId,
          OR: [
            { clientId: null }, // Regra global
            { clientId: instrucao.clientId },
          ],
          diasAntesVenc: diasParaVenc,
          ativo: true,
        },
      });

      // 3. Executar cada regra
      for (const regra of regras) {
        await this.executarRegra(instrucao, regra);
      }
    }
  }

  private async executarRegra(instrucao: BillingInstruction, regra: CobrancaRegra) {
    // Verificar se já foi executada (anti-duplicidade)
    const jaExecutada = await this.prisma.cobrancaEvento.findFirst({
      where: {
        billingInstructionId: instrucao.id,
        regraId: regra.id,
      },
    });

    if (jaExecutada) return; // Já executada, pular

    // Determinar destinatário (override > contato do client > log)
    const destinatario = this.determinarDestinatario(instrucao, regra);

    // Criar evento
    const evento = await this.prisma.cobrancaEvento.create({
      data: {
        companyId: instrucao.companyId,
        regraId: regra.id,
        billingInstructionId: instrucao.id,
        canal: regra.canal,
        destinatario,
        provider: this.getProvider(regra.canal),
        status: 'AGENDADO',
      },
    });

    // Enviar (com aprovação humana se necessário)
    await this.notificacaoService.enviar(evento, instrucao);
  }

  private determinarDestinatario(instrucao: BillingInstruction, regra: CobrancaRegra): string {
    // 1. Override manual (se houver)
    const override = this.getOverride(instrucao.id, regra.canal);
    if (override) return override;

    // 2. Contato do cliente
    if (instrucao.client.email) return instrucao.client.email;

    // 3. Fallback: log (não envia, apenas registra)
    return 'LOG_ONLY';
  }
}

✅ Consequências

Positivas

✅ Separação de Responsabilidades: Cada camada tem um propósito claro
✅ Rastreabilidade: Histórico completo de cobranças, arquivos e eventos
✅ Flexibilidade: Régua configurável por cliente ou global

Negativas

❌ Complexidade do Schema: 5 tabelas relacionadas
❌ Consistência: Exige transações para manter integridade entre camadas

📚 Referências

Arquivos que usam esta ADR:

backend/prisma/schema.prisma (5 models: BillingInstruction, CnabArquivo, CnabMovimento, CobrancaRegra, CobrancaEvento)
backend/src/billing/services/cobranca-regua.service.ts
frontend/src/app/dashboard/funcionario-digital/cobranca/page.tsx (4 abas: Cobranças, Remessas, Retornos, Régua)

ADRs relacionadas:

ADR-084 (Domínio puro CNAB)
ADR-086 (Notificações plugáveis)
ADR-087 (Auto-match Client↔cobrança)

🔄 Histórico de Revisões

Data                    Autor                   Mudança
2026-08-27              Marcos Toledo           Criação inicial (Sprint FD-5)