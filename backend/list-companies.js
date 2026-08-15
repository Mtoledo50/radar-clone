const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const companies = await prisma.company.findMany({
    take: 5,
    select: { id: true, name: true },
  });
  
  if (companies.length === 0) {
    console.log('Nenhuma company encontrada no banco.');
  } else {
    console.log('Companies encontradas:');
    console.log(JSON.stringify(companies, null, 2));
  }
  
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error('Erro:', e);
  process.exit(1);
});
