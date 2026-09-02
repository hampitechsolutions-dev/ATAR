import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import type { AuthUser } from '../auth/auth-user.interface';
import { ActiveCompanyId } from '../auth/decorators/active-company.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AssignmentsService } from './assignments.service';
import { AssignRequestDto } from './dto/assign-request.dto';
import { AwardRequestDto } from './dto/award-request.dto';
import { CreateRequestDto } from './dto/create-request.dto';
import { InboxQueryDto } from './dto/inbox-query.dto';
import { ProgressRequestDto } from './dto/progress-request.dto';
import { UpdateFulfillmentDto } from './dto/update-fulfillment.dto';
import { UpsertOrderDto } from './dto/upsert-order.dto';
import { RequestsService } from './requests.service';

@UseGuards(JwtAuthGuard)
@Controller('requests')
export class RequestsController {
  constructor(
    private readonly requestsService: RequestsService,
    private readonly assignmentsService: AssignmentsService,
  ) {}

  @Post()
  create(
    @CurrentUser() user: AuthUser,
    @Body() dto: CreateRequestDto,
    @ActiveCompanyId() activeCompanyId?: string,
  ) {
    return this.requestsService.create(user, dto, activeCompanyId);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: CreateRequestDto,
    @ActiveCompanyId() activeCompanyId?: string,
  ) {
    return this.requestsService.update(user, id, dto, activeCompanyId);
  }

  @Delete(':id')
  remove(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @ActiveCompanyId() activeCompanyId?: string,
  ) {
    return this.requestsService.remove(user, id, activeCompanyId);
  }

  @Post(':id/award')
  award(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: AwardRequestDto,
    @ActiveCompanyId() activeCompanyId?: string,
  ) {
    return this.requestsService.award(user, id, dto.quoteId, activeCompanyId);
  }

  @Post(':id/progress')
  progress(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: ProgressRequestDto,
    @ActiveCompanyId() activeCompanyId?: string,
  ) {
    return this.requestsService.progress(user, id, dto.action, activeCompanyId);
  }

  @Post(':id/order')
  upsertOrder(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: UpsertOrderDto,
    @ActiveCompanyId() activeCompanyId?: string,
  ) {
    return this.requestsService.upsertOrder(user, id, dto, activeCompanyId);
  }

  @Post(':id/order/fulfillment')
  updateFulfillment(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: UpdateFulfillmentDto,
    @ActiveCompanyId() activeCompanyId?: string,
  ) {
    return this.requestsService.updateFulfillment(user, id, dto.action, activeCompanyId);
  }

  @Get('mine')
  findMine(@CurrentUser() user: AuthUser, @ActiveCompanyId() activeCompanyId?: string) {
    return this.requestsService.findMine(user, activeCompanyId);
  }

  @Get('open')
  findOpen(@CurrentUser() user: AuthUser, @ActiveCompanyId() activeCompanyId?: string) {
    return this.requestsService.findOpen(user, activeCompanyId);
  }

  /** Bandeja comercial del proveedor: oportunidades con estado y vendedor. */
  @Get('inbox')
  inbox(
    @CurrentUser() user: AuthUser,
    @Query() query: InboxQueryDto,
    @ActiveCompanyId() activeCompanyId?: string,
  ) {
    return this.assignmentsService.inbox(user, query, activeCompanyId);
  }

  @Get(':id/assignment')
  findAssignment(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @ActiveCompanyId() activeCompanyId?: string,
  ) {
    return this.assignmentsService.findOne(user, id, activeCompanyId);
  }

  /** Asignar o reasignar la oportunidad a un vendedor (solo gerente). */
  @Post(':id/assign')
  assign(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: AssignRequestDto,
    @ActiveCompanyId() activeCompanyId?: string,
  ) {
    return this.assignmentsService.assign(user, id, dto, activeCompanyId);
  }

  @Get(':id/quotes')
  findQuotes(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @ActiveCompanyId() activeCompanyId?: string,
  ) {
    return this.requestsService.findQuotes(user, id, activeCompanyId);
  }

  @Get(':id')
  findOne(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @ActiveCompanyId() activeCompanyId?: string,
  ) {
    return this.requestsService.findOne(user, id, activeCompanyId);
  }
}
