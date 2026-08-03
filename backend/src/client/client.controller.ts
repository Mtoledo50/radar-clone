// =================================================================
// INÍCIO: client.controller.ts
// =================================================================
/**
 * ClientController
 * Endpoints REST para gestão da carteira de clientes.
 */
import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ClientService } from './client.service';
import { CreateClientDto } from './dto/create-client.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('clients')
@UseGuards(JwtAuthGuard)
export class ClientController {
  constructor(private clientService: ClientService) {}

  // =================================================================
  // INÍCIO: Endpoint GET /clients/dashboard
  // =================================================================
  /**
   * Retorna as métricas da carteira de clientes (MRR, Churn, Total, etc.).
   */
  @Get('dashboard')
  async getDashboard(@Request() req) {
    const data = await this.clientService.getDashboard(req.user.companyId);
    return { success: true, data };
  }
  // =================================================================
  // FIM: Endpoint GET /clients/dashboard
  // =================================================================

  // =================================================================
  // INÍCIO: Endpoint GET /clients
  // =================================================================
  /**
   * Lista todos os clientes da empresa.
   */
  @Get()
  async findAll(@Request() req) {
    const clients = await this.clientService.findAll(req.user.companyId);
    return { success: true, data: clients };
  }
  // =================================================================
  // FIM: Endpoint GET /clients
  // =================================================================

  // =================================================================
  // INÍCIO: Endpoint POST /clients
  // =================================================================
  /**
   * Cria um novo cliente na carteira.
   */
  @Post()
  async create(@Request() req, @Body() dto: CreateClientDto) {
    const client = await this.clientService.create(
      req.user.companyId,
      req.user.id,
      dto,
    );
    return {
      success: true,
      message: 'Cliente criado com sucesso!',
      data: client,
    };
  }
  // =================================================================
  // FIM: Endpoint POST /clients
  // =================================================================

  // =================================================================
  // INÍCIO: Endpoint PUT /clients/:id
  // =================================================================
  /**
   * Atualiza os dados de um cliente existente.
   */
  @Put(':id')
  async update(@Param('id') id: string, @Body() dto: CreateClientDto) {
    const client = await this.clientService.update(id, dto);
    return { success: true, message: 'Cliente atualizado!', data: client };
  }
  // =================================================================
  // FIM: Endpoint PUT /clients/:id
  // =================================================================

  // =================================================================
  // INÍCIO: Endpoint DELETE /clients/:id
  // =================================================================
  /**
   * Remove um cliente da carteira.
   */
  @Delete(':id')
  async remove(@Param('id') id: string) {
    await this.clientService.delete(id);
    return { success: true, message: 'Cliente removido!' };
  }
  // =================================================================
  // FIM: Endpoint DELETE /clients/:id
  // =================================================================
}
// =================================================================
// FIM: client.controller.ts
// =================================================================