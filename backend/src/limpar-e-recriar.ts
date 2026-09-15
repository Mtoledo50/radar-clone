// =================================================================
// 🧹 SCRIPT DE LIMPEZA: Apaga dados corrompidos e recria com UTF-8
// LOCAL: backend/src/limpar-e-recriar.ts
// =================================================================

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🧹 Limpando dados corrompidos...');

  // 1. Apaga todas as interações e contatos de teste
  await prisma.analiseConversa.deleteMany({});
  await prisma.memoriaInteracao.deleteMany({});
  await prisma.memoriaContato.deleteMany({});
  
  console.log('✅ Banco limpo!');

  // 2. Recria os contatos de teste com encoding UTF-8 correto
  const contatosTeste = [
    {
      contatoId: '5511999999999',
      telefone: '5511999999999',
      documento: '12345678900',
      instagramId: 'ig_user_98765',
    },
    {
      contatoId: '5511988888888',
      telefone: '5511988888888',
      documento: '98765432100',
    },
  ];

  for (const dados of contatosTeste) {
    const contato = await prisma.memoriaContato.create({ data: dados });
    console.log(`📱 Criado contato: ${contato.contatoId}`);

    // Cria mensagens de teste com caracteres especiais
    await prisma.memoriaInteracao.create({
      data: {
        contatoId: contato.id,
        canal: 'WHATSAPP',
        tipo: 'mensagem',
        conteudo: 'Olá! Preciso de ajuda com a nota fiscal do mês passado. Obrigado!',
      },
    });

    await prisma.memoriaInteracao.create({
      data: {
        contatoId: contato.id,
        canal: 'INSTAGRAM',
        tipo: 'mensagem',
        conteudo: 'Oi, vi que vocês atendem pelo Instagram também. Preciso daquele balanço que pedi ontem.',
      },
    });
  }

  console.log('\n✅ SUCESSO! Dados recriados com UTF-8 correto.');
  console.log(' Teste no frontend buscando por: 5511999999999');
}

main()
  .catch((e) => {
    console.error('❌ Erro:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });