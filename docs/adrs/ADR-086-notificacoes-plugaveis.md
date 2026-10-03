
---

### 📂 `docs/adrs/ADR-086-notificacoes-plugaveis.md`

```markdown
# ADR-086: Notificações Plugáveis via Fetch Nativo (Zero Deps)

**Data:** 2026-08-27  
**Status:** ✅ Aceita  
**Decisor:** Marcos Toledo  
**Reversível:** Sim

---

## 📋 Contexto

O sistema precisa enviar notificações por múltiplos canais:
- Email (SendGrid, SMTP)
- SMS (Twilio)
- WhatsApp (futuro)
- Log (para desenvolvimento)

**Problema:**
- SDKs oficiais de cada provedor adicionam dependências pesadas
- SDKs frequentemente quebram com mudanças de versão
- Dificuldade de testar sem credenciais reais

## 🎯 Decisão

Implementar notificações via **`fetch` nativo do Node.js** (zero deps), com interface plugável e **MODO LOG** como padrão seguro.

### Regras:

1. **Interface Plugável:**
   ```typescript
   interface NotificationProvider {
     readonly nome: 'sendgrid' | 'twilio' | 'log';
     enviar(payload: NotificationPayload): Promise<NotificationResult>;
   }

2. Zero Dependências Externas:
Email: fetch direto para API REST do SendGrid
SMS: fetch direto para API REST do Twilio
Log: Apenas console.log + arquivo local

3. MODO LOG como Padrão:
Se EMAIL_PROVIDER ou SMS_PROVIDER não estiver definido no .env, usa LOG
Nunca envia notificação real acidentalmente

4. Falha Real = FALHOU:
Se o provedor retornar erro, status = FALHOU (sem fallback silencioso)
Retry automático apenas se configurado (ADR-117)

💡 Implementação

Interface do Provider
// backend/src/common/notifications/notification-provider.interface.ts

export interface NotificationPayload {
  canal: 'EMAIL' | 'SMS' | 'WHATSAPP';
  destinatario: string;
  assunto?: string; // Apenas EMAIL
  corpo: string;
  anexos?: { nome: string; conteudo: Buffer; mime: string }[];
}

export interface NotificationResult {
  ok: boolean;
  externalId?: string; // ID no provedor (ex: messageId do SendGrid)
  erro?: string;
}

export interface NotificationProvider {
  readonly nome: string;
  enviar(payload: NotificationPayload): Promise<NotificationResult>;
}

Provider: SendGrid (Email)

// backend/src/common/notifications/providers/sendgrid.provider.ts

export class SendgridProvider implements NotificationProvider {
  readonly nome = 'sendgrid';
  
  constructor(private apiKey: string, private fromEmail: string) {}

  async enviar(payload: NotificationPayload): Promise<NotificationResult> {
    if (payload.canal !== 'EMAIL') {
      return { ok: false, erro: 'SendGrid suporta apenas EMAIL' };
    }

    try {
      const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          personalizations: [{ to: [{ email: payload.destinatario }] }],
          from: { email: this.fromEmail },
          subject: payload.assunto,
          content: [{ type: 'text/html', value: payload.corpo }],
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        return { ok: false, erro: `SendGrid ${response.status}: ${errorText}` };
      }

      // SendGrid retorna messageId no header
      const messageId = response.headers.get('x-message-id');
      return { ok: true, externalId: messageId || undefined };
    } catch (error) {
      return { ok: false, erro: `Erro de rede: ${error.message}` };
    }
  }
}

Provider: Twilio (SMS)
// backend/src/common/notifications/providers/twilio.provider.ts

export class TwilioProvider implements NotificationProvider {
  readonly nome = 'twilio';

  constructor(
    private accountSid: string,
    private authToken: string,
    private fromNumber: string
  ) {}

