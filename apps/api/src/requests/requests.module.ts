import { Module } from '@nestjs/common';
import { NotificationsModule } from '../notifications/notifications.module';
import { AssignmentsService } from './assignments.service';
import { RequestsController } from './requests.controller';
import { RequestsService } from './requests.service';

@Module({
  imports: [NotificationsModule],
  controllers: [RequestsController],
  providers: [RequestsService, AssignmentsService],
  exports: [RequestsService, AssignmentsService],
})
export class RequestsModule {}
