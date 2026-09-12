import { Module } from '@nestjs/common';
import { IndexesService } from './indexes.service';
import { IndexesController } from './indexes.controller';

@Module({
  controllers: [IndexesController],
  providers: [IndexesService],
  exports: [IndexesService],
})
export class IndexesModule {}
