import { Body, Controller, Get, Param, Patch, Post, Put } from '@nestjs/common';
import type { SessionUser } from '@usn/types';
import { AuthorizationService } from '../auth/authorization.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { CreateUserDto, SetRolePermissionsDto, UpdateUserAccessDto } from './dto/user-access.dto';
import { UsersService } from './users.service';

@Controller('users')
@RequirePermissions('users.manage')
export class UsersController {
  constructor(private readonly users: UsersService, private readonly authorization: AuthorizationService) {}

  @Get() async list(@CurrentUser() actor: SessionUser) { this.assertGlobal(actor); return { data: await this.users.list() }; }
  @Get('roles') async roles(@CurrentUser() actor: SessionUser) { this.assertGlobal(actor); return { data: await this.users.roleCatalog() }; }
  @Get('permissions') async permissions(@CurrentUser() actor: SessionUser) { this.assertGlobal(actor); return { data: await this.users.permissionCatalog() }; }
  @Get('scopes/categories') async categoryScopes(@CurrentUser() actor: SessionUser) { this.assertGlobal(actor); return { data: await this.users.categoryCatalog() }; }
  @Post() async create(@Body() dto: CreateUserDto, @CurrentUser() actor: SessionUser) { this.assertGlobal(actor); return { data: await this.users.create(dto, actor) }; }
  @Patch(':id/access') async updateAccess(@Param('id') id: string, @Body() dto: UpdateUserAccessDto, @CurrentUser() actor: SessionUser) { this.assertGlobal(actor); return { data: await this.users.updateAccess(id, dto, actor) }; }
  @Put('roles/:roleKey/permissions') async setRolePermissions(@Param('roleKey') roleKey: string, @Body() dto: SetRolePermissionsDto, @CurrentUser() actor: SessionUser) { this.assertGlobal(actor); return { data: await this.users.setRolePermissions(roleKey, dto, actor) }; }

  private assertGlobal(actor: SessionUser) { this.authorization.assertGlobalScope(actor, 'users.manage'); }
}
