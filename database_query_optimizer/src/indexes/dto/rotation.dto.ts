import { ApiProperty } from '@nestjs/swagger';
import { IsNumber } from 'class-validator';

export class RotationDto {
  @ApiProperty({ description: 'Поворот по оси X в радианах' })
  @IsNumber()
  rotationX: number;

  @ApiProperty({ description: 'Поворот по оси Y в радианах' })
  @IsNumber()
  rotationY: number;
}
