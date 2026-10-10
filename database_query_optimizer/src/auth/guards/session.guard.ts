import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { SessionService } from '../../session/session.service';

export interface AuthenticatedRequest extends Request {
  userId?: number;
  sessionId?: string;
}

@Injectable()
export class SessionGuard implements CanActivate {
  constructor(private readonly sessionService: SessionService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<AuthenticatedRequest>();

    // 1. Ищем sessionId в Cookie (по методичке cookie sessionId)
    let sessionId = req.cookies?.sessionId;

    // 2. Fallback: поддержка куки connect.sid или заголовка Authorization для Postman/Swagger
    if (!sessionId && req.cookies?.['connect.sid']) {
      sessionId = req.cookies['connect.sid'];
    }
    if (!sessionId && req.headers.authorization) {
      const auth = req.headers.authorization;
      if (auth.startsWith('Bearer ')) {
        sessionId = auth.substring(7).trim();
      } else {
        sessionId = auth.trim();
      }
    }

    if (!sessionId) {
      throw new UnauthorizedException('Необходима авторизация (отсутствует кука sessionId)');
    }

    // 3. Проверяем наличие сессии в Redis
    const userId = await this.sessionService.getUserId(sessionId);
    if (!userId) {
      throw new UnauthorizedException('Сессия не найдена или истекла');
    }

    // 4. Привязываем полученный userId и sessionId к объекту запроса
    req.userId = userId;
    req.sessionId = sessionId;
    return true;
  }
}
