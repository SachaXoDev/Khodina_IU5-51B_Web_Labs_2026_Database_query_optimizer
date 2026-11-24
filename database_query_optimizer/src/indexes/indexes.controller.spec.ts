import { Test, TestingModule } from '@nestjs/testing';
import { IndexesController } from './indexes.controller';
import { IndexesService } from './indexes.service';
import { SessionService } from '../session/session.service';

describe('IndexesController', () => {
  let controller: IndexesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [IndexesController],
      providers: [
        { provide: IndexesService, useValue: { findAll: vi.fn() } },
        { provide: SessionService, useValue: {} },
      ],
    }).compile();

    controller = module.get<IndexesController>(IndexesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
