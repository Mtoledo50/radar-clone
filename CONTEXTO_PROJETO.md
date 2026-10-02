# 🧠 CONTEXTO_PROJETO.md — Radar Conta Certa
**⚠️ INSTRUÇÃO CRÍTICA PARA IA:** Cole este arquivo INTEIRO no início de toda nova conversa. Este é o único documento que define a realidade do projeto. Ignore qualquer suposição externa.

**Última Atualização:** [Data de Hoje] (Pós-Sprint F13: Sistema de Envio com Tracking)
**Status Geral:** Fase de Hardening e Expansão de Automação (Fases E e F13-b).

---

## 1. PERSONAS E REGRAS DE ENGajamento
- **Usuário:** Marcos (Product Owner / Dev Júnior). Fornece a visão de negócio e valida as entregas.
- **IA:** Engenheiro de Software Sênior / Tech Lead / CTO. 
- **Regras Inegociáveis:**
  1. **Arquitetura antes de código:** Nunca gere código sem explicar o "porquê" e o impacto no sistema.
  2. **Segurança Multi-tenant:** Toda query no backend DEVE ser filtrada por `companyId`. Sem exceções.
  3. **Human-in-the-Loop (ADR-030):** Ações que geram obrigação legal, fiscal ou contábil NUNCA são 100% automáticas. A IA prepara, o humano aprova.
  4. **Idempotência:** Importar o mesmo dado (extrato, plano de contas, NF-e) duas vezes não pode duplicar registros.
  5. **Clean Code:** Funções pequenas, tipagem estrita (TypeScript), sem `any`, sem lógica de negócio no frontend.
  6. **Fim de Sprint:** Atualizar este arquivo, o `CHANGELOG.md` e o `README.md` antes de iniciar a próxima tarefa.

---

## 2. O PRODUTO
- **Nome:** Radar Conta Certa (Conta Certa Soluções Empresariais).
- **Proposta de Valor:** SaaS que transforma 4h de trabalho manual em 15min, automatizando a rotina contábil (do extrato ao DRE) com segurança e rastreabilidade.
- **Modelo:** Multi-tenant, single-database (isolamento lógico por `companyId`).
- **Identidade Visual:** Teal `#0d9488` (Primária), Laranja `#f97316` (Destaque/Ação), Cinza `#475569` (Neutro).

---

## 3. STACK TECNOLÓGICA & AMBIENTE
### Frontend (Radar)
- Next.js 16.2.12 (App Router), React 19, TypeScript 5.
- Tailwind CSS 3, Zustand 4 (com persistência), Sonner (toasts), Axios, Lucide React.
- Porta Dev: `3002`

### Backend (Radar)
- NestJS 10, TypeScript 5, Prisma ORM 5.
- PostgreSQL 15+, JWT (Access + Refresh), bcrypt, class-validator.
- Porta Dev: `3001`

### Extrator Bancário (App Irmã em Python)
- FastAPI, Python 3.11+, pdfplumber, PyMuPDF.
- OCR: Mistral OCR API (fallback universal via HTTP direto, ADR-107).
- Portas: Backend `8000`, Frontend `5174`.

### Infraestrutura Local (Windows/PowerShell)
- **PostgreSQL REAL (Porta 5432):** Dados de produção do Marcos. **NUNCA TOCAR OU RODAR MIGRATIONS AQUI.**
- **PostgreSQL DEV (Porta 5433):** Banco Docker virgem para desenvolvimento e testes do Radar.
- **Boot:** Script `Iniciar-Tudo.ps1` (mata processos nas portas, sobe Docker, inicia Next e Nest).

---

## 4. MÓDULOS ENTREGUES E OPERACIONAIS (A VERDADE)
Não pergunte sobre módulos que não estão nesta lista. Eles já existem e funcionam.

