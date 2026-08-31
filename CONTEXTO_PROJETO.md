# 🧠 CONTEXTO_PROJETO.md — Radar Conta Certa
Arquivo de injeção de contexto. Cole INTEIRO no início de toda conversa nova.
Última atualização: 27/08/2026 (pós-Fase 6 — Aurora de cobrança completa).
ADR-028 Versionamento de propostas: versões são imutáveis após criação;
nova versão é clone com version+1, isCurrent=true, status=DRAFT;
cadeia ligada por originalProposalId; comparação por diff de campos + itens.


## 1. Método oficial de trabalho
Sprints autocontidas. ADR-034.2 — entrega all-in-one:
- arquivos completos sempre que possível (novos ou quebrados);
- delta cirúrgico só em arquivo estrutural em produção (schema, app.module, layouts);
- backend + frontend + seed + validação + docs na mesma entrega;
- scripts únicos quando aceleram homologação.
Preferência do Marcos: mais rápido, ágil e testável, tudo em um bloco só.
Regra de ouro: nenhum sprint novo começa sem o anterior homologado.

## 2. Stack atual
Backend: NestJS • Prisma • PostgreSQL • JWT • RBAC @Roles() • serviços
determinísticos • PDFs no backend (jspdf 2.5.2 + jspdf-autotable 3.8.2 pinados) •
notificações plugáveis via fetch nativo (SendGrid/Twilio/Log — ADR-086).
Frontend: Next.js App Router • React • Tailwind • Axios c/ interceptor JWT •
Sonner • Lucide • gráficos CSS puro quando possível.
Banco:
- Postgres LOCAL porta 5432 = dados REAIS (usuário postgres; NÃO tocar).
- Docker Compose porta 5433 = banco virgem p/ testes (radar_user/radar_password/
  radar_db; radar_user SEM CREATEDB → usar db push ou migrate deploy, nunca
  migrate dev com shadow database).
Portas dev ativas: site institucional 3000 • backend NestJS 3001 • frontend
Radar dev 3005 (Docker Desktop instável; rebuild das imagens PENDENTE).

