import { Controller, Get } from '@nestjs/common';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { PrismaService } from '../prisma/prisma.service';
@Controller('seasons') export class SeasonsController {
  constructor(private readonly prisma: PrismaService) {}
  @Get() @RequirePermissions('dashboard.view') async list() { return { data: await this.prisma.season.findMany({ orderBy: { startsAt: 'desc' } }) }; }
  @Get('current') @RequirePermissions('dashboard.view') async current() { return { data: await this.prisma.season.findFirst({ where: { isCurrent: true }, include: { categories: { where: { active: true } } } }) }; }
}
