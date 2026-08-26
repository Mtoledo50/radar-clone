# CONTEXTO DO PROJETO — Radar Conta Certa
Última atualização: 2026-08-25 (Bloco 0 — casa arrumada)

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
determinísticos • PDFs no backend (jspdf 2.5.2 + jspdf-autotable 3.8.2 pinados).
Frontend: Next.js App Router • React • Tailwind • Axios c/ interceptor JWT •
Sonner • Lucide • gráficos CSS puro quando possível.
Banco:
- Postgres LOCAL porta 5432 = dados REAIS (usuário postgres; NÃO tocar).
- Docker Compose porta 5433 = banco virgem p/ testes (radar_user/radar_password/
  radar_db; radar_user SEM CREATEDB → evitar migrate dev c/ shadow database;
  usar db push ou migrate deploy).

## 3. ADRs principais
ADR-001 Gráficos CSS puro (Recharts incompatível c/ React 19+Turbopack).
ADR-002 CSV com UTF-8+BOM (acentos no Excel).
ADR-003 Zustand persist p/ SSR seguro.
ADR-004 Multi-tenant single-database por companyId.
ADR-020 Herança de planos derivada em memória; independente não herda e não doa; round2.
ADR-021 Lucide: tooltip via wrapper <span title> (title não existe no tipo).
ADR-022 Proibido arquivo de backup dentro de src/ (quebra next build).
ADR-023 Optional chaining (?.) em .map de opcionais no JSX.
ADR-024 Sonner: action/cancel exigem onClick (usar () => {} p/ só fechar).
ADR-025 RBAC em 3 camadas (Middleware/UI → @Roles() → RolesGuard).
ADR-030 Regra de Ouro da Aurora: prepara/classifica/calcula/sugere; obrigação
legal nunca é transmitida sem aprovação humana.
ADR-031 Cálculo determinístico no backend (tributos, scores, guias, métricas).
ADR-032 Cofres AES-256-GCM p/ credenciais/certificados (implementa na FD-8).
ADR-034 Arquivos estruturais recebem delta cirúrgico, salvo quebrados.
ADR-034.1 Delta cirúrgico p/ produção; completo p/ novo/quebrado.
ADR-034.2 Sprints autocontidas (all-in-one).
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
ADR-072 Multi-planos por cliente: Client.accountingPlan é a fonte da verdade;
planos em (companyId, planName); wizard lista todos (GET /accounting/plans);
balancete/sugestões/exportação usam o plano ativo; troca a qualquer momento.
ADR-073 Exportação SCI c/ nºs reduzidos (seq→accountNumber→reducedCode→code) e
decimal com PONTO; conciliação resolve por classificação OU nº reduzido.
ADR-074 Partida dobrada manual: D e C obrigatórios, valor espelhado (D=C),
auto-CONCILIADO ao preencher as duas contas; conciliação em lote; impressão/PDF
dos extratos por cliente.
ADR-077 Radar em produção usa o Postgres REAL local (5432, radar_db) via
host.docker.internal:5432; sem container de banco novo (dados reais sobem junto).
ADR-081 ARG/ENV NEXT_PUBLIC_* antes do `next build` no Dockerfile (env real vence
.env.local copiado no contexto).
ADR-079 Túnel Cloudflare único para site + Radar: public hostnames radar./radar-api.
apontando para services da rede Docker; site permanece intacto.
ADR-080 `migrate resolve --applied` para sincronizar _prisma_migrations quando o
schema já contém o DDL (dev via db push); nunca reset em banco com dados.
ADR-078 typescript.ignoreBuildErrors=true apenas no build Docker (erros de tipo
legados não-críticos); dev e CI mantêm type-check.


## 4. Status macro
Sprints 1–30 concluídas: dashboard, clientes, operacional, fiscal (NF-e/estoque/
ICMS/SPED), bancário (fechamento/DREs), contábil (plano/partidas/SCI), revisão
inteligente, BI, ponto fora da curva.
CICLO CONTÁBIL SCI (ETAPAS 1–3) ✅ HOMOLOGADO em 25/08/2026: balancete+razão+
sugeridor • extrato inteligente 🟢🟡🟠 c/ revisão e anti-duplicidade • multi-planos
90113/90132 por cliente • exportação SCI reduzida c/ decimal ponto • impressão/PDF
de extratos • atalho Lançamentos → Integração SCI.
Sprint 31 (Docker Compose) EM HOMOLOGAÇÃO: arquivos prontos; AGUARDANDO
docker compose ps com 3 Up.

## 5. Plano 2.0 — Fases concluídas
Fase A (Comercial) completa: A1 herança • A2 valor ref.+dinheiro na mesa •
A3 versões de proposta • A4 fechamento c/ ganho • A5 white-label • A6 PDF v2+PNG •
A7 dashboard desempenho.
Fase B (Pessoas) completa: B1 tipos contratuais • B2 distribuição por setor •
B3 turnover novatos/críticos • B4 entrevista de desligamento c/ IA • B5 benchmark.
Fase C (Mercado) completa: C1 benchmark softwares • C2 serviços extras •
C3 indicadores c/ fórmula • C4 Score 0–100. Resultado real: Score 51 (Atenção);
Comercial 90 • Crescimento 0 • Gestão 40 • Mercado 48 • Pessoas 63.
Fase D (Mentoria) completa: D1 Visão de Futuro • D2 Checklist "Meu Plano" •
D3 Ranking. Resultado real: /dashboard/mentoria c/ checklist persistido (6 itens);
/dashboard/ranking; nível Prata; 9 pts p/ Ouro.

