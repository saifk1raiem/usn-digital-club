import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { SessionUser } from '@usn/types';
import { ForbiddenException } from '@nestjs/common';
import { AuthorizationService } from './authorization.service';

const user = (permissionScopes: SessionUser['permissionScopes']): SessionUser => ({
  id: 'user-1', personId: 'person-1', email: 'coach@usn.tn', displayName: 'Coach', locale: 'ar',
  roles: ['HEAD_COACH'], permissions: ['training.view', 'training.create'], categoryIds: ['senior'],
  guardianPlayerIds: [], permissionScopes,
});

describe('AuthorizationService', () => {
  const authorization = new AuthorizationService();

  it('keeps the category scope bound to the permission that granted it', () => {
    const actor = user({ 'training.view': ['senior', 'u17'], 'training.create': ['senior'] });
    assert.deepEqual(authorization.scopedCategoryIds(actor, 'training.view'), ['senior', 'u17']);
    assert.deepEqual(authorization.scopedCategoryIds(actor, 'training.create'), ['senior']);
    assert.throws(() => authorization.assertCategory(actor, 'u17', 'training.create'), ForbiddenException);
  });

  it('represents an explicit club-wide grant with null', () => {
    const actor = user({ 'training.view': null, 'training.create': ['senior'] });
    assert.equal(authorization.scopedCategoryIds(actor, 'training.view'), undefined);
    assert.doesNotThrow(() => authorization.assertCategory(actor, 'u15', 'training.view'));
    assert.throws(() => authorization.assertGlobalScope(actor, 'training.create'), ForbiddenException);
  });

  it('denies a permission with no category grant instead of falling back to another role scope', () => {
    const actor = user({ 'training.view': ['senior'], 'training.create': [] });
    assert.deepEqual(authorization.scopedCategoryIds(actor, 'training.create'), []);
    assert.equal(authorization.canAccessCategory(actor, 'senior', 'training.create'), false);
  });
});
