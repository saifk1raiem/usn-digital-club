import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { compare } from 'bcryptjs';
import { createHash, randomUUID } from 'node:crypto';
import type { Prisma } from '@prisma/client';
import type { PermissionKey, SessionUser, SystemRole } from '@usn/types';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService, private readonly jwt: JwtService, private readonly config: ConfigService) {}

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email.toLowerCase() }, include: this.userIncludes() });
    if (!user || user.status !== 'ACTIVE' || !(await compare(dto.password, user.passwordHash))) throw new UnauthorizedException('Invalid credentials');
    return this.issueTokens(this.toSession(user));
  }

  async refresh(rawToken: string) {
    try {
      const payload = await this.jwt.verifyAsync<{ sub: string; type: string }>(rawToken, { secret: this.refreshSecret() });
      if (payload.type !== 'refresh') throw new Error('Wrong token type');
      const stored = await this.prisma.refreshToken.findUnique({ where: { tokenHash: this.hashToken(rawToken) } });
      if (!stored || stored.revokedAt || stored.expiresAt < new Date()) throw new Error('Revoked token');
      await this.prisma.refreshToken.update({ where: { id: stored.id }, data: { revokedAt: new Date() } });
      const user = await this.prisma.user.findUnique({ where: { id: payload.sub }, include: this.userIncludes() });
      if (!user || user.status !== 'ACTIVE') throw new Error('Inactive user');
      return this.issueTokens(this.toSession(user));
    } catch { throw new UnauthorizedException('Invalid refresh token'); }
  }

  async logout(rawToken: string) {
    await this.prisma.refreshToken.updateMany({ where: { tokenHash: this.hashToken(rawToken), revokedAt: null }, data: { revokedAt: new Date() } });
    return { success: true };
  }

  private async issueTokens(user: SessionUser) {
    const refreshId = randomUUID();
    const [accessToken, refreshToken] = await Promise.all([
      this.jwt.signAsync(user, { secret: this.config.getOrThrow('JWT_ACCESS_SECRET'), expiresIn: this.config.get('JWT_ACCESS_TTL', '15m') }),
      this.jwt.signAsync({ sub: user.id, type: 'refresh', jti: refreshId }, { secret: this.refreshSecret(), expiresIn: this.config.get('JWT_REFRESH_TTL', '30d') }),
    ]);
    const decoded = this.jwt.decode(refreshToken) as { exp: number };
    await this.prisma.refreshToken.create({ data: { id: refreshId, userId: user.id, tokenHash: this.hashToken(refreshToken), expiresAt: new Date(decoded.exp * 1000) } });
    return { accessToken, refreshToken, user };
  }

  private userIncludes(): Prisma.UserInclude {
    return { person: { include: { staffProfile: { include: { assignments: { where: { OR: [{ endDate: null }, { endDate: { gt: new Date() } }] } } } } } }, roles: { include: { role: { include: { permissions: { include: { permission: true } } } } } } };
  }

  private toSession(user: Awaited<ReturnType<PrismaService['user']['findUniqueOrThrow']>> & any): SessionUser {
    const roles = user.roles.map((item: any) => item.role.key) as SystemRole[];
    const permissions = [...new Set(user.roles.flatMap((item: any) => item.role.permissions.map((entry: any) => entry.permission.key)))] as PermissionKey[];
    const categoryIds = [...new Set(user.person.staffProfile?.assignments.map((assignment: any) => assignment.categoryId).filter(Boolean) ?? [])] as string[];
    return { id: user.id, email: user.email, displayName: user.person.fullNameAr, roles, permissions, categoryIds, locale: user.locale === 'fr' ? 'fr' : 'ar' };
  }

  private refreshSecret() { return this.config.getOrThrow<string>('JWT_REFRESH_SECRET'); }
  private hashToken(token: string) { return createHash('sha256').update(token).digest('hex'); }
}
