import {
  Injectable,
  CanActivate,
  ExecutionContext,
} from '@nestjs/common';
import { AuthenticatedRequest } from './session.guard';
import { SessionService } from '../../session/session.service';

/**
 * Guard, который не блокирует гостя, но если кука передана — извлекает userId из Redis.
 * Используется для GET /api/indexes и GET /api/indexes/feed (определение isOwner и isLiked).
 */
@Injectable()
export class OptionalSessionGuard implements CanActivate {
  constructor(private readonly sessionService: SessionService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<AuthenticatedRequest>();

    // 1. Проверяем куку sessionId или connect.sid
    let sessionId = req.cookies?.sessionId || req.cookies?.['connect.sid'];

    // 2. Проверяем кастомный заголовок sessionId (если передан как Header в Postman)
    if (!sessionId && req.headers['sessionid']) {
      sessionId = String(req.headers['sessionid']).trim();
    }

    // 3. Проверяем Authorization: Bearer <sessionId>
    if (!sessionId && req.headers.authorization) {
      const auth = req.headers.authorization;
      sessionId = auth.startsWith('Bearer ') ? auth.substring(7).trim() : auth.trim();
    }

    if (sessionId) {
      const userId = await this.sessionService.getUserId(sessionId);
      if (userId) {
        req.userId = userId;
        req.sessionId = sessionId;
      }
    }

    return true; // Гость допускается всегда
  }
}
