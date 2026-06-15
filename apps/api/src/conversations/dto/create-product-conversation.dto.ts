import { IsString, MaxLength, MinLength } from 'class-validator';

export class CreateProductConversationDto {
  @IsString()
  @MinLength(3)
  @MaxLength(120)
  productName!: string;

  @IsString()
  @MinLength(3)
  @MaxLength(120)
  supplierCompanyName!: string;
}
