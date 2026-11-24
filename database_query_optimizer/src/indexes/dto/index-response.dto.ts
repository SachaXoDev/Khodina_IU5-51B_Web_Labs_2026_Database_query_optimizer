import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IndexStatus } from '../entities/database-index.entity';

export class IndexResponseDto {
  @ApiProperty({ example: 1, description: 'Уникальный идентификатор индекса' })
  id: number;

  @ApiProperty({ example: 'idx_users_email', description: 'Название индекса' })
  indexName: string;

  @ApiProperty({ example: 'Ускорение поиска пользователей по email', description: 'Краткое описание' })
  shortDescription: string;

  @ApiPropertyOptional({ example: 'index_users_email.jpg', description: 'Имя файла изображения' })
  imageFileName: string | null;

  @ApiPropertyOptional({ example: 'index_users_email.mp4', description: 'Имя файла видео' })
  videoFileName: string | null;

  @ApiPropertyOptional({
    example: 'http://localhost:9000/media/index_users_email.jpg',
    description: 'Прямой URL к изображению в MinIO',
  })
  imageUrl: string | null;

  @ApiPropertyOptional({
    example: 'http://localhost:9000/media/index_users_email.mp4',
    description: 'Прямой URL к видео в MinIO',
  })
  videoUrl: string | null;

  @ApiProperty({ type: String, nullable: true })
  modelUrl: string | null;

  @ApiProperty({ description: 'Поворот по оси X в радианах' })
  rotationX: number;

  @ApiProperty({ description: 'Поворот по оси Y в радианах' })
  rotationY: number;

  @ApiProperty({ enum: IndexStatus })
  status: IndexStatus;

  @ApiProperty({ example: 'users', description: 'Название таблицы' })
  tableName: string;

  @ApiProperty({ example: 'B-Tree', description: 'Тип индекса' })
  indexType: string;

  @ApiProperty({ example: 'email', description: 'Имя целевой колонки' })
  columnName: string;

  @ApiProperty({ example: 500000, description: 'Кардинальность (число строк)' })
  cardinality: number;

  @ApiProperty({ example: 'Полное техническое описание оптимизации индекса', description: 'Полное описание' })
  fullDescription: string;

  @ApiProperty({ example: 5, description: 'Количество отметок "Нравится"' })
  likesCount: number;

  @ApiProperty({ example: 0, description: 'Признак лайка текущим пользователем: 1 — да, 0 — нет' })
  isLiked: number;

  @ApiProperty({ example: false, description: 'Булев признак лайка текущим пользователем' })
  isLikedByCurrentUser: boolean;

  @ApiPropertyOptional({ example: 1, description: 'Идентификатор автора' })
  authorId: number | null;

  @ApiPropertyOptional({ example: 'pg_expert', description: 'Имя автора' })
  authorUsername: string | null;

  @ApiProperty({
    example: 1,
    description: 'Признак 0/1: автор услуги совпадает с текущим пользователем (1 — да, 0 — нет)',
  })
  isOwner: number;

  @ApiProperty({ example: '2026-09-15T17:31:05.397Z', description: 'Дата создания' })
  createdAt: Date;

  @ApiPropertyOptional({ example: '2026-09-15T17:31:05.397Z', description: 'Дата публикации' })
  publishedAt: Date | null;
}

export class FeedResponseDto {
  @ApiPropertyOptional({ type: () => IndexResponseDto, description: 'Текущий индекс в ленте' })
  current: IndexResponseDto | null;

  @ApiProperty({ type: Number, nullable: true, description: 'Номер карточки в текущей пачке (с 1)' })
  position: number | null;

  @ApiProperty({ description: 'Количество карточек в текущей пачке' })
  batchSize: number;
}

export class IndexPageDto {
  @ApiProperty({ type: [IndexResponseDto] })
  items: IndexResponseDto[];

  @ApiProperty()
  total: number;

  @ApiProperty()
  offset: number;

  @ApiProperty()
  limit: number;
}

export class ClipCandidateDto {
  @ApiProperty()
  id: number;

  @ApiProperty({ minLength: 50, maxLength: 100 })
  shortDescription: string;
}

export const CLIP_CANDIDATE_PAGE_SIZE = 100;

export class ClipCandidatePageDto {
  @ApiProperty({ type: [ClipCandidateDto], maxItems: CLIP_CANDIDATE_PAGE_SIZE })
  items: ClipCandidateDto[];

  @ApiProperty({ type: Number, nullable: true, description: 'Последний ID для следующей страницы или null в конце' })
  nextAfterId: number | null;
}
