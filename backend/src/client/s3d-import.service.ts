// =================================================================
// INÍCIO: backend/src/client/s3d-import.service.ts
// =================================================================
/**
 * 🆕 Sprint F12 (ADR-111..115) — Importação S3D de cadastro completo
 * -----------------------------------------------------------------
 * Recebe o payload AGRUPADO por empresa (gerado pelo parser frontend
 * parseS3dCsv.ts) e aplica upsert idempotente:
 *   - Âncora de match: s3dId → CNPJ → companyName (nesta ordem)
 *   - Contatos: estratégia de SUBSTITUIÇÃO (reimportar refaz a lista)
 *   - Responsáveis por departamento: upsert por (cliente, departamento)
 *   - Retrocompatibilidade: contato primário espelha contactName/Email/Phone
 *
 * 🛡️ Nunca lança exceção global: erro de 1 empresa não aborta o lote.
 */
import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

/** Contato normalizado vindo do parser */
export interface S3dContact {
  name: string;
  role?: string;
  phone?: string;
  email?: string;
  departments?: string[];
}

/** Responsável interno por departamento */
export interface S3dOwner {
  department: string;
  ownerName: string;
}

/** Empresa agrupada (1 por CNPJ) vinda do parser */
export interface S3dCompany {
  s3dId?: number;
  companyName: string;
  cnpj?: string;
  tradeName?: string;
  taxRegime?: string;
  nire?: string;
  municipalRegistration?: string;
  municipalRegistrationDate?: string;
  stateRegistrations?: string[];
  isStateExempt?: boolean;
  otherIdentifiers?: string;
  phone?: string;
  address?: string;
  addressNumber?: string;
  addressComplement?: string;
  addressDistrict?: string;
  addressCity?: string;
  addressState?: string;
  addressZip?: string;
  website?: string;
  s3dNickname?: string;
  companyGroup?: string;
  foundationDate?: string;
  clientSince?: string;
  clientUntil?: string;
  s3dRegistrationDate?: string;
  monthlyFee?: number;
  active?: boolean;
  observations?: string;
  tags?: string[];
  contacts?: S3dContact[];
  owners?: S3dOwner[];
}

@Injectable()
export class S3dImportService {
  constructor(private readonly prisma: PrismaService) {}

  async importS3d(
    companyId: string,
    userId: string,
    companies: S3dCompany[],
  ) {
    if (!companies || companies.length === 0) {
      throw new BadRequestException('Nenhuma empresa para importar.');
    }

    let created = 0;
    let updated = 0;
    let contactsSynced = 0;
    let ownersSynced = 0;
    const errors: { company: string; error: string }[] = [];

    for (const c of companies) {
      try {
        const result = await this.upsertCompany(companyId, userId, c);
        created += result.created;
        updated += result.updated;
        contactsSynced += result.contacts;
        ownersSynced += result.owners;
      } catch (e: any) {
        errors.push({ company: c.companyName, error: e?.message || 'Erro' });
      }
    }

    return { created, updated, contactsSynced, ownersSynced, errors };
  }

