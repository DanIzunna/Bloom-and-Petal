import {
  IsString,
  IsNumber,
  IsOptional,
  IsArray,
  IsUrl,
  IsUUID,
  Max,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateProductDto {
  @IsString()
  name!: string;

  @IsString()
  description!: string;

  @IsNumber()
  @Type(() => Number)
  @Min(0)
  price!: number;

  @IsNumber()
  @Type(() => Number)
  @Min(0)
  @Max(1_000_000)
  stock!: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @IsUrl({}, { each: true })
  images?: string[];

  @IsOptional()
  @IsString()
  @IsUrl()
  imageUrl?: string;

  @IsOptional()
  @IsString()
  imagePublicId?: string;

  @IsOptional()
  @IsString()
  careInstructions?: string;

  @IsOptional()
  @IsString()
  occasion?: string;

  @IsUUID()
  categoryId!: string;
}
