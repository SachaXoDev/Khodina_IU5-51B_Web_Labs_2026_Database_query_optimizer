import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as Minio from 'minio';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class MinioService implements OnModuleInit {
  private readonly logger = new Logger(MinioService.name);
  private minioClient: Minio.Client;
  private readonly bucketName: string;

  constructor(private readonly configService: ConfigService) {
    this.bucketName = this.configService.get<string>('MINIO_BUCKET', 'media');

    this.minioClient = new Minio.Client({
      endPoint: this.configService.get<string>('MINIO_ENDPOINT', 'localhost'),
      port: Number(this.configService.get<number>('MINIO_PORT', 9000)),
      useSSL: this.configService.get<string>('MINIO_USE_SSL', 'false') === 'true',
      accessKey: this.configService.get<string>('MINIO_ACCESS_KEY', 'minioadmin'),
      secretKey: this.configService.get<string>('MINIO_SECRET_KEY', 'minioadminpassword'),
    });
  }

  async onModuleInit() {
    await this.ensureBucketExists();
    await this.seedInitialMediaFiles();
  }

  private async ensureBucketExists(): Promise<void> {
    try {
      const exists = await this.minioClient.bucketExists(this.bucketName);
      if (!exists) {
        await this.minioClient.makeBucket(this.bucketName, 'us-east-1');
        this.logger.log(`Бакет "${this.bucketName}" успешно создан в MinIO.`);
      }
    } catch (error: any) {
      this.logger.warn(`MinIO недоступен или ошибка при создании бакета: ${error?.message || error}`);
    }
  }

  /**
   * Загрузка начальных медиа-файлов из public/media и public/assets в MinIO (для начальных данных)
   */
  private async seedInitialMediaFiles(): Promise<void> {
    const foldersToSeed = [
      path.join(__dirname, '..', '..', 'public', 'media'),
      path.join(__dirname, '..', '..', 'public', 'assets'),
    ];

    for (const folder of foldersToSeed) {
      if (!fs.existsSync(folder)) continue;

      const files = fs.readdirSync(folder);
      for (const fileName of files) {
        if (fileName.startsWith('.')) continue; // Пропуск .DS_Store
        const filePath = path.join(folder, fileName);
        if (!fs.statSync(filePath).isFile()) continue;

        try {
          // Проверяем, существует ли уже объект в бакете
          try {
            await this.minioClient.statObject(this.bucketName, fileName);
          } catch {
            const buffer = fs.readFileSync(filePath);
            const ext = path.extname(fileName).toLowerCase();
            const contentType =
              ext === '.jpg' || ext === '.jpeg'
                ? 'image/jpeg'
                : ext === '.png'
                ? 'image/png'
                : ext === '.mp4'
                ? 'video/mp4'
                : ext === '.svg'
                ? 'image/svg+xml'
                : 'application/octet-stream';

            await this.minioClient.putObject(this.bucketName, fileName, buffer, buffer.length, {
              'Content-Type': contentType,
            });
            this.logger.log(`Загружен начальный файл в MinIO: ${fileName}`);
          }
        } catch (err: any) {
          this.logger.warn(`Ошибка при сидировании файла ${fileName} в MinIO: ${err?.message || err}`);
        }
      }
    }
  }

  /**
   * Загрузка файла (изображения или видео) в MinIO.
   * Название файла генерируется строго на латинице по ТЗ.
   * Возвращает только сгенерированное латинское имя файла для сохранения в поле БД.
   */
  async uploadMediaFile(
    fileBuffer: Buffer,
    originalName: string,
    prefix: 'image' | 'video',
    mimeType?: string,
  ): Promise<string> {
    const ext = path.extname(originalName).toLowerCase() || (prefix === 'image' ? '.jpg' : '.mp4');
    const cleanExt = ext.replace(/[^a-z0-9.]/gi, '');
    const randomSuffix = Math.random().toString(36).substring(2, 8);
    const timestamp = Date.now();

    // Латинское название файла
    const latinFileName = `index_${prefix}_${timestamp}_${randomSuffix}${cleanExt}`;

    const contentType =
      mimeType ||
      (prefix === 'image'
        ? cleanExt === '.png'
          ? 'image/png'
          : 'image/jpeg'
        : 'video/mp4');

    await this.minioClient.putObject(
      this.bucketName,
      latinFileName,
      fileBuffer,
      fileBuffer.length,
      { 'Content-Type': contentType },
    );

    this.logger.log(`Файл ${latinFileName} успешно загружен в MinIO.`);
    return latinFileName;
  }

  /**
   * Получение подписанной ссылки на файл в MinIO (действительна 7 дней по методичке).
   */
  async getPresignedUrl(fileName: string | null | undefined): Promise<string | null> {
    if (!fileName) {
      return null;
    }

    // Если в БД хранился относительный путь вида /media/xxx.jpg или /assets/xxx.svg, очищаем до чистого имени
    const cleanFileName = fileName.replace(/^\/?(media|assets)\//, '');

    try {
      const expiresIn = 7 * 24 * 60 * 60; // 7 дней
      return await this.minioClient.presignedGetObject(this.bucketName, cleanFileName, expiresIn);
    } catch (error: any) {
      this.logger.warn(`Ошибка при генерации presigned URL для ${cleanFileName}: ${error?.message || error}`);
      // Fallback на прямой HTTP URL
      const protocol = this.configService.get<string>('MINIO_USE_SSL', 'false') === 'true' ? 'https' : 'http';
      const endpoint = this.configService.get<string>('MINIO_ENDPOINT', 'localhost');
      const port = this.configService.get<number>('MINIO_PORT', 9000);
      return `${protocol}://${endpoint}:${port}/${this.bucketName}/${cleanFileName}`;
    }
  }

  /**
   * Удаление файла из бакета MinIO
   */
  async deleteFile(fileName: string | null | undefined): Promise<void> {
    if (!fileName) return;
    try {
      await this.minioClient.removeObject(this.bucketName, fileName);
      this.logger.log(`Файл ${fileName} удален из MinIO.`);
    } catch (error: any) {
      this.logger.warn(`Ошибка при удалении файла ${fileName} из MinIO: ${error?.message || error}`);
    }
  }
}
