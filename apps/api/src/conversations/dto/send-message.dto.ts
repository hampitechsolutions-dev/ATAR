import { IsBase64, IsInt, IsOptional, IsString, Max, MaxLength, Min, MinLength } from 'class-validator';

export class SendMessageDto {
  @IsOptional()
  @IsString()
  @MaxLength(4000)
  body?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(180)
  attachmentName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  attachmentMimeType?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(10 * 1024 * 1024)
  attachmentSize?: number;

  @IsOptional()
  @IsBase64()
  attachmentBase64?: string;
}
