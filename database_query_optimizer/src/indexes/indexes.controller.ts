import { Controller, Get, Param, Post, Query, Render, Res } from '@nestjs/common';
import type { Response } from 'express';
import { IndexesService } from './indexes.service';

@Controller('database-indexes')
export class IndexesController {
  constructor(private readonly indexesService: IndexesService) {}

  // 1. GET: Лента индексов (Vibes-стиль с полноэкранным видео)
  // URL: /database-indexes/feed или /database-indexes/feed?id=1
  @Get('feed')
  @Render('feed')
  renderFeed(
    @Query('id') id?: string,
    @Query('next') next?: string,
  ) {
    const numericId = id ? parseInt(id, 10) : undefined;
    const isNext = next === 'true';
    const feedData = this.indexesService.getFeedIndex(numericId, isNext);

    return {
      title: 'Лента оптимизации индексов B-tree',
      activeTab: 'feed',
      data: feedData ? feedData.current : null,
      nextId: feedData ? feedData.nextId : null,
    };
  }

  // 1.1 POST / GET: Переключение лайка
  @Post(':id/like')
  toggleLikePostRoot(@Param('id') id: string) {
    const numericId = parseInt(id, 10);
    const updated = this.indexesService.toggleLike(numericId);
    return {
      success: !!updated,
      isLikedByMe: updated ? updated.isLikedByMe : false,
      likesCount: updated ? updated.likesCount : 0,
    };
  }

  @Post('feed/:id/like')
  toggleLikePost(@Param('id') id: string) {
    const numericId = parseInt(id, 10);
    const updated = this.indexesService.toggleLike(numericId);
    return {
      success: !!updated,
      isLikedByMe: updated ? updated.isLikedByMe : false,
      likesCount: updated ? updated.likesCount : 0,
    };
  }

  @Get('feed/:id/like')
  toggleLikeGet(@Param('id') id: string, @Res() res: Response) {
    const numericId = parseInt(id, 10);
    this.indexesService.toggleLike(numericId);
    return res.redirect(`/database-indexes/feed?id=${numericId}`);
  }

  // 2. GET: Страница создания нового индекса (отображает услугу в статусе черновик)
  // URL: /database-indexes/create
  @Get('create')
  @Render('create')
  renderCreateForm() {
    const draft = this.indexesService.getDraftIndex();
    return {
      title: 'Добавление индекса',
      activeTab: 'create',
      draft,
    };
  }

  // 2.1 POST: Обработка отправки формы добавления (в 1 лабе без сохранения - редирект в каталог)
  // URL: /database-indexes/create
  @Post('create')
  handleCreatePost(@Res() res: Response) {
    return res.redirect('/database-indexes/list');
  }

  // 3. GET: Каталог индексов (с фильтрацией по cardinality)
  // URL: /database-indexes/list или /database-indexes/list?query=1000
  @Get('list')
  @Render('list')
  renderList(@Query('query') query?: string) {
    const items = this.indexesService.getPublishedIndexes(query);

    return {
      title: 'Каталог индексов',
      activeTab: 'list',
      items,
      data: items,
      query: query ?? '',
      totalFound: items.length,
    };
  }
}
