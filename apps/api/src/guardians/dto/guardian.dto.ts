import { IsDateString, IsOptional, IsString } from 'class-validator';

export class GuardianQueryDto {
  @IsOptional() @IsString() categoryId?: string;
}

export class CreateGuardianDto {
  @IsString() playerId!: string;
  @IsString() relationship!: string;
  @IsString() firstName!: string;
  @IsString() lastName!: string;
  @IsString() fullNameAr!: string;
  @IsOptional() @IsDateString() dateOfBirth?: string;
  @IsOptional() @IsString() phone?: string;
  @IsOptional() @IsString() emergencyContact?: string;
}

export class LinkGuardianPlayerDto {
  @IsString() playerId!: string;
  @IsOptional() @IsString() relationship?: string;
}
