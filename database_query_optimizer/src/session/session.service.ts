import { Injectable, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Redis } from 'ioredis';

@Injectable()
export class SessionService implements OnModuleDestroy {
  private readonly logger = new Logger(SessionService.name);
  private readonly redis: Redis;

  constructor(private readonly configService: ConfigService) {
    const host = this.configService.get<string>('REDIS_HOST', 'localhost');
    const port = this.configService.get<number>('REDIS_PORT', 6379);

    this.redis = new Redis({
      host,
      port,
      retryStrategy: (times) => Math.min(times * 100, 3000),
    });

    this.redis.on('connect', () => {
      this.logger.log(`Подключение к Redis (${host}:${port}) успешно установлено`);
    });

    this.redis.on('error', (err) => {
      this.logger.error(`Ошибка подключения к Redis: ${err?.message || err}`);
    });
  }

  /**
   * Создаёт сессию в Redis
   * @param sessionId — уникальный идентификатор сессии (UUID)
   * @param userId — ID пользователя в PostgreSQL
   * @param ttlSec — время жизни в секундах (по методичке 3600 = 1 час)
   */
  async create(sessionId: string, userId: number, ttlSec: number = 3600): Promise<void> {
    await this.redis.setex(`session:${sessionId}`, ttlSec, String(userId));
  }

  /**
   * Получает ID пользователя по sessionId
   */
  async getUserId(sessionId: string): Promise<number | null> {
    const userIdStr = await this.redis.get(`session:${sessionId}`);
    return userIdStr ? parseInt(userIdStr, 10) : null;
  }

  /**
   * Удаляет сессию (при logout)
   */
  async destroy(sessionId: string): Promise<void> {
    await this.redis.del(`session:${sessionId}`);
  }

  /**
   * Проверяет, существует ли активная сессия
   */
  async exists(sessionId: string): Promise<boolean> {
    const count = await this.redis.exists(`session:${sessionId}`);
    return count === 1;
  }

  /**
   * Получение всех активных сессий с помощью Lua-скрипта в Redis
   * Соответствует требованию Лекции №6 (слайд 10):
   * «Написать целый скрипт на языке Lua для получения активных сессий пользователей»
   * Выполняется атомарно внутри движка Redis через команду EVAL.
   */
  async getActiveSessionsWithLua(): Promise<Array<{ sessionId: string; userId: number; ttl: number }>> {
    const luaScript = `
      local keys = redis.call('KEYS', 'session:*')
      local result = {}
      for i, key in ipairs(keys) do
        local val = redis.call('GET', key)
        local ttl = redis.call('TTL', key)
        table.insert(result, key .. '|' .. tostring(val) .. '|' .. tostring(ttl))
      end
      return result
    `;

    const raw = (await this.redis.eval(luaScript, 0)) as string[];
    if (!raw || !Array.isArray(raw)) {
      return [];
    }

    return raw.map((entry) => {
      const [key, userId, ttl] = entry.split('|');
      return {
        sessionId: key.replace('session:', ''),
        userId: parseInt(userId, 10),
        ttl: parseInt(ttl, 10),
      };
    });
  }

  /**
   * Получить доступ к инстансу Redis (для проверок и тестов)
   */
  getClient(): Redis {
    return this.redis;
  }

  async onModuleDestroy() {
    await this.redis.quit();
  }
}