  // ---------------------------------------------------------------
  // Upsert de 1 empresa + contatos + responsáveis (transação atômica)
  // ---------------------------------------------------------------
  private async upsertCompany(
    companyId: string,
    userId: string,
    c: S3dCompany,
  ) {
    return this.prisma.$transaction(async (tx) => {
      // 1) Localiza existente: s3dId → CNPJ → razão social
      let existing = null as any;
      if (c.s3dId) {
        existing = await tx.client.findFirst({
          where: { companyId, s3dId: c.s3dId, deletedAt: null },
        });
      }
      if (!existing && c.cnpj) {
        existing = await tx.client.findFirst({
          where: { companyId, cnpj: c.cnpj, deletedAt: null },
        });
      }
      if (!existing) {
        existing = await tx.client.findFirst({
          where: {
            companyId,
            companyName: { equals: c.companyName, mode: 'insensitive' },
            deletedAt: null,
          },
        });
      }

      const primary = c.contacts?.[0];

      const data: any = {
        cnpj: c.cnpj ?? existing?.cnpj ?? null,
        tradeName: c.tradeName,
        taxRegime: c.taxRegime as any,
        nire: c.nire,
        municipalRegistration: c.municipalRegistration,
        municipalRegistrationDate: this.toDate(c.municipalRegistrationDate),
        stateRegistrations: c.stateRegistrations ?? [],
        isStateExempt: c.isStateExempt ?? false,
        otherIdentifiers: c.otherIdentifiers,
        phone: c.phone,
        address: c.address,
        addressNumber: c.addressNumber,
        addressComplement: c.addressComplement,
        addressDistrict: c.addressDistrict,
        addressCity: c.addressCity,
        addressState: c.addressState,
        addressZip: c.addressZip,
        website: c.website,
        s3dNickname: c.s3dNickname,
        companyGroup: c.companyGroup,
        foundationDate: this.toDate(c.foundationDate),
        clientSince: this.toDate(c.clientSince),
        clientUntil: this.toDate(c.clientUntil),
        s3dRegistrationDate: this.toDate(c.s3dRegistrationDate),
        tags: c.tags ?? [],
        s3dId: c.s3dId ?? existing?.s3dId ?? null,
        observations: c.observations ?? existing?.observations ?? null,
        // Retrocompatibilidade (ADR-111): contato primário espelhado
        contactName: primary?.name ?? existing?.contactName ?? null,
        contactEmail: primary?.email ?? existing?.contactEmail ?? null,
        contactPhone: primary?.phone ?? existing?.contactPhone ?? null,
      };

      // Honorário: só sobrescreve se o CSV trouxer valor > 0
      if (c.monthlyFee && c.monthlyFee > 0) data.monthlyFee = c.monthlyFee;
      // Status: só mexe se o CSV disser explicitamente
      if (c.active !== undefined) data.status = c.active ? 'ATIVO' : 'INATIVO';

      let client: any;
      let createdFlag = false;

      if (existing) {
        client = await tx.client.update({ where: { id: existing.id }, data });
      } else {
        client = await tx.client.create({
          data: {
            ...data,
            companyId,
            userId,
            companyName: c.companyName,
            monthlyFee: c.monthlyFee ?? 0,
            startDate: this.toDate(c.clientSince) ?? new Date(),
            status: c.active === false ? 'INATIVO' : 'ATIVO',
            serviceType: 'CONTABIL',
          },
        });
        createdFlag = true;
      }

      // 2) Contatos: substituição completa (ADR-113)
      let contacts = 0;
      if (c.contacts && c.contacts.length > 0) {
        await tx.clientContact.deleteMany({ where: { clientId: client.id } });
        await tx.clientContact.createMany({
          data: c.contacts.map((k, i) => ({
            companyId,
            clientId: client.id,
            name: k.name,
            role: k.role || null,
            phone: k.phone || null,
            email: k.email || null,
            departments: k.departments ?? [],
            isPrimary: i === 0,
          })),
        });
        contacts = c.contacts.length;
      }

      // 3) Responsáveis por departamento: upsert (não destrói edição manual)
      let owners = 0;
      for (const o of c.owners ?? []) {
        await tx.clientDepartmentOwner.upsert({
          where: {
            companyId_clientId_department: {
              companyId,
              clientId: client.id,
              department: o.department,
            },
          },
          create: {
            companyId,
            clientId: client.id,
            department: o.department,
            ownerName: o.ownerName,
          },
          update: { ownerName: o.ownerName },
        });
        owners++;
      }

      return {
        created: createdFlag ? 1 : 0,
        updated: createdFlag ? 0 : 1,
        contacts,
        owners,
      };
    });
  }

  /** dd/mm/aaaa ou yyyy-mm-dd → Date | null (tolerante) */
  private toDate(v?: string): Date | null {
    if (!v) return null;
    const br = v.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (br) return new Date(`${br[3]}-${br[2]}-${br[1]}T12:00:00`);
    const iso = v.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (iso) return new Date(`${iso[1]}-${iso[2]}-${iso[3]}T12:00:00`);
    return null;
  }
}
// =================================================================
// FIM: backend/src/client/s3d-import.service.ts
// =================================================================