import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import type { SessionUser } from '@usn/types';
import { AuthorizationService } from '../auth/authorization.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateGuardianDto, GuardianQueryDto, LinkGuardianPlayerDto } from './dto/guardian.dto';

@Injectable()
export class GuardiansService {
  constructor(private readonly prisma: PrismaService, private readonly authorization: AuthorizationService) {}

  async list(user: SessionUser, query: GuardianQueryDto) {
    const categoryIds = this.authorization.scopedCategoryIds(user, 'guardians.view', query.categoryId);
    const membership = { season: { isCurrent: true }, leftAt: null, ...(categoryIds ? { categoryId: { in: categoryIds } } : {}) };
    return this.prisma.guardian.findMany({
      where: { players: { some: { player: { seasons: { some: membership } } } } },
      include: { person: true, players: { where: { player: { seasons: { some: membership } } }, include: { player: { include: { person: true, seasons: { where: membership, include: { category: true } } } } } } },
      orderBy: { person: { fullNameAr: 'asc' } },
    });
  }

  async me(user: SessionUser) {
    const guardian = await this.prisma.guardian.findUnique({ where: { personId: user.personId }, include: { person: true, players: { include: { player: { include: { person: true, seasons: { where: { season: { isCurrent: true }, leftAt: null }, include: { category: true } } } } } } } });
    if (!guardian) throw new NotFoundException('Current account is not linked to a guardian profile');
    return guardian;
  }

  async create(dto: CreateGuardianDto, user: SessionUser) {
    const categoryId = await this.currentCategory(dto.playerId);
    this.authorization.assertCategory(user, categoryId, 'guardians.manage');
    const guardian = await this.prisma.$transaction(async (tx) => {
      const person = await tx.person.create({ data: { firstName: dto.firstName, lastName: dto.lastName, fullNameAr: dto.fullNameAr, dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : undefined, phone: dto.phone, emergencyContact: dto.emergencyContact } });
      const created = await tx.guardian.create({ data: { personId: person.id, relationship: dto.relationship } });
      await tx.playerGuardian.create({ data: { guardianId: created.id, playerId: dto.playerId } });
      await tx.auditLog.create({ data: { userId: user.id, action: 'CREATE', entity: 'Guardian', entityId: created.id, after: { personId: person.id, playerId: dto.playerId, relationship: dto.relationship } } });
      return created;
    });
    return this.prisma.guardian.findUniqueOrThrow({ where: { id: guardian.id }, include: { person: true, players: { include: { player: { include: { person: true } } } } } });
  }

  async link(id: string, dto: LinkGuardianPlayerDto, user: SessionUser) {
    const guardian = await this.prisma.guardian.findUnique({ where: { id }, select: { id: true } });
    if (!guardian) throw new NotFoundException('Guardian not found');
    const categoryId = await this.currentCategory(dto.playerId);
    this.authorization.assertCategory(user, categoryId, 'guardians.manage');
    const link = await this.prisma.playerGuardian.upsert({ where: { playerId_guardianId: { playerId: dto.playerId, guardianId: id } }, update: {}, create: { playerId: dto.playerId, guardianId: id } });
    if (dto.relationship) await this.prisma.guardian.update({ where: { id }, data: { relationship: dto.relationship } });
    await this.prisma.auditLog.create({ data: { userId: user.id, action: 'LINK_PLAYER', entity: 'Guardian', entityId: id, after: link } });
    return link;
  }

  private async currentCategory(playerId: string) {
    const membership = await this.prisma.playerSeason.findFirst({ where: { playerId, season: { isCurrent: true }, leftAt: null }, select: { categoryId: true } });
    if (!membership) throw new BadRequestException('Player is not assigned to a current category');
    return membership.categoryId;
  }
}
