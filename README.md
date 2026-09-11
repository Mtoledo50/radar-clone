# 📊 Radar Conta Certa — SaaS de Gestão e Automação para Escritórios Contábeis

**Dois produtos em uma plataforma: a gestão do escritório contábil e a operação mensal automatizada dos seus clientes.**

---

## 📖 Sobre o Projeto

O **Radar Conta Certa** é um ecossistema de software multi-tenant desenvolvido para a **Conta Certa Soluções Empresariais**. Ele resolve dois problemas centrais de um escritório contábil de médio porte:

### 🏢 Produto 1 — Gestão do Escritório (Radar)
Centraliza clientes, contratos e honorários, mostra onde o escritório perde dinheiro e transforma serviços prestados em planos monetizáveis (precificação por horas, complexidade e margem).

### 📒 Produto 2 — Operação Mensal do Cliente (Radar + Extrator)
Automatiza a rotina contábil de cada cliente em um fluxo linear, auditável e com aprovação humana obrigatória (Human-in-the-Loop).

---

## 🌐 Ecossistema e Mapa de Portas (Dev Local)

O sistema é composto por **3 aplicações principais** e bancos de dados isolados. O boot unificado é feito via `Iniciar-Tudo.ps1`.

| App | Serviço | Porta | Observação |
|-----|---------|-------|------------|
| 🌐 Site Conta Certa | Frontend (Vite) | 5173 | Landing page e portal público |
| 🌐 Site Conta Certa | Backend (Express) | 4000 | API do site público |
| 📊 **Radar** | **Frontend (Next.js)** | **3002** | **Painel principal do escritório** |
| 📊 **Radar** | **Backend (NestJS)** | **3001** | **API principal, regras de negócio, PDFs** |
| 🏦 Extrator Bancário | Frontend (Vite) | 5174 | Interface dedicado de upload e revisão de extratos |
| 🏦 Extrator Bancário | Backend (FastAPI) | 8000 | API Python de OCR, parsing e geração de CSV |
| 🐳 Postgres Local | Nativo | 5432 | DADOS REAIS (não tocar, usado pelo Site) |
| 🐳 Postgres Radar | Docker | 5433 | Banco virgem para desenvolvimento do Radar |

---

## 🚀 Como Rodar Localmente

### **Pré-requisitos**
- Node.js 18+
- PostgreSQL 15+ (local e Docker)
- Python 3.14+ (para o Extrator Bancário)
- Docker Desktop
- PowerShell 5.1+ (Windows) ou Bash (Linux/Mac)

### **Passo a Passo**

