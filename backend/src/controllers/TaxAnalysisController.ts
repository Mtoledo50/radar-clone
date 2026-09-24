import { Request, Response } from 'express';
import { TaxAnalysisService } from '../services/TaxAnalysisService';
import multer from 'multer';

// Configuração do Multer para receber arquivos em memória (Buffer)
const upload = multer({ storage: multer.memoryStorage() });

export class TaxAnalysisController {
  
  // Middleware para ser usado na rota
  public uploadFiles = upload.fields([
    { name: 'dasFile', maxCount: 1 },
    { name: 'simulatorFile', maxCount: 1 }
  ]);

  public async generateReport(req: Request, res: Response) {
    try {
      const dasFile = req.files?.['dasFile']?.[0];
      const simulatorFile = req.files?.['simulatorFile']?.[0];

      if (!dasFile || !simulatorFile) {
        return res.status(400).json({ error: 'É necessário enviar o PDF do DAS e do Simulador.' });
      }

      const service = new TaxAnalysisService();
      
      // Chama o serviço para extrair dados e gerar o PDF
      const pdfBuffer = await service.generateReport(dasFile.buffer, simulatorFile.buffer);

      // Configura os headers para download automático do PDF
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=analise-reforma-tributaria.pdf`);
      
      return res.send(pdfBuffer);

    } catch (error) {
      console.error('Erro na geração do relatório:', error);
      return res.status(500).json({ error: 'Falha ao processar os arquivos. Verifique se os PDFs estão corretos.' });
    }
  }
}