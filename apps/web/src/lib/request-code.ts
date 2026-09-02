// Código público de una solicitud para mostrar al usuario.
//
// No exponemos el id interno (cuid) en la UI: en su lugar derivamos un código
// corto, estable e intuitivo tipo "SOL-482913". Es determinístico (siempre el
// mismo para el mismo id) y no revela el identificador real.
export function formatRequestCode(id?: string | null): string {
  if (!id) {
    return 'SOL-000000';
  }
  let hash = 0;
  for (let i = 0; i < id.length; i += 1) {
    hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  }
  const number = (hash % 1_000_000).toString().padStart(6, '0');
  return `SOL-${number}`;
}
