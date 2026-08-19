import { IsEmail, IsEnum, IsOptional, IsString, MinLength, ValidateIf } from 'class-validator';
import { CompanyType, MembershipRole } from '@prisma/client';

export class RegisterDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(8)
  password!: string;

  @IsString()
  firstName!: string;

  @IsString()
  lastName!: string;

  // El vendedor se suma a una empresa que ya existe, asi que no crea una nueva.
  @ValidateIf((dto: RegisterDto) => dto.role !== MembershipRole.SELLER)
  @IsString()
  companyName!: string;

  @ValidateIf((dto: RegisterDto) => dto.role !== MembershipRole.SELLER)
  @IsEnum(CompanyType)
  companyType!: CompanyType;

  /** Empresa a la que se suma el vendedor. */
  @ValidateIf((dto: RegisterDto) => dto.role === MembershipRole.SELLER)
  @IsString()
  companyId?: string;

  @IsEnum(MembershipRole)
  role!: MembershipRole;

  @IsOptional()
  @IsString()
  city?: string;
}
