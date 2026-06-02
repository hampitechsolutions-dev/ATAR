import { IsEnum, IsISO8601, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { OrderFulfillmentStatus } from '@prisma/client';

export class UpsertOrderDto {
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(64)
  orderNumber?: string;

  @IsOptional()
  @IsISO8601()
  promisedDate?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;

  @IsOptional()
  @IsEnum(OrderFulfillmentStatus)
  fulfillmentStatus?: OrderFulfillmentStatus;
}
