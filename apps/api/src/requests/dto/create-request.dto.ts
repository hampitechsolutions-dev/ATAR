import { RequestStatus } from '@prisma/client';
import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateRequestDto {
  @IsString()
  @MinLength(3)
  @MaxLength(120)
  title!: string;

  @IsString()
  @MinLength(10)
  @MaxLength(2000)
  description!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(80)
  category!: string;

  @IsOptional()
  @IsBoolean()
  privateRequest?: boolean;

  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @IsOptional()
  @IsEnum(RequestStatus)
  status?: RequestStatus;
}
