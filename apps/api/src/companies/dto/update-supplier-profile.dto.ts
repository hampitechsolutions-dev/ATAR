import { SupplierRole } from '@prisma/client';
import {
  ArrayMaxSize,
  IsArray,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

/**
 * Ficha publica de la proveedora, editable por su gerente.
 *
 * Todo es opcional: la ficha muestra solo lo que este cargado. No hay telefono
 * ni mail a proposito, el contacto va por el chat interno de la plataforma.
 * `isVerified` no esta aca: lo define ATAR, no la empresa sobre si misma.
 */
export class UpdateSupplierProfileDto {
  @IsOptional()
  @IsString()
  @MaxLength(40)
  genericCode?: string;

  /** Rol comercial: fabricante, distribuidor, integrador o representante. */
  @IsOptional()
  @IsEnum(SupplierRole)
  supplierRole?: SupplierRole;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(365)
  leadTimeDays?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  minimumOrder?: number;

  @IsOptional()
  @IsString()
  @MaxLength(1200)
  about?: string;

  @IsOptional()
  @IsInt()
  @Min(1800)
  @Max(2100)
  foundedYear?: number;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  employeeRange?: string;

  @IsOptional()
  @IsString()
  @MaxLength(400)
  logisticsSummary?: string;

  @IsOptional()
  @IsString()
  @MaxLength(400)
  financingSummary?: string;

  /**
   * Ruta (`/logos/x.png`), URL, o data URI con la imagen subida.
   *
   * El cliente redimensiona antes de mandar, asi que en la practica ronda las
   * decenas de KB; el tope deja margen sin habilitar una imagen sin comprimir.
   */
  @IsOptional()
  @IsString()
  @MaxLength(400_000)
  logoUrl?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ArrayMaxSize(12)
  certifications?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ArrayMaxSize(12)
  mainProducts?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ArrayMaxSize(12)
  capabilities?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ArrayMaxSize(12)
  categories?: string[];
}
