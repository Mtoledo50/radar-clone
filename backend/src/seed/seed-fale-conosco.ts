// =================================================================
// SEED: Popular banco com dados realistas para o Dashboard Fale Conosco
// Versão 3.0: Limpa dados existentes antes de popular (idempotente)
// =================================================================

import { PrismaClient, Canal } from '@prisma/client';

const prisma = new PrismaClient();

const tipos = [
  'duvida_simples',
  'pedido_documento',
  'abertura_empresa',
  'fechamento_mensal',
  'problema_tecnico',
  'so_informacao'
];

const canais = [Canal.WHATSAPP, Canal.INSTAGRAM, Canal.FACEBOOK];

const conteudos = {
  duvida_simples: ['Como emitir nota fiscal?', 'Qual o prazo para pagar o DAS?', 'Preciso de ajuda com o certificado digital', 'Como acessar o portal do cliente?'],
  pedido_documento: ['Preciso da certidão negativa de débitos', 'Pode me enviar o contrato social?', 'Preciso do balanço patrimonial atualizado', 'Me envie a guia do IRPF'],
  abertura_empresa: ['Quero abrir uma empresa de tecnologia', 'Como transformar MEI em ME?', 'Preciso abrir uma filial', 'Quero constituir uma LTDA'],
  fechamento_mensal: ['Preciso fechar o mês de agosto', 'Quando fica pronto o balancete?', 'Preciso dos lançamentos contábeis do mês', 'Como conciliar o extrato bancário?'],
  problema_tecnico: ['Não consigo acessar o sistema', 'O upload de extrato está dando erro', 'A integração com o banco parou', 'Não recebi o email de notificação'],
  so_informacao: ['Qual o horário de atendimento?', 'Vocês atendem empresa de comércio?', 'Qual o valor do plano básico?', 'Onde fica o escritório?']
};

async function main() {
  console.log(' Limpando dados existentes do Fale Conosco...');
  
  // Limpa na ordem correta (respeitando foreign keys)
  await prisma.analiseConversa.deleteMany({});
  await prisma.comunicacaoEvento.deleteMany({});
  await prisma.comunicacaoEnvio.deleteMany({});
  await prisma.memoriaInteracao.deleteMany({});
  await prisma.memoriaContato.deleteMany({});
  
  console.log('✅ Dados limpos. Iniciando seed...');

  const timestamp = Date.now(); // Garante unicidade absoluta

  for (let i = 0; i < 40; i++) {
    const tipo = tipos[i % tipos.length];
    const canal = canais[i % canais.length];
    
    // IDs únicos com timestamp
    const contatoIdString = `55119${timestamp}${i.toString().padStart(3, '0')}`;
    const documento = `${timestamp}${i.toString().padStart(5, '0')}`;
    const conteudo = conteudos[tipo][i % conteudos[tipo].length];
    
    // 1. Criar perfil do contato
    const contato = await prisma.memoriaContato.create({
      data: {
        contatoId: contatoIdString,
        documento: documento,
        ultimoAssunto: tipo.replace('_', ' '),
      }
    });

    // 2. Criar interação
    const interacao = await prisma.memoriaInteracao.create({
      data: {
        contatoId: contato.id,
        tipo: 'mensagem',
        conteudo,
        metadata: { canal, numero: i + 1 }
      }
    });

    // 3. Classificar a interação
    const complexidade = (i % 5) + 1;
    const tempoGasto = tipo === 'abertura_empresa' ? 45 :
                       tipo === 'fechamento_mensal' ? 30 :
                       tipo === 'pedido_documento' ? 12 : 4;

    await prisma.analiseConversa.create({
      data: {
        interacaoId: interacao.id,
        tipo,
        complexidade,
        tempoGastoMin: tempoGasto,
        status: 'classificado',
        observacao: `Classificação automática - seed ${i + 1}`
      }
    });

    // 4. Criar envio de tracking
    await prisma.comunicacaoEnvio.create({
      data: {
        protocolo: `PROTO-${timestamp}-${i + 1}`,
        canal: canal, // <-- Agora está perfeito, pois 'canal' já vem do Enum
        contatoId: contatoIdString,
        conteudo,
        status: i % 2 === 0 ? 'visualizado' : 'respondido'
      }
    });

    if ((i + 1) % 10 === 0) {
      console.log(`✅ ${i + 1}/40 interações criadas`);
    }
  }

  console.log('🎉 Seed concluído! 40 interações, 40 classificações e 40 envios criados.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });