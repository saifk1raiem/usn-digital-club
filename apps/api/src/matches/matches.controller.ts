import { Body, Controller, Get, Param, Patch, Post, Put, Query } from '@nestjs/common';
import type { SessionUser } from '@usn/types';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { CreateMatchDto, CreateMatchEventDto, MatchQueryDto, UpdateResultDto, UpdateSquadDto } from './dto/match.dto';
import { MatchesService } from './matches.service';

@Controller('matches')
export class MatchesController {
  constructor(private readonly matches: MatchesService) {}
  @Get() @RequirePermissions('matches.view') async list(@CurrentUser() user: SessionUser, @Query() query: MatchQueryDto) { return { data: await this.matches.list(user, query) }; }
  @Get(':id') @RequirePermissions('matches.view') async one(@Param('id') id: string, @CurrentUser() user: SessionUser) { return { data: await this.matches.one(id, user) }; }
  @Post() @RequirePermissions('matches.create') async create(@Body() dto: CreateMatchDto, @CurrentUser() user: SessionUser) { return { data: await this.matches.create(dto, user) }; }
  @Put(':id/squad') @RequirePermissions('matches.selectSquad') async squad(@Param('id') id: string, @Body() dto: UpdateSquadDto, @CurrentUser() user: SessionUser) { return { data: await this.matches.updateSquad(id, dto, user) }; }
  @Post(':id/events') @RequirePermissions('matches.create') async event(@Param('id') id: string, @Body() dto: CreateMatchEventDto, @CurrentUser() user: SessionUser) { return { data: await this.matches.addEvent(id, dto, user) }; }
  @Patch(':id/result') @RequirePermissions('matches.create') async result(@Param('id') id: string, @Body() dto: UpdateResultDto, @CurrentUser() user: SessionUser) { return { data: await this.matches.updateResult(id, dto, user) }; }
}
