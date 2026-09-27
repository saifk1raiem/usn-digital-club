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
    if (query.categoryId) this.authorization.assertCategory(user, query.categoryId);
    const scopedIds = this.scopedCategoryIds(user, query.categoryId);
    const startsAt: Prisma.DateTimeFilter = {};
    if (query.from) startsAt.gte = new Date(query.from);
    if (query.to) startsAt.lte = new Date(query.to);
    return this.prisma.trainingSession.findMany({
      where: { ...(scopedIds ? { categoryId: { in: scopedIds } } : {}), ...(Object.keys(startsAt).length ? { startsAt } : {}) },
      include: { category: true, facility: true, _count: { select: { attendance: true } } },
      orderBy: { startsAt: 'asc' },
    });
  }

  async one(id: string, user: SessionUser) {
    const training = await this.prisma.trainingSession.findUnique({
      where: { id }, include: { category: true, season: true, facility: true, attendance: { include: { player: { include: { person: true } } }, orderBy: { player: { person: { fullNameAr: 'asc' } } } } },
    });
    if (!training) throw new NotFoundException('Training session not found');
    this.authorization.assertCategory(user, training.categoryId);
    return training;
  }

  async create(dto: CreateTrainingDto, user: SessionUser) {
    this.authorization.assertCategory(user, dto.categoryId);
    const startsAt = new Date(dto.startsAt); const endsAt = new Date(dto.endsAt);
    if (endsAt <= startsAt) throw new BadRequestException('End time must be after start time');
    const category = await this.prisma.category.findFirst({ where: { id: dto.categoryId, seasonId: dto.seasonId, active: true } });
    if (!category) throw new BadRequestException('Category does not belong to the selected season');
    const players = await this.prisma.playerSeason.findMany({ where: { seasonId: dto.seasonId, categoryId: dto.categoryId, leftAt: null }, select: { playerId: true } });
    const training = await this.prisma.trainingSession.create({
      data: { seasonId: dto.seasonId, categoryId: dto.categoryId, facilityId: dto.facilityId, startsAt, endsAt, type: dto.type, intensity: dto.intensity, objective: dto.objective, notes: dto.notes, attendance: { createMany: { data: players.map(({ playerId }) => ({ playerId })) } } },
      include: { category: true, facility: true, _count: { select: { attendance: true } } },
    });
    await Promise.all([this.notifyCategoryPlayers(dto.categoryId, dto.seasonId, training.id, 'TRAINING_CREATED', 'حصة تدريبية جديدة', `تمت برمجة حصة يوم ${startsAt.toLocaleDateString('ar-TN')}`), this.prisma.auditLog.create({ data: { userId: user.id, action: 'CREATE', entity: 'TrainingSession', entityId: training.id, after: training } })]);
    return training;
  }

  async respond(id: string, dto: TrainingResponseDto, user: SessionUser) {
    const player = await this.prisma.player.findFirst({ where: { person: { user: { id: user.id } } } });
    if (!player) throw new BadRequestException('Current user is not linked to a player');
    const training = await this.prisma.trainingSession.findUnique({ where: { id } });
    if (!training) throw new NotFoundException('Training session not found');
    const eligible = await this.prisma.playerSeason.findFirst({ where: { playerId: player.id, seasonId: training.seasonId, categoryId: training.categoryId, leftAt: null } });
    if (!eligible) throw new BadRequestException('Player is not registered in this training category');
    return this.prisma.trainingAttendance.upsert({
      where: { trainingId_playerId: { trainingId: id, playerId: player.id } },
      update: { response: dto.response, responseNote: dto.note, respondedAt: new Date() },
      create: { trainingId: id, playerId: player.id, response: dto.response, responseNote: dto.note, respondedAt: new Date() },
    });
  }

  async markAttendance(id: string, dto: MarkAttendanceDto, user: SessionUser) {
    const training = await this.prisma.trainingSession.findUnique({ where: { id } });
    if (!training) throw new NotFoundException('Training session not found');
    this.authorization.assertCategory(user, training.categoryId);
    const allowed = new Set((await this.prisma.playerSeason.findMany({ where: { categoryId: training.categoryId, seasonId: training.seasonId }, select: { playerId: true } })).map((item) => item.playerId));
    if (dto.records.some((record) => !allowed.has(record.playerId))) throw new BadRequestException('Attendance contains a player outside this category');
    await this.prisma.$transaction(dto.records.map((record) => this.prisma.trainingAttendance.upsert({ where: { trainingId_playerId: { trainingId: id, playerId: record.playerId } }, update: { status: record.status, coachNote: record.coachNote, markedAt: new Date() }, create: { trainingId: id, playerId: record.playerId, status: record.status, coachNote: record.coachNote, markedAt: new Date() } })));
    await this.prisma.auditLog.create({ data: { userId: user.id, action: 'MARK_ATTENDANCE', entity: 'TrainingSession', entityId: id, after: dto.records as unknown as Prisma.InputJsonValue } });
    return this.one(id, user);
  }

  async attendanceSummary(user: SessionUser, categoryId?: string) {
    if (categoryId) this.authorization.assertCategory(user, categoryId);
    const scopedIds = this.scopedCategoryIds(user, categoryId);
    const sessions = await this.prisma.trainingSession.findMany({ where: { ...(scopedIds ? { categoryId: { in: scopedIds } } : {}), startsAt: { lte: new Date() } }, select: { attendance: { select: { status: true } } } });
    const statuses = sessions.flatMap((session) => session.attendance).filter((item) => item.status);
    const present = statuses.filter((item) => item.status === 'PRESENT' || item.status === 'LATE').length;
    return { sessions: sessions.length, marked: statuses.length, present, attendanceRate: statuses.length ? Math.round((present / statuses.length) * 100) : 0 };
  }

  private scopedCategoryIds(user: SessionUser, categoryId?: string) {
    if (categoryId) return [categoryId];
    return user.roles.some((role) => ['SUPER_ADMIN','PRESIDENT','TECHNICAL_DIRECTOR'].includes(role)) ? undefined : user.categoryIds;
  }

  private async notifyCategoryPlayers(categoryId: string, seasonId: string, entityId: string, type: string, title: string, body: string) {
    const users = await this.prisma.user.findMany({ where: { status: 'ACTIVE', person: { player: { seasons: { some: { categoryId, seasonId } } } } }, select: { id: true } });
    if (users.length) await this.prisma.notification.createMany({ data: users.map(({ id: userId }) => ({ userId, type, title, body, data: { entityId } })) });
  }
}
