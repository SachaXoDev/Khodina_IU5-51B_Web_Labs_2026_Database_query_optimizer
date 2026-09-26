import { IsString, MinLength, IsOptional, IsIn } from 'class-validator';

export class RegisterUserDto {
  @IsString()
  @MinLength(3)
  username: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsOptional()
  @IsString()
  @IsIn(['user', 'admin'])
  role?: string;
}
