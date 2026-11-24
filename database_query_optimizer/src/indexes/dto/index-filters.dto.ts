import { IsOptional, IsString, IsInt, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export const DEFAULT_INDEX_PAGE_SIZE = 24;
export const MAX_INDEX_PAGE_SIZE = 100;
export const MAX_INT = 2_147_483_647;

export class IndexFiltersDto {
  @ApiPropertyOptional({ description: 'Поиск по названию индекса или таблицы' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Фильтр по типу индекса (B-Tree, BRIN, Hash, GIN)' })
  @IsOptional()
  @IsString()
  indexType?: string;

  @ApiPropertyOptional({ description: 'Точное значение кардинальности (количество строк)' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(MAX_INT)
  minCardinality?: number;

  @ApiPropertyOptional({ default: DEFAULT_INDEX_PAGE_SIZE, maximum: MAX_INDEX_PAGE_SIZE })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(Number.MAX_SAFE_INTEGER)
  limit?: number;

  @ApiPropertyOptional({ default: 0, minimum: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(MAX_INT)
  offset?: number;
}
