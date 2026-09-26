import {
  IsOptional,
} from 'class-validator';

/**
 * DTO для постановки или отмены лайка (POST /api/indexes/:id/like).
 * Поле value: 0 — отменяет лайк, 1 — ставит лайк.
 */
export class LikeIndexDto {
  @IsOptional()
  value?: any;
}
