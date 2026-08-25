// =================================================================
// INÍCIO: backend/src/accounting/import.controller.ts (v3)
// =================================================================
import {
  Controller, Get, Post, Put, Delete, Body, Param, Query,
  UseGuards, Request, UseInterceptors, UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ImportService } from './import.service';
import { SmartImportService } from './smart-import.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { diskStorage } from 'multer';
import { extname } from 'path';

@Controller('accounting/import')
@UseGuards(JwtAuthGuard)
export class ImportController {
  constructor(
    private readonly importService: ImportService,
    private readonly smartImport: SmartImportService,
  ) {}

  // 🆕 GET /accounting/import/overlap?clientId&start&end
  //    → "extrato 06/2026 já existe? quantos lançamentos? até que dia?"
  @Get('overlap')
  async overlap(
    @Request() req,
    @Query('clientId') clientId: string,
    @Query('start') start: string,
    @Query('end') end: string,
  ) {
    return { success: true, data: await this.smartImport.getOverlap(req.user.companyId, clientId, start, end) };
  }

  // 🆕 DELETE /accounting/import/extrato?clientId[&start&end]
  //    → 🗑 exclui lançamentos de extrato (faixa ou tudo do cliente)
  @Delete('extrato')
  async deleteExtrato(
    @Request() req,
    @Query('clientId') clientId: string,
    @Query('start') start?: string,
    @Query('end') end?: string,
  ) {
    return { success: true, data: await this.smartImport.deleteImportedStatement(req.user.companyId, clientId, start, end) };
  }

  // POST /accounting/import/parse-smart (v2, intacto)
  @Post('parse-smart')
  async parseSmart(@Request() req, @Body() body: any) {
    try {
      const data = await this.smartImport.parseSmart(req.user.companyId, body.clientId, body.content, body.bankCode);
      return { success: true, data };
    } catch (error: any) {
      return { success: false, message: error.message };
    }
  }

  // POST /accounting/import/save-smart  🆕 aceita mode: ONLY_NEW | REPLACE
  @Post('save-smart')
  async saveSmart(@Request() req, @Body() body: any) {
    try {
      const result = await this.smartImport.saveSmart(
        req.user.companyId, body.clientId, body.drafts || [], body.mode || 'ONLY_NEW',
      );
      const msg =
        result.deleted > 0
          ? `${result.deleted} antigo(s) removido(s) • ${result.created} criado(s) • ${result.skipped} ignorado(s).`
          : `${result.created} lançamento(s) criado(s) • ${result.skipped} ignorado(s)/duplicado(s).`;
      return { success: true, message: msg, data: result };
    } catch (error: any) {
      return { success: false, message: error.message };
    }
  }

  // (ANTIGO intacto) POST /accounting/import/parse — multipart
  @Post('parse')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads',
        filename: (req, file, cb) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          cb(null, `import-${uniqueSuffix}${extname(file.originalname)}`);
        },
      }),
      fileFilter: (req, file, cb) => {
        if (/csv|txt/.test(extname(file.originalname).toLowerCase())) cb(null, true);
        else cb(new Error('Apenas .csv ou .txt'), false);
      },
    }),
  )
  async parseStatement(@UploadedFile() file: Express.Multer.File, @Request() req) {
    if (!file) return { success: false, message: 'Nenhum arquivo enviado' };
    try {
      const result = await this.importService.parseBankStatement(file.path, file.originalname, req.user.companyId);
      return { success: true, data: result };
    } catch (error: any) {
      return { success: false, message: error.message };
    }
  }

  // (ANTIGO intacto) POST /accounting/import/save
  @Post('save')
  async saveStatement(@Request() req, @Body() body: any) {
    try {
      const result = await this.importService.saveImportedEntries(body.entries, req.user.companyId, req.user.id, body.clientId);
      return { success: true, message: `${result.length} lançamentos salvos com sucesso!`, data: result };
    } catch (error: any) {
      return { success: false, message: error.message };
    }
  }
}
// =================================================================
// FIM: backend/src/accounting/import.controller.ts (v3)
// =================================================================