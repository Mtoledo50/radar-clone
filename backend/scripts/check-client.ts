/**
 * ============================================================================
 * 🔍 SCRIPT DE VERIFICAÇÃO: Cliente FERNANDA LOPES TOLEDO (CNPJ 08432644000160)
 * ============================================================================
 * USO: npx ts-node scripts/check-client.ts
 * OBJETIVO: Confirmar se a empresa de teste existe no banco e quais
 *           emails de contato estão cadastrados (necessário p/ envio).
 * ============================================================================
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const CNPJ_TESTE = '08432644000160';

  console.log(`🔍 Buscando cliente com CNPJ ${CNPJ_TESTE}...\n`);

  const client = await prisma.client.findFirst({
    where: { cnpj: CNPJ_TESTE },
    select: {
      id: true,
      companyName: true,
      cnpj: true,
      contactName: true,
      contactEmail: true,
      status: true,
      contacts: {
        select: { id: true, name: true, email: true, isPrimary: true },
      },
    },
  });

  if (!client) {
    console.log('❌ Cliente NÃO encontrado no banco!');
    console.log('   → Precisamos criá-lo antes do teste de envio.');
    return;
  }

  console.log('✅ Cliente encontrado:');
  console.log('   Nome:      ', client.companyName);
  console.log('   CNPJ:      ', client.cnpj);
  console.log('   Status:    ', client.status);
  console.log('   Contato:   ', client.contactName || '(vazio)');
  console.log('   Email:     ', client.contactEmail || '(vazio)');
  console.log('\n📇 Contatos vinculados (tabela ClientContact):');

  if (client.contacts.length === 0) {
    console.log('   ⚠️ Nenhum contato vinculado! O envio pode falhar.');
  } else {
    client.contacts.forEach((c) => {
      console.log(`   ${c.isPrimary ? '⭐' : '  '} ${c.name} — ${c.email || '(sem email)'}`);
    });
  }

  console.log('\n📋 ID do cliente (para referência):', client.id);
}

main()
  .catch((e) => {
    console.error('💥 Erro:', e.message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());