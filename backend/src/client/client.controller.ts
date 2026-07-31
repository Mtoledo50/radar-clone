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

  /**
   * GET /clients - Lista todos os clientes
   */
  @Get()
  async findAll(@Request() req) {
    const clients = await this.clientService.findAll(req.user.id);
    return { data: clients };
  }

  /**
   * GET /clients/metrics - Retorna métricas da carteira
   */
  @Get('metrics')
  async getMetrics(@Request() req) {
    const metrics = await this.clientService.getMetrics(req.user.id);
    return { data: metrics };
  }

  /**
   * POST /clients - Cria novo cliente
   */
  @Post()
  async create(@Request() req, @Body() dto: CreateClientDto) {
    const client = await this.clientService.create(req.user.id, dto);
    return { message: 'Cliente criado com sucesso!', data: client };
  }

  /**
   * PUT /clients/:id - Atualiza cliente
   */
  @Put(':id')
  async update(
    @Request() req,
    @Param('id') id: string,
    @Body() dto: CreateClientDto,
  ) {
    const client = await this.clientService.update(req.user.id, id, dto);
    return { message: 'Cliente atualizado!', data: client };
  }

  /**
   * DELETE /clients/:id - Remove cliente
   */
  @Delete(':id')
  async remove(@Request() req, @Param('id') id: string) {
    await this.clientService.remove(req.user.id, id);
    return { message: 'Cliente removido!' };
  }
}