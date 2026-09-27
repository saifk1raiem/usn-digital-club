import { Body, Controller, Get, Param, Post, Put, Query } from '@nestjs/common';
import type { SessionUser } from '@usn/types';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { CreateTrainingDto, MarkAttendanceDto, TrainingQueryDto, TrainingResponseDto } from './dto/training.dto';
import { TrainingsService } from './trainings.service';

@Controller('trainings')
export class TrainingsController {
  constructor(private readonly trainings: TrainingsService) {}
  @Get() @RequirePermissions('training.view') async list(@CurrentUser() user: SessionUser, @Query() query: TrainingQueryDto) { return { data: await this.trainings.list(user, query) }; }
  @Get('statistics/attendance') @RequirePermissions('training.view') async summary(@CurrentUser() user: SessionUser, @Query('categoryId') categoryId?: string) { return { data: await this.trainings.attendanceSummary(user, categoryId) }; }
  @Get(':id') @RequirePermissions('training.view') async one(@Param('id') id: string, @CurrentUser() user: SessionUser) { return { data: await this.trainings.one(id, user) }; }
  @Post() @RequirePermissions('training.create') async create(@Body() dto: CreateTrainingDto, @CurrentUser() user: SessionUser) { return { data: await this.trainings.create(dto, user) }; }
  @Post(':id/respond') @RequirePermissions('training.view') async respond(@Param('id') id: string, @Body() dto: TrainingResponseDto, @CurrentUser() user: SessionUser) { return { data: await this.trainings.respond(id, dto, user) }; }
  @Put(':id/attendance') @RequirePermissions('training.manageAttendance') async attendance(@Param('id') id: string, @Body() dto: MarkAttendanceDto, @CurrentUser() user: SessionUser) { return { data: await this.trainings.markAttendance(id, dto, user) }; }
}
