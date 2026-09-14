# CONTEXTO DO PROJETO - radar-clone

**Gerado em:** 2026-09-14 10:41:26
**Raiz:** C:/radar-clone
**Branch:** main  |  **HEAD:** 5f5b9fd

## 1. ULTIMOS 15 COMMITS

5f5b9fd pequenas edi├º├Áes
86021a3 ­ƒÄë F14 (Frontend da Mem├│ria) 100% CONCLU├ìDA!
c866f34 F14 (Backend da Mem├│ria)
6bd64d2 F13 (Tracking Ôåö Radar) est├í com a espinha dorsal do backend 100% operacional.
bb80ccb pequenos ajustes para o radar ficar no ar
c26d8a8 Handlebars para templates + nodemailer para SMTP
21ce3be ­ƒÄë BLOCO 2 HOMOLOGADO ÔÇö 100% FUNCIONAL!
f4706d7 Se precisar recuperar no futuro
e6ea9e4 documenta├º├úo est├í pronta e a spec da API est├í validada
465e87c documenta├º├úo atualizada
d0cf565 Sistema de Envio com Tracking de Comunica├º├Áes
adf1f0a ­ƒÄë Sprint F12 HOMOLOGADA ÔÇö fechando o ciclo com documenta├º├úo
aea8c3e ajuste de documenta├º├úo e integra├º├úo dos sistemas
97d9bc8 atualiza├º├úo for├ºada
baf4c1c unifica├º├úo de inicializa├º├úo

## 2. WORKING DIRECTORY (alteracoes nao commitadas)

?? sync-context.ps1

## 3. MODULOS DO BACKEND (backend/src)

accounting, admin, analise, auth, banking, bi, billing, client, client-portal, commercial-plans, common, company, comunicados, dashboard, digital-employee, employee, filters, fiscal, health, legal, memoria, modules, notifications, planning, pricing, pricing-calculator, prisma, projects, proposals, reports, seed, tasks, tax, tracking, turnover, users

## 3.1 Modulo comunicados (Sprint F13) - arquivos

C:\radar-clone\backend\src\comunicados\comunicados.module.ts
C:\radar-clone\backend\src\comunicados\arquivo-fila\arquivo-fila.controller.ts
C:\radar-clone\backend\src\comunicados\arquivo-fila\arquivo-fila.service.spec.ts
C:\radar-clone\backend\src\comunicados\arquivo-fila\arquivo-fila.service.ts
C:\radar-clone\backend\src\comunicados\arquivo-fila\dto\aprovar-arquivo.dto.ts
C:\radar-clone\backend\src\comunicados\arquivo-fila\dto\rejeitar-arquivo.dto.ts
C:\radar-clone\backend\src\comunicados\arquivo-fila\dto\vincular-cliente.dto.ts
C:\radar-clone\backend\src\comunicados\cnpj-parser\cnpj-parser.service.spec.ts
C:\radar-clone\backend\src\comunicados\cnpj-parser\cnpj-parser.service.ts
C:\radar-clone\backend\src\comunicados\cnpj-parser\metadados-arquivo.service.ts
C:\radar-clone\backend\src\comunicados\email-envio\email-envio.controller.ts
C:\radar-clone\backend\src\comunicados\email-envio\email-envio.service.ts
C:\radar-clone\backend\src\comunicados\email-provider\email-provider.factory.ts
C:\radar-clone\backend\src\comunicados\email-provider\email-provider.interface.ts
C:\radar-clone\backend\src\comunicados\email-provider\log-email.provider.ts
C:\radar-clone\backend\src\comunicados\email-provider\smtp-email.provider.ts
C:\radar-clone\backend\src\comunicados\email-template\email-template.service.ts
C:\radar-clone\backend\src\comunicados\file-mover\file-mover.service.spec.ts
C:\radar-clone\backend\src\comunicados\file-mover\file-mover.service.ts
C:\radar-clone\backend\src\comunicados\watch-folder\watch-folder.controller.ts
C:\radar-clone\backend\src\comunicados\watch-folder\watch-folder.service.spec.ts
C:\radar-clone\backend\src\comunicados\watch-folder\watch-folder.service.ts

## 3.2 Modulo tracking - arquivos

C:\radar-clone\backend\src\tracking\tracking.controller.ts

## 3.3 Modulo memoria (Sprint F14) - arquivos

C:\radar-clone\backend\src\memoria\memoria.controller.ts

## 4. PAGINAS DO DASHBOARD (frontend/src/app/dashboard)

admin, bi, central-contabil, clientes, contabil, envios, fechamento, fiscal, funcionario-digital, indicadores, indicadores-custom, lancamentos, mentoria, minha-empresa, pessoas, planejamento, planejamento-tributario, ponto-fora-da-curva, precificacao, projetos, ranking, reforma-tributaria, score, tarefas, test-close, turnover

