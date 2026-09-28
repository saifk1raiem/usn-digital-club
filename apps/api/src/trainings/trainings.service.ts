import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { SessionUser } from '@usn/types';
import { AuthorizationService } from '../auth/authorization.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTrainingDto, MarkAttendanceDto, TrainingQueryDto, TrainingResponseDto } from './dto/training.dto';

@Injectable()
export class TrainingsService {
  constructor(private readonly prisma: PrismaService, private readonly authorization: AuthorizationService) {}

  async list(user: SessionUser, query: TrainingQueryDto) {
    const scopedIds = this.authorization.scopedCategoryIds(user, 'training.view', query.categoryId);
    const visiblePlayerIds = this.visiblePlayerIds(user);
    const memberOnly = this.hasMemberOnlyAccess(user);
    const startsAt: Prisma.DateTimeFilter = {};
    if (query.from) startsAt.gte = new Date(query.from);
    if (query.to) startsAt.lte = new Date(query.to);
    return this.prisma.trainingSession.findMany({
      where: { ...(scopedIds ? { categoryId: { in: scopedIds } } : {}), ...(Object.keys(startsAt).length ? { startsAt } : {}), ...(memberOnly ? { attendance: { some: { playerId: { in: visiblePlayerIds } } } } : {}) },
      include: { category: true, facility: true, _count: { select: { attendance: true } } },
      orderBy: { startsAt: 'asc' },
    });
  }

  async one(id: string, user: SessionUser) {
    const target = await this.prisma.trainingSession.findUnique({ where: { id }, select: { categoryId: true } });
    if (!target) throw new NotFoundException('Training session not found');
    this.authorization.assertCategory(user, target.categoryId, 'training.view');
    const canManageAttendance = user.permissions.includes('training.manageAttendance') && this.authorization.canAccessCategory(user, target.categoryId, 'training.manageAttendance');
    const canViewRoster = canManageAttendance || (user.permissions.includes('training.create') && this.authorization.canAccessCategory(user, target.categoryId, 'training.create'));
    const visiblePlayerIds = this.visiblePlayerIds(user);
    if (this.hasMemberOnlyAccess(user)) {
      const assigned = await this.prisma.trainingAttendance.count({ where: { trainingId: id, playerId: { in: visiblePlayerIds } } });
      if (!assigned) throw new NotFoundException('Training session not found');
    }
    const training = await this.prisma.trainingSession.findUnique({
      where: { id }, include: { category: true, season: true, facility: true, attendance: { where: canViewRoster ? {} : { playerId: { in: visiblePlayerIds } }, include: { player: { include: { person: true } } }, orderBy: { player: { person: { fullNameAr: 'asc' } } } } },
    });
    if (!training) throw new NotFoundException('Training session not found');
    return canManageAttendance ? training : { ...training, attendance: training.attendance.map(({ coachNote: _coachNote, ...attendance }) => attendance) };
  }

  async create(dto: CreateTrainingDto, user: SessionUser) {
    this.authorization.assertCategory(user, dto.categoryId, 'training.create');
    const startsAt = new Date(dto.startsAt); const endsAt = new Date(dto.endsAt);
    if (endsAt <= startsAt) throw new BadRequestException('End time must be after start time');
    const category = await this.prisma.category.findFirst({ where: { id: dto.categoryId, seasonId: dto.seasonId, active: true } });
    if (!category) throw new BadRequestException('Category does not belong to the selected season');
    const eligiblePlayers = await this.prisma.playerSeason.findMany({ where: { seasonId: dto.seasonId, categoryId: dto.categoryId, leftAt: null, player: { status: { not: 'LEFT_CLUB' } } }, select: { playerId: true } });
    const eligibleIds = new Set(eligiblePlayers.map(({ playerId }) => playerId));
    const playerIds = dto.playerIds ?? [...eligibleIds];
    if (playerIds.some((playerId) => !eligibleIds.has(playerId))) throw new BadRequestException('Training contains a player outside this category');
    const training = await this.prisma.trainingSession.create({
      data: { seasonId: dto.seasonId, categoryId: dto.categoryId, facilityId: dto.facilityId, startsAt, endsAt, type: dto.type, intensity: dto.intensity, objective: dto.objective, notes: dto.notes, attendance: { createMany: { data: playerIds.map((playerId) => ({ playerId })) } } },
      include: { category: true, facility: true, _count: { select: { attendance: true } } },
    });
    await Promise.all([this.notifyPlayers(playerIds, training.id, 'TRAINING_CREATED', 'حصة تدريبية جديدة', `تمت برمجة حصة يوم ${startsAt.toLocaleDateString('ar-TN')}`), this.prisma.auditLog.create({ data: { userId: user.id, action: 'CREATE', entity: 'TrainingSession', entityId: training.id, after: training } })]);
    return training;
  }

