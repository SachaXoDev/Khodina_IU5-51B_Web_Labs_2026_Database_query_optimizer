import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  OnModuleInit,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DatabaseIndex, IndexStatus } from './entities/database-index.entity';
import { IndexLike } from './entities/index-like.entity';
import { User } from '../users/entities/user.entity';
import { MinioService } from './minio.service';
import { IndexFiltersDto } from './dto/index-filters.dto';
import { CreateDraftDto } from './dto/create-draft.dto';
import { PublishIndexDto } from './dto/publish-index.dto';
import { IndexResponseDto, FeedResponseDto } from './dto/index-response.dto';

@Injectable()
export class IndexesService implements OnModuleInit {
  private readonly logger = new Logger(IndexesService.name);

  constructor(
    @InjectRepository(DatabaseIndex)
    private readonly indexRepository: Repository<DatabaseIndex>,
    @InjectRepository(IndexLike)
    private readonly likeRepository: Repository<IndexLike>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly minioService: MinioService,
  ) {}

  async onModuleInit() {
    await this.seedInitialData();
  }

  /**
   * Инициализация начальных пользователей и опубликованных индексов
   */
  private async seedInitialData() {
    const userCount = await this.userRepository.count();
    if (userCount === 0) {
      this.logger.log('Инициализация начальных пользователей...');
      const author = this.userRepository.create({
        id: 1,
        username: 'pg_expert',
        password: 'password123',
        role: 'admin',
      });
      const client = this.userRepository.create({
        id: 2,
        username: 'dba_junior',
        password: 'password123',
        role: 'user',
      });
      await this.userRepository.save([author, client]);
    }

    const count = await this.indexRepository.count();
    if (count === 0) {
      this.logger.log('Инициализация начальных опубликованных индексов...');
      const initialIndexes: Partial<DatabaseIndex>[] = [
        {
          indexName: 'idx_users_email',
          shortDescription: 'Ускорение поиска пользователей по уникальному email',
          tableName: 'users',
          indexType: 'B-Tree',
          columnName: 'email',
          cardinality: 500000,
          fullDescription: 'B-Tree индекс по полю email снижает время поиска пользователя при авторизации с полного сканирования таблицы (Seq Scan) до индексного (Index Scan).',
          imageUrl: 'index_users_email.jpg',
          videoUrl: 'index_users_email.mp4',
          status: IndexStatus.PUBLISHED,
          authorId: 1,
          likesCount: 5,
          publishedAt: new Date(),
        },
        {
          indexName: 'idx_orders_created_at',
          shortDescription: 'Оптимизация выборки последних заказов интернет-магазина',
          tableName: 'orders',
          indexType: 'BRIN',
          columnName: 'created_at',
          cardinality: 2500000,
          fullDescription: 'BRIN индекс для хронологически растущих данных таблицы заказов. Занимает в 10 раз меньше памяти, чем B-Tree.',
          imageUrl: 'index_orders_created_at.jpg',
          videoUrl: 'index_orders_created_at.mp4',
          status: IndexStatus.PUBLISHED,
          authorId: 2, // Чужой автор для проверки 403 Forbidden
          likesCount: 3,
          publishedAt: new Date(),
        },
        {
          indexName: 'idx_products_sku',
          shortDescription: 'Мгновенный поиск товаров по артикулу (SKU)',
          tableName: 'products',
          indexType: 'Hash',
          columnName: 'sku',
          cardinality: 80000,
          fullDescription: 'Hash-индекс идеален для строгого сравнения на равенство по артикулу товара.',
          imageUrl: 'index_products_sku.jpg',
          videoUrl: 'index_products_sku.mp4',
          status: IndexStatus.PUBLISHED,
          authorId: 1,
          likesCount: 7,
          publishedAt: new Date(),
        },
        {
          indexName: 'idx_analytics_event_date_btree',
          shortDescription: 'Быстрая фильтрация событий аналитики по диапазону дат',
          tableName: 'analytics_events',
          indexType: 'B-Tree',
          columnName: 'event_date',
          cardinality: 10000000,
          fullDescription: 'Двухуровневый B-Tree индекс для быстрых отчетов по диапазонам дат.',
          imageUrl: 'idx_analytics_event_date_btree.jpg',
          videoUrl: 'idx_analytics_event_date_btree.mp4',
          status: IndexStatus.PUBLISHED,
          authorId: 1,
          likesCount: 2,
          publishedAt: new Date(),
        },
        {
          indexName: 'idx_logs_timestamp',
          shortDescription: 'BRIN индекс для архива системных логов',
          tableName: 'system_logs',
          indexType: 'BRIN',
          columnName: 'timestamp',
          cardinality: 50000000,
          fullDescription: 'Обеспечивает компактное хранение и быстрый поиск по временным меткам логов.',
          imageUrl: 'index_logs_timestamp.jpg',
          videoUrl: 'index_logs_timestamp.mp4',
          status: IndexStatus.PUBLISHED,
          authorId: 1,
          likesCount: 1,
          publishedAt: new Date(),
        },
      ];

      for (const item of initialIndexes) {
        const entity = this.indexRepository.create(item);
        await this.indexRepository.save(entity);
      }
      this.logger.log('Начальные опубликованные индексы успешно созданы.');
    }
  }