  async enviar(payload: NotificationPayload): Promise<NotificationResult> {
    if (payload.canal !== 'SMS') {
      return { ok: false, erro: 'Twilio suporta apenas SMS' };
    }

    try {
      const url = `https://api.twilio.com/2010-04-01/Accounts/${this.accountSid}/Messages.json`;
      const auth = Buffer.from(`${this.accountSid}:${this.authToken}`).toString('base64');

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          From: this.fromNumber,
          To: payload.destinatario,
          Body: payload.corpo,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        return { ok: false, erro: `Twilio ${response.status}: ${errorText}` };
      }

      const data = await response.json();
      return { ok: true, externalId: data.sid };
    } catch (error) {
      return { ok: false, erro: `Erro de rede: ${error.message}` };
    }
  }
}

Provider: Log (Desenvolvimento)
// backend/src/common/notifications/providers/log.provider.ts

import * as fs from 'fs';
import * as path from 'path';

export class LogProvider implements NotificationProvider {
  readonly nome = 'log';

  async enviar(payload: NotificationPayload): Promise<NotificationResult> {
    const logEntry = {
      timestamp: new Date().toISOString(),
      canal: payload.canal,
      destinatario: payload.destinatario,
      assunto: payload.assunto,
      corpo: payload.corpo.substring(0, 200) + '...', // Truncar
    };

    // Console
    console.log('[NOTIFICATION LOG]', logEntry);

    // Arquivo
    const logDir = path.join(process.cwd(), 'logs', 'notifications');
    fs.mkdirSync(logDir, { recursive: true });
    const logFile = path.join(logDir, `${new Date().toISOString().split('T')[0]}.json`);
    fs.appendFileSync(logFile, JSON.stringify(logEntry) + '\n');

    return { ok: true, externalId: `log-${Date.now()}` };
  }
}

Factory de Providers

// backend/src/common/notifications/notification-provider.factory.ts

@Injectable()
export class NotificationProviderFactory {
  constructor(private config: ConfigService) {}

  criar(canal: 'EMAIL' | 'SMS' | 'WHATSAPP'): NotificationProvider {
    switch (canal) {
      case 'EMAIL':
        const emailProvider = this.config.get('EMAIL_PROVIDER', 'log');
        if (emailProvider === 'sendgrid') {
          return new SendgridProvider(
            this.config.get('SENDGRID_API_KEY'),
            this.config.get('EMAIL_FROM_ADDRESS')
          );
        }
        return new LogProvider();

      case 'SMS':
        const smsProvider = this.config.get('SMS_PROVIDER', 'log');
        if (smsProvider === 'twilio') {
          return new TwilioProvider(
            this.config.get('TWILIO_ACCOUNT_SID'),
            this.config.get('TWILIO_AUTH_TOKEN'),
            this.config.get('TWILIO_FROM_NUMBER')
          );
        }
        return new LogProvider();

      default:
        return new LogProvider();
    }
  }
}

Variáveis de Ambiente

# backend/.env

# Email (padrão: log)
EMAIL_PROVIDER=log  # ou 'sendgrid'
SENDGRID_API_KEY=
EMAIL_FROM_ADDRESS=noreply@contacerta.com.br

# SMS (padrão: log)
SMS_PROVIDER=log  # ou 'twilio'
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_FROM_NUMBER=+5511999999999

✅ Consequências

Positivas

✅ Zero Dependências: Não instala SDKs pesados
✅ Seguro por Padrão: MODO LOG evita envios acidentais
✅ Testável: Provider Log permite testes sem credenciais
✅ Flexível: Fácil adicionar novos provedores

Negativas

❌ Implementação Manual: Precisa conhecer a API REST de cada provedor
❌ Sem Retry Nativo: Precisa implementar retry manualmente (ou usar ADR-117)

📚 Referências

Arquivos que usam esta ADR:

backend/src/common/notifications/ (interface, providers, factory)
backend/src/billing/services/cobranca-regua.service.ts
backend/src/comunicados/services/email-envio.service.ts

ADRs relacionadas:

ADR-085 (Arquitetura híbrida Billing)
ADR-116 (Envio plugável no módulo de comunicações — versão especializada)

🔄 Histórico de Revisões

Data                Autor                   Mudança
2026-08-27          Marcos Toledo           Criação inicial (Sprint FD-5)