## 6. Funcionário Digital Aurora
Conceito: JARVIS contábil — acorda, prepara, confere, sugere; nunca executa
sozinho obrigação legal (ADR-030).
Concluída: FD-1 fundação (skills/crons/auditoria/dashboard/toggles/approvals) •
FD-2 relatórios+aprovações (PDFs homologados) • FD-3a NFS-e ABRASF • FD-3b coleta
IMAP controlada • FD-4 guias (DAS/ISS/DARF c/ memória de cálculo + Regra de Ouro).
Pendente: FD-5 CNAB 240/400 + régua • FD-6 SPED completo + A1 • FD-7 integrações
Domínio/Questor/Sage • FD-8 legalização + cofre AES-256-GCM • FD-9 DP leve.

## 7. Páginas principais
Operacional: /dashboard • /dashboard/minha-empresa • /dashboard/pessoas •
/dashboard/pessoas/benchmark • /dashboard/clientes • /dashboard/projetos •
/dashboard/tarefas.
Comercial: /dashboard/precificacao • .../meus-planos • .../desempenho •
/dashboard/planejamento.
Fiscal/Bancário/Contábil: /dashboard/fiscal(+notas/estoque/apuracao/sped/
comparativo) • /dashboard/fechamento • /dashboard/lancamentos •
/dashboard/contabil • /dashboard/contabil/plano-contas •
/dashboard/contabil/ciclo-contabil.
Inteligência: /dashboard/funcionario-digital(+relatorios/nfse/guias) •
/dashboard/bi • /dashboard/bi/dre-cliente • /dashboard/ponto-fora-da-curva •
/dashboard/indicadores • /dashboard/indicadores-custom • /dashboard/score •
/dashboard/mentoria • /dashboard/ranking • /dashboard/planejamento-tributario •
/dashboard/reforma-tributaria.

## 8. O que falta para terminar
Bloco 0 — Casa arrumada: ✅ concluído nesta data (CONTEXTO + README + CHANGELOG
sincronizados).
Bloco Aurora (prioridade do Marcos, all-in-one): FD-5 • FD-6 • FD-7 • FD-8.
Fase E (UX, depois): E1 command palette Ctrl+K (EM HOMOLOGAÇÃO) • E2 "onde parou" •
E3 notificações.
Produção 32–34 (depois): VPS+nginx+HTTPS • CI/CD • Sentry+backup.
Backlog pós-produção (22/08): DEV: testes de domínio (Vitest) • retorno CNAB •
auditoria cofre+rate limit+LGPD • paginação/máscaras • busca de entidades no Ctrl+K •
Sentry+logs • BullMQ p/ Aurora • Portal do Cliente. CONTÁBIL: calendário de
obrigações por regime/município • retenções NFS-e • Simples c/ Fator R • Score de
Compliance por cliente • checklist de fechamento • ECD/ECF • ICMS-ST por NCM/CEST •
ISS por município • créditos tributários. REGRA: nada entra antes das Sprints 32–34.
ADR-083 Limpeza técnica de erros TS antes de remover `ignoreBuildErrors` do
build Docker: tipagem explícita em arrays vazios (`Insight[]`), correção de
import default vs named (axios), e alias em `ctx` do Canvas 2D API. Garante que
o build de produção tenha o mesmo rigor do `tsc` de desenvolvimento (paridade
dev/prod).

ADR-084 Domínio puro CNAB isolado (parsers/builders sem dependências de
banco/HTTP); aprovação humana obrigatória em toda cobrança automática.
ADR-085 Arquitetura híbrida FD-5: BillingInstruction como fonte de verdade
(compatibilidade); CnabArquivo/Movimento como histórico; CobrancaRegra/
Evento para régua com workflow humano.

## 9. Próximo passo imediato
9) STATUS ATUAL E PRÓXIMOS PASSOS
SPRINT FD-5 ✅ + FASE 4 ✅ + FASE 5 ✅ HOMOLOGADAS em 27/08/2026: Aurora CNAB 240/400
+ régua de cobrança c/ aprovação humana + notificações plugáveis. Backend c/ 18
endpoints billing, domínio puro testado (7 CNAB + 5 dispatcher), Prisma c/ 4 tabelas
novas + auditoria de envio, frontend c/ página de 4 abas. Ambiente dev ativo:
backend 3001 + frontend 3003 (Docker Desktop instável em 26/08; rebuild das imagens
radar-backend/radar-frontend PENDENTE p/ paridade).
PRÓXIMAS (à escolha do Marcos):
  • Fase 6 — vínculo Client→evento (destinatário real) + seletor de destinatário na tela
  • Sprint 33 — CI/CD (GitHub Actions) + Sentry + backup automático
  • Fase E (Plano 2.0) — UX: command palette, "onde parou", notificações
  • Fase A2 — herança de planos nos endpoints (Plano 2.0)

## 10. Instrução para a nova IA
Leia este arquivo, confirme com "Yes" e continue EXATAMENTE do §9.
Não reimplementar sprints concluídas; não mudar stack; seguir método do §1.