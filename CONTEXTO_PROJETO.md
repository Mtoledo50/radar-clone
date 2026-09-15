# 🧠 CONTEXTO_PROJETO.md — Radar Conta Certa
Arquivo de injeção de contexto. Cole INTEIRO no início de toda conversa nova.
Última atualização: 15/09/2026 (pós-Sprint F17-A — Retry Automático + Reenvio Manual).

## 1. Método oficial de trabalho
Sprints autocontidas. ADR-034.2 — entrega all-in-one:
- Arquivos completos sempre que possível (novos ou quebrados).
- Delta cirúrgico só em arquivo estrutural em produção (schema, app.module, layouts).
- Backend + frontend + seed + validação + docs na mesma entrega.
- Scripts únicos quando aceleram homologação.
- **Regra de ouro: nenhum sprint novo começa sem o anterior homologado.**

## 2. Stack atual
**Backend Radar:** NestJS 10 • Prisma 5 • PostgreSQL • JWT • RBAC `@Roles()` • serviços determinísticos • PDFs no backend (jspdf 2.5.2 + jspdf-autotable 3.8.2 pinados) • notificações plugáveis via fetch nativo (SendGrid/Twilio/Log — ADR-086) • **SMTP/Gmail para emails reais**.
**Extrator Bancário (app irmã):** Python FastAPI + pdfplumber/PyMuPDF + Mistral OCR (:8000) + frontend Vite (:5174); proxy NestJS→Python no Radar (ADR-103).
**Frontend Radar:** Next.js App Router • React 19 • TypeScript • Tailwind • Axios c/ interceptor JWT • Sonner • Lucide • gráficos CSS puro quando possível.
**Banco de Dados:**
- Postgres LOCAL porta `5432` = dados REAIS (usuário postgres; NÃO tocar).
- Docker Compose porta `5433` = banco virgem p/ testes (radar_user/radar_password/radar_db).
**Infra:** Docker Compose raiz + túnel Cloudflare (produção local, ADR-077/079) • `Iniciar-Tudo.ps1` p/ dev unificado (F9, ADR-103).

## 3. ADRs principais (Registro Canônico)
001 Gráficos CSS puro • 002 CSV com UTF-8+BOM • 003 Zustand persist p/ SSR seguro • 004 Multi-tenant single-database por companyId • 020 Herança de planos derivada em memória • 021 Ícones Lucide: tooltip via wrapper `<span title>` • 022 Proibido arquivo de backup dentro de `src/` • 023 Optional chaining (`?.`) em `.map` de opcionais no JSX • 024 Sonner: action/cancel exigem `onClick` • 025 RBAC em 3 camadas • **030 Regra de Ouro da Aurora: prepara/classifica/calcula/sugere; obrigação legal nunca é transmitida sem aprovação humana** • 031 Cálculo determinístico no backend • 032 Cofres AES-256-GCM p/ credenciais • 034/034.1/034.2 Arquivos estruturais = delta cirúrgico; novos/quebrados = completo • 035 PDFs no backend c/ versões pinadas • 036 NFS-e ABRASF 2.0 c/ adaptadores • 037 Origem do documento em `source` • 038 Memória de cálculo auditável • 039 IMAP como coletor • 043.1 Logo proporcional • 051 Benchmark de cargos • 054 Fórmulas seguras por whitelist • 055 Score 0–100 determinístico • 056 Mentoria derivada do Score • 057 Checklist persistido por tenant • 058 Ranking de níveis multi-tenant • 066 Ciclo Contábil por cliente • 067 Idempotência de imports contábeis • 068 Sugestão em 3 camadas c/ revisão humana obrigatória • 069 Conta bancária da partida detectada pela seção do extrato • 070 Plano sincronizado do balancete • 071 Encoding de CSV detectado • 072 Multi-planos por cliente • 073 Exportação SCI c/ nºs reduzidos e decimal com PONTO • 074 Partida dobrada manual • 077 Radar em produção usa Postgres REAL local (5432) via `host.docker.internal` • 078 `typescript.ignoreBuildErrors=true` apenas no build Docker • 079 Túnel Cloudflare único p/ site + Radar • 080 `migrate resolve --applied` p/ sincronizar migrations • 081 ARG/ENV `NEXT_PUBLIC_*` antes do `next build` • 082 Scroll suave nativo • 083 Limpeza técnica de erros TS • 084 Domínio puro CNAB isolado • 085 Arquitetura híbrida FD-5 • 086 Notificações plugáveis por estratégia • 087 Vínculo Client↔cobrança por auto-match • 088 Monitoramento e backup opt-in • 089 Ajuda contextual em 2 camadas • 090 Catálogo centralizado em TypeScript • 091 Gestão de Usuários e Ciclo Seguro de Senhas • 092 Seed Enterprise Unificado e Idempotente • 093 Drag & Drop nativo HTML5 • 094 Proteção de integridade em projetos • 095 KPIs calculados no backend.

