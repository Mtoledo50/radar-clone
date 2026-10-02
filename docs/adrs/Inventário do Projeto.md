📋 INVENTÁRIO COMPLETO DE ADRs DO PROJETO

Aqui está a lista exaustiva de todas as ADRs que identifiquei nos seus arquivos. Organizei por categoria para facilitar a manutenção:

🎨 UX e Frontend (001-010)
ADR             Título                                                           Status
ADR-001         Gráficos em CSS puro (Recharts incompatível c/ React 19)        ✅ Já documentada
ADR-002         CSV com UTF-8+BOM (acentos no Excel)                            📝 Pendente
ADR-003         Zustand persist p/ SSR seguro                                   📝 Pendente
ADR-004         Multi-tenant single-database por companyId                      📝 Pendente
ADR-021         Lucide tooltip via <span title> wrapper                         📝 Pendente
ADR-022         Proibido arquivo de backup dentro de src/                       📝 Pendente
ADR-023         Optional chaining (?.) em .map de opcionais no JSX              📝 Pendente
ADR-024         Sonner: action/cancel exigem onClick                            📝 Pendente

💼 Comercial e Planos (020-030)
ADR             Título                                                          Status
ADR-020         Herança de planos em memória + round2                           ✅ Já documentada
ADR-025         Ordenação por order (asc) + multiplier (asc)                    📝 Pendente
ADR-026         Endpoint /resolved expõe herança em memória                     📝 Pendente
ADR-027         Simulador "Dinheiro na Mesa" usa baseValue × multiplier         📝 Pendente
ADR-028         Versionamento imutável + clone + cadeia por originalProposalId  📝 Pendente
ADR-030         Regra de Ouro: Human-in-the-Loop                                ✅ Já documentada

🤖 Aurora / Funcionário Digital (030-040)
ADR-031         Cálculo tributário determinístico (IA só sugere)                📝 Pendente
ADR-032         Cofres AES-256-GCM (chave em env)                               📝 Pendente
ADR-033         Perfis de aprovação (Auxiliar/Analista/Supervisor/Contador)     📝 Pendente
ADR-034         Arquivos estruturais: sempre delta, nunca substituição total    📝 Pendente
ADR-035         PDFs no backend (jspdf 2.5.2 / autotable 3.8.2)                 📝 Pendente
ADR-036         ABRASF com adaptadores                                          📝 Pendente
ADR-037         source como atributo                                            📝 Pendente
ADR-038         Memória de cálculo tributário                                   📝 Pendente
ADR-039         IMAP como coletor                                               📝 Pendente

🏢 Plano 2.0 - Fases B/C/D (040-060)

ADR-043         White-label via CSS variables                                   📝 Pendente
ADR-045         PDF no cliente (zero carga no servidor)                         📝 Pendente
ADR-046         PNG via Canvas 2D nativo                                        📝 Pendente
ADR-047         Tipo contratual vive no Employee                                📝 Pendente
ADR-048         Benchmark contábil (Fiscal 30%, Contábil 25%, etc.)             📝 Pendente
ADR-049         Flag crítico com cópia histórica                                📝 Pendente
ADR-050         Motor de entrevista intercambiável (LLM amanhã sem tocar no código)     📝 Pendente
ADR-051         Domínio puro de benchmark de cargos                             📝 Pendente
ADR-052         Benchmark híbrido rede+catálogo                                 📝 Pendente
ADR-053         Serviços extras c/ preço médio                                  📝 Pendente
ADR-054         Indicadores c/ fórmula (parser AST, zero eval)                  📝 Pendente
ADR-055         Score 0-100 (5 dimensões ponderadas)                            📝 Pendente
ADR-056         Visão de Futuro                                                 📝 Pendente
ADR-057         Checklist "Meu Plano" persistido                                📝 Pendente
ADR-058         Ranking de Níveis (Bronze→Diamante)                             📝 Pendente
ADR-059         Cofre local c/ chave em env (reveal auditável)                  📝 Pendente
ADR-060         EFD-Contribuições v1 sem filtro de competência                  📝 Pendente
ADR-061         CNAB v1 c/ entradas explícitas                                  📝 Pendente
ADR-062         Seed idempotente de plano de contas                             📝 Pendente

