import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import type { SessionUser } from '@usn/types';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { AnnouncementsService } from './announcements.service';
import { CreateAnnouncementDto } from './dto/announcement.dto';

@Controller('announcements')
export class AnnouncementsController {
  constructor(private readonly announcements: AnnouncementsService) {}
  @Get() @RequirePermissions('announcements.view') async list(@CurrentUser() user: SessionUser) { return { data: await this.announcements.list(user) }; }
  @Post() @RequirePermissions('announcements.publish') async create(@Body() dto: CreateAnnouncementDto, @CurrentUser() user: SessionUser) { return { data: await this.announcements.create(dto, user) }; }
  @Post(':id/read') @RequirePermissions('announcements.view') async read(@Param('id') id: string, @CurrentUser() user: SessionUser) { return { data: await this.announcements.markRead(id, user, false) }; }
  @Post(':id/acknowledge') @RequirePermissions('announcements.view') async acknowledge(@Param('id') id: string, @CurrentUser() user: SessionUser) { return { data: await this.announcements.markRead(id, user, true) }; }
}
