import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import type { AuthUser } from '../auth/auth-user.interface';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminService } from './admin.service';

// Analítica de plataforma para administradores de ATAR. El rol se valida en el
// servicio (isPlatformAdmin) en cada endpoint.
@UseGuards(JwtAuthGuard)
@Controller('admin')
export class AdminController {
  constructor(private readonly admin: AdminService) {}

  /** Ranking de proveedoras por comisión generada (mayor a menor). */
  @Get('suppliers')
  suppliers(@CurrentUser() user: AuthUser) {
    return this.admin.supplierRanking(user);
  }

  /** Detalle + transacciones de una proveedora. */
  @Get('suppliers/:companyId')
  supplierDetail(@CurrentUser() user: AuthUser, @Param('companyId') companyId: string) {
    return this.admin.supplierDetail(user, companyId);
  }

  /** Ranking de compradoras por volumen de compra. */
  @Get('buyers')
  buyers(@CurrentUser() user: AuthUser) {
    return this.admin.buyerRanking(user);
  }

  /** Detalle + operaciones de una compradora. */
  @Get('buyers/:companyId')
  buyerDetail(@CurrentUser() user: AuthUser, @Param('companyId') companyId: string) {
    return this.admin.buyerDetail(user, companyId);
  }
}
