import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ServiceType, ClientStatus } from '@prisma/client';
import { parse } from 'csv-parse/sync'; // 📌 Biblioteca para ler CSV com segurança

// =================================================================
// 📦 TIPOS E INTERFACES (Type Safety)
// =================================================================

export interface CreateClientData {
  companyName: string; // ✅ OBRIGATÓRIO pelo schema
  cnpj?: string;
  serviceType?: ServiceType;
  monthlyFee?: number;
  status?: ClientStatus;
  startDate: string | Date; // ✅ OBRIGATÓRIO pelo schema
  endDate?: string | Date | null;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  observations?: string;
  commercialPlanId?: string;
  avulsoServiceIds?: string[];
  accountingPlan?: string | null;
}

export interface UpdateClientData {
  companyName?: string;
  cnpj?: string;
  serviceType?: ServiceType;
  monthlyFee?: number;
  status?: ClientStatus;
  startDate?: string | Date;
  endDate?: string | Date | null;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  observations?: string;
  commercialPlanId?: string;
  avulsoServiceIds?: string[];
  accountingPlan?: string | null;
}

export interface MonthlyDataPayload {
  initialClients?: number | string;
  newClients?: number | string;
  churnedClients?: number | string;
  newRevenue?: number | string;
  lostRevenue?: number | string;
  finalRevenue?: number | string;
}

export interface ClientMetrics {
  totalClients: number;
  activeClients: number;
  prospectClients: number;
  churnedClients: number;
  totalMonthlyRevenue: number;
  churnRate: number;
}

// =================================================================
// 🏢 ClientService — Gestão de Clientes Enterprise
// =================================================================
@Injectable()
export class ClientService {
  constructor(private readonly prisma: PrismaService) {}

  // =================================================================
  // 📋 LISTAGEM
  // =================================================================
  async findAll(companyId: string) {
    return this.prisma.client.findMany({
      where: { companyId, deletedAt: null },
      orderBy: { createdAt: 'desc' },
      include: {
        contracts: {
          where: { status: 'ATIVO' },
          include: { commercialPlan: true },
          orderBy: { startDate: 'desc' },
          take: 1,
        },
        services: {
          where: { status: 'ATIVO' },
          include: { serviceItem: { include: { category: true } } },
        },
        contacts: { orderBy: [{ isPrimary: 'desc' }, { name: 'asc' }] },
        departmentOwners: { orderBy: { department: 'asc' } },
      },
    });
  }

  // =================================================================
  // ➕ CRIAÇÃO ENTERPRISE
  // =================================================================
  async create(companyId: string, userId: string, data: CreateClientData) {
    if (!data.companyName) throw new BadRequestException('Nome da empresa é obrigatório.');
    if (!data.startDate) throw new BadRequestException('Data de início é obrigatória.');

    const { commercialPlanId, avulsoServiceIds, ...clientData } = data;

    return this.prisma.$transaction(async (tx) => {
      const newClient = await tx.client.create({
        data: {
          ...clientData,
          monthlyFee: clientData.monthlyFee ?? 0,
          companyId,
          user: { connect: { id: userId } },
          startDate: clientData.startDate ? new Date(clientData.startDate) : new Date(),
          endDate: clientData.endDate ? new Date(clientData.endDate) : null,
        },
      });

      if (commercialPlanId) {
        await tx.clientContract.create({
          data: {
            companyId,
            clientId: newClient.id,
            commercialPlanId,
            startDate: newClient.startDate,
            monthlyFee: clientData.monthlyFee || 0,
            status: 'ATIVO',
          },
        });
      }

      if (avulsoServiceIds && avulsoServiceIds.length > 0) {
        const serviceItems = await tx.serviceItem.findMany({
          where: { id: { in: avulsoServiceIds }, deletedAt: null },
          select: { id: true, recurrence: true, basePrice: true },
        });

        if (serviceItems.length !== avulsoServiceIds.length) {
          throw new BadRequestException('Um ou mais serviços avulsos não foram encontrados.');
        }

        await tx.clientService.createMany({
          data: serviceItems.map((item) => ({
            companyId,
            clientId: newClient.id,
            serviceItemId: item.id,
            recurrence: item.recurrence,
            status: 'ATIVO',
            startDate: newClient.startDate,
          })),
        });
      }

      return tx.client.findUnique({
        where: { id: newClient.id },
        include: {
          contracts: { where: { status: 'ATIVO' }, include: { commercialPlan: true } },
          services: { where: { status: 'ATIVO' }, include: { serviceItem: { include: { category: true } } } },
        },
      });
    });
  }

