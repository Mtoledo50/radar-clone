import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as xlsx from 'xlsx';
import * as fs from 'fs';

@Injectable()
export class ObligationsService {
  constructor(private prisma: PrismaService) {}

  // =========================================================================
  // 1. PROCESSAMENTO DO ARQUIVO EXCEL (IMPORTAÇÃO EM MASSA)
  // =========================================================================
  async processExcelImport(filePath: string, obligationName: string, companyId: string) {
    try {
      const workbook = xlsx.readFile(filePath);
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rawData = xlsx.utils.sheet_to_json(sheet, { header: 1, defval: "" }) as any[][];

      let headerRowIndex = -1;
      let cnpjColIndex = -1;
      let razaoColIndex = -1;
      let respColIndex = -1;

      // Encontra dinamicamente a linha de cabeçalho
      for (let i = 0; i < Math.min(rawData.length, 20); i++) {
        const row = rawData[i].map((cell: any) => String(cell).trim().toUpperCase());
        const cnpjIdx = row.findIndex((cell: string) => cell.includes('CNPJ'));
        
        if (cnpjIdx !== -1) {
          headerRowIndex = i;
          cnpjColIndex = cnpjIdx;
          razaoColIndex = row.findIndex((cell: string) => cell.includes('RAZÃO') || cell.includes('RAZAO'));
          respColIndex = row.findIndex((cell: string) => cell.includes('RESPONSÁVEL') || cell.includes('RESPONSAVEL'));
          break;
        }
      }

      if (headerRowIndex === -1) {
        throw new BadRequestException('Formato de Excel inválido. Coluna "CNPJ" não encontrada.');
      }

      const companiesToLink: string[] = [];
      let extractedResponsible = "Não informado";

      // Extrai os dados das linhas
      for (let i = headerRowIndex + 1; i < rawData.length; i++) {
        const row = rawData[i];
        if (!row || row.length === 0) continue;

        const cnpjRaw = String(row[cnpjColIndex] || "").trim();
        
        // Ignora linhas de rodapé como "Empresas listadas: 94"
        if (cnpjRaw.toUpperCase().includes('EMPRESAS LISTADAS') || cnpjRaw === "") {
          continue;
        }

        const cleanCnpj = cnpjRaw.replace(/\D/g, "");

        if (cleanCnpj.length === 14) {
          if (respColIndex !== -1 && row[respColIndex]) {
            extractedResponsible = String(row[respColIndex]).trim();
          }
          companiesToLink.push(cleanCnpj);
        }
      }

      // Busca os clientes existentes no banco de dados
      const clients = await this.prisma.client.findMany({
        where: { companyId, cnpj: { in: companiesToLink } },
        select: { id: true, cnpj: true, companyName: true },
      });

      const foundClientIds = clients.map(c => c.id);
      const foundCnpjs = clients.map(c => c.cnpj.replace(/\D/g, ""));
      const notFoundCnpjs = companiesToLink.filter(cnpj => !foundCnpjs.includes(cnpj));

      // Cria o registro da Obrigação (Schedule)
      const schedule = await this.prisma.obligationSchedule.create({
        data: {
          companyId,
          name: obligationName,
          responsibleUser: extractedResponsible,
        },
      });

      // Cria os vínculos (Deliveries) para os clientes encontrados
      if (foundClientIds.length > 0) {
        await this.prisma.obligationDelivery.createMany({
          data: foundClientIds.map(clientId => ({
            scheduleId: schedule.id,
            clientId,
            companyId,
            status: 'PENDENTE',
          })),
          skipDuplicates: true,
        });
      }

      // Limpa o arquivo temporário do disco
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }

      return {
        success: true,
        obligationName: schedule.name,
        totalRowsProcessed: companiesToLink.length,
        clientsLinked: foundClientIds.length,
        clientsNotFound: notFoundCnpjs.length,
        notFoundList: notFoundCnpjs,
        message: `Obrigação "${schedule.name}" criada. ${foundClientIds.length} empresas vinculadas.`
      };

    } catch (error) {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      throw error;
    }
  }

  // =========================================================================
  // 2. LISTAR TODAS AS OBRIGAÇÕES COM CLIENTES (JOIN MANUAL)
  // =========================================================================
  async findAllSchedules(companyId: string) {
    const schedules = await this.prisma.obligationSchedule.findMany({
      where: { companyId },
      include: { deliveries: { orderBy: { createdAt: 'asc' } } },
      orderBy: { createdAt: 'desc' },
    });

    const clientIds = [...new Set(schedules.flatMap(s => s.deliveries.map(d => d.clientId)))];
    
    const clients = await this.prisma.client.findMany({
      where: { id: { in: clientIds } },
      select: { id: true, companyName: true, cnpj: true },
    });

    const clientMap = new Map(clients.map(c => [c.id, c]));

    return schedules.map(schedule => ({
      ...schedule,
      deliveries: schedule.deliveries.map(delivery => ({
        ...delivery,
        client: clientMap.get(delivery.clientId) || null,
      })),
    }));
  }

  // =========================================================================
  // 3. LISTAR USUÁRIOS DISPONÍVEIS (PARA DROPDOWN DE RESPONSÁVEL)
  // =========================================================================
  async getAvailableUsers(companyId: string) {
    const users = await this.prisma.user.findMany({
      where: { companyId, deletedAt: null },
      select: { id: true, name: true, email: true, role: true },
      orderBy: { name: 'asc' },
    });

    const roleLabels: Record<string, string> = {
      SUPER_ADMIN: 'Super Admin',
      ADMIN: 'Administrador',
      MANAGER: 'Gerente',
      USER: 'Colaborador',
      CLIENTE: 'Cliente',
    };

    return users.map(user => ({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      roleLabel: roleLabels[user.role] || user.role,
      label: `${user.name} - ${roleLabels[user.role] || user.role}`,
    }));
  }

  // =========================================================================
  // 4. LISTAR OBRIGAÇÕES DE UM CLIENTE ESPECÍFICO
  // =========================================================================
  async getClientObligations(clientId: string, companyId: string) {
    const deliveries = await this.prisma.obligationDelivery.findMany({
      where: { clientId, companyId },
      include: {
        schedule: { select: { id: true, name: true, responsibleUser: true, isActive: true } },
      },
    });

    return deliveries.map(d => ({
      id: d.id,
      status: d.status,
      obs: d.obs,
      schedule: d.schedule,
    }));
  }

  // =========================================================================
  // 5. ADICIONAR CLIENTES A UMA OBRIGAÇÃO EXISTENTE
  // =========================================================================
  async addClientsToObligation(scheduleId: string, clientIds: string[], companyId: string) {
    const schedule = await this.prisma.obligationSchedule.findFirst({
      where: { id: scheduleId, companyId },
    });

    if (!schedule) {
      throw new BadRequestException('Obrigação não encontrada.');
    }

    await this.prisma.obligationDelivery.createMany({
      data: clientIds.map(clientId => ({
        scheduleId,
        clientId,
        companyId,
        status: 'PENDENTE',
      })),
      skipDuplicates: true,
    });

    return { success: true, message: 'Clientes vinculados com sucesso.' };
  }

  // =========================================================================
  // 6. ATUALIZAR DADOS DA OBRIGAÇÃO (NOME, RESPONSÁVEL, ETC.)
  // ✅ CORREÇÃO: Filtra dinamicamente os campos para evitar erros de schema
  // =========================================================================
  async updateSchedule(scheduleId: string, data: any, companyId: string) {
    const existingSchedule = await this.prisma.obligationSchedule.findFirst({
      where: { id: scheduleId, companyId },
    });

    if (!existingSchedule) {
      throw new BadRequestException('Obrigação não encontrada ou sem permissão.');
    }

    // 🛡️ FILTRO DE SEGURANÇA: Lista apenas os campos que existem no schema do Prisma.
    // Se você adicionou campos como 'mininome', 'departamento', 'deliveryDays' no schema.prisma,
    // basta adicioná-los a esta lista. Caso contrário, o Prisma os ignorá e não quebrará a aplicação.
    const allowedFields = [
      'name', 
      'responsibleUser', 
      'isActive',
      // Descomente as linhas abaixo APENAS se você rodou a migração do Prisma para adicioná-las:
      // 'mininome', 'departamento', 'estimatedTimeMinutes', 'deliveryDays', 
      // 'reminderDays', 'dayType', 'nonBusinessDayAction', 'saturdayIsBusinessDay',
      // 'competenceRef', 'requireBot', 'subjectToFine', 'alertGuide', 'defaultComment'
    ];

    const updateData: any = {};
    for (const key of allowedFields) {
      if (data[key] !== undefined) {
        updateData[key] = data[key];
      }
    }

    return this.prisma.obligationSchedule.update({
      where: { id: scheduleId },
      data: updateData,
    });
  }

  // =========================================================================
  // 7. DELETAR OBRIGAÇÃO INTEIRA (COM CASCADE MANUAL)
  // =========================================================================
  async deleteSchedule(scheduleId: string, companyId: string) {
    const schedule = await this.prisma.obligationSchedule.findFirst({
      where: { id: scheduleId, companyId },
      include: { deliveries: true },
    });

    if (!schedule) {
      throw new BadRequestException('Obrigação não encontrada.');
    }

    // Deleta os deliveries primeiro (garantia de cascade)
    if (schedule.deliveries.length > 0) {
      await this.prisma.obligationDelivery.deleteMany({ where: { scheduleId } });
    }

    // Deleta a obrigação
    await this.prisma.obligationSchedule.delete({ where: { id: scheduleId } });

    return { success: true, message: 'Obrigação excluída com sucesso.' };
  }

  // =========================================================================
  // 8. REMOVER EMPRESA ESPECÍFICA DA OBRIGAÇÃO
  // =========================================================================
  async removeClientFromSchedule(scheduleId: string, clientId: string, companyId: string) {
    const delivery = await this.prisma.obligationDelivery.findFirst({
      where: { scheduleId, clientId, schedule: { companyId } },
    });

    if (!delivery) {
      throw new BadRequestException('Vínculo não encontrado.');
    }

    await this.prisma.obligationDelivery.delete({ where: { id: delivery.id } });

    return { success: true, message: 'Empresa removida da obrigação.' };
  }

  // =========================================================================
  // 9. LISTAR TODOS OS CLIENTES COM SUAS OBRIGAÇÕES AGRUPADAS POR DEPARTAMENTO
  // =========================================================================
  async getClientsWithObligations(companyId: string) {
    const clients = await this.prisma.client.findMany({
      where: { companyId },
      select: { id: true, companyName: true, cnpj: true, taxRegime: true, status: true },
      orderBy: { companyName: 'asc' },
    });

    const clientsWithObligations = await Promise.all(
      clients.map(async (client) => {
        const deliveries = await this.prisma.obligationDelivery.findMany({
          where: { clientId: client.id },
          include: {
            schedule: { select: { id: true, name: true, responsibleUser: true, isActive: true } },
          },
        });

        const groupedByDepartment = deliveries.reduce((acc, delivery) => {
          const dept = delivery.schedule?.responsibleUser || 'Não definido';
          if (!acc[dept]) acc[dept] = [];
          
          acc[dept].push({
            id: delivery.id,
            name: delivery.schedule?.name || 'Sem nome',
            status: delivery.status,
            isActive: delivery.schedule?.isActive ?? false,
            scheduleId: delivery.schedule?.id || '',
          });
          return acc;
        }, {} as Record<string, any[]>);

        const departmentStats = Object.entries(groupedByDepartment).map(([dept, obligations]) => {
          const ok = obligations.filter((o: any) => o.status === 'ENVIADO').length;
          const problem = obligations.filter((o: any) => o.status === 'ATRASADO').length;
          const alert = obligations.filter((o: any) => o.status === 'PENDENTE').length;

          return {
            department: dept,
            total: obligations.length,
            ok,
            problem,
            alert,
            sent: ok,
            obligations,
          };
        });

        return { ...client, departments: departmentStats, totalObligations: deliveries.length };
      })
    );

    return clientsWithObligations;
  }

  // =========================================================================
  // 10. LISTAR OBRIGAÇÕES AGRUPADAS POR TIPO (NÃO POR CLIENTE)
  // =========================================================================
  async getByObligationType(companyId: string) {
    const schedules = await this.prisma.obligationSchedule.findMany({
      where: { companyId, isActive: true },
      include: { deliveries: true },
    });

    const clientIds = [...new Set(schedules.flatMap(s => s.deliveries.map(d => d.clientId)))];
    
    const clients = await this.prisma.client.findMany({
      where: { id: { in: clientIds } },
      select: { id: true, companyName: true, cnpj: true, taxRegime: true },
    });

    const clientMap = new Map(clients.map(c => [c.id, c]));

    const groupedByType = schedules.reduce((acc, schedule) => {
      const obligationName = schedule.name;
      
      if (!acc[obligationName]) {
        acc[obligationName] = {
          name: obligationName,
          totalClients: 0,
          green: 0,    // Entregues/Enviadas
          red: 0,      // Atrasadas
          orange: 0,   // Próximos 30 dias
          blue: 0,     // Futuras
          clients: [],
        };
      }

      schedule.deliveries.forEach(delivery => {
        const client = clientMap.get(delivery.clientId);
        if (!client) return;

        let color: 'green' | 'red' | 'orange' | 'blue' = 'green';
        if (delivery.status === 'ENVIADO') color = 'green';
        else if (delivery.status === 'ATRASADO') color = 'red';
        else if (delivery.status === 'PENDENTE') color = 'orange'; // Simplificação

        acc[obligationName][color]++;
        acc[obligationName].totalClients++;
        acc[obligationName].clients.push({
          id: client.id,
          companyName: client.companyName,
          cnpj: client.cnpj,
          taxRegime: client.taxRegime,
          status: delivery.status,
          deliveryId: delivery.id,
          scheduleId: schedule.id,
        });
      });

      return acc;
    }, {} as Record<string, any>);

    return Object.values(groupedByType).sort((a, b) => a.name.localeCompare(b.name));
  }
