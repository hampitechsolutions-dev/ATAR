import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import type { AuthUser } from '../auth/auth-user.interface';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AwardRequestDto } from './dto/award-request.dto';
import { CreateRequestDto } from './dto/create-request.dto';
import { ProgressRequestDto } from './dto/progress-request.dto';
import { UpdateFulfillmentDto } from './dto/update-fulfillment.dto';
import { UpsertOrderDto } from './dto/upsert-order.dto';
import { RequestsService } from './requests.service';

@UseGuards(JwtAuthGuard)
@Controller('requests')
export class RequestsController {
  constructor(private readonly requestsService: RequestsService) {}

  @Post()
  create(
    @CurrentUser() user: AuthUser,
    @Body() dto: CreateRequestDto,
  ) {
    return this.requestsService.create(user, dto);
  }

  @Post(':id/award')
  award(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: AwardRequestDto,
  ) {
    return this.requestsService.award(user, id, dto.quoteId);
  }

  @Post(':id/progress')
  progress(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: ProgressRequestDto,
  ) {
    return this.requestsService.progress(user, id, dto.action);
  }

  @Post(':id/order')
  upsertOrder(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: UpsertOrderDto,
  ) {
    return this.requestsService.upsertOrder(user, id, dto);
  }

  @Post(':id/order/fulfillment')
  updateFulfillment(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: UpdateFulfillmentDto,
  ) {
    return this.requestsService.updateFulfillment(user, id, dto.action);
  }

  @Get('mine')
  findMine(@CurrentUser() user: AuthUser) {
    return this.requestsService.findMine(user);
  }

  @Get('open')
  findOpen(@CurrentUser() user: AuthUser) {
    return this.requestsService.findOpen(user);
  }

  @Get(':id/quotes')
  findQuotes(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
  ) {
    return this.requestsService.findQuotes(user, id);
  }

  @Get(':id')
  findOne(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.requestsService.findOne(user, id);
  }
}