  async respond(id: string, dto: TrainingResponseDto, user: SessionUser) {
    const player = await this.prisma.player.findFirst({ where: { person: { user: { id: user.id } } } });
    if (!player) throw new BadRequestException('Current user is not linked to a player');
    const training = await this.prisma.trainingSession.findUnique({ where: { id } });
    if (!training) throw new NotFoundException('Training session not found');
    this.authorization.assertCategory(user, training.categoryId, 'training.view');
    const eligible = await this.prisma.playerSeason.findFirst({ where: { playerId: player.id, seasonId: training.seasonId, categoryId: training.categoryId, leftAt: null } });
    if (!eligible) throw new BadRequestException('Player is not registered in this training category');
    const assigned = await this.prisma.trainingAttendance.findUnique({ where: { trainingId_playerId: { trainingId: id, playerId: player.id } }, select: { playerId: true } });
    if (!assigned) throw new BadRequestException('Player is not assigned to this training session');
    return this.prisma.trainingAttendance.upsert({
      where: { trainingId_playerId: { trainingId: id, playerId: player.id } },
      update: { response: dto.response, responseNote: dto.note, respondedAt: new Date() },
      create: { trainingId: id, playerId: player.id, response: dto.response, responseNote: dto.note, respondedAt: new Date() },
    });
  }

  async markAttendance(id: string, dto: MarkAttendanceDto, user: SessionUser) {
    const training = await this.prisma.trainingSession.findUnique({ where: { id } });
    if (!training) throw new NotFoundException('Training session not found');
    this.authorization.assertCategory(user, training.categoryId, 'training.manageAttendance');
    const allowed = new Set((await this.prisma.playerSeason.findMany({ where: { categoryId: training.categoryId, seasonId: training.seasonId }, select: { playerId: true } })).map((item) => item.playerId));
    if (dto.records.some((record) => !allowed.has(record.playerId))) throw new BadRequestException('Attendance contains a player outside this category');
    await this.prisma.$transaction(dto.records.map((record) => this.prisma.trainingAttendance.upsert({ where: { trainingId_playerId: { trainingId: id, playerId: record.playerId } }, update: { status: record.status, coachNote: record.coachNote, markedAt: new Date() }, create: { trainingId: id, playerId: record.playerId, status: record.status, coachNote: record.coachNote, markedAt: new Date() } })));
    await this.prisma.auditLog.create({ data: { userId: user.id, action: 'MARK_ATTENDANCE', entity: 'TrainingSession', entityId: id, after: dto.records as unknown as Prisma.InputJsonValue } });
    return this.one(id, user);
  }

  async attendanceSummary(user: SessionUser, categoryId?: string) {
    const scopedIds = this.authorization.scopedCategoryIds(user, 'training.view', categoryId);
    const visiblePlayerIds = this.visiblePlayerIds(user);
    const sessions = await this.prisma.trainingSession.findMany({ where: { ...(scopedIds ? { categoryId: { in: scopedIds } } : {}), startsAt: { lte: new Date() }, ...(this.hasMemberOnlyAccess(user) ? { attendance: { some: { playerId: { in: visiblePlayerIds } } } } : {}) }, select: { categoryId: true, attendance: { select: { playerId: true, status: true } } } });
    const statuses = sessions.flatMap((session) => session.attendance.filter((item) => this.authorization.canAccessCategory(user, session.categoryId, 'training.manageAttendance') || visiblePlayerIds.includes(item.playerId))).filter((item) => item.status);
    const present = statuses.filter((item) => item.status === 'PRESENT' || item.status === 'LATE').length;
    return { sessions: sessions.length, marked: statuses.length, present, attendanceRate: statuses.length ? Math.round((present / statuses.length) * 100) : 0 };
  }

  private async notifyPlayers(playerIds: string[], entityId: string, type: string, title: string, body: string) {
    const users = await this.prisma.user.findMany({ where: { status: 'ACTIVE', person: { player: { id: { in: playerIds } } } }, select: { id: true } });
    if (users.length) await this.prisma.notification.createMany({ data: users.map(({ id: userId }) => ({ userId, type, title, body, data: { entityId } })) });
  }

  private visiblePlayerIds(user: SessionUser) {
    return [...new Set([...(user.playerId ? [user.playerId] : []), ...user.guardianPlayerIds])];
  }

  private hasMemberOnlyAccess(user: SessionUser) {
    return (user.roles.includes('PLAYER') || user.roles.includes('PARENT')) && !user.permissions.includes('training.create') && !user.permissions.includes('training.manageAttendance');
  }
}