## 3. ADRs principais
ADR-001 Gráficos CSS puro (Recharts incompatível c/ React 19+Turbopack).
ADR-002 CSV com UTF-8+BOM (acentos no Excel).
ADR-003 Zustand persist p/ SSR seguro.
ADR-004 Multi-tenant single-database por companyId.
ADR-020 Herança de planos derivada em memória; independente não herda E não doa;
ordem por multiplicador; preços com round2.
ADR-021 Ícones Lucide: tooltip via wrapper <span title>.
ADR-022 Proibido arquivo de backup dentro de src/ (quebra next build).
ADR-023 Optional chaining (?.) em .map de opcionais no JSX.
ADR-024 Sonner: action/cancel exigem onClick (usar () => {} p/ só fechar).
ADR-025 RBAC em 3 camadas (Middleware/UI → @Roles() → RolesGuard).
ADR-030 Regra de Ouro da Aurora: prepara/classifica/calcula/sugere; obrigação
legal nunca é transmitida sem aprovação humana.
ADR-031 Cálculo determinístico no backend (tributos, scores, guias, métricas).
ADR-032 Cofres AES-256-GCM p/ credenciais/certificados (implementado na FD-8).
ADR-034/034.1/034.2 Arquivos estruturais = delta cirúrgico; novos/quebrados =
completo; sprints autocontidas.
ADR-035 PDFs no backend c/ versões pinadas.
ADR-036 NFS-e ABRASF 2.0 c/ adaptadores municipais; XML desconhecido preserva rawXml.
ADR-037 Origem do documento em source: MANUAL/EMAIL/PORTAL/OCR.
ADR-038 Memória de cálculo auditável (steps/sources/lawRef em JSON).
ADR-039 IMAP como coletor (source = EMAIL).
ADR-043.1 Logo proporcional (chip branco, nunca clipar em círculo).
ADR-051 Benchmark de cargos: catálogo estático versionado, gaps em memória.
ADR-054 Fórmulas seguras por whitelist (proibido eval/Function).
ADR-055 Score 0–100 determinístico, 5 dimensões ponderadas.
ADR-056 Mentoria derivada do Score, catálogo fixo, zero IA generativa.
ADR-057 Checklist persistido por tenant (idempotente companyId+title+source).
ADR-058 Ranking de níveis (Bronze→Diamante) multi-tenant.
ADR-066 Ciclo Contábil por cliente: balancete+razão+sugeridor ("esse e somente
esse cliente").
ADR-067 Idempotência de imports contábeis (reimportar substitui, nunca duplica).
ADR-068 Sugestão em 3 camadas (memória do razão → regras → revisão) c/ revisão
humana obrigatória; upload por texto (zero multipart).
ADR-069 Conta bancária da partida detectada pela seção do extrato (multi-conta).
ADR-070 Plano sincronizado do balancete: seq ("Conta") + code ("Classificação").
ADR-071 Encoding de CSV detectado (UTF-8 → Windows-1252 fallback).
ADR-072 Multi-planos por cliente: Client.accountingPlan = fonte da verdade.
ADR-073 Exportação SCI c/ nºs reduzidos e decimal com PONTO.
ADR-074 Partida dobrada manual: D e C obrigatórios, valor espelhado (D=C),
auto-CONCILIADO; conciliação em lote; impressão/PDF dos extratos por cliente.
ADR-077 Radar em produção usa o Postgres REAL local (5432, radar_db) via
host.docker.internal:5432; sem container de banco novo.
ADR-078 typescript.ignoreBuildErrors=true apenas no build Docker.
ADR-079 Túnel Cloudflare único p/ site + Radar (radar./radar-api.).
ADR-080 `migrate resolve --applied` p/ sincronizar _prisma_migrations quando o
DDL já existe; nunca reset em banco com dados.
ADR-081 ARG/ENV NEXT_PUBLIC_* antes do `next build` no Dockerfile.
ADR-082 Scroll suave nativo em vez de hash do router.
ADR-083 Limpeza técnica de erros TS antes de remover `ignoreBuildErrors`.
ADR-084 Domínio puro CNAB isolado (parsers/builders sem banco/HTTP); aprovação
humana obrigatória em toda cobrança automática.
ADR-085 Arquitetura híbrida FD-5: BillingInstruction = fonte de verdade;
CnabArquivo/Movimento = histórico CNAB; CobrancaRegra/Evento = régua c/ workflow
humano.
ADR-086 Notificações plugáveis por estratégia (SendGrid/Twilio/Log) via fetch
nativo (zero deps); MODO LOG sem chaves; falha real → FALHOU (sem fallback
silencioso).
ADR-087 Vínculo Client↔cobrança/evento por auto-match determinístico (nome
normalizado) + seleção manual; destinatário = override humano > contato do
client (contactEmail/contactPhone) > modo log.
ADR-088 Monitoramento e backup opt-in por ambiente (Sentry + Backup local). 
Sem DSN/chaves no .env, o sistema roda em silêncio total (zero custo em dev). 
Backup via script PowerShell nativo (pg_dump) agendado no Windows Task Scheduler, 
independente do runtime Node.js.
ADR-089 Ajuda contextual em 2 camadas (Progressive Disclosure): modal rápido
para usuários casuais + página detalhada para operadores.
ADR-090 Catálogo centralizado em TypeScript (type-safe, sem CMS externo).
🆕 ADR-091 Gestão de Usuários e Ciclo Seguro de Senhas: Soft Delete (preserva
auditoria e libera e-mail via sufixo temporal), troca forçada no 1º login via
modal bloqueante, senha provisória com hash bcrypt, travas de auto-exclusão e
proteção do último admin do tenant.
🆕 ADR-092 Seed Enterprise Unificado e Idempotente: substituição de scripts
fragmentados por um único `prisma/seed.ts` orquestrado (Tenant → Catálogo →
Pessoas → Aurora → Propostas), garantindo consistência e reprodutibilidade.

## 4. Status macro
Sprints 1–32 concluídas: dashboard, clientes, operacional, fiscal (NF-e/estoque/
ICMS/SPED), bancário (fechamento/DREs), contábil (plano/partidas/SCI), revisão
inteligente, BI, ponto fora da curva.
CICLO CONTÁBIL SCI (ETAPAS 1–3) ✅ HOMOLOGADO em 25/08/2026.
SPRINT 32 ✅ HOMOLOGADA: produção local Radar+Site via túnel Cloudflare
(radar.contacerta.com.br + radar-api.contacerta.com.br).
🆕 MÓDULO DE USUÁRIOS ✅ HOMOLOGADO: CRUD, RBAC, Soft Delete, Troca Forçada e Seed Unificado.
AURORA FD-5+Fases 4/5/6 ✅ HOMOLOGADA em 27/08/2026 (ver §6 e §9).
FASE 4 (Projetos e Tarefas) ✅ HOMOLOGADA em 31/08/2026 (ver §11).


## 5. Plano 2.0 — Fases concluídas
Fase A (Comercial) completa: A1→A7.
Fase B (Pessoas) completa: B1→B5.
Fase C (Mercado) completa: C1→C4 (Score real 51 = Prata 🥈).
Fase D (Mentoria) completa: D1→D3.

## 6. Funcionário Digital Aurora
Conceito: JARVIS contábil — acorda, prepara, confere, sugere; nunca executa
sozinho obrigação legal (ADR-030).
Concluída: FD-1 fundação • FD-2 relatórios+aprovações • FD-3a NFS-e ABRASF •
FD-3b coleta IMAP • FD-4 guias (DAS/ISS/DARF c/ memória) • FD-6 EFD-Contribuições
• FD-8 legalização + cofre AES-256-GCM.
FD-5 v2 ✅ (27/08): CNAB 240/400 (domínio puro, 16 testes) + régua de cobrança c/
aprovação humana + notificações plugáveis + vínculo Client + tela 4 abas c/
autopreenchimento da carteira. Backend c/ 19 rotas /billing (JwtAuthGuard).
Pendente: FD-7 integrações Domínio/Questor/Sage • FD-9 DP leve.

### 7. Páginas principais
Operacional: /dashboard • /dashboard/minha-empresa • /dashboard/pessoas •
/dashboard/pessoas/benchmark • /dashboard/clientes • /dashboard/projetos •
/dashboard/tarefas.
Comercial: /dashboard/precificacao • .../meus-planos • .../desempenho •
/dashboard/planejamento.
Fiscal/Bancário/Contábil: /dashboard/fiscal(+notas/estoque/apuracao/sped/
comparativo) • /dashboard/fechamento • /dashboard/lancamentos •
/dashboard/contabil(+plano-contas/ciclo-contabil).
Inteligência: /dashboard/funcionario-digital(+relatorios/nfse/guias/
cobranca ⭐ 4 abas) • /dashboard/bi(+dre-cliente) • /dashboard/ponto-fora-da-curva
• /dashboard/indicadores(+custom) • /dashboard/score • /dashboard/mentoria •
/dashboard/ranking • /dashboard/planejamento-tributario •
/dashboard/reforma-tributaria.
Administração: /dashboard/admin • /dashboard/admin/catalogo • 
🆕 /dashboard/admin/usuarios.
Fase A (Comercial): A1 herança de planos ✅(domínio) • A2 valor ref. + dinheiro na
mesa ✅(backend + frontend) • A3 versões de proposta • A4 fechamento c/ ganho •
A5 white-label • A6 PDF v2+PNG • A7 dashboard desempenho.

## 8. O que falta para terminar
Bloco Aurora: FD-7 • FD-9 (FD-5/6/8 ✅).
Fase E (UX): E1 command palette Ctrl+K • E2 "onde parou" • E3 notificações.
Produção 33–34: CI/CD (GitHub Actions) • Sentry + backup automático •
rebuild Docker das imagens c/ Aurora (paridade dev/prod).
Backlog pós-produção (22/08): DEV: testes de domínio (Vitest) • auditoria cofre +
rate limit + LGPD • paginação/máscaras • busca de entidades no Ctrl+K • BullMQ p/
Aurora • Portal do Cliente. CONTÁBIL: calendário de obrigações por regime/município
• retenções NFS-e • Simples c/ Fator R • Score de Compliance por cliente •
checklist de fechamento • ECD/ECF • ICMS-ST por NCM/CEST • ISS por município •
créditos tributários. REGRA: nada entra antes das Sprints 33–34.

## 9. Status atual e próximos passos

### ✅ FASES CONCLUÍDAS
- Fases 1-2.5: Fundação + BI + Fiscal + Bancário + Contábil (Sprints 1-30)
- Fase 3: Produção (Docker, CI/CD, Backup) — parcial
- Fase A: Comercial (A1-A7) ✅
- Fase B: Pessoas (B1-B5) ✅
- Fase C: Mercado (C1-C4) ✅
- Fase D: Mentoria (D1-D3) ✅
- Fase E: UX (Command Palette, Notificações, "Onde parei") ✅
- **Fase 4: Projetos e Tarefas ✅ (31/08/2026)**

###  EM ANDAMENTO
- Aurora FD-7 (Integrações Domínio/Questor/Sage)
- Aurora FD-9 (DP Leve)
- Hardening de Produção (Sentry backend, CI/CD, Backup)

###  PRÓXIMAS FASES
- Portal do Cliente (visão externa para clientes)
- Relatórios PDF Profissionais (DRE, Balancete, Propostas)
- Testes Automatizados (Playwright E2E)

## 10. Instrução para a nova IA
Leia este arquivo, confirme com "Yes", e continue EXATAMENTE do §9.
Não reimplementar sprints concluídas; não mudar stack; seguir método do §1.

## 11. Fase 4 — Projetos e Tarefas (31/08/2026)

### Módulos Implementados
- **ProjectsModule**: CRUD completo de projetos com métricas, filtros, validação de cliente
- **TasksModule**: CRUD completo de tarefas com Kanban, métricas, filtros, validação de projeto/responsável

### Endpoints Principais
- `GET /projects` — lista projetos com filtros (status, priority, clientId, search)
- `GET /projects/metrics` — KPIs (total, active, onHold, completed, overdue, overallProgress)
- `POST /projects` — cria projeto (valida clientId se fornecido)
- `PATCH /projects/:id` — atualiza projeto (auto-preenche completedAt se status=COMPLETED)
- `DELETE /projects/:id` — soft delete (bloqueia se houver tarefas pendentes)

- `GET /tasks` — lista tarefas com filtros (status, priority, category, projectId, assigneeId, search)
- `GET /tasks/metrics` — KPIs (total, backlog, todo, inProgress, review, done, overdue, unassigned, completionRate)
- `POST /tasks` — cria tarefa (valida projectId e assigneeId se fornecidos)
- `PATCH /tasks/:id` — atualiza tarefa (auto-preenche completedAt se status=DONE)
- `DELETE /tasks/:id` — soft delete

### Frontend
- `/dashboard/projetos` — Grid de projetos com KPIs, filtros, modal de criação/edição
- `/dashboard/tarefas` — Quadro Kanban com drag & drop nativo HTML5, KPIs, filtros, modal de criação

### ADRs
- **ADR-093**: Drag & Drop nativo HTML5 (zero dependências extras)
- **ADR-094**: Proteção de integridade — projeto só pode ser excluído se não tiver tarefas pendentes
- **ADR-095**: KPIs calculados no backend (consistência e performance)

### Status
✅ HOMOLOGADO em 31/08/2026.