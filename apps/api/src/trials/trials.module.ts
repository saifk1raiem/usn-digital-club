import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { TrialsController } from './trials.controller';
import { TrialsService } from './trials.service';

@Module({ imports: [AuthModule], controllers: [TrialsController], providers: [TrialsService] })
export class TrialsModule {}
