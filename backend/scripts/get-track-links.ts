/**
 * 🔗 Utilitário: imprime os links de tracking (pixel + download) de um envio.
 * USO: npx ts-node scripts/get-track-links.ts [envioId]
 *      (sem argumento = último envio criado)
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const envioId = process.argv[2];
  const envio = envioId
    ? await prisma.emailEnvio.findUnique({ where: { id: envioId } })
    : await prisma.emailEnvio.findFirst({ orderBy: { createdAt: 'desc' } });

  if (!envio) {
    console.log('❌ Nenhum envio encontrado.');
    return;
  }

  console.log(`\n📧 Envio: ${envio.id}`);
  console.log(`   Cliente: ${envio.clienteNome} → ${envio.emailDestinatario}`);
  console.log(`   Status:  ${envio.status}`);
  console.log(`\n👁️  ABRIR (pixel):    http://localhost:3001/track/open/${envio.id}`);
  console.log(`📥 DOWNLOAD (proxy):  http://localhost:3001/track/download/${envio.id}/${envio.tokenDownload}\n`);
}

main()
  .catch((e) => console.error('💥', e.message))
  .finally(() => prisma.$disconnect());