### 🆕 ADRs de Comunicados (Sprints F15-F17)
- **ADR-113:** Watch folder via chokidar (Node.js) — monitora pasta configurável (`WATCH_FOLDER_PATH`), ignora temporários (.tmp, ~$), detecta novos arquivos em tempo real.
- **ADR-114:** Tracking pixel 1x1 GIF transparente via endpoint público (`/track/open/:envioId`); tracking de download via link proxy com token único (`/track/download/:envioId/:token`) + expiração (7 dias).
- **ADR-115:** Templates de email editáveis via painel admin (Handlebars + variáveis: `{{cliente.nome}}`, `{{documento.competencia}}`, `{{link.download}}`, etc.).
- **ADR-116:** Envio plugável seguindo ADR-086: SMTP próprio (Gmail/Workspace) / MODO LOG (sem chaves, só console) / SendGrid (futuro).
- **ADR-117:** Human-in-the-loop obrigatório: antes de enviar, humano aprova na Fila de Aprovação. Nada é enviado automaticamente.
- **ADR-118:** Identificação de cliente por CNPJ no nome do arquivo (regex flexível: aceita com ou sem pontuação, múltiplos formatos).
- **ADR-119:** Pasta de "enviados" com subpastas por mês/competência (ex: `enviados/2026-09/`) para auditoria e conformidade LGPD.
- **ADR-120:** Retry automático com backoff exponencial (1min → 5min → 25min) + reenvio manual ilimitado. Cron a cada 30s busca envios FALHOU.

## 4. Status macro
**Sprints 1–32 concluídas e homologadas** (dashboard, clientes, operacional, fiscal, bancário, contábil, BI, Aurora FD-1→FD-6+FD-8, FD-5 v2, usuários, projetos).
**🆕 Sprints F13-F17 concluídas e homologadas** (15/09/2026):
- F13: Tracking de Comunicações (webhooks + funil visual)
- F14: Memória do Cliente (perfil unificado + timeline de interações)
- F15: Sistema de Envio com Watch Folder + Parser CNPJ + Tracking Pixel + SMTP Real
- F16-A: Templates de Email Editáveis (CRUD + preview ao vivo + 8 seeds)
- F17-A: Retry Automático com Backoff + Reenvio Manual (CRON + botão na tela)
**Produção local:** túnel Cloudflare (`radar.contacerta.com.br` + `radar-api.contacerta.com.br`) — Sprint 32 ✅.

## 5. Plano 2.0 — Fases concluídas
Fase A (Comercial: A1–A7) ✅ • Fase B (Pessoas: B1–B5) ✅ • Fase C (Mercado: C1–C4) ✅ • Fase D (Mentoria: D1–D3) ✅ • Fase E (UX: palette, "onde parei", notificações) ✅.

## 6. Funcionário Digital Aurora
**Conceito:** JARVIS contábil (ADR-030).
**Concluído:** FD-1 • FD-2 (+relatórios) • FD-3a/b • FD-4 guias • FD-5 v2 CNAB 240/400 + régua • FD-6 EFD • FD-8 cofre/legalização.
**Pendente:** FD-7 (Domínio/Questor/Sage) • FD-9 (DP leve).

