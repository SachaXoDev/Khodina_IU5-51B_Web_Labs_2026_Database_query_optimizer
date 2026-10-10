import {
  Controller,
  Post,
  Get,
  Body,
  Req,
  Res,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiCookieAuth } from '@nestjs/swagger';
import { Response, Request } from 'express';
import { AuthService } from './auth.service';
import { LoginUserDto } from '../users/dto/login-user.dto';
import { RegisterUserDto } from '../users/dto/register-user.dto';
import { SessionGuard, AuthenticatedRequest } from './guards/session.guard';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Регистрация нового пользователя' })
  @ApiResponse({ status: 201, description: 'Пользователь успешно зарегистрирован' })
  @ApiResponse({ status: 409, description: 'Пользователь уже существует' })
  async register(@Body() dto: RegisterUserDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Вход в систему (аутентификация)',
    description: 'Проверяет логин/пароль, создает сессию в Redis и устанавливает cookie sessionId',
  })
  @ApiResponse({ status: 200, description: 'Успешная авторизация, cookie sessionId установлена' })
  @ApiResponse({ status: 401, description: 'Неверные учетные данные' })
  async login(
    @Body() dto: LoginUserDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { sessionId, user } = await this.authService.login(dto);

    // Установка HttpOnly Cookie согласно методичке
    res.cookie('sessionId', sessionId, {
      httpOnly: true,
      secure: false, // для локальной разработки по HTTP
      sameSite: 'lax',
      maxAge: 3600 * 1000, // 1 час
    });

    return {
      message: 'Успешный вход в систему',
      sessionId, // возвращаем также в JSON для удобства Swagger / Insomnia
      user,
    };
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Выход из системы (удаление сессии из Redis)' })
  @ApiResponse({ status: 200, description: 'Сессия удалена, кука очищена' })
  async logout(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const sessionId = req.cookies?.sessionId || req.cookies?.['connect.sid'];
    if (sessionId) {
      await this.authService.logout(sessionId);
    }
    res.clearCookie('sessionId');
    return { ok: true, message: 'Сессия успешно завершена' };
  }

  @Get('me')
  @UseGuards(SessionGuard)
  @ApiCookieAuth('sessionId')
  @ApiOperation({ summary: 'Получение данных текущего авторизованного пользователя' })
  @ApiResponse({ status: 200, description: 'Данные пользователя из сессии' })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
  async getProfile(@Req() req: AuthenticatedRequest) {
    const user = await this.authService.getUserById(req.userId!);
    return {
      id: user.id,
      username: user.username,
      role: user.role,
      sessionId: req.sessionId,
    };
  }
}