#### **1. Clone o repositório**
```bash
git clone https://github.com/Mtoledo50/radar-clone.git
cd radar-clone

2. Configure as variáveis de ambiente
Backend (NestJS):
cd backend
cp .env.example .env
# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5433/radar

# JWT
JWT_SECRET=sua_chave_super_secreta_aqui
JWT_EXPIRATION=24h

# Email (SendGrid recomendado)
SENDGRID_API_KEY=SUA_CHAVE_SENDGRID
SENDGRID_FROM_EMAIL=noreply@contacerta.com.br

# Mistral OCR (para o Extrator)
MISTRAL_API_KEY=sua_chave_mistral

# Cloudflare Tunnel (produção)
CLOUDFLARE_TUNNEL_TOKEN=seu_token

# CORS
CORS_ORIGIN=http://localhost:3002,http://localhost:5173,http://localhost:5174

Frontend (Next.js):
cd frontend
cp .env.example .env

env
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_SITE_URL=http://localhost:5173
3. Inicie os serviços
Opção A — Boot unificado (recomendado):
# PowerShell
.\Iniciar-Tudo.ps1

Opção B — Manual:
# Terminal 1: Backend do Radar
cd backend
npm install
npm run dev

# Terminal 2: Frontend do Radar
cd frontend
npm install
npm run dev

# Terminal 3: Extrator Bancário
cd ../extrator-bancario/backend
python -m venv venv
source venv/bin/activate  # Linux/Mac
# ou: venv\Scripts\activate  # Windows
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000

# Terminal 4: Frontend do Extrator
cd ../frontend
npm install
npm run dev

4. Acesse
Radar Frontend: http://localhost:3002
Radar Backend: http://localhost:3001
Extrator Frontend: http://localhost:5174
Extrator Backend: http://localhost:8000
🧭 Módulos do Sistema

1. Gestão do Escritório
Dashboard com métricas de performance
Cadastro de clientes (multi-tenant)
Gestão de contratos e honorários
Controle de departamentos e usuários
Relatórios de lucratividade
BI integrado (gráficos interativos)

2. Operação Mensal do Cliente
Passo   Tela                    Rota                                O que faz
1       Plano de Contas (SCI)   /dashboard/contabil/plano-contas    Planos por cliente com código unificado (ADR-072)
2       Ciclo Contábil          /dashboard/contabil/ciclo-contabil  Balancete inicial + Razão/Livro Caixa
3       Integração de Extratos  /dashboard/fechamento/extrato-pdf   Upload de PDF → Extrator Python (Mistral OCR) → JSON classificado   
4       Conciliação             /dashboard/lancamentos/revisao      Sugestões por histórico + busca por código unificado + aprovação humana
5       Extrato / Razão Analítico   /dashboard/contabil/extrato     Consulta, filtros e impressão PDF white-label   
6       DRE, Guias e SCI        /dashboard/bi/dre-cliente           DRE/Balancete PDF + TXT formatado para SCI-Único v3

3. 🆕 Sistema de Envio com Tracking de Comunicações
Módulo recém-implementado (Setembro/2026) — Estilo Acessorias, mas superior.
Funcionalidades:
✅ Watch Folder: Monitoramento automático de pasta local para detecção de arquivos
✅ Parser de CNPJ: Identificação automática do cliente pelo nome do arquivo (regex flexível)
✅ Envio automático: E-mails com anexos via SendGrid ou SMTP
✅ Tracking completo:
📧 Email enviado (100% confiável)
📨 Email entregue (90-95% confiável)
👁️ Email aberto (40-60% confiável via tracking pixel)
⬀ Download realizado (100% confiável via link proxy)
✅ Token de segurança: Links temporários (expira em 7 dias)
em 7 dias) para LGPD
✅ **Retry automático✅3 tentativas com backoff exponencial
Painel de controle: Status em tempo real (Pendente, Enviado, Entregue Aberto Baix
Human-in--loop: Confirmação humana obrigatória antes do envio (ADR-030)
✅ Templates editáveis: Handlebars com variáveis ({{cliente.nome}}, {{cliente.cnpj}}, {{competencia}})
✅ Auditoria completa: Logs de quem enviou, quando, por quem, para quem
**Fluxo Completo Watch Folder detecta arquivo → 2. Extrai CNPJ do nome do cliente → 4. humano4. Gera preview do email → 5. Humano confirma (ADR) → 6. Move arquivo para "enviados/"

#### **Estrutura de Pastas do Módulo:**:**:

C:\Documentos\Enviar/ # Pasta monitorada)
├── enviados/YYYY ( └── 2026-09/ └── pendentes/ (arquivosivos com falha)


#### **Padrões de Nome de Arquivo Suportados:**
``` `DAS_12345678000195_JAN2026.pdf`
- `12345678000195-DAS-00000195-DAS-00000195_001.pdf`
- `DAS_12345678000195_012026.pdf`
- `12345678000195_012026.pdf`

#### **Modelo de Dados (PostgreSQL: EmailEnvio
- id: UUID
- clienteId: FK- assunto: string
- emailDestinatario: string
- assunto: string
- conte: text
- anexo: string (string JSONB de tracking)
- status (pend,  baix, entregue, aberto, baixado, falha)
- setor)
- tentativas: int
- erro: text
- usuarioId: UUID (quem enviou
- createdAt: timestamp
- updatedAt: timestamp

#### **Tabela: EmailTracking
- id: UUID
- envioId: UUID (FK para EmailEnvio)
- tipo: enum (enviado, entregue, aberto, baixado)
- timestamp: timestamp
- ip: string (nullable)
- userAgent: string (nullable)
- metadadosadicionais)

#### **Tabela: EmailTemplate
- id: UUID
- nome: string
- assunto- assunto: string
- corpo- descricao (HTML com variáveis)
- tipoDocumento: string (DAS, D, informe, BALANCETE, etc)
- ativo: boolean
- createdAt: timestamp
- updatedAt: timestamp

