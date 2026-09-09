# 🧠 CONTEXTO_PROJETO.md — Radar Conta Certa

**Arquivo de injeção de contexto.** Cole INTEIRO no início de toda conversa nova.
**Última atualização:** 10/09/2026 (pós-Sprint Extrator Bancário v1.0 — Mistral OCR, parsers stateful, LGPD e Human-in-the-Loop).

---

## 1. Método oficial de trabalho
Sprints autocontidas. ADR-034.2 — entrega all-in-one:
- Arquivos completos sempre que possível (novos ou quebrados).
- Delta cirúrgico só em arquivo estrutural em produção (schema, app.module, layouts).
- Backend + frontend + seed + validação + docs na mesma entrega.
- Scripts únicos quando aceleram homologação.
- **Preferência do Marcos:** mais rápido, ágil e testável, tudo em um bloco só.
- **Regra de ouro:** nenhum sprint novo começa sem o anterior homologado.

---

## 2. Stack atual
**Backend Radar:** NestJS 10 • Prisma 5 • PostgreSQL • JWT • RBAC `@Roles()` • serviços determinísticos • PDFs no backend (jspdf 2.5.2 + jspdf-autotable 3.8.2 pinados) • notificações plugáveis via fetch nativo (SendGrid/Twilio/Log — ADR-086).

**Frontend Radar:** Next.js App Router • React 19 • TypeScript • Tailwind • Axios c/ interceptor JWT • Sonner • Lucide • gráficos CSS puro quando possível.

**🆕 Extrator Bancário (App Irmã Python):** Python 3.14 • FastAPI • uvicorn • `requests` • `pdfplumber` + `PyMuPDF` • Mistral OCR (fallback para PDFs escaneados/complexos) • Frontend Vite/React próprio (:5174).

**🆕 Site Conta Certa (App Irmã):** Vite/React + Express (Node).

**Banco de Dados:**
- Postgres LOCAL porta `5432` = dados REAIS (usuário postgres; **NÃO tocar**).
- Docker Compose porta `5433` = banco virgem p/ testes (radar_user/radar_password/radar_db; radar_user SEM CREATEDB → usar `db push` ou `migrate deploy`, nunca `migrate dev` com shadow database).

**Infra:** Docker Compose raiz + túnel Cloudflare (produção local, ADR-077/079) • 🆕 `Iniciar-Tudo.ps1` p/ dev unificado (F9, ADR-103).

---

## 3. ADRs principais (Registro Canônico)
001 Gráficos CSS puro • 002 CSV com UTF-8+BOM • 003 Zustand persist p/ SSR seguro • 004 Multi-tenant single-database por companyId • 020 Herança de planos derivada em memória • 021 Ícones Lucide: tooltip via wrapper `<span title>` • 022 Proibido arquivo de backup dentro de `src/` • 023 Optional chaining (`?.`) em `.map` de opcionais no JSX • 024 Sonner: action/cancel exigem `onClick` • 025 RBAC em 3 camadas • 030 **Regra de Ouro da Aurora:** prepara/classifica/calcula/sugere; obrigação legal nunca é transmitida sem aprovação humana • 031 Cálculo determinístico no backend • 032 Cofres AES-256-GCM p/ credenciais • 034/034.1/034.2 Arquivos estruturais = delta cirúrgico; novos/quebrados = completo • 035 PDFs no backend c/ versões pinadas • 036 NFS-e ABRASF 2.0 c/ adaptadores • 037 Origem do documento em `source` • 038 Memória de cálculo auditável • 039 IMAP como coletor • 043.1 Logo proporcional • 051 Benchmark de cargos • 054 Fórmulas seguras por whitelist • 055 Score 0–100 determinístico • 056 Mentoria derivada do Score • 057 Checklist persistido por tenant • 058 Ranking de níveis multi-tenant • 066 Ciclo Contábil por cliente • 067 Idempotência de imports contábeis • 068 Sugestão em 3 camadas c/ revisão humana obrigatória • 069 Conta bancária da partida detectada pela seção do extrato • 070 Plano sincronizado do balancete • 071 Encoding de CSV detectado • 072 Multi-planos por cliente • 073 Exportação SCI c/ nºs reduzidos e decimal com PONTO • 074 Partida dobrada manual • 077 Radar em produção usa Postgres REAL local (5432) via `host.docker.internal` • 078 `typescript.ignoreBuildErrors=true` apenas no build Docker • 079 Túnel Cloudflare único p/ site + Radar • 080 `migrate resolve --applied` p/ sincronizar migrations • 081 ARG/ENV `NEXT_PUBLIC_*` antes do `next build` • 082 Scroll suave nativo • 083 Limpeza técnica de erros TS • 084 Domínio puro CNAB isolado • 085 Arquitetura híbrida FD-5 • 086 Notificações plugáveis por estratégia • 087 Vínculo Client↔cobrança por auto-match • 088 Monitoramento e backup opt-in • 089 Ajuda contextual em 2 camadas • 090 Catálogo centralizado em TypeScript • 091 Gestão de Usuários e Ciclo Seguro de Senhas • 092 Seed Enterprise Unificado e Idempotente • 093 Drag & Drop nativo HTML5 • 094 Proteção de integridade em projetos • 095 KPIs calculados no backend.

