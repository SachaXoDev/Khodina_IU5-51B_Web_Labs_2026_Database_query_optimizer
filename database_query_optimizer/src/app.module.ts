import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { IndexesModule } from './indexes/indexes.module';
import { UsersModule } from './users/users.module';
import { DatabaseIndex } from './indexes/entities/database-index.entity';
import { IndexLike } from './indexes/entities/index-like.entity';
import { User } from './users/entities/user.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '../.env'],
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get<string>('DB_HOST', 'localhost'),
        port: parseInt(config.get<string>('DB_PORT', '5435'), 10),
        username: config.get<string>('DB_USERNAME', 'postgres'),
        password: config.get<string>('DB_PASSWORD', 'postgrespassword'),
        database: config.get<string>('DB_DATABASE', 'database_optimizer_db'),
        entities: [DatabaseIndex, IndexLike, User],
        synchronize: config.get<string>('DB_SYNCHRONIZE', 'true') === 'true',
        logging: config.get<string>('DB_LOGGING', 'false') === 'true',
      }),
    }),
    IndexesModule,
    UsersModule,
  ],
})
export class AppModule {}
