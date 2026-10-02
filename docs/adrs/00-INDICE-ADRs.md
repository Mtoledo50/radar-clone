# 📋 Índice de ADRs — Radar Conta Certa

**Total de ADRs:** 67  
**Última atualização:** 02/10/2026  
**Manutenção:** Toda nova decisão técnica DEVE gerar uma ADR aqui.

---

## 🎨 UX e Frontend
- [ADR-001](./ADR-001-graficos-css-puro.md) — Gráficos em CSS puro ✅
- [ADR-002](./ADR-002-csv-utf8-bom.md) — CSV com UTF-8+BOM
- [ADR-003](./ADR-003-zustand-persist.md) — Zustand persist p/ SSR seguro
- [ADR-021](./ADR-021-lucide-tooltip.md) — Lucide tooltip wrapper
- [ADR-022](./ADR-022-sem-backup-em-src.md) — Proibido backup em src/
- [ADR-023](./ADR-023-optional-chaining.md) — Optional chaining em .map
- [ADR-024](./ADR-024-sonner-onclick.md) — Sonner exige onClick

## 🏗️ Arquitetura Base
- [ADR-004](./ADR-004-multi-tenant-single-db.md) — Multi-tenant single-database

## 💼 Comercial e Planos
- [ADR-020](./ADR-020-heranca-planos.md) — Herança em memória ✅
- [ADR-025](./ADR-025-ordenacao-planos.md) — Ordenação por order + multiplier
- [ADR-026](./ADR-026-endpoint-resolved.md) — /resolved expõe herança
- [ADR-027](./ADR-027-dinheiro-na-mesa.md) — Simulador "Dinheiro na Mesa"
- [ADR-028](./ADR-028-versionamento-proposta.md) — Versionamento imutável

## 🤖 Aurora / Funcionário Digital
- [ADR-030](./ADR-030-human-in-the-loop.md) — Regra de Ouro ✅
- [ADR-031](./ADR-031-calculo-deterministico.md) — Cálculo tributário determinístico
- [ADR-032](./ADR-032-cofres-aes-256.md) — Cofres AES-256-GCM
- [ADR-033](./ADR-033-perfis-aprovacao.md) — Perfis de aprovação
- [ADR-034](./ADR-034-delta-nao-substituicao.md) — Arquivos sempre delta
- [ADR-035](./ADR-035-pdfs-backend.md) — PDFs no backend
- [ADR-036](./ADR-036-abrasf-adaptadores.md) — ABRASF com adaptadores
- [ADR-037](./ADR-037-source-atributo.md) — source como atributo
- [ADR-038](./ADR-038-memoria-calculo.md) — Memória de cálculo
- [ADR-039](./ADR-039-imap-coletor.md) — IMAP como coletor

## 🏢 Plano 2.0 - Fases B/C/D
- [ADR-043](./ADR-043-white-label-css.md) — White-label via CSS variables
- [ADR-045](./ADR-045-pdf-cliente.md) — PDF no cliente
- [ADR-046](./ADR-046-png-canvas.md) — PNG via Canvas 2D
- [ADR-047](./ADR-047-tipo-contratual.md) — Tipo contratual no Employee
- [ADR-048](./ADR-048-benchmark-contabil.md) — Benchmark contábil
- [ADR-049](./ADR-049-flag-critico.md) — Flag crítico
- [ADR-050](./ADR-050-motor-intercambiavel.md) — Motor intercambiável
- [ADR-051](./ADR-051-benchmark-cargos.md) — Benchmark de cargos
- [ADR-052](./ADR-052-benchmark-hibrido.md) — Benchmark híbrido
- [ADR-053](./ADR-053-servicos-preco-medio.md) — Serviços extras c/ preço
- [ADR-054](./ADR-054-indicadores-formula.md) — Indicadores c/ fórmula (AST)
- [ADR-055](./ADR-055-score-escritorio.md) — Score 0-100
- [ADR-056](./ADR-056-visao-futuro.md) — Visão de Futuro
- [ADR-057](./ADR-057-checklist-meu-plano.md) — Checklist "Meu Plano"
- [ADR-058](./ADR-058-ranking-niveis.md) — Ranking de Níveis
- [ADR-059](./ADR-059-cofre-local.md) — Cofre local
- [ADR-060](./ADR-060-efd-v1.md) — EFD-Contribuições v1
- [ADR-061](./ADR-061-cnab-v1.md) — CNAB v1
- [ADR-062](./ADR-062-seed-idempotente.md) — Seed idempotente

