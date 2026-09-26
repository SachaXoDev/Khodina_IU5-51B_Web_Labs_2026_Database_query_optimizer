import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';

/**
 * Глобальный фильтр исключений для REST API.
 * Соответствует требованиям к оформлению API:
 * 1. Код ошибки возвращается строго через заголовок HTTP (400, 403, 404, 409, 500).
 * 2. В теле ответа отсутствуют лишние поля 'status' / 'statusCode' и кастомные текстовые сообщения.
 */
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    response.status(status).send();
  }
}
