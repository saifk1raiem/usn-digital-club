import { Controller, Get } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import type { SessionUser } from '@usn/types';
import { AuthorizationService } from '../auth/authorization.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { PrismaService } from '../prisma/prisma.service';

@Controller('dashboard')
export class DashboardController {
  constructor(private readonly prisma: PrismaService, private readonly authorization: AuthorizationService) {}

  @Get('overview')
  @RequirePermissions('dashboard.view')
  async overview(@CurrentUser() user: SessionUser) {
    const now = new Date(); const inNinetyDays = new Date(now.getTime() + 90 * 86_400_000);
    const categoryIds = this.authorization.scopedCategoryIds(user, 'dashboard.view');
    const categoryWhere = categoryIds ? { categoryId: { in: categoryIds } } : {};
    const visiblePlayerIds = [...new Set([...(user.playerId ? [user.playerId] : []), ...user.guardianPlayerIds])];
    const memberOnlyTrainings = (user.roles.includes('PLAYER') || user.roles.includes('PARENT')) && !user.permissions.includes('training.create') && !user.permissions.includes('training.manageAttendance');
    const rosterWhere: Prisma.PlayerWhereInput = { seasons: { some: { season: { isCurrent: true }, leftAt: null, ...categoryWhere } }, status: { not: 'LEFT_CLUB' } };
    const intersectScope = (permission: 'staff.view' | 'medical.viewAvailability') => {
      if (!user.permissions.includes(permission)) return [] as string[];
      const permissionIds = this.authorization.scopedCategoryIds(user, permission);
      if (categoryIds === undefined) return permissionIds;
      if (permissionIds === undefined) return categoryIds;
      return categoryIds.filter((id) => permissionIds.includes(id));
    };
    const staffCategoryIds = intersectScope('staff.view');
    const medicalCategoryIds = intersectScope('medical.viewAvailability');
    const canViewStaff = user.permissions.includes('staff.view') && (staffCategoryIds === undefined || staffCategoryIds.length > 0);
    const canViewAvailability = user.permissions.includes('medical.viewAvailability') && (medicalCategoryIds === undefined || medicalCategoryIds.length > 0);
    const canViewContracts = user.permissions.includes('contracts.view') && this.authorization.hasGlobalScope(user, 'contracts.view');
    const canManageEquipment = user.permissions.includes('equipment.manage') && this.authorization.hasGlobalScope(user, 'equipment.manage');
    const [season, players, categories, staff, injured, upcomingTrainings, upcomingMatches, expiringDocuments, expiringContracts, equipmentIssues] = await Promise.all([
      this.prisma.season.findFirst({ where: { isCurrent: true } }),
      this.prisma.player.count({ where: rosterWhere }),
      this.prisma.category.count({ where: { season: { isCurrent: true }, active: true, ...(categoryIds ? { id: { in: categoryIds } } : {}) } }),
      canViewStaff ? this.prisma.staffProfile.count({ where: { assignments: { some: { season: { isCurrent: true }, ...(staffCategoryIds ? { categoryId: { in: staffCategoryIds } } : {}) } } } }) : 0,
      canViewAvailability ? this.prisma.player.count({ where: { seasons: { some: { season: { isCurrent: true }, leftAt: null, ...(medicalCategoryIds ? { categoryId: { in: medicalCategoryIds } } : {}) } }, status: 'INJURED' } }) : 0,
      this.prisma.trainingSession.findMany({ where: { startsAt: { gte: now }, ...categoryWhere, ...(memberOnlyTrainings ? { attendance: { some: { playerId: { in: visiblePlayerIds } } } } : {}) }, include: { category: true, facility: true, _count: { select: { attendance: true } } }, orderBy: { startsAt: 'asc' }, take: 4 }),
      this.prisma.match.findMany({ where: { kickoffAt: { gte: now }, ...categoryWhere }, include: { category: true }, orderBy: { kickoffAt: 'asc' }, take: 4 }),
      canViewContracts ? this.prisma.document.count({ where: { expiryDate: { gte: now, lte: inNinetyDays } } }) : 0,
      canViewContracts ? this.prisma.contract.count({ where: { endsAt: { gte: now, lte: inNinetyDays } } }) : 0,
      canManageEquipment ? this.prisma.equipment.count({ where: { OR: [{ damaged: { gt: 0 } }, { missing: { gt: 0 } }] } }) : 0,
    ]);
    return { data: { season, stats: { players, categories, staff, injured, expiringDocuments, expiringContracts, equipmentIssues }, upcomingTrainings, upcomingMatches } };
  }
}
