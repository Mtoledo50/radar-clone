# 📧 Módulo de Envio com Tracking de Comunicações — Documentação Técnica

**Sprint F13 | Status: Em desenvolvimento | ADRs: 113–119**

Este documento especifica em detalhe o módulo de envio automatizado de documentos
com rastreamento de entrega, abertura e download (estilo Acessorias, superior).

---

## 📋 Índice

1. [Visão Geral e Objetivos](#1-visão-geral-e-objetivos)
2. [Arquitetura do Módulo](#2-arquitetura-do-módulo)
3. [Modelo de Dados (Prisma)](#3-modelo-de-dados-prisma)
4. [Watch Folder Service (ADR-113)](#4-watch-folder-service-adr-113)
5. [Parser de CNPJ (ADR-118)](#5-parser-de-cnpj-adr-118)
6. [Provedores de Email (ADR-116)](#6-provedores-de-email-adr-116)
7. [Sistema de Tracking (ADR-114)](#7-sistema-de-tracking-adr-114)
8. [Templates de Email (ADR-115)](#8-templates-de-email-adr-115)
9. [API — Especificação de Endpoints](#9-api--especificação-de-endpoints)
10. [Máquina de Estados](#10-máquina-de-estados)
11. [Política de Retry](#11-política-de-retry)
12. [Frontend — Telas do Módulo](#12-frontend--telas-do-módulo)
13. [Segurança e LGPD](#13-segurança-e-lgpd)
14. [Configuração (.env)](#14-configuração-env)
15. [Guia de Testes (MODO LOG)](#15-guia-de-testes-modo-log)

---

## 1. Visão Geral e Objetivos

### Problema que resolve
Eliminação da digitação manual de emails e do controle informal de entregas
de documentos fiscais (DAS, DARF, ISS, FGTS, informes, balancetes).

### Fluxo de valor
Arquivo cai na pasta → Sistema identifica cliente pelo CNPJ →
Busca email cadastrado → Humano aprova (ADR-030) → Email enviado com anexo/link →
Arquivo movido para enviados/YYYY-MM/ → Painel mostra: enviado? entregue?
abriu? baixou? quando? por qual setor?



### Métricas de sucesso
| Métrica | Antes | Depois (meta) |
|---------|-------|---------------|
| Tempo por envio manual | ~4 min | ~20 s (aprovação) |
| Clientes/mês atendidos | 200 | 200 (sem esforço extra) |
| Horas economizadas/mês | — | ~400 h |
| Rastreabilidade de entrega | 0% | 100% |

### Limitações técnicas honestas (documentar sempre)
| Evento | Confiabilidade | Motivo |
|--------|----------------|--------|
| Enviado | ✅ 100% | SMTP/SendGrid confirma |
| Entregue | ⚠️ 90–95% | Spam/quarentena/rejeição |
| Aberto | ⚠️ 40–60% | Pixel bloqueado por Gmail/Outlook/iOS |
| Baixado | ✅ 100% | Link proxy registra deterministicamente |
| PDF visualizado no dispositivo | ❌ 0% | Impossível pelo protocolo |

> ⚠️ **Regra de comunicação**: Nunca prometer ao cliente "confirmação de leitura".
> O tracking de abertura é **estatístico**; o de download é **determinístico**.

---

## 2. Arquitetura do Módulo
┌────────────────────────────────────────────────────────────────────┐
│ BACKEND NESTJS (:3001) │
│ │
│ ┌─────────────────┐ ┌──────────────────┐ │
│ │ WatchFolderSvc │───►│ CnpjParserSvc │ │
│ │ (chokidar) │ │ (regex+checksum) │ │
│ │ ADR-113 │ │ ADR-118 │ │
│ └────────┬────────┘ └────────┬─────────┘ │
│ │ │ │
│ ▼ ▼ │
│ ┌─────────────────────────────────────────┐ │
│ │ ArquivoFilaService │ │
│ │ (fila de detecção + vínculo cliente) │ │
│ └────────────────┬────────────────────────┘ │
│ │ (humano aprova — ADR-030/117) │
│ ▼ │
│ ┌─────────────────────────────────────────┐ │
│ │ EmailEnvioService │ │
│ │ (monta email, renderiza template, │ │
│ │ injeta pixel, gera token download) │ │
│ └────────┬───────────────────┬────────────┘ │
│ │ │ │
│ ▼ ▼ │
│ ┌─────────────────┐ ┌───────────────────┐ │
│ │ EmailProvider │ │ FileMoverSvc │ │
│ │ sendgrid|smtp| │ │ enviados/YYYY-MM/ │ │
│ │ log (ADR-116) │ │ (ADR-119) │ │
│ └─────────────────┘ └───────────────────┘ │
│ │
│ ┌─────────────────────────────────────────┐ │
│ │ TrackingController (PÚBLICO, sem auth)│ │
│ │ GET /track/open/:id → pixel │ │
│ │ GET /track/download/:id/:t → arquivo │ │
│ └─────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────────────┘


### Estrutura de pastas no backend
backend/src/
├── comunicados/ # 🆕 Módulo raiz
│ ├── comunicados.module.ts
│ ├── watch-folder/
│ │ ├── watch-folder.service.ts # chokidar + debounce
│ │ ├── watch-folder.controller.ts # status/controles
│ │ └── watch-folder.config.ts
│ ├── cnpj-parser/
│ │ ├── cnpj-parser.service.ts # regex + validação checksum
│ │ └── cnpj-parser.spec.ts
│ ├── arquivo-fila/
│ │ ├── arquivo-fila.service.ts
│ │ ├── arquivo-fila.controller.ts
│ │ └── dto/
│ ├── email-envio/
│ │ ├── email-envio.service.ts
│ │ ├── email-envio.controller.ts
│ │ ├── email-provider/
│ │ │ ├── email-provider.interface.ts
│ │ │ ├── sendgrid.provider.ts
│ │ │ ├── smtp.provider.ts
│ │ │ └── log.provider.ts
│ │ └── dto/
│ ├── email-template/
│ │ ├── email-template.service.ts # Handlebars
│ │ ├── email-template.controller.ts
│ │ └── dto/
│ ├── tracking/
│ │ ├── tracking.controller.ts # endpoints públicos
│ │ └── tracking.service.ts
│ └── file-mover/
│ └── file-mover.service.ts


### Estrutura de pastas monitorada (ADR-119)
{WATCH_FOLDER_PATH}/ ex: C:\Documentos\Enviar
├── (raiz) → arquivos aguardando processamento
├── enviados/
│ └── 2026-09/ → subpasta por competência/mês (auditoria)
├── pendentes/ → cliente identificado, aguardando aprovação
├── rejeitados/ → rejeitados pelo humano (com motivo)
└── erros/ → CNPJ não encontrado / cliente sem email


---

## 3. Modelo de Dados (Prisma)

prisma
// backend/prisma/schema.prisma — adições da Sprint F13
enum StatusEnvio {
PENDENTE_APROVACAO
AGENDADO
ENVIANDO
ENVIADO
FALHOU
CANCELADO
}
enum TipoEventoEmail {
ENVIADO
ENTREGUE
ABERTO
BAIXADO
FALHA
REENVIO
CANCELADO
}
enum StatusArquivoFila {
DETECTADO
CLIENTE_IDENTIFICADO
SEM_CLIENTE
SEM_EMAIL
AGUARDANDO_APROVACAO
APROVADO
REJEITADO
ENVIADO
ARQUIVADO
ERRO
}
model EmailTemplate {
id String @id @default(uuid())
companyId String
nome String
tipoDocumento String // DAS | DARF | ISS | FGTS | IRPF | BALANCETE | GENERICO
assunto String
corpoHtml String @db.Text
ativo Boolean @default(true)
createdAt DateTime @default(now())
updatedAt DateTime @updatedAt
company Company @relation(fields: [companyId], references: [id])
@@unique([companyId, tipoDocumento])
@@map("email_templates")
}
model EmailEnvio {
id String @id @default(uuid())
companyId String
clienteId String?
clienteNome String
clienteCnpj String? @db.VarChar(18)
emailDestinatario String
assunto String
corpoHtml String @db.Text
templateId String?
anexos Json // [{nomeOriginal, caminhoRelativo, tamanhoBytes, mime}]
status StatusEnvio @default(PENDENTE_APROVACAO)
setor String? // Fiscal | Contábil | Pessoal | ...
tentativas Int @default(0)
ultimoErro String? @db.Text
tokenDownload String @unique @default(uuid())
linkExpiraEm DateTime?
aprovadoPor String? // userId (ADR-030)
aprovadoEm DateTime?
enviadoPor String? // userId
enviadoEm DateTime?
primeiraAberturaEm DateTime?
primeiroDownloadEm DateTime?
createdAt DateTime @default(now())
updatedAt DateTime @updatedAt
company Company @relation(fields: [companyId], references: [id])
eventos EmailEvento[]
@@index([companyId, status])
@@index([companyId, createdAt])
@@index([tokenDownload])
@@map("email_envios")
}
model EmailEvento {
id String @id @default(uuid())
envioId String
tipo TipoEventoEmail
ip String?
userAgent String? @db.Text
metadata Json? // {tentativa, erro, emailProvider, ...}
createdAt DateTime @default(now())
envio EmailEnvio @relation(fields: [envioId], references: [id], onDelete: Cascade)
@@index([envioId, createdAt])
@@map("email_eventos")
}
model ArquivoFila {
id String @id @default(uuid())
companyId String
nomeOriginal String
caminhoAbsoluto String
tamanhoBytes Int
mime String?
cnpjDetectado String? @db.VarChar(18)
clienteId String?
clienteEmail String?
confianca Float @default(0) // 0..1 match do parser
tipoDocumento String? // inferido do nome (DAS, DARF...)
competencia String? // inferido do nome (2026-01)
status StatusArquivoFila @default(DETECTADO)
motivoRejeicao String? @db.Text
erro String? @db.Text
envioId String? // vínculo após aprovação
createdAt DateTime @default(now())
updatedAt DateTime @updatedAt
@@index([companyId, status])
@@map("arquivos_fila")
}


### Migração
```bash
cd backend
npx prisma migrate dev --name add_modulo_comunicados_f13
npx prisma generate

4. Watch Folder Service (ADR-113)
Responsabilidades
Monitorar WATCH_FOLDER_PATH em tempo real (chokidar)
Ignorar temporários: ~$*, *.tmp, *.part, *.crdownload, ocultos
Debounce de escrita (aguardar arquivo estabilizar antes de processar)
Evitar duplicidade (hash do caminho + tamanho já processado)
Criar ArquivoFila e disparar pipeline de identificação
Implementação de referência

// watch-folder.service.ts
import * as chokidar from 'chokidar';
import { FSWatcher } from 'chokidar';

@Injectable()
export class WatchFolderService implements OnModuleInit, OnModuleDestroy {
  private watcher: FSWatcher | null = null;
  private processados = new Set<string>();
  public iniciadoEm: Date | null = null;
  public arquivosDetectados = 0;

  onModuleInit() {
    if (this.config.WATCH_FOLDER_ENABLED === 'true') this.iniciar();
  }

  onModuleDestroy() { this.parar(); }

  iniciar() {
    const pasta = this.config.WATCH_FOLDER_PATH;
    fs.mkdirSync(pasta, { recursive: true });

    this.watcher = chokidar.watch(pasta, {
      ignoreInitial: true,
      depth: 0,                       // só a raiz (subpastas são de saída)
      ignored: [
        /(^|[\/\\])\../,              // ocultos
        /~\$.*$/,                     // temporários Office/LibreOffice
        /\.(tmp|part|crdownload|download)$/i,
      ],
      awaitWriteFinish: {
        stabilityThreshold: 2000,     // espera 2s sem alteração de tamanho
        pollInterval: 200,
      },
    });

    this.watcher.on('add', (caminho) => this.aoDetectar(caminho));
    this.iniciadoEm = new Date();
    this.logger.log(`Watch Folder ativo em: ${pasta}`);
  }

  parar() { this.watcher?.close(); this.watcher = null; }

  private async aoDetectar(caminho: string) {
    const chave = `${caminho}:${fs.statSync(caminho).size}`;
    if (this.processados.has(chave)) return;
    this.processados.add(chave);
    this.arquivosDetectados++;
    await this.arquivoFilaService.registrarDetecao(caminho);
  }

  status() {
    return {
      ativo: this.watcher !== null,
      pasta: this.config.WATCH_FOLDER_PATH,
      iniciadoEm: this.iniciadoEm,
      arquivosDetectados: this.arquivosDetectados,
    };
  }
}

Regras de negócio

Regra
Comportamento
Arquivo sem CNPJ no nome
status = ERRO, move para erros/, alerta no painel
CNPJ válido mas sem cliente
status = SEM_CLIENTE, move para erros/, permite vínculo manual
Cliente sem email
status = SEM_EMAIL, alerta "cadastre email do cliente"
Arquivo duplicado (mesmo nome+tamanho em 24h)
Ignora e loga aviso

Watcher desativado
Upload manual via tela continua funcionando

5. Parser de CNPJ (ADR-118)
Regex de extração (aceita com/sem pontuação, com/sem hífen/slash)

const REGEX_CNPJ = /\b(\d{2}[.\-\/]?\d{3}[.\-\/]?\d{3}[.\-\/]?\d{4}[.\-\/]?\d{2})\b/g;

Validação por dígito verificador
// cnpj-parser.service.ts
export function cnpjEhValido(bruto: string): boolean {
  const c = bruto.replace(/\D/g, '');
  if (c.length !== 14 || /^(\d)\1{13}$/.test(c)) return false;

  const digito = (base: string, pesos: number[]) => {
    const soma = base.split('').reduce(
      (acc, d, i) => acc + parseInt(d, 10) * pesos[i], 0);
    const resto = soma % 11;
    return resto < 2 ? 0 : 11 - resto;
  };

  const P1 = [5,4,3,2,9,8,7,6,5,4,3,2];
  const P2 = [6,5,4,3,2,9,8,7,6,5,4,3,2];
  const base = c.slice(0, 12);
  return `${digito(base, P1)}${digito(base + digito(base, P1), P2)}` === c.slice(12);
}

Extração de metadados do nome do arquivo

// Exemplos suportados:
//   DAS_12345678000195_JAN2026.pdf
//   12.345.678-0001-95-DARF-012026.pdf
//   informe_rendimento_12345678000195_2026.pdf

interface MetadadosArquivo {
  cnpj: string | null;          // somente dígitos
  tipoDocumento: string | null; // DAS|DARF|ISS|FGTS|IRPF|BALANCETE|GENERIC
  competencia: string | null;   // 'YYYY-MM'
}


Padrão de competência
Regex
Exemplo → resultado
Mês ano juntos
(\d{2})(20\d{2})
012026 → 2026-01
Mês por extenso
(jan|fev|mar|...|dez)[-_ ]?(20\d{2})
JAN2026 → 2026-01
Ano sozinho
(20\d{2})
2026 → 2026-12 (assume anual, ex: IRPF)


Confiança do match

confianca = 1.0  → CNPJ válido (checksum OK) + cliente encontrado no banco
confianca = 0.7  → CNPJ válido, cliente encontrado, mas email vazio
confianca = 0.3  → CNPJ inválido (checksum falhou) → exige revisão humana
confianca = 0.0  → nenhum CNPJ detectado

Regra: confianca < 1.0 sempre exige aprovação humana explícita (ADR-030).

6. Provedores de Email (ADR-116)
Interface plugável

// email-provider.interface.ts
export interface PayloadEnvio {
  para: string;
  assunto: string;
  html: string;
  anexos?: { nome: string; conteudo: Buffer; mime: string }[];
  headers?: Record<string, string>;   // ex: X-Entity-Ref-ID p/ agrupar threads
}

export interface ResultadoEnvio {
  ok: boolean;
  messageId?: string;
  erro?: string;
}

export interface EmailProvider {
  readonly nome: 'sendgrid' | 'smtp' | 'log';
  enviar(p: PayloadEnvio): Promise<ResultadoEnvio>;
}

Os 3 provedores

Provedor
Quando usar
Comportamento
log
Desenvolvimento/testes
Imprime payload no console + salva em logs/emails/*.html. Nunca envia de verdade
smtp
Produção econômica
Nodemailer com SMTP_HOST/PORT/USER/PASS
sendgrid
Produção recomendada
API v3 via HTTP, suporta webhooks de entrega


Seleção por configuração
@Injectable()
export class EmailProviderFactory {
  criar(): EmailProvider {
    switch (this.config.EMAIL_PROVIDER) {
      case 'sendgrid': return new SendgridProvider(this.config);
      case 'smtp':     return new SmtpProvider(this.config);
      default:         return new LogProvider(this.logger);   // seguro por padrão
    }
  }
}


⚠️ Segurança por padrão: se EMAIL_PROVIDER não estiver definido,
o sistema opera em log — nunca envia email real acidentalmente.

Anexo grande (> 10 MB)
Se tamanhoBytes > 10MB, não anexar: substituir por link proxy de download
no corpo do email (o tracking de download continua 100% confiável).
7. Sistema de Tracking (ADR-114)
7.1 Tracking Pixel (abertura)

// tracking.controller.ts
const PIXEL_GIF = Buffer.from(
  'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64');

@Controller('track')
export class TrackingController {

  @Get('open/:envioId')
  @Header('Content-Type', 'image/gif')
  @Header('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
  @Header('Pragma', 'no-cache')
  async abrir(@Param('envioId') id: string, @Req() req: Request, @Res() res: Response) {
    await this.tracking.registrar(id, 'ABERTO', {
      ip: req.ip,
      userAgent: req.headers['user-agent'] ?? null,
    });
    res.status(200).send(PIXEL_GIF);
  }
}

Injeção automática no HTML (antes do </body>):
<img src="{PUBLIC_BASE_URL}/track/open/{envioId}" width="1" height="1"
     alt="" style="display:none" />

Deduplicação: múltiplas aberturas do mesmo IP/user-agent em < 1h
geram 1 evento; aberturas posteriores apenas atualizam contadores.
7.2 Link Proxy (download — determinístico)

@Get('download/:envioId/:token')
async baixar(@Param() p, @Req() req, @Res() res) {
  const envio = await this.envios.buscarPorToken(p.envioId, p.token);
  if (!envio) throw new NotFoundException();

  if (envio.linkExpiraEm && envio.linkExpiraEm < new Date()) {
    return res.status(410).send('Link expirado. Solicite novo envio.');
  }
  if (envio.status === 'CANCELADO') {
    return res.status(403).send('Documento indisponível.');
  }

  await this.tracking.registrar(envio.id, 'BAIXADO', {
    ip: req.ip, userAgent: req.headers['user-agent'] ?? null,
  });

  const anexo = envio.anexos[0];
  res.download(caminhoAbsoluto(anexo), anexo.nomeOriginal);
}

7.3 Eventos registrados
Evento
Gatilho
Confiabilidade
ENVIADO
Provider retornou ok
100%
ENTREGUE
Webhook SendGrid delivered (se sendgrid)
~95%
ABERTO
Pixel carregado
40–60%
BAIXADO
Link proxy acessado
100%
FALHA
Provider retornou erro / bounce
100%
REENVIO
Humano clicou em reenviar
100%
CANCELADO
Humano cancelou
100%

7.4 Dependência de domínio público
O pixel só funciona com PUBLIC_BASE_URL acessível pela internet
(Cloudflare Tunnel). Sem tunnel: tracking de abertura desativado
graciosamente (loga aviso), download continua funcionando via portal.

8. Templates de Email (ADR-115)
Variáveis disponíveis (Handlebars)

{{cliente.nome}}            {{cliente.razaoSocial}}
{{cliente.cnpj}}            {{cliente.email}}
{{documento.tipo}}          {{documento.competencia}}
{{documento.nomeArquivo}}
{{link.download}}           {{link.expiraEm}}
{{empresa.nome}}            {{empresa.logoUrl}}
{{setor.nome}}              {{setor.responsavel}}
{{data.envio}}              {{usuario.nome}}

Template padrão (seed)
<div style="font-family:Arial,sans-serif;max-width:600px;margin:auto">
  <img src="{{empresa.logoUrl}}" alt="{{empresa.nome}}" style="max-width:180px"/>
  <h2>Olá, {{cliente.nome}}!</h2>
  <p>Segue o documento <strong>{{documento.tipo}}</strong>
     referente à competência <strong>{{documento.competencia}}</strong>.</p>
  <p>
    <a href="{{link.download}}"
       style="background:#0a66c2;color:#fff;padding:12px 24px;
              border-radius:6px;text-decoration:none">
       📥 Baixar documento
    </a>
  </p>
  <p style="color:#666;font-size:12px">
    Link válido até {{link.expiraEm}}.<br/>
    {{empresa.nome}} — {{setor.nome}}
  </p>
</div>


Resolução de template (ordem de precedência)

1. Template do tipoDocumento exato (ex: DAS) ativo para o companyId
2. Template GENERICO ativo para o companyId
3. Template GENERICO seed do sistema

Preview seguro
POST /api/email-templates/:id/preview renderiza com dados fictícios
(nunca dados reais de clientes) e retorna HTML para o editor.
9. API — Especificação de Endpoints
Base: http://localhost:3001 | Auth: Authorization: Bearer {jwt}
Exceto endpoints /track/* que são públicos por design.
9.1 Watch Folder

Método
Rota
Descrição
GET
/api/watch-folder/status
Status do watcher (ativo, pasta, contadores)
POST
/api/watch-folder/iniciar
Ativa watcher em runtime
POST
/api/watch-folder/parar
Desativa watcher
POST
/api/watch-folder/scan
Varredura manual da pasta (reprocessa raiz)

Resposta GET /api/watch-folder/status:

{
  "ativo": true,
  "pasta": "C:\\Documentos\\Enviar",
  "iniciadoEm": "2026-09-11T08:00:00Z",
  "arquivosDetectados": 14,
  "ignorados": ["~$relatorio.xlsx", "tmp123.tmp"]
}

9.2 Fila de Arquivos (aprovação humana — ADR-117)

Método
Rota
Descrição
GET
/api/arquivos-fila?status=&page=
Lista fila com filtros
GET
/api/arquivos-fila/:id
Detalhe + preview do email montado
POST
/api/arquivos-fila/:id/aprovar
Aprova e enfileira envio
POST
/api/arquivos-fila/aprovar-lote
Aprova vários {ids: []}
POST
/api/arquivos-fila/:id/rejeitar
Rejeita {motivo}
POST
/api/arquivos-fila/:id/vincular-cliente
Vínculo manual {clienteId}

Resposta GET /api/arquivos-fila/:id (preview completo

{
  "id": "uuid",
  "nomeOriginal": "DAS_12345678000195_JAN2026.pdf",
  "tamanhoBytes": 204800,
  "cnpjDetectado": "12.345.678/0001-95",
  "confianca": 1.0,
  "cliente": {
    "id": "uuid-cliente",
    "nome": "Empresa Exemplo Ltda",
    "email": "financeiro@exemplo.com.br",
    "setor": "Fiscal"
  },
  "tipoDocumento": "DAS",
  "competencia": "2026-01",
  "previewEmail": {
    "assunto": "DAS 01/2026 — Empresa Exemplo Ltda",
    "corpoHtml": "<html>...renderizado...</html>",
    "anexos": [{ "nome": "DAS_12345678000195_JAN2026.pdf", "tamanhoBytes": 204800 }]
  },
  "status": "AGUARDANDO_APROVACAO"
}

9.3 Envios

Método
Rota
Descrição
GET
/api/email-envios?status=&clienteId=&setor=&de=&ate=&page=
Lista com filtros
GET
/api/email-envios/:id
Detalhe do envio
GET
/api/email-envios/:id/eventos
Timeline de tracking
POST
/api/email-envios
Envio manual {clienteId, assunto, corpoHtml?, anexos[]}
POST
/api/email-envios/:id/reenviar
Reenvio manual (incrementa tentativas)
POST
/api/email-envios/:id/cancelar
Cancela (só se não ENVIADO)
GET
/api/email-envios/metricas?de=&ate=
Taxas: envio/entrega/abertura/download

Resposta GET /api/email-envios/:id/eventos:
{
  "envioId": "uuid",
  "timeline": [
    { "tipo": "ENVIADO",  "em": "2026-09-11T09:00:00Z", "metadata": { "provider": "sendgrid", "messageId": "..." } },
    { "tipo": "ENTREGUE", "em": "2026-09-11T09:00:12Z" },
    { "tipo": "ABERTO",   "em": "2026-09-11T10:14:33Z", "metadata": { "ip": "189.x.x.x", "userAgent": "Gmail-Image-Proxy" } },
    { "tipo": "BAIXADO",  "em": "2026-09-11T10:15:02Z", "metadata": { "ip": "189.x.x.x" } }
  ],
  "resumo": {
    "enviado": true, "entregue": true, "aberto": true, "baixado": true,
    "primeiraAberturaEm": "2026-09-11T10:14:33Z",
    "primeiroDownloadEm": "2026-09-11T10:15:02Z"
  }
}

9.4 Templates

Método
Rota
Descrição
GET
/api/email-templates
Lista templates do tenant
POST
/api/email-templates
Cria {nome, tipoDocumento, assunto, corpoHtml}
PUT
/api/email-templates/:id
Atualiza
DELETE
/api/email-templates/:id
Soft delete (ativo=false)
POST
/api/email-templates/:id/preview
Renderiza com dados fictícios


9.5 Tracking (PÚBLICO — sem auth)
Método
Rota
Retorno
GET
/track/open/:envioId
GIF 1x1 + registra ABERTO
GET
/track/download/:envioId/:token
Arquivo + registra BAIXADO

9.6 Configuração
Método
Rota
Descrição
GET
/api/config/comunicados
Configurações do módulo (mascara segredos)
PUT
/api/config/comunicados
Atualiza (só admin)
POST
/api/config/comunicados/testar-email
Envia email de teste {para}

10. Máquina de Estados
ArquivoFila
DETECTADO ──► CLIENTE_IDENTIFICADO ──► AGUARDANDO_APROVACAO ──► APROVADO ──► ENVIADO ──► ARQUIVADO
   │                  │                          │                  │
   │                  ├──► SEM_CLIENTE           ├──► REJEITADO     └──► (falha) ERRO
   │                  └──► SEM_EMAIL             │
   └──► ERRO (sem CNPJ)                          └──► (humano edita vínculo) ──► AGUARDANDO_APROVACAO

EmailEnvio

PENDENTE_APROVACAO ──► AGENDADO ──► ENVIANDO ──► ENVIADO
        │                 │            │  ▲         │
        │                 │            │  │         └──► (eventos: ENTREGUE/ABERTO/BAIXADO)
        │                 │            ▼  │
        │                 │           FALHOU ──► retry automático (máx 3)
        │                 │                        │
        └──► CANCELADO ◄──┴────────────────────────└──► FALHOU (definitivo após 3 tentativas)

11. Política de Retry
Tentativa
Espera
Ação
1ª falha
+1 min
Retry automático
2ª falha
+5 min
Retry automático
3ª falha
+15 min
Retry automático
4ª falha
—
status=FALHOU definitivo + alerta no painel + email interno ao setor

Implementação: fila com jobs agendados (BullMQ ou setTimeout persistente
via tabela email_envios.tentativas + cron de varredura a cada 60 s).
Bounce/inválido (erro 4xx do provider) não faz retry — falha imediatamente.

12. Frontend — Telas do Módulo
Rota
Tela
Conteúdo
/dashboard/comunicados/fila
Fila de aprovação
Cards com preview, botão Aprovar/Rejeitar/Vincular, aprovação em lote
/dashboard/comunicados/envios
Lista de envios
Tabela com filtros (status, setor, cliente, período), badges coloridos
/dashboard/comunicados/envios/:id
Detalhe + timeline
Timeline visual de eventos, dados do cliente, anexos, botão reenviar
/dashboard/comunicados/templates
Editor de templates
Editor HTML com variáveis + preview ao vivo
/dashboard/comunicados/config
Configurações
Pasta monitorada, provider, TTL de links, teste de email

Badges de status (padrão visual)
Status
Cor
PENDENTE_APROVACAO
🟡 âmbar
AGENDADO / ENVIANDO
🔵 azul
ENVIADO
🟢 verde
FALHOU
🔴 vermelho
CANCELADO
⚪ cinza
ABERTO
👁️ roxo
BAIXADO
⬇️ verde-escuro

13. Segurança e LGPD
Controle
Implementação
Token único por envio
tokenDownload UUID v4, não guessable
Expiração de link
linkExpiraEm = now + DOC_LINK_TTL_DAYS (default 7)
Sem enumeração
/track/download retorna 404 genérico para token inválido
Auditoria
Todo evento grava IP + userAgent + timestamp
Aprovação humana
aprovadoPor/aprovadoEm obrigatórios antes de ENVIADO (ADR-030)
Segredos
Chaves só em .env, nunca no banco ou no frontend (ADR-032/059)
Retenção
Eventos de tracking retidos 24 meses; depois anonimizados (IP/userAgent → null)
Base legal LGPD
Execução de contrato contábil + consentimento registrado no cadastro do cliente
Anexos em disco
Pasta enviados/ fora do docroot; acesso só via link proxy autenticado por token


14. Configuração (.env)
# ── Watch Folder (ADR-113) ─────────────────────────────
WATCH_FOLDER_ENABLED=true
WATCH_FOLDER_PATH=C:\Documentos\Enviar
WATCH_FOLDER_STABILITY_MS=2000

# ── Provider de email (ADR-116) ────────────────────────
# valores: log | smtp | sendgrid   (default seguro: log)
EMAIL_PROVIDER=log
SENDGRID_API_KEY=
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
SMTP_SECURE=false
EMAIL_FROM_NAME=Conta Certa
EMAIL_FROM_ADDRESS=noreply@contacerta.com.br

# ── Tracking (ADR-114) ─────────────────────────────────
PUBLIC_BASE_URL=https://radar-api.contacerta.com.br
DOC_LINK_TTL_DAYS=7
EMAIL_MAX_RETRY=3

# ── Anexos ─────────────────────────────────────────────
EMAIL_ANEXO_MAX_MB=10

15. Guia de Testes (MODO LOG)
Checklist de homologação da Sprint F13

[ ] 1.  Com EMAIL_PROVIDER=log, soltar DAS_12345678000195_JAN2026.pdf na pasta
[ ] 2.  Verificar ArquivoFila criado com cnpjDetectado + cliente + email
[ ] 3.  Verificar preview do email montado com template DAS
[ ] 4.  Aprovar → verificar EmailEnvio status ENVIADO e arquivo em enviados/2026-09/
[ ] 5.  Verificar log/emails/*.html gerado com pixel e link proxy injetados
[ ] 6.  Abrir o HTML salvo e clicar no link de download → evento BAIXADO registrado
[ ] 7.  Simular abertura: GET /track/open/{id} → evento ABERTO + GIF retornado
[ ] 8.  Soltar arquivo SEM CNPJ → status ERRO + pasta erros/
[ ] 9.  Soltar CNPJ válido de cliente SEM email → status SEM_EMAIL + alerta
[ ] 10. Rejeitar arquivo → pasta rejeitados/ + motivo salvo
[ ] 11. Link expirado (forçar linkExpiraEm passado) → HTTP 410
[ ] 12. Cancelar envio pendente → status CANCELADO + download bloqueado 403
[ ] 13. Métricas: GET /api/email-envios/metricas retorna taxas corretas
[ ] 14. Multi-tenant: arquivos de empresa A nunca aparecem para empresa B

Testes unitários obrigatórios
cd backend
npm run test -- cnpj-parser          # casos: válido, inválido, pontuado, duplicado
npm run test -- email-template       # render + variáveis ausentes
npm run test -- tracking             # dedup de abertura, expiração de token

📚 Referências cruzadas
ADR-030 (Regra de Ouro / Human-in-the-Loop)
ADR-113 a ADR-119 (decisões deste módulo)
CONTEXTO_PROJETO.md §3 (registro canônico de ADRs)
SYNC.md (integração Site ↔ Radar)
Autor: Marcos Toledo + IA assistente
Última atualização: 11/09/2026
Versão: 1.0.0


---

## 📋 **COMO COMMITAR**

```bash
cd radar-clone
mkdir -p docs
# crie docs/MODULO-ENVIO-TRACKING.md com o conteúdo acima
git add docs/MODULO-ENVIO-TRACKING.md
git commit -m "docs(comunicados): especificação técnica do módulo de envio com tracking (F13)"
git push origin main

