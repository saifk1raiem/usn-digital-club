import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import type { SessionUser } from '@usn/types';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { CreateGuardianDto, GuardianQueryDto, LinkGuardianPlayerDto } from './dto/guardian.dto';
import { GuardiansService } from './guardians.service';

@Controller('guardians')
export class GuardiansController {
  constructor(private readonly guardians: GuardiansService) {}
  @Get('me') async me(@CurrentUser() user: SessionUser) { return { data: await this.guardians.me(user) }; }
  @Get() @RequirePermissions('guardians.view') async list(@CurrentUser() user: SessionUser, @Query() query: GuardianQueryDto) { return { data: await this.guardians.list(user, query) }; }
  @Post() @RequirePermissions('guardians.manage') async create(@Body() dto: CreateGuardianDto, @CurrentUser() user: SessionUser) { return { data: await this.guardians.create(dto, user) }; }
  @Post(':id/players') @RequirePermissions('guardians.manage') async link(@Param('id') id: string, @Body() dto: LinkGuardianPlayerDto, @CurrentUser() user: SessionUser) { return { data: await this.guardians.link(id, dto, user) }; }
}
