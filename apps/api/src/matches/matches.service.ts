import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { SessionUser } from '@usn/types';
import { AuthorizationService } from '../auth/authorization.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMatchDto, CreateMatchEventDto, MatchQueryDto, UpdateResultDto, UpdateSquadDto } from './dto/match.dto';

@Injectable()
export class MatchesService {
  constructor(private readonly prisma: PrismaService, private readonly authorization: AuthorizationService) {}

  async list(user: SessionUser, query: MatchQueryDto) {
    if (query.categoryId) this.authorization.assertCategory(user, query.categoryId);
    const scopedIds = this.scopedCategoryIds(user, query.categoryId);
    const kickoffAt: Prisma.DateTimeFilter = {};
    if (query.from) kickoffAt.gte = new Date(query.from);
    if (query.to) kickoffAt.lte = new Date(query.to);
    return this.prisma.match.findMany({ where: { ...(scopedIds ? { categoryId: { in: scopedIds } } : {}), ...(Object.keys(kickoffAt).length ? { kickoffAt } : {}) }, include: { category: true, facility: true, _count: { select: { squad: true, events: true } } }, orderBy: { kickoffAt: 'asc' } });
  }

  async one(id: string, user: SessionUser) {
    const match = await this.prisma.match.findUnique({ where: { id }, include: { category: true, season: true, facility: true, squad: { include: { player: { include: { person: true } } }, orderBy: [{ isStarter: 'desc' }, { shirtNumber: 'asc' }] }, events: { include: { player: { include: { person: true } } }, orderBy: { minute: 'asc' } }, playerStats: true } });
    if (!match) throw new NotFoundException('Match not found');
    this.authorization.assertCategory(user, match.categoryId);
    return match;
  }

  async create(dto: CreateMatchDto, user: SessionUser) {
    this.authorization.assertCategory(user, dto.categoryId);
    const category = await this.prisma.category.findFirst({ where: { id: dto.categoryId, seasonId: dto.seasonId, active: true } });
    if (!category) throw new BadRequestException('Category does not belong to the selected season');
    const match = await this.prisma.match.create({ data: { ...dto, kickoffAt: new Date(dto.kickoffAt), meetingAt: dto.meetingAt ? new Date(dto.meetingAt) : null }, include: { category: true, facility: true } });
    await this.prisma.auditLog.create({ data: { userId: user.id, action: 'CREATE', entity: 'Match', entityId: match.id, after: match } });
    return match;
  }

  async updateSquad(id: string, dto: UpdateSquadDto, user: SessionUser) {
    const match = await this.prisma.match.findUnique({ where: { id } });
    if (!match) throw new NotFoundException('Match not found');
    this.authorization.assertCategory(user, match.categoryId);
    const uniqueIds = new Set(dto.players.map((player) => player.playerId));
    if (uniqueIds.size !== dto.players.length) throw new BadRequestException('A player can appear only once in the squad');
    const eligible = new Set((await this.prisma.playerSeason.findMany({ where: { seasonId: match.seasonId, categoryId: match.categoryId, playerId: { in: [...uniqueIds] } }, select: { playerId: true } })).map((item) => item.playerId));
    if (eligible.size !== uniqueIds.size) throw new BadRequestException('Squad contains an ineligible player');
    await this.prisma.$transaction([
      this.prisma.matchSquad.deleteMany({ where: { matchId: id } }),
      this.prisma.matchSquad.createMany({ data: dto.players.map((player) => ({ matchId: id, playerId: player.playerId, selected: true, isStarter: player.isStarter ?? false, positionCode: player.positionCode, shirtNumber: player.shirtNumber })) }),
      this.prisma.match.update({ where: { id }, data: { formation: dto.formation, tacticalNotes: dto.tacticalNotes } }),
    ]);
    const selectedUsers = await this.prisma.user.findMany({ where: { person: { player: { id: { in: [...uniqueIds] } } } }, select: { id: true } });
    if (selectedUsers.length) await this.prisma.notification.createMany({ data: selectedUsers.map(({ id: userId }) => ({ userId, type: 'MATCH_SELECTION', title: 'دعوة للمباراة', body: `تمت دعوتك لمباراة ضد ${match.opponent}`, data: { entityId: id } })) });
    await this.prisma.auditLog.create({ data: { userId: user.id, action: 'SELECT_SQUAD', entity: 'Match', entityId: id, after: dto.players as unknown as Prisma.InputJsonValue } });
    return this.one(id, user);
  }

  async addEvent(id: string, dto: CreateMatchEventDto, user: SessionUser) {
    const match = await this.prisma.match.findUnique({ where: { id }, include: { squad: true } });
    if (!match) throw new NotFoundException('Match not found');
    this.authorization.assertCategory(user, match.categoryId);
    if (dto.playerId && !match.squad.some((item) => item.playerId === dto.playerId)) throw new BadRequestException('Event player is not in the match squad');
    const event = await this.prisma.matchEvent.create({ data: { matchId: id, ...dto } });
    await this.prisma.auditLog.create({ data: { userId: user.id, action: 'ADD_EVENT', entity: 'Match', entityId: id, after: event } });
    return event;
  }

  async updateResult(id: string, dto: UpdateResultDto, user: SessionUser) {
    const before = await this.prisma.match.findUnique({ where: { id } });
    if (!before) throw new NotFoundException('Match not found');
    this.authorization.assertCategory(user, before.categoryId);
    const match = await this.prisma.match.update({ where: { id }, data: dto });
    await this.prisma.auditLog.create({ data: { userId: user.id, action: 'UPDATE_RESULT', entity: 'Match', entityId: id, before, after: match } });
    return match;
  }

  private scopedCategoryIds(user: SessionUser, categoryId?: string) {
    if (categoryId) return [categoryId];
    return user.roles.some((role) => ['SUPER_ADMIN','PRESIDENT','TECHNICAL_DIRECTOR'].includes(role)) ? undefined : user.categoryIds;
  }
}
