import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../users/entities/user.entity';
import { SessionModule } from '../session/session.module';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { SessionGuard } from './guards/session.guard';
import { OptionalSessionGuard } from './guards/optional-session.guard';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    SessionModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, SessionGuard, OptionalSessionGuard],
  exports: [AuthService, SessionGuard, OptionalSessionGuard],
})
export class AuthModule {}
