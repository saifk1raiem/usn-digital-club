import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { AnnouncementAudience, Prisma } from '@prisma/client';
import type { SessionUser } from '@usn/types';
import { AuthorizationService } from '../auth/authorization.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAnnouncementDto } from './dto/announcement.dto';

@Injectable()
export class AnnouncementsService {
  constructor(private readonly prisma: PrismaService, private readonly authorization: AuthorizationService) {}

  async list(user: SessionUser) {
    const now = new Date();
    const staffRole = user.roles.some((role) => !['PLAYER','PARENT','VIEWER'].includes(role));
    const visibility: Prisma.AnnouncementWhereInput[] = [
      { audience: 'CLUB' },
      ...(user.categoryIds.length ? [{ audience: 'CATEGORY' as const, categoryId: { in: user.categoryIds } }] : []),
      ...(staffRole ? [{ audience: 'STAFF' as const }] : []),
      ...(user.roles.includes('PLAYER') ? [{ audience: 'PLAYERS' as const }] : []),
      ...(user.roles.includes('PARENT') ? [{ audience: 'PARENTS' as const }] : []),
      { audience: 'USERS', recipients: { some: { userId: user.id } } },
    ];
    const global = user.roles.some((role) => ['SUPER_ADMIN','PRESIDENT','MANAGEMENT','TECHNICAL_DIRECTOR'].includes(role));
    return this.prisma.announcement.findMany({
      where: { publishAt: { lte: now }, OR: [{ expiresAt: null }, { expiresAt: { gt: now } }], ...(!global ? { AND: [{ OR: visibility }] } : {}) },
      include: { category: true, author: { select: { id: true, person: { select: { fullNameAr: true, firstName: true, lastName: true } } } }, reads: { where: { userId: user.id } }, _count: { select: { reads: true, recipients: true } } },
      orderBy: [{ priority: 'desc' }, { publishAt: 'desc' }],
    });
  }

  async create(dto: CreateAnnouncementDto, user: SessionUser) {
    if (dto.audience === 'CATEGORY' && !dto.categoryId) throw new BadRequestException('Category audience requires a category');
    if (dto.audience === 'USERS' && !dto.userIds?.length) throw new BadRequestException('Specific-user audience requires recipients');
    if (dto.categoryId) this.authorization.assertCategory(user, dto.categoryId);
    const publishAt = dto.publishAt ? new Date(dto.publishAt) : new Date();
    const expiresAt = dto.expiresAt ? new Date(dto.expiresAt) : null;
    if (expiresAt && expiresAt <= publishAt) throw new BadRequestException('Expiry must be after publication');
    const targetUserIds = await this.resolveAudience(dto.audience, dto.categoryId, dto.userIds);
    const announcement = await this.prisma.announcement.create({
      data: { titleAr: dto.titleAr, titleFr: dto.titleFr, messageAr: dto.messageAr, messageFr: dto.messageFr, audience: dto.audience, categoryId: dto.categoryId, priority: dto.priority ?? 'NORMAL', publishAt, expiresAt, requiresAcknowledgement: dto.requiresAcknowledgement ?? false, authorId: user.id, recipients: targetUserIds.length ? { createMany: { data: targetUserIds.map((userId) => ({ userId })) } } : undefined },
      include: { category: true, _count: { select: { recipients: true } } },
    });
    if (targetUserIds.length) await this.prisma.notification.createMany({ data: targetUserIds.map((userId) => ({ userId, type: 'ANNOUNCEMENT', title: dto.titleAr, body: dto.messageAr.slice(0, 180), data: { entityId: announcement.id, priority: announcement.priority } })) });
    await this.prisma.auditLog.create({ data: { userId: user.id, action: 'PUBLISH', entity: 'Announcement', entityId: announcement.id, after: announcement } });
    return announcement;
  }

  async markRead(id: string, user: SessionUser, acknowledge: boolean) {
    const announcement = await this.prisma.announcement.findUnique({ where: { id }, include: { recipients: { where: { userId: user.id } } } });
    if (!announcement) throw new NotFoundException('Announcement not found');
    const global = user.roles.some((role) => ['SUPER_ADMIN','PRESIDENT','MANAGEMENT','TECHNICAL_DIRECTOR'].includes(role));
    const staff = user.roles.some((role) => !['PLAYER','PARENT','VIEWER'].includes(role));
    const allowed = global || announcement.authorId === user.id || announcement.audience === 'CLUB'
      || (announcement.audience === 'CATEGORY' && Boolean(announcement.categoryId && user.categoryIds.includes(announcement.categoryId)))
      || (announcement.audience === 'STAFF' && staff) || (announcement.audience === 'PLAYERS' && user.roles.includes('PLAYER'))
      || (announcement.audience === 'PARENTS' && user.roles.includes('PARENT')) || (announcement.audience === 'USERS' && announcement.recipients.length > 0);
    if (!allowed || announcement.publishAt > new Date() || (announcement.expiresAt && announcement.expiresAt <= new Date())) throw new ForbiddenException();
    return this.prisma.announcementRead.upsert({ where: { announcementId_userId: { announcementId: id, userId: user.id } }, update: { ...(acknowledge ? { acknowledgedAt: new Date() } : {}) }, create: { announcementId: id, userId: user.id, ...(acknowledge ? { acknowledgedAt: new Date() } : {}) } });
  }

  private async resolveAudience(audience: AnnouncementAudience, categoryId?: string, userIds?: string[]) {
    if (audience === 'USERS') return userIds ?? [];
    const where: Prisma.UserWhereInput = { status: 'ACTIVE' };
    if (audience === 'CATEGORY') where.OR = [
      { person: { staffProfile: { assignments: { some: { categoryId, endDate: null } } } } },
      { person: { player: { seasons: { some: { categoryId, leftAt: null } } } } },
      { person: { guardian: { players: { some: { player: { seasons: { some: { categoryId, leftAt: null } } } } } } } },
    ];
    if (audience === 'STAFF') where.person = { staffProfile: { isNot: null } };
    if (audience === 'PLAYERS') where.person = { player: { isNot: null } };
    if (audience === 'PARENTS') where.person = { guardian: { isNot: null } };
    return (await this.prisma.user.findMany({ where, select: { id: true } })).map(({ id }) => id);
  }
}
