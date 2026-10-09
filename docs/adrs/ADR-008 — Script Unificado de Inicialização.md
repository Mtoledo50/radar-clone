Status: ✅ Implementada
Data: 09/10/2026
Contexto:
Múltiplos serviços (Radar, Site, Extrator) precisavam ser iniciados manualmente em terminais separados.
Decisão:
Criar iniciar-radar.ps1 com menu interativo e suporte a flags.
Funcionalidades:
Modo DEV (Docker Postgres + apps locais) ou PROD (tudo Docker)
Opção de ligar/desligar Site e Extrator
Liberação automática de portas (mata processos zumbis)
Aguarda saúde do Postgres via healthcheck
Logs em arquivo (logs/boot-radar-YYYY-MM-DD-HHmmss.log)
Uso:

.\iniciar-radar.ps1              # Menu interativo
.\iniciar-radar.ps1 -ComSite     # Dev + Site (sem perguntar)
.\iniciar-radar.ps1 -Modo prod   # Produção Docker

📁 Arquivos Criados/Modificados
Novos:
backend/src/obligations/obligation-bridge.ts — Funções da ponte OB-6
backend/scripts/get-track-links.ts — Utilitário para obter links de tracking
backend/scripts/reset-delivery-tracking.ts — Reset de tracking para testes
backend/scripts/repair-ob6-links.ts — Reparo de vínculos retroativos
Modificados:
backend/prisma/schema.prisma — Campos OB-6 em ArquivoFila, EmailEnvio, ObligationDelivery
backend/src/comunicados/arquivo-fila/arquivo-fila.service.ts — LP1 (linkFileToObligation)
backend/src/comunicados/email-envio/email-envio.service.ts — LP2 (propagateSentByEnvioId) + fix unique constraint
backend/src/comunicados/email-envio/tracking-publico.controller.ts — LP3 (markTrackingByEnvioId)
backend/src/obligations/obligations.service.ts — getScheduleTimeline com tracking real
backend/.env — SMTP + PUBLIC_BASE_URL
frontend/.env.local — NEXT_PUBLIC_API_URL
frontend/src/lib/axios.ts — Console log de debug (remover após validação)
iniciar-radar.ps1 — Script unificado com suporte a Site + Extrator

Testes Realizados
Teste
Resultado
Detecção de arquivo + vínculo com obrigação
✅ Log "🔗 OB-6: vinculado à obrigação"
Envio SMTP real via Gmail
✅ Email entregue com anexo
Tracking de abertura (pixel)
✅ openedAt gravado
Tracking de download (proxy)
✅ downloadedAt gravado
Acesso via domínio público
✅ radar.contacerta.com.br funcional
Login via Cloudflare
✅ Autenticação OK
Script unificado
✅ Todos os serviços sobem

⚠️ Lições Aprendidas / Armadilhas
Next.js não recarrega .env com hot reload — Sempre reinicie o servidor após mudar variáveis de ambiente.
Windows esconde extensão .txt — Use Set-Content do PowerShell para criar .env em vez do Bloco de Notas.
Docker containers podem ocupar portas — Use docker compose rm -f para remover, não apenas stop.
Cloudflare Tunnel precisa de serviço Windows — Instale com cloudflared service install para persistência.
Gmail exige senha de app — Não use senha normal da conta; gere em myaccount.google.com → Segurança.
