import { Module } from '@nestjs/common';
import { BmstuLabModule } from './bmstu_lab/bmstu_lab.module';

@Module({
  imports: [BmstuLabModule],
})
export class AppModule {}