## 7. Páginas principais
Operacional/Comercial/Fiscal/Bancário/Contábil/Inteligência/Admin conforme versão 27/08.
**🆕 Novas (F15-F17):**
- `/dashboard/comunicados` — Hub central com métricas do funil (pendentes, enviados, abertos, baixados, falhas)
- `/dashboard/comunicados/fila` — Fila de Aprovação (arquivos aguardando revisão humana)
- `/dashboard/comunicados/envios` — Histórico de Envios com timeline (📤→👁️→📥) + botões Reenviar
- `/dashboard/comunicados/templates` — Editor de templates Handlebars com preview ao vivo
- `/envios` — Funil de Comunicações (F13 — tracking de webhooks)
- `/memoria` — Memória do Cliente (F14 — perfil + timeline)
- `/analise` — Análise e Classificação de Conversas (F15)

## 8. O que falta para terminar
**Aurora:** FD-7 • FD-9.
**Produção:** Sprints 33–34 (CI/CD, Sentry, backup, rebuild Docker c/ Aurora).
**Portal do Cliente** • Relatórios PDF profissionais • Testes E2E (Playwright).
**REGRA:** nada entra antes das Sprints 33–34.

## 9. Status atual e próximos passos
✅ **F8–F12 homologadas** (09/09): catálogo permanente, launcher unificado, Ecossistema, proxy Extrator, cadastro completo S3D + ficha.
✅ **Extrator Bancário v1.0 homologado** (10/09): 3 parsers + Mistral OCR + LGPD + Human-in-the-Loop + CSV contábil.
✅ **F13-F17 homologadas** (15/09): Sistema de Envio completo (Watch Folder + Parser + Tracking + SMTP + Retry + Templates Editáveis).
**PRÓXIMO (escolher 1):**
- F18-A: Multi-tenant do Watch Folder (ADR-004) — 1 pasta por tenant
- F18-B: Portal do Cliente (Download de Documentos) — tela pública `/portal/:token`
- F18-C: Dashboard de BI para Comunicados — métricas agregadas + gráficos
**EM ANDAMENTO:** hardening de produção (Sentry backend, CI/CD, backup).

## 10. Instrução para a nova IA
Leia este arquivo, confirme com "Yes", e continue EXATAMENTE do §11.
Não reimplementar sprints concluídas; não mudar stack; seguir método do §1 e governança de ADRs do §1/§3.

## 11. Fase 4 — Projetos e Tarefas (31/08/2026) ✅
ProjectsModule/TasksModule completos (Kanban, KPIs backend, soft delete, integridade projeto×tarefas). ADR-093/094/095. Detalhes no CHANGELOG.

## 12. 🆕 ECOSSISTEMA & OPERAÇÃO LOCAL (F9–F11)
**RAIZ REAL:** `C:\Site conta-certa` (site/ + radar-clone/ + docker-compose.yml + Iniciar-Tudo.ps1). Extrator vive em `radar-clone/extrator-bancario/`.
**Portas dev:**
- Site FE 5173 / Site API 4000
- Radar FE 3002 / Radar BE 3001
- Extrator FE 5174 / Extrator BE 8000
- Postgres 5432 (real) / 5433 (Docker).
**Boot único:** `.\Iniciar-Tudo.ps1` (idem `-Prod` p/ Docker; `-SiteOnly`/`-RadarOnly`/`-ExtratorOnly` p/ parcial). Logs: `C:\Site conta-certa\logs\boot-*.log`.
**PowerShell 5.1:** scripts de infra DEVEM ser ASCII puro (emoji/acentos quebram parse).

## 13. 🆕 MÓDULO DE COMUNICADOS — ARQUITETURA DETALHADA (F15-F17, 15/09/2026)

