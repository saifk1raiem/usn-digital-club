import { Module } from '@nestjs/common'; import { AuthModule } from '../auth/auth.module'; import { PlayersController } from './players.controller';
@Module({ imports: [AuthModule], controllers: [PlayersController] }) export class PlayersModule {}