**🆕 ADRs do Extrator Bancário (10/09/2026):**
- **ADR-107:** Mistral OCR como fallback universal via HTTP direto (sem SDK) para evitar quebras de versão. Normalização de caracteres full-width.
- **ADR-108:** Parser stateful para Banrisul, mantendo estado entre linhas para lidar com quebras de linha do OCR.
- **ADR-109:** Persistência de regras de classificação em JSON (`data/regras/regras_aprendidas.json`) com merge idempotente, com transição futura para PostgreSQL.
- **ADR-110:** Mascaramento LGPD de documentos sensíveis aplicado no backend antes do retorno ao frontend (últimos 3 dígitos preservados).
- **ADR-111:** Geração de CSV compatível com sistemas contábeis brasileiros (Domínio, Alterdata, Sênior, Contmatic) usando delimitador `;` e encoding `utf-8-sig`.
- **ADR-112:** Human-in-the-Loop obrigatório no fluxo de classificação. Lançamentos chegam como "pendente" e regras só são salvas após edição e aprovação manual em lote.

---

## 4. Status macro
- Sprints 1–32 concluídas e homologadas (dashboard, clientes, operacional, fiscal, bancário, contábil, BI, Aurora FD-1→FD-6+FD-8, FD-5 v2, usuários, projetos).
- **🆕 Extrator Bancário v1.0 homologado (10/09/2026):** 3 parsers (BB/Sicredi/Banrisul) + Mistral OCR fallback + LGPD + Human-in-the-Loop + CSV contábil.
- Produção local: túnel Cloudflare (`radar.contacerta.com.br` + `radar-api.contacerta.com.br`) — Sprint 32 ✅.

---

## 5. Plano 2.0 — Fases concluídas
Fase A (Comercial: A1–A7) ✅ • Fase B (Pessoas: B1–B5) ✅ • Fase C (Mercado: C1–C4) ✅ • Fase D (Mentoria: D1–D3) ✅ • Fase E (UX: palette, "onde parei", notificações) ✅.

---

## 6. Funcionário Digital Aurora
Conceito: JARVIS contábil (ADR-030). 
Concluído: FD-1 • FD-2 (+relatórios) • FD-3a/b • FD-4 guias • FD-5 v2 CNAB 240/400 + régua • FD-6 EFD • FD-8 cofre/legalização.
Pendente: FD-7 (Domínio/Questor/Sage) • FD-9 (DP leve).

---

## 7. Páginas principais
Operacional/Comercial/Fiscal/Bancário/Contábil/Inteligência/Admin conforme versão 27/08.
**🆕 Novas:** `/dashboard/fechamento/extrato-pdf` (unificado F11-a) • links ECOSSISTEMA (Extrator :5174, Site :5173) na sidebar.

---

