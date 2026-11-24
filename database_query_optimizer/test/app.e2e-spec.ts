import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import cookieParser from 'cookie-parser';
import { ValidationPipe } from '@nestjs/common';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module.js';

describe('AppController (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.use(cookieParser());
    app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));
    await app.init();
  });

  it('returns an explicitly paginated list of published cards', async () => {
    const { body } = await request(app.getHttpServer())
      .get('/api/indexes?limit=1&offset=0')
      .expect(200);

    expect(body).toMatchObject({ offset: 0, limit: 1 });
    expect(body.total).toBeGreaterThanOrEqual(1);
    expect(body.items).toHaveLength(1);
    expect(body.items[0].status).toBe('published');
  });
  afterEach(async () => {
    await app.close();
  });
});
