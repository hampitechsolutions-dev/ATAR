export const product = {
  name: 'ATAR',
  tagline: 'La plataforma que ayuda a unir a la industria y al vendedor humano con mas clientes.',
  surfaces: ['web', 'mobile', 'api'] as const,
};

export type PlatformSurface = (typeof product.surfaces)[number];

export const coreModules = [
  'mercado-industrial',
  'cotizaciones',
  'crm',
  'vendedores',
  'reputacion',
] as const;
