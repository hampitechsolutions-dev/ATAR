import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * Empresa con la que el usuario esta trabajando en este momento.
 *
 * El front la manda en el header `x-company-id` cuando el usuario tiene
 * membresias en varias empresas (por ejemplo un vendedor que representa a tres
 * proveedoras). Si no viene, los servicios usan la primera membresia
 * compatible, que es el comportamiento previo.
 */
export const ActiveCompanyId = createParamDecorator(
  (_data: unknown, context: ExecutionContext): string | undefined => {
    const request = context.switchToHttp().getRequest();
    const header = request.headers?.['x-company-id'];
    const value = Array.isArray(header) ? header[0] : header;
    return typeof value === 'string' && value.trim() ? value.trim() : undefined;
  },
);
