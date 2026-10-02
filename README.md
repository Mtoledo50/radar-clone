# 🎯 Radar Conta Certa
**O cérebro digital do escritório contábil.**

SaaS multi-tenant que transforma 4 horas de trabalho manual em 15 minutos, automatizando a rotina contábil de ponta a ponta: do extrato do banco ao relatório final, com segurança, rastreabilidade e aprovação humana obrigatória (Human-in-the-Loop).

<div align="center">
  <img src="https://img.shields.io/badge/Next.js-16-000000?style=for-the-badge&logo=next.js" />
  <img src="https://img.shields.io/badge/NestJS-10-E0234E?style=for-the-badge&logo=nestjs" />
  <img src="https://img.shields.io/badge/PostgreSQL-15-336791?style=for-the-badge&logo=postgresql" />
  <img src="https://img.shields.io/badge/Python-3.11+-3776AB?style=for-the-badge&logo=python" />
</div>

---

## 🚀 Começo Rápido (Local)

1. **Pré-requisitos**: Node.js 18+, Python 3.11+, Docker Desktop, PostgreSQL 15+.
2. **Clone e instale**:
   ```bash
   git clone https://github.com/Mtoledo50/radar-clone.git
   cd radar-clone

3. Boot Unificado (Windows PowerShell):
   .\Iniciar-Tudo.ps1
Isso iniciará: Radar Frontend (3002), Radar Backend (3001), Extrator Bancário (8000/5174) e Postgres Docker (5433).

4. Acesse: http://localhost:3002
🧭 Ecossistema


Aplicação             Porta         Função
Radar Frontend        3002          Painel principal do escritório (Next.js)
Radar Backend         3001          API principal, regras de negócio, PDFs (NestJS)
Extrator Bancário     8000 / 5174   API Python (FastAPI) + UI React para OCR e parsing de PDFs
Postgres (Docker)     5433          Banco de dados de desenvolvimento (virgem)


📚 Documentação Oficial

Não procure regras de negócio no código. Elas estão documentadas aqui:
🧠 CONTEXTO_PROJETO.md: Estado atual, stack, ADRs ativos e próximos passos (Leia antes de codar).
📜 CHANGELOG.md: Histórico cronológico de sprints e entregas.
🤝 CONTRIBUTING.md: Padrões de código, commits e fluxo de PR.
📂 /docs: ADRs detalhados, guias de deploy e especificações de módulos (Ex: Aurora, Extrator).

⚖️ Regras de Ouro (Não Negociáveis)
Human-in-the-Loop (ADR-030): Nenhuma ação que gere obrigação legal, fiscal ou contábil é 100% automática. A IA prepara, o humano aprova.
Multi-tenant (ADR-004): Toda query no backend deve ser filtrada por companyId.
Idempotência (ADR-066): Importar o mesmo extrato ou plano de contas duas vezes não pode duplicar dados.
📞 Suporte e Propriedade
Propriedade Intelectual: Conta Certa Soluções Empresariais © 2026.
Desenvolvedor: Marcos Toledo | dev@contacerta.com.br
