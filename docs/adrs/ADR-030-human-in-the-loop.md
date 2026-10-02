
---

## 📂 `docs/adrs/ADR-030-human-in-the-loop.md`

```markdown
# ADR-030: Regra de Ouro — Human-in-the-Loop Obrigatório

**Data:** 2026-08  
**Status:** ✅ Aceita (Regra Crítica)  
**Decisor:** Marcos Toledo  
**Reversível:** Não (regra de compliance)

---

## 📋 Contexto

O sistema automatiza processos contábeis sensíveis:
- Classificação de lançamentos bancários
- Conciliação de extratos com NF-e
- Emissão de guias de imposto (DAS, ISS, DARF)
- Transmissão de obrigações fiscais (SPED, DCTF)
- Envio de documentos por e-mail
- Fechamento de mês contábil

### Riscos:
Erros nesses processos podem gerar:
- **Multas fiscais** (receita federal, prefeituras)
- **Retrabalho contábil** (estornos, retificações)
- **Responsabilidade legal** para o escritório e contador
- **Perda de confiança** do cliente

### Dilema:
Como automatizar sem perder o controle humano sobre decisões críticas?

---

## 🎯 Decisão

**Nenhuma ação com `riskLevel = LEGAL` ou impacto contábil é 100% automática.** A automação prepara, calcula e recomenda; o humano **sempre** aprova antes da execução final.

### Régua de Confiança (para tarefas operacionais de baixo risco)

| Score | Ação | Exemplo |
|-------|------|---------|
| **≥ 80%** | Auto-aprovação permitida | Classificação de lançamento óbvio (ex: "PIX - ALUGUEL" → Despesa com Aluguel) |
| **50–79%** | Fila de revisão humana obrigatória | Classificação ambígua (ex: "TRANSFERÊNCIA - JOÃO" → pode ser sócio ou cliente) |
| **< 50%** | Descartado | Não polui a fila, deixa para o humano fazer do zero |

### Ações que SEMPRE exigem aprovação humana (independente do score)

1. **Emissão de guias de imposto** (DAS, ISS, DARF, GPS)
2. **Transmissão de obrigações fiscais** (SPED, DCTF, EFD)
3. **Promoção de lançamentos bancários para contábeis** (partida dobrada)
4. **Envio de documentos por e-mail** (módulo de comunicações)
5. **Fechamento de mês contábil** (trava de compliance)
6. **Exclusão de documentos fiscais** (NF-e, NFS-e)

---

## 💡 Implementação

### Backend: Modelo de Dados

```prisma
// backend/prisma/schema.prisma

// Fila de pendências (score 50-79%)
model AutomationPending {
  id          String   @id @default(uuid())
  companyId   String
  runId       String?  // vínculo com a execução que gerou a pendência
  type        String   // MATCH | CLASSIFICATION | DIVERGENCE | GUIDE_REVIEW
  confidence  Float    // score de confiança (0.0 - 1.0)
  payload     Json     // dados da pendência (ex: lançamento, guia, documento)
  status      String   @default("PENDING") // PENDING | APPROVED | REJECTED
  resolvedBy  String?  // userId que aprovou/rejeitou
  resolvedAt  DateTime?
  createdAt   DateTime @default(now())
  
  @@index([companyId, status])
  @@map("automation_pendings")
}

// Registro de aprovação (auditoria)
model ApprovalRecord {
  id          String   @id @default(uuid())
  pendingId   String
  approvedBy  String   // userId
  decision    String   // APPROVED | REJECTED
  detail      Json?    // observações, motivo da rejeição
  createdAt   DateTime @default(now())
  
  pending     AutomationPending @relation(fields: [pendingId], references: [id])
  
  @@map("approval_records")
}

// Log de auditoria (todas as ações do sistema)
model AutomationAudit {
  id          String   @id @default(uuid())
  companyId   String
  actor       String   @default("DIGITAL_EMPLOYEE") // USER ou DIGITAL_EMPLOYEE
  action      String   // USER_APPROVED | SKILL_FINISHED | GUIDE_ISSUED
  entity      String   // AutomationPending | TaxGuide | AccountingEntry
  entityId    String
  detail      Json?    // detalhes da ação
  createdAt   DateTime @default(now())
  
  @@index([companyId, createdAt])
  @@map("automation_audits")
}

Backend: Serviço de Aprovação

// backend/src/digital-employee/services/aurora.service.ts

@Injectable()
export class AuroraService {
  constructor(private prisma: PrismaService) {}