### Fluxo Completo (Pipeline End-to-End)
Watch Folder (chokidar) detecta novo arquivo em C:\Documentos\Enviar
↓
Parser CNPJ extrai metadados do nome (regex flexível):
CNPJ: 08432644000160 ou 08.432.644/0001-60
Tipo: DAS, DARF, FGTS, IRPF, BALANCETE, etc.
Competência: 2026-09 (YYYY-MM)
↓
ArquivoFilaService busca cliente pelo CNPJ (normalizado)
↓
Move arquivo para pendentes/ (ou erros/ se CNPJ inválido)
↓
Tela "Fila de Aprovação" mostra card com preview do email
↓
Humano clica "Aprovar Envio" (ADR-030: human-in-the-loop)
↓
EmailEnvioService:
Cria EmailEnvio (AGENDADO)
Resolve template Handlebars (tipo exato → GENERICO → fallback)
Renderiza assunto + corpo com contexto completo
Injeta pixel de tracking (1x1 GIF transparente)
Gera token único de download + expiração (7 dias)
Move arquivo para enviados/YYYY-MM/
Envia via SMTP (Gmail) ou LOG (dev)
↓
Tracking Público:
Pixel aberto → grava evento ABERTO (IP + User-Agent)
Link clicado → valida token + grava evento BAIXADO + serve arquivo
↓
Retry Automático (se falha):
CRON a cada 30s busca FALHOU com tentativas < 3
Backoff exponencial: 1min → 5min → 25min
Botão "Reenviar" manual ignora backoff/limite


### Estrutura de Pastas do Módulo

C:\Documentos\Enviar\ # Pasta monitorada (WATCH_FOLDER_PATH)
├── DAS_08432644000160_SET2026.pdf # Arquivo recém-detectado
├── pendentes/ # Aguardando aprovação
├── enviados/
│ ├── 2026-09/ # Subpasta por competência
│ │ └── DAS_08432644000160_SET2026.pdf
│ └── 2026-10/
├── erros/ # CNPJ inválido ou sem cliente
└── rejeitados/ # Rejeitados manualmente (com motivo)


### Modelo de Dados (PostgreSQL)
**Tabela: `email_envios`**
- id: UUID (PK)
- companyId: UUID (FK → Company, multi-tenant ADR-004)
- clienteId: UUID (FK → Client, nullable)
- clienteNome: string (snapshot no momento do envio)
- clienteCnpj: string (snapshot)
- emailDestinatario: string
- assunto: string (renderizado via Handlebars)
- corpoHtml: text (renderizado + pixel de tracking injetado)
- tokenDownload: string (UUID único para download seguro)
- linkExpiraEm: timestamp (padrão: +7 dias)
- status: enum (AGENDADO, ENVIADO, FALHOU)
- tentativas: int (quantas vezes tentou enviar)
- ultimoErro: text (última mensagem de erro SMTP)
- proximoRetryEm: timestamp (quando o CRON deve tentar de novo)
- primeiraAberturaEm: timestamp (primeiro pixel aberto)
- primeiroDownloadEm: timestamp (primeiro link clicado)
- aprovadoPor: UUID (quem aprovou na fila)
- enviadoEm: timestamp
- createdAt/updatedAt: timestamps

**Tabela: `email_eventos`**
- id: UUID
- envioId: UUID (FK → EmailEnvio)
- tipo: enum (ENVIADO, ABERTO, BAIXADO, FALHA)
- ip: string (nullable)
- userAgent: string (nullable)
- metadata: JSONB (provider, tentativa, origem CRON/MANUAL, erro)
- createdAt: timestamp

**Tabela: `email_templates`**
- id: UUID
- companyId: UUID (FK → Company)
- nome: string (ex: "DAS (Simples Nacional)")
- tipoDocumento: enum (DAS, DARF, FGTS, IRPF, BALANCETE, DRE, INFORME_RENDIMENTO, E_SOCIAL, SPED, GENERICO)
- assunto: string (Handlebars: `Guia {{documento.tipo}} {{documento.competencia}}`)
- corpoHtml: text (Handlebars com variáveis)
- ativo: boolean
- createdAt/updatedAt: timestamps

**Tabela: `arquivo_filas`**
- id: UUID
- companyId: UUID
- nomeOriginal: string
- caminhoAbsoluto: string (caminho real no disco)
- cnpjDetectado: string (extraído do nome)
- tipoDocumento: string
- competencia: string (YYYY-MM)
- clienteId: UUID (FK → Client, nullable)
- clienteEmail: string
- confianca: float (0.0 a 1.0)
- status: enum (AGUARDANDO_APROVACAO, SEM_CLIENTE, SEM_EMAIL, ERRO, APROVADO, REJEITADO, ENVIADO)
- erro: text (motivo do erro ou rejeição)
- envioId: UUID (FK → EmailEnvio, após envio)
- createdAt/updatedAt: timestamps

