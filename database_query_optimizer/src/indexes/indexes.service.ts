import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { DatabaseIndex, IndexStatus } from './entities/database-index.entity';
import { IndexLike } from './entities/index-like.entity';
import { User } from '../users/entities/user.entity';

export interface CreateDraftDto {
  indexName: string;
  imageUrl?: string;
  videoUrl?: string;
}

export interface PublishIndexDto {
  indexName?: string;
  shortDescription?: string;
  tableName?: string;
  indexType?: string;
  columnName?: string;
  cardinality?: number;
  scanCostReductionPercent?: number;
  estimatedSpeedupFactor?: number;
  estimatedCreationTimeSec?: number;
  fullDescription?: string;
}

@Injectable()
export class IndexesService implements OnModuleInit {
  public static readonly DEFAULT_VIDEO_URL = 'http://localhost:9000/media/default_video.mp4';
  public static readonly DEFAULT_IMAGE_URL = 'http://localhost:9000/media/default_index.svg';

  constructor(
    @InjectRepository(DatabaseIndex)
    private readonly indexRepository: Repository<DatabaseIndex>,
    @InjectRepository(IndexLike)
    private readonly likeRepository: Repository<IndexLike>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly dataSource: DataSource,
  ) {}

  async onModuleInit() {
    await this.seedInitialData();
  }

  /**
   * Метод автосидирования БД при старте.
   */
  async seedInitialData(forceReset: boolean = false) {
    if (forceReset) {
      await this.likeRepository.delete({});
      await this.indexRepository.delete({});
    }

    let defaultUser = await this.userRepository.findOne({ where: { username: 'pg_expert' } });
    if (!defaultUser) {
      defaultUser = this.userRepository.create({
        username: 'pg_expert',
        role: 'admin',
      });
      defaultUser = await this.userRepository.save(defaultUser);
    }

    const indexesCount = await this.indexRepository.count();
    if (indexesCount === 0) {
      const initialIndexes: Partial<DatabaseIndex>[] = [
        // 1. Опубликованные индексы (status = PUBLISHED)
        {
          indexName: 'idx_users_email_btree',
          shortDescription: 'Ускоряет поиск пользователя по уникальному email при авторизации с миллисекунд до долей миллисекунды.',
          status: IndexStatus.PUBLISHED,
          tableName: 'users',
          indexType: 'B-Tree',
          columnName: 'email',
          cardinality: 500000,
          scanCostReductionPercent: 98.5,
          estimatedSpeedupFactor: 45.0,
          estimatedCreationTimeSec: 12,
          recommendedWorkload: 'OLTP',
          fullDescription: 'B-Tree индекс организует значения поля email в сбалансированное дерево поиска. Идеально подходит для операций точного совпадения (=) и поиска по диапазону (<, >, BETWEEN). Снижает время выполнения запросов SELECT * FROM users WHERE email = $1 с 350мс до 0.8мс.',
          imageUrl: 'http://localhost:9000/media/index_users_email.jpg',
          videoUrl: 'http://localhost:9000/media/index_users_email.mp4',
          likesCount: 5,
          author: defaultUser,
          publishedAt: new Date(),
        },
        {
          indexName: 'idx_orders_created_at_brin',
          shortDescription: 'Компактный индекс диапазона блоков для аналитических запросов по дате в больших журналах заказов.',
          status: IndexStatus.PUBLISHED,
          tableName: 'orders',
          indexType: 'BRIN',
          columnName: 'created_at',
          cardinality: 10000000,
          scanCostReductionPercent: 92.0,
          estimatedSpeedupFactor: 12.5,
          estimatedCreationTimeSec: 4,
          recommendedWorkload: 'OLAP / Time-Series',
          fullDescription: 'BRIN (Block Range Index) хранит минимальные и максимальные значения для блоков страниц на диске. Занимает в сотни раз меньше памяти, чем B-Tree, и превосходно ускоряет выборки по временным срезам в таблицах с естественной сортировкой данных.',
          imageUrl: 'http://localhost:9000/media/index_orders_created_at.jpg',
          videoUrl: 'http://localhost:9000/media/index_orders_created_at.mp4',
          likesCount: 12,
          author: defaultUser,
          publishedAt: new Date(),
        },
        {
          indexName: 'idx_products_sku_hash',
          shortDescription: 'Обобщенный инвертированный индекс для мгновенного поиска по артикулу и атрибутам каталога.',
          status: IndexStatus.PUBLISHED,
          tableName: 'products',
          indexType: 'Hash',
          columnName: 'sku',
          cardinality: 150000,
          scanCostReductionPercent: 95.0,
          estimatedSpeedupFactor: 28.0,
          estimatedCreationTimeSec: 25,
          recommendedWorkload: 'E-commerce Search',
          fullDescription: 'Хеш-индекс оптимизирован исключительно для операций строгого равенства (=). Позволяет мгновенно находить товары по точному артикулу SKU без лишней нагрузки на страницы дерева.',
          imageUrl: 'http://localhost:9000/media/index_products_sku.jpg',
          videoUrl: 'http://localhost:9000/media/index_products_sku.mp4',
          likesCount: 8,
          author: defaultUser,
          publishedAt: new Date(),
        },
        // 2. Черновик (status = DRAFT)
        {
          indexName: 'idx_analytics_event_date_draft',
          shortDescription: 'Черновик: Индекс для ускорения аналитических витрин реального времени.',
          status: IndexStatus.DRAFT,
          tableName: 'analytics_events',
          indexType: 'B-Tree',
          columnName: 'event_time',
          cardinality: 2500000,
          scanCostReductionPercent: 94.0,
          estimatedSpeedupFactor: 22.0,
          estimatedCreationTimeSec: 15,
          recommendedWorkload: 'Analytics / OLAP',
          fullDescription: 'Черновик конфигурации индекса для ускорения дашбордов.',
          imageUrl: IndexesService.DEFAULT_IMAGE_URL,
          videoUrl: IndexesService.DEFAULT_VIDEO_URL,
          likesCount: 0,
          author: defaultUser,
          publishedAt: null,
        },
        // 3. Удаленная услуга (status = DELETED)
        {
          indexName: 'idx_legacy_archive_deleted',
          shortDescription: 'Устаревший архивный индекс, выведенный из эксплуатации.',
          status: IndexStatus.DELETED,
          tableName: 'legacy_logs',
          indexType: 'GiST',
          columnName: 'archived_payload',
          cardinality: 400000,
          scanCostReductionPercent: 60.0,
          estimatedSpeedupFactor: 5.0,
          estimatedCreationTimeSec: 30,
          recommendedWorkload: 'Archived',
          fullDescription: 'Удаленная карточка оптимизации, недоступная для публичного просмотра.',
          imageUrl: IndexesService.DEFAULT_IMAGE_URL,
          videoUrl: IndexesService.DEFAULT_VIDEO_URL,
          likesCount: 1,
          author: defaultUser,
          publishedAt: new Date(),
        },
      ];

      for (const item of initialIndexes) {
        const entity = this.indexRepository.create(item);
        const saved = await this.indexRepository.save(entity);

        if (item.likesCount && item.likesCount > 0 && item.status === IndexStatus.PUBLISHED) {
          const like = this.likeRepository.create({
            userId: defaultUser.id,
            indexId: saved.id,
          });
          await this.likeRepository.save(like);
        }
      }
    }
  }

