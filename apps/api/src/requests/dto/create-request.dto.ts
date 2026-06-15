import { RequestStatus } from '@prisma/client';
import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class CreateRequestDto {
  @IsString()
  @MinLength(3)
  @MaxLength(120)
  title!: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  productName?: string;

  @IsString()
  @MinLength(10)
  @MaxLength(2000)
  description!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(80)
  category!: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  quantityRequested?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  referenceUnitPrice?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  estimatedTotalCost?: number;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  preferredSupplierName?: string;

  @IsOptional()
  @IsBoolean()
  privateRequest?: boolean;

  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @IsOptional()
  @IsEnum(RequestStatus)
  status?: RequestStatus;
}
