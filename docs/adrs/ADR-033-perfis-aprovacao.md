
---

### 📂 `docs/adrs/ADR-033-perfis-aprovacao.md`

```markdown
# ADR-033: Perfis de Aprovação Hierárquicos

**Data:** 2026-08  
**Status:** ✅ Aceita  
**Decisor:** Marcos Toledo  
**Reversível:** Sim

---

## 📋 Contexto

O módulo Aurora (Funcionário Digital) executa tarefas automatizadas que podem exigir aprovação humana. Diferentes tarefas têm diferentes níveis de risco:

- **Baixo risco:** Classificação de lançamento (pode ser aprovada por auxiliar)
- **Médio risco:** Emissão de guia de imposto (exige analista)
- **Alto risco:** Transmissão de SPED (exige contador responsável)

**Problema:**
Como garantir que apenas pessoas qualificadas aprovem tarefas críticas, sem engessar o fluxo?

---

## 🎯 Decisão

Implementar **4 perfis de aprovação hierárquicos**, onde cada perfil pode aprovar tarefas do seu nível e de níveis inferiores.

### Hierarquia de Perfis:

| Perfil | Nível | Pode Aprovar | Exemplo de Tarefa |
|--------|-------|--------------|-------------------|
| **AUXILIAR** | 1 | Tarefas operacionais | Classificação de lançamento, conciliação básica |
| **ANALISTA** | 2 | AUXILIAR + tarefas fiscais | Emissão de DAS/ISS, revisão de NF-e |
| **SUPERVISOR** | 3 | ANALISTA + tarefas contábeis | Promoção bancário→contábil, fechamento de mês |
| **CONTADOR** | 4 | SUPERVISOR + tarefas legais | Transmissão de SPED, assinatura de obrigações |

### Regras:

1. **Hierarquia Rígida:**
   - Um AUXILIAR **NÃO** pode aprovar tarefa de ANALISTA
   - Um CONTADOR pode aprovar **qualquer** tarefa

2. **Configuração por Tenant:**
   - Cada escritório (`companyId`) define quais usuários têm quais perfis
   - Modelo `UserProfile` vincula `userId` a `approvalLevel`

3. **Fallback:**
   - Se não houver usuário com perfil suficiente, tarefa fica pendente até o CONTADOR acessar

---

## 💡 Implementação

### Backend: Modelo de Dados

```prisma
// backend/prisma/schema.prisma

enum ApprovalLevel {
  AUXILIAR    // Nível 1
  ANALISTA    // Nível 2
  SUPERVISOR  // Nível 3
  CONTADOR    // Nível 4
}

model UserProfile {
  id              String        @id @default(uuid())
  companyId       String
  userId          String        @unique
  approvalLevel   ApprovalLevel
  
  user            User          @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@map("user_profiles")
}

model AutomationPending {
  id              String   @id @default(uuid())
  companyId       String
  type            String   // CLASSIFICATION | GUIDE_REVIEW | SPED_TRANSMISSION
  riskLevel       String   // LOW | MEDIUM | HIGH | LEGAL
  requiredLevel   ApprovalLevel // Nível mínimo para aprovar
  
  // ... outros campos
}

Backend: Serviço de Aprovação com Validação de Perfil

// backend/src/digital-employee/services/aurora.service.ts

@Injectable()
export class AuroraService {
  private readonly levelHierarchy = {
    AUXILIAR: 1,
    ANALISTA: 2,
    SUPERVISOR: 3,
    CONTADOR: 4,
  };

  async approvePending(pendingId: string, userId: string) {
    // 1. Buscar pendência
    const pending = await this.prisma.automationPending.findUnique({
      where: { id: pendingId },
    });

    if (!pending) throw new NotFoundException();

    // 2. Buscar perfil do usuário
    const profile = await this.prisma.userProfile.findUnique({
      where: { userId },
    });

    if (!profile) throw new ForbiddenException('Usuário sem perfil de aprovação');

    // 3. Validar hierarquia
    const userLevel = this.levelHierarchy[profile.approvalLevel];
    const requiredLevel = this.levelHierarchy[pending.requiredLevel];

    if (userLevel < requiredLevel) {
      throw new ForbiddenException(
        `Seu perfil (${profile.approvalLevel}) não pode aprovar tarefas de nível ${pending.requiredLevel}`
      );
    }

    // 4. Aprovar
    await this.prisma.automationPending.update({
      where: { id: pendingId },
      data: {
        status: 'APPROVED',
        resolvedBy: userId,
        resolvedAt: new Date(),
      },
    });

    // 5. Executar ação aprovada
    await this.executeApprovedAction(pending);
  }
}

Frontend: Exibição de Nível na Fila

// frontend/src/app/dashboard/funcionario-digital/page.tsx

<div className="flex items-center gap-2">
  <span className="text-sm text-gray-600">Nível mínimo:</span>
  <span className={`px-2 py-1 rounded text-xs font-semibold ${
    pending.requiredLevel === 'CONTADOR' ? 'bg-red-100 text-red-800' :
    pending.requiredLevel === 'SUPERVISOR' ? 'bg-orange-100 text-orange-800' :
    pending.requiredLevel === 'ANALISTA' ? 'bg-yellow-100 text-yellow-800' :
    'bg-green-100 text-green-800'
  }`}>
    {pending.requiredLevel}
  </span>
</div>

✅ Consequências

Positivas

✅ Compliance: Garante que apenas pessoas qualificadas aprovem tarefas críticas
✅ Flexibilidade: Cada escritório define sua própria hierarquia
✅ Escalabilidade: Fácil adicionar novos perfis no futuro

Negativas

❌ Complexidade de Configuração: Exige que o admin do tenant configure perfis corretamente
❌ Gargalo: Se não houver CONTADOR disponível, tarefas legais ficam pendentes

📚 Referências

Arquivos que usam esta ADR:

backend/src/digital-employee/services/aurora.service.ts
backend/prisma/schema.prisma (enum ApprovalLevel)
frontend/src/app/dashboard/funcionario-digital/page.tsx

🔄 Histórico de Revisões
Data                Autor               Mudança
2026-08             Marcos Toledo       Criação inicial