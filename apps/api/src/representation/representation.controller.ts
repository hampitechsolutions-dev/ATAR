import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import type { AuthUser } from '../auth/auth-user.interface';
import { ActiveCompanyId } from '../auth/decorators/active-company.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateRepresentationInvitationDto } from './dto/create-representation-invitation.dto';
import { CreateRepresentationRequestDto } from './dto/create-representation-request.dto';
import { RepresentationService } from './representation.service';

/**
 * Vinculos vendedor <-> empresa proveedora.
 *
 * `/seller` es la mirada del vendedor (su perfil) y `/company` la de la
 * empresa activa (su equipo). Las acciones sobre un pedido son las mismas para
 * los dos lados: cada uno responde lo que le mandaron y retira lo que envio.
 */
@UseGuards(JwtAuthGuard)
@Controller('representation')
export class RepresentationController {
  constructor(private readonly representationService: RepresentationService) {}

  @Get('seller')
  sellerInbox(@CurrentUser() user: AuthUser) {
    return this.representationService.sellerInbox(user);
  }

  @Get('company')
  companyInbox(@CurrentUser() user: AuthUser, @ActiveCompanyId() activeCompanyId?: string) {
    return this.representationService.companyInbox(user, activeCompanyId);
  }

  /** Empresas que el vendedor todavia puede pedir representar. */
  @Get('companies')
  availableCompanies(@CurrentUser() user: AuthUser, @Query('search') search?: string) {
    return this.representationService.listAvailableCompanies(user, search);
  }

  /** Vendedores registrados a los que la empresa activa puede invitar. */
  @Get('sellers')
  searchSellers(
    @CurrentUser() user: AuthUser,
    @Query('search') search: string,
    @ActiveCompanyId() activeCompanyId?: string,
  ) {
    return this.representationService.searchSellers(user, search, activeCompanyId);
  }

  /** El vendedor se ofrece a representar a una empresa. */
  @Post('requests')
  requestRepresentation(
    @CurrentUser() user: AuthUser,
    @Body() dto: CreateRepresentationRequestDto,
  ) {
    return this.representationService.requestRepresentation(user, dto);
  }

  /** La empresa invita a un vendedor. */
  @Post('invitations')
  inviteSeller(
    @CurrentUser() user: AuthUser,
    @Body() dto: CreateRepresentationInvitationDto,
    @ActiveCompanyId() activeCompanyId?: string,
  ) {
    return this.representationService.inviteSeller(user, dto, activeCompanyId);
  }

  @Post('requests/:id/accept')
  accept(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.representationService.accept(user, id);
  }

  @Post('requests/:id/reject')
  reject(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.representationService.reject(user, id);
  }

  @Post('requests/:id/cancel')
  cancel(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.representationService.cancel(user, id);
  }
}
