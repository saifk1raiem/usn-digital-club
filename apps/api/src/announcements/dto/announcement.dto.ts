import { AnnouncementAudience, AnnouncementPriority } from '@prisma/client';
import { ArrayUnique, IsArray, IsBoolean, IsDateString, IsEnum, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateAnnouncementDto {
  @IsString() @MinLength(2) titleAr!: string;
  @IsOptional() @IsString() titleFr?: string;
  @IsString() @MinLength(2) messageAr!: string;
  @IsOptional() @IsString() messageFr?: string;
  @IsEnum(AnnouncementAudience) audience!: AnnouncementAudience;
  @IsOptional() @IsString() categoryId?: string;
  @IsOptional() @IsArray() @ArrayUnique() @IsString({ each: true }) userIds?: string[];
  @IsOptional() @IsEnum(AnnouncementPriority) priority?: AnnouncementPriority;
  @IsOptional() @IsDateString() publishAt?: string;
  @IsOptional() @IsDateString() expiresAt?: string;
  @IsOptional() @IsBoolean() requiresAcknowledgement?: boolean;
}
