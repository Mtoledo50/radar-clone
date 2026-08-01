import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class EmployeeService {
  constructor(private prisma: PrismaService) {}

  async findAll(companyId: string) {
    return this.prisma.employee.findMany({ 
      where: { companyId }, 
      orderBy: { name: 'asc' } 
    });
  }

  async getMetrics(companyId: string) {
    const active = await this.prisma.employee.count({ where: { companyId, status: 'ACTIVE' } });
    const total = await this.prisma.employee.count({ where: { companyId } });
    
    // Métricas básicas (pode ser expandido conforme necessidade)
    return { 
      totalActive: active, 
      totalEmployees: total, 
      admissionsThisMonth: 0, 
      turnoverRate: 0 
    };
  }

  async create(companyId: string, userId: string, data: any) {
    // 🔥 VALIDAÇÃO ROBUSTA DE DATAS
    const admissionDate = new Date(data.admissionDate);
    if (isNaN(admissionDate.getTime())) {
      throw new BadRequestException('Data de admissão inválida ou ausente. Use o formato AAAA-MM-DD.');
    }

    let dismissalDate = null;
    if (data.dismissalDate) {
      const dDate = new Date(data.dismissalDate);
      if (!isNaN(dDate.getTime())) {
        dismissalDate = dDate;
      }
    }

    return this.prisma.employee.create({
      data: {
        name: data.name,
        email: data.email || null,
        phone: data.phone || null,
        position: data.position,
        department: data.department || null,
        status: data.status || 'ACTIVE',
        companyId,
        userId,
        admissionDate,
        dismissalDate,
        salary: data.salary ? parseFloat(data.salary) : null,
      },
    });
  }

  async update(id: string, data: any) {
    const updateData: any = {};
    
    if (data.name) updateData.name = data.name;
    if (data.email !== undefined) updateData.email = data.email;
    if (data.phone !== undefined) updateData.phone = data.phone;
    if (data.position) updateData.position = data.position;
    if (data.department !== undefined) updateData.department = data.department;
    if (data.status) updateData.status = data.status;
    if (data.salary !== undefined) updateData.salary = data.salary ? parseFloat(data.salary) : null;
    
    if (data.admissionDate) {
      const aDate = new Date(data.admissionDate);
      if (!isNaN(aDate.getTime())) updateData.admissionDate = aDate;
    }
    
    if (data.dismissalDate !== undefined) {
      if (data.dismissalDate) {
        const dDate = new Date(data.dismissalDate);
        if (!isNaN(dDate.getTime())) updateData.dismissalDate = dDate;
      } else {
        updateData.dismissalDate = null;
      }
    }

    return this.prisma.employee.update({
      where: { id },
      data: updateData,
    });
  }

  async delete(id: string) {
    return this.prisma.employee.delete({ where: { id } });
  }
}