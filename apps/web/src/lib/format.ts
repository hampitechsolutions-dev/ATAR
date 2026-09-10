// Formateo de moneda compartido. Respeta la moneda de la cotización
// (ARS/USD) en lugar de forzar ARS: ATAR opera en un país bimonetario.
export function formatCurrency(value: number | null | undefined, currency = 'ARS'): string {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return 'A consultar';
  }
  try {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: currency || 'ARS',
      maximumFractionDigits: 0,
    }).format(value);
  } catch {
    // Moneda inválida: formatea como número y antepone el código.
    return `${currency || 'ARS'} ${new Intl.NumberFormat('es-AR', { maximumFractionDigits: 0 }).format(value)}`;
  }
}
