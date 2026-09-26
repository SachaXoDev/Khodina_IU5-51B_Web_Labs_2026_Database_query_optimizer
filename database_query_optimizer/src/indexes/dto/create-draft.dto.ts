import {
  IsString,
  IsOptional,
  IsNumber,
  Min,
  MinLength,
} from 'class-validator';
import { Type } from 'class-transformer';

/**
 * DTO создания черновика услуги (кнопка «Далее»).
 * Обязательное поле — ТОЛЬКО indexName!
 * Все остальные поля строго необязательны (@IsOptional).
 */
export class CreateDraftDto {
  @IsString()
  @MinLength(3, { message: 'Название индекса должно содержать минимум 3 символа' })
  indexName: string;

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
