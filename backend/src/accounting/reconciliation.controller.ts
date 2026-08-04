/**
 * =================================================================
 * 🎯 CONTROLLER DE CONCILIAÇÃO BANCÁRIA
 * =================================================================
 * 
 * ENDPOINTS:
 * - POST /accounting/reconcile
 *   Recebe 2 arquivos (Excel + CSV) via multipart/form-data
 *   Retorna JSON com lançamentos conciliados e sugestões de contas
 */

import { 
  Controller, 
  Post, 
  UseInterceptors, 
  UploadedFiles, 
  UseGuards, 
  Request 
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ReconciliationService } from './reconciliation.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { diskStorage } from 'multer';
import { extname } from 'path';

@Controller('accounting')
@UseGuards(JwtAuthGuard) // Protege a rota com autenticação JWT
export class ReconciliationController {
  constructor(private readonly reconciliationService: ReconciliationService) {}

  /**
   * =================================================================
   * 📤 ENDPOINT: PROCESSAR CONCILIAÇÃO
   * =================================================================
   * 
   * Recebe 2 arquivos via multipart/form-data:
   * - files[0]: Excel com controle de caixa
   * - files[1]: CSV com base contábil
   * 
   * Retorna: Lista de lançamentos conciliados com sugestões de contas
   */
  @Post('reconcile')
  @UseInterceptors(
    FilesInterceptor('files', 2, {
      // Configuração de armazenamento temporário em disco
      storage: diskStorage({
        destination: './uploads', // Pasta temporária (precisa existir!)
        filename: (req, file, cb) => {
          // Gerar nome único para evitar conflitos
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
          const ext = extname(file.originalname);
          cb(null, `reconcile-${uniqueSuffix}${ext}`);
        },
      }),
      // Filtro de tipos de arquivo aceitos
      fileFilter: (req, file, cb) => {
        const allowedExtensions = /csv|xlsx|xls/;
        const ext = extname(file.originalname).toLowerCase();
        
        if (allowedExtensions.test(ext)) {
          cb(null, true); // Aceita o arquivo
        } else {
          cb(new Error('Apenas arquivos CSV e Excel são permitidos'), false);
        }
      },
      // Limite de tamanho: 10MB por arquivo
      limits: {
        fileSize: 10 * 1024 * 1024,
      },
    })
  )
  async reconcile(
    @UploadedFiles() files: Express.Multer.File[],
    @Request() req
  ) {
    // Validação: precisa receber exatamente 2 arquivos
    if (!files || files.length !== 2) {
      return { 
        success: false, 
        message: 'Envie exatamente 2 arquivos: Excel (controle de caixa) e CSV (base contábil)' 
      };
    }
    
    // Identificar qual arquivo é qual baseado no nome ou extensão
    const cashControlFile = files.find(f => 
      f.originalname.toLowerCase().includes('controle') || 
      f.originalname.toLowerCase().includes('caixa') ||
      f.originalname.endsWith('.xlsx') ||
      f.originalname.endsWith('.xls')
    );
    
    const accountingFile = files.find(f => 
      f.originalname.toLowerCase().includes('consulta') || 
      f.originalname.toLowerCase().includes('contabil') ||
      f.originalname.toLowerCase().includes('contábil') ||
      f.originalname.endsWith('.csv')
    );
    
    // Validação: precisa identificar ambos os arquivos
    if (!cashControlFile || !accountingFile) {
      return { 
        success: false, 
        message: 'Não foi possível identificar os arquivos. Certifique-se de enviar um Excel (controle) e um CSV (contábil).' 
      };
    }
    
    try {
      // Chamar o service para processar a conciliação
      const result = await this.reconciliationService.processReconciliation(
        cashControlFile,
        accountingFile,
        req.user.companyId
      );
      
      return { 
        success: true, 
        data: result,
        message: `Conciliação processada com sucesso! ${result.length} lançamentos analisados.`
      };
    } catch (error: any) {
      return { 
        success: false, 
        message: error.message 
      };
    }
  }
}