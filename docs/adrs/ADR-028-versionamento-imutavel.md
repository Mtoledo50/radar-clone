
---

### 📂 `docs/adrs/ADR-028-versionamento-imutavel.md`

```markdown
# ADR-028: Versionamento Imutável de Propostas Comerciais

**Data:** 2026-08  
**Status:** ✅ Aceita  
**Decisor:** Marcos Toledo  
**Reversível:** Não (regra de integridade comercial)

---

## 📋 Contexto

O sistema gera propostas comerciais para clientes. Com o tempo, o escritório pode precisar:
- Ajustar preços (inflação, negociação).
- Adicionar/remover serviços.
- Criar versões diferentes para o mesmo cliente (ex: proposta inicial vs proposta final).

**Problema:**
- Se a proposta for editada diretamente, perde-se o histórico (quem viu o quê, quando).
- Não há como comparar versões (ex: "o que mudou entre a proposta de janeiro e a de março?").
- O cliente pode ter aceitado uma versão antiga, mas o sistema só mostra a atual.

**Dilema:**
Como permitir edições sem perder o histórico e sem quebrar a rastreabilidade?

---

## 🎯 Decisão

Implementar **versionamento imutável** de propostas, onde:

1. **Nunca Editar:** Uma proposta criada **NUNCA** é editada diretamente. Em vez disso, cria-se uma **nova versão** (clone).
2. **Cadeia de Versões:** Cada versão tem um `originalProposalId` que aponta para a versão anterior, formando uma cadeia.
3. **Versão Atual:** Apenas uma versão por cadeia tem `isCurrent = true`. As outras são históricas.
4. **Comparação:** O sistema permite comparar duas versões (diff de campos e itens).

### Regras:

1. **Imutabilidade:** Uma vez criada, uma proposta **NUNCA** é alterada (exceto `isCurrent`).
2. **Clone Completo:** Ao criar uma nova versão, todos os campos e itens são clonados (deep copy).
3. **Rastreabilidade:** Cada versão tem `createdAt`, `createdBy`, `reason` (motivo da nova versão).
4. **Ativação:** Apenas uma versão pode ser `isCurrent = true` por cadeia.

---

## 💡 Implementação

### Backend: Schema Prisma

```prisma
// backend/prisma/schema.prisma

model Proposal {
  id                    String    @id @default(uuid())
  companyId             String
  clientId              String
  
  // Dados da proposta
  title                 String
  status                String    // DRAFT | SENT | VIEWED | CLOSED_WON | CLOSED_LOST
  totalValue            Decimal   @db.Decimal(12, 2)
  
  // 🆕 ADR-028: Versionamento
  version               Int       @default(1) // 1, 2, 3...
  isCurrent             Boolean   @default(true) // Apenas uma versão por cadeia é "atual"
  originalProposalId    String?   // Vínculo com a versão anterior (cadeia)
  reason                String?   // Motivo da nova versão (ex: "Ajuste de preços")
  
  createdAt             DateTime  @default(now())
  createdBy             String    // userId
  
  company               Company   @relation(fields: [companyId], references: [id])
  client                Client    @relation(fields: [clientId], references: [id])
  originalProposal      Proposal? @relation("ProposalVersions", fields: [originalProposalId], references: [id])
  versions              Proposal[] @relation("ProposalVersions")
  
  items                 ProposalItem[]
  
  @@index([companyId, clientId, isCurrent])
  @@map("proposals")
}

Backend: Serviço de Versionamento

// backend/src/proposals/proposals.service.ts

