import { Module } from '@nestjs/common';
import { NotificationsModule } from '../notifications/notifications.module';
import { PrismaModule } from '../prisma/prisma.module';
import { RepresentationController } from './representation.controller';
import { RepresentationService } from './representation.service';

@Module({
  imports: [PrismaModule, NotificationsModule],
  controllers: [RepresentationController],
  providers: [RepresentationService],
  exports: [RepresentationService],
})
export class RepresentationModule {}
