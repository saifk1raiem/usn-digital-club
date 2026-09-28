import { AttendanceStatus, AvailabilityResponse, TrainingType } from '@prisma/client';
import { Type } from 'class-transformer';
import { ArrayMinSize, ArrayUnique, IsArray, IsDateString, IsEnum, IsInt, IsOptional, IsString, Max, Min, ValidateNested } from 'class-validator';

export class CreateTrainingDto {
  @IsString() seasonId!: string;
  @IsString() categoryId!: string;
  @IsOptional() @IsString() facilityId?: string;
  @IsDateString() startsAt!: string;
  @IsDateString() endsAt!: string;
  @IsEnum(TrainingType) type!: TrainingType;
  @IsOptional() @IsInt() @Min(1) @Max(10) intensity?: number;
  @IsOptional() @IsString() objective?: string;
  @IsOptional() @IsString() notes?: string;
  @IsOptional() @IsArray() @ArrayUnique() @IsString({ each: true }) playerIds?: string[];
}

export class TrainingQueryDto {
  @IsOptional() @IsString() categoryId?: string;
  @IsOptional() @IsDateString() from?: string;
  @IsOptional() @IsDateString() to?: string;
}

export class TrainingResponseDto {
  @IsEnum(AvailabilityResponse) response!: AvailabilityResponse;
  @IsOptional() @IsString() note?: string;
}

export class AttendanceRecordDto {
  @IsString() playerId!: string;
  @IsEnum(AttendanceStatus) status!: AttendanceStatus;
  @IsOptional() @IsString() coachNote?: string;
}

export class MarkAttendanceDto {
  @IsArray() @ArrayMinSize(1) @ValidateNested({ each: true }) @Type(() => AttendanceRecordDto)
  records!: AttendanceRecordDto[];
}
