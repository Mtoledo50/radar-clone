
---

### 📂 `docs/adrs/ADR-115-templates-handlebars.md`

```markdown
# ADR-115: Templates de E-mail Editáveis via Handlebars

**Data:** 2026-09  
**Status:** ✅ Aceita  
**Decisor:** Marcos Toledo  
**Reversível:** Sim

---

## 📋 Contexto

O módulo de Envio precisa enviar e-mails com templates personalizados (DAS, DARF, NFS-e, Balancete). Contador quer editar o texto do e-mail sem alterar código.

**Problema:**
- Hardcoded HTML no código exige deploy para cada mudança
- Diferentes documentos exigem templates diferentes

## 🎯 Decisão

Usar **Handlebars** como motor de templates, com:
1. **Templates Editáveis:** CRUD via painel admin
2. **Variáveis Dinâmicas:** `{{cliente.nome}}`, `{{documento.competencia}}`, etc.
3. **Preview ao Vivo:** Editor mostra preview em tempo real
4. **8 Seeds Iniciais:** Templates para documentos mais comuns

## 💡 Implementação

### Schema Prisma

```prisma
model EmailTemplate {
  id              String   @id @default(uuid())
  companyId       String
  
  nome            String   // "DAS Mensal"
  tipoDocumento   String   // DAS | DARF | NFSE | BALANCETE | GENERICO
  assunto         String   // "DAS {{documento.competencia}} - {{cliente.nome}}"
  corpoHtml       String   @db.Text // HTML com variáveis Handlebars
  
  ativo           Boolean  @default(true)
  
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  @@unique([companyId, tipoDocumento])
  @@map("email_templates")
}

Renderização com Handlebars

// backend/src/comunicados/email-template/email-template.service.ts

import * as Handlebars from 'handlebars';

@Injectable()
export class EmailTemplateService {
  async renderizar(templateId: string, contexto: any): Promise<string> {
    const template = await this.prisma.emailTemplate.findUnique({
      where: { id: templateId },
    });

    if (!template) throw new NotFoundException();

    const compiled = Handlebars.compile(template.corpoHtml);
    return compiled(contexto);
  }
}

Variáveis Disponíveis

const contexto = {
  cliente: {
    nome: 'ACADEMIA DO RENAN',
    razaoSocial: 'RENAN FITNESS LTDA',
    cnpj: '12.345.678/0001-95',
    email: 'financeiro@academia.com.br',
  },
  documento: {
    tipo: 'DAS',
    competencia: '08/2026',
    nomeArquivo: 'DAS_12345678000195_082026.pdf',
  },
  link: {
    download: 'https://radar-api.contacerta.com.br/track/download/uuid/token',
    expiraEm: '22/09/2026',
  },
  empresa: {
    nome: 'Conta Certa Soluções Empresariais',
    logoUrl: 'https://contacerta.com.br/logo.png',
  },
  setor: {
    nome: 'Fiscal',
    responsavel: 'Maria Silva',
  },
  data: {
    envio: '15/09/2026',
  },
  usuario: {
    nome: 'Marcos Toledo',
  },
};

Seed de Templates Iniciais

// backend/prisma/seed-email-templates.ts

const templates = [
  {
    tipoDocumento: 'DAS',
    nome: 'DAS Mensal',
    assunto: 'DAS {{documento.competencia}} - {{cliente.nome}}',
    corpoHtml: `
      <p>Olá, {{cliente.nome}}!</p>
      <p>Segue o DAS referente à competência <strong>{{documento.competencia}}</strong>.</p>
      <p><a href="{{link.download}}">📥 Baixar documento</a></p>
      <p>Link válido até {{link.expiraEm}}.</p>
      <p>Atenciosamente,<br>{{empresa.nome}}<br>{{setor.nome}}</p>
    `,
  },
  // ... 7 mais templates (DARF, NFSE, BALANCETE, etc.)
];

✅ Consequências

Positivas

✅ Sem Deploy: Contador edita templates via painel
✅ Flexível: Variáveis dinâmicas para personalização
✅ Preview: Editor mostra resultado em tempo real

Negativas

❌ Complexidade: Handlebars exige aprendizado
❌ Segurança: Templates maliciosos podem injetar HTML (mitigado por validação)

📚 Referências

Arquivos que usam esta ADR:

backend/src/comunicados/email-template/email-template.service.ts
backend/prisma/seed-email-templates.ts
frontend/src/app/dashboard/comunicados/templates/page.tsx

ADRs relacionadas:

ADR-114 (Tracking pixel + link proxy)
ADR-116 (Envio plugável)

🔄 Histórico de Revisões

Data            Autor           Mudança
2026-09         Marcos Toledo   Criação inicial (Sprint F16-A)

