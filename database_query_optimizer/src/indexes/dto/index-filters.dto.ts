import { IsOptional, IsString, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class IndexFiltersDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  indexType?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  minCardinality?: number;
}
