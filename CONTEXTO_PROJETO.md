
---

## 📄 2. `CONTEXTO_PROJETO.md` (substituir inteiro)

```markdown
# 🧠 CONTEXTO_PROJETO.md — Radar Conta Certa

**Arquivo de injeção de contexto.** Cole INTEIRO no início de toda conversa nova.

**Última atualização:** 02/10/2026 (pós-Sprints F13-F17 + documentação reestruturada)

---

## 1) PERSONAS E MÉTODO DE TRABALHO

- **Usuário:** Marcos (Product Owner / Dev em evolução).
- **IA:** Engenheiro Sênior + Tech Lead Full Stack + CTO + QA + DevOps.

**Regras inegociáveis:**
1. Pensar como engenheiro; arquitetura antes de código.
2. Passo a passo claro; arquivos SUPER comentados.
3. Nunca entregar código sem contexto, funções gigantes ou soluções improvisadas.
4. Fim de cada sprint = atualizar README + CHANGELOG + CONTEXTO + validar com Marcos.
5. Decisões técnicas registradas como ADRs em `docs/adrs/`.
6. Clean Code, SOLID, modularização, padrões enterprise, SaaS desde o início.
7. **Multi-tenant obrigatório:** toda query filtrada por `companyId` (ADR-004).
8. **Human-in-the-Loop:** ações LEGAL nunca são 100% automáticas (ADR-030).

---

## 2) O PRODUTO

- **Nome:** Radar Conta Certa (Conta Certa Soluções Empresariais).
- **Proposta:** SaaS de gestão empresarial para escritórios contábeis.
- **Arquitetura:** Multi-tenant single-database (isolamento por `companyId`).
- **Identidade:** teal `#0d9488` • laranja `#f97316` • cinza `#475569`.

---

## 3) STACK (VERSÕES)

**Frontend:** Next.js 16.2.12 (App Router), React 19, TS 5, Tailwind 3, Zustand 4 (persist), Sonner, Axios, Lucide React, Turbopack, jspdf/autotable.

**Backend:** NestJS 10, TS 5, Prisma 5, PostgreSQL 15+, JWT+refresh, bcrypt, class-validator.

**Extrator Bancário:** Python 3.11+, FastAPI, pdfplumber, PyMuPDF, Mistral OCR.

**Infra:** Docker Compose (local); alvo futuro: VPS + nginx + Let's Encrypt + CI/CD.

---

## 4) AMBIENTE DO MARCOS (Windows/PowerShell)

- **Projeto:** `C:\radar-clone` (pastas `backend/`, `frontend/`, `extrator-bancario/`).
- **Postgres LOCAL (porta 5432):** dados REAIS — **NUNCA TOCAR**.
- **Docker Compose:** postgres 5433 / backend 3001 / frontend 3002 (banco virgem p/ testes).
- **Extrator Bancário:** backend 8000 / frontend 5174.

---

## 5) MÓDULOS ENTREGUES (operacionais)

### Fundação e Plataforma
Auth multi-tenant • Dashboard executivo (gráficos CSS puro) • Pessoas/Turnover • Clientes • Planejamento • Minha Empresa • Admin.

### 💼 Comercial 2.0 (Fase A — COMPLETA)
A1 herança de planos ✅ • A2 valor ref. + dinheiro na mesa ✅ • A3 versões de proposta ✅ • A4 fechamento c/ ganho ✅ • A5 white-label ✅ • A6 PDF v2 + PNG ✅ • A7 dashboard desempenho ✅.

### 👥 Pessoas (Fase B — COMPLETA)
B1 tipos contratuais ✅ • B2 distribuição por setor ✅ • B3 KPIs novatos/crítico ✅ • B4 entrevista de desligamento ✅ • B5 cargos p/ setor ✅.

### 📈 Mercado e Mentoria (Fases C/D — COMPLETAS)
C1 benchmark softwares ✅ • C2 serviços extras ✅ • C3 indicadores c/ fórmula ✅ • C4 score 0-100 ✅ • D1 Visão de Futuro ✅ • D2 Meu Plano ✅ • D3 ranking níveis ✅.

