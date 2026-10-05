import { IsNumber, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class RegisterPaymentDto {
  @IsNumber()
  @Min(0.01)
  amount!: number;

  @IsOptional()
  @IsString()
  @MaxLength(600)
  receiptUrl?: string;

  @IsOptional()
  @IsString()
  @MaxLength(400)
  note?: string;
}
