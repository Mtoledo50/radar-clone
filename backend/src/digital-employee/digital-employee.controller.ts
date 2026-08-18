// =================================================================
// INÍCIO: backend/src/digital-employee/digital-employee.controller.ts
// =================================================================
// DigitalEmployeeController — Endpoints REST da Aurora (Sprint FD-1).
// Todas as rotas exigem JWT (JwtAuthGuard) e são isoladas por
// companyId vindo do token (multi-tenant — ADR-004).
// =================================================================
import {
  Controller,
  Get,
  Patch,
  Post,
  Body,
  Param,
  Query,
  Request,
  Res,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { DigitalEmployeeService } from './digital-employee.service';
import {
  UpdateWorkerDto,
  UpdateSkillDto,
  ResolvePendingDto,
} from './digital-employee.dto';

@Controller('digital-employee')
@UseGuards(JwtAuthGuard) // 🔐 exige token válido em todas as rotas
export class DigitalEmployeeController {
  constructor(private readonly digitalEmployeeService: DigitalEmployeeService) {}

  // =================================================================
  // 🤖 WORKER
  // =================================================================

  /** GET /digital-employee — busca a Aurora (cria se não existir) */
  @Get()
  getWorker(@Request() req) {
    return this.digitalEmployeeService.getOrCreateWorker(req.user.companyId);
  }

  /** PATCH /digital-employee — pausar/retomar/renomear */
  @Patch()
  updateWorker(@Request() req, @Body() body: UpdateWorkerDto) {
    return this.digitalEmployeeService.updateWorker(req.user.companyId, body);
  }

  // =================================================================
  // 📊 DASHBOARD
  // =================================================================

  /** GET /digital-employee/dashboard — KPIs para o topo do painel */
  @Get('dashboard')
  getDashboard(@Request() req) {
    return this.digitalEmployeeService.getDashboard(req.user.companyId);
  }

  // =================================================================
  // 🧩 SKILLS
  // =================================================================

  /** GET /digital-employee/skills — lista as habilidades */
  @Get('skills')
  listSkills(@Request() req) {
    return this.digitalEmployeeService.listSkills(req.user.companyId);
  }

  /** PATCH /digital-employee/skills/:id — ligar/desligar + cron */
  @Patch('skills/:id')
  updateSkill(
    @Request() req,
    @Param('id') id: string,
    @Body() body: UpdateSkillDto,
  ) {
    return this.digitalEmployeeService.updateSkill(req.user.companyId, id, body);
  }

  // =================================================================
  // 📋 RUNS (histórico de execuções)
  // =================================================================

  /** GET /digital-employee/runs — últimas execuções */
  @Get('runs')
  listRuns(@Request() req, @Query('limit') limit?: string) {
    return this.digitalEmployeeService.listRuns(
      req.user.companyId,
      limit ? parseInt(limit, 10) : 20,
    );
  }

  // =================================================================
  // 🟡 PENDÊNCIAS (fila de revisão)
  // =================================================================

  /** GET /digital-employee/pending — pendências abertas */
  @Get('pending')
  listPending(@Request() req) {
    return this.digitalEmployeeService.listPending(req.user.companyId);
  }

  /** POST /digital-employee/pending/:id/resolve — aprovar/rejeitar */
  @Post('pending/:id/resolve')
  resolvePending(
    @Request() req,
    @Param('id') id: string,
    @Body() body: ResolvePendingDto,
  ) {
    return this.digitalEmployeeService.resolvePending(
      req.user.companyId,
      req.user.id,
      id,
      body.decision,
      body.notes,
    );
  }

  // =================================================================
  // 📝 AUDITORIA
  // =================================================================

  /** GET /digital-employee/audit — trilha de compliance */
  @Get('audit')
  listAudit(@Request() req, @Query('limit') limit?: string) {
    return this.digitalEmployeeService.listAudit(
      req.user.companyId,
      limit ? parseInt(limit, 10) : 50,
    );
  }  // =================================================================
  // ▶️ DISPARO MANUAL — Botão "Rodar agora"
  // =================================================================

  /**
   * POST /digital-employee/skills/:skillKey/run
   * Dispara uma skill manualmente (fora do cron).
   * Usado pelo botão "▶ Rodar agora" no painel e para testes em dev.
   */
  @Post('skills/:skillKey/run')
  async runSkillNow(
    @Request() req,
    @Param('skillKey') skillKey: string,
  ) {
    return this.digitalEmployeeService.runSkillNow(
      req.user.companyId,
      skillKey as any,
      req.user.id,
    );
  }
  // =================================================================
  // 📊 RELATÓRIOS MENSAIS (FD-2 final)
  // =================================================================

  /**
   * GET /digital-employee/reports
   * Lista todos os relatórios mensais do tenant (para a tabela da UI).
   * Suporta filtros: ?period=2026-07&clientId=xxx&status=READY
   */
  @Get('reports')
  async listReports(
    @Request() req,
    @Query('period') period?: string,
    @Query('clientId') clientId?: string,
    @Query('status') status?: string,
  ) {
    return this.digitalEmployeeService.listReports(
      req.user.companyId,
      period,
      clientId,
      status,
    );
  }

  /**
   * GET /digital-employee/reports/:id/download
   * Baixa o PDF do relatório (stream do arquivo físico).
   */
  @Get('reports/:id/download')
  async downloadReport(
    @Request() req,
    @Param('id') id: string,
    @Res() res,
  ) {
    return this.digitalEmployeeService.downloadReport(
      req.user.companyId,
      id,
      res,
    );
  }

  /**
   * POST /digital-employee/reports/generate
   * Gera o relatório de 1 cliente específico (botão "Gerar agora" da UI).
   */
  @Post('reports/generate')
  async generateReport(
    @Request() req,
    @Body() body: { clientId: string; year?: number; month?: number },
  ) {
    return this.digitalEmployeeService.generateReportForClient(
      req.user.companyId,
      req.user.id,
      body.clientId,
      body.year,
      body.month,
    );
  }
  // =================================================================
  // 📥 NFS-e (FD-3a)
  // =================================================================

  /**
   * POST /digital-employee/nfse/upload
   * Recebe o XML da NFS-e e salva na caixa de entrada da Aurora.
   * Body: { xml: string, clientId?: string }
   */
  @Post('nfse/upload')
  async uploadNfse(
    @Request() req,
    @Body() body: { xml: string; clientId?: string },
  ) {
    return this.digitalEmployeeService.saveNfseToInbox(
      req.user.companyId,
      body.xml,
      body.clientId,
    );
  }

  /**
   * GET /digital-employee/nfse
   * Lista as NFS-e importadas do tenant (para a aba da UI).
   */
  @Get('nfse')
  async listNfse(@Request() req, @Query('status') status?: string) {
    return this.digitalEmployeeService.listNfse(req.user.companyId, status);
  }
}
// =================================================================
// FIM: backend/src/digital-employee/digital-employee.controller.ts
// =================================================================