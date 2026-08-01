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

  @Get()
  async findAll(@Request() req) {
    const clients = await this.clientService.findAll(req.user.companyId);
    return { data: clients };
  }

  @Post()
  async create(@Request() req, @Body() dto: CreateClientDto) {
    const client = await this.clientService.create(req.user.companyId, req.user.id, dto);
    return { message: 'Cliente criado com sucesso!', data: client };
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() dto: CreateClientDto) {
    const client = await this.clientService.update(id, dto);
    return { message: 'Cliente atualizado!', data: client };
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    await this.clientService.delete(id);
    return { message: 'Cliente removido!' };
  }
}