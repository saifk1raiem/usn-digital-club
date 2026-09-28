import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import type { SessionUser } from '@usn/types';
import { AuthService } from './auth.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(config: ConfigService, private readonly auth: AuthService) { super({ jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(), ignoreExpiration: false, secretOrKey: config.getOrThrow('JWT_ACCESS_SECRET') }); }
  async validate(payload: { sub?: string; type?: string }): Promise<SessionUser> {
    if (!payload.sub || payload.type !== 'access') throw new UnauthorizedException('Invalid access token');
    return this.auth.sessionForUser(payload.sub);
  }
}
