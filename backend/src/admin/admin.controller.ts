import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { OnboardClientDto } from './dto/onboard-client.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { UpdateUserRoleDto } from './dto/update-user-role.dto';

/**
 * Payload do usuário autenticado (tipado)
 */
interface UserPayload {
  id: string;
  companyId: string;
  email: string;
  role: string;
}

/**
 * =================================================================
 * 🛡️ AdminController — Painel Super Administrativo
 * =================================================================
 * Controller magro: apenas coordena HTTP e delega para AdminService.
 * 
 * Proteção:
 * - @UseGuards(JwtAuthGuard, RolesGuard): autenticação + autorização
 * - @Roles('ADMIN'): todos os endpoints exigem role ADMIN
 * 
 * Benefícios vs versão anterior:
 * - Zero `checkAdmin()` manuais (DRY)
 * - Autorização declarativa (impossível esquecer)
 * - Tipagem forte em todos os endpoints
 * =================================================================
 */
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  // =================================================================
  // 🏢 GESTÃO DE EMPRESAS
  // =================================================================

  @Get('companies')
  async getCompanies() {
    const data = await this.adminService.listCompanies();
    return { success: true, data };
  }

  @Put('companies/:id')
  async updateCompany(
    @Param('id') id: string,
    @Body() dto: UpdateCompanyDto,
  ) {
    const data = await this.adminService.updateCompany(id, dto);
    return { success: true, message: 'Empresa atualizada.', data };
  }

  @Delete('companies/:id')
  async deleteCompany(
    @Param('id') id: string,
    @CurrentUser() user: UserPayload,
  ) {
    await this.adminService.deleteCompany(id, user.id);
    return {
      success: true,
      message: 'Empresa e usuários desativados com sucesso.',
    };
  }

  // =================================================================
  // 👥 GESTÃO DE USUÁRIOS
  // =================================================================

  @Get('users')
  async getUsers() {
    const data = await this.adminService.listUsers();
    return { success: true, data };
  }

  @Put('users/:id/role')
  async updateUserRole(
    @Param('id') id: string,
    @Body() dto: UpdateUserRoleDto,
  ) {
    const data = await this.adminService.updateUserRole(id, dto);
    return { success: true, message: 'Role atualizada.', data };
  }

  @Delete('users/:id')
  async deleteUser(
    @Param('id') id: string,
    @CurrentUser() user: UserPayload,
  ) {
    await this.adminService.deleteUser(id, user.id);
    return { success: true, message: 'Usuário desativado.' };
  }

  // =================================================================
  // 🚀 ONBOARDING
  // =================================================================

  @Post('onboard')
  async onboardClient(@Body() dto: OnboardClientDto) {
    const data = await this.adminService.onboardClient(dto);
    return {
      success: true,
      message: 'Cliente onboardado com sucesso!',
      data,
    };
  }
  @Post('import-catalog')
@Roles('ADMIN')
async importCatalog(@CurrentUser() user: UserPayload) {
  await this.adminService.importFullCatalog(user.companyId);
  return { success: true, message: 'Catálogo importado com sucesso!' };
}
  // =================================================================
  // 📦 IMPORTAÇÃO DE CATÁLOGO
  // =================================================================
}