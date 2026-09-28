import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import type { SessionUser } from '@usn/types';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { ConvertTrialCandidateDto, CreateTrialCandidateDto, CreateTrialEventDto, TrialEvaluationDto, TrialQueryDto, UpdateTrialStatusDto } from './dto/trial.dto';
import { TrialsService } from './trials.service';

@Controller('trials')
export class TrialsController {
  constructor(private readonly trials: TrialsService) {}
  @Get() @RequirePermissions('trials.view') async list(@CurrentUser() user: SessionUser, @Query() query: TrialQueryDto) { return { data: await this.trials.list(user, query) }; }
  @Get(':id') @RequirePermissions('trials.view') async one(@Param('id') id: string, @CurrentUser() user: SessionUser) { return { data: await this.trials.one(id, user) }; }
  @Post() @RequirePermissions('trials.manage') async create(@Body() dto: CreateTrialEventDto, @CurrentUser() user: SessionUser) { return { data: await this.trials.createEvent(dto, user) }; }
  @Post(':id/candidates') @RequirePermissions('trials.manage') async candidate(@Param('id') id: string, @Body() dto: CreateTrialCandidateDto, @CurrentUser() user: SessionUser) { return { data: await this.trials.addCandidate(id, dto, user) }; }
  @Post('candidates/:id/evaluations') @RequirePermissions('trials.manage') async evaluate(@Param('id') id: string, @Body() dto: TrialEvaluationDto, @CurrentUser() user: SessionUser) { return { data: await this.trials.evaluate(id, dto, user) }; }
  @Patch('candidates/:id/status') @RequirePermissions('trials.manage') async status(@Param('id') id: string, @Body() dto: UpdateTrialStatusDto, @CurrentUser() user: SessionUser) { return { data: await this.trials.updateStatus(id, dto, user) }; }
  @Post('candidates/:id/convert') @RequirePermissions('trials.manage', 'players.create') async convert(@Param('id') id: string, @Body() dto: ConvertTrialCandidateDto, @CurrentUser() user: SessionUser) { return { data: await this.trials.convert(id, dto, user) }; }
}
