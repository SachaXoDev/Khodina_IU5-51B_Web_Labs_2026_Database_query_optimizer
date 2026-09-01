import { Controller, Get, Param, Post, Query, Render, Res } from '@nestjs/common';
import type { Response } from 'express';
import { BmstuLabService } from './bmstu_lab.service';

@Controller('database-indexes')
export class BmstuLabController {
  constructor(private readonly labService: BmstuLabService) {}

  // 1. GET: Лента карточек (Vibes-стиль с полноэкранным видео)
  // URL: /database-indexes/feed или /database-indexes/feed?id=1 или /database-indexes/feed?id=1&next=true
  @Get('feed')
  @Render('feed')
  getFeed(
    @Query('id') id?: string,
    @Query('next') next?: string,
  ) {
    const numericId = id ? parseInt(id, 10) : undefined;
    const isNext = next === 'true';
    const feedData = this.labService.getFeedItem(numericId, isNext);

    return {
      title: 'Лента оптимизации индексов B-tree',
      activeTab: 'feed',
      data: feedData ? feedData.current : null,
      nextId: feedData ? feedData.nextId : null,
    };
  }

  // 1.1 POST / GET: Переключение лайка (поставить / убрать)
  @Post(':id/like')
  toggleLikePostRoot(@Param('id') id: string) {
    const numericId = parseInt(id, 10);
    const updated = this.labService.toggleLike(numericId);
    return {
      success: !!updated,
      isLikedByMe: updated ? updated.isLikedByMe : false,
      likesCount: updated ? updated.likesCount : 0,
    };
  }

  @Post('feed/:id/like')
  toggleLikePost(@Param('id') id: string) {
    const numericId = parseInt(id, 10);
    const updated = this.labService.toggleLike(numericId);
    return {
      success: !!updated,
      isLikedByMe: updated ? updated.isLikedByMe : false,
      likesCount: updated ? updated.likesCount : 0,
    };
  }

  @Get('feed/:id/like')
  toggleLikeGet(@Param('id') id: string, @Res() res: Response) {
    const numericId = parseInt(id, 10);
    this.labService.toggleLike(numericId);
    return res.redirect(`/database-indexes/feed?id=${numericId}`);
  }

  // 2. GET: Страница создания нового индекса (отображает услугу в статусе черновик)
  // URL: /database-indexes/create
  @Get('create')
  @Render('create')
  getCreatePage() {
    const draft = this.labService.getDraftOptimization();
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
    // В первой лабораторной добавлять новые карточки нельзя, но можно заполнять
    // Перенаправляем пользователя на страницу каталога
    return res.redirect('/database-indexes/list');
  }

  // 3. GET: Каталог индексов (плитка в 2 столбца с фильтрацией по теме)
  // URL: /database-indexes/list или /database-indexes/list?query=users
  @Get('list')
  @Render('list')
  getList(@Query('query') query?: string) {
    const items = this.labService.getPublishedOptimizations(query);

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
