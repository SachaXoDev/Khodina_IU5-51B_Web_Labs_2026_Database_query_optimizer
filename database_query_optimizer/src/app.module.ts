import { Module } from '@nestjs/common';
import { IndexesModule } from './indexes/indexes.module';

@Module({
  imports: [IndexesModule],
})
export class AppModule {}

