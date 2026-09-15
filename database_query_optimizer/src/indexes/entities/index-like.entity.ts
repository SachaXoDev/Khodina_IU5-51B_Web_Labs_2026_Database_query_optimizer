import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Unique,
  CreateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { DatabaseIndex } from './database-index.entity';

@Entity('index_likes')
@Unique(['userId', 'indexId'])
export class IndexLike {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'user_id' })
  userId: number;

  @Column({ name: 'index_id' })
  indexId: number;

  // Каскадное удаление строго запрещено по ТЗ (RESTRICT)
  @ManyToOne(() => User, (user) => user.likes, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => DatabaseIndex, (index) => index.likes, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'index_id' })
  index: DatabaseIndex;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
