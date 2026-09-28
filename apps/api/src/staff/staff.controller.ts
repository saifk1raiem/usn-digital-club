import { BadRequestException, Body, Controller, Get, Post } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import type { SessionUser } from '@usn/types';
import { AuthorizationService } from '../auth/authorization.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { PrismaService } from '../prisma/prisma.service';
import { CreateStaffDto } from './dto/staff.dto';

@Controller('staff')
export class StaffController {
  constructor(private readonly prisma: PrismaService, private readonly authorization: AuthorizationService) {}

  @Get()
  @RequirePermissions('staff.view')
  async list(@CurrentUser() user: SessionUser) {
    const categoryIds = this.authorization.scopedCategoryIds(user, 'staff.view');
    const now = new Date();
    const assignmentScope: Prisma.StaffAssignmentWhereInput = {
      season: { isCurrent: true },
      startDate: { lte: now },
      OR: [{ endDate: null }, { endDate: { gt: now } }],
      ...(categoryIds ? { categoryId: { in: categoryIds } } : {}),
    };
    return { data: await this.prisma.staffProfile.findMany({
      where: { assignments: { some: assignmentScope } },
      include: { person: true, assignments: { where: assignmentScope, include: { position: true, category: true, season: true } } },
      orderBy: { person: { fullNameAr: 'asc' } },
    }) };
  }

  @Get('positions')
  @RequirePermissions('staff.view')
  async positions() { return { data: await this.prisma.staffPosition.findMany({ orderBy: { nameAr: 'asc' } }) }; }

  @Post()
  @RequirePermissions('staff.manage')
  async create(@Body() dto: CreateStaffDto, @CurrentUser() user: SessionUser) {
    if (dto.categoryId) this.authorization.assertCategory(user, dto.categoryId, 'staff.manage');
    else this.authorization.assertGlobalScope(user, 'staff.manage');
    const validTarget = dto.categoryId
      ? await this.prisma.category.findFirst({ where: { id: dto.categoryId, seasonId: dto.seasonId, active: true, season: { isCurrent: true } }, select: { id: true } })
      : await this.prisma.season.findFirst({ where: { id: dto.seasonId, isCurrent: true }, select: { id: true } });
    if (!validTarget) throw new BadRequestException('Staff assignment must target the current season and an active matching category');
    const staff = await this.prisma.$transaction(async (tx) => {
      const person = await tx.person.create({ data: { firstName: dto.firstName, lastName: dto.lastName, fullNameAr: dto.fullNameAr, phone: dto.phone } });
      return tx.staffProfile.create({ data: { personId: person.id, assignments: { create: { seasonId: dto.seasonId, categoryId: dto.categoryId, positionId: dto.positionId, startDate: new Date(dto.startDate), isPrimary: dto.isPrimary ?? true } } }, include: { person: true, assignments: true } });
    });
    await this.prisma.auditLog.create({ data: { userId: user.id, action: 'CREATE', entity: 'StaffProfile', entityId: staff.id, after: staff } });
    return { data: staff };
  }
}
