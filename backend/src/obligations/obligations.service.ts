import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as xlsx from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';
import { getDueDate, competenceLabel, dueStatus, fmtDate } from './due-date.util';
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

      // Encontra dinamicamente a linha de cabeçalho
      for (let i = 0; i < Math.min(rawData.length, 20); i++) {
        const row = rawData[i].map((cell: any) => String(cell).trim().toUpperCase());
        const cnpjIdx = row.findIndex((cell: string) => cell.includes('CNPJ'));
        
        if (cnpjIdx !== -1) {
          headerRowIndex = i;
          cnpjColIndex = cnpjIdx;
          break;
        }
      }

      if (headerRowIndex === -1) {
        throw new BadRequestException('Formato de Excel inválido. Coluna "CNPJ" não encontrada.');
      }

      const companiesToLink: string[] = [];
      let extractedResponsible = "Não informado";
      const respColIndex = rawData[headerRowIndex].findIndex((cell: any) => String(cell).toUpperCase().includes('RESPONS'));

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
  // 4. LISTAR OBRIGAÇÕES DE UM CLIENTE ESPECÍFICO (ÚNICA IMPLEMENTAÇÃO)
  // =========================================================================
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
        schedule: { name: 'asc' },
      },
    });

    return deliveries.map(delivery => ({
      id: delivery.id,
      status: delivery.status,
      obs: delivery.obs,
      schedule: delivery.schedule,
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
  // 6. CRIAR NOVA OBRIGAÇÃO
  // =========================================================================
  async createSchedule(data: any, companyId: string) {
    // 🛡️ FILTRO DE SEGURANÇA: Lista apenas os campos permitidos no schema.
    const allowedFields = [
      'name', 'mininome', 'departamento', 'responsibleUser', 
      'estimatedTimeMinutes', 'deliveryDays', 'reminderDays', 
      'dayType', 'nonBusinessDayAction', 'saturdayIsBusinessDay',
      'competenceRef', 'requireBot', 'subjectToFine', 
      'alertGuide', 'isActive', 'defaultComment',
      'folderPath', 'fileNamePattern', 'postProcessAction' // ✅ Campos do Watch Folder
    ];

    const createData: any = {};
    for (const key of allowedFields) {
      if (data[key] !== undefined) {
        createData[key] = data[key];
      }
    }

    createData.companyId = companyId;
    createData.isActive = data.isActive !== undefined ? data.isActive : true;

    return this.prisma.obligationSchedule.create({
      data: createData,
    });
  }

  // =========================================================================
  // 7. ATUALIZAR DADOS DA OBRIGAÇÃO
  // =========================================================================
  async updateSchedule(scheduleId: string, data: any, companyId: string) {
    const existingSchedule = await this.prisma.obligationSchedule.findFirst({
      where: { id: scheduleId, companyId },
    });

    if (!existingSchedule) {
      throw new BadRequestException('Obrigação não encontrada ou sem permissão.');
    }

    // 🛡️ FILTRO DE SEGURANÇA: Mesma lógica do create para evitar erros de schema
    const allowedFields = [
      'name', 'mininome', 'departamento', 'responsibleUser', 
      'estimatedTimeMinutes', 'deliveryDays', 'reminderDays', 
      'dayType', 'nonBusinessDayAction', 'saturdayIsBusinessDay',
      'competenceRef', 'requireBot', 'subjectToFine', 
      'alertGuide', 'isActive', 'defaultComment',
      'folderPath', 'fileNamePattern', 'postProcessAction' // ✅ Campos do Watch Folder
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
  // 8. DELETAR OBRIGAÇÃO INTEIRA (COM CASCADE MANUAL)
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
  // 9. REMOVER EMPRESA ESPECÍFICA DA OBRIGAÇÃO
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
  // 10. LISTAR TODOS OS CLIENTES COM SUAS OBRIGAÇÕES AGRUPADAS
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
  // 11. LISTAR OBRIGAÇÕES AGRUPADAS POR TIPO (NÃO POR CLIENTE)
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
        else if (delivery.status === 'PENDENTE') color = 'orange';

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
  // =========================================================================
  // 12. VERIFICAÇÃO DE CUMPRIMENTO (WATCH FOLDER) — SPRINT OB-4
  //     Pasta com arquivos  → obrigação cumprida.
  //     Pasta VAZIA         → alerta "NÃO cumprida" ao Super Admin.
  //     Disparável a qualquer momento via POST /schedules/:id/verify
  //     (futuro: chamar também via cron na data de vencimento).
  // =========================================================================
  async verifyFulfillment(scheduleId: string, companyId: string) {
    // 1) Busca a obrigação (multi-tenant, ADR-004)
    const schedule = await this.prisma.obligationSchedule.findFirst({
      where: { id: scheduleId, companyId },
    });
    if (!schedule) throw new BadRequestException('Obrigação não encontrada.');

    const folderPath = (schedule as any).folderPath as string | undefined;
    const pattern = ((schedule as any).fileNamePattern as string | undefined) || '*.pdf';

    // 2) Validações de configuração
    if (!folderPath) {
      return { fulfilled: false, code: 'SEM_PASTA', files: [],
        message: 'Obrigação sem pasta de monitoramento configurada.' };
    }
    if (!fs.existsSync(folderPath)) {
      return { fulfilled: false, code: 'PASTA_INEXISTENTE', files: [],
        message: `A pasta configurada não existe: ${folderPath}` };
    }

    // 3) Converte wildcards (* e ?) em Regex e lista arquivos correspondentes
    const regex = new RegExp(
      '^' + pattern.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*').replace(/\?/g, '.') + '$',
      'i',
    );
    const files = fs
      .readdirSync(folderPath)
      .filter((f) => fs.statSync(path.join(folderPath, f)).isFile() && regex.test(f));

    // 4) Pasta COM arquivos → cumprida (nada a alertar)
    if (files.length > 0) {
      return { fulfilled: true, code: 'OK', files,
        message: `${files.length} arquivo(s) encontrado(s): ${files.join(', ')}` };
    }

    // 5) Pasta VAZIA → NÃO cumprida: alerta ao Super Admin
    //    Email resolvido do banco (role SUPER_ADMIN) ou override via .env
    const adminEmail =
      process.env.ADMIN_ALERT_EMAIL ||
      (await this.prisma.user.findFirst({
        where: { companyId, role: 'SUPER_ADMIN', deletedAt: null },
        select: { email: true },
      }))?.email;

    const assunto = `⚠️ Obrigação NÃO cumprida: ${schedule.name}`;
    const html = `
      <h3>Obrigação não cumprida</h3>
      <p>A obrigação <strong>${schedule.name}</strong> foi verificada em
         <strong>${new Date().toLocaleString('pt-BR')}</strong> e a pasta está <strong>VAZIA</strong>.</p>
      <p><strong>Pasta verificada:</strong> ${folderPath}</p>
      <p><strong>Padrão esperado:</strong> ${pattern}</p>
      <p>Nenhum documento foi disponibilizado para envio ao cliente.</p>
    `;

    await this.sendAdminAlert(adminEmail || 'admin@contacerta.com.br', assunto, html);

    return { fulfilled: false, code: 'NAO_CUMPRIDA', files: [],
      message: `Pasta vazia. Alerta enviado para ${adminEmail}.` };
  }

  // ---------------------------------------------------------------------------
  // 🔒 ALERTA AO SUPER ADMIN — autocontido de propósito (não acopla ao
  //    EmailEnvioService para não tocar no módulo de envio que já funciona).
  //    MODO LOG → imprime no console. SMTP configurado → envio real.
  //    Futuro (OB-5): migrar para EmailEnvioService p/ reusar templates/tracking.
  // ---------------------------------------------------------------------------
  private async sendAdminAlert(to: string, subject: string, html: string) {
    const mode = process.env.EMAIL_MODE || 'LOG';

    if (mode === 'LOG' || !process.env.SMTP_HOST) {
      console.log('\n════════════════════════════════════════════════');
      console.log('📧 EMAIL ALERTA (MODO LOG — não enviado de verdade)');
      console.log(`   Para:    ${to}`);
      console.log(`   Assunto: ${subject}`);
      console.log('════════════════════════════════════════════════\n');
      return;
    }

    // Envio real via SMTP (mesmas variáveis do módulo de envio)
    const nodemailer = require('nodemailer');
    const port = Number(process.env.SMTP_PORT || 587);
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port,
      secure: port === 465,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });
    await transporter.sendMail({
      from: process.env.SMTP_FROM || 'noreply@contacerta.com.br',
      to, subject, html,
    });
  }
  // =========================================================================
  // 13. LINHA DO TEMPO DA OBRIGAÇÃO — Sprint OB-7
  //     Por empresa: vencimento do mês, situação (futura/atrasada/cumprida)
  //     e rastreio do email (enviado/aberto/baixado).
  //     🔗 Rastreio entra via adaptador OB-6 (ver ponte no final da resposta).
  // =========================================================================
  async getScheduleTimeline(scheduleId: string, year: number, monthIdx: number, companyId: string) {
    const schedule = await this.prisma.obligationSchedule.findFirst({
      where: { id: scheduleId, companyId },
    });
    if (!schedule) throw new BadRequestException('Obrigação não encontrada.');

    const due = getDueDate(schedule as any, year, monthIdx);

    const deliveries = await this.prisma.obligationDelivery.findMany({
      where: { scheduleId },
      orderBy: { createdAt: 'asc' },
    });

    // Join manual de clientes (padrão já usado no findAllSchedules)
    const clientIds = [...new Set(deliveries.map(d => d.clientId))];
    const clients = await this.prisma.client.findMany({
      where: { id: { in: clientIds } },
      select: { id: true, companyName: true, cnpj: true },
    });
    const clientMap = new Map(clients.map(c => [c.id, c]));

    return {
      scheduleId,
      month: monthIdx + 1,
      year,
      dueDate: due ? due.toISOString() : null,
      dueDateFmt: fmtDate(due),
      competence: competenceLabel(schedule as any, year, monthIdx),
      items: deliveries.map(d => ({
        deliveryId: d.id,
        client: clientMap.get(d.clientId) || null,
        status: d.status,
        situation: dueStatus(due, d.status),
               // 🔗 OB-6: rastreio lido direto da entrega (alimentado pelas LP2/LP3)
        tracking: {
          sentAt: (d as any).sentAt ?? null,
          openedAt: (d as any).openedAt ?? null,
          downloadedAt: (d as any).downloadedAt ?? null,
        },
      })),
    };
  }
}