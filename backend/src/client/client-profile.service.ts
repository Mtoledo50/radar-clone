// =================================================================
// INÍCIO: backend/src/client/client-profile.service.ts
// =================================================================
/**
 * 🆕 Sprint F12.5 — Edição do cadastro completo (campos S3D + contatos + deptos)
 * -----------------------------------------------------------------
 * Endpoint SEPARADO do PUT /clients/:id (que cuida de contrato/plano):
 * aqui só mexemos no cadastro enriquecido. Arrays (contacts/owners)
 * seguem a estratégia de SUBSTITUIÇÃO (ADR-113): o que vier no payload
 * vira a lista oficial.
 */
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface ProfileContactInput {
  name: string;
  role?: string | null;
  phone?: string | null;
  email?: string | null;
  departments?: string[];
  isPrimary?: boolean;
}
export interface ProfileOwnerInput {
  department: string;
  ownerName: string;
}
export interface UpdateProfileDto {
  tradeName?: string | null;
  taxRegime?: string | null;
  nire?: string | null;
  municipalRegistration?: string | null;
  municipalRegistrationDate?: string | null;
  stateRegistrations?: string[];
  isStateExempt?: boolean;
  otherIdentifiers?: string | null;
  phone?: string | null;
  address?: string | null;
  addressNumber?: string | null;
  addressComplement?: string | null;
  addressDistrict?: string | null;
  addressCity?: string | null;
  addressState?: string | null;
  addressZip?: string | null;
  website?: string | null;
  s3dNickname?: string | null;
  companyGroup?: string | null;
  foundationDate?: string | null;
  clientSince?: string | null;
  clientUntil?: string | null;
  s3dRegistrationDate?: string | null;
  tags?: string[];
  observations?: string | null;
  contacts?: ProfileContactInput[];
  departmentOwners?: ProfileOwnerInput[];
}

@Injectable()
export class ClientProfileService {
  constructor(private readonly prisma: PrismaService) {}

  async updateProfile(companyId: string, clientId: string, dto: UpdateProfileDto) {
    const existing = await this.prisma.client.findFirst({
      where: { id: clientId, companyId, deletedAt: null },
    });
    if (!existing) throw new NotFoundException('Cliente não encontrado.');

    return this.prisma.$transaction(async (tx) => {
      const data: any = {};

      // ---- scalares de texto (vazio → null) ----
      const texts: (keyof UpdateProfileDto)[] = [
        'tradeName', 'nire', 'municipalRegistration', 'otherIdentifiers',
        'phone', 'address', 'addressNumber', 'addressComplement',
        'addressDistrict', 'addressCity', 'addressState', 'addressZip',
        'website', 's3dNickname', 'companyGroup', 'observations',
      ];
      for (const k of texts) {
        if (dto[k] !== undefined) data[k] = this.str(dto[k] as any);
      }
      if (dto.taxRegime !== undefined) data.taxRegime = dto.taxRegime || null;
      if (dto.isStateExempt !== undefined) data.isStateExempt = !!dto.isStateExempt;
      if (dto.stateRegistrations !== undefined) data.stateRegistrations = dto.stateRegistrations || [];
      if (dto.tags !== undefined) data.tags = dto.tags || [];

      // ---- datas (ISO ou null) ----
      const dates: (keyof UpdateProfileDto)[] = [
        'municipalRegistrationDate', 'foundationDate', 'clientSince',
        'clientUntil', 's3dRegistrationDate',
      ];
      for (const k of dates) {
        if (dto[k] !== undefined) data[k] = this.toDate(dto[k] as any);
      }

      // ---- contatos: substituição completa ----
      if (dto.contacts !== undefined) {
        const list = (dto.contacts || []).filter((k) => (k.name || '').trim());
        if (list.length && !list.some((k) => k.isPrimary)) list[0].isPrimary = true;
        await tx.clientContact.deleteMany({ where: { clientId } });
        if (list.length) {
          await tx.clientContact.createMany({
            data: list.map((k) => ({
              companyId,
              clientId,
              name: k.name.trim(),
              role: this.str(k.role),
              phone: this.str(k.phone),
              email: this.str(k.email),
              departments: k.departments || [],
              isPrimary: !!k.isPrimary,
            })),
          });
        }
      }

      // ---- responsáveis por depto: substituição completa ----
      if (dto.departmentOwners !== undefined) {
        const owners = (dto.departmentOwners || []).filter(
          (o) => (o.department || '').trim() && (o.ownerName || '').trim(),
        );
        await tx.clientDepartmentOwner.deleteMany({ where: { clientId } });
        if (owners.length) {
          await tx.clientDepartmentOwner.createMany({
            data: owners.map((o) => ({
              companyId,
              clientId,
              department: o.department.trim(),
              ownerName: o.ownerName.trim(),
            })),
          });
        }
      }

      await tx.client.update({ where: { id: clientId }, data });

      return tx.client.findFirst({
        where: { id: clientId },
        include: {
          contacts: { orderBy: [{ isPrimary: 'desc' }, { name: 'asc' }] },
          departmentOwners: { orderBy: { department: 'asc' } },
        },
      });
    });
  }

  private str(v?: string | null): string | null {
    if (v === undefined) return null;
    const t = (v || '').trim();
    return t === '' ? null : t;
  }

  private toDate(v?: string | null): Date | null {
    if (!v) return null;
    const d = new Date(v);
    return isNaN(d.getTime()) ? null : d;
  }
}
// =================================================================
// FIM: backend/src/client/client-profile.service.ts
// =================================================================