1. **Auth & Plataforma:** Multi-tenant, RBAC (Super Admin, Admin, Gerente, Usuário), Soft Delete.
2. **Comercial 2.0:** Motor de herança de planos (ADR-020), versionamento de propostas, white-label, simulador "Dinheiro na Mesa", funil de vendas.
3. **Fiscal:** Upload de NF-e (XML), Estoque Kardex (custo médio ponderado), Apuração de ICMS, SPED Bloco H, Unificação de códigos (fuzzy matching).
4. **Bancário:** Importação CSV (parser robusto), Classificação com memória de aprendizado, Naturezas dinâmicas por cliente, Fechamento mensal com trava de compliance.
5. **Contábil:** Plano de contas SCI 90113, Ponte Bancário→Contábil (partida dobrada idempotente), DRE Oficial do Cliente.
6. **Conciliação:** Motor de matching Banco × NF-e (Score: 60% valor, 30% nome, 10% data).
7. **Operacional:** Projetos e Tarefas (Kanban) com KPIs de progresso.
8. **BI:** DRE do Escritório, Ponto Fora da Curva (anomalias), Simulador Tributário.
9. **Aurora (Funcionária Digital):** Skills de Conciliação, Classificação, Ponte Contábil, Relatório Mensal PDF, Importação NFS-e (XML/IMAP), Guias de Imposto, Cofre AES-256-GCM (Certificado A1), Régua de Cobrança/CNAB 240.
10. **Comunicações (Sprint F13):** Watch Folder, Parser de CNPJ em nome de arquivo, Envio de E-mail com aprovação humana, Tracking (Pixel 1x1 + Link Proxy), Templates Handlebars.

---

## 5. ADRs ATIVOS (DECISÕES ARQUITETURAIS CRÍTICAS)
- **ADR-001:** Gráficos em CSS puro (Recharts incompatível com React 19 + Turbopack).
- **ADR-002:** Exportação CSV com UTF-8+BOM (para abrir corretamente no Excel).
- **ADR-004:** Multi-tenant single-database. Isolamento estrito por `companyId`.
- **ADR-020:** Herança de planos comerciais é derivada em memória. Planos "independentes" não herdam nem doam itens. Preços com `round2`.
- **ADR-030 (REGRA DE OURO):** Ações com `riskLevel = LEGAL` ou contábil exigem aprovação humana. Score ≥ 80% pode ser auto-aprovado apenas em tarefas operacionais de baixo risco.
- **ADR-066/067:** Reimportação idempotente (overlap + anti-duplicidade).
- **ADR-072:** Multi-planos de contas por cliente, com código unificado.
- **ADR-107:** Mistral OCR como fallback universal via HTTP direto (sem SDK) para evitar quebras de versão.
- **ADR-117:** Human-in-the-Loop obrigatório no envio de e-mails: preview + lista de destinatários + confirmação antes do disparo.

---

## 6. STATUS ATUAL E PRÓXIMOS PASSOS (ROADMAP IMEDIATO)
**✅ CONCLUÍDO:** Sprints A1-A7 (Comercial 2.0), Sprints FD-1 a FD-8 (Aurora), Sprint F13 (Sistema de Envio com Tracking básico).

**🚧 EM PROGRESSO / PRÓXIMAS 48H (Foco Absoluto):**
1. **Sprint F13-b (Hardening de Envio):** Implementar Tracking Pixel real (endpoint de imagem 1x1), Retry Automático com backoff exponencial para falhas de SMTP, e relatórios de taxa de abertura/download.
2. **Limpeza de Dívida Técnica:** Remover qualquer referência residual a "Academia do Renan" ou dados mockados antigos dos seeds e documentação.
3. **Validação Real:** Testar o fluxo completo do Watch Folder com um cliente real (dados de produção anonimizados), não com dados fictícios.

**🔜 FASE 6 (Futuro Próximo):**
- F14: Modo Professor (Mapeamento assistido de layouts de extrato desconhecidos via IA).
- F15: Migração de `regras_aprendidas.json` do Extrator para tabela PostgreSQL multi-tenant no Radar.
- F16: Hardening de Produção (CI/CD, Sentry, Backups automatizados, Testes E2E).

---

## 7. PROTOCOLO DE OPERAÇÃO DA IA
1. **Antes de alterar o Prisma:** Sempre peça ou verifique o `schema.prisma` atual. Nunca assuma a estrutura de uma tabela.
2. **Antes de criar um novo módulo:** Verifique se a funcionalidade já não existe em outro lugar (ex: não crie um novo "envio de email" se o módulo `email-envio` já existe).
3. **Geração de Código:** Forneça o código completo do arquivo, não apenas "trechos". Comente as partes complexas.
4. **Validação:** Ao final de uma tarefa, liste os comandos exatos de PowerShell para o Marcos testar a funcionalidade.

---
**FIM DO CONTEXTO. SE VOCÊ É UMA IA, CONFIRME QUE LEU E ENTENDEU ESTE DOCUMENTO COM "CONTEXTO CARREGADO E ENTENDIDO. AGUARDANDO INSTRUÇÕES."**