  /**
   * Преобразование Entity -> DTO с прямыми ссылками на MinIO и расчётом флагов 0/1
   */
  private async toDto(entity: DatabaseIndex, currentUserId?: number): Promise<IndexResponseDto> {
    const isLiked = currentUserId
      ? await this.likeRepository.exists({
          where: { indexId: entity.id, userId: currentUserId },
        })
      : false;

    const imageUrl = await this.minioService.getPresignedUrl(entity.imageUrl);
    const videoUrl = await this.minioService.getPresignedUrl(entity.videoUrl);

    let authorUsername = entity.author ? entity.author.username : null;
    if (!authorUsername && entity.authorId) {
      const user = await this.userRepository.findOne({ where: { id: entity.authorId } });
      authorUsername = user ? user.username : null;
    }

    const isOwnerFlag = currentUserId && entity.authorId === currentUserId ? 1 : 0;

    return {
      id: entity.id,
      indexName: entity.indexName ?? '',
      shortDescription: entity.shortDescription ?? '',
      imageFileName: entity.imageUrl ?? null,
      videoFileName: entity.videoUrl ?? null,
      imageUrl: imageUrl ?? null,
      videoUrl: videoUrl ?? null,
      tableName: entity.tableName ?? '',
      indexType: entity.indexType ?? '',
      columnName: entity.columnName ?? '',
      cardinality: Number(entity.cardinality || 0),
      fullDescription: entity.fullDescription ?? '',
      likesCount: Number(entity.likesCount || 0),
      isLiked: isLiked ? 1 : 0,
      isLikedByCurrentUser: isLiked,
      authorId: entity.authorId ?? null,
      authorUsername: authorUsername,
      isOwner: isOwnerFlag,
      createdAt: entity.createdAt,
      publishedAt: entity.publishedAt ?? null,
    };
  }

  /**
   * 1. GET /api/indexes — список с фильтрацией (только опубликованные)
   */
  async findAll(filters: IndexFiltersDto, currentUserId?: number): Promise<IndexResponseDto[]> {
    const qb = this.indexRepository
      .createQueryBuilder('index')
      .leftJoinAndSelect('index.author', 'author')
      .where('index.status = :status', { status: IndexStatus.PUBLISHED });

    if (filters.search) {
      qb.andWhere(
        '(index.indexName ILIKE :search OR index.shortDescription ILIKE :search OR index.tableName ILIKE :search)',
        { search: `%${filters.search}%` },
      );
    }

    if (filters.indexType) {
      qb.andWhere('index.indexType = :indexType', { indexType: filters.indexType });
    }

    if (filters.minCardinality !== undefined) {
      qb.andWhere('index.cardinality >= :minCardinality', { minCardinality: filters.minCardinality });
    }

    qb.orderBy('index.id', 'ASC');

    const entities = await qb.getMany();
    return Promise.all(entities.map((item) => this.toDto(item, currentUserId)));
  }

