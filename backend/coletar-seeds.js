const fs = require('fs');
const path = require('path');

const prismaDir = path.join(__dirname, 'prisma');
const outputFile = path.join(__dirname, 'seeds-para-analise.txt');

// Lê todos os arquivos .ts na pasta prisma, exceto schema.prisma
const files = fs.readdirSync(prismaDir).filter(file => 
  file.endsWith('.ts') && file !== 'schema.prisma'
);

let consolidatedOutput = "=======================================================\n";
consolidatedOutput += "DADOS DOS ARQUIVOS DE SEED PARA ANÁLISE DO ARQUITETO\n";
consolidatedOutput += "=======================================================\n\n";

if (files.length === 0) {
  console.log("Nenhum arquivo de seed (.ts) encontrado na pasta prisma.");
} else {
  files.forEach(file => {
    const filePath = path.join(prismaDir, file);
    const content = fs.readFileSync(filePath, 'utf8');
    
    consolidatedOutput += `📄 ARQUIVO: ${file}\n`;
    consolidatedOutput += `🔗 CAMINHO: ${filePath}\n`;
    consolidatedOutput += `-------------------------------------------------------\n`;
    consolidatedOutput += `${content}\n`;
    consolidatedOutput += `=======================================================\n\n`;
  });

  fs.writeFileSync(outputFile, consolidatedOutput, 'utf8');
  console.log(`✅ Sucesso! O arquivo foi gerado em: ${outputFile}`);
  console.log(`👉 Abra este arquivo, copie TODO o conteúdo e cole aqui no chat.`);
}