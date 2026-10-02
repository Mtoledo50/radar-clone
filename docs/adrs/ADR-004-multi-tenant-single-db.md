ADR-004: Multi-Tenant Single-Database por companyId

Data: 2026-07
Status: ✅ Aceita (Regra Crítica)
Decisor: Marcos Toledo
Reversível: Não (decisão arquitetural fundacional)

📋 Contexto

O Radar Conta Certa é um SaaS B2B que atende múltiplos escritórios de contabilidade (tenants). Precisamos isolar os dados de cada escritório para garantir segurança, privacidade (LGPD) e integridade dos dados.
Alternativas consideradas:
Database por Tenant: Isolamento máximo, mas custo de infraestrutura explosivo e dificuldade de manutenção (migrations em N bancos).
Schema por Tenant: Melhor que 1, mas ainda complexo para gerenciar no PostgreSQL.
Single Database com companyId: Todos os dados no mesmo banco, separados por uma coluna companyId em cada tabela.

🎯 Decisão

Adotar a arquitetura Single-Database, Shared Schema, onde todas as tabelas de negócio (exceto tabelas globais de sistema como SuperAdmin) possuem uma coluna companyId (UUID).
Regras Inegociáveis:
Filtro Obrigatório: Toda query no backend (Prisma) que busca, atualiza ou deleta dados de negócio DEVE incluir where: { companyId: req.user.companyId }.
Criação: Ao criar qualquer registro, o companyId deve ser injetado automaticamente a partir do token JWT, nunca confiado no payload do frontend.
Índices: Todas as tabelas com companyId devem ter um índice composto ou simples nessa coluna para performance (@@index([companyId])).
Relações: Chaves estrangeiras devem garantir que relações cruzadas (ex: Cliente → Lançamento) pertençam ao mesmo companyId.

💡 Implementação

Schema Prisma

model Client {
  id          String   @id @default(uuid())
  companyId   String   // 🔒 Isolamento por tenant
  name        String
  cnpj        String   @unique
  
  company     Company  @relation(fields: [companyId], references: [id], onDelete: Cascade)
  transactions BankTransaction[]

  @@index([companyId])
  @@map("clients")
}

Backend (NestJS) - Exemplo de Serviço Seguro

// backend/src/clients/clients.service.ts
@Injectable()
export class ClientsService {
  constructor(private prisma: PrismaService) {}

  // ✅ CORRETO: companyId vem do usuário autenticado (JWT)
  async findAll(companyId: string) {
    return this.prisma.client.findMany({
      where: { companyId }, // 🔒 Filtro obrigatório
    });
  }

  // ✅ CORRETO: Criação com companyId injetado
  async create(companyId: string, data: CreateClientDto) {
    return this.prisma.client.create({
      data: {
        ...data,
        companyId, // 🔒 Nunca confiar no data.companyId vindo do frontend
      },
    });
  }

  // ❌ ERRADO: Permitir que o frontend envie o companyId
  async createInsecure(data: CreateClientDto) {
    return this.prisma.client.create({ data }); // VULNERABILIDADE DE TENANT HIJACKING
  }
}

Middleware de Validação (Global ou por Módulo)
Recomenda-se usar um PrismaService customizado ou interceptors que validem automaticamente a presença de companyId em operações de escrita/leitura em ambientes de alta criticidade.

✅ Consequências

Positivas

✅ Custo de Infraestrutura: Um único banco de dados para todos os clientes (escalável e barato).
✅ Manutenção: Migrations do Prisma são executadas uma única vez.
✅ Consultas Cross-Tenant (Admin): O Super Admin pode consultar dados agregados de todos os tenants facilmente (removendo o filtro companyId).

Negativas

❌ Risco de Vazamento de Dados: Se um desenvolvedor esquecer o where: { companyId }, um cliente pode ver dados de outro (Tenant Hijacking). Mitigado por Code Reviews rigorosos e testes automatizados.
❌ Limite de Escala: Um único banco pode se tornar um gargalo se o número de tenants for massivo (milhões). Para o porte atual do Radar, é mais que suficiente.

📚 Referências

backend/prisma/schema.prisma (todas as models de negócio)
backend/src/**/**/*.service.ts (lógica de aplicação)

🔄 Histórico de Revisões
Data            Autor                       Mudança
2026-07         Marcos Toledo               Criação inicial
2026-08         Marcos Toledo               Reforço da regra de injeção automática do companyId
