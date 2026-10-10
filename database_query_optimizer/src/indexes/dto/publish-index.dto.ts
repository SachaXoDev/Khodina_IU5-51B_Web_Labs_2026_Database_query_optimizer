import {
  IsString,
  IsOptional,
  IsNumber,
  Min,
  MinLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class PublishIndexDto {
  @ApiPropertyOptional({ example: 'idx_orders_status', description: 'Название индекса' })
  @IsOptional()
  @IsString()
  @MinLength(3)
  indexName?: string;

  @ApiPropertyOptional({ example: 'Ускорение выборки заказов', description: 'Краткое описание' })
  @IsOptional()
  @IsString()
  shortDescription?: string;

  @ApiPropertyOptional({ example: 'orders', description: 'Имя таблицы' })
  @IsOptional()
  @IsString()
  tableName?: string;

  @ApiPropertyOptional({ example: 'B-Tree', description: 'Тип индекса' })
  @IsOptional()
  @IsString()
  indexType?: string;

  @ApiPropertyOptional({ example: 'status', description: 'Имя колонки' })
  @IsOptional()
  @IsString()
  columnName?: string;

  @ApiPropertyOptional({ example: 150000, description: 'Кардинальность' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  cardinality?: number;

  @ApiPropertyOptional({ example: 'Полное описание при публикации', description: 'Подробное описание' })
  @IsOptional()
  @IsString()
  fullDescription?: string;
}
