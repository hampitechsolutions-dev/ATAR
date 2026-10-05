import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { BillingAdminController } from './billing-admin.controller';
import { BillingMeController } from './billing-me.controller';
import { BillingPaymentsService } from './billing-payments.service';
import { BillingSettlementsService } from './billing-settlements.service';
import { BillingService } from './billing.service';

@Module({
  imports: [PrismaModule],
  controllers: [BillingAdminController, BillingMeController],
  providers: [BillingService, BillingSettlementsService, BillingPaymentsService],
  exports: [BillingService, BillingSettlementsService, BillingPaymentsService],
})
export class BillingModule {}
