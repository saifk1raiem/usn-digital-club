import { BadRequestException, Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import type { SessionUser } from '@usn/types';
import { AuthorizationService } from '../auth/authorization.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePlayerDto, UpdatePlayerStatusDto } from './dto/player.dto';

@Controller('players') export class PlayersController {
  constructor(private readonly prisma: PrismaService, private readonly authorization: AuthorizationService) {}
  @Get() @RequirePermissions('players.view') async list(@CurrentUser() user: SessionUser, @Query('categoryId') categoryId?: string) {
    const scopedIds = this.authorization.scopedCategoryIds(user, 'players.view', categoryId);
    return { data: await this.prisma.player.findMany({
      where: { status: { not: 'LEFT_CLUB' }, seasons: { some: { ...(scopedIds ? { categoryId: { in: scopedIds } } : {}), season: { isCurrent: true }, leftAt: null } } },
      include: { person: true, seasons: { where: { season: { isCurrent: true }, leftAt: null }, include: { category: true } } }, orderBy: { person: { fullNameAr: 'asc' } },
    }) };
  }
  @Get('team') @RequirePermissions('team.view') async team(@CurrentUser() user: SessionUser) {
    const operationalUser = user.permissions.includes('players.view');
    let where: Prisma.PlayerWhereInput;
    if (operationalUser) {
      const teamCategoryIds = this.authorization.scopedCategoryIds(user, 'team.view');
      const playerCategoryIds = this.authorization.scopedCategoryIds(user, 'players.view');
      const categoryIds = teamCategoryIds === undefined ? playerCategoryIds : playerCategoryIds === undefined ? teamCategoryIds : teamCategoryIds.filter((id) => playerCategoryIds.includes(id));
      where = categoryIds ? { seasons: { some: { categoryId: { in: categoryIds }, season: { isCurrent: true }, leftAt: null } } } : { seasons: { some: { season: { isCurrent: true }, leftAt: null } } };
    } else if (user.playerId) {
      const memberships = await this.prisma.playerSeason.findMany({ where: { playerId: user.playerId, season: { isCurrent: true }, leftAt: null }, select: { categoryId: true } });
      where = { seasons: { some: { categoryId: { in: memberships.map((item) => item.categoryId) }, season: { isCurrent: true }, leftAt: null } } };
    } else if (user.roles.includes('PARENT')) {
      where = { id: { in: user.guardianPlayerIds } };
    } else {
      where = { id: { in: [] } };
    }
    return { data: await this.prisma.player.findMany({ where, select: { id: true, position: true, person: { select: { fullNameAr: true, firstName: true, lastName: true, photoUrl: true } }, seasons: { where: { season: { isCurrent: true }, leftAt: null }, select: { jerseyNumber: true, category: { select: { id: true, nameAr: true, nameFr: true } } } } }, orderBy: { person: { fullNameAr: 'asc' } } }) };
  }
  @Get(':id') @RequirePermissions('players.view') async one(@Param('id') id: string, @CurrentUser() user: SessionUser) {
    const player = await this.prisma.player.findUniqueOrThrow({ where: { id }, include: { person: true, seasons: { include: { season: true, category: true } }, guardians: { include: { guardian: { include: { person: true } } } } } });
    const current = player.seasons.find((item) => item.season.isCurrent && !item.leftAt);
    if (current) this.authorization.assertCategory(user, current.categoryId, 'players.view'); else this.authorization.assertGlobalScope(user, 'players.view');
    return { data: player };
  }
  @Post() @RequirePermissions('players.create') async create(@Body() dto: CreatePlayerDto, @CurrentUser() user: SessionUser) {
    this.authorization.assertCategory(user, dto.categoryId, 'players.create');
    const category = await this.prisma.category.findFirst({ where: { id: dto.categoryId, seasonId: dto.seasonId, active: true, season: { isCurrent: true } }, select: { id: true } });
    if (!category) throw new BadRequestException('Category must be active and belong to the current selected season');
    const { seasonId, categoryId, jerseyNumber, registrationStatus, dateOfBirth, ...profile } = dto;
    const player = await this.prisma.$transaction(async (tx) => {
      const person = await tx.person.create({ data: { firstName: profile.firstName, lastName: profile.lastName, fullNameAr: profile.fullNameAr, dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null, nationality: profile.nationality, phone: profile.phone, emergencyContact: profile.emergencyContact } });
      const created = await tx.player.create({ data: { personId: person.id, position: profile.position, preferredFoot: profile.preferredFoot, heightCm: profile.heightCm, weightKg: profile.weightKg, federationLicenseNumber: profile.federationLicenseNumber } });
      await tx.playerSeason.create({ data: { playerId: created.id, seasonId, categoryId, jerseyNumber, registrationStatus } });
      return created;
    });
    await this.prisma.auditLog.create({ data: { userId: user.id, action: 'CREATE', entity: 'Player', entityId: player.id, after: player } });
    return { data: player };
  }
  @Patch(':id/status') @RequirePermissions('players.edit') async updateStatus(@Param('id') id: string, @Body() dto: UpdatePlayerStatusDto, @CurrentUser() user: SessionUser) {
    const before = await this.prisma.player.findUniqueOrThrow({ where: { id }, include: { seasons: { where: { season: { isCurrent: true } } } } });
    if (before.seasons[0]) this.authorization.assertCategory(user, before.seasons[0].categoryId, 'players.edit'); else this.authorization.assertGlobalScope(user, 'players.edit');
    const player = await this.prisma.player.update({ where: { id }, data: { status: dto.status } });
    await this.prisma.auditLog.create({ data: { userId: user.id, action: 'STATUS_CHANGE', entity: 'Player', entityId: id, before, after: player } });
    return { data: player };
  }
}
