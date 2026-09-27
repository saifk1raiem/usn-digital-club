import { PlayerStatus, PreferredFoot, RegistrationStatus } from '@prisma/client';
import { IsDateString, IsEnum, IsInt, IsNumber, IsOptional, IsString, Max, Min, MinLength } from 'class-validator';
export class CreatePlayerDto {
  @IsString() @MinLength(2) firstName!: string;
  @IsString() @MinLength(2) lastName!: string;
  @IsString() @MinLength(2) fullNameAr!: string;
  @IsOptional() @IsDateString() dateOfBirth?: string;
  @IsOptional() @IsString() nationality?: string;
  @IsOptional() @IsString() phone?: string;
  @IsOptional() @IsString() emergencyContact?: string;
  @IsOptional() @IsString() position?: string;
  @IsOptional() @IsEnum(PreferredFoot) preferredFoot?: PreferredFoot;
  @IsOptional() @IsNumber() @Min(100) @Max(230) heightCm?: number;
  @IsOptional() @IsNumber() @Min(25) @Max(180) weightKg?: number;
  @IsOptional() @IsString() federationLicenseNumber?: string;
  @IsString() seasonId!: string;
  @IsString() categoryId!: string;
  @IsOptional() @IsInt() @Min(1) @Max(99) jerseyNumber?: number;
  @IsOptional() @IsEnum(RegistrationStatus) registrationStatus?: RegistrationStatus;
}
export class UpdatePlayerStatusDto { @IsEnum(PlayerStatus) status!: PlayerStatus; }
