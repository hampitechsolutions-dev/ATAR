import { IsISO8601, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class UpsertOrderDto {
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(64)
  orderNumber?: string;

  @IsOptional()
  @IsISO8601()
  promisedDate?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;

  // fulfillmentStatus se removio a proposito: el avance del cumplimiento es
  // responsabilidad exclusiva del proveedor (updateFulfillment, maquina de
  // estados lineal). El comprador solo edita datos operativos de la orden.
}
