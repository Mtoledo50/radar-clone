# CONTEXTO DO PROJETO — Radar Conta Certa

Última atualização: 2026-08-21

## 1. Método oficial de trabalho

Este projeto segue o método de entrega em sprints autocontidas.

### ADR-034.2 — Entrega all-in-one

A partir da Sprint C3/C4, o método preferido é:

- entregar arquivos completos sempre que possível;
- evitar deltas soltos quando o arquivo for novo ou estiver quebrado;
- incluir backend + frontend + seed + validação + documentação na mesma entrega;
- usar scripts únicos quando isso acelerar homologação;
- arquivos estruturais grandes, como `schema.prisma`, `app.module.ts` e layouts, podem receber delta cirúrgico quando for mais seguro.

Preferência do Marcos: **mais rápido, ágil e testável**, com tudo em um bloco só.

---

## 2. Stack atual

### Backend

- NestJS
- Prisma ORM
- PostgreSQL
- JWT Auth
- RBAC com decorator `@Roles()`
- Serviços determinísticos no backend
- PDFs no backend com `jspdf` 2.5.2 + `jspdf-autotable` 3.8.2

### Frontend

- Next.js App Router
- React
- Tailwind CSS
- Axios com interceptor JWT
- Sonner para toasts
- Lucide React para ícones
- Gráficos preferencialmente com CSS puro quando possível

### Banco

- PostgreSQL local
- Porta padrão atual: `5433`
- Database: `radar_db`
- Usuário app: `radar_user`
- Observação: `radar_user` não possui `CREATEDB`; evitar `migrate dev` quando exigir shadow database.

---

## 3. ADRs principais

### ADR-020 — Herança de planos

Herança de planos derivada em memória. Banco guarda apenas itens próprios de cada plano. Plano independente não herda e não doa. Preços com `round2`.

### ADR-025 — RBAC

RBAC em 3 camadas:

1. Middleware/UI
2. Decorator `@Roles()`
3. `RolesGuard`

### ADR-030 — Regra de Ouro da Aurora

A Aurora prepara, classifica, calcula e sugere.  
Ações de risco legal nunca são transmitidas automaticamente.  
Tudo que envolve obrigação legal exige aprovação humana.

### ADR-031 — Cálculo determinístico

Cálculos tributários, score, indicadores, guias e métricas críticas devem ser determinísticos no backend.

### ADR-032 — Cofres AES-256-GCM

Credenciais e certificados sensíveis devem ser protegidos por cofre com AES-256-GCM. Implementação prevista na FD-8.

### ADR-034 — Arquivos estruturais

Arquivos estruturais devem receber delta cirúrgico, salvo quando estiverem quebrados. Arquivos novos ou quebrados podem ser entregues completos.

### ADR-034.1 — Delta cirúrgico vs arquivo completo

Arquivo em produção recebe delta cirúrgico. Arquivo novo/quebrado recebe versão completa.

### ADR-034.2 — Sprints autocontidas

Entrega preferida do Marcos: código completo + seed + validação + docs em uma única resposta.

### ADR-035 — PDFs no backend

PDFs no backend com `jspdf` 2.5.2 + `jspdf-autotable` 3.8.2 pinados.

### ADR-036 — NFS-e ABRASF

Parser ABRASF 2.0 com adaptadores municipais. XML não reconhecido preserva `rawXml`.

### ADR-037 — Origem do documento

Origem do documento é atributo `source`: `MANUAL`, `EMAIL`, `PORTAL`, `OCR`.

### ADR-038 — Memória de cálculo auditável

Toda guia preserva `steps`, `sources` e `lawRef` em JSON. O contador consegue reproduzir a conta.

### ADR-039 — IMAP como coletor

IMAP coleta NFS-e por e-mail e usa `source = EMAIL`.

### ADR-043.1 — Logo proporcional

Logo horizontal deve ser tratado como chip branco com proporção original. Nunca clipar em círculo.

### ADR-051 — Benchmark de cargos

Catálogo estático versionado, zero tabelas novas. Gaps derivados em memória dos employees.

### ADR-054 — Fórmulas seguras

Indicadores customizados usam parser seguro por whitelist. Proibido `eval`, `Function` ou execução dinâmica.

### ADR-055 — Score determinístico

Score 0–100 do escritório é determinístico e explicável, com 5 dimensões ponderadas.

### ADR-056 — Mentoria determinística

