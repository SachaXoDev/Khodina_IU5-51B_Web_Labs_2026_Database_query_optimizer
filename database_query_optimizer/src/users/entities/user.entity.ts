import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToMany,
} from 'typeorm';
import { DatabaseIndex } from '../../indexes/entities/database-index.entity';
import { IndexLike } from '../../indexes/entities/index-like.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  username: string;

  @Column({ default: 'user' })
  role: string; // 'admin' | 'user'

  // Каскадное удаление строго запрещено по ТЗ
  @OneToMany(() => DatabaseIndex, (index) => index.author)
  indexes: DatabaseIndex[];

  @OneToMany(() => IndexLike, (like) => like.user)
  likes: IndexLike[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
