/**
 * 🧹 Reseta openedAt/downloadedAt de entregas específicas.
 * USO: npx ts-node scripts/reset-delivery-tracking.ts [scheduleId]
 *      (sem argumento = reseta TODAS as entregas da company de teste)
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const scheduleId = process.argv[2];

  const where = scheduleId
    ? { scheduleId }
    : { companyId: '814cddbb-4288-471a-9132-9cbee7e87c2e' }; // Conta Certa Demo

  const result = await prisma.obligationDelivery.updateMany({
    where,
    data: {
      openedAt: null,
      downloadedAt: null,
      sentAt: null,
      status: 'PENDENTE',
    },
  });

  console.log(`✅ ${result.count} entrega(s) resetada(s).`);
  console.log('   Abra um novo envio para ver as datas do zero.');
}

main()
  .catch((e) => console.error('💥', e.message))
  .finally(() => prisma.$disconnect());