Eendpoints da API (NestJS):
GET /api/email-envios Lista os/envio:uuid # Detalhe GET /api/email-envio/:uuid # Detalha GET /api/email-envios/pendentes
Lista envios pendentes de aprovaçãoGET # Envia um email (com anexo
GET /emailGET /email # GET # GET /GETGET /GET GET
/api/email/envio/:uuid GET GET GET GET GET /GETapi/api/email-email-templates /GET GET GET GET GET # GETapi GETapiGETapiGETapiGETapi/api/emailGETapi/email/email/emailapi/emailGET GETapi/emailGET/email/emailGET GETapi/api/emailapi/email/email/templates GETapi/emailapi/email/emailapi/api/email/templates GETapi/emailapi/email/email-templates GETapi/emailapi/emailapi/email/api/emailapi/email/email-templates GETapi/emailapi/emailapi/emailapi/email-templates GETGETapi/emailapi/email/api/emailGETapi/email/emailtemplates GETapi/email/api/emailGETapi/emailapi/email/email-templates GETapi/email/emailapi/emailapi/email/email/email-templates GETapi/email/email/templates


### **GET GETapi/email/email/api/email/GETapi/email/api/emailGETapi/email/email-api/emailGETapi/email/api/email/api/emailapi/email/emailGETapi/emailapi/email/api/email/api/emailapi/emailGETapi/email/emailapi/email/api/email/emailGETapi/emailapi/emailGETapi/email/api/emailapi/email/api/emailGETapi/email/api/email/email/emailGETapi/email/api/email/emailapi/email/api/email-templates
### **GETapi/emailapi/emailGETapi/emailapi/emailGETapi/email/api/emailGETapi/email/api/email/emailapi/email/email-templates
**4. 🏦 Extrator Bancário (App Irmã em Python)
Implementado na Sprint F11, este módulo é responsável por transformar PDFs brutos de bancos em dados estruturados prontos para conciliação.
Fluxo de Processamento:
Upload: Frontend envia PDF para POST /api/parse-extrato
Extração Híbrida: Tenta parsers nativos (pdfplumber/PyMuPDF). Se falhar ou retornar vazio, aciona Mistral OCR via HTTP direto (fallback universal)
Normalização: Remove caracteres full-width (：, ，, √), pipes de markdown (|) e normaliza espaços
Parsing Stateful: Identifica o banco e aplica regex específicas. O parser do Banrisul é stateful (mantém estado entre linhas) para lidar com quebras de linha do OCR
LGPD: Mascara documentos sensíveis (ex: 10.601 → **.601) antes de retornar ao frontend
Human-in-the-Loop: Dados chegam como "status": "pendente". O usuário edita as contas de débito/crédito e clica em "Salvar Regras Aprendidas"
Exportação: Gera CSV compatível com Domínio/Altercata/Sênior/Contmatic (utf-8-sig, delimitador ;)
Parsers Suportados:

Banco
Estratégia de Parsing
Status
Banco do Brasil
Regex em tabela markdown + detecção por palavras-chave flexíveis
✅
Sicredi
Regex em linha única com identificação de PIX_CRED/PIX_DEB
✅
Banrisul
Parser Stateful: Associa dia, tipo, documento, valor, CPF e Nome que o OCR separou em linhas distintas
✅

🧠 Decisões de Arquitetura (ADRs Canônicos)
ADR
Decisão
004
Multi-tenant single-database com isolamento por companyId
030
Regra de Ouro: Ações com risco legal ou contábil nunca são automáticas (Human-in-the-Loop obrigatório)
066/067
Reimportação idempotente (overlap + anti-duplicidade)
070/072
Plano de contas SCI por cliente, com código unificado
075/076
Layout oficial de exportação SCI-Único v3 + Importação de extrato idempotente
097
Motor de PDF white-label no backend (@react-pdf/renderer)
103
Iniciar-Tudo.ps1: boot unificado com kill cirúrgico por porta e healthchecks
105
CORS multi-origem configurado para permitir comunicação entre Site (5173), Extrator (5174) e Radar (3002)
106
Proxy NestJS → Python em /accounting/extract-pdf-unified com fallback gracioso
107
Mistral OCR como fallback universal via HTTP direto (sem SDK) para evitar quebras de versão. Custo: $4/1000 págs
108
Parser stateful para Banrisul: Lida com quebra de linha do OCR (dia/tipo em uma linha, valor em outra)
109
Persistência de regras em JSON: data/regras/regras_aprendidas.json com merge idempotente por (descricao + conta). Transição futura para PostgreSQL
110
Mascaramento LGPD: Aplicado no backend (mascarar_documento()) antes de enviar dados ao frontend. Últimos 3 dígitos preservados
111
CSV Contábil: Formato padrão BR (utf-8-sig para abrir no Excel, delimitador ;, quoting ALL)
112
Human-in-the-Loop no fluxo: Lançamentos chegam como "pendente". Regras só são salvas após edição e aprovação manual em lote
113
🆕 Watch folder via chokidar (Node.js) — monitora pasta configurável, ignora temporários (.tmp, ~$)
114
🆕 Tracking pixel 1x1 GIF transparente via endpoint público; tracking de download via link proxy com registro determinístico
115
🆕 Templates de email editáveis via painel admin (Handlebars + variáveis: {{cliente.nome}}, {{cliente.cnpj}}, {{competencia}})
116
🆕 Envio plugável seguindo ADR-086: SendGrid (recomendado) / SMTP próprio / MODO LOG (sem chaves)
117
🆕 Human-in-the-Loop obrigatório: antes de enviar, mostra preview do email + lista de destinatários + anexos → humano confirma em lote ou um-a-um
118
🆕 Identificação de cliente por CNPJ no nome do arquivo (regex flexível: aceita com ou sem pontuação)
119
🆕 Pasta de "enviados" com subpastas por mês/competência (ex: enviados/2026-01/) para auditoria

