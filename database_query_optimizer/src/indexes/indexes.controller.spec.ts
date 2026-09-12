import { Test, TestingModule } from '@nestjs/testing';
import { IndexesController } from './indexes.controller';
import { IndexesService } from './indexes.service';

describe('IndexesController', () => {
  let controller: IndexesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [IndexesController],
      providers: [IndexesService],
    }).compile();

    controller = module.get<IndexesController>(IndexesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
