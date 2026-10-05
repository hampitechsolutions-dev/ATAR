import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { BillingPaymentStatus } from '@prisma/client';
import type { AuthUser } from '../auth/auth-user.interface';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { BillingPaymentsService } from './billing-payments.service';
import { BillingSettlementsService } from './billing-settlements.service';
import { RejectPaymentDto } from './dto/reject-payment.dto';

// Operaciones de facturación de ATAR (solo admin; el guard de rol se aplica en
// el servicio con isPlatformAdmin).
@UseGuards(JwtAuthGuard)
@Controller('billing/admin')
export class BillingAdminController {
  constructor(
    private readonly settlements: BillingSettlementsService,
    private readonly payments: BillingPaymentsService,
  ) {}

  /** Vista previa de lo que se va a cobrar en el período (no persiste). */
  @Get('periods/:code/preview')
  preview(@CurrentUser() user: AuthUser, @Param('code') code: string) {
    return this.settlements.preview(user, code);
  }

  /** Genera (idempotente) las liquidaciones del período. */
  @Post('periods/:code/generate')
  generate(@CurrentUser() user: AuthUser, @Param('code') code: string) {
    return this.settlements.generate(user, code);
  }

  /** Emite las liquidaciones DRAFT del período (las vuelve visibles/cobrables). */
  @Post('periods/:code/issue')
  issue(@CurrentUser() user: AuthUser, @Param('code') code: string) {
    return this.settlements.issue(user, code);
  }

  // ---- Pagos ----

  /** Lista de pagos (opcional ?status=PENDING|CONFIRMED|REJECTED|REFUNDED). */
  @Get('payments')
  listPayments(@CurrentUser() user: AuthUser, @Query('status') status?: BillingPaymentStatus) {
    return this.payments.listPayments(user, status);
  }

  /** Confirma (valida server-side) un pago manual. */
  @Post('payments/:id/confirm')
  confirmPayment(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.payments.confirmPayment(user, id);
  }

  /** Rechaza un pago pendiente. */
  @Post('payments/:id/reject')
  rejectPayment(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: RejectPaymentDto,
  ) {
    return this.payments.rejectPayment(user, id, dto.reason);
  }
}
