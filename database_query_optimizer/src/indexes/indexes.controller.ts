import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseInterceptors,
  UploadedFiles,
  ParseIntPipe,
  BadRequestException,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { IndexesService } from './indexes.service';
import { IndexFiltersDto } from './dto/index-filters.dto';
import { CreateDraftDto } from './dto/create-draft.dto';
import { PublishIndexDto } from './dto/publish-index.dto';
import { LikeIndexDto } from './dto/like-index.dto';
import { IndexResponseDto, FeedResponseDto } from './dto/index-response.dto';

@Controller('indexes')
export class IndexesController {
  constructor(private readonly indexesService: IndexesService) {}

  /**
   * 1. GET /api/indexes — список с фильтрацией (только опубликованные)
   */
  @Get()
  async getIndexes(@Query() filters: IndexFiltersDto): Promise<IndexResponseDto[]> {
    return this.indexesService.findAll(filters);
  }

  /**
   * 2. GET /api/indexes/feed — лента услуг (только опубликованные)
   * Поддерживает: /api/indexes/feed (без id) и /api/indexes/feed?id=X&next=true (по id)
   */
  @Get('feed')
  async getFeed(
    @Query('id') id?: string,
    @Query('next') next?: string,
  ): Promise<FeedResponseDto> {
    const parsedId = id !== undefined ? parseInt(id, 10) : undefined;
    const isNext = next === 'true';
    return this.indexesService.getFeed(parsedId, isNext);
  }

  /**
   * 3. GET /api/indexes/draft — получение черновика текущего пользователя
   * По ТЗ: не более 1 записи, id не указывается.
   */
  @Get('draft')
  async getDraft(): Promise<IndexResponseDto> {
    return this.indexesService.getDraft();
  }

  /**
   * 4. GET /api/indexes/:id — получение опубликованной услуги по ID
   */
  @Get(':id')
  async getIndexById(@Param('id', ParseIntPipe) id: number): Promise<IndexResponseDto> {
    return this.indexesService.findOne(id);
  }

  /**
   * 5. POST /api/indexes — добавление/обновление черновика + файлов картинки и видео
   * Названия файлов сохраняются в БД на латинице, сами файлы — в MinIO.
   */
  @Post()
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'image', maxCount: 1 },
        { name: 'video', maxCount: 1 },
      ],
      {
        storage: memoryStorage(),
        limits: {
          fileSize: 50 * 1024 * 1024, // 50MB (с запасом для короткого видео)
        },
        fileFilter: (req, file, callback) => {
          if (file.fieldname === 'image') {
            if (!file.mimetype.match(/\/(jpg|jpeg|png|webp|svg\+xml)$/)) {
              return callback(
                new BadRequestException(),
                false,
              );
            }
          }
          if (file.fieldname === 'video') {
            if (!file.mimetype.match(/\/(mp4|webm|quicktime|octet-stream)$/) && !file.originalname.match(/\.(mp4|webm|mov)$/i)) {
              return callback(
                new BadRequestException(),
                false,
              );
            }
          }
          callback(null, true);
        },
      },
    ),
  )
  async createDraft(
    @Body() dto: CreateDraftDto,
    @UploadedFiles()
    files?: {
      image?: Express.Multer.File[];
      video?: Express.Multer.File[];
    },
  ): Promise<IndexResponseDto> {
    const imageFile = files?.image?.[0];
    const videoFile = files?.video?.[0];
    return this.indexesService.createOrUpdateDraft(dto, imageFile, videoFile);
  }

  /**
   * 6. PUT /api/indexes/:id/publish — публикация услуги (смена статуса на published)
   * Вернуть в черновик нельзя.
   */
  @Put(':id/publish')
  async publishIndex(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto?: PublishIndexDto,
  ): Promise<IndexResponseDto> {
    return this.indexesService.publish(id, dto);
  }

  /**
   * 7. DELETE /api/indexes/:id — мягкое удаление услуги (soft delete)
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteIndex(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<void> {
    await this.indexesService.softDelete(id);
  }

  /**
   * 8. POST /api/indexes/:id/like — постановка или отмена лайка
   * Поле value: 1 — ставит лайк, 0 — отменяет лайк.
   */
  @Post(':id/like')
  async toggleLike(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: LikeIndexDto,
  ): Promise<IndexResponseDto> {
    const rawVal = dto?.value;
    const numericValue = (rawVal === 0 || rawVal === '0') ? 0 : 1;
    return this.indexesService.toggleLike(id, numericValue);
  }
}
