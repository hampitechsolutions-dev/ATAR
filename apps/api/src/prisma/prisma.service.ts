import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  private readonly logger = new Logger(PrismaService.name);

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
}
