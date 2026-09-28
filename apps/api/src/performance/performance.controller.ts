import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import type { SessionUser } from '@usn/types';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { CreatePhysicalTestResultDto, CreatePhysicalTestTypeDto, PerformanceQueryDto } from './dto/performance.dto';
import { PerformanceService } from './performance.service';

@Controller('performance')
export class PerformanceController {
  constructor(private readonly performance: PerformanceService) {}
  @Get('test-types') @RequirePermissions('performance.view') async testTypes() { return { data: await this.performance.testTypes() }; }
  @Get('results') @RequirePermissions('performance.view') async results(@CurrentUser() user: SessionUser, @Query() query: PerformanceQueryDto) { return { data: await this.performance.results(user, query) }; }
  @Post('test-types') @RequirePermissions('performance.edit') async createType(@Body() dto: CreatePhysicalTestTypeDto, @CurrentUser() user: SessionUser) { return { data: await this.performance.createType(dto, user) }; }
  @Post('results') @RequirePermissions('performance.edit') async createResult(@Body() dto: CreatePhysicalTestResultDto, @CurrentUser() user: SessionUser) { return { data: await this.performance.createResult(dto, user) }; }
}
