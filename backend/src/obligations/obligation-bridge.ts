/**
 * ============================================================================
 * 🔗 PONTE OB-6 — OBRIGAÇÕES × CENTRAL DE ENVIOS
 * ============================================================================
 * Funções de integração SEM acoplamento de módulos NestJS: recebem o
 * PrismaService e fazem o trabalho. São chamadas em 3 pontos-âncora do
 * módulo de envio (fila, envio, tracking) com 1 linha cada.
 *
 * Regra de casamento (não usa o enum TipoDocumentoComunicado):
 *   1º token do nome do arquivo  ↔  mininome (exato) ou nome (contém),
 *   normalizado (maiúsculas, sem acentos/símbolos).
 *   Ex.: "Acomp_08432644000160.pdf" → token "ACOMP" ↔ mininome "Acomp." ✅
 *
 * Todas as funções são NÃO-BLOQUEANTES: falha na ponte nunca derruba
 * o fluxo de envio (try/catch + warn).
 * ============================================================================
 */

/** Normaliza texto p/ comparação: maiúsculas, sem acentos, sem símbolos. */
export function normalizeText(s: string): string {
  return (s || '')
    .toUpperCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^A-Z0-9]/g, '');
}

/** Extrai o 1º token do nome do arquivo (remove extensão e CNPJ de 14 dígitos). */
function extractTipoToken(fileName: string): string {
  const base = fileName.replace(/\.[^.]+$/, '');          // tira extensão
  const semCnpj = base.replace(/\d{14}/g, '');            // tira CNPJ
  return (semCnpj.split(/[_\-\s]+/).map(t => t.trim()).filter(Boolean)[0] || '');
}

// ----------------------------------------------------------------------------
// LP1 — NA CHEGADA DO ARQUIVO: casa arquivo ↔ obrigação e cria delivery PENDENTE
// ----------------------------------------------------------------------------
export async function linkFileToObligation(
  prisma: any,
  ctx: { companyId: string; fileName: string; clientId: string; filaId: string },
) {
  try {
    const token = normalizeText(extractTipoToken(ctx.fileName));
    if (!token || token.length < 3) return null; // token inútil → sem vínculo

    const schedules = await prisma.obligationSchedule.findMany({
      where: { companyId: ctx.companyId, isActive: true },
      select: { id: true, name: true, mininome: true },
    });

    const match =
      schedules.find(s => s.mininome && normalizeText(s.mininome) === token) ||
      schedules.find(s => normalizeText(s.name).includes(token)) ||
      null;
    if (!match) return null;

    // Upsert respeitando @@unique([scheduleId, clientId]);
    // update vazio = NUNCA regride status já ENVIADO.
    const delivery = await prisma.obligationDelivery.upsert({
      where: { scheduleId_clientId: { scheduleId: match.id, clientId: ctx.clientId } },
      update: {},
      create: {
        scheduleId: match.id,
        clientId: ctx.clientId,
        companyId: ctx.companyId,
        status: 'PENDENTE',
      },
    });

    await prisma.arquivoFila.update({
      where: { id: ctx.filaId },
      data: { scheduleId: match.id, obligationDeliveryId: delivery.id },
    });

    return { scheduleId: match.id, scheduleName: match.name, deliveryId: delivery.id };
  } catch (e: any) {
    console.warn(`[OB-6] linkFileToObligation falhou (não bloqueante): ${e?.message}`);
    return null;
  }
}

// ----------------------------------------------------------------------------
// LP2 — APÓS O ENVIO: delivery → ENVIADO + sentAt; envio ganha o vínculo
// ----------------------------------------------------------------------------
export async function propagateSentByEnvioId(prisma: any, envioId: string) {
  try {
    const fila = await prisma.arquivoFila.findFirst({ where: { envioId } });
    if (!fila?.obligationDeliveryId) return null; // envio sem obrigação = ok

    const delivery = await prisma.obligationDelivery.update({
      where: { id: fila.obligationDeliveryId },
      data: { status: 'ENVIADO', sentAt: new Date(), lastEnvioId: envioId },
    });

    await prisma.emailEnvio
      .update({
        where: { id: envioId },
        data: { obligationDeliveryId: fila.obligationDeliveryId, scheduleId: fila.scheduleId },
      })
      .catch(() => null);

    return delivery;
  } catch (e: any) {
    console.warn(`[OB-6] propagateSent falhou (não bloqueante): ${e?.message}`);
    return null;
  }
}

// ----------------------------------------------------------------------------
// LP2b — TRACKING: webhook de open/download reflete na entrega da obrigação
//        (grava apenas a 1ª ocorrência para preservar a data real)
// ----------------------------------------------------------------------------
export async function markTrackingByEnvioId(
  prisma: any,
  envioId: string,
  kind: 'opened' | 'downloaded',
) {
  try {
    const envio = await prisma.emailEnvio.findUnique({
      where: { id: envioId },
      select: { obligationDeliveryId: true },
    });
    if (!envio?.obligationDeliveryId) return null;

    const field = kind === 'opened' ? 'openedAt' : 'downloadedAt';
    const delivery = await prisma.obligationDelivery.findUnique({
      where: { id: envio.obligationDeliveryId },
      select: { id: true, openedAt: true, downloadedAt: true },
    });
    if (!delivery || delivery[field]) return null; // já marcado → preserva 1ª data

    return prisma.obligationDelivery.update({
      where: { id: delivery.id },
      data: { [field]: new Date() },
    });
  } catch (e: any) {
    console.warn(`[OB-6] markTracking(${kind}) falhou (não bloqueante): ${e?.message}`);
    return null;
  }
}