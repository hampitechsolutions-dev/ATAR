import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { BillingAdminController } from './billing-admin.controller';
import { BillingSettlementsService } from './billing-settlements.service';
import { BillingService } from './billing.service';

@Module({
  imports: [PrismaModule],
  controllers: [BillingAdminController],
  providers: [BillingService, BillingSettlementsService],
  exports: [BillingService, BillingSettlementsService],
})
export class BillingModule {}