### Endpoints da API (NestJS)
**Watch Folder:**
- `GET /api/watch-folder/status` — status do watcher (ativo/pausado)
- `POST /api/watch-folder/scan` — força scan manual da pasta

**Arquivo Fila:**
- `GET /api/arquivos-fila` — lista com filtros (status, page, perPage)
- `GET /api/arquivos-fila/:id` — detalhe com preview do email
- `POST /api/arquivos-fila/:id/aprovar` — aprova envio (cria EmailEnvio)
- `POST /api/arquivos-fila/:id/rejeitar` — rejeita com motivo obrigatório
- `POST /api/arquivos-fila/:id/vincular-cliente` — vínculo manual (quando parser falhou)

**Email Envio:**
- `GET /api/email-envios` — lista com filtros + paginação
- `GET /api/email-envios/:id` — detalhe com timeline completa
- `POST /api/email-envios/:id/reenviar` — reenvio manual imediato (F17-A)

**Email Template:**
- `GET /api/email-templates` — lista todos (ordenados por tipo)
- `GET /api/email-templates/:id` — detalhe
- `POST /api/email-templates` — cria novo
- `PUT /api/email-templates/:id` — atualiza (parcial)
- `DELETE /api/email-templates/:id` — remove
- `POST /api/email-templates/preview` — renderiza com contexto demo

**Tracking Público (sem autenticação):**
- `GET /track/open/:envioId` — pixel 1x1 GIF (grava evento ABERTO)
- `GET /track/download/:envioId/:token` — valida token + serve arquivo (grava BAIXADO)

### Variáveis de Ambiente (.env do backend)
```env
# Watch Folder
WATCH_FOLDER_PATH=C:\Documentos\Enviar
WATCH_FOLDER_ENABLED=true

# Email Provider
EMAIL_PROVIDER=smtp  # ou "log" para desenvolvimento

# SMTP (Gmail/Workspace)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=seu-email@contacerta.com.br
SMTP_PASS=senha-de-app-16-caracteres
SMTP_FROM="Conta Certa <seu-email@contacerta.com.br>"

# Token de Download
DOC_LINK_TTL_DAYS=7  # expiração do link em dias

# Retry Automático
EMAIL_RETRY_MAX_ATTEMPTS=3
EMAIL_RETRY_BACKOFF_MIN=1,5,25  # minutos entre tentativas

Padrões de Nome de Arquivo Suportados
O parser CNPJ aceita múltiplos formatos (regex flexível):
DAS_12345678000195_JAN2026.pdf ✅
12345678000195-DAS-012026.pdf ✅
DAS_12.345.678/0001-95_012026.pdf ✅ (com pontuação)
12345678000195_012026.pdf ✅ (sem tipo)
Decisões de Arquitetura (ADRs)
ADR-113: Watch folder via chokidar (Node.js) — monitora pasta configurável, ignora temporários (.tmp, ~$).
ADR-114: Tracking pixel 1x1 GIF transparente via endpoint público; tracking de download via link proxy com registro determinístico.
ADR-115: Templates de email editáveis via painel admin (Handlebars + variáveis).
ADR-116: Envio plugável seguindo ADR-086: SendGrid (recomendado) / SMTP próprio / MODO LOG (sem chaves).
ADR-117: Human-in-the-loop obrigatório: antes de enviar, humano aprova na Fila de Aprovação.
ADR-118: Identificação de cliente por CNPJ no nome do arquivo (regex flexível).
ADR-119: Pasta de "enviados" com subpastas por mês/competência para auditoria.
ADR-120: Retry automático com backoff exponencial (1min → 5min → 25min) + reenvio manual ilimitado.
14. 🆕 EXTRATOR BANCÁRIO — ARQUITETURA DETALHADA (10/09/2026)
(Seção mantida do documento original — ver CHANGELOG.md para detalhes completos)
15. 🆕 INCIDENTES DE SEGURANÇA REGISTRADOS
2026-09-09 — Exposição de chave Mistral API
Causa: Arquivo .env enviado acidentalmente em chat durante desenvolvimento.
Ação Imediata: Chave rotacionada (revogada) no console da Mistral. Nova chave gerada.
Limpeza de Histórico: .env removido de TODO o histórico Git via git filter-repo --path extrator-bancario/backend/.env --invert-paths --force.
Prevenção: .env adicionado ao .gitignore. Regra ADR-032/059 reforçada: nunca commitar .env, nunca enviar em chat.
Nota: O GitHub Push Protection funcionou corretamente, bloqueando o push inicial.
Documento autocontido. Qualquer IA que ler este arquivo terá contexto completo para continuar o desenvolvimento sem ambiguidades.


---

## **ARQUIVO 2 — `CHANGELOG.md` (adição das sprints F15-F17)**

Adicione **no topo** do CHANGELOG.md (logo após o cabeçalho):

```markdown
## [Sprints F15-F17 — Sistema de Envio Completo] 15/09/2026 — ✅ HOMOLOGADO