  /**
   * Aprova uma pendência da fila de revisão humana.
   * 
   * @param pendingId - ID da pendência
   * @param userId - ID do usuário que está aprovando
   * @param detail - Observações opcionais
   */
  async approvePending(pendingId: string, userId: string, detail?: any) {
    // 1. Buscar pendência
    const pending = await this.prisma.automationPending.findUnique({
      where: { id: pendingId },
      include: { run: true },
    });

    if (!pending) {
      throw new NotFoundException(`Pendência ${pendingId} não encontrada`);
    }

    if (pending.status !== 'PENDING') {
      throw new BadRequestException(`Pendência já foi resolvida (status: ${pending.status})`);
    }

    // 2. Registrar aprovação
    await this.prisma.approvalRecord.create({
      data: {
        pendingId: pending.id,
        approvedBy: userId,
        decision: 'APPROVED',
        detail,
      },
    });

    // 3. Atualizar status da pendência
    await this.prisma.automationPending.update({
      where: { id: pendingId },
      data: {
        status: 'APPROVED',
        resolvedBy: userId,
        resolvedAt: new Date(),
      },
    });

    // 4. Executar ação aprovada
    await this.executeApprovedAction(pending);

    // 5. Auditoria
    await this.prisma.automationAudit.create({
      data: {
        companyId: pending.companyId,
        actor: 'USER',
        action: 'USER_APPROVED',
        entity: pending.type,
        entityId: pending.id,
        detail: { userId, decision: 'APPROVED', ...detail },
      },
    });

    return { success: true, message: 'Pendência aprovada com sucesso' };
  }

  /**
   * Executa a ação aprovada (ex: emitir guia, promover lançamento)
   */
  private async executeApprovedAction(pending: AutomationPending) {
    switch (pending.type) {
      case 'CLASSIFICATION':
        // Classificar lançamento no banco
        await this.classifyTransaction(pending.payload);
        break;
      
      case 'GUIDE_REVIEW':
        // Emitir guia de imposto
        await this.issueTaxGuide(pending.payload);
        break;
      
      case 'MATCH':
        // Conciliar transação com NF-e
        await this.reconcileMatch(pending.payload);
        break;
      
      default:
        throw new BadRequestException(`Tipo de pendência não suportado: ${pending.type}`);
    }
  }
}
Frontend: UI de Aprovação

// frontend/src/app/dashboard/funcionario-digital/page.tsx

export default function FuncionarioDigitalPage() {
  const [pendings, setPendings] = useState<AutomationPending[]>([]);
  
  const approvePending = async (pendingId: string) => {
    try {
      await api.post(`/digital-employee/pendings/${pendingId}/approve`, {
        detail: { note: 'Aprovado pelo usuário' },
      });
      
      toast.success('Pendência aprovada com sucesso');
      
      // Recarregar lista
      fetchPendings();
    } catch (error) {
      toast.error('Erro ao aprovar pendência');
    }
  };
  
  return (
    <div>
      <h1>Fila de Revisão Humana</h1>
      
      {pendings.map(pending => (
        <div key={pending.id} className="bg-yellow-50 border border-yellow-200 p-4 rounded">
          <div className="flex justify-between items-start">
            <div>
              <p className="font-medium">{pending.type}</p>
              <p className="text-sm text-gray-600">
                Confiança: {(pending.confidence * 100).toFixed(0)}%
              </p>
              <pre className="text-xs mt-2 bg-white p-2 rounded">
                {JSON.stringify(pending.payload, null, 2)}
              </pre>
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={() => approvePending(pending.id)}
                className="bg-teal-600 text-white px-4 py-2 rounded hover:bg-teal-700"
              >
                ✅ Aprovar
              </button>
              <button
                onClick={() => rejectPending(pending.id)}
                className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
              >
                ❌ Rejeitar
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

✅ Consequências

Positivas

✅ Compliance fiscal garantido: Nenhuma ação legal é executada sem aprovação humana
✅ Rastreabilidade completa: Log de quem aprovou o quê e quando
✅ Redução de risco legal: Proteção contra erros automatizados
✅ Auditoria facilitada: Todos os registros estão no banco
✅ Flexibilidade: Régua de confiança pode ser ajustada por tipo de tarefa

Negativas

❌ Automação menos "mágica": Sempre requer intervenção humana para ações críticas
❌ UX menos fluida: Usuário precisa revisar pendências manualmente
❌ Carga de trabalho: Se muitas pendências forem geradas, pode sobrecarregar o contador

📚 Referências

Arquivos que usam esta ADR:

backend/src/digital-employee/ (módulo Aurora)
backend/src/comunicados/ (módulo de envios com aprovação)
backend/src/accounting/ (promoção bancário→contábil)
backend/src/fiscal/ (emissão de guias)

ADRs relacionadas:

ADR-117 (aprovação obrigatória no envio de e-mails)
ADR-031 (cálculo tributário determinístico, IA só sugere)
ADR-033 (perfis de aprovação: Auxiliar, Analista, Supervisor, Contador)

🔄 Histórico de Revisões

Data        Autor           Mudança
2026-08     Marcos Toledo   Criação inicial
2026-09     Marcos Toledo   Adicionados exemplos de código