import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { TasksService } from './tasks.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { UpdateTaskStatusDto } from './dto/update-task-status.dto';
import { QueryTaskDto } from './dto/query-task.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
@UseGuards(JwtAuthGuard)
@Controller('tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Get()
  findAll(@Request() req, @Query() query: QueryTaskDto) {
    return this.tasksService.findAll(req.user.companyId, query);
  }

  @Get('kanban')
  kanban(@Request() req, @Query() query: QueryTaskDto) {
    return this.tasksService.findKanban(req.user.companyId, query);
  }

  @Get('metrics')
  metrics(@Request() req) {
    return this.tasksService.metrics(req.user.companyId);
  }

  @Post()
  create(@Request() req, @Body() dto: CreateTaskDto) {
    return this.tasksService.create(req.user.companyId, dto);
  }

  @Patch(':id')
  update(@Request() req, @Param('id') id: string, @Body() dto: UpdateTaskDto) {
    return this.tasksService.update(req.user.companyId, id, dto);
  }

  @Patch(':id/status')
  updateStatus(
    @Request() req,
    @Param('id') id: string,
    @Body() dto: UpdateTaskStatusDto,
  ) {
    return this.tasksService.updateStatus(req.user.companyId, id, dto.status, dto.position);
  }

  @Delete(':id')
  remove(@Request() req, @Param('id') id: string) {
    return this.tasksService.remove(req.user.companyId, id);
  }
}