## 4.1 PASTAS DA RAIZ DO APP (frontend/src/app)

ajuda, analise, dashboard, email, envios, fale-conosco, forbidden, login, memoria, portal, proposta, types

## 5. ULTIMAS 5 MIGRATIONS APLICADAS

20260911201950_add_analise_conversas
20260911193742_add_tracking_e_memoria
20260911151537_sprint_f13_completa

## 6. VARIAVEIS DE AMBIENTE NAO SENSIVEIS (backend/.env)

DATABASE_URL="postgresql://postgres:postgres_password@localhost:5433/radar_db?schema=public"
JWT_EXPIRATION="7d"
PORT=3001
NODE_ENV=development
EXTRATOR_URL=http://localhost:8000
WATCH_FOLDER_PATH=C:\Site conta-certa\radar-clone\Envios\A_Processar
SENT_FOLDER_PATH=C:\Site conta-certa\radar-clone\Envios\Enviados
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=atendimento@contacerta.com.br
APP_URL=https://radar-api.contacerta.com.br
WATCH_FOLDER_ENABLED=true
WATCH_FOLDER_PATH=C:\Documentos\Enviar
WATCH_FOLDER_STABILITY_MS=2000
EMAIL_PROVIDER=log
PUBLIC_BASE_URL=http://localhost:3001
DOC_LINK_TTL_DAYS=7

## 7. STATUS DO BUILD (npx tsc --noEmit no backend)

prisma/backup SEED/seed-catalog.ts(488,7): error TS2322: Type '{ id: string; name: string; order: number; description: string; }' is not assignable to type '(Without<ServiceCategoryCreateInput, ServiceCategoryUncheckedCreateInput> & ServiceCategoryUncheckedCreateInput) | (Without<...> & ServiceCategoryCreateInput)'.
  Type '{ id: string; name: string; order: number; description: string; }' is not assignable to type 'Without<ServiceCategoryUncheckedCreateInput, ServiceCategoryCreateInput> & ServiceCategoryCreateInput'.
    Property 'company' is missing in type '{ id: string; name: string; order: number; description: string; }' but required in type 'ServiceCategoryCreateInput'.
prisma/backup SEED/seed-catalog.ts(526,11): error TS2353: Object literal may only specify known properties, and 'sla' does not exist in type '(Without<ServiceItemUpdateInput, ServiceItemUncheckedUpdateInput> & ServiceItemUncheckedUpdateInput) | (Without<...> & ServiceItemUpdateInput)'.
prisma/backup SEED/seed-catalog.ts(538,11): error TS2353: Object literal may only specify known properties, and 'sla' does not exist in type '(Without<ServiceItemCreateInput, ServiceItemUncheckedCreateInput> & ServiceItemUncheckedCreateInput) | (Without<...> & ServiceItemCreateInput)'.
prisma/backup SEED/seed-users.ts(10,25): error TS2307: Cannot find module 'bcryptjs' or its corresponding type declarations.
src/seed-admin.ts(2,25): error TS2307: Cannot find module 'bcryptjs' or its corresponding type declarations.

## 8. ROTAS - tracking.controller.ts

@Post('webhook')
@Get('envios')

## 8.1 ROTAS - memoria.controller.ts

@Post('interacao')
@Get(':contatoId')

## 8.2 ROTAS - comunicados (todos os controllers)

arquivo-fila.controller.ts: @Get()
arquivo-fila.controller.ts: @Get(':id')
arquivo-fila.controller.ts: @Post(':id/aprovar')
arquivo-fila.controller.ts: @Post('aprovar-lote')
arquivo-fila.controller.ts: @Post(':id/rejeitar')
arquivo-fila.controller.ts: @Post(':id/vincular-cliente')
email-envio.controller.ts: @Get()
email-envio.controller.ts: @Get(':id')
watch-folder.controller.ts: @Get('status')
watch-folder.controller.ts: @Post('iniciar')
watch-folder.controller.ts: @Post('parar')
watch-folder.controller.ts: @Post('scan')

## 9. ESTATISTICAS RAPIDAS

Commits totais:              176
Arquivos .ts no backend:     267
Arquivos .tsx no frontend:   109
Modulos no backend:          36
Paginas no dashboard:        26
Arquivos em C:\Documentos\Enviar: 1

---

## INSTRUCOES

**Usuario:** copie TODO este arquivo e cole no chat da IA com a frase:
> "Atualize-se com este contexto e me diga qual o proximo passo."

**IA:** ao receber este snapshot: (1) identifique a sprint em andamento
pelos commits recentes; (2) levante pendencias via git status + build;
(3) proponha o proximo bloco de trabalho alinhado ao estado real acima.

*Fim do snapshot - 2026-09-14 10:41:26*
