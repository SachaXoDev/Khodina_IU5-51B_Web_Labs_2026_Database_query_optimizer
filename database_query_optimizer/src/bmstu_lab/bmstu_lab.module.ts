import { Module } from '@nestjs/common';
import { BmstuLabService } from './bmstu_lab.service.js';
import { BmstuLabController } from './bmstu_lab.controller.js';

@Module({
  controllers: [BmstuLabController], // Здесь указываем контроллеры, которые будут частью модуля
  providers: [BmstuLabService] // Здесь указываем сервисы (провайдеры), доступные в модуле
})
export class BmstuLabModule {}
