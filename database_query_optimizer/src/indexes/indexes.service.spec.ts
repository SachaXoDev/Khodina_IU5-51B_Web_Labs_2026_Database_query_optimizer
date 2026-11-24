import { Test, TestingModule } from '@nestjs/testing';
import { IndexesService } from './indexes.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from '../users/entities/user.entity';
import { DatabaseIndex } from './entities/database-index.entity';
import { IndexLike } from './entities/index-like.entity';
import { FeedStateService } from './feed-state.service';
import { MinioService } from './minio.service';

describe('IndexesService', () => {
  let service: IndexesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        IndexesService,
        { provide: getRepositoryToken(DatabaseIndex), useValue: {} },
        { provide: getRepositoryToken(IndexLike), useValue: {} },
        { provide: getRepositoryToken(User), useValue: {} },
        { provide: MinioService, useValue: {} },
        { provide: FeedStateService, useValue: {} },
      ],
    }).compile();

    service = module.get<IndexesService>(IndexesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
