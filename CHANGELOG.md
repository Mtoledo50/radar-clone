
---

## 📄 3. `CHANGELOG.md` (substituir inteiro)

```markdown
# 📋 CHANGELOG — Radar Conta Certa

Formato baseado em [Keep a Changelog](https://keepachangelog.com/).

---

## [Não Lançado]

### 🔜 Próximos Passos
- **Sprint CT-1:** Entrada de Dados Contábil (CSV/OFX) + Balancete Visual.
- **Sprint F18:** Portal do Cliente (download de documentos).
- **Sprint 33:** CI/CD (GitHub Actions).
- **Sprint 34:** Monitoramento (Sentry) + Backup automático.

---

## [2026-10-02] — Documentação Reestruturada

### Added
- Pasta `docs/adrs/` com 20+ ADRs documentadas em arquivos próprios.
- Arquivo `docs/adrs/00-INDICE-ADRs.md` com índice de 67+ ADRs identificadas.
- Pasta `docs/modules/` com documentação profunda de módulos complexos.
- Pasta `docs/sprints/` com histórico detalhado de sprints específicas.

### Changed
- README.md atualizado com estado real do projeto (02/10/2026).
- CONTEXTO_PROJETO.md atualizado com data e próximos passos corretos.
- CHANGELOG.md consolidado (removidas duplicatas, sprints F13-F17 integradas).

---

## [2026-09-29] — Sprint 32: Produção Local com Cloudflare

### Added
- `docker-compose.yml` unificado (site Vite/nginx + backend Express + Radar Next/Nest + cloudflared).
- Public hostnames no túnel Cloudflare: `radar.contacerta.com.br` + `radar-api.contacerta.com.br`.
- Radar aplica `prisma migrate deploy` no boot contra o Postgres real (5432).
- Botão "Administração" no menu do site institucional.

### Fixed
- Prisma P3009: `migrate resolve --applied` em 6 migrations.
- Cloudflare "DNS record already exists": túnel recriado.
- Site: menu institucional com scroll suave nas âncoras.

### Decisions
- **ADR-077:** Postgres real via `host.docker.internal`.
- **ADR-079:** Túnel único site + Radar.

---

## [2026-09-15] — Sprints F13-F17: Sistema de Envio com Tracking

### Added
- **F13:** Tracking de Comunicações (webhooks + funil visual).
- **F14:** Memória do Cliente (perfil unificado + timeline).
- **F15:** Watch Folder + Parser CNPJ + Fila de Aprovação + Tracking Pixel + SMTP Real.
- **F16-A:** Templates de Email Editáveis (CRUD + preview ao vivo + 8 seeds).
- **F17-A:** Retry Automático com Backoff + Reenvio Manual.

### Decisions
- **ADR-113:** Watch folder via chokidar.
- **ADR-114:** Tracking pixel 1x1 + link proxy determinístico.
- **ADR-115:** Templates editáveis (Handlebars).
- **ADR-116:** Envio plugável (SendGrid/SMTP/LOG).
- **ADR-117:** Human-in-the-Loop obrigatório no envio.
- **ADR-118:** Identificação de cliente por CNPJ no nome do arquivo.
- **ADR-119:** Pasta de enviados com subpastas por competência.

---

## [2026-09-10] — Extrator Bancário v1.0

### Added
- App isolado em Python (FastAPI) para ingestão de PDFs bancários.
- Parsers nativos: Banrisul (stateful, ADR-108), Sicredi, Banco do Brasil, Itaú PJ.
- Fallback universal para Mistral OCR via HTTP direto (ADR-107).
- Geração de CSV contábil padronizado (UTF-8+BOM, delimitador `;`).
- IA de regras contábeis: aprende com correções do contador.

### Security
- **Incidente 2026-09-09:** Chave Mistral API exposta em chat.
- **Ação:** Chave rotacionada + removida do histórico Git via `git filter-repo`.
- **Prevenção:** `.env` adicionado ao `.gitignore`.

---

## [2026-08-29] — Sprint 31: Containerização

### Added
- `docker-compose.yml` (postgres 5433, backend 3001, frontend 3000, volume pgdata).
- `backend/Dockerfile` multi-stage (node:20-slim + OpenSSL p/ Prisma).
- `frontend/Dockerfile` standalone + `next.config` com `output: "standalone"`.
- Script `Iniciar-Tudo.ps1` reescrito em 2 modos (dev/prod).

### Fixed
- `revisao/page.tsx`: +handleSelectDebit/Credit.
- Lucide `title` → wrapper `<span title>` (ADR-021).
- Removido `layout copy.tsx` (quebrava build, ADR-022).
- `layout.tsx`: `item.children?.map` (ADR-023).
- Sonner cancel com `onClick` (ADR-024).

---

## [2026-08-27] — Plano 2.0: Fases A/B/C/D Completas

### Added
- **Fase A (Comercial):** A1-A7 — Herança de planos, dinheiro na mesa, versões de proposta, white-label, PDF v2, dashboard desempenho.
- **Fase B (Pessoas):** B1-B5 — Tipos contratuais, distribuição por setor, KPIs críticos, entrevista IA, benchmark cargos.
- **Fase C (Mercado):** C1-C4 — Benchmark softwares, serviços extras, indicadores c/ fórmula, score 0-100.
- **Fase D (Mentoria):** D1-D3 — Visão de Futuro, Meu Plano, ranking níveis.

### Decisions
- **ADR-020:** Herança de planos em memória.
- **ADR-043:** White-label via CSS variables.
- **ADR-050:** Motor de entrevista intercambiável.
- **ADR-054:** Indicadores c/ parser AST (zero eval).
- **ADR-055:** Score 0-100 ponderado.

---

## [2026-08-18] — Aurora: Funcionário Digital (Sprints FD-1 a FD-8)

### Added
- **FD-1:** Fundação (6 tabelas + 6 enums + dashboard + crons).
- **FD-2:** Skills RECONCILIATION, CLASSIFICATION, ACCOUNTING_BRIDGE + Central de Aprovações.
- **FD-2 final:** MONTHLY_REPORT (PDF mensal por cliente).
- **FD-3:** NFSE_IMPORT (parser ABRASF 2.0) + NFSE_EMAIL_COLLECT (IMAP).
- **FD-4:** TAX_GUIDES (Simples Nacional + ISS com memória de cálculo).
- **FD-5:** Régua de cobrança + CNAB 240 v1 (Itaú).
- **FD-6:** EFD-Contribuições v1.
- **FD-8:** Cofre AES-256-GCM para senhas/procurações/certificado A1.

### Decisions
- **ADR-030:** Regra de Ouro (LEGAL nunca AUTO).
- **ADR-031:** Cálculo determinístico.
- **ADR-032:** Cofres AES-256-GCM.
- **ADR-036:** ABRASF com adaptadores.
- **ADR-038:** Memória de cálculo.

---

## [2026-08-08] — Sprints 22-30: Módulos Operacionais + Hardening

### Added
- **Fiscal (8-20):** NF-e, Kardex, ICMS, SPED Bloco H, H010 estendido, unificação de códigos.
- **Bancário (21-24):** Extrato CSV, classificação c/ memória, naturezas por cliente, fechamento c/ trava.
- **Contábil (25-26):** Ponte Bancário→Contábil, DRE Oficial, autocomplete de contas.
- **Conciliação (29):** Motor de score Banco × NF-e.
- **Hardening (26-30):** Soft deletes, validações DTO, índices, empty states, paginação.

---

## [2026-07-30] — Sprints 1-21: Fundação + BI + Comercial v1

### Added
- **Fundação (1-7):** Auth multi-tenant, Dashboard, Pessoas, Clientes, Precificação, Planejamento.
- **BI (13-17):** DRE gerencial, Ponto Fora da Curva, Simulador Tributário, Planos comerciais v1.
- **Comercial v1 (18-21):** Carteira de Clientes, Propostas, PDF/Excel, Regras de horas.

---

## 📚 Documentação Relacionada

- [CONTEXTO_PROJETO.md](./CONTEXTO_PROJETO.md) — Estado atual e próximos passos
- [README.md](./README.md) — Visão geral do projeto
- [CONTRIBUTING.md](./CONTRIBUTING.md) — Padrões de contribuição
- [docs/adrs/](./docs/adrs/) — Architecture Decision Records
- [docs/modules/](./docs/modules/) — Documentação de módulos
- [docs/sprints/](./docs/sprints/) — Histórico detalhado de sprints