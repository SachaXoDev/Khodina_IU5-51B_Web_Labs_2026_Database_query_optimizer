import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
} from 'typeorm';
import { Exclude } from 'class-transformer';
import { DatabaseIndex } from '../../indexes/entities/database-index.entity';
import { IndexLike } from '../../indexes/entities/index-like.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  username: string;

  // Пароль по требованию преподавателя (в REST сериализаторе скрывается через @Exclude)
  @Exclude()
  @Column({ default: '' })
  password: string;

  @Column({ default: 'user' })
  role: string; // 'admin' | 'user'

  // Каскадное удаление строго запрещено по ТЗ
  @OneToMany(() => DatabaseIndex, (index) => index.author)
  indexes: DatabaseIndex[];

  @OneToMany(() => IndexLike, (like) => like.user)
  likes: IndexLike[];
  // created_at убран по замечанию преподавателя
}
