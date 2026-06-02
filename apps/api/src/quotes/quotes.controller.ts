import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import type { AuthUser } from '../auth/auth-user.interface';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateQuoteDto } from './dto/create-quote.dto';
import { QuotesService } from './quotes.service';

@UseGuards(JwtAuthGuard)
@Controller('quotes')
export class QuotesController {
  constructor(private readonly quotesService: QuotesService) {}

  @Post('request/:requestId')
  create(
    @CurrentUser() user: AuthUser,
    @Param('requestId') requestId: string,
    @Body() dto: CreateQuoteDto,
  ) {
    return this.quotesService.create(user, requestId, dto);
  }

  @Get('mine')
  findMine(@CurrentUser() user: AuthUser) {
    return this.quotesService.findMine(user);
  }
}
