// =================================================================
// INÍCIO: backend/src/fiscal/nfse/email-collector.service.ts
// =================================================================
// EmailCollectorService — coleta XMLs de NFS-e de uma caixa IMAP
//
// Filosofia (ADR-037): é um COLETOR, não um processador.
//   - Conecta à caixa IMAP
//   - Lista mensagens UNSEEN
//   - Extrai anexos .xml
//   - Salva em uploads/nfse-inbox/ (mesma pasta do upload manual)
//   - Marca e-mails como SEEN (não apaga — preserva p/ auditoria)
//
// Segurança (ADR-032 — LGPD):
//   - Credenciais via env (nunca hardcoded)
//   - TLS obrigatório
//   - Senha de APP (não a principal do e-mail)
//
// ADR-039: IMAP como coletor; fonte=EMAIL na skill de importação.
// =================================================================
import * as fs from 'fs';
import * as path from 'path';
import { ImapFlow } from 'imapflow';
import { simpleParser, ParsedMail } from 'mailparser';

export interface ImapConfig {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
  mailbox?: string;  // default: INBOX
}

export interface CollectResult {
  connected: boolean;
  messagesScanned: number;
  xmlsCollected: number;
  savedFiles: string[];
  errors: string[];
}

export class EmailCollectorService {
  /**
   * Coleta XMLs de NFS-e de uma caixa IMAP.
   * @param config credenciais IMAP
   * @param companyId tenant (usado p/ nomear os arquivos)
   * @param clientId opcional (se known, vincula ao cliente)
   * @param inboxDir pasta de destino (padrão: uploads/nfse-inbox)
   */
  async collect(
    config: ImapConfig,
    companyId: string,
    clientId: string | null = null,
    inboxDir: string = path.join(process.cwd(), 'uploads', 'nfse-inbox'),
  ): Promise<CollectResult> {
    const result: CollectResult = {
      connected: false,
      messagesScanned: 0,
      xmlsCollected: 0,
      savedFiles: [],
      errors: [],
    };

    // Garante que a inbox existe
    fs.mkdirSync(inboxDir, { recursive: true });

    // Cliente IMAP (TLS por padrão em ImapFlow)
    const client = new ImapFlow({
      host: config.host,
      port: config.port,
      secure: config.secure,
      auth: { user: config.user, pass: config.pass },
      logger: false, // evita spam nos logs
    });

    try {
      await client.connect();
      result.connected = true;

      const mailbox = config.mailbox || 'INBOX';
      const lock = await client.getMailboxLock(mailbox);

      try {
        // Busca mensagens UNSEEN (não lidas)
        for await (const msg of client.fetch({ seen: false }, {
          source: true,  // baixa o raw MIME
          envelope: true,
        })) {
          result.messagesScanned++;
          try {
            const parsed: ParsedMail = await simpleParser(msg.source);
            const xmls = this.extractXmlAttachments(parsed);

            for (const xml of xmls) {
              const safeClient = clientId || 'auto';
              const fileName = `${companyId}_${safeClient}_${Date.now()}_${xml.name}`;
              const filePath = path.join(inboxDir, fileName);
              fs.writeFileSync(filePath, xml.content, 'utf-8');
              result.savedFiles.push(fileName);
              result.xmlsCollected++;
            }

            // Marca como SEEN (não apaga — preserva p/ auditoria)
            await client.messageFlagsAdd(msg.uid, ['\\Seen']);
          } catch (err: any) {
            result.errors.push(`msg ${msg.uid}: ${err?.message || 'erro'}`);
          }
        }
      } finally {
        lock.release();
      }

      await client.logout();
    } catch (err: any) {
      result.errors.push(`IMAP: ${err?.message || 'erro de conexão'}`);
      try { await client.logout(); } catch { /* ignore */ }
    }

    return result;
  }

  /**
   * Extrai anexos .xml de uma mensagem parseada.
   * Filtra por extensão (case-insensitive) e valida conteúdo mínimo.
   */
  private extractXmlAttachments(
    mail: ParsedMail,
  ): Array<{ name: string; content: string }> {
    const result: Array<{ name: string; content: string }> = [];
    if (!mail.attachments || mail.attachments.length === 0) return result;

    for (const att of mail.attachments) {
      const name = (att.filename || '').toLowerCase();
      if (!name.endsWith('.xml')) continue;

      // Converte buffer p/ string UTF-8
      const content = att.content.toString('utf-8');

      // Validação mínima: deve conter pelo menos 1 tag XML
      if (!content.includes('<') || content.length < 50) continue;

      result.push({
        name: att.filename || `nfse-${Date.now()}.xml`,
        content,
      });
    }

    return result;
  }
}
// =================================================================
// FIM: email-collector.service.ts
// =================================================================