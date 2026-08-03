// =================================================================
// INÍCIO: company.controller.ts
// =================================================================
/**
 * CompanyController
 * Endpoints para gestão do perfil da empresa (Minha Empresa).
 */
import { Controller, Get, Post, Put, Body, Param, UseGuards, Request } from '@nestjs/common';
import { CompanyService } from './company.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('company')
export class CompanyController {
  constructor(private readonly service: CompanyService) {}

  /**
   * Busca os dados do perfil da empresa do usuário logado.
   */
  @UseGuards(JwtAuthGuard)
  @Get()
  async getProfile(@Request() req) {
    const data = await this.service.getProfile(req.user.id);
    return { success: true, data, message: 'Perfil carregado com sucesso' };
  }

  /**
   * Cria um novo perfil de empresa.
   */
  @UseGuards(JwtAuthGuard)
  @Post()
  async createProfile(@Request() req, @Body() body: any) {
    const data = await this.service.createProfile(req.user.id, body);
    return { success: true, data, message: 'Dados da empresa salvos com sucesso!' };
  }

  /**
   * Atualiza o perfil de empresa existente.
   * (O :id é recebido na URL para compatibilidade com o frontend, 
   * mas usamos o req.user.id para garantir a segurança dos dados).
   */
  @UseGuards(JwtAuthGuard)
  @Put(':id')
  async updateProfile(@Request() req, @Param('id') id: string, @Body() body: any) {
    const data = await this.service.updateProfile(req.user.id, body);
    return { success: true, data, message: 'Dados da empresa atualizados com sucesso!' };
  }
}
// =================================================================
// FIM: company.controller.ts
// =================================================================