  // =================================================================
  // 🔄 UPDATE ENTERPRISE
  // =================================================================
  async update(id: string, companyId: string, data: UpdateClientData) {
    const existing = await this.prisma.client.findFirst({
      where: { id, companyId, deletedAt: null },
    });

    if (!existing) throw new NotFoundException('Cliente não encontrado ou não pertence a esta empresa.');

    const { commercialPlanId, avulsoServiceIds, ...clientData } = data;

    return this.prisma.$transaction(async (tx) => {
      await tx.client.update({
        where: { id },
        data: {
          companyName: clientData.companyName,
          cnpj: clientData.cnpj,
          serviceType: clientData.serviceType,
          monthlyFee: clientData.monthlyFee,
          status: clientData.status,
          startDate: clientData.startDate ? new Date(clientData.startDate) : undefined,
          endDate: clientData.endDate ? new Date(clientData.endDate) : null,
          contactName: clientData.contactName,
          contactEmail: clientData.contactEmail,
          contactPhone: clientData.contactPhone,
          observations: clientData.observations,
          accountingPlan: clientData.accountingPlan,
        },
      });

      if (commercialPlanId !== undefined) {
        await tx.clientContract.updateMany({
          where: { clientId: id, status: 'ATIVO' },
          data: { status: 'INATIVO', endDate: new Date() },
        });
        if (commercialPlanId) {
          await tx.clientContract.create({
            data: {
              companyId,
              clientId: id,
              commercialPlanId,
              startDate: existing.startDate,
              monthlyFee: clientData.monthlyFee || 0,
              status: 'ATIVO',
            },
          });
        }
      }

      if (avulsoServiceIds !== undefined) {
        await tx.clientService.updateMany({
          where: { clientId: id, status: 'ATIVO' },
          data: { status: 'INATIVO' },
        });

        if (avulsoServiceIds.length > 0) {
          const serviceItems = await tx.serviceItem.findMany({
            where: { id: { in: avulsoServiceIds }, deletedAt: null },
            select: { id: true, recurrence: true },
          });

          await tx.clientService.createMany({
            data: serviceItems.map((item) => ({
              companyId,
              clientId: id,
              serviceItemId: item.id,
              recurrence: item.recurrence,
              status: 'ATIVO',
              startDate: existing.startDate,
            })),
          });
        }
      }

      return tx.client.findUnique({
        where: { id },
        include: {
          contracts: { where: { status: 'ATIVO' }, include: { commercialPlan: true } },
          services: { where: { status: 'ATIVO' }, include: { serviceItem: { include: { category: true } } } },
        },
      });
    });
  }

  // =================================================================
  // 🗑️ SOFT DELETE
  // =================================================================
  async delete(id: string, companyId: string) {
    const existing = await this.prisma.client.findFirst({
      where: { id, companyId, deletedAt: null },
    });

    if (!existing) throw new NotFoundException('Cliente não encontrado.');

    return this.prisma.$transaction(async (tx) => {
      const now = new Date();
      await tx.clientContract.updateMany({ where: { clientId: id, status: 'ATIVO' }, data: { status: 'INATIVO', endDate: now } });
      await tx.clientService.updateMany({ where: { clientId: id, status: 'ATIVO' }, data: { status: 'INATIVO' } });

      return tx.client.update({
        where: { id },
        data: { deletedAt: now, status: 'CHURN', endDate: now },
      });
    });
  }