### Added

**F15 — Frontend de Comunicados:**
- **Tela Fila de Aprovação** (`/dashboard/comunicados/fila`): lista arquivos detectados pelo Watch Folder com preview do email, botões Aprovar/Rejeitar, filtros por status (AGUARDANDO_APROVACAO, SEM_CLIENTE, SEM_EMAIL, ERRO), polling a cada 5s.
- **Tela Histórico de Envios** (`/dashboard/comunicados/envios`): timeline visual 📤→👁️→📥 com tooltips de data/hora, métricas do funil (Enviados, Abertos, Baixados, Taxa de Abertura, Falhas), modal de detalhes com preview do email + eventos + download.
- **Hub Central** (`/dashboard/comunicados`): página de entrada com 3 cards navegáveis (Fila, Envios, Templates) + métricas ao vivo + pipeline visual (5 passos).
- **Sidebar atualizada**: nova seção "Comunicações" com 4 sublinks (Central, Fila, Envios, Templates) + badge com contador de pendentes (atualiza a cada 30s).

**F16-A — Templates de Email Editáveis:**
- **Tela de Templates** (`/dashboard/comunicados/templates`): CRUD completo (criar, editar, excluir, toggle ativo/inativo), editor com preview ao vivo (renderização client-side com dados demo), lista de variáveis disponíveis.
- **EmailTemplateController**: endpoints REST (GET/POST/PUT/DELETE + preview), multi-tenant por companyId.
- **Seed de 8 templates**: DAS, DARF, ISS, FGTS, IRPF, BALANCETE, INFORME_RENDIMENTO, GENERICO (todos com assunto + corpo Handlebars).
- **Preview ao vivo**: renderização client-side com contexto demo (cliente.nome, documento.competencia, link.download, etc.).

**F17-A — Retry Automático + Reenvio Manual:**
- **EmailRetryService**: CRON a cada 30s busca envios FALHOU com tentativas < 3 e proximoRetryEm vencido, backoff exponencial (1min → 5min → 25min), trava anti-sobreposição.
- **Botão "Reenviar"** na tela de envios: reenvio manual imediato (ignora backoff e limite), registra evento com `origem: MANUAL`.
- **Painel de falha no modal**: mostra ultimoErro, tentativas, proximoRetryEm, botão de reenvio.
- **Timeline com metadata**: cada evento mostra tentativa + origem (CRON/MANUAL).
- **Anti-duplicidade**: email já ENVIADO nunca é reenviado.

