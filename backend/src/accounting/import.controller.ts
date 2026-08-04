import { 
  Controller, Post, UseInterceptors, UploadedFiles, 
  UseGuards, Request, Body 
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { AccountingImportService } from './import.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { diskStorage } from 'multer';
import { extname } from 'path';

/**
 * =================================================================
 * 🎯 CONTROLLER DE IMPORTAÇÃO INTELIGENTE
 * =================================================================
 * 
 * ENDPOINTS:
 * - POST /accounting/import/process-with-matching
 *   Recebe 2 arquivos (Excel + CSV) e retorna lançamentos com sugestões
 * 
 * - POST /accounting/import/save-confirmed
 *   Salva os lançamentos confirmados pelo usuário
 */
@Controller('accounting/import')
@UseGuards(JwtAuthGuard)
export class AccountingImportController {
  constructor(private readonly importService: AccountingImportService) {}

  /**
   * =================================================================
   * 📤 PROCESSAR IMPORTAÇÃO COM MATCHING AUTOMÁTICO
   * =================================================================
   * 
   * Recebe 2 arquivos:
   * 1. cashControl - Excel com controle de caixa
   * 2. accountingHistory - CSV com lançamentos contábeis
   * 
   * Retorna lista de lançamentos com:
   * - Sugestões de contas de Débito e Crédito
   * - Status do match (VALOR_ENCONTRADO, DESCRICAO_ENCONTRADA, NAO_VINCULADO)
   */
  @Post('process-with-matching')
  @UseInterceptors(
    FilesInterceptor('files', 2, {
      storage: diskStorage({
        destination: './uploads',
        filename: (req, file, cb) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
          const ext = extname(file.originalname);
          cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
        },
      }),
      fileFilter: (req, file, cb) => {
        const allowedExtensions = /csv|xlsx|xls/;
        const ext = extname(file.originalname).toLowerCase();
        if (allowedExtensions.test(ext)) {
          cb(null, true);
        } else {
          cb(new Error('Apenas arquivos CSV e Excel são permitidos'), false);
        }
      },
    })
  )
  async processWithMatching(
    @UploadedFiles() files: Express.Multer.File[],
    @Request() req
  ) {
    if (!files || files.length !== 2) {
      return { 
        success: false, 
        message: 'Envie exatamente 2 arquivos: Excel (controle de caixa) e CSV (lançamentos contábeis)' 
      };
    }
    
    // Identificar qual arquivo é qual
    const cashControlFile = files.find(f => 
      f.originalname.toLowerCase().includes('controle') || 
      f.originalname.toLowerCase().includes('caixa') ||
      f.originalname.endsWith('.xlsx')
    );
    
    const accountingFile = files.find(f => 
      f.originalname.toLowerCase().includes('consulta') || 
      f.originalname.toLowerCase().includes('contabil') ||
      f.originalname.endsWith('.csv')
    );
    
    if (!cashControlFile || !accountingFile) {
      return { 
        success: false, 
        message: 'Não foi possível identificar os arquivos. Certifique-se de enviar um Excel (controle) e um CSV (contábil).' 
      };
    }
    
    try {
      const result = await this.importService.processCashControlWithMatching(
        cashControlFile,
        accountingFile,
        req.user.companyId
      );
      
      return { success: true, data: result };
    } catch (error: any) {
      return { success: false, message: error.message };
    }
  }

  /**
   * =================================================================
   * 💾 SALVAR LANÇAMENTOS CONFIRMADOS
   * =================================================================
   * 
   * Recebe lista de lançamentos com contas de Débito e Crédito definidas
   * e salva no banco de dados
   */
  @Post('save-confirmed')
  async saveConfirmed(@Request() req, @Body() body: any) {
    try {
      const result = await this.importService.saveConfirmedEntries(
        body.entries,
        req.user.companyId
      );
      
      return { 
        success: true, 
        data: result,
        message: `${result.length} lançamentos salvos com sucesso!`
      };
    } catch (error: any) {
      return { success: false, message: error.message };
    }
  }
}