import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

/**
 * Acota el pool de conexiones de Prisma.
 *
 * La DB de dev es un pooler de Supabase en modo sesión con un tope de ~15
 * clientes, compartido entre ramas. Prisma, por defecto, abre `CPUs*2+1`
 * conexiones (fácil 17+ en una notebook), así que una sola instancia puede
 * agotar el pooler ("max clients reached in session mode"). Limitamos el pool
 * a un número chico y dejamos margen para otros clientes (Studio, migraciones).
 */
function buildDatasourceUrl(): string | undefined {
  const raw = process.env.DATABASE_URL;
  if (!raw) {
    return undefined;
  }

  const limit = Number(process.env.DATABASE_CONNECTION_LIMIT ?? '5');
  const poolTimeout = Number(process.env.DATABASE_POOL_TIMEOUT ?? '20');

  try {
    const url = new URL(raw);
    // No pisar lo que ya venga seteado en el .env.
    if (!url.searchParams.has('connection_limit') && Number.isFinite(limit) && limit > 0) {
      url.searchParams.set('connection_limit', String(limit));
    }
    if (!url.searchParams.has('pool_timeout') && Number.isFinite(poolTimeout) && poolTimeout > 0) {
      url.searchParams.set('pool_timeout', String(poolTimeout));
    }
    return url.toString();
  } catch {
    // Si la URL no parsea, se usa tal cual.
    return raw;
  }
}

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    const url = buildDatasourceUrl();
    super(url ? { datasourceUrl: url } : undefined);
  }

  async onModuleInit() {
    if (!process.env.DATABASE_URL) {
      this.logger.error('DATABASE_URL no está configurada. La API iniciará sin conexión a la base de datos.');
      return;
    }

    try {
      await this.$connect();
    } catch (error) {
      // No tirar abajo el proceso si la DB está caída al arrancar: Prisma
      // reconecta de forma lazy en la primera consulta cuando vuelva a estar.
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(
        `No se pudo conectar a la base de datos al iniciar (${message}). La API queda arriba y reintentará por consulta.`,
      );
    }
  }

  async onModuleDestroy() {
    // Libera las conexiones del pooler al apagar/recargar (nest --watch), para
    // no dejar clientes colgados que agoten el tope del pooler de Supabase.
    try {
      await this.$disconnect();
    } catch {
      // Si ya estaba desconectado, no pasa nada.
    }
  }
}
