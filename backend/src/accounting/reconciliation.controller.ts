// =================================================================
// INÍCIO: reconciliation.controller.ts
// =================================================================
/**
 * 🎯 CONTROLLER DE CONCILIAÇÃO E REVISÃO CONTÁBIL
 * =================================================================
 * Endpoints para:
 * - Processar conciliação automática
 * - Salvar sugestões de conciliação
 * - Verificar e remover duplicidades de arquivos e lançamentos
 */

import { 
  Controller, Post, Get, UseInterceptors, UploadedFile, 
  UseGuards, Request, Body 
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ReconciliationService } from './reconciliation.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { diskStorage } from 'multer';
import { extname } from 'path';

@Controller('accounting/reconciliation')
@UseGuards(JwtAuthGuard)
export class ReconciliationController {
  constructor(private readonly reconciliationService: ReconciliationService) {}

  // =================================================================
  // INÍCIO: ENDPOINTS DE CONCILIAÇÃO AUTOMÁTICA (SEU CÓDIGO ORIGINAL)
  // =================================================================

  @Post('process')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads',
        filename: (req, file, cb) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
          const ext = extname(file.originalname);
          cb(null, `reconciliation-${uniqueSuffix}${ext}`);
        },
      }),
      fileFilter: (req, file, cb) => {
        const allowed = /csv/;
        const ext = extname(file.originalname).toLowerCase();
        if (allowed.test(ext)) {
          cb(null, true);
        } else {
          cb(new Error('Apenas arquivos CSV são permitidos'), false);
        }
      },
    })
  )
  async processReconciliation(@UploadedFile() file: Express.Multer.File, @Request() req) {
    if (!file) {
      return { success: false, message: 'Nenhum arquivo enviado' };
    }

    try {
      const result = await this.reconciliationService.reconcileEntries(file, req.user.companyId);
      return { success: true, data: result };
    } catch (error: any) {
      return { success: false, message: error.message };
    }
  }

  @Post('save')
  async saveSuggestions(@Request() req, @Body() body: any) {
    try {
      const result = await this.reconciliationService.saveReconciliationSuggestions(
        body.suggestions,
        req.user.companyId
      );
      return { 
        success: true, 
        data: result,
        message: `${result.length} lançamentos conciliados com sucesso!`
      };
    } catch (error: any) {
      return { success: false, message: error.message };
    }
  }

  // =================================================================
  // FIM: ENDPOINTS DE CONCILIAÇÃO AUTOMÁTICA
  // =================================================================


  // =================================================================
  // INÍCIO: NOVOS ENDPOINTS (DUPLICIDADE)
  // =================================================================

  /**
   * Verifica se o arquivo já foi importado.
   */
  @Post('check-duplicate')
  @UseInterceptors(FileInterceptor('file'))
  async checkFileDuplicate(@Request() req, @UploadedFile() file: Express.Multer.File) {
    if (!file) {
      return { success: false, message: 'Nenhum arquivo enviado' };
    }
    
    const result = await this.reconciliationService.checkFileDuplicate(
      req.user.companyId,
      file.originalname,
      file.buffer
    );
    
    return { success: true, data: result };
  }

  /**
   * Lista todos os lançamentos duplicados da empresa.
   */
  @Get('duplicates')
  async findDuplicateEntries(@Request() req) {
    const duplicates = await this.reconciliationService.findDuplicateEntries(req.user.companyId);
    
    return { 
      success: true, 
      data: duplicates,
      totalGroups: duplicates.length,
      totalDuplicates: duplicates.reduce((sum: number, g: any) => sum + (g.group - 1), 0)
    };
  }

  /**
   * Remove lançamentos duplicados, mantendo apenas o primeiro de cada grupo.
   */
  @Post('remove-duplicates')
  async removeDuplicateEntries(@Request() req, @Body() body: any) {
    const result = await this.reconciliationService.removeDuplicateEntries(body.duplicateGroups);
    
    return {
      success: true,
      message: `${result.deletedCount} lançamentos duplicados removidos com sucesso!`,
      data: result,
    };
  }

  // =================================================================
  // FIM: NOVOS ENDPOINTS (DUPLICIDADE)
  // =================================================================
}
// =================================================================
// FIM: reconciliation.controller.ts
// =================================================================