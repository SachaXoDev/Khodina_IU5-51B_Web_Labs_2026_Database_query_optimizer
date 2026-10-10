import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { User } from '../users/entities/user.entity';
import { SessionService } from '../session/session.service';
import { RegisterUserDto } from '../users/dto/register-user.dto';
import { LoginUserDto } from '../users/dto/login-user.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly sessionService: SessionService,
  ) {}

  /**
   * Регистрация нового пользователя
   */
  async register(dto: RegisterUserDto): Promise<{ id: number; username: string; role: string }> {
    const existing = await this.userRepository.findOne({
      where: { username: dto.username },
    });

    if (existing) {
      throw new ConflictException(`Пользователь с именем "${dto.username}" уже существует`);
    }

    const user = this.userRepository.create({
      username: dto.username,
      password: dto.password,
      role: dto.role || 'user',
    });

    const saved = await this.userRepository.save(user);

    return {
      id: saved.id,
      username: saved.username,
      role: saved.role,
    };
  }

  /**
   * Аутентификация: проверка логина/пароля, создание сессии в Redis и возврат sessionId
   */
  async login(dto: LoginUserDto): Promise<{ sessionId: string; user: { id: number; username: string; role: string } }> {
    const user = await this.userRepository.findOne({
      where: { username: dto.username },
    });

    if (!user || user.password !== dto.password) {
      throw new UnauthorizedException('Неверное имя пользователя или пароль');
    }

    // Генерируем уникальный ID сессии
    const sessionId = uuidv4();

    // Сохраняем в Redis на 1 час (3600 сек)
    await this.sessionService.create(sessionId, user.id, 3600);

    return {
      sessionId,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
      },
    };
  }

  /**
   * Деавторизация: удаление сессии из Redis
   */
  async logout(sessionId: string): Promise<void> {
    await this.sessionService.destroy(sessionId);
  }

  /**
   * Получение профиля пользователя по ID
   */
  async getUserById(userId: number): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('Пользователь не найден');
    }
    return user;
  }
}