**Backend (Módulo Comunicados):**
- **Watch Folder Service** (ADR-113): chokidar monitora `WATCH_FOLDER_PATH`, detecta novos arquivos, ignora temporários (.tmp, ~$).
- **CNPJ Parser Service** (ADR-118): regex flexível extrai CNPJ + tipo + competência do nome do arquivo (aceita múltiplos formatos).
- **Arquivo Fila Service** (ADR-117): pipeline completo (detecta → parse → busca cliente → move para pendentes/erros/rejeitados), resolução de email via ClientContact, normalização de CNPJ (com/sem pontuação).
- **Email Envio Service** (ADR-116/119): orquestra envio (cria EmailEnvio → resolve template → renderiza Handlebars → injeta pixel → gera token → move para enviados/YYYY-MM/ → envia via SMTP/LOG).
- **Email Template Service** (ADR-115): renderização Handlebars com contexto completo (cliente, documento, link, empresa, setor), injeção de pixel de tracking.
- **File Mover Service** (ADR-119): move arquivos entre pastas (pendentes/, enviados/YYYY-MM/, erros/, rejeitados/), garante estrutura de pastas, resolve caminho real (varre enviados/ para downloads de arquivos já movidos).
- **Tracking Público Controller** (ADR-114): endpoints públicos sem autenticação (`/track/open/:envioId` retorna pixel 1x1 GIF, `/track/download/:envioId/:token` valida token + serve arquivo), grava eventos ABERTO/BAIXADO com IP + User-Agent.
- **Email Provider Factory** (ADR-116): factory pattern para providers plugáveis (LogEmailProvider para dev, SmtpEmailProvider para produção).
- **SmtpEmailProvider**: integração com Gmail/Workspace via nodemailer, suporte a anexos, tratamento de erros SMTP.

**Frontend (Páginas Next.js):**
- `/dashboard/comunicados/page.tsx` — Hub central com métricas + 3 cards navegáveis.
- `/dashboard/comunicados/fila/page.tsx` — Fila de Aprovação com polling 5s + preview + botões Aprovar/Rejeitar.
- `/dashboard/comunicados/envios/page.tsx` — Histórico com timeline + tooltips + modal de detalhes + botão Reenviar (F17-A).
- `/dashboard/comunicados/templates/page.tsx` — Editor de templates com preview ao vivo + CRUD.

**Schema Prisma (migrations):**
- `email_envios`: 20+ campos (companyId, clienteId, assunto, corpoHtml, tokenDownload, linkExpiraEm, status, tentativas, ultimoErro, proximoRetryEm, primeiraAberturaEm, primeiroDownloadEm, aprovadoPor, enviadoEm, etc.).
- `email_eventos`: tipo (ENVIADO/ABERTO/BAIXADO/FALHA), ip, userAgent, metadata (JSONB com provider/tentativa/origem/erro).
- `email_templates`: nome, tipoDocumento (enum), assunto, corpoHtml, ativo.
- `arquivo_filas`: nomeOriginal, caminhoAbsoluto, cnpjDetectado, tipoDocumento, competencia, clienteId, clienteEmail, confianca, status, erro, envioId.

### Changed
- `layout.tsx`: adicionada seção "Comunicações" no menu lateral com 4 sublinks + badge de pendentes.
- `comunicados.module.ts`: registrados todos os services e controllers do módulo (Watch Folder, Arquivo Fila, Email Envio, Email Template, File Mover, Email Retry).

### Fixed
- **FIX F15-A**: botões Aprovar/Rejeitar na Fila estavam trocados (Aprovar chamava `/rejeitar` e vice-versa) — corrigido para endpoints corretos.
- **FIX F15-2**: endpoint de download não encontrava arquivos já movidos para `enviados/YYYY-MM/` — `resolverCaminhoAtual` agora varre subpastas de enviados/.
- **FIX F15-3**: assunto do email não era renderizado pelo Handlebars (ficava cru com `{{...}}`) — agora renderiza junto com o corpo.
- **FIX F17-A-TS**: metadata do provider.enviar() não aceitava campos extras (tentativa/origem) — cast para `any` resolveu, auditoria oficial fica no EmailEvento (campo Json).

### Decisions
- **ADR-113:** Watch folder via chokidar (Node.js) — monitora pasta configurável, ignora temporários.
- **ADR-114:** Tracking pixel 1x1 GIF + link proxy com token único + expiração (7 dias).
- **ADR-115:** Templates Handlebars editáveis via painel admin.
- **ADR-116:** Envio plugável (SMTP/LOG/SendGrid) seguindo ADR-086.
- **ADR-117:** Human-in-the-loop obrigatório (nada é enviado sem aprovação humana).
- **ADR-118:** Parser CNPJ flexível (aceita múltiplos formatos de nome de arquivo).
- **ADR-119:** Pasta enviados/YYYY-MM/ para auditoria e conformidade LGPD.
- **ADR-120:** Retry automático com backoff exponencial (1min → 5min → 25min) + reenvio manual ilimitado.
🆕 ADR-121: Portal do Cliente tokenizado (UUID permanente em relação 1-N,
acesso anônimo via token, DRE calculado em tempo real de lançamentos
CONCILIATED, revogação via ADMIN).

