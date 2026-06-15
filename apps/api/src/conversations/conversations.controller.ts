import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import type { AuthUser } from '../auth/auth-user.interface';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ConversationsService } from './conversations.service';
import { CreateProductConversationDto } from './dto/create-product-conversation.dto';
import { ListConversationsQueryDto } from './dto/list-conversations-query.dto';
import { ListMessagesQueryDto } from './dto/list-messages-query.dto';
import { SendMessageDto } from './dto/send-message.dto';

@UseGuards(JwtAuthGuard)
@Controller('conversations')
export class ConversationsController {
  constructor(private readonly conversationsService: ConversationsService) {}

  @Get()
  list(
    @CurrentUser() user: AuthUser,
    @Query() query: ListConversationsQueryDto,
  ) {
    return this.conversationsService.list(user, query);
  }

  @Post('product')
  getOrCreateByProduct(
    @CurrentUser() user: AuthUser,
    @Body() dto: CreateProductConversationDto,
  ) {
    return this.conversationsService.getOrCreateByProduct(user, dto);
  }

  @Post('quote/:quoteId')
  getOrCreateByQuote(
    @CurrentUser() user: AuthUser,
    @Param('quoteId') quoteId: string,
  ) {
    return this.conversationsService.getOrCreateByQuote(user, quoteId);
  }

  @Get(':id')
  findOne(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Query() query: ListMessagesQueryDto,
  ) {
    return this.conversationsService.findOne(user, id, query);
  }

  @Post(':id/messages')
  sendMessage(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: SendMessageDto,
  ) {
    return this.conversationsService.sendMessage(user, id, dto);
  }

  @Post(':id/read')
  markAsRead(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
  ) {
    return this.conversationsService.markAsRead(user, id);
  }
}