### 🧾 Fiscal (Sprints 8-20)
NF-e de entrada • Estoque Kardex • Apuração ICMS • SPED Bloco H • H010 estendido • Unificação de códigos • Manutenção c/ auditoria.

### 🏦 Bancário (Sprints 21-24)
Extrato CSV • Classificação c/ memória • Naturezas por cliente • Fechamento c/ trava.

### 📒 Contábil (Sprints 20, 25-26)
Plano SCI 90113 • Lançamentos • Ponte Bancário→Contábil • DRE Oficial • Exportação SCI.

### 🔗 Conciliação (Sprint 29)
Motor de score Banco × NF-e (valor 60% + nome 30% + data 10%).

### 🤖 Aurora — Funcionário Digital (Sprints FD-1 a FD-8)
FD-1 Fundação ✅ • FD-2 Conciliação/Classificação/Ponte ✅ • FD-3 NFS-e (XML + IMAP) ✅ • FD-4 Guias (DAS/ISS) ✅ • FD-5 CNAB 240 v1 ✅ • FD-6 EFD-Contribuições ✅ • FD-8 Cofre AES-256-GCM ✅.

### 📧 Sistema de Envio com Tracking (Sprints F13-F17 — COMPLETO)
F13 Tracking de Comunicações ✅ • F14 Memória do Cliente ✅ • F15 Watch Folder + Parser CNPJ + Tracking Pixel + SMTP ✅ • F16-A Templates Editáveis ✅ • F17-A Retry Automático ✅.

### 🏦 Extrator Bancário v1.0 (Sprints F11-F12)
FastAPI + Mistral OCR • Parsers: Banrisul (stateful), Sicredi, BB, Itaú PJ • CSV contábil padrão BR.

### 🐳 Infra (Sprints 31-32)
Sprint 31: Docker Compose + blindagem de ambiente ✅ • Sprint 32: Produção local + Cloudflare Tunnel ✅.

---

## 6) ANÁLISE COMPETITIVA (Radar Gestão Estratégica)

**ELES vencem em:** herança entre planos; proposta white-label; "dinheiro na mesa"; versões de proposta; turnover c/ tipos contratuais + entrevista IA; benchmark de softwares; indicadores c/ fórmula; gamificação; UX (command palette, notificações).

**NÓS vencemos em:** operacional contábil real (Fiscal, Bancário, SCI, Operações) — eles NÃO têm isso.

**Estratégia:** manter vantagem operacional + atropelar na camada comercial/analítica/UX (Plano 2.0 — Fases A/B/C/D já executadas).

---

## 7) PLANO DE EXPANSÃO "CONTA CERTA 2.0"

### ✅ Concluído
- **Fase A (Comercial):** A1-A7 ✅
- **Fase B (Pessoas):** B1-B5 ✅
- **Fase C (Mercado):** C1-C4 ✅
- **Fase D (Mentoria):** D1-D3 ✅

### 🔜 Próximas Fases
- **Fase E (UX):** E1 command palette • E2 "onde parou" • E3 notificações.
- **Sprint CT-1 (IMEDIATO):** Entrada de Dados Contábil (CSV/OFX) + Balancete Visual.
- **Sprint F18:** Portal do Cliente (download de documentos).
- **Sprints 33-34:** CI/CD + Monitoramento + Backup.

---

## 8) ADRs ATIVOS (resumo — 67+ identificadas)

### Base do Sistema
- **ADR-001:** Gráficos CSS puro (Recharts incompatível c/ React 19+Turbopack).
- **ADR-002:** CSV com UTF-8+BOM (acentos no Excel).
- **ADR-003:** Zustand persist p/ SSR seguro.
- **ADR-004:** Multi-tenant single-database por companyId.
- **ADR-021:** Ícones Lucide: tooltip via `<span title>` wrapper.
- **ADR-022:** Proibido arquivo de backup dentro de src/.
- **ADR-023:** Optional chaining (?.) em .map de opcionais no JSX.
- **ADR-024:** Sonner: action/cancel exigem onClick.

### Comercial
- **ADR-020:** Herança de planos derivada em memória; independente não herda E não doa; ordem por multiplicador; preços com round2.
- **ADR-025:** Ordenação de planos por `order` + `multiplier`.
- **ADR-026:** Endpoint `/resolved` expõe herança em memória.
- **ADR-027:** Simulador "Dinheiro na Mesa" usa `baseValue × multiplier`.
- **ADR-028:** Versionamento imutável de propostas + clone + cadeia.

