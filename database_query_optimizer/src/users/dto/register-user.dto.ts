import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength, IsOptional, IsIn } from 'class-validator';

export class RegisterUserDto {
  @ApiProperty({ example: 'dba_pro', description: 'Уникальное имя пользователя' })
  @IsString()
  @MinLength(3)
  username: string;

  @ApiProperty({ example: 'password123', description: 'Пароль учетной записи' })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty({ example: 'user', enum: ['user', 'moderator', 'admin'], required: false, default: 'user' })
  @IsOptional()
  @IsString()
  @IsIn(['user', 'moderator', 'admin'])
  role?: string;
}
