// =================================================================
// 🌱 SEED: CONVERSAS DE TESTE PARA F13-F17 (FALE CONOSCO)
// Alinhado 100% com o schema.prisma (MemoriaContato, MemoriaInteracao, LockConversa)
// =================================================================

import { PrismaClient, Canal } from '@prisma/client';

const prisma = new PrismaClient();

// Dados do cliente de teste
const CLIENTE_TESTE = {
  contatoId: '5511999999999', // Identificador único de negócio (ex: telefone/CPF)
  nomeCliente: 'João Silva',
  telefone: '5511999999999',
  documento: '12345678900',
};

// Conversas simuladas (cada uma representa um "assunto" diferente)
const CONVERSAS = [
  {
    assunto: 'Dúvida sobre emissão de nota fiscal',
    mensagens: [
      { conteudo: 'Olá, preciso emitir uma nota fiscal de serviço mas não sei como fazer. Pode me ajudar?', remetente: 'cliente', minutosAtras: 120 },
      { conteudo: 'Olá João! Claro que posso ajudar. Você já tem os dados do tomador do serviço?', remetente: 'bot', minutosAtras: 118 },
      { conteudo: 'Tenho sim. É para a empresa XYZ Ltda, CNPJ 12.345.678/0001-90', remetente: 'cliente', minutosAtras: 115 },
      { conteudo: 'Perfeito! Você pode emitir pelo nosso portal ou eu posso gerar para você. Qual prefere?', remetente: 'bot', minutosAtras: 113 },
    ],
  },
  {
    assunto: 'Consulta sobre imposto de renda',
    mensagens: [
      { conteudo: 'Bom dia! Quando vence o imposto de renda esse ano?', remetente: 'cliente', minutosAtras: 2880 },
      { conteudo: 'Bom dia! A entrega do IRPF 2026 vai até 31 de maio. Você já começou a declarar?', remetente: 'bot', minutosAtras: 2875 },
      { conteudo: 'Ainda não. Preciso de ajuda para declarar?', remetente: 'cliente', minutosAtras: 2870 },
      { conteudo: 'Podemos agendar uma consulta. Qual o melhor horário para você?', remetente: 'bot', minutosAtras: 2865 },
    ],
  },
  {
    assunto: 'Abertura de empresa - MEI',
    mensagens: [
      { conteudo: 'Quero abrir um MEI. Quais documentos preciso?', remetente: 'cliente', minutosAtras: 10080 },
      { conteudo: 'Ótimo! Para abrir MEI você precisa de: 1. RG e CPF 2. Comprovante de residência 3. CNPJ do imóvel 4. Atividades que vai exercer. Já tem tudo isso?', remetente: 'bot', minutosAtras: 10075 },
      { conteudo: 'Tenho. Quanto tempo demora para ficar pronto?', remetente: 'cliente', minutosAtras: 10070 },
      { conteudo: 'Em média 5 dias úteis após protocolarmos. Quer que eu inicie o processo?', remetente: 'bot', minutosAtras: 10065 },
      { conteudo: 'Quero sim! Quando posso começar?', remetente: 'cliente', minutosAtras: 10060 },
    ],
  },
];

// =================================================================
// 🟢 FUNÇÃO PRINCIPAL DO SEED
// =================================================================
async function main() {
  console.log('🌱 Iniciando seed de conversas de teste...\n');

  // 1. Criar ou atualizar o contato
  console.log('👤 Criando contato de teste:', CLIENTE_TESTE.nomeCliente);
  const contato = await prisma.memoriaContato.upsert({
    where: { contatoId: CLIENTE_TESTE.contatoId }, // Busca pelo identificador único de negócio
    update: {
      telefone: CLIENTE_TESTE.telefone,
      documento: CLIENTE_TESTE.documento,
    },
    create: {
      contatoId: CLIENTE_TESTE.contatoId, // Identificador único de negócio
      telefone: CLIENTE_TESTE.telefone,
      documento: CLIENTE_TESTE.documento,
    },
  });

  console.log('✅ Contato criado/atualizado. ID interno (PK):', contato.id);

  // 2. Criar interações (conversas)
  console.log('\n💬 Criando interações...\n');
  
  let totalMensagens = 0;

  for (const conv of CONVERSAS) {
    console.log(`📝 Criando conversa: "${conv.assunto}"`);

    const agora = new Date();

    for (let i = 0; i < conv.mensagens.length; i++) {
      const msg = conv.mensagens[i];
      const timestamp = new Date(agora.getTime() - msg.minutosAtras * 60000);

      await prisma.memoriaInteracao.create({
        data: {
          // ✅ CORREÇÃO CRÍTICA: Usa o ID primário (UUID/CUID) do contato, não o campo contatoId de negócio
          contatoId: contato.id, 
          tipo: 'mensagem',
          conteudo: msg.conteudo,
          canal: Canal.WHATSAPP,
          metadata: {
            remetente: msg.remetente,
            assunto: i === 0 ? conv.assunto : undefined, // Salva o assunto apenas na primeira mensagem
            sequencia: i + 1,
          },
          criadoEm: timestamp,
        },
      });

      totalMensagens++;
    }

    console.log(`   ✅ ${conv.mensagens.length} mensagens criadas\n`);
  }

  // 3. Criar outros clientes de teste para a fila
  console.log('\n👥 Criando outros clientes de teste para a fila...\n');

  const OUTROS_CLIENTES = [
    { nome: 'Maria Santos', contatoId: '5511988888888', telefone: '5511988888888', documento: '98765432100', mensagem: 'Preciso de ajuda com o fechamento do mês', minutosAtras: 30 },
    { nome: 'Pedro Oliveira', contatoId: '5511977777777', telefone: '5511977777777', documento: '45678912300', mensagem: 'Como faço para cancelar uma nota fiscal?', minutosAtras: 45 },
    { nome: 'Ana Costa', contatoId: '5511966666666', telefone: '5511966666666', documento: '78945612300', mensagem: 'Quero saber sobre o DAS do meu MEI', minutosAtras: 60 },
  ];

  for (const cliente of OUTROS_CLIENTES) {
    console.log(`📇 Criando: ${cliente.nome}`);

    const novoContato = await prisma.memoriaContato.upsert({
      where: { contatoId: cliente.contatoId },
      update: {
        telefone: cliente.telefone,
        documento: cliente.documento,
      },
      create: {
        contatoId: cliente.contatoId,
        telefone: cliente.telefone,
        documento: cliente.documento,
      },
    });

    await prisma.memoriaInteracao.create({
      data: {
        contatoId: novoContato.id, // ✅ CORREÇÃO CRÍTICA: Usa o ID primário
        tipo: 'mensagem',
        conteudo: cliente.mensagem,
        canal: Canal.WHATSAPP,
        metadata: {
          remetente: 'cliente',
        },
        criadoEm: new Date(Date.now() - cliente.minutosAtras * 60000),
      },
    });

    console.log(`   ✅ Cliente criado\n`);
  }

  console.log('\n✅ SEED CONCLUÍDO COM SUCESSO!');
  console.log(`📊 Resumo:`);
  console.log(`   - 1 cliente principal (João Silva) com ${CONVERSAS.length} conversas`);
  console.log(`   - ${totalMensagens} mensagens no total para o cliente principal`);
  console.log(`   - ${OUTROS_CLIENTES.length} outros clientes na fila`);
  console.log('\n🎯 Agora você pode testar a Fila e o Histórico no Radar!\n');
}

// =================================================================
// 🟢 EXECUÇÃO
// =================================================================
main()
  .catch((e) => {
    console.error('❌ Erro no seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });