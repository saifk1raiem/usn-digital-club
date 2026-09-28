import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import type { SessionUser } from '@usn/types';
import { AuthorizationService } from '../auth/authorization.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCategoryDto } from './dto/category.dto';

@Controller('categories')
export class CategoriesController {
  constructor(private readonly prisma: PrismaService, private readonly authorization: AuthorizationService) {}

  @Get()
  @RequirePermissions('players.view')
  async list(@CurrentUser() user: SessionUser) {
    const categoryIds = this.authorization.scopedCategoryIds(user, 'players.view');
    return { data: await this.prisma.category.findMany({
      where: { active: true, season: { isCurrent: true }, ...(categoryIds ? { id: { in: categoryIds } } : {}) },
      include: { _count: { select: { playerSeasons: { where: { leftAt: null } }, staffAssignments: true } } },
      orderBy: { nameAr: 'asc' },
    }) };
  }

  @Post()
  @RequirePermissions('categories.manage')
  async create(@Body() dto: CreateCategoryDto, @CurrentUser() user: SessionUser) {
    this.authorization.assertGlobalScope(user, 'categories.manage');
    const season = await this.prisma.season.findUniqueOrThrow({ where: { id: dto.seasonId } });
    const category = await this.prisma.category.create({ data: { ...dto, clubId: season.clubId } });
    await this.prisma.auditLog.create({ data: { userId: user.id, action: 'CREATE', entity: 'Category', entityId: category.id, after: category } });
    return { data: category };
  }

  @Patch(':id/archive')
  @RequirePermissions('categories.manage')
  async archive(@Param('id') id: string, @CurrentUser() user: SessionUser) {
    const before = await this.prisma.category.findUniqueOrThrow({ where: { id } });
    this.authorization.assertCategory(user, before.id, 'categories.manage');
    const category = await this.prisma.category.update({ where: { id }, data: { active: false, archivedAt: new Date() } });
    await this.prisma.auditLog.create({ data: { userId: user.id, action: 'ARCHIVE', entity: 'Category', entityId: id, before, after: category } });
    return { data: category };
  }
}
