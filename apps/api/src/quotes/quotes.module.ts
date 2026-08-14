import { Module } from '@nestjs/common';
import { NotificationsModule } from '../notifications/notifications.module';
import { RequestsModule } from '../requests/requests.module';
import { QuotesController } from './quotes.controller';
import { QuotesService } from './quotes.service';

@Module({
  imports: [NotificationsModule, RequestsModule],
  controllers: [QuotesController],
  providers: [QuotesService],
})
export class QuotesModule {}
