
#### **PASSO 2: Substitua TODO o conteúdo de `CHANGELOG.md` por isto:**
*(Foco: Cronologia limpa. Removi as duplicatas e o texto corrompido).*

```markdown
# 📋 CHANGELOG — Radar Conta Certa
Formato: [Keep a Changelog](https://keepachangelog.com/).

## [Não Lançado]
### 🔜 Próximos Passos (Fase 6)
- **F13-b**: Tracking pixel real, retry automático com backoff, relatórios de performance de envio.
- **F14**: Modo Professor (Mapeamento assistido de layouts de extrato desconhecidos).
- **F15**: Migração de `regras_aprendidas.json` para tabela PostgreSQL multi-tenant.
- **F16**: Hardening de Produção (CI/CD, Sentry, Backups automatizados, Testes E2E).

---

## [Sprint F13] — 2026-09 — Sistema de Envio com Tracking ✅
### Added
- Watch Folder (chokidar) para detecção automática de arquivos em `C:\Documentos\Enviar`.
- Parser de CNPJ flexível no nome do arquivo para identificação do cliente.
- Módulo de Envio de E-mails (SendGrid/SMTP) com preview e aprovação humana obrigatória (ADR-117).
- Tracking determinístico: Pixel 1x1 (abertura) e Link Proxy (download).
- Templates de e-mail editáveis via painel admin (Handlebars).
- Tabelas: `EmailEnvio`, `EmailTracking`, `EmailTemplate`.

---

## [Sprint F11-F12] — 2026-09 — Extrator Bancário Inteligente ✅
### Added
- App isolado em Python (FastAPI) para ingestão de PDFs bancários.
- Parsers nativos para Banrisul (stateful), Sicredi, Banco do Brasil e Itaú PJ.
- Fallback universal para Mistral OCR via HTTP direto (ADR-107).
- Geração de CSV contábil padronizado (UTF-8+BOM) com regras de classificação aprendidas (ADR-112).

---

## [Sprint A1-A7] — 2026-08 — Plano 2.0: Ciclo Comercial Completo ✅
### Added
- **A1**: Domínio puro de herança de planos comerciais (multiplicador, independente).
- **A2**: Endpoint `/resolved` e simulador de "Dinheiro na Mesa".
- **A3**: Versionamento imutável de propostas (cadeia de versões).
- **A4**: Fechamento de proposta com cálculo de ganho/desconto.
- **A5**: White-label (cores e rodapé customizáveis por empresa).
- **A6**: Geração de PDF v2 e PNG de capa via Canvas no cliente.
- **A7**: Dashboard de desempenho comercial com funil em CSS puro.

---

## [Sprints FD-1 a FD-6 + FD-8] — 2026-08 — Aurora (Funcionária Digital) ✅
### Added
- **FD-1/2**: Skills de Conciliação, Classificação e Ponte Contábil com Central de Aprovações (Régua 80/50).
- **FD-2 Final**: Geração de Relatório Mensal em PDF por cliente.
- **FD-3**: Importação de NFS-e (XML ABRASF) via upload e coletor IMAP.
- **FD-4**: Emissão de Guias de Imposto (Simples Nacional/ISS) com memória de cálculo.
- **FD-5/6**: Régua de cobrança, geração de CNAB 240 v1 e EFD-Contribuições.
- **FD-8**: Cofre AES-256-GCM para senhas, procurações e Certificado A1.

---

## [Sprints 21-30] — 2026 — Hardening, Contábil e Fiscal ✅
### Added
- Fechamento mensal bancário com trava de compliance e natureza dinâmica.
- Ponte Bancário → Contábil (partida dobrada idempotente).
- Plano de Contas SCI 90113 com código unificado e multi-planos por cliente.
- Módulo Fiscal completo: NF-e de entrada, Kardex, Apuração de ICMS e SPED Bloco H.
- Conciliação automática Banco × NF-e com motor de score (Jaccard + Data + Valor).

---

## [Sprint 31-32] — 2026-08 — Containerização e Produção Local ✅
### Added
- `docker-compose.yml` unificado (Radar + Site + Extrator + Cloudflare Tunnel).
- Boot self-healing com `prisma migrate deploy` no startup do container.
- Resolução de erros de build de produção (TypeScript rigoroso, CORS multi-origem).