@Injectable()
export class ProposalsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Cria uma nova versão de uma proposta (clone imutável)
   */
  async createVersion(
    companyId: string,
    proposalId: string,
    userId: string,
    reason: string
  ) {
    return this.prisma.$transaction(async (tx) => {
      // 1. Buscar proposta original
      const original = await tx.proposal.findUnique({
        where: { id: proposalId, companyId },
        include: { items: true },
      });

      if (!original) throw new NotFoundException();

      // 2. Desativar versão atual (isCurrent = false)
      await tx.proposal.update({
        where: { id: proposalId },
        data: { isCurrent: false },
      });

      // 3. Criar nova versão (clone)
      const newVersion = await tx.proposal.create({
        data: {
          companyId: original.companyId,
          clientId: original.clientId,
          title: original.title,
          status: original.status,
          totalValue: original.totalValue,
          version: original.version + 1,
          isCurrent: true,
          originalProposalId: original.id,
          reason,
          createdBy: userId,
          items: {
            create: original.items.map(item => ({
              name: item.name,
              description: item.description,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              totalPrice: item.totalPrice,
            })),
          },
        },
        include: { items: true },
      });

      return newVersion;
    });
  }

  /**
   * Lista todas as versões de uma proposta (cadeia completa)
   */
  async listVersions(companyId: string, proposalId: string) {
    // 1. Encontrar a versão mais antiga da cadeia
    let current = await this.prisma.proposal.findUnique({
      where: { id: proposalId, companyId },
    });

    if (!current) throw new NotFoundException();

    while (current.originalProposalId) {
      current = await this.prisma.proposal.findUnique({
        where: { id: current.originalProposalId },
      });
    }

    // 2. Listar todas as versões a partir da mais antiga
    const versions = await this.prisma.proposal.findMany({
      where: {
        OR: [
          { id: current.id },
          { originalProposalId: current.id },
        ],
      },
      orderBy: { version: 'asc' },
    });

    return versions;
  }

  /**
   * Compara duas versões (diff de campos e itens)
   */
  async compareVersions(
    companyId: string,
    versionAId: string,
    versionBId: string
  ) {
    const [versionA, versionB] = await Promise.all([
      this.prisma.proposal.findUnique({
        where: { id: versionAId, companyId },
        include: { items: true },
      }),
      this.prisma.proposal.findUnique({
        where: { id: versionBId, companyId },
        include: { items: true },
      }),
    ]);

    if (!versionA || !versionB) throw new NotFoundException();

    // Diff de campos escalares
    const fieldDiffs = [];
    for (const key of ['title', 'status', 'totalValue']) {
      if (versionA[key] !== versionB[key]) {
        fieldDiffs.push({
          field: key,
          oldValue: versionA[key],
          newValue: versionB[key],
        });
      }
    }

    // Diff de itens
    const itemDiffs = [];
    const itemsA = new Map(versionA.items.map(i => [i.name, i]));
    const itemsB = new Map(versionB.items.map(i => [i.name, i]));

    // Itens adicionados
    for (const [name, item] of itemsB) {
      if (!itemsA.has(name)) {
        itemDiffs.push({ type: 'added', item });
      }
    }

    // Itens removidos
    for (const [name, item] of itemsA) {
      if (!itemsB.has(name)) {
        itemDiffs.push({ type: 'removed', item });
      }
    }

    // Itens alterados
    for (const [name, itemA] of itemsA) {
      const itemB = itemsB.get(name);
      if (itemB && (itemA.quantity !== itemB.quantity || itemA.unitPrice !== itemB.unitPrice)) {
        itemDiffs.push({ type: 'changed', oldItem: itemA, newItem: itemB });
      }
    }

    return { fieldDiffs, itemDiffs };
  }
}

Frontend: Exibição de Versões

// frontend/src/app/dashboard/precificacao/propostas/[id]/versoes/page.tsx

export default function VersoesPage({ params }: { params: { id: string } }) {
  const [versions, setVersions] = useState<Proposal[]>([]);

  useEffect(() => {
    api.get(`/proposals/${params.id}/versions`).then(res => {
      setVersions(res.data);
    });
  }, [params.id]);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Histórico de Versões</h1>

      <div className="space-y-4">
        {versions.map(version => (
          <div
            key={version.id}
            className={`bg-white p-4 rounded-lg shadow ${
              version.isCurrent ? 'border-2 border-teal-500' : ''
            }`}
          >
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-bold">
                  Versão {version.version}
                  {version.isCurrent && (
                    <span className="ml-2 text-xs bg-teal-100 text-teal-800 px-2 py-1 rounded">
                      ATUAL
                    </span>
                  )}
                </h3>
                <p className="text-sm text-gray-600">
                  Criada em {new Date(version.createdAt).toLocaleString('pt-BR')}
                </p>
                {version.reason && (
                  <p className="text-sm text-gray-500 mt-2">
                    Motivo: {version.reason}
                  </p>
                )}
              </div>
              <div className="text-right">
                <p className="text-lg font-semibold">
                  R$ {version.totalValue.toFixed(2)}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

✅ Consequências

Positivas

✅ Histórico Completo: Todas as versões são preservadas.
✅ Rastreabilidade: Quem criou, quando, por quê.
✅ Comparação: Fácil ver o que mudou entre versões.

Negativas

❌ Complexidade: Lógica de clone e cadeia de versões.
❌ Armazenamento: Cada versão duplica dados (itens, campos).

📚 Referências

Arquivos que usam esta ADR:

backend/prisma/schema.prisma (modelo Proposal com versionamento)
backend/src/proposals/proposals.service.ts (métodos createVersion, listVersions, compareVersions)
frontend/src/app/dashboard/precificacao/propostas/[id]/versoes/page.tsx (histórico de versões)

🔄 Histórico de Revisões

Data                    Autor               Mudança
2026-08                 Marcos Toledo       Criação inicial