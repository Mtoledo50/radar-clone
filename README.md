# 🎯 RADAR CONTA CERTA

**O cérebro digital do escritório contábil**

<div align="center">

![Status](https://img.shields.io/badge/🚀_PRODUÇÃO_EM_BREVE-0d9488?style=for-the-badge)
![Next.js](https://img.shields.io/badge/Next.js-16.2-black?style=for-the-badge)
![NestJS](https://img.shields.io/badge/NestJS-10-red?style=for-the-badge)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-336791?style=for-the-badge)
![Prisma](https://img.shields.io/badge/Prisma-5-2d3748?style=for-the-badge)
![Sprints Entregues](https://img.shields.io/badge/Sprints_Entregues-31-f97316?style=for-the-badge)

Um SaaS que transforma 4 horas de trabalho manual em 15 minutos — importando extratos e notas fiscais, classificando sozinho, conciliando com inteligência e entregando DREs prontos para o cliente e para a diretoria.

[Para Diretores](#-resumo-executivo-para-quem-não-programa) • [Mapa do Sistema](#️-mapa-do-sistema) • [Jornada das Sprints](#-jornada-de-desenvolvimento-sprints-131) • [Arquitetura](#️-arquitetura-para-a-equipe-técnica) • [Roadmap](#️-roadmap-onde-chegamos-e-onde-vamos)

</div>

---

## 📌 Resumo Executivo (para quem não programa)

💡 **Em uma frase:** o Radar Conta Certa é um sistema na nuvem (SaaS) que automatiza a rotina contábil de ponta a ponta — do extrato do banco ao relatório final do cliente — com segurança, rastreabilidade e inteligência artificial de regras.

### 😫 Antes (como é hoje nos escritórios)

| Atividade | Tempo mensal | Risco |
|-----------|--------------|-------|
| Digitar extrato bancário planilha por planilha | 2–4 h por cliente | Erros de digitação |
| Classificar cada lançamento "na mão" | 1–2 h por cliente | Inconsistência |
| Conferir Pix × Nota Fiscal olho a olho | 1–3 h por cliente | Pagamentos esquecidos |
| Montar DRE no Excel | 1 h por cliente | Fórmulas quebradas |

###  Com o Radar Conta Certa

| Atividade | Tempo | Como |
|-----------|-------|------|
| Importar extrato | 10 segundos | 1 clique no CSV do banco |
| Classificar lançamentos | automático | O sistema aprende com o contador |
| Conferir Banco × NF-e | automático | Motor de score com confiança % |
| DRE pronto p/ cliente | 1 clique | Exporta CSV / imprime profissional |

### 🔢 Resultados reais medidos (cliente-piloto: Academia do Renan)

- ✅ +74 transações importadas e classificadas em segundos (junho/2026)
- ✅ DRE fechado: Receita R$ 9.404,71 × Despesas R$ 10.832,75 (bate com o banco)
- ✅ Julho/2026: 90% classificado SOZINHO pela memória de aprendizado
- ✅ Conciliação Banco × NF-e com sugestões de 80–90% de confiança

---

## 🗺️ Mapa do Sistema
┌─────────────────────────────────────────────────────────────┐
│ OPERACIONAL │
│ Dashboard → Pessoas & Turnover → Clientes & CRM → Projetos │
└─────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────┐
│ COMERCIAL │
│ Precificação → Propostas & Planos → Motor de Herança (A1) │
└─────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────┐
│ FISCAL │
│ NF-e de Entrada → Estoque Kardex → Apuração ICMS → SPED │
└─────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────┐
│ BANCÁRIO │
│ Extrato CSV → Classificação c/ Memória → DRE Bancário │
│ → Fechamento do Mês → Conciliação Banco × NF-e │
└─────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────┐
│ CONTÁBIL │
│ Plano de Contas SCI → Lançamentos → Ponte Bancário→Contábil│
│ → DRE Oficial do Cliente → Exportação SCI │
└─────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────┐
│ INTELIGÊNCIA (BI) │
│ DRE do Escritório → Ponto Fora da Curva → Simulador Trib. │
└─────────────────────────────────────────────────────────────┘


---

## ✨ Módulos e Funcionalidades

### 🔐 Segurança & Plataforma
- [x] Login com JWT + refresh token e proteção de rotas
- [x] Multi-tenant: cada escritório vê APENAS os seus dados (`companyId`)
- [x] Papéis de acesso (Super Admin, Admin, Gerente, Usuário, Cliente)
- [x] Módulos liberados por plano de assinatura (`allowedModules`)

### 📊 Dashboard Executivo
- [x] KPIs em tempo real (clientes, faturamento, pessoas, metas)
- [x] Gráficos nativos em CSS puro (zero dependências pesadas)

### 👥 Pessoas & Clientes
- [x] CRUD de colaboradores + Turnover automático por setor
- [x] Carteira de clientes com honorários, status e ticket médio
- [x] Importação em massa da carteira (~100 clientes de uma planilha) sem duplicar

### 💼 Comercial
- [x] Precificação por horas + margem
- [x] Planos e propostas com link público
- [x] **Motor de Herança de Planos** (Sprint A1): planos herdam itens automaticamente
- [x] CRM com funil, motivos de perda e taxa de conversão

### 🧾 Fiscal (Sprints 8–20)
- [x] Upload de NF-e em lote com parser próprio de XML
- [x] Estoque Kardex com custo médio por replay e saldo inicial importado
- [x] Apuração de ICMS mensal + SPED Bloco H (layout legal fixo)
- [x] Relatório H010 com 17 colunas e tributos (ICMS/ST/IPI/PIS/COFINS)
- [x] Manutenção manual de produtos com trilha de auditoria (ajustes)

### 🏦 Bancário (Sprints 21–24)
- [x] Importação de extrato CSV com parser à prova de erros (milhares BR/US, datas)
- [x] Classificação com memória: o sistema aprende cada correção do contador
- [x] Naturezas personalizadas por cliente (cada empresa tem o seu DRE)
- [x] DRE gerencial, relatório por natureza com subtotais, autosoma
- [x] Fechamento do mês com trava de compliance (fechou, não mexe)

### 📒 Contábil (Sprints 20, 25–26)
- [x] Plano de contas (padrão SCI 90113) + lançamentos de partida dobrada
- [x] Ponte Bancário → Contábil: 1 clique transforma o mês em escrituração
- [x] Exportação para o sistema SCI
- [x] DRE Oficial do Cliente com confronto Contábil × Bancário

### 🔗 Conciliação Inteligente (Sprint 29)
- [x] Motor que cruza débitos do banco × NF-e de entrada com score de confiança
- [x] Sugestões  ≥80% / 🟡 50–79% com revisão humana obrigatória

###  BI & Inteligência
- [x] DRE do Escritório
- [x] Ponto Fora da Curva (anomalias estatísticas)
- [x] Simulador Simples Nacional × Presumido × Real
- [x] Reforma Tributária (EC 132/23)
- [x] Exportação PDF profissional e CSV compatível com Excel (UTF-8 + BOM)

###  Containerização (Sprint 31)
- [x] Docker Compose: 1 comando para subir tudo (Postgres + Backend + Frontend)
- [x] Ambiente isolado para testes (banco virgem na porta 5433)
- [x] Build de produção otimizado (Next.js standalone + NestJS multi-stage)

---

## 🏆 O Diferencial: os 3 DREs

| DRE | 🎯 Para quem | 📚 Fonte de dados | 📍 Onde ver |
|-----|--------------|-------------------|-------------|
|  **Do Escritório** | Diretor da Conta Certa | Transações financeiras internas | BI |
| 💼 **Bancário do Cliente** | Gestão de caixa do cliente | Extrato + naturezas | Fechamento Mensal |
| 📒 **Oficial do Cliente** | Contabilidade / obrigações | Lançamentos promovidos | BI → DRE do Cliente |

✅ Os três conversam entre si por cards de navegação cruzada, e o Oficial mostra a diferença em R$ contra o Bancário — auditoria em tempo real.

---

## ️ Arquitetura (para a equipe técnica)
┌─────────────────────────────────────────────────────────┐
│ Frontend — Next.js 16 (App Router) │
│ React 19 + TypeScript + Tailwind │
│ Zustand (estado) • Sonner (toasts) • Axios │
──────────────────────┬──────────────────────────────────┘
│ HTTP/REST + JWT
▼
┌─────────────────────────────────────────────────────────┐
│ Backend — NestJS 10 │
│ Controllers → Services → DTOs │
│ Guards JWT • RBAC @Roles() │
└──────────────────────┬──────────────────────────────────┘
│ Prisma ORM
▼
┌─────────────────────────────────────────────────────────┐
│ PostgreSQL 15 + Prisma │
│ ~35 tabelas • isolamento por companyId │
│ índices, soft delete, enums fortes │
└─────────────────────────────────────────────────────────┘


### Princípios adotados
- **Multi-tenant single-database** — um banco, isolamento lógico por `companyId`.
- **Enums como fonte da verdade** — fim das "strings soltas".
- **Idempotência por upsert** — importar/promover 2× nunca duplica.
- **Revisão humana obrigatória** — imports e conciliações nunca aplicam cegamente.
- **Compliance primeiro** — SPED com layout legal fixo; mês fechado é imutável.
- **Zero dependências pesadas de gráfico** — CSS puro (‑200 KB de bundle).

---

##  Instalação

### 🐳 Com Docker (Recomendado para Desenvolvimento)

**Pré-requisitos:** Docker Desktop instalado e rodando.

```bash
# 1. Clonar o repositório
git clone https://github.com/seu-usuario/radar-conta-certa.git
cd radar-conta-certa

# 2. Subir tudo com 1 comando (Postgres + Backend + Frontend)
docker compose up -d --build

# 3. Verificar se os 3 containers estão Up
docker compose ps

# 4. Acessar http://localhost:3000
# Login: admin@demo.com / Senha: 123456

Portas:
Frontend: http://localhost:3000
Backend API: http://localhost:3001
Postgres (Docker): localhost:5433 (banco virgem para testes)
Postgres (Local): localhost:5432 (seus dados reais — intocado)
Comandos úteis:

docker compose logs -f backend    # Ver logs do backend em tempo real
docker compose restart backend    # Reiniciar apenas o backend
docker compose down -v            # Derrubar tudo e apagar o banco virgem

💻 Local (Desenvolvimento Tradicional)

# 1. Backend
cd backend
npm install
cp .env.example .env
npx prisma migrate deploy
npx prisma generate
npm run start:dev   # → http://localhost:3001

# 2. Frontend
cd ../frontend
npm install
cp .env.example .env.local
npm run dev         # → http://localhost:3000

# 3. Acessar http://localhost:3000
# Login: admin@demo.com / Senha: 123456

🎨 Identidade Visual
🟩 Teal #0d9488
🟧 Laranja #f97316
⬜ Cinza #475569
Cor primária (ações, sidebar)
Destaques e alertas
Textos neutros


🗺️ Roadmap — onde chegamos e onde vamos
✅ FASES 1–2.5 — Fundação + BI + Fiscal + Bancário + Contábil (Sprints 1–30)
Auth multi-tenant, Dashboard, Pessoas, Clientes, Precificação, Planejamento
Fiscal (NF-e, Kardex, ICMS, SPED), Bancário (extrato, conciliação)
Contábil (plano de contas, lançamentos, DRE oficial)
BI (DRE do escritório, ponto fora da curva, simulador tributário)
Conciliação Banco × NF-e com motor de score
✅ FASE 3 — PRODUÇÃO (Sprint 31 + A1)
Sprint 31: Docker + docker-compose (deploy em 1 comando)
Sprint A1: Motor de Herança de Planos (domínio puro)
Sprint A2: Valor de Referência + Dinheiro na Mesa (PRÓXIMA)
Sprint 32: Deploy em nuvem/VPS com proxy reverso
Sprint 33: CI/CD (GitHub Actions)
Sprint 34: Monitoramento (Sentry) + Backup automático
🚧 FASE 4 — EXPANSÃO COMERCIAL (Plano Conta Certa 2.0)
A3: Versões de Proposta
A4: Fechamento com Ganho
A5: White-label (cores do logo/site do cliente)
A6: PDF v2 + PNG
A7: Dashboard de Desempenho
📋 FASE 5 — PESSOAS & MERCADO
B1–B5: Tipos contratuais, distribuição por setor, entrevista de desligamento (IA)
C1–C4: Benchmark de softwares, serviços extras, indicadores com fórmula, score 0–100
FASE 6 — MENTORIA & UX
D1–D3: Visão de Futuro, checklist, ranking de níveis
E1–E3: Command palette, boas-vindas/"onde parou", notificações


📖 Glossário (para a diretoria)
Termo                                       Significado simples
SaaS                                        Software assinado e usado pela internet, sem instalar nada
Multi-tenant                                Vários escritórios no mesmo sistema, cada um vendo só o que é seu
DRE                                         "Demonstração de Resultado" — o boletim de notas financeiro do mês
NF-e                                        Nota Fiscal eletrônica (o XML oficial emitido/comprado)
Kardex                                      O "extrato do estoque": tudo que entrou, saiu e o custo médio
SPED                                        Arquivo oficial exigido pela Receita Federal
Partidas dobradas                           Regra contábil: todo débito tem um crédito igual
Conciliação                                 Conferir se o que saiu no banco bate com a nota fiscal
Score                                       Nota de confiança (0–100%) que o motor dá a cada sugestão

Licença & Autor
Proprietary License — Copyright © 2026 Conta Certa Soluções Empresariais.
Propriedade intelectual; cópia ou distribuição sem autorização são proibidas.
👨‍💻 Autor: Marcos — Desenvolvedor Full Stack
📞 Suporte: contato@contacerta.com.br • www.contacerta.com.br
<div align="center">

Feito com ❤️ para transformar a contabilidade brasileira
⭐ Útil para você? Dê uma estrela no repositório!
</div>
```