import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import type { AuthUser } from '../auth/auth-user.interface';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ListNotificationsQueryDto } from './dto/list-notifications-query.dto';
import { RegisterPushEndpointDto } from './dto/register-push-endpoint.dto';
import { RemovePushEndpointDto } from './dto/remove-push-endpoint.dto';
import { NotificationsService } from './notifications.service';

@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  list(
    @CurrentUser() user: AuthUser,
    @Query() query: ListNotificationsQueryDto,
  ) {
    return this.notificationsService.list(user, query);
  }

  @Get('push/config')
  getPushConfig() {
    return this.notificationsService.getPushConfig();
  }

  @Post('push/register')
  registerPushEndpoint(
    @CurrentUser() user: AuthUser,
    @Body() dto: RegisterPushEndpointDto,
  ) {
    return this.notificationsService.registerPushEndpoint(user, dto);
  }

  @Post('push/remove')
  removePushEndpoint(
    @CurrentUser() user: AuthUser,
    @Body() dto: RemovePushEndpointDto,
  ) {
    return this.notificationsService.removePushEndpoint(user, dto.endpoint);
  }

  @Post(':id/read')
  markAsRead(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
  ) {
    return this.notificationsService.markAsRead(user, id);
  }

  @Post('read-all')
  markAllAsRead(@CurrentUser() user: AuthUser) {
    return this.notificationsService.markAllAsRead(user);
  }
}
