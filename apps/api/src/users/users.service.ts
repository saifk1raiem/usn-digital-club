import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, UserStatus } from '@prisma/client';
import type { SessionUser } from '@usn/types';
import { hash } from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto, RoleGrantDto, SetRolePermissionsDto, UpdateUserAccessDto } from './dto/user-access.dto';

const safeUserSelect = {
  id: true, email: true, status: true, locale: true, createdAt: true, updatedAt: true,
  person: { select: { id: true, fullNameAr: true, firstName: true, lastName: true } },
  roles: { include: { scopes: { include: { category: { select: { id: true, nameAr: true, nameFr: true } } } }, role: { include: { permissions: { include: { permission: true } } } } } },
} satisfies Prisma.UserSelect;

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  list() {
    return this.prisma.user.findMany({ select: safeUserSelect, orderBy: { person: { fullNameAr: 'asc' } } });
  }

  roleCatalog() {
    return this.prisma.role.findMany({ include: { permissions: { include: { permission: true }, orderBy: { permission: { key: 'asc' } } }, _count: { select: { users: true } } }, orderBy: { key: 'asc' } });
  }

  permissionCatalog() { return this.prisma.permission.findMany({ orderBy: { key: 'asc' } }); }

  categoryCatalog() {
    return this.prisma.category.findMany({
      where: { active: true, season: { isCurrent: true } },
      select: { id: true, code: true, nameAr: true, nameFr: true },
      orderBy: { nameAr: 'asc' },
    });
  }

  async create(dto: CreateUserDto, actor: SessionUser) {
    const email = dto.email.trim().toLowerCase();
    if (await this.prisma.user.findFirst({ where: { email: { equals: email, mode: 'insensitive' } } })) throw new ConflictException('Email is already in use');
    const person = await this.prisma.person.findUnique({ where: { id: dto.personId }, select: { id: true, user: { select: { id: true } } } });
    if (!person) throw new NotFoundException('Person not found');
    if (person.user) throw new ConflictException('This person already has a user account');
    const grants = await this.validateGrants(dto.roleGrants);
    await this.assertMembershipProfiles(dto.personId, grants);
    const passwordHash = await hash(dto.password, 12);
    const user = await this.prisma.$transaction(async (tx) => {
      const created = await tx.user.create({ data: { personId: dto.personId, email, passwordHash, locale: dto.locale ?? 'ar', status: dto.status ?? 'ACTIVE' } });
      await this.replaceGrants(tx, created.id, grants);
      const result = await tx.user.findUniqueOrThrow({ where: { id: created.id }, select: safeUserSelect });
      await tx.auditLog.create({ data: { userId: actor.id, action: 'CREATE_USER', entity: 'User', entityId: result.id, after: this.auditUser(result) } });
      return result;
    });
    return user;
  }

  async updateAccess(id: string, dto: UpdateUserAccessDto, actor: SessionUser) {
    const before = await this.prisma.user.findUnique({ where: { id }, select: safeUserSelect });
    if (!before) throw new NotFoundException('User not found');
    const grants = dto.roleGrants ? await this.validateGrants(dto.roleGrants) : undefined;
    if (grants) await this.assertMembershipProfiles(before.person.id, grants);
    const user = await this.prisma.$transaction(async (tx) => {
      await this.assertKeepsSuperAdmin(tx, id, dto.status ?? before.status, grants);
      if (grants) await this.replaceGrants(tx, id, grants);
      await tx.refreshToken.updateMany({ where: { userId: id, revokedAt: null }, data: { revokedAt: new Date() } });
      const result = await tx.user.update({ where: { id }, data: { status: dto.status, locale: dto.locale }, select: safeUserSelect });
      await tx.auditLog.create({ data: { userId: actor.id, action: 'UPDATE_ACCESS', entity: 'User', entityId: id, before: this.auditUser(before), after: this.auditUser(result) } });
      return result;
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
    return user;
  }

  async setRolePermissions(roleKey: string, dto: SetRolePermissionsDto, actor: SessionUser) {
    if (roleKey === 'SUPER_ADMIN' && !dto.permissionKeys.includes('users.manage')) throw new BadRequestException('SUPER_ADMIN must retain users.manage');
    const role = await this.prisma.role.findUnique({ where: { key: roleKey }, include: { permissions: { include: { permission: true } } } });
    if (!role) throw new NotFoundException('Role not found');
    const permissions = await this.prisma.permission.findMany({ where: { key: { in: dto.permissionKeys } } });
    if (permissions.length !== dto.permissionKeys.length) throw new BadRequestException('One or more permissions do not exist');
    const updated = await this.prisma.$transaction(async (tx) => {
      await tx.rolePermission.deleteMany({ where: { roleId: role.id } });
      if (permissions.length) await tx.rolePermission.createMany({ data: permissions.map((permission) => ({ roleId: role.id, permissionId: permission.id })) });
      await tx.refreshToken.updateMany({ where: { user: { roles: { some: { roleId: role.id } } }, revokedAt: null }, data: { revokedAt: new Date() } });
      const result = await tx.role.findUniqueOrThrow({ where: { id: role.id }, include: { permissions: { include: { permission: true } } } });
      await tx.auditLog.create({ data: { userId: actor.id, action: 'UPDATE_ROLE_PERMISSIONS', entity: 'Role', entityId: role.id, before: role.permissions.map((item) => item.permission.key), after: dto.permissionKeys } });
      return result;
    });
    return updated;
  }

  private async validateGrants(input: RoleGrantDto[]) {
    const roleKeys = input.map((grant) => grant.roleKey);
    const categoryIds = [...new Set(input.flatMap((grant) => grant.categoryIds ?? []))];
    const [roles, categories] = await Promise.all([
      this.prisma.role.findMany({ where: { key: { in: roleKeys } }, select: { id: true, key: true } }),
      categoryIds.length ? this.prisma.category.findMany({ where: { id: { in: categoryIds }, active: true, season: { isCurrent: true } }, select: { id: true } }) : [],
    ]);
    if (roles.length !== roleKeys.length) throw new BadRequestException('One or more roles do not exist');
    if (categories.length !== categoryIds.length) throw new BadRequestException('Role scopes must reference active categories in the current season');
    const roleIds = new Map(roles.map((role) => [role.key, role.id]));
    return input.map((grant) => {
      if (grant.isGlobal && grant.categoryIds?.length) throw new BadRequestException('A role grant cannot be global and category-scoped at the same time');
      const membershipRole = grant.roleKey === 'PLAYER' || grant.roleKey === 'PARENT';
      if (membershipRole && (grant.isGlobal || grant.categoryIds?.length)) throw new BadRequestException(`${grant.roleKey} scope is derived from the linked player membership`);
      if (!membershipRole && !grant.isGlobal && !grant.categoryIds?.length) throw new BadRequestException(`${grant.roleKey} requires a club-wide or category scope`);
      return { roleId: roleIds.get(grant.roleKey)!, roleKey: grant.roleKey, isGlobal: grant.isGlobal ?? false, categoryIds: grant.categoryIds ?? [] };
    });
  }

  private async replaceGrants(tx: Prisma.TransactionClient, userId: string, grants: Awaited<ReturnType<UsersService['validateGrants']>>) {
    await tx.userRole.deleteMany({ where: { userId } });
    for (const grant of grants) await tx.userRole.create({ data: { userId, roleId: grant.roleId, isGlobal: grant.isGlobal, scopes: grant.categoryIds.length ? { create: grant.categoryIds.map((categoryId) => ({ categoryId })) } : undefined } });
  }

  private async assertMembershipProfiles(personId: string, grants: Awaited<ReturnType<UsersService['validateGrants']>>) {
    const needsPlayer = grants.some((grant) => grant.roleKey === 'PLAYER');
    const needsGuardian = grants.some((grant) => grant.roleKey === 'PARENT');
    if (!needsPlayer && !needsGuardian) return;
    const person = await this.prisma.person.findUnique({ where: { id: personId }, select: { player: { select: { id: true } }, guardian: { select: { id: true } } } });
    if (needsPlayer && !person?.player) throw new BadRequestException('PLAYER role requires a linked player profile');
    if (needsGuardian && !person?.guardian) throw new BadRequestException('PARENT role requires a linked guardian profile');
  }

  private async assertKeepsSuperAdmin(tx: Prisma.TransactionClient, userId: string, status: UserStatus, grants?: Awaited<ReturnType<UsersService['validateGrants']>>) {
    const superAdmin = await tx.role.findUniqueOrThrow({ where: { key: 'SUPER_ADMIN' }, select: { id: true } });
    const current = await tx.userRole.findUnique({ where: { userId_roleId: { userId, roleId: superAdmin.id } } });
    if (!current?.isGlobal) return;
    const remainsSuperAdmin = status === 'ACTIVE' && (!grants || grants.some((grant) => grant.roleKey === 'SUPER_ADMIN' && grant.isGlobal));
    if (remainsSuperAdmin) return;
    const otherAdmins = await tx.user.count({ where: { id: { not: userId }, status: 'ACTIVE', roles: { some: { isGlobal: true, roleId: superAdmin.id } } } });
    if (!otherAdmins) throw new BadRequestException('The last active global SUPER_ADMIN cannot be removed or disabled');
  }

  private auditUser(user: { id: string; email: string; status: UserStatus; locale: string; roles: Array<{ isGlobal: boolean; role: { key: string }; scopes: Array<{ categoryId: string }> }> }) {
    return { id: user.id, email: user.email, status: user.status, locale: user.locale, roleGrants: user.roles.map((grant) => ({ roleKey: grant.role.key, isGlobal: grant.isGlobal, categoryIds: grant.scopes.map((scope) => scope.categoryId) })) } as Prisma.InputJsonValue;
  }
}
