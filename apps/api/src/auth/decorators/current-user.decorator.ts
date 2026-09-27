import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { SessionUser } from '@usn/types';
export const CurrentUser = createParamDecorator((_data: unknown, context: ExecutionContext): SessionUser => context.switchToHttp().getRequest<{ user: SessionUser }>().user);
