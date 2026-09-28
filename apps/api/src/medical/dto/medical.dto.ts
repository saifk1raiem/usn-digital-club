import { MedicalStatus } from '@prisma/client';
import { IsDateString, IsEnum, IsOptional, IsString } from 'class-validator';

export class MedicalQueryDto {
  @IsOptional() @IsString() categoryId?: string;
  @IsOptional() @IsEnum(MedicalStatus) status?: MedicalStatus;
}

export class CreateMedicalCaseDto {
  @IsString() playerId!: string;
  @IsString() issue!: string;
  @IsOptional() @IsString() bodyArea?: string;
  @IsDateString() occurredAt!: string;
  @IsOptional() @IsString() severity?: string;
  @IsOptional() @IsString() responsibleStaffId?: string;
  @IsEnum(MedicalStatus) status!: MedicalStatus;
  @IsOptional() @IsDateString() expectedReturnAt?: string;
  @IsOptional() @IsString() confidentialNotes?: string;
  @IsOptional() @IsString() rehabilitationPhase?: string;
}

export class AddMedicalUpdateDto {
  @IsEnum(MedicalStatus) status!: MedicalStatus;
  @IsOptional() @IsString() publicNote?: string;
  @IsOptional() @IsString() confidentialNote?: string;
  @IsOptional() @IsDateString() expectedReturnAt?: string;
  @IsOptional() @IsString() rehabilitationPhase?: string;
  @IsOptional() @IsString() createdByStaffId?: string;
}
