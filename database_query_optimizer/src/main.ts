import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, ClassSerializerInterceptor } from '@nestjs/common';
import { HttpExceptionFilter } from './common/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Глобальный префикс /api для всех маршрутов REST веб-сервиса
  app.setGlobalPrefix('api');

  // Глобальная валидация DTO (запрещает передачу лишних/системных полей с клиента)
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Глобальный фильтр исключений: код ошибки в HTTP статусе, без полей status/message в теле
  app.useGlobalFilters(new HttpExceptionFilter());

  // Автоматическая сериализация ответов и скрытие полей с @Exclude()
  app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  console.log(`Application is running on: http://localhost:${port}/api`);
}
bootstrap();