Plano de mentoria derivado do Score, com catálogo fixo de ações. Zero IA generativa.

### ADR-057 — Checklist persistido

Checklist de mentoria persistido por tenant, com geração idempotente por `companyId + title + source`.

### ADR-058 — Ranking de níveis

Gamificação derivada do Score: Bronze, Prata, Ouro e Diamante. Ranking multi-tenant.

---

## 4. Status macro do projeto

### Fundação / Operacional / Fiscal / Bancário / Contábil

Status: concluído.

Inclui sprints 1–30:

- Dashboard base
- Clientes
- Operacional
- Fiscal
- Estoque
- NF-e
- SPED
- Bancário
- Fechamento
- DREs
- Contábil
- Plano de contas
- Revisão inteligente
- BI do escritório
- DRE do cliente
- Ponto fora da curva

### Sprint 31 — Docker

Status: concluído.

Inclui:

- `docker-compose.yml`
- Postgres
- Backend
- Frontend
- Dockerfiles
- Next standalone

---

## 5. Plano 2.0 — Fases concluídas

### Fase A — Comercial

Status: completa.

Sprints:

- A1 — Herança de planos
- A2 — Valor de referência + dinheiro na mesa
- A3 — Versões de proposta
- A4 — Fechamento com ganho
- A5 — White-label
- A6 — PDF v2 Premium + PNG social
- A7 — Dashboard de desempenho

### Fase B — Pessoas

Status: completa.

Sprints:

- B1 — Tipos contratuais
- B2 — Distribuição por setor
- B3 — Turnover de novatos e críticos
- B4 — Entrevista de desligamento com IA
- B5 — Benchmark de cargos

### Fase C — Mercado

Status: completa.

Sprints:

- C1 — Benchmark de softwares
- C2 — Serviços extras
- C3 — Indicadores customizados com fórmula
- C4 — Score 0–100 do escritório

Resultado real homologado:

- Score: 51
- Nível: Atenção
- Comercial: 90
- Crescimento: 0 por metas zeradas
- Gestão: 40
- Mercado: 48
- Pessoas: 63

### Fase D — Mentoria

Status: completa.

Sprints:

- D1 — Visão de Futuro
- D2 — Checklist “Meu Plano”
- D3 — Ranking de Níveis

Resultado real homologado:

- Mentoria em `/dashboard/mentoria`
- Checklist persistido com 6 itens importados dos focos
- Ranking em `/dashboard/ranking`
- Nível atual: Prata
- 9 pontos para Ouro

---

## 6. Funcionário Digital Aurora

Nome: Aurora — Automação Unificada de Rotinas e Obrigações, com Revisão e Auditoria.

Conceito: JARVIS contábil.  
A Aurora acorda, prepara, confere e sugere. Nunca executa sozinha obrigações legais.

### Aurora concluída

#### FD-1 — Fundação

Status: concluída.

Inclui:

- Skills
- Crons
- Auditoria
- Dashboard
- Toggles
- Execução manual
- ApprovalRecord

#### FD-2 — Relatórios e aprovações

Status: concluída.

Inclui:

- ReconciliationSkill
- ClassificationSkill
- AccountingBridgeSkill
- MonthlyReportSkill
- Central de aprovações
- Relatórios mensais em PDF
- PDFs homologados

#### FD-3a — NFS-e ABRASF

Status: concluída.

Inclui:

- Upload/listagem
- Parser ABRASF
- `NfseImportSkill`
- Fila amarela quando necessário
- Vínculo por CNPJ
- `source`

#### FD-3b — Coleta IMAP

Status: concluída/controlada.

Inclui:

- Coletor IMAP
- SKIP gracioso quando não configurado
- `source = EMAIL`

#### FD-4 — Guias de imposto

Status: concluída.

Inclui:

- DAS
- ISS
- DARF preparado
- Memória de cálculo
- Aprovação humana
- PDF imprimível
- Regra de Ouro

### Aurora pendente

#### FD-5 — CNAB 240/400 + régua de cobrança

Objetivo: gerar/remessar cobranças, controlar retorno bancário e automatizar lembretes.

#### FD-6 — SPED completo + certificado A1

Objetivo: avançar obrigações acessórias e uso de certificado A1 criptografado.

#### FD-7 — Integrações Domínio/Questor/Sage

Objetivo: exportar/importar dados em formatos compatíveis com sistemas contábeis externos.

