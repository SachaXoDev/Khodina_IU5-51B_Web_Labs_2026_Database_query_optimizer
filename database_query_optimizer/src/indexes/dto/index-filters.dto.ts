import { IsOptional, IsString, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class IndexFiltersDto {
  @ApiPropertyOptional({ description: 'Поиск по названию индекса или таблицы' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Фильтр по типу индекса (B-Tree, BRIN, Hash, GIN)' })
  @IsOptional()
  @IsString()
  indexType?: string;

  @ApiPropertyOptional({ description: 'Минимальная кардинальность (количество строк)' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  minCardinality?: number;
}
