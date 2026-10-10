import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';

export class LikeIndexDto {
  @ApiProperty({
    description: 'Флаг лайка: 1 — поставить отметку "Нравится", 0 — снять отметку',
    example: 1,
    enum: [0, 1],
  })
  @IsNotEmpty()
  value: number | string;
}