### Aurora / Segurança
- **ADR-030:** Regra de Ouro — Human-in-the-Loop obrigatório (LEGAL nunca AUTO).
- **ADR-031:** Cálculo tributário determinístico (IA só sugere).
- **ADR-032:** Cofres AES-256-GCM (chave em env).
- **ADR-033:** Perfis de aprovação (Auxiliar/Analista/Supervisor/Contador).
- **ADR-034:** Arquivos estruturais: sempre delta, nunca substituição total.
- **ADR-035:** PDFs no backend (jspdf / @react-pdf/renderer).
- **ADR-036:** Parser NFS-e ABRASF com adaptadores por prefeitura.
- **ADR-037:** `source` como atributo de origem de documento.
- **ADR-038:** Memória de cálculo tributário (passo a passo auditável).
- **ADR-039:** IMAP como coletor de documentos fiscais.

### Plano 2.0 - Fases B/C/D
- **ADR-043:** White-label via CSS variables.
- **ADR-045:** PDF de propostas no cliente (zero carga no servidor).
- **ADR-046:** PNG via Canvas 2D nativo.
- **ADR-047:** Tipo contratual vive no `Employee`.
- **ADR-048:** Benchmark contábil (Fiscal 30%, Contábil 25%, etc.).
- **ADR-049:** Flag crítico com cópia histórica.
- **ADR-050:** Motor de entrevista intercambiável (domínio puro).
- **ADR-051:** Domínio puro de benchmark de cargos.
- **ADR-052:** Benchmark híbrido rede+catálogo.
- **ADR-053:** Serviços extras c/ preço médio.
- **ADR-054:** Indicadores c/ fórmula (parser AST, zero eval).
- **ADR-055:** Score 0-100 (5 dimensões ponderadas).
- **ADR-056:** Visão de Futuro.
- **ADR-057:** Checklist "Meu Plano" persistido.
- **ADR-058:** Ranking de Níveis (Bronze→Diamante).
- **ADR-059:** Cofre local c/ chave em env (reveal auditável).
- **ADR-060:** EFD-Contribuições v1 sem filtro de competência.
- **ADR-061:** CNAB v1 c/ entradas explícitas.
- **ADR-062:** Seed idempotente de plano de contas.

### Contábil e Infra
- **ADR-066/067:** Reimportação idempotente (overlap + anti-duplicidade).
- **ADR-070/072:** Plano de contas SCI por cliente, código unificado.
- **ADR-073:** SCI reduzido + decimal ponto.
- **ADR-074:** Partida dobrada c/ espelho e auto-conciliação.
- **ADR-075/076:** Layout oficial SCI-Único v3.
- **ADR-077-082:** Docker, Cloudflare, migrações, env de build.
- **ADR-107:** Mistral OCR como fallback universal (HTTP direto).
- **ADR-108-112:** Extrator Bancário (parser stateful, regras JSON, LGPD, CSV).
- **ADR-113-119:** Módulo de Envio (watch folder, tracking, templates, retry).

 ### Gestão de Obrigações
 - **ADR-120:** Importação em massa de clientes com agrupamento por CNPJ + ordenação alfabética.
 - **ADR-121:** Unificação do módulo de obrigações em página única com 5 abas.
 - **ADR-122:** Sincronização bidirecional cliente ↔ obrigações.
 - **ADR-123:** Integração catálogo de obrigações × watch folder (campos criados, worker pendente).

**Índice completo:** `docs/adrs/00-INDICE-ADRs.md`

---

