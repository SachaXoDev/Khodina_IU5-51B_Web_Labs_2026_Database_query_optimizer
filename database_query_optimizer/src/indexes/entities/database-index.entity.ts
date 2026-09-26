import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { IndexLike } from './index-like.entity';

export enum IndexStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  DELETED = 'deleted',
}

@Entity('database_indexes')
export class DatabaseIndex {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'index_name', default: '' })
  indexName: string;

  @Column({ name: 'short_description', type: 'text', default: '', nullable: true })
  shortDescription: string;

  @Column({
    type: 'enum',
    enum: IndexStatus,
    default: IndexStatus.DRAFT,
  })
  status: IndexStatus;

  // В полях БД сохраняются сгенерированные латинские имена файлов MinIO
  @Column({ name: 'image_url', default: 'default_index.jpg', nullable: true })
  imageUrl: string;

  @Column({ name: 'video_url', nullable: true, type: 'varchar', default: 'default_video.mp4' })
  videoUrl: string | null;

  // Поля предметной области (Оптимизатор запросов БД)
  @Column({ name: 'table_name', default: 'users', nullable: true })
  tableName: string;

  @Column({ name: 'index_type', default: 'B-Tree', nullable: true })
  indexType: string; // B-Tree, Hash, GIN, GiST, BRIN

  @Column({ name: 'column_name', default: 'id', nullable: true })
  columnName: string;

  @Column({ type: 'int', default: 0, nullable: true })
  cardinality: number;

  @Column({ name: 'full_description', type: 'text', default: '', nullable: true })
  fullDescription: string;

  @Column({ name: 'likes_count', type: 'int', default: 0 })
  likesCount: number;

  @Column({ name: 'author_id', nullable: true })
  authorId: number;

  // Каскадное удаление строго запрещено по ТЗ (onDelete: 'RESTRICT')
  @ManyToOne(() => User, (user) => user.indexes, { onDelete: 'RESTRICT', nullable: true })
  @JoinColumn({ name: 'author_id' })
  author: User;

  @OneToMany(() => IndexLike, (like) => like.index)
  likes: IndexLike[];

  // Системные даты услуги
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @Column({ name: 'published_at', type: 'timestamp', nullable: true })
  publishedAt: Date | null;
}
