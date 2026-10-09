tatus: ✅ Implementada
Data: 08/10/2026
Autores: Equipe Conta Certa
Contexto:
O módulo de Obrigações (catálogo de obrigações fiscais) e o módulo de Central de Envios (gestão de e-mails com anexos) operavam de forma independente. Não havia vínculo automático entre um arquivo enviado e a obrigação correspondente que ele cumpre.
Decisão:
Implementar uma "ponte" não-bloqueante em 3 pontos de integração (LP1, LP2, LP3):
LP1 — Vínculo no momento da detecção do arquivo
Arquivo: backend/src/obligations/obligation-bridge.ts (NOVO)
Função: linkFileToObligation()
Gatilho: ArquivoFilaService.registrarDetecao() (CASO 3 e CASO 4)
Lógica: Casa o 1º token do nome do arquivo (ex: "Acomp") com o mininome da obrigação ativa
Resultado: Cria ObligationDelivery com status PENDENTE e vincula ao ArquivoFila
LP2 — Atualização no momento do envio
Função: propagateSentByEnvioId()
Gatilho: EmailEnvioService.processarAprovacao() (após sucesso do envio)
Resultado: Delivery vira ENVIADO + grava sentAt
LP3 — Tracking de abertura e download
Função: markTrackingByEnvioId()
Gatilhos: TrackingPublicoController.registrarAbertura() e baixarDocumento()
Resultado: Grava openedAt e downloadedAt na delivery
Schema Prisma — Novos campos (todos nuláveis para segurança):

// ArquivoFila
scheduleId           String?
obligationDeliveryId String?

// EmailEnvio
scheduleId           String?
obligationDeliveryId String?

// ObligationDelivery
sentAt        DateTime?
openedAt      DateTime?
downloadedAt  DateTime?
lastEnvioId   String?

Migração: npx prisma migrate dev --name ponte_ob6_obrigacoes_envios
Consequências:
✅ Lote de obrigações agora exibe situação (CUMPRIDA/PENDENTE) + datas de envio/abertura/download
✅ Falha na ponte nunca bloqueia o fluxo de envio (try/catch em todas as funções)
✅ Preserva a primeira data de abertura/download (não sobrescreve)
