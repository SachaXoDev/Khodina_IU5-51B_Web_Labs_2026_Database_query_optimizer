import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  OnModuleInit,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { createHash, timingSafeEqual } from 'node:crypto';
import { loadModule, type LanguageIdentifier } from 'cld3-asm';
import { Repository } from 'typeorm';
import { DatabaseIndex, IndexStatus } from './entities/database-index.entity';
import { IndexLike } from './entities/index-like.entity';
import { User } from '../users/entities/user.entity';
import { MinioService } from './minio.service';
import { DEFAULT_INDEX_PAGE_SIZE, IndexFiltersDto, MAX_INDEX_PAGE_SIZE } from './dto/index-filters.dto';
import { CreateDraftDto } from './dto/create-draft.dto';
import { PublishIndexDto } from './dto/publish-index.dto';
import { ClipCandidateDto, ClipCandidatePageDto, FeedResponseDto, IndexPageDto, IndexResponseDto } from './dto/index-response.dto';
import { FeedStateService, FEED_BATCH_SIZE } from './feed-state.service';
import { RotationDto } from './dto/rotation.dto';

const DEMO_MODEL = '/assets/demo-index-model.glb';
const DEMO_IMAGE = '/assets/default_index.svg';
const DEMO_VIDEO = '/assets/default_video.mp4';

