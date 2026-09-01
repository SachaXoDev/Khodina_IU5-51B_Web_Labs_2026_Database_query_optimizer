import { Test, TestingModule } from '@nestjs/testing';
import { BmstuLabController } from './bmstu_lab.controller';
import { BmstuLabService } from './bmstu_lab.service';

describe('BmstuLabController', () => {
  let controller: BmstuLabController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BmstuLabController],
      providers: [BmstuLabService],
    }).compile();

    controller = module.get<BmstuLabController>(BmstuLabController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});