  /**
   * 2. GET /api/indexes/feed — лента услуг (только опубликованные)
   */
  async getFeed(id?: number, next?: boolean, currentUserId?: number): Promise<FeedResponseDto> {
    const publishedList = await this.indexRepository.find({
      select: { id: true },
      where: { status: IndexStatus.PUBLISHED },
      order: { id: 'ASC' },
    });

    if (publishedList.length === 0) {
      return {
        current: null,
        prevId: null,
        nextId: null,
      };
    }

    const ids = publishedList.map((item) => item.id);
    let targetIndex = 0;

    if (id !== undefined) {
      const foundIdx = ids.indexOf(id);
      if (foundIdx !== -1) {
        if (next === true) {
          targetIndex = (foundIdx + 1) % ids.length;
        } else {
          targetIndex = foundIdx;
        }
      }
    }

    const targetId = ids[targetIndex];
    const entity = await this.indexRepository.findOne({
      where: { id: targetId, status: IndexStatus.PUBLISHED },
      relations: { author: true },
    });

    if (!entity) {
      throw new NotFoundException('Индекс не найден');
    }

    const prevId = targetIndex > 0 ? ids[targetIndex - 1] : ids[ids.length - 1];
    const nextId = targetIndex < ids.length - 1 ? ids[targetIndex + 1] : ids[0];

    const currentDto = await this.toDto(entity, currentUserId);

    return {
      current: currentDto,
      prevId: prevId,
      nextId: nextId,
    };
  }

  /**
   * 3. GET /api/indexes/draft — получение черновика текущего пользователя
   */
  async getDraft(currentUserId: number): Promise<IndexResponseDto> {
    const draft = await this.indexRepository.findOne({
      where: {
        authorId: currentUserId,
        status: IndexStatus.DRAFT,
      },
      relations: { author: true },
    });

    if (!draft) {
      throw new NotFoundException('Черновик не найден');
    }

    return this.toDto(draft, currentUserId);
  }

  /**
   * 4. POST /api/indexes — добавление/сохранение черновика + файлов картинки и видео
   * Автор строго берется из сессии currentUserId!
   */
  async createOrUpdateDraft(
    dto: CreateDraftDto,
    currentUserId: number,
    imageFile?: Express.Multer.File,
    videoFile?: Express.Multer.File,
  ): Promise<IndexResponseDto> {
    let draft = await this.indexRepository.findOne({
      where: {
        authorId: currentUserId,
        status: IndexStatus.DRAFT,
      },
      relations: { author: true },
    });

    let imageFileName = draft ? draft.imageUrl : null;
    let videoFileName = draft ? draft.videoUrl : null;

    if (imageFile) {
      if (draft && draft.imageUrl && !draft.imageUrl.startsWith('default_')) {
        await this.minioService.deleteFile(draft.imageUrl);
      }
      imageFileName = await this.minioService.uploadMediaFile(
        imageFile.buffer,
        imageFile.originalname,
        'image',
        imageFile.mimetype,
      );
    }

    if (videoFile) {
      if (draft && draft.videoUrl && !draft.videoUrl.startsWith('default_')) {
        await this.minioService.deleteFile(draft.videoUrl);
      }
      videoFileName = await this.minioService.uploadMediaFile(
        videoFile.buffer,
        videoFile.originalname,
        'video',
        videoFile.mimetype,
      );
    }

    if (!draft) {
      draft = this.indexRepository.create({
        ...dto,
        status: IndexStatus.DRAFT,
        authorId: currentUserId, // Привязка автора строго из сессии
        imageUrl: imageFileName || 'default_index.jpg',
        videoUrl: videoFileName || 'default_video.mp4',
        likesCount: 0,
      });
    } else {
      Object.assign(draft, dto);
      if (imageFileName) draft.imageUrl = imageFileName;
      if (videoFileName) draft.videoUrl = videoFileName;
    }

    const saved = await this.indexRepository.save(draft);
    const reloaded = await this.indexRepository.findOne({
      where: { id: saved.id },
      relations: { author: true },
    });
    return this.toDto(reloaded!, currentUserId);
  }

