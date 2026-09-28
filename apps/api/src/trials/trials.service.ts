import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { RegistrationStatus, TrialStatus } from '@prisma/client';
import type { SessionUser } from '@usn/types';
import { AuthorizationService } from '../auth/authorization.service';
import { PrismaService } from '../prisma/prisma.service';
import { ConvertTrialCandidateDto, CreateTrialCandidateDto, CreateTrialEventDto, TrialEvaluationDto, TrialQueryDto, UpdateTrialStatusDto } from './dto/trial.dto';

@Injectable()
export class TrialsService {
  constructor(private readonly prisma: PrismaService, private readonly authorization: AuthorizationService) {}

  async list(user: SessionUser, query: TrialQueryDto) {
    const categoryIds = this.authorization.scopedCategoryIds(user, 'trials.view', query.categoryId);
    return this.prisma.trialEvent.findMany({
      where: { ...(categoryIds ? { categoryId: { in: categoryIds } } : {}) },
      include: { category: true, facility: true, candidates: { include: { evaluations: true }, orderBy: { fullName: 'asc' } } },
      orderBy: { startsAt: 'desc' },
    });
  }

  async one(id: string, user: SessionUser) {
    const event = await this.prisma.trialEvent.findUnique({ where: { id }, include: { category: true, facility: true, candidates: { include: { evaluations: { include: { evaluator: { include: { person: true } } } } }, orderBy: { fullName: 'asc' } } } });
    if (!event) throw new NotFoundException('Trial event not found');
    this.authorization.assertCategory(user, event.categoryId, 'trials.view');
    return event;
  }

  async createEvent(dto: CreateTrialEventDto, user: SessionUser) {
    this.authorization.assertCategory(user, dto.categoryId, 'trials.manage');
    const category = await this.prisma.category.findFirst({ where: { id: dto.categoryId, active: true, season: { isCurrent: true } } });
    if (!category) throw new BadRequestException('Trials must belong to an active current category');
    const event = await this.prisma.trialEvent.create({ data: { categoryId: dto.categoryId, birthYear: dto.birthYear, startsAt: new Date(dto.startsAt), facilityId: dto.facilityId, venue: dto.venue, registrationFee: dto.registrationFee, maxParticipants: dto.maxParticipants, description: dto.description }, include: { category: true, facility: true } });
    await this.prisma.auditLog.create({ data: { userId: user.id, action: 'CREATE', entity: 'TrialEvent', entityId: event.id, after: event } });
    return event;
  }

  async addCandidate(eventId: string, dto: CreateTrialCandidateDto, user: SessionUser) {
    const event = await this.eventScope(eventId, user, 'trials.manage');
    if (event.maxParticipants) {
      const count = await this.prisma.trialCandidate.count({ where: { trialEventId: eventId } });
      if (count >= event.maxParticipants) throw new BadRequestException('Trial event has reached its participant limit');
    }
    const candidate = await this.prisma.trialCandidate.create({ data: { trialEventId: eventId, fullName: dto.fullName, dateOfBirth: new Date(dto.dateOfBirth), position: dto.position, phone: dto.phone, guardianName: dto.guardianName, previousClub: dto.previousClub, photoUrl: dto.photoUrl, notes: dto.notes } });
    await this.prisma.auditLog.create({ data: { userId: user.id, action: 'CREATE', entity: 'TrialCandidate', entityId: candidate.id, after: candidate } });
    return candidate;
  }

  async evaluate(candidateId: string, dto: TrialEvaluationDto, user: SessionUser) {
    const candidate = await this.candidateScope(candidateId, user, 'trials.manage');
    const actorStaff = await this.prisma.staffProfile.findUnique({ where: { personId: user.personId }, select: { id: true } });
    const evaluation = await this.prisma.trialEvaluation.create({ data: { candidateId, technical: dto.technical, physical: dto.physical, tactical: dto.tactical, attitude: dto.attitude, notes: dto.notes, evaluatorId: dto.evaluatorStaffId ?? actorStaff?.id } });
    if (candidate.status === TrialStatus.REGISTERED || candidate.status === TrialStatus.ATTENDED) await this.prisma.trialCandidate.update({ where: { id: candidateId }, data: { status: TrialStatus.FIRST_EVALUATION } });
    await this.prisma.auditLog.create({ data: { userId: user.id, action: 'EVALUATE', entity: 'TrialCandidate', entityId: candidateId, after: evaluation } });
    return evaluation;
  }

  async updateStatus(candidateId: string, dto: UpdateTrialStatusDto, user: SessionUser) {
    const before = await this.candidateScope(candidateId, user, 'trials.manage');
    const candidate = await this.prisma.trialCandidate.update({ where: { id: candidateId }, data: { status: dto.status } });
    await this.prisma.auditLog.create({ data: { userId: user.id, action: 'STATUS_CHANGE', entity: 'TrialCandidate', entityId: candidateId, before, after: candidate } });
    return candidate;
  }

  async convert(candidateId: string, dto: ConvertTrialCandidateDto, user: SessionUser) {
    const candidate = await this.candidateScope(candidateId, user, 'trials.manage');
    this.authorization.assertCategory(user, candidate.trialEvent.categoryId, 'players.create');
    if (candidate.status !== TrialStatus.ACCEPTED) throw new BadRequestException('Only accepted candidates can be converted');
    if (candidate.convertedPlayerId) throw new BadRequestException('Candidate is already linked to a player');
    const category = await this.prisma.category.findUniqueOrThrow({ where: { id: candidate.trialEvent.categoryId } });
    const player = await this.prisma.$transaction(async (tx) => {
      const person = await tx.person.create({ data: { firstName: dto.firstName, lastName: dto.lastName, fullNameAr: dto.fullNameAr, dateOfBirth: candidate.dateOfBirth, phone: candidate.phone } });
      const created = await tx.player.create({ data: { personId: person.id, position: candidate.position, status: 'ACTIVE' } });
      await tx.playerSeason.create({ data: { playerId: created.id, seasonId: category.seasonId, categoryId: category.id, jerseyNumber: dto.jerseyNumber, registrationStatus: dto.registrationStatus ?? RegistrationStatus.PENDING } });
      await tx.trialCandidate.update({ where: { id: candidateId }, data: { convertedPlayerId: created.id } });
      await tx.auditLog.create({ data: { userId: user.id, action: 'CONVERT_TO_PLAYER', entity: 'TrialCandidate', entityId: candidateId, after: { playerId: created.id } } });
      return created;
    });
    return player;
  }

  private async eventScope(eventId: string, user: SessionUser, permission: 'trials.view' | 'trials.manage') {
    const event = await this.prisma.trialEvent.findUnique({ where: { id: eventId } });
    if (!event) throw new NotFoundException('Trial event not found');
    this.authorization.assertCategory(user, event.categoryId, permission);
    return event;
  }

  private async candidateScope(candidateId: string, user: SessionUser, permission: 'trials.view' | 'trials.manage') {
    const candidate = await this.prisma.trialCandidate.findUnique({ where: { id: candidateId }, include: { trialEvent: true } });
    if (!candidate) throw new NotFoundException('Trial candidate not found');
    this.authorization.assertCategory(user, candidate.trialEvent.categoryId, permission);
    return candidate;
  }
}
