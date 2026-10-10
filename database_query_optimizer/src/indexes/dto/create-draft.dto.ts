import {
  IsString,
  IsOptional,
  IsNumber,
  Min,
  MinLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * DTO создания черновика услуги (кнопка «Далее»).
 * Обязательное поле — ТОЛЬКО indexName!
 */
export class CreateDraftDto {
  @ApiProperty({ example: 'idx_orders_status', description: 'Название индекса' })
  @IsString()
  @MinLength(3)
  indexName: string;

  @ApiPropertyOptional({ example: 'Ускорение фильтрации заказов', description: 'Краткое описание' })
  @IsOptional()
  @IsString()
  shortDescription?: string;

  @ApiPropertyOptional({ example: 'orders', description: 'Имя таблицы' })
  @IsOptional()
  @IsString()
  tableName?: string;

  @ApiPropertyOptional({ example: 'B-Tree', description: 'Тип индекса (B-Tree, Hash, BRIN, GIN)' })
  @IsOptional()
  @IsString()
  indexType?: string;

  @ApiPropertyOptional({ example: 'status', description: 'Целевая колонка таблицы' })
  @IsOptional()
  @IsString()
  columnName?: string;

  @ApiPropertyOptional({ example: 150000, description: 'Кардинальность (число строк)' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  cardinality?: number;

  @ApiPropertyOptional({ example: 'Полное техническое описание оптимизации', description: 'Подробное описание' })
  @IsOptional()
  @IsString()
  fullDescription?: string;
}
