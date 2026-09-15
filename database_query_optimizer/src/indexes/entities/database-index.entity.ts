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

  @Column({ name: 'index_name' })
  indexName: string;

  @Column({ name: 'short_description', type: 'text', default: '' })
  shortDescription: string;

  @Column({
    type: 'enum',
    enum: IndexStatus,
    default: IndexStatus.DRAFT,
  })
  status: IndexStatus;

  @Column({ name: 'image_url', default: '/assets/default_index.svg' })
  imageUrl: string;

  @Column({ name: 'video_url', nullable: true, type: 'varchar', default: '/assets/default_video.mp4' })
  videoUrl: string | null;

  // Два обязательных поля по предметной области (Оптимизатор запросов БД)
  @Column({ name: 'table_name', default: 'users' })
  tableName: string;

  @Column({ name: 'index_type', default: 'B-Tree' })
  indexType: string; // B-Tree, Hash, GIN, GiST, BRIN

  // Дополнительные параметры специфики
  @Column({ name: 'column_name', default: 'id' })
  columnName: string;

  @Column({ type: 'int', default: 0 })
  cardinality: number;

  @Column({ name: 'scan_cost_reduction_percent', type: 'numeric', precision: 5, scale: 2, default: 0 })
  scanCostReductionPercent: number;

  @Column({ name: 'estimated_speedup_factor', type: 'numeric', precision: 4, scale: 1, default: 1.0 })
  estimatedSpeedupFactor: number;

  @Column({ name: 'estimated_creation_time_sec', type: 'int', default: 1 })
  estimatedCreationTimeSec: number;

  @Column({ name: 'recommended_workload', default: 'OLTP' })
  recommendedWorkload: string;

  @Column({ name: 'full_description', type: 'text', default: '' })
  fullDescription: string;

  @Column({ name: 'likes_count', type: 'int', default: 0 })
  likesCount: number;

  @Column({ name: 'author_id', nullable: true })
  authorId: number;

  // Каскадное удаление строго запрещено по ТЗ (onDelete: 'RESTRICT' или 'NO ACTION')
  @ManyToOne(() => User, (user) => user.indexes, { onDelete: 'RESTRICT', nullable: true })
  @JoinColumn({ name: 'author_id' })
  author: User;

  @OneToMany(() => IndexLike, (like) => like.index)
  likes: IndexLike[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @Column({ name: 'published_at', type: 'timestamp', nullable: true })
  publishedAt: Date | null;
}