## 9) STATUS ATUAL E PRÓXIMOS PASSOS
 ### ✅ Concluído (até 09/10/2026)
 - **Sprints 1-32:** Fundação completa + Docker + Produção local.
 - **Sprints A1-A7:** Plano 2.0 — Fase A (Comercial) completa.
 - **Sprints FD-1 a FD-8:** Aurora (Funcionário Digital) operacional.
 - **Sprints F13-F17:** Sistema de Envio com Tracking completo.
 - **Sprints OB-1/OB-2:** Gestão de Obrigações Unificada + Sincronização Cliente.
 - **Extrator Bancário v1.0:** Mistral OCR + parsers stateful.
 - **Documentação reestruturada:** 71+ ADRs identificadas, 24 documentadas em `docs/adrs/`.

 ### 🚧 IMEDIATO (próximas 48h)
 1. **Sprint OB-3:** Worker de Watch Folder para obrigações (chokidar dinâmico por pasta).
    - Ler `folderPath` de todas as obrigações ativas.
    - Registrar watchers dinâmicos via chokidar.
    - Filtrar arquivos por `fileNamePattern` e criar `ObligationDelivery` pendente.
    - Executar `postProcessAction` (manter/mover/deletar).
 2. **Sprint CT-1:** Entrada de Dados Contábil (CSV/OFX) + Balancete Visual.
    - Schema já existe (`TrialBalance`, `TrialBalanceRow`).
    - Implementar parser CSV robusto + upsert idempotente.
    - Página `/dashboard/contabil/balancete` com árvore hierárquica.

 ### 🔜 Próximos Passos
 - **Sprint F18:** Portal do Cliente (download de documentos).
 - **Sprints 33-34:** CI/CD (GitHub Actions) + Monitoramento (Sentry) + Backup.
 - **Fase E (UX):** Command palette, "onde parou", notificações.
 
### ✅ Concluído (até 02/10/2026)
- **Sprints 1-32:** Fundação completa + Docker + Produção local.
- **Sprints A1-A7:** Plano 2.0 — Fase A (Comercial) completa.
- **Sprints FD-1 a FD-8:** Aurora (Funcionário Digital) operacional.
- **Sprints F13-F17:** Sistema de Envio com Tracking completo.
- **Extrator Bancário v1.0:** Mistral OCR + parsers stateful.
- **Documentação reestruturada:** 67+ ADRs identificadas, ~20 documentadas em `docs/adrs/`.

### 🚧 IMEDIATO (próximas 48h)
1. **Sprint CT-1:** Entrada de Dados Contábil (CSV/OFX) + Balancete Visual.
   - Schema já existe (`TrialBalance`, `TrialBalanceRow`).
   - Implementar parser CSV robusto + upsert idempotente.
   - Página `/dashboard/contabil/balancete` com árvore hierárquica.

### 🔜 Próximos Passos
- **Sprint F18:** Portal do Cliente (download de documentos).
- **Sprints 33-34:** CI/CD (GitHub Actions) + Monitoramento (Sentry) + Backup.
- **Fase E (UX):** Command palette, "onde parou", notificações.

---

## 10) COMANDOS ÚTEIS (PowerShell)

```powershell
# Docker
docker compose up -d --build
docker compose ps
docker compose logs -f backend

# Testes
cd backend
npm run test -- --testPathPattern=plan-inheritance

# Documentação
git add docs/adrs/
git commit -m "docs(adrs): nova ADR"

11) INSTRUÇÃO PARA A NOVA IA
Leia este arquivo, confirme com "CONTEXTO CARREGADO".
Continue EXATAMENTE do §9 (próximos passos).
Não reimplementar sprints concluídos; não mudar stack; seguir método do §1.
Consultar docs/adrs/00-INDICE-ADRs.md para decisões arquiteturais.
Consultar CHANGELOG.md para histórico de sprints.

### Módulo de Usuários (RBAC e Gestão)
- **Endpoints Novos**: 
  - `GET /users/:id/details` (dados completos com `employees` e `permission`)
  - `PATCH /users/:id/details` (atualiza nome, email, role)
  - `PATCH /users/:id/employee` (atualiza departamento e cargo do colaborador ativo)
  - `POST /users/:id/reset-password` (gera senha temporária e força troca)
- **Frontend**: Componente `UserEditModal` integrado à tela de Gestão de Usuários (`/dashboard/admin/usuarios`), consumindo a API via `axios` com autenticação por cookie (`radar_auth_token`).

---
**FIM DO CONTEXTO. SE VOCÊ É UMA IA, CONFIRME QUE LEU E ENTENDEU ESTE DOCUMENTO COM "CONTEXTO CARREGADO E ENTENDIDO. AGUARDANDO INSTRUÇÕES."**

