import { IsOptional, IsString, MaxLength, ValidateIf } from 'class-validator';

export class AssignRequestDto {
  // `null` o vacio desasigna la solicitud y la devuelve a "sin asignar".
  @ValidateIf((_object, value) => value !== null)
  @IsOptional()
  @IsString()
  sellerUserId?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}
