import { IsString, MinLength } from 'class-validator';

export class AwardRequestDto {
  @IsString()
  @MinLength(1)
  quoteId!: string;
}
