import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { MedicalStatus, PlayerStatus, Prisma } from '@prisma/client';
import type { SessionUser } from '@usn/types';
import { AuthorizationService } from '../auth/authorization.service';
import { PrismaService } from '../prisma/prisma.service';
import { AddMedicalUpdateDto, CreateMedicalCaseDto, MedicalQueryDto } from './dto/medical.dto';

const medicalInclude = {
  player: { include: { person: true, seasons: { where: { season: { isCurrent: true }, leftAt: null }, include: { category: true } } } },
  responsibleStaff: { include: { person: true } },
  updates: { include: { createdBy: { include: { person: true } } }, orderBy: { createdAt: 'desc' as const } },
};

@Injectable()
export class MedicalService {
  constructor(private readonly prisma: PrismaService, private readonly authorization: AuthorizationService) {}

  async list(user: SessionUser, query: MedicalQueryDto) {
    const categoryIds = this.authorization.scopedCategoryIds(user, 'medical.viewAvailability', query.categoryId);
    const cases = await this.prisma.medicalCase.findMany({
      where: {
        ...(query.status ? { status: query.status } : {}),
        player: { seasons: { some: { season: { isCurrent: true }, leftAt: null, ...(categoryIds ? { categoryId: { in: categoryIds } } : {}) } } },
      },
      include: medicalInclude,
      orderBy: [{ status: 'asc' }, { occurredAt: 'desc' }],
    });
    return cases.map((item) => this.redact(item, user, item.player.seasons[0]?.categoryId));
  }

  async one(id: string, user: SessionUser) {
    const item = await this.prisma.medicalCase.findUnique({ where: { id }, include: medicalInclude });
    if (!item) throw new NotFoundException('Medical case not found');
    const categoryId = item.player.seasons[0]?.categoryId;
    if (!categoryId) this.authorization.assertGlobalScope(user, 'medical.viewAvailability');
    else this.authorization.assertCategory(user, categoryId, 'medical.viewAvailability');
    return this.redact(item, user, categoryId);
  }

  async create(dto: CreateMedicalCaseDto, user: SessionUser) {
    const categoryId = await this.currentCategory(dto.playerId);
    this.authorization.assertCategory(user, categoryId, 'medical.edit');
    const medicalCase = await this.prisma.$transaction(async (tx) => {
      const created = await tx.medicalCase.create({
        data: {
          playerId: dto.playerId,
          issue: dto.issue,
          bodyArea: dto.bodyArea,
          occurredAt: new Date(dto.occurredAt),
          severity: dto.severity,
          responsibleStaffId: dto.responsibleStaffId,
          status: dto.status,
          expectedReturnAt: dto.expectedReturnAt ? new Date(dto.expectedReturnAt) : undefined,
          confidentialNotes: dto.confidentialNotes,
          rehabilitationPhase: dto.rehabilitationPhase,
        },
      });
      await tx.player.update({ where: { id: dto.playerId }, data: { status: this.playerStatus(dto.status) } });
      await tx.auditLog.create({ data: { userId: user.id, action: 'CREATE', entity: 'MedicalCase', entityId: created.id, after: created } });
      return created;
    });
    return this.one(medicalCase.id, user);
  }

  async addUpdate(id: string, dto: AddMedicalUpdateDto, user: SessionUser) {
    const target = await this.prisma.medicalCase.findUnique({ where: { id }, select: { id: true, playerId: true, status: true } });
    if (!target) throw new NotFoundException('Medical case not found');
    const categoryId = await this.currentCategory(target.playerId);
    this.authorization.assertCategory(user, categoryId, 'medical.edit');
    const actorStaff = await this.prisma.staffProfile.findUnique({ where: { personId: user.personId }, select: { id: true } });
    const createdById = actorStaff?.id ?? dto.createdByStaffId;
    if (!createdById) throw new BadRequestException('A staff profile is required to record a medical update');
    await this.prisma.$transaction(async (tx) => {
      const update = await tx.medicalUpdate.create({ data: { caseId: id, status: dto.status, publicNote: dto.publicNote, confidentialNote: dto.confidentialNote, createdById } });
      const changed = await tx.medicalCase.update({ where: { id }, data: { status: dto.status, expectedReturnAt: dto.expectedReturnAt ? new Date(dto.expectedReturnAt) : undefined, rehabilitationPhase: dto.rehabilitationPhase } });
      await tx.player.update({ where: { id: target.playerId }, data: { status: this.playerStatus(dto.status) } });
      await tx.auditLog.create({ data: { userId: user.id, action: 'MEDICAL_STATUS_CHANGE', entity: 'MedicalCase', entityId: id, before: { status: target.status }, after: { case: changed, update } as unknown as Prisma.InputJsonValue } });
    });
    return this.one(id, user);
  }

  private async currentCategory(playerId: string) {
    const membership = await this.prisma.playerSeason.findFirst({ where: { playerId, season: { isCurrent: true }, leftAt: null }, select: { categoryId: true } });
    if (!membership) throw new BadRequestException('Player is not assigned to a current category');
    return membership.categoryId;
  }

  private playerStatus(status: MedicalStatus): PlayerStatus {
    return status === MedicalStatus.AVAILABLE || status === MedicalStatus.MATCH_READY ? PlayerStatus.ACTIVE : PlayerStatus.INJURED;
  }

  private redact<T extends { confidentialNotes: string | null; updates: Array<{ confidentialNote: string | null }>}>(item: T, user: SessionUser, categoryId?: string) {
    const detailed = user.permissions.includes('medical.viewDetails') && (!categoryId || this.authorization.canAccessCategory(user, categoryId, 'medical.viewDetails'));
    if (detailed) return item;
    return {
      ...item,
      confidentialNotes: undefined,
      updates: item.updates.map((update) => ({ ...update, confidentialNote: undefined })),
    };
  }
}