## 📒 Contábil e Fiscal
- [ADR-066](./ADR-066-reimportacao-idempotente.md) — Reimportação idempotente
- [ADR-070](./ADR-070-plano-contas-sci.md) — Plano de contas SCI
- [ADR-072](./ADR-072-multi-planos-cliente.md) — Multi-planos por cliente
- [ADR-073](./ADR-073-sci-reduzido.md) — SCI reduzido + decimal ponto
- [ADR-074](./ADR-074-partida-dobrada.md) — Partida dobrada c/ espelho
- [ADR-075](./ADR-075-layout-sci-unico.md) — Layout SCI-Único v3

## 🐳 Infra e Produção
- [ADR-077](./ADR-077-postgres-host-docker.md) — Postgres via host.docker.internal
- [ADR-078](./ADR-078-ignore-build-errors.md) — ignoreBuildErrors no Docker
- [ADR-079](./ADR-079-tunel-unico.md) — Túnel único site + Radar
- [ADR-080](./ADR-080-migrate-resolve.md) — migrate resolve --applied
- [ADR-081](./ADR-081-env-build-prioridade.md) — env de build > .env.local
- [ADR-082](./ADR-082-scroll-suave-nativo.md) — Scroll suave nativo
- [ADR-083](./ADR-083-limpeza-ts.md) — Limpeza TS antes do build
- [ADR-088](./ADR-088-monitoramento-optin.md) — Monitoramento opt-in
- [ADR-089](./ADR-089-ajuda-2-camadas.md) — Ajuda em 2 camadas
- [ADR-090](./ADR-090-catalogo-typescript.md) — Catálogo em TypeScript
- [ADR-097](./ADR-097-pdf-whitelabel.md) — Motor PDF white-label
- [ADR-103](./ADR-103-iniciar-tudo.md) — Iniciar-Tudo.ps1
- [ADR-105](./ADR-105-cors-multi-origem.md) — CORS multi-origem
- [ADR-106](./ADR-106-proxy-nestjs-python.md) — Proxy NestJS → Python

## 🏦 Extrator Bancário
- [ADR-107](./ADR-107-mistral-ocr-fallback.md) — Mistral OCR fallback ✅
- [ADR-108](./ADR-108-parser-stateful-banrisul.md) — Parser stateful Banrisul
- [ADR-109](./ADR-109-regras-json.md) — Regras em JSON
- [ADR-110](./ADR-110-mascaramento-lgpd.md) — Mascaramento LGPD
- [ADR-111](./ADR-111-csv-contabil.md) — CSV Contábil padrão BR
- [ADR-112](./ADR-112-human-in-loop-classificacao.md) — HITL na classificação

## 💰 Billing e CNAB
- [ADR-084](./ADR-084-dominio-puro-cnab.md) — Domínio puro CNAB
- [ADR-085](./ADR-085-arquitetura-hibrida-billing.md) — Arquitetura híbrida Billing
- [ADR-086](./ADR-086-notificacoes-plugaveis.md) — Notificações plugáveis
- [ADR-087](./ADR-087-vinculo-cliente-cobranca.md) — Vínculo Client↔cobrança

## 📧 Módulo de Envio com Tracking
- [ADR-113](./ADR-113-watch-folder-chokidar.md) — Watch folder via chokidar
- [ADR-114](./ADR-114-tracking-pixel-proxy.md) — Tracking pixel + link proxy
- [ADR-115](./ADR-115-templates-handlebars.md) — Templates editáveis
- [ADR-116](./ADR-116-envio-plugavel.md) — Envio plugável
- [ADR-117](./ADR-117-aprovacao-obrigatoria.md) — Aprovação obrigatória
- [ADR-118](./ADR-118-cnpj-nome-arquivo.md) — CNPJ no nome do arquivo
- [ADR-119](./ADR-119-pasta-enviados-competencia.md) — Pasta enviados/competência

---

## 📝 Convenções

### Numeração
- ADRs são numeradas **sequencialmente** na ordem de criação
- **Nunca reutilize** números de ADRs antigas (mesmo que o tema mude)
- ADRs relacionadas podem compartilhar prefixo (ex: 066 e 067 para idempotência)

### Formato do Arquivo
Cada ADR deve seguir este template:

ADR-XXX: [Título Curto]
Data: YYYY-MM-DD
Status: ✅ Aceita | 🚧 Proposta | ❌ Rejeitada | 🔄 Substituída por ADR-YYY
Decisor: Marcos Toledo
Reversível: Sim | Não
📋 Contexto
[Por que essa decisão foi necessária?]
🎯 Decisão
[O que foi decidido?]
💡 Implementação
[Código de exemplo, se aplicável]
✅ Consequências
Positivas
...
Negativas
...
📚 Referências
Arquivos que usam esta ADR
ADRs relacionadas
🔄 Histórico de Revisões
Data
Autor
Mudança


### Atualização
- Toda nova feature/bugfix que gere decisão técnica → criar ADR
- Toda ADR criada → atualizar este índice
- Toda ADR substituída → marcar status como "🔄 Substituída por ADR-YYY"
