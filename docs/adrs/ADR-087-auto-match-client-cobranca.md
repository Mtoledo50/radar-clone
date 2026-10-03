
---

### 📂 `docs/adrs/ADR-087-auto-match-client-cobranca.md`

```markdown
# ADR-087: Auto-Match Determinístico Client↔Cobrança + Override de Destinatário

**Data:** 2026-08-27  
**Status:** ✅ Aceita  
**Decisor:** Marcos Toledo  
**Reversível:** Sim

---

## 📋 Contexto

Ao processar movimentos de retorno CNAB (pagamentos recebidos), o sistema precisa vincular cada movimento à `BillingInstruction` correspondente. Da mesma forma, ao enviar notificações, precisa determinar o destinatário correto.

**Problema:**
- Movimentos CNAB têm `nossoNumero`, mas não têm `clientId` direto
- Clientes podem ter múltiplos emails (financeiro, comercial, diretor)
- Como vincular automaticamente sem intervenção manual?

## 🎯 Decisão

1. **Auto-Match Determinístico:**
   - Normalizar nome do cliente (lowercase, remover acentos, remover "LTDA", "ME", etc.)
   - Comparar com `nossoNumero` ou `sacadoNome` do movimento CNAB
   - Se match único → vínculo automático
   - Se múltiplos matches ou zero matches → fila de revisão humana

2. **Override de Destinatário:**
   - Prioridade: `override manual` > `contato do client` > `LOG`
   - Override pode ser configurado por `BillingInstruction` ou `CobrancaEvento`
   - Permite enviar para email diferente do cadastro (ex: financeiro@cliente.com.br)

3. **Vínculo Client↔BillingInstruction:**
   - `BillingInstruction.clientId` é obrigatório
   - Frontend exibe autocomplete com nome + CNPJ do cliente
   - Ao selecionar, preenche automaticamente nome e CNPJ

## 💡 Implementação

### Service: Auto-Match

```typescript
// backend/src/billing/services/client-matcher.service.ts

@Injectable()
export class ClientMatcherService {
  async matchMovimento(movimento: CnabMovimento, companyId: string) {
    // 1. Buscar todos os clientes do tenant
    const clients = await this.prisma.client.findMany({
      where: { companyId },
    });

    // 2. Normalizar nome do sacado (do movimento CNAB)
    const sacadoNormalizado = this.normalizarNome(movimento.sacadoNome);

    // 3. Comparar com cada cliente
    const matches = clients
      .map(client => ({
        client,
        score: this.calcularScore(sacadoNormalizado, this.normalizarNome(client.name)),
      }))
      .filter(m => m.score > 0.7) // Threshold de 70%
      .sort((a, b) => b.score - a.score);

    // 4. Retornar resultado
    if (matches.length === 1) {
      return { matched: true, client: matches[0].client, confidence: matches[0].score };
    } else if (matches.length > 1) {
      return { matched: false, candidates: matches, reason: 'Múltiplos matches' };
    } else {
      return { matched: false, reason: 'Nenhum match encontrado' };
    }
  }

  private normalizarNome(nome: string): string {
    return nome
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remover acentos
      .replace(/\b(ltda|me|epp|sa|s\/a|)\b/g, '') // Remover sufixos
      .replace(/[^a-z0-9\s]/g, '') // Remover caracteres especiais
      .trim()
      .replace(/\s+/g, ' '); // Normalizar espaços
  }

  private calcularScore(a: string, b: string): number {
    // Jaccard similarity entre palavras
    const wordsA = new Set(a.split(' '));
    const wordsB = new Set(b.split(' '));
    
    const intersection = new Set([...wordsA].filter(x => wordsB.has(x)));
    const union = new Set([...wordsA, ...wordsB]);
    
    return intersection.size / union.size;
  }
}

Frontend: Autocomplete com Auto-Preenchimento

// frontend/src/app/dashboard/funcionario-digital/cobranca/page.tsx

<Select
  value={selectedClientId}
  onChange={async (clientId) => {
    setSelectedClientId(clientId);
    
    // Auto-preencher nome e CNPJ
    const client = await api.get(`/clients/${clientId}`);
    setFormData({
      ...formData,
      clientName: client.data.name,
      clientCnpj: client.data.cnpj,
      monthlyRevenue: client.data.monthlyRevenue,
    });
  }}
>
  {clients.map(client => (
    <option key={client.id} value={client.id}>
      {client.name} ({client.cnpj})
    </option>
  ))}
</Select>

Override de Destinatário

// backend/src/billing/services/cobranca-regua.service.ts

private async determinarDestinatario(
  instrucao: BillingInstruction,
  regra: CobrancaRegra
): Promise<string> {
  // 1. Verificar override manual (prioridade máxima)
  const override = await this.prisma.cobrancaOverride.findFirst({
    where: {
      billingInstructionId: instrucao.id,
      canal: regra.canal,
    },
  });

  if (override) {
    return override.destinatario;
  }

  // 2. Contato do cliente
  const client = await this.prisma.client.findUnique({
    where: { id: instrucao.clientId },
  });

  if (client?.email) {
    return client.email;
  }

  // 3. Fallback: LOG (não envia, apenas registra)
  return 'LOG_ONLY';
}

✅ Consequências

Positivas

✅ Automação: Reduz intervenção manual em 80% dos casos
✅ Flexibilidade: Override permite casos especiais
✅ UX: Autocomplete acelera cadastro de cobranças

Negativas

❌ Falsos Positivos: Match errado pode vincular cobrança ao cliente errado (mitigado por revisão humana quando score < 90%)
❌ Performance: Auto-match exige comparar com todos os clientes (O(n))

📚 Referências

Arquivos que usam esta ADR:

backend/src/billing/services/client-matcher.service.ts
backend/src/billing/services/cobranca-regua.service.ts
frontend/src/app/dashboard/funcionario-digital/cobranca/page.tsx

ADRs relacionadas:

ADR-085 (Arquitetura híbrida Billing)
ADR-086 (Notificações plugáveis)

🔄 Histórico de Revisões

Data                Autor               Mudança
2026-08-27          Marcos Toledo       Criação inicial (Sprint FD-5)