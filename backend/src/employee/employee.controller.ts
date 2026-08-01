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
import { EmployeeService } from './employee.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('employees')
@UseGuards(JwtAuthGuard)
export class EmployeeController {
  constructor(private employeeService: EmployeeService) {}

  @Get()
  async findAll(@Request() req) {
    const employees = await this.employeeService.findAll(req.user.companyId);
    return { data: employees };
  }

  @Get('metrics')
  async getMetrics(@Request() req) {
    const metrics = await this.employeeService.getMetrics(req.user.companyId);
    return { data: metrics };
  }

  @Post()
  async create(@Request() req, @Body() dto: any) {
    const employee = await this.employeeService.create(req.user.companyId, req.user.id, dto);
    return { message: 'Colaborador criado com sucesso!', data: employee };
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() dto: any) {
    const employee = await this.employeeService.update(id, dto);
    return { message: 'Colaborador atualizado!', data: employee };
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    await this.employeeService.delete(id);
    return { message: 'Colaborador removido!' };
  }
}