import { IsString, MaxLength, MinLength } from 'class-validator';

export class RejectPaymentDto {
  @IsString()
  @MinLength(3)
  @MaxLength(400)
  reason!: string;
}
