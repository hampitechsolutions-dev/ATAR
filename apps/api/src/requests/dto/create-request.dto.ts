import { RequestStatus } from '@prisma/client';
import {
  ArrayMaxSize,
  IsArray,
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

  // IDs de las empresas proveedoras a las que se dirige la solicitud. Cuando
  // viene con elementos y la solicitud se publica, se les envia una
  // notificacion (dashboard + push si dieron opt-in).
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @MaxLength(64, { each: true })
  @ArrayMaxSize(50)
  targetSupplierCompanyIds?: string[];

  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @IsOptional()
  @IsEnum(RequestStatus)
  status?: RequestStatus;
}
