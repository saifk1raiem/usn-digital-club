import { Controller, Get } from '@nestjs/common';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { PrismaService } from '../prisma/prisma.service';
@Controller('dashboard') export class DashboardController {
  constructor(private readonly prisma: PrismaService) {}
  @Get('overview') @RequirePermissions('dashboard.view') async overview() {
    const now = new Date(); const inNinetyDays = new Date(now.getTime() + 90 * 86_400_000);
    const [season, players, categories, staff, injured, upcomingTrainings, upcomingMatches, expiringDocuments, expiringContracts, equipmentIssues] = await Promise.all([
      this.prisma.season.findFirst({ where: { isCurrent: true } }),
      this.prisma.player.count({ where: { seasons: { some: { season: { isCurrent: true } } }, status: { not: 'LEFT_CLUB' } } }),
      this.prisma.category.count({ where: { season: { isCurrent: true }, active: true } }),
      this.prisma.staffProfile.count({ where: { assignments: { some: { season: { isCurrent: true } } } } }),
      this.prisma.player.count({ where: { status: 'INJURED' } }),
      this.prisma.trainingSession.findMany({ where: { startsAt: { gte: now } }, include: { category: true, facility: true }, orderBy: { startsAt: 'asc' }, take: 4 }),
      this.prisma.match.findMany({ where: { kickoffAt: { gte: now } }, include: { category: true }, orderBy: { kickoffAt: 'asc' }, take: 4 }),
      this.prisma.document.count({ where: { expiryDate: { gte: now, lte: inNinetyDays } } }),
      this.prisma.contract.count({ where: { endsAt: { gte: now, lte: inNinetyDays } } }),
      this.prisma.equipment.count({ where: { OR: [{ damaged: { gt: 0 } }, { missing: { gt: 0 } }] } }),
    ]);
    return { data: { season, stats: { players, categories, staff, injured, expiringDocuments, expiringContracts, equipmentIssues }, upcomingTrainings, upcomingMatches } };
  }
}
