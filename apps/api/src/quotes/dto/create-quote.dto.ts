import { Type } from 'class-transformer';
import { QuoteItemAvailability } from '@prisma/client';
import {
  ArrayMaxSize,
  IsArray,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

// Respuesta del vendedor para un producto (RequestItem) de la solicitud:
// precio unitario, disponibilidad y una nota (reemplazo / motivo / consejo).
export class QuoteItemInputDto {
  @IsString()
  @MaxLength(64)
  requestItemId!: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  unitPrice?: number;

  @IsOptional()
  @IsEnum(QuoteItemAvailability)
  availability?: QuoteItemAvailability;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;
}

export class CreateQuoteDto {
  @IsOptional()
  @IsNumber()
  @Min(0)
  amount?: number;

  @IsOptional()
  @IsString()
  @MaxLength(8)
  currency?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  leadTimeDays?: number;

  @IsOptional()
  @IsString()
  @MaxLength(250)
  paymentTerms?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1200)
  technicalComment?: string;

  // Precio por producto. Si viene, el total (amount) se calcula como
  // Σ(cantidad del RequestItem × precioUnitario). Si no, se usa amount (legacy).
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => QuoteItemInputDto)
  @ArrayMaxSize(50)
  items?: QuoteItemInputDto[];
}
