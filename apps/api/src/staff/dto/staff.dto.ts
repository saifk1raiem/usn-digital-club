import { IsBoolean, IsDateString, IsOptional, IsString, MinLength } from 'class-validator';
export class CreateStaffDto {
  @IsString() @MinLength(2) firstName!: string;
  @IsString() @MinLength(2) lastName!: string;
  @IsString() @MinLength(2) fullNameAr!: string;
  @IsOptional() @IsString() phone?: string;
  @IsString() seasonId!: string;
  @IsOptional() @IsString() categoryId?: string;
  @IsString() positionId!: string;
  @IsDateString() startDate!: string;
  @IsOptional() @IsBoolean() isPrimary?: boolean;
}
