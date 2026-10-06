import {
  IsBase64,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class RegisterPaymentDto {
  @IsNumber()
  @Min(0.01)
  amount!: number;

  // Comprobante de pago OBLIGATORIO (se adjunta como archivo, igual que el chat).
  @IsString()
  @MinLength(1)
  @MaxLength(180)
  receiptName!: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  receiptMimeType?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(10 * 1024 * 1024)
  receiptSize?: number;

  @IsBase64()
  receiptBase64!: string;

  @IsOptional()
  @IsString()
  @MaxLength(400)
  note?: string;
}
