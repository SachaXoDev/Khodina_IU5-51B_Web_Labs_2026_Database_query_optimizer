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
  Header,
  Headers,
  Res,
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
import type { Response } from 'express';
import { randomUUID } from 'node:crypto';
import { IndexesService } from './indexes.service';
import { IndexFiltersDto, MAX_INT } from './dto/index-filters.dto';
import { CreateDraftDto } from './dto/create-draft.dto';
import { PublishIndexDto } from './dto/publish-index.dto';
import { LikeIndexDto } from './dto/like-index.dto';
import { CLIP_CANDIDATE_PAGE_SIZE, ClipCandidatePageDto, FeedResponseDto, IndexPageDto, IndexResponseDto } from './dto/index-response.dto';
import { RotationDto } from './dto/rotation.dto';
import { FEED_GUEST_COOKIE, FEED_TTL_SECONDS } from './feed-state.service';
import { SessionGuard, AuthenticatedRequest } from '../auth/guards/session.guard';
import { OptionalSessionGuard } from '../auth/guards/optional-session.guard';

@ApiTags('Indexes')
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
  @ApiResponse({ status: 200, description: 'Страница каталога и общее число результатов', type: IndexPageDto })
  async getIndexes(
    @Query() filters: IndexFiltersDto,
    @Req() req: AuthenticatedRequest,
  ): Promise<IndexPageDto> {
    return this.indexesService.findAll(filters, req.userId);
  }

  /**
   * 2. GET /api/indexes/feed — лента услуг (только опубликованные)
   * Доступно гостю и авторизованному пользователю.
   */
  @Get('feed')
  @Header('Cache-Control', 'private, no-store')
  @UseGuards(OptionalSessionGuard)
  @ApiOperation({
    summary: 'Чтение или переход в случайной ленте Redis',
    description: 'Без id читает текущую карточку. С id без next читает карточку без перехода. next=true переводит курсор, id при этом сверяется с текущей карточкой.',
  })
  @ApiQuery({ name: 'id', required: false, type: Number, description: 'ID текущей услуги' })
  @ApiQuery({ name: 'next', required: false, type: Boolean, description: 'Флаг перехода к следующей' })
  @ApiResponse({ status: 200, description: 'Текущая карточка и номер в пачке', type: FeedResponseDto })
  async getFeed(
    @Req() req: AuthenticatedRequest,
    @Res({ passthrough: true }) res: Response,
    @Query('id') id?: string,
    @Query('next') next?: string,
  ): Promise<FeedResponseDto> {
    const parsedId = id === undefined ? undefined : Number(id);
    if (parsedId !== undefined && (typeof id !== 'string' || !/^\d+$/.test(id) || !Number.isInteger(parsedId) || parsedId < 1 || parsedId > MAX_INT)) {
      throw new BadRequestException('id должен быть положительным целым числом');
    }
    if (next !== undefined && next !== 'true' && next !== 'false') {
      throw new BadRequestException('next должен быть true или false');
    }

    let key: string;
    if (req.userId) {
      key = `feed:user:${req.userId}`;
    } else {
      let guestId: unknown = req.cookies?.[FEED_GUEST_COOKIE];
      if (typeof guestId !== 'string' || !/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/.test(guestId)) {
        guestId = randomUUID();
        res.cookie(FEED_GUEST_COOKIE, guestId, {
          httpOnly: true,
          sameSite: 'lax',
          secure: req.secure,
          path: '/api',
          maxAge: FEED_TTL_SECONDS * 1000,
        });
      }
      key = `feed:guest:${guestId}`;
    }
    return this.indexesService.getFeed(key, parsedId, next === 'true', req.userId);
  }

  @Get('clip-candidates')
  @ApiOperation({ summary: 'Английские описания опубликованных карточек для локального поиска CLIP' })
  @ApiQuery({ name: 'afterId', required: false, schema: { type: 'integer', default: 0, minimum: 0, maximum: MAX_INT } })
  @ApiQuery({ name: 'limit', required: false, schema: { type: 'integer', default: CLIP_CANDIDATE_PAGE_SIZE, minimum: 1, maximum: CLIP_CANDIDATE_PAGE_SIZE } })
  @ApiResponse({ status: 200, type: ClipCandidatePageDto })
  @ApiResponse({ status: 400, description: 'Некорректный курсор или размер страницы' })
  async getClipCandidates(
    @Query('afterId') afterId?: string,
    @Query('limit') limit?: string,
  ): Promise<ClipCandidatePageDto> {
    const parse = (value: string | undefined, name: string, defaultValue: number, min: number, max: number) => {
      if (value === undefined) return defaultValue;
      const parsed = Number(value);
      if (typeof value !== 'string' || !/^\d+$/.test(value) || !Number.isInteger(parsed) || parsed < min || parsed > max) {
        throw new BadRequestException(`${name} должен быть целым числом от ${min} до ${max}`);
      }
      return parsed;
    };
    return this.indexesService.getClipCandidates(
      parse(afterId, 'afterId', 0, 0, MAX_INT),
      parse(limit, 'limit', CLIP_CANDIDATE_PAGE_SIZE, 1, CLIP_CANDIDATE_PAGE_SIZE),
    );
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
        model: { type: 'string', format: 'binary', description: 'Модель glTF Binary (.glb)' },
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
        { name: 'model', maxCount: 1 },
      ],
      {
        storage: memoryStorage(),
        limits: {
          fileSize: 50 * 1024 * 1024,
        },
        fileFilter: (_req, file, callback) => {
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
          if (file.fieldname === 'model' && !/\.glb$/i.test(file.originalname)) {
            return callback(new BadRequestException('Ожидается модель .glb'), false);
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
      model?: Express.Multer.File[];
    },
  ): Promise<IndexResponseDto> {
    const imageFile = files?.image?.[0];
    const videoFile = files?.video?.[0];
    // Автор строго из сессии req.userId
    return this.indexesService.createOrUpdateDraft(dto, req.userId!, imageFile, videoFile, files?.model?.[0]);
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

  @Put(':id/rotation')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Сохранение результата расчёта от сервиса поворота' })
  @ApiResponse({ status: 204, description: 'Поворот сохранён' })
  @ApiResponse({ status: 401, description: 'Неверный X-Result-Key' })
  async saveRotation(
    @Param('id', ParseIntPipe) id: number,
    @Headers('x-result-key') resultKey: string | undefined,
    @Body() dto: RotationDto,
  ): Promise<void> {
    if (id < 1 || id > MAX_INT) throw new BadRequestException('Некорректный id');
    await this.indexesService.saveRotation(id, resultKey, dto);
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