### Provas
- **Watch Folder:** drop de arquivo em `C:\Documentos\Enviar\` → detectado em <1s → movido para `pendentes/` → aparece na Fila.
- **Parser CNPJ:** `DAS_08432644000160_SET2026.pdf` → extrai CNPJ `08432644000160`, tipo `DAS`, competência `2026-09` → busca cliente → match encontrado.
- **SMTP Real:** aprovação na Fila → email enviado via Gmail → recebido em `marcostoledo@soluti.net.br` (verificado Spam também).
- **Tracking Pixel:** abrir email → pixel carregado → evento ABERTO gravado com IP + User-Agent → timeline atualiza.
- **Download com Token:** clicar no link → valida token + expiração → serve PDF → evento BAIXADO gravado → timeline atualiza.
- **Retry Automático:** sabotar SMTP (porta 9999) → aprovação → falha → CRON recupera em ~1min (tentativa 2) → restaurar SMTP → CRON recupera em ~5min (tentativa 3) → email enviado.
- **Reenvio Manual:** botão "Reenviar" na tela → ignora backoff/limite → tenta imediatamente → grava evento com `origem: MANUAL`.
- **Templates Editáveis:** editar template DAS → mudar assunto para `[CONTA CERTA] Guia DAS...` → salvar → próximo envio de DAS usa o novo assunto.

### Arquivos Criados/Modificados

**Backend (`backend/src/comunicados/`):**
- `watch-folder/watch-folder.service.ts` (novo)
- `watch-folder/watch-folder.controller.ts` (novo)
- `cnpj-parser/cnpj-parser.service.ts` (novo)
- `cnpj-parser/metadados-arquivo.service.ts` (novo)
- `arquivo-fila/arquivo-fila.service.ts` (novo)
- `arquivo-fila/arquivo-fila.controller.ts` (novo)
- `arquivo-fila/dto/aprovar-arquivo.dto.ts` (novo)
- `arquivo-fila/dto/vincular-cliente.dto.ts` (novo)
- `email-envio/email-envio.service.ts` (novo)
- `email-envio/email-envio.controller.ts` (novo)
- `email-envio/email-retry.service.ts` (novo — F17-A)
- `email-template/email-template.service.ts` (novo)
- `email-template/email-template.controller.ts` (novo)
- `email-provider/email-provider.interface.ts` (novo)
- `email-provider/email-provider.factory.ts` (novo)
- `email-provider/log-email.provider.ts` (novo)
- `email-provider/smtp-email.provider.ts` (novo)
- `file-mover/file-mover.service.ts` (novo)
- `tracking-publico/tracking-publico.controller.ts` (novo — F15)
- `comunicados.module.ts` (modificado — registrados todos os providers/controllers)

**Frontend (`frontend/src/app/dashboard/comunicados/`):**
- `page.tsx` (novo — Hub central)
- `fila/page.tsx` (novo — Fila de Aprovação)
- `envios/page.tsx` (novo — Histórico de Envios + F17-A)
- `templates/page.tsx` (novo — Editor de Templates)

**Layout:**
- `frontend/src/app/dashboard/layout.tsx` (modificado — seção "Comunicações" + badge de pendentes)

**Banco de Dados:**
- `prisma/schema.prisma` (modificado — adicionadas tabelas email_envios, email_eventos, email_templates, arquivo_filas)
- Migrations aplicadas via `npx prisma db push`
- `/portal/<token>` — Portal público do cliente final (sem login, 4 abas:
  Visão Geral, DRE do Mês, Propostas, Documentos).
  
### Status
✅ **HOMOLOGADO em ambiente local** (15/09/2026):
- Watch Folder detectando arquivos em tempo real
- Parser CNPJ extraindo metadados corretamente
- Fila de Aprovação funcional com preview
- SMTP real enviando emails (Gmail)
- Tracking pixel + download com token funcionando
- Retry automático recuperando falhas
- Templates editáveis com preview ao vivo
- Timeline completa (📤→👁️→📥) com tooltips

---

