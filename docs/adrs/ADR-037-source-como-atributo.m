# ADR-037: `source` como Atributo de Origem de Documento

**Data:** 2026-08  
**Status:** ✅ Aceita  
**Decisor:** Marcos Toledo  
**Reversível:** Sim

---

## 📋 Contexto

O módulo Aurora (Funcionário Digital) coleta documentos fiscais (NFS-e, NF-e, extratos) de múltiplas fontes:
- Upload manual pelo contador
- Coleta automática por e-mail (IMAP)
- Watch Folder (pasta monitorada)
- Portal governamental (RPA futuro)
- API bancária (Open Finance)

**Problema:**
Como rastrear de onde veio cada documento sem criar tabelas separadas para cada fonte? Se criarmos `NfseManual`, `NfseEmail`, `NfsePortal`, teremos 3 tabelas idênticas com lógica duplicada.

## 🎯 Decisão

Adicionar um campo `source: String` (ou enum) em **todas** as models de documento fiscal, indicando a origem do documento. Isso permite:
1. **Tabela única** por tipo de documento (ex: `FiscalServiceInvoice` para NFS-e)
2. **Filtros por origem** na UI (ex: "mostrar apenas NFS-e vindas por e-mail")
3. **Auditoria** de qual coletor processou o documento
4. **Retry seletivo** (ex: "reprocessar apenas as NFS-e que falharam no portal")

### Valores Permitidos (Enum):
```typescript
enum DocumentSource {
  MANUAL = 'MANUAL',           // Upload manual pelo contador
  EMAIL = 'EMAIL',             // Coletado via IMAP
  FOLDER = 'FOLDER',           // Watch Folder (pasta monitorada)
  PORTAL = 'PORTAL',           // RPA de portal governamental
  API = 'API',                 // Integração via API (Open Finance, etc.)
  IMPORT = 'IMPORT',           // Importação em massa (CSV/XML)
  SYSTEM = 'SYSTEM',           // Gerado pelo sistema (ex: guia calculada)
}

💡 Implementação
Backend: Schema Prisma

// backend/prisma/schema.prisma

model FiscalServiceInvoice {
  id          String   @id @default(uuid())
  companyId   String
  clientId    String
  
  // Dados da NFS-e
  accessKey   String?  @unique
  number      String
  issueDate   DateTime
  value       Decimal  @db.Decimal(14, 2)
  
  // 🆕 ADR-037: Origem do documento
  source      DocumentSource @default(MANUAL)
  sourceDetail String?  // Detalhes da origem (ex: "email:financeiro@cliente.com.br", "folder:/documentos/nfse")
  
  // Processamento
  status      String   @default("PENDING") // PENDING | PROCESSED | FAILED
  errorMessage String?
  
  createdAt   DateTime @default(now())
  processedAt DateTime?
  
  @@index([companyId, clientId, source])
  @@map("fiscal_service_invoices")
}

Backend: Serviço de Coleta com Source

// backend/src/digital-employee/collectors/email-collector.service.ts

@Injectable()
export class EmailCollectorService {
  async collectFromEmail(companyId: string, clientId: string) {
    const emails = await this.fetchEmails(clientId);
    
    for (const email of emails) {
      const attachments = await this.extractAttachments(email);
      
      for (const attachment of attachments) {
        if (this.isNfseXml(attachment)) {
          await this.prisma.fiscalServiceInvoice.create({
            data: {
              companyId,
              clientId,
              number: this.extractNfseNumber(attachment),
              issueDate: this.extractIssueDate(attachment),
              value: this.extractValue(attachment),
              source: 'EMAIL', // 🆕 ADR-037
              sourceDetail: `email:${email.from} | subject:${email.subject}`,
              status: 'PENDING',
            },
          });
        }
      }
    }
  }
}

Frontend: Filtro por Origem

// frontend/src/app/dashboard/fiscal/nfse/page.tsx

<Select value={sourceFilter} onChange={setSourceFilter}>
  <option value="">Todas as origens</option>
  <option value="MANUAL">📤 Upload Manual</option>
  <option value="EMAIL">📧 E-mail</option>
  <option value="FOLDER">📁 Watch Folder</option>
  <option value="PORTAL">🌐 Portal</option>
</Select>

// Badge visual por origem
<span className={`px-2 py-1 rounded text-xs ${
  nfse.source === 'EMAIL' ? 'bg-blue-100 text-blue-800' :
  nfse.source === 'FOLDER' ? 'bg-purple-100 text-purple-800' :
  nfse.source === 'PORTAL' ? 'bg-green-100 text-green-800' :
  'bg-gray-100 text-gray-800'
}`}>
  {nfse.source}
</span>

✅ Consequências

Positivas

✅ Schema Simples: Uma tabela por tipo de documento, não N tabelas por fonte
✅ Filtros Poderosos: "Mostrar apenas NFS-e que falharam no portal"
✅ Auditoria: Rastreabilidade completa de onde veio cada documento
✅ Retry Seletivo: Reprocessar apenas documentos de uma fonte específica

Negativas

❌ Campo Opcional: Se sourceDetail não for preenchido, perde-se contexto (ex: qual e-mail, qual pasta)
❌ Enum Rígido: Se surgir uma nova fonte (ex: "WhatsApp"), precisa adicionar ao enum

📚 Referências

Arquivos que usam esta ADR:

backend/prisma/schema.prisma (models FiscalServiceInvoice, FiscalInvoice, BankStatement)
backend/src/digital-employee/collectors/ (email, folder, portal collectors)
frontend/src/app/dashboard/fiscal/nfse/page.tsx (filtro por origem)

ADRs relacionadas:

ADR-036 (ABRASF com adaptadores para NFS-e)
ADR-039 (IMAP como coletor)
ADR-113 (Watch Folder via chokidar)

🔄 Histórico de Revisões

Data                    Autor                   Mudança
2026-08                 Marcos Toledo           Criação inicial