🛠️ Stack Tecnológica

Camada
Tecnologia
Frontend (Radar)
Next.js 16 (App Router), React 19, TypeScript, Tailwind, Zustand, Sonner, Lucide
Frontend (Extrator)
Vite, React, react-dropzone, Axios
Backend (Radar)
NestJS 10, TypeScript, Prisma 5, JWT, @react-pdf/renderer, csv-parser
Backend (Extrator)
Python 3.14, FastAPI, uvicorn, requests, pdfplumber, PyMuPDF
IA / OCR
Mistral OCR API (via HTTP direto)
Banco de Dados
PostgreSQL 15+ (Local e Docker)
Infra / DevOps
Docker Compose, Cloudflare Tunnel, PowerShell 5.1 (scripts ASCII puro)
Email
SendGrid (recomendado) / SMTP próprio
Tracking
Pixel 1x1 + Link Proxy (determinístico)

📂 Estrutura de Pastas (Visão Macro)
C:\Site conta-certa\
├── site/                          # Site Conta Certa (Vite + Express)
├── radar-clone/                   # Radar Principal (Next.js + NestJS)
│   ├── frontend/src/              # App Router, components, store
│   └── backend/src/               # Controllers, services, prisma, pdf templates
│       ├── email-envio/           # 🆕 Módulo de Envio com Tracking
│       │   ├── email-envio.controller.ts
│       │   ├── email-envio.service.ts
│       │   ├── email-envio.module.ts
│       │   ├── dto/
│       │   └── entities/
│       ├── email-tracking/        # 🆕 Tracking de emails
│       │   ├── email-tracking.controller.ts
│       │   ├── email-tracking.service.ts
│       │   └── entities/
│       ├── email-template/        # 🆕 Templates editáveis
│       │   ├── email-template.controller.ts
│       │   ├── email-template.service.ts
│       │   └── entities/
│       └── watch-folder/          # 🆕 Monitoramento de pasta
│           ├── watch-folder.service.ts
│           ├── cnpj-parser.service.ts
│           └── file-mover.service.ts
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

🔗 Integração com o Site Conta Certa
O Radar se integra com o Site Conta Certa (portal público) via:
1. Autenticação Unificada (SSO)
Site gera JWT após login do cliente
Radar valida JWT e cria sessão
Mesma JWT_SECRET em ambos os projetos
2. Portal do Cliente
Site redireciona para Radar após login
Radar valida token e carrega dados do cliente
Logout em um sistema faz logout em ambos
3. Captação de Leads
Formulários do Site → Banco compartilhado
Radar lê prospects e notifica equipe comercial
4. Área Pública de Documentos
Links temporários para documentos do Radar
Validação de token via API do Radar
Expiração automática (7 dias)

