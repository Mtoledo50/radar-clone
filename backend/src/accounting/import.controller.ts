// =================================================================
// INÍCIO: backend/src/accounting/import.controller.ts
// =================================================================
/**
 * ImportController
 * Endpoints de importação de extratos:
 *   • /parse e /save ............ fluxo antigo (arquivo multer) — mantido
 *   • /parse-smart e /save-smart  🆕 ETAPA 2: extrato→rascunhos c/ sugestão
 *     (upload via TEXTO no body — elimina a classe de bug de boundary)
 */
import {
  Controller, Post, UseInterceptors, UploadedFile,
  UseGuards, Request, Body,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ImportService } from './import.service';
import { SmartImportService } from './smart-import.service'; // 🆕 ETAPA 2
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { diskStorage } from 'multer';
import { extname } from 'path';

@Controller('accounting/import')
@UseGuards(JwtAuthGuard)
export class ImportController {
  constructor(
    private readonly importService: ImportService,
    private readonly smartImport: SmartImportService, // 🆕 ETAPA 2
  ) {}

  // =================================================================
  // 🆕 ETAPA 2: POST /accounting/import/parse-smart
  // Body: { clientId, content }  ← content = texto do CSV lido no browser
  // Retorna: { drafts, stats, linhasIgnoradas }
  // =================================================================
  @Post('parse-smart')
  async parseSmart(@Request() req, @Body() body: any) {
    try {
        const data = await this.smartImport.parseSmart(
        req.user.companyId,
        body.clientId,
        body.content,
        body.bankCode, // 🆕 conta bancária p/ partida dobrada
      );
      return { success: true, data };
    } catch (error: any) {
      return { success: false, message: error.message };
    }
  }

  // =================================================================
  // 🆕 ETAPA 2: POST /accounting/import/save-smart
  // Body: { clientId, drafts }  ← drafts revisados no preview
  // Retorna: { created, skipped }
  // =================================================================
  @Post('save-smart')
  async saveSmart(@Request() req, @Body() body: any) {
    try {
      const result = await this.smartImport.saveSmart(
        req.user.companyId,
        body.clientId,
        body.drafts || [],
      );
      return {
        success: true,
        message: `${result.created} lançamento(s) criado(s) • ${result.skipped} ignorado(s)/duplicado(s).`,
        data: result,
      };
    } catch (error: any) {
      return { success: false, message: error.message };
    }
  }

  // =================================================================
  // (mantido) POST /accounting/import/parse — fluxo antigo multer
  // =================================================================
  @Post('parse')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads',
        filename: (req, file, cb) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname);
          cb(null, `import-${uniqueSuffix}${ext}`);
        },
      }),
      fileFilter: (req, file, cb) => {
        const allowed = /csv|txt/;
        const ext = extname(file.originalname).toLowerCase();
        if (allowed.test(ext)) cb(null, true);
        else cb(new Error('Apenas arquivos .csv ou .txt são permitidos'), false);
      },
    }),
  )
  async parseStatement(@UploadedFile() file: Express.Multer.File, @Request() req) {
    if (!file) return { success: false, message: 'Nenhum arquivo enviado' };
    try {
      const result = await this.importService.parseBankStatement(
        file.path,
        file.originalname,
        req.user.companyId,
      );
      return { success: true, data: result };
    } catch (error: any) {
      return { success: false, message: error.message };
    }
  }

  // =================================================================
  // (mantido) POST /accounting/import/save — fluxo antigo
  // =================================================================
  @Post('save')
  async saveStatement(@Request() req, @Body() body: any) {
    try {
      const result = await this.importService.saveImportedEntries(
        body.entries,
        req.user.companyId,
        req.user.id,
        body.clientId,
      );
      return {
        success: true,
        message: `${result.length} lançamentos salvos com sucesso!`,
        data: result,
      };
    } catch (error: any) {
      return { success: false, message: error.message };
    }
  }
}
// =================================================================
// FIM: backend/src/accounting/import.controller.ts
// =================================================================