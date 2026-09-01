import { RequestStatus } from '@prisma/client';
import { Type } from 'class-transformer';
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
  ValidateNested,
} from 'class-validator';

// Un producto de la solicitud. Una solicitud puede pedir varios.
export class RequestItemInputDto {
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  productName!: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  category?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  quantity?: number;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  unit?: string;

  @IsOptional()
  @IsString()
  @MaxLength(4000)
  specifications?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  referenceUnitPrice?: number;
}

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

  // Productos de la solicitud (multi-producto). Si no viene, el backend
  // sintetiza una unica linea con los campos legacy (productName/category/etc).
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RequestItemInputDto)
  @ArrayMaxSize(50)
  items?: RequestItemInputDto[];
}