  /**
   * 5. PUT /api/indexes/:id/publish — публикация услуги (смена статуса на published)
   * Проверяет права: авторство текущего пользователя. Чужая услуга -> 403 Forbidden!
   */
  async publish(id: number, currentUserId: number, dto?: PublishIndexDto): Promise<IndexResponseDto> {
    const entity = await this.indexRepository.findOne({
      where: { id },
      relations: { author: true },
    });

    if (!entity || entity.status === IndexStatus.DELETED) {
      throw new NotFoundException('Услуга не найдена');
    }

    if (entity.authorId !== currentUserId) {
      throw new ForbiddenException('Запрещено публиковать чужую услугу (доступ запрещен)');
    }

    if (entity.status === IndexStatus.PUBLISHED) {
      throw new BadRequestException('Услуга уже опубликована');
    }

    if (dto) {
      for (const [key, value] of Object.entries(dto)) {
        if (value !== undefined) {
          (entity as any)[key] = value;
        }
      }
    }

    entity.status = IndexStatus.PUBLISHED;
    entity.publishedAt = new Date();

    const saved = await this.indexRepository.save(entity);
    const reloaded = await this.indexRepository.findOne({
      where: { id: saved.id },
      relations: { author: true },
    });
    return this.toDto(reloaded!, currentUserId);
  }

  /**
   * 6. DELETE /api/indexes/:id — мягкое удаление услуги
   */
  async softDelete(id: number, currentUserId: number): Promise<void> {
    const entity = await this.indexRepository.findOne({
      where: { id },
    });

    if (!entity || entity.status === IndexStatus.DELETED) {
      throw new NotFoundException('Услуга не найдена');
    }

    if (entity.authorId !== currentUserId) {
      throw new ForbiddenException('Запрещено удалять чужую услугу');
    }

    entity.status = IndexStatus.DELETED;
    await this.indexRepository.save(entity);
  }

  /**
   * 7. POST /api/indexes/:id/like — постановка или отмена лайка
   */
  async toggleLike(id: number, currentUserId: number, value: number): Promise<IndexResponseDto> {
    const entity = await this.indexRepository.findOne({
      where: { id },
      relations: { author: true },
    });

    if (!entity || entity.status === IndexStatus.DELETED) {
      throw new NotFoundException('Услуга не найдена');
    }

    const existingLike = await this.likeRepository.findOne({
      where: { indexId: id, userId: currentUserId },
    });

    if (value === 1) {
      if (!existingLike) {
        const newLike = this.likeRepository.create({
          indexId: id,
          userId: currentUserId,
        });
        await this.likeRepository.save(newLike);

        entity.likesCount = Number(entity.likesCount || 0) + 1;
        await this.indexRepository.save(entity);
      }
    } else if (value === 0) {
      if (existingLike) {
        await this.likeRepository.remove(existingLike);

        entity.likesCount = Math.max(0, Number(entity.likesCount || 0) - 1);
        await this.indexRepository.save(entity);
      }
    }

    return this.toDto(entity, currentUserId);
  }

  /**
   * Получение услуги по ID
   */
  async findOne(id: number, currentUserId?: number): Promise<IndexResponseDto> {
    const entity = await this.indexRepository.findOne({
      where: { id, status: IndexStatus.PUBLISHED },
      relations: { author: true },
    });

    if (!entity) {
      throw new NotFoundException('Услуга не найдена');
    }

    return this.toDto(entity, currentUserId);
  }
}