## 8. O que falta para terminar
- **🆕 F11-b:** Modo Professor (mapeamento assistido de layouts de extrato desconhecidos).
- **🆕 Migração de Regras:** Mover persistência de regras do JSON para PostgreSQL (multi-tenant).
- Aurora: FD-7 • FD-9.
- Produção: Sprints 33–34 (CI/CD, Sentry, backup, rebuild Docker c/ Aurora).
- Portal do Cliente • Relatórios PDF profissionais • Testes E2E (Playwright).
- **REGRA:** nada entra antes das Sprints 33–34.

---

## 9. Status atual e próximos passos
✅ F8–F11 homologadas (09/09): catálogo MRSigns importado; 6/6 apps no ar via `Iniciar-Tudo.ps1`; proxy Extrator com badge 🐍 e fallback 🧩 validados.
✅ **Extrator Bancário v1.0 homologado (10/09):** 3 parsers + Mistral OCR + LGPD + Human-in-the-Loop + CSV contábil + persistência de regras JSON.
**PRÓXIMO (escolher 1):** F11-b Modo Professor • FD-7 integrações • Sprints 33–34.
**EM ANDAMENTO:** hardening de produção (Sentry backend, CI/CD, backup).

---

## 10. Instrução para a nova IA
Leia este arquivo, confirme com "Yes", e continue EXATAMENTE do §11.
Não reimplementar sprints concluídas; não mudar stack; seguir método do §1 e governança de ADRs do §1/§3.

---

## 11. Fase 4 — Projetos e Tarefas (31/08/2026) ✅
ProjectsModule/TasksModule completos (Kanban, KPIs backend, soft delete, integridade projeto×tarefas). ADR-093/094/095. Detalhes no CHANGELOG.

---

## 12. 🆕 ECOSSISTEMA & OPERAÇÃO LOCAL (F9–F11)
**RAIZ REAL:** `C:\Site conta-certa` (site/ + radar-clone/ + docker-compose.yml + Iniciar-Tudo.ps1). Extrator vive em `radar-clone/extrator-bancario/`.

**Portas dev:** 
- Site FE 5173 / Site API 4000 
- Radar FE 3002 / Radar BE 3001 
- **Extrator FE 5174 / Extrator BE 8000** 
- Postgres 5432 (real) / 5433 (Docker).

**Boot único:** `.\Iniciar-Tudo.ps1` (idem `-Prod` p/ Docker; `-SiteOnly`/`-RadarOnly`/`-ExtratorOnly` p/ parcial). Logs: `C:\Site conta-certa\logs\boot-*.log`.
**PowerShell 5.1:** scripts de infra DEVEM ser ASCII puro (emoji/acentos quebram parse).

**Extrator endpoints:**
- `POST /api/parse-extrato` — Upload PDF → OCR → parsing → JSON com LGPD
- `POST /api/classificar` — Recebe extrato, aplica regras (hoje: status pendente)
- `POST /api/salvar-regras-lote` — Persiste regras aprendidas em JSON
- `POST /api/gerar-csv` — Gera CSV contábil em `data/exports/`
- `GET /api/download-csv/{filename}` — Download do CSV (alias: `/api/download/{filename}`)
- `GET /api/regras` — Lista regras aprendidas
- `GET /api/health` — Health check

**Radar endpoints novos:** `POST /accounting/extract-pdf-unified` • `GET /accounting/extractor-health` • `POST /fiscal/inventory/import-catalog`.

**🔐 Segurança:**
- Chave Mistral do `.env` do extrator foi exposta em chat (09/09) → ROTACIONADA e nunca commitar `.env` (regra ADR-032/059).
- `.env` removido de todo o histórico Git via `git filter-repo --force`.
- Validação de tipo (apenas PDF) e tamanho máximo (10MB) no upload.
- Proteção contra path traversal no download de CSV.

---

## 13. 🆕 EXTRATOR BANCÁRIO — ARQUITETURA DETALHADA (10/09/2026)

### Fluxo principal:

text
PDF → [Parser Nativo (pdfplumber/PyMuPDF)] → [Se falhar: Mistral OCR] → OCRParser → JSON com LGPD → Frontend → Edição humana → Salvar regras → CSV contábil


