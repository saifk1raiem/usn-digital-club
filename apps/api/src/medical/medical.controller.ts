import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import type { SessionUser } from '@usn/types';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { AddMedicalUpdateDto, CreateMedicalCaseDto, MedicalQueryDto } from './dto/medical.dto';
import { MedicalService } from './medical.service';

@Controller('medical')
export class MedicalController {
  constructor(private readonly medical: MedicalService) {}
  @Get() @RequirePermissions('medical.viewAvailability') async list(@CurrentUser() user: SessionUser, @Query() query: MedicalQueryDto) { return { data: await this.medical.list(user, query) }; }
  @Get(':id') @RequirePermissions('medical.viewAvailability') async one(@Param('id') id: string, @CurrentUser() user: SessionUser) { return { data: await this.medical.one(id, user) }; }
  @Post() @RequirePermissions('medical.edit') async create(@Body() dto: CreateMedicalCaseDto, @CurrentUser() user: SessionUser) { return { data: await this.medical.create(dto, user) }; }
  @Post(':id/updates') @RequirePermissions('medical.edit') async update(@Param('id') id: string, @Body() dto: AddMedicalUpdateDto, @CurrentUser() user: SessionUser) { return { data: await this.medical.addUpdate(id, dto, user) }; }
}
