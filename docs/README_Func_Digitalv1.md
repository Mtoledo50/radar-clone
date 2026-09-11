# 🤖 FUNCIONÁRIO DIGITAL RADAR (FDR)
> O funcionário que trabalha 24/7 no seu escritório contábil — dentro do Radar Conta Certa
> ⚠️ Numeração de ADRs 025–033 deste documento é LOCAL do FDR (histórica).
> Registro canônico do projeto: CONTEXTO_PROJETO.md §3 (vai até ADR-106).

<div align="center">
🏭 EM PRODUÇÃO CONTROLADA (FD-1→FD-6 + FD-8 ✅ • FD-5 v2 ✅)
NestJS 10 • Next.js 16 • PostgreSQL 15 • RPA Playwright (fase FD-7+)
Roadmap FD-0 → FD-9
</div>

## 🎯 Resumo Executivo (para quem não programa)
O FDR é um colaborador virtual que vive dentro do Radar: coleta documentos, concilia,
apura, prepara guias, importa em ERP e entrega tudo pronto para revisão humana.
Diferencial: não "clica telas" — opera por dentro do Radar com dados nativos,
aprendizado real e auditoria de 100% das ações.

## 😫 Antes / ✅ Depois
(rotinas manuais 2–5 h por cliente → coleta/conciliação/guias/relatórios automáticos;
o contador só revisa a fila 🟡) — inalterado da v1.

## 💎 A REGRA DE OURO (inegociável — ADR-030 canônico)
"A automação prepara, calcula, organiza e recomenda.
O humano aprova tudo que gera obrigação legal, pagamento ou transmissão oficial."
| A IA PODE sozinha | A IA NUNCA sozinha |
|---|---|
| Classificar despesa (memória) | Definir código de receita |
| Sugerir conta contábil | Calcular alíquota/base |
| Interpretar/comparar documentos | Transmitir SPED / enviar guia |

## 🧩 As 9 áreas de atuação
(tabela da v1, inalterada: Conciliação, NFS-e, Guias, Boletos, SPED, Escrituração,
Legalização, Relatórios, DP — com autonomias e fases FD-2…FD-9)

## 🏛️ Os 4 pilares • 🏗️ Arquitetura em 4 camadas • 🗄️ Modelo de dados
(inalterados da v1: Pilares A–D; camadas Painel/Orquestração/Motores/Governança;
tabelas DigitalEmployee…CredentialVault)

## 📅 Roadmap de entrega — STATUS ATUALIZADO (10/09/2026)
| Fase | Nome | Status |
|---|---|---|
| FD-0 | Descoberta | ✅ |
| FD-1 | Fundação | ✅ 15/08 (backend+frontend+dashboard) |
| FD-2 | Conciliação + Relatórios | ✅ (inclui MONTHLY_REPORT, 99 PDFs reais) |
| FD-3 | NFS-e | ✅ 3a ABRASF + 3b coletor IMAP (ADR-036/037/039) |
| FD-4 | Guias | ✅ domínio puro Simples/ISS c/ memória de cálculo (ADR-038) |
| FD-5 | Boletos/CNAB | ✅ v2 27/08: CNAB 240/400 (16 testes) + régua + notificações (ADR-084–087) |
| FD-6 | SPED/EFD | ✅ EFD-Contribuições v1 (ADR-060); SPED completo pendente |
| FD-7 | ERPs | ⏳ PRÓXIMA (Domínio/Questor/Sage; SCI já existe) |
| FD-8 | Legalização | ✅ cofre AES-256-GCM + certificados A1 (ADR-059) |
| FD-9 | DP | ⏳ (integração c/ folha existente — nunca motor próprio) |

## 🔗 🆕 Ponte com o Extrator Bancário (Sprint F11-a, ADR-106)
- O Extrator Bancário (Python/FastAPI + Mistral OCR) é app irmã do ecossistema,
  não uma skill da Aurora — mas alimenta o mesmo fluxo bancário.
- O Radar chama o Extrator via proxy server-to-server:
  POST /accounting/extract-pdf-unified (fetch nativo undici) → badge 🐍 Python;
  se o Extrator estiver fora, cai no parser nativo → badge 🧩.
- Health: GET /accounting/extractor-health. Boot unificado: Iniciar-Tudo.ps1 (ADR-103).
- Futuro (F11-b): Modo Professor — mapeamento assistido de layouts desconhecidos
  ("onde é data? valor? D/C?") gerando templates determinísticos reutilizáveis.

## 📜 ADRs do Funcionário Digital (numeração LOCAL — ver aviso no topo)
025 RPA Playwright em worker • 026 cofre AES-256-GCM • 027 cert A1 criptografado •
028 toda ação gera AutomationAudit • 029 guia/SPED sempre c/ revisão humana •
030 Regra de Ouro • 031 cálculo determinístico • 032 LGPD retenção/minimização •
033 permissões de aprovação separadas de CRUD.

## ✅ Status atual e próximos passos (10/09/2026)
[x] FD-0 → FD-6 + FD-8 • FD-5 v2 • Central de Aprovações • crons ↔ toggles
[x] Resultados reais: 98 clientes, 18/18 classificações auto, 99 PDFs, guias ACGS,
    NFS-e c/ fila 🟡, 602 h economizadas
[ ] FD-7 integrações ERP • [ ] FD-9 DP • [ ] teste IMAP c/ caixa real
[ ] 🆕 F11-b Modo Professor (templates de extrato assistidos)

## 🚀 Próxima entrega imediata
FD-7 (conector SCI já existe → Domínio/Questor/Sage) OU F11-b Modo Professor,
conforme decisão do §9 do CONTEXTO_PROJETO.md.

## 📖 Glossário (da v1, inalterado)
(RPA, CNAB, OFX, DAS, DCTFWeb, eCAC, procuração, memória de cálculo,
human-in-the-loop, cofre)

<div align="center">
👨‍💻 Autor: Marcos — Desenvolvedor Full Stack
📞 contato@contacerta.com.br • www.contacerta.com.br
Licença proprietária — © 2026 Conta Certa Soluções Empresariais
</div>