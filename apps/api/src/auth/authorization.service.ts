import { ForbiddenException, Injectable } from '@nestjs/common';
import type { SessionUser } from '@usn/types';

@Injectable()
export class AuthorizationService {
  assertCategory(user: SessionUser, categoryId: string) {
    const global = user.roles.some((role) => ['SUPER_ADMIN', 'PRESIDENT', 'TECHNICAL_DIRECTOR'].includes(role));
    if (!global && !user.categoryIds.includes(categoryId)) throw new ForbiddenException('This category is outside your assigned scope');
  }
}
