import {
  IsString,
  IsOptional,
  IsNumber,
  Min,
  MinLength,
} from 'class-validator';
import { Type } from 'class-transformer';

export class PublishIndexDto {
  @IsOptional()
  @IsString()
  @MinLength(3)
  indexName?: string;

  @IsOptional()
  @IsString()
  shortDescription?: string;

  @IsOptional()
  @IsString()
  tableName?: string;

  @IsOptional()
  @IsString()
  indexType?: string;

  @IsOptional()
  @IsString()
  columnName?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  cardinality?: number;

  @IsOptional()
  @IsString()
  fullDescription?: string;
}
