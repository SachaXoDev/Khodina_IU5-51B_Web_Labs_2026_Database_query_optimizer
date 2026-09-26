import { IsString, MinLength, IsOptional, IsIn } from 'class-validator';

export class RegisterUserDto {
  @IsString()
  @MinLength(3, { message: 'Имя пользователя должно содержать не менее 3 символов' })
  username: string;

  @IsString()
  @MinLength(6, { message: 'Пароль должен содержать не менее 6 символов' })
  password: string;

  @IsOptional()
  @IsString()
  @IsIn(['user', 'admin'], { message: 'Роль может быть только user или admin' })
  role?: string;
}
