import { ForbiddenException, Injectable } from '@nestjs/common';
import type { PermissionKey, SessionUser } from '@usn/types';

@Injectable()
export class AuthorizationService {
  hasGlobalScope(user: SessionUser, permission: PermissionKey) {
    return user.permissionScopes[permission] === null;
  }

  assertGlobalScope(user: SessionUser, permission: PermissionKey) {
    if (!this.hasGlobalScope(user, permission)) throw new ForbiddenException('This action requires a club-wide permission grant');
  }

  scopedCategoryIds(user: SessionUser, permission: PermissionKey, requestedCategoryId?: string) {
    if (requestedCategoryId) {
      this.assertCategory(user, requestedCategoryId, permission);
      return [requestedCategoryId];
    }
    return this.hasGlobalScope(user, permission) ? undefined : user.permissionScopes[permission] ?? [];
  }

  assertCategory(user: SessionUser, categoryId: string, permission: PermissionKey) {
    if (!this.canAccessCategory(user, categoryId, permission)) throw new ForbiddenException('This category is outside your assigned permission scope');
  }

  canAccessCategory(user: SessionUser, categoryId: string, permission: PermissionKey) {
    const scope = user.permissionScopes[permission];
    return scope === null || Boolean(scope?.includes(categoryId));
  }
}
