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
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // ✅ CORREÇÃO: O JWT usa a claim `sub` como identificador (padrão JWT).
  // Normalizamos aqui para aceitar id / sub / userId sem quebrar nada.
  private getRequesterId(req: any): string {
    return req.user?.id ?? req.user?.sub ?? req.user?.userId;
  }

  @Get()
  findAll(@Request() req) {
    return this.usersService.findAll(req.user.companyId);
  }

  // 🆕 Perfil do usuário logado (usado pelo modal de troca forçada de senha)
  @Get('me')
  getMe(@Request() req) {
    return this.usersService.findById(this.getRequesterId(req));
  }

  @Post()
  create(@Body() createUserDto: CreateUserDto, @Request() req) {
    return this.usersService.create(createUserDto, req.user.companyId, req.user.role);
  }

  @Patch('me/password')
  changeMyPassword(@Request() req, @Body() dto: ChangePasswordDto) {
    return this.usersService.changePassword(this.getRequesterId(req), dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto, @Request() req) {
    return this.usersService.update(id, req.user.companyId, updateUserDto);
  }

  @Post(':id/reset-password')
  resetPassword(@Param('id') id: string, @Request() req) {
    return this.usersService.resetPassword(id, req.user.companyId);
  }

  // 🆕 Exclusão lógica de usuário
  @Delete(':id')
  remove(@Param('id') id: string, @Request() req) {
    return this.usersService.remove(id, req.user.companyId, this.getRequesterId(req));
  }
}