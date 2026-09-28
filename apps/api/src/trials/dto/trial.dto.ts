import { RegistrationStatus, TrialStatus } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsDateString, IsEnum, IsInt, IsNumber, IsOptional, IsPositive, IsString, Max, Min } from 'class-validator';

export class TrialQueryDto {
  @IsOptional() @IsString() categoryId?: string;
}

export class CreateTrialEventDto {
  @IsString() categoryId!: string;
  @Type(() => Number) @IsInt() @Min(1990) @Max(2030) birthYear!: number;
  @IsDateString() startsAt!: string;
  @IsOptional() @IsString() facilityId?: string;
  @IsOptional() @IsString() venue?: string;
  @IsOptional() @Type(() => Number) @IsNumber() @Min(0) registrationFee?: number;
  @IsOptional() @Type(() => Number) @IsInt() @IsPositive() maxParticipants?: number;
  @IsOptional() @IsString() description?: string;
}

export class CreateTrialCandidateDto {
  @IsString() fullName!: string;
  @IsDateString() dateOfBirth!: string;
  @IsOptional() @IsString() position?: string;
  @IsOptional() @IsString() phone?: string;
  @IsOptional() @IsString() guardianName?: string;
  @IsOptional() @IsString() previousClub?: string;
  @IsOptional() @IsString() photoUrl?: string;
  @IsOptional() @IsString() notes?: string;
}

export class TrialEvaluationDto {
  @IsOptional() @Type(() => Number) @IsNumber() @Min(0) @Max(10) technical?: number;
  @IsOptional() @Type(() => Number) @IsNumber() @Min(0) @Max(10) physical?: number;
  @IsOptional() @Type(() => Number) @IsNumber() @Min(0) @Max(10) tactical?: number;
  @IsOptional() @Type(() => Number) @IsNumber() @Min(0) @Max(10) attitude?: number;
  @IsOptional() @IsString() notes?: string;
  @IsOptional() @IsString() evaluatorStaffId?: string;
}

export class UpdateTrialStatusDto { @IsEnum(TrialStatus) status!: TrialStatus; }

export class ConvertTrialCandidateDto {
  @IsString() firstName!: string;
  @IsString() lastName!: string;
  @IsString() fullNameAr!: string;
  @IsOptional() @Type(() => Number) @IsInt() @IsPositive() jerseyNumber?: number;
  @IsOptional() @IsEnum(RegistrationStatus) registrationStatus?: RegistrationStatus;
}
