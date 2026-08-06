import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { QueryProjectDto } from './dto/query-project.dto';
import { ProjectStatus, TaskStatus } from '@prisma/client';

@Injectable()
export class ProjectsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(companyId: string, query: QueryProjectDto) {
    const where: any = {
      companyId,
      deletedAt: null,
    };

    if (query.status) where.status = query.status;
    if (query.priority) where.priority = query.priority;
    if (query.clientId) where.clientId = query.clientId;

    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const projects = await this.prisma.project.findMany({
      where,
      include: {
        client: { select: { id: true, companyName: true } },
        _count: { select: { tasks: { where: { deletedAt: null } } } },
        tasks: {
          where: { deletedAt: null },
          select: { id: true, status: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Calcular progresso de cada projeto
    return projects.map((project) => {
      const totalTasks = project.tasks.length;
      const completedTasks = project.tasks.filter(
        (t) => t.status === TaskStatus.DONE,
      ).length;
      const progress =
        totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

      return {
        id: project.id,
        name: project.name,
        description: project.description,
        status: project.status,
        priority: project.priority,
        color: project.color,
        startDate: project.startDate,
        dueDate: project.dueDate,
        completedAt: project.completedAt,
        createdAt: project.createdAt,
        updatedAt: project.updatedAt,
        client: project.client,
        totalTasks,
        completedTasks,
        progress,
      };
    });
  }

  async findOne(companyId: string, projectId: string) {
    const project = await this.prisma.project.findFirst({
      where: {
        id: projectId,
        companyId,
        deletedAt: null,
      },
      include: {
        client: { select: { id: true, companyName: true } },
        tasks: {
          where: { deletedAt: null },
          orderBy: [{ position: 'asc' }, { createdAt: 'desc' }],
          include: {
            assignee: { select: { id: true, name: true, email: true } },
          },
        },
      },
    });

    if (!project) {
      throw new NotFoundException('Projeto não encontrado');
    }

    return project;
  }

  async metrics(companyId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      total,
      active,
      onHold,
      completed,
      overdue,
      totalTasks,
      completedTasks,
    ] = await Promise.all([
      this.prisma.project.count({
        where: { companyId, deletedAt: null },
      }),
      this.prisma.project.count({
        where: {
          companyId,
          deletedAt: null,
          status: ProjectStatus.ACTIVE,
        },
      }),
      this.prisma.project.count({
        where: {
          companyId,
          deletedAt: null,
          status: ProjectStatus.ON_HOLD,
        },
      }),
      this.prisma.project.count({
        where: {
          companyId,
          deletedAt: null,
          status: ProjectStatus.COMPLETED,
        },
      }),
      this.prisma.project.count({
        where: {
          companyId,
          deletedAt: null,
          dueDate: { lt: today },
          status: { notIn: [ProjectStatus.COMPLETED, ProjectStatus.CANCELLED] },
        },
      }),
      this.prisma.task.count({
        where: {
          companyId,
          deletedAt: null,
          projectId: { not: null },
        },
      }),
      this.prisma.task.count({
        where: {
          companyId,
          deletedAt: null,
          projectId: { not: null },
          status: TaskStatus.DONE,
        },
      }),
    ]);

    return {
      total,
      active,
      onHold,
      completed,
      overdue,
      totalTasks,
      completedTasks,
      overallProgress:
        totalTasks > 0
          ? Math.round((completedTasks / totalTasks) * 100)
          : 0,
    };
  }

  async create(companyId: string, dto: CreateProjectDto) {
    // Validar cliente (se fornecido)
    if (dto.clientId) {
      const client = await this.prisma.client.findFirst({
        where: { id: dto.clientId, companyId, deletedAt: null },
      });
      if (!client) {
        throw new BadRequestException('Cliente não encontrado');
      }
    }

    return this.prisma.project.create({
      data: {
        companyId,
        name: dto.name,
        description: dto.description,
        status: dto.status ?? ProjectStatus.PLANNING,
        priority: dto.priority,
        clientId: dto.clientId,
        startDate: dto.startDate ? new Date(dto.startDate) : undefined,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
        color: dto.color,
      },
      include: {
        client: { select: { id: true, companyName: true } },
      },
    });
  }

  async update(
    companyId: string,
    projectId: string,
    dto: UpdateProjectDto,
  ) {
    const project = await this.prisma.project.findFirst({
      where: { id: projectId, companyId, deletedAt: null },
    });

    if (!project) {
      throw new NotFoundException('Projeto não encontrado');
    }

    // Validar cliente (se fornecido)
    if (dto.clientId) {
      const client = await this.prisma.client.findFirst({
        where: { id: dto.clientId, companyId, deletedAt: null },
      });
      if (!client) {
        throw new BadRequestException('Cliente não encontrado');
      }
    }

    const updateData: any = {
      name: dto.name,
      description: dto.description,
      status: dto.status,
      priority: dto.priority,
      clientId: dto.clientId,
      startDate: dto.startDate ? new Date(dto.startDate) : undefined,
      dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
      color: dto.color,
    };

    // Se status mudar para COMPLETED, preencher completedAt
    if (
      dto.status === ProjectStatus.COMPLETED &&
      project.status !== ProjectStatus.COMPLETED
    ) {
      updateData.completedAt = new Date();
    } else if (
      dto.status &&
      dto.status !== ProjectStatus.COMPLETED
    ) {
      updateData.completedAt = null;
    }

    return this.prisma.project.update({
      where: { id: projectId },
      data: updateData,
      include: {
        client: { select: { id: true, companyName: true } },
      },
    });
  }

  async remove(companyId: string, projectId: string) {
    const project = await this.prisma.project.findFirst({
      where: { id: projectId, companyId, deletedAt: null },
      include: {
        _count: {
          select: {
            tasks: {
              where: {
                deletedAt: null,
                status: { not: TaskStatus.DONE },
              },
            },
          },
        },
      },
    });

    if (!project) {
      throw new NotFoundException('Projeto não encontrado');
    }

    // Regra de negócio: não permitir excluir projeto com tarefas pendentes
    if (project._count.tasks > 0) {
      throw new BadRequestException(
        `Não é possível excluir este projeto. Existem ${project._count.tasks} tarefa(s) pendente(s) vinculada(s). Conclua, mova ou remova as tarefas antes de excluir o projeto.`,
      );
    }

    await this.prisma.project.update({
      where: { id: projectId },
      data: { deletedAt: new Date() },
    });

    return { message: 'Projeto removido com sucesso' };
  }
}