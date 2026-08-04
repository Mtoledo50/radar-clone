import { Controller, Post, UseInterceptors, UploadedFile, UseGuards, Request, Body } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AccountingImportService } from './import.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { diskStorage } from 'multer';
import { extname } from 'path';

@Controller('accounting/import')
@UseGuards(JwtAuthGuard)
export class AccountingImportController {
  constructor(private readonly importService: AccountingImportService) {}

  @Post('upload')
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
        const allowedExtensions = /csv|xlsx|xls|pdf/;
        const ext = extname(file.originalname).toLowerCase();
        if (allowedExtensions.test(ext)) {
          cb(null, true);
        } else {
          cb(new Error('Apenas arquivos CSV, Excel ou PDF são permitidos'), false);
        }
      },
    })
  )
  async uploadFile(@UploadedFile() file: Express.Multer.File, @Request() req) {
    try {
      // Chama o serviço para processar o arquivo
      const result = await this.importService.processFile(file.path, file.originalname, req.user.companyId);
      return { success: true, data: result };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  @Post('confirm')
  async confirmImport(@Request() req, @Body() body: any) {
    try {
      const result = await this.importService.saveEntries(body.entries, req.user.companyId);
      return { success: true, data: result };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }
}