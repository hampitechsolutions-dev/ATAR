import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import { BillingPaymentStatus, SettlementStatus } from '@prisma/client';
import type { Response } from 'express';
import type { AuthUser } from '../auth/auth-user.interface';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { BillingPaymentsService } from './billing-payments.service';
import { BillingReportsService } from './billing-reports.service';
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
    private readonly reports: BillingReportsService,
  ) {}

  // ---- Períodos / liquidaciones ----

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

  /** Corre los recordatorios de vencimiento (por vencer / vencida). Idempotente. */
  @Post('reminders/run')
  runReminders(@CurrentUser() user: AuthUser) {
    return this.settlements.runDueReminders(user);
  }

  // ---- Reportes ----

  /** KPIs de cobranza por moneda (facturado / cobrado / pendiente / vencido). */
  @Get('overview')
  overview(@CurrentUser() user: AuthUser) {
    return this.reports.overview(user);
  }

  /** Listado de liquidaciones con filtros opcionales. */
  @Get('settlements')
  listSettlements(
    @CurrentUser() user: AuthUser,
    @Query('period') period?: string,
    @Query('status') status?: SettlementStatus,
    @Query('companyId') companyId?: string,
  ) {
    return this.reports.listSettlements(user, { period, status, companyId });
  }

  /** Reconciliación de un período (esperado vs liquidado vs cobrado + descuadres). */
  @Get('reconciliation/:code')
  reconciliation(@CurrentUser() user: AuthUser, @Param('code') code: string) {
    return this.reports.reconciliation(user, code);
  }

  /** Export CSV de liquidaciones. */
  @Get('export/settlements.csv')
  async exportSettlements(
    @CurrentUser() user: AuthUser,
    @Res({ passthrough: true }) res: Response,
    @Query('period') period?: string,
  ) {
    const csv = await this.reports.settlementsCsv(user, period);
    this.setCsvHeaders(res, `liquidaciones${period ? `-${period}` : ''}.csv`);
    return csv;
  }

  /** Export CSV de comisiones. */
  @Get('export/commissions.csv')
  async exportCommissions(
    @CurrentUser() user: AuthUser,
    @Res({ passthrough: true }) res: Response,
    @Query('period') period?: string,
  ) {
    const csv = await this.reports.commissionsCsv(user, period);
    this.setCsvHeaders(res, `comisiones${period ? `-${period}` : ''}.csv`);
    return csv;
  }

  // ---- Pagos ----

  /** Lista de pagos (opcional ?status=PENDING|CONFIRMED|REJECTED|REFUNDED). */
  @Get('payments')
  listPayments(
    @CurrentUser() user: AuthUser,
    @Query('status') status?: BillingPaymentStatus,
  ) {
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

  private setCsvHeaders(res: Response, filename: string) {
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  }
}
