import { Controller, Delete, Get, Param, Post, UseGuards } from '@nestjs/common';
import type { AuthUser } from '../auth/auth-user.interface';
import { ActiveCompanyId } from '../auth/decorators/active-company.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CompaniesService } from './companies.service';

@UseGuards(JwtAuthGuard)
@Controller('companies')
export class CompaniesController {
  constructor(private readonly companiesService: CompaniesService) {}

  /** Empresas en las que trabaja el usuario (selector "Trabajando como"). */
  @Get('workspaces')
  listWorkspaces(@CurrentUser() user: AuthUser) {
    return this.companiesService.listWorkspaces(user);
  }

  @Get('team')
  team(@CurrentUser() user: AuthUser, @ActiveCompanyId() activeCompanyId?: string) {
    return this.companiesService.team(user, activeCompanyId);
  }

  @Get('metrics')
  metrics(@CurrentUser() user: AuthUser, @ActiveCompanyId() activeCompanyId?: string) {
    return this.companiesService.metrics(user, activeCompanyId);
  }

  @Post('team/:userId/approve')
  approveTeamMember(
    @CurrentUser() user: AuthUser,
    @Param('userId') memberUserId: string,
    @ActiveCompanyId() activeCompanyId?: string,
  ) {
    return this.companiesService.approveTeamMember(user, memberUserId, activeCompanyId);
  }

  @Delete('team/:userId')
  removeTeamMember(
    @CurrentUser() user: AuthUser,
    @Param('userId') memberUserId: string,
    @ActiveCompanyId() activeCompanyId?: string,
  ) {
    return this.companiesService.removeTeamMember(user, memberUserId, activeCompanyId);
  }

  @Get('customers')
  customers(@CurrentUser() user: AuthUser, @ActiveCompanyId() activeCompanyId?: string) {
    return this.companiesService.customers(user, activeCompanyId);
  }

  @Get('opportunities')
  opportunities(@CurrentUser() user: AuthUser, @ActiveCompanyId() activeCompanyId?: string) {
    return this.companiesService.opportunities(user, activeCompanyId);
  }

  @Get('customers/:buyerCompanyId')
  customerDetail(
    @CurrentUser() user: AuthUser,
    @Param('buyerCompanyId') buyerCompanyId: string,
    @ActiveCompanyId() activeCompanyId?: string,
  ) {
    return this.companiesService.customerDetail(user, buyerCompanyId, activeCompanyId);
  }
}