  /**
   * 1. GET: Лента опубликованных индексов (Feed) через ORM
   */
  async getFeedIndex(currentId?: number, isNext: boolean = true) {
    const all = await this.indexRepository.find({
      where: { status: IndexStatus.PUBLISHED },
      order: { id: 'ASC' },
      relations: { author: true, likes: true },
    });

    if (!all || all.length === 0) {
      return {
        current: null,
        prevId: null,
        nextId: null,
        hasPrev: false,
        hasNext: false,
      };
    }

    let currentIndex = 0;
    if (currentId !== undefined) {
      const idx = all.findIndex((item) => item.id === currentId);
      if (idx !== -1) {
        if (isNext) {
          currentIndex = (idx + 1) % all.length;
        } else {
          currentIndex = idx;
        }
      }
    }

    const current = all[currentIndex];
    const prevId = currentIndex > 0 ? all[currentIndex - 1].id : all[all.length - 1].id;
    const nextId = currentIndex < all.length - 1 ? all[currentIndex + 1].id : all[0].id;

    return {
      current,
      prevId,
      nextId,
      hasPrev: true,
      hasNext: true,
    };
  }

  /**
   * 2. GET: Каталог опубликованных индексов с фильтрацией через ORM
   */
  async findAll(params?: {
    search?: string;
    indexType?: string;
    minCardinality?: number;
  }): Promise<DatabaseIndex[]> {
    const qb = this.indexRepository
      .createQueryBuilder('index')
      .leftJoinAndSelect('index.author', 'author')
      .leftJoinAndSelect('index.likes', 'likes')
      .where('index.status = :status', { status: IndexStatus.PUBLISHED })
      .orderBy('index.id', 'ASC');

    if (params?.search && params.search.trim() !== '') {
      const term = `%${params.search.trim().toLowerCase()}%`;
      qb.andWhere(
        '(LOWER(index.indexName) LIKE :term OR LOWER(index.tableName) LIKE :term OR LOWER(index.columnName) LIKE :term OR LOWER(index.shortDescription) LIKE :term)',
        { term },
      );
    }

    if (params?.indexType && params.indexType !== 'Все типы' && params.indexType.trim() !== '') {
      qb.andWhere('index.indexType = :indexType', { indexType: params.indexType.trim() });
    }

    if (params?.minCardinality !== undefined && !isNaN(params.minCardinality)) {
      qb.andWhere('index.cardinality = :minCardinality', { minCardinality: params.minCardinality });
    }

    return await qb.getMany();
  }

