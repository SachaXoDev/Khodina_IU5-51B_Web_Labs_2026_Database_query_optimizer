import { Module } from '@nestjs/common';
import { IndexesService } from './indexes.service';
import { IndexesController, AppRedirectController } from './indexes.controller';

@Module({
  controllers: [IndexesController, AppRedirectController],
  providers: [IndexesService],
  exports: [IndexesService],
})
export class IndexesModule {}
