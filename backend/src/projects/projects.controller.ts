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
import { ProjectsService } from './projects.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { QueryProjectDto } from './dto/query-project.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';

@UseGuards(JwtAuthGuard)
@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Get()
  findAll(@Request() req, @Query() query: QueryProjectDto) {
    return this.projectsService.findAll(req.user.companyId, query);
  }

  @Get('metrics')
  metrics(@Request() req) {
    return this.projectsService.metrics(req.user.companyId);
  }

  @Get(':id')
  findOne(@Request() req, @Param('id') id: string) {
    return this.projectsService.findOne(req.user.companyId, id);
  }

  @Post()
  create(@Request() req, @Body() dto: CreateProjectDto) {
    return this.projectsService.create(req.user.companyId, dto);
  }

  @Patch(':id')
  update(
    @Request() req,
    @Param('id') id: string,
    @Body() dto: UpdateProjectDto,
  ) {
    return this.projectsService.update(req.user.companyId, id, dto);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  // @Roles('ADMIN', 'MANAGER')  ← Ajustar conforme decorator do seu RolesGuard
  remove(@Request() req, @Param('id') id: string) {
    return this.projectsService.remove(req.user.companyId, id);
  }
}