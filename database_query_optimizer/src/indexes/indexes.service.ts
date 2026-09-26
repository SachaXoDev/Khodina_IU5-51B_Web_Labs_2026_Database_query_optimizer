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
import { getCurrentUserId } from '../common/current-user.singleton';
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
   * Инициализация начальных пользователей и опубликованных услуг (индексов)
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
          authorId: 1,
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
   * Преобразование Entity -> DTO с генерацией ссылок на MinIO и проверкой лайка
   */
  private async toDto(entity: DatabaseIndex, currentUserId: number): Promise<IndexResponseDto> {
    const isLiked = await this.likeRepository.exists({
      where: { indexId: entity.id, userId: currentUserId },
    });

    const imageUrl = await this.minioService.getPresignedUrl(entity.imageUrl);
    const videoUrl = await this.minioService.getPresignedUrl(entity.videoUrl);

    let authorUsername = entity.author ? entity.author.username : null;
    if (!authorUsername && entity.authorId) {
      const user = await this.userRepository.findOne({ where: { id: entity.authorId } });
      authorUsername = user ? user.username : null;
    }

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
      isLikedByCurrentUser: isLiked,
      authorId: entity.authorId ?? null,
      authorUsername: authorUsername,
      createdAt: entity.createdAt,
      publishedAt: entity.publishedAt ?? null,
    };
  }

  /**
   * 1. GET /api/indexes — список с фильтрацией (только опубликованные)
   * Удаленные записи и черновики в список не попадают.
   */
  async findAll(filters: IndexFiltersDto): Promise<IndexResponseDto[]> {
    const currentUserId = getCurrentUserId(); // Использование функции-singleton
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
   * Без id возвращает первый опубликованный элемент ленты.
   * С id и ?next=true переходит к следующему элементу ленты.
   */
  async getFeed(id?: number, next?: boolean): Promise<FeedResponseDto> {
    const currentUserId = getCurrentUserId(); // Использование функции-singleton

    // Получаем список ID всех опубликованных индексов
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
        hasPrev: false,
        hasNext: false,
      };
    }

    const ids = publishedList.map((item) => item.id);
    let targetIndex = 0;

    if (id !== undefined) {
      const foundIdx = ids.indexOf(id);
      if (foundIdx !== -1) {
        if (next === true) {
          // Если передан флаг ?next=true, переходим к следующему элементу (или закольцовываем)
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
      throw new NotFoundException();
    }

    const prevId = targetIndex > 0 ? ids[targetIndex - 1] : ids[ids.length - 1];
    const nextId = targetIndex < ids.length - 1 ? ids[targetIndex + 1] : ids[0];

    const currentDto = await this.toDto(entity, currentUserId);

    return {
      current: currentDto,
      prevId: prevId,
      nextId: nextId,
      hasPrev: ids.length > 1,
      hasNext: ids.length > 1,
    };
  }

  /**
   * 3. GET /api/indexes/draft — получение черновика текущего пользователя
   * По ТЗ: не более 1 записи для пользователя, ID в параметрах не указывается.
   */
  async getDraft(): Promise<IndexResponseDto> {
    const currentUserId = getCurrentUserId(); // Использование функции-singleton

    const draft = await this.indexRepository.findOne({
      where: {
        authorId: currentUserId,
        status: IndexStatus.DRAFT,
      },
      relations: { author: true },
    });

    if (!draft) {
      throw new NotFoundException();
    }

    return this.toDto(draft, currentUserId);
  }

  /**
   * 4. POST /api/indexes — добавление/сохранение черновика + файлов картинки и видео
   * Имена файлов генерируются на латинице и сохраняются в БД, файлы загружаются в MinIO.
   * Системные поля вычисляются строго на бэкенде.
   */
  async createOrUpdateDraft(
    dto: CreateDraftDto,
    imageFile?: Express.Multer.File,
    videoFile?: Express.Multer.File,
  ): Promise<IndexResponseDto> {
    const currentUserId = getCurrentUserId(); // Использование функции-singleton

    // Ищем, есть ли уже черновик у этого пользователя (не более 1 черновика)
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
      // Создаем новый черновик
      draft = this.indexRepository.create({
        ...dto,
        status: IndexStatus.DRAFT, // Системное поле вычисляется на бэкенде
        authorId: currentUserId,   // Системное поле из singleton
        imageUrl: imageFileName || 'default_index.jpg',
        videoUrl: videoFileName || 'default_video.mp4',
        likesCount: 0,
      });
    } else {
      // Обновляем существующий черновик
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
   * Вернуть в черновик нельзя. Статус меняется только draft -> published.
   * Системные поля (status, publishedAt) вычисляются на бэкенде.
   */
  async publish(id: number, dto?: PublishIndexDto): Promise<IndexResponseDto> {
    const currentUserId = getCurrentUserId(); // Использование функции-singleton

    const entity = await this.indexRepository.findOne({
      where: { id },
      relations: { author: true },
    });

    if (!entity || entity.status === IndexStatus.DELETED) {
      throw new NotFoundException();
    }

    if (entity.authorId !== currentUserId) {
      throw new ForbiddenException();
    }

    if (entity.status === IndexStatus.PUBLISHED) {
      throw new BadRequestException();
    }

    if (dto) {
      // Исключаем undefined значения, чтобы не затирать существующие поля
      for (const [key, value] of Object.entries(dto)) {
        if (value !== undefined) {
          (entity as any)[key] = value;
        }
      }
    }

    // Системные поля вычисляются на бэкенде
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
   * По ТЗ: только soft delete (status = 'deleted'), записи клиенту больше не отдаются.
   */
  async softDelete(id: number): Promise<void> {
    const currentUserId = getCurrentUserId(); // Использование функции-singleton

    const entity = await this.indexRepository.findOne({
      where: { id },
    });

    if (!entity || entity.status === IndexStatus.DELETED) {
      throw new NotFoundException();
    }

    // Мягкое удаление через ORM
    entity.status = IndexStatus.DELETED;
    await this.indexRepository.save(entity);
  }

  /**
   * 7. POST /api/indexes/:id/like — постановка или отмена лайка
   * Поле value: 1 — ставит лайк, 0 — отменяет лайк.
   */
  async toggleLike(id: number, value: number): Promise<IndexResponseDto> {
    const currentUserId = getCurrentUserId(); // Использование функции-singleton

    const entity = await this.indexRepository.findOne({
      where: { id },
      relations: { author: true },
    });

    if (!entity || entity.status === IndexStatus.DELETED) {
      throw new NotFoundException();
    }

    const existingLike = await this.likeRepository.findOne({
      where: { indexId: id, userId: currentUserId },
    });

    if (value === 1) {
      // Поставить лайк
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
      // Отменить лайк
      if (existingLike) {
        await this.likeRepository.remove(existingLike);

        entity.likesCount = Math.max(0, Number(entity.likesCount || 0) - 1);
        await this.indexRepository.save(entity);
      }
    }

    return this.toDto(entity, currentUserId);
  }

  /**
   * Получение услуги по ID (для детального просмотра опубликованной услуги)
   */
  async findOne(id: number): Promise<IndexResponseDto> {
    const currentUserId = getCurrentUserId();

    const entity = await this.indexRepository.findOne({
      where: { id, status: IndexStatus.PUBLISHED },
      relations: { author: true },
    });

    if (!entity) {
      throw new NotFoundException();
    }

    return this.toDto(entity, currentUserId);
  }
}
