import { Transform } from 'class-transformer';
import { IsIn, IsObject, IsOptional, IsString, MaxLength } from 'class-validator';

export class RegisterPushEndpointDto {
  @IsString()
  @IsIn(['WEB', 'MOBILE_EXPO'])
  channel!: 'WEB' | 'MOBILE_EXPO';

  @IsString()
  @MaxLength(5000)
  endpoint!: string;

  @IsOptional()
  @IsObject()
  payload?: Record<string, unknown>;

  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MaxLength(255)
  userAgent?: string;

  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MaxLength(255)
  deviceName?: string;
}
