import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import type { SessionUser } from '@usn/types';
import { CurrentUser } from './decorators/current-user.decorator';
import { Public } from './decorators/public.decorator';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RefreshDto } from './dto/refresh.dto';

@ApiTags('auth') @Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}
  @Public() @Post('login') login(@Body() dto: LoginDto) { return this.auth.login(dto); }
  @Public() @Post('refresh') refresh(@Body() dto: RefreshDto) { return this.auth.refresh(dto.refreshToken); }
  @Post('logout') logout(@Body() dto: RefreshDto) { return this.auth.logout(dto.refreshToken); }
  @Get('me') me(@CurrentUser() user: SessionUser) { return { data: user }; }
}
