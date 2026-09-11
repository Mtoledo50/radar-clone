# 🔌 API do Radar — Guia e Convenções

**Como expor, documentar e consumir a API do Radar (NestJS :3001).**

---

## 1. Ativação do Swagger UI

### 1.1 Instalar dependências
```bash
cd backend
npm install @nestjs/swagger
```

### 1.2 Configurar `main.ts`
```ts
// backend/src/main.ts
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));

  const config = new DocumentBuilder()
    .setTitle('Radar Conta Certa API')
    .setDescription(
      'API oficial do Radar. Módulo Comunicados (F13): envio de documentos ' +
      'com tracking. Regra de Ouro ADR-030: nenhuma ação de risco é automática.')
    .setVersion('1.0')
    .addBearerAuth(
      { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      'JWT',
    )
    .addTag('Watch Folder', 'Monitoramento da pasta local (ADR-113)')
    .addTag('Fila de Arquivos', 'Aprovação humana (ADR-030/117)')
    .addTag('Envios', 'Envios e timeline de tracking')
    .addTag('Templates', 'Templates Handlebars (ADR-115)')
    .addTag('Tracking', 'Endpoints públicos (ADR-114)')
    .addTag('Configuração', 'Configurações do módulo')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: { persistAuthorization: true },
  });

  await app.listen(3001);
}
bootstrap();
```

### 1.3 Acessar
```
http://localhost:3001/api/docs        → Swagger UI interativo
http://localhost:3001/api/docs-json   → JSON da spec gerada
```

> Em produção, proteger `/api/docs` atrás de role `admin`
> (ou desativar via `SWAGGER_ENABLED=false`).

---

## 2. Convenções da API

### 2.1 Autenticação
- Header: `Authorization: Bearer {jwt}`
- JWT emitido pelo Site (SSO) ou pelo Radar — mesma `JWT_SECRET` (ver `SYNC.md`)
- Multi-tenant: o `companyId` é extraído do token; **nunca** passar companyId no body (ADR-004)

### 2.2 Endpoints públicos (sem auth) — por design
| Rota | Motivo |
|------|--------|
| `GET /track/open/:envioId` | Pixel precisa ser carregado pelo cliente de email |
| `GET /track/download/:envioId/:token` | Token UUID é a própria autenticação |

### 2.3 Formato de erro padrão
```json
{
  "statusCode": 404,
  "message": "Recurso não encontrado",
  "error": "Not Found",
  "timestamp": "2026-09-11T12:00:00.000Z",
  "path": "/api/email-envios/xyz",
  "traceId": "uuid-opcional"
}
```

| Código | Quando |
|--------|--------|
| 400 | Validação de DTO falhou |
| 401 | Sem token ou token expirado |
| 403 | Token válido sem permissão / envio cancelado |
| 404 | Recurso inexistente **ou token de download inválido** (não enumerar) |
| 409 | Conflito (ex: aprovar arquivo já aprovado) |
| 410 | Link de download expirado |
| 422 | Regra de negócio violada (ex: cliente sem email) |
| 429 | Rate limit |
| 500 | Erro interno (logado no Sentry) |

### 2.4 Paginação padrão
Query: `?page=1&perPage=20` (máx `perPage=100`)
```json
{
  "data": [ ],
  "meta": { "page": 1, "perPage": 20, "total": 143, "totalPages": 8 }
}
```

### 2.5 Datas
- Sempre **ISO 8601 UTC**: `2026-09-11T12:00:00.000Z`
- Competência: string `YYYY-MM` (ex: `2026-01`)

### 2.6 IDs
- UUID v4 em todas as entidades
- Tokens de download: UUID v4 `@unique`

### 2.7 Versionamento
- Sem versão na URL enquanto não houver breaking change pública
- Breaking change → `/api/v2/...` + deprecation notice de 90 dias

---

## 3. Documentando código (obrigatório em PRs)

Todo controller/DTO novo DEVE ter decorators do `@nestjs/swagger`:

```ts
@ApiTags('Fila de Arquivos')
@Controller('api/arquivos-fila')
export class ArquivoFilaController {
  @Post(':id/aprovar')
  @ApiOperation({ summary: 'Aprova envio (Human-in-the-Loop — ADR-030)' })
  @ApiParam({ name: 'id', description: 'ID do ArquivoFila' })
  @ApiBody({ type: AprovarArquivoDto })
  @ApiResponse({ status: 201, description: 'Envio criado e agendado', type: EmailEnvioDto })
  @ApiResponse({ status: 404, description: 'Arquivo não encontrado' })
  @ApiResponse({ status: 409, description: 'Arquivo já aprovado/rejeitado' })
  @ApiResponse({ status: 422, description: 'Cliente sem email cadastrado' })
  aprovar(@Param('id') id: string, @Body() dto: AprovarArquivoDto) {
    return this.service.aprovar(id, dto);
  }
}
```

```ts
export class AprovarArquivoDto {
  @ApiPropertyOptional({
    description: 'Override do destinatário (default: email cadastrado do cliente)',
    example: 'financeiro@exemplo.com.br',
  })
  @IsOptional()
  @IsEmail()
  emailDestinatario?: string;

  @ApiPropertyOptional({
    description: 'ID do template a usar (default: resolução por tipoDocumento)',
  })
  @IsOptional()
  @IsUUID()
  templateId?: string;

  @ApiPropertyOptional({
    description: 'Setor responsável (default: setor do cliente)',
    example: 'Fiscal',
  })
  @IsOptional()
  @IsString()
  setor?: string;
}
```

**Regra de PR**: endpoint sem decorator de Swagger = PR bloqueado.

---

## 4. Spec canônica em YAML

A especificação OpenAPI 3.0 completa do módulo vive em:
👉 [`docs/openapi-comunicados.yaml`](./openapi-comunicados.yaml)

Use-a para:
- Gerar clients (TypeScript, Python) via `openapi-generator`
- Validar contratos em CI (`swagger-cli validate`)
- Importar no Postman/Insomnia

```bash
# Validar a spec
npx @apidevtools/swagger-cli validate docs/openapi-comunicados.yaml

# Gerar client TypeScript
npx @openapitools/openapi-generator-cli generate \
  -i docs/openapi-comunicados.yaml -g typescript-axios -o frontend/src/api/generated
```

---

**Última atualização**: 11/09/2026 | **Versão**: 1.0.0

