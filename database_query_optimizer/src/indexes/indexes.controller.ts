import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  Req,
  UseGuards,
  UseInterceptors,
  UploadedFiles,
  ParseIntPipe,
  BadRequestException,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiCookieAuth,
  ApiConsumes,
  ApiBody,
  ApiQuery,
} from '@nestjs/swagger';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { IndexesService } from './indexes.service';
import { IndexFiltersDto } from './dto/index-filters.dto';
import { CreateDraftDto } from './dto/create-draft.dto';
import { PublishIndexDto } from './dto/publish-index.dto';
import { LikeIndexDto } from './dto/like-index.dto';
import { IndexResponseDto, FeedResponseDto } from './dto/index-response.dto';
import { SessionGuard, AuthenticatedRequest } from '../auth/guards/session.guard';
import { OptionalSessionGuard } from '../auth/guards/optional-session.guard';

@ApiTags('Database Indexes')
@Controller('indexes')
export class IndexesController {
  constructor(private readonly indexesService: IndexesService) {}

  /**
   * 1. GET /api/indexes — список с фильтрацией (только опубликованные)
   * Доступен гостю и авторизованному пользователю.
   */
  @Get()
  @UseGuards(OptionalSessionGuard)
  @ApiOperation({
    summary: 'Получение каталога опубликованных индексов с фильтрацией',
    description: 'Доступно гостям и авторизованным. Возвращает список только опубликованных индексов.',
  })
  @ApiResponse({ status: 200, description: 'Список индексов', type: [IndexResponseDto] })
  async getIndexes(
    @Query() filters: IndexFiltersDto,
    @Req() req: AuthenticatedRequest,
  ): Promise<IndexResponseDto[]> {
    return this.indexesService.findAll(filters, req.userId);
  }

  /**
   * 2. GET /api/indexes/feed — лента услуг (только опубликованные)
   * Доступно гостю и авторизованному пользователю.
   */
  @Get('feed')
  @UseGuards(OptionalSessionGuard)
  @ApiOperation({
    summary: 'Получение ленты услуг с циклической навигацией',
    description: 'Без id возвращает первую услугу. С ?id=X&next=true переходит к следующей.',
  })
  @ApiQuery({ name: 'id', required: false, type: Number, description: 'ID текущей услуги' })
  @ApiQuery({ name: 'next', required: false, type: Boolean, description: 'Флаг перехода к следующей' })
  @ApiResponse({ status: 200, description: 'Текущий элемент ленты и ссылки навигации', type: FeedResponseDto })
  async getFeed(
    @Query('id') id?: string,
    @Query('next') next?: string,
    @Req() req?: AuthenticatedRequest,
  ): Promise<FeedResponseDto> {
    const parsedId = id !== undefined ? parseInt(id, 10) : undefined;
    const isNext = next === 'true';
    return this.indexesService.getFeed(parsedId, isNext, req?.userId);
  }

  /**
   * 3. GET /api/indexes/draft — получение черновика текущего пользователя
   * ТРЕБУЕТ АВТОРИЗАЦИИ: только для владельца сессии.
   */
  @Get('draft')
  @UseGuards(SessionGuard)
  @ApiCookieAuth('sessionId')
  @ApiOperation({
    summary: 'Получение черновика текущего пользователя',
    description: 'Требует сессию в Redis. Автор определяется автоматически из сессии.',
  })
  @ApiResponse({ status: 200, description: 'Черновик найден', type: IndexResponseDto })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
  @ApiResponse({ status: 404, description: 'У пользователя нет активного черновика' })
  async getDraft(@Req() req: AuthenticatedRequest): Promise<IndexResponseDto> {
    return this.indexesService.getDraft(req.userId!);
  }

  /**
   * 4. GET /api/indexes/:id — получение опубликованной услуги по ID
   */
  @Get(':id')
  @UseGuards(OptionalSessionGuard)
  @ApiOperation({ summary: 'Получение одной опубликованной услуги по ID' })
  @ApiResponse({ status: 200, description: 'Услуга найдена', type: IndexResponseDto })
  @ApiResponse({ status: 404, description: 'Услуга не найдена или удалена' })
  async getIndexById(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: AuthenticatedRequest,
  ): Promise<IndexResponseDto> {
    return this.indexesService.findOne(id, req.userId);
  }