🗺️ Roadmap — Onde chegamos e onde vamos
✅ Fases 1–5: Fundação, BI, Fiscal, Bancário, Aurora (FD-1 a FD-6), Portal do Cliente, PDFs white-label
✅ Sprints F8–F11: Catálogo Permanente, Ops unificado, Menu Ecossistema, Extrator Bancário v1.0 com Mistral OCR
✅ Sprint F12: Documentação completa e homologação
🆕 Sprint F13 (Atual): Sistema de Envio com Tracking de Comunicações
✅ Watch Folder implementado
✅ Parser de CNPJ funcional
✅ Envio via SendGrid (MODO LOG)
✅ Tracking pixel e link proxy
✅ Painel de controle básico
✅ Templates editáveis
🔜 Fase 6 (Próximos Passos)
F13-b: Melhorias no Módulo de Envio
Tracking pixel (abertura de email)
Retry automático com backoff exponencial
Relatórios de performance (taxa de abertura/download)
Notificações de falha de envio
Bulk send (envio em massa)
Agendamento de envios
F14: Modo Professor (Mapeamento assistido)
Mapeamento assistido de layouts de extrato desconhecidos via IA
Sugestão de contas contábeis baseada em histórico
Aprendizado de máquina para classificação automática
F15: Migração de Regras
Mover regras_aprendidas.json para tabela PostgreSQL no Radar (multi-tenant)
Classificação automática usando regras salvas (mantendo revisão humana)
Histórico de regras por cliente
F16: Hardening de Produção
CI/CD com GitHub Actions
Sentry (monitoramento de erros)
Backups automatizados do Postgres
Testes automatizados (unitários + integração)
Load testing
Documentação de APIs (Swagger/OpenAPI)
F17: Funcionalidades Avançadas
Integração com WhatsApp (envio de documentos)
Chatbot de atendimento
Assinatura digital integradabot de atendimento
Gestão
Assinatura digital integrada
Gestão financeiran. [ ] Agendamento de reuniões
financeira integrada
Open Banking (conciliação automática)
🧠 Continuidade do Projeto (Sistema de Memória para IA)
Para qualquer IA ou desenvolvedor que assumir este projeto:
Leia sempre o CONTEXTO_PROJETO.md (cole inteiro no início da conversa)
Consulte o CHANGELOG.md para entender a evolução das sprints
Regra de Ouro: Nenhum sprint novo começa sem o anterior homologado
Governança de ADRs: O registro canônico vive no §3 do CONTEXTO_PROJETO.md. Nunca reutilize números de ADR
📚 Documentação Relacionada
CONTEXTO_PROJETO.md — Contexto completo do projeto
CHANGELOG.md — Histórico de mudanças
PRODUCTION.md — Guia de deploy em produção
CONTRIBUTING.md — Guia de contribuição
ADR/ — Documentação técnica detalhada
leshooting
**Problema: Porta 3001/ # Windows
netstat -ano | findstr :3001
3001 # Windows
lsof :3001 | xargs kill -9 5433 não existe
bash

docker-compose docker-compose restart postgres-radar restart postgres


##
### **Problema: CORS error**
```env
# .env do backend
CORS_ORIG3002,http://localhost:5173,http://localhost:5174
Problema: Mistral OCR não funciona
# Verifique a chave no .env do Extrator
MISTRAL_API_KEY=sua_chave_aqui

# Teste a API
curl -X POST http://localhost:8000/api/health

📞 Suporte
Desenvolvedor: Marcos Toledo
Email: dev@contacerta.com.br
GitHub: @Mtoledo50
📄 Licença
Este projeto é proprietário da Conta Certa Soluções Empresariais. Todos os direitos reservados.
Última atualização: 11/09/2026


---

### **2. CONTRIBUTING.md do Radar**

Crie o arquivo `CONTRIBUTING.md` na raiz do repositório `radar-clone`:

```markdown
# 🤝 Guia de Contribuição — Radar Conta Certa

Obrigado por contribuir com o Radar Conta Certa! Este documento fornece diretrizes para garantir que suas contribuições sejam integradas de forma suave.

---

## 📋 Índice

