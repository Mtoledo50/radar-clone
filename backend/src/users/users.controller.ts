import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto, UpdateUserDto, ChangePasswordDto } from './dto/create-user.dto';
import { UpdateUserDetailsDto, UpdateEmployeeDto, UpdateUserPermissionsDto } from './dto/update-user-details.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // ✅ Helper: Normaliza o ID do usuário a partir do token JWT (sub, id ou userId)
  private getRequesterId(req: any): string {
    return req.user?.id ?? req.user?.sub ?? req.user?.userId;
  }

  // =========================================================================
  // 📋 LISTAGEM E PERFIL
  // =========================================================================

  @Get()
  findAll(@Request() req) {
    return this.usersService.findAll(req.user.companyId);
  }

  @Get('me')
  getMe(@Request() req) {
    return this.usersService.findById(this.getRequesterId(req));
  }

  // =========================================================================
  // 🔍 DETALHES COMPLETOS (User + Employee + Permissions)
  // =========================================================================

  @Get(':id/details')
  async getUserDetails(@Param('id') id: string, @Request() req) {
    return this.usersService.findUserWithDetails(id, req.user.companyId);
  }

  // =========================================================================
  // ✏️ ATUALIZAÇÕES ESPECÍFICAS (Granulares)
  // =========================================================================

  @Patch(':id/details')
  updateUserDetails(
    @Param('id') id: string, 
    @Body() dto: UpdateUserDetailsDto, 
    @Request() req
  ) {
    return this.usersService.updateUserDetails(id, req.user.companyId, dto);
  }

  @Patch(':id/employee')
  updateEmployee(
    @Param('id') id: string, 
    @Body() dto: UpdateEmployeeDto, 
    @Request() req
  ) {
    return this.usersService.updateEmployee(id, req.user.companyId, dto);
  }

  @Patch(':id/permissions')
  updatePermissions(
    @Param('id') id: string, 
    @Body() dto: UpdateUserPermissionsDto, 
    @Request() req
  ) {
    return this.usersService.updateUserPermissions(id, req.user.companyId, dto);
  }

  // =========================================================================
  // ⚙️ CRUD PADRÃO E SENHA
  // =========================================================================

  @Post()
  create(@Body() createUserDto: CreateUserDto, @Request() req) {
    return this.usersService.create(createUserDto, req.user.companyId, req.user.role);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto, @Request() req) {
    return this.usersService.update(id, req.user.companyId, updateUserDto);
  }

  @Patch('me/password')
  changeMyPassword(@Request() req, @Body() dto: ChangePasswordDto) {
    return this.usersService.changePassword(this.getRequesterId(req), dto);
  }

  @Post(':id/reset-password')
  resetPassword(@Param('id') id: string, @Request() req) {
    return this.usersService.resetPassword(id, req.user.companyId);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Request() req) {
    return this.usersService.remove(id, req.user.companyId, this.getRequesterId(req));
  }
}