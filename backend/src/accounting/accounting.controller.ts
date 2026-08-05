// =================================================================
// INÍCIO: accounting.controller.ts
// =================================================================
/**
 * AccountingController
 * Gerencia os endpoints REST para contas contábeis, lançamentos 
 * e exportação de arquivos para o sistema SCI.
 */
import { 
  Controller, 
  Get, 
  Post, 
  Put, 
  Delete, 
  Body, 
  Param, 
  Query, // 🔥 Adicionado para suportar filtros de ano/mês na exportação
  UseGuards, 
  Request 
} from '@nestjs/common';
import { AccountingService } from './accounting.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('accounting')
@UseGuards(JwtAuthGuard)
export class AccountingController {
  constructor(private readonly service: AccountingService) {}

  // =================================================================
  // INÍCIO: ENDPOINTS DE CONTAS CONTÁBEIS (CRUD)
  // =================================================================

  /**
   * GET /accounting/accounts
   * Lista todas as contas contábeis (globais + específicas da empresa).
   */
  @Get('accounts')
  async getAccounts(@Request() req) {
    return { 
      success: true, 
      data: await this.service.getAccounts(req.user.companyId) 
    };
  }

  /**
   * POST /accounting/accounts
   * Cria uma nova conta contábil vinculada à empresa.
   */
  @Post('accounts')
  async createAccount(@Request() req, @Body() body: any) {
    return { 
      success: true, 
      data: await this.service.createAccount(req.user.companyId, body) 
    };
  }

  /**
   * PUT /accounting/accounts/:id
   * Atualiza os dados de uma conta contábil existente.
   */
  @Put('accounts/:id')
  async updateAccount(@Param('id') id: string, @Body() body: any) {
    return { 
      success: true, 
      data: await this.service.updateAccount(id, body) 
    };
  }

  /**
   * DELETE /accounting/accounts/:id
   * Realiza soft delete na conta contábil (marca como inativa).
   */
  @Delete('accounts/:id')
  async deleteAccount(@Param('id') id: string) {
    return { 
      success: true, 
      data: await this.service.deleteAccount(id) 
    };
  }
// =================================================================
// INÍCIO: Endpoint PUT /accounting/entries/:id/conciliate
// =================================================================
/**
 * Concilia um lançamento específico (atualiza apenas contas e status)
 * Não toca em entryDate nem outros campos
 */
@Put('entries/:id/conciliate')
async conciliateEntry(@Param('id') id: string, @Request() req, @Body() body: any) {
  try {
    const result = await this.service.conciliateEntry(id, req.user.companyId, body);
    return { success: true, data: result };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}
// =================================================================
// FIM: Endpoint PUT /accounting/entries/:id/conciliate
// =================================================================
  // =================================================================
  // FIM: ENDPOINTS DE CONTAS CONTÁBEIS (CRUD)
  // =================================================================


  // =================================================================
  // INÍCIO: ENDPOINTS DE LANÇAMENTOS CONTÁBEIS (CRUD)
  // =================================================================

  /**
   * GET /accounting/entries
   * Lista todos os lançamentos contábeis da empresa, incluindo nomes das contas.
   */
  @Get('entries')
  async getEntries(@Request() req) {
    return { 
      success: true, 
      data: await this.service.getEntries(req.user.companyId) 
    };
  }

  /**
   * POST /accounting/entries
   * Cria um novo lançamento contábil manualmente.
   */
  @Post('entries')
  async createEntry(@Request() req, @Body() body: any) {
    return { 
      success: true, 
      data: await this.service.createEntry(req.user.companyId, body) 
    };
  }

  /**
   * PUT /accounting/entries/:id
   * Atualiza um lançamento contábil existente (ex: durante a revisão manual).
   */
  @Put('entries/:id')
  async updateEntry(@Request() req, @Param('id') id: string, @Body() body: any) {
    return { 
      success: true, 
      data: await this.service.updateEntry(id, req.user.companyId, body) 
    };
  }

  /**
   * DELETE /accounting/entries/:id
   * Exclui permanentemente um lançamento contábil.
   */
  @Delete('entries/:id')
  async deleteEntry(@Request() req, @Param('id') id: string) {
    await this.service.deleteEntry(id, req.user.companyId);
    return { success: true };
  }

  // =================================================================
  // FIM: ENDPOINTS DE LANÇAMENTOS CONTÁBEIS (CRUD)
  // =================================================================


  // =================================================================
  // INÍCIO: ENDPOINT DE EXPORTAÇÃO PARA SCI
  // =================================================================

  /**
   * GET /accounting/export-sci
   * Gera o arquivo de texto formatado para importação no SCI.
   * Aceita query params opcionais: ?year=2025&month=1
   */
  @Get('export-sci')
  async exportToSCI(
    @Request() req,
    @Query('year') year?: string,
    @Query('month') month?: string
  ) {
    const content = await this.service.exportToSCI( // 🔥 Corrigido de this.accountingService para this.service
      req.user.companyId,
      year ? parseInt(year) : undefined,
      month ? parseInt(month) : undefined
    );

    return { 
      success: true, 
      content,
      message: 'Arquivo gerado com sucesso!' 
    };
  }

  // =================================================================
  // FIM: ENDPOINT DE EXPORTAÇÃO PARA SCI
  // =================================================================

}
// =================================================================
// FIM: accounting.controller.ts
// =================================================================