1. [Código de Conduta](#código-de-conduta)
2. [Como Contribuir](#como-contribuir)
3. [Estrutura do Projeto](#estrutura-do-projeto)
4. [Estilo de Código](#estilo-de-código)
5. [ADRs (Architecture Decision Records)](#adrs-architecture-decision-records)
6. [Commits](#commits)
7. [Pull Requests](#pull-requests)
8. [Desenvolvimento de Novos Módulos](#desenvolvimento-de-novos-módulos)
9. [Testes](#testes)
10. [Reportando Bugs](#reportando-bugs)

---

## Código de Conduta

Este projeto segue o [Código de Conduta do Contribuinte](CODE_OF_CONDUCT.md). Ao participar, você concorda em seguir suas diretrizes.

---

## Como Contribuir

### **1. Fork o Repositório**
```bash
# No GitHub, clique em "Fork"
# Clone seu fork
git clone https://github.com/SEU_USUARIO/radar-clone.git
cd radar-clone

2. Crie uma Branch
# Para novas funcionalidades
git checkout -b feature/nova-funcionalidade

# Para correções de bugs
git checkout -b fix/corrigir-bug

# Para melhorias de documentação
git checkout -b docs/melhorar-readme

# Para refatoração
git checkout -b refactor/melhorar-performance

Nomenclatura de branches:
feature/ — Novas funcionalidades
fix/ — Correções de bugs
docs/ — Documentação
refactor/ — Refatoração de código
test/ — Adição de testes
chore/ — Tarefas de manutenção
3. Faça suas alterações
Siga o estilo de código
Teste suas mudanças localmente
Atualize a documentação se necessário
Siga as ADRs existentes
4. Commit suas mudanças

git add .
git commit -m "feat(email): adiciona sistema de tracking de emails"
git push origin feature/nova-funcionalidade

5. Abra um Pull Request
No GitHub, clique em "Compare & pull request"
Preencha o template do PR
Aguarde revisão
Estrutura do Projeto
O Radar é composto por 3 aplicações:**
**1. Frontend (Next.js # Next.js
├── frontend/src/
├── src/
├── app/
│ ├── store/ # Estado global
store)
│/ # Hooks customizados)
│ # Utilitários
**2. CSS global
2. Backend (NestJS)
backend/
├── src/
│   ├── email-envio/        # Móduloulos do NestJS
│   │   ├── auth/              # Autenticação
│   │   ├── cliente/        # Clientes
│   │   ├── contabil/        # Contábil
│   │   └── email-envio/        # 🆕 Módulo   ├── common/             # prisma
│   │   └── schema.prisma # Schema do banco
│   ├──              # Controllers (Data Transfer Objects)
│   └ entities/          # Utilitários
│   │

3. Extrator Bancário (FastAPI - Python)
extrator-bancario/backend── frontend/           # Vite + React
└── backend/
    ├── app/
    │   ├── main.py            # FastAPI app
    │   ├── models/            # Pydantic models
    │   ├── parsers/           # Parsers de banco
    │   └── services/          # Serviços (OCR, etc)
    └── data/
 data/                  # Dados tempor, exports, regras) requirements.txt      # Dependências Python

 Estilo de Código
Frontend (React + Next.js)
Componentes

// ✅ Correto
interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary';
}

export default function Button({ children, onClick, variant = 'primary' }: ButtonProps) {
  return (
    <button
      onClick={onClick}
      className={ variant === 'primary' ? 'bg-blue-600' : 'bg-gray-600'}`}
    >
      {children}
    </button>
  );
}

**Hooks// ❌ Evitar
export default function Button(props) {
return <button onClick={props.onClick}>{props.children}</button>;
}


#### **Nomes de Arquivos**
- Componentes: `PascalCase.tsx` (ex: `Button.tsx`, `Header.tsx`)
- Hooks: `useCamelCase.ts` (ex: `useAuth.ts`, `useFetch.ts`)
- Utilitários: `camelCase.ts` (ex: `formatDate.ts`, `apiClient.ts`)
- Páginas: `page.tsx` (ex: `Dashboard.tsx`)

#### **Estilização**
```tsx
// ✅ Use Tailwind CSS
<div className="flex items-center justify-center p-4">

// ❌ Evite CSS inline
<div style={{ display: 'flex', alignItems: 'center' }}>

**2. ### Backend (NestJS)
Estrutura de Módulos

// ✅ Correto
@Module({
  imports: [TypeOrmModule.forFeature([EmailEnvio])],
  controllers: [EmailEnvioController],
  providers: [EmailEnvioService],
  exports: [EmailEnvioService],
})
export class EmailEnvioModule {}

// ❌ Evitar
export class EmailEnvioModule {
  // Sem decorator

  Controllers
  // ✅ Correto
@Controller('api/email-envios')
export class EmailEnvioController {
  constructor(private readonly emailEnvioService: EmailEnvioService) {}

  @Get()
  async findAll(@Query() query: EmailEnvioQueryDto) {
    return this.emailEnvioService.findAll(query);
  }

  @Post()
  async create(@Body() dto: CreateEmailEnvioDto) {
    return this.emailEnvioService.create(dto);
  }
}

// ❌ Evitar
@Controller('emailEnvioService() {}



#### **Services**
```typescript
// ✅ Correto
@Injectable()
export class EmailEnvioService {
  constructor(
    @InjectRepository(EmailEnvio)
    private readonly repository: Repository<EmailEnvio>,
  )

  async findAll(query: EmailEnvioQueryDto) {
    const { page = query.page || 1;
    return this.emailEnvioRepository.findAndCount({
      take: 10,
      skip: (page - 1) * 10,
    });
 1);

Nomes de Arquivos
Controllers: camel (ex: email-envio.controller.ts)
Services: kebab-service.service.ts)
Modules: kebab-case.module.ts (ex: email-envio.module.ts)
Entities: PascalCase.entity.ts (ex: EmailEnvio.entity.ts)
DTOs: PascalCase.dto.ts (ex: CreateEmailEnvio.dto.ts)
ADRs (Architecture Decision Records)
O que são ADRs?
ADRs são documentos que registram decisões importantes de arquitetura. Elas ADR explica:
Por que a decisão foi tomada
O que foi decidido
Qu isso afeta o projeto
Onde ficam?
Registro canônico: de ADRs**: CONTEXTO_PROJETO.md (ADRs nunca devem números
Como criar uma nova ADR?
Antes de implementar uma mudança significativa: arquitetura:**
Verifique se já existe uma ADR relacionada
Se não existir, discuta com a equipe
Documente a decisão no CONTEXTO_PROJETO.md
Implemente a mudança a ADR
Exemplo de ADR

# ADR- ADR-120: Cache Redis para queries frequentes

## Status
Aprovada (2026)11. 12/09/2026-09-12

## Decisão
Usar Redis para cachear queries frequentes (clientes, plano, 2. TTL)

## Decisão
## Usar usar Redis para cachear queries frequentes (usuários, clientes, contratosções)
### **Contexto QueriesQueries de usuários frequentes (múlt de 1000 vezes
 - Clientes raramente
### Decisão## Decisão
- **TTL**: 5 minutos para usuários (configurações (## 60 minutos para clientes) para cache de cache TTL- ## 30
 para
## **Cache Redis invalidado em caso de atualização## **Consequências
## Positivas Performance melhorada em até 10
-  Positivas: Performance melhorada em queries mais-  Redução de carga no PostgreSQLNegativas: Complexidade adicional (Redis##  Necessidade de cache
- Necessidade invalidação manual em caso-## específicos
### Links Relacion Relacion Redis](##](./docs)
##)

---

## Commits

### **Conventional Commits**
Usamos o padrão [Conventional Commits](https://www.conventionalcommits.org/):

<tipo>(<escopo>): <descrição>
[corpo opcional]
[rodapé opcional]


#### **Tipos de Commit**
- `feat`: Nova funcionalidade
- `fix`: Correção de bug
- `docs`: Mudanças na documentação
- `style`: Formatação, ponto e vírgula, etc (sem mudança de código)
- `refactor`: Refatoração de código (sem mudança de funcionalidade)
- `perf`: Mudança de performance
- `test`: Adição ou correção de testes
- `chore`: Mudanças em arquivos de build, CI, etc
- `revert`: Reversão de commit

#### **Exemplos**
```bash
# Nova funcionalidade
git commit -m "feat(email): adiciona sistema de envio de emails com
git commit -m "fix(email-env corrige bug no tracking pixel"

# Documentação
git commit -m "docs(readme): atualiza instruções de instalação"

# Refatoração
git commit -m "refactor(api): simplifica função de busca de usuários usuários"

Pull Requests
Template de PR
## Descrição
Breve descrição das mudanças

## Tipo de Mudança
- [ ] Bug fix (mudança que corrige um problema)
- [ ] Nova funcionalidade (mudança que adiciona funcionalidade)
- [ ] Breaking change (mudança que pode quebrar funcionalidades existentes)
- [ ] Documentação

## ADR Relacion
Se esta PR implementa a ADR-XXX

## Checklist
- [ ] Meu código segue o estilo de código do projeto
- [ ] Eu testei minhas mudanças localmente
- [ ] Eu atualizei a documentação (se necessário)
- [ ] Minhas mudanças não geram novos warnings
- [ ] Eu adicionei testes (se aplicável)
- [ ] Todos os testes passam
- [ ] Eu segui as ADRs existentes



## Screenshots (se aplicável)
Adicione screenshots para mudanças de UI

## Issues RelacionadaCloses #123

Critério Código segue o estilo do projeto
✅ Testes passam (se houver)
✅ Documentação atualizada
✅ Sem conflitos com a branch main
✅ Pelo menos 1 aprovação de maintainer
✅ ADRs seguidas (se aplicável)
Desenvolvimento de Novos Módulos
Passo a Passo para de criar um novo módulo no Radar
1. Backend (NestJS)
bash

# backend/src/modules
- mkdir nome-modulo/
├   # Controller
│   ├── # Service
│   ├── nome│        # DTO/      # Entities/    # Entities
│   └── nome-modulo.module.ts  # Module

**2. Module
├ 2. DTOs
├── nome-modulo.service.spec.ts
├── module.module.ts
├── nome-modulo.module.ts


#### **3. Database (Prisma)**
```prisma
// backend/prisma/schema.prisma

model NomeModelo {
  id        String   @id @default(uuid())
  nome      String
  email     String
  status    String   @default("ativo")
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  companyId String
  company   Company  @relation(fields: [companyId], references: [id])

  @@map("nome_modelos")
}

4. Frontend (Next.js)
cd frontend/src
mkdir -p components/nome-modulo
mkdir app/dashboard/nome-modulo

5. Integra (se aplicável)

// backend/src/nome-modulo/nome-modulo.controller.spec.ts
describe

---

## Testes

### **Backend (NestJS)**bash
cd backend
# Rodar todos os testes
npm run test

# Rodar testes em watch mode
npm run test:watch mode
npm run test:watch:cov
npm test:watch
npm test:cov
```watch)



#### **Cobertura de Testes**
- **Mínimo**: 80% de cobertura0% para modules críticos**: 90%+ de envio: envio, clientes, envios)
- **Críticos**: 100% (ex: funçõesicação, pagamentos)

---

## Reportando Bugs

### **Antes de Reportar**
1. Verifique se o bug já foi reportado nas [Issues](https://github.com/Mtoledo50/radar-clone/issues)
2. Verifique se você está usando a versão mais recente
3. Tente reproduzir o bug em um ambiente limpo

### **Como Reportar**
Abra uma [Issue](https://github.com/Mtoledo50/radar-clone/issues/new) com:

```markdown
## Descrição do Bug
Descrição clara e concisa do bug

## Passos para Reproduzir## para '...'
2. Clique em '...'
3. Role até '...'
4. Veja em '...'
4. Veja o erro

## Comportamento Esperado
O que você esperava que acontecesse## ScreenshotsSe aplicável, screenshots## Screens
- OS: [ex: Windows 111,  14]
- Browser: [ex: Chrome 120, Firefox 121]
- Versão do Node: [ex: 18.17.0]
- Versão do Radar: [ex: v1.13.

Sugerindo Melhorias
Como Sugerir
Abra uma Issue com:

## Descrição da MelhoriaDescrição clara e concisa da melhoria

## Problema Relacionado
Se aplicável, mencione a issue relacionada## Solução Proposta
Descrição da solução que você gostaria de ver
## Alternativas Consideradas
Descrição de alternativas que você considerou## ## Adicione qualquer outro contexto ou screenshots sobre a melhoria

📞 Contato
Desenvolvedor: Marcos Toledo
Email: dev@contacerta.com.br
GitHub: @Mtoledo50
Contato
**
📋 **INSTRUÇÕES PARA COMMITAR NO radar-clone:
Opção 1: Manual (via GitHub)
Abra o repositório no GitHub: https://github.com/Mtoledo50/radar-clone
Clique em "Add file" → "Create new file"
Nome do arquivo: README.md
Cole o conteúdo completo do README.md acima
Commit: docs(readme): atualiza README.md com módulo de tracking
Repita o processo para CONTRIBUTING.md
Opção 2: Via Git (Local)

# Clone o repositório (se ainda não clonou)
git clone https://github.com/Mtoledo50/radar-clone.git
cd radar-clone

# Crie o arquivo README.md
ualize o arquivo README.md
# Cole o conteúdo do README.md acima no arquivo

# Crie o arquivo CONTRIBUTING.md
# Cole o conteúdo do CONTRIBUTING.md acima no arquivo

# Commit e push
git add README.md CONTRIBUTING.md
git commit -m "docs: atualiza README e adiciona CONTRIBUTING.md"
git push origin main

