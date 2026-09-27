import { Controller, Get } from '@nestjs/common';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { PrismaService } from '../prisma/prisma.service';
@Controller('facilities') export class FacilitiesController { constructor(private readonly prisma: PrismaService) {} @Get() @RequirePermissions('dashboard.view') async list() { return { data: await this.prisma.facility.findMany({ orderBy: { nameAr: 'asc' } }) }; } }