#### FD-8 — Legalização + cofre AES-256-GCM

Objetivo: cofre seguro para credenciais, procurações, e-CAC e rotinas de legalização.

#### FD-9 — DP leve

Objetivo: integração leve com folha existente. Não construir folha do zero.

---

## 7. Páginas principais atuais
7) PLANO DE EXPANSÃO "CONTA CERTA 2.0"
Fase A ✅ (A1–A7) • Fase B ✅ (B1–B5) • Fase C ✅ (C1–C4) • Fase D ✅ (D1–D3).
Fase E (UX): E1 command palette • E2 "onde parou" • E3 notificações (POR ÚLTIMO).
Aurora: FD-1→FD-4 ✅ • FD-5 CNAB + FD-6 SPED/A1 + FD-8 Legalização (EM DESENVOLVIMENTO, batch único) • FD-7/FD-9 backlog.
Produção: Sprints 32–34 (POR ÚLTIMO, após Aurora).

### Operacional

- `/dashboard`
- `/dashboard/minha-empresa`
- `/dashboard/pessoas`
- `/dashboard/pessoas/benchmark`
- `/dashboard/clientes`
- `/dashboard/projetos`
- `/dashboard/tarefas`

### Comercial

- `/dashboard/precificacao`
- `/dashboard/precificacao/meus-planos`
- `/dashboard/precificacao/desempenho`
- `/dashboard/planejamento`

### Fiscal / Bancário / Contábil

- `/dashboard/fiscal`
- `/dashboard/fiscal/notas`
- `/dashboard/fiscal/estoque`
- `/dashboard/fiscal/apuracao`
- `/dashboard/fiscal/sped`
- `/dashboard/fiscal/comparativo`
- `/dashboard/fechamento`
- `/dashboard/lancamentos`
- `/dashboard/contabil`

### Inteligência

- `/dashboard/funcionario-digital`
- `/dashboard/funcionario-digital/relatorios`
- `/dashboard/funcionario-digital/nfse`
- `/dashboard/funcionario-digital/guias`
- `/dashboard/bi`
- `/dashboard/bi/dre-cliente`
- `/dashboard/ponto-fora-da-curva`
- `/dashboard/indicadores`
- `/dashboard/indicadores-custom`
- `/dashboard/score`
- `/dashboard/mentoria`
- `/dashboard/ranking`
- `/dashboard/planejamento-tributario`
- `/dashboard/reforma-tributaria`

---

## 8. O que falta para terminar o projeto

### Bloco 0 — Casa arrumada

Status: em execução agora.

Tarefas:

- Sincronizar `CONTEXTO_PROJETO.md`
- Sincronizar `README.md`
- Sincronizar `CHANGELOG.md`

### Bloco Aurora — próximo

Prioridade escolhida pelo Marcos.

Implementar em entrega all-in-one:

- FD-5
- FD-6
- FD-7
- FD-8

Observação: o Marcos pediu todos os arquivos de uma vez para essas FDs.

### Fase E — UX

Deixar para depois.

Pendências:

- E1 — Command palette Ctrl+K
- E2 — Boas-vindas + onde parou
- E3 — Central de notificações

### Produção 32–34

Deixar para depois.

Pendências:

- Sprint 32 — Deploy VPS + nginx + HTTPS
- Sprint 33 — CI/CD GitHub Actions
- Sprint 34 — Sentry + backup automático
- Hardening de produção

---

## 9. Próximo passo imediato
9) STATUS ATUAL
Ordem decidida pelo Marcos: 0) docs ✅ → 1) Aurora FD-5/6/8 → 2) Fase E + 32–34 por último.
ADRs novos: 052 (benchmark híbrido) • 053 (catálogo serviços) • 054 (parser sem eval) •
055 (score 5 dimensões) • 056 (mentoria determinística) • 057 (checklist idempotente) •
058 (gamificação por score) • 034.2 (entrega única).

Depois desta casa arrumada:

1. Confirmar docs atualizados.
2. Abrir macro-entrega Aurora:
   - FD-5 CNAB
   - FD-6 SPED/certificado A1
   - FD-7 integrações
   - FD-8 legalização/cofre
3. Entregar no método all-in-one:
   - migrations/schema
   - services/controllers
   - frontend
   - seeds
   - validação
   - documentação

Não reimplementar sprints concluídas.

