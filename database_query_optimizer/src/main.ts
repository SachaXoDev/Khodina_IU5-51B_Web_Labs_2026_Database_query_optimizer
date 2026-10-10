import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { ValidationPipe, ClassSerializerInterceptor } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // 1. Глобальный префикс /api для всех REST маршрутов
  app.setGlobalPrefix('api');

  // 2. Парсинг cookies для сессионной авторизации
  app.use(cookieParser());

  // 3. Включаем CORS с поддержкой передачи Cookie (credentials: true)
  app.enableCors({
    origin: true,
    credentials: true,
  });

  // 4. Статические файлы и шаблонизатор Handlebars (SSR)
  app.useStaticAssets(join(__dirname, '..', 'public'));
  app.setBaseViewsDir(join(__dirname, '..', 'views'));
  app.setViewEngine('hbs');

  // 5. Глобальная валидация DTO
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  // 6. Сериализация ответов
  app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));

  // 7. Swagger документация на /api/docs
  const config = new DocumentBuilder()
    .setTitle('Indexes API')
    .setDescription(
      'REST API для работы с индексами (Лабораторная работа №4).\n\n' +
      '• Аутентификация: сессии в Redis и куки sessionId.\n' +
      '• Для гостя доступны: GET /api/indexes (каталог), GET /api/indexes/feed (лента), GET /api/indexes/:id.\n' +
      '• Для создателя доступны: POST /api/indexes (черновик), PUT /api/indexes/:id/publish (публикация), DELETE, POST /like.\n' +
      '• Тестирование: после выполнения POST /api/auth/login скопируйте sessionId из ответа или cookie и вставьте в кнопку "Authorize" (sessionId).',
    )
    .setVersion('1.0')
    .addCookieAuth('sessionId', {
      type: 'apiKey',
      in: 'cookie',
      name: 'sessionId',
      description: 'Идентификатор сессии в Redis',
    })
    .addTag('Authentication', 'Методы регистрации, входа, выхода и профиля')
    .addTag('Indexes', 'Методы работы с индексами (публичные и защищенные сессией)')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`🚀 Приложение запущено: http://localhost:${port}/api`);
  console.log(`📚 Swagger документация: http://localhost:${port}/api/docs`);
}

bootstrap();