  // =================================================================
  // 📊 DASHBOARD & MÉTRICAS
  // =================================================================
  async getDashboard(companyId: string, year?: number) {
    const targetYear = year || new Date().getFullYear();
    const activeClients = await this.prisma.client.findMany({
      where: { companyId, status: 'ATIVO', deletedAt: null },
      select: { monthlyFee: true, startDate: true },
    });

    const totalClients = activeClients.length;
    const monthlyRevenue = activeClients.reduce((acc, client) => acc + (client.monthlyFee || 0), 0);
    const averageTicket = totalClients > 0 ? monthlyRevenue / totalClients : 0;

    const yearStart = new Date(targetYear, 0, 1);
    const yearEnd = new Date(targetYear, 11, 31, 23, 59, 59);
    const churnedThisYear = await this.prisma.client.count({
      where: { companyId, status: 'CHURN', endDate: { gte: yearStart, lte: yearEnd } },
    });

    return {
      totalClients,
      monthlyRevenue,
      averageTicket: Number(averageTicket.toFixed(2)),
      churnRate: totalClients > 0 ? Number(((churnedThisYear / totalClients) * 100).toFixed(2)) : 0,
      churnedThisYear,
    };
  }

  async getMetrics(companyId: string): Promise<ClientMetrics> {
    const [totalClients, activeClients, prospectClients, churnedClients, totalMonthlyRevenue] = await Promise.all([
      this.prisma.client.count({ where: { companyId, deletedAt: null } }),
      this.prisma.client.count({ where: { companyId, deletedAt: null, status: 'ATIVO' } }),
      this.prisma.client.count({ where: { companyId, deletedAt: null, status: 'PROSPECT' } }),
      this.prisma.client.count({ where: { companyId, deletedAt: null, status: 'CHURN' } }),
      this.prisma.client.aggregate({ where: { companyId, deletedAt: null, status: 'ATIVO' }, _sum: { monthlyFee: true } }),
    ]);

    return {
      totalClients,
      activeClients,
      prospectClients,
      churnedClients,
      totalMonthlyRevenue: totalMonthlyRevenue._sum.monthlyFee || 0,
      churnRate: totalClients > 0 ? Math.round((churnedClients / totalClients) * 1000) / 10 : 0,
    };
  }

  async getMonthlyData(companyId: string, year: number) {
    const data = await this.prisma.clientMonthlyData.findMany({
      where: { companyId, year },
      orderBy: { month: 'asc' },
    });

    if (data.length === 0) {
      return Array.from({ length: 12 }, (_, i) => ({
        month: i + 1,
        initialClients: 0, newClients: 0, churnedClients: 0, finalClients: 0,
        newRevenue: 0, lostRevenue: 0, finalRevenue: 0, churnRate: 0, accumulatedChurn: 0,
      }));
    }
    return data;
  }

  async upsertMonthlyData(companyId: string, userId: string, year: number, month: number, data: MonthlyDataPayload) {
    if (month < 1 || month > 12) throw new BadRequestException('Mês deve estar entre 1 e 12.');

    const initial = Number(data.initialClients) || 0;
    const newClients = Number(data.newClients) || 0;
    const churned = Number(data.churnedClients) || 0;
    const finalClients = initial + newClients - churned;
    const newRev = Number(data.newRevenue) || 0;
    const lostRev = Number(data.lostRevenue) || 0;
    const finalRevenue = data.finalRevenue !== undefined ? Number(data.finalRevenue) : 0;
    const churnRate = initial > 0 ? (churned / initial) * 100 : 0;

    return this.prisma.clientMonthlyData.upsert({
      where: { companyId_year_month: { companyId, year, month } },
      update: { initialClients: initial, newClients: newClients, churnedClients: churned, finalClients: finalClients, newRevenue: newRev, lostRevenue: lostRev, finalRevenue: finalRevenue, churnRate: Number(churnRate.toFixed(2)), accumulatedChurn: Number(churnRate.toFixed(2)) },
      create: { companyId, userId, year, month, initialClients: initial, newClients: newClients, churnedClients: churned, finalClients: finalClients, newRevenue: newRev, lostRevenue: lostRev, finalRevenue: finalRevenue, churnRate: Number(churnRate.toFixed(2)), accumulatedChurn: Number(churnRate.toFixed(2)) },
    });
  }

