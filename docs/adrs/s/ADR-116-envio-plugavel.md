
---

### 📂 `docs/adrs/ADR-116-envio-plugavel.md`

```markdown
# ADR-116: Envio Plugável (SendGrid / SMTP Próprio / MODO LOG)

**Data:** 2026-09  
**Status:** ✅ Aceita  
**Decisor:** Marcos Toledo  
**Reversível:** Sim

---

## 📋 Contexto

O módulo de Envio precisa suportar múltiplos provedores de e-mail:
- SendGrid (recomendado para produção)
- SMTP próprio (para quem tem servidor)
- MODO LOG (para desenvolvimento/testes)

**Problema:**
- SDKs de cada provedor adicionam dependências
- Dificuldade de testar sem credenciais reais

## 🎯 Decisão

Implementar **interface plugável** com 3 providers:

1. **SendGrid:** API REST via `fetch` nativo (zero deps)
2. **SMTP:** Nodemailer (dependência leve)
3. **LOG:** Apenas console + arquivo (padrão seguro)

### Regras:
1. **MODO LOG como Padrão:** Se `EMAIL_PROVIDER` não definido, usa LOG
2. **Zero Dependências para SendGrid:** `fetch` nativo do Node.js
3. **Falha Real = FALHOU:** Sem fallback silencioso

## 💡 Implementação

### Interface do Provider

```typescript
// backend/src/comunicados/email-envio/providers/email-provider.interface.ts

export interface EmailPayload {
  para: string;
  assunto: string;
  html: string;
  anexos?: { nome: string; conteudo: Buffer; mime: string }[];
}

export interface EmailResult {
  ok: boolean;
  messageId?: string;
  erro?: string;
}

export interface EmailProvider {
  readonly nome: 'sendgrid' | 'smtp' | 'log';
  enviar(payload: EmailPayload): Promise<EmailResult>;
}

Provider: SendGrid

// backend/src/comunicados/email-envio/providers/sendgrid.provider.ts

export class SendgridProvider implements EmailProvider {
  readonly nome = 'sendgrid';

  constructor(private apiKey: string, private fromEmail: string) {}

  async enviar(payload: EmailPayload): Promise<EmailResult> {
    try {
      const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          personalizations: [{ to: [{ email: payload.para }] }],
          from: { email: this.fromEmail },
          subject: payload.assunto,
          content: [{ type: 'text/html', value: payload.html }],
        }),
      });

      if (!response.ok) {
        return { ok: false, erro: `SendGrid ${response.status}` };
      }

      const messageId = response.headers.get('x-message-id');
      return { ok: true, messageId: messageId || undefined };
    } catch (error) {
      return { ok: false, erro: error.message };
    }
  }
}

Provider: LOG (Padrão Seguro)

// backend/src/comunicados/email-envio/providers/log.provider.ts

export class LogProvider implements EmailProvider {
  readonly nome = 'log';

  async enviar(payload: EmailPayload): Promise<EmailResult> {
    console.log('[EMAIL LOG]', {
      para: payload.para,
      assunto: payload.assunto,
      html: payload.html.substring(0, 200) + '...',
    });

    // Salvar em arquivo para debug
    const logDir = path.join(process.cwd(), 'logs', 'emails');
    fs.mkdirSync(logDir, { recursive: true });
    const logFile = path.join(logDir, `${Date.now()}.html`);
    fs.writeFileSync(logFile, payload.html);

    return { ok: true, messageId: `log-${Date.now()}` };
  }
}

Factory

// backend/src/comunicados/email-envio/providers/email-provider.factory.ts

@Injectable()
export class EmailProviderFactory {
  constructor(private config: ConfigService) {}

  criar(): EmailProvider {
    const provider = this.config.get('EMAIL_PROVIDER', 'log');

    switch (provider) {
      case 'sendgrid':
        return new SendgridProvider(
          this.config.get('SENDGRID_API_KEY'),
          this.config.get('EMAIL_FROM_ADDRESS')
        );
      
      case 'smtp':
        return new SmtpProvider({
          host: this.config.get('SMTP_HOST'),
          port: this.config.get('SMTP_PORT'),
          user: this.config.get('SMTP_USER'),
          pass: this.config.get('SMTP_PASS'),
        });
      
      default:
        return new LogProvider();
    }
  }
}

Variáveis de Ambiente

# backend/.env
EMAIL_PROVIDER=log  # ou 'sendgrid' ou 'smtp'
SENDGRID_API_KEY=
EMAIL_FROM_ADDRESS=noreply@contacerta.com.br

SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=

✅ Consequências

Positivas

✅ Flexível: Troca de provedor via .env
✅ Seguro: LOG como padrão evita envios acidentais
✅ Testável: LOG permite testes sem credenciais

Negativas

❌ Implementação Manual: Precisa conhecer API de cada provedor

📚 Referências

Arquivos que usam esta ADR:

backend/src/comunicados/email-envio/providers/
backend/src/comunicados/email-envio/email-envio.service.ts

ADRs relacionadas:

ADR-086 (Notificações plugáveis — versão generalizada)
ADR-115 (Templates Handlebars)

🔄 Histórico de Revisões

Data            Autor               Mudança
2026-09         Marcos Toledo       Criação inicial (Sprint F15)

