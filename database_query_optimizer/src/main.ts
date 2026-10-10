import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // 1. Парсинг cookies для сессионной авторизации
  app.use(cookieParser());

  // 2. Включаем CORS с поддержкой передачи Cookie (credentials: true)
  app.enableCors({
    origin: true,
    credentials: true,
  });

  // 3. Статические файлы и шаблонизатор Handlebars (SSR)
  app.useStaticAssets(join(__dirname, '..', 'public'));
  app.setBaseViewsDir(join(__dirname, '..', 'views'));
  app.setViewEngine('hbs');

  // 4. Валидация входных данных DTO
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
    }),
  );

  // 5. Swagger документация
  const config = new DocumentBuilder()
    .setTitle('Database Query Optimizer API')
    .setDescription(
      'REST API для оптимизатора запросов БД (Лабораторная работа №4).\n\n' +
      '• Аутентификация: сессии в Redis и куки sessionId.\n' +
      '• Для гостя доступны: GET /api/indexes (каталог), GET /api/indexes/feed (лента), GET /api/indexes/:id.\n' +
      '• Для создателя доступны: POST /api/indexes (черновик), PUT /api/indexes/:id/publish (публикация), DELETE, POST /like.\n' +
      '• Тестирование: после выполнения POST /api/auth/login скопируйте sessionId из ответа и вставьте в кнопку "Authorize" (Cookie: sessionId).',
    )
    .setVersion('1.0')
    .addCookieAuth('sessionId', {
      type: 'apiKey',
      in: 'cookie',
      name: 'sessionId',
      description: 'Идентификатор сессии в Redis',
    })
    .addTag('Authentication', 'Методы регистрации, входа, выхода и профиля')
    .addTag('Database Indexes', 'Методы работы с индексами (публичные и защищенные сессией)')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  // Запуск приложения
  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`🚀 Приложение запущено: http://localhost:${port}`);
  console.log(`📚 Swagger документация: http://localhost:${port}/api/docs`);
}

bootstrap();
