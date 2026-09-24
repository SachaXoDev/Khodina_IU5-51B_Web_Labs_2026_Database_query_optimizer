import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  Render,
  Res,
  Param,
  ParseIntPipe,
} from '@nestjs/common';
import { Response } from 'express';
import { IndexesService, CreateDraftDto, PublishIndexDto } from './indexes.service';
import { IndexStatus } from './entities/database-index.entity';

@Controller('database-indexes')
export class IndexesController {
  constructor(private readonly indexesService: IndexesService) {}

  /**
   * 1. GET: Лента индексов (Feed) через ORM
   */
  @Get('feed')
  async feed(
    @Res() res: Response,
    @Query('id') id?: string,
    @Query('next') next?: string,
  ) {
    const numericId = id ? parseInt(id, 10) : undefined;
    
    // По ТЗ: Если передан ID удаленной услуги (или несуществующей) — запрет просмотра
    if (numericId) {
      const target = await this.indexesService.findById(numericId);
      if (!target || target.status === IndexStatus.DELETED) {
        return res.redirect('/database-indexes/list');
      }
    }

    const isNext = next === 'true';
    const feedData = await this.indexesService.getFeedIndex(numericId, isNext);

    const raw = feedData.current;
    const formattedCurrent = raw
      ? {
          ...raw,
          indexedColumn: raw.columnName,
          description: raw.fullDescription || raw.shortDescription,
          avgQueryTimeMs: raw.estimatedCreationTimeSec ? (raw.estimatedCreationTimeSec * 1.5).toFixed(1) : '12.4',
          compactTotalRows: raw.cardinality ? (raw.cardinality >= 1000000 ? (raw.cardinality / 1000000).toFixed(1) + 'M' : (raw.cardinality / 1000).toFixed(0) + 'k') : '500k',
          likesCount: raw.likes ? raw.likes.length : raw.likesCount,
          isLikedByMe: (raw.likes && raw.likes.some((l) => l.userId === 1)) || false,
        }
      : null;

    return res.render('feed', {
      title: 'Database Index Optimizer — Feed',
      activeTab: 'feed',
      data: formattedCurrent,
      prevId: feedData.prevId,
      nextId: feedData.nextId,
      hasPrev: feedData.hasPrev,
      hasNext: feedData.hasNext,
    });
  }

  /**
   * 2. GET: Каталог опубликованных индексов через ORM
   */
  @Get('list')
  @Render('list')
  async list(
    @Query('query') query?: string,
    @Query('search') search?: string,
    @Query('indexType') indexType?: string,
  ) {
    const effectiveSearch = search;
    const minCardinality = query && query.trim() !== '' ? parseInt(query, 10) : undefined;

    const items = await this.indexesService.findAll({
      search: effectiveSearch,
      indexType,
      minCardinality,
    });

    const formattedData = items.map((item) => {
      // Количество лайков вычисляем динамически по числу строк в таблице index_likes
      const dynamicLikesCount = item.likes && item.likes.length > 0 ? item.likes.length : item.likesCount;
      const isLiked = item.likes && item.likes.some((l) => l.userId === 1);

      return {
        ...item,
        indexedColumn: item.columnName,
        formattedCardinality: item.cardinality ? item.cardinality.toLocaleString('ru-RU') : '0',
        likesCount: dynamicLikesCount,
        isLikedByMe: isLiked,
      };
    });

    return {
      title: 'Database Index Optimizer — Catalog',
      activeTab: 'list',
      data: formattedData,
      query: query || '',
    };
  }

  /**
   * 3. GET: Страница добавления / публикации карточки через ORM
   */
  @Get('create')
  @Render('create')
  async createPage() {
    const existingDraft = await this.indexesService.getUserDraft(1);

    return {
      title: 'Database Index Optimizer — Create',
      activeTab: 'create',
      hasDraft: !!existingDraft,
      draft: existingDraft || {
        indexName: 'idx_analytics_event_date_btree',
        tableName: 'analytics_events',
        indexType: 'B-Tree',
        columnName: 'created_at',
        scanCostReductionPercent: 94.0,
        cardinality: 2500000,
        shortDescription: 'Оптимизация поиска аналитических событий по временной шкале',
        fullDescription: 'B-Tree индекс по полю created_at таблицы analytics_events ускоряет выборку диапазонов дат.',
        imageUrl: '/assets/default_index.svg',
        videoUrl: '/assets/default_video.mp4',
      },
    };
  }

  /**
   * 4. POST: Создание нового черновика через ORM (Кнопка «Далее»)
   */
  @Post('create')
  async createDraft(
    @Body() body: CreateDraftDto,
    @Res() res: Response,
  ) {
    await this.indexesService.createDraft(body, 1);
    return res.redirect('/database-indexes/create');
  }

  /**
   * 5. POST: Публикация карточки через ORM (Кнопка «Опубликовать»)
   */
  @Post(':id/publish')
  async publishIndex(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: PublishIndexDto,
    @Res() res: Response,
  ) {
    await this.indexesService.publishDraft(id, body);
    return res.redirect('/database-indexes/list');
  }

  /**
   * 6. POST: Логическое удаление услуги ЧЕРЕЗ SQL КУРСОР (WHERE CURRENT OF)
   */
  @Post(':id/delete')
  async deleteIndex(
    @Param('id', ParseIntPipe) id: number,
    @Res() res: Response,
  ) {
    await this.indexesService.deleteByCursor(id);
    return res.redirect('/database-indexes/list');
  }
}
