import { IsEmail, IsOptional, IsString, MaxLength, ValidateIf } from 'class-validator';

/**
 * La empresa invita a un vendedor a representarla.
 *
 * Se lo identifica por id (cuando salio del buscador de vendedores) o por
 * email (cuando el gerente lo escribe a mano).
 */
export class CreateRepresentationInvitationDto {
  @ValidateIf((dto: CreateRepresentationInvitationDto) => !dto.email)
  @IsString()
  sellerUserId?: string;

  @ValidateIf((dto: CreateRepresentationInvitationDto) => !dto.sellerUserId)
  @IsEmail({}, { message: 'Indica el email del vendedor que queres invitar.' })
  email?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  message?: string;
}
