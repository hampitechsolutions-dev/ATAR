import { Module } from '@nestjs/common';
import { NotificationsModule } from '../notifications/notifications.module';
import { PrismaModule } from '../prisma/prisma.module';
import { BillingAdminController } from './billing-admin.controller';
import { BillingMeController } from './billing-me.controller';
import { BillingPaymentsService } from './billing-payments.service';
import { BillingReportsService } from './billing-reports.service';
import { BillingSettlementsService } from './billing-settlements.service';
import { BillingService } from './billing.service';

@Module({
  imports: [PrismaModule, NotificationsModule],
  controllers: [BillingAdminController, BillingMeController],
  providers: [
    BillingService,
    BillingSettlementsService,
    BillingPaymentsService,
    BillingReportsService,
  ],
  exports: [
    BillingService,
    BillingSettlementsService,
    BillingPaymentsService,
    BillingReportsService,
  ],
})
export class BillingModule {}
