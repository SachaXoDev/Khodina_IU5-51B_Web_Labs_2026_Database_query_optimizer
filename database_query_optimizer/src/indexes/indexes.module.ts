import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IndexesController } from './indexes.controller';
import { IndexesService } from './indexes.service';
import { MinioService } from './minio.service';
import { DatabaseIndex } from './entities/database-index.entity';
import { IndexLike } from './entities/index-like.entity';
import { User } from '../users/entities/user.entity';
import { AuthModule } from '../auth/auth.module';
import { SessionModule } from '../session/session.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([DatabaseIndex, IndexLike, User]),
    AuthModule,
    SessionModule,
  ],
  controllers: [IndexesController],
  providers: [IndexesService, MinioService],
  exports: [IndexesService, MinioService],
})
export class IndexesModule {}
