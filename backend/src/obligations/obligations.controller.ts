import { 
  Controller, 
  Get, 
  Post, 
  Patch,
  Delete,
  Param, 
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

    const result = await this.obligationsService.processExcelImport(
      file.path,
      obligationName,
      req.user.companyId
    );

    return result;
  }

  // =========================================================================
  // 2. LISTAGEM E CONSULTAS
  // =========================================================================

  // ✅ Lista todas as obrigações (lotes) com seus clientes vinculados
  @Get('schedules')
  async findAllSchedules(@Request() req) {
    return this.obligationsService.findAllSchedules(req.user.companyId);
  }

  // ✅ Lista usuários disponíveis para o dropdown de "Responsável"
  @Get('users')
  async getAvailableUsers(@Request() req) {
    return this.obligationsService.getAvailableUsers(req.user.companyId);
  }

  // ✅ Lista as obrigações de um cliente específico (para a aba "Por Cliente")
  @Get('client/:clientId')
  async getClientObligations(@Param('clientId') clientId: string, @Request() req) {
    return this.obligationsService.getClientObligations(clientId, req.user.companyId);
  }

  // ✅ Lista todos os clientes com suas obrigações agrupadas por departamento
  @Get('clients-with-obligations')
  async getClientsWithObligations(@Request() req) {
    return this.obligationsService.getClientsWithObligations(req.user.companyId);
  }

  // ✅ Lista obrigações agrupadas por tipo (DAS, Pró-labore, etc.) para a visão de indicadores
  @Get('by-obligation-type')
  async getByObligationType(@Request() req) {
    return this.obligationsService.getByObligationType(req.user.companyId);
  }

  // =========================================================================
  // 3. MANIPULAÇÃO (CREATE, UPDATE, DELETE)
  // =========================================================================

  // ✅ Adiciona um ou mais clientes a uma obrigação existente
  @Post(':scheduleId/clients')
  async addClientToObligation(
    @Param('scheduleId') scheduleId: string, 
    @Body() body: { clientIds: string[] }, 
    @Request() req
  ) {
    return this.obligationsService.addClientsToObligation(scheduleId, body.clientIds, req.user.companyId);
  }

  // ✅ Atualiza dados da obrigação (Nome, Responsável, Status, etc.)
  // ⚠️ NOTA: O tipo 'any' é intencional aqui. O 'ObligationsService.updateSchedule' 
  // possui um filtro de segurança interno que ignora campos que não existem no schema do Prisma,
  // evitando erros de compilação caso o frontend envie campos novos (ex: 'mininome') antes da migração do banco.
  @Patch('schedules/:scheduleId')
  async updateSchedule(
    @Param('scheduleId') scheduleId: string,
    @Body() body: any, 
    @Request() req
  ) {
    return this.obligationsService.updateSchedule(scheduleId, body, req.user.companyId);
  }

  // ✅ Deleta a obrigação inteira e todos os seus vínculos (Cascade manual)
  @Delete('schedules/:scheduleId')
  async deleteSchedule(@Param('scheduleId') scheduleId: string, @Request() req) {
    return this.obligationsService.deleteSchedule(scheduleId, req.user.companyId);
  }

  // ✅ Remove apenas uma empresa específica de uma obrigação, mantendo a obrigação ativa para as demais
  @Delete('schedules/:scheduleId/clients/:clientId')
  async removeClientFromSchedule(
    @Param('scheduleId') scheduleId: string,
    @Param('clientId') clientId: string,
    @Request() req
  ) {
    return this.obligationsService.removeClientFromSchedule(scheduleId, clientId, req.user.companyId);
  }
// ✅ CRIAR NOVA OBRIGAÇÃO
@Post('schedules')
async createSchedule(
  @Body() body: {
    name: string;
    mininome?: string;
    departamento?: string;
    responsibleUser?: string;
    estimatedTimeMinutes?: number;
    deliveryDays?: Record<string, string>;
    reminderDays?: number;
    dayType?: 'corridos' | 'uteis';
    nonBusinessDayAction?: 'antecipar' | 'postergar' | 'manter';
    saturdayIsBusinessDay?: boolean;
    competenceRef?: 'mes-atual' | 'mes-anterior' | 'mes-seguinte';
    requireBot?: boolean;
    subjectToFine?: boolean;
    alertGuide?: boolean;
    isActive?: boolean;
    defaultComment?: string;
  },
  @Request() req
) {
  return this.obligationsService.createSchedule(body, req.user.companyId);
}
// ✅ Buscar obrigações de um cliente específico
@Get('client/:clientId/obligations')
async getClientObligations(@Param('clientId') clientId: string, @Request() req) {
  return this.obligationsService.getClientObligations(clientId, req.user.companyId);
}
}