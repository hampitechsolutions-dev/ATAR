import { IsString, MaxLength } from 'class-validator';

export class RemovePushEndpointDto {
  @IsString()
  @MaxLength(5000)
  endpoint!: string;
}
