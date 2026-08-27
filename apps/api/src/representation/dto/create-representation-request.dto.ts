import { IsOptional, IsString, MaxLength } from 'class-validator';

/** El vendedor se ofrece a representar a una empresa proveedora. */
export class CreateRepresentationRequestDto {
  @IsString()
  companyId!: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  message?: string;
}
