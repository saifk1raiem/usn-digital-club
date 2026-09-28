import { Type } from 'class-transformer';
import { IsBoolean, IsDateString, IsNumber, IsOptional, IsString, Matches } from 'class-validator';

export class PerformanceQueryDto {
  @IsOptional() @IsString() categoryId?: string;
  @IsOptional() @IsString() playerId?: string;
  @IsOptional() @IsString() testTypeId?: string;
}

export class CreatePhysicalTestTypeDto {
  @IsString() @Matches(/^[A-Z0-9_]+$/) code!: string;
  @IsString() nameAr!: string;
  @IsString() nameFr!: string;
  @IsString() defaultUnit!: string;
  @IsOptional() @IsBoolean() lowerIsBetter?: boolean;
}

export class CreatePhysicalTestResultDto {
  @IsString() playerId!: string;
  @IsString() testTypeId!: string;
  @Type(() => Number) @IsNumber() value!: number;
  @IsOptional() @IsString() unit?: string;
  @IsDateString() measuredAt!: string;
  @IsOptional() @IsString() responsibleStaffId?: string;
  @IsOptional() @IsString() notes?: string;
}