📒 Contábil e Fiscal (060-080)

ADR-066/067     Reimportação idempotente (overlap + anti-duplicidade)           📝 Pendente
ADR-070/072     Plano de contas SCI por cliente, código unificado               📝 Pendente
ADR-073         SCI reduzido + decimal ponto                                    📝 Pendente
ADR-074         Partida dobrada c/ espelho e auto-conciliação                   📝 Pendente
ADR-075/076     Layout oficial SCI-Único v3 + importação idempotente            📝 Pendente
ADR-077         Postgres real via host.docker.internal                          📝 Pendente
ADR-078         ignoreBuildErrors no build Docker                               📝 Pendente
ADR-079         Túnel único site + Radar                                        📝 Pendente
ADR-080         migrate resolve --applied                                       📝 Pendente
ADR-081         env de build > .env.local                                       📝 Pendente
ADR-082         Scroll suave nativo em vez de hash do router                    📝 Pendente

💰 Billing e CNAB (080-090)

ADR-083         Limpeza TS antes de remover ignoreBuildErrors                   📝 Pendente
ADR-084         Domínio puro CNAB isolado                                       📝 Pendente
ADR-085         Arquitetura híbrida BillingInstruction + CnabArquivo            📝 Pendente
ADR-086         Notificações plugáveis (SendGrid/Twilio/Log)                    📝 Pendente
ADR-087         Vínculo Client↔cobrança por auto-match determinístico           📝 Pendente
ADR-088         Monitoramento/backup opt-in por env                             📝 Pendente
ADR-089         Ajuda contextual em 2 camadas (Progressive Disclosure)          📝 Pendente
ADR-090         Catálogo centralizado em TypeScript (não CMS)                   📝 Pendente

🏗️ Infra e Integrações (090-120)

ADR-097         Motor de PDF white-label no backend (@react-pdf/renderer)       📝 Pendente
ADR-103         Iniciar-Tudo.ps1: boot unificado com kill cirúrgico             📝 Pendente
ADR-105         CORS multi-origem (Site 5173, Extrator 5174, Radar 3002)        📝 Pendente
ADR-106         Proxy NestJS → Python em /accounting/extract-pdf-unified        📝 Pendente
ADR-107         Mistral OCR como fallback universal                             ✅ Já documentada
ADR-108         Parser stateful para Banrisul                                   📝 Pendente
ADR-109         Persistência de regras em JSON                                  📝 Pendente
ADR-110         Mascaramento LGPD no backend                                    📝 Pendente
ADR-111         CSV Contábil padrão BR (utf-8-sig, delimitador ;)               📝 Pendente
ADR-112         Human-in-the-Loop no fluxo de classificação                     📝 Pendente
ADR-113         Watch folder via chokidar                                       📝 Pendente
ADR-114         Tracking pixel 1x1 + link proxy determinístico                  📝 Pendente
ADR-115         Templates editáveis (Handlebars)                                📝 Pendente
ADR-116         Envio plugável (SendGrid/SMTP/LOG)                              📝 Pendente
ADR-117         Human-in-the-Loop obrigatório no envio                          📝 Pendente
ADR-118         Identificação de cliente por CNPJ no nome do arquivo            📝 Pendente
ADR-119         Pasta de enviados com subpastas por competência                 📝 Pendente

Total: 67 ADRs identificadas (4 já documentadas, 63 pendentes).

🎯 PLANO DE AÇÃO (EXECUÇÃO EM LOTES)

Não vou documentar todas de uma vez (seria impossível em uma resposta). Vou fazer em 5 lotes organizados:
Lote            ADRs                                 Prioridade
Lote 1          002, 003, 004, 021, 022, 023, 024   🔴 Crítico (base do sistema)
Lote 2          031, 032, 033, 034, 035             🔴 Crítico (Aurora/Segurança)
Lote 3          066, 067, 070, 072, 073, 074        🟡 Alto (Contábil)
Lote 4          108, 109, 110, 111, 112             🟡 Alto (Extrator)
Lote 5          113-119 (Módulo de Envio)           🟢 Normal

