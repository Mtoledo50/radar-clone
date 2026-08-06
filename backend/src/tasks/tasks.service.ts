import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { QueryTaskDto } from './dto/query-task.dto';
import { TaskStatus } from '@prisma/client';

@Injectable()
export class TasksService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(companyId: string, query: QueryTaskDto) {
    const where: any = {
      companyId,
      deletedAt: null,
    };

    if (query.projectId) where.projectId = query.projectId;
    if (query.clientId) where.clientId = query.clientId;
    if (query.status) where.status = query.status;
    if (query.priority) where.priority = query.priority;
    if (query.category) where.category = query.category;
    if (query.assigneeId) where.assigneeId = query.assigneeId;

    if (query.search) {
      where.OR = [
        { title: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    return this.prisma.task.findMany({
      where,
      include: {
        project: { select: { id: true, name: true, color: true } },
        client: { select: { id: true, companyName: true } },
        assignee: { select: { id: true, name: true, email: true } },
      },
      orderBy: [
        { position: 'asc' },
        { createdAt: 'desc' },
      ],
    });
  }

  async findKanban(companyId: string, query: QueryTaskDto) {
    const tasks = await this.findAll(companyId, query);

    return {
      backlog: tasks.filter(t => t.status === TaskStatus.BACKLOG),
      todo: tasks.filter(t => t.status === TaskStatus.TODO),
      inProgress: tasks.filter(t => t.status === TaskStatus.IN_PROGRESS),
      review: tasks.filter(t => t.status === TaskStatus.REVIEW),
      blocked: tasks.filter(t => t.status === TaskStatus.BLOCKED),
      done: tasks.filter(t => t.status === TaskStatus.DONE),
    };
  }

  async metrics(companyId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const [overdue, dueToday, inProgress, blocked, completedLast7Days] = await Promise.all([
      this.prisma.task.count({
        where: {
          companyId,
          deletedAt: null,
          dueDate: { lt: today },
          status: { not: TaskStatus.DONE },
        },
      }),
      this.prisma.task.count({
        where: {
          companyId,
          deletedAt: null,
          dueDate: { gte: today, lt: tomorrow },
          status: { not: TaskStatus.DONE },
        },
      }),
      this.prisma.task.count({
        where: { companyId, deletedAt: null, status: TaskStatus.IN_PROGRESS },
      }),
      this.prisma.task.count({
        where: { companyId, deletedAt: null, status: TaskStatus.BLOCKED },
      }),
      this.prisma.task.count({
        where: {
          companyId,
          deletedAt: null,
          status: TaskStatus.DONE,
          completedAt: { gte: sevenDaysAgo },
        },
      }),
    ]);

    return { overdue, dueToday, inProgress, blocked, completedLast7Days };
  }

  async create(companyId: string, dto: CreateTaskDto) {
    return this.prisma.task.create({
      data: {
        companyId,
        title: dto.title,
        description: dto.description,
        status: dto.status ?? TaskStatus.TODO,
        priority: dto.priority,
        category: dto.category,
        projectId: dto.projectId,
        clientId: dto.clientId,
        assigneeId: dto.assigneeId,
        startDate: dto.startDate ? new Date(dto.startDate) : undefined,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
        estimatedHours: dto.estimatedHours,
        actualHours: dto.actualHours,
      },
      include: {
        project: { select: { id: true, name: true, color: true } },
        client: { select: { id: true, companyName: true } },
        assignee: { select: { id: true, name: true, email: true } },
      },
    });
  }

  async update(companyId: string, taskId: string, dto: UpdateTaskDto) {
    const task = await this.prisma.task.findFirst({
      where: { id: taskId, companyId, deletedAt: null },
    });

    if (!task) throw new NotFoundException('Tarefa não encontrada');

    const updateData: any = {
      title: dto.title,
      description: dto.description,
      status: dto.status,
      priority: dto.priority,
      category: dto.category,
      projectId: dto.projectId,
      clientId: dto.clientId,
      assigneeId: dto.assigneeId,
      startDate: dto.startDate ? new Date(dto.startDate) : undefined,
      dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
      estimatedHours: dto.estimatedHours,
      actualHours: dto.actualHours,
    };

    // Atualizar completedAt automaticamente
    if (dto.status === TaskStatus.DONE && task.status !== TaskStatus.DONE) {
      updateData.completedAt = new Date();
    } else if (dto.status && dto.status !== TaskStatus.DONE) {
      updateData.completedAt = null;
    }

    return this.prisma.task.update({
      where: { id: taskId },
      data: updateData,
      include: {
        project: { select: { id: true, name: true, color: true } },
        client: { select: { id: true, companyName: true } },
        assignee: { select: { id: true, name: true, email: true } },
      },
    });
  }

  async updateStatus(companyId: string, taskId: string, status: TaskStatus, position?: number) {
    const task = await this.prisma.task.findFirst({
      where: { id: taskId, companyId, deletedAt: null },
    });

    if (!task) throw new NotFoundException('Tarefa não encontrada');

    const updateData: any = { status };

    if (position !== undefined) {
      updateData.position = position;
    }

    if (status === TaskStatus.DONE && task.status !== TaskStatus.DONE) {
      updateData.completedAt = new Date();
    } else if (status !== TaskStatus.DONE) {
      updateData.completedAt = null;
    }

    return this.prisma.task.update({
      where: { id: taskId },
      data: updateData,
      include: {
        project: { select: { id: true, name: true, color: true } },
        client: { select: { id: true, companyName: true } },
        assignee: { select: { id: true, name: true, email: true } },
      },
    });
  }

  async remove(companyId: string, taskId: string) {
    const task = await this.prisma.task.findFirst({
      where: { id: taskId, companyId, deletedAt: null },
    });

    if (!task) throw new NotFoundException('Tarefa não encontrada');

    await this.prisma.task.update({
      where: { id: taskId },
      data: { deletedAt: new Date() },
    });

    return { message: 'Tarefa removida com sucesso' };
  }
}