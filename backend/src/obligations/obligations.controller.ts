import { 
  Controller, 
  Get, 
  Post, 
  Patch,
  Delete,
  Param, 
  Query, 
  Body, 
  UseInterceptors, 
  UploadedFile, 
  UseGuards, 
  Request, 
  BadRequestException 
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { ObligationsService } from './obligations.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('obligations')
@UseGuards(JwtAuthGuard) // 🔒 Protege todas as rotas deste controller com validação JWT
export class ObligationsController {
  constructor(private readonly obligationsService: ObligationsService) {}

  // =========================================================================
  // 1. IMPORTAÇÃO EM MASSA VIA EXCEL
  // =========================================================================
  
  @Post('import-excel')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads/temp',
        filename: (req, file, cb) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname);
          cb(null, `import-${uniqueSuffix}${ext}`);
        },
      }),
      fileFilter: (req, file, cb) => {
        const isExcel = file.mimetype.match(/\/(vnd\.openxmlformats-officedocument\.spreadsheetml\.sheet|vnd\.ms-excel)$/);
        if (isExcel) {
          cb(null, true);
        } else {
          cb(new BadRequestException('Apenas arquivos Excel (.xlsx, .xls) são permitidos.'), false);
        }
      },
    })
  )
  async importObligationExcel(@UploadedFile() file: Express.Multer.File, @Request() req) {
    if (!file) {
      throw new BadRequestException('Nenhum arquivo foi enviado.');
    }

    // Extrai o nome da obrigação a partir do nome do arquivo (sem a extensão)
    const obligationName = file.originalname.replace(/\.[^/.]+$/, "");

    return this.obligationsService.processExcelImport(
      file.path,
      obligationName,
      req.user.companyId
    );
  }

  // =========================================================================
  // 2. LISTAGEM E CONSULTAS
  // =========================================================================

  @Get('schedules')
  async findAllSchedules(@Request() req) {
    return this.obligationsService.findAllSchedules(req.user.companyId);
  }

  @Get('users')
  async getAvailableUsers(@Request() req) {
    return this.obligationsService.getAvailableUsers(req.user.companyId);
  }

  // ✅ ÚNICA IMPLEMENTAÇÃO: Lista as obrigações de um cliente específico (com detalhes completos)
  @Get('client/:clientId/obligations')
  async getClientObligations(@Param('clientId') clientId: string, @Request() req) {
    return this.obligationsService.getClientObligations(clientId, req.user.companyId);
  }

  @Get('clients-with-obligations')
  async getClientsWithObligations(@Request() req) {
    return this.obligationsService.getClientsWithObligations(req.user.companyId);
  }

  @Get('by-obligation-type')
  async getByObligationType(@Request() req) {
    return this.obligationsService.getByObligationType(req.user.companyId);
  }

  // =========================================================================
  // 3. MANIPULAÇÃO (CREATE, UPDATE, DELETE)
  // =========================================================================

  @Post('schedules')
  async createSchedule(@Body() body: any, @Request() req) {
    return this.obligationsService.createSchedule(body, req.user.companyId);
  }

  // ✅ 5. ADICIONAR CLIENTE(S) A UMA OBRIGAÇÃO
  // Rota principal usada pelo ClientProfileModal + alias legado p/ não quebrar chamadas antigas
  @Post('schedules/:scheduleId/clients')
  @Post(':scheduleId/clients')
  async addClientToObligation(
    @Param('scheduleId') scheduleId: string, 
    @Body() body: { clientIds: string[] }, 
    @Request() req
  ) {
    return this.obligationsService.addClientsToObligation(scheduleId, body.clientIds, req.user.companyId);
  }

  @Patch('schedules/:scheduleId')
  async updateSchedule(@Param('scheduleId') scheduleId: string, @Body() body: any, @Request() req) {
    return this.obligationsService.updateSchedule(scheduleId, body, req.user.companyId);
  }

  @Delete('schedules/:scheduleId')
  async deleteSchedule(@Param('scheduleId') scheduleId: string, @Request() req) {
    return this.obligationsService.deleteSchedule(scheduleId, req.user.companyId);
  }

  @Delete('schedules/:scheduleId/clients/:clientId')
  async removeClientFromSchedule(
    @Param('scheduleId') scheduleId: string,
    @Param('clientId') clientId: string,
    @Request() req
  ) {
    return this.obligationsService.removeClientFromSchedule(scheduleId, clientId, req.user.companyId);
  }
  // ✅ 12. VERIFICAÇÃO MANUAL DE CUMPRIMENTO (Sprint OB-4)
  // Dispara a checagem da pasta a qualquer momento; se vazia, alerta o Super Admin.
  @Post('schedules/:scheduleId/verify')
  async verifyFulfillment(@Param('scheduleId') scheduleId: string, @Request() req) {
    return this.obligationsService.verifyFulfillment(scheduleId, req.user.companyId);
  }
  // ✅ 13. LINHA DO TEMPO POR OBRIGAÇÃO (Sprint OB-7)
  // GET /obligations/schedules/:id/timeline?year=2026&month=10  (month 1-12)
  @Get('schedules/:scheduleId/timeline')
  async getTimeline(
    @Param('scheduleId') scheduleId: string,
    @Query('year') year: string,
    @Query('month') month: string,
    @Request() req,
  ) {
    const now = new Date();
    const y = Number(year) || now.getFullYear();
    const m = (Number(month) || now.getMonth() + 1) - 1; // converte 1-12 → 0-11
    return this.obligationsService.getScheduleTimeline(scheduleId, y, m, req.user.companyId);
  }
}