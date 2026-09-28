import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { ForbiddenException, type ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { PermissionKey, SessionUser } from '@usn/types';
import { PermissionsGuard } from './guards/permissions.guard';

const actor = (permissions: PermissionKey[]): SessionUser => ({
  id: 'user-1', personId: 'person-1', email: 'staff@usn.tn', displayName: 'Staff', locale: 'ar',
  roles: ['HEAD_COACH'], permissions, categoryIds: ['senior'], guardianPlayerIds: [], permissionScopes: {},
});

const context = (user: SessionUser) => ({
  getHandler: () => undefined,
  getClass: () => undefined,
  switchToHttp: () => ({ getRequest: () => ({ user }) }),
}) as unknown as ExecutionContext;

describe('PermissionsGuard', () => {
  it('allows requests only when every declared permission is present', () => {
    const reflector = { getAllAndOverride: (key: string) => key === 'permissions' ? ['trials.manage', 'players.create'] : undefined } as unknown as Reflector;
    const guard = new PermissionsGuard(reflector);
    assert.equal(guard.canActivate(context(actor(['trials.manage', 'players.create']))), true);
  });

  it('denies a scoped feature when its explicit permission is missing', () => {
    const reflector = { getAllAndOverride: (key: string) => key === 'permissions' ? ['guardians.manage'] : undefined } as unknown as Reflector;
    const guard = new PermissionsGuard(reflector);
    assert.throws(() => guard.canActivate(context(actor(['guardians.view']))), ForbiddenException);
  });
});