  /**
   * 5. POST /api/indexes — добавление/обновление черновика + файлов картинки и видео
   * ТРЕБУЕТ АВТОРИЗАЦИИ: автор автоматически привязывается из сессии!
   */
  @Post()
  @UseGuards(SessionGuard)
  @ApiCookieAuth('sessionId')
  @ApiOperation({
    summary: 'Создание или обновление черновика услуги с загрузкой медиафайлов',
    description: 'Авторство услуги (authorId) автозаполняется из сессии в Redis.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        indexName: { type: 'string', example: 'idx_customers_phone' },
        tableName: { type: 'string', example: 'customers' },
        indexType: { type: 'string', example: 'B-Tree' },
        columnName: { type: 'string', example: 'phone' },
        cardinality: { type: 'number', example: 350000 },
        shortDescription: { type: 'string', example: 'Быстрый поиск клиентов по телефону' },
        fullDescription: { type: 'string', example: 'B-Tree индекс ускоряет поиск клиентов.' },
        image: { type: 'string', format: 'binary', description: 'Изображение для карточки' },
        video: { type: 'string', format: 'binary', description: 'Видеоролик для ленты' },
      },
      required: ['indexName'],
    },
  })
  @ApiResponse({ status: 201, description: 'Черновик успешно сохранен', type: IndexResponseDto })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'image', maxCount: 1 },
        { name: 'video', maxCount: 1 },
      ],
      {
        storage: memoryStorage(),
        limits: {
          fileSize: 50 * 1024 * 1024,
        },
        fileFilter: (req, file, callback) => {
          if (file.fieldname === 'image') {
            if (!file.mimetype.match(/\/(jpg|jpeg|png|webp|svg\+xml)$/)) {
              return callback(new BadRequestException('Недопустимый формат изображения'), false);
            }
          }
          if (file.fieldname === 'video') {
            if (!file.mimetype.match(/\/(mp4|webm|quicktime|octet-stream)$/) && !file.originalname.match(/\.(mp4|webm|mov)$/i)) {
              return callback(new BadRequestException('Недопустимый формат видео'), false);
            }
          }
          callback(null, true);
        },
      },
    ),
  )
  async createDraft(
    @Body() dto: CreateDraftDto,
    @Req() req: AuthenticatedRequest,
    @UploadedFiles()
    files?: {
      image?: Express.Multer.File[];
      video?: Express.Multer.File[];
    },
  ): Promise<IndexResponseDto> {
    const imageFile = files?.image?.[0];
    const videoFile = files?.video?.[0];
    // Автор строго из сессии req.userId
    return this.indexesService.createOrUpdateDraft(dto, req.userId!, imageFile, videoFile);
  }

  /**
   * 6. PUT /api/indexes/:id/publish — публикация услуги (смена статуса на published)
   * ТРЕБУЕТ АВТОРИЗАЦИИ: гость получает 401, чужой пользователь — 403 Forbidden.
   */
  @Put(':id/publish')
  @UseGuards(SessionGuard)
  @ApiCookieAuth('sessionId')
  @ApiOperation({
    summary: 'Публикация услуги создателем',
    description: 'Для гостя возвращает 401 Unauthorized, для чужого пользователя 403 Forbidden, для автора — 200 OK.',
  })
  @ApiResponse({ status: 200, description: 'Услуга успешно опубликована', type: IndexResponseDto })
  @ApiResponse({ status: 401, description: 'Не авторизован (для гостя)' })
  @ApiResponse({ status: 403, description: 'Чужая услуга (доступ запрещен)' })
  @ApiResponse({ status: 404, description: 'Услуга не найдена' })
  async publishIndex(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: AuthenticatedRequest,
    @Body() dto?: PublishIndexDto,
  ): Promise<IndexResponseDto> {
    return this.indexesService.publish(id, req.userId!, dto);
  }

  /**
   * 7. DELETE /api/indexes/:id — мягкое удаление услуги
   * ТРЕБУЕТ АВТОРИЗАЦИИ: только создатель может удалить услугу.
   */
  @Delete(':id')
  @UseGuards(SessionGuard)
  @ApiCookieAuth('sessionId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Мягкое удаление услуги (доступно только автору)' })
  @ApiResponse({ status: 204, description: 'Услуга удалена' })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
  @ApiResponse({ status: 403, description: 'Запрещено удалять чужую услугу' })
  async deleteIndex(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: AuthenticatedRequest,
  ): Promise<void> {
    await this.indexesService.softDelete(id, req.userId!);
  }

  /**
   * 8. POST /api/indexes/:id/like — постановка или отмена лайка
   * ТРЕБУЕТ АВТОРИЗАЦИИ: лайкать могут только авторизованные пользователи.
   */
  @Post(':id/like')
  @UseGuards(SessionGuard)
  @ApiCookieAuth('sessionId')
  @ApiOperation({ summary: 'Постановка или снятие лайка (value: 1 / 0)' })
  @ApiResponse({ status: 200, description: 'Лайк успешно обновлен', type: IndexResponseDto })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
  async toggleLike(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: AuthenticatedRequest,
    @Body() dto: LikeIndexDto,
  ): Promise<IndexResponseDto> {
    const rawVal = dto?.value;
    const numericValue = (rawVal === 0 || rawVal === '0') ? 0 : 1;
    return this.indexesService.toggleLike(id, req.userId!, numericValue);
  }
}
