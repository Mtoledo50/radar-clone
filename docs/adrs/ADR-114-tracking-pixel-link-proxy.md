
---

### 📂 `docs/adrs/ADR-114-tracking-pixel-link-proxy.md`

```markdown
# ADR-114: Tracking Pixel 1x1 + Link Proxy Determinístico

**Data:** 2026-09  
**Status:** ✅ Aceita  
**Decisor:** Marcos Toledo  
**Reversível:** Sim

---

## 📋 Contexto

O módulo de Envio precisa rastrear se o cliente:
1. Abriu o e-mail
2. Baixou o anexo

**Problema:**
- Como rastrear abertura sem depender de plugins ou extensões?
- Como rastrear download de forma confiável (não estatística)?

## 🎯 Decisão

**Dois mecanismos complementares:**

1. **Tracking Pixel (Abertura):**
   - Imagem GIF 1x1 transparente injetada no HTML do e-mail
   - Quando cliente abre o e-mail, navegador carrega a imagem
   - Backend registra evento `ABERTO`

2. **Link Proxy (Download):**
   - Anexo não é enviado diretamente, mas como link para endpoint protegido
   - Quando cliente clica no link, backend registra evento `BAIXADO` e serve o arquivo

### Confiabilidade:
| Evento | Confiabilidade | Motivo |
|--------|----------------|--------|
| Enviado | ✅ 100% | SMTP/SendGrid confirma |
| Entregue | ⚠️ 90-95% | Spam/quarentena |
| Aberto | ⚠️ 40-60% | Pixel bloqueado por Gmail/Outlook |
| Baixado | ✅ 100% | Link proxy é determinístico |

## 💡 Implementação

### Tracking Pixel

```typescript
// backend/src/comunicados/tracking/tracking.controller.ts

const PIXEL_GIF = Buffer.from(
  'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
  'base64'
);

@Controller('track')
export class TrackingController {
  @Get('open/:envioId')
  @Header('Content-Type', 'image/gif')
  @Header('Cache-Control', 'no-store, no-cache, must-revalidate')
  async trackOpen(@Param('envioId') envioId: string, @Req() req: Request) {
    // Registrar evento ABERTO
    await this.prisma.emailEvento.create({
      data: {
        envioId,
        tipo: 'ABERTO',
        ip: req.ip,
        userAgent: req.headers['user-agent'],
      },
    });

    return PIXEL_GIF;
  }
}

Injeção no HTML do E-mail

// backend/src/comunicados/email-envio/email-envio.service.ts

private injetarPixel(html: string, envioId: string): string {
  const pixelUrl = `${process.env.PUBLIC_BASE_URL}/track/open/${envioId}`;
  const pixelHtml = `<img src="${pixelUrl}" width="1" height="1" alt="" style="display:none" />`;
  
  // Injetar antes de </body>
  return html.replace('</body>', `${pixelHtml}</body>`);
}

Link Proxy

// backend/src/comunicados/tracking/tracking.controller.ts

@Get('download/:envioId/:token')
async trackDownload(
  @Param('envioId') envioId: string,
  @Param('token') token: string,
  @Req() req: Request,
  @Res() res: Response
) {
  // Buscar envio por token
  const envio = await this.prisma.emailEnvio.findFirst({
    where: { id: envioId, tokenDownload: token },
  });

  if (!envio) {
    throw new NotFoundException('Link inválido');
  }

  // Verificar expiração
  if (envio.linkExpiraEm && envio.linkExpiraEm < new Date()) {
    return res.status(410).send('Link expirado');
  }

  // Registrar evento BAIXADO
  await this.prisma.emailEvento.create({
    data: {
      envioId,
      tipo: 'BAIXADO',
      ip: req.ip,
      userAgent: req.headers['user-agent'],
    },
  });

  // Servir arquivo
  const anexo = envio.anexos[0];
  res.download(anexo.caminhoAbsoluto, anexo.nomeOriginal);
}

Geração de Token Único

// backend/src/comunicados/email-envio/email-envio.service.ts

async criarEnvio(data: CreateEmailEnvioDto) {
  const tokenDownload = crypto.randomUUID();
  const linkExpiraEm = addDays(new Date(), 7); // 7 dias

  const envio = await this.prisma.emailEnvio.create({
    data: {
      ...data,
      tokenDownload,
      linkExpiraEm,
      status: 'ENVIADO',
    },
  });

  return envio;
}

✅ Consequências

Positivas

✅ Download 100% Confiável: Link proxy é determinístico
✅ Abertura Estatística: Pixel funciona em ~50% dos casos (melhor que nada)
✅ Seguro: Token único + expiração evita acesso não autorizado

Negativas

❌ Abertura Não Garantida: Gmail/Outlook bloqueiam pixels por padrão
❌ Dependência de Domínio Público: Pixel exige PUBLIC_BASE_URL acessível (Cloudflare Tunnel)

📚 Referências

Arquivos que usam esta ADR:

backend/src/comunicados/tracking/tracking.controller.ts
backend/src/comunicados/email-envio/email-envio.service.ts

ADRs relacionadas:

ADR-113 (Watch Folder)
ADR-115 (Templates Handlebars)

🔄 Histórico de Revisões

Data                Autor               Mudança
2026-09             Marcos Toledo       Criação inicial (Sprint F15)