  /**
   * 3. GET: Получить текущий черновик пользователя
   */
  async getUserDraft(userId: number = 1): Promise<DatabaseIndex | null> {
    return await this.indexRepository.findOne({
      where: {
        status: IndexStatus.DRAFT,
        authorId: userId,
      },
      relations: { author: true },
    });
  }

  /**
   * Поиск одного индекса по ID
   */
  async findById(id: number): Promise<DatabaseIndex | null> {
    return await this.indexRepository.findOne({
      where: { id },
      relations: { author: true, likes: true },
    });
  }

  /**
   * 4. POST: Создание черновика через ORM
   */
  async createDraft(dto: CreateDraftDto, userId: number = 1): Promise<DatabaseIndex> {
    let draft = await this.getUserDraft(userId);
    if (draft) {
      draft.indexName = dto.indexName;
      if (dto.imageUrl) draft.imageUrl = dto.imageUrl;
      if (dto.videoUrl) draft.videoUrl = dto.videoUrl;
      return await this.indexRepository.save(draft);
    }

    const author = await this.userRepository.findOne({ where: { id: userId } });

    draft = this.indexRepository.create({
      indexName: dto.indexName,
      status: IndexStatus.DRAFT,
      imageUrl: dto.imageUrl && dto.imageUrl.trim() !== '' ? dto.imageUrl : IndexesService.DEFAULT_IMAGE_URL,
      videoUrl: dto.videoUrl && dto.videoUrl.trim() !== '' ? dto.videoUrl : IndexesService.DEFAULT_VIDEO_URL,
      shortDescription: '',
      tableName: 'users',
      indexType: 'B-Tree',
      columnName: 'id',
      cardinality: 100000,
      scanCostReductionPercent: 90.0,
      estimatedSpeedupFactor: 10.0,
      estimatedCreationTimeSec: 5,
      recommendedWorkload: 'OLTP',
      fullDescription: '',
      likesCount: 0,
      author: author || undefined,
      publishedAt: null,
    });

    return await this.indexRepository.save(draft);
  }

  /**
   * 5. POST: Публикация карточки через ORM
   */
  async publishDraft(id: number, dto: PublishIndexDto): Promise<DatabaseIndex> {
    const index = await this.indexRepository.findOne({ where: { id } });
    if (!index) {
      throw new Error(`Index with ID ${id} not found`);
    }

    index.status = IndexStatus.PUBLISHED;
    index.publishedAt = new Date();
    
    if (!index.videoUrl || index.videoUrl.startsWith('/assets')) {
      index.videoUrl = IndexesService.DEFAULT_VIDEO_URL;
    }
    if (!index.imageUrl || index.imageUrl.startsWith('/assets')) {
      index.imageUrl = IndexesService.DEFAULT_IMAGE_URL;
    }

    if (dto.indexName !== undefined) index.indexName = dto.indexName;
    if (dto.shortDescription !== undefined) index.shortDescription = dto.shortDescription;
    if (dto.tableName !== undefined) index.tableName = dto.tableName;
    if (dto.indexType !== undefined) index.indexType = dto.indexType;
    if (dto.columnName !== undefined) index.columnName = dto.columnName;
    if (dto.cardinality !== undefined) index.cardinality = Number(dto.cardinality);
    if (dto.scanCostReductionPercent !== undefined) index.scanCostReductionPercent = Number(dto.scanCostReductionPercent);
    if (dto.estimatedSpeedupFactor !== undefined) index.estimatedSpeedupFactor = Number(dto.estimatedSpeedupFactor);
    if (dto.estimatedCreationTimeSec !== undefined) index.estimatedCreationTimeSec = Number(dto.estimatedCreationTimeSec);
    if (dto.fullDescription !== undefined) index.fullDescription = dto.fullDescription;

    return await this.indexRepository.save(index);
  }

  /**
   * 6. POST: Логическое удаление услуги ЧЕРЕЗ ЧИСТЫЙ SQL UPDATE
   */
  async deleteBySql(id: number): Promise<void> {
    await this.dataSource.query(
      `UPDATE database_indexes SET status = 'deleted' WHERE id = $1`,
      [id],
    );
  }
}
