import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import type { AuthUser } from '../auth/auth-user.interface';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { BillingPaymentsService } from './billing-payments.service';
import { RegisterPaymentDto } from './dto/register-payment.dto';

// Billing de la empresa: cada empresa ve y paga SOLO lo suyo (scope por
// membresía, validado en el servicio).
@UseGuards(JwtAuthGuard)
@Controller('billing/me')
export class BillingMeController {
  constructor(private readonly payments: BillingPaymentsService) {}

  @Get('settlements')
  listMine(@CurrentUser() user: AuthUser) {
    return this.payments.listMine(user);
  }

  @Get('settlements/:id')
  getMine(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.payments.getMine(user, id);
  }

  /** Registra un pago (transferencia manual). Queda pendiente de validación. */
  @Post('settlements/:id/pay')
  pay(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: RegisterPaymentDto,
  ) {
    return this.payments.registerManualPayment(user, id, dto);
  }

  /** Comprobante propio (para re-verlo). */
  @Get('payments/:id/receipt')
  paymentReceipt(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.payments.getReceipt(user, id);
  }
}
