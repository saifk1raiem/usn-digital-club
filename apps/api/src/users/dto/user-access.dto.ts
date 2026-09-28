import { UserStatus } from '@prisma/client';
import { Type } from 'class-transformer';
import { ArrayUnique, IsArray, IsBoolean, IsEmail, IsEnum, IsIn, IsOptional, IsString, Matches, MinLength, ValidateNested } from 'class-validator';

export class RoleGrantDto {
  @IsString() @MinLength(1) roleKey!: string;
  @IsOptional() @IsBoolean() isGlobal?: boolean;
  @IsOptional() @IsArray() @ArrayUnique() @IsString({ each: true }) categoryIds?: string[];
}

export class CreateUserDto {
  @IsString() personId!: string;
  @IsEmail() email!: string;
  @IsString() @MinLength(12) @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).+$/) password!: string;
  @IsOptional() @IsIn(['ar', 'fr']) locale?: string;
  @IsOptional() @IsEnum(UserStatus) status?: UserStatus;
  @IsArray() @ArrayUnique((grant: RoleGrantDto) => grant.roleKey) @ValidateNested({ each: true }) @Type(() => RoleGrantDto)
  roleGrants!: RoleGrantDto[];
}

export class UpdateUserAccessDto {
  @IsOptional() @IsEnum(UserStatus) status?: UserStatus;
  @IsOptional() @IsIn(['ar', 'fr']) locale?: string;
  @IsOptional() @IsArray() @ArrayUnique((grant: RoleGrantDto) => grant.roleKey) @ValidateNested({ each: true }) @Type(() => RoleGrantDto)
  roleGrants?: RoleGrantDto[];
}

export class SetRolePermissionsDto {
  @IsArray() @ArrayUnique() @IsString({ each: true }) @MinLength(1, { each: true })
  permissionKeys!: string[];
}
