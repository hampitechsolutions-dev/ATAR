import { IsInt, IsNumber, IsOptional, IsString, MaxLength, Min } from 'class-validator';

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
}
