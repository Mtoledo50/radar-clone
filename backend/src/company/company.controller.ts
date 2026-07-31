import { Controller, Get, Post, Body, UseGuards, Request } from '@nestjs/common';
import { CompanyService } from './company.service';
import { CreateCompanyProfileDto } from './dto/create-company-profile.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('company')
@UseGuards(JwtAuthGuard) // Protege todas as rotas deste controller
export class CompanyController {
  constructor(private companyService: CompanyService) {}

  /**
   * POST /company - Cria ou atualiza o perfil da empresa
   * Requer autenticação (JWT token no header)
   */
  @Post()
  async createOrUpdate(
    @Request() req,
    @Body() dto: CreateCompanyProfileDto,
  ) {
    // req.user contém os dados do usuário autenticado (id, email, name)
    const companyProfile = await this.companyService.createOrUpdate(
      req.user.id,
      dto,
    );

    return {
      message: 'Dados da empresa salvos com sucesso!',
      data: companyProfile,
    };
  }

  /**
   * GET /company - Busca o perfil da empresa do usuário autenticado
   */
  @Get()
  async findByUser(@Request() req) {
    const companyProfile = await this.companyService.findByUserId(req.user.id);

    return {
      data: companyProfile,
    };
  }
}