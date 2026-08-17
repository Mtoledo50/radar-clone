const { PrismaClient, Prisma } = require('@prisma/client');
const p = new PrismaClient();

async function main() {
  // 1) Descobre todos os campos do modelo Client via DMMF
  const clientModel = Prisma.dmmf.datamodel.models.find(m => m.name === 'Client');
  if (!clientModel) {
    console.log('❌ Modelo Client não encontrado no schema');
    return;
  }

  console.log('=== CAMPOS DO MODELO Client ===');
  clientModel.fields.forEach(f => {
    console.log(`  ${f.name} (${f.type})${f.isRequired ? ' *' : ''}`);
  });

  // 2) Identifica qual campo é o "nome" (tenta vários candidatos comuns)
  const nameFields = ['companyName', 'name', 'tradeName', 'razaoSocial', 'fantasia', 'businessName'];
  const availableNameField = nameFields.find(f => 
    clientModel.fields.some(field => field.name === f && field.type === 'String')
  );

  if (!availableNameField) {
    console.log('\n❌ Nenhum campo de nome comum encontrado. Campos string disponíveis:');
    const stringFields = clientModel.fields.filter(f => f.type === 'String').map(f => f.name);
    console.log('  ', stringFields.join(', '));
    return;
  }

  console.log(`\n✅ Campo de nome identificado: ${availableNameField}`);

  // 3) Busca Academy/Renan usando o campo correto
  console.log('\n=== BUSCA POR ACADEMIA/RENAN ===');
  const clients = await p.client.findMany({
    where: {
      [availableNameField]: {
        contains: 'Academia',
        mode: 'insensitive',
      },
    },
  });

  const clients2 = await p.client.findMany({
    where: {
      [availableNameField]: {
        contains: 'Renan',
        mode: 'insensitive',
      },
    },
  });

  const allClients = [...clients, ...clients2];
  const unique = Array.from(new Map(allClients.map(c => [c.id, c])).values());

  if (unique.length === 0) {
    console.log('❌ Nenhum cliente com Academia/Renan encontrado');
    console.log('\n👉 Listando os 5 primeiros clientes:');
    const sample = await p.client.findMany({ take: 5 });
    sample.forEach(c => {
      const name = c[availableNameField] || '(sem nome)';
      console.log(`  - ${name} | companyId: ${c.companyId} | status: ${c.status}`);
    });
  } else {
    console.log(`✅ Encontrados ${unique.length} cliente(s):`);
    unique.forEach(c => {
      const name = c[availableNameField] || '(sem nome)';
      console.log(`  🏢 ${name}`);
      console.log(`     ID: ${c.id}`);
      console.log(`     companyId: ${c.companyId}`);
      console.log(`     status: ${c.status}`);
      console.log();
    });
  }

  // 4) Volume de trabalho pendente
  console.log('\n=== VOLUME DE TRABALHO PENDENTE ===');
  const firstClient = unique[0] || await p.client.findFirst();
  if (!firstClient) {
    console.log('❌ Nenhum cliente no banco');
    return;
  }

  const cid = firstClient.companyId;
  console.log(`Usando companyId: ${cid}`);

  const unclassified = await p.bankTransaction.count({ 
    where: { companyId: cid, nature: 'NAO_CLASSIFICADO' } 
  }).catch(() => 'n/d');

  const totalTx = await p.bankTransaction.count({ 
    where: { companyId: cid } 
  }).catch(() => 'n/d');

  const pendingReview = await p.automationPending.count({ 
    where: { companyId: cid, status: 'PENDING' } 
  }).catch(() => 'n/d');

  console.log(`Transações totais: ${totalTx}`);
  console.log(`Transações NAO_CLASSIFICADO: ${unclassified}`);
  console.log(`Pendências na fila 🟡: ${pendingReview}`);
}

main().finally(() => p.$disconnect());