  // =========================================================================
  // 📥 IMPORTAÇÃO EM MASSA DE CLIENTES VIA CSV (LÓGICA PRINCIPAL)
  // =========================================================================
  async importFromCSV(csvContent: string, companyId: string, importerUserId: string) {
    // 📌 1. Parse do CSV: separador ';', ignora linhas vazias, pula o cabeçalho (linha 1)
    const records = parse(csvContent, {
      delimiter: ';',
      skip_empty_lines: true,
      trim: true,
      from_line: 2,
    });

    const stats = { totalProcessed: 0, created: 0, updated: 0, contactsCreated: 0, errors: 0 };
    const groupedByCnpj = new Map<string, any[]>();
    
    // 📌 2. Agrupamento: O mesmo CNPJ pode aparecer várias vezes (uma para cada contato)
    for (const row of records) {
      const rawCnpj = row[2]?.toString().trim();
      // Ignora rodapés do CSV como "Empresas listadas: 94" ou linhas sem CNPJ
      if (!rawCnpj || rawCnpj.length < 5 || rawCnpj.toLowerCase().includes('empresas listadas')) {
        continue;
      }
      
      const cleanCnpj = rawCnpj.replace(/\D/g, '');
      if (cleanCnpj.length !== 14) continue; // Garante que é um CNPJ válido

      if (!groupedByCnpj.has(cleanCnpj)) {
        groupedByCnpj.set(cleanCnpj, []);
      }
      groupedByCnpj.get(cleanCnpj)!.push(row);
    }

    // 📌 3. Processamento: Itera sobre cada CNPJ único
    for (const [cnpj, rows] of groupedByCnpj.entries()) {
      stats.totalProcessed++;
      try {
        const firstRow = rows[0]; // Dados da empresa vêm da primeira linha deste CNPJ

        // 🛡️ Helpers de conversão seguros
        const parseDate = (dateStr: string) => {
          if (!dateStr) return null;
          const parts = dateStr.split('/');
          if (parts.length === 3) return new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
          return null;
        };

        const parseCurrency = (val: string) => {
          if (!val) return 0;
          const cleanVal = val.toString().trim();
          if (cleanVal.includes(',')) {
            return parseFloat(cleanVal.replace(/\./g, '').replace(',', '.')) || 0;
          }
          return parseFloat(cleanVal) || 0;
        };

        // 📌 Mapeamento do Enum TaxRegime do Prisma
        const rawRegime = firstRow[4]?.toString().trim().toLowerCase() || '';
        let taxRegimeValue: any = null; // ✅ CORREÇÃO: default para null em vez de 'OUTRO'
        if (rawRegime.includes('simples nacional')) taxRegimeValue = 'SIMPLES_NACIONAL';
        else if (rawRegime.includes('lucro presumido')) taxRegimeValue = 'LUCRO_PRESUMIDO';
        else if (rawRegime.includes('lucro real')) taxRegimeValue = 'LUCRO_REAL';
        else if (rawRegime.includes('mei')) taxRegimeValue = 'MEI';
        else if (rawRegime.includes('domésticas') || rawRegime.includes('cei')) taxRegimeValue = 'ISENTO';

        // 📌 stateRegistrations é String[] no schema, então convertemos para array
        const rawStateReg = firstRow[30]?.toString().trim();
        const stateRegistrationsArray = rawStateReg ? [rawStateReg] : [];

        // 📌 Montagem do objeto de dados (mapeado conforme índices do seu CSV)
        const createData = {
          companyId,
          userId: importerUserId,
          s3dId: parseInt(firstRow[1]) || null,
          cnpj: cnpj,
          companyName: firstRow[0]?.toString().trim(),
          tradeName: firstRow[5]?.toString().trim() || null,
          taxRegime: taxRegimeValue,
          nire: firstRow[6]?.toString().trim() || null,
          municipalRegistration: firstRow[7]?.toString().trim() || null,
          municipalRegistrationDate: parseDate(firstRow[8]),
          stateRegistrations: stateRegistrationsArray, // ✅ Corrigido para array
          isStateExempt: firstRow[31]?.toString().trim().toLowerCase() === 'sim',
          otherIdentifiers: firstRow[32]?.toString().trim() || null,
          phone: firstRow[3]?.toString().trim() || null,
          address: firstRow[9]?.toString().trim() || null,
          addressNumber: firstRow[10]?.toString().trim() || null,
          addressComplement: firstRow[11]?.toString().trim() || null,
          addressDistrict: firstRow[13]?.toString().trim() || null,
          addressCity: firstRow[14]?.toString().trim() || null,
          addressState: firstRow[15]?.toString().trim() || null,
          addressZip: firstRow[12]?.toString().trim() || null,
          website: firstRow[22]?.toString().trim() || null,
          s3dNickname: firstRow[23]?.toString().trim() || null,
          companyGroup: firstRow[24]?.toString().trim() || null,
          foundationDate: parseDate(firstRow[17]),
          clientSince: parseDate(firstRow[18]),
          clientUntil: parseDate(firstRow[19]),
          s3dRegistrationDate: parseDate(firstRow[16]),
          tags: firstRow[34] ? firstRow[34].split(',').map((t: string) => t.trim()).filter(Boolean) : [],
          observations: firstRow[33]?.toString().trim() || null, // ✅ Corrigido de generalComments para observations
          monthlyFee: parseCurrency(firstRow[21]),
          status: firstRow[20]?.toString().trim().toLowerCase() === 'ativa' ? 'ATIVO' : 'INATIVO',
          startDate: parseDate(firstRow[16]) || new Date(), // ✅ Fallback para data atual se não houver data de cadastro
        };

        // 📌 4. Estratégia de Busca em Cascata (Evita duplicatas)
        let client = await this.prisma.client.findFirst({ where: { s3dId: createData.s3dId } });
        if (!client) client = await this.prisma.client.findFirst({ where: { cnpj: createData.cnpj } });
       // if (!client) client = await this.prisma.client.findFirst({ where: { companyId, companyName: createData.companyName } });

        if (client) {
          // 🔄 ATUALIZAÇÃO: Remove campos de relação para evitar erro de tipo no Prisma
          const { userId: _, companyId: __, ...updateData } = createData;
          
          // 🛡️ Filtro de segurança: Não sobrescreve campos do banco com valores vazios ("") ou null do CSV
          const cleanUpdateData = Object.fromEntries(
            Object.entries(updateData).filter(([_, value]) => value !== "" && value !== null && value !== undefined)
          );

          await this.prisma.client.update({
            where: { id: client.id },
            data: cleanUpdateData as any, // 'as any' é seguro aqui devido ao filtro anterior
          });
          stats.updated++;
        } else {
          // ➕ CRIAÇÃO
          try {
            client = await this.prisma.client.create({ data: createData as any });
            stats.created++;
          } catch (createError: any) {
            // 🛡️ Fallback para Unique Constraint (companyId, companyName)
            if (createError?.code === 'P2002') {
              const existingClient = await this.prisma.client.findFirst({
                where: { companyId, companyName: createData.companyName },
              });
              if (existingClient) {
                const { userId: _, companyId: __, ...updateData } = createData;
                await this.prisma.client.update({ where: { id: existingClient.id }, data: updateData as any });
                stats.updated++;
                client = existingClient;
              } else {
                throw createError;
              }
            } else {
              throw createError;
            }
          }
        }

        // 📌 5. Processamento de Múltiplos Contatos para o mesmo CNPJ
        for (const row of rows) {
          const contactName = row[25]?.toString().trim();
          const contactEmail = row[28]?.toString().trim();
          
          if (contactName || contactEmail) {
            // 🛡️ Verifica se o contato já existe para evitar duplicatas ao rodar a importação 2x
            const existingContact = await this.prisma.clientContact.findFirst({
              where: {
                clientId: client.id,
                OR: [{ email: contactEmail }, { name: contactName }],
              },
            });

            if (!existingContact) {
              await this.prisma.clientContact.create({
                data: {
                  clientId: client.id,
                  companyId,
                  name: contactName || 'Contato sem nome',
                  role: row[26]?.toString().trim() || null,
                  phone: row[27]?.toString().trim() || null, // ✅ Usando 'phone' conforme schema padrão
                  email: contactEmail || null,
                } as any,
              });
              stats.contactsCreated++;
            }
          }
        }
      } catch (error) {
        // 📌 Registra o erro no console mas não quebra o loop, permitindo que os outros CNPJs sejam processados
        console.error(`[CSV Import] Erro ao processar CNPJ ${cnpj}:`, error);
        stats.errors++;
      }
    }

    // 📌 6. Retorna as estatísticas para o Controller exibir no Frontend
    return stats;
  }
}