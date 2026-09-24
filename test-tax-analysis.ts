import { TaxAnalysisService } from './backend/src/services/TaxAnalysisService';
import fs from 'fs';
import path from 'path';

async function runTest() {
  console.log('🚀 Iniciando teste de Análise Tributária...');

  // Caminhos ajustados para a pasta input-files
  const inputDir = path.join(__dirname, 'input-files');
  const dasPath = path.join(inputDir, 'ilovepdf_merged (4).pdf');
  const simPath = path.join(inputDir, 'Analise_Reforma_Tributaria_Concretize_2027_ATUALIZADA.pdf');

  if (!fs.existsSync(dasPath) || !fs.existsSync(simPath)) {
    console.error('❌ Arquivos de teste não encontrados na pasta input-files.');
    console.log(`Verifique se os arquivos estão em: ${inputDir}`);
    return;
  }

  try {
    const service = new TaxAnalysisService();
    const dasBuffer = fs.readFileSync(dasPath);
    const simBuffer = fs.readFileSync(simPath);

    console.log('\n📄 Extraindo dados do DAS...');
    const dasData = await service.extractDasData(dasBuffer);
    console.log('Valor Total DAS:', dasData.totalValue);

    console.log('\n📊 Extraindo dados do Simulador...');
    const simData = await service.extractSimulatorData(simBuffer);
    console.log('Valor Por Fora:', simData.scenarioOutside.totalFinal);

    console.log('\n🖨️ Gerando PDF final...');
    const pdfBuffer = await service.generateReport(dasBuffer, simBuffer);
    
    // O relatório gerado será salvo na raiz do projeto
    const outputPath = path.join(__dirname, 'relatorio-concretize-teste.pdf');
    fs.writeFileSync(outputPath, pdfBuffer);
    
    console.log(`\n✅ SUCESSO! Relatório gerado em: ${outputPath}`);

  } catch (error) {
    console.error('❌ Erro durante o teste:', error);
  }
}

runTest();