// ✅ CRIAR NOVA OBRIGAÇÃO
async createSchedule(data: any, companyId: string) {
  // Filtra apenas campos permitidos (mesma lógica do update)
  const allowedFields = [
    'name', 'mininome', 'departamento', 'responsibleUser', 
    'estimatedTimeMinutes', 'deliveryDays', 'reminderDays', 
    'dayType', 'nonBusinessDayAction', 'saturdayIsBusinessDay',
    'competenceRef', 'requireBot', 'subjectToFine', 
    'alertGuide', 'isActive', 'defaultComment'
  ];

  const createData: any = {};
  for (const key of allowedFields) {
    if (data[key] !== undefined) {
      createData[key] = data[key];
    }
  }

  // Adiciona campos obrigatórios
  createData.companyId = companyId;
  createData.isActive = data.isActive !== undefined ? data.isActive : true;

  return this.prisma.obligationSchedule.create({
    data: createData,
  });
}
// ✅ Buscar todas as obrigações de um cliente
async getClientObligations(clientId: string, companyId: string) {
  const deliveries = await this.prisma.obligationDelivery.findMany({
    where: { clientId, companyId },
    include: {
      schedule: {
        select: {
          id: true,
          name: true,
          responsibleUser: true,
          isActive: true,
          createdAt: true,
        },
      },
    },
    orderBy: {
      schedule: {
        name: 'asc',
      },
    },
  });

  return deliveries.map(delivery => ({
    id: delivery.id,
    status: delivery.status,
    obs: delivery.obs,
    schedule: delivery.schedule,
  }));
}
}