### Parsers implementados:
| Banco | Parser | Estratégia | Status |
|-------|--------|------------|--------|
| BB | `ParserBB` (nativo) + `OCRParser._extrair_lancamentos_bb` | Regex em tabela markdown + detecção por palavras-chave flexíveis | ✅ |
| Sicredi | `ParserSicredi` (nativo) + `OCRParser._extrair_lancamentos_sicredi` | Regex em linha única com identificação de `PIX_CRED`/`PIX_DEB` | ✅ |
| Banrisul | `ParserBanrisul` (nativo) + `OCRParser._extrair_lancamentos_banrisul` | **Stateful:** mantém estado entre linhas (dia, tipo, valor, CPF, nome) para lidar com quebra de linha do OCR | ✅ |

### Normalização OCR (`_normalizar_texto`):
- Caracteres full-width: `：` → `:`, `，` → `,`, `。` → `.`, `√` → ``
- Pipes markdown: `|` → ` `
- Separadores: `---` → removidos
- Múltiplos espaços: normalizados (preservando `\n`)

### Detecção de banco (4 estratégias):
1. Busca direta: `BANRISUL`, `SICREDI`, `BANCO DO BRASIL`
2. Busca sem espaços: `BANCOBRASIL`
3. Palavras-chave individuais: `BANCO` + `BRASIL`
4. Agência específica: regex `Agência.*?1430` → BB

### Estrutura de arquivos do Extrator:
```text
extrator-bancario/
├── backend/
│   ├── .env (NUNCA commitar — ADR-032/059)
│   ├── .gitignore (contém .env)
│   ├── app/
│   │   ├── main.py (FastAPI + endpoints)
│   │   ├── models/lancamento.py (ExtratoBancario, LancamentoBancario, SinalMovimento)
│   │   ├── parsers/
│   │   │   ├── base.py (BaseParser)
│   │   │   ├── bb.py (ParserBB nativo)
│   │   │   ├── banrisul.py (ParserBanrisul nativo)
│   │   │   ├── sicredi.py (ParserSicredi nativo)
│   │   │   ├── parser_factory.py (Detecta banco + orquestra fallback Mistral)
│   │   │   └── ocr_parser.py (Parser genérico pós-OCR com lógica stateful)
│   │   └── services/
│   │       └── ocr_service.py (Chamada HTTP direta à Mistral OCR API)
│   └── data/
│       ├── uploads/ (temporário, limpo após processamento)
│       ├── exports/ (CSVs gerados)
│       └── regras/regras_aprendidas.json (persistência local)
└── frontend/ (Vite/React :5174)
    └── src/
        ├── App.jsx
        ├── components/ (FileUpload, LancamentosTable, ModalSalvarRegrasLote)
        └── services/api.js

Regras de negócio configuráveis (ADR-109):
Regras de classificação salvas em JSON (transição futura para PostgreSQL).
Merge idempotente por chave (descricao_parcial + conta).
Cada regra tem: descricao_parcial, conta, banco, debito, credito, quantidade, criado_em, criado_por, ativa.
Conformidade LGPD (ADR-110):
Mascaramento de documentos no endpoint /api/parse-extrato via função mascarar_documento().
Regra: últimos 3 caracteres preservados, resto substituído por * (ex: 10.601 → **.601).
Logs nunca contêm dados sensíveis.
Chaves API nunca em código (sempre em .env + .gitignore).
14. 🆕 INCIDENTES DE SEGURANÇA REGISTRADOS
2026-09-09 — Exposição de chave Mistral API
Causa: Arquivo .env enviado acidentalmente em chat durante desenvolvimento.
Ação Imediata: Chave rotacionada (revogada) no console da Mistral. Nova chave gerada e aplicada localmente.
Limpeza de Histórico: .env removido de TODO o histórico Git via git filter-repo --path extrator-bancario/backend/.env --invert-paths --force.
Prevenção: .env adicionado ao .gitignore. Regra ADR-032/059 reforçada: nunca commitar .env, nunca enviar em chat.
Nota: O GitHub Push Protection funcionou corretamente, bloqueando o push inicial e evitando que o segredo fosse para o repositório remoto.
Documento autocontido. Qualquer IA que ler este arquivo terá contexto completo para continuar o desenvolvimento sem ambiguidades.


