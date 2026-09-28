import { BadRequestException, Injectable } from '@nestjs/common';
import type { SessionUser } from '@usn/types';
import { AuthorizationService } from '../auth/authorization.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePhysicalTestResultDto, CreatePhysicalTestTypeDto, PerformanceQueryDto } from './dto/performance.dto';

@Injectable()
export class PerformanceService {
  constructor(private readonly prisma: PrismaService, private readonly authorization: AuthorizationService) {}

  testTypes() {
    return this.prisma.physicalTestType.findMany({ where: { active: true }, orderBy: { nameAr: 'asc' } });
  }

  async results(user: SessionUser, query: PerformanceQueryDto) {
    const categoryIds = this.authorization.scopedCategoryIds(user, 'performance.view', query.categoryId);
    if (query.playerId) {
      const categoryId = await this.currentCategory(query.playerId);
      this.authorization.assertCategory(user, categoryId, 'performance.view');
    }
    return this.prisma.physicalTestResult.findMany({
      where: {
        ...(query.playerId ? { playerId: query.playerId } : {}),
        ...(query.testTypeId ? { testTypeId: query.testTypeId } : {}),
        player: { seasons: { some: { season: { isCurrent: true }, leftAt: null, ...(categoryIds ? { categoryId: { in: categoryIds } } : {}) } } },
      },
      include: { testType: true, player: { include: { person: true, seasons: { where: { season: { isCurrent: true }, leftAt: null }, include: { category: true } } } }, responsibleStaff: { include: { person: true } } },
      orderBy: { measuredAt: 'desc' },
    });
  }

  async createType(dto: CreatePhysicalTestTypeDto, user: SessionUser) {
    this.authorization.assertGlobalScope(user, 'performance.edit');
    const test = await this.prisma.physicalTestType.upsert({ where: { code: dto.code }, update: dto, create: dto });
    await this.prisma.auditLog.create({ data: { userId: user.id, action: 'UPSERT', entity: 'PhysicalTestType', entityId: test.id, after: test } });
    return test;
  }

  async createResult(dto: CreatePhysicalTestResultDto, user: SessionUser) {
    const categoryId = await this.currentCategory(dto.playerId);
    this.authorization.assertCategory(user, categoryId, 'performance.edit');
    const type = await this.prisma.physicalTestType.findFirst({ where: { id: dto.testTypeId, active: true } });
    if (!type) throw new BadRequestException('Physical test type is not active');
    const actorStaff = await this.prisma.staffProfile.findUnique({ where: { personId: user.personId }, select: { id: true } });
    const result = await this.prisma.physicalTestResult.create({
      data: { playerId: dto.playerId, testTypeId: dto.testTypeId, value: dto.value, unit: dto.unit ?? type.defaultUnit, measuredAt: new Date(dto.measuredAt), responsibleStaffId: dto.responsibleStaffId ?? actorStaff?.id, notes: dto.notes },
      include: { testType: true, player: { include: { person: true } }, responsibleStaff: { include: { person: true } } },
    });
    await this.prisma.auditLog.create({ data: { userId: user.id, action: 'CREATE', entity: 'PhysicalTestResult', entityId: result.id, after: result } });
    return result;
  }

  private async currentCategory(playerId: string) {
    const membership = await this.prisma.playerSeason.findFirst({ where: { playerId, season: { isCurrent: true }, leftAt: null }, select: { categoryId: true } });
    if (!membership) throw new BadRequestException('Player is not assigned to a current category');
    return membership.categoryId;
  }
}
