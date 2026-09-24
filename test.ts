import { TaxAnalysisService } from './src/services/TaxAnalysisService';
import fs from 'fs';

async function test() {
  const service = new TaxAnalysisService();
  
  // Substitua pelos caminhos reais dos seus arquivos
  const dasBuffer = fs.readFileSync('./ilovepdf_merged (4).pdf');
  const simBuffer = fs.readFileSync('./Analise_Reforma_Tributaria_Concretize_2027_ATUALIZADA.pdf');

  try {
    const pdfResult = await service.generateReport(dasBuffer, simBuffer);
    fs.writeFileSync('./relatorio-teste.pdf', pdfResult);
    console.log('Relatório gerado com sucesso!');
  } catch (error) {
    console.error('Erro ao gerar relatório:', error);
  }
}

test();