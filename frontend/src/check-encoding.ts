// =================================================================
// 🧪 SCRIPT DE TESTE: Verifica e insere dados com UTF-8 correto
// LOCAL: backend/src/check-encoding.ts
// PROPÓSITO: Provar que o banco aceita caracteres especiais (ç, ã, é)
// =================================================================

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔄 Conectando ao banco de dados...');

  // 🔵 BLOCO 1: Texto com caracteres especiais que estavam quebrando
  const textoLimpo = "Olá! Este é um teste com caracteres especiais: ç, ã, é, õ, ü, ñ, â, ê, í, ó, ú";

  // 🟡 BLOCO 2: Gerar IDs únicos para cada teste (evita conflito)
  const timestamp = Date.now();
  const contatoIdUnico = `55119${timestamp}`;
  const documentoUnico = `123456789${timestamp.toString().slice(-3)}`;

  console.log(`📱 Criando contato teste: ${contatoIdUnico}`);
  console.log(`📄 Documento: ${documentoUnico}`);

  //  BLOCO 3: Cria um NOVO contato (sem upsert para evitar conflito)
  const contato = await prisma.memoriaContato.create({
    data: {
      contatoId: contatoIdUnico,
      telefone: contatoIdUnico,
      documento: documentoUnico,
    }
  });

  // 🟢 BLOCO 4: Cria uma nova interação com o texto limpo
  const interacao = await prisma.memoriaInteracao.create({
    data: {
      contatoId: contato.id,
      canal: 'WHATSAPP',
      tipo: 'mensagem',
      conteudo: textoLimpo,
    }
  });

  // 🟣 BLOCO 5: Confirmação de sucesso
  console.log('\n✅ SUCESSO! Registro salvo no banco.');
  console.log('📝 Texto salvo exatamente assim:', interacao.conteudo);
  console.log(`🔍 Agora busque por "${contatoIdUnico}" no frontend (/memoria)`);
  console.log('\n💡 Dica: O caractere especial deve aparecer corretamente, sem símbolos "♦"');
}

main()
  .catch((e) => {
    console.error('❌ Erro:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });