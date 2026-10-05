import { Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import type { AuthUser } from '../auth/auth-user.interface';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { BillingSettlementsService } from './billing-settlements.service';

// Operaciones de facturación de ATAR (solo admin; el guard de rol se aplica en
// el servicio con isPlatformAdmin).
@UseGuards(JwtAuthGuard)
@Controller('billing/admin')
export class BillingAdminController {
  constructor(private readonly settlements: BillingSettlementsService) {}

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
}