function validateGlb(file: Express.Multer.File): void {
  const data = file.buffer;
  if (!/\.glb$/i.test(file.originalname) || data.length < 20 || data.length % 4 !== 0 ||
      data.toString('ascii', 0, 4) !== 'glTF' || data.readUInt32LE(4) !== 2 ||
      data.readUInt32LE(8) !== data.length || data.toString('ascii', 16, 20) !== 'JSON') {
    throw new BadRequestException('Некорректный файл glTF Binary 2.0');
  }

  try {
    let offset = 12;
    while (offset < data.length) {
      if (offset + 8 > data.length) throw new Error('Truncated chunk');
      const length = data.readUInt32LE(offset);
      const next = offset + 8 + length;
      if (length % 4 !== 0 || next > data.length) throw new Error('Invalid chunk length');
      if (offset === 12) {
        const json = JSON.parse(data.toString('utf8', 20, next));
        if (json?.asset?.version !== '2.0') throw new Error('Invalid glTF asset version');
      }
      offset = next;
    }
  } catch {
    throw new BadRequestException('Некорректная структура файла .glb');
  }
}

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
    private readonly feedState: FeedStateService,
    private readonly config: ConfigService,
  ) {}

  async onModuleInit() {
    await this.seedInitialData();
  }

  /**
   * Инициализация начальных пользователей и опубликованных индексов
   */
  private async seedInitialData() {
    let authors: User[];
    const userCount = await this.userRepository.count();
    if (userCount === 0) {
      // Use generated IDs so later registration does not collide with the sequence.
      this.logger.log('Инициализация начальных пользователей...');
      const author = this.userRepository.create({
        username: 'pg_expert',
        password: 'password123',
        role: 'admin',
      });
      const client = this.userRepository.create({
        username: 'dba_junior',
        password: 'password123',
        role: 'user',
      });
      authors = await this.userRepository.save([author, client]);
    } else {
      authors = await this.userRepository.find({ order: { id: 'ASC' }, take: 2 });
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
        const entity = this.indexRepository.create({
          ...item,
          authorId: authors[(item.authorId ?? 1) - 1]?.id ?? authors[0]?.id,
          modelKey: DEMO_MODEL,
        });
        await this.indexRepository.save(entity);
      }
      this.logger.log('Начальные опубликованные индексы успешно созданы.');
    }
  }

  /**
   * Преобразование Entity -> DTO с прямыми ссылками на MinIO и расчётом флагов 0/1
   */
  private async toDto(entity: DatabaseIndex, currentUserId?: number, liked?: boolean): Promise<IndexResponseDto> {
    const isLiked = liked ?? (currentUserId
      ? await this.likeRepository.exists({
          where: { indexId: entity.id, userId: currentUserId },
        })
      : false);

    const [imageUrl, videoUrl, modelUrl] = await Promise.all([
      entity.imageUrl === 'default_index.jpg' || entity.imageUrl === 'default_index.svg'
        ? DEMO_IMAGE : this.minioService.getPresignedUrl(entity.imageUrl),
      entity.videoUrl === 'default_video.mp4' ? DEMO_VIDEO : this.minioService.getPresignedUrl(entity.videoUrl),
      this.minioService.getPresignedUrl(entity.modelKey),
    ]);

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
      modelUrl: modelUrl ?? null,
      rotationX: entity.rotationX,
      rotationY: entity.rotationY,
      status: entity.status,
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
  async findAll(filters: IndexFiltersDto, currentUserId?: number): Promise<IndexPageDto> {
    const limit = Math.min(filters.limit ?? DEFAULT_INDEX_PAGE_SIZE, MAX_INDEX_PAGE_SIZE);
    const offset = filters.offset ?? 0;
    const qb = this.indexRepository
      .createQueryBuilder('index')
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
      qb.andWhere('index.cardinality = :minCardinality', { minCardinality: filters.minCardinality });
    }

    const [entities, total] = await Promise.all([
      qb.clone().leftJoinAndSelect('index.author', 'author').orderBy('index.id', 'ASC').limit(limit).offset(offset).getMany(),
      qb.getCount(),
    ]);

    const likedRows = currentUserId && entities.length > 0
      ? await this.likeRepository.createQueryBuilder('like')
          .select('like.indexId', 'id')
          .where('like.userId = :currentUserId', { currentUserId })
          .andWhere('like.indexId IN (:...ids)', { ids: entities.map(({ id }) => id) })
          .getRawMany<{ id: number }>()
      : [];
    const likedIds = new Set(likedRows.map(({ id }) => id));
    const items = await Promise.all(entities.map((item) => this.toDto(item, currentUserId, likedIds.has(item.id))));
    return { items, total, offset, limit };
  }

  private clipLanguage?: Promise<LanguageIdentifier>;

  async getClipCandidates(afterId: number, limit: number): Promise<ClipCandidatePageDto> {
    const scanSize = 256;
    const caption = 'btrim(index.shortDescription, :whitespace)';
    // Match String.trim() even when the database locale has a different idea of whitespace.
    const whitespace = '\t\n\v\f\r \u00a0\u1680\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200a\u2028\u2029\u202f\u205f\u3000\ufeff';
    const items: ClipCandidateDto[] = [];
    let cursor = afterId;
    for (;;) {
      const rows = await this.indexRepository.createQueryBuilder('index')
        .select('index.id', 'id')
        .addSelect(caption, 'shortDescription')
        .where('index.status = :status', { status: IndexStatus.PUBLISHED })
        .andWhere('index.id > :cursor', { cursor })
        // Exclude the reserved synthetic names even on databases seeded by the older script.
        .andWhere('index.indexName !~ :benchmarkName', { benchmarkName: '^demo_bench_idx_[0-9]{6}$' })
        .andWhere(`char_length(${caption}) BETWEEN 50 AND 100`, { whitespace })
        .orderBy('index.id', 'ASC')
        .limit(scanSize)
        .getRawMany<ClipCandidateDto>();
      if (rows.length === 0) break;

      // CLD3's default minimum is 140 bytes, larger than most eligible captions.
      this.clipLanguage ??= loadModule().then((factory) => factory.create(0, 400));
      const detector = await this.clipLanguage;
      for (const row of rows) {
        // On short text CLD3 can rank English first without meeting its reliability threshold.
        if (detector.findLanguage(row.shortDescription).language !== 'en') continue;
        if (items.length === limit) return { items, nextAfterId: items[items.length - 1].id };
        items.push(row);
      }
      if (rows.length < scanSize) break;
      cursor = rows[rows.length - 1].id;
    }
    return { items, nextAfterId: null };
  }

  async getFeed(key: string, id: number | undefined, next: boolean, currentUserId?: number): Promise<FeedResponseDto> {
    if (id !== undefined && !next) {
      const [entity, metadata] = await Promise.all([this.findPublished(id), this.feedState.poll(key, id)]);
      return { current: entity ? await this.toDto(entity, currentUserId) : null, ...metadata };
    }

    const selected = await this.feedState.select(key, next, id, async () => {
      const sample = await this.indexRepository.createQueryBuilder('index')
        .select('index.id', 'id')
        .where('index.status = :status', { status: IndexStatus.PUBLISHED })
        .orderBy('random()')
        .limit(FEED_BATCH_SIZE)
        .getRawMany<{ id: number }>();
      return sample.map((row) => row.id);
    });

    const entity = selected.id === null ? null : await this.findPublished(selected.id);
    if (!entity) return { current: null, position: null, batchSize: selected.batchSize };

    const current = await this.toDto(entity, currentUserId);
    if (selected.shouldRotate) void this.requestRotation(entity);
    return { current, position: selected.position, batchSize: selected.batchSize };
  }

  private async requestRotation(entity: DatabaseIndex): Promise<void> {
    const configuredUrl = this.config.get<string>('ASYNC_ROTATION_URL');
    if (!configuredUrl) {
      this.logger.warn(`Поворот ${entity.id} пропущен: переменная ASYNC_ROTATION_URL не задана`);
      return;
    }

    try {
      const endpoint = new URL(configuredUrl);
      const pathname = endpoint.pathname.replace(/\/+$/, '');
      endpoint.pathname = pathname.endsWith('/rotate') ? pathname : `${pathname}/rotate`;

      const { id, rotationX, rotationY } = entity;
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, rotationX, rotationY }),
        redirect: 'error',
        signal: AbortSignal.timeout(2500),
      });
      await response.body?.cancel();
      if (response.status !== 202) throw new Error(`HTTP ${response.status}`);
    } catch (error) {
      this.logger.warn(`Не удалось запустить поворот для ${entity.id}: ${String(error)}`);
    }
  }

  async saveRotation(id: number, suppliedKey: string | undefined, dto: RotationDto): Promise<void> {
    const expectedKey = this.config.get<string>('ROTATION_RESULT_KEY');
    if (!expectedKey || typeof suppliedKey !== 'string' || !timingSafeEqual(
      createHash('sha256').update(suppliedKey).digest(), createHash('sha256').update(expectedKey).digest(),
    )) {
      throw new UnauthorizedException('Неверный X-Result-Key');
    }

    const { rotationX, rotationY } = dto;
    if (!Number.isFinite(rotationX) || !Number.isFinite(rotationY)) {
      throw new BadRequestException('Углы поворота должны быть конечными числами');
    }
    const result = await this.indexRepository.update({ id, status: IndexStatus.PUBLISHED }, { rotationX, rotationY });
    if (!result.affected) throw new NotFoundException('Услуга не найдена');
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
    modelFile?: Express.Multer.File,
  ): Promise<IndexResponseDto> {
    if (modelFile) validateGlb(modelFile);

    let draft = await this.indexRepository.findOne({
      where: {
        authorId: currentUserId,
        status: IndexStatus.DRAFT,
      },
      relations: { author: true },
    });

    let imageFileName = draft ? draft.imageUrl : null;
    let videoFileName = draft ? draft.videoUrl : null;
    const previousModelKey = draft?.modelKey ?? null;
    let modelKey = previousModelKey;

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

    if (modelFile) {
      modelKey = await this.minioService.uploadMediaFile(modelFile.buffer, modelFile.originalname, 'model', 'model/gltf-binary');
    }

    if (!draft) {
      draft = this.indexRepository.create({
        ...dto,
        status: IndexStatus.DRAFT,
        authorId: currentUserId, // Привязка автора строго из сессии
        imageUrl: imageFileName || 'default_index.jpg',
        videoUrl: videoFileName || 'default_video.mp4',
        modelKey,
        likesCount: 0,
      });
    } else {
      Object.assign(draft, dto);
      if (imageFileName) draft.imageUrl = imageFileName;
      if (videoFileName) draft.videoUrl = videoFileName;
      draft.modelKey = modelKey;
    }

    const saved = await this.indexRepository.save(draft);
    if (modelFile && previousModelKey && previousModelKey !== DEMO_MODEL) {
      await this.minioService.deleteFile(previousModelKey);
    }
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

    await this.indexRepository.update({ id }, { status: IndexStatus.DELETED });
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
    const entity = await this.findPublished(id);

    if (!entity) {
      throw new NotFoundException('Услуга не найдена');
    }

    return this.toDto(entity, currentUserId);
  }

  private findPublished(id: number): Promise<DatabaseIndex | null> {
    return this.indexRepository.findOne({
      where: { id, status: IndexStatus.PUBLISHED },
      relations: { author: true },
    });
  }
}
