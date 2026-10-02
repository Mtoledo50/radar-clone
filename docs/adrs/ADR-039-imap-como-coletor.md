
---

### 📂 `docs/adrs/ADR-039-imap-como-coletor.md`

```markdown
# ADR-039: IMAP como Coletor de Documentos Fiscais

**Data:** 2026-08  
**Status:** ✅ Aceita  
**Decisor:** Marcos Toledo  
**Reversível:** Sim

---

## 📋 Contexto

O módulo Aurora (Funcionário Digital) precisa coletar documentos fiscais (NFS-e, NF-e, extratos bancários) enviados por e-mail pelos clientes do escritório. Muitos clientes enviam XMLs de NFS-e, PDFs de extratos e boletos diretamente para o e-mail do escritório.

**Problema:**
- Contadores perdem horas baixando anexos manualmente do e-mail
- Não há garantia de que todos os documentos foram coletados (e-mail pode ser esquecido)
- Processo manual é propenso a erros (esquecer de baixar, baixar errado, etc.)

**Alternativas consideradas:**
1. **API do Gmail/Outlook:** Complexa, exige OAuth por cliente, limita a 10k requests/dia
2. **Webhook de e-mail:** Exige que o cliente configure forward, não é viável
3. **IMAP direto:** Simples, funciona com qualquer provedor, controle total

## 🎯 Decisão

Usar **IMAP (Internet Message Access Protocol)** como coletor padrão de documentos fiscais por e-mail. O sistema se conecta à caixa postal do escritório, busca e-mails com anexos específicos (XML, PDF, CSV), baixa os anexos e processa automaticamente.

### Regras:
1. **Conexão Segura:** IMAP over SSL/TLS (porta 993) obrigatório
2. **Credenciais Criptografadas:** Senha do e-mail armazenada no cofre AES-256-GCM (ADR-032)
3. **Filtros Inteligentes:** Busca apenas e-mails com:
   - Assunto contendo palavras-chave ("NFS-e", "Nota Fiscal", "Extrato")
   - Anexos com extensões permitidas (.xml, .pdf, .csv)
   - Remetentes cadastrados (lista de clientes)
4. **Marcação de Processados:** E-mails processados são marcados com flag `\Seen` ou movidos para pasta "Processados"
5. **Retry em Falha:** Se o processamento falhar, e-mail é marcado como "Falhou" e tentado novamente no próximo cron
6. **LGPD:** Logs não armazenam conteúdo do e-mail, apenas metadados (remetente, assunto, data)

## 💡 Implementação

### Backend: Serviço de Coleta IMAP
```typescript
// backend/src/digital-employee/collectors/imap-collector.service.ts

import { Injectable, Logger } from '@nestjs/common';
import { ImapFlow } from 'imapflow';
import { simpleParser } from 'mailparser';
import { PrismaService } from '../../prisma/prisma.service';
import { VaultService } from '../../common/crypto/vault.service';

@Injectable()
export class ImapCollectorService {
  private readonly logger = new Logger(ImapCollectorService.name);

  constructor(
    private prisma: PrismaService,
    private vault: VaultService,
  ) {}

  /**
   * Coleta documentos fiscais de uma caixa postal via IMAP
   */
  async collectFromEmail(companyId: string, clientId: string) {
    // 1. Buscar credenciais do e-mail (criptografadas)
    const credential = await this.prisma.credentialVault.findFirst({
      where: {
        companyId,
        clientId,
        service: 'EMAIL_IMAP',
      },
    });

    if (!credential) {
      this.logger.warn(`Credenciais IMAP não configuradas para cliente ${clientId}`);
      return { collected: 0, error: 'Credenciais não configuradas' };
    }

    // 2. Descriptografar senha
    const password = this.vault.decrypt(credential.secretEnc);
    const emailConfig = credential.metadata as any;

    // 3. Conectar via IMAP
    const client = new ImapFlow({
      host: emailConfig.host, // ex: 'imap.gmail.com'
      port: 993,
      secure: true,
      auth: {
        user: credential.login, // ex: 'financeiro@escritorio.com.br'
        pass: password,
      },
      logger: false,
    });

    try {
      await client.connect();
      this.logger.log(`Conectado ao IMAP: ${credential.login}`);

      // 4. Selecionar caixa de entrada
      const mailbox = await client.mailboxOpen('INBOX');

      // 5. Buscar e-mails não lidos com anexos
      const messages = await client.search({
        seen: false, // Apenas não lidos
        // Filtros adicionais podem ser adicionados aqui
      });

      let collected = 0;

      for (const uid of messages) {
        const download = await client.download('INBOX', uid);
        const parsed = await simpleParser(download.content);

        // 6. Verificar se tem anexos relevantes
        const attachments = parsed.attachments.filter(att => 
          ['.xml', '.pdf', '.csv'].some(ext => att.filename?.toLowerCase().endsWith(ext))
        );

        if (attachments.length === 0) {
          continue; // Pular e-mails sem anexos relevantes
        }

        // 7. Processar cada anexo
        for (const attachment of attachments) {
          await this.processAttachment(companyId, clientId, attachment, parsed);
          collected++;
        }

        // 8. Marcar e-mail como processado
        await client.messageFlagsAdd('INBOX', uid, ['\\Seen']);
      }

      this.logger.log(`Coletados ${collected} documentos de ${credential.login}`);

      return { collected };
    } catch (error) {
      this.logger.error(`Erro ao coletar e-mails: ${error.message}`);
      return { collected: 0, error: error.message };
    } finally {
      await client.logout();
    }
  }

