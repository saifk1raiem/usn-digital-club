import { IsOptional, IsString, Matches, MinLength } from 'class-validator';
export class CreateCategoryDto {
  @IsString() seasonId!: string;
  @IsString() @Matches(/^[A-Z0-9_-]+$/) code!: string;
  @IsString() @MinLength(2) nameAr!: string;
  @IsString() @MinLength(2) nameFr!: string;
  @IsOptional() @IsString() descriptionAr?: string;
  @IsOptional() @IsString() descriptionFr?: string;
}
