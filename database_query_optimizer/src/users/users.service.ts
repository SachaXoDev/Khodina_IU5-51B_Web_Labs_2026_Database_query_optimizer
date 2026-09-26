import {
  Injectable,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { RegisterUserDto } from './dto/register-user.dto';
import { LoginUserDto } from './dto/login-user.dto';
import { UserResponseDto } from './dto/user-response.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  /**
   * Регистрация нового пользователя в БД через ORM
   */
  async register(dto: RegisterUserDto): Promise<UserResponseDto> {
    const existing = await this.userRepository.findOne({
      where: { username: dto.username },
    });

    if (existing) {
      throw new ConflictException();
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
   * Заглушка аутентификации для 4-й лабораторной работы
   */
  async loginStub(dto: LoginUserDto): Promise<{ username: string }> {
    return {
      username: dto.username,
    };
  }

  /**
   * Заглушка деавторизации для 4-й лабораторной работы
   */
  async logoutStub(): Promise<void> {
    return;
  }
}
