# 🎯 Radar Conta Certa — SaaS de Gestão e Automação para Escritórios Contábeis

<div align="center">

![status](https://img.shields.io/badge/status-produção_local_ativa-green) 
![Next](https://img.shields.io/badge/Next.js-16-black) 
![React](https://img.shields.io/badge/React-19-blue) 
![Nest](https://img.shields.io/badge/NestJS-10-red) 
![Python](https://img.shields.io/badge/Python-3.14-yellow) 
![FastAPI](https://img.shields.io/badge/FastAPI-0.115-teal)
![PG](https://img.shields.io/badge/PostgreSQL-15-blue)

**Dois produtos em uma plataforma: a gestão do escritório contábil e a operação mensal automatizada dos seus clientes.**

</div>

---

## 📖 Sobre o Projeto

O **Radar Conta Certa** é um ecossistema de software multi-tenant desenvolvido para a **Conta Certa Soluções Empresariais**. Ele resolve dois problemas centrais de um escritório contábil de médio porte:

### 🏢 Produto 1 — Gestão do Escritório (Radar)
Centraliza clientes, contratos e honorários, mostra onde o escritório perde dinheiro e transforma serviços prestados em planos monetizáveis (precificação por horas, complexidade e margem).

### 📒 Produto 2 — Operação Mensal do Cliente (Radar + Extrator)
Automatiza a rotina contábil de cada cliente em um fluxo linear, auditável e com aprovação humana obrigatória (Human-in-the-Loop):

```text
1. Plano de Contas → 2. Ciclo Contábil → 3. Importar Extrato (PDF/CSV via Extrator Python) → 
4. Conciliação (Sugestão por Score) → 5. Aprovação Humana → 6. Extrato/Razão + DRE + Exportar SCI

🌐 Ecossistema e Mapa de Portas (Dev Local)
O sistema é composto por 3 aplicações principais e bancos de dados isolados. O boot unificado é feito via Iniciar-Tudo.ps1.
App                      Serviço            Porta       Observação
🌐 Site Conta Certa     Frontend (Vite)     5173        Landing page e portal público
🌐 Site Conta Certa     Backend (Express)   4000        API do site público
📊 Radar                Frontend (Next.js)  3002        Painel principal do escritório
📊 Radar                Backend (NestJS)    3001        API principal, regras de negócio, PDFs
🏦 Extrator Bancário    Frontend (Vite)     5174        Interface dedicada de upload e revisão de extratos
🏦 Extrator Bancário    Backend (FastAPI)   8000        API Python de OCR, parsing e geração de CSV
🐳 Postgres Local       Nativo              5432        DADOS REAIS (não tocar, usado pelo Site)
🐳 Postgres Radar       Docker              5433        Banco virgem para desenvolvimento do Radar

✅ Status: 6/6 apps no ar via Iniciar-Tudo.ps1 (Sprint F9 homologada). Produção local ativa via túnel Cloudflare.

🧭 Rotina Contábil Mensal (Fluxo Central)

Passo  Tela                    Rota                                O que faz 
1      Plano de Contas (SCI)   /dashboard/contabil/plano-contas    Planos por cliente com código unificado (ADR-072)
2      Ciclo Contábil          /dashboard/contabil/ciclo-contabil  Balancete inicial + Razão/Livro Caixa
3      Integração de Extratos   /dashboard/fechamento/extrato-pdf   Upload de PDF → Extrator Python (Mistral OCR) → JSON classificado
4      Conciliação              /dashboard/lancamentos/revisao      Sugestões por histórico + busca por código unificado + aprovação humana
5      Extrato / Razão Analítico /dashboard/contabil/extrato        Consulta, filtros e impressão PDF white-label
6     DRE, Guias e SCI          /dashboard/bi/dre-cliente           DRE/Balancete PDF + TXT formatado para SCI-Único v3

O FlowStepper (barra visual no topo da Integração) guia o contador pelo fluxo com status real de cada passo.

🏦 Módulo Extrator Bancário (App Irmã em Python)
Implementado na Sprint F11, este módulo é responsável por transformar PDFs brutos de bancos em dados estruturados prontos para conciliação.
Fluxo de Processamento:
Upload: Frontend envia PDF para POST /api/parse-extrato.
Extração Híbrida: Tenta parsers nativos (pdfplumber/PyMuPDF). Se falhar ou retornar vazio, aciona Mistral OCR via HTTP direto (fallback universal).
Normalização: Remove caracteres full-width (：, ，, √), pipes de markdown (|) e normaliza espaços.
Parsing Stateful: Identifica o banco e aplica regex específicas. O parser do Banrisul é stateful (mantém estado entre linhas) para lidar com quebras de linha do OCR.
LGPD: Mascara documentos sensíveis (ex: 10.601 → **.601) antes de retornar ao frontend.
Human-in-the-Loop: Dados chegam como "status": "pendente". O usuário edita as contas de débito/crédito e clica em "Salvar Regras Aprendidas".
Exportação: Gera CSV compatível com Domínio/Alterdata/Sênior/Contmatic (utf-8-sig, delimitador ;).
Parsers Suportados:

Banco               Estratégia de Parsing                                               Status
Banco do Brasil     Regex em tabela markdown + detecção por palavras-chave flexíveis    ✅
Sicredi             Regex em linha única com identificação de PIX_CRED/PIX_DEB          ✅
Banrisul            Parser Stateful: Associa dia, tipo, documento, valor, CPF e Nome que o OCR separou em linhas distintas                                                             ✅

🧠 Decisões de Arquitetura (ADRs Canônicos)

ADR     Decisão
004     Multi-tenant single-database com isolamento por companyId
030     Regra de Ouro: Ações com risco legal ou contábil nunca são automáticas (Human-in-the-Loop obrigatório)
066/067 Reimportação idempotente (overlap + anti-duplicidade)
070/072 Plano de contas SCI por cliente, com código unificado
075/076 Layout oficial de exportação SCI-Único v3 + Importação de extrato idempotente
097     Motor de PDF white-label no backend (@react-pdf/renderer)
103     Iniciar-Tudo.ps1: boot unificado com kill cirúrgico por porta e healthchecks
105     CORS multi-origem configurado para permitir comunicação entre Site (5173), Extrator (5174) e Radar (3002)
106     Proxy NestJS → Python em /accounting/extract-pdf-unified com fallback gracioso
107     Mistral OCR como fallback universal via HTTP direto (sem SDK) para evitar quebras de versão. Custo: $4/1000 págs.
108     Parser stateful para Banrisul: Lida com quebra de linha do OCR (dia/tipo em uma linha, valor em outra)
109     Persistência de regras em JSON: data/regras/regras_aprendidas.json com merge idempotente por (descricao + conta). Transição futura para PostgreSQL.
110     Mascaramento LGPD: Aplicado no backend (mascarar_documento()) antes de enviar dados ao frontend. Últimos 3 dígitos preservados.
111     CSV Contábil: Formato padrão BR (utf-8-sig para abrir no Excel, delimitador ;, quoting ALL).
112     Human-in-the-Loop no fluxo: Lançamentos chegam como "pendente". Regras só são salvas após edição e aprovação manual em lote.

🛠️ Stack Tecnológica
Camada                Tecnologia
Frontend (Radar)      Next.js 16 (App Router), React 19, TypeScript, Tailwind, Zustand, Sonner, Lucide            
Frontend (Extrator)   Vite, React, react-dropzone, Axios
Backend (Radar)       NestJS 10, TypeScript, Prisma 5, JWT, @react-pdf/renderer, csv-parser
Backend (Extrator)    Python 3.14, FastAPI, uvicorn, requests, pdfplumber, PyMuPDF
IA / OCR              Mistral OCR API (via HTTP direto)
Banco de Dados        PostgreSQL 15+ (Local e Docker)
Infra / DevOps        Docker Compose, Cloudflare Tunnel, PowerShell 5.1 (scripts ASCII puro)

🚀 Instalação e Boot Unificado
Não inicie os serviços manualmente. Use o script unificado que garante a ordem correta, mata processos presos nas portas e verifica healthchecks.

# 1. Navegue até a raiz do projeto
cd C:\Site conta-certa

# 2. Execute o boot unificado (Development)
.\Iniciar-Tudo.ps1

# 3. Para produção local (com túnel Cloudflare ativo)
.\Iniciar-Tudo.ps1 -Prod

# 4. Para subir apenas o Extrator (útil para dev focado)
.\Iniciar-Tudo.ps1 -ExtratorOnly

Credenciais de Seed (Radar): admin@contacerta.com.br / Admin@123456
⚠️ Regras de Segurança e .env (CRÍTICO)
O arquivo extrator-bancario/backend/.env NUNCA deve ser commitado. Ele está no .gitignore.
Incidente Resolvido (09/09/2026): Uma chave API foi exposta acidentalmente. O histórico Git foi reescrito com git filter-repo --force para remover qualquer rastro do arquivo .env. A chave foi rotacionada.
Se o GitHub bloquear um push por "secret scanning", siga o protocolo de rotação de chave e limpeza de histórico imediatamente.

📂 Estrutura de Pastas (Visão Macro)

C:\Site conta-certa\
├── site/                          # Site Conta Certa (Vite + Express)
├── radar-clone/                   # Radar Principal (Next.js + NestJS)
│   ├── frontend/src/              # App Router, components, store
│   └── backend/src/               # Controllers, services, prisma, pdf templates
├── extrator-bancario/             # 🆕 App Irmã: Extrator de PDFs
│   ├── frontend/                  # Vite + React (:5174)
│   └── backend/
│       ├── app/
│       │   ├── main.py            # FastAPI endpoints (parse, classificar, csv, regras)
│       │   ├── models/            # Pydantic models (ExtratoBancario, LancamentoBancario)
│       │   ├── parsers/
│       │   │   ├── ocr_parser.py  # Parser genérico com lógica stateful (Banrisul) e normalização
│       │   │   └── parser_factory.py # Detecta banco e orquestra fallback
│       │   └── services/
│       │       └── ocr_service.py # Chamada HTTP direta à Mistral OCR API
│       ├── data/
│       │   ├── uploads/           # PDFs temporários (limpos após processamento)
│       │   ├── exports/           # CSVs gerados para download
│       │   └── regras/            # regras_aprendidas.json (persistência local)
│       ├── .env                   # ⛔ NUNCA COMMITAR (MISTRAL_API_KEY)
│       └── .gitignore
├── docker-compose.yml             # Orquestração dos bancos Docker
└── Iniciar-Tudo.ps1               # Script de boot unificado

🗺️ Roadmap — Onde chegamos e onde vamos
✅ Fases 1–5: Fundação, BI, Fiscal, Bancário, Aurora (FD-1 a FD-6), Portal do Cliente, PDFs white-label.
✅ Sprints F8–F11: Catálogo Permanente, Ops unificado, Menu Ecossistema, Extrator Bancário v1.0 com Mistral OCR.
🔜 Fase 6 (Próximos Passos):
F11-b: Modo Professor (Mapeamento assistido de layouts de extrato desconhecidos via IA).
Migração de Regras: Mover regras_aprendidas.json para tabela PostgreSQL no Radar (multi-tenant).
Classificação Automática: Usar as regras salvas para pre-classificar lançamentos futuros (mantendo a revisão humana).
Hardening de Produção: CI/CD, Sentry (monitoramento de erros), backups automatizados do Postgres.

🧠 Continuidade do Projeto (Sistema de Memória para IA)
Para qualquer IA ou desenvolvedor que assumir este projeto:
Leia sempre o CONTEXTO_PROJETO.md (cole inteiro no início da conversa).
Consulte o CHANGELOG.md para entender a evolução das sprints.
Regra de Ouro: Nenhum sprint novo começa sem o anterior homologado.
Governança de ADRs: O registro canônico vive no §3 do CONTEXTO_PROJETO.md. Nunca reutilize números de ADR.

<div align="center">

Feito com ❤️ pela equipe Conta Certa para transformar a contabilidade brasileira.
Copyright © 2026 Conta Certa Soluções Empresariais. Proprietary License.
</div>

