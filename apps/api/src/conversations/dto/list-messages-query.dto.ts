import { IsDateString, IsOptional, IsString, MaxLength } from 'class-validator';

export class ListMessagesQueryDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  search?: string;

  @IsOptional()
  @IsDateString()
  from?: string;

  @IsOptional()
  @IsDateString()
  to?: string;
}