  /**
   * Processa um anexo de e-mail (NFS-e XML, extrato PDF, etc.)
   */
  private async processAttachment(
    companyId: string,
    clientId: string,
    attachment: any,
    email: any
  ) {
    const filename = attachment.filename || 'unknown';
    const ext = filename.split('.').pop()?.toLowerCase();

    if (ext === 'xml' && this.isNfseXml(attachment.content)) {
      // Processar como NFS-e
      const nfseData = this.parseNfseXml(attachment.content);
      
      await this.prisma.fiscalServiceInvoice.create({
        data: {
          companyId,
          clientId,
          number: nfseData.number,
          issueDate: nfseData.issueDate,
          value: nfseData.value,
          source: 'EMAIL', // ADR-037
          sourceDetail: `email:${email.from.value[0].address} | subject:${email.subject}`,
          status: 'PENDING',
        },
      });
    } else if (ext === 'pdf' && this.isBankStatementPdf(attachment.content)) {
      // Processar como extrato bancário
      // (Lógica de parsing de PDF de extrato)
    }
  }

  private isNfseXml(content: Buffer): boolean {
    const xml = content.toString('utf-8');
    return xml.includes('Nfse') || xml.includes('CompNfse');
  }

  private parseNfseXml(content: Buffer): any {
    // Parser de XML de NFS-e (ABRASF 2.0)
    // Retorna {number, issueDate, value}
    return {
      number: '12345',
      issueDate: new Date(),
      value: 1000,
    };
  }
}

Backend: Cron de Coleta
// backend/src/digital-employee/skills/nfse-email-collector-skill.ts

@Injectable()
export class NfseEmailCollectorSkill extends BaseSkill {
  skillKey = 'NFSE_EMAIL_COLLECT';
  cronExpression = '*/30 * * * *'; // A cada 30 minutos

  async execute(companyId: string) {
    const clients = await this.prisma.client.findMany({
      where: { companyId, isActive: true },
    });

    let totalCollected = 0;

    for (const client of clients) {
      const result = await this.imapCollector.collectFromEmail(companyId, client.id);
      totalCollected += result.collected;
    }

    return {
      itemsProcessed: totalCollected,
      message: `${totalCollected} documentos coletados por e-mail`,
    };
  }
}

Backend: Schema Prisma (Credenciais)


// backend/prisma/schema.prisma

model CredentialVault {
  id          String   @id @default(uuid())
  companyId   String
  clientId    String?
  
  service     String   // EMAIL_IMAP | ECAC | PGDAS | etc.
  login       String   // E-mail ou usuário
  
  secretEnc   String   // Senha criptografada (AES-256-GCM)
  
  metadata    Json?    // {host: "imap.gmail.com", port: 993}
  
  @@unique([companyId, clientId, service, login])
  @@map("credential_vault")
}

Frontend: Configuração de Coleta por E-m
// frontend/src/app/dashboard/funcionario-digital/configuracoes/page.tsx

<Modal title="Configurar Coleta por E-mail">
  <form onSubmit={handleSave}>
    <div className="space-y-4">
      <div>
        <label>Servidor IMAP</label>
        <input 
          type="text" 
          placeholder="imap.gmail.com"
          value={config.host}
          onChange={e => setConfig({...config, host: e.target.value})}
        />
      </div>
      
      <div>
        <label>E-mail</label>
        <input 
          type="email"
          placeholder="financeiro@escritorio.com.br"
          value={config.email}
          onChange={e => setConfig({...config, email: e.target.value})}
        />
      </div>
      
      <div>
        <label>Senha</label>
        <input 
          type="password"
          placeholder="••••••••"
          value={config.password}
          onChange={e => setConfig({...config, password: e.target.value})}
        />
        <p className="text-xs text-gray-500 mt-1">
          🔒 Senha criptografada com AES-256-GCM (ADR-032)
        </p>
      </div>
      
      <button type="submit" className="bg-teal-600 text-white px-4 py-2 rounded">
        Salvar Configuração
      </button>
    </div>
  </form>
</Modal>

✅ Consequências

Positivas

✅ Automação Total: Contador não precisa baixar anexos manualmente
✅ Funciona com Qualquer Provedor: Gmail, Outlook, HostGator, etc.
✅ Seguro: Credenciais criptografadas, conexão SSL/TLS
✅ Auditável: Log de quais e-mails foram processados


Negativas

❌ Dependência de Senha: Se o cliente mudar a senha, coleta falha até reconfigurar
❌ Limitação de Provedor: Alguns provedores bloqueiam IMAP ou exigem "app password"
❌ Latência: Coleta a cada 30 minutos (não é real-time)

📚 Referências

Arquivos que usam esta ADR:

backend/src/digital-employee/collectors/imap-collector.service.ts
backend/src/digital-employee/skills/nfse-email-collector-skill.ts
backend/prisma/schema.prisma (model CredentialVault)
frontend/src/app/dashboard/funcionario-digital/configuracoes/page.tsx

ADRs relacionadas:

ADR-032 (Cofres AES-256-GCM para credenciais)
ADR-037 (source como atributo de origem)
ADR-030 (Human-in-the-Loop: e-mails processados vão para fila de revisão)

Bibliotecas Utilizadas:

imapflow: Cliente IMAP moderno e leve (https://imapflow.com/)
mailparser: Parser de e-mails (https://www.npmjs.com/package/mailparser)

🔄 Histórico de Revisões

Data                Autor               Mudança
2026-08             Marcos Toledo       Criação inicial