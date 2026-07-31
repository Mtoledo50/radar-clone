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
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('employees')
@UseGuards(JwtAuthGuard)
export class EmployeeController {
  constructor(private employeeService: EmployeeService) {}

  /**
   * GET /employees - Lista todos os colaboradores
   */
  @Get()
  async findAll(@Request() req) {
    const employees = await this.employeeService.findAll(req.user.id);
    return { data: employees };
  }

  /**
   * GET /employees/metrics - Retorna métricas de turnover
   */
  @Get('metrics')
  async getMetrics(@Request() req) {
    const metrics = await this.employeeService.getMetrics(req.user.id);
    return { data: metrics };
  }

  /**
   * POST /employees - Cria novo colaborador
   */
  @Post()
  async create(@Request() req, @Body() dto: CreateEmployeeDto) {
    const employee = await this.employeeService.create(req.user.id, dto);
    return { message: 'Colaborador criado com sucesso!', data: employee };
  }

  /**
   * PUT /employees/:id - Atualiza colaborador
   */
  @Put(':id')
  async update(
    @Request() req,
    @Param('id') id: string,
    @Body() dto: CreateEmployeeDto,
  ) {
    const employee = await this.employeeService.update(req.user.id, id, dto);
    return { message: 'Colaborador atualizado!', data: employee };
  }

  /**
   * DELETE /employees/:id - Remove colaborador
   */
  @Delete(':id')
  async remove(@Request() req, @Param('id') id: string) {
    await this.employeeService.remove(req.user.id, id);
    return { message: 'Colaborador removido!' };
  }
}