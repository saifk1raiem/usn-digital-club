import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import type { SessionUser } from '@usn/types';
import { AuthorizationService } from '../auth/authorization.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePlayerDto, UpdatePlayerStatusDto } from './dto/player.dto';

@Controller('players') export class PlayersController {
  constructor(private readonly prisma: PrismaService, private readonly authorization: AuthorizationService) {}
  @Get() @RequirePermissions('players.view') async list(@CurrentUser() user: SessionUser, @Query('categoryId') categoryId?: string) {
    if (categoryId) this.authorization.assertCategory(user, categoryId);
    const isGlobal = user.roles.some((role) => ['SUPER_ADMIN','PRESIDENT','TECHNICAL_DIRECTOR'].includes(role));
    const scopedIds = categoryId ? [categoryId] : isGlobal ? undefined : user.categoryIds;
    return { data: await this.prisma.player.findMany({
      where: scopedIds ? { seasons: { some: { categoryId: { in: scopedIds }, season: { isCurrent: true } } } } : { seasons: { some: { season: { isCurrent: true } } } },
      include: { person: true, seasons: { where: { season: { isCurrent: true } }, include: { category: true } } }, orderBy: { person: { fullNameAr: 'asc' } },
    }) };
  }
  @Get(':id') @RequirePermissions('players.view') async one(@Param('id') id: string, @CurrentUser() user: SessionUser) {
    const player = await this.prisma.player.findUniqueOrThrow({ where: { id }, include: { person: true, seasons: { include: { season: true, category: true } }, guardians: { include: { guardian: { include: { person: true } } } } } });
    const current = player.seasons.find((item) => item.season.isCurrent); if (current) this.authorization.assertCategory(user, current.categoryId);
    return { data: player };
  }
  @Post() @RequirePermissions('players.create') async create(@Body() dto: CreatePlayerDto, @CurrentUser() user: SessionUser) {
    this.authorization.assertCategory(user, dto.categoryId);
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
    if (before.seasons[0]) this.authorization.assertCategory(user, before.seasons[0].categoryId);
    const player = await this.prisma.player.update({ where: { id }, data: { status: dto.status } });
    await this.prisma.auditLog.create({ data: { userId: user.id, action: 'STATUS_CHANGE', entity: 'Player', entityId: id, before, after: player } });
    return { data: player };
  }
}
