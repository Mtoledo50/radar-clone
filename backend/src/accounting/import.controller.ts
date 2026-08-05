// =================================================================
// INÍCIO: import.controller.ts
// =================================================================
import { 
  Controller, 
  Post, 
  UseInterceptors, 
  UploadedFile, 
  UseGuards, 
  Request, 
  Body 
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ImportService } from './import.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { diskStorage } from 'multer';
import { extname } from 'path';

@Controller('accounting/import')
@UseGuards(JwtAuthGuard)
export class ImportController {
  constructor(private readonly importService: ImportService) {}

  // =================================================================
  // INÍCIO: Endpoint POST /accounting/import/parse
  // =================================================================
  @Post('parse')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads',
        filename: (req, file, cb) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
          const ext = extname(file.originalname);
          cb(null, `import-${uniqueSuffix}${ext}`);
        },
      }),
      fileFilter: (req, file, cb) => {
        const allowed = /csv|txt/;
        const ext = extname(file.originalname).toLowerCase();
        if (allowed.test(ext)) {
          cb(null, true);
        } else {
          cb(new Error('Apenas arquivos .csv ou .txt são permitidos'), false);
        }
      },
    })
  )
  async parseStatement(@UploadedFile() file: Express.Multer.File, @Request() req) {
    if (!file) {
      return { success: false, message: 'Nenhum arquivo enviado' };
    }

    try {
      console.log(`\n Recebido arquivo para parse: ${file.originalname}`);
      const result = await this.importService.parseBankStatement(
        file.path, 
        file.originalname, 
        req.user.companyId
      );
      return { success: true, data: result };
    } catch (error: any) {
      console.error('❌ Erro no parse:', error);
      return { success: false, message: error.message };
    }
  }
  // =================================================================
  // FIM: Endpoint POST /accounting/import/parse
  // =================================================================

  // =================================================================
  // INÍCIO: Endpoint POST /accounting/import/save
  // =================================================================
  @Post('save')
  async saveStatement(@Request() req, @Body() body: any) {
    try {
      const result = await this.importService.saveImportedEntries(
        body.entries, 
        req.user.companyId, 
        req.user.id,
        body.clientId // 🔥 Passando o clientId do frontend
      );
      return { 
        success: true, 
        message: `${result.length} lançamentos salvos com sucesso!`, 
        data: result 
      };
    } catch (error: any) {
      return { success: false, message: error.message };
    }
  }
  // =================================================================
  // FIM: Endpoint POST /accounting/import/save
  // =================================================================
}
// =================================================================
// FIM: import.controller.ts
// =================================================================