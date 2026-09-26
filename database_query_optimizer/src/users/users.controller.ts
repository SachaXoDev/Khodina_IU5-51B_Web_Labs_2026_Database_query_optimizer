import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { UsersService } from './users.service';
import { RegisterUserDto } from './dto/register-user.dto';
import { LoginUserDto } from './dto/login-user.dto';
import { UserResponseDto } from './dto/user-response.dto';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  /**
   * 1. POST /api/users/register — регистрация нового пользователя
   */
  @Post('register')
  async register(@Body() dto: RegisterUserDto): Promise<UserResponseDto> {
    return this.usersService.register(dto);
  }

  /**
   * 2. POST /api/users/login — аутентификация (заглушка для 4-й лабы)
   */
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() dto: LoginUserDto): Promise<{ username: string }> {
    return this.usersService.loginStub(dto);
  }

  /**
   * 3. POST /api/users/logout — деавторизация (заглушка для 4-й лабы)
   */
  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  async logout(): Promise<void> {
    await this.usersService.logoutStub();
  }
}
