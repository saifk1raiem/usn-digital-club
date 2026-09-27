import { Controller, Get, Param, Patch } from '@nestjs/common';
import type { SessionUser } from '@usn/types';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { PrismaService } from '../prisma/prisma.service';

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly prisma: PrismaService) {}
  @Get() @RequirePermissions('notifications.view') async list(@CurrentUser() user: SessionUser) { return { data: await this.prisma.notification.findMany({ where: { userId: user.id }, orderBy: { createdAt: 'desc' }, take: 100 }), meta: { unread: await this.prisma.notification.count({ where: { userId: user.id, readAt: null } }) } }; }
  @Patch('read-all') @RequirePermissions('notifications.view') async readAll(@CurrentUser() user: SessionUser) { const result = await this.prisma.notification.updateMany({ where: { userId: user.id, readAt: null }, data: { readAt: new Date() } }); return { data: { updated: result.count } }; }
  @Patch(':id/read') @RequirePermissions('notifications.view') async read(@Param('id') id: string, @CurrentUser() user: SessionUser) { return { data: await this.prisma.notification.update({ where: { id, userId: user.id }, data: { readAt: new Date() } }) }; }
}
