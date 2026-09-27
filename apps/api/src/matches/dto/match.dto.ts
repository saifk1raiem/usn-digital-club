import { MatchEventType, MatchType, VenueSide } from '@prisma/client';
import { Type } from 'class-transformer';
import { ArrayMinSize, IsArray, IsBoolean, IsDateString, IsEnum, IsInt, IsOptional, IsString, Max, Min, ValidateNested } from 'class-validator';

export class CreateMatchDto {
  @IsString() seasonId!: string;
  @IsString() categoryId!: string;
  @IsOptional() @IsString() facilityId?: string;
  @IsString() competition!: string;
  @IsString() opponent!: string;
  @IsEnum(VenueSide) venueSide!: VenueSide;
  @IsOptional() @IsString() stadium?: string;
  @IsDateString() kickoffAt!: string;
  @IsOptional() @IsDateString() meetingAt?: string;
  @IsEnum(MatchType) type!: MatchType;
  @IsOptional() @IsString() formation?: string;
  @IsOptional() @IsString() tacticalNotes?: string;
}

export class MatchQueryDto {
  @IsOptional() @IsString() categoryId?: string;
  @IsOptional() @IsDateString() from?: string;
  @IsOptional() @IsDateString() to?: string;
}

export class SquadPlayerDto {
  @IsString() playerId!: string;
  @IsOptional() @IsBoolean() isStarter?: boolean;
  @IsOptional() @IsString() positionCode?: string;
  @IsOptional() @IsInt() @Min(1) @Max(99) shirtNumber?: number;
}

export class UpdateSquadDto {
  @IsArray() @ArrayMinSize(1) @ValidateNested({ each: true }) @Type(() => SquadPlayerDto)
  players!: SquadPlayerDto[];
  @IsOptional() @IsString() formation?: string;
  @IsOptional() @IsString() tacticalNotes?: string;
}

export class CreateMatchEventDto {
  @IsEnum(MatchEventType) type!: MatchEventType;
  @IsInt() @Min(0) @Max(130) minute!: number;
  @IsOptional() @IsString() playerId?: string;
  @IsOptional() @IsString() relatedPlayerId?: string;
  @IsOptional() @IsString() notes?: string;
}

export class UpdateResultDto {
  @IsInt() @Min(0) homeScore!: number;
  @IsInt() @Min(0) awayScore!: number;
  @IsOptional() @IsString() coachNotes?: string;
}
