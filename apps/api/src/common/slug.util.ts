/**
 * Slug de una empresa para la URL de su ficha.
 *
 * Vive aca porque lo necesitan dos lados: el directorio publico, que arma los
 * links, y la ficha propia, que muestra "Ver mi ficha". Si cada uno tuviera su
 * copia, un cambio en una dejaria links rotos en la otra.
 */
export function slugifyCompanyName